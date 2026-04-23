from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, httpx, base64
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


class GenerateArtRequest(BaseModel):
    title: str
    artist: Optional[str] = ""
    mood: Optional[str] = ""


class GenerateArtResponse(BaseModel):
    data_uri: str  # "data:image/jpeg;base64,..."


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
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="URL must start with http(s)://")
    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as c:
            resp = await c.head(url)
            if resp.status_code >= 400:
                resp = await c.get(url, headers={"Range": "bytes=0-1024"})
                resp.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"URL not reachable: {e}")

    ctype = (resp.headers.get("content-type") or "").lower()
    size = int(resp.headers.get("content-length") or 0)
    if "audio" not in ctype and not url.lower().split("?")[0].rsplit(".", 1)[-1] in ("mp3", "m4a", "aac", "ogg", "wav", "flac"):
        raise HTTPException(status_code=415, detail=f"URL is not audio (content-type: {ctype or 'unknown'})")

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


@api_router.post("/generate-art", response_model=GenerateArtResponse)
async def generate_art(req: GenerateArtRequest):
    """Generate a beautiful AI-designed album cover for a track using Gemini Nano Banana."""
    key = os.getenv("EMERGENT_LLM_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="Art generation unavailable")

    from emergentintegrations.llm.chat import LlmChat, UserMessage

    mood_part = f" The mood/vibe should feel: {req.mood}." if req.mood else ""
    artist_part = f" by {req.artist}" if req.artist and req.artist.lower() != "unknown" else ""
    prompt = (
        f"A stunning, modern, artistic album cover design for the song \"{req.title}\"{artist_part}."
        f"{mood_part}"
        " Abstract, minimalist yet expressive — think contemporary vinyl artwork, award-winning album-cover design."
        " Bold composition, rich color palette, single strong focal element."
        " No text, no letters, no words, no watermarks, no logos."
        " Square 1024x1024, photorealistic or painterly (art director's choice), premium quality, crisp, clean edges."
    )

    try:
        chat = LlmChat(api_key=key, session_id=f"art_{req.title[:30]}", system_message="You generate beautiful album cover art.")
        chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
        _text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Art generation failed: {e}")

    if not images:
        raise HTTPException(status_code=502, detail="No image returned")
    img = images[0]
    mime = img.get("mime_type") or "image/jpeg"
    data = img.get("data") or ""
    if not data:
        raise HTTPException(status_code=502, detail="Empty image data")
    return GenerateArtResponse(data_uri=f"data:{mime};base64,{data}")


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
