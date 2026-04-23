from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, httpx
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

AUDIUS_HOST = "https://discoveryprovider.audius.co"
APP_NAME = "pocketfm"


class SearchHit(BaseModel):
    id: str
    title: str
    creator: str
    audio_url: str
    duration: float = 0.0
    artwork_url: Optional[str] = None
    plays: int = 0


class UrlCheckResponse(BaseModel):
    ok: bool
    title: str
    artist: str
    audio_url: str
    duration: float = 0.0
    size: int = 0
    content_type: str = ""


@api_router.get("/")
async def root():
    return {"message": "Pocket FM API"}


def _artwork(track: dict) -> Optional[str]:
    art = track.get("artwork") or {}
    if isinstance(art, dict):
        return art.get("480x480") or art.get("1000x1000") or art.get("150x150")
    return None


@api_router.get("/search", response_model=List[SearchHit])
async def search(q: str = Query(..., min_length=1), limit: int = 20):
    """Search Audius catalogue for full-length streamable tracks."""
    if limit < 1 or limit > 50:
        limit = 20
    url = f"{AUDIUS_HOST}/v1/tracks/search"
    params = {"query": q, "app_name": APP_NAME, "limit": limit}
    try:
        async with httpx.AsyncClient(timeout=12) as c:
            r = await c.get(url, params=params)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Search failed: {e}")

    out: List[SearchHit] = []
    for t in data.get("data", []) or []:
        if t.get("is_delete") or not t.get("is_streamable", True):
            continue
        tid = t.get("id")
        if not tid:
            continue
        user = t.get("user") or {}
        artist = user.get("name") or user.get("handle") or "Unknown"
        stream_url = f"{AUDIUS_HOST}/v1/tracks/{tid}/stream?app_name={APP_NAME}"
        out.append(SearchHit(
            id=f"au_{tid}",
            title=str(t.get("title") or "Untitled")[:200],
            creator=str(artist)[:200],
            audio_url=stream_url,
            duration=float(t.get("duration") or 0),
            artwork_url=_artwork(t),
            plays=int(t.get("play_count") or 0),
        ))
    return out


@api_router.get("/url-check", response_model=UrlCheckResponse)
async def url_check(url: str = Query(..., min_length=5)):
    """Validate a user-pasted direct audio URL before letting the client download it."""
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="URL must start with http(s)://")
    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as c:
            # HEAD first
            resp = await c.head(url)
            if resp.status_code >= 400:
                # Some servers don't support HEAD — fall back to a ranged GET
                resp = await c.get(url, headers={"Range": "bytes=0-1024"})
                resp.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"URL not reachable: {e}")

    ctype = (resp.headers.get("content-type") or "").lower()
    size = int(resp.headers.get("content-length") or 0)
    if "audio" not in ctype and not url.lower().split("?")[0].rsplit(".", 1)[-1] in ("mp3", "m4a", "aac", "ogg", "wav", "flac"):
        raise HTTPException(status_code=415, detail=f"URL is not audio (content-type: {ctype or 'unknown'})")

    # derive a readable title from filename
    fname = url.split("?")[0].rsplit("/", 1)[-1] or "Audio"
    base = fname.rsplit(".", 1)[0].replace("_", " ").replace("+", " ")
    title, artist = base, "Unknown"
    if " - " in base:
        a, t = base.split(" - ", 1)
        artist, title = a.strip(), t.strip()

    return UrlCheckResponse(
        ok=True,
        title=title[:200] or "Audio",
        artist=artist[:200] or "Unknown",
        audio_url=url,
        duration=0.0,
        size=size,
        content_type=ctype,
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
