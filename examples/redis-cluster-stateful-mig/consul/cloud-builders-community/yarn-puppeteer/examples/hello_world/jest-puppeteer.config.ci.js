module.exports = {
  server: {
    command: 'yarn start',
    port: 3000,
    launchTimeout: 120000,
    debug: true,
  },
  launch: {
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
  },
};
