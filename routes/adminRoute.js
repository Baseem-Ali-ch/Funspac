const express = require("express");
const adminController = require("../controller/adminController");
const upload = require("../middleware/multer");
const { isAdminAuthenticated } = require("../middleware/userAuth");
const adminBreadcrumbs = require("../middleware/adminBreadcrumbs");

const adminRoute = express();
adminRoute.use(adminBreadcrumbs);

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin");

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


adminRoute.post(
  "/update-product/:id",
  upload.fields([
    { name: "productImage1", maxCount: 1 },
    { name: "productImage2", maxCount: 1 },
    { name: "productImage3", maxCount: 1 }
  ]),
  adminController.updateProduct
);


adminRoute.get(
  "/category-list",
  isAdminAuthenticated,
  adminController.getCategory
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
adminRoute.post(
  "/categories/edit/:id",
  isAdminAuthenticated,
  adminController.updateCategory
);
adminRoute.patch(
  "/category/:id/status",
  isAdminAuthenticated,
  adminController.changeStatus
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
adminRoute.get("/logout", isAdminAuthenticated, adminController.logout);
adminRoute.get("/admin-profile", isAdminAuthenticated, adminController.loadAdmProfile);


adminRoute.get("*", (req, res) => {
  res.redirect("/admin");
});

module.exports = adminRoute;
