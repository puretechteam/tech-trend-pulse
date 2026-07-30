def test_app_creation():
    from app import app

    assert app is not None
    assert app.name == "app"


def test_root_route_returns_200(client):
    response = client.get("/")
    assert response.status_code == 200


def test_root_route_content_type(client):
    response = client.get("/")
    content_type = response.content_type
    assert content_type is not None
    assert "text/html" in content_type or "application/json" in content_type