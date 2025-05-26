function applyParallax() {
    const headerImage = document.querySelector(".projectheader");

    // Exit early on small screens
    if (window.innerWidth < 768 || !headerImage) return;

    window.addEventListener("scroll", () => {
      const scrollY = window.scrollY;
      headerImage.style.transform = `translateY(${scrollY * 0.2}px)`;
    });
  }

  // Run after DOM is loaded
  window.addEventListener("DOMContentLoaded", applyParallax);