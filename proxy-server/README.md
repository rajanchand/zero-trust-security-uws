# MongoDB Proxy Server

A simple Express proxy that connects to MongoDB Atlas, designed to be deployed on Render.com (free tier).

## Setup

1. Create a new **Web Service** on [Render.com](https://render.com)
2. Connect this repo or use the files below
3. Set environment variables:
   - `MONGODB_URI` = your MongoDB connection string
   - `PROXY_SECRET` = a random secret string (also set in Lovable)
4. Deploy

## Files needed

Copy `proxy-server/index.js` and `proxy-server/package.json` to your Render project.
