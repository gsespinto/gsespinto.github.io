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

  // Create or update project title badge with link
  try {
    const firstAnchor = card.querySelector('a');
    const href = firstAnchor ? firstAnchor.getAttribute('href') : '#';
    const previewImg = card.querySelector('.preview-img:not(.overlay)');
    const titleText = (previewImg && previewImg.getAttribute('title')) ||
                      (href ? href.split('/').pop().replace('.html','').replace(/[-_]/g,' ') : 'Project');

    let titleEl = card.querySelector('.project-title');
    if (!titleEl) {
      titleEl = document.createElement('div');
      titleEl.className = 'project-title';
      const a = document.createElement('a');
      a.href = href || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = "View " + titleText + "🔗";
      titleEl.appendChild(a);
      card.appendChild(titleEl);
    } else {
      const a = titleEl.querySelector('a');
      if (a) {
        a.href = href || '#';
        a.textContent = "View " + titleText + "🔗";
      }
    }
  } catch (e) {
    // fail silently if title creation fails
  }

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

/* Build reliable background-overlay elements for GIF playback (store loader/pending state) */
const overlayMap = new WeakMap();
cards.forEach(card => {
  const overlayImg = card.querySelector('.overlay');
  if (!overlayImg) return;
  const bg = document.createElement('div');
  bg.className = 'overlay-bg';
  bg.style.opacity = '0';
  card.appendChild(bg);
  overlayMap.set(card, { img: overlayImg, bg, loader: null, pendingTimeout: null });
});

/* Robust play/stop: preload Image, reveal bg on load (fallback after 300ms), cancel on stop */
function playOverlayBg(card){
  // only block GIF playback for the card that currently has the video expanded
  if (!card || (expandedCard && expandedCard === card)) return;
  const entry = overlayMap.get(card);
  if (!entry) return;
  const { img, bg } = entry;

  // cancel previous loader/timeout
  if (entry.loader) { entry.loader.onload = null; entry.loader.onerror = null; entry.loader = null; }
  if (entry.pendingTimeout) { clearTimeout(entry.pendingTimeout); entry.pendingTimeout = null; }

  const src = (img.getAttribute('src') || '').split('?')[0] + '?_=' + Date.now();
  const loader = new Image();
  entry.loader = loader;

  // fallback: ensure something appears after 300ms
  entry.pendingTimeout = setTimeout(() => {
    if (bg) {
      bg.style.backgroundImage = `url("${src}")`;
      bg.style.opacity = '1';
    }
    entry.pendingTimeout = null;
  }, 300);

  loader.onload = () => {
    if (entry.loader !== loader) return; // cancelled
    if (entry.pendingTimeout) { clearTimeout(entry.pendingTimeout); entry.pendingTimeout = null; }
    if (bg) {
      bg.style.backgroundImage = `url("${src}")`;
      bg.style.opacity = '1';
    }
    entry.loader = null;
  };

  loader.onerror = () => {
    // let fallback timeout handle it
    entry.loader = null;
  };

  // start loading
  loader.src = src;
  overlayMap.set(card, entry);
}

function stopOverlayBg(card){
  const entry = overlayMap.get(card);
  if (!entry) return;
  const { bg } = entry;
  if (entry.loader) { try { entry.loader.onload = null; entry.loader.onerror = null; } catch(e){}; entry.loader = null; }
  if (entry.pendingTimeout) { clearTimeout(entry.pendingTimeout); entry.pendingTimeout = null; }
  if (bg) {
    bg.style.opacity = '0';
    setTimeout(() => { if (bg) bg.style.backgroundImage = ''; }, 350);
  }
  overlayMap.set(card, entry);
}

/* hover/timer behavior: when hovering a card, start timer using data-hover-duration; ignore if video shown */
cards.forEach(card => {
	let tid = null;

	card.addEventListener('mouseenter', (e) => {
		// start overlay animation using background (robust preload)
		// playOverlayBg now internally ignores the hovered card when it is the expanded one,
		// so we can call it unconditionally here.
		playOverlayBg(card);

		// determine duration: prefer card's data-hover-duration, then overlay data-duration, else 2000
		const overlay = card.querySelector('.overlay');
		const duration = parseInt(card.dataset.hoverDuration || (overlay ? overlay.dataset.duration : 2000), 10) || 2000;

		// start timer to expand after duration
		tid = setTimeout(() => expandCard(card), duration);
		timerMap.set(card, tid);
	});

	card.addEventListener('mouseleave', (e) => {
		// cancel pending timer
		const t = timerMap.get(card);
		if (t) {
			clearTimeout(t);
			timerMap.delete(card);
			tid = null;
		}
		// hide overlay bg and cancel loaders
		stopOverlayBg(card);
	});

	// Click behavior:
	// - If the click target is a link inside the video-meta or project-title (the expanded preview), allow navigation.
	// - Otherwise prevent default and open the preview for that card (expandCard).
	card.addEventListener('click', (e) => {
		const target = e.target;
		// allow clicks on links inside the expanded preview meta/title to follow normally
		if (target.closest && (target.closest('.video-meta a') || target.closest('.project-title a'))) {
			return;
		}

		// always prevent navigation and open the preview for the clicked card
		e.preventDefault();
		const t = timerMap.get(card);
		if (t) { clearTimeout(t); timerMap.delete(card); }
		stopOverlayBg(card);
		expandCard(card);
	});

	// ...existing code...
});

/* ensure all overlays stop when expanding a card (so no GIFs visible while video shows) */
const oldExpandCard = expandCard;
expandCard = function(card) {
  // stop all overlay bg first
  cards.forEach(c => stopOverlayBg(c));
  // call original expand logic
  try { oldExpandCard(card); } catch(e) {}
};

/* ensure overlays are stopped on collapse as well */
const oldCollapseAll = collapseAll;
collapseAll = function() {
  // hide overlays before collapsing
  cards.forEach(c => stopOverlayBg(c));
  try { oldCollapseAll(); } catch(e) {}
};

/* collapse on outside click or Escape key */
document.addEventListener("click", (e) => {
  if (!expandedCard) return;
  if (expandedCard.contains(e.target)) return;
  collapseAll();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") collapseAll();
});
