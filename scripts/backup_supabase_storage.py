#!/usr/bin/env python3
"""Read-only export of one private Supabase Storage bucket."""
import json
import os
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "profile-photos")
ROOT = pathlib.Path(os.environ.get("BACKUP_STORAGE_DIR", "backup/storage")) / BUCKET
ROOT.mkdir(parents=True, exist_ok=True)

def request_json(url, payload=None):
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(
        url, data=data, method="GET" if payload is None else "POST",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as response:
        return json.loads(response.read().decode())

def download_object(key, destination):
    url = f"{BASE}/storage/v1/object/authenticated/{urllib.parse.quote(BUCKET, safe='')}/{urllib.parse.quote(key, safe='/')}"
    req = urllib.request.Request(url, headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"})
    with urllib.request.urlopen(req, timeout=180) as response, destination.open("wb") as out:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)

count = 0
total_bytes = 0

def walk(prefix=""):
    global count, total_bytes
    offset = 0
    while True:
        items = request_json(
            f"{BASE}/storage/v1/object/list/{urllib.parse.quote(BUCKET, safe='')}",
            {"prefix": prefix, "limit": 100, "offset": offset, "sortBy": {"column": "name", "order": "asc"}},
        )
        if not isinstance(items, list):
            raise RuntimeError(f"Unexpected Storage list response for prefix {prefix!r}")
        for item in items:
            name = item.get("name")
            if not name or "/" in name or name in (".", ".."):
                raise RuntimeError(f"Unexpected Storage object entry: {item!r}")
            key = f"{prefix}{name}"
            if item.get("id") is None and item.get("metadata") is None:
                walk(f"{key}/")
                continue
            relative = pathlib.PurePosixPath(key)
            destination = ROOT.joinpath(*relative.parts)
            destination.parent.mkdir(parents=True, exist_ok=True)
            if ROOT.resolve() not in destination.resolve().parents:
                raise RuntimeError("Storage object path escaped backup directory")
            download_object(key, destination)
            count += 1
            total_bytes += destination.stat().st_size
        if len(items) < 100:
            break
        offset += len(items)

walk()
manifest = {
    "bucket": BUCKET,
    "objects_downloaded": count,
    "bytes_downloaded": total_bytes,
    "note": "Object contents exported read-only; object metadata is included in the PostgreSQL dump.",
}
(ROOT.parent / "storage-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"Storage export complete: {count} objects, {total_bytes} bytes")
