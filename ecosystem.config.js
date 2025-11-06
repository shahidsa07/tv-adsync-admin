module.exports = {
  apps: [
    {
      name: 'signagewise-app',
      script: 'next',
      args: 'start -p 8080',
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
