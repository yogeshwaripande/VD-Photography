const API_BASE = "http://localhost:5000";

/* ================= 1. DYNAMIC HEADER & MOBILE NAV ================= */
const loadHeader = async () => {
    try {
        const res = await fetch("../common/header.html");
        const data = await res.text();
        const headerEl = document.getElementById("header");

        if (headerEl) {
            headerEl.innerHTML = data;

            // Header load jhalya nantar elements select kara
            const mobile_nav = document.querySelector(".mobile-nav-btn");
            const nav_header = document.querySelector(".header");

            if (mobile_nav && nav_header) {
                mobile_nav.addEventListener("click", () => {
                    nav_header.classList.toggle("active");
                    
                    // Menu open astana scroll band kara
                    if (nav_header.classList.contains("active")) {
                        document.body.style.overflow = "hidden";
                    } else {
                        document.body.style.overflow = "auto";
                    }
                });
            }
        }
    } catch (err) {
        console.error("Header loading failed:", err);
    }
};

/* ================= 2. PORTFOLIO SLIDER ================= */
async function loadSelectedWorks() {
    const grid = document.getElementById("selectedWorksGrid");
    if (!grid) return;

    try {
        const res = await fetch(`${API_BASE}/api/portfolio`);
        const portfolioData = await res.json();
        
        if (!portfolioData || portfolioData.length === 0) return;

        grid.innerHTML = portfolioData.map(item => {
            const cleanPath = item.image.replace(/\\/g, '/');
            return `
                <div class="portfolio-item">
                    <img src="${API_BASE}/${cleanPath}" alt="Work" loading="lazy">
                </div>
            `;
        }).join('');

        startSlider(grid);
    } catch (err) {
        console.error("Portfolio Load Error:", err);
    }
}

function startSlider(slider) {
    let current = 0;
    setInterval(() => {
        const slides = slider.querySelectorAll(".portfolio-item");
        if (slides.length === 0) return;

        slides.forEach(s => s.classList.remove('active'));
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');

        const slideWidth = slides[0].offsetWidth + 20;
        slider.scrollTo({ left: current * slideWidth, behavior: "smooth" });
    }, 4000);
}

/* ================= 3. INITIALIZE EVERYTHING ================= */
window.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    loadSelectedWorks();
    
    // Footer load
    fetch("../common/footer.html")
        .then(res => res.text())
        .then(data => {
            const footerEl = document.getElementById("footer");
            if (footerEl) footerEl.innerHTML = data;
        });
});

// Scroll Reveal Logic
window.addEventListener("scroll", () => {
    const reveals = document.querySelectorAll(".reveal");
    reveals.forEach((el) => {
        const elementTop = el.getBoundingClientRect().top;
        if (elementTop < window.innerHeight - 120) {
            el.classList.add("active");
        }
    });
});