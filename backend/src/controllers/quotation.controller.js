const Quotation = require(".../models/Quotation");

exports.createQuotation = async (req, res) => {
  const quotation = await Quotation.create(req.body);
  res.status(201).json(quotation);
};

exports.getQuotations = async (req, res) => {
  const quotations = await Quotation.find();
  res.json(quotations);
};

exports.convertToBill = async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  quotation.status = "converted";
  await quotation.save();
  res.json({ message: "Quotation converted to Bill" });
};
