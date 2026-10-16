"""Show full Cloudinary URLs for recent uploads."""
import db_utils
from sqlalchemy import text

with db_utils.SessionLocal() as s:
    rows = s.execute(text(
        "SELECT name, cloudinary_url, uploaded_at FROM attached_documents "
        "ORDER BY uploaded_at DESC LIMIT 5"
    )).fetchall()

if not rows:
    print("(no attached_documents)")
else:
    for r in rows:
        name = (r[0] or "")[:40]
        url = r[1] or "(empty)"
        # Detect bucket
        if "/raw/upload/" in url:
            bucket = "RAW"
        elif "/image/upload/" in url:
            bucket = "IMAGE"
        elif url.startswith("data:"):
            bucket = "BASE64"
        else:
            bucket = "OTHER"
        # Detect extension
        tail = url.rsplit("/", 1)[-1] if "/" in url else url
        ext = "." + tail.rsplit(".", 1)[-1] if "." in tail else "(no ext)"
        print(f"[{bucket:6}] [{ext:10}] {name}")
        print(f"           URL: {url}")
        print()
