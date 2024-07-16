const userModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const randomstring = require("randomstring");

dotenv.config();

// Function to generate a 6-digit OTP
const generateOTP = () => {
  return randomstring.generate({
    length: 6,
    charset: "numeric",
  });
};

const securePassword = async (password) => {
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    return passwordHash;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "OTP Verification",
    text: `Your OTP for verification is: ${otp}`,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log("Email sent: " + info.response);
        resolve(info.response);
      }
    });
  });
};

const loadRegister = async (req, res) => {
  try {
    res.render("register", { message: null });
  } catch (error) {
    console.log(error);
  }
};

const loadLogin = async (req, res) => {
  try {
    if (req.session.user) {
      const redirectUrl = req.session.redirectUrl || "/home";
      delete req.session.redirectUrl;
      return res.redirect(redirectUrl);
    }
    res.render("login");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const setRedirectUrl = (req, res, next) => {
  if (!req.session.user && req.path !== "/login" && req.path !== "/register") {
    req.session.redirectUrl = req.originalUrl;
  }
  next();
};

const verifyLogin = async (req, res) => {
  try {
    const { "login-email": email, "login-password": password } = req.body;
    const userData = await userModel.findOne({ email });

    if (userData && userData.isListed === true) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_verified) {
          req.session.user = userData; // Set user data in session
          const redirectUrl = req.session.redirectUrl || "/home";
          delete req.session.redirectUrl;
          return res.redirect(redirectUrl);
        } else {
          res.redirect("/register");
        }
      } else {
        res.render("login", { message: "Email and Password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email and Password is incorrect" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

let otpStore = {};

const insertUser = async (req, res) => {
  console.log("insertUser called for email:", req.body.email);
  try {
    const { name, phone, email, password, confirmPassword } = req.body;

    const user = await userModel.findOne({ email: email });
    if (user) {
      return res.render("register", { message: "The email already exists." });
    } else {
      const spassword = await securePassword(password);

      const otp = generateOTP();
      otpStore[email] = {
        otp,
        userData: { name, phone, email, password: spassword },
      };

      await sendOTPEmail(email, otp);

      res.redirect(`/verify-otp?email=${email}`);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadVerifyOtp = async (req, res) => {
  try {
    const { email } = req.query;
    if (!otpStore[email]) {
      res.status(400).send("No OTP found for this email");
      return;
    }

    res.render("verifyOtp", {
      email,
      message: "Enter the OTP sent to your email.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (otpStore[email] && otpStore[email].otp === otp) {
      const userData = new userModel({
        ...otpStore[email].userData,
        is_admin: false,
        is_verified: true,
      });

      const savedUser = await userData.save();
      delete otpStore[email];

      req.session.user = savedUser;
      res.redirect(`/home?email=${email}`);
    } else {
      res.status(400).send("Invalid OTP");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadHome = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    res.render("home", { user });
  } catch (error) {
    console.error("Error rendering home:", error);
    res.status(500).send("Internal Server Error");
  }
};

const resentOTP = async (req, res) => {
  try {
    const { email } = req.query;
    if (!otpStore[email]) {
      res.status(400).send("No OTP found for this email");
      return;
    }

    const newOTP = generateOTP();
    otpStore[email].otp = newOTP;
    await sendOTPEmail(email, newOTP);

    res.status(200).send("OTP resent successfully.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to resend OTP.");
  }
};

const loadWishlist = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    res.render("wishlist", { user });
  } catch (error) {
    console.log(error);
  }
};

const loadContact = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    res.render("contact-us", { user });
  } catch (error) {
    console.log(error);
  }
};

const loadProfile = async (req, res) => {
  try {
    const user = req.session.user || req.user;

    res.render("profile", { user });
  } catch (error) {
    console.log(error);
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.destroy((error) => {
      if (error) {
        console.error("Failed to destroy session during logout", error);
        return res.redirect("/");
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const breadcrumbs = async (req, res) => {
  try {
    res.render("/", { breadcrumbs });
  } catch (error) {
    console.log(error);
  }
};

const Product = require("../model/productModel");
const Category = require("../model/categoryModel");

const loadProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.session.user || req.user;
    const product = await Product.findById(productId).populate(
      "category",
      "title"
    );

    if (!product) {
      return res.status(404).send("Product not found");
    }

    res.render("product", { product, user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const loadProductList = async (req, res) => {
  try {
    const categories = await Category.find({});
    const products = await Product.find({}).populate("category", "title");
    const user = req.session.user || req.user;
    res.render("product-list", { products, categories, user });
  } catch (error) {
    console.log(error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.session.user
      ? req.session.user._id
      : req.user
      ? req.user._id
      : null;

    if (!userId) {
      return res.status(400).send("User not found");
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    req.session.user = updatedUser;

    res.json({
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("Internal Server Error");
  }
};


// const loadForgotPassword = async(req,res) => {
//   try {
//     res.render('forgot-pas')
//   } catch (error) {
//     console.log(error);
//   }
// }

// const crypto = require("crypto");
// const forgotPasswordSubmit = async (req, res) => {
//   const { email } = req.body;
//   try {
//     const user = await userModel.findOne({ email });
//     if (!user) {
//       return res.render("forgot-pas", { message: "Email not found." });
//     }

//     const token = crypto.randomBytes(32).toString("hex");
//     user.resetPasswordToken = token;
//     user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
//     await user.save();

//     const resetLink = `http://${req.headers.host}/reset-password/${token}`;
//     await sendOTPEmail(email, `Click the following link to reset your password: ${resetLink}`);

//     res.render("forgot-pas", { message: "A reset link has been sent to your email." });
//   } catch (error) {
//     console.error("Error in forgotPasswordSubmit:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };


// const loadResetPassword = (req, res) => {
//   const { token } = req.params;
//   res.render("resetPassword", { token });
// };

// const resetPasswordSubmit = async (req, res) => {
//   const { token, password } = req.body;
//   try {
//     const user = await userModel.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.render("resetPassword", { message: "Password reset token is invalid or has expired." });
//     }

//     user.password = await securePassword(password);
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;
//     await user.save();

//     res.redirect("/login");
//   } catch (error) {
//     console.error("Error in resetPasswordSubmit:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };



module.exports = {
  loadHome,
  loadRegister,
  loadLogin,
  loadVerifyOtp,
  insertUser,
  verifyOTP,
  resentOTP,
  loadWishlist,
  loadContact,
  verifyLogin,
  loadProfile,
  userLogout,
  breadcrumbs,
  loadProduct,
  loadProductList,
  setRedirectUrl,
  updateProfile
};
