# Deployment Guide

This application is a **full-stack C IDE & Execution Engine** requiring:
1. **Node.js 18+** (to run the Express & WebSocket server)
2. **GCC compiler (`gcc`, `libc6-dev`)** (to compile & run native C binaries)

---

### Option 1: Railway (Easiest & Free/Low Cost)
1. Push this repository to **GitHub**.
2. Go to [railway.app](https://railway.app) and click **New Project** → **Deploy from GitHub repo**.
3. Railway will automatically detect the included `Dockerfile`.
4. Done! Railway will build the container with GCC and deploy your live URL.

---

### Option 2: Render
1. Push this repository to **GitHub**.
2. Go to [render.com](https://render.com) and create a **New Web Service**.
3. Connect your GitHub repository.
4. Select **Docker** as the Runtime (it will use the root `Dockerfile`).
5. Set the Port to `3000`.
6. Click **Create Web Service**.

---

### Option 3: Google Cloud Run / DigitalOcean / Fly.io / VPS
Build and run using Docker:
```bash
docker build -t c-ide .
docker run -p 3000:3000 c-ide
```
Visit `http://localhost:3000`.

---

### ⚠️ Note on Vercel / Netlify / GitHub Pages
Static hosts (GitHub Pages) and Serverless hosts (Vercel standard) do not have `gcc` or persistent WebSockets for real-time terminal sessions. Use **Railway**, **Render**, **Fly.io**, **Cloud Run**, or any **Docker host** instead.
