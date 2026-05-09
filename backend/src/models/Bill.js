// // const mongoose = require("mongoose");

// // const billSchema = new mongoose.Schema({
// //   quotationId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: "Quotation"
// //   },
// //   customerName: String,
// //   total: Number,
// //   paid: { type: Number, default: 0 },
// //   due: Number,
// //   status: {
// //     type: String,
// //     enum: ["paid", "pending"],
// //     default: "pending"
// //   }
// // }, { timestamps: true });

// // module.exports = mongoose.model("Bill", billSchema);


// const mongoose = require("mongoose");

// const billSchema = new mongoose.Schema({
//     customerName: {
//         type: String,
//         required: true
//     },
//     customerId: {
//         type: String,
//         required: true
//     },
//     items: [
//         {
//             itemName: String,
//             quantity: Number,
//             price: Number,
//             total: Number
//         }
//     ],
//     subTotal: Number,
//     gst: Number,
//     grandTotal: Number,
//     status: {
//         type: String,
//         default: "Pending"
//     }
// }, { timestamps: true });

// module.exports = mongoose.model("Bill", billSchema);
const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  email: String,
  phone: String,

  eventType: String,
  eventDate: String,
  location: String,
  validTill: String,

  items: [
    {
      itemName: String,
      quantity: Number,
      price: Number,
      total: Number
    }
  ],

  subTotal: Number,
  gst: Number,
  discount: Number,
  grandTotal: Number,

  status: {
    type: String,
    default: "Pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("Bill", billSchema);
