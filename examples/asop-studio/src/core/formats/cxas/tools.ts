import type { CxasExportContext } from './types';
import { sanitizeResourceId } from './utils';
import { formatAsPythonDict } from '../pythonSerializer';

export async function generateTools(context: CxasExportContext, agentDirName: string): Promise<void> {
  const { zip, variablesMap, toolsMap } = context;

  if (variablesMap.size > 0) {
    const setVarsParams = new Set<string>();
    variablesMap.forEach((_, name) => {
      setVarsParams.add(`sop__${name}`);
    });
    toolsMap.set('set_variables', { params: setVarsParams, mockResponses: {}, storeResultVariables: new Set() });
  }

  // Generate collected tools
  for (const [toolName, toolData] of toolsMap.entries()) {
    const toolFolderName = sanitizeResourceId(toolName.toLowerCase());
    const toolDisplayName = toolName;

    const toolMetadata = {
      name: toolFolderName,
      pythonFunction: {
        name: toolDisplayName,
        pythonCode: `tools/${toolFolderName}/python_function/python_code.py`,
        description: toolName === 'set_variables'
          ? `Sets session variables for tracking workflow state.`
          : `Mocked tool implementation for ${toolDisplayName}`
      },
      executionType: "SYNCHRONOUS",
      displayName: toolDisplayName
    };

    // Python code builder
    const paramsList = Array.from(toolData.params);
    const paramsSignature = paramsList.map(p => `${p}: Optional[Any] = None`).join(', ');
    const docstringArgs = paramsList.map(p => `        ${p}: Parameter for ${toolDisplayName}`).join('\n');

    let pythonCode: string;
    if (toolName === 'set_variables') {
      const paramsAssign = paramsList.map(p => `    if ${p} is not None:\n        res["${p}"] = ${p}`).join('\n');
      pythonCode = `# Copyright 2026 Google LLC
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

from typing import Dict, Any, Optional

def set_variables(${paramsSignature}) -> Dict[str, Any]:
    """Sets session variables for tracking workflow state.

    Args:
${docstringArgs}
    """
    res = {}
${paramsAssign}
    return res
`;
    } else {
      const storeVars = toolData.storeResultVariables ? Array.from(toolData.storeResultVariables) : [];
      const storeAssignments = storeVars.map(v => `    try:
        if context and context.state:
            context.state["sop__${v}"] = result
    except NameError:
        pass`).join('\n');

      const formattedMocks = await formatAsPythonDict(toolData.mockResponses, { indent: 2, baseIndent: 4 });

      pythonCode = `# Copyright 2026 Google LLC
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

from typing import Dict, Any, Optional

def ${toolDisplayName}(${paramsSignature}) -> Dict[str, Any]:
    """Mocked tool implementation for ${toolDisplayName}.

    Args:
${docstringArgs}
    """
    mock_responses = ${formattedMocks}
    
    journey = "default"
    try:
        # 'context' is injected dynamically by the CXAS runtime environment.
        if context and context.state:
            journey = context.state.get("ui__mock_journey", "default")
    except NameError:
        pass

    result = mock_responses.get(journey, list(mock_responses.values())[0] if mock_responses else {})
${storeAssignments}
    return result
`;
    }

    zip.addFile(`${agentDirName}/tools/${toolFolderName}/${toolFolderName}.json`, Buffer.from(JSON.stringify(toolMetadata, null, 2), 'utf-8'));
    zip.addFile(`${agentDirName}/tools/${toolFolderName}/python_function/python_code.py`, Buffer.from(pythonCode, 'utf-8'));
  }
}
