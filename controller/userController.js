//controllers
const Wishlist = require("../model/wishlistModel");
const Cart = require("../model/cartModel");
const Product = require('../model/productModel')
const Category = require('../model/categoryModel')

const dotenv = require("dotenv");
dotenv.config();

const breadcrumbs = async (req, res) => {
  try {
    res.render("/", { breadcrumbs });
  } catch (error) {
    console.log(error);
  }
};

const loadHome = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const userId = user ? user._id : null;

    console.log("User ID:", userId);

    let wishlistItems = [];
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId }).populate("products.productId");
      wishlistItems = wishlist ? wishlist.products : [];
    }

    let cartItems = [];
    if (userId) {
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      cartItems = cart ? cart.items : [];
    }

    const products = await Product.find({ isListed: "true" }).limit(6).sort({ createdAt: -1 });
    const categories = await Category.find({ isListed: "true" });
    console.log("Wishlist Items:", wishlistItems);

    res.render("home", {
      user,
      wishlistItems,
      cartItems,
      products,
      categories,
    });
  } catch (error) {
    console.error("Error rendering home:", error);
    res.status(500).send("Internal Server Error");
  }
};

const loadContact = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const userId = user ? user._id : null;

    // Fetch cart, wishlist, and categories
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    const wishlistItems = await Wishlist.findOne({ userId }).populate("products.productId");
    const categories = await Category.find({ isListed: "true" });

    // Handle cases where cart or wishlistItems might be null
    const cartItems = cart && cart.items ? cart.items : [];
    const wishlistItemsList = wishlistItems ? wishlistItems.products : [];

    // Render the contact-us page
    res.render("contact-us", {
      user,
      cartItems,
      wishlistItems: wishlistItemsList,
      categories,
    });
  } catch (error) {
    console.error("Error loading contact page:", error);
    res.status(500).send("Server Error");
  }
};








const loadProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.session.user || req.user;
    const userId = user ? user._id : null;

    const product = await Product.findById(productId).populate("category", "title");
    const categories = await Category.find({ isListed: "true" });
    let wishlistItems = [];
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId }).populate("products.productId");
      wishlistItems = wishlist ? wishlist.products : [];
    }

    let cartItems = [];
    if (userId) {
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      cartItems = cart ? cart.items : [];
    }

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Product List", url: "/product-list" },
      { name: product.name, url: `/product/${product._id}` }, // Use product name here
    ];

    res.render("product", {
      product,
      user,
      wishlistItems,
      cartItems,
      breadcrumbs,
      categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const loadProductList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = 9; // Number of products per page
    const skip = (page - 1) * limit; // Number of products to skip

    // const categories = await Category.find({ isListed: 'true' }).select("_id");
    const listedCategories = await Category.find({ isListed: "true" }).select("_id");

    const categories = await Category.find({ isListed: "true" });

    const products = await Product.find({ isListed: "true" })
      .populate({
        path: "category",
        match: { isListed: "true" },
        select: "title",
      })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments({
      isListed: "true",
      category: { $in: listedCategories.map((cat) => cat._id) },
    });
    const totalPages = Math.ceil(totalProducts / limit);

    const user = req.session.user || req.user;
    const userId = user ? user._id : null;

    let wishlistItems = [];
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId }).populate("products.productId");
      wishlistItems = wishlist ? wishlist.products : [];
    }

    let cartItems = [];
    if (userId) {
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      cartItems = cart ? cart.items : [];
    }

    res.render("product-list", {
      products,
      categories: listedCategories,
      user,
      currentPage: page,
      totalPages,
      wishlistItems,
      cartItems,
      categories,
    });
  } catch (error) {
    console.log(error);
  }
};

const filterProduct = async (req, res) => {
  try {
    const { categories } = req.body;
    const products = await Product.find({
      category: { $in: categories },
    }).populate("category");
    res.json({ products });
  } catch (error) {
    console.error("Error fetching filtered products:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const loadWishlist = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    console.log("User from session:", user); // Debugging line
    const userId = user ? user._id : null;

    if (!userId) {
      return res.status(401).render("login", { message: "Please log in to view your wishlist" });
    }

    const wishlistItems = await Wishlist.findOne({ userId }).populate("products.productId");
    const categories = await Category.find({ isListed: "true" });

    res.render("wishlist", {
      user,
      wishlistItems: wishlistItems ? wishlistItems.products : [], // Handle null wishlistItems
      categories,
    });
  } catch (error) {
    console.error("Error loading wishlist:", error);
    res.status(500).send("Server Error");
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user._id : null;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Please login and continue", error: true });
    }
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required", error: true });
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      const existingProduct = wishlist.products.find((p) => p.productId.equals(productId));
      if (existingProduct) {
        return res.status(400).json({ message: "Item already in wishlist", error: true });
      }
      wishlist.products.push({ productId });
      await wishlist.save();
    } else {
      const newWishlist = new Wishlist({
        userId,
        products: [{ productId }],
      });
      await newWishlist.save();
    }

    res.status(200).json({ message: "Item added to wishlist", error: false });
  } catch (error) {
    console.error("Error adding item to wishlist:", error);
    res.status(500).json({ message: "Error adding item to wishlist", error: true });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user._id : null;
    const { productId } = req.params;

    if (!userId) {
      console.log("User not logged in");
      return res.status(401).json({ message: "User not logged in", error: true });
    }
    if (!productId) {
      console.log("Product ID is required");
      return res.status(400).json({ message: "Product ID is required", error: true });
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      const initialLength = wishlist.products.length;
      wishlist.products = wishlist.products.filter((product) => !product.productId.equals(productId));
      const finalLength = wishlist.products.length;

      if (initialLength === finalLength) {
        console.log("Product ID not found in wishlist");
        return res.status(404).json({ message: "Product not found in wishlist", error: true });
      }

      await wishlist.save();
    }

    console.log("Item removed from wishlist");
    res.status(200).json({ message: "Item removed from wishlist", error: false });
  } catch (error) {
    console.error("Error removing item from wishlist:", error);
    res.status(500).json({ message: "Error removing item from wishlist", error: true });
  }
};

const loadCart = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    console.log("User from session:", user); // Debugging line
    const userId = user ? user._id : null;

    if (!userId) {
      return res.status(401).render("login", { message: "Please log in to view your cart" });
    }

    const wishlistItems = await Wishlist.findOne({ userId }).populate("products.productId");
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || !cart.items) {
      return res.render("cart", { user, cartItems: [], wishlistItems: wishlistItems ? wishlistItems.products : [] });
    }

    res.render("cart", {
      user,
      cartItems: cart.items,
      wishlistItems: wishlistItems ? wishlistItems.products : [],
    });
  } catch (error) {
    console.error("Error loading cart:", error);
    res.status(500).send("Server Error");
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user._id : null;
    const { productId, quantity } = req.body;

    console.log("User ID:", userId); // Log userId
    console.log("Product ID:", productId); // Log productId
    console.log("Quantity:", quantity); // Log quantity

    if (!userId) {
      return res.status(401).json({ message: "Please login and continue", success: false });
    }
    if (!productId || !quantity) {
      return res.status(400).json({ message: "Product ID and quantity are required", success: false });
    }

    const cart = await Cart.findOne({ userId });
    if (cart) {
      const itemIndex = cart.items.findIndex((item) => item.productId.equals(productId));
      if (itemIndex > -1) {
        // Product is already in the cart, update the quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Product is not in the cart, add it
        cart.items.push({ productId, quantity });
      }
      await cart.save();
    } else {
      // Create a new cart if it doesn't exist
      const newCart = new Cart({
        userId,
        items: [{ productId, quantity }],
      });
      await newCart.save();
    }

    res.status(200).json({ message: "Item added to cart", success: true });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ message: "Error adding item to cart", success: false });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user._id : null;
    const { productId } = req.params;

    if (!userId) {
      console.log("User not logged in");
      return res.status(401).json({ message: "User not logged in", error: true });
    }
    if (!productId) {
      console.log("Product ID is required");
      return res.status(400).json({ message: "Product ID is required", error: true });
    }

    // Find the cart associated with the user
    const cart = await Cart.findOne({ userId });

    // If no cart is found, return a 404 error
    if (!cart) {
      console.log("Cart not found");
      return res.status(404).json({ message: "Cart not found", error: true });
    }

    // Ensure products field is an array
    if (!Array.isArray(cart.items)) {
      console.log("Products field is not an array");
      return res.status(500).json({ message: "Internal server error", error: true });
    }

    const initialLength = cart.items.length;

    // Remove the item with the specified product ID from the cart
    cart.itmes = cart.items.filter((item) => !item.productId.equals(productId));

    const finalLength = cart.items.length;

    // Check if the product was found and removed
    if (initialLength === finalLength) {
      console.log("Product ID not found in cart");
      return res.status(404).json({ message: "Product not found in cart", error: true });
    }

    // Save the updated cart
    await cart.save();

    console.log("Item removed from cart");
    return res.status(200).json({ message: "Item removed from cart", error: false });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return res.status(500).json({ message: "Error removing item from cart", error: true });
  }
};



module.exports = {
  breadcrumbs,
  loadHome,
  loadContact,
  loadProduct,
  loadProductList,
  filterProduct,
  loadWishlist,
  addToWishlist,
  removeFromWishlist,
  loadCart,
  addToCart,
  removeFromCart,
};
