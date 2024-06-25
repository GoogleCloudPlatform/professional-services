// Increase timeout since e2e tests take longer
jest.setTimeout(30000);

describe('index.js', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000');
  });

  it('renders /', async () => {
    await expect(page).toMatch('Hello World!');
  });
});
