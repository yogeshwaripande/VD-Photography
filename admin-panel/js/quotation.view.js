

document.addEventListener("DOMContentLoaded", function () {
    loadQuotationData();
});

let currentQuotation = null;

function loadQuotationData() {
    try {
        let data = JSON.parse(localStorage.getItem("quotation_view"));
        
        if (!data) {
            alert("No data found! Redirecting...");
            window.location.href = "index.html";
            return;
        }

        currentQuotation = data;

        // Basic Info mapping
        document.getElementById("view_qtnNo").innerText = currentQuotation.qtnNo || "#0000";
        document.getElementById("view_custName").innerText = currentQuotation.custName || "-";
        document.getElementById("view_phone").innerText = "Mob: " + (currentQuotation.phone || "-");
        document.getElementById("view_location").innerText = "Location: " + (currentQuotation.location || "-");
        document.getElementById("view_eventDate").innerText = currentQuotation.eventDate || "-";
        document.getElementById("view_eventType").innerText = currentQuotation.eventType || "-";

        // Items Rendering
        let itemsHtml = "";
        if (currentQuotation.items && currentQuotation.items.length > 0) {
            currentQuotation.items.forEach(item => {
                itemsHtml += `
                <tr>
                    <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">${item.itemName}</td>
                    <td style="text-align: right; padding: 12px 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                </tr>`;
            });
        }
        document.getElementById("view_items_body").innerHTML = itemsHtml;

        // Initial Payment Logic with Date/Time
        if (!currentQuotation.paymentHistory || currentQuotation.paymentHistory.length === 0) {
            let now = new Date();
            let timestamp = now.toLocaleDateString('en-GB') + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let initialAmt = parseFloat(currentQuotation.paidAmount || 0);
            
            currentQuotation.paymentHistory = [{
                date: timestamp,
                mode: currentQuotation.payMode || "Cash",
                amount: initialAmt
            }];
        }

        updateUI();
    } catch (error) { console.error("Error:", error); }
}

function updateUI() {
    let q = currentQuotation;
    let totalPaid = parseFloat(q.paidAmount || 0);
    let gTotal = parseFloat(q.grandTotal || 0);
    let remaining = gTotal - totalPaid;

    document.getElementById("view_subTotal").innerText = "₹" + (q.subTotal || 0);
    document.getElementById("view_discAmt").innerText = "₹" + (q.discAmt || 0);
    document.getElementById("view_grandTotal").innerText = "₹" + gTotal;
    document.getElementById("view_paidAmt").innerText = "₹" + totalPaid;
    document.getElementById("view_remAmt").innerText = "₹" + (remaining < 0 ? 0 : remaining);

    let logsHtml = "";
    q.paymentHistory.forEach(log => {
        logsHtml += `<tr><td>${log.date}</td><td>${log.mode}</td><td style="text-align: right;">₹${log.amount}</td></tr>`;
    });
    document.getElementById("payment_logs_body").innerHTML = logsHtml;
}

function openPaymentModal() { document.getElementById("paymentModal").style.display = "block"; }
function closePaymentModal() { document.getElementById("paymentModal").style.display = "none"; }

function savePayment() {
    let amt = parseFloat(document.getElementById("newPayAmount").value) || 0;
    let mode = document.getElementById("payModeInput").value;
    if (amt <= 0) { alert("Enter valid amount!"); return; }

    let now = new Date();
    let timestamp = now.toLocaleDateString('en-GB') + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    currentQuotation.paymentHistory.push({ date: timestamp, mode: mode, amount: amt });
    currentQuotation.paidAmount = (parseFloat(currentQuotation.paidAmount || 0) + amt);

    let allQuotations = JSON.parse(localStorage.getItem("quotations")) || [];
    let idx = allQuotations.findIndex(x => x.qtnNo === currentQuotation.qtnNo);
    if (idx !== -1) {
        allQuotations[idx] = currentQuotation;
        localStorage.setItem("quotations", JSON.stringify(allQuotations));
    }
    localStorage.setItem("quotation_view", JSON.stringify(currentQuotation));

    updateUI();
    closePaymentModal();
    document.getElementById("newPayAmount").value = "";
}

// FIX: Optimized PDF Download Function
async function downloadPDF() {
    const element = document.getElementById('invoiceArea');
    const btn = document.getElementById('downloadBtn');
    btn.innerText = "Generating...";
    
    const opt = {
        margin: [10, 5, 10, 5], // Top, Left, Bottom, Right
        filename: `Quotation_${currentQuotation.custName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            width: element.offsetWidth // Right side crop fix
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // Auto-page logic
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error("PDF Error:", err);
    } finally {
        btn.innerText = "DOWNLOAD PDF";
    }
}