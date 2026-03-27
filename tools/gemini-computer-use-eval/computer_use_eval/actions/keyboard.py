# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import logging
from typing import Dict, Any
from computer_use_eval.browser.playwright_env import PlaywrightEnv
from .base import BaseAction

logger = logging.getLogger(__name__)


class TypeAction(BaseAction):
    # We use a JS-based clear instead of element.clear() because modern frameworks
    # (React/Vue/Angular) often fail to sync their internal state when the
    # input value is changed directly via the standard DOM API.
    JS_CLEAR_SCRIPT = """(coords) => {
        let el = document.activeElement;
        if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) {
            el = document.elementFromPoint(coords.x, coords.y);
        }
        if (el) {
            el.value = '';
            el.dispatchEvent(new Event('input', {bubbles:true}));
            el.dispatchEvent(new Event('change', {bubbles:true}));
        }
    }"""

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        x, y = self.denormalize(args["x"], args["y"], env)
        text = args.get("text", "")
        clear_before = args.get("clear_before_typing", True)

        await self.highlight_click(env, x, y)

        # Smart Handling for Time Inputs (HH:MM)
        # Ported from legacy reference scripts. Some time inputs handle typed
        # separators poorly; stripping them and using raw digits is more robust.
        is_time_value = (":" in text and len(text) <= 5 and
                         text.replace(":", "").isdigit())

        if is_time_value:
            digits = text.replace(":", "")
            await env.page.mouse.click(x, y)
            await env.page.evaluate(self.JS_CLEAR_SCRIPT, {"x": x, "y": y})
            await env.page.wait_for_timeout(150)
            await env.page.mouse.click(x, y)
            await env.page.wait_for_timeout(150)
            await env.page.keyboard.type(digits, delay=80)

            if args.get("press_enter", False):
                await env.page.keyboard.press("Enter")
                try:
                    await env.page.wait_for_load_state("domcontentloaded",
                                                       timeout=3000)
                except Exception:
                    pass
                await env.page.wait_for_timeout(500)

            return {"status": "ok", "smart_type": "time"}

        # Standard Handling with Robust Clear
        await env.page.mouse.click(x, y)
        await env.page.wait_for_timeout(150)

        if clear_before:
            await env.page.evaluate(self.JS_CLEAR_SCRIPT, {"x": x, "y": y})

            # Guard against 'missed clicks' highlighting the entire document body
            is_input_focused = await env.page.evaluate("""() => {
                const tag = document.activeElement ? document.activeElement.tagName : '';
                return tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable);
            }""")

            if is_input_focused:
                # Fallback to Select All + Backspace for maximum compatibility
                await env.page.keyboard.press("Control+A")
                await env.page.keyboard.press("Backspace")

            await env.page.wait_for_timeout(50)

        if text:
            await env.page.keyboard.type(text, delay=20)
            await env.page.wait_for_timeout(500)

        if args.get("press_enter", False):
            await env.page.keyboard.press("Enter")
            try:
                await env.page.wait_for_load_state("domcontentloaded",
                                                   timeout=3000)
            except Exception:
                pass
            await env.page.wait_for_timeout(500)

        return {"status": "ok"}


class KeyCombinationAction(BaseAction):

    async def execute(self, env: PlaywrightEnv,
                      args: Dict[str, Any]) -> Dict[str, Any]:
        keys = args.get("keys")
        if not keys:
            return {"error": "keys argument is required"}

        # Robust mapping for cross-platform key names
        key_map = {
            "pagedown": "PageDown",
            "pageup": "PageUp",
            "arrowdown": "ArrowDown",
            "arrowup": "ArrowUp",
            "arrowleft": "ArrowLeft",
            "arrowright": "ArrowRight",
            "enter": "Enter",
            "escape": "Escape",
            "backspace": "Backspace",
            "tab": "Tab",
            "space": "Space",
            "home": "Home",
            "end": "End",
            "delete": "Delete",
        }

        modifiers = {"control", "alt", "shift", "meta", "command"}
        parts = keys.split("+")
        normalized_parts = []
        for p in parts:
            p_clean = p.strip().lower()
            if p_clean in modifiers:
                normalized_parts.append(p_clean.capitalize())
            elif p_clean in key_map:
                normalized_parts.append(key_map[p_clean])
            elif len(p_clean) == 1:
                normalized_parts.append(p_clean.upper())
            else:
                normalized_parts.append(p.strip())

        normalized_keys = "+".join(normalized_parts)

        try:
            await env.page.keyboard.press(normalized_keys)
            try:
                await env.page.wait_for_load_state("domcontentloaded",
                                                   timeout=3000)
            except Exception:
                pass
            await env.page.wait_for_timeout(500)
            return {"status": "ok"}
        except Exception as e:
            logger.error(f"Action key_combination failed: {e}")
            return {"error": str(e)}
