const express = require("express");
const adminController = require("../controller/adminController");
const upload = require("../middleware/multer");
const { isAdminAuthenticated } = require("../middleware/adminAuth");
const adminBreadcrumbs = require("../middleware/adminBreadcrumbs");

const adminRoute = express();

adminRoute.use(adminBreadcrumbs);

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin");

// Admin Routes
adminRoute.get("/", adminController.loadLogin);
adminRoute.post("/", adminController.verifyLogin);

adminRoute.get("/dashboard", isAdminAuthenticated, adminController.loadHome);

adminRoute.get(
  "/add-product",
  isAdminAuthenticated,
  adminController.loadAddProduct
);
adminRoute.post(
  "/add-product",
  isAdminAuthenticated,
  upload.fields([
    { name: "productImage1", maxCount: 1 },
    { name: "productImage2", maxCount: 1 },
    { name: "productImage3", maxCount: 1 },
  ]),
  adminController.addProduct
);

adminRoute.get(
  "/product-list",
  isAdminAuthenticated,
  adminController.loadProductList
);

adminRoute.patch(
  "/update-product/:id",
  isAdminAuthenticated,
  upload.fields([
    { name: "productImage1", maxCount: 1 },
    { name: "productImage2", maxCount: 1 },
    { name: "productImage3", maxCount: 1 }
  ]),
  adminController.updateProduct
);

adminRoute.post(
  "/categories/add",
  isAdminAuthenticated,
  upload.single("image"),
  adminController.addCategory
);

adminRoute.get(
  "/category-list",
  isAdminAuthenticated,
  adminController.loadCategoryList
);
adminRoute.patch(
  '/category-list/:id',
  isAdminAuthenticated,
  upload.single('categoryImage'),
  adminController.updateCategory
);

adminRoute.get(
  "/order-list",
  isAdminAuthenticated,
  adminController.loadOrderList
);
adminRoute.get(
  "/order-details",
  isAdminAuthenticated,
  adminController.loadOrderDeatails
);

adminRoute.get(
  "/allCustomer",
  isAdminAuthenticated,
  adminController.loadAllUser
);
adminRoute.post(
  "/update-customer/:id",
  isAdminAuthenticated,
  adminController.updateCustomer
);
adminRoute.post(
  "/change-status/:id",
  isAdminAuthenticated,
  adminController.changeCustomer
);

adminRoute.post("/logout", isAdminAuthenticated, adminController.adminLogout);
adminRoute.get("/admin-profile", isAdminAuthenticated, adminController.loadAdmProfile);

// Catch-all route for undefined paths
adminRoute.get("*", (req, res) => {
  res.redirect("/admin");
});

module.exports = adminRoute;
