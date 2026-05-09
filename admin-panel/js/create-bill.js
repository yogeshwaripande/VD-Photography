
// ================= GLOBAL VARIABLES =================
let itemsDiv = document.getElementById("items");

// Next Number Generation
function getNextNumber() {
    const flow = localStorage.getItem("flow_type");
    let key = (flow === "direct_bill") ? "lastBillNumber" : "lastQtnNumber";
    let prefix = (flow === "direct_bill") ? "BILL-" : "QTN-";
    
    let lastNumber = localStorage.getItem(key) || 1000;
    let nextNumber = parseInt(lastNumber) + 1;
    document.getElementById("qtnNo").value = prefix + nextNumber;
}

window.onload = function () {
    const editData = JSON.parse(localStorage.getItem("quotation_edit"));
    const flow = localStorage.getItem("flow_type");
    itemsDiv.innerHTML = "";

    // Header logic for Bill vs Quotation
    if(flow === "direct_bill") {
        document.getElementById("pageTitle").innerHTML = '<i class="fas fa-receipt" style="color:#10b981;"></i> New Bill';
        document.getElementById("submitBtn").innerHTML = '<i class="fas fa-check-circle"></i> CREATE BILL';
        document.getElementById("noLabel").innerText = "BILL NO";
    }

    if (editData) {
        // Load data for Editing
        document.getElementById("qtnNo").value = editData.qtnNo || "";
        document.getElementById("custName").value = editData.custName || "";
        document.getElementById("custId").value = editData.custId || "";
        document.getElementById("email").value = editData.email || "";
        document.getElementById("phone").value = editData.phone || "";
        document.getElementById("eventType").value = editData.eventType || "";
        document.getElementById("eventDate").value = editData.eventDate || "";
        document.getElementById("endDate").value = editData.endDate || "";
        document.getElementById("location").value = editData.location || "";
        document.getElementById("discount").value = editData.discount || 0;
        document.getElementById("payMode").value = editData.payMode || "Cash";
        document.getElementById("paidAmount").value = editData.paidAmount || 0;
        
        if (editData.items && editData.items.length > 0) {
            editData.items.forEach(item => addItem(item));
        } else {
            addItem();
        }
    } else {
        // Fresh Entry
        getNextNumber();
        addItem();
    }
    calculate();
};

// Add New Item Row
function addItem(itemData = null) {
    let div = document.createElement("div");
    div.className = "item-row";
    div.style = "display: flex; gap: 10px; margin-bottom: 10px; position: relative;";
    
    // Services List (Mothi List)
    const services = [
        "Candid Photography", "Traditional Photography", "Candid Videography", 
        "Traditional Videography", "Cinematography", "Drone Shoot", 
        "Pre-Wedding Shoot", "Maternity Shoot", "Baby Shower Shoot", 
        "Birthday Shoot", "Event Photography", "Album Printing (Karizma)", 
        "Album Printing (Canvera)", "LED Wall", "Crane/Jib", "Live Streaming"
    ];

    let optionsHTML = services.map(s => `<li onmousedown="selectService(this)" style="padding:10px; cursor:pointer; border-bottom:1px solid #eee;">${s}</li>`).join("");

    div.innerHTML = `
        <div style="flex: 2; position:relative;">
            <input type="text" class="desc" placeholder="Service Name" value="${itemData ? itemData.itemName : ""}" onfocus="showList(this)" onblur="hideList(this)" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
            <ul class="desc-list" style="display:none; position:absolute; background:#fff; border:1px solid #ddd; width:100%; z-index:100; list-style:none; padding:0; margin:0; border-radius:5px; max-height:200px; overflow-y:auto; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                ${optionsHTML}
            </ul>
        </div>
        <input type="number" class="qty" placeholder="Qty" style="flex:0.5; padding:8px; border:1px solid #ddd; border-radius:4px;" value="${itemData ? itemData.quantity : ""}" oninput="calculate()">
        <input type="number" class="price" placeholder="Price" style="flex:1; padding:8px; border:1px solid #ddd; border-radius:4px;" value="${itemData ? itemData.price : ""}" oninput="calculate()">
        <button type="button" onclick="deleteItem(this)" style="color:#dc3545; border:none; background:none; cursor:pointer; font-size:18px;"><i class="fas fa-minus-circle"></i></button>
    `;
    itemsDiv.appendChild(div);
}

// Calculations
function calculate() {
    let subtotal = 0;
    document.querySelectorAll(".item-row").forEach(row => {
        let qty = parseFloat(row.querySelector(".qty").value) || 0;
        let price = parseFloat(row.querySelector(".price").value) || 0;
        subtotal += qty * price;
    });

    let discPercent = parseFloat(document.getElementById("discount").value) || 0;
    let grandTotal = subtotal - (subtotal * discPercent / 100);
    let paid = parseFloat(document.getElementById("paidAmount").value) || 0;
    let balance = grandTotal - paid;

    document.getElementById("subTotal").innerText = subtotal.toFixed(2);
    document.getElementById("grandTotal").innerText = grandTotal.toFixed(2);
    document.getElementById("remainingBal").innerText = balance.toFixed(2);
}

// Create/Update Logic
function createQuotation() {
    const custName = document.getElementById("custName").value.trim();
    if (!custName) { alert("Customer Name is required!"); return; }

    let items = [];
    document.querySelectorAll(".item-row").forEach(row => {
        let name = row.querySelector(".desc").value.trim();
        let qty = row.querySelector(".qty").value;
        let price = row.querySelector(".price").value;
        if (name && qty && price) {
            items.push({ itemName: name, quantity: qty, price: price });
        }
    });

    if (items.length === 0) { alert("Add at least one item with Qty and Price!"); return; }

    const flow = localStorage.getItem("flow_type");
    let qtnNo = document.getElementById("qtnNo").value;
    
    // Check if we are updating or creating new
    const editData = JSON.parse(localStorage.getItem("quotation_edit"));
    let quotations = JSON.parse(localStorage.getItem("quotations")) || [];

    let data = {
        id: editData ? editData.id : Date.now(),
        qtnNo: qtnNo,
        custName: custName,
        custId: document.getElementById("custId").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        eventType: document.getElementById("eventType").value,
        eventDate: document.getElementById("eventDate").value,
        endDate: document.getElementById("endDate").value,
        location: document.getElementById("location").value,
        grandTotal: document.getElementById("grandTotal").innerText,
        paidAmount: document.getElementById("paidAmount").value,
        remainingAmount: document.getElementById("remainingBal").innerText,
        payMode: document.getElementById("payMode").value,
        discount: document.getElementById("discount").value,
        subTotal: document.getElementById("subTotal").innerText,
        status: (flow === "direct_bill") ? "Converted to Bill" : "Pending",
        items: items
    };

    if (editData) {
        // Find and Replace old data
        let idx = quotations.findIndex(q => q.id === editData.id);
        quotations[idx] = data;
    } else {
        // Add new
        quotations.push(data);
        // Update counters only for new entries
        let counterKey = (flow === "direct_bill") ? "lastBillNumber" : "lastQtnNumber";
        localStorage.setItem(counterKey, qtnNo.split("-")[1]);
    }

    localStorage.setItem("quotations", JSON.stringify(quotations));
    localStorage.removeItem("quotation_edit"); // Clear edit state
    
    alert(flow === "direct_bill" ? "Bill Created Successfully!" : "Quotation Created Successfully!");
    window.location.href = "index.html"; 
}

// Dropdown Handlers
function showList(input) { input.nextElementSibling.style.display = 'block'; }
function hideList(input) { setTimeout(() => { input.nextElementSibling.style.display = 'none'; }, 250); }
function selectService(li) { 
    let input = li.parentElement.previousElementSibling;
    input.value = li.innerText; 
    li.parentElement.style.display = 'none'; 
    calculate();
}
function deleteItem(btn) { 
    if(document.querySelectorAll(".item-row").length > 1) {
        btn.parentElement.remove(); 
        calculate(); 
    }
}