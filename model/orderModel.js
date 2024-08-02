const mongoose = require('mongoose');
// const addressModel = require('./addressModel');
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const orderSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userRegister',
    required: true,
  },
  address: {
    type:mongoose.Schema.Types.ObjectId,
    ref:'Address',
    required:true
  },
  paymentMethod:{
    type:String,
    required:true,
  },
  items: [
    {
      product: {
        type: ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deliveryDate:{
    type:Date
  },
  totalPrice:{
    type:Number,
    required:true
  },
  payment_status:{
    type:String,
    enum:['Pending','Completed','Failed'],
    default:'Pending'
  },
  order_status:{
    type:String,
    enum:['Pending','Processing','Shipped','Deliverd','Cancel'],
    default:'Pending'
  }
});



module.exports = mongoose.model('Order', orderSchema);
