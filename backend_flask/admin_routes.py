"""Admin-only database management endpoints for the MOCDE Registry."""
from flask import Blueprint, request, jsonify, g
import db_utils as _dbu
from sqlalchemy import text as _sql


def make_admin_blueprint(db, User, Correspondence, ArchiveFolder, AttachedDocument,
                         FolderFile, AuditLog, CmsSettings, audit, require_role,
                         USING_SQLITE):
    bp = Blueprint("admin_db", __name__, url_prefix="/api/admin/db")

    @bp.get("/stats")
    @require_role("super_admin")
    def admin_db_stats():
        counts = {}
        with _dbu.SessionLocal() as s:
            for table in ("users", "correspondence", "attached_documents",
                          "folders", "folder_files", "audit_logs", "cms_settings"):
                try:
                    counts[table] = int(
                        s.execute(_sql("SELECT COUNT(*) FROM " + table)).scalar() or 0
                    )
                except Exception:
                    counts[table] = -1
        return jsonify({
            "counts": counts,
            "database": "sqlite (dev)" if USING_SQLITE else "postgres (neon)",
        })

    @bp.post("/wipe")
    @require_role("super_admin")
    def admin_db_wipe():
        summary = _dbu.wipe_database(keep_users=True, keep_cms=True)
        audit("ADMIN_DB_WIPE", "cms", "db-wipe", "Database wipe",
              "Wiped all registry data. Users preserved.")
        db.session.commit()
        return jsonify({"message": "Database wiped", "summary": summary})

    @bp.post("/reseed")
    @require_role("super_admin")
    def admin_db_reseed():
        force = request.args.get("force", "0") in ("1", "true", "yes")
        try:
            summary = _dbu.reseed_database(force=force)
        except RuntimeError as e:
            return jsonify({"error": str(e)}), 400
        if summary.get("skipped"):
            return jsonify({"message": "Skipped: database not empty",
                            "summary": summary}), 200
        audit("ADMIN_DB_RESEED", "cms", "db-reseed", "Database reseed",
              "Inserted sample data.")
        db.session.commit()
        return jsonify({"message": "Sample data inserted", "summary": summary})

    @bp.post("/wipe-reseed")
    @require_role("super_admin")
    def admin_db_wipe_reseed():
        wipe_summary = _dbu.wipe_database(keep_users=True, keep_cms=True)
        try:
            reseed_summary = _dbu.reseed_database(force=True)
        except RuntimeError as e:
            return jsonify({"error": str(e), "wipe": wipe_summary}), 400
        audit("ADMIN_DB_WIPE_RESEED", "cms", "db-wipe-reseed",
              "Database wipe + reseed",
              "Wiped and reseeded.")
        db.session.commit()
        return jsonify({
            "message": "Database wiped and reseeded",
            "wipe": wipe_summary,
            "reseed": reseed_summary,
        })

    return bp
