// const mongoose = require("mongoose");

// const photoSchema = new mongoose.Schema(
//   {
//     eventName: {
//       type: String,
//       required: true,
//       index: true
//     },
//     customerName: {
//       type: String,
//       required: true,
//       trim: true
//     },
//     category: {
//       type: String,
//       required: true
//     },
//     imagePath: {
//       type: String,
//       required: true
//     },
//     isBestPhoto: {
//       type: Boolean,
//       default: false
//     },
//     allowDownload: {
//       type: Boolean,
//       default: false
//     }
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Photo", photoSchema);

const express = require("express");
const router = express.Router();
const Portfolio = require("../models/Portfolio");
const Event = require("../models/Event");

// Combined Photos API
router.get("/", async (req, res) => {
  try {
    const portfolioPhotos = await Portfolio.find();
    const eventPhotos = await Event.find();

    const formattedPortfolio = portfolioPhotos.map((photo) => ({
      type: "portfolio",
      category: photo.category,
      image: photo.image,
    }));

    const formattedEvents = eventPhotos.map((event) => ({
      type: "event",
      customerName: event.customerName,
      eventType: event.eventType,
      image: event.image,
    }));

    const allPhotos = [...formattedPortfolio, ...formattedEvents];

    res.json(allPhotos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

