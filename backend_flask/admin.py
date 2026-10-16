"""
Edo State Ministry of Communication & Digital Economy
Central Correspondence & Document Registry

Interactive database admin console.

Run:
    python admin.py

Menu:
    1. Wipe database           (delete ALL records, folders, audit, files)
    2. Reseed sample data      (restore the 5 letters + 3 folders + audit logs)
    3. Wipe + reseed           (clean slate with sample data)
    4. Reset user passwords    (back to ChangeMe!2026)
    5. List users
    6. Create a user
    7. Delete a user
    8. Show database status
    0. Exit

Connection:
    Reads DATABASE_URL from .env  (falls back to SQLite for local dev).
"""
import sys

import db_utils
import seed_data


BANNER = r"""
==========================================================
  MOCDE Registry - Database Admin Console
==========================================================
"""

MENU = """
  1. Wipe database          (delete ALL records, folders, audit, files)
  2. Reseed sample data     (restore the 5 letters + 3 folders + audit)
  3. Wipe + reseed          (clean slate with sample data)
  4. Reset user passwords   (back to ChangeMe!2026)
  5. List users
  6. Create a user
  7. Delete a user
  8. Show database status
  0. Exit
"""


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────
def hr():
    print("-" * 58)


def confirm(prompt: str) -> bool:
    ans = input(f"{prompt} [y/N]: ").strip().lower()
    return ans in ("y", "yes")


def pause():
    input("\nPress Enter to return to menu...")


def show_status():
    s = db_utils.status()
    hr()
    print("Database status")
    hr()
    print(f"  Connection:           {s.pop('connection')}")
    print()
    for k, v in s.items():
        print(f"  {k:22} {v}")
    hr()


# ─────────────────────────────────────────────────────────────────────
# Menu actions
# ─────────────────────────────────────────────────────────────────────
def action_wipe():
    hr()
    print("Wipe database")
    hr()
    print("This will permanently delete:")
    print("  - All correspondence records and attached document rows")
    print("  - All archive folders and folder file rows")
    print("  - All audit log entries")
    print()
    print("Users and CMS settings will be PRESERVED.")
    print()
    if not confirm("Are you sure?"):
        print("Cancelled.")
        return
    summary = db_utils.wipe_database(keep_users=True, keep_cms=True)
    hr()
    print("Wipe complete. Rows removed:")
    for table, count in summary.items():
        print(f"  {table:22} {count}")
    hr()


def action_reseed(force_after_wipe: bool = False):
    hr()
    print("Reseed sample data")
    hr()
    if not force_after_wipe:
        if not confirm("Insert sample letters, folders, and audit logs?"):
            print("Cancelled.")
            return
    try:
        summary = db_utils.reseed_database(force=force_after_wipe)
    except RuntimeError as e:
        print(f"Error: {e}")
        print("Hint: Run the new app.py once to create the schema, then try again.")
        return

    if summary.get("skipped"):
        print(f"Skipped: {summary.get('reason')}")
        print("Use option 3 (Wipe + reseed) if you want to force it.")
        return

    hr()
    print("Reseed complete. Rows inserted:")
    for k in ("folders", "folder_files", "correspondence",
              "attached_documents", "audit_logs"):
        print(f"  {k:22} {summary.get(k, 0)}")
    hr()


def action_wipe_and_reseed():
    hr()
    print("Wipe + reseed")
    hr()
    print("This wipes all registry data, then inserts the sample dataset.")
    print("Users and CMS settings are preserved.")
    print()
    if not confirm("Are you sure?"):
        print("Cancelled.")
        return

    summary = db_utils.wipe_database(keep_users=True, keep_cms=True)
    hr()
    print("Wipe complete. Rows removed:")
    for table, count in summary.items():
        print(f"  {table:22} {count}")

    print()
    print("Reseeding...")
    try:
        reseed_summary = db_utils.reseed_database(force=True)
    except RuntimeError as e:
        print(f"Error: {e}")
        print("Hint: Run the new app.py once to create the schema, then try again.")
        return

    hr()
    print("Reseed complete. Rows inserted:")
    for k in ("folders", "folder_files", "correspondence",
              "attached_documents", "audit_logs"):
        print(f"  {k:22} {reseed_summary.get(k, 0)}")
    hr()


def action_reset_passwords():
    hr()
    print("Reset user passwords")
    hr()
    print(f"All seeded users will be reset to: {seed_data.SEED_PASSWORD}")
    print("They will also be re-enabled and flagged must_change_password=True.")
    print()
    if not confirm("Continue?"):
        print("Cancelled.")
        return
    summary = db_utils.reset_users()
    hr()
    print(f"Passwords reset:  {summary['reset']}")
    print(f"Users created:    {summary['created']}")
    print(f"New password:     {summary['password']}")
    hr()


def action_list_users():
    hr()
    print("Users")
    hr()
    rows = db_utils.list_users()
    if not rows:
        print("  (no users yet - run option 4 to seed default users)")
        return
    print(f"  {'ID':>3}  {'Username':<16} {'Role':<12} {'Active':<7} "
          f"{'Directorate':<32} Full name")
    print("  " + "-" * 110)
    for r in rows:
        active = "yes" if r["is_active"] else "no"
        direc = r["directorate"] or "-"
        print(f"  {r['id']:>3}  {r['username']:<16} {r['role']:<12} "
              f"{active:<7} {direc:<32} {r['full_name']}")
    hr()


def action_create_user():
    hr()
    print("Create a user")
    hr()
    username = input("Username (e.g. director.fin): ").strip().lower()
    full_name = input("Full name: ").strip()
    print("Role options: super_admin, hc, ps, director, staff")
    role = input("Role: ").strip().lower()
    directorate = input("Directorate (only for 'director' role, else blank): ").strip() or None
    email = input("Email (optional): ").strip() or None
    password = input(f"Password (blank = {seed_data.SEED_PASSWORD}): ").strip() or None

    try:
        result = db_utils.create_user(
            username=username,
            full_name=full_name,
            role=role,
            email=email,
            directorate=directorate,
            password=password,
        )
    except ValueError as e:
        print(f"Error: {e}")
        return

    hr()
    print(f"User created: id={result['id']}, username={result['username']}")
    print(f"Password:     {result['password']}")
    print("(Flag must_change_password=True - they will be prompted to change on login.)")
    hr()


def action_delete_user():
    hr()
    print("Delete a user")
    hr()
    username = input("Username to delete: ").strip().lower()
    if not username:
        print("Cancelled.")
        return
    if not confirm(f"Permanently delete '{username}'?"):
        print("Cancelled.")
        return
    try:
        result = db_utils.delete_user(username)
    except ValueError as e:
        print(f"Error: {e}")
        return
    hr()
    print(f"Deleted: username={result['username']} (id={result['id']})")
    hr()


# ─────────────────────────────────────────────────────────────────────
# Main loop
# ─────────────────────────────────────────────────────────────────────
def main():
    print(BANNER)
    print(f"Connection: {db_utils.describe_connection()}")
    print()

    actions = {
        "1": action_wipe,
        "2": action_reseed,
        "3": action_wipe_and_reseed,
        "4": action_reset_passwords,
        "5": action_list_users,
        "6": action_create_user,
        "7": action_delete_user,
        "8": show_status,
    }

    while True:
        print(MENU)
        choice = input("Choose an option: ").strip()

        if choice == "0":
            print("Goodbye.")
            return
        action = actions.get(choice)
        if not action:
            print("Invalid choice.")
            continue

        try:
            action()
        except KeyboardInterrupt:
            print("\nInterrupted.")
        except Exception as e:
            print(f"Unexpected error: {type(e).__name__}: {e}")

        pause()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nExiting.")
        sys.exit(0)