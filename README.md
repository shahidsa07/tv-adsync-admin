# NextAds - Digital Signage Management

This is a Next.js application for managing digital signage content, built with Firebase and Genkit.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Local Development Setup

Follow these steps to run the project on your local machine.

### 1. Install Dependencies

Install all the necessary npm packages:

```bash
npm install
```

### 2. Set Up Environment Variables

The application needs Firebase credentials to connect to Firestore.

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

### 3. Run the Application

This command will start both the Next.js application (on port 9002) and the WebSocket server (on port 9003) for you.

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.
The WebSocket server will be available at `ws://localhost:9003`.

The initial data (TVs, groups, ads) will be seeded into your Firestore database the first time you visit one of the main pages.
