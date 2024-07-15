const userModel = require("../model/userModel"); // Adjust the path as per your project structure
const bcrypt = require("bcrypt");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const Category = require("../model/categoryModel");
const Product = require("../model/productModel");

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
          req.session.user = userData; // Set user in session
          return res.redirect("/admin/dashboard");
        } else {
          return res.render("login", {
            message:
              "Email and Password are incorrect or you are not authorized as admin.",
          }); // Redirect non-admin users back to admin login
        }
      } else {
        return res.render("login", {
          message:
            "Email and Password are incorrect or you are not authorized as admin.",
        });
      }
    } else {
      return res.render("login", {
        message:
          "Email and Password are incorrect or you are not authorized as admin.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const loadHome = async (req, res) => {
  try {
    const user = req.session.user;
    return res.render("dashboard", { user });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const loadProductList = async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    const categories = await Category.find();
    return res.render("product-list", { products, categories });
  } catch (error) {
    console.error("Error retrieving product list:", error);
    return res.status(500).send("Server Error");
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find({});
    return res.render("add-product", { categories });
  } catch (error) {
    console.log(error);
  }
};

const loadCategoryList = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.render("category-list", { categories });
  } catch (error) {
    console.log(error);
  }
};

const loadOrderList = async (req, res) => {
  try {
    return res.render("order-list");
  } catch (error) {
    console.log(error);
  }
};

const loadOrderDeatails = async (req, res) => {
  try {
    return res.render("order-details");
  } catch (error) {
    console.log(error);
  }
};

const addCategory = async (req, res) => {
  try {
    const { title, slug } = req.body;
    const image = req.file ? req.file.filename : null;

    const existingCategory = await Category.findOne({ title });
    if (existingCategory) {
      return res.status(400).send("Category already exists");
    }

    const newCategory = new Category({
      title,
      slug,
      image,
    });

    await newCategory.save();
    return res.redirect("/admin/category-list");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server Error");
  }
};

const getCategory = async (req, res) => {
  try {
    const categories = await Category.find({ isListed: true });
    return res.render("category-list", { categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).send("Server Error");
  }
};

const updateCategory = async (req, res) => {
  try {
    const { title, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    // Check if another category with the same title exists
    const existingCategory = await Category.findOne({ title });
    if (existingCategory && existingCategory._id.toString() !== req.params.id) {
      return res.status(400).send("Category with this title already exists");
    }
    category.title = title;
    category.description = description;
    await category.save();

    return res.json({
      title: category.title,
      description: category.description,
    });
  } catch (error) {
    return res.status(500).send("Server Error");
  }
};

const changeStatus = async (req, res) => {
  const categoryId = req.params.id;
  const { isListed } = req.body;

  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { isListed },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      message: "Listing status updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating listing status:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

const loadAllUser = async (req, res) => {
  try {
    const userData = await userModel.find(); // Fetch all user data from MongoDB
    return res.render("all-customer", { customers: userData });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const updatedCustomer = await userModel.findByIdAndUpdate(
      id,
      {
        name,
        email,
        phone,
        address,
      },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
};

const changeCustomer = async (req, res) => {
  const customerId = req.params.id;
  const { isListed } = req.body;

  try {
    const updatedCustomer = await userModel.findByIdAndUpdate(
      customerId,
      { isListed },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({
      message: "Listing status updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Error updating listing status:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      productTitle,
      productDescription,
      productPrice,
      productDiscountedPrice,
      category: categoryId,
      stock,
    } = req.body;

    // Fetch the category details using the provided category ID
    const category = await Category.findById(categoryId);

    if (!category) {
      console.error("Category not found for ID:", categoryId);
      return res.status(404).send("Category not found");
    }

    // Handle multiple images
    let imageUrl_1 = req.files["productImage1"]
      ? "/assets/images/add-product/" + req.files["productImage1"][0].filename
      : "";
    let imageUrl_2 = req.files["productImage2"]
      ? "/assets/images/add-product/" + req.files["productImage2"][0].filename
      : "";
    let imageUrl_3 = req.files["productImage3"]
      ? "/assets/images/add-product/" + req.files["productImage3"][0].filename
      : "";

    // Function to crop and resize images using sharp
    const cropAndResizeImage = async (imagePath) => {
      const outputFileName = `cropped-${path.basename(imagePath)}`;
      await sharp(imagePath)
        .resize({ width: 300, height: 300 })
        .extract({ width: 300, height: 300, left: 0, top: 0 }) // Use extract for cropping
        .toFile(path.join(path.dirname(imagePath), outputFileName));

      return outputFileName;
    };

    // Crop and resize each image if it exists
    if (req.files["productImage1"]) {
      const croppedImageUrl_1 = await cropAndResizeImage(
        req.files["productImage1"][0].path
      );
      imageUrl_1 = `/assets/images/add-product/${croppedImageUrl_1}`;
    }
    if (req.files["productImage2"]) {
      const croppedImageUrl_2 = await cropAndResizeImage(
        req.files["productImage2"][0].path
      );
      imageUrl_2 = `/assets/images/add-product/${croppedImageUrl_2}`;
    }
    if (req.files["productImage3"]) {
      const croppedImageUrl_3 = await cropAndResizeImage(
        req.files["productImage3"][0].path
      );
      imageUrl_3 = `/assets/images/add-product/${croppedImageUrl_3}`;
    }

    // Create new product instance
    const product = new Product({
      name: productTitle,
      description: productDescription,
      price: productPrice,
      discountedPrice: productDiscountedPrice,
      category: category._id, // Store the category ID
      stock: stock,
      imageUrl_1: imageUrl_1,
      imageUrl_2: imageUrl_2,
      imageUrl_3: imageUrl_3,
    });

    await product.save();

    const cleanUpTempFiles = async (files) => {
      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch (error) {
          console.error(
            `Error deleting temp file for ${file.fieldname}:`,
            error
          );
        }
      }
    };

    cleanUpTempFiles(req.files["productImage1"]);
    cleanUpTempFiles(req.files["productImage2"]);
    cleanUpTempFiles(req.files["productImage3"]);

    return res.redirect("/admin/add-product?success=true");
  } catch (error) {
    console.error("Error adding product:", error);
    return res.status(500).send("Server Error");
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params; // Extract product ID from URL params
  const { name, description, categoryId, price, stock } = req.body; // Extract updated product data

  try {
    // Find product by ID and update its fields
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, description, category: categoryId, price, stock },
      { new: true } // Return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(updatedProduct); // Send updated product as JSON response
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Failed to log out");
    }
    return res.redirect("/admin/login");
  });
};

module.exports = {
  loadLogin,
  verifyLogin,
  loadHome,
  loadProductList,
  loadAddProduct,
  loadCategoryList,
  loadOrderList,
  loadOrderDeatails,

  addCategory,
  getCategory,
  updateCategory,
  changeStatus,
  loadAllUser,
  updateCustomer,
  changeCustomer,
  addProduct,
  updateProduct,
  logout,
};
