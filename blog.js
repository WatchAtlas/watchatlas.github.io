const BLOG_PAGE_SIZE = 9;
let blogItems = [];
let visibleCount = 0;

setupNavbar();
setupSearch();
setupBlogPage();
setupScrollReveal();

function setupNavbar() {
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (!menuToggle || !navLinks) return;
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
  });
}

function setupBlogPage() {
  const grid = document.getElementById('blog-page-grid');
  const loadMore = document.getElementById('load-more-blogs');
  if (!grid || !loadMore) return;

  const feeds = [
    { name: 'Hodinkee', url: 'https://www.hodinkee.com/articles.rss' },
    { name: 'Fratello', url: 'https://www.fratellowatches.com/feed/' }
  ];

  Promise.all(feeds.map((feed) => fetchRssFeed(feed)))
    .then((allItems) => {
      const mergedItems = allItems
        .flat()
        .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

      if (!mergedItems.length) {
        grid.innerHTML = '<article class="blog-slide is-loading"><p>No articles available right now.</p></article>';
        loadMore.style.display = 'none';
        return;
      }

      filterLiveArticles(mergedItems).then((liveItems) => {
        blogItems = liveItems;

        if (!blogItems.length) {
          grid.innerHTML = '<article class="blog-slide is-loading"><p>No articles available right now.</p></article>';
          loadMore.style.display = 'none';
          return;
        }

        grid.innerHTML = '';
        visibleCount = 0;
        appendNextBlogs(grid, BLOG_PAGE_SIZE);
        updateLoadMoreState(loadMore);
      });
    })
    .catch(() => {
      grid.innerHTML = '<article class="blog-slide is-loading"><p>Unable to load articles right now.</p></article>';
      loadMore.style.display = 'none';
    });

  loadMore.addEventListener('click', (event) => {
    event.preventDefault();
    loadMore.blur();
    appendNextBlogs(grid, BLOG_PAGE_SIZE);
    updateLoadMoreState(loadMore);
  });
}

function appendNextBlogs(container, count) {
  const nextItems = blogItems.slice(visibleCount, visibleCount + count);
  if (!nextItems.length) return;

  const markup = nextItems.map((item, idx) => {
    const image = toAssetUrl(getBlogImage(item));
    const title = escapeHtml(item.title || 'Untitled article');
    const source = escapeHtml(item.sourceName || 'Watch Blog');
    const link = escapeHtml(item.link || '#');
    const delay = Math.min(idx * 55, 275);

    return `
      <a class="blog-page-card reveal-on-scroll" data-delay="${delay}" href="${link}" target="_blank" rel="noopener">
        <div class="blog-page-cover" style="background-image: url('${image}')"></div>
        <div class="blog-page-content">
          <p class="blog-source">${source}</p>
          <h3 class="blog-page-title">${title}</h3>
          <span class="blog-cta">Read Article</span>
        </div>
      </a>
    `;
  }).join('');

  container.insertAdjacentHTML('beforeend', markup);
  visibleCount += nextItems.length;
  setupScrollReveal(container);
}

function updateLoadMoreState(button) {
  if (visibleCount >= blogItems.length) {
    button.style.display = 'none';
  } else {
    button.style.display = 'inline-flex';
  }
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

function filterLiveArticles(items) {
  const candidates = items.slice(0, 120);
  return Promise.all(
    candidates.map((item) =>
      isArticleLive(item.link).then((isLive) => ({ item, isLive }))
    )
  ).then((checked) => {
    const live = checked
      .filter((entry) => entry.isLive)
      .map((entry) => entry.item);

    if (!live.length) return items;
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

function setupSearch() {
  const input = document.getElementById('search-input');
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

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setupScrollReveal(scope) {
  const root = scope || document;
  const targets = root.querySelectorAll('.reveal-on-scroll:not(.is-visible)');
  if (!targets.length) return;

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
    { threshold: 0.2 }
  );

  targets.forEach((el) => observer.observe(el));
}
