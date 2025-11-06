module.exports = {
  apps: [
    {
      name: 'signagewise-app',
      script: 'npm',
      args: 'start',
      // Set the current working directory to the project root
      cwd: '/home/ubuntu/tv-adsync-admin',
      // Ensure the app uses the environment variables from the user's shell
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: 8080,
      },
    },
    {
      name: 'signagewise-ws',
      script: 'dist/websocket-server.js',
      // Set the current working directory to the project root
      cwd: '/home/ubuntu/tv-adsync-admin',
      // Ensure the app uses the environment variables from the user's shell
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: 8081,
      },
    },
  ],
};