"""
Edo State Ministry of Communication & Digital Economy
Central Correspondence & Document Registry

Database utility functions for wiping, reseeding, and managing the registry.
Used by:
  - admin.py   (interactive CLI menu)
  - app.py     (optional first-boot seeding)

Connection:
  Reads DATABASE_URL from the environment / .env file.
  Falls back to a local SQLite file (mocde_local_test.db) so you can develop
  and test without touching Neon. Set DATABASE_URL in .env to switch to Neon —
  no code changes needed.

Usage from Python:
    from db_utils import wipe_database, reseed_database, reset_users, list_users
    wipe_database()
    reseed_database()
"""
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────────────────────────────
# Database connection (SQLAlchemy)
# ─────────────────────────────────────────────────────────────────────
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

_raw_url = os.environ.get("DATABASE_URL", "").strip()

if not _raw_url:
    # Local dev fallback — a SQLite file sitting next to this script
    _here = os.path.dirname(os.path.abspath(__file__))
    _sqlite_path = os.path.join(_here, "mocde_local_test.db")
    DATABASE_URL = f"sqlite:///{_sqlite_path}"
    USING_FALLBACK = True
else:
    # Neon sometimes hands back "postgres://" — SQLAlchemy wants "postgresql://"
    DATABASE_URL = _raw_url.replace("postgres://", "postgresql://", 1)
    USING_FALLBACK = False

engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, future=True)


def describe_connection() -> str:
    """Return a one-line human description of the active database."""
    if USING_FALLBACK:
        return f"SQLite (local fallback): {DATABASE_URL}"
    # Hide password when printing
    url = DATABASE_URL
    if "@" in url:
        prefix, rest = url.split("@", 1)
        if ":" in prefix:
            head, _pw = prefix.rsplit(":", 1)
            url = f"{head}:***@{rest}"
    return f"PostgreSQL (Neon): {url}"


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────
def _now():
    return datetime.now(timezone.utc).isoformat()


def _count(session, table: str) -> int:
    try:
        return session.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() or 0
    except Exception:
        return 0


def _ensure_tables_exist(session):
    """Import models lazily so db_utils works even before app.py is rewritten.
    If the tables already exist (app.py ran once), this is a no-op."""
    from sqlalchemy import inspect
    insp = inspect(engine)
    return {t for t in insp.get_table_names()}


# ─────────────────────────────────────────────────────────────────────
# Wipe
# ─────────────────────────────────────────────────────────────────────
def wipe_database(keep_users: bool = True, keep_cms: bool = True) -> dict:
    """
    Delete all registry data. By default keeps users and CMS settings so you
    can still log in and see the branded registry after wiping.

    Returns a dict with per-table deletion counts.
    """
    summary = {}
    with SessionLocal() as session:
        tables = _ensure_tables_exist(session)

        # Delete in FK-safe order
        delete_order = [
            "attached_documents",
            "folder_files",
            "audit_logs",
            "correspondence",
            "folders",
        ]
        if not keep_users:
            delete_order.append("users")
        if not keep_cms:
            delete_order.append("cms_settings")

        for table in delete_order:
            if table not in tables:
                summary[table] = "skipped (table missing)"
                continue
            before = _count(session, table)
            session.execute(text(f"DELETE FROM {table}"))
            summary[table] = before

        session.commit()

    return summary


# ─────────────────────────────────────────────────────────────────────
# Reseed
# ─────────────────────────────────────────────────────────────────────
def reseed_database(force: bool = False) -> dict:
    """
    Insert the sample data from seed_data.py.

    If force=False (default), only inserts if the correspondence table is empty.
    If force=True, inserts regardless — you'll get duplicates if data exists.

    Returns a dict summarising how many rows were inserted.
    """
    import seed_data

    summary = {"correspondence": 0, "folders": 0, "folder_files": 0,
               "attached_documents": 0, "audit_logs": 0, "skipped": False}

    with SessionLocal() as session:
        tables = _ensure_tables_exist(session)
        if "correspondence" not in tables:
            raise RuntimeError(
                "Tables don't exist yet. Run app.py once (or `python -c "
                "'from app import app'`) to create the schema first."
            )

        existing = _count(session, "correspondence")
        if existing > 0 and not force:
            summary["skipped"] = True
            summary["reason"] = f"correspondence table already has {existing} rows"
            return summary

        now = _now()

        # 1. Folders first (so correspondence can reference folder_id)
        for f in seed_data.SEED_FOLDERS:
            session.execute(text("""
                INSERT INTO folders (
                    id, name, folder_code, department, description,
                    physical_location, color_tag, created_at, updated_at
                ) VALUES (
                    :id, :name, :folder_code, :department, :description,
                    :physical_location, :color_tag, :created_at, :updated_at
                )
            """), {
                "id": f["id"],
                "name": f["name"],
                "folder_code": f["folder_code"],
                "department": f["department"],
                "description": f["description"],
                "physical_location": f["physical_location"],
                "color_tag": f.get("color_tag", "emerald"),
                "created_at": now,
                "updated_at": now,
            })
            summary["folders"] += 1

            for file in f.get("files", []):
                session.execute(text("""
                    INSERT INTO folder_files (
                        id, folder_id, name, size, mime_type,
                        cloudinary_url, cloudinary_public_id,
                        preview_content, notes,
                        correspondence_id, correspondence_ref,
                        uploaded_at
                    ) VALUES (
                        :id, :folder_id, :name, :size, :mime_type,
                        :cloudinary_url, :cloudinary_public_id,
                        :preview_content, :notes,
                        :correspondence_id, :correspondence_ref,
                        :uploaded_at
                    )
                """), {
                    "id": file["id"],
                    "folder_id": f["id"],
                    "name": file["name"],
                    "size": file.get("size", 0),
                    "mime_type": file.get("mime_type", "application/pdf"),
                    "cloudinary_url": file["cloudinary_url"],
                    "cloudinary_public_id": file["cloudinary_public_id"],
                    "preview_content": file.get("preview_content"),
                    "notes": file.get("notes"),
                    "correspondence_id": file.get("correspondence_id"),
                    "correspondence_ref": file.get("correspondence_ref"),
                    "uploaded_at": now,
                })
                summary["folder_files"] += 1

        # 2. Correspondence + attachments
        for c in seed_data.SEED_CORRESPONDENCE:
            session.execute(text("""
                INSERT INTO correspondence (
                    id, registry_no, type, record_date, date_on_correspondence,
                    source, target, title, file_number, folder_id,
                    category, priority, status, action_officer,
                    physical_location, folio_number, remarks,
                    dispatch_method, letter_body, signatory,
                    created_at, updated_at
                ) VALUES (
                    :id, :registry_no, :type, :record_date, :date_on_correspondence,
                    :source, :target, :title, :file_number, :folder_id,
                    :category, :priority, :status, :action_officer,
                    :physical_location, :folio_number, :remarks,
                    :dispatch_method, :letter_body, :signatory,
                    :created_at, :updated_at
                )
            """), {
                "id": c["id"],
                "registry_no": c["registry_no"],
                "type": c["type"],
                "record_date": c["record_date"],
                "date_on_correspondence": c["date_on_correspondence"],
                "source": c.get("source"),
                "target": c.get("target"),
                "title": c["title"],
                "file_number": c["file_number"],
                "folder_id": c.get("folder_id"),
                "category": c.get("category"),
                "priority": c.get("priority", "normal"),
                "status": c.get("status", "received"),
                "action_officer": c.get("action_officer"),
                "physical_location": c.get("physical_location"),
                "folio_number": c.get("folio_number"),
                "remarks": c.get("remarks"),
                "dispatch_method": c.get("dispatch_method"),
                "letter_body": c.get("letter_body"),
                "signatory": c.get("signatory"),
                "created_at": now,
                "updated_at": now,
            })
            summary["correspondence"] += 1

            for d in c.get("documents", []):
                session.execute(text("""
                    INSERT INTO attached_documents (
                        id, correspondence_id, name, size, mime_type,
                        cloudinary_url, cloudinary_public_id,
                        preview_content, uploaded_at
                    ) VALUES (
                        :id, :correspondence_id, :name, :size, :mime_type,
                        :cloudinary_url, :cloudinary_public_id,
                        :preview_content, :uploaded_at
                    )
                """), {
                    "id": d["id"],
                    "correspondence_id": c["id"],
                    "name": d["name"],
                    "size": d.get("size", 0),
                    "mime_type": d.get("mime_type", "application/pdf"),
                    "cloudinary_url": d["cloudinary_url"],
                    "cloudinary_public_id": d["cloudinary_public_id"],
                    "preview_content": d.get("preview_content"),
                    "uploaded_at": now,
                })
                summary["attached_documents"] += 1

        # 3. Audit logs
        for log in seed_data.SEED_AUDIT_LOGS:
            session.execute(text("""
                INSERT INTO audit_logs (
                    timestamp, action, actor_name, actor_role,
                    entity_type, entity_id, entity_ref, title, details, ip_address
                ) VALUES (
                    :timestamp, :action, :actor_name, :actor_role,
                    :entity_type, :entity_id, :entity_ref, :title, :details, :ip_address
                )
            """), {
                "timestamp": now,
                "action": log["action"],
                "actor_name": log.get("actor_name"),
                "actor_role": log.get("actor_role"),
                "entity_type": log.get("entity_type"),
                "entity_id": log.get("entity_id"),
                "entity_ref": log.get("entity_ref"),
                "title": log.get("title"),
                "details": log.get("details"),
                "ip_address": log.get("ip_address"),
            })
            summary["audit_logs"] += 1

        session.commit()

    return summary


# ─────────────────────────────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────────────────────────────
def reset_users() -> dict:
    """Reset all seeded users' passwords back to ChangeMe!2026 and re-enable them."""
    from werkzeug.security import generate_password_hash
    import seed_data

    summary = {"reset": 0, "created": 0, "password": seed_data.SEED_PASSWORD}
    pwd_hash = generate_password_hash(seed_data.SEED_PASSWORD, method="pbkdf2:sha256")

    with SessionLocal() as session:
        for u in seed_data.SEED_USERS:
            existing = session.execute(
                text("SELECT id FROM users WHERE LOWER(username) = :u"),
                {"u": u["username"].lower()},
            ).first()

            if existing:
                session.execute(text("""
                    UPDATE users
                    SET password_hash = :h,
                        is_active = 1,
                        must_change_password = 1
                    WHERE LOWER(username) = :u
                """), {"h": pwd_hash, "u": u["username"].lower()})
                summary["reset"] += 1
            else:
                session.execute(text("""
                    INSERT INTO users (
                        username, full_name, email, password_hash,
                        role, directorate, is_active, must_change_password, created_at
                    ) VALUES (
                        :username, :full_name, :email, :password_hash,
                        :role, :directorate, 1, 1, :created_at
                    )
                """), {
                    "username": u["username"],
                    "full_name": u["full_name"],
                    "email": u.get("email"),
                    "password_hash": pwd_hash,
                    "role": u["role"],
                    "directorate": u.get("directorate"),
                    "created_at": _now(),
                })
                summary["created"] += 1

        session.commit()

    return summary


def list_users() -> list:
    """Return all users as a list of dicts (id, username, full_name, role, directorate, is_active, last_login)."""
    with SessionLocal() as session:
        rows = session.execute(text("""
            SELECT id, username, full_name, role, directorate,
                   is_active, must_change_password, last_login, created_at
            FROM users
            ORDER BY id ASC
        """)).fetchall()

    return [dict(r._mapping) for r in rows]


def create_user(username: str, full_name: str, role: str,
                email: str = None, directorate: str = None,
                password: str = None, is_active: bool = True) -> dict:
    """Create a single user. Returns {created: bool, id: int, username: str}."""
    from werkzeug.security import generate_password_hash
    import seed_data

    username = username.strip().lower()
    if role not in {"super_admin", "hc", "ps", "director", "staff"}:
        raise ValueError(f"Invalid role: {role}")
    if not username or not full_name:
        raise ValueError("username and full_name are required")

    pwd = password or seed_data.SEED_PASSWORD
    pwd_hash = generate_password_hash(pwd, method="pbkdf2:sha256")

    with SessionLocal() as session:
        existing = session.execute(
            text("SELECT id FROM users WHERE LOWER(username) = :u"),
            {"u": username},
        ).first()
        if existing:
            raise ValueError(f"User '{username}' already exists")

        session.execute(text("""
            INSERT INTO users (
                username, full_name, email, password_hash,
                role, directorate, is_active, must_change_password, created_at
            ) VALUES (
                :username, :full_name, :email, :password_hash,
                :role, :directorate, :is_active, 1, :created_at
            )
        """), {
            "username": username,
            "full_name": full_name,
            "email": email,
            "password_hash": pwd_hash,
            "role": role,
            "directorate": directorate,
            "is_active": 1 if is_active else 0,
            "created_at": _now(),
        })
        session.commit()

        new_id = session.execute(
            text("SELECT id FROM users WHERE LOWER(username) = :u"),
            {"u": username},
        ).scalar()

    return {"created": True, "id": new_id, "username": username, "password": pwd}


def delete_user(username: str) -> dict:
    """Delete a user by username. Refuses to delete the last super_admin."""
    username = username.strip().lower()

    with SessionLocal() as session:
        row = session.execute(
            text("SELECT id, role FROM users WHERE LOWER(username) = :u"),
            {"u": username},
        ).first()
        if not row:
            raise ValueError(f"User '{username}' not found")

        user_id, role = row[0], row[1]

        if role == "super_admin":
            remaining = session.execute(text(
                "SELECT COUNT(*) FROM users WHERE role = 'super_admin'"
            )).scalar()
            if remaining <= 1:
                raise ValueError("Cannot delete the last super_admin account")

        session.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
        session.commit()

    return {"deleted": True, "username": username, "id": user_id}


# ─────────────────────────────────────────────────────────────────────
# Status
# ─────────────────────────────────────────────────────────────────────
def status() -> dict:
    """Return a quick overview of row counts across all tables."""
    result = {"connection": describe_connection()}
    with SessionLocal() as session:
        for table in ("users", "correspondence", "attached_documents",
                      "folders", "folder_files", "audit_logs", "cms_settings"):
            result[table] = _count(session, table)
    return result


# ─────────────────────────────────────────────────────────────────────
# Direct CLI (python db_utils.py)
# ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("MOCDE Registry — db_utils direct run")
    print("=" * 60)
    print(describe_connection())
    print()
    print("For the full interactive menu, run:  python admin.py")
    print()
    print("Status:")
    for k, v in status().items():
        print(f"  {k:22} {v}")