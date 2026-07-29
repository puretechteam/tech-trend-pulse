let trendChart = null;

function getChartType() {
  return window.chartType || 'line';
}

function updateChart(platform, selectedTech = null) {
  const ctx = document.getElementById('trend-chart').getContext('2d');
  const data = window.allData ? window.allData[platform] : [];

  if (trendChart) {
    trendChart.destroy();
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const type = getChartType();

  if (selectedTech) {
    const color = getTechColor(selectedTech.name);
    trendChart = new Chart(ctx, {
      type: type,
      data: {
        labels: months,
        datasets: [{
          label: selectedTech.name,
          data: selectedTech.trend_data,
          borderColor: color,
          backgroundColor: color + '20',
          fill: type === 'line',
          tension: 0.4,
          pointRadius: type === 'line' ? 4 : 3,
          pointBackgroundColor: color,
          borderWidth: 2,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#e0e0e0', font: { size: 12 } }
          },
          tooltip: {
            backgroundColor: '#16213e',
            titleColor: '#e0e0e0',
            bodyColor: '#e0e0e0',
            borderColor: '#0f3460',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y;
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: '#e0e0e0', font: { size: 11 } }, grid: { color: '#0f346040' } },
          y: { ticks: { color: '#e0e0e0', font: { size: 11 } }, grid: { color: '#0f346040' }, min: 0, max: 100 }
        },
        animation: {
          duration: 600,
          easing: 'easeInOutQuart'
        }
      }
    });
  } else {
    const top5 = [...data].sort((a, b) => {
      const avgA = a.trend_data[a.trend_data.length - 1];
      const avgB = b.trend_data[b.trend_data.length - 1];
      return avgB - avgA;
    }).slice(0, 5);

    const datasets = top5.map(tech => {
      const color = getTechColor(tech.name);
      return {
        label: tech.name,
        data: tech.trend_data,
        borderColor: color,
        backgroundColor: color + '20',
        fill: type === 'line',
        tension: 0.4,
        pointRadius: type === 'line' ? 2 : 3,
        borderWidth: 2,
        barPercentage: 0.6
      };
    });

    trendChart = new Chart(ctx, {
      type: type,
      data: {
        labels: months,
        datasets: datasets
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
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y;
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: '#e0e0e0', font: { size: 11 } }, grid: { color: '#0f346040' } },
          y: { ticks: { color: '#e0e0e0', font: { size: 11 } }, grid: { color: '#0f346040' }, min: 0, max: 100 }
        },
        animation: {
          duration: 600,
          easing: 'easeInOutQuart'
        }
      }
    });
  }
}

function toggleChartType() {
  window.chartType = getChartType() === 'line' ? 'bar' : 'line';
  updateChart(window.currentPlatform || 'github', window.selectedTech);
  const btn = document.getElementById('chart-type-toggle');
  if (btn) {
    btn.textContent = window.chartType === 'line' ? 'Line Chart' : 'Bar Chart';
  }
}

window.updateChart = updateChart;
window.toggleChartType = toggleChartType;