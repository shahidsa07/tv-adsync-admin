# NextAds - Digital Signage Management

This is a Next.js application for managing digital signage content, built with Firebase and Genkit.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Docker](https://www.docker.com/) (for running a local Redis instance)

## Local Development Setup

Follow these steps to run the project on your local machine.

### 1. Install Dependencies

Install all the necessary npm packages:

```bash
npm install
```

### 2. Start a Local Redis Server

This project uses Redis for real-time notifications. The easiest way to run Redis locally is with Docker. Run this command in a separate terminal window:

```bash
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```
This command will start a Redis container in the background and make it available on port 6379. You only need to do this once.

### 3. Set Up Environment Variables

The application needs credentials to connect to Firebase and Redis.

- **Copy the example file**: Create a `.env` file by copying the example template.
  ```bash
  cp .env.example .env
  ```
- **Open `.env`** in your code editor.
- **Add Firebase Credentials**:
    1. Go to your Firebase project settings and click on the "Service accounts" tab.
    2. Click "Generate new private key" to download a JSON file with your credentials.
    3. Open the downloaded JSON file and copy the `project_id`, `client_email`, and `private_key` values into your `.env` file.
    4. **Important**: The `private_key` must be enclosed in double quotes (`"`) and all newline characters (`\n`) must be preserved exactly as they are in the JSON file.
- **Redis URL**: The default Redis URL is already included in the `.env.example` file and should work with the Docker command above.

### 4. Run the Application

Start the development server. This single command starts both the Next.js application and the WebSocket server.

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

The initial data (TVs, groups, ads) will be seeded into your Firestore database the first time you visit one of the main pages.
