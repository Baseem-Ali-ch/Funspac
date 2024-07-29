//controllers
const loginController = require("../controller/user/loginController");
const userController = require("../controller/user/userController");
const accountController = require("../controller/user/accountController");
const productController = require("../controller/user/productController");
const orderController = require("../controller/user/orderController");
const breadcrumbs = require("../middleware/breadcrumbs");
const auth = require("../middleware/userAuth");

const express = require("express");
const userRoute = express();
const nocache = require("nocache");

// Set view engine and views directory
userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user");

userRoute.use(nocache());
userRoute.use(breadcrumbs);

//main user route
userRoute.get("/", userController.loadHome);
userRoute.get("/home", userController.loadHome);
userRoute.get("/product/:id", productController.loadProduct);
userRoute.get("/product-list", productController.loadProductList);
userRoute.post("/filter-products", productController.filterProduct);

//cart routes
userRoute.get("/cart", productController.loadCart);
userRoute.post("/cart", productController.addToCart);
userRoute.patch("/cart/:productId", productController.updateCartItemQty);
userRoute.delete("/cart/:productId", auth.isUserAuthenticated, productController.removeFromCart);

// wishlist routes
userRoute.get("/wishlist", auth.isUserAuthenticated, productController.loadWishlist);
userRoute.post("/wishlist", auth.isUserAuthenticated, productController.addToWishlist);
userRoute.delete("/wishlist/:productId", auth.isUserAuthenticated, productController.removeFromWishlist);

//checkout and order routes
userRoute.get("/checkout", auth.isUserAuthenticated, orderController.loadCheckout);
userRoute.post("/checkout", auth.isUserAuthenticated, orderController.insertAddress);

//contact routes
userRoute.get("/contact-us", auth.isUserAuthenticated, userController.loadContact);
userRoute.post("/contact-us", auth.isUserAuthenticated, userController.sendMessage);

//register and login route. login controller
userRoute.get("/register", auth.isUserLogout, loginController.loadRegister);
userRoute.post("/register", auth.isUserLogout, loginController.insertUser);
userRoute.get("/verify-otp", loginController.loadVerifyOtp);
userRoute.post("/verify-otp", loginController.verifyOTP);
userRoute.get("/resend-otp", loginController.resentOTP);
userRoute.get("/login", auth.isUserLogout, loginController.loadLogin); // Use isUserLogout for logged-out users
userRoute.post("/login", auth.isUserLogout, loginController.verifyLogin);
userRoute.get("/logout", auth.isUserAuthenticated, loginController.userLogout);

//account manage. account controller
// userRoute.get("/profile", auth.isUserAuthenticated, accountController.loadProfile);
userRoute.get("/account", auth.isUserAuthenticated, accountController.loadProfile);
userRoute.post("/account", auth.isUserAuthenticated, accountController.updateProfile);
userRoute.get("/forget-password", accountController.forgetPassword);
userRoute.post("/forget-password", accountController.verifyForgetPassword);
userRoute.get("/reset-password", accountController.resetPasswordPage);
userRoute.post("/reset-password", accountController.resetPassword);

// Authentication Routes
const authRoute = require("./authRoutes"); // Ensure this path is correct
userRoute.use("/", authRoute);

module.exports = userRoute;
