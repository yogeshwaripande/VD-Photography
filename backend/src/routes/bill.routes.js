// const express = require("express");
// const router = express.Router();
// const {
//   createBill,
//   getBills
// } = require("../controllers/bill.controller");

// router.post("/", createBill);
// router.get("/", getBills);

// module.exports = router;
const express = require("express");
const router = express.Router();
const billController = require("../controllers/bill.controller");

router.post("/", billController.createBill);

module.exports = router;
