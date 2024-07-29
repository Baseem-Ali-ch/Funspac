//controllers
const Token = require("../../model/tokenModel");
const Category = require("../../model/categoryModel");
const userModel = require("../../model/userModel");
const Wishlist = require("../../model/wishlistModel");
const Cart = require("../../model/cartModel");

const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//load user profile
// const loadProfile = async (req, res) => {
//   try {
//     const user = req.session.user || req.user;
//     const categories = await Category.find({ isListed: "true" });
//     res.render("profile", { user, categories });
//   } catch (error) {
//     console.log(error);
//   }
// };
const loadProfile = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const userId = user ? user._id : null;
    console.log("user session:", user);

    let wishlistItems = [];
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId }).populate("products.productId");
      wishlistItems = wishlist ? wishlist.products : [];
    }

    let cartItems = [];
    if (userId) {
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      cartItems = cart ? cart.items : [];
    }
    const categories = await Category.find({ isListed: "true" });

    const userDetails = user
      ? {
          fullName: user.name,
          displayName: user.displayName,
          phone: user.phone,
          email: user.email,
        }
      : null;
    console.log("user details", userDetails);
    res.render("account", {
      user: userDetails,
      categories,
      wishlistItems,
      cartItems,
    });
  } catch (error) {
    console.log(error);
  }
};

//user can edit their own
const updateProfile = async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user._id : req.user ? req.user._id : null;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const fullName = req.body.fullName; // Assuming fullName is a single string
    let displayName = req.body.displayName;
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        name: fullName,
        displayName: displayName,
        phone: req.body.phone,
        email: req.body.email,
      },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    req.session.user = updatedUser;
    res.json({
      success: true,
      fullName: updatedUser.name,
      displayName: updatedUser.displayName,
      phone: updatedUser.phone,
      email: updatedUser.email,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//load forget password
const forgetPassword = async (req, res) => {
  try {
    res.render("forgetPassword");
  } catch (error) {
    console.log(error);
  }
};

//load forget password page and send a token to email
const verifyForgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const token = crypto.randomBytes(20).toString("hex");

    await Token.create({ userId: user._id, token, createdAt: Date.now() });

    const resetUrl = `http://localhost:5058/reset-password?token=${token}&id=${user._id}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      text: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Failed to send email" });
      }
      res.json({ success: true, message: "Password reset link sent" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//load reset password page
const resetPasswordPage = async (req, res) => {
  try {
    const { token, id } = req.query;
    const tokenDoc = await Token.findOne({ token, userId: id });

    if (!tokenDoc) {
      return res.status(400).send("Invalid or expired token");
    }

    res.render("resetPassword", { token, userId: id });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//reset the password
const resetPassword = async (req, res) => {
  try {
    const { token, userId, password } = req.body;

    const tokenDoc = await Token.findOne({ token, userId });
    if (!tokenDoc) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userModel.findByIdAndUpdate(userId, { password: hashedPassword });
    await Token.findByIdAndDelete(tokenDoc._id);

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loadProfile,
  updateProfile,
  forgetPassword,
  verifyForgetPassword,
  resetPasswordPage,
  resetPassword,
};
