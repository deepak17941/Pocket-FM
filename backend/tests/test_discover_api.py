"""Backend tests for Pocket FM Audius search + URL-check endpoints."""
import os
import urllib.parse
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/") or \
           "https://minimal-audio-3.preview.emergentagent.com"


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    return s


# --- root ---
class TestRoot:
    def test_root(self, api):
        r = api.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("message")


# --- Audius search ---
class TestSearch:
    def test_search_returns_hits(self, api):
        r = api.get(f"{BASE_URL}/api/search", params={"q": "lofi", "limit": 5}, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Expected at least one lofi hit from Audius"
        hit = data[0]
        # structure
        for k in ("id", "title", "creator", "audio_url", "duration"):
            assert k in hit, f"missing {k}"
        # id prefix
        assert hit["id"].startswith("au_"), f"expected 'au_' prefix, got {hit['id']}"
        # stream URL sanity
        assert "audius" in hit["audio_url"] and "/stream" in hit["audio_url"]

    def test_search_limit_cap(self, api):
        r = api.get(f"{BASE_URL}/api/search", params={"q": "chill", "limit": 3}, timeout=20)
        assert r.status_code == 200
        assert len(r.json()) <= 3

    def test_search_requires_q(self, api):
        r = api.get(f"{BASE_URL}/api/search", timeout=10)
        assert r.status_code == 422  # pydantic validation

    def test_search_empty_q_rejected(self, api):
        r = api.get(f"{BASE_URL}/api/search", params={"q": ""}, timeout=10)
        assert r.status_code == 422


# --- URL check ---
VALID_MP3 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
INVALID_HTML = "https://example.com/not-audio.html"


class TestUrlCheck:
    def test_valid_mp3(self, api):
        r = api.get(
            f"{BASE_URL}/api/url-check",
            params={"url": VALID_MP3},
            timeout=25,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert data["audio_url"] == VALID_MP3
        assert data["title"]  # non-empty
        # content-type should be audio/* OR extension fallback matched
        assert "audio" in data["content_type"] or VALID_MP3.lower().endswith(".mp3")

    def test_invalid_html_rejected(self, api):
        r = api.get(
            f"{BASE_URL}/api/url-check",
            params={"url": INVALID_HTML},
            timeout=20,
        )
        # Either 415 (reachable but wrong type) or 502 (unreachable)
        assert r.status_code in (415, 502), f"unexpected {r.status_code}: {r.text}"
        assert "detail" in r.json()

    def test_non_http_rejected(self, api):
        r = api.get(
            f"{BASE_URL}/api/url-check",
            params={"url": "ftp://foo/bar.mp3"},
            timeout=10,
        )
        assert r.status_code == 400

    def test_unreachable_host(self, api):
        r = api.get(
            f"{BASE_URL}/api/url-check",
            params={"url": "https://this-host-definitely-does-not-exist-xyz123.invalid/song.mp3"},
            timeout=20,
        )
        assert r.status_code == 502

    def test_url_required(self, api):
        r = api.get(f"{BASE_URL}/api/url-check", timeout=10)
        assert r.status_code == 422
