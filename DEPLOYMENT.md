# Deployment Guide

## 1. Push to GitHub

Since I've already initialized the git repository and committed all files, you just need to push them to a new GitHub repository.

1.  **Create a new repository** on GitHub (e.g., `3d-posture-analytics`).
2.  **Run these commands** in your terminal:

```bash
# Add your repository as the remote origin
git remote add origin https://github.com/YOUR_USERNAME/3d-posture-analytics.git

# Push the code
git push -u origin main
```

## 2. Deploy Frontend (Vercel)

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `3d-posture-analytics` repository.
4.  **Configure Project**:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `frontend` (Important! Click "Edit" and select `frontend`)
    *   **Environment Variables**:
        *   `VITE_API_URL`: `https://your-backend-app.onrender.com` (You'll get this URL after deploying the backend)
5.  Click **Deploy**.

## 3. Deploy Backend (Render)

1.  Go to [Render Dashboard](https://dashboard.render.com/).
2.  Click **"New +"** -> **"Web Service"**.
3.  Connect your GitHub repository.
4.  **Configure Service**:
    *   **Name**: `posture-analytics-api`
    *   **Root Directory**: `backend` (Important!)
    *   **Runtime**: Python 3
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5.  Click **Create Web Service**.

## 4. Final Connection

Once the backend is deployed, copy its URL (e.g., `https://posture-analytics-api.onrender.com`).

1.  Go back to your **Vercel Project Settings**.
2.  Update the `VITE_API_URL` environment variable with the actual backend URL.
3.  **Redeploy** the frontend (Go to Deployments -> Redeploy) for the changes to take effect.
