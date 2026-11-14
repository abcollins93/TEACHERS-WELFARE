# School Welfare daily backup setup

This workflow is intentionally isolated from the live portal. It performs read-only exports and uploads only an encrypted archive to the configured Google Drive remote.

## What it backs up

- A PostgreSQL logical dump of the database (including the application, Auth, and Storage metadata schemas present in the database).
- The contents of the private `profile-photos` Storage bucket, downloaded through the authenticated Storage API.
- A small manifest describing the Storage export.

The database dump does not contain the bytes of Storage objects; those are exported separately. Auth password hashes are database data and are included in the database dump. Project-level secrets, custom SMTP credentials, and external provider credentials are not exported.

## Schedule and retention

- Runs daily at 00:00 UTC (00:00 in Ghana).
- Manual runs are available from GitHub Actions.
- Encrypted archives older than 30 days are removed from the target Drive folder.
- If any required secret is missing, the job safely skips the backup steps.

## Required GitHub Actions secrets

Create these under **Repository → Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `SUPABASE_DB_URL` | PostgreSQL **Session pooler** connection string from Supabase Dashboard → Connect. Replace the password placeholder locally before saving. Use Session pooler for broad IPv4 runner compatibility. |
| `SUPABASE_URL` | Project API URL, e.g. `https://PROJECT_REF.supabase.co`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Project service-role/secret key. Keep private; it is used only by the runner to read the private Storage bucket. |
| `RCLONE_CONFIG` | Full rclone configuration text for a remote named `gdrive`, authorized to the intended personal Google Drive. |
| `AGE_RECIPIENT` | Public age encryption recipient string beginning `age1...`. |

Generate an age key pair on a trusted computer with `age-keygen`. Store the private identity file safely offline (and in a separate secure password manager if desired); **never commit or share it**. Only the public `age1...` recipient goes into GitHub Actions secrets. Losing the private identity means the encrypted archives cannot be decrypted.

## Google Drive authorization

Use a personal Google OAuth client and the rclone Google Drive backend. Configure a remote named `gdrive` with Drive access, complete Google's browser authorization, and copy the resulting rclone configuration into the `RCLONE_CONFIG` Actions secret. Do not use a service-account credential unless the Drive owner has explicitly shared a destination folder with that service account. Avoid rclone's shared client ID; create a personal OAuth client because the shared client ID is being retired.

## Important operational notes

- Never add database dumps, Storage exports, OAuth tokens, service-role keys, database passwords, or age private keys to this public repository.
- The workflow uses PostgreSQL 17's `pg_dump` client to match the current project major version.
- Use the age private identity locally to decrypt an archive before restoration. Test restoration only in a separate project/environment.
- The first successful run must be checked in Actions and in Drive. A matching uploaded file size is a transfer check, not a restore test.
- Keep the age private identity and a separate copy of the Google OAuth configuration secure. GitHub Actions secrets are not a substitute for an offline recovery copy.
