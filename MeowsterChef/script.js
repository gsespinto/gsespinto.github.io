// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// Disable smooth scroll temporarily on page reload
window.onload = function () {
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  setTimeout(function () {
    document.documentElement.style.scrollBehavior = 'smooth';
  }, 100);
};



let slideIndex = 0;
let slides = document.getElementsByClassName("mySlides");
let dots = document.getElementsByClassName("dot");
let lastPlayingVideo = null;
showSlides(slideIndex);


function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  if (n >= slides.length) {
    slideIndex = 0
  }
  if (n < 0) {
    slideIndex = slides.length - 1
  }
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }

  if (lastPlayingVideo) {
    var src = lastPlayingVideo.src;
    lastPlayingVideo.src = src;
    lastPlayingVideo = null;
  }

  slides[slideIndex].style.display = "block";
  dots[slideIndex].className += " active";
  lastPlayingVideo = slides[slideIndex].querySelector("iframe");
}




let vertical = null

function updateBackgroundOverlayImage() {
  if (window.innerWidth > window.innerHeight) {
    if (vertical === false)
      return;
    document.body.style.backgroundImage = "url('MeowsterChef/Resources/background.png')";
    vertical = false
  } else {
    if (vertical === true)
      return;
    document.body.style.backgroundImage = "url('MeowsterChef/Resources/background-vertical.png')";
    vertical = true
  }
}
window.addEventListener('resize', updateBackgroundOverlayImage);
updateBackgroundOverlayImage();

function updateBackgroundScroll() {
  const backgroundOffset = window.scrollY * 0.2; // Adjust the scroll rate (0.8 for 80%)
  document.body.style.backgroundPositionY = `${backgroundOffset}px`;
  requestAnimationFrame(updateBackgroundScroll);
}

requestAnimationFrame(updateBackgroundScroll);