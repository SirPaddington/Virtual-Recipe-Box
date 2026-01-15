# Deployment Guide

This guide covers how to build, deploy, and update the **Virtual Recipe Box** application.

## Prerequisites

- **Node.js**: Version 20 or higher is required.
- **Supabase**: The application relies on a cloud-hosted Supabase instance. This means your database is already independent of your local machine.

## 1. Building the Application

Next.js apps need to be "built" before they can be run in production mode. This process compiles your code for performance.

To build the application locally (for testing or manual deployment):

```bash
npm run build
```

This creates a `.next` folder with the localized production build.

To verify the build works locally:

```bash
npm run start
```

## 2. Option A: Cloud Hosting (Recommended)

The easiest way to host this application is using **Vercel** (the creators of Next.js) or **Netlify**.

### Deploying to Vercel

1.  Push your code to a GitHub repository.
2.  Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3.  Import your GitHub repository.
4.  **Environment Variables**: Vercel will ask for environment variables. You must copy the values from your `.env.local` file:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5.  Click **Deploy**.

**Benefits**:
- Automatic HTTPS (SSL).
- Global CDN for speed.
- Zero-config "Commit to Push" updates (see Section 4).

## 3. Option B: Self-Hosting (Local Network or VPS)

If you prefer to run the application on your own server (e.g., a home server, Raspberry Pi, or DigitalOcean droplet), you have two main options.

### Method 1: Node.js + PM2 (Simpler)

1.  **Install Node.js** on the target machine.
2.  **Clone the repository** onto the machine.
3.  **Install dependencies**: `npm install`.
4.  **Create .env.local**: Copy your `.env.local` file to the server.
5.  **Build**: `npm run build`.
6.  **Run with PM2**:
    We recommend using PM2, a process manager, to keep the app running in the background and restart it if it crashes or the server reboots.
    
    ```bash
    npm install -g pm2
    pm2 startnpm --name "recipe-box" -- start
    pm2 save
    pm2 startup
    ```

### Method 2: Docker (Containerized)

For maximum portability, you can run the app in a Docker container.

1.  Create a `Dockerfile` in the root of your project:
    ```dockerfile
    FROM node:20-alpine AS base

    WORKDIR /app

    COPY package*.json ./
    RUN npm ci

    COPY . .
    
    # Accept build arguments for environment variables
    ARG NEXT_PUBLIC_SUPABASE_URL
    ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
    ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
    ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

    RUN npm run build

    EXPOSE 3000
    CMD ["npm", "start"]
    ```

2.  Build and Run:
    ```bash
    # Build the image (pass your env vars here or use a .env file)
    docker build \
      --build-arg NEXT_PUBLIC_SUPABASE_URL=your_url \
      --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
      -t recipe-box .

    # Run the container
    docker run -d -p 3000:3000 --name recipe-box recipe-box
    ```

## 4. How to Update the Application

### For Cloud (Vercel/Netlify)
The process is automated:
1.  Make changes on your main computer.
2.  **Commit and Push** changes to GitHub.
3.  Vercel detects the new commit, automatically rebuilds the app, and redeploys it (usually takes 1-2 minutes).

### For Self-Hosted
You will need to manually update the server:
1.  **SSH** into your server (or open the terminal).
2.  Navigate to the project folder.
3.  **Pull changes**: `git pull`.
4.  **Rebuild**: `npm install && npm run build` (dependencies might have changed).
5.  **Restart**:
    - If using PM2: `pm2 restart recipe-box`
    - If using Docker: Rebuild the image and restart the container.

## 5. Database Independence

Since you are using **Supabase**:
- Your database lives in the cloud, completely separate from where the application runs.
- **This Machine**: You can turn off your main development computer, and the deployed application (on Vercel or your Server) will still work perfectly and connect to the same data.
- **Multiple Devices**: You can access the deployed URL from your phone, tablet, or other computers, and they will all see the same synchronized data.
