

function renderList() {
    const listContainer = document.getElementById("listContainer");
    if (!listContainer) return;

    const quotations = JSON.parse(localStorage.getItem("quotations")) || [];
    const activeTab = window.currentTab || 'quotation'; 

    const filteredData = quotations.filter(q => {
        return activeTab === 'quotation' ? q.status !== 'Converted to Bill' : q.status === 'Converted to Bill';
    }).reverse();

    if (filteredData.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open" style="font-size: 40px; color:#ddd; margin-bottom:15px; display:block;"></i>
                <p>No ${activeTab === 'quotation' ? 'quotations' : 'invoices'} found</p>
                <button class="btn btn-black" style="margin:auto; margin-top:15px;" onclick="handleNewEntry('${activeTab === 'quotation' ? 'quotation' : 'direct_bill'}')">
                    + Create New
                </button>
            </div>`;
        return;
    }

    listContainer.innerHTML = "";
    filteredData.forEach(item => {
        const card = document.createElement("div");
        card.className = "data-card";
        
        // Buttons Logic
        let actionButtons = "";
        
        if (activeTab === 'bill') {
            // Invoices sathi: View, Edit, Delete
            actionButtons = `
                <button class="action-icon-btn" onclick="viewRecord(${item.id})" title="View"><i class="fas fa-eye"></i></button>
                <button class="action-icon-btn" onclick="editQuotation(${item.id})" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="action-icon-btn btn-delete" onclick="deleteRecord(${item.id})" title="Delete"><i class="fas fa-trash-alt"></i></button>
            `;
        } else {
            // Quotations sathi: Edit, Delete + Bill It
            actionButtons = `
                <button class="action-icon-btn" onclick="editQuotation(${item.id})" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="action-icon-btn btn-delete" onclick="deleteRecord(${item.id})" title="Delete"><i class="fas fa-trash-alt"></i></button>
                <button onclick="billItAction(${item.id})" style="background:#000; color:#fff; border:none; padding:7px 14px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; margin-left:5px;">Bill It</button>
            `;
        }

        card.innerHTML = `
            <div>
                <div style="font-weight:700; font-size:16px; color:#1a1a1a;">${item.custName}</div>
                <div style="color:#888; font-size:12px; margin-top:4px;">${item.qtnNo} | ${item.eventDate}</div>
            </div>
            <div style="display:flex; align-items:center; gap:20px;">
                <div style="font-weight:700; font-size:15px;">₹${item.grandTotal}</div>
                <div style="display:flex; gap:8px;">
                    ${actionButtons}
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

function switchTab(type) {
    window.currentTab = type;
    sessionStorage.setItem("active_dashboard_tab", type);
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const activeTabEl = document.getElementById(type === 'quotation' ? 'tab-qtn' : 'tab-bill');
    if(activeTabEl) activeTabEl.classList.add('active');
    
    renderList();
}

function deleteRecord(id) {
    if (confirm("Are you sure you want to delete this record?")) {
        let quotations = JSON.parse(localStorage.getItem("quotations")) || [];
        quotations = quotations.filter(q => q.id !== id);
        localStorage.setItem("quotations", JSON.stringify(quotations));
        if(typeof updateStats === "function") updateStats();
        renderList();
    }
}

function billItAction(id) {
    let quotations = JSON.parse(localStorage.getItem("quotations")) || [];
    let idx = quotations.findIndex(q => q.id === id);
    if (idx !== -1) {
        quotations[idx].status = 'Converted to Bill';
        localStorage.setItem("quotations", JSON.stringify(quotations));
        switchTab('bill');
        if(typeof updateStats === "function") updateStats();
    }
}

function viewRecord(id) {
    const quotations = JSON.parse(localStorage.getItem("quotations")) || [];
    const selected = quotations.find(q => q.id === id);
    if (selected) {
        localStorage.setItem("quotation_view", JSON.stringify(selected));
        window.location.href = "quotation.view.html";
    }
}

function editQuotation(id) {
    const quotations = JSON.parse(localStorage.getItem("quotations")) || [];
    const item = quotations.find(q => q.id === id);
    if (item) {
        localStorage.setItem("quotation_edit", JSON.stringify(item));
        window.location.href = "create-bill.html";
    }
}

window.onload = function() {
    const savedTab = sessionStorage.getItem("active_dashboard_tab") || 'quotation';
    switchTab(savedTab);
    if(typeof updateStats === "function") updateStats();
};