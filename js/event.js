const API_URL = "http://localhost:5000";
let allEvents = [];

/* =========================================
   1. INITIAL LOAD
   ========================================= */
async function fetchEvents() {
    const grid = document.getElementById("customerGrid");
    if (!grid) return;
    try {
        const res = await fetch(`${API_URL}/api/events`);
        if (!res.ok) throw new Error("Server Error");
        allEvents = await res.json();
        
        renderCustomers(); 
    } catch (err) {
        console.error("Fetch Error:", err);
        grid.innerHTML = `<p style="text-align:center; padding:50px; color:var(--text-muted);">Connection error. Please try again later.</p>`;
    }
}

/* =========================================
   IMAGE PATH HELPER
   ========================================= */
function getFullImageUrl(dbPath) {
    if (!dbPath) return "../img/default-placeholder.jpg";
    let cleanPath = dbPath.replace(/\\/g, "/");
    if (cleanPath.includes("uploads/")) {
        cleanPath = cleanPath.substring(cleanPath.indexOf("uploads/"));
    }
    return `${API_URL}/${cleanPath}`;
}

/* =========================================
   2. LEVEL 1: CUSTOMER VIEW (Full Image Overlay)
   ========================================= */
function renderCustomers() {
    showView(1);
    const grid = document.getElementById("customerGrid");
    if (!grid) return;
    grid.innerHTML = "";
    
    const customers = [...new Set(allEvents.map(e => e.customerName))];

    customers.forEach(name => {
        const firstEvent = allEvents.find(e => e.customerName === name && e.photos?.length > 0);
        const imgSrc = getFullImageUrl(firstEvent ? firstEvent.photos[0] : null);

        const card = document.createElement("div");
        // Level 1
        card.className = "event-card client-style"; 
        card.onclick = () => renderEventTypes(name);

        card.innerHTML = `
            <div class="img-wrapper">
                <img src="${imgSrc}" alt="${name}" loading="lazy">
            </div>
            <div class="event-info">
                <h3>${name}</h3>
                <small>VIEW PORTFOLIO</small>
            </div>
        `;
        grid.appendChild(card);
    });
}

/* =========================================
   3. LEVEL 2: EVENT TYPE VIEW 
   ========================================= */
function renderEventTypes(custName) {
    showView(2);
    const grid = document.getElementById("eventTypeGrid");
    const title = document.getElementById("customerTitle");
    
    if (title) title.innerText = custName;
    if (!grid) return;
    grid.innerHTML = "";
    
    const filtered = allEvents.filter(e => e.customerName === custName);

    filtered.forEach(ev => {
        const imgSrc = getFullImageUrl(ev.photos && ev.photos.length > 0 ? ev.photos[0] : null);

        const card = document.createElement("div");
       
        card.className = "event-card client-style"; 

        card.onclick = () => {
            const client = encodeURIComponent(ev.customerName);
            const eventName = encodeURIComponent(ev.eventName);
            window.location.href = `customer.html?customer=${client}&event=${eventName}`;
        };

        card.innerHTML = `
            <div class="img-wrapper">
                <img src="${imgSrc}" alt="${ev.eventName}" loading="lazy">
            </div>
            <div class="event-info">
                <h3>${ev.eventName}</h3>
                <small>${ev.photos ? ev.photos.length : 0} MOMENTS</small>
            </div>
        `;
        grid.appendChild(card);
    });
}

/* =========================================
   4. NAVIGATION HELPERS
   ========================================= */
function showView(level) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`level${level}`);
    if (target) {
        target.classList.add("active");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

window.goBack = function(level) { 
    showView(level); 
};

window.addEventListener('DOMContentLoaded', fetchEvents);