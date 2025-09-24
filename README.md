# SignageWise - Digital Signage Management

This is a Next.js application for managing digital signage content, built with Firebase and Genkit.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

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

### 3. Set Up Environment Variables

The application uses Firebase and requires service account credentials to connect to Firestore.

- Copy the example environment file:
  ```bash
  cp .env.example .env
  ```
- Open the newly created `.env` file in your code editor.
- Replace the placeholder values with your actual Firebase service account credentials. You can find these in the `service-account.json` file you downloaded from your Firebase project settings.

**Important**: The `FIREBASE_PRIVATE_KEY` must be enclosed in double quotes (`"`), and all newline characters (`\n`) must be preserved.

### 4. Run the Application

This project requires two separate processes to be run in two separate terminal windows.

- **Terminal 1: Start the Next.js Web App**
  This command starts the main web interface on `http://localhost:9002`.

  ```bash
  npm run dev
  ```

- **Terminal 2: Start the WebSocket Server**
  This command starts the WebSocket server on `ws://localhost:8080`, which handles real-time updates for TV clients.

  ```bash
  npm run ws:dev
  ```

### 5. Access the Application

Once both servers are running, open your web browser and navigate to:

[http://localhost:9002](http://localhost:9002)

You should see the SignageWise dashboard. The initial data (TVs, groups, ads) will be seeded into your Firestore database the first time you visit one of the main pages.
