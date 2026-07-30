# Contributing to Tech Trend Pulse

## How to Contribute

We welcome contributions from the community! Here are the ways you can help:

- **Report bugs** — Open an issue with a detailed description of the problem.
- **Suggest features** — Open an issue describing the feature you'd like to see.
- **Submit code** — Fork the repository, make your changes, and open a pull request.
- **Improve documentation** — Fix typos, clarify instructions, or add missing docs.

## Development Setup

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```
   git clone https://github.com/<your-username>/tech-trend-pulse.git
   cd tech-trend-pulse
   ```
3. Create a virtual environment and activate it:
   ```
   python -m venv venv
   venv\Scripts\activate
   ```
4. Install dependencies:
   ```
   pip install -r requirements.txt
   pip install -e ".[dev]"
   ```
5. Run the development server:
   ```
   python app.py
   ```
6. Open http://localhost:5000 in your browser.

## Submitting Changes

1. Create a new branch for your feature or bugfix:
   ```
   git checkout -b my-feature
   ```
2. Make your changes and commit them with a clear, descriptive message.
3. Push your branch to your fork:
   ```
   git push origin my-feature
   ```
4. Open a pull request against the `main` branch of the repository.
5. Ensure all checks pass and a reviewer approves your PR.

## Code Style Guidelines

- Follow PEP 8 for Python code.
- Use 4 spaces for indentation (no tabs).
- Keep line length to 88 characters or fewer.
- Use descriptive variable and function names.
- Add docstrings to all public functions and classes.
- Format code with `black` before submitting.
- Run `flake8` or `ruff` to check for linting errors before committing.
- Write tests for new functionality using `pytest`.