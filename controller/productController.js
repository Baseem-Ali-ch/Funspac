const Category = require("../model/categoryModel");
const Product = require("../model/productModel");

const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const mongoose = require("mongoose");

const loadProductList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = 10; // Number of products per page
    const skip = (page - 1) * limit; // Number of products to skip

    const isAdmin = req.session.admin;
    const products = await Product.find().populate("category").skip(skip).limit(limit);
    const categories = await Category.find();
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    return res.render("product-list", {
      products,
      categories,
      isAdmin,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error retrieving product list:", error);
    return res.status(500).send("Server Error");
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const isAdmin = req.session.admin;
    const categories = await Category.find({ isListed: "true" });
    return res.render("add-product", { categories, isAdmin });
  } catch (error) {
    console.log(error);
  }
};

const addProduct = async (req, res) => {
  try {
    const { productTitle, productDescription, productPrice, productDiscountedPrice, category: categoryId, isListed, stock } = req.body;

    // Fetch the category details using the provided category ID
    const category = await Category.findById(categoryId);

    if (!category) {
      console.error("Category not found for ID:", categoryId);
      return res.status(404).send("Category not found");
    }

    // Handle multiple images
    let imageUrl_1 = req.files["productImage1"] ? "/assets/images/add-product/" + req.files["productImage1"][0].filename : "";
    let imageUrl_2 = req.files["productImage2"] ? "/assets/images/add-product/" + req.files["productImage2"][0].filename : "";
    let imageUrl_3 = req.files["productImage3"] ? "/assets/images/add-product/" + req.files["productImage3"][0].filename : "";

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
    if (req.files && req.files["productImage1"]) {
      const croppedImageUrl_1 = await cropAndResizeImage(req.files["productImage1"][0].path);
      imageUrl_1 = `/assets/images/add-product/${croppedImageUrl_1}`;
    }
    if (req.files["productImage2"]) {
      const croppedImageUrl_2 = await cropAndResizeImage(req.files["productImage2"][0].path);
      imageUrl_2 = `/assets/images/add-product/${croppedImageUrl_2}`;
    }
    if (req.files["productImage3"]) {
      const croppedImageUrl_3 = await cropAndResizeImage(req.files["productImage3"][0].path);
      imageUrl_3 = `/assets/images/add-product/${croppedImageUrl_3}`;
    }

    // Create new product instance
    const product = new Product({
      name: productTitle,
      description: productDescription,
      price: productPrice,
      discountedPrice: productDiscountedPrice,
      category: category._id, // Store the category ID
      isListed: isListed === "true", // Convert string to boolean
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
          console.error(`Error deleting temp file for ${file.fieldname}:`, error);
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
  const productId = req.params.id;
  const { name, description, category, price, discountPrice, stock, status } = req.body;

  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }

    const product = await Product.findById(productId);

    if (product) {
      // Check if there are any changes
      const changes = [];
      if (product.name !== name) changes.push("name");
      if (product.description !== description) changes.push("description");
      if (product.category.toString() !== category) changes.push("category");
      if (product.price !== price) changes.push("price");
      if (product.stock !== stock) changes.push("stock");
      if (product.isListed !== status) changes.push("status");

      if (changes.length === 0) {
        return res.json({ success: false, message: "No changes detected" });
      }

      // Update the product fields
      product.name = name;
      product.description = description;
      product.category = new mongoose.Types.ObjectId(category);
      product.price = price;
      product.discountedPrice = discountPrice;
      product.stock = stock;
      product.isListed = status;

      if (req.files) {
        if (req.files.productImage1) {
          product.imageUrl_1 = "/assets/images/add-product/" + req.files.productImage1[0].filename;
        }
        if (req.files.productImage2) {
          product.imageUrl_2 = "/assets/images/add-product/" + req.files.productImage2[0].filename;
        }
        if (req.files.productImage3) {
          product.imageUrl_3 = "/assets/images/add-product/" + req.files.productImage3[0].filename;
        }
      }

      await product.save();
      res.json({ success: true, product });
    } else {
      res.json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const loadCategoryList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = 10; // Number of categories per page
    const skip = (page - 1) * limit; // Number of categories to skip

    // Get categories with pagination
    const categories = await Category.find().skip(skip).limit(limit);
    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    const isAdmin = req.session.admin;

    return res.render("category-list", {
      categories: categories,
      isAdmin,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const addCategory = async (req, res) => {
  try {
    const { title, slug, isListed } = req.body;
    const image = req.file ? req.file.filename : null;

    const existingCategory = await Category.findOne({ title });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new Category({
      title,
      slug,
      image,
      isListed: isListed === "true",
    });

    await newCategory.save();
    return res.status(201).json({ message: "Category added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { title, description, status } = req.body; // `status` from form
    const image = req.file ? req.file.filename : null;

    console.log("Update Data:", { title, description, status });

    const updateData = {
      title,
      description,
      isListed: status === "active", // Convert 'active' to true and 'inactive' to false
    };

    if (image) {
      updateData.image = image;
    }

    const updatedCategory = await Category.findByIdAndUpdate(categoryId, updateData, { new: true });

    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  loadProductList,
  loadAddProduct,
  addProduct,
  updateProduct,
  loadCategoryList,
  addCategory,
  updateCategory,
};
