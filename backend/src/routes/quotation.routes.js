const express = require("express");
const router = express.Router();
const Quotation = require(".../models/Quotation");

router.post("/create", async (req, res) => {
  try {
    const quotation = new Quotation(req.body);
    await quotation.save();

    res.status(201).json({
      message: "Quotation created successfully",
      data: quotation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
