const brandEl = document.getElementById('watch-brand');
const nameEl = document.getElementById('watch-name');
const descriptionEl = document.getElementById('watch-description');
const priceEl = document.getElementById('watch-price');
const imageEl = document.getElementById('watch-image');
const affiliateEl = document.getElementById('watch-affiliate');
const specsListEl = document.getElementById('watch-specs-list');
const featuresListEl = document.getElementById('watch-features-list');
const thumbsEl = document.getElementById('watch-thumbs');
const dotsEl = document.getElementById('watch-dots');
const longDescriptionEl = document.getElementById('watch-long-description');
const similarEl = document.getElementById('similar-watches');
const backLinkEl = document.querySelector('.back-link');

const params = new URLSearchParams(window.location.search);
const watchId = params.get('id');

function toAssetUrl(path) {
  const value = String(path || '');
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) return value;
  return encodeURI(value);
}

function isLikelySolidBgImage(path) {
  const value = String(path || '').toLowerCase().split('?')[0].split('#')[0];
  return value.endsWith('.jpg') || value.endsWith('.jpeg') || value.endsWith('.webp');
}

function setImageTreatment(el, path) {
  if (!el) return;
  el.classList.toggle('photo-solid', isLikelySolidBgImage(path));
}

function setHeroImageWithFade(path) {
  if (!imageEl) return;
  const nextSrc = toAssetUrl(path);
  if (!nextSrc) return;
  if (imageEl.getAttribute('src') === nextSrc) {
    setImageTreatment(imageEl, path);
    return;
  }
  imageEl.classList.remove('is-fading-in');
  imageEl.classList.add('is-fading-out');

  const onFadeOutDone = () => {
    imageEl.removeEventListener('transitionend', onFadeOutDone);
    imageEl.onload = () => {
      imageEl.classList.remove('is-fading-out');
      imageEl.classList.add('is-fading-in');
      window.setTimeout(() => imageEl.classList.remove('is-fading-in'), 250);
    };
    imageEl.src = nextSrc;
    setImageTreatment(imageEl, path);
  };

  imageEl.addEventListener('transitionend', onFadeOutDone, { once: true });
}

if (!watchId) {
  showNotFound();
} else {
  loadAllWatches()
    .then((watches) => {
      const watch = watches.find((item) => getWatchId(item) === watchId);
      if (!watch) {
        showNotFound();
        return;
      }

      brandEl.textContent = watch.brand || '';
      nameEl.textContent = watch.name || '';
      descriptionEl.textContent = watch.description || 'Check the listing for full specifications and details.';
      if (longDescriptionEl) {
        longDescriptionEl.textContent = watch.longDescription || '';
        longDescriptionEl.style.display = watch.longDescription ? '' : 'none';
      }
      priceEl.textContent = watch.price || '';
      const heroImage = watch.image || watch.img || '';
      imageEl.src = toAssetUrl(heroImage);
      imageEl.alt = watch.name || 'Watch image';
      setImageTreatment(imageEl, heroImage);
      const affiliateUrl = String(watch.affiliateUrl || watch.link || '').trim();
      if (affiliateUrl) {
        affiliateEl.href = affiliateUrl;
        affiliateEl.target = '_blank';
        affiliateEl.rel = 'noopener';
        affiliateEl.classList.remove('is-disabled');
        affiliateEl.removeAttribute('aria-disabled');
        affiliateEl.onclick = null;
      } else {
        affiliateEl.removeAttribute('href');
        affiliateEl.removeAttribute('target');
        affiliateEl.classList.add('is-disabled');
        affiliateEl.setAttribute('aria-disabled', 'true');
        affiliateEl.onclick = (event) => event.preventDefault();
      }
      renderSpecs(watch);
      renderFeatures(watch);
      renderGallery(watch, heroImage);
      renderSimilar(watch, watches);
      updateBackLink(watch);
    })
    .catch(showNotFound);
}

function loadAllWatches() {
  const jsonPromise = fetch('watches.json')
    .then((res) => res.json())
    .catch(() => []);

  const fallback = Array.isArray(window.allWatchesData) ? window.allWatchesData : [];

  return jsonPromise.then((jsonData) => {
    const combined = [...jsonData, ...fallback];
    return combined;
  });
}

function getWatchId(watch) {
  return watch.id || slugify(watch.name || '');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function showNotFound() {
  brandEl.textContent = 'Watch not found';
  nameEl.textContent = '';
  descriptionEl.textContent = 'Please go back and choose a watch from the list.';
  priceEl.textContent = '';
  imageEl.removeAttribute('src');
  affiliateEl.style.display = 'none';
  if (specsListEl) specsListEl.innerHTML = '';
  if (featuresListEl) featuresListEl.innerHTML = '';
  if (thumbsEl) thumbsEl.innerHTML = '';
  if (similarEl) similarEl.innerHTML = '';
  if (longDescriptionEl) {
    longDescriptionEl.textContent = '';
    longDescriptionEl.style.display = 'none';
  }
  if (backLinkEl) {
    backLinkEl.href = 'index.html';
    backLinkEl.textContent = 'Back to Home';
  }
}

function updateBackLink(watch) {
  if (!backLinkEl) return;
  const brand = String(watch.brand || '').toLowerCase();
  const map = {
    casio: { href: 'casio.html', label: 'Back to Casio' },
    seiko: { href: 'seiko.html', label: 'Back to Seiko' },
    citizen: { href: 'citizen.html', label: 'Back to Citizen' },
    orient: { href: 'orient.html', label: 'Back to Orient' }
  };
  const target = map[brand] || { href: 'index.html', label: 'Back to Home' };
  backLinkEl.href = target.href;
  backLinkEl.textContent = target.label;
}

function renderSpecs(watch) {
  if (!specsListEl) return;
  const specs = watch.specs || {};
  const rows = [
    ['Case Size', specs.caseSize || 'TBD'],
    ['Case Thickness', specs.caseThickness || 'TBD'],
    ['Lug Width', specs.lugWidth || 'TBD'],
    ['Case Material', specs.caseMaterial || 'TBD'],
    ['Band Material', specs.bandMaterial || 'TBD'],
    ['Crystal', specs.crystal || 'TBD'],
    ['Movement', specs.movement || 'TBD'],
    ['Power Reserve', specs.powerReserve || 'TBD'],
    ['Water Resistance', specs.waterResistance || 'TBD'],
    ['Weight', specs.weight || 'TBD'],
    ['Made In', specs.madeIn || 'TBD']
  ];

  specsListEl.innerHTML = rows
    .map(
      ([label, value]) =>
        `<li><span class="spec-label">${label}</span><span>${value}</span></li>`
    )
    .join('');
}

function renderFeatures(watch) {
  if (!featuresListEl) return;
  const features = Array.isArray(watch.features) ? watch.features : [];
  if (features.length === 0) {
    featuresListEl.innerHTML = '<li>Details coming soon.</li>';
    return;
  }
  featuresListEl.innerHTML = features
    .map((item) => {
      const icon = getFeatureIcon(item);
      return `
        <li class="feature-item">
          ${icon ? `<img class="feature-icon" src="${toAssetUrl(icon)}" alt="">` : ''}
          <span>${item}</span>
        </li>
      `;
    })
    .join('');
}

function renderGallery(watch, heroImage) {
  if (!thumbsEl) return;
  const gallery = Array.isArray(watch.gallery) && watch.gallery.length > 0
    ? watch.gallery
    : heroImage
      ? [heroImage]
      : [];

  thumbsEl.innerHTML = '';
  if (dotsEl) dotsEl.innerHTML = '';
  let currentIndex = 0;

  const setActiveImage = (index) => {
    currentIndex = index;
    const src = gallery[index];
    setHeroImageWithFade(src);
    if (dotsEl) {
      dotsEl.querySelectorAll('.watch-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }
  };

  gallery.forEach((src) => {
    const img = document.createElement('img');
    img.className = 'watch-thumb';
    img.src = toAssetUrl(src);
    img.alt = watch.name || 'Watch image';
    setImageTreatment(img, src);
    img.addEventListener('click', () => {
      const index = gallery.indexOf(src);
      setActiveImage(index >= 0 ? index : 0);
    });
    thumbsEl.appendChild(img);
  });

  if (dotsEl) {
    gallery.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'watch-dot';
      dot.setAttribute('aria-label', `Show photo ${index + 1}`);
      dot.addEventListener('click', () => setActiveImage(index));
      dotsEl.appendChild(dot);
    });
  }

  if (gallery.length > 0) setActiveImage(currentIndex);
}

function renderSimilar(current, all) {
  if (!similarEl) return;
  const brand = (current.brand || '').toLowerCase();
  const candidates = all
    .filter((w) => w.id !== current.id)
    .filter((w) => (w.brand || '').toLowerCase() === brand);

  const picks = shuffle(candidates).slice(0, 4);
  if (picks.length === 0) {
    similarEl.innerHTML = '<p class="similar-empty">No similar watches yet.</p>';
    return;
  }

  similarEl.innerHTML = picks
    .map((w) => {
      const img = w.image || w.img || '';
      const name = w.name || 'Watch';
      const id = w.id || slugify(w.name || '');
      const solidClass = isLikelySolidBgImage(img) ? ' photo-solid' : '';
      return `
        <a class="similar-card" href="watches.html?id=${encodeURIComponent(id)}">
          <div class="similar-image${solidClass}" style="background-image: url('${toAssetUrl(img)}')"></div>
          <div class="similar-info">
            <span class="similar-name">${name}</span>
            <span class="similar-price">${w.price || ''}</span>
          </div>
        </a>
      `;
    })
    .join('');
}

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getFeatureIcon(feature) {
  const key = String(feature || '').toLowerCase();
  const map = {
    '24-hour subdial': 'photos/icons/24hoursubd.png',
    'alarm': 'photos/icons/alarm.png',
    'analog-digital display': 'photos/icons/analog.png',
    'automatic movement': 'photos/icons/gear.png',
    'automatic with hand-winding and hacking': 'photos/icons/gear.png',
    'auto-calendar': 'photos/icons/calendar.png',
    'backlight': 'photos/icons/brightness.png',
    'blacked-out design': 'photos/icons/blacked out.png',
    'chronograph': 'photos/icons/chronograph.png',
    'compact size': 'photos/icons/compact.png',
    'countdown timer': 'photos/icons/stopwatch.png',
    'daily alarm + hourly time signal': 'photos/icons/alarm.png',
    'date display': 'photos/icons/calendar.png',
    'day + date': 'photos/icons/calendar.png',
    'digital display': 'photos/icons/analog.png',
    'dive styling': 'photos/icons/diving-mask.png',
    'domed mineral crystal': 'photos/icons/crystal-ball.png',
    'dress watch': 'photos/icons/dress watch.png',
    'eco-drive light-powered movement': 'photos/icons/sun-energy.png',
    'everyday wear': 'photos/icons/constant.png',
    'excellent lume': 'photos/icons/beam.png',
    'field watch': 'photos/icons/compass.png',
    'gmt function': 'photos/icons/globe.png',
    'high legibility': 'photos/icons/eye.png',
    'lightweight': 'photos/icons/feather.png',
    'luminous hands': 'photos/icons/star.png',
    'luminous markers': 'photos/icons/star.png',
    'military style': 'photos/icons/soldier.png',
    'minimalist': 'photos/icons/minimal.png',
    'multifunction dial': 'photos/icons/dashboard.png',
    'multiple subdials': 'photos/icons/chronograph.png',
    'one-way rotating bezel': 'photos/icons/bezel.png',
    'oversized case': 'photos/icons/expanding-two-opposite-arrows-diagonal-symbol-of-interface.png',
    'resin strap': 'photos/icons/rubber.png',
    'rotating bezel': 'photos/icons/bezel.png',
    'sapphire crystal': 'photos/icons/diamond.png',
    'screw-down crown': 'photos/icons/settings-gears.png',
    'slim case': 'photos/icons/thin.png',
    'sporty design': 'photos/icons/running.png',
    'stainless steel': 'photos/icons/beam.png',
    'textured dial': 'photos/icons/textile.png',
    'triple sensor': 'photos/icons/compass.png',
    'unidirectional bezel': 'photos/icons/bezel.png',
    'world time': 'photos/icons/globe.png',
    'led backlight': 'photos/icons/brightness.png',
    'led light': 'photos/icons/brightness.png',
    'shock resistant': 'photos/icons/shield.png',
    'solar power': 'photos/icons/sun-energy.png',
    'solar powered': 'photos/icons/sun-energy.png',
    'stopwatch': 'photos/icons/stopwatch.png',
    '200m water resistance': 'photos/icons/water-resistant.png',
    'iso diver': 'photos/icons/water-resistant.png',
    'iso-compliant diver': 'photos/icons/water-resistant.png',
    'water resistance': 'photos/icons/water-resistant.png'
  };

  return map[key] || '';
}

