const mongoose = require("mongoose");

const UrlSchema = new mongoose.Schema({
  longUrl: {
    type: String,
    required: true 
  },

  shortUrl: {
    type: String,
  },

  urlCode: {
    type: String
  },

  qrCode: {
    type: String
  },

  ipAddress: {
    type: Array
  },

  clicks: {
    type: Number,
    default: 0
  },

  date: {
    type: String,
    default: Date.now
  }
})


module.exports = mongoose.model("Url", UrlSchema);
