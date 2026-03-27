# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import time
import pytest
from playwright.sync_api import sync_playwright

if not os.path.exists("/.dockerenv"):
    pytest.skip(
        "Skipping Native Select Rendering test outside of Docker container",
        allow_module_level=True,
    )


def test_native_select_rendering():
    """
    Empirically test if a native <select> dropdown renders correctly
    in screenshots when running inside the Debian/Xvfb container.
    """
    print("--- 🔍 Native <select> Rendering Test ---")

    with sync_playwright() as p:
        # We MUST use headless=False to use the Xvfb virtual display
        # where the OS rendering bug normally occurs.
        headless = os.environ.get("PLAYWRIGHT_HEADLESS",
                                  "false").lower() == "true"

        print(f"Launching Chromium (Headless: {headless})...")
        browser = p.chromium.launch(headless=headless)
        page = browser.new_page(viewport={"width": 1280, "height": 1024})

        # Create a simple page with a native select element in the middle
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f0f0f0;
                    font-family: sans-serif;
                }
                .container {
                    padding: 50px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    text-align: center;
                }
                select {
                    padding: 10px;
                    font-size: 16px;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Native Dropdown Test</h2>
                <label for="os-dropdown">Choose an option:</label><br>
                <select id="os-dropdown">
                    <option value="1">Option 1: The OS Renders Me</option>
                    <option value="2">Option 2: Am I visible?</option>
                    <option value="3">Option 3: This is a test.</option>
                    <option value="4">Option 4: Xvfb validation.</option>
                </select>
            </div>
        </body>
        </html>
        """

        page.set_content(html_content)
        page.wait_for_load_state("networkidle")

        print("Clicking the <select> element to open it...")
        # Get the bounding box of the select element to click it directly
        select_box = page.locator("#os-dropdown").bounding_box()
        if select_box:
            # Click exactly in the center to open the native menu
            page.mouse.click(
                select_box["x"] + select_box["width"] / 2,
                select_box["y"] + select_box["height"] / 2,
            )
        else:
            print("Could not find the select element!")

        # Wait a moment for the OS to draw the dropdown menu overlay
        time.sleep(1)

        screenshot_path = "artifacts/native_select_open.png"
        os.makedirs("artifacts", exist_ok=True)

        print("Taking a screenshot of the open dropdown...")
        page.screenshot(path=screenshot_path)

        assert os.path.exists(screenshot_path)
        print(f"✅ Screenshot saved to: {screenshot_path}")
        print(
            "Please visually inspect this image. If the dropdown menu items ('Option 1', etc.) are visible, Debian is safe. If they are missing or detached, we MUST implement proxy-select."
        )

        browser.close()


if __name__ == "__main__":
    test_native_select_rendering()
