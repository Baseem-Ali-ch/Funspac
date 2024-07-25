const userModel = require("../model/userModel"); // Adjust the path as per your project structure
const bcrypt = require("bcrypt");

const loadLogin = async (req, res) => {
  try {
    return res.render("login");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { "login-email": email, "login-password": password } = req.body;
    const userData = await userModel.findOne({ email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_admin) {
          req.session.admin = userData; // Set admin in session

          return res.redirect("/admin/dashboard");
        } else {
          return res.render("login", {
            message: "Email and Password are incorrect or you are not authorized as admin.",
          }); // Redirect non-admin users back to admin login
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

const loadOrderList = async (req, res) => {
  try {
    const isAdmin = req.session.admin;
    return res.render("order-list", { isAdmin });
  } catch (error) {
    console.log(error);
  }
};

const loadOrderDeatails = async (req, res) => {
  try {
    const isAdmin = req.session.admin;
    return res.render("order-details", { isAdmin });
  } catch (error) {
    console.log(error);
  }
};

const loadAllUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = 10; // Number of users per page
    const skip = (page - 1) * limit; // Number of users to skip

    const userData = await userModel.find().skip(skip).limit(limit); // Fetch paginated user data
    const totalUsers = await userModel.countDocuments(); // Get total number of users
    const totalPages = Math.ceil(totalUsers / limit); // Calculate total pages

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
