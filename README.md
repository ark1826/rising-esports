# Rising Esports Platform

A full-stack MERN (MongoDB, Express, React, Node.js) application for esports tournament management. Features include team rankings, daily slots, tournament registrations, tier classifications, and an admin dashboard.

## Tech Stack
- Frontend: React (Vite), React Router, CSS Variables (Dark Esports Theme)
- Backend: Node.js, Express, MongoDB (Mongoose), JWT Auth
- Deployment: Vercel

## Local Development Setup

1. **Clone the repository**

2. **Backend Setup**
   ```bash
   cd server
   npm install
   # Create a .env file based on .env.example
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Admin Panel
Access the admin portal at `/admin` to manage:
- Team Rankings
- Today's Slots
- Tournaments
- Tier Classifications

## Deployment
This project is configured for deployment on Vercel using the `vercel.json` configuration file, which properly routes `/api` requests to the Express server and all other requests to the React frontend.
