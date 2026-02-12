// ===== Brand Pages: Load data from watches.json =====
let watches = [];

const brandMap = {
  casio: "casio-cards",
  seiko: "seiko-cards",
  citizen: "citizen-cards",
  orient: "orient-cards"
};

const activeBrand = getActiveBrand();
const activeContainer = activeBrand ? document.getElementById(brandMap[activeBrand]) : null;

function toAssetUrl(path) {
  const value = String(path || '');
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) return value;
  return encodeURI(value);
}

fetch('watches.json')
  .then((res) => res.json())
  .then((data) => {
    watches = Array.isArray(data) ? data : [];
    window.allWatchesData = watches;
    initBrandPage();
    setupSearch();
  })
  .catch(() => {
    if (activeContainer) {
      activeContainer.innerHTML = '<p class="search-empty">Unable to load watches right now.</p>';
    }
  });

function initBrandPage() {
  if (!activeContainer || !activeBrand) return;
  const brandWatches = watches.filter((w) => String(w.brand).toLowerCase() === activeBrand);
  renderCards(brandWatches, activeContainer);
}

function renderCards(list, container) {
  container.innerHTML = '';

  if (list.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'search-empty';
    empty.textContent = 'No watches match your search.';
    container.appendChild(empty);
    return;
  }

  list.forEach((watch) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.style.backgroundImage = `url('${toAssetUrl(watch.image || watch.img || '')}')`;
    const watchId = watch.id || slugify(watch.name);
    const detailsUrl = `watches.html?id=${encodeURIComponent(watchId)}`;
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");
    card.addEventListener("click", () => {
      window.location.href = detailsUrl;
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = detailsUrl;
      }
    });

    card.innerHTML = `
      <div class="card-content">
        <h3 class="watch-name">${watch.name || 'Watch'}</h3>
        <span class="watch-price">${watch.price || ''}</span>
        <div class="card-actions">
          <a class="details-button" href="${detailsUrl}">View Details</a>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function getActiveBrand() {
  return Object.keys(brandMap).find((brand) => document.getElementById(brandMap[brand]));
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// ===== Navbar Toggle (brand pages) =====
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
  });
}

// ===== Search Dropdown (client-side) =====
function setupSearch() {
  const input = document.getElementById('search-input');
  const button = document.getElementById('search-button');
  if (!input) return;

  const wrapper = input.closest('.nav-search');
  if (!wrapper) return;

  const results = document.createElement('div');
  results.className = 'search-results';
  wrapper.appendChild(results);

  const renderResults = (items) => {
    results.innerHTML = '';
    if (items.length === 0) {
      results.classList.remove('show');
      return;
    }
    items.forEach((watch) => {
      const id = watch.id || slugify(watch.name);
      const link = document.createElement('a');
      link.href = `watches.html?id=${encodeURIComponent(id)}`;
      link.className = 'search-result';
      link.innerHTML = `
        <span class="result-name">${watch.name || 'Watch'}</span>
        <span class="result-brand">${watch.brand || ''}</span>
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
    const matches = watches
      .filter((watch) => getSearchText(watch).includes(query))
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
  return [
    watch.name,
    watch.brand,
    watch.price
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
