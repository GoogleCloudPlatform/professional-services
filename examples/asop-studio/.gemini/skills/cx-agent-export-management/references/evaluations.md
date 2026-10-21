# CX Agent Studio Evaluations (Golden Cases) Reference

This reference describes the directory structure, file schemas, and syntax for defining and customizing evaluation test cases (golden cases) in a CX Agent Studio agent export.

## Directory Location
Evaluations are stored in the `evaluations/` directory of the agent export directory. Each evaluation test case is stored in its own sub-folder with the same name as the evaluation file:
```
data/agent/
└── evaluations/
    └── <evaluation_id>/
        └── <evaluation_id>.json
```

## Schema of an Evaluation file (`<evaluation_id>.json`)
An evaluation file defines a series of conversational turns (golden turns) between a user and the agent, along with expectations about tool execution, agent responses, and variables.

```json
{
  "name": "<evaluation-uuid>",
  "displayName": "<Evaluation Display Name>",
  "golden": {
    "turns": [
      ...
    ]
  }
}
```

## Turn Structure and Steps
Each turn in `turns` represents an interaction step. A turn consists of an array of `steps` executing sequentially.
A step can be:
1. **User Input** (`userInput`): Note that each `userInput` object must contain **exactly one key** (`event`, `text`, or `variables`).
   * **Event Input**: Simulates system/conversation events, such as starting the conversation in the first turn (Turn 0) so the agent speaks first.
     ```json
     {
       "userInput": {
         "event": {
           "event": "conversation-start"
         }
       }
     }
     ```
   * **Text-based Input**: Simulates user saying something in a turn.
     ```json
     {
       "userInput": {
         "text": "My bill is higher than usual."
       }
     }
     ```
   * **Variable Configuration**: Simulates setting session variables (e.g. mock journey, flags) before the agent processes a message.
     ```json
     {
       "userInput": {
         "variables": {
           "ui__mock_journey": "my-mock-journey"
         }
       }
     }
     ```
2. **Expectations** (`expectation`):
   * **Tool Call Expectation**: Asserts that the agent will call a specific tool with exact arguments.
     ```json
     {
       "expectation": {
         "toolCall": {
           "id": "<uuid-or-id>",
           "tool": "enter_node",
           "args": {
             "flow_id": "billing-flow",
             "node_id": "billing-triage"
           },
           "displayName": "enter_node"
         }
       }
     }
     ```
   * **Tool Response Expectation**: Simulates/mocks the response returned by the tool.
     ```json
     {
       "expectation": {
         "toolResponse": {
           "id": "<uuid-or-id>",
           "tool": "enter_node",
           "response": {
             "result": {
               "status": "success"
             }
           },
           "displayName": "enter_node"
         }
       }
     }
     ```
   * **Agent Response Expectation**: Asserts the agent text response to the user.
     ```json
     {
       "expectation": {
         "agentResponse": {
           "role": "agent",
           "chunks": [
             {
               "text": "Expected agent greeting text here."
             }
           ]
         }
       }
     }
     ```
   * **Agent Transfer Expectation**: Asserts that the conversation context is transferred to a specific child agent.
     ```json
     {
       "expectation": {
         "agentTransfer": {
           "targetAgent": "flow_agent"
         }
       }
     }
     ```

## Best Practices and Mock Journeys
- **State Initialization / Setting Mock Journeys**: To test specific logical paths (such as when a tool is mocked to return different results depending on the test scenario), set the `ui__mock_journey` variable at the very first turn of the evaluation, using the `userInput.variables` turn step with an empty agent response expectation:
  ```json
  {
    "steps": [
      {
        "userInput": {
          "variables": {
            "ui__mock_journey": "active_delivery"
          }
        }
      },
      {
        "expectation": {
          "agentResponse": {
            "role": "agent",
            "chunks": [{ "text": "" }]
          }
        }
      }
    ]
  }
  ```
- **Intermediate Mock Changes**: For sophisticated flows that query the same tool multiple times with different expected results, a mock journey variable can be updated in intermediate turns to switch the mock profile.
- **Graph-Guided Condition Routes & Tool Call Assertions**: In Graph-Guided Mode, deterministic condition routes (orange) are traversed automatically by `enter_node` at runtime. Therefore, `enter_node` expectations are generated only for intent-driven transitions. If two nodes are connected by BOTH intent and condition routes, `enter_node` is asserted and an export warning is issued.
- **Agent Message Aggregation**: Agent responses per turn are scoped strictly to the current turn's user input and any immediate response, preventing response text leaking into subsequent turns.

