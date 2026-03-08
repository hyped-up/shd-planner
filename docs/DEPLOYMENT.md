# Deployment Guide

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+

## Local Development

```bash
cd shd-planner
npm install
cp .env.example .env.local
npm run dev
# Open http://localhost:3000
```

## Production Build

```bash
npm run build
npm start  # Starts on port 3000
```

## Vercel Deployment

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Vercel auto-detects Next.js — no config needed
3. If using a monorepo, set root directory to `shd-planner/`
4. Add environment variables in the Vercel dashboard (see table below)
5. Push to `main` — Vercel deploys automatically

## Docker Deployment

```bash
# Build the image
docker build -t shd-planner .

# Run the container
docker run -p 3000:3000 shd-planner

# With environment variables
docker run -p 3000:3000 \
  -e GOOGLE_CLIENT_ID=your-id \
  -e GOOGLE_CLIENT_SECRET=your-secret \
  shd-planner
```

### Docker Compose

```yaml
version: "3.8"
services:
  shd-planner:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## Self-Hosted (VPS / Bare Metal)

### Using PM2

```bash
npm install -g pm2
npm run build
pm2 start npm --name "shd-planner" -- start
pm2 save
pm2 startup  # Auto-start on reboot
```

### Using systemd

Create `/etc/systemd/system/shd-planner.service`:

```ini
[Unit]
Description=SHD Planner
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/shd-planner
ExecStart=/usr/bin/node .next/standalone/server.js
Environment=NODE_ENV=production
Environment=PORT=3000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable shd-planner
sudo systemctl start shd-planner
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name shd-planner.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID for Drive backup |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | No | OAuth callback URL (e.g., `https://your-domain/api/auth/google/callback`) |
| `NEXT_PUBLIC_APP_URL` | No | Base URL of the app (defaults to `http://localhost:3000`) |

AI keys (Anthropic/OpenAI) are stored client-side in localStorage via the Settings page. They are never sent to the server.

## Data Management

All game data is committed to git — no scraping is needed for basic deployment. To refresh data after a game update:

```bash
# Refresh game data from community sources
npm run scrape:all
npm run data:merge

# Refresh item icons from Fandom Wiki
npm run scrape:icons
npm run data:merge-icons

# Validate data integrity
npm run data:validate
npm run data:cross-validate
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `PORT=3001 npm start` |
| Build fails on low memory | `NODE_OPTIONS=--max-old-space-size=4096 npm run build` |
| Icons not showing | Run `npm run scrape:icons && npm run data:merge-icons` |
| Google Drive not connecting | Verify OAuth redirect URI matches your deployment URL |
| Stale game data | Run `npm run scrape:all && npm run data:merge` |
