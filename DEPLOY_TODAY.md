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
- owner routes are protected by nginx basic auth and app-side owner checks:
  - `/projects`
  - `/projects/[id]`
  - `/approvals`
  - `/runs/[id]`
  - `/api/projects/...`
  - `/api/approvals/...`

## Data path
Live data is stored outside the repo:
- `OPERATOROS_DATA_PATH=/var/lib/operatoros/operatoros-db.json`

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
```

## systemd service
Install from:
- `deploy/operatoros.service`

Commands:
```bash
id -u operatoros >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin operatoros
chown -R operatoros:operatoros /srv/operatoros /var/lib/operatoros
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

## Basic auth for owner routes
Create/update the htpasswd file:
```bash
htpasswd -bc /etc/nginx/.htpasswd-operatoros operatoros '<password>'
systemctl reload nginx
```

## Verify deployment
```bash
curl -I http://127.0.0.1
curl -I http://185.170.58.231
curl -I http://127.0.0.1/projects
systemctl status operatoros --no-pager
systemctl status nginx --no-pager
```

Expected:
- home page returns `200`
- protected owner routes return `401` without auth
- both services show `active (running)`

## Remaining production upgrades
- move from file store to SQLite/Postgres
- replace basic auth with app-native auth
- add HTTPS with a real domain
- replace manual payment flow with a real checkout provider
