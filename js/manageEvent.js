const API_URL = "http://localhost:5000";
let allEventsData = [];

// Global state
window.currentCustomerName = "";
window.currentEventName = "";
window.currentEventId = "";

/* ==============================================================
   1. VIEW SWITCH & BACK BUTTON LOGIC
============================================================== */

function updateBackButton(level) {

    const backBtn = document.getElementById("backBtn");
    const uploadBtn = document.getElementById("uploadActionBtn");
    const title = document.getElementById("customerTitle");

    if (!backBtn || !uploadBtn || !title) return;

    if (level === 1) {
        backBtn.style.display = "none";
        uploadBtn.style.display = "inline-block";
        title.innerText = "MANAGE CUSTOMERS";
    }

    if (level === 2) {
        backBtn.style.display = "inline-block";
        uploadBtn.style.display = "none";
        title.innerText = window.currentCustomerName.toUpperCase();
        backBtn.innerText = "⬅ BACK TO CUSTOMERS";
    }

    if (level === 3) {
        backBtn.style.display = "inline-block";
        uploadBtn.style.display = "none";
        title.innerText = window.currentEventName.toUpperCase();
        backBtn.innerText = "⬅ BACK TO EVENTS";
    }
}

window.goBack = function() {

    if (document.getElementById("level3")?.classList.contains("active")) {
        showLevel2(window.currentCustomerName);
    }

    else if (document.getElementById("level2")?.classList.contains("active")) {
        renderLevel1();
    }
};

/* ==============================================================
   2. IMAGE PATH HELPER
============================================================== */
function getFullImageUrl(dbPath) {

    if (!dbPath) return "../img/default-placeholder.jpg";

    let cleanPath = dbPath.replace(/\\/g, "/");

    if (cleanPath.includes("uploads/")) {
        cleanPath = cleanPath.substring(cleanPath.indexOf("uploads/"));
    }

    return `${API_URL}/${cleanPath}`;
}

/* ==============================================================
   3. LEVEL 1 - CUSTOMER VIEW
============================================================== */
window.renderLevel1 = function() {

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));

    const view1 = document.getElementById("level1");
    if (view1) view1.classList.add("active");

    updateBackButton(1);

    const grid = document.getElementById("customerGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const customers = [...new Set(allEventsData.map(e => e.customerName))];

    customers.forEach(name => {

        const entry = allEventsData.find(
            e => e.customerName === name && e.photos?.length > 0
        );

        const imgUrl = getFullImageUrl(entry?.photos?.[0]);

        const card = document.createElement("div");
        card.className = "category-card";

        card.onclick = () => showLevel2(name);

        card.innerHTML = `
            <div class="img-wrapper">
                <img src="${imgUrl}" alt="${name}" loading="lazy">
            </div>

            <div class="overlay">
                <div class="overlay-content">

                    <h3>${name}</h3>

                    <div class="overlay-actions">

                        <button class="edit-btn-sm"
                        onclick="editCustomer('${name}'); event.stopPropagation();">
                        EDIT
                        </button>

                        <button class="delete-btn-sm"
                        onclick="deleteCustomer('${name}'); event.stopPropagation();">
                        DELETE
                        </button>

                    </div>

                </div>
            </div>
        `;

        grid.appendChild(card);
    });
};

/* ==============================================================
   4. LEVEL 2 - EVENT VIEW
============================================================== */
window.showLevel2 = function(custName) {

    window.currentCustomerName = custName;

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));

    const view2 = document.getElementById("level2");
    if (view2) view2.classList.add("active");

    updateBackButton(2);

    const grid = document.getElementById("eventTypeGrid");
    if (!grid) return;

    grid.innerHTML = "";

    allEventsData
        .filter(e => e.customerName === custName)
        .forEach(ev => {

            const imgUrl = getFullImageUrl(ev.photos?.[0]);

            const card = document.createElement("div");
            card.className = "category-card";

            card.onclick = () => showLevel3(ev.eventName, ev.photos, ev._id);

            card.innerHTML = `
                <div class="img-wrapper">
                    <img src="${imgUrl}" alt="${ev.eventName}" loading="lazy">
                </div>

                <div class="overlay">
                    <div class="overlay-content">

                        <h3>${ev.eventName}</h3>

                        <div class="overlay-actions">

                            <button class="edit-btn-sm"
                            onclick="editEvent('${ev._id}','${ev.eventName}');
                            event.stopPropagation();">
                            EDIT
                            </button>

                            <button class="delete-btn-sm"
                            onclick="deleteEvent('${ev._id}');
                            event.stopPropagation();">
                            DELETE
                            </button>

                        </div>

                    </div>
                </div>
            `;

            grid.appendChild(card);
        });
};

/* ==============================================================
   5. LEVEL 3 - PHOTO VIEW
============================================================== */
window.showLevel3 = function(eventName, photos, eventId) {

    window.currentEventName = eventName;
    window.currentEventId = eventId;

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));

    const view3 = document.getElementById("level3");
    if (view3) view3.classList.add("active");

    updateBackButton(3);

    const grid = document.getElementById("galleryGrid");
    if (!grid) return;

    grid.innerHTML = "";

    photos?.forEach(p => {

        const card = document.createElement("div");
        card.className = "photo-card";

        card.innerHTML = `
            <img src="${getFullImageUrl(p)}" loading="lazy">

            <div class="card-actions">
                <button class="delete-btn-sm"
                onclick="deletePhoto('${eventId}','${p}')">
                DELETE PHOTO
                </button>
            </div>
        `;

        grid.appendChild(card);
    });
};

/* ==============================================================
   6. API & CRUD
============================================================== */
window.fetchEvents = async function() {

    try {

        const res = await fetch(`${API_URL}/api/events`);
        allEventsData = await res.json();

        if (document.getElementById("level3")?.classList.contains("active")) {

            const ev = allEventsData.find(e => e._id === window.currentEventId);

            if (ev) showLevel3(ev.eventName, ev.photos, ev._id);

        } else if (document.getElementById("level2")?.classList.contains("active")) {

            showLevel2(window.currentCustomerName);

        } else {

            renderLevel1();
        }

    } catch (err) {
        console.error("Fetch Error:", err);
    }
};

window.deleteCustomer = async function(name) {

    if (!confirm(`Are you sure you want to delete customer "${name}" and all their events?`)) return;

    try {

        await fetch(`${API_URL}/api/events/customer/${encodeURIComponent(name)}`, {
            method: "DELETE"
        });

        await fetchEvents();

    } catch (err) {
        console.error(err);
    }
};
window.deleteEvent = async function(eventId) {

    if (!confirm("Delete this event?")) return;

    try {

        await fetch(`${API_URL}/api/events/${eventId}`, {
            method: "DELETE"
        });

        fetchEvents();

    } catch (err) {
        console.error(err);
    }
};

window.deletePhoto = async function(eventId, photoPath) {

    if (!confirm("Delete this photo?")) return;

    try {

        await fetch(
            `${API_URL}/api/events/${eventId}/photo?path=${encodeURIComponent(photoPath)}`,
            { method: "DELETE" }
        );

        fetchEvents();

    } catch (err) {
        console.error(err);
    }
};
window.editCustomer = function(oldName) {

    const newName = prompt("New Customer Name:", oldName);

    if (!newName || newName === oldName) return;

    fetch(`${API_URL}/api/events/customer/${encodeURIComponent(oldName)}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ newName })
    }).then(fetchEvents);
};

window.editEvent = function(eventId, oldName) {

    const newName = prompt("Change Event Name:", oldName);

    if (!newName || newName === oldName) return;

    fetch(`${API_URL}/api/events/${eventId}`, {

        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName: newName })

    }).then(fetchEvents);
};

/* ==============================================================
   7. MODAL & UPLOAD
============================================================== */
window.toggleModal = function(show) {

    const modal = document.getElementById("eventModal");
    if (!modal) return;

    modal.style.display = show ? "flex" : "none";

    if (!show) {

        document.getElementById("eventForm")?.reset();

        const otherContainer = document.getElementById("otherEventTypeContainer");

        if (otherContainer) otherContainer.style.display = "none";
    }
};

const eventForm = document.getElementById("eventForm");

if (eventForm) {

    eventForm.onsubmit = async function(e) {

        e.preventDefault();

        const btn = document.getElementById("uploadBtn");

        if (!btn) return;

        const originalText = btn.innerText;

        btn.innerText = "UPLOADING... ⏳";
        btn.disabled = true;

        const formData = new FormData(this);

        const eventTypeSelect = document.getElementById("eventType");

        if (eventTypeSelect?.value === "Other") {

            const otherName = document.getElementById("otherEventInput").value;

            if (otherName) formData.set("eventName", otherName);
        }

        try {

            const response = await fetch(`${API_URL}/api/events/upload`, {
                method: "POST",
                body: formData
            });

            if (response.ok) {

                alert("Upload Successful! ✅");

                toggleModal(false);

                fetchEvents();

            } else {

                alert("Upload failed. Check file size/format.");
            }

        } catch (err) {

            alert("Connection error!");

        } finally {

            btn.innerText = originalText;
            btn.disabled = false;
        }
    };
}

/* ==============================================================
   8. EVENT TYPE OTHER INPUT
============================================================== */
const eventTypeEl = document.getElementById("eventType");

if (eventTypeEl) {

    eventTypeEl.onchange = function() {

        const otherContainer =
            document.getElementById("otherEventTypeContainer");

        if (otherContainer) {

            otherContainer.style.display =
                this.value === "Other" ? "block" : "none";
        }
    };
}

window.onload = fetchEvents;