const express = require("express");
const userController = require("../controller/userController");
const userRoute = express(); // Changed to Router for better practices
const auth = require("../middleware/userAuth");
const breadcrumbs = require("../middleware/breadcrumbs");

// Set view engine and views directory
userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user");

// Apply middleware for specific routes
userRoute.use(breadcrumbs);

// Public Routes - No authentication required
userRoute.get("/", userController.loadHome);
userRoute.get("/home", userController.loadHome);

userRoute.get("/login", auth.isUserLogout, userController.loadLogin); // Use isUserLogout for logged-out users
userRoute.post("/login", userController.verifyLogin);

userRoute.get("/register", auth.isUserLogout, userController.loadRegister); // Use isUserLogout for logged-out users
userRoute.post("/register", userController.insertUser);

userRoute.get("/verify-otp", userController.loadVerifyOtp);
userRoute.post("/verify-otp", userController.verifyOTP);

userRoute.get("/resend-otp", userController.resentOTP); // Changed to GET for resend OTP

// Authenticated Routes
userRoute.get("/wishlist", auth.isUserAuthenticated, userController.loadWishlist);
userRoute.post('/wishlist', auth.isUserAuthenticated, userController.addToWishlist);
userRoute.delete('/wishlist/:productId', auth.isUserAuthenticated, userController.removeFromWishlist);

userRoute.get("/contact-us", auth.isUserAuthenticated, userController.loadContact);

userRoute.get("/profile", auth.isUserAuthenticated, userController.loadProfile);
userRoute.post("/update-profile", auth.isUserAuthenticated, userController.updateProfile);

userRoute.get("/logout", auth.isUserAuthenticated, userController.userLogout); // Logout is protected

// Product Routes
userRoute.get("/product/:id", userController.loadProduct);
userRoute.get("/product-list", userController.loadProductList);

// Filter Products
userRoute.post('/filter-products', userController.filterProduct);

// Authentication Routes
const authRoute = require("./authRoutes"); // Ensure this path is correct
userRoute.use("/", authRoute);

module.exports = userRoute;
