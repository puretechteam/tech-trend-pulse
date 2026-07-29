import os
import sys
import json
import hashlib
import time
from flask import Flask, jsonify, send_from_directory, request

app = Flask(__name__, static_folder="static", static_url_path="/static")

CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(CACHE_DIR, exist_ok=True)

SCHEMA_REQUIRED_FIELDS = {
    "github": ["name", "category", "description", "trend_data", "status", "platform", "tags"],
    "npm": ["name", "category", "description", "trend_data", "status", "platform", "tags"],
    "pypi": ["name", "category", "description", "trend_data", "status", "platform", "tags"],
}

def get_data_path():
    if getattr(sys, "frozen", False):
        return os.path.join(sys._MEIPASS, "data")
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

def get_static_path():
    if getattr(sys, "frozen", False):
        return os.path.join(sys._MEIPASS, "static")
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

def compute_checksum(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def validate_data_integrity():
    data_path = get_data_path()
    issues = []
    for platform, required_fields in SCHEMA_REQUIRED_FIELDS.items():
        filepath = os.path.join(data_path, "trends.json")
        if not os.path.exists(filepath):
            issues.append(f"Missing data file: {filepath}")
            continue
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            issues.append(f"Corrupted JSON in trends.json: {e}")
            continue
        if platform not in data:
            issues.append(f"Missing platform key: {platform}")
            continue
        entries = data[platform]
        if not isinstance(entries, list):
            issues.append(f"Platform {platform} data is not a list")
            continue
        for i, entry in enumerate(entries):
            for field in required_fields:
                if field not in entry:
                    issues.append(f"Entry {i} in {platform} missing field: {field}")
    checksum_file = os.path.join(data_path, "trends.json.sha256")
    if os.path.exists(checksum_file):
        with open(checksum_file, "r") as f:
            expected_hash = f.read().strip()
        actual_hash = compute_checksum(filepath)
        if actual_hash != expected_hash:
            issues.append(f"Checksum mismatch for trends.json (possible corruption)")
    return issues

def save_checksum():
    data_path = get_data_path()
    filepath = os.path.join(data_path, "trends.json")
    checksum = compute_checksum(filepath)
    checksum_file = os.path.join(data_path, "trends.json.sha256")
    with open(checksum_file, "w") as f:
        f.write(checksum)

def validate_external_data(data, platform):
    if not isinstance(data, dict) or platform not in data:
        return False
    entries = data[platform]
    if not isinstance(entries, list):
        return False
    required_fields = SCHEMA_REQUIRED_FIELDS.get(platform, [])
    for entry in entries:
        if not isinstance(entry, dict):
            return False
        for field in required_fields:
            if field not in entry:
                return False
    return True

@app.route("/")
def index():
    return send_from_directory(get_static_path(), "index.html")

@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(get_static_path(), filename)

@app.route("/api/data")
def api_data():
    data_path = get_data_path()
    trends_file = os.path.join(data_path, "trends.json")
    try:
        with open(trends_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/platforms")
def api_platforms():
    data_path = get_data_path()
    trends_file = os.path.join(data_path, "trends.json")
    try:
        with open(trends_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        platforms = sorted(list(data.keys()))
        return jsonify({"platforms": platforms})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/fetch/<platform>")
def fetch_data(platform):
    if platform not in ("github", "npm", "pypi"):
        return jsonify({"error": "Unsupported platform"}), 400
    cache_file = os.path.join(CACHE_DIR, f"{platform}.json")
    cache_meta_file = os.path.join(CACHE_DIR, f"{platform}.meta")
    try:
        import requests as req_lib
        urls = {
            "github": "https://api.github.com/search/repositories?q=sort:stars&per_page=30",
            "npm": "https://api.npmjs.org/downloads/point/last-week/top",
            "pypi": "https://pypistats.org/api/packages/top",
        }
        url = urls.get(platform)
        if not url:
            return jsonify({"error": "No fetch URL configured"}), 500
        resp = req_lib.get(url, timeout=10)
        resp.raise_for_status()
        raw = resp.json()
        cache_data = {
            "raw": raw,
            "fetched_at": time.time(),
            "platform": platform,
        }
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(cache_data, f)
        with open(cache_meta_file, "w", encoding="utf-8") as f:
            json.dump({"fetched_at": cache_data["fetched_at"], "platform": platform}, f)
        return jsonify({"source": "live", "data": raw})
    except Exception as e:
        if os.path.exists(cache_file):
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached = json.load(f)
                return jsonify({"source": "cache", "data": cached.get("raw", {}), "stale": True})
            except Exception:
                pass
        return jsonify({"error": "Fetch failed and no cache available", "stale": False}), 503

@app.route("/api/check-integrity")
def api_check_integrity():
    issues = validate_data_integrity()
    return jsonify({"integrity_ok": len(issues) == 0, "issues": issues})

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/static/"):
        return jsonify({"error": "Not found"}), 404
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    save_checksum()
    integrity_issues = validate_data_integrity()
    if integrity_issues:
        print("WARNING: Data integrity issues detected:")
        for issue in integrity_issues:
            print(f"  - {issue}")
    app.run(host="0.0.0.0", port=5000, debug=False)