//require model
const Wishlist = require("../../model/wishlistModel");
const Cart = require("../../model/cartModel");
const Order = require("../../model/orderModel");
const Address = require("../../model/addressModel");
const Category = require("../../model/categoryModel");
const Payment = require("../../model/paymentModel");

const mongoose = require("mongoose");

//load the check out page
const loadCheckout = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const userId = user ? user._id : null;
    console.log("user session", user);

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

    const categories = await Category.find({ isListed: "true" });
    const addresses = await Address.find({ userId });

    res.render("checkout", {
      user,
      wishlistItems,
      cartItems,
      addresses,
      categories,
    });
  } catch (error) {
    console.log(error);
  }
};

const placeOrder = async (req, res) => {
  const user = req.session.user || req.user;
  const userId = user ? user._id : null;

  const { addressId, paymentMethod } = req.body;
  try {
    if (!addressId) {
      return res.status(400).json({ success: false, message: "Address is required" });
    }

    const cart = await Cart.findOne({ userId: userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let totalPrice = 0;
    const orderedItems = cart.items.map((item) => {
      const itemTotal = item.productId.price * item.quantity;
      totalPrice += itemTotal;
      return {
        product: item.productId._id,
        quantity: item.quantity,
      };
    });

    //create new order
    const newOrder = new Order({
      user: userId,
      address: new mongoose.Types.ObjectId(addressId),
      paymentMethod: paymentMethod,
      items: orderedItems,
      totalPrice: totalPrice,
    });

    await newOrder.save();

    cart.items = [];
    await cart.save();

    res.status(200).json({ success: true, message: "order placed successfully", redirectUrl: `/checkout/ordered/${newOrder._id}` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error placing order", success: false });
  }
};

//confirm order page after place a order
const orderConfirm = async (req, res) => {
  try {
    const user = req.session.user || req.user;
    const userId = user ? user._id : null;
    console.log("user session", user);

    const orderId = req.params.orderId;
    const order = await Order.findById(orderId).populate("items.product").exec();

    if (!order) {
      return res.status(404).send("Order not found");
    }

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

    const categories = await Category.find({ isListed: "true" });
    const address = await Address.findById(order.address);

    if (!address) {
      return res.status(404).send("Address not found");
    }

    const createdAt = new Date();
    const deliveryDate = addDays(createdAt, 3);
    res.render("orderConfirm", {
      order: {
        _id: order._id,
        totalPrice: order.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
        deliveryDate: deliveryDate,
        address: {
          name: address.fullName,
          street: address.streetAddress,
          apartment: address.apartment,
          city: address.city,
          town: address.town,
          state: address.state,
          postcode: address.postcode,
          phone: address.phone,
          email: address.email,
        },
        items: order.items,
      },
      wishlistItems,
      cartItems,
      user,
      categories,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).send("Internal Server Error");
  }
};

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dayOfWeek = days[date.getDay()];
  const month = months[date.getMonth()];
  const dayOfMonth = date.getDate();

  return `${dayOfWeek}, ${month} ${dayOfMonth}`;
}

const updateStatus = async (req, res) => {
  try {
    const { orderId } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(orderId, { order_status: "Cancel" }, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Redirect back to the order list or wherever you want after the cancellation
    return res.redirect("/account");
  } catch (error) {
    console.error("Error canceling order:", error);
    return res.status(500).json({ success: false, message: "Error canceling order" });
  }
};

module.exports = {
  loadCheckout,
  placeOrder,
  orderConfirm,
  updateStatus,
};
