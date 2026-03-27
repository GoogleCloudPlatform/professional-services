# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
import time
from computer_use_eval.browser.playwright_env import PlaywrightEnv


@pytest.mark.asyncio
async def test_screenshot_performance_comparison():
    env = PlaywrightEnv(headless=True)
    await env.start()
    try:
        # Navigate to a complex page to have a realistic screenshot
        await env.page.goto("https://www.google.com")
        await env.page.wait_for_load_state("networkidle")

        # 1. Measure PNG (Current)
        start_png = time.perf_counter()
        png_data = await env.page.screenshot(type="png")
        duration_png = time.perf_counter() - start_png
        size_png = len(png_data)

        # 2. Measure JPEG (Optimized suggestion)
        start_jpeg = time.perf_counter()
        jpeg_data = await env.page.screenshot(type="jpeg", quality=80)
        duration_jpeg = time.perf_counter() - start_jpeg
        size_jpeg = len(jpeg_data)

        print(f"\nPNG: {duration_png:.4f}s, {size_png / 1024:.1f}KB")
        print(f"JPEG (q=80): {duration_jpeg:.4f}s, {size_jpeg / 1024:.1f}KB")

        # Assertions for the "Red Phase" - we want to force a change if JPEG is better
        # Actually, let's just assert that we WANT JPEG to be faster or smaller
        # For now, let's make it fail if we haven't implemented JPEG yet in PlaywrightEnv

    finally:
        await env.stop()


@pytest.mark.asyncio
async def test_get_screenshot_returns_valid_png():
    """
    Test that get_screenshot returns a valid PNG and measures its performance.
    """
    env = PlaywrightEnv(headless=True)
    await env.start()
    try:
        await env.page.goto("https://www.google.com")

        start_time = time.perf_counter()
        b64_data = await env.get_screenshot()
        duration = time.perf_counter() - start_time

        raw_data = b64_data

        # Verify it is a PNG (Signature: \x89PNG)
        assert raw_data.startswith(b"\x89PNG"), "Screenshot should be PNG"
        print(f"Screenshot capture took: {duration:.4f}s")

    finally:
        await env.stop()
