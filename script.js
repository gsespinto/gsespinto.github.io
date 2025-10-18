let previewWrapper = document.querySelector(".previews-wrapper");
const cards = document.querySelectorAll(".previews-wrapper .card");

window.addEventListener("resize", addWrapperClass);
addWrapperClass();

function addWrapperClass(){
    if (!previewWrapper){
        return;
    }
    
    let w = window.innerWidth;
    previewWrapper.classList.remove("mobile-wrapper");
    previewWrapper.classList.remove("desktop-wrapper");
    
    if (w <= 1080){
        previewWrapper.classList.add("mobile-wrapper");
    } else {
        previewWrapper.classList.add("desktop-wrapper");
    }
}

/* resetGif: replace the <img> with a fresh clone to force GIF restart reliably */
function resetGif(element) {
  if (!element || !element.parentNode) return;
  const src = (element.getAttribute('src') || '').split('?')[0];
  const newImg = element.cloneNode(true); // clone attributes (including classes/data-*)
  // force a new request by appending a timestamp query
  newImg.src = src + '?_=' + Date.now();
  // replace the node in DOM so browser treats it as a new animated image
  element.parentNode.replaceChild(newImg, element);
}

/* --- new/updated expand/collapse logic (inline card expansion) --- */

let timerMap = new WeakMap();
let expandedCard = null;

function expandCard(card) {
  if (expandedCard === card) return;
  collapseAll();

  // mark wrapper as expanding so layout centers and overflow is hidden
  if (previewWrapper) previewWrapper.classList.add('expanding');

  // make card expanded and fade + push others
  card.classList.add("expanded");
  const cardsArr = Array.from(cards);
  const idx = cardsArr.indexOf(card);
  cardsArr.forEach((c, i) => {
    if (c === card) return;
    c.classList.add("shrunk");
    c.classList.remove("left","right");
    if (i < idx) c.classList.add("left");
    else c.classList.add("right");
  });

  // ensure there's a container for the iframe
  let container = card.querySelector(".video-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "video-container";
    card.appendChild(container);
  }
  container.setAttribute("aria-hidden", "false");
  container.innerHTML = "";

  const yt = card.dataset.youtubeId;
  if (yt) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(yt)}?autoplay=1&mute=1&rel=0&modestbranding=1`;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.setAttribute("allowfullscreen", "");
    container.appendChild(iframe);
  }

  expandedCard = card;

  // center the expanded card inside the wrapper by scrolling the wrapper
  try {
    const left = card.offsetLeft + (card.offsetWidth / 2) - (previewWrapper.clientWidth / 2);
    previewWrapper.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  } catch (e) {}
}

function collapseAll() {
  if (!expandedCard) return;
  // remove wrapper expanding state
  if (previewWrapper) previewWrapper.classList.remove('expanding');

  cards.forEach(c => {
    c.classList.remove("expanded");
    c.classList.remove("shrunk");
    c.classList.remove("left","right");
    const container = c.querySelector(".video-container");
    if (container) {
      container.setAttribute("aria-hidden", "true");
      container.innerHTML = "";
    }
  });
  expandedCard = null;

  // optionally scroll back a bit to show entire row (smooth)
  try { previewWrapper.scrollTo({ left: 0, behavior: 'smooth' }); } catch(e) {}
}

/* Build reliable background-overlay elements for GIF playback */
const overlayMap = new WeakMap();
cards.forEach(card => {
  const overlayImg = card.querySelector('.overlay');
  if (!overlayImg) return;
  // create overlay-bg div and keep a reference
  const bg = document.createElement('div');
  bg.className = 'overlay-bg';
  bg.style.opacity = '0';
  // store original src for use
  bg.dataset.src = overlayImg.getAttribute('src') || '';
  card.appendChild(bg);
  overlayMap.set(card, { img: overlayImg, bg });
});

/* helper to show/hide animated background */
function playOverlayBg(card) {
  const entry = overlayMap.get(card);
  if (!entry) return;
  const { bg, img } = entry;
  const src = (img.getAttribute('src') || '').split('?')[0];
  bg.style.backgroundImage = `url('${src}?_=${Date.now()}')`;
  bg.style.opacity = '1';
}
function stopOverlayBg(card) {
  const entry = overlayMap.get(card);
  if (!entry) return;
  const { bg } = entry;
  bg.style.opacity = '0';
  // optional: clear background after fade to release memory
  setTimeout(() => { if (bg) bg.style.backgroundImage = ''; }, 400);
}

/* hover/timer behavior: when hovering a card, start timer using overlay data-duration;
   when timer ends, expandCard(card). GIF restart via inline onmouseover resetGif attribute. */
cards.forEach(card => {
  // remove cached overlay reference; query inside handlers so replacements remain live
  let tid = null;

  card.addEventListener("mouseenter", () => {
    // show reliable background GIF animation
    playOverlayBg(card);

    // compute duration from img dataset (fallback)
    const overlay = card.querySelector(".overlay");
    const duration = overlay ? parseInt(overlay.dataset.duration || 2000, 10) : 2000;

    tid = setTimeout(() => expandCard(card), duration);
    timerMap.set(card, tid);
  });

  card.addEventListener("mouseleave", () => {
    const t = timerMap.get(card);
    if (t) {
      clearTimeout(t);
      timerMap.delete(card);
    }
    // hide background GIF when leaving
    stopOverlayBg(card);
  });

  card.addEventListener("click", (e) => {
    if (!expandedCard) {
      e.preventDefault(); // prevent navigation on first click so user can see expanded video
      const t = timerMap.get(card);
      if (t) { clearTimeout(t); timerMap.delete(card); }
      // ensure overlay bg is hidden while expanded video shows
      stopOverlayBg(card);
      expandCard(card);
    }
  });
});

// Ensure overlay backgrounds are hidden when collapsing
const oldCollapseAll = collapseAll;
collapseAll = function() {
  // call original collapse functionality (if defined above)
  // ...existing collapse logic...
  // hide all overlay-bg elements
  cards.forEach(c => stopOverlayBg(c));
  // call original collapse code behavior if needed (we replaced earlier with same name)
  try { oldCollapseAll(); } catch(e) { /* noop if old not present */ }
};

// collapse on outside click or Escape key
document.addEventListener("click", (e) => {
  if (!expandedCard) return;
  if (expandedCard.contains(e.target)) return;
  collapseAll();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") collapseAll();
});
