# NextAds - Digital Signage Management

This is a Next.js application for managing digital signage content, built with Firebase and Genkit.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Docker](https://www.docker.com/) (for running a local Redis instance)

## Local Development Setup

Follow these steps to run the project on your local machine.

### 1. Clone the Repository

If you haven't already, clone the project to your local machine:

```bash
git clone https://github.com/shahidsa07/tv-adsync-admin.git
cd tv-adsync-admin
```

### 2. Install Dependencies

Install all the necessary npm packages:

```bash
npm install
```

### 3. Start a Local Redis Server

This project uses Redis for real-time notifications between the server and clients. The easiest way to run Redis locally is with Docker.

```bash
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```
This command will start a Redis container and make it available on port 6379.

### 4. Set Up Environment Variables

The application uses Firebase and Redis. You need to configure credentials for both.

- Copy the example environment file:
  ```bash
  cp .env.example .env
  ```
- Open the newly created `.env` file in your code editor.
- **Firebase**: Replace the placeholder values with your actual Firebase service account credentials. You can find these in the `service-account.json` file you downloaded from your Firebase project settings.
- **Redis**: The default Redis URL is already included. If your Redis server runs on a different URL, update `REDIS_URL`.

**Important**: The `FIREBASE_PRIVATE_KEY` must be enclosed in double quotes (`"`), and all newline characters (`\n`) must be preserved.

### 5. Run the Application

Start the development server. The `npm run dev` command starts a single server process that handles both the Next.js application and the WebSocket connections.

```bash
npm run dev
```

### 6. Access the Application

- **Web Application**: Available at `http://localhost:9002`
- **WebSocket Server**: Listens on `ws://localhost:9002/ws`

You should see the NextAds dashboard when you navigate to the web application URL. The initial data (TVs, groups, ads) will be seeded into your Firestore database the first time you visit one of the main pages.
