const mongoose = require('mongoose')

const wishlistSchema = mongoose.Schema({

    user_id:{
        type:ObjectId,
        required:true
    },
    product_id:{
        type:ObjectId,
        required:true
    }
})

module.exports = mongoose.model('wishlist',wishlistSchema)