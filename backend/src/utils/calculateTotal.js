// module.exports = (items, tax, discount) => {
//   let subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
//   let taxAmt = subtotal * (tax / 100);
//   let disc = subtotal * (discount / 100);
//   return subtotal + taxAmt - disc;
// };
// module.exports = (items) => {
//     let subTotal = 0;

//     items.forEach(item => {
//         item.total = item.quantity * item.price;
//         subTotal += item.total;
//     });

//     const gst = subTotal * 0.18; // 18% GST
//     const grandTotal = subTotal + gst;

//     return { items, subTotal, gst, grandTotal };
// };
module.exports = (items, discount = 0) => {
  let subTotal = 0;

  items = items.map(i => {
    i.total = i.quantity * i.price;
    subTotal += i.total;
    return i;
  });

  let gst = subTotal * 0.18;
  let discountAmt = subTotal * discount / 100;
  let grandTotal = subTotal + gst - discountAmt;

  return { items, subTotal, gst, grandTotal };
};
