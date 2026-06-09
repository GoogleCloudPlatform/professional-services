/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:5173/dashboard');
  
  // Array of modes to test: [Button Text, Expected URL Path]
  const modesToTest = [
    ['Google (1P) Video Avatar', '/advisor/google-1p'],
    ['HeyGen (3P) Video Avatar', '/advisor/heygen'],
    ['Voice-Only Advisor', '/advisor/voice-only']
  ];

  for (const [btnText, expectedPath] of modesToTest) {
    console.log(`\nTesting mode: ${btnText}`);
    
    // Go back to dashboard to reset
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('networkidle');

    // 1. Click the interaction mode button in the sidebar
    console.log(`  -> Selecting '${btnText}' in sidebar`);
    await page.getByRole('button', { name: btnText }).click();
    
    // 2. Click the 'My Advisor' button in the bottom navigation
    // We target the button itself to be safe, searching for the icon or exact structure
    console.log(`  -> Clicking 'My Advisor' FAB`);
    await page.locator('button:has(+ p:text("My Advisor"))').click();
    
    // 3. Wait a moment for navigation
    await page.waitForTimeout(500);
    
    // 4. Verify the URL
    const currentUrl = page.url();
    if (currentUrl.includes(expectedPath)) {
      console.log(`  ✅ Success: Routed to ${expectedPath}`);
    } else {
      console.error(`  ❌ Failed: Expected to route to ${expectedPath}, but landed on ${currentUrl}`);
      process.exit(1);
    }
  }

  console.log('\nAll routing tests passed successfully!');
  await browser.close();
})();
