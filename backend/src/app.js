const express = require("express");
const cors = require("cors");
const path = require("path");
const eventRoutes = require("./routes/eventRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const orderRoutes = require("./routes/order.routes");
const billRoutes = require("./routes/bill.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

console.log("Static files served from:", path.join(__dirname, '../uploads'));


app.use("/api/events", eventRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bills", billRoutes);

app.get("/", (req, res) => {
    res.send("VD Photography API is running...");
});
 
module.exports = app;