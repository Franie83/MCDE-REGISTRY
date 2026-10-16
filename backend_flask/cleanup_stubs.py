"""Delete all auto-generated letter stubs (files with name starting with [Letter])."""
import db_utils
from sqlalchemy import text

with db_utils.SessionLocal() as s:
    rows = s.execute(text(
        "SELECT id, name FROM folder_files WHERE name LIKE '[Letter]%'"
    )).fetchall()

    if not rows:
        print("(no stubs to delete)")
    else:
        for r in rows:
            print(f"Deleting: {r[1]}")
            s.execute(text("DELETE FROM folder_files WHERE id = :id"), {"id": r[0]})
        s.commit()
        print(f"Deleted {len(rows)} stub(s)")
