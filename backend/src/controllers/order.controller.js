const Order = require("../models/order.model");
const Counter = require("../models/counter.model");

/* ======================
   CREATE ORDER
====================== */
const createOrder = async (req, res) => {
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "order" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const orderNo = `ORD-${String(counter.value).padStart(3, "0")}`;

    const order = new Order({
      ...req.body,
      orderNo
    });

    await order.save();

    res.status(201).json({
      message: "Order created successfully",
      orderNo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================
   GET ALL ORDERS
====================== */
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================
   UPDATE ORDER
====================== */
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Order.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order updated successfully",
      orderNo: updated.orderNo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================
   DELETE ORDER
====================== */
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Order.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================
   DASHBOARD SUMMARY
====================== */
const getOrderSummary = async (req, res) => {
  try {
    const orders = await Order.find();

    let totalOrders = orders.length;
    let totalRevenue = 0;
    let cashReceived = 0;
    let onlineReceived = 0;
    let totalExpenses = 0;

    orders.forEach(order => {
      totalRevenue += order.totalAmount || 0;

      order.revenuePayments?.forEach(p => {
        if (p.method === "Cash") cashReceived += p.amount;
        if (p.method === "Online") onlineReceived += p.amount;
      });

      order.expenses?.forEach(e => {
        totalExpenses += e.amount || 0;
      });

      order.photographers?.forEach(p => {
        totalExpenses += p.totalAmount || 0;
      });
    });

    res.json({
      totalOrders,
      totalRevenue,
      cashReceived,
      onlineReceived,
      totalExpenses,
      totalProfit: totalRevenue - totalExpenses,
      pendingReceivables:
        totalRevenue - (cashReceived + onlineReceived)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================
   PREVIEW ORDER NO
====================== */
const previewNextOrderNo = async (req, res) => {
  try {
    const counter = await Counter.findOne({ name: "order" });
    const next = counter ? counter.value + 1 : 1;

    res.json({
      orderNo: `ORD-${String(next).padStart(3, "0")}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================
   EXPORTS (VERY IMPORTANT)
====================== */
module.exports = {
  createOrder,
  getOrders,
  updateOrder,
  deleteOrder,
  getOrderSummary,
  previewNextOrderNo
};
