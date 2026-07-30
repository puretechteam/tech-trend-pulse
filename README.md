# Tech Trend Pulse

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Contributing](https://img.shields.io/badge/Contributing-Guidelines-green.svg)](CONTRIBUTING.md)
[![Security](https://img.shields.io/badge/Security-Policy-red.svg)](SECURITY.md)

A desktop web application that visualizes technology trend data across GitHub, npm, and PyPI platforms. Built with Flask and Chart.js, it provides interactive trend charts, filtering, and a detail panel for exploring technology adoption trends over time.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute, set up your development environment, and submit changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Security

If you discover a security vulnerability, please report it responsibly. Please see [SECURITY.md](SECURITY.md) for our security policy and reporting guidelines. Do not open public issues for security vulnerabilities.

## Development

### Prerequisites

- Python 3.12+
- pip

### Setup

1. Install dependencies:
   ```
   make install
   ```
   Or manually:
   ```
   pip install -r requirements.txt
   ```

### Running the App

```
make run
```

### Building the Executable

```
make build
```

### Running Tests

```
make test
```

### Linting

```
make lint
```

### Formatting

```
make format
```

### Docker

```
make docker-run
```
Or:
```
docker-compose up
```

> **Note:** The Makefile is the preferred build tool and provides cross-platform support for all development workflows.

## Features

- **Interactive Trend Charts** — Chart.js line and bar charts showing 12-month trend data for technologies, with toggle between chart types
- **Per-Technology Colors** — Each framework/tool is assigned a unique, consistent color derived from its name hash, making it easy to distinguish multiple lines on the chart regardless of status
- **Platform Tabs** — Switch between GitHub, npm, and PyPI data
- **Search & Filter** — Filter technologies by name, description, tags, category, and status (rising/stable/declining)
- **Rich Detail Panel** — Click any technology to see its full details including:
  - Metrics and statistics (current, previous, min, max, average, change, volatility, slope, percentile)
  - Trend direction indicator with visual progress bar
  - Trend sparkline mini-chart
  - Full trend chart visualization
  - Category tags
  - Status with trend direction indicator
  - Platform-specific data (stars, forks, downloads, etc.)
  - Related technologies (clickable navigation)
- **Live Data Fetching** — Attempts to fetch live data from public APIs with graceful fallback to bundled static JSON
- **Data Caching** — Fetched data is cached locally for offline use
- **Dark Theme** — Consistent dark UI with CSS custom properties

## Changes Made

1. **Fixed script loading order** in `static/index.html` — `dashboard.js` now loads before `charts.js` to ensure dependencies are available at runtime.
2. **Per-technology graph colors** in `static/js/charts.js` and `static/js/dashboard.js` — Replaced status-based colors (green/yellow/red) with a consistent 15-color palette assigned by hashing each technology's name. Colors persist across chart type switches (line ↔ bar).
3. **Enhanced detail panel** in `static/js/dashboard.js` — Added trend slope, percentile rank, and a trend sparkline mini-chart to the detail view.
4. **Improved UI/UX** in `static/css/style.css` — Refined card layouts, spacing, metric grid (3-column), hover effects on metric cards and related tags, gradient trend bars, and responsive design for mobile.

## Setup

### Development Server

1. Install dependencies:
   ```
   make install
   ```

2. Run the Flask development server:
   ```
   make run
   ```

3. Open http://localhost:5000 in your browser.

### Development Dependencies

For development and testing, install:
```
make install-dev
```

### PyInstaller Build

1. Ensure dependencies are installed (see above).

2. Run the build:
   ```
   make build
   ```

3. The built executable will be in `dist/tech-trend-pulse-<version>/`.

## Docker

### Building the Image

```
docker build -t tech-trend-pulse .
```

### Running the Container

```
docker run -p 5000:5000 tech-trend-pulse
```

### Using Docker Compose

```
docker-compose up -d
```

This starts the Flask app in development mode with source code mounted for live reloading.

## Data Sources

- **Bundled data**: `data/trends.json` contains static trend data for GitHub, npm, and PyPI platforms
- **Live fetch endpoints**: `/api/fetch/<platform>` proxies requests to public APIs (GitHub API, npm, PyPI Stats)
- **Data integrity**: SHA-256 checksums are stored in `data/trends.json.sha256` and verified on startup

## Usage Notes

- The app uses a `cache/` directory to store fetched live data for offline access
- If external data sources are unreachable, the app falls back to bundled static JSON and displays a "Data may be stale" indicator
- Configuration (such as API endpoints) can be set via environment variables or config files excluded from the repo
- The app validates JSON data integrity on startup and alerts if corruption is detected

## Roadmap

- Add sentiment analysis from social media sources
- Support for custom data source plugins
- Predictive trend forecasting with ML models
- Team collaboration features for shared dashboards
- API access for programmatic trend data retrieval

## Project Structure

```
tech-trend-pulse/
├── app.py              # Flask backend with API endpoints
├── build.bat           # PyInstaller build script
├── dependencies.bat    # Dependency installation script
├── requirements.txt        # Runtime dependencies
├── requirements-build.txt  # Build-time dependencies (PyInstaller)
├── requirements-dev.txt    # Development dependencies
├── VERSION             # Version number
├── .gitignore          # Git ignore rules
├── README.md           # This file
├── data/
│   ├── trends.json     # Bundled trend data (JSON) with platform_data and related fields
│   └── trends.json.sha256  # Checksum for integrity verification
├── cache/              # Cached fetched data (runtime)
└── static/
    ├── index.html      # Main HTML page with corrected script order
    ├── css/
    │   └── style.css   # Stylesheet with dark theme and enhanced layouts
    └── js/
        ├── dashboard.js  # Main application logic with enhanced detail panel and per-tech colors
        └── charts.js     # Chart.js visualization with per-technology color palette
```