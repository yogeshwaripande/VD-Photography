
/* ================= BILL STORAGE ================= */
let bills = JSON.parse(localStorage.getItem("bills")) || [];


/* ================= CLEAR FILTERS ================= */
function clearFilters() {

  let search = document.getElementById("search");
  let status = document.getElementById("status");
  let fromDate = document.getElementById("fromDate");
  let toDate = document.getElementById("toDate");

  if (search) search.value = "";
  if (status) status.value = "";
  if (fromDate) fromDate.value = "";
  if (toDate) toDate.value = "";
}


/* ================= OPEN FORM ================= */
function openForm() {

  let modal = document.getElementById("formModal");
  if (modal) modal.style.display = "block";
}


/* ================= CANCEL FORM ================= */
function cancelForm() {

  let client = document.getElementById("client");
  let amount = document.getElementById("amount");
  let date = document.getElementById("billDate");
  let modal = document.getElementById("formModal");

  if (client) client.value = "";
  if (amount) amount.value = "";
  if (date) date.value = "";
  if (modal) modal.style.display = "none";
}


/* ================= CREATE BILL ================= */
function createBill() {

  let client = document.getElementById("client")?.value;
  let amount = document.getElementById("amount")?.value;
  let date = document.getElementById("billDate")?.value;

  if (!client || !amount || !date) {
    alert("All fields required");
    return;
  }

  let bill = {
    id: Date.now(),
    custId: "BILL-" + Date.now(),
    custName: client,
    amount: amount,
    eventDate: date,
    grandTotal: amount,
    eventType: "Bill"
  };

  bills.push(bill);

  localStorage.setItem("bills", JSON.stringify(bills));

  renderBills();
  cancelForm();
}


/* ================= RENDER BILLS ================= */
function renderBills() {

  let billList = document.getElementById("billList");
  if (!billList) return;  // 🔥 Prevent Error

  let html = "";

  if (bills.length === 0) {
    billList.innerHTML = "<p>No bills found</p>";
    return;
  }

  bills.forEach(b => {

    html += `
      <div class="card">
        <p><b>${b.custName}</b></p>
        <p>₹${b.grandTotal} | ${b.eventDate}</p>
        <button onclick="viewBill(${b.id})">View</button>
        <button onclick="deleteBill(${b.id})">Delete</button>
      </div>
    `;
  });

  billList.innerHTML = html;
}


/* ================= DELETE BILL ================= */
function deleteBill(id) {

  if (!confirm("Delete this bill?")) return;

  bills = bills.filter(b => b.id !== id);

  localStorage.setItem("bills", JSON.stringify(bills));

  renderBills();
}


/* ================= VIEW BILL ================= */
function viewBill(id) {

  let bill = bills.find(b => b.id === id);
  if (!bill) return;

  localStorage.setItem("quotation", JSON.stringify(bill));

  window.location.href = "quotation.view.html";
}


/* ================= AUTO LOAD ================= */
window.onload = function () {
  renderBills();
};
