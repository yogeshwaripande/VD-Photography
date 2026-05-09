const Bill = require("../models/Bill");
const calculateTotal = require("../utils/calculateTotal");

exports.createBill = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      email,
      phone,
      eventType,
      eventDate,
      location,
      validTill,
      items,
      discount = 0
    } = req.body;

    if (!customerId || !customerName || !items || items.length === 0) {
      return res.status(400).json({ message: "Required fields missing ❌" });
    }

    const totals = calculateTotal(items, discount);

    const bill = new Bill({
      customerId,
      customerName,
      email,
      phone,
      eventType,
      eventDate,
      location,
      validTill,
      items: totals.items,
      subTotal: totals.subTotal,
      gst: totals.gst,
      discount,
      grandTotal: totals.grandTotal
    });

    await bill.save();

    res.status(201).json({
      message: "Quotation saved in MongoDB ✅",
      bill
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
