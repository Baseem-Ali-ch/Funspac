//controllers
const Token = require("../model/tokenModel");
const Category = require("../model/categoryModel");
const userModel = require("../model/userModel");

const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require('bcrypt')

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const loadProfile = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const categories = await Category.find({ isListed: "true" });
    res.render("profile", { user, categories });
  } catch (error) {
    console.log(error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user._id : req.user ? req.user._id : null;

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
      { new: true },
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

const forgetPassword = async (req, res) => {
  try {
    res.render("forgetPassword");
  } catch (error) {
    console.log(error);
  }
};

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
