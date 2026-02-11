# Zero Trust Security Web Application

A web application demonstrating zero trust security principles for my UWS dissertation project.

## Tech Stack

- React + TypeScript (Vite)
- Tailwind CSS + shadcn/ui
- MongoDB (database)
- Express.js (proxy server)
- Docker + Docker Compose

## How to Run

### With Docker (recommended)

```sh
docker compose up --build -d
```

App runs at http://localhost:8080

### Local Development

```sh
npm install
npm run dev
```

### Check Server Logs

```sh
docker logs -f trustyguard-web-proxy-server-1
```

## Project Structure

- `src/` — React frontend (pages, components, auth logic)
- `proxy-server/` — Express server that connects to MongoDB
- `Dockerfile` — multi-stage build (Node → nginx)
- `docker-compose.yml` — runs frontend, proxy-server, and MongoDB

## Demo Accounts

The app creates demo users on first load. Check the login page for test credentials.

## Author

Rajan Chand — University of the West of Scotland
