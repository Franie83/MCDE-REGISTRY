"""Remove folder_file rows whose correspondence_id points to a nonexistent record."""
import db_utils
from sqlalchemy import text

with db_utils.SessionLocal() as s:
    # Count orphan rows first
    rows = s.execute(text(
        "SELECT ff.id, ff.name, ff.correspondence_id "
        "FROM folder_files ff "
        "LEFT JOIN correspondence c ON c.id = ff.correspondence_id "
        "WHERE ff.correspondence_id IS NOT NULL AND c.id IS NULL"
    )).fetchall()

    if not rows:
        print("(no orphaned folder rows)")
    else:
        for r in rows:
            print(f"Deleting orphan: {r[1]} (correspondenceId={r[2]})")
        s.execute(text(
            "DELETE FROM folder_files "
            "WHERE correspondence_id IS NOT NULL "
            "AND correspondence_id NOT IN (SELECT id FROM correspondence)"
        ))
        s.commit()
        print(f"Deleted {len(rows)} orphan row(s)")
