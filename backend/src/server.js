require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const cron = require("node-cron");

// import cleanup functions
const { autoDeleteOldEvents } = require("./controllers/eventController");
const { autoDeleteOldPortfolioPhotos } = require("./controllers/portfolioController");

// Connect DB first
connectDB();

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

/* ======================================
   AUTO CLEANUP SCHEDULER
   Runs everyday at 2:00 AM
====================================== */

cron.schedule("0 2 * * *", async () => {
  console.log("Running scheduled cleanup...");

  await autoDeleteOldEvents();           // Event photos cleanup
  await autoDeleteOldPortfolioPhotos();  // Portfolio photos cleanup
});

app.use("/api/orders", require("./routes/order.routes"));