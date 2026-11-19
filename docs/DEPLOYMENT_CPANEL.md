# Beccan School Website — Local Development & cPanel Deployment Guide

## 1. Local Development Commands (Frontend & PHP Backend Separate)

Do **not** execute PHP inside Vite. Run the PHP 8.1+ built-in web server and the Vite React dev server in two separate terminals:

### Terminal 1 — Start the PHP 8.1+ Backend
```bash
# 1. Create the initial administrator account (one-time setup)
php private/cli/setup-admin.php

# 2. Start PHP API + uploads server on port 8080
php -S 127.0.0.1:8080 -t public_html
```

### Terminal 2 — Start the React/Vite Frontend
```bash
npm install
VITE_PHP_API_URL=http://127.0.0.1:8080 npm run dev
```
Open `http://localhost:3000` for the public website and `http://localhost:3000/admin` for the administrator portal.

---

## 2. Production Build & Deployment Folder Structure

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
│   │   └── admin.example.json
│   ├── data/                     # Runtime JSON files (750 dir, 640 files)
│   │   ├── gallery.json
│   │   ├── news.json
│   │   ├── announcements.json
│   │   ├── events.json
│   │   └── rate_limits/
│   ├── backups/                  # Automatic pre-write JSON snapshots (750)
│   ├── lib/
│   └── cli/
│       ├── setup-admin.php
│       └── restore-backup.php
└── public_html/                  # cPanel web root (permissions: 755)
    ├── .htaccess                 # SPA fallback + security headers
    ├── index.html
    ├── assets/
    ├── src/assets/images/
    ├── api/                      # PHP 8.1+ API endpoints (755 dirs, 644 files)
    └── uploads/                  # Uploaded media (755 dirs, 644 files)
        ├── .htaccess             # Disables PHP & script execution
        ├── gallery/
        ├── news/
        └── events/
```

---

## 3. Required PHP Version & Extensions

- **PHP 8.1 or later** (tested on PHP 8.2.35)
- Required extensions (standard in cPanel PHP Selector):
  - `json` (built-in)
  - `session` (built-in)
  - `fileinfo` (strict MIME validation on image uploads)
  - `gd` (image re-encoding, resizing, and thumbnail generation)
  - `mbstring` (optional; UTF-8 fallback built-in when absent)
  - `exif` (optional; automatic JPEG orientation correction)

---

## 4. Folder Permissions

- `private/`, `private/config/`, `private/data/`, `private/backups/`: `0750`
- `private/config/admin.json`, `private/data/*.json`: `0640`
- `public_html/`, `public_html/api/`, `public_html/uploads/`: `0755`
- `.php`, `.html`, `.js`, `.css`, `.jpg`, `.png`, `.webp`: `0644`

---

## 5. Creating the First Administrator Account & Changing Passwords

### Option A — Via cPanel Terminal / SSH
```bash
cd /home/<cpanel_user>
php private/cli/setup-admin.php
```
Enter your desired username and strong password (minimum 10 characters with uppercase, lowercase, and a digit).

### Option B — Via cPanel File Manager (No SSH Required)
1. In `private/config/`, create a new file named `setup-token.txt` containing a private random 32+ character string.
2. Visit `https://yourdomain.com/admin` in your browser.
3. Enter the setup token, your administrator username, and a strong initial password.
4. Upon completion, `setup-token.txt` is automatically deleted and `private/config/admin.json` is written using `password_hash()`.

### Changing the Password Later
Sign in at `/admin`, open **Account Settings**, enter your current password and new strong password, and click **Update Password**.

---

## 6. Configuring HTTPS & Connecting Your Domain

1. In Namecheap cPanel, open **Domains** to point `beccanschool.com` (or `beccanschool.site`) to `public_html/`.
2. Enable **AutoSSL / Let's Encrypt** under **SSL/TLS Status** in cPanel.
3. Once HTTPS is active, uncomment or add an HTTP-to-HTTPS redirect at the top of `public_html/.htaccess`:
   ```apache
   RewriteCond %{HTTPS} !=on
   RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```
   PHP automatically sets the `Secure` flag on session cookies whenever HTTPS is active.

---

## 7. Testing the API

After uploading to cPanel or starting `php -S 127.0.0.1:8080 -t public_html`:
- Public session probe: `curl -i https://yourdomain.com/api/auth/session.php`
- Public gallery feed: `curl -i https://yourdomain.com/api/gallery/list.php`
- Public news feed: `curl -i https://yourdomain.com/api/news/list.php`
- Public announcements feed: `curl -i https://yourdomain.com/api/announcements/list.php`
- Public events feed: `curl -i https://yourdomain.com/api/events/list.php`
- Unauthorized admin guard test (must return HTTP `401`): `curl -i https://yourdomain.com/api/admin/overview.php`

---

## 8. Backup & Recovery Guide

- **Automatic Pre-Write Backups**: Before any modification to `gallery.json`, `news.json`, `announcements.json`, or `events.json`, a timestamped copy is saved to `private/backups/`.
- **Admin Dashboard Download & Restore**: Sign in to `/admin` -> **Account Settings** -> **JSON Backups & Recovery** to download any JSON snapshot or restore an earlier snapshot atomically.
- **CLI Restore**:
  ```bash
  php private/cli/restore-backup.php --list
  php private/cli/restore-backup.php <backup_filename.json>
  ```
- **Backing Up Uploaded Photographs**: Regularly download or archive `/home/<cpanel_user>/public_html/uploads/` together with `/home/<cpanel_user>/private/` via cPanel **Backup Wizard** or FTP/SFTP so both JSON metadata and image binaries stay synchronized.
