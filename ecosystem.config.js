module.exports = {
  apps: [
    {
      name: 'signagewise-app',
      script: './dist/server.js',
      // Arguments to pass to the Node.js interpreter
      interpreter_args: "-r module-alias/register",
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
