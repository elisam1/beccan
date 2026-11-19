# Beccan School Website — Local Development & cPanel Deployment Guide

## 1. Local Development Commands (Frontend & PHP Backend Separate)

Do **not** execute PHP inside Vite. Run the PHP 8.1+ built-in web server and the Vite React dev server in two separate terminals:

### Terminal 1 — Start the PHP 8.1+ Backend
```bash
# 1. Create the initial administrator account (one-time setup)
php private/cli/setup-admin.php

# 2. Start PHP API + private media server on port 8080
php -S 127.0.0.1:8080 -t public_html
```

### Terminal 2 — Start the React/Vite Frontend
```bash
npm install
VITE_PHP_API_URL=http://127.0.0.1:8080 npm run dev
```
Open `http://localhost:3000` for the public website and `http://localhost:3000/admin` for the administrator portal.

---

## 2. Production Build & Private Media Directory Structure

Run:
```bash
npm run build:cpanel
```
This builds the React SPA (`vite build`) and copies static assets into `public_html/` while preserving `public_html/api/`, `public_html/uploads/`, and `public_html/.htaccess`.

### Recommended Namecheap / cPanel Directory Layout
Upload `private/` **above** `public_html/` in your cPanel home directory (`/home/<cpanel_user>/`):

```text
/home/<cpanel_user>/
├── private/                      # Outside public web root (permissions: 750)
│   ├── .htaccess
│   ├── config/
│   │   ├── bootstrap.php
│   │   ├── admin.json            # Created during one-time setup (640)
│   │   ├── admin.example.json
│   │   ├── settings.json         # Optional storage quota & retention config (640)
│   │   └── settings.example.json
│   ├── data/                     # Runtime JSON files (750 dir, 640 files)
│   │   ├── gallery.json
│   │   ├── news.json
│   │   ├── announcements.json
│   │   ├── events.json
│   │   └── rate_limits/
│   ├── media/                    # Private uploaded images & thumbnails (750 dirs, 640 files)
│   │   ├── gallery/
│   │   │   └── thumbs/
│   │   ├── news/
│   │   │   └── thumbs/
│   │   └── events/
│   │       └── thumbs/
│   ├── tmp/uploads/              # Staging directory for failure-safe uploads & restores (750)
│   ├── backups/                  # Media-aware snapshots: records.json + manifest.json + media/ (750)
│   ├── lib/
│   └── cli/
│       ├── setup-admin.php
│       ├── restore-backup.php
│       └── migrate-legacy-media.php
└── public_html/                  # cPanel web root (permissions: 755)
    ├── .htaccess                 # SPA fallback + security headers
    ├── index.html
    ├── assets/
    ├── src/assets/images/
    ├── api/                      # PHP 8.1+ API endpoints (755 dirs, 644 files)
    │   └── media/serve.php       # Enforces published status / admin auth before streaming private media
    └── uploads/                  # Legacy directory only (locked down via .htaccess; keep empty after migration)
```

---

## 3. Required PHP Version, Extensions & Recommended Upload Settings

- **PHP 8.1 or later** (tested on PHP 8.2.35)
- **Required PHP extensions** (enable in cPanel **Select PHP Version**):
  - `json` (built-in)
  - `session` (built-in)
  - `fileinfo` (strict server-side MIME validation — uploads are blocked if absent)
  - `gd` (image re-encoding, resizing, thumbnailing — uploads are blocked if absent)
- **Optional PHP extensions**:
  - `zip` (`ZipArchive`) — enables downloading complete `.zip` backup archives (JSON + media) from Account Settings. If `ext-zip` is disabled, server-side complete backups and restoration still work in full, and Account Settings explains why `.zip` export is unavailable.
  - `exif` — automatic JPEG orientation correction.
  - `mbstring` — UTF-8 text truncation (built-in UTF-8 fallback provided if absent).

### Recommended `php.ini` / cPanel MultiPHP INI Settings (for 12-photo Gallery Batches)
Gallery batch uploads allow up to **12 photos at up to 6 MB each**:
- `file_uploads = On`
- `max_file_uploads = 20` (must be `>= 12`)
- `upload_max_filesize = 8M` (must be `>= 6M`)
- `post_max_size = 80M` (allows a full 12 × 6 MB batch plus multipart headers)
- `memory_limit = 256M` (safe headroom for GD raster decoding of high-megapixel phone photos)

---

## 4. Folder Permissions

- `private/`, `private/config/`, `private/data/`, `private/media/`, `private/tmp/`, `private/backups/`: `0750`
- `private/config/admin.json`, `private/config/settings.json`, `private/data/*.json`, `private/media/**/*`: `0640`
- `public_html/`, `public_html/api/`, `public_html/uploads/`: `0755`
- `.php`, `.html`, `.js`, `.css`: `0644`

---

## 5. Creating the First Administrator Account & Changing Passwords

### Option A — Via cPanel Terminal / SSH
```bash
cd /home/<cpanel_user>
php private/cli/setup-admin.php
```

### Option B — Via cPanel File Manager (No SSH Required)
1. In `private/config/`, create `setup-token.txt` containing a random 32+ character string.
2. Visit `https://yourdomain.com/admin` and complete setup.
3. Upon success, `setup-token.txt` is automatically deleted and `private/config/admin.json` is written using `password_hash()`.

---

## 6. Migrating Legacy `/uploads/` Images to Private Storage

If any existing JSON records still reference `/uploads/gallery/...`, `/uploads/news/...`, or `/uploads/events/...`:

```bash
cd /home/<cpanel_user>

# 1. Preview what will be migrated without modifying files:
php private/cli/migrate-legacy-media.php --dry-run

# 2. Copy legacy images + thumbnails to private/media/, verify SHA-256 checksums,
#    and atomically update JSON records to /api/media/serve.php?...
#    (Original public files are kept safely until you verify the live site.)
php private/cli/migrate-legacy-media.php

# 3. Verify the public website and /admin display all images properly.

# 4. Remove old public copies so draft/private images are no longer publicly exposed:
php private/cli/migrate-legacy-media.php --cleanup-verified
```

---

## 7. Verifying That Draft Images Cannot Be Opened Publicly

Uploaded photographs and cover images are stored in `private/media/` outside `public_html/` and served exclusively through `/api/media/serve.php?category=<bucket>&id=<recordId>&variant=<original|thumb>`.

After deploying or starting the PHP server locally:
1. Upload a test photo in `/admin` (it defaults to **draft**) and copy its `imageUrl` (e.g. `/api/media/serve.php?category=gallery&id=gal_...&variant=original`).
2. Confirm you can preview it while logged into `/admin`.
3. Open an **incognito/private browser window** (not logged in) or run `curl -i` without cookies:
   ```bash
   curl -i "https://yourdomain.com/api/media/serve.php?category=gallery&id=<draft_id>&variant=original"
   ```
   Expected result: **HTTP `403 Forbidden`** with JSON error (`Access denied: this media item is not published.`).
4. Verify directory traversal or raw filename probing fails with **HTTP `400 Bad Request`**:
   ```bash
   curl -i "https://yourdomain.com/api/media/serve.php?category=gallery&id=../../private/config/admin.json"
   ```
5. Publish the photo in `/admin` and re-run the `curl` command: expected result is **HTTP `200 OK`** with `Content-Type: image/jpeg` (or `png`/`webp`).

---

## 8. Media-Aware Backups, Safe Restoration & Storage Monitoring

### How Media-Aware Backups Work
- Every modification to `gallery`, `news`, or `events` (and every manual snapshot from **Account Settings -> Create Snapshot Now**) writes a directory snapshot under `private/backups/<collection>_<YYYYMMDD_His>_<hex>/` containing:
  - `records.json` (collection records)
  - `manifest.json` (record counts, byte totals, SHA-256 checksums for every image)
  - `media/<collection>/...` (copies of all original images and `thumbs/` referenced by the records)
- `announcements` snapshots store `records.json` and `manifest.json`.
- Retention defaults to **30 snapshots per collection** and is configurable in **Account Settings** or `private/config/settings.json` (`backupRetentionCount`).
- **Download options**:
  - When PHP `ZipArchive` (`ext-zip`) is installed, click **Complete (.zip)** to download JSON + all backed-up media.
  - **JSON Only** downloads metadata records without image binaries.

### Restoring a Backup Safely
- From `/admin` -> **Account Settings**, click **Restore** on any snapshot; or via CLI:
  ```bash
  php private/cli/restore-backup.php --list
  php private/cli/restore-backup.php <snapshot_id>
  ```
- Restoration verifies every referenced media file inside the snapshot (and its SHA-256 checksum) **before** touching live data, creates a fresh safety backup of the current live state first, restores media via temporary files, verifies restored files exist on disk, and atomically replaces the collection JSON.

### Monitoring Storage Usage
- Open `/admin` -> **Overview** or **Account Settings** to inspect real filesystem byte usage across `private/media/gallery/`, `private/media/news/`, `private/media/events/`, and `private/backups/`, original vs. thumbnail counts, and live PHP upload limits.
- Application storage quotas are optional (`storageLimitBytes` in `private/config/settings.json` or configured in **Account Settings**). When no limit is configured, the dashboard clearly indicates **No application-level limit set**.

---

## 9. Configuring HTTPS

1. Enable **AutoSSL / Let's Encrypt** in Namecheap cPanel.
2. Add an HTTP-to-HTTPS redirect at the top of `public_html/.htaccess`:
   ```apache
   RewriteCond %{HTTPS} !=on
   RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```
   PHP automatically enforces the `Secure` cookie flag on administrator sessions whenever HTTPS is active.
