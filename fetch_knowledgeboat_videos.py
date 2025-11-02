"""
Fetch all playlists and videos from the YouTube channel "Knowledge Boat" and
write a grouped JSON file consumable by the website's videos page.

Usage (API key default is embedded but can be overridden):
  python fetch_knowledgeboat_videos.py \
      --api-key YOUR_KEY \
      --channel-name "Knowledge Boat" \
      --out "public/videos.json"

Notes:
  - Uses YouTube Data API v3.
  - Groups videos by playlist; each playlist title is used as a category header.
  - Only relies on Python standard library (urllib) — no external deps.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from typing import Dict, List, Optional, Any


# Load API key from environment; recommend setting in a local .env file
DEFAULT_API_KEY = os.getenv("YT_API_KEY", "")

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"


def http_get_json(endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
    query = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    url = f"{YOUTUBE_API_BASE}/{endpoint}?{query}"
    with urllib.request.urlopen(url) as resp:
        data = resp.read()
    return json.loads(data.decode("utf-8"))


def find_channel_id(api_key: str, channel_name: str) -> str:
    # First try search.list to find the channel by query
    search = http_get_json(
        "search",
        {
            "part": "snippet",
            "q": channel_name,
            "type": "channel",
            "maxResults": 5,
            "key": api_key,
        },
    )
    items = search.get("items", [])
    if not items:
        raise RuntimeError(f"No channel results for query: {channel_name}")

    # Prefer exact title match (case-insensitive), else take first result
    normalized = channel_name.strip().lower()
    exact = next((it for it in items if it["snippet"]["title"].strip().lower() == normalized), None)
    target = exact or items[0]
    return target["snippet"]["channelId"]


def list_playlists(api_key: str, channel_id: str) -> List[Dict[str, Any]]:
    playlists: List[Dict[str, Any]] = []
    page_token: Optional[str] = None
    while True:
        payload = http_get_json(
            "playlists",
            {
                "part": "snippet,contentDetails",
                "channelId": channel_id,
                "maxResults": 50,
                "pageToken": page_token,
                "key": api_key,
            },
        )
        for it in payload.get("items", []):
            playlists.append(
                {
                    "id": it["id"],
                    "title": it["snippet"]["title"],
                    "description": it["snippet"].get("description", ""),
                    "itemCount": it.get("contentDetails", {}).get("itemCount"),
                }
            )
        page_token = payload.get("nextPageToken")
        if not page_token:
            break
        time.sleep(0.1)
    return playlists


def list_videos_in_playlist(api_key: str, playlist_id: str) -> List[Dict[str, Any]]:
    videos: List[Dict[str, Any]] = []
    page_token: Optional[str] = None
    while True:
        payload = http_get_json(
            "playlistItems",
            {
                "part": "snippet,contentDetails",
                "playlistId": playlist_id,
                "maxResults": 50,
                "pageToken": page_token,
                "key": api_key,
            },
        )
        for it in payload.get("items", []):
            snippet = it.get("snippet", {})
            content = it.get("contentDetails", {})
            video_id = content.get("videoId")
            if not video_id:
                continue
            # Prefer high-res thumbnail if present
            thumbs = snippet.get("thumbnails", {})
            thumb_url = (
                (thumbs.get("maxres") or {}).get("url")
                or (thumbs.get("standard") or {}).get("url")
                or (thumbs.get("high") or {}).get("url")
                or (thumbs.get("medium") or {}).get("url")
                or (thumbs.get("default") or {}).get("url")
                or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
            )
            videos.append(
                {
                    "id": video_id,
                    "title": snippet.get("title", ""),
                    "description": snippet.get("description", ""),
                    "publishedAt": snippet.get("publishedAt"),
                    "thumbnail": thumb_url,
                    "position": snippet.get("position"),
                }
            )
        page_token = payload.get("nextPageToken")
        if not page_token:
            break
        time.sleep(0.1)
    return videos


def build_channel_catalog(api_key: str, channel_name: str) -> Dict[str, Any]:
    channel_id = find_channel_id(api_key, channel_name)
    playlists = list_playlists(api_key, channel_id)

    categories = []
    for pl in playlists:
        vids = list_videos_in_playlist(api_key, pl["id"])
        if not vids:
            continue
        # Newest first within playlist (publishedAt may be None for some items, fallback by position)
        vids_sorted = sorted(
            vids,
            key=lambda v: (v.get("publishedAt") or "", -(v.get("position") or 0)),
            reverse=True,
        )
        categories.append(
            {
                "id": pl["id"],
                "title": pl["title"],
                "videos": vids_sorted,
            }
        )
        # Be gentle with API quotas
        time.sleep(0.15)

    # Sort categories alphabetically by title for consistent UI (can be adjusted later)
    categories = sorted(categories, key=lambda c: c["title"].lower())

    return {
        "channel": {
            "name": channel_name,
            "id": channel_id,
        },
        "categories": categories,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def main(argv: Optional[List[str]] = None) -> int:
    # Load environment variables from a local .env if present (no external deps)
    def load_env_from_dotenv(path: str = ".env") -> None:
        if not os.path.exists(path):
            return
        try:
            with open(path, "r", encoding="utf-8") as f:
                for raw in f:
                    line = raw.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    # Do not override if already set in environment
                    if key and key not in os.environ:
                        os.environ[key] = value
        except Exception:
            # Non-fatal: ignore malformed .env
            pass

    load_env_from_dotenv()
    parser = argparse.ArgumentParser(description="Fetch YouTube channel playlists/videos and write JSON")
    parser.add_argument("--api-key", dest="api_key", default=os.getenv("YT_API_KEY", DEFAULT_API_KEY))
    parser.add_argument("--channel-name", dest="channel_name", default="Knowledge Boat")
    parser.add_argument("--out", dest="out_path", default=os.path.join("public", "videos.json"))
    args = parser.parse_args(argv)

    if not args.api_key:
        print("Missing API key. Provide --api-key or set YT_API_KEY.", file=sys.stderr)
        return 2

    try:
        catalog = build_channel_catalog(args.api_key, args.channel_name)
    except Exception as exc:
        print(f"Error while fetching data: {exc}", file=sys.stderr)
        return 1

    os.makedirs(os.path.dirname(args.out_path), exist_ok=True)
    with open(args.out_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    print(f"Wrote {args.out_path} with {sum(len(c['videos']) for c in catalog['categories'])} videos across {len(catalog['categories'])} categories.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


