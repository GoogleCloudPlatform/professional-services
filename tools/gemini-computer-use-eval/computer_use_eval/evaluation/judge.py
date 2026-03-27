# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import logging
import os
import re
import asyncio
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Literal
from computer_use_eval.browser.playwright_env import PlaywrightEnv
from computer_use_eval.config import settings
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class LogJudgeResult(BaseModel):
    summary: str = Field(..., description="1-sentence summary.")
    score: float = Field(
        ...,
        description="0.0 if the task failed or got stuck, 1.0 if the task was successfully completed.",
    )
    fail_why: str = Field(..., description="Root cause analysis (RCA) or 'None'.")
    errors: List[str] = Field(
        default_factory=list, description="Specific errors found."
    )
    fix_prompt: str = Field(
        ..., description="Actionable suggestions for System Prompt."
    )


class VideoJudgeResult(BaseModel):
    success: bool = Field(..., description="Did the agent achieve the goal?")
    score: float = Field(..., description="0.0-1.0")
    reasoning: str = Field(..., description="Explanation.")
    ux: str = Field(..., description="UX critique.")
    fail_cat: Literal["None", "Nav", "Form", "Visual", "Loop", "Sys"] = Field(
        ..., description="Failure category."
    )


class BaseJudge(ABC):
    @abstractmethod
    async def evaluate(
        self, env: PlaywrightEnv, criteria: Any, video_paths: list[str] = None
    ) -> Dict[str, Any]:
        pass


class AssertionJudge(BaseJudge):
    """
    Evaluates specific assertions (URL, DOM, Script) defined in the criteria.
    Supports a registration pattern for extensibility (e.g. adding custom handlers).
    """

    _handlers = {}

    def __init__(self):
        # Register built-in handlers
        self.register_handler("url", self._check_url)
        self.register_handler("dom", self._check_dom)
        self.register_handler("script", self._check_script)

    @classmethod
    def register_handler(cls, atype: str, handler: callable):
        """Registers a new assertion handler."""
        cls._handlers[atype] = handler

    async def evaluate(
        self,
        env: PlaywrightEnv,
        criteria: Dict[str, Any],
        video_paths: list[str] = None,
    ) -> Dict[str, Any]:
        logger.info(f"AssertionJudge executing with criteria: {criteria}")

        assertions = criteria.get("assertions", [])

        if not assertions:
            return {
                "score": 0.0,
                "reasoning": "No assertions defined in criteria.",
                "details": criteria,
            }

        passed_count = 0
        total_count = len(assertions)
        reasoning = []

        for i, assertion in enumerate(assertions):
            atype = assertion.get("type")
            handler = self._handlers.get(atype)

            try:
                if not handler:
                    result, msg = False, f"Unknown assertion type: {atype}"
                else:
                    # All handlers expect (env, assertion_dict)
                    result, msg = await handler(env, assertion)

                status = "PASS" if result else "FAIL"
                reasoning.append(f"[{status}] Assertion {i + 1} ({atype}): {msg}")
                if result:
                    passed_count += 1
            except Exception as e:
                reasoning.append(f"[ERROR] Assertion {i + 1} ({atype}): {str(e)}")

        final_score = passed_count / total_count if total_count > 0 else 0.0

        return {
            "score": final_score,
            "reasoning": "\n".join(reasoning),
            "details": criteria,
        }

    async def _check_url(self, env: PlaywrightEnv, assertion: Dict) -> tuple[bool, str]:
        current_url = env.page.url
        condition = assertion.get("condition", "matches_regex")
        value = assertion.get("value", "")

        if condition == "matches_regex":
            if re.search(value, current_url):
                return True, f"URL matched '{value}'"
            return False, f"URL '{current_url}' failed match '{value}'"

        if condition == "equals":
            if current_url == value:
                return True, f"URL equals '{value}'"
            return False, f"URL '{current_url}' != '{value}'"

        return False, f"Unknown URL condition: {condition}"

    async def _check_dom(self, env: PlaywrightEnv, assertion: Dict) -> tuple[bool, str]:
        selector = assertion.get("selector")
        condition = assertion.get("condition", "exists")
        value = assertion.get("value")

        if not selector:
            return False, "Missing selector"

        exists = await env.page.locator(selector).count() > 0

        if condition == "exists":
            return (
                (exists, f"Element '{selector}' found")
                if exists
                else (False, f"Element '{selector}' not found")
            )

        if not exists:
            return (
                False,
                f"Element '{selector}' not found for condition '{condition}'",
            )

        if condition == "text_contains":
            text = await env.page.locator(selector).first.inner_text()
            if value in text:
                return True, f"Element '{selector}' contains '{value}'"
            return False, f"Element text '{text}' does not contain '{value}'"

        return False, f"Unknown DOM condition: {condition}"

    async def _check_script(
        self, env: PlaywrightEnv, assertion: Dict
    ) -> tuple[bool, str]:
        code = assertion.get("code")
        result = await env.get_js_state(code)
        if result is True:
            return True, "Script returned True"
        return False, f"Script returned {result}"


class LLMLogJudge(BaseJudge):
    """
    Evaluates the agent's performance by analyzing the execution trace (logs).
    Acts as a 'Principal Systems Architect' performing Root Cause Analysis (RCA).
    Supports dual backends: Custom (Direct API) or Vertex AI Evaluation Service.
    """

    def __init__(self, client):
        self.client = client
        self.model = settings.JUDGE_MODEL

    async def evaluate(
        self,
        env: PlaywrightEnv,
        criteria: Dict[str, Any],
        history: list = None,
        metadata: dict = None,
        video_paths: list[str] = None,
    ) -> Dict[str, Any]:
        if not history:
            return {"fail_why": "No history provided for analysis.", "errors": []}

        # Format history
        trace_text = self._format_history(history)
        termination_reason = (
            metadata.get("termination_reason", "Unknown") if metadata else "Unknown"
        )
        task_goal = criteria.get("task_goal", "Unknown Task")

        if settings.USE_VERTEX_EVAL:
            try:
                from computer_use_eval.evaluation.vertex_eval import VertexLogJudge

                v_judge = VertexLogJudge()
                return await v_judge.evaluate(trace_text, task_goal, termination_reason)
            except Exception as e:
                logger.error(f"Failed to load Vertex Eval Judge: {e}")
                return {"error": f"Failed to load Vertex Eval Judge: {str(e)}"}
        else:
            return await self._evaluate_custom(
                trace_text, task_goal, termination_reason
            )

    def _format_history(self, history: list) -> str:
        trace_text = ""
        for i, turn in enumerate(history):
            role = turn.role if hasattr(turn, "role") else "unknown"
            parts = turn.parts if hasattr(turn, "parts") else []
            text_content = ""
            for p in parts:
                if hasattr(p, "text") and p.text:
                    text_content += p.text
                elif hasattr(p, "function_call") and p.function_call:
                    text_content += (
                        f"[Tool Call: {p.function_call.name}({p.function_call.args})]"
                    )
                elif hasattr(p, "function_response") and p.function_response:
                    text_content += f"[Tool Output: {p.function_response.name}]"
            trace_text += f"Turn {i + 1} ({role}): {text_content}\n"
        return trace_text

    async def _evaluate_custom(
        self, trace_text: str, task_goal: str, termination_reason: str
    ) -> Dict[str, Any]:
        prompt = f"""
        You are a Principal Systems Architect auditing an Autonomous Agent's execution trace.
        
        GOAL: {task_goal}
        EXIT REASON: {termination_reason}
        
        TRACE:
        {trace_text}
        
        RUBRIC (Root Cause Analysis):
        1. ANALYZE the logic flow. Did the agent understand the task?
        2. IDENTIFY any logic loops, hallucinated tools, or misuse of parameters.
        3. IGNORE valid safety warnings if the agent handled them correctly.
        4. BE LENIENT about conversational text or pleasantries before/after a required JSON payload. If the task steps were completed and the JSON is present, treat it as a success. Do not fail the run purely for chatty conversational filler.
        5. RECOMMEND specific prompt changes to prevent recurrence.
        6. ASSIGN a SCORE of 1.0 if the execution trace confirms the agent successfully finished the required task actions, otherwise 0.0.
        
        Produce a structured RCA report.
        """

        try:
            from google.genai import types

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=LogJudgeResult,
                    automatic_function_calling={
                        "disable": True,
                        "maximum_remote_calls": 50,
                    },
                ),
            )

            if response.parsed:
                if isinstance(response.parsed, LogJudgeResult):
                    return response.parsed.model_dump()
                return response.parsed

            import json

            return json.loads(response.text)

        except Exception as e:
            return {"error": f"LLM Judge failed: {str(e)}"}


class VideoJudge(BaseJudge):
    """
    Evaluates the agent's performance by watching the recorded video.
    Uses gemini-3-pro-preview for high-quality multimodal analysis.
    Supports both Vertex AI (GCS) and AI Studio (File API).
    """

    def __init__(self, client):
        self.client = client
        self.model = settings.JUDGE_MODEL

    def _upload_to_gcs(self, local_path: str, bucket_name: str) -> str:
        """Uploads a file to GCS and returns the gs:// URI."""
        from google.cloud import storage
        import hashlib

        # Generate a unique blob name to avoid collisions (chunked to avoid loading entire file)
        md5 = hashlib.md5()
        with open(local_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                md5.update(chunk)
        file_hash = md5.hexdigest()
        blob_name = f"eval_videos/{file_hash}.webm"

        storage_client = storage.Client(project=settings.PROJECT_ID)
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)

        logger.info(f"Uploading {local_path} to gs://{bucket_name}/{blob_name}...")
        blob.upload_from_filename(local_path)

        return f"gs://{bucket_name}/{blob_name}"

    def _compress_video(self, input_path: str) -> str:
        """
        Compresses and speeds up the video using ffmpeg to reduce token usage.
        Speeds up by 4x and caps at 5fps.
        Returns the path to the compressed video.
        """
        import subprocess
        import shutil

        if not shutil.which("ffmpeg"):
            logger.warning("ffmpeg not found. Skipping video compression.")
            return input_path

        input_path = os.path.abspath(input_path)
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_compressed{ext}"

        # ffmpeg command:
        # -i input: Input file
        # -filter:v "setpts=0.25*PTS,fps=5": Speed up 4x, Downsample to 5fps
        # -c:v libvpx-vp9: Re-encode (WebM friendly)
        # -deadline realtime -cpu-used 8: Maximize encoding speed
        # -b:v 500k: Low bitrate
        # -y: Overwrite output
        cmd = [
            "ffmpeg",
            "-i",
            input_path,
            "-filter:v",
            "setpts=0.25*PTS,fps=5",
            "-c:v",
            "libvpx-vp9",
            "-deadline",
            "realtime",
            "-cpu-used",
            "8",
            "-b:v",
            "500k",
            "-y",
            output_path,
        ]

        try:
            logger.info(f"Compressing video: {input_path} -> {output_path}")
            # Run quietly
            subprocess.run(
                cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"ffmpeg compression failed: {e}")
            return input_path
        except Exception as e:
            logger.error(f"Unexpected error during video compression: {e}")
            return input_path

    async def evaluate(
        self,
        env: PlaywrightEnv,
        criteria: Dict[str, Any],
        video_paths: list[str] = None,
    ) -> Dict[str, Any]:
        if not video_paths:
            return {"score": 0.0, "reasoning": "No video paths provided."}

        if isinstance(video_paths, str):
            video_paths = [video_paths]

        from google.genai import types

        content_parts = []

        # 1. Process and upload each video
        for i, video_path in enumerate(video_paths):
            if not os.path.exists(video_path):
                continue

            processed_video_path = await asyncio.to_thread(
                self._compress_video, video_path
            )
            logger.info(
                f"Uploading video part {i + 1}/{len(video_paths)}: {processed_video_path}"
            )

            try:
                # Path A: AI Studio
                if settings.API_KEY:
                    file = await asyncio.to_thread(
                        self.client.files.upload, file=processed_video_path
                    )
                    while file.state.name == "PROCESSING":
                        await asyncio.sleep(2)
                        file = await asyncio.to_thread(
                            self.client.files.get, name=file.name
                        )
                    content_parts.append(file)

                # Path B: Vertex AI
                elif settings.GCS_BUCKET:
                    gcs_uri = await asyncio.to_thread(
                        self._upload_to_gcs, processed_video_path, settings.GCS_BUCKET
                    )
                    content_parts.append(
                        types.Part.from_uri(file_uri=gcs_uri, mime_type="video/webm")
                    )

                # Path C: Fallback to Inline Bytes (Vertex without GCS bucket)
                else:
                    logger.warning(
                        "No GCS_BUCKET or API_KEY provided. Passing video as inline bytes."
                    )
                    with open(processed_video_path, "rb") as f:
                        video_bytes = f.read()
                    content_parts.append(
                        types.Part.from_bytes(data=video_bytes, mime_type="video/webm")
                    )

            except Exception as e:
                logger.error(f"Failed to upload video {video_path}: {e}")

        if not content_parts:
            return {
                "score": 0.0,
                "reasoning": "Failed to upload any video parts for analysis.",
            }

        # 2. Multimodal Holistic Analysis
        task_goal = criteria.get("task_goal", "Unknown Task")
        prompt = f"""
        You are a senior UX Researcher and QA Engineer.
        You are watching multiple videos from the SAME browser session. 
        Each video represents a different tab or window opened during the task.
        
        GOAL: {task_goal}
        CRITERIA: {criteria}
        
        INSTRUCTIONS:
        1. View ALL provided video parts as a single continuous story.
        2. Actions in one tab (e.g., clicking a link) may cause navigation in another tab.
        3. Evaluate the TOTAL success of the agent based on the combination of all videos.
        4. If the agent successfully searched in Tab 1, performed work in Tab 2, and verified in Tab 1, that is a SUCCESS.
        
        Assess SUCCESS (0.0-1.0), EFFICIENCY, and provide a single REASONING block that covers the entire session.
        """

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=[prompt] + content_parts,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=VideoJudgeResult,
                ),
            )

            # Cleanup
            if settings.API_KEY:
                for part in content_parts:
                    if hasattr(part, "name"):
                        self.client.files.delete(name=part.name)

            if response.parsed:
                return (
                    response.parsed.model_dump()
                    if isinstance(response.parsed, VideoJudgeResult)
                    else response.parsed
                )

            import json

            return json.loads(response.text)

        except Exception as e:
            logger.error(f"Holistic Video Judge failed: {e}", exc_info=True)
            return {"score": 0.0, "reasoning": f"Analysis Error: {str(e)}"}
