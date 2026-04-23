# OperatorOS deployment today

## Current status
OperatorOS is now running publicly on this server at:
- `http://185.170.58.231`

It is served by:
- `nginx` on port `80`
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
- owner pages are protected in-app by owner login sessions:
  - `/owner/login`
  - `/projects`
  - `/projects/[id]`
  - `/approvals`
  - `/runs/[id]`
- owner APIs accept a signed owner session cookie
- nginx basic auth + trusted owner header can still be kept as defense-in-depth for owner routes:
  - `/api/projects/...`
  - `/api/approvals/...`

## Data path
Recommended live data path:
- `OPERATOROS_DATABASE_PATH=/var/lib/operatoros/operatoros-db.sqlite`

Legacy migration support:
- if `OPERATOROS_DATA_PATH` still points at the old JSON snapshot and the sqlite file does not exist yet,
  OperatorOS will import that JSON into a sibling `.sqlite` file on first boot.

## Required production env
At minimum set:
```bash
OPERATOROS_DATABASE_PATH=/var/lib/operatoros/operatoros-db.sqlite
OWNER_PASSWORD='<strong-password>'
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
```

## systemd service
Install from:
- `deploy/operatoros.service`

Recommended: add the owner password in a systemd drop-in rather than hardcoding it in the unit file.

Example:
```bash
mkdir -p /etc/systemd/system/operatoros.service.d
cat >/etc/systemd/system/operatoros.service.d/env.conf <<'EOF'
[Service]
Environment=OWNER_PASSWORD=<strong-password>
EOF

cp deploy/operatoros.service /etc/systemd/system/operatoros.service
systemctl daemon-reload
systemctl enable --now operatoros
systemctl restart operatoros
systemctl status operatoros --no-pager
```

## nginx reverse proxy
Install packages if needed:
```bash
apt-get update
apt-get install -y nginx apache2-utils
```

Copy config:
```bash
cp deploy/nginx-operatoros.conf /etc/nginx/sites-available/operatoros
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/operatoros /etc/nginx/sites-enabled/operatoros
nginx -t
systemctl restart nginx
```

## Optional extra protection for owner routes
You can keep nginx basic auth in front of owner routes as an extra guardrail:
```bash
htpasswd -bc /etc/nginx/.htpasswd-operatoros operatoros '<password>'
systemctl reload nginx
```

## Verify deployment
```bash
curl -I http://127.0.0.1
curl -I http://185.170.58.231
curl -I http://127.0.0.1/owner/login
curl -I http://127.0.0.1/projects
systemctl status operatoros --no-pager
systemctl status nginx --no-pager
```

Expected:
- home page returns `200`
- owner login page returns `200`
- owner routes redirect to `/owner/login` when no valid app session is present
- both services show `active (running)`

## Remaining production upgrades
- add HTTPS with a real domain
- replace manual payment flow with a real checkout provider
- upgrade owner auth beyond single-password auth
- move from snapshot-style SQLite persistence to a more normalized schema if needed
