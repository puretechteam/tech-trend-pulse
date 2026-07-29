let allData = {};
let currentPlatform = 'github';
let selectedTech = null;
let detailChart = null;

const TECH_COLORS = [
  '#4e79a7',
  '#f28e2b',
  '#e15759',
  '#76b7b2',
  '#59a14f',
  '#edc948',
  '#b07aa1',
  '#ff9da7',
  '#9c755f',
  '#bab0ac',
  '#a0cbe8',
  '#ff9999',
  '#98df8a',
  '#d62728',
  '#1f77b4',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
  '#636efa',
  '#ef553b',
  '#00cc96',
  '#ab63fa',
  '#ffa15a'
];

function getTechColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TECH_COLORS[Math.abs(hash) % TECH_COLORS.length];
}

async function init() {
  let usedCachedData = false;
  try {
    const response = await fetch('/api/data');
    allData = await response.json();
    window.allData = allData;
  } catch (err) {
    console.error('Failed to fetch data from server, using bundled data:', err);
    try {
      const fallback = await fetch('/static/data/trends.json');
      allData = await fallback.json();
      window.allData = allData;
      usedCachedData = true;
    } catch (fallbackErr) {
      console.error('Failed to load bundled data:', fallbackErr);
      allData = {};
      window.allData = allData;
      usedCachedData = true;
    }
  }

  if (usedCachedData) {
    const staleEl = document.getElementById('stale-indicator');
    if (staleEl) staleEl.style.display = 'inline-block';
  }

  try {
    const platformsResponse = await fetch('/api/platforms');
    const platformsData = await platformsResponse.json();
    populateFilters(platformsData.platforms);
  } catch (err) {
    console.error('Failed to fetch platforms:', err);
    populateFilters(Object.keys(allData));
  }

  renderPlatform(currentPlatform);
  setupTabListeners();
  setupSearchListener();
  setupFilterListeners();
  setupResetListener();
  setupChartTypeToggle();
  setupCloseDetailListener();
}

function renderPlatform(platform) {
  currentPlatform = platform;
  window.currentPlatform = currentPlatform;
  const data = allData[platform] || [];
  const listEl = document.getElementById('tech-list');
  listEl.innerHTML = '';

  const sorted = [...data].sort((a, b) => {
    const avgA = a.trend_data.reduce((s, v) => s + v, 0) / a.trend_data.length;
    const avgB = b.trend_data.reduce((s, v) => s + v, 0) / b.trend_data.length;
    return avgB - avgA;
  });

  sorted.forEach(tech => {
    const li = document.createElement('li');
    if (selectedTech && selectedTech.name === tech.name) {
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
    li.addEventListener('click', () => selectTech(tech));
    listEl.appendChild(li);

    const sparklineContainer = li.querySelector('.sparkline-container');
    renderSparkline(sparklineContainer, tech.trend_data, direction, tech.name);
  });

  updateChart(platform);
}

function renderSparkline(container, data, direction, techName) {
  if (!data || data.length < 2) {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 24;
    canvas.className = 'sparkline';
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = direction === 'up' ? '#00ff88' : direction === 'down' ? '#ff4444' : '#ffcc00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(80, 12);
    ctx.stroke();
    container.appendChild(canvas);
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 24;
  canvas.className = 'sparkline';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = canvas.width;
  const h = canvas.height;
  const padding = 3;

  const color = techName ? getTechColor(techName) : (direction === 'up' ? '#00ff88' : direction === 'down' ? '#ff4444' : '#ffcc00');

  ctx.clearRect(0, 0, w, h);

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  data.forEach((val, i) => {
    const x = padding + (i / (data.length - 1)) * (w - padding * 2);
    const y = h - padding - ((val - min) / range) * (h - padding * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = color + '25';
  const firstX = padding;
  const firstY = h - padding - ((data[0] - min) / range) * (h - padding * 2);
  ctx.moveTo(firstX, firstY);
  data.forEach((val, i) => {
    const x = padding + (i / (data.length - 1)) * (w - padding * 2);
    const y = h - padding - ((val - min) / range) * (h - padding * 2);
    ctx.lineTo(x, y);
  });
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (w - padding * 2);
  const lastY = h - padding - ((data[data.length - 1] - min) / range) * (h - padding * 2);
  ctx.lineTo(lastX, h - padding);
  ctx.lineTo(firstX, h - padding);
  ctx.closePath();
  ctx.fill();
}

function computeMetrics(tech) {
  const data = tech.trend_data;
  if (!data || data.length === 0) {
    return { min: 0, max: 0, avg: 0, current: 0, previous: 0, change: 0, changePct: 0, volatility: 0, slope: 0, percentile: 0 };
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const sum = data.reduce((s, v) => s + v, 0);
  const avg = sum / data.length;
  const current = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : current;
  const change = current - previous;
  const changePct = previous !== 0 ? ((change / previous) * 100).toFixed(1) : '0.0';
  const variance = data.reduce((s, v) => s + (v - avg) ** 2, 0) / data.length;
  const volatility = Math.sqrt(variance);
  const slope = data.length > 1 ? ((data[data.length - 1] - data[0]) / (data.length - 1)).toFixed(2) : '0.00';
  const sorted = [...data].sort((a, b) => a - b);
  const rank = sorted.filter(v => v <= current).length;
  const percentile = ((rank / sorted.length) * 100).toFixed(1);
  return { min, max, avg, current, previous, change, changePct, volatility, slope, percentile };
}

function renderTrendDirection(container, tech) {
  const data = tech.trend_data;
  if (!data || data.length < 2) {
    container.innerHTML = '<span class="trend-change stable">No trend data</span>';
    return;
  }
  const first = data[0];
  const last = data[data.length - 1];
  const diff = last - first;
  const pctChange = first !== 0 ? ((diff / first) * 100).toFixed(1) : '0.0';
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '■';
  const color = direction === 'up' ? '#00ff88' : direction === 'down' ? '#ff4444' : '#ffcc00';

  const range = Math.max(...data) - Math.min(...data) || 1;
  const currentPos = ((last - Math.min(...data)) / range) * 100;

  container.innerHTML = `
    <div class="trend-bar">
      <div class="trend-bar-fill ${direction}" style="width:${currentPos}%"></div>
    </div>
    <span class="trend-change ${direction}">${arrow} ${pctChange}%</span>
  `;
}

function selectTech(tech) {
  selectedTech = tech;
  window.selectedTech = selectedTech;
  const panel = document.getElementById('detail-panel');
  panel.classList.remove('hidden');

  document.getElementById('detail-name').textContent = tech.name;

  const categoryEl = document.getElementById('detail-category');
  categoryEl.textContent = tech.category;
  categoryEl.className = 'detail-category tag';

  const platformEl = document.getElementById('detail-platform');
  platformEl.textContent = tech.platform;
  platformEl.className = 'detail-platform';

  document.getElementById('detail-description').textContent = tech.description;

  const metrics = computeMetrics(tech);
  const metricsEl = document.getElementById('detail-metrics');
  metricsEl.innerHTML = `
    <div class="metric-item"><span class="metric-label">Current</span><span class="metric-value">${metrics.current}</span></div>
    <div class="metric-item"><span class="metric-label">Previous</span><span class="metric-value">${metrics.previous}</span></div>
    <div class="metric-item"><span class="metric-label">Min</span><span class="metric-value">${metrics.min}</span></div>
    <div class="metric-item"><span class="metric-label">Max</span><span class="metric-value">${metrics.max}</span></div>
    <div class="metric-item"><span class="metric-label">Average</span><span class="metric-value">${metrics.avg.toFixed(1)}</span></div>
    <div class="metric-item"><span class="metric-label">Change</span><span class="metric-value">${metrics.change >= 0 ? '+' : ''}${metrics.change}</span></div>
    <div class="metric-item"><span class="metric-label">Change %</span><span class="metric-value">${metrics.changePct}%</span></div>
    <div class="metric-item"><span class="metric-label">Volatility</span><span class="metric-value">${metrics.volatility.toFixed(2)}</span></div>
    <div class="metric-item"><span class="metric-label">Slope</span><span class="metric-value">${metrics.slope}</span></div>
    <div class="metric-item"><span class="metric-label">Percentile</span><span class="metric-value">${metrics.percentile}%</span></div>
  `;

  const statusEl = document.getElementById('detail-status');
  const direction = getTrendDirection(tech.trend_data);
  const arrow = direction === 'up' ? '▲ Rising' : direction === 'down' ? '▼ Declining' : '■ Stable';
  statusEl.textContent = `Status: ${tech.status} (${arrow})`;
  statusEl.className = `detail-status status-${tech.status}`;

  renderTrendDirection(document.getElementById('detail-trend-direction'), tech);

  const tagsEl = document.getElementById('detail-tags');
  tagsEl.innerHTML = tech.tags.map(t => `<span class="tag">${t}</span>`).join('');

  renderDetailChart(tech);

  renderDetailSparkline(tech);

  renderPlatformData(document.getElementById('detail-platform-data'), tech);

  renderRelatedTechs(document.getElementById('detail-related'), tech);
}

function renderDetailChart(tech) {
  const ctx = document.getElementById('detail-trend-chart').getContext('2d');
  if (detailChart) {
    detailChart.destroy();
    detailChart = null;
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const color = getTechColor(tech.name);

  detailChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: tech.name,
        data: tech.trend_data,
        borderColor: color,
        backgroundColor: color + '20',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: color,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#e0e0e0', font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: '#16213e',
          titleColor: '#e0e0e0',
          bodyColor: '#e0e0e0',
          borderColor: '#0f3460',
          borderWidth: 1
        }
      },
      scales: {
        x: { ticks: { color: '#e0e0e0', font: { size: 10 } }, grid: { color: '#0f346040' } },
        y: { ticks: { color: '#e0e0e0', font: { size: 10 } }, grid: { color: '#0f346040' } }
      }
    }
  });
}

function renderDetailSparkline(tech) {
  const canvas = document.getElementById('detail-sparkline');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;
  canvas.width = container.clientWidth || 400;
  canvas.height = 80;

  const data = tech.trend_data;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = canvas.width;
  const h = canvas.height;
  const padding = 4;
  const color = getTechColor(tech.name);

  ctx.clearRect(0, 0, w, h);

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  data.forEach((val, i) => {
    const x = padding + (i / (data.length - 1)) * (w - padding * 2);
    const y = h - padding - ((val - min) / range) * (h - padding * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = color + '30';
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (w - padding * 2);
  const lastY = h - padding - ((data[data.length - 1] - min) / range) * (h - padding * 2);
  ctx.lineTo(lastX, h - padding);
  ctx.lineTo(padding, h - padding);
  ctx.closePath();
  ctx.fill();
}

function renderPlatformData(container, tech) {
  const pd = tech.platform_data;
  if (!pd) {
    container.innerHTML = '<span style="opacity:0.5">No platform data available</span>';
    return;
  }
  const rows = Object.entries(pd).map(([key, value]) => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const formatted = typeof value === 'number' ? value.toLocaleString() : value;
    return `<div class="platform-data-row"><span class="platform-data-label">${label}</span><span class="platform-data-value">${formatted}</span></div>`;
  }).join('');
  container.innerHTML = rows;
}

function renderRelatedTechs(container, tech) {
  const related = tech.related || [];
  if (related.length === 0) {
    container.innerHTML = '<span style="opacity:0.5">No related technologies</span>';
    return;
  }
  container.innerHTML = related.map(name => {
    const relatedTech = findTechByName(name);
    if (relatedTech) {
      return `<span class="related-tag" data-tech-name="${name}">${name}</span>`;
    }
    return `<span class="related-tag">${name}</span>`;
  }).join('');

  container.querySelectorAll('.related-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const name = tag.dataset.techName;
      const found = findTechByName(name);
      if (found) {
        selectTech(found);
      }
    });
  });
}

function findTechByName(name) {
  for (const plat in allData) {
    const found = allData[plat].find(t => t.name === name);
    if (found) return found;
  }
  return null;
}

function getTrendDirection(trendData) {
  if (trendData.length < 2) return 'stable';
  const first = trendData[0];
  const last = trendData[trendData.length - 1];
  const diff = last - first;
  const threshold = Math.max(1, Math.abs(first) * 0.05);
  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'stable';
}

function setupTabListeners() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderPlatform(tab.dataset.platform);
    });
  });
}

function setupSearchListener() {
  document.getElementById('search').addEventListener('input', applyFilters);
}

function setupFilterListeners() {
  document.getElementById('category-filter').addEventListener('change', applyFilters);
  document.getElementById('status-filter').addEventListener('change', applyFilters);
}

function setupResetListener() {
  document.getElementById('reset-filters').addEventListener('click', () => {
    document.getElementById('search').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('status-filter').value = '';
    applyFilters();
  });
}

function setupChartTypeToggle() {
  const btn = document.getElementById('chart-type-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      window.chartType = (window.chartType || 'line') === 'line' ? 'bar' : 'line';
      btn.textContent = window.chartType === 'line' ? 'Line Chart' : 'Bar Chart';
      updateChart(currentPlatform, selectedTech);
    });
  }
}

function applyFilters() {
  const search = document.getElementById('search').value.toLowerCase();
  const category = document.getElementById('category-filter').value;
  const status = document.getElementById('status-filter').value;
  const data = allData[currentPlatform] || [];

  const filtered = data.filter(tech => {
    const matchesSearch = !search || tech.name.toLowerCase().includes(search) || tech.description.toLowerCase().includes(search) || tech.tags.some(t => t.toLowerCase().includes(search));
    const matchesCategory = !category || tech.category === category;
    const matchesStatus = !status || tech.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  renderFilteredList(filtered);
}

function renderFilteredList(filtered) {
  const listEl = document.getElementById('tech-list');
  listEl.innerHTML = '';

  const sorted = [...filtered].sort((a, b) => {
    const avgA = a.trend_data.reduce((s, v) => s + v, 0) / a.trend_data.length;
    const avgB = b.trend_data.reduce((s, v) => s + v, 0) / b.trend_data.length;
    return avgB - avgA;
  });

  sorted.forEach(tech => {
    const li = document.createElement('li');
    if (selectedTech && selectedTech.name === tech.name) {
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
    li.addEventListener('click', () => selectTech(tech));
    listEl.appendChild(li);

    const sparklineContainer = li.querySelector('.sparkline-container');
    renderSparkline(sparklineContainer, tech.trend_data, direction, tech.name);
  });
}

function populateFilters(platforms) {
  const categories = new Set();
  allData[currentPlatform].forEach(tech => categories.add(tech.category));
  const select = document.getElementById('category-filter');
  select.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function setupCloseDetailListener() {
  document.getElementById('close-detail').addEventListener('click', () => {
    document.getElementById('detail-panel').classList.add('hidden');
    selectedTech = null;
    updateChart(currentPlatform);
    if (detailChart) {
      detailChart.destroy();
      detailChart = null;
    }
  });
}

window.allData = allData;
window.currentPlatform = currentPlatform;
window.selectedTech = selectedTech;
window.selectTech = selectTech;
window.renderSparkline = renderSparkline;
window.getTrendDirection = getTrendDirection;
window.computeMetrics = computeMetrics;
window.renderDetailChart = renderDetailChart;
window.findTechByName = findTechByName;

document.addEventListener('DOMContentLoaded', init);