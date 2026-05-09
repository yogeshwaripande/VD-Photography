const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Quotation", quotationSchema);
