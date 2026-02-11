# MongoDB Proxy Server

Express proxy that connects the frontend to MongoDB.

## Environment Variables

- `MONGODB_URI` — MongoDB connection string
- `PROXY_SECRET` — shared secret for auth header
- `PORT` — server port (default 3000)

## Run Standalone

```sh
cd proxy-server
npm install
MONGODB_URI="mongodb://localhost:27017" PROXY_SECRET="secret" node index.js
```
