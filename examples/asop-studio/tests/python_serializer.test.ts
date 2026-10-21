// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { describe, it, expect } from 'vitest';
import { formatAsPythonDict, getPyodideInstance } from '../src/core/formats/pythonSerializer';

describe('Python Dict Serializer (Pyodide WASM)', () => {
  it('should serialize primitives (booleans, null, numbers, strings)', async () => {
    const data = {
      is_active: true,
      is_deleted: false,
      optional_field: null,
      count: 42,
      price: 19.99,
      negative: -100,
      title: 'Hello "World" & \'Universe\''
    };

    const pythonCode = await formatAsPythonDict(data);

    expect(pythonCode).toContain('"is_active": True');
    expect(pythonCode).toContain('"is_deleted": False');
    expect(pythonCode).toContain('"optional_field": None');
    expect(pythonCode).toContain('"count": 42');
    expect(pythonCode).toContain('"price": 19.99');
    expect(pythonCode).toContain('"negative": -100');
    expect(pythonCode).toContain('"title": "Hello \\"World\\" & \'Universe\'"');
  });

  it('should serialize unicode and emoji characters without corruption', async () => {
    const data = {
      greeting: 'Bonjour le monde! Ça va bien? 🍕',
      japanese: 'こんにちは世界',
      symbols: '→ ← 🚀 ⚡'
    };

    const pythonCode = await formatAsPythonDict(data);
    expect(pythonCode).toContain('🍕');
    expect(pythonCode).toContain('Bonjour le monde! Ça va bien?');
    expect(pythonCode).toContain('こんにちは世界');
    expect(pythonCode).toContain('🚀');
  });

  it('should format with clean 2-space indentation and not wrap long strings', async () => {
    const data = {
      id: 'order-triage',
      agent_instructions: "Sono l'assistente per gli ordini della pizzeria. Posso aiutarti a verificare lo stato dell'ordine, il menù del giorno, gli allergeni e le opzioni di consegna.",
      actions: [],
      intent_routes: [
        {
          intent: 'Richiesta di consegna rapida (ordine standard o personalizzato)',
          target_flow: 'main',
          target_node: 'handle-delivery-request'
        }
      ]
    };

    const pythonCode = await formatAsPythonDict(data, { indent: 2 });

    // Verify long string is on a single line
    expect(pythonCode).toContain('"agent_instructions": "Sono l\'assistente per gli ordini della pizzeria. Posso aiutarti a verificare lo stato dell\'ordine, il menù del giorno, gli allergeni e le opzioni di consegna."');
    
    // Verify 2-space indentation structure
    expect(pythonCode).toContain('  "id": "order-triage"');
    expect(pythonCode).toContain('  "intent_routes": [\n    {\n      "intent":');

    const pyodide = await getPyodideInstance();
    pyodide.globals.set('__test_code__', pythonCode);
    const roundtripMatches = pyodide.runPython(`
import ast, json
parsed = ast.literal_eval(__test_code__)
expected = json.loads('''${JSON.stringify(data).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}''')
parsed == expected
`);
    expect(roundtripMatches).toBe(true);
  });

  it('should apply baseIndent padding correctly to lines 1+', async () => {
    const data = {
      order_id: '12345',
      status: 'pending',
      items: ['pizza_margherita', 'water_bottle']
    };

    const formatted = await formatAsPythonDict(data, { indent: 2, baseIndent: 4 });
    const lines = formatted.split('\n');

    expect(lines.length).toBeGreaterThan(1);
    // Line 0 starts without the baseIndent padding because it directly follows the variable assignment
    expect(lines[0].startsWith('{')).toBe(true);
    // Subsequent lines must be indented by at least 4 spaces
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i].startsWith('    ')).toBe(true);
    }
  });

  it('should evaluate cleanly as valid Python syntax in a function body with baseIndent=4', async () => {
    const mockResponses = {
      default: {
        status: 'out_for_delivery',
        eta_minutes: 25,
        driver: {
          name: 'Mario',
          phone: '+1-555-0199'
        }
      }
    };

    const formattedMocks = await formatAsPythonDict(mockResponses, { indent: 2, baseIndent: 4 });
    const functionCode = `def get_order_status(context=None, order_id=None):
    mock_responses = ${formattedMocks}
    return mock_responses
`;

    const pyodide = await getPyodideInstance();
    pyodide.runPython(functionCode);
    const result = pyodide.runPython("get_order_status()['default']['status']");
    expect(result).toBe('out_for_delivery');
  });

  it('should handle undefined / null gracefully', async () => {
    const codeNull = await formatAsPythonDict(null);
    expect(codeNull).toBe('None');

    const codeUndefined = await formatAsPythonDict(undefined);
    expect(codeUndefined).toBe('None');
  });

  it('should return matched journey or fallback to first available key in mock_responses', async () => {
    const mockResponses = {
      happy_path: {
        status: 'confirmed',
        amount: 50
      },
      cancelled_order: {
        status: 'cancelled',
        refund: true
      }
    };

    const formattedMocks = await formatAsPythonDict(mockResponses, { indent: 2, baseIndent: 4 });
    const functionCode = `
class MockContext:
    def __init__(self, journey_name=None):
        self.state = {"ui__mock_journey": journey_name} if journey_name is not None else {}

def test_mock_tool(context=None):
    mock_responses = ${formattedMocks}
    journey = "default"
    try:
        if context and context.state:
            journey = context.state.get("ui__mock_journey", "default")
    except NameError:
        pass
    result = mock_responses.get(journey, list(mock_responses.values())[0] if mock_responses else {})
    return result
`;

    const pyodide = await getPyodideInstance();
    pyodide.runPython(functionCode);

    // 1. Matched journey returns corresponding response
    const matched = pyodide.runPython("test_mock_tool(MockContext('cancelled_order'))['status']");
    expect(matched).toBe('cancelled');

    // 2. Non-existent journey returns first available key's response (happy_path)
    const fallbackNonExistent = pyodide.runPython("test_mock_tool(MockContext('non_existent_journey'))['status']");
    expect(fallbackNonExistent).toBe('confirmed');

    // 3. No journey set in context (defaults to "default" which is not in dict) returns first available key (happy_path)
    const fallbackDefault = pyodide.runPython("test_mock_tool(MockContext())['status']");
    expect(fallbackDefault).toBe('confirmed');
    const fallbackNone = pyodide.runPython("test_mock_tool(None)['status']");
    expect(fallbackNone).toBe('confirmed');
  });
});

