import json
import os

from app import compute_checksum, validate_data_integrity

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
TRENDS_FILE = os.path.join(DATA_DIR, "trends.json")
CHECKSUM_FILE = os.path.join(DATA_DIR, "trends.json.sha256")


def test_data_directory_exists():
    assert os.path.isdir(DATA_DIR), f"Data directory not found: {DATA_DIR}"


def test_trends_json_exists():
    assert os.path.isfile(TRENDS_FILE), f"trends.json not found: {TRENDS_FILE}"


def test_trends_json_loadable():
    with open(TRENDS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, dict)
    assert len(data) > 0


def test_data_schema_validation():
    issues = validate_data_integrity()
    assert isinstance(issues, list)


def test_data_schema_no_critical_issues():
    issues = validate_data_integrity()
    missing_platform = [i for i in issues if "Missing platform key" in i]
    assert len(missing_platform) == 0, f"Missing platform keys: {missing_platform}"


def test_checksum_file_exists():
    assert os.path.isfile(CHECKSUM_FILE), f"Checksum file not found: {CHECKSUM_FILE}"


def test_checksum_verification():
    assert os.path.isfile(TRENDS_FILE), f"trends.json not found: {TRENDS_FILE}"
    assert os.path.isfile(CHECKSUM_FILE), f"Checksum file not found: {CHECKSUM_FILE}"

    with open(CHECKSUM_FILE, "r") as f:
        expected_hash = f.read().strip()

    actual_hash = compute_checksum(TRENDS_FILE)
    assert actual_hash == expected_hash, "Checksum mismatch for trends.json"


def test_compute_checksum_deterministic():
    hash1 = compute_checksum(TRENDS_FILE)
    hash2 = compute_checksum(TRENDS_FILE)
    assert hash1 == hash2