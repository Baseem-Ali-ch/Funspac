const userModel = require("../../model/userModel"); // Adjust the path as per your project structure
const bcrypt = require("bcrypt");

//load login page for admin
const loadLogin = async (req, res) => {
  try {
    return res.render("login");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

//verify admin login
const verifyLogin = async (req, res) => {
  try {
    const { "login-email": email, "login-password": password } = req.body;
    const userData = await userModel.findOne({ email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_admin) {
          req.session.admin = userData;

          return res.redirect("/admin/dashboard");
        } else {
          return res.render("login", {
            message: "Email and Password are incorrect or you are not authorized as admin.",
          });
        }
      } else {
        return res.render("login", {
          message: "Email and Password are incorrect or you are not authorized as admin.",
        });
      }
    } else {
      return res.render("login", {
        message: "Email and Password are incorrect or you are not authorized as admin.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

//load admin dashboard
const loadHome = async (req, res) => {
  try {
    const isAdmin = req.session.admin;
    console.log("admin session", isAdmin);
    return res.render("dashboard", { isAdmin });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

//load order list in admin side
const loadOrderList = async (req, res) => {
  try {
    const isAdmin = req.session.admin;
    return res.render("order-list", { isAdmin });
  } catch (error) {
    console.log(error);
  }
};

//load order list in admin side
const loadOrderDeatails = async (req, res) => {
  try {
    const isAdmin = req.session.admin;
    return res.render("order-details", { isAdmin });
  } catch (error) {
    console.log(error);
  }
};

//load all user list in admin side
const loadAllUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const userData = await userModel.find().skip(skip).limit(limit);
    const totalUsers = await userModel.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);
    const isAdmin = req.session.admin;

    return res.render("all-customer", {
      customers: userData,
      isAdmin,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

//admin edit user details
const updateCustomer = async (req, res) => {
  const customerId = req.params.id;
  const { name, email, phone, isListed } = req.body;

  try {
    const updatedCustomer = await userModel.findByIdAndUpdate(customerId, { name, email, phone, isListed }, { new: true, runValidators: true });

    if (!updatedCustomer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, message: "Customer updated successfully", data: updatedCustomer });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

//admin logout
const adminLogout = async (req, res) => {
  try {
    req.session.destroy((error) => {
      if (error) {
        console.error("Failed to destroy session during logout", error);
        return res.redirect("/admin");
      }
      res.clearCookie("connect.sid");
      res.redirect("/admin");
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

//load admin profile
const loadAdmProfile = async (req, res) => {
  try {
    const isAdmin = req.session.admin;
    res.render("admin-profile", { isAdmin });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadLogin,
  verifyLogin,
  loadHome,
  loadOrderList,
  loadOrderDeatails,
  loadAllUser,
  updateCustomer,
  adminLogout,
  loadAdmProfile,
};
