const productController = require("../controller/admin/productController");
const adminController = require("../controller/admin/adminController");
const upload = require("../middleware/multer");
const { isAdminAuthenticated } = require("../middleware/adminAuth");
const adminBreadcrumbs = require("../middleware/adminBreadcrumbs");
const nocache = require("nocache");
const express = require("express");
const adminRoute = express();

adminRoute.use(nocache());
adminRoute.use(adminBreadcrumbs);

//ejs view engine
adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin");

// login Routes
adminRoute.get("/", adminController.loadLogin);
adminRoute.post("/", adminController.verifyLogin);

//home routes
adminRoute.get("/dashboard", isAdminAuthenticated, adminController.loadHome);

//product management
adminRoute.get("/product-list", isAdminAuthenticated, productController.loadProductList);
adminRoute.get("/add-product", isAdminAuthenticated, productController.loadAddProduct);
adminRoute.post(
  "/add-product",
  isAdminAuthenticated,
  upload.fields([
    { name: "productImage1", maxCount: 1 },
    { name: "productImage2", maxCount: 1 },
    { name: "productImage3", maxCount: 1 },
  ]),
  productController.addProduct,
);
adminRoute.patch(
  "/update-product/:id",
  isAdminAuthenticated,
  upload.fields([
    { name: "productImage1", maxCount: 1 },
    { name: "productImage2", maxCount: 1 },
    { name: "productImage3", maxCount: 1 },
  ]),
  productController.updateProduct,
);

//category management
adminRoute.get("/category-list", isAdminAuthenticated, productController.loadCategoryList);
adminRoute.post("/categories/add", isAdminAuthenticated, upload.single("image"), productController.addCategory);
adminRoute.patch("/category-list/:id", isAdminAuthenticated, upload.single("categoryImage"), productController.updateCategory);

//order management
adminRoute.get("/order-list", isAdminAuthenticated, adminController.loadOrderList);
adminRoute.post("/order-list/update-status", isAdminAuthenticated, adminController.updateOrderStatus);
adminRoute.get("/order-details", isAdminAuthenticated, adminController.loadOrderDeatails);

//user management
adminRoute.get("/allCustomer", isAdminAuthenticated, adminController.loadAllUser);
adminRoute.patch("/allCustomer/:id", isAdminAuthenticated, adminController.updateCustomer);

//admin profile
adminRoute.get("/admin-profile", isAdminAuthenticated, adminController.loadAdmProfile);
adminRoute.post("/logout", isAdminAuthenticated, adminController.adminLogout);

// Catch-all route for undefined paths
adminRoute.get("*", (req, res) => {
  res.redirect("/admin");
});

module.exports = adminRoute;
