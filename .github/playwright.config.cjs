module.exports = {
  testDir: '.',
  timeout: 30000,
  retries: 2,
  workers: 1,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
};