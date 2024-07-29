//require model
const Wishlist = require("../../model/wishlistModel");
const Cart = require("../../model/cartModel");
const Order = require("../../model/orderModel");

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
    res.render("checkout", {
      user,
      wishlistItems,
      cartItems,
    });
  } catch (error) {
    console.log(error);
  }
};

//insert the user address
const insertAddress = async (req, res) => {
  // try {
  //   const user = req.session.user || req.user;
  //   const userId = user ? user._id : null;

  //   if(!userId){
  //       return res.status(401).json({message:"User not found"})
  //   }
  //   const { firstName, lastName, streetAddress, apartment, town, city, state, pin_code, phone, email, cartItems=[], totalAmount } = req.body;
  //   const order = new Order({
  //     userId,
  //     address: [
  //       {
  //         firstName,
  //         lastName,
  //         streetAddress,
  //         apartment,
  //         town,
  //         city,
  //         state,
  //         pin_code,
  //         phone,
  //         email,
  //       },
  //     ],
  //     items: cartItems.map((item) => ({
  //       product_id: item.productId,
  //       price: item.price,
  //       quantity: item.quantity,
  //     })),
  //   });
  //   await order.save();
  //   res.status(201).json({ message: 'Order created successfully', order: order });
  // } catch (error) {
  //   console.log(error);
  //   res.status(500).send("Server error");
  // }
};

module.exports = {
  loadCheckout,
  insertAddress,
};
