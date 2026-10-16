# MOCDE Registry — Flask Backend

Runs on **PythonAnywhere**. Data in **Neon (PostgreSQL)**. Files in **Cloudinary**.
Users and CMS defaults are seeded automatically on first boot - no separate script to run.

## Local development

1. Create a venv and install deps:

```bash
cd backend_flask
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
```

2. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

3. Start the server:

```bash
python app.py
```

Runs at `http://127.0.0.1:5000`. Health: `GET /api/health`.

## First run - automatic seeding

On first boot, if the users table is empty, the app seeds:

| Username | Role | Director |
|---|---|---|
| superadmin | super_admin | - |
| hc | hc | - |
| ps | ps | - |
| director | director | ICT Infrastructure & Broadband |
| staff | staff | - |

Default password for all: `ChangeMe!2026`

The CMS settings row is also seeded with Edo State MOCDE defaults.

## Admin console - admin.py

```bash
python admin.py
```

Interactive menu:

```
  1. Wipe database
  2. Reseed sample data
  3. Wipe + reseed
  4. Reset user passwords
  5. List users
  6. Create a user
  7. Delete a user
  8. Show database status
  0. Exit
```

## Deploy on PythonAnywhere

### 1. Upload the code

```bash
cd ~
git clone <your-repo-url> mcde-registry
cd mcde-registry/backend_flask
```

Or upload the folder via the Files tab.

### 2. Create the virtualenv

```bash
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Create .env on the server

```bash
cp .env.example .env
nano .env
```

Fill in:

- DATABASE_URL - from console.neon.tech (pooled connection string)
- JWT_SECRET - generate with: python -c "import secrets; print(secrets.token_urlsafe(64))"
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET - from Cloudinary console
- CORS_ORIGINS - https://mcde-registry.vercel.app

Save with Ctrl+O, exit with Ctrl+X.

### 4. Configure the Web tab

- Source code: /home/YOURUSERNAME/mcde-registry/backend_flask
- Working directory: same
- Virtualenv: /home/YOURUSERNAME/mcde-registry/backend_flask/venv

Edit the WSGI file and replace its contents with:

```python
import sys
path = '/home/YOURUSERNAME/mcde-registry/backend_flask'
if path not in sys.path:
    sys.path.insert(0, path)
from app import app as application
```

Click Reload.

### 5. Verify

Visit https://YOURUSERNAME.pythonanywhere.com/api/health - you should see:

```json
{
  "status": "healthy",
  "ministry": "Edo State Ministry of Communication & Digital Economy",
  "system": "Central Correspondence & Document Registry",
  "database": "postgres (neon)",
  "timestamp": "..."
}
```

## Endpoints

| Method | Path | Who |
|---|---|---|
| POST | /api/auth/login | public |
| GET | /api/auth/me | any user |
| POST | /api/auth/change-password | any user |
| GET, POST | /api/users | super_admin |
| PUT, DELETE | /api/users/<id> | super_admin |
| GET, POST | /api/correspondence | any user |
| PUT | /api/correspondence/<id> | hc, ps, super_admin, or owner |
| DELETE | /api/correspondence/<id> | super_admin |
| GET, POST | /api/folders | any user |
| PUT | /api/folders/<id> | any user |
| DELETE | /api/folders/<id> | super_admin |
| GET | /api/audit | super_admin, hc, ps |
| DELETE | /api/audit | super_admin |
| GET | /api/cms | any user |
| PUT | /api/cms | super_admin |
| POST | /api/upload | any user |
| POST | /api/upload/delete | any user |
| GET | /api/health | public |

## Roles

| Role | Capabilities |
|---|---|
| super_admin | Everything, including user management and deletes |
| hc | View/edit all letters, view audit, cannot delete |
| ps | View/edit all letters, view audit, cannot delete |
| director | Create letters, edit own or own-directorate letters |
| staff | Create letters, edit own drafts only |

## Files

| File | Purpose |
|---|---|
| app.py | Flask app: models, JWT auth, all routes, Cloudinary, auto-seed |
| seed_data.py | Sample users, folders, correspondence, audit logs |
| db_utils.py | wipe_database(), reseed_database(), reset_users() |
| admin.py | Interactive CLI |
| requirements.txt | Pinned deps with environment markers |
| .env.example | Config template |

## Notes

- JWT tokens never expire (exp = 10 years). Logout is client-side.
- Database driver is auto-selected: psycopg3 on Python >= 3.14, psycopg2-binary on older.
- SQLite fallback (mocde_local_test.db) when DATABASE_URL is unset.
- Add DATABASE_URL to .env and restart to switch from SQLite to Neon.
