"""
Edo State Ministry of Communication & Digital Economy
Central Correspondence & Document Registry — Flask Backend

Stack:
    Flask  +  SQLAlchemy  +  JWT auth  +  Cloudinary  +  Neon (PostgreSQL)
"""
import os
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps

from dotenv import load_dotenv
load_dotenv()

import jwt
import cloudinary
import cloudinary.uploader
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

try:
    from sqlalchemy.dialects.postgresql import JSONB
except Exception:
    JSONB = None

try:
    from sqlalchemy import JSON as JSONType
except Exception:
    JSONType = None


# ─────────────────────────────────────────────────────────────────────
# 1. Configuration
# ─────────────────────────────────────────────────────────────────────
def _now_utc():
    return datetime.now(timezone.utc)


def _mask_dburl(url: str) -> str:
    """Return a DB URL with the password replaced by ***."""
    import re as _re
    if not url:
        return url
    return _re.sub(r"://([^:]+):[^@]+@", r"://\1:***@", url)



def _resolve_database_url():
    raw = (os.environ.get("DATABASE_URL") or "").strip()
    if not raw:
        here = os.path.dirname(os.path.abspath(__file__))
        sqlite_path = os.path.join(here, "mocde_local_test.db")
        return f"sqlite:///{sqlite_path}", True
    if raw.startswith("postgres://"):
        raw = raw.replace("postgres://", "postgresql+psycopg://", 1)
    elif raw.startswith("postgresql://") and "+psycopg" not in raw and "+psycopg2" not in raw:
        raw = raw.replace("postgresql://", "postgresql+psycopg://", 1)
    return raw, False


DATABASE_URL, USING_SQLITE = _resolve_database_url()

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-only-change-me")
JWT_ALGO = "HS256"
JWT_EXPIRY = timedelta(days=3650)

CLOUDINARY_FOLDER = os.environ.get("CLOUDINARY_FOLDER", "edo_mocde_registry")
MAX_UPLOAD_BYTES = 50 * 1024 * 1024

# Always allow the canonical alias + all Vercel deploy subdomains by regex.
# Extra origins can still be added via the CORS_ORIGINS env var (comma-separated).
_env_extra = [
    o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()
]
CORS_ORIGINS = [
    r"https://mcde-registry.*\.vercel\.app",
    "https://mcde-registry.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
] + _env_extra

SEED_PASSWORD = "ChangeMe!2026"

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True,
)


# ─────────────────────────────────────────────────────────────────────
# 2. Flask + Database
# ─────────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES

if not USING_SQLITE:
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }

CORS(
    app,
    resources={r"/api/*": {"origins": CORS_ORIGINS}},
    supports_credentials=False,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)

db = SQLAlchemy(app)
DepartmentList = JSONB if (JSONB and not USING_SQLITE) else JSONType


# ─────────────────────────────────────────────────────────────────────
# 3. Models
# ─────────────────────────────────────────────────────────────────────
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(160), nullable=False)
    email = db.Column(db.String(160))
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(32), nullable=False, default="staff")
    department = db.Column(db.String(160))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    must_change_password = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=_now_utc, nullable=False)
    last_login = db.Column(db.DateTime)

    def to_dict(self):
        return {
            "id": self.id, "page_number": self.page_number,
            "username": self.username,
            "fullName": self.full_name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "isActive": self.is_active,
            "mustChangePassword": self.must_change_password,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "lastLogin": self.last_login.isoformat() if self.last_login else None,
        }


class Correspondence(db.Model):
    __tablename__ = "correspondence"
    id = db.Column(db.String(64), primary_key=True)
    registry_no = db.Column(db.String(80), nullable=False, index=True)
    type = db.Column(db.String(16), nullable=False)
    record_date = db.Column(db.String(16), nullable=False)
    date_on_correspondence = db.Column(db.String(16), nullable=False)
    source = db.Column(db.Text)
    target = db.Column(db.Text)
    recipient = db.Column(db.Text)
    title = db.Column(db.Text, nullable=False)
    file_number = db.Column(db.String(120), nullable=False, index=True)
    folder_id = db.Column(db.String(64))
    category = db.Column(db.String(120))
    priority = db.Column(db.String(16), default="normal")
    status = db.Column(db.String(32), default="received")
    action_officer = db.Column(db.String(160))
    physical_location = db.Column(db.String(200))
    folio_number = db.Column(db.String(64))
    remarks = db.Column(db.Text)
    dispatch_method = db.Column(db.String(64))
    letter_body = db.Column(db.Text)
    signatory = db.Column(db.String(160))
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    updated_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=_now_utc, nullable=False)
    updated_at = db.Column(db.DateTime, default=_now_utc, onupdate=_now_utc, nullable=False)

    documents = db.relationship("AttachedDocument", backref="correspondence",
                                cascade="all, delete-orphan", lazy="selectin")

    def to_dict(self):
        return {
            "id": self.id, "page_number": self.page_number, "registryNo": self.registry_no, "type": self.type,
            "recordDate": self.record_date,
            "dateOnCorrespondence": self.date_on_correspondence,
            "source": self.source, "target": self.target, "recipient": self.recipient, "title": self.title,
            "fileNumber": self.file_number, "folderId": self.folder_id,
            "category": self.category, "priority": self.priority, "status": self.status,
            "actionOfficer": self.action_officer,
            "physicalLocation": self.physical_location,
            "folioNumber": self.folio_number, "remarks": self.remarks,
            "dispatchMethod": self.dispatch_method, "letterBody": self.letter_body,
            "signatory": self.signatory,
            "documents": [d.to_dict() for d in self.documents],
            "createdByUserId": self.created_by_user_id,
            "updatedByUserId": self.updated_by_user_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class AttachedDocument(db.Model):
    __tablename__ = "attached_documents"
    id = db.Column(db.String(64), primary_key=True)
    correspondence_id = db.Column(db.String(64), db.ForeignKey("correspondence.id"), index=True)
    name = db.Column(db.String(255), nullable=False)
    size = db.Column(db.BigInteger, default=0)
    mime_type = db.Column(db.String(120))
    cloudinary_url = db.Column(db.Text, nullable=False)
    cloudinary_public_id = db.Column(db.Text, nullable=False)
    preview_content = db.Column(db.Text)
    uploaded_at = db.Column(db.DateTime, default=_now_utc, nullable=False)
    uploaded_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    page_number = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "page_number": self.page_number, "name": self.name, "size": self.size, "type": self.mime_type,
            "dataUrl": self.cloudinary_url, "cloudinaryUrl": self.cloudinary_url,
            "cloudinaryPublicId": self.cloudinary_public_id,
            "previewContent": self.preview_content,
            "uploadedAt": self.uploaded_at.isoformat() if self.uploaded_at else None,
        }


class ArchiveFolder(db.Model):
    __tablename__ = "folders"
    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    folder_code = db.Column(db.String(120), nullable=False, index=True)
    department = db.Column(db.String(160))
    description = db.Column(db.Text)
    physical_location = db.Column(db.String(200))
    color_tag = db.Column(db.String(32), default="emerald")
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=_now_utc, nullable=False)
    updated_at = db.Column(db.DateTime, default=_now_utc, onupdate=_now_utc, nullable=False)

    files = db.relationship("FolderFile", backref="folder",
                            cascade="all, delete-orphan", lazy="selectin")

    def to_dict(self):
        return {
            "id": self.id, "page_number": self.page_number, "name": self.name, "folderCode": self.folder_code,
            "department": self.department, "description": self.description,
            "physicalLocation": self.physical_location, "colorTag": self.color_tag,
            "files": [f.to_dict() for f in self.files],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class FolderFile(db.Model):
    __tablename__ = "folder_files"
    id = db.Column(db.String(64), primary_key=True)
    folder_id = db.Column(db.String(64), db.ForeignKey("folders.id"), index=True)
    name = db.Column(db.String(255), nullable=False)
    size = db.Column(db.BigInteger, default=0)
    mime_type = db.Column(db.String(120))
    cloudinary_url = db.Column(db.Text, nullable=False)
    cloudinary_public_id = db.Column(db.Text, nullable=False)
    preview_content = db.Column(db.Text)
    notes = db.Column(db.Text)
    correspondence_id = db.Column(db.String(64))
    correspondence_ref = db.Column(db.String(120))
    uploaded_at = db.Column(db.DateTime, default=_now_utc, nullable=False)
    uploaded_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    page_number = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "page_number": self.page_number, "name": self.name, "size": self.size, "type": self.mime_type,
            "dataUrl": self.cloudinary_url, "cloudinaryUrl": self.cloudinary_url,
            "cloudinaryPublicId": self.cloudinary_public_id,
            "previewContent": self.preview_content, "notes": self.notes,
            "correspondenceId": self.correspondence_id,
            "correspondenceRef": self.correspondence_ref,
            "uploadedAt": self.uploaded_at.isoformat() if self.uploaded_at else None,
        }


class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=_now_utc, nullable=False, index=True)
    action = db.Column(db.String(64), nullable=False)
    actor_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    actor_name = db.Column(db.String(160))
    actor_role = db.Column(db.String(32))
    entity_type = db.Column(db.String(32))
    entity_id = db.Column(db.String(64))
    entity_ref = db.Column(db.String(120))
    title = db.Column(db.Text)
    details = db.Column(db.Text)
    ip_address = db.Column(db.String(64))

    def to_dict(self):
        return {
            "id": f"audit-{self.id}",
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "action": self.action, "actor": self.actor_name or "System",
            "actorRole": self.actor_role or "",
            "entityType": self.entity_type, "entityId": self.entity_id,
            "entityRef": self.entity_ref, "title": self.title, "details": self.details,
            "workstation": self.ip_address or "MOCDE Intranet Terminal",
        }


class CmsSettings(db.Model):
    __tablename__ = "cms_settings"
    id = db.Column(db.Integer, primary_key=True)
    state_name = db.Column(db.String(160))
    mda_name = db.Column(db.String(200))
    department = db.Column(db.String(200))
    address = db.Column(db.Text)
    logo_url = db.Column(db.Text)
    stamp_url = db.Column(db.Text)

    # Letter template / print content
    letter_subtitle       = db.Column(db.String(255))
    default_letter_para_1 = db.Column(db.Text)
    default_letter_para_2 = db.Column(db.Text)
    default_letter_para_3 = db.Column(db.Text)
    outgoing_from_line    = db.Column(db.String(255))
    stamp_caption         = db.Column(db.String(120))
    inward_prefix = db.Column(db.String(64))
    outward_prefix = db.Column(db.String(64))
    current_year = db.Column(db.String(8))
    official_email = db.Column(db.String(160))
    official_phone = db.Column(db.String(64))
    active_officer_name = db.Column(db.String(160))
    active_officer_role = db.Column(db.String(160))
    banner_notice = db.Column(db.Text)
    departments = db.Column(DepartmentList, default=list)
    storage_locations = db.Column(DepartmentList, default=list)
    categories = db.Column(DepartmentList, default=list)
    officers = db.Column(DepartmentList, default=list)
    updated_at = db.Column(db.DateTime, default=_now_utc, onupdate=_now_utc)

    def to_dict(self):
        return {
            "stateName": self.state_name, "mdaName": self.mda_name,
            "department": self.department, "address": self.address,
            "logoUrl": self.logo_url,
            "stampUrl": self.stamp_url, "inwardPrefix": self.inward_prefix,
            "outwardPrefix": self.outward_prefix, "currentYear": self.current_year,
            "officialEmail": self.official_email, "officialPhone": self.official_phone,
            "activeOfficerName": self.active_officer_name,
            "activeOfficerRole": self.active_officer_role,
            "bannerNotice": self.banner_notice,
            "departments": self.departments or [],
            "storageLocations": self.storage_locations or [],
            "categories": self.categories or [],
            "officers": self.officers or [],
            # Letterhead & print content
            "letterSubtitle":      self.letter_subtitle,
            "defaultLetterPara1":  self.default_letter_para_1,
            "defaultLetterPara2":  self.default_letter_para_2,
            "defaultLetterPara3":  self.default_letter_para_3,
            "outgoingFromLine":    self.outgoing_from_line,
            "stampCaption":        self.stamp_caption,
        }


# ─────────────────────────────────────────────────────────────────────
# 4. Auth helpers
# ─────────────────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return generate_password_hash(plain, method="pbkdf2:sha256")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return check_password_hash(hashed, plain)
    except Exception:
        return False


def issue_token(user: User) -> str:
    now = _now_utc()
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + JWT_EXPIRY).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def _decode(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except Exception as e:
        print(f"[jwt] decode failed: {type(e).__name__}: {e}")
        return None


def current_user_from_request():
    auth = request.headers.get("Authorization", "") or ""
    parts = auth.strip().split(None, 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    if not token:
        return None
    payload = _decode(token)
    if not payload:
        return None
    sub = payload.get("sub")
    if not sub:
        return None
    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        return None
    user = db.session.get(User, user_id)
    if not user or not user.is_active:
        return None
    return user


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Let CORS preflight requests pass through without auth
        if request.method == "OPTIONS":
            return ("", 200)

        user = current_user_from_request()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        g.current_user = user
        return fn(*args, **kwargs)
    return wrapper


def require_role(*roles):
    def decorator(fn):
        @wraps(fn)
        @require_auth
        def wrapper(*args, **kwargs):
            if g.current_user.role not in roles:
                return jsonify({"error": "Forbidden: insufficient role"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def audit(action, entity_type, entity_id, entity_ref, title, details):
    db.session.add(AuditLog(
        action=action, actor_user_id=g.current_user.id,
        actor_name=g.current_user.full_name, actor_role=g.current_user.role,
        entity_type=entity_type, entity_id=entity_id, entity_ref=entity_ref,
        title=title, details=details, ip_address=request.remote_addr,
    ))


# ─────────────────────────────────────────────────────────────────────
# 5. Seeding
# ─────────────────────────────────────────────────────────────────────
import seed_data
from admin_routes import make_admin_blueprint


def init_db():
    db.create_all()

    if User.query.count() == 0:
        for spec in seed_data.SEED_USERS:
            db.session.add(User(
                username=spec["username"], full_name=spec["full_name"],
                email=spec["email"], role=spec["role"],
                department=spec["department"],
                password_hash=hash_password(SEED_PASSWORD),
                is_active=True, must_change_password=getattr(seed_data, "MUST_CHANGE_PASSWORD", False),
            ))
        db.session.commit()
        print(f"[init_db] Seeded {len(seed_data.SEED_USERS)} users (password: {SEED_PASSWORD})")

    if CmsSettings.query.count() == 0:
        cms = seed_data.SEED_CMS
        db.session.add(CmsSettings(
            state_name=cms["state_name"], mda_name=cms["mda_name"],
            department=cms["department"], address=cms["address"],
            inward_prefix=cms["inward_prefix"], outward_prefix=cms["outward_prefix"],
            current_year=cms["current_year"], official_email=cms["official_email"],
            official_phone=cms["official_phone"],
            active_officer_name=cms["active_officer_name"],
            active_officer_role=cms["active_officer_role"],
            banner_notice=cms["banner_notice"],
            departments=list(cms.get("departments", cms.get("departments", []))),
            storage_locations=list(cms.get("storage_locations", [])),
            categories=list(cms.get("categories", [])),
            officers=list(cms.get("officers", [])),
        ))
        db.session.commit()
        print("[init_db] Seeded default CMS settings.")


with app.app_context():
    init_db()


# ─────────────────────────────────────────────────────────────────────
# 6. Health
# ─────────────────────────────────────────────────────────────────────
# Register the admin database management blueprint
_admin_bp = make_admin_blueprint(db, User, Correspondence, ArchiveFolder,
                                 AttachedDocument, FolderFile, AuditLog,
                                 CmsSettings, audit, require_role, USING_SQLITE)
app.register_blueprint(_admin_bp)


@app.get("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "ministry": "Edo State Ministry of Communication & Digital Economy",
        "system": "Central Correspondence & Document Registry",
        "database": "sqlite (dev)" if USING_SQLITE else "postgres (neon)",
        "timestamp": _now_utc().isoformat(),
    })


# ─────────────────────────────────────────────────────────────────────
# 7. Auth routes
# ─────────────────────────────────────────────────────────────────────
@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    user = User.query.filter(db.func.lower(User.username) == username).first()

    # PENDING_APPROVAL: distinguish "pending approval" from "wrong credentials"
    if user and verify_password(password, user.password_hash):
        if not user.is_active:
            return jsonify({
                "error": "Your account is awaiting approval by the Registry Administrator. Please try again later.",
                "code": "PENDING_APPROVAL",
            }), 403
    else:
        return jsonify({"error": "Invalid credentials"}), 401

    user.last_login = _now_utc()
    db.session.commit()
    return jsonify({"token": issue_token(user), "user": user.to_dict()})


@app.post("/api/auth/register")
def register():
    """Public self-registration. Account starts INACTIVE and must be
    approved by a super_admin before the user can sign in."""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    full_name = (data.get("fullName") or "").strip()
    email = (data.get("email") or "").strip() or None
    password = data.get("password") or ""
    department = (data.get("department") or data.get("department") or "").strip() or None

    if not username or not full_name or not password:
        return jsonify({"error": "username, fullName and password are required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if User.query.filter(db.func.lower(User.username) == username).first():
        return jsonify({"error": "That username is already taken"}), 409

    user = User(
        username=username,
        full_name=full_name,
        email=email,
        role="staff",                     # new self-registrations are always staff
        department=department,
        is_active=False,                  # must be approved by super_admin
        must_change_password=False,
        password_hash=hash_password(password),
    )
    db.session.add(user)
    db.session.commit()

    # Audit it so the super admin sees the pending request
    try:
        db.session.add(AuditLog(
            action="USER_REGISTERED",
            actor_user_id=None,
            actor_name=full_name,
            actor_role="(pending)",
            entity_type="cms",
            entity_id=str(user.id),
            entity_ref=username,
            title="New self-registration pending approval",
            details=f"{full_name} ({username}) registered and awaits approval.",
            ip_address=request.remote_addr,
        ))
        db.session.commit()
    except Exception:
        db.session.rollback()

    return jsonify({
        "message": "Account created. Awaiting approval by the Registry Administrator.",
        "user": user.to_dict(),
    }), 201


@app.get("/api/auth/me")
@require_auth
def me():
    return jsonify({"user": g.current_user.to_dict()})


@app.post("/api/auth/change-password")
@require_auth
def change_password():
    data = request.get_json(silent=True) or {}
    current = data.get("currentPassword") or ""
    new = data.get("newPassword") or ""

    if len(new) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400
    if not verify_password(current, g.current_user.password_hash):
        return jsonify({"error": "Current password is incorrect"}), 401

    g.current_user.password_hash = hash_password(new)
    g.current_user.must_change_password = False
    db.session.commit()
    return jsonify({"message": "Password updated", "user": g.current_user.to_dict()})


# ─────────────────────────────────────────────────────────────────────
# 8. Users
# ─────────────────────────────────────────────────────────────────────
VALID_ROLES = {"super_admin", "hc", "ps", "director", "staff"}


@app.get("/api/users")
@require_role("super_admin")
def list_users():
    return jsonify({"users": [u.to_dict() for u in
                              User.query.order_by(User.created_at.desc()).all()]})


@app.post("/api/users")
@require_role("super_admin")
def create_user():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    full_name = (data.get("fullName") or "").strip()
    role = data.get("role")
    password = data.get("password") or SEED_PASSWORD

    if not username or not full_name or role not in VALID_ROLES:
        return jsonify({"error": "username, fullName and a valid role are required"}), 400
    if User.query.filter(db.func.lower(User.username) == username).first():
        return jsonify({"error": "Username already exists"}), 409

    user = User(
        username=username, full_name=full_name,
        email=(data.get("email") or "").strip() or None, role=role,
        department=(data.get("department") or data.get("department") or "").strip() or None,
        is_active=bool(data.get("isActive", True)), must_change_password=True,
        password_hash=hash_password(password),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created", "user": user.to_dict()}), 201


@app.put("/api/users/<int:user_id>")
@require_role("super_admin")
def update_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = request.get_json(silent=True) or {}
    if "fullName" in data: user.full_name = data["fullName"].strip()
    if "email" in data: user.email = (data["email"] or "").strip() or None
    if "role" in data:
        if data["role"] not in VALID_ROLES:
            return jsonify({"error": "Invalid role"}), 400
        user.role = data["role"]
    if "department" in data or "department" in data:
        val = data.get("department") if "department" in data else data.get("department")
        user.department = (val or "").strip() or None
    if "isActive" in data: user.is_active = bool(data["isActive"])
    if data.get("password"):
        user.password_hash = hash_password(data["password"])
        user.must_change_password = True
    db.session.commit()
    return jsonify({"message": "User updated", "user": user.to_dict()})


@app.delete("/api/users/<int:user_id>")
@require_role("super_admin")
def delete_user(user_id):
    if user_id == g.current_user.id:
        return jsonify({"error": "You cannot delete your own account"}), 400
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"})


# ─────────────────────────────────────────────────────────────────────
# 9. Cloudinary upload
# ─────────────────────────────────────────────────────────────────────
def _upload_one(file_storage, subfolder):
    if file_storage.content_length and file_storage.content_length > MAX_UPLOAD_BYTES:
        raise ValueError(f"{file_storage.filename} exceeds the 50 MB limit")
    # resource_type_for_mime: PDFs and other non-image docs must go to "raw" bucket
    # so they are publicly fetchable.
    mime = (file_storage.mimetype or "").lower()
    rtype = "image" if mime.startswith("image/") else "raw"

    # preserve_extension_public_id: keep the file extension in the URL so browsers
    # know how to render it (a PDF must end in ".pdf", not a random hash).
    import os as _os
    base, ext = _os.path.splitext(file_storage.filename or "document")
    safe_base = "".join(
        c if c.isalnum() or c in "-_." else "_" for c in base
    )[:80] or "document"
    unique = uuid.uuid4().hex[:8]
    public_id = f"{safe_base}_{unique}{ext}"

    result = cloudinary.uploader.upload(
        file_storage,
        folder=f"{CLOUDINARY_FOLDER}/{subfolder}",
        public_id=public_id,
        resource_type=rtype,
        use_filename=False,
        unique_filename=False,
        overwrite=False,
    )
    return {
        "id": f"doc-{uuid.uuid4().hex[:12]}",
        "name": file_storage.filename,
        "size": result.get("bytes", 0),
        "type": file_storage.mimetype or "application/octet-stream",
        "cloudinaryUrl": result["secure_url"],
        "cloudinaryPublicId": result["public_id"],
        "uploadedAt": _now_utc().isoformat(),
    }


@app.post("/api/upload")
@require_auth
def upload_files():
    if "files" not in request.files:
        return jsonify({"error": "No files in multipart request"}), 400
    subfolder = request.form.get("folder", "misc")
    uploaded, errors = [], []
    for f in request.files.getlist("files"):
        if not f or not f.filename:
            continue
        try:
            uploaded.append(_upload_one(f, subfolder))
        except Exception as e:
            errors.append({"name": f.filename, "error": str(e)})
    if not uploaded and errors:
        return jsonify({"error": "All uploads failed", "details": errors}), 400
    return jsonify({"documents": uploaded, "errors": errors}), 201


@app.post("/api/upload/delete")
@require_auth
def delete_upload():
    data = request.get_json(silent=True) or {}
    public_id = data.get("publicId")
    if not public_id:
        return jsonify({"error": "publicId required"}), 400
    try:
        cloudinary.uploader.destroy(public_id, resource_type="auto", invalidate=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"message": "File removed"})


# ─────────────────────────────────────────────────────────────────────
# 10. Correspondence
# ─────────────────────────────────────────────────────────────────────
EDIT_ALL = {"super_admin", "hc", "ps"}
CAN_CREATE = {"super_admin", "hc", "ps", "director", "staff"}


def _user_can_edit(record):
    u = g.current_user
    if u.role in EDIT_ALL:
        return True
    if u.role == "director":
        return (record.created_by_user_id == u.id
                or (u.department and record.category == u.department))
    if u.role == "staff":
        return record.created_by_user_id == u.id
    return False


@app.get("/api/correspondence")
@require_auth
def list_correspondence():
    q = Correspondence.query
    ctype = request.args.get("type")
    file_number = request.args.get("file_number")
    search = request.args.get("q")
    if ctype and ctype != "all":
        q = q.filter(Correspondence.type == ctype)
    if file_number and file_number != "all":
        q = q.filter(db.func.upper(Correspondence.file_number) == file_number.upper())
    if search:
        like = f"%{search}%"
        q = q.filter(db.or_(
            Correspondence.title.ilike(like),
            Correspondence.file_number.ilike(like),
            Correspondence.registry_no.ilike(like),
            Correspondence.source.ilike(like),
            Correspondence.target.ilike(like),
            Correspondence.remarks.ilike(like),
        ))
    rows = q.order_by(Correspondence.record_date.desc(),
                      Correspondence.created_at.desc()).all()
    return jsonify({"data": [r.to_dict() for r in rows], "count": len(rows)})


@app.post("/api/correspondence")
@require_auth
def create_correspondence():
    if g.current_user.role not in CAN_CREATE:
        return jsonify({"error": "Forbidden"}), 403
    data = request.get_json(silent=True) or {}
    required = ("registryNo", "recordDate", "dateOnCorrespondence", "title", "fileNumber")
    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    # Reject duplicate POSTs with the same registry number
    existing = Correspondence.query.filter_by(registry_no=data["registryNo"]).first()
    if existing:
        return jsonify({
            "error": "A record with this registry number already exists",
            "record": existing.to_dict(),
        }), 409

    rec_id = data.get("id") or f"corr-{uuid.uuid4().hex[:12]}"
    ctype = data.get("type", "incoming")
    rec = Correspondence(
        id=rec_id, registry_no=data["registryNo"], type=ctype,
        record_date=data["recordDate"],
        date_on_correspondence=data["dateOnCorrespondence"],
        source=data.get("source") if ctype == "incoming" else None,
        target=data.get("target") if ctype == "outgoing" else None,
        recipient=data.get("recipient") if ctype == "incoming" else None,
        title=data["title"], file_number=data["fileNumber"],
        folder_id=data.get("folderId"), category=data.get("category"),
        priority=data.get("priority", "normal"),
        status=data.get("status", "received"),
        action_officer=data.get("actionOfficer"),
        physical_location=data.get("physicalLocation"),
        folio_number=data.get("folioNumber"), remarks=data.get("remarks"),
        dispatch_method=data.get("dispatchMethod"),
        letter_body=data.get("letterBody"), signatory=data.get("signatory"),
        created_by_user_id=g.current_user.id,
        updated_by_user_id=g.current_user.id,
    )
    db.session.add(rec)
    for d in data.get("documents", []) or []:
        db.session.add(AttachedDocument(
            id=d.get("id") or f"doc-{uuid.uuid4().hex[:12]}",
            correspondence_id=rec_id, name=d.get("name", "document"),
            size=d.get("size", 0), mime_type=d.get("type"),
            cloudinary_url=d.get("cloudinaryUrl") or d.get("dataUrl") or "",
            cloudinary_public_id=d.get("cloudinaryPublicId") or "",
            preview_content=d.get("previewContent"),
            uploaded_by_user_id=g.current_user.id,
        ))
    audit("CREATE_CORRESPONDENCE", "correspondence", rec_id, rec.registry_no,
          rec.title, f"Logged new {ctype} mail. File: {rec.file_number}.")
    db.session.commit()
    # Assign sequential page numbers to newly attached documents
    docs = data.get("documents", [])
    if docs:
        max_page = db.session.query(db.func.max(AttachedDocument.page_number)).filter_by(correspondence_id=rec.id).scalar() or 0
        for i, d in enumerate(docs):
            doc_id = d.get("id")
            if doc_id:
                doc = db.session.get(AttachedDocument, doc_id)
                if doc:
                    doc.page_number = max_page + i + 1
                    doc.correspondence_id = rec.id
        db.session.commit()
    return jsonify({"message": "Correspondence recorded", "record": rec.to_dict()}), 201


@app.put("/api/correspondence/<rec_id>")
@require_auth
def update_correspondence(rec_id):
    rec = db.session.get(Correspondence, rec_id)
    if not rec:
        return jsonify({"error": "Not found"}), 404
    if not _user_can_edit(rec):
        return jsonify({"error": "Forbidden: you cannot edit this record"}), 403
    data = request.get_json(silent=True) or {}
    for js_key, col in {
        "recordDate": "record_date", "dateOnCorrespondence": "date_on_correspondence",
        "source": "source", "target": "target", "recipient": "recipient", "title": "title",
        "fileNumber": "file_number", "folderId": "folder_id",
        "category": "category", "priority": "priority", "status": "status",
        "actionOfficer": "action_officer", "physicalLocation": "physical_location",
        "folioNumber": "folio_number", "remarks": "remarks",
        "dispatchMethod": "dispatch_method", "letterBody": "letter_body",
        "signatory": "signatory",
    }.items():
        if js_key in data:
            setattr(rec, col, data[js_key])
    if "documents" in data:
        AttachedDocument.query.filter_by(correspondence_id=rec_id).delete()
        for d in data["documents"] or []:
            db.session.add(AttachedDocument(
                id=d.get("id") or f"doc-{uuid.uuid4().hex[:12]}",
                correspondence_id=rec_id, name=d.get("name", "document"),
                size=d.get("size", 0), mime_type=d.get("type"),
                cloudinary_url=d.get("cloudinaryUrl") or d.get("dataUrl") or "",
                cloudinary_public_id=d.get("cloudinaryPublicId") or "",
                preview_content=d.get("previewContent"),
                uploaded_by_user_id=g.current_user.id,
            ))
    rec.updated_by_user_id = g.current_user.id
    audit("UPDATE_CORRESPONDENCE", "correspondence", rec_id, rec.registry_no,
          rec.title, f"Updated {rec.type} letter. Status: {rec.status}.")
    db.session.commit()
    # Assign sequential page numbers to newly attached/updated documents
    docs = data.get("documents", [])
    if docs:
        max_page = db.session.query(db.func.max(AttachedDocument.page_number)).filter_by(correspondence_id=rec.id).scalar() or 0
        for i, d in enumerate(docs):
            doc_id = d.get("id")
            if doc_id:
                doc = db.session.get(AttachedDocument, doc_id)
                if doc:
                    # Only assign if it doesn't have one yet (so edits don't renumber existing pages)
                    if not doc.page_number:
                        doc.page_number = max_page + i + 1
                    doc.correspondence_id = rec.id
        db.session.commit()
    return jsonify({"message": "Updated", "record": rec.to_dict()})


@app.delete("/api/correspondence/<rec_id>")
@require_role("super_admin")
def delete_correspondence(rec_id):
    rec = db.session.get(Correspondence, rec_id)
    if not rec:
        return jsonify({"error": "Not found"}), 404
    audit("DELETE_CORRESPONDENCE", "correspondence", rec_id, rec.registry_no,
          rec.title, "Deleted correspondence record.")
    db.session.delete(rec)
    db.session.commit()
    return jsonify({"message": "Deleted"})


# ─────────────────────────────────────────────────────────────────────
# 11. Folders
# ─────────────────────────────────────────────────────────────────────
CAN_MANAGE_FOLDERS = {"super_admin", "hc", "ps", "director", "staff"}


@app.get("/api/folders")
@require_auth
def list_folders():
    q = ArchiveFolder.query
    search = request.args.get("q")
    if search:
        like = f"%{search}%"
        q = q.filter(db.or_(
            ArchiveFolder.name.ilike(like),
            ArchiveFolder.folder_code.ilike(like),
            ArchiveFolder.description.ilike(like),
        ))
    rows = q.order_by(ArchiveFolder.updated_at.desc()).all()
    return jsonify({"folders": [f.to_dict() for f in rows], "count": len(rows)})


@app.post("/api/folders")
@require_auth
def create_folder():
    if g.current_user.role not in CAN_MANAGE_FOLDERS:
        return jsonify({"error": "Forbidden"}), 403
    data = request.get_json(silent=True) or {}
    if not data.get("name") or not data.get("folderCode"):
        return jsonify({"error": "name and folderCode are required"}), 400

    # Idempotency: if a folder with this ID already exists, return it.
    existing_id = data.get("id")
    if existing_id:
        existing = db.session.get(ArchiveFolder, existing_id)
        if existing:
            return jsonify({
                "message": "Folder already exists",
                "folder": existing.to_dict(),
                "already_exists": True,
            }), 200

    folder = ArchiveFolder(
        id=data.get("id") or f"folder-{uuid.uuid4().hex[:12]}",
        name=data["name"], folder_code=data["folderCode"],
        department=data.get("department"), description=data.get("description"),
        physical_location=data.get("physicalLocation"),
        color_tag=data.get("colorTag", "emerald"),
        created_by_user_id=g.current_user.id,
    )
    db.session.add(folder)
    for f in data.get("files", []) or []:
        db.session.add(FolderFile(
            id=f.get("id") or f"file-{uuid.uuid4().hex[:12]}",
            folder_id=folder.id, name=f.get("name", "document"),
            size=f.get("size", 0), mime_type=f.get("type"),
            cloudinary_url=f.get("cloudinaryUrl") or f.get("dataUrl") or "",
            cloudinary_public_id=f.get("cloudinaryPublicId") or "",
            preview_content=f.get("previewContent"), notes=f.get("notes"),
            correspondence_id=f.get("correspondenceId"),
            correspondence_ref=f.get("correspondenceRef"),
            uploaded_by_user_id=g.current_user.id,
        ))
    audit("CREATE_FOLDER", "folder", folder.id, folder.folder_code, folder.name,
          f"Created new archival folder in {folder.department or 'unassigned department'}.")
    db.session.commit()
    return jsonify({"message": "Folder created", "folder": folder.to_dict()}), 201


@app.put("/api/folders/<folder_id>")
@require_auth
def update_folder(folder_id):
    if g.current_user.role not in CAN_MANAGE_FOLDERS:
        return jsonify({"error": "Forbidden"}), 403
    folder = db.session.get(ArchiveFolder, folder_id)
    if not folder:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json(silent=True) or {}
    for js_key, col in {
        "name": "name", "folderCode": "folder_code", "department": "department",
        "description": "description", "physicalLocation": "physical_location",
        "colorTag": "color_tag",
    }.items():
        if js_key in data:
            setattr(folder, col, data[js_key])
    if "files" in data:
        FolderFile.query.filter_by(folder_id=folder_id).delete()
        for f in data["files"] or []:
            db.session.add(FolderFile(
                id=f.get("id") or f"file-{uuid.uuid4().hex[:12]}",
                folder_id=folder_id, name=f.get("name", "document"),
                size=f.get("size", 0), mime_type=f.get("type"),
                cloudinary_url=f.get("cloudinaryUrl") or f.get("dataUrl") or "",
                cloudinary_public_id=f.get("cloudinaryPublicId") or "",
                preview_content=f.get("previewContent"), notes=f.get("notes"),
                correspondence_id=f.get("correspondenceId"),
                correspondence_ref=f.get("correspondenceRef"),
                uploaded_by_user_id=g.current_user.id,
            ))
    audit("UPDATE_FOLDER", "folder", folder.id, folder.folder_code, folder.name,
          "Modified folder metadata or file list.")
    db.session.commit()
    return jsonify({"message": "Folder updated", "folder": folder.to_dict()})


@app.delete("/api/folders/<folder_id>")
@require_role("super_admin")
def delete_folder(folder_id):
    folder = db.session.get(ArchiveFolder, folder_id)
    if not folder:
        return jsonify({"error": "Not found"}), 404

    # Block deletion if any correspondence references this folder.
    held = Correspondence.query.filter_by(folder_id=folder_id).count()
    if held > 0:
        return jsonify({
            "error": (
                "This folder contains " + str(held) +
                " letter(s). Delete or reassign them first."
            )
        }), 409

    audit("DELETE_FOLDER", "folder", folder.id, folder.folder_code, folder.name,
          "Deleted folder and all enclosed files.")
    db.session.delete(folder)
    db.session.commit()
    return jsonify({"message": "Folder deleted"})


# ─────────────────────────────────────────────────────────────────────
# 12. Audit log
# ─────────────────────────────────────────────────────────────────────
VIEW_AUDIT_ROLES = ("super_admin", "hc", "ps")


@app.get("/api/audit")
@require_role(*VIEW_AUDIT_ROLES)
def list_audit():
    q = AuditLog.query
    action = request.args.get("action")
    actor = request.args.get("actor")
    search = request.args.get("q")
    if action and action != "all":
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    if actor and actor != "all":
        q = q.filter(AuditLog.actor_name == actor)
    if search:
        like = f"%{search}%"
        q = q.filter(db.or_(
            AuditLog.entity_ref.ilike(like), AuditLog.title.ilike(like),
            AuditLog.details.ilike(like), AuditLog.actor_name.ilike(like),
            AuditLog.action.ilike(like),
        ))
    rows = q.order_by(AuditLog.timestamp.desc()).limit(2000).all()
    return jsonify({"logs": [r.to_dict() for r in rows], "count": len(rows)})


@app.delete("/api/audit")
@require_role("super_admin")
def clear_audit():
    AuditLog.query.delete()
    db.session.commit()
    return jsonify({"message": "Audit trail cleared"})


# ─────────────────────────────────────────────────────────────────────
# 13. CMS settings
# ─────────────────────────────────────────────────────────────────────
def _get_or_create_cms():
    row = CmsSettings.query.first()
    if not row:
        cms = seed_data.SEED_CMS
        row = CmsSettings(
            state_name=cms["state_name"], mda_name=cms["mda_name"],
            department=cms["department"], address=cms["address"],
            inward_prefix=cms["inward_prefix"], outward_prefix=cms["outward_prefix"],
            current_year=cms["current_year"], official_email=cms["official_email"],
            official_phone=cms["official_phone"],
            active_officer_name=cms["active_officer_name"],
            active_officer_role=cms["active_officer_role"],
            banner_notice=cms["banner_notice"],
            departments=list(cms.get("departments", cms.get("departments", []))),
        )
        db.session.add(row)
        db.session.commit()
    return row


@app.get("/api/public/branding")
def public_branding():
    """Public branding for login/register screens. No auth required."""
    row = CmsSettings.query.first()
    if not row:
        return jsonify({"logoUrl": None, "mdaName": None, "stateName": None, "address": None})
    return jsonify({
        "logoUrl": row.logo_url,
        "mdaName": row.mda_name,
        "stateName": row.state_name,
        "address": row.address,
    })


@app.get("/api/public/departments")
def public_departments():
    """Public list of department names for the registration form. No auth required."""
    row = CmsSettings.query.first()
    if not row or not row.departments:
        return jsonify({"departments": []})
    return jsonify({"departments": list(row.departments)})


@app.get("/api/cms")
@require_auth
def get_cms():
    return jsonify({"settings": _get_or_create_cms().to_dict()})


@app.put("/api/cms")
@require_role("super_admin")
def update_cms():
    row = _get_or_create_cms()
    data = request.get_json(silent=True) or {}
    field_map = {
        "stateName": "state_name", "mdaName": "mda_name", "department": "department",
        "address": "address", "logoUrl": "logo_url", "stampUrl": "stamp_url",
        "inwardPrefix": "inward_prefix", "outwardPrefix": "outward_prefix",
        "currentYear": "current_year", "officialEmail": "official_email",
        "officialPhone": "official_phone", "activeOfficerName": "active_officer_name",
        "activeOfficerRole": "active_officer_role", "bannerNotice": "banner_notice",
        "departments": "departments",
        "storageLocations": "storage_locations",
        "categories": "categories",
        "officers": "officers",
        "letterSubtitle":     "letter_subtitle",
        "defaultLetterPara1": "default_letter_para_1",
        "defaultLetterPara2": "default_letter_para_2",
        "defaultLetterPara3": "default_letter_para_3",
        "outgoingFromLine":   "outgoing_from_line",
        "stampCaption":       "stamp_caption",
    }
    for js_key, col in field_map.items():
        if js_key in data:
            setattr(row, col, data[js_key])
    audit("UPDATE_CMS_SETTINGS", "cms", "cms-global", row.mda_name,
          "Ministry CMS settings updated",
          "Updated Ministry branding, addresses, prefixes, or departments.")
    db.session.commit()
    return jsonify({"message": "CMS settings updated", "settings": row.to_dict()})


# ─────────────────────────────────────────────────────────────────────
# 14. Entrypoint
# ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 62)
    print("  Edo State MOCDE Registry API")
    print(f"  Database: {_mask_dburl(DATABASE_URL) if not USING_SQLITE else 'SQLite (local dev)'}")
    print("  Running:  http://127.0.0.1:5000")
    print("=" * 62)
    app.run(host="0.0.0.0", port=5000, debug=True)