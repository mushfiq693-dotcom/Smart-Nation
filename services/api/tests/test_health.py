import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add services/api to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["country"] == "Bangladesh"
    assert data["vertical"] == "climact_twin"


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "CivicSphere" in data["project"]
    assert data["pilot_country"]["iso_alpha3"] == "BGD"
    assert data["admin_hierarchy"]["adm1"]["count"] == 8
    assert data["admin_hierarchy"]["adm2"]["count"] == 64
