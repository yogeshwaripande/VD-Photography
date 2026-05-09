let isFormOpen = false;
let editingOrderId = null;
let isEditMode = false;
let isViewMode = false;
const addOrderBtn = document.getElementById("addOrderBtn");
const backdrop = document.getElementById("formBackdrop");
const orderForm = document.getElementById("orderForm");
const clearDatesBtn = document.getElementById("clearDatesBtn");
const startDateInput = document.getElementById("filterStartDate");
const endDateInput = document.getElementById("filterEndDate");
const pendingPaymentsOnlyInput = document.getElementById("pendingPaymentsOnly");

let allOrdersCache = [];
let activeOrdersListMode = "all";
const isAllOrdersPage = document.body?.dataset?.view === "all-orders";




document.addEventListener("DOMContentLoaded", function () {

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  document.getElementById("ordersListSection").style.display = "block";

  if (isAllOrdersPage) {
    const dashboardSection = document.getElementById("ordersDashboardSection");

    if (dashboardSection) dashboardSection.style.display = "none";
  }

  // ✅ LOAD INITIAL DATA ON PAGE LOAD
  if (!isAllOrdersPage) {
    loadDashboardSummary();
    updatePendingEventsCard();
  }

  const requestedListMode = sessionStorage.getItem("ordersListMode");
  sessionStorage.removeItem("ordersListMode");
  const initialMode =
    isAllOrdersPage && requestedListMode === "pending" ? "pending" : "all";
  loadOrdersList(initialMode);

  /* =====================
     ADD ORDER TOGGLE
  ===================== */
addOrderBtn.addEventListener("click", function () {
  const formSection = document.getElementById("newOrderForm");

  if (!isFormOpen) {  
    isViewMode = false;
    setFormReadOnly(false);
    openOrderForm();
} else {
  closeOrderForm();
}

});


  /* =====================
     ADD PHOTOGRAPHER
  ===================== */
  const addPhotographerBtn = document.getElementById("addPhotographerBtn");
  const photographerList = document.getElementById("photographerList");
  const template = document.getElementById("photographerTemplate");

  addPhotographerBtn.addEventListener("click", function () {
    const clone = template.firstElementChild.cloneNode(true);

    clone
      .querySelector(".remove-photographer-btn")
      .addEventListener("click", () => clone.remove());

    photographerList.appendChild(clone);
  });
});

/* =====================
   ADD PAYMENT ROW
===================== */
document.addEventListener("click", function (e) {

  if (!e.target.classList.contains("add-payment-btn")) return;

  const container =
    e.target.closest(".box").querySelector(".payment-list") ||
    e.target.closest(".box").querySelector("#revenuePayments");

  if (!container) return;

  const row = document.createElement("div");
  row.className = "payment-row";

  row.innerHTML = `
    <input type="number" placeholder="Amount (₹)">
    <select>
      <option>Cash</option>
      <option>Online</option>
    </select>
    <input type="date">
    <input type="text" placeholder="Note (optional)">
    <button type="button" class="delete-payment-btn" aria-label="Delete payment">
      <i class="fa fa-trash" aria-hidden="true"></i>
    </button>
  `;

  container.appendChild(row);

  calculateSummary();

});

/* =====================
   DELETE PAYMENT
===================== */
document.addEventListener("click", function (e) {
  const deletePaymentBtn = e.target.closest(".delete-payment-btn");
  if (deletePaymentBtn) {
    deletePaymentBtn.closest(".payment-row").remove();
    calculateSummary();
  }
});


/* =====================
   ADD / DELETE EXPENSE
===================== */
document.addEventListener("click", function (e) {

  if (e.target.classList.contains("add-expense-btn")) {
    const expenseList = document.getElementById("expenseList");

    const row = document.createElement("div");
    row.className = "expense-row";

    row.innerHTML = `
      <input type="text" placeholder="Description">
      <input type="number" placeholder="Amount (₹)">
      <select>
        <option>Cash</option>
        <option>Online</option>
      </select>
      <button type="button" class="delete-expense-btn" aria-label="Delete expense">
        <i class="fa fa-trash" aria-hidden="true"></i>
      </button>
    `;

    expenseList.appendChild(row);

    calculateSummary();

  }

  const deleteExpenseBtn = e.target.closest(".delete-expense-btn");
  if (deleteExpenseBtn) {
    deleteExpenseBtn.closest(".expense-row").remove();
  }
});

/* =====================
   FILTER ORDERS
===================== */
if (clearDatesBtn && startDateInput && endDateInput) {
  clearDatesBtn.addEventListener("click", function () {
    startDateInput.value = "";
    endDateInput.value = "";
    reRenderOrdersTable();
  });
}

if (startDateInput) startDateInput.addEventListener("change", reRenderOrdersTable);
if (endDateInput) endDateInput.addEventListener("change", reRenderOrdersTable);
if (pendingPaymentsOnlyInput) pendingPaymentsOnlyInput.addEventListener("change", reRenderOrdersTable);

function validatePhotographers() {
  const photographers = document.querySelectorAll(".photographer-item");

  let validCount = 0;

  for (let i = 0; i < photographers.length; i++) {
    const box = photographers[i];

    const nameInput = box.querySelector("input[type='text']");
    const roleSelect = box.querySelector("select");
    const amountInput = box.querySelector(".photographer-total");

    const name = nameInput?.value.trim();
    const role = roleSelect?.value;
    const amount = Number(amountInput?.value || 0);

    // 🟡 Completely empty block → IGNORE
    if (!name && amount === 0) {
      continue;
    }

    // 🔴 Partially filled → ERROR
    if (!name) {
      alert("Photographer name is required");
      nameInput.focus();
      return false;
    }

    if (!role) {
      alert("Photographer role is required");
      roleSelect.focus();
      return false;
    }

    if (amount <= 0) {
      alert("Photographer total amount must be greater than 0");
      amountInput.focus();
      return false;
    }

    // ✅ Valid photographer
    validCount++;
  }

  // ❌ No valid photographer at all
  if (validCount === 0) {
    alert("Please add at least one photographer with valid details");
    return false;
  }

  return true;
}



orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isViewMode) return;

  const clientName = document.getElementById("clientName").value.trim();
  const eventType = document.getElementById("eventType").value;
  const eventDate = document.getElementById("eventDate").value;
  const location = document.getElementById("location").value.trim();
  const totalAmount = document.getElementById("totalAmount").value;

  // =============================
// COLLECT FORM DATA FOR BACKEND
// =============================

// ✅ Revenue payments
const revenuePayments = [];
document.querySelectorAll("#revenuePayments .payment-row").forEach(row => {
  const inputs = row.querySelectorAll("input, select");

  const amount = Number(inputs[0].value || 0);
  const method = inputs[1].value;
  const date = inputs[2].value;
  const note = inputs[3].value;

  if (amount > 0) {
    revenuePayments.push({ amount, method, date, note });
  }
});

// ✅ Photographers
const photographers = [];
document.querySelectorAll(".photographer-item").forEach(box => {
  const name = box.querySelector("input[type='text']").value.trim();
  const role = box.querySelector("select").value;
  const totalAmount =
    Number(box.querySelector(".photographer-total").value || 0);

  if (!name || totalAmount <= 0) return;

  const payments = [];
  box.querySelectorAll(".payment-list .payment-row").forEach(row => {
    const inputs = row.querySelectorAll("input, select");
    const amount = Number(inputs[0].value || 0);
    const method = inputs[1].value;
    const date = inputs[2].value;
    const note = inputs[3].value;

    if (amount > 0) {
      payments.push({ amount, method, date, note });
    }
  });

  photographers.push({ name, role, totalAmount, payments });
});

// ✅ Other expenses
const expenses = [];
document.querySelectorAll("#expenseList .expense-row").forEach(row => {
  const inputs = row.querySelectorAll("input, select");

  const description = inputs[0].value.trim();
  const amount = Number(inputs[1].value || 0);
  const method = inputs[2].value;


  if (description && amount > 0) {
    expenses.push({ description, amount, method });
  }
});


  // 🔒 BASIC REQUIRED FIELD VALIDATION
  if (
    !clientName ||
    !eventType ||
    eventType === "Select type" ||
    !eventDate ||
    !location ||
    !totalAmount ||
    Number(totalAmount) <= 0
  ) {
    alert("Please fill all required (*) order fields correctly");
    return;
  }

  // 🔒 PHOTOGRAPHER VALIDATION
  if (!validatePhotographers()) {
    return; // ❌ stop submit
  }
  const status = document.getElementById("orderStatus").value;

const data = {
  clientName,
  eventType,
  eventDate,
  location,
  status,              // ✅ FIXED
  totalAmount,
  revenuePayments,
  photographers,
  expenses
};



  try {
      const url = editingOrderId
        ? `http://localhost:5000/api/orders/${editingOrderId}`
        : "http://localhost:5000/api/orders";

      const method = editingOrderId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });


    if (!res.ok) {
      throw new Error("Server error");
    }

      const result = await res.json();

      alert(`Order ${result.orderNo} saved successfully`);

      document.getElementById("formBackdrop").classList.remove("active");
      document.body.classList.remove("order-form-open");
      document.body.style.overflow = "";

      // ✅ RESET EDIT MODE AFTER UPDATE
      editingOrderId = null;
      isEditMode = false;
      document.querySelector(".create-order-btn").textContent = "CREATE ORDER";
      loadDashboardSummary();
      loadOrdersList();

      orderForm.reset();

      loadPreviewOrderNo();

      // 🔴 REMOVE dynamic photographers & expenses
      document.getElementById("photographerList").innerHTML = "";
      document.getElementById("expenseList").innerHTML = "";
      document.getElementById("revenuePayments").innerHTML = "";

      // 🔴 RESET SUMMARY
      calculateSummary();

      // 🔴 CLOSE FORM & RESET BUTTON STATE
      document.getElementById("newOrderForm").classList.remove("active");
      addOrderBtn.textContent = "+ ADD ORDER";
      isFormOpen = false;

  } catch (err) {
    alert("Error saving order. Please try again.");
  }
});



/* =====================
   ORDER SUMMARY CALCULATION (FINAL)
===================== */

function calculateSummary() {
  // 1. Total Revenue (Client Amount)
  const totalRevenue =
    Number(document.getElementById("totalAmount")?.value) || 0;

  // 2. Other Expenses
  let otherExpenses = 0;
  document.querySelectorAll("#expenseList input[type='number']").forEach(input => {
    otherExpenses += Number(input.value) || 0;
  });

// 3. Photographer Cost (FIXED – total only)
let photographerCost = 0;
document.querySelectorAll(".photographer-total").forEach(input => {
  photographerCost += Number(input.value) || 0;
});


  // 4. Total Expense = Photographer + Other
  const totalExpense = otherExpenses + photographerCost;

  // 5. Payments Received (Client)
  let totalPaid = 0;
  document
    .querySelectorAll("#revenuePayments input[type='number']")
    .forEach(input => {
      totalPaid += Number(input.value) || 0;
    });

  // 6. Profit / Loss
  const profit = totalRevenue - totalExpense;

  // 7. To Receive
  const toReceive = totalRevenue - totalPaid;

  // 8. Update UI
  document.getElementById("summaryRevenue").textContent = `₹${totalRevenue}`;
  document.getElementById("summaryExpense").textContent = `₹${totalExpense}`;
  document.getElementById("summaryProfit").textContent = `₹${profit}`;
  document.getElementById("summaryReceive").textContent = `₹${toReceive}`;

  // Profit color logic
  const profitEl = document.getElementById("summaryProfit");
  profitEl.style.color = profit >= 0 ? "#00ff7f" : "#ff4d4f";
}
// Recalculate on typing
document.addEventListener("input", function (e) {
  // Client total change
  if (e.target.matches("#totalAmount")) {
    calculateSummary();
  }

  // Client payment change
  if (
    e.target.closest("#revenuePayments") &&
    e.target.type === "number"
  ) {
    validateClientPayments(e.target);
  }

  // Photographer payment change
  if (
    e.target.closest(".photographer-item .payment-list") &&
    e.target.type === "number"
  ) {
    validatePhotographerPayments(e.target);
  }

  // Other expenses / photographer total change
  if (
    e.target.closest("#expenseList") ||
    e.target.classList.contains("photographer-total")
  ) {
    calculateSummary();
  }
});


async function loadPreviewOrderNo() {
  try {
    const res = await fetch(
      "http://localhost:5000/api/orders/preview-order-no"
    );
    const data = await res.json();
    document.getElementById("orderNo").value = data.orderNo;
  } catch (err) {
    document.getElementById("orderNo").value = "ORD-XXX";
  }
}

function validateClientPayments(changedInput) {
  const totalAmount =
    Number(document.getElementById("totalAmount")?.value) || 0;

  let paidSum = 0;
  document
    .querySelectorAll("#revenuePayments input[type='number']")
    .forEach(input => {
      paidSum += Number(input.value) || 0;
    });

  if (paidSum > totalAmount) {
    alert(
      `Total payments (₹${paidSum}) cannot exceed client amount (₹${totalAmount})`
    );

    // revert last changed input
    changedInput.value = 0;
    calculateSummary();
  }
}

function validatePhotographerPayments(changedInput) {
  const photographerBox = changedInput.closest(".photographer-item");
  if (!photographerBox) return;

  const totalAllowed =
    Number(
      photographerBox.querySelector(".photographer-total")?.value
    ) || 0;

  let paidSum = 0;
  photographerBox
    .querySelectorAll(".payment-list input[type='number']")
    .forEach(input => {
      paidSum += Number(input.value) || 0;
    });

  if (paidSum > totalAllowed) {
    alert(
      `Photographer payments (₹${paidSum}) cannot exceed agreed amount (₹${totalAllowed})`
    );

    changedInput.value = 0;
    calculateSummary();
  }
}

function openOrderForm() {
  const formSection = document.getElementById("newOrderForm");

  formSection.classList.add("active");
  backdrop.classList.add("active");
  document.body.classList.add("order-form-open");
  document.body.style.overflow = "hidden";
  addOrderBtn.textContent = "Cancel";
  isFormOpen = true;

  // ? ONLY for NEW order
  if (!isEditMode && !isViewMode) {
    loadPreviewOrderNo();
  }

  formSection.scrollTop = 0;
}

function closeOrderForm() {
  document.getElementById("newOrderForm").classList.remove("active");
  backdrop.classList.remove("active");

  document.body.classList.remove("order-form-open");
  document.body.style.overflow = ""; // restore scroll

  addOrderBtn.textContent = "+ ADD ORDER";
  isFormOpen = false;

  // reset edit mode safely
  isEditMode = false;
  isViewMode = false;
  editingOrderId = null;

  document.querySelector(".create-order-btn").textContent = "CREATE ORDER";
  setFormReadOnly(false);
}

function setFormReadOnly(readOnly) {
  const formSection = document.getElementById("newOrderForm");
  if (!formSection) return;

  formSection.querySelectorAll("input, select, textarea").forEach((el) => {
    if (readOnly) {
      el.setAttribute("disabled", "disabled");
    } else {
      el.removeAttribute("disabled");
    }
  });

  const submitBtn = formSection.querySelector(".create-order-btn");
  if (submitBtn) {
    submitBtn.style.display = readOnly ? "none" : "";
    submitBtn.disabled = !!readOnly;
  }

  formSection
    .querySelectorAll(".add-payment-btn, .add-expense-btn, .remove-photographer-btn")
    .forEach((btn) => {
      btn.disabled = !!readOnly;
    });

  const addPhotographerBtn = document.getElementById("addPhotographerBtn");
  if (addPhotographerBtn) addPhotographerBtn.disabled = !!readOnly;

  const closeBtn = document.getElementById("closeFormBtn");
  if (closeBtn) closeBtn.disabled = false;

  const cancelBtn = document.getElementById("cancelOrderBtn");
  if (cancelBtn) cancelBtn.disabled = false;
}


async function loadDashboardSummary() {
  try {
    const res = await fetch("http://localhost:5000/api/orders/summary");
    const data = await res.json();

    document.getElementById("cardTotalOrders").textContent =
      data.totalOrders;

    document.getElementById("cardTotalRevenue").textContent =
      `₹${data.totalRevenue}`;

    document.getElementById("cardCashReceived").textContent =
      `₹${data.cashReceived}`;

    document.getElementById("cardOnlineReceived").textContent =
      `₹${data.onlineReceived}`;

    document.getElementById("cardTotalExpenses").textContent =
      `₹${data.totalExpenses}`;

    document.getElementById("cardTotalProfit").textContent =
      `₹${data.totalProfit}`;

    document.getElementById("cardPendingReceivables").textContent =
      `₹${data.pendingReceivables}`;

  } catch (err) {
    console.error("Failed to load dashboard summary", err);
  }
}

function getDateStart(dateValue) {
  if (!dateValue) return null;
  const parsed = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDateEnd(dateValue) {
  if (!dateValue) return null;
  const parsed = new Date(`${dateValue}T23:59:59.999`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hasPendingPayment(order) {
  const totalAmount = Number(order.totalAmount) || 0;
  const paidAmount = (order.revenuePayments || []).reduce(
    (sum, payment) => sum + (Number(payment.amount) || 0),
    0
  );

  return paidAmount < totalAmount;
}

function applyOrdersFilters(orders, filterType = "all") {
  let filteredOrders = [...orders];

  if (filterType === "pending") {
    filteredOrders = filteredOrders.filter(isPendingOrder);
  }

  if (pendingPaymentsOnlyInput?.checked) {
    filteredOrders = filteredOrders.filter(hasPendingPayment);
  }

  const startDate = getDateStart(startDateInput?.value);
  const endDate = getDateEnd(endDateInput?.value);

  if (!startDate && !endDate) {
    return filteredOrders;
  }

  return filteredOrders.filter((order) => {
    const orderDate = getDateStart(order.eventDate);
    if (!orderDate) return false;

    if (startDate && orderDate < startDate) return false;
    if (endDate && orderDate > endDate) return false;

    return true;
  });
}

function formatMoney(value) {
  const amount = Number(value) || 0;
  return `Rs.${amount.toLocaleString("en-IN")}`;
}

function getAdvanceAmount(order) {
  return (order.revenuePayments || []).reduce(
    (sum, payment) => sum + (Number(payment.amount) || 0),
    0
  );
}

function getPhotographerNames(order) {
  return (order.photographers || [])
    .map((item) => item.name && item.name.trim())
    .filter(Boolean);
}

function renderOrdersTable(orders) {
  const listContainer = document.getElementById("ordersTableBody");
  listContainer.innerHTML = "";

  orders.forEach((order, index) => {
    const photographers = getPhotographerNames(order);
    const primaryPhotographer = photographers[0] || "-";
    const otherPhotographers =
      photographers.length > 1 ? `+ ${photographers.slice(1).join(", ")}` : "";
    const customerCode = `CUST-${String(index + 1).padStart(3, "0")}`;
    const eventDate = order.eventDate || "-";
    const scheduleTime = order.eventTime || "--";
    const eventType = order.eventType || "-";

    const card = document.createElement("article");
    card.className = "order-record-card";

    card.innerHTML = `
      <div class="order-record-header">
        <div>
          <div class="order-record-title-row">
            <h4>${order.orderNo || "-"}</h4>
            <span class="order-status-pill">${(formatStatus(order.status) || "-").toUpperCase()}</span>
          </div>
          <p>${customerCode} | ${order.clientName || "-"}</p>
        </div>
        <div class="order-record-amount">
          <strong>${formatMoney(order.totalAmount)}</strong>
          <span>Adv: ${formatMoney(getAdvanceAmount(order))}</span>
        </div>
      </div>

      <div class="order-record-body" hidden>
        <div class="order-record-col">
          <h5><i class="fa fa-camera" aria-hidden="true"></i> PHOTOGRAPHER</h5>
          <p>${primaryPhotographer}</p>
          <p>${otherPhotographers || "&nbsp;"}</p>
        </div>

        <div class="order-record-col">
          <h5><i class="fa fa-clock-o" aria-hidden="true"></i> SCHEDULE</h5>
          <p>${eventDate}</p>
          <p>${scheduleTime}</p>
          <p>${eventType}</p>
        </div>

        <div class="order-record-col">
          <h5><i class="fa fa-map-marker" aria-hidden="true"></i> LOCATION</h5>
          <p>${order.location || "-"}</p>
          <div class="order-record-actions">
            <button type="button" class="order-action-btn view-btn" data-id="${order._id}" aria-label="View order">
              <i class="fa fa-eye" aria-hidden="true"></i>
            </button>
            <button type="button" class="order-action-btn edit-btn" data-id="${order._id}" aria-label="Edit order">
              <i class="fa fa-pencil" aria-hidden="true"></i>
            </button>
            <button type="button" class="order-action-btn delete-btn" data-id="${order._id}" aria-label="Delete order">
              <i class="fa fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    listContainer.appendChild(card);
  });
}

document.addEventListener("click", (e) => {
  const header = e.target.closest(".order-record-header");
  if (!header) return;

  const card = header.closest(".order-record-card");
  const details = card?.querySelector(".order-record-body");
  if (!details) return;

  document.querySelectorAll(".order-record-card.expanded").forEach((openCard) => {
    if (openCard === card) return;
    openCard.classList.remove("expanded");
    const openDetails = openCard.querySelector(".order-record-body");
    if (openDetails) openDetails.hidden = true;
  });

  const isExpanded = card.classList.toggle("expanded");
  details.hidden = !isExpanded;
});

document.addEventListener("dblclick", (e) => {
  if (e.target.closest(".order-action-btn")) return;

  const card = e.target.closest(".order-record-card");
  if (!card) return;

  const editButton = card.querySelector(".edit-btn");
  if (editButton) editButton.click();
});

window.addEventListener("pageshow", () => {
  window.scrollTo(0, 0);
});

function reRenderOrdersTable() {
  const filteredOrders = applyOrdersFilters(allOrdersCache, activeOrdersListMode);
  renderOrdersTable(filteredOrders);
}

// CLICK ON TOTAL ORDERS CARD

 async function loadOrdersList(filterType = "all") {
  try {
    const res = await fetch("http://localhost:5000/api/orders");
    const orders = await res.json();

    allOrdersCache = orders;
    activeOrdersListMode = filterType;
    reRenderOrdersTable();

    // SHOW SECTION
    document.getElementById("ordersListSection").style.display = "block";

  } catch (err) {
    alert("Failed to load orders list");
    console.error(err);
  }
}
document.addEventListener("click", async (e) => {
  const actionButton = e.target.closest(".edit-btn, .view-btn");
  if (!actionButton) return;

  const id = actionButton.dataset.id;
  if (!id) return;
  const isViewAction = actionButton.classList.contains("view-btn");

  try {
    const res = await fetch("http://localhost:5000/api/orders");
    const orders = await res.json();
    const order = orders.find(o => o._id === id);
    if (!order) return;

    editingOrderId = isViewAction ? null : id;
    isEditMode = !isViewAction;
    isViewMode = isViewAction;

    // OPEN FORM
    openOrderForm();

    // BUTTON TEXT
    document.querySelector(".create-order-btn").textContent = isViewAction
      ? "VIEW ONLY"
      : "UPDATE ORDER";

    // BASIC FIELDS ONLY (NO LOGIC)
    document.getElementById("orderNo").value = order.orderNo;
    document.getElementById("clientName").value = order.clientName;
    document.getElementById("eventType").value = order.eventType;
    document.getElementById("eventDate").value = order.eventDate;
    document.getElementById("location").value = order.location;
    document.getElementById("totalAmount").value = order.totalAmount;
const statusSelect = document.getElementById("orderStatus");
const editStatus = (order.status || "Upcoming").toLowerCase();

if (editStatus === "completed") {
  statusSelect.value = "Completed";
} else if (editStatus === "ongoing") {
  statusSelect.value = "Ongoing";
} else {
  statusSelect.value = "Upcoming";
}


    // CLEAR & REBUILD — DATA ONLY (NO CALC)
    const photographerList = document.getElementById("photographerList");
    const expenseList = document.getElementById("expenseList");
    const revenuePayments = document.getElementById("revenuePayments");

    photographerList.innerHTML = "";
    expenseList.innerHTML = "";
    revenuePayments.innerHTML = "";

    // REVENUE PAYMENTS
    order.revenuePayments?.forEach(p => {
      const row = document.createElement("div");
      row.className = "payment-row";
      row.innerHTML = `
        <input type="number" value="${p.amount}">
        <select>
          <option ${p.method === "Cash" ? "selected" : ""}>Cash</option>
          <option ${p.method === "Online" ? "selected" : ""}>Online</option>
        </select>
        <input type="date" value="${p.date || ""}">
        <input type="text" value="${p.note || ""}">
        <button type="button" class="delete-payment-btn" aria-label="Delete payment">
          <i class="fa fa-trash" aria-hidden="true"></i>
        </button>
      `;
      revenuePayments.appendChild(row);
    });

    // PHOTOGRAPHERS
    order.photographers?.forEach(p => {
      const clone = document
        .getElementById("photographerTemplate")
        .firstElementChild.cloneNode(true);

      clone.querySelector("input[type='text']").value = p.name;
      clone.querySelector("select").value = p.role;
      clone.querySelector(".photographer-total").value = p.totalAmount;

      const list = clone.querySelector(".payment-list");

      p.payments?.forEach(pay => {
        const row = document.createElement("div");
        row.className = "payment-row";
        row.innerHTML = `
          <input type="number" value="${pay.amount}">
          <select>
            <option ${pay.method === "Cash" ? "selected" : ""}>Cash</option>
            <option ${pay.method === "Online" ? "selected" : ""}>Online</option>
          </select>
          <input type="date" value="${pay.date || ""}">
          <input type="text" value="${pay.note || ""}">
          <button type="button" class="delete-payment-btn" aria-label="Delete payment">
            <i class="fa fa-trash" aria-hidden="true"></i>
          </button>
        `;
        list.appendChild(row);
      });

      clone
        .querySelector(".remove-photographer-btn")
        .addEventListener("click", () => clone.remove());

      photographerList.appendChild(clone);
    });

    // EXPENSES
    order.expenses?.forEach(e => {
      const row = document.createElement("div");
      row.className = "expense-row";
      row.innerHTML = `
        <input type="text" value="${e.description}">
        <input type="number" value="${e.amount}">
        <select>
          <option ${e.method === "Cash" ? "selected" : ""}>Cash</option>
          <option ${e.method === "Online" ? "selected" : ""}>Online</option>
        </select>
        <button type="button" class="delete-expense-btn" aria-label="Delete expense">
          <i class="fa fa-trash" aria-hidden="true"></i>
        </button>
      `;
      expenseList.appendChild(row);
    });

    // Refresh footer totals for loaded edit data
    calculateSummary();
    setFormReadOnly(isViewAction);

  } catch (err) {
    console.error(err);
    alert("Failed to open order");
  }
});

document.addEventListener("click", async (e) => {
  const deleteButton = e.target.closest(".delete-btn");
  if (!deleteButton) return;

  const id = deleteButton.dataset.id;

  if (!id) {
    alert("Invalid order id");
    return;
  }

  if (!confirm("Are you sure you want to delete this order?")) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/orders/${id}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Delete failed");
    }

    alert("Order deleted successfully");

    loadOrdersList();
    loadDashboardSummary();

  } catch (err) {
    console.error(err);
    alert("Failed to delete order");
  }
});

document.addEventListener("click", function (e) {
  if (e.target.closest("#closeFormBtn")) {
    closeOrderForm();
  }
});
document.addEventListener("click", function (e) {
  if (e.target.closest("#cancelOrderBtn")) {
    closeOrderForm();
  }
});

document.addEventListener("DOMContentLoaded", () => {

  const allOrdersTab = document.getElementById("allOrdersTab");
  const ordersExpensesTab = document.getElementById("ordersExpensesTab");
  if (!allOrdersTab || !ordersExpensesTab) return;

  if (isAllOrdersPage) {
    allOrdersTab.classList.add("active");
    ordersExpensesTab.classList.remove("active");
  } else {
    ordersExpensesTab.classList.add("active");
    allOrdersTab.classList.remove("active");
  }

  allOrdersTab.addEventListener("click", () => {
    if (isAllOrdersPage) {
      loadOrdersList("all");
      return;
    }

    sessionStorage.removeItem("ordersListMode");
    window.location.href = "all-orders.html";
  });

  ordersExpensesTab.addEventListener("click", () => {
    if (isAllOrdersPage) {
      window.location.href = "orders.html";
      return;
    }

    ordersExpensesTab.classList.add("active");
    allOrdersTab.classList.remove("active");
  });

});

document.addEventListener("DOMContentLoaded", () => {

  const pendingCard = document.getElementById("pendingEventsCard");
  const ordersListSection = document.getElementById("ordersListSection");

  if (!pendingCard) return;

  pendingCard.addEventListener("click", () => {
    loadOrdersList("pending");

    // Keep user on same tab/page and focus orders section
    if (ordersListSection) {
      ordersListSection.scrollIntoView({ behavior: "smooth" });
    }

    // Optional visual feedback
    pendingCard.classList.add("active-card");
    setTimeout(() => pendingCard.classList.remove("active-card"), 600);
  });

});

function formatStatus(status) {
  if (!status) return "-";

  const value = status.toLowerCase().trim();

  if (value === "completed") return "Completed";
  if (value === "ongoing") return "Ongoing";
  if (value === "upcoming") return "Upcoming";

  return status;
}

function isPendingOrder(order) {
  const status = (order.status || "").toLowerCase().trim();
  return status === "upcoming" || status === "ongoing";
}
async function updatePendingEventsCard() {
  try {
    const res = await fetch("http://localhost:5000/api/orders");
    const orders = await res.json();

    const pendingCount = orders.filter(isPendingOrder).length;

    document.getElementById("cardPendingEvents").textContent = pendingCount;
  } catch (err) {
    console.error("Failed to load pending events count", err);
  }
}