// ===== Slider Logic =====
let items = document.querySelectorAll('.slider .list .item');
let nextBtn = document.getElementById('next');
let prevBtn = document.getElementById('prev');
let totalItems = items.length;
let currentIndex = 0;
let autoSlideInterval = 10000;

function showSlide(index) {
  items.forEach((item, i) => {
    item.classList.remove('active');
    if (i === index) item.classList.add('active');
  });
}

function nextSlide() {
  currentIndex++;
  if (currentIndex >= totalItems) currentIndex = 0;
  showSlide(currentIndex);

setupSliderItemLinks();

function setupSliderItemLinks() {
  const sliderItems = document.querySelectorAll('.slider .list .item');
  sliderItems.forEach((item) => {
    const brandLink = item.querySelector('.slide-button');
    if (!brandLink) return;
    const href = brandLink.getAttribute('href');
    if (!href) return;

    item.setAttribute('data-href', href);
    item.style.cursor = 'pointer';

    item.addEventListener('click', (event) => {
      if (event.target.closest('a, button, .arrows')) return;
      window.location.href = href;
    });
  });
}
}

function prevSlide() {
  currentIndex--;
  if (currentIndex < 0) currentIndex = totalItems - 1;
  showSlide(currentIndex);
}

nextBtn.addEventListener('click', () => { nextSlide(); resetAutoSlide(); });
prevBtn.addEventListener('click', () => { prevSlide(); resetAutoSlide(); });

let slideInterval = setInterval(nextSlide, autoSlideInterval);
function resetAutoSlide() {
  clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, autoSlideInterval);
}

showSlide(currentIndex);

// ===== Navbar Toggle =====
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('show');
});

// ===== Search Dropdown (client-side) =====
setupSearch();

function setupSearch() {
  const input = document.getElementById('search-input');
  const button = document.getElementById('search-button');
  if (!input) return;

  const wrapper = input.closest('.nav-search');
  if (!wrapper) return;

  const results = document.createElement('div');
  results.className = 'search-results';
  wrapper.appendChild(results);

  let dataCache = [];
  fetch('watches.json')
    .then((res) => res.json())
    .then((data) => { dataCache = Array.isArray(data) ? data : []; })
    .catch(() => { dataCache = []; });

  const renderResults = (items) => {
    results.innerHTML = '';
    if (items.length === 0) {
      results.classList.remove('show');
      return;
    }
    items.forEach((watch) => {
      const id = watch.id || slugify(watch.name);
      const imageUrl = toAssetUrl(
        watch.image ||
        (Array.isArray(watch.images) ? watch.images.find(Boolean) : '')
      );
      const link = document.createElement('a');
      link.href = `watches.html?id=${encodeURIComponent(id)}`;
      link.className = 'search-result';
      link.innerHTML = `
        <span class="result-thumb-wrap">
          ${imageUrl ? `<img class="result-thumb" src="${imageUrl}" alt="${watch.name || 'Watch'}">` : '<span class="result-thumb result-thumb-fallback"></span>'}
        </span>
        <span class="result-meta">
          <span class="result-name">${watch.name || 'Watch'}</span>
          <span class="result-brand">${watch.brand || ''}</span>
        </span>
      `;
      results.appendChild(link);
    });
    results.classList.add('show');
  };

  const search = () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      results.classList.remove('show');
      return;
    }
    const normalizedQuery = normalizeSearch(query);
    const matches = dataCache
      .filter((watch) => {
        const text = getSearchText(watch);
        if (text.includes(query)) return true;
        if (!normalizedQuery) return false;
        return normalizeSearch(text).includes(normalizedQuery);
      })
      .slice(0, 8);
    renderResults(matches);
  };

  if (button) {
    button.addEventListener('click', search);
  }
  input.addEventListener('input', search);
  input.addEventListener('focus', search);
  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) {
      results.classList.remove('show');
    }
  });
}

function getSearchText(watch) {
  const featureText = Array.isArray(watch.features) ? watch.features.join(' ') : watch.features;
  const specText = watch.specs ? Object.values(watch.specs).join(' ') : '';
  return [
    watch.id,
    watch.name,
    watch.brand,
    watch.price,
    watch.reference,
    watch.description,
    watch.longDescription,
    featureText,
    specText
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function normalizeSearch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function toAssetUrl(path) {
  const value = String(path || '');
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) return value;
  return encodeURI(value);
}

// ===== Watch Cards (data-driven) =====
const cardsContainer = document.getElementById('watch-cards');

if (cardsContainer) {
  fetch('watches.json')
    .then((res) => res.json())
    .then((watches) => renderWatchCards(watches, cardsContainer))
    .catch(() => {
      cardsContainer.innerHTML = '<p class="load-error">Unable to load watches right now.</p>';
    });
}

function renderWatchCards(watches, container) {
  container.innerHTML = '';
  const popular = pickRandomByBrands(watches, ['Casio', 'Seiko', 'Citizen', 'Orient']);
  const selected = popular.length > 0 ? popular : watches.slice(0, 4);

  selected.forEach((watch) => {
    const card = document.createElement('a');
    card.className = 'card';
    card.href = `watches.html?id=${encodeURIComponent(watch.id)}`;
    card.style.backgroundImage = `url('${toAssetUrl(watch.image)}')`;

    card.innerHTML = `
      <div class="card-content">
        <h3 class="watch-name">${watch.name}</h3>
        <span class="watch-price">${watch.price}</span>
      </div>
    `;

    container.appendChild(card);
  });
}

function pickRandomByBrands(watches, brands) {
  const result = [];
  brands.forEach((brand) => {
    const pool = watches.filter((w) => String(w.brand || '').toLowerCase() === brand.toLowerCase());
    if (pool.length === 0) return;
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool[index]);
  });
  return result;
}

// ===== Homepage Blog Slider (Hodinkee) =====
setupBlogSlider();
setupScrollReveal();
setupPopularSection();

function setupBlogSlider() {
  const slider = document.getElementById('blog-slider');
  const dots = document.getElementById('blog-dots');
  if (!slider || !dots) return;

  const feeds = [
    { name: 'Hodinkee', url: 'https://www.hodinkee.com/articles.rss' },
    { name: 'Fratello', url: 'https://www.fratellowatches.com/feed/' }
  ];

  Promise.all(feeds.map((feed) => fetchRssFeed(feed)))
    .then((allItems) => {
      const items = allItems
        .flat()
        .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

      if (items.length === 0) {
        renderBlogError(slider, dots, 'No articles available right now.');
        return;
      }

      filterLiveArticles(items, 10).then((liveItems) => {
        if (liveItems.length === 0) {
          renderBlogError(slider, dots, 'No articles available right now.');
          return;
        }
        renderBlogSlides(slider, dots, liveItems);
      });
    })
    .catch(() => {
      renderBlogError(slider, dots, 'Unable to load articles right now.');
    });
}

function fetchRssFeed(feed) {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
  return fetch(apiUrl)
    .then((res) => res.json())
    .then((data) => {
      const items = Array.isArray(data.items) ? data.items : [];
      return items.map((item) => ({ ...item, sourceName: feed.name }));
    })
    .catch(() => []);
}

function filterLiveArticles(items, maxCount) {
  const candidates = items.slice(0, Math.max(maxCount * 3, maxCount));
  return Promise.all(
    candidates.map((item) =>
      isArticleLive(item.link).then((isLive) => ({ item, isLive }))
    )
  ).then((checked) => {
    const live = checked
      .filter((entry) => entry.isLive)
      .map((entry) => entry.item)
      .slice(0, maxCount);

    // Fallback: if probing fails due browser restrictions, keep original set.
    if (!live.length) return items.slice(0, maxCount);
    return live;
  });
}

function isArticleLive(url) {
  const link = String(url || '').trim();
  if (!link) return Promise.resolve(false);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3000);

  return fetch(link, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
    .then(() => true)
    .catch(() => false)
    .finally(() => window.clearTimeout(timeout));
}

function renderBlogError(slider, dots, message) {
  slider.innerHTML = `
    <article class="blog-slide is-loading">
      <p>${message}</p>
    </article>
  `;
  dots.innerHTML = '';
}

function renderBlogSlides(slider, dots, items) {
  slider.innerHTML = '';
  dots.innerHTML = '';

  let activeIndex = 0;
  let timer = null;

  const slides = items.map((item, index) => {
    const link = String(item.link || '#');
    const title = String(item.title || 'Untitled article');
    const image = getBlogImage(item);

    const article = document.createElement('article');
    article.className = `blog-slide${index === 0 ? ' active' : ''}`;
    article.innerHTML = `
      <a class="blog-link" href="${link}" target="_blank" rel="noopener">
        <div class="blog-cover" style="background-image: url('${toAssetUrl(image)}')"></div>
        <div class="blog-content">
          <p class="blog-source">${item.sourceName || 'Watch Blog'}</p>
          <h3 class="blog-title">${title}</h3>
          <span class="blog-cta">Read Article</span>
        </div>
      </a>
    `;
    slider.appendChild(article);
    return article;
  });

  const dotEls = items.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `blog-dot${index === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Show article ${index + 1}`);
    dot.addEventListener('click', () => {
      setActive(index);
      restartTimer();
    });
    dots.appendChild(dot);
    return dot;
  });

  function setActive(index) {
    activeIndex = index;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    dotEls.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  function nextSlide() {
    const next = (activeIndex + 1) % slides.length;
    setActive(next);
  }

  function restartTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(nextSlide, 9000);
  }

  restartTimer();
}

function getBlogImage(item) {
  const thumbnail = String(item.thumbnail || '').trim();
  if (thumbnail) return thumbnail;

  const enclosure = item.enclosure && item.enclosure.link ? String(item.enclosure.link).trim() : '';
  if (enclosure) return enclosure;

  const description = String(item.description || '');
  const match = description.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1]) return match[1];

  return '';
}

function setupPopularSection() {
  const grid = document.getElementById('budget-grid');
  if (!grid) return;

  const popularIds = [
    'casio-ae1200',
    'seiko-5-srpd51-automatic',
    'citizen-brycen-chronograph-ca0649-06x',
    'orient-mako-iii-ra-aa0008b19b'
  ];

  fetch('watches.json')
    .then((res) => res.json())
    .then((data) => {
      const watches = Array.isArray(data) ? data : [];
      const selected = popularIds
        .map((id) => watches.find((w) => String(w.id) === id))
        .filter(Boolean);
      renderBudgetCards(grid, selected);
    })
    .catch(() => {
      grid.innerHTML = '<p class="budget-empty">Unable to load popular watches right now.</p>';
    });
}

function renderBudgetCards(container, watches) {
  if (!watches.length) {
    container.innerHTML = '<p class="budget-empty">No watches in this budget right now. Try another range.</p>';
    return;
  }

  container.innerHTML = watches
    .map((watch) => {
      const id = watch.id || slugify(watch.name || '');
      const brandLabel = watch.brand || 'Brand';
      return `
        <a class="budget-card" data-watch-id="${id}" href="watches.html?id=${encodeURIComponent(id)}" style="background-image: url('${toAssetUrl(watch.image)}')">
          <div class="budget-card-content">
            <h3 class="budget-watch-name">${brandLabel}</h3>
          </div>
        </a>
      `;
    })
    .join('');
}

function setupScrollReveal() {
  const targets = document.querySelectorAll('.reveal-on-scroll');
  if (!targets.length) return;

  let started = false;
  const startObserver = () => {
    if (started) return;
    started = true;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const delay = Number(el.getAttribute('data-delay') || 0);
          window.setTimeout(() => el.classList.add('is-visible'), delay);
          observer.unobserve(el);
        });
      },
      { threshold: 0.35 }
    );

    targets.forEach((el) => observer.observe(el));
  };

  window.addEventListener('scroll', startObserver, { once: true, passive: true });
}
