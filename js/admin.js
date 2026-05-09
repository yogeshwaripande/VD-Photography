const SERVER_URL = 'http://localhost:5000';

// १. Tab Navigation Logic 
function handleNav(event, tabId, url = null) {
    if (url) {
        window.location.href = url;
        return;
    }

    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const tabs = document.querySelectorAll('.nav-item');
    tabs.forEach(tab => tab.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        if (event) event.currentTarget.classList.add('active');
        
        if(tabId === 'photos') {
            fetchAllPhotos(); 
        }
    }
}

// २. Redirect Logic
function switchView(element, viewType) {
    if (viewType === 'portfolio') {
        window.location.href = 'manage_portfolio.html';
    } else if (viewType === 'events') {
        window.location.href = 'manage_event.html';
    }
}

// ३. Admin Frontpage वर सर्व Photos (Portfolio + Events) दाखवणे
async function fetchAllPhotos() {
    const photoGrid = document.getElementById('main-photo-grid');
    if (!photoGrid) return;

    photoGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Loading all photos...</p>';

    try {
        const [portfolioRes, eventsRes] = await Promise.all([
            fetch(`${SERVER_URL}/api/portfolio`),
            fetch(`${SERVER_URL}/api/events`)
        ]);

        const portfolioData = await portfolioRes.json();
        const eventsData = await eventsRes.json();

        photoGrid.innerHTML = ''; 

        let hasAnyPhoto = false;

        if (Array.isArray(portfolioData)) {
            portfolioData.forEach(photo => {
                hasAnyPhoto = true;
                renderPhoto(photo.image, photoGrid);
            });
        }

        if (Array.isArray(eventsData)) {
            eventsData.forEach(event => {
                if (event.photos && Array.isArray(event.photos)) {
                    event.photos.forEach(photoPath => {
                        hasAnyPhoto = true;
                        renderPhoto(photoPath, photoGrid);
                    });
                }
            });
        }

        if (!hasAnyPhoto) {
            photoGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No photos found.</p>';
        }

    } catch (error) {
        photoGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:red;">Connection error!</p>`;
    }
}

// ४. Specific Page (Manage Portfolio/Events) साठी डेटा
async function fetchPhotos(filter) {
    const photoGrid = document.getElementById('main-photo-grid');
    if (!photoGrid) return;
    photoGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Loading...</p>';

    try {
        const res = await fetch(`${SERVER_URL}/api/${filter}`);
        const data = await res.json();
        photoGrid.innerHTML = '';

        if (filter === 'portfolio') {
            data.forEach(p => renderPhoto(p.image, photoGrid));
        } else {
            data.forEach(e => {
                if(e.photos) e.photos.forEach(path => renderPhoto(path, photoGrid));
            });
        }
    } catch (e) {
        photoGrid.innerHTML = '<p style="color:red;">Error!</p>';
    }
}

// ५. CORRECTED: Photo card बनवण्यासाठी फंक्शन (Badges आणि Text काढले आहे)
function renderPhoto(path, container) {
    if (!path) return;
    const cleanPath = path.replace(/\\/g, '/');
    const imageUrl = `${SERVER_URL}/${cleanPath}`;

    const card = document.createElement('div');
    card.className = 'photo-card';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="Photography" onerror="this.parentElement.style.display='none'">
    `;
    container.appendChild(card);
}

// ६. Page load logic
window.onload = () => {
    const path = window.location.pathname;
    
    if (path.includes('manage_portfolio.html')) {
        fetchPhotos('portfolio');
    } 
    else if (path.includes('manage_event.html')) {
        fetchPhotos('events');
    }
    else {
        fetchAllPhotos();
    }
};