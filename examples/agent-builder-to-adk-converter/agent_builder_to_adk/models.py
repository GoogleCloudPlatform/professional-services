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

"""Pydantic v2 data models representing Google Cloud Agent Builder workflow JSON exports."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class WorkflowEdge(BaseModel):
    """Represents a directed transition between two nodes in an agent flow."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    source_node_id: str = Field(alias="sourceNodeId")
    target_node_id: str = Field(alias="targetNodeId")
    route_string: Optional[str] = Field(default=None, alias="routeString")

    @property
    def source(self) -> str:
        return self.source_node_id

    @property
    def target(self) -> str:
        return self.target_node_id

    @property
    def route(self) -> Optional[str]:
        return self.route_string


class ToolRef(BaseModel):
    """Reference to an external or built-in tool."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    name: str


class SelectedTools(BaseModel):
    """Tools selected for an AGENT_NODE."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    tools: List[ToolRef] = Field(default_factory=list)


class DataStoreSpecItem(BaseModel):
    """Specification of an attached data store."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    data_store: Optional[str] = Field(default=None, alias="dataStore")


class DataStoreSpecs(BaseModel):
    """Container for data store specs."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    specs: List[DataStoreSpecItem] = Field(default_factory=list)


class DataConnectorConfig(BaseModel):
    """Configuration for an integrated data connector."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    name: Optional[str] = None
    data_source: Optional[str] = Field(default=None, alias="dataSource")


class AgentNodeConfig(BaseModel):
    """Configuration specific to an AGENT_NODE."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    model: Optional[str] = "gemini-1.5-pro"
    instruction: Optional[str] = ""
    selected_tools: Optional[SelectedTools] = Field(default=None, alias="selectedTools")
    data_store_specs: Optional[DataStoreSpecs] = Field(default=None, alias="dataStoreSpecs")
    output_display_enabled: Optional[bool] = Field(default=None, alias="outputDisplayEnabled")


class ConnectorNodeConfig(BaseModel):
    """Configuration specific to a CONNECTOR_NODE (tool action)."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    tool_name: Optional[str] = Field(default=None, alias="toolName")
    data_store_specs: Optional[DataStoreSpecs] = Field(default=None, alias="dataStoreSpecs")
    input_parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="inputParameters")


class ConnectorEventTriggerConfig(BaseModel):
    """Configuration for a CONNECTOR_EVENT_TRIGGER node."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    event_type: Optional[str] = Field(default=None, alias="eventType")
    input_parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="inputParameters")
    data_store_specs: Optional[DataStoreSpecs] = Field(default=None, alias="dataStoreSpecs")
    data_connector: Optional[DataConnectorConfig] = Field(default=None, alias="dataConnector")


class Operand(BaseModel):
    """Operand in a condition expression."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    variable_path: Optional[str] = Field(default=None, alias="variablePath")
    literal: Optional[Any] = None


class ConditionExpression(BaseModel):
    """Relational condition expression."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    left: Optional[Operand] = None
    condition_operator: Optional[str] = Field(default="EQUALS", alias="conditionOperator")
    right: Optional[Operand] = None


class ExpressionItem(BaseModel):
    """Wrapper item for condition expression."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    condition: Optional[ConditionExpression] = None


class LogicalGroup(BaseModel):
    """Logical grouping of expressions (AND/OR)."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    logical_operator: Optional[str] = Field(default="AND", alias="logicalOperator")
    expressions: List[ExpressionItem] = Field(default_factory=list)


class RoutingExpression(BaseModel):
    """Root expression in a routing rule."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    logical_group: Optional[LogicalGroup] = Field(default=None, alias="logicalGroup")
    condition: Optional[ConditionExpression] = None


class RoutingRuleDetail(BaseModel):
    """Detailed rule definition."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    root_expression: Optional[RoutingExpression] = Field(default=None, alias="rootExpression")


class RoutingRule(BaseModel):
    """Branch routing rule in a condition node."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    branch: str
    rule: Optional[RoutingRuleDetail] = None


class RuleBasedRouting(BaseModel):
    """Container for condition routing rules."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    rules: List[RoutingRule] = Field(default_factory=list)
    else_branch: Optional[str] = Field(default=None, alias="elseBranch")


class ConditionNodeConfig(BaseModel):
    """Configuration specific to a CONDITION_NODE."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    rule_based_routing: Optional[RuleBasedRouting] = Field(default=None, alias="ruleBasedRouting")


class ApprovalNodeConfig(BaseModel):
    """Configuration specific to an APPROVAL_NODE."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    message: Optional[str] = ""
    approval_branch: Optional[str] = Field(default="Approved", alias="approvalBranch")
    rejection_branch: Optional[str] = Field(default="Rejected", alias="rejectionBranch")


class AgentReferenceNodeConfig(BaseModel):
    """Configuration for an AGENT_REFERENCE_NODE."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    agent: Optional[str] = None
    agent_reference_type: Optional[str] = Field(default=None, alias="agentReferenceType")


class WorkflowNode(BaseModel):
    """Unified node entity in an Agent Builder workflow."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    id: str
    display_name: Optional[str] = Field(default=None, alias="displayName")
    node_type: str = Field(default="DEFAULT", alias="nodeType")

    agent_node: Optional[AgentNodeConfig] = Field(default=None, alias="agentNode")
    connector_node: Optional[ConnectorNodeConfig] = Field(default=None, alias="connectorNode")
    connector_event_trigger: Optional[ConnectorEventTriggerConfig] = Field(
        default=None, alias="connectorEventTrigger"
    )
    condition_node: Optional[ConditionNodeConfig] = Field(default=None, alias="conditionNode")
    approval_node: Optional[ApprovalNodeConfig] = Field(default=None, alias="approvalNode")
    agent_reference_node: Optional[AgentReferenceNodeConfig] = Field(
        default=None, alias="agentReferenceNode"
    )
    output_schema: Optional[Dict[str, Any]] = Field(default=None, alias="outputSchema")

    @property
    def label(self) -> str:
        return self.display_name or self.id

    @property
    def model(self) -> Optional[str]:
        return self.agent_node.model if self.agent_node else None

    @property
    def instruction(self) -> str:
        return (self.agent_node.instruction or "") if self.agent_node else ""

    @property
    def tools(self) -> List[str]:
        if self.agent_node and self.agent_node.selected_tools:
            return [t.name for t in self.agent_node.selected_tools.tools]
        return []

    @property
    def event_type(self) -> Optional[str]:
        return self.connector_event_trigger.event_type if self.connector_event_trigger else None

    @property
    def connector_tool(self) -> Optional[str]:
        return self.connector_node.tool_name if self.connector_node else None

    @property
    def approval_message(self) -> Optional[str]:
        return self.approval_node.message if self.approval_node else None

    @property
    def ref_agent(self) -> Optional[str]:
        return self.agent_reference_node.agent if self.agent_reference_node else None

    @property
    def ref_type(self) -> Optional[str]:
        return self.agent_reference_node.agent_reference_type if self.agent_reference_node else None


class AgentFlow(BaseModel):
    """Container for the nodes and edges defining workflow topology."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    nodes: List[WorkflowNode] = Field(default_factory=list)
    edges: List[WorkflowEdge] = Field(default_factory=list)
    owner: Optional[str] = None


class WorkflowAgentDefinition(BaseModel):
    """Definition wrapper for workflow agent flow."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    agent_flow: AgentFlow = Field(alias="agentFlow")
    owner: Optional[str] = None


class AgentBuilderExport(BaseModel):
    """Root export JSON structure generated by Google Cloud Agent Builder."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    name: Optional[str] = ""
    display_name: Optional[str] = Field(default="", alias="displayName")
    description: Optional[str] = ""
    create_time: Optional[str] = Field(default=None, alias="createTime")
    update_time: Optional[str] = Field(default=None, alias="updateTime")
    state: Optional[str] = None
    workflow_agent_definition: Optional[WorkflowAgentDefinition] = Field(
        default=None, alias="workflowAgentDefinition"
    )
    active_revision: Optional[str] = Field(default=None, alias="activeRevision")
    agent_identity_info: Optional[Dict[str, Any]] = Field(
        default=None, alias="agentIdentityInfo"
    )


class ParsedWorkflow(BaseModel):
    """Normalized workflow representation for code generation and topology analysis."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    agent_id: str
    display_name: str
    description: str
    nodes: Dict[str, WorkflowNode]
    edges: List[WorkflowEdge]
    roots: List[str]
    layers: List[List[str]]

    def get_node(self, node_id: str) -> Optional[WorkflowNode]:
        """Lookup a node by its identifier."""
        return self.nodes.get(node_id)

    def get_outgoing_edges(self, node_id: str) -> List[WorkflowEdge]:
        """Retrieve all outgoing edges from the specified node."""
        return [e for e in self.edges if e.source_node_id == node_id]

    def get_incoming_edges(self, node_id: str) -> List[WorkflowEdge]:
        """Retrieve all incoming edges to the specified node."""
        return [e for e in self.edges if e.target_node_id == node_id]

    def get_connected_tools(self, agent_node_id: str) -> List[str]:
        """Retrieve identifiers of connector nodes directly connected to or selected by the agent."""
        node = self.nodes.get(agent_node_id)
        if not node or node.node_type != "AGENT_NODE":
            return []

        connected_tool_ids = set()

        # 1. Tools explicitly selected in agentNode.selectedTools
        if node.agent_node and node.agent_node.selected_tools:
            for t in node.agent_node.selected_tools.tools:
                for candidate_id, candidate in self.nodes.items():
                    if candidate.node_type == "CONNECTOR_NODE":
                        if candidate.connector_node and candidate.connector_node.tool_name == t.name:
                            connected_tool_ids.add(candidate_id)
                        elif candidate_id == t.name:
                            connected_tool_ids.add(candidate_id)

        # 2. Connector nodes with direct outgoing or incoming edges with this agent
        for edge in self.get_outgoing_edges(agent_node_id):
            target = self.nodes.get(edge.target_node_id)
            if target and target.node_type == "CONNECTOR_NODE":
                connected_tool_ids.add(edge.target_node_id)

        for edge in self.get_incoming_edges(agent_node_id):
            source = self.nodes.get(edge.source_node_id)
            if source and source.node_type == "CONNECTOR_NODE":
                connected_tool_ids.add(edge.source_node_id)

        return sorted(list(connected_tool_ids))

    @property
    def agent_nodes(self) -> List[WorkflowNode]:
        return [n for n in self.nodes.values() if n.node_type == "AGENT_NODE"]

    @property
    def connector_nodes(self) -> List[WorkflowNode]:
        return [n for n in self.nodes.values() if n.node_type == "CONNECTOR_NODE"]

    @property
    def condition_nodes(self) -> List[WorkflowNode]:
        return [n for n in self.nodes.values() if n.node_type == "CONDITION_NODE"]

    @property
    def approval_nodes(self) -> List[WorkflowNode]:
        return [n for n in self.nodes.values() if n.node_type == "APPROVAL_NODE"]

    @property
    def trigger_nodes(self) -> List[WorkflowNode]:
        return [n for n in self.nodes.values() if n.node_type == "CONNECTOR_EVENT_TRIGGER"]

    @property
    def reference_nodes(self) -> List[WorkflowNode]:
        return [n for n in self.nodes.values() if n.node_type == "AGENT_REFERENCE_NODE"]
