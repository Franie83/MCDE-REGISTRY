"""Delete the duplicate correspondence record."""
import db_utils
from sqlalchemy import text

DUPLICATE = "EDSG/MOCDE/INW/2026/0002"

with db_utils.SessionLocal() as s:
    # Delete attached documents referencing this record
    s.execute(text(
        "DELETE FROM attached_documents WHERE correspondence_id IN "
        "(SELECT id FROM correspondence WHERE registry_no = :rn)"
    ), {"rn": DUPLICATE})

    # Delete the correspondence record itself
    result = s.execute(text(
        "DELETE FROM correspondence WHERE registry_no = :rn"
    ), {"rn": DUPLICATE})

    s.commit()
    print(f"Deleted {result.rowcount} record(s) with registry_no = {DUPLICATE}")
