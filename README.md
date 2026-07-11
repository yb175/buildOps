# BuildOps Monorepo

Welcome to BuildOps! This is a monorepo containing the client (React + Vite + TypeScript) and server (Express + TypeScript + Prisma) applications.

## Development Setup

### Prerequisites

- Node.js (v24+)
- npm
- Docker and Docker Compose

### Step 1: Start the Database

Start the PostgreSQL container:

```bash
docker compose up -d
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run the Development Servers

```bash
npm run dev
```

This will start Turborepo, running both the client and server concurrently.

## Production Deployment (Render)

The server is set up to run on Render out-of-the-box. Ensure you set the `DATABASE_URL` and `PORT` environment variables in your Render service configuration.
