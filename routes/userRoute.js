const express = require("express");
const userController = require("../controller/userController");
const userRoute = express();
const auth = require("../middleware/userAuth");
const breadcrumbs = require("../middleware/breadcrumbs");
const passport = require("../config/passport");

userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user");

userRoute.use(["/wishlist", "/contact-us"], userController.setRedirectUrl);
userRoute.use(breadcrumbs);

userRoute.get("/", userController.loadHome);
userRoute.get("/home", userController.loadHome);

userRoute.get("/login", userController.loadLogin);
userRoute.post("/login", userController.verifyLogin);

userRoute.get("/register", userController.loadRegister);
userRoute.post("/register", userController.insertUser);
userRoute.get("/verify-otp", userController.loadVerifyOtp);
userRoute.post("/verify-otp", userController.verifyOTP);
userRoute.get("/resend-otp", userController.resentOTP); // Changed to GET for resend OTP

userRoute.get(
  "/wishlist",
  auth.isLogin,
  
  userController.loadWishlist
);

userRoute.get(
  "/contact-us",
  auth.isLogin,

  userController.loadContact
);

userRoute.get("/profile", auth.isLogin, userController.loadProfile);
userRoute.post("/update-profile", auth.isLogin, userController.updateProfile);
userRoute.get("/logout", auth.isLogin, userController.userLogout);

userRoute.get("/profile", userController.breadcrumbs);

userRoute.get("/product/:id", userController.loadProduct);
userRoute.get("/product-list", userController.loadProductList);


// Add Google authentication routes
const authRoute = require("./authRoutes"); // Update the path if necessary
userRoute.use("/", authRoute);

module.exports = userRoute;
