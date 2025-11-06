module.exports = {
  apps: [
    {
      name: 'signagewise-app',
      script: './.next/standalone/server.js',
      // Set the current working directory to the project root
      cwd: '.',
      // Ensure the app uses the environment variables from the user's shell
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    },
  ],
};
