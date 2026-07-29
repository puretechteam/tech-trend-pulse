function populateCategoryFilter() {
  const select = document.getElementById('category-filter');
  const categories = new Set();
  const data = window.allData ? window.allData[window.currentPlatform || 'github'] : [];
  data.forEach(tech => categories.add(tech.category));
  select.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function filterByCategory(category) {
  const data = window.allData ? window.allData[window.currentPlatform || 'github'] : [];
  const filtered = category ? data.filter(tech => tech.category === category) : data;
  renderTechList(filtered);
}

function filterBySearch(query) {
  const data = window.allData ? window.allData[window.currentPlatform || 'github'] : [];
  const q = query.toLowerCase().trim();
  if (!q) return data;
  const filtered = data.filter(tech =>
    tech.name.toLowerCase().includes(q) ||
    tech.description.toLowerCase().includes(q) ||
    tech.tags.some(t => t.toLowerCase().includes(q)) ||
    (tech.platform_data && JSON.stringify(tech.platform_data).toLowerCase().includes(q))
  );
  return filtered;
}

function filterByStatus(status) {
  const data = window.allData ? window.allData[window.currentPlatform || 'github'] : [];
  const filtered = status ? data.filter(tech => tech.status === status) : data;
  return filtered;
}

function filterByTag(tag) {
  const data = window.allData ? window.allData[window.currentPlatform || 'github'] : [];
  const t = tag.toLowerCase().trim();
  if (!t) return data;
  return data.filter(tech => tech.tags.some(techTag => techTag.toLowerCase().includes(t)));
}

function renderTechList(items) {
  const listEl = document.getElementById('tech-list');
  listEl.innerHTML = '';

  if (items.length === 0) {
    listEl.innerHTML = '<li class="empty-state">No technologies match your filters</li>';
    return;
  }

  const sorted = [...items].sort((a, b) => {
    const avgA = a.trend_data[a.trend_data.length - 1];
    const avgB = b.trend_data[b.trend_data.length - 1];
    return avgB - avgA;
  });

  sorted.forEach(tech => {
    const li = document.createElement('li');
    if (window.selectedTech && window.selectedTech.name === tech.name) {
      li.classList.add('selected');
    }
    const avgScore = tech.trend_data[tech.trend_data.length - 1];
    const prevScore = tech.trend_data[tech.trend_data.length - 2];
    const direction = avgScore > prevScore ? 'up' : avgScore < prevScore ? 'down' : 'stable';
    const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '■';
    const dirClass = direction === 'up' ? 'dir-up' : direction === 'down' ? 'dir-down' : 'dir-stable';
    li.innerHTML = `
      <span class="tech-name">
        <span class="status-dot status-${tech.status}"></span>
        ${tech.name}
      </span>
      <span class="tech-meta">
        <span class="trend-arrow ${dirClass}">${arrow}</span>
        <span class="tech-score">${avgScore}</span>
        <span class="sparkline-container"></span>
      </span>
    `;
    li.addEventListener('click', () => {
      if (window.selectTech) window.selectTech(tech);
    });
    listEl.appendChild(li);

    const sparklineContainer = li.querySelector('.sparkline-container');
    if (window.renderSparkline) {
      window.renderSparkline(sparklineContainer, tech.trend_data, direction);
    }
  });
}

function applyAllFilters() {
  const search = document.getElementById('search').value;
  const category = document.getElementById('category-filter').value;
  const status = document.getElementById('status-filter').value;

  let data = window.allData ? window.allData[window.currentPlatform || 'github'] : [];

  data = filterBySearch(data, search);
  if (category) {
    data = data.filter(tech => tech.category === category);
  }
  if (status) {
    data = data.filter(tech => tech.status === status);
  }

  renderTechList(data);
}

function resetFilters() {
  document.getElementById('search').value = '';
  document.getElementById('category-filter').value = '';
  document.getElementById('status-filter').value = '';
  const data = window.allData ? window.allData[window.currentPlatform || 'github'] : [];
  renderTechList(data);
  if (window.updateChart) window.updateChart(window.currentPlatform || 'github');
}

window.filterByCategory = filterByCategory;
window.filterBySearch = filterBySearch;
window.filterByStatus = filterByStatus;
window.filterByTag = filterByTag;
window.renderTechList = renderTechList;
window.resetFilters = resetFilters;
window.populateCategoryFilter = populateCategoryFilter;
window.applyAllFilters = applyAllFilters;