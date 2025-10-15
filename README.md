# NextAds - Digital Signage Management

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

Start the Next.js development server. This single command runs both the web application and the integrated WebSocket server.

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

### 5. Access the Application

Once the server is running, open your web browser and navigate to:

[http://localhost:9002](http://localhost:9002)

You should see the NextAds dashboard. The initial data (TVs, groups, ads) will be seeded into your Firestore database the first time you visit one of the main pages.
