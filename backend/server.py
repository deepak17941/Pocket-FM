from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
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

IA_BASE = "https://archive.org"


class SearchHit(BaseModel):
    id: str
    title: str
    creator: str
    audio_url: str
    duration: float = 0.0


@api_router.get("/")
async def root():
    return {"message": "Pocket FM API"}


async def _best_audio_file(identifier: str) -> Optional[dict]:
    """Pick the best streamable audio file (mp3 preferred) for an IA item."""
    url = f"{IA_BASE}/metadata/{identifier}"
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(url)
        if r.status_code != 200:
            return None
        data = r.json()
    files = data.get("files", []) or []
    mp3s = [f for f in files if str(f.get("name", "")).lower().endswith(".mp3")]
    ogg = [f for f in files if str(f.get("name", "")).lower().endswith(".ogg")]
    candidates = mp3s or ogg
    if not candidates:
        return None
    # Prefer the "derivative" MP3s (VBR/128kbps) for smaller size
    def score(f):
        n = str(f.get("name", "")).lower()
        s = 0
        if "vbr" in n: s += 3
        if "128" in n: s += 2
        if "64" in n: s += 1
        return s
    candidates.sort(key=score, reverse=True)
    return candidates[0]


@api_router.get("/search", response_model=List[SearchHit])
async def search(q: str = Query(..., min_length=1), limit: int = 15):
    """Search Internet Archive audio collection for tracks matching q."""
    if limit < 1 or limit > 50:
        limit = 15
    query = f'({q}) AND mediatype:(audio)'
    params = {
        "q": query,
        "fl[]": ["identifier", "title", "creator"],
        "sort[]": "downloads desc",
        "rows": limit,
        "page": 1,
        "output": "json",
    }
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(f"{IA_BASE}/advancedsearch.php", params=params)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Search failed: {e}")

    docs = data.get("response", {}).get("docs", []) or []
    hits: List[SearchHit] = []
    # Process items concurrently-ish, cap to first N for speed
    for d in docs[:limit]:
        ident = d.get("identifier")
        if not ident:
            continue
        best = await _best_audio_file(ident)
        if not best:
            continue
        fname = best.get("name")
        audio_url = f"{IA_BASE}/download/{ident}/{fname}"
        dur_raw = best.get("length") or "0"
        # length can be "MM:SS" or seconds string
        dur = 0.0
        try:
            if ":" in str(dur_raw):
                parts = [float(x) for x in str(dur_raw).split(":")]
                while len(parts) < 3: parts.insert(0, 0)
                dur = parts[0] * 3600 + parts[1] * 60 + parts[2]
            else:
                dur = float(dur_raw)
        except Exception:
            dur = 0.0
        title = d.get("title") or best.get("title") or ident
        creator = d.get("creator") or "Unknown"
        if isinstance(creator, list): creator = ", ".join(creator)
        if isinstance(title, list): title = title[0] if title else ident
        hits.append(SearchHit(
            id=f"ia_{ident}",
            title=str(title)[:200],
            creator=str(creator)[:200],
            audio_url=audio_url,
            duration=dur,
        ))
    return hits


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
