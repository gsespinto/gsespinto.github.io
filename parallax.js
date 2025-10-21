function applyParallax() {
  const headerImage = document.querySelector(".projectheader");

  const width = window.innerWidth;
  const height = window.innerHeight;

  // Exit early on vertical windows
  if (width < height || !headerImage) return;

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    headerImage.style.transform = `translateY(${scrollY * 0.2}px)`;
  });
}

// Run after DOM is loaded
window.addEventListener("DOMContentLoaded", applyParallax);