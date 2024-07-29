const mongoose = require("mongoose");
const {Schema} = mongoose
const { ObjectId } = Schema.Types
const orderSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    ref: "userModel",
    required: true,
  },
  address: [
    {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      streetAddress: {
        type: String,
        required: true,
      },
      apartment: {
        type: String,
      },
      town: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pin_code: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
  ],
  items: [
    {
      price: {
        type: Number,
        required: true,
      },
      product_id: {
        type: ObjectId,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("Order", orderSchema);
