fetch("common/header.html")
.then(res => res.text())
.then(data => {
  document.getElementById("header").innerHTML = data;

  const mobile_nav = document.querySelector(".mobile-nav-btn");
  const nav_header = document.querySelector(".header");

  if (mobile_nav && nav_header) {
    mobile_nav.addEventListener("click", () => {
      nav_header.classList.toggle("active");
    });
  }
});


window.addEventListener("load", () => {

  /* ================= HERO ================= */
  const hero = document.querySelector(".hero");
  if (hero) hero.classList.add("loaded");


  /* ================= PORTFOLIO AUTOPLAY ================= */

  const slider = document.querySelector('.portfolio-grid');
  const slides = document.querySelectorAll('.portfolio-item');

  if (!slider || slides.length === 0) return;

  let current = 0;
  const gap = 30;
  const interval = 2500;

  function autoPlay() {
    current++;

    if (current >= slides.length) {
      current = 0;
    }

    const slideWidth = slides[0].offsetWidth + gap;

    slider.scrollTo({
      left: current * slideWidth,
      behavior: 'smooth'
    });
  }

  let auto = setInterval(autoPlay, interval);

  slider.addEventListener('mouseenter', () => clearInterval(auto));
  slider.addEventListener('mouseleave', () => auto = setInterval(autoPlay, interval));
  slider.addEventListener('touchstart', () => clearInterval(auto));
  slider.addEventListener('touchend', () => auto = setInterval(autoPlay, interval));
});


/* ================= CURSOR EFFECT ================= */

const cursor = document.querySelector(".cursor");
const targets = document.querySelectorAll(".work, .cursor-target");

if (cursor) {
  document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
  });

  targets.forEach(el => {
    el.addEventListener("mouseenter", () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
    });

    el.addEventListener("mouseleave", () => {
      cursor.style.transform = "translate(-50%, -50%) scale(0)";
    });
  });
}// ================= SCROLL REVEAL =================

const reveals = document.querySelectorAll(".reveal");

const revealOnScroll = () => {
  reveals.forEach(el => {
    const windowHeight = window.innerHeight;
    const elementTop = el.getBoundingClientRect().top;
    const revealPoint = 120;

    if (elementTop < windowHeight - revealPoint) {
      el.classList.add("active");
    }
  });
};

window.addEventListener("scroll", revealOnScroll);
revealOnScroll();

fetch("common/footer.html")
.then(res => res.text())
.then(data => {
  document.getElementById("footer").innerHTML = data;
});
