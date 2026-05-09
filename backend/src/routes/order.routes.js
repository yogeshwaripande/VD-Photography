const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  deleteOrder,
  getOrderSummary,
  previewNextOrderNo,
  updateOrder
} = require("../controllers/order.controller");

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/summary", getOrderSummary);
router.get("/preview-order-no", previewNextOrderNo);
router.put("/:id", updateOrder);

// ❗ KEEP THESE AT BOTTOM
router.delete("/:id", deleteOrder);

module.exports = router;


