# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import traceback
from typing import Dict, Any, Optional, List
import re

# Flow specification is read dynamically from context state variable 'int__flow_specification'

def enter_node(
    node_id: Optional[str] = None,
    flow_id: Optional[str] = None,
    set_variables: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Traverses the deterministic flow programmatically tracking state and resolving decision trees.
    
    This is the main entry point called by the agent platform.
    """
    try:
        return enter_node_wrapped(node_id, flow_id, set_variables or {})
    except Exception as exc:
        return tool_exception(exc)

def get_nested_value(state: dict, path: str) -> Any:
    if not path:
        return None
    if path.startswith("$session.params."):
        path = path[16:]
    if path.startswith('.'):
        path = path[1:]
    
    parts = path.split('.')
    first = parts[0]
    
    val = state.get(first)
    if val is None and f"sop__{first}" in state:
        val = state.get(f"sop__{first}")
        
    for part in parts[1:]:
        if isinstance(val, dict):
            val = val.get(part)
        elif isinstance(val, list):
            try:
                val = val[int(part)]
            except (ValueError, IndexError):
                return None
        else:
            return None
    return val

def evaluate_single_clause(clause: str, state: dict) -> bool:
    clause = clause.strip()
    if not clause:
        return False
    if clause.lower() == "true":
        return True
    if clause.lower() == "false":
        return False

    lower_clause = clause.lower()
    if lower_clause.endswith(" is null"):
        var_name = clause[:-8].strip()
        return get_nested_value(state, var_name) is None

    if lower_clause.endswith(" is not null"):
        var_name = clause[:-12].strip()
        return get_nested_value(state, var_name) is not None

    operators = ["!=", "==", ">=", "<=", ">", "<", "="]
    for op in operators:
        if op in clause:
            parts = clause.split(op, 1)
            left = parts[0].strip()
            right = parts[1].strip()

            left_val = get_nested_value(state, left)

            right_val = None
            if right.lower() == "null":
                right_val = None
            elif right.lower() == "true":
                right_val = True
            elif right.lower() == "false":
                right_val = False
            elif (right.startswith('"') and right.endswith('"')) or (right.startswith("'") and right.endswith("'")):
                right_val = right[1:-1]
            else:
                try:
                    if "." in right:
                        right_val = float(right)
                    else:
                        right_val = int(right)
                except ValueError:
                    right_val = right

            try:
                if op in ["=", "=="]:
                    return left_val == right_val
                elif op == "!=":
                    return left_val != right_val
                elif op == ">":
                    return left_val is not None and right_val is not None and left_val > right_val
                elif op == "<":
                    return left_val is not None and right_val is not None and left_val < right_val
                elif op == ">=":
                    return left_val is not None and right_val is not None and left_val >= right_val
                elif op == "<=":
                    return left_val is not None and right_val is not None and left_val <= right_val
            except Exception:
                return False
    return False

def evaluate_condition(condition: str, state: dict) -> bool:
    if not condition or condition.strip().lower() == "true":
        return True
    
    or_parts = re.split(r'\s+OR\s+|\s+or\s+', condition)
    for or_part in or_parts:
        and_parts = re.split(r'\s+AND\s+|\s+and\s+', or_part)
        if all(evaluate_single_clause(and_part, state) for and_part in and_parts):
            return True
    return False

def enter_node_wrapped(
    node_id: Optional[str] = None,
    flow_id: Optional[str] = None,
    set_variables: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    state = context.state
    
    # 1. Update session state with parameters extracted by the LLM
    if set_variables:
        state.update(set_variables)

    flow_spec = state.get("int__flow_specification")
    if not flow_spec:
        raise RuntimeError("Flow specification not found in context state. Ensure start flow was called first.")

    if "sop" in flow_spec:
        sop_data = flow_spec["sop"]
    else:
        sop_data = flow_spec
        
    flows = sop_data.get("flows", {})
    if not flows:
        raise RuntimeError("No flows found in the SOP specification.")

    # Build nodes_lookup for each flow
    for fid, fbody in list(flows.items()):
        fbody["nodes_lookup"] = {node["id"]: node for node in fbody.get("nodes", [])}
        
    main_flow_id = None
    for fid in flows.keys():
        if "main" in fid.lower():
            main_flow_id = fid
            break
    if not main_flow_id and flows:
        main_flow_id = list(flows.keys())[0]

    current_flow_id = state.get("int__current_flow_id")
    if not current_flow_id:
        current_flow_id = main_flow_id

    # If a specific flow_id was passed, we transition to that flow
    if flow_id:
        current_flow_id = flow_id

    # If node_id was passed as a flow ID (or is in flows and not in current flow's nodes)
    if node_id and node_id in flows and node_id not in flows.get(current_flow_id, {}).get("nodes_lookup", {}):
        current_flow_id = node_id
        node_id = flows.get(current_flow_id, {}).get("root_node_id")

    # If node_id was omitted, None, or equal to current_flow_id, resolve to flow root node
    if not node_id or node_id == current_flow_id or node_id == "None":
        node_id = flows.get(current_flow_id, {}).get("root_node_id")

    # Verify that the requested node_id is currently available
    available_nodes = state.get("int__available_node_ids")
    if available_nodes is None:
        root_node_id = flows.get(current_flow_id, {}).get("root_node_id")
        available_nodes = [{"flow_id": current_flow_id, "node_id": root_node_id}] if root_node_id else []

    target_match = {"flow_id": current_flow_id, "node_id": node_id}
    if target_match not in available_nodes and node_id != flows.get(current_flow_id, {}).get("root_node_id"):
        choices_str = ", ".join([f"(flow: '{item.get('flow_id')}', node: '{item.get('node_id')}')" for item in available_nodes])
        raise ValueError(
            f"Illegal transition to node_id '{node_id}' in flow '{current_flow_id}'. "
            f"The transitions currently available to pick from are: [{choices_str}]. "
            "DO NOT transition to any other node or flow, even if they were mentioned in previous conversation turns."
        )

    accumulated_instructions: List[str] = []
    action_results: Dict[str, Any] = {}
    current_node_id = node_id
    depth = 0
    max_traversal_depth = 10

    # 2. Traverse nodes resolving conditions
    while depth < max_traversal_depth:
        if current_node_id == "END":
            accumulated_instructions.append(
                "The structured flow has ended. 1) Send the last message to the customer. 2) terminate the conversation."
            )
            break

        active_flow = flows.get(current_flow_id)
        if not active_flow:
            return {
                "status": "error",
                "message": f"Active flow '{current_flow_id}' not found in SOP flows.",
                "current_node_id": "END",
                "accumulated_instructions": accumulated_instructions,
                "action_results": action_results,
                "available_intent_transitions": []
            }

        node = active_flow.get("nodes_lookup", {}).get(current_node_id)
        if not node:
            return {
                "status": "error",
                "message": f"Target node '{current_node_id}' not found in flow '{current_flow_id}'.",
                "current_node_id": "END",
                "accumulated_instructions": accumulated_instructions,
                "action_results": action_results,
                "available_intent_transitions": []
            }

        # Append instructions for the current node
        if "agent_instructions" in node:
            accumulated_instructions.append(node["agent_instructions"])

        # Execute programmatic actions
        if "actions" in node:
            for action in node["actions"]:
                if action.get("type") == "tool":
                    tool_name = action.get("tool_name")
                    tool_params = action.get("tool_params", {})
                    resolved_params = {
                        k: state.get(v) for k, v in tool_params.items()
                    }
                    store_var = action.get("store_result_variable")
                    try:
                        tool_func = getattr(tools, tool_name)
                        res = tool_func(resolved_params)
                        res_json = res.json()
                        action_results[tool_name] = res_json
                        if store_var:
                            val = res_json.get("result") if isinstance(res_json, dict) and "result" in res_json else res_json
                            state[store_var] = val
                            state[f"sop__{store_var}"] = val
                    except Exception as e:
                        action_results[tool_name] = {"status": "error", "error": str(e)}

        transitioned = False
        
        # Evaluate condition routes
        condition_routes = node.get("condition_routes", [])
        for route in condition_routes:
            if evaluate_condition(route["condition"], state):
                target_flow = route.get("target_flow")
                target_node = route.get("target_node")
                
                if target_flow:
                    current_flow_id = target_flow
                    if target_node:
                        current_node_id = target_node
                    else:
                        target_flow_body = flows.get(target_flow)
                        if target_flow_body:
                            current_node_id = target_flow_body.get("root_node_id")
                        else:
                            current_node_id = "END"
                else:
                    if target_node:
                        current_node_id = target_node
                    else:
                        current_node_id = "END"
                transitioned = True
                break

        if transitioned:
            depth += 1
            continue

        # Stop traversal if the node or flow expects intent routing
        has_intent_routes = "intent_routes" in node
        has_local_globals = "global_intent_routes" in active_flow
        has_main_globals = False
        if current_flow_id != main_flow_id:
            main_flow = flows.get(main_flow_id, {})
            if "global_intent_routes" in main_flow:
                has_main_globals = True
                
        if has_intent_routes or has_local_globals or has_main_globals:
            break
        else:
            current_node_id = "END"
            accumulated_instructions.append(
                "The flow has ended unexpectedly with no valid routes. Terminate the conversation."
            )
            break

    if depth >= max_traversal_depth:
        current_node_id = "END"
        accumulated_instructions.append("System Error: Traversal loop detected. Perform a human escalation.")

    # 3. Assemble available intent routes for the LLM
    available_intent_transitions = []
    next_available_node_ids = []
    if current_node_id != "END":
        active_flow = flows.get(current_flow_id, {})
        active_node = active_flow.get("nodes_lookup", {}).get(current_node_id, {})
        
        # Add local intent routes
        for intent_route in active_node.get("intent_routes", []):
            route_copy = intent_route.copy()
            t_flow = route_copy.get("target_flow")
            t_node = route_copy.get("target_node")
            if t_flow:
                if not t_node:
                    target_flow_body = flows.get(t_flow)
                    if target_flow_body:
                        t_node = target_flow_body.get("root_node_id")
                        route_copy["target_node"] = t_node
                next_available_node_ids.append({"flow_id": t_flow, "node_id": t_node})
            else:
                if t_node:
                    next_available_node_ids.append({"flow_id": current_flow_id, "node_id": t_node})
            available_intent_transitions.append(route_copy)
            
        # Add global routes of current flow
        for global_route in active_flow.get("global_intent_routes", []):
            g_route_copy = global_route.copy()
            g_route_copy["is_global"] = True
            t_flow = g_route_copy.get("target_flow")
            t_node = g_route_copy.get("target_node")
            if t_flow:
                if not t_node:
                    target_flow_body = flows.get(t_flow)
                    if target_flow_body:
                        t_node = target_flow_body.get("root_node_id")
                        g_route_copy["target_node"] = t_node
                next_available_node_ids.append({"flow_id": t_flow, "node_id": t_node})
            else:
                if t_node:
                    next_available_node_ids.append({"flow_id": current_flow_id, "node_id": t_node})
            available_intent_transitions.append(g_route_copy)

        # If current flow is not the main flow, also add global routes of the main flow!
        if current_flow_id != main_flow_id:
            main_flow = flows.get(main_flow_id, {})
            for global_route in main_flow.get("global_intent_routes", []):
                g_route_copy = global_route.copy()
                g_route_copy["is_global"] = True
                t_flow = g_route_copy.get("target_flow")
                t_node = g_route_copy.get("target_node")
                
                if not t_flow:
                    t_flow = main_flow_id
                    g_route_copy["target_flow"] = t_flow
                    
                if not t_node:
                    target_flow_body = flows.get(t_flow)
                    if target_flow_body:
                        t_node = target_flow_body.get("root_node_id")
                        g_route_copy["target_node"] = t_node
                        
                if t_node:
                    next_available_node_ids.append({"flow_id": t_flow, "node_id": t_node})
                available_intent_transitions.append(g_route_copy)

    # Save the node IDs that are currently available for the next turn, preserving order and removing duplicates
    unique_node_ids = []
    seen = set()
    for item in next_available_node_ids:
        key = (item["flow_id"], item["node_id"])
        if key not in seen:
            seen.add(key)
            unique_node_ids.append(item)
            
    state["int__available_node_ids"] = unique_node_ids
    state["int__current_flow_id"] = current_flow_id

    return {
        "status": "success",
        "current_flow_id": current_flow_id,
        "current_node_id": current_node_id,
        "accumulated_instructions": accumulated_instructions,
        "action_results": action_results,
        "available_intent_transitions": available_intent_transitions
    }

def tool_exception(exc: Exception) -> dict:
    """Standard error reporting helper."""
    import traceback
    return {
        "status": "error",
        "exception": str(type(exc).__name__) + ": " + str(exc),
        "traceback": traceback.format_stack()
    }
