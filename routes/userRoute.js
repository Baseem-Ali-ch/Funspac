//controllers
const loginController = require('../controller/loginController')
const userController = require("../controller/userController");
const accountController = require('../controller/accountController')
const breadcrumbs = require("../middleware/breadcrumbs");
const auth = require("../middleware/userAuth");

const express = require("express");
const userRoute = express(); 
const nocache = require('nocache')

// Set view engine and views directory
userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user");

userRoute.use(nocache())
userRoute.use(breadcrumbs);

//main user route
userRoute.get("/", userController.loadHome);
userRoute.get("/home", userController.loadHome);
userRoute.get("/product/:id", userController.loadProduct);
userRoute.get("/product-list", userController.loadProductList);
userRoute.post('/filter-products', userController.filterProduct);

//cart routes
userRoute.get('/cart',userController.loadCart)
userRoute.post('/cart',userController.addToCart)
userRoute.delete('/cart/:productId', auth.isUserAuthenticated, userController.removeFromCart);

// Authenticated routes
userRoute.get("/wishlist", auth.isUserAuthenticated, userController.loadWishlist);
userRoute.post('/wishlist', auth.isUserAuthenticated, userController.addToWishlist);
userRoute.delete('/wishlist/:productId', auth.isUserAuthenticated, userController.removeFromWishlist);


//contact routes
userRoute.get("/contact-us", auth.isUserAuthenticated, userController.loadContact);

//register and login route. login controller
userRoute.get("/register", auth.isUserLogout, loginController.loadRegister); 
userRoute.post("/register",auth.isUserLogout, loginController.insertUser);
userRoute.get("/verify-otp", loginController.loadVerifyOtp);
userRoute.post("/verify-otp", loginController.verifyOTP);
userRoute.get("/resend-otp", loginController.resentOTP);
userRoute.get("/login", auth.isUserLogout, loginController.loadLogin); // Use isUserLogout for logged-out users
userRoute.post("/login",auth.isUserLogout, loginController.verifyLogin);
userRoute.get("/logout", auth.isUserAuthenticated, loginController.userLogout);


//account manage. account controller
userRoute.get("/profile", auth.isUserAuthenticated, accountController.loadProfile);
userRoute.post("/update-profile", auth.isUserAuthenticated, accountController.updateProfile);
userRoute.get('/forget-password', accountController.forgetPassword);
userRoute.post('/forget-password', accountController.verifyForgetPassword);
userRoute.get('/reset-password', accountController.resetPasswordPage);
userRoute.post('/reset-password', accountController.resetPassword);




// Authentication Routes
const authRoute = require("./authRoutes"); // Ensure this path is correct
userRoute.use("/", authRoute);

module.exports = userRoute;
