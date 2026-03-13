# MIR — Your Inner Companion

A nightly companion for emotional release and the practice of forgiveness.
Hosted at [magicisreal.club](https://magicisreal.club).

## Stack

- **Frontend**: React + TypeScript + Vite, served by Nginx
- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **AI**: Google Gemini Flash 2.0
- **Infrastructure**: Docker Compose on Hetzner VPS

## Project Structure

```
mir/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.js      # SQLite schema & init
│   │   │   ├── queries.js     # DB query helpers
│   │   │   └── test-db.js     # Smoke test
│   │   ├── routes/
│   │   │   └── chat.js        # POST /api/chat
│   │   └── gemini.js          # Gemini API client
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── Chat.tsx           # Main chat UI
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx-frontend.conf
│   └── Dockerfile
├── nginx/
│   └── nginx.conf             # Reverse proxy + SSL
├── docker-compose.yml
├── .env.example
├── deploy.sh
└── README.md
```

## Quick Start

```bash
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY

docker compose up --build
```

## Deployment

```bash
# On the VPS — first time setup
./deploy.sh

# Update after git pull
docker compose up --build -d
```

## SSL (Let's Encrypt)

```bash
certbot certonly --standalone -d magicisreal.club -d www.magicisreal.club
```
