//controllers
const Wishlist = require("../../model/wishlistModel");
const Cart = require("../../model/cartModel");
const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");

const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const breadcrumbs = async (req, res) => {
  try {
    res.render("/", { breadcrumbs });
  } catch (error) {
    console.log(error);
  }
};

//load home page for user
const loadHome = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const userId = user ? user._id : null;
    console.log("user session:", user);

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

    const products = await Product.find({ isListed: "true" }).limit(6).sort({ _id: -1 });
    const categories = await Category.find({ isListed: "true" });

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

//load contact page for user, if the user already login
const loadContact = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const userId = user ? user._id : null;

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    const wishlistItems = await Wishlist.findOne({ userId }).populate("products.productId");
    const categories = await Category.find({ isListed: "true" });

    const cartItems = cart && cart.items ? cart.items : [];
    const wishlistItemsList = wishlistItems ? wishlistItems.products : [];

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

//the contact page message send to the owner email
const sendMessage = async (req, res) => {
  try {
    const { cname, cemail, cphone, csubject, cmessage } = req.body;
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions = {
      from: `"${cname}" <${cemail}>`,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Submission: ${csubject}`,
      text: `
        Name: ${cname}
        Email: ${cemail}
        Phone: ${cphone}
        Subject: ${csubject}
        Message: ${cmessage}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${cname}</p>
        <p><strong>Email:</strong> ${cemail}</p>
        <p><strong>Phone:</strong> ${cphone}</p>
        <p><strong>Subject:</strong> ${csubject}</p>
        <p><strong>Message:</strong> ${cmessage}</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ success: false });
      } else {
        console.log("Message sent: %s", info.messageId);
        res.json({ success: true });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

//load product detailed page for user
const loadProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.session.user || req.user;
    const userId = user ? user._id : null;

    const product = await Product.findById(productId).populate("category", "title");
    const categories = await Category.find({ isListed: "true" });
    const relatedProduct = await Product.find({ category: product.category, _id: { $ne: productId } }).limit(4);

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
      { name: product.name, url: `/product/${product._id}` },
    ];

    res.render("product", {
      product,
      user,
      wishlistItems,
      cartItems,
      breadcrumbs,
      categories,
      relatedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

//load product list page, contain all product
const loadProductList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const listedCategories = await Category.find({ isListed: "true" }).select("_id");
    const categories = await Category.find({ isListed: "true" });
    const products = await Product.find({ isListed: "true" })
      .populate({ path: "category", match: { isListed: "true" }, select: "title" })
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
    const products = await Product.find({ category: { $in: categories } }).populate("category");
    res.json({ products });
  } catch (error) {
    console.error("Error fetching filtered products:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

//load wishlist page who have account
const loadWishlist = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    console.log("User from session:", user);
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

//add product to wishlist with productId and userId
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

//remove products on the wishlist page
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

//load cart page who have an account
const loadCart = async (req, res) => {
  try {
    const user = req.session.user || req.user;
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

//add the products on the cart
const addToCart = async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user._id : null;
    const { productId, quantity } = req.body;

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
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
      await cart.save();
    } else {
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

//remove products from cart
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

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      console.log("Cart not found");
      return res.status(404).json({ message: "Cart not found", error: true });
    }

    if (!Array.isArray(cart.items)) {
      console.log("Products field is not an array");
      return res.status(500).json({ message: "Internal server error", error: true });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => !item.productId.equals(productId));
    const finalLength = cart.items.length;

    if (initialLength === finalLength) {
      console.log("Product ID not found in cart");
      return res.status(404).json({ message: "Product not found in cart", error: true });
    }
    await cart.save();
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
  sendMessage,
};
