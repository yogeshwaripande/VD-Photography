const API_URL = "http://localhost:5000";
let allPhotos = [];

// 1. Photos load 
async function fetchPortfolio() {
    const gallery = document.getElementById('portfolio-gallery');
    try {
        const res = await fetch(`${API_URL}/api/portfolio`);
        if (!res.ok) throw new Error("Network response was not ok");
        
        allPhotos = await res.json();
        // Default: 'all' category
        renderGallery(allPhotos, true); 
    } catch (err) {
        console.error("Error fetching portfolio:", err);
        if(gallery) gallery.innerHTML = "<p>Failed to load photos. Please check server connection.</p>";
    }
}

// 2. Gallery render 
function renderGallery(photos, hideLabel = false) {
    const gallery = document.getElementById('portfolio-gallery');
    if (!gallery) return;
    
    gallery.innerHTML = "";

    if (photos.length === 0) {
        gallery.innerHTML = "<p>No photos found in this category.</p>";
        return;
    }

    photos.forEach(photo => {
        const cleanPath = photo.image.replace(/\\/g, '/');
        const imageUrl = `${API_URL}/${cleanPath}`;
        
        const card = document.createElement('div');
        
        card.className = `item ${photo.category.replace(/\s+/g, '-').toLowerCase()}`; 
        
        card.innerHTML = `
            <div class="img-box" style="background: #ffffff; padding: 10px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 15px; break-inside: avoid;">
                <img src="${imageUrl}" style="width: 100%; height: auto; border-radius: 12px; display: block; object-fit: contain;">
            </div>
        `;
        gallery.appendChild(card);
    });
}
// 3. Auto Slider Logic (Images Fade Effect)
function startAutoSlide() {
    const sliders = document.querySelectorAll('.image-slider');
    
    sliders.forEach(slider => {
        const images = slider.querySelectorAll('img');
        let index = 0;

        if (images.length > 1) {
            setInterval(() => {
                images[index].style.opacity = "0";
                index = (index + 1) % images.length;
                images[index].style.opacity = "1";
            }, 3000); 
        }
    });
}

// 4. Filtering Logic
const filterButtons = document.getElementById('filter-buttons');
if (filterButtons) {
    filterButtons.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const filterValue = e.target.getAttribute('data-filter');

            if (filterValue === "all") {
                renderGallery(allPhotos, true);
            } else {
                const filteredPhotos = allPhotos.filter(p => p.category === filterValue);
                renderGallery(filteredPhotos, true); 
            }
        }
    });
}

window.onload = fetchPortfolio;