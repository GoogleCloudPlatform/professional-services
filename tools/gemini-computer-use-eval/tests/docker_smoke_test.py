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
import pytest
import subprocess
from playwright.sync_api import sync_playwright

if not os.path.exists("/.dockerenv"):
    pytest.skip(
        "Skipping Docker smoke tests outside of Docker container",
        allow_module_level=True,
    )


def test_os_is_debian():
    """Verify the OS is Debian 12 (Bookworm)."""
    with open("/etc/os-release") as f:
        os_release = f.read()
    print(f"OS Release info:\n{os_release}")
    assert "Debian" in os_release
    assert "bookworm" in os_release
    print("✅ Verified: OS is Debian 12 (Bookworm)")


def test_non_root_user():
    """Verify the container is running as a non-root user."""
    uid = os.getuid()
    username = subprocess.check_output(["whoami"]).decode().strip()
    print(f"Running as User: {username} (UID: {uid})")
    assert uid != 0
    assert username == "computeruse"
    print("✅ Verified: Running as non-root user 'computeruse'")


def test_playwright_launch():
    """Verify Playwright can launch Chromium and capture a screenshot."""
    print("Launching Chromium via Playwright...")
    with sync_playwright() as p:
        # We test both headless=True (default) and headless=False (Xvfb mode)
        # depending on the environment variables.
        headless = os.environ.get("PLAYWRIGHT_HEADLESS",
                                  "true").lower() == "true"

        browser = p.chromium.launch(headless=headless)
        page = browser.new_page(viewport={"width": 1280, "height": 1024})

        print("Navigating to local about:blank...")
        page.goto("about:blank")

        # Inject a simple element to verify rendering
        page.evaluate(
            "document.body.innerHTML = '<h1>Docker Smoke Test SUCCESS</h1>'")

        screenshot_path = "artifacts/smoke_test.png"
        os.makedirs("artifacts", exist_ok=True)
        page.screenshot(path=screenshot_path)

        assert os.path.exists(screenshot_path)
        print(
            f"✅ Verified: Playwright captured screenshot at {screenshot_path}")
        browser.close()


if __name__ == "__main__":
    print("--- 🩺 Docker Environment Smoke Test ---")
    try:
        test_os_is_debian()
        test_non_root_user()
        test_playwright_launch()
        print("\n🎉 ALL SMOKE TESTS PASSED!")
    except Exception as e:
        print(f"\n❌ SMOKE TEST FAILED: {str(e)}")
        exit(1)
