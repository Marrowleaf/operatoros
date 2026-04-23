# OperatorOS deployment today

## Current status
OperatorOS is now running publicly at:
- `https://185.170.58.231.sslip.io`
- fallback HTTP/IP: `http://185.170.58.231`

It is served by:
- `nginx` reverse proxy
- `systemd` service `operatoros`
- `next start` bound to `127.0.0.1:3000`
- unprivileged Linux user `operatoros`
- deployed app files under `/srv/operatoros`

## Current architecture
- public pages remain open:
  - `/`
  - `/brief`
  - `/pricing`
  - `/faq`
- project portal and preview are capability-token URLs:
  - `/project/[id]?token=...`
  - `/preview/[id]?token=...`
- checkout is live at:
  - `/checkout/[id]?token=...`
- operator pages are protected in-app by signed role sessions:
  - `/owner/login`
  - `/projects`
  - `/projects/[id]`
  - `/approvals`
  - `/runs/[id]`

## Current auth accounts
Configured live accounts:
- owner: `operatoros`
- operator: `ops`
- reviewer: `reviewer`

Passwords are stored in `/etc/operatoros.env` on the server.

## Data path
Live data is stored in:
- `OPERATOROS_DATABASE_PATH=/var/lib/operatoros/operatoros-db.sqlite`

Legacy artifact that may still exist:
- `/var/lib/operatoros/operatoros-db.json`

## HTTPS
Live certificate:
- Let's Encrypt certificate for `185.170.58.231.sslip.io`

Certbot manages renewal.

## Required production env
Current server uses:
```bash
OPERATOROS_BASE_URL=https://185.170.58.231.sslip.io
OPERATOROS_DATABASE_PATH=/var/lib/operatoros/operatoros-db.sqlite
OPERATOROS_USERS_JSON=[...]
```

Optional for real external checkout:
```bash
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

Optional for intentional demo-mode sandbox checkout only:
```bash
OPERATOROS_ALLOW_SANDBOX_PAYMENTS=1
```

## Build and verify
```bash
cd /root/hermes/operatoros
npm install
npm test
npm run build
```

## Deploy to runtime directory
```bash
mkdir -p /srv/operatoros /var/lib/operatoros
rsync -a --delete --exclude '.git' --exclude 'data' /root/hermes/operatoros/ /srv/operatoros/
chown -R operatoros:operatoros /srv/operatoros /var/lib/operatoros
systemctl restart operatoros
```

## nginx reverse proxy
Current site config lives at:
- `/etc/nginx/sites-available/operatoros`

Validate and reload:
```bash
nginx -t
systemctl reload nginx
```

## TLS / certbot
Bootstrap domain currently in use:
- `185.170.58.231.sslip.io`

The certificate was issued with:
```bash
certbot --nginx -d 185.170.58.231.sslip.io --non-interactive --agree-tos --register-unsafely-without-email --redirect
```

## Verify deployment
```bash
curl -I https://185.170.58.231.sslip.io
curl -I https://185.170.58.231.sslip.io/owner/login
curl -I https://185.170.58.231.sslip.io/projects
systemctl status operatoros --no-pager
systemctl status nginx --no-pager
```

Expected:
- home page returns `200`
- owner login page returns `200`
- owner routes redirect to `/owner/login` when no valid app session is present
- both services show `active (running)`

## Remaining production upgrades
- swap sslip.io for a branded domain
- configure live Stripe keys and webhook processing
- move credentials management out of static env files
- expand reporting / notifications
