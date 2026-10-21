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

import { loadPyodide, type PyodideInterface } from 'pyodide';

export interface PythonDictOptions {
  indent?: number;      // Spaces per indentation level (default: 2)
  baseIndent?: number;  // Base indentation offset in spaces (default: 0)
}

let pyodideInstance: PyodideInterface | null = null;
let pyodidePromise: Promise<PyodideInterface> | null = null;

export async function getPyodideInstance(): Promise<PyodideInterface> {
  if (pyodideInstance) {
    return pyodideInstance;
  }
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide().then(instance => {
      pyodideInstance = instance;
      instance.runPython(`
import json

def format_python_literal(obj, indent=2, level=0):
    spacing = ' ' * (indent * level)
    inner_spacing = ' ' * (indent * (level + 1))
    
    if obj is None:
        return 'None'
    elif isinstance(obj, bool):
        return 'True' if obj else 'False'
    elif isinstance(obj, (int, float)):
        return repr(obj)
    elif isinstance(obj, str):
        return json.dumps(obj, ensure_ascii=False)
    elif isinstance(obj, list):
        if not obj:
            return '[]'
        items = [inner_spacing + format_python_literal(x, indent, level + 1) for x in obj]
        return '[\\n' + ',\\n'.join(items) + '\\n' + spacing + ']'
    elif isinstance(obj, dict):
        if not obj:
            return '{}'
        items = []
        for k, v in obj.items():
            key_str = json.dumps(str(k), ensure_ascii=False)
            val_str = format_python_literal(v, indent, level + 1)
            items.append(inner_spacing + key_str + ': ' + val_str)
        return '{\\n' + ',\\n'.join(items) + '\\n' + spacing + '}'
    else:
        return repr(obj)
`);
      return instance;
    });
  }
  return pyodidePromise;
}

/**
 * Formats a JavaScript / JSON data structure into a clean, JSON-style native Python dictionary literal
 * using 2-space indentation, no string line-wrapping, and Python literals (True, False, None).
 */
export async function formatAsPythonDict(
  data: unknown,
  options: PythonDictOptions = {}
): Promise<string> {
  const { indent = 2, baseIndent = 0 } = options;
  const pyodide = await getPyodideInstance();

  const safeData = data === undefined ? null : data;
  pyodide.globals.set('__raw_json__', JSON.stringify(safeData));

  const rawPythonCode: string = pyodide.runPython(`
data = json.loads(__raw_json__)
format_python_literal(data, indent=${indent})
`);

  if (baseIndent === 0) {
    return rawPythonCode;
  }

  const padding = ' '.repeat(baseIndent);
  return rawPythonCode
    .split('\n')
    .map((line, idx) => (idx === 0 ? line : padding + line))
    .join('\n');
}
