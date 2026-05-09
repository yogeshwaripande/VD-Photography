const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: Number,
  method: String,
  date: String,
  note: String
});

const photographerSchema = new mongoose.Schema({
  name: String,
  role: String,
  totalAmount: Number,
  payments: [paymentSchema]
});

const expenseSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  method: String
});

const orderSchema = new mongoose.Schema({
  orderNo: String,
  clientName: String,
  eventType: String,
  eventDate: String,
  location: String,
  status: String,
  totalAmount: Number,
  revenuePayments: [paymentSchema],
  photographers: [photographerSchema],
  expenses: [expenseSchema]
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
