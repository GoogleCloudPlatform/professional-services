import os
import logging
from typing import AsyncGenerator
from typing_extensions import override

from google.adk.agents import LlmAgent, BaseAgent
from google.adk.agents.invocation_context import InvocationContext
from google.genai import types
from google.adk.events import Event
from google.adk.tools import google_search  

from .sub_agents.struct_data.agent import struct_data_agent
from .sub_agents.unstruct_data.agent import unstruct_data_agent
from .visualizer import visual_specialist

logger = logging.getLogger(__name__)

finops_synthesis_agent = LlmAgent(
    name="finops_synthesis_agent",
    model=os.getenv("ROOT_AGENT_MODEL", "gemini-2.5-flash"),
    instruction="""
    You are the Senior GCP Forensic Architect. 
    Analyze the following data for waste:
    ### STRUCTURED DATA INPUT: {struct_data_result}
    ### UNSTRUCTURED DATA INPUT: {acme_policy_context}
    
    MANDATE: 
    Start your response with: "### 🏗️ Architect Optimization Report"
    1. Identify Pattern & Policy Alignment.
    2. Provide Evidence (quote exact numbers from the data).
    3. Recommend specific GCP features to optimize this spend.
    4. Provide actionable gcloud/console next steps.
    """,
    generate_content_config=types.GenerateContentConfig(temperature=0.1)
)

intent_router = LlmAgent(
    name="IntentRouter",
    model=os.getenv("ROOT_AGENT_MODEL", "gemini-2.5-flash"),
    instruction="""
    You are a strict routing switchboard. 
    
    CRITICAL: Ignore the massive data tables in the history. Focus ONLY on the user's newest request.
    
    Step 1: Read the user's newest sentence.
    Step 2: Does their request contain words like 'optimize', 'recommend', 'fix', or 'reduce'? If yes, intent is REPORT.
    Step 3: Does it contain 'chart' or 'graph'? If yes, intent is VISUAL.
    Step 4: Does it contain 'policy' or 'rules'? If yes, intent is POLICY.
    Step 5: Is the user asking for specific cost data, spend, drill-downs, or "tell me more"? If yes, intent is BILLING.
    Step 6: Is the user just asking a general definition, explaining a cloud concept (like "What is a Spot VM?"), or saying hello? If yes, intent is GENERAL.
    
    You MUST output your answer in this exact format:
    REASONING: <briefly explain your choice based ONLY on the newest message>
    INTENT: <REPORT, VISUAL, POLICY, BILLING, or GENERAL>
    
    ### EXAMPLES ###
    
    User's newest message: "what are spot vm's?"
    REASONING: The user is asking for a general definition of a cloud concept, not specific billing data.
    INTENT: GENERAL
    
    User's newest message: "how do I optimize this spend?"
    REASONING: The user used the word 'optimize', which means they want recommendations.
    INTENT: REPORT
    
    User's newest message: "tell me about my networking costs"
    REASONING: The user is asking to see raw cost data.
    INTENT: BILLING
    
    User's newest message: "what are the specific SKUs for us-east1?"
    REASONING: The user is asking to drill down into specific data points.
    INTENT: BILLING
    
    User's newest message: "show me a chart of this"
    REASONING: The user explicitly asked for a chart.
    INTENT: VISUAL
    
    User's newest message: "what is the policy on GPUs?"
    REASONING: The user is asking about corporate rules and mandates.
    INTENT: POLICY
    """,
    generate_content_config=types.GenerateContentConfig(temperature=0.0) 
)

class FinOpsOrchestrator(BaseAgent):
    """Orchestrates FinOps queries by routing to the appropriate sub-agent."""
    
    router: LlmAgent
    struct_agent: LlmAgent
    unstruct_agent: LlmAgent
    synthesis_agent: LlmAgent
    visual_agent: LlmAgent
    
    model_config = {"arbitrary_types_allowed": True}

    def __init__(self, name: str, router: LlmAgent, struct_agent: LlmAgent, unstruct_agent: LlmAgent, synthesis_agent: LlmAgent, visual_agent: LlmAgent):
        sub_agents_list = [router, struct_agent, unstruct_agent, synthesis_agent, visual_agent]
        
        super().__init__(
            name=name,
            router=router,
            struct_agent=struct_agent,
            unstruct_agent=unstruct_agent,
            synthesis_agent=synthesis_agent,
            visual_agent=visual_agent,
            sub_agents=sub_agents_list
        )

    @override
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        logger.info(f"[{self.name}] Starting FinOps workflow.")

        intent_raw = "INTENT: BILLING"
        async for event in self.router.run_async(ctx):
            if event.is_final_response() and event.content and event.content.parts:
                 intent_raw = event.content.parts[0].text.strip().upper()
                 
        logger.info(f"[{self.name}] Router Output:\n{intent_raw}")

        if "INTENT: REPORT" in intent_raw:
            logger.info(f"[{self.name}] Running Full Audit (Billing -> Policy -> Synthesis).")
            
            existing_data = ctx.session.state.get("struct_data_result", "")
            
            if not existing_data:
                struct_result = "No data found."
                async for event in self.struct_agent.run_async(ctx):
                    if event.is_final_response() and event.content and event.content.parts:
                        struct_result = event.content.parts[0].text
                        
                policy_result = "No policy found."
                async for event in self.unstruct_agent.run_async(ctx):
                    if event.is_final_response() and event.content and event.content.parts:
                        policy_result = event.content.parts[0].text
                
                ctx.session.state["struct_data_result"] = struct_result
                ctx.session.state["acme_policy_context"] = policy_result
            else:
                logger.info(f"[{self.name}] Using existing data from conversation history.")
                policy_result = "No policy found."
                async for event in self.unstruct_agent.run_async(ctx):
                    if event.is_final_response() and event.content and event.content.parts:
                        policy_result = event.content.parts[0].text
                ctx.session.state["acme_policy_context"] = policy_result

            async for event in self.synthesis_agent.run_async(ctx):
                yield event

        elif "INTENT: VISUAL" in intent_raw:
            logger.info(f"[{self.name}] Running Visualizer.")
            existing_data = ctx.session.state.get("struct_data_result", "")
            if not existing_data:
                logger.info(f"[{self.name}] No data found. Running Billing first.")
                async for _ in self.struct_agent.run_async(ctx): pass
            async for event in self.visual_agent.run_async(ctx):
                yield event
                
        elif "INTENT: POLICY" in intent_raw:
            logger.info(f"[{self.name}] Routing to Unstructured Data Agent.")
            async for event in self.unstruct_agent.run_async(ctx):
                yield event

        elif "INTENT: GENERAL" in intent_raw:
            logger.info(f"[{self.name}] Handling as a General Knowledge Query with Search Grounding.")
            general_agent = LlmAgent(
                name="GeneralKnowledge",
                model=os.getenv("ROOT_AGENT_MODEL", "gemini-2.5-flash"),
                instruction="""
                You are a highly capable GCP cloud assistant. 
                Always use the Google Search tool to find the most up-to-date documentation, pricing, or technical definitions before answering. 
                Provide clear, concise, and factual answers.
                """,
                tools=[google_search]
            )
            async for event in general_agent.run_async(ctx):
                yield event

        else:
            logger.info(f"[{self.name}] Routing to Structured Data Agent (Fallback).")
            async for event in self.struct_agent.run_async(ctx):
                yield event

root_agent = FinOpsOrchestrator(
    name="finops_optimizer",
    router=intent_router,
    struct_agent=struct_data_agent,
    unstruct_agent=unstruct_data_agent,
    synthesis_agent=finops_synthesis_agent,
    visual_agent=visual_specialist
)