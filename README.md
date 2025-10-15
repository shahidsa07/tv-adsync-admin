# NextAds - Digital Signage Management

This is a Next.js application for managing digital signage content, built with Firebase and Genkit.

## Local Development Setup

Follow these steps to run the project on your local machine.

### 1. Install Dependencies

If you haven't already, install all the necessary npm packages:

```bash
npm install
```

### 2. Set Up Environment Variables

The application uses Firebase and requires service account credentials to connect to Firestore.

- Copy the example environment file if it doesn't exist:
  ```bash
  cp .env.example .env
  ```
- Open the newly created `.env` file in your code editor.
- Replace the placeholder values with your actual Firebase service account credentials. You can find these in the `service-account.json` file you downloaded from your Firebase project settings.

**Important**: The `FIREBASE_PRIVATE_KEY` must be enclosed in double quotes (`"`) in your `.env` file.

### 3. Run the Application

This command starts the Next.js app and the WebSocket server together.

```bash
npm run dev
```

### 4. Access the Application

Once the server is running, open your web browser and navigate to:

[http://localhost:9002](http://localhost:9002)

The initial data (TVs, groups, ads) will be seeded into your Firestore database the first time you visit one of the main pages.

## Deployment to Firebase App Hosting

This application is configured for easy deployment to Firebase App Hosting.

1.  **Commit and Push:** Commit all your code changes to your GitHub repository.
2.  **Connect to Firebase:** In the [Firebase Console](https://console.firebase.google.com/), create a new App Hosting backend and connect it to your GitHub repository.
3.  **Deploy:** After connecting, App Hosting will automatically build and deploy your application on every push to your main branch. Your `apphosting.yaml` file is already configured for this process.

Your application will be available at the URL provided by Firebase App Hosting.
