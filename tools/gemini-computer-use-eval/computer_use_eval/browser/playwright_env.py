# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import asyncio
import os
from typing import Any, Dict, Optional, Tuple
from collections import deque
from playwright.async_api import async_playwright, Page, BrowserContext, Browser
import logging
from computer_use_eval.utils import CoordinateScaler
from computer_use_eval.browser.perception import PerceptionService


class PlaywrightEnv:
    """
    Wrapper around Playwright for the evaluation agent.
    Manages browser lifecycle, screen capture, and action execution.
    """

    def __init__(
        self,
        headless: bool = True,
        slow_mo: int = 0,
        resolution: Tuple[int, int] = (1440, 900),
        video_dir: Optional[str] = "artifacts/videos/",
        cdp_url: Optional[str] = None,
        cdp_headers: Optional[Dict[str, str]] = None,
        enable_tracing: bool = False,
        block_heavy_resources: bool = False,
        enable_mutation_observer: bool = False,
        perception_service: Optional[PerceptionService] = None,
    ):
        # Override headless if env var is set (useful for Xvfb/ScreenBuffer mode)
        env_headless = os.environ.get("PLAYWRIGHT_HEADLESS")
        if env_headless is not None:
            self.headless = env_headless.lower() == "true"
        else:
            self.headless = headless

        self.slow_mo = slow_mo
        self.viewport_size = {"width": resolution[0], "height": resolution[1]}
        self.scaler = CoordinateScaler(width=resolution[0],
                                       height=resolution[1])
        self.video_dir = video_dir
        self.cdp_url = cdp_url
        self.cdp_headers = cdp_headers
        self.enable_tracing = enable_tracing
        self.block_heavy_resources = block_heavy_resources
        self.enable_mutation_observer = enable_mutation_observer
        self.logger = logging.getLogger(__name__)

        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.console_logs: deque = deque(maxlen=20)

        # Perception Engine: Opt-in via environment variable
        # This uses 'mss' for high-speed capture but requires a visible display (Xvfb or Desktop).
        enable_perception = (os.environ.get("ENABLE_PERCEPTION_ENGINE",
                                            "false").lower() == "true")
        self.perception_service = perception_service

        if enable_perception and not self.perception_service:
            if cdp_url:
                self.logger.warning(
                    "Perception Engine disabled: Incompatible with remote CDP.")
            else:
                self.logger.info(
                    "Perception Engine ENABLED. Forcing headless=False for screen capture."
                )
                self.headless = False  # mss requires a real display surface
                self.perception_service = PerceptionService(
                    enable_screen_buffer=True)

        if not self.perception_service:
            self.perception_service = PerceptionService(
                enable_screen_buffer=False)

    async def __aenter__(self):
        return self

    async def __aexit__(self, _exc_type, _exc_val, _exc_tb):
        await self.stop()

    async def start(self):
        """Initializes the browser session."""
        if self.page:
            self.logger.info("Environment already started.")
            return

        self.playwright = await async_playwright().start()

        # Start perception engine
        if self.perception_service:
            self.perception_service.start()

        if self.cdp_url:
            self.logger.info(
                f"Connecting to remote browser at {self.cdp_url}...")
            self.browser = await self.playwright.chromium.connect_over_cdp(
                self.cdp_url, headers=self.cdp_headers or {})
        else:
            launch_args = [
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",  # Required for non-privileged container often, but we are user 1000 now.
                "--disable-infobars",
                "--disable-dev-shm-usage",  # Prevent crash in containers
                "--disable-gpu",  # Optimization for headless
            ]

            self.browser = await self.playwright.chromium.launch(
                headless=self.headless,
                slow_mo=self.slow_mo,
                args=launch_args,
            )

        self.context = await self.browser.new_context(
            viewport=self.viewport_size,
            record_video_dir=self.video_dir if self.video_dir else None,
            ignore_https_errors=True,
            user_agent=
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            locale="en-US",
            timezone_id="UTC",
        )

        if self.enable_tracing:
            await self.context.tracing.start(screenshots=True,
                                             snapshots=True,
                                             sources=True)

        if getattr(self, "enable_mutation_observer", False):
            self.logger.info(
                "Injecting fast JS mutation observer for lightweight perception engine."
            )
            await self.context.add_init_script("""
                window.ui_changed = false;
                // Observe DOM mutations
                const observer = new MutationObserver(() => {
                    window.ui_changed = true;
                });
                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
                });
                window.reset_ui_changed = () => { window.ui_changed = false; };
            """)

        self.page = await self.context.new_page()
        self.context.on("page", self._handle_new_page)
        self.page.set_default_timeout(60000)
        self.page.set_default_navigation_timeout(60000)

        # Resource Blocking Logic
        if getattr(self, "block_heavy_resources", False):
            self.logger.info(
                "Resource blocking enabled: Intercepting media and fonts.")
            await self.page.route(
                "**/*.{png,jpg,jpeg,webp,gif,svg,woff,woff2,mp3,mp4}",
                lambda route: route.abort(),
            )

        # Buffer console logs for diagnostic reflection
        self.page.on(
            "console",
            lambda msg: self.console_logs.append(f"[{msg.type}] {msg.text}"))

        # Environment Fingerprinting
        ua = await self.page.evaluate("navigator.userAgent")
        res = await self.page.evaluate(
            "() => ({w: window.innerWidth, h: window.innerHeight, devicePixelRatio: window.devicePixelRatio})"
        )
        self.logger.info(
            f"ENVIRONMENT FINGERPRINT: UA='{ua}', Viewport={res['w']}x{res['h']}, DPR={res['devicePixelRatio']}"
        )

    def _handle_new_page(self, new_page):
        """
        Handler for the 'page' event on the context.
        Automatically updates self.page to point to the most recently opened tab.
        """
        self.logger.info(
            f"✨ [TAB DETECTION] New page/tab opened: {new_page.url}")
        self.page = new_page

    async def stop(self):
        """Cleans up resources. Idempotent."""
        if getattr(self, "_stopped", False):
            return
        self._stopped = True

        self.logger.info("Stopping PlaywrightEnv...")

        # Stop perception engine
        if self.perception_service:
            self.perception_service.stop()

        # Video Integrity Cooldown: Ensure final frames (toasts, redirects) are flushed to video.
        # SKIP if we are using a remote CDP connection as video recording behavior is different
        # and we want to avoid unnecessary hangs during remote teardown.
        if self.page and not self.cdp_url:
            self.logger.info("Performing 5s cooldown for video integrity...")
            await asyncio.sleep(5)

        if self.context:
            if self.enable_tracing:
                trace_path = os.path.join(self.video_dir or "artifacts",
                                          "trace.zip")
                self.logger.info(f"Saving execution trace to {trace_path}...")
                try:
                    await self.context.tracing.stop(path=trace_path)
                except Exception as e:
                    self.logger.warning(f"Error stopping tracing: {e}")
            try:
                await self.context.close()
            except Exception as e:
                self.logger.warning(f"Error closing context: {e}")
            self.context = None
        if self.browser:
            try:
                await self.browser.close()
            except Exception as e:
                self.logger.warning(f"Error closing browser: {e}")
            self.browser = None
        if self.playwright:
            try:
                await self.playwright.stop()
            except Exception as e:
                self.logger.warning(f"Error stopping playwright: {e}")
            self.playwright = None

    async def get_video_path(self) -> Optional[str]:
        """Returns the local path to the recorded video file for the current page."""
        if self.page and self.page.video:
            return await self.page.video.path()
        return None

    async def get_all_video_paths(self) -> list[str]:
        """Returns the local paths to all recorded video files in the current context."""
        paths = []
        if self.context:
            for page in self.context.pages:
                if page.video:
                    path = await page.video.path()
                    if path:
                        paths.append(path)
        return paths

    async def get_screenshot(self) -> bytes:
        """Returns screenshot as raw bytes via PerceptionService."""
        if self.perception_service:
            return await self.perception_service.get_screenshot(self.page)
        return b""

    async def get_state(self) -> Dict[str, Any]:
        """Returns current state including screenshot and URL."""
        return {
            "screenshot": await self.get_screenshot(),
            "url": self.page.url if self.page else "",
            "title": await self.page.title() if self.page else "",
        }

    async def get_page_url(self) -> str:
        """Returns the current page URL."""
        return self.page.url if self.page else ""

    async def get_js_state(self, expression: str) -> Any:
        if not self.page:
            return None
        try:
            return await self.page.evaluate(expression)
        except Exception as e:
            return f"Error evaluating state: {str(e)}"

    async def get_active_element_info(self) -> Dict[str, Any]:
        """Returns details about the currently focused element."""
        if not self.page:
            return {}
        try:
            return await self.page.evaluate("""
                () => {
                    const el = document.activeElement;
                    if (!el) return { tagName: 'NONE' };
                    return {
                        tagName: el.tagName,
                        id: el.id || '',
                        className: el.className || '',
                        name: el.getAttribute('name') || '',
                        value: el.value || '',
                        textContent: (el.textContent || '').substring(0, 50) // Truncate for tokens
                    };
                }
            """)
        except Exception:
            return {"error": "Failed to get active element"}

    async def get_aria_snapshot(self) -> str:
        """
        Returns a JSON string representation of the full accessibility tree via CDP.
        Used for semantic reflection and state stagnation detection.
        """
        if not self.page:
            return "{}"

        try:
            import json

            # 1. Check Mutation Gate (O(1) overhead)
            ui_changed = await self.page.evaluate("""() => { 
                if (typeof window.ui_changed === 'undefined') return true;
                const changed = window.ui_changed; 
                window.ui_changed = false; 
                return changed !== false; 
            }""")

            last_snapshot = getattr(self, "_last_aria_snapshot", None)
            if last_snapshot is not None and not ui_changed:
                return last_snapshot

            # 2. Capture Full Native Accessibility Tree via CDP Protocol
            # The standard Page API in python-playwright lacks .accessibility
            client = await self.page.context.new_cdp_session(self.page)
            tree = await client.send("Accessibility.getFullAXTree")

            # Structure into a simpler format for the LLM
            # Just extract nodes that have a role and aren't ignored
            elements = []
            if "nodes" in tree:
                for node in tree["nodes"]:
                    if node.get("ignored"):
                        continue

                    role = node.get("role", {}).get("value", "")
                    if not role or role in ("RootWebArea", "WebArea",
                                            "generic"):
                        continue

                    name = node.get("name", {}).get("value", "")
                    if not name and role not in (
                            "textbox",
                            "searchbox",
                            "combobox",
                            "button",
                    ):
                        continue

                    # Extract value if present (for inputs)
                    val = ""
                    for prop in node.get("properties", []):
                        if prop.get("name") == "value":
                            val = prop.get("value", {}).get("value", "")
                            break

                    elements.append({
                        "role": role,
                        "name": name,
                        "value": str(val) if val else ""
                    })

            snapshot_str = json.dumps({"role": "root", "children": elements})
            self._last_aria_snapshot = snapshot_str
            return snapshot_str

        except Exception as e:
            self.logger.warning(f"Failed to capture CDP ARIA snapshot: {e}")
            return "{}"
