window.addEventListener("scroll", function () {
    const headerImage = document.querySelector(".projectheader");
    const scrollY = window.scrollY;

    // Adjust the multiplier to control the parallax strength
    headerImage.style.transform = `translateY(${scrollY * 0.25}px)`;
});