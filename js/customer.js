// ================= GLOBAL CONFIG =================
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = "http://localhost:5000"; 
}

const eventTitle = document.getElementById("eventTitle");
const clientName = document.getElementById("clientName");
const gallery = document.getElementById("allPhotos");
const selectAllBtn = document.getElementById("selectAllBtn");
const downloadBtn = document.getElementById("downloadSelectedBtn");
const selectedCountSpan = document.getElementById("selectedCount");

const params = new URLSearchParams(window.location.search);
const customerNameParam = params.get("customer") || "Customer";
const eventNameParam = params.get("event") || "Event";

// Initial Load
document.addEventListener("DOMContentLoaded", async () => {
    if (!customerNameParam || !eventNameParam) return;

    try {
        if(eventTitle) eventTitle.innerText = eventNameParam;
        if(clientName) clientName.innerText = `Client: ${customerNameParam}`;
        
        const res = await fetch(`${API_BASE_URL}/api/events`);
        const eventsData = await res.json();
        
        const currentEvent = eventsData.find(e => 
            e.customerName === customerNameParam && e.eventName === eventNameParam
        );

        if (currentEvent && currentEvent.photos) {
            renderPhotos(currentEvent.photos);
        }
    } catch (err) {
        console.error("Load Error:", err);
    }
});
//photo render 
function renderPhotos(photoPaths) {
    if(!gallery) return;
    gallery.innerHTML = "";
    
    photoPaths.forEach((path) => {
        const cleanPath = path.replace(/\\/g, '/');
        const imageUrl = `${API_BASE_URL}/${cleanPath}`;
        
        const div = document.createElement("div");
        div.className = "photo-card";
        div.onclick = () => toggleSelection(div);

        div.innerHTML = `
            <div class="select-overlay">
                <input type="checkbox" class="photo-checkbox" data-url="${imageUrl}" onclick="event.stopPropagation()">
            </div>
            <img src="${imageUrl}" loading="lazy">
            <div class="selection-indicator">✓</div>
        `;
        gallery.appendChild(div);
    });
}

function toggleSelection(card) {
    const checkbox = card.querySelector('.photo-checkbox');
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }
    updateUI();
}
//updation
function updateUI() {
    const selected = document.querySelectorAll('.photo-checkbox:checked');
    const count = selected.length;
    
    if (selectedCountSpan) selectedCountSpan.innerText = count;
    if (downloadBtn) {
        downloadBtn.style.display = count > 0 ? "inline-flex" : "none";
    }
}

if (selectAllBtn) {
    selectAllBtn.onclick = () => {
        const cards = document.querySelectorAll('.photo-card');
        if (cards.length === 0) return;

        const anyUnselected = Array.from(cards).some(card => {
            const cb = card.querySelector('.photo-checkbox');
            return cb && !cb.checked;
        });
        
        cards.forEach(card => {
            const cb = card.querySelector('.photo-checkbox');
            if (cb) {
                cb.checked = anyUnselected; 
                if (anyUnselected) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            }
        });
        selectAllBtn.innerText = anyUnselected ? "Deselect All" : "Select All";
        
        updateUI();
    };
}
//download logic
if (downloadBtn) {
    downloadBtn.onclick = async () => {
        const selected = document.querySelectorAll('.photo-checkbox:checked');
        if (selected.length === 0) return;

        downloadBtn.disabled = true;
        downloadBtn.innerText = "Processing...";

        for (let i = 0; i < selected.length; i++) {
            const url = selected[i].getAttribute('data-url');
            
            const fileName = `${customerNameParam}_${eventNameParam}_${i+1}.jpg`;

            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName; 
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } catch (err) {
                console.error("Download fail:", url);
            }
            await new Promise(res => setTimeout(res, 500));
        }

        downloadBtn.disabled = false;
        downloadBtn.innerText = `Download Selected (${selected.length})`;
    };
}