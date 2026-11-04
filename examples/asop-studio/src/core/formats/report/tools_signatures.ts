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

import YAML from 'yaml';
import { jsPDF } from 'jspdf';
import type { FormatModule, ExportOptions, ExportResult } from '../types';
import { readProjectFilesFromDisk, getStudioVersion } from '../utils';

export interface ToolParamDoc {
  name: string;
  type: string;
  boundVariable?: string;
}

export interface ToolUsageDoc {
  flowId: string;
  flowFile: string;
  nodeId: string;
}

export interface ToolDoc {
  name: string;
  params: ToolParamDoc[];
  returnType: string;
  returnVar?: string;
  mockResponses?: Record<string, any>;
  usages: ToolUsageDoc[];
}

export function collectToolsFromSopFiles(files: Record<string, string>): ToolDoc[] {
  const variablesMap = new Map<string, string>();
  
  // 1. Collect input_variables from main/flow files
  Object.entries(files).forEach(([filename, content]) => {
    if (filename.startsWith('_snapshots/')) return;
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
      try {
        const parsed = YAML.parse(content);
        const inputVars = parsed?.input_variables || parsed?.flow?.input_variables;
        if (Array.isArray(inputVars)) {
          inputVars.forEach((v: any) => {
            if (v && v.name && v.type) {
              variablesMap.set(v.name, v.type);
            }
          });
        }
      } catch {
        // ignore
      }
    }
  });

  // 2. Collect set_variables across all nodes in all flows
  Object.entries(files).forEach(([filename, content]) => {
    if (filename.startsWith('_snapshots/')) return;
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
      try {
        const parsed = YAML.parse(content);
        const nodes = parsed?.flow?.nodes || [];
        nodes.forEach((node: any) => {
          const routes = [
            ...(node.intent_routes || []),
            ...(node.condition_routes || []),
            ...(node.global_intent_routes || [])
          ];
          routes.forEach((r: any) => {
            if (Array.isArray(r.set_variables)) {
              r.set_variables.forEach((v: any) => {
                if (v && v.name && v.type) {
                  variablesMap.set(v.name, v.type);
                }
              });
            }
          });
        });
      } catch {
        // ignore
      }
    }
  });

  // 3. Extract tools and usage across all flows
  const toolsMap = new Map<string, {
    name: string;
    paramsMap: Map<string, { name: string; type: string; boundVariable?: string }>;
    returnVar?: string;
    mockResponses?: Record<string, any>;
    usages: ToolUsageDoc[];
  }>();

  Object.entries(files).forEach(([filename, content]) => {
    if (filename.startsWith('_snapshots/')) return;
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
      try {
        const parsed = YAML.parse(content);
        const flow = parsed?.flow;
        if (!flow) return;
        const flowId = flow.id || filename;
        const nodes = flow.nodes || [];

        nodes.forEach((node: any) => {
          const nodeId = node.id || 'unknown';
          const actions = node.actions || [];
          if (Array.isArray(actions)) {
            actions.forEach((act: any) => {
              if (act && (act.type === 'tool' || act.tool_name)) {
                const toolName = act.tool_name;
                if (!toolName) return;

                if (!toolsMap.has(toolName)) {
                  toolsMap.set(toolName, {
                    name: toolName,
                    paramsMap: new Map(),
                    usages: []
                  });
                }

                const toolRecord = toolsMap.get(toolName)!;

                // Track usage (flowFile + nodeId)
                const exists = toolRecord.usages.some(u => u.flowFile === filename && u.nodeId === nodeId);
                if (!exists) {
                  toolRecord.usages.push({
                    flowId,
                    flowFile: filename,
                    nodeId
                  });
                }

                // Process tool_params
                if (act.tool_params && typeof act.tool_params === 'object') {
                  Object.entries(act.tool_params).forEach(([paramName, val]) => {
                    let paramType = 'string';
                    let boundVar: string | undefined = undefined;

                    if (typeof val === 'string') {
                      if (variablesMap.has(val)) {
                        paramType = variablesMap.get(val)!;
                        boundVar = val;
                      } else {
                        paramType = 'string';
                        boundVar = val;
                      }
                    } else if (typeof val === 'boolean') {
                      paramType = 'bool';
                    } else if (typeof val === 'number') {
                      paramType = Number.isInteger(val) ? 'int' : 'float';
                    }

                    if (!toolRecord.paramsMap.has(paramName)) {
                      toolRecord.paramsMap.set(paramName, {
                        name: paramName,
                        type: paramType,
                        boundVariable: boundVar
                      });
                    } else {
                      const existingParam = toolRecord.paramsMap.get(paramName)!;
                      if (!existingParam.boundVariable && boundVar) {
                        existingParam.boundVariable = boundVar;
                        if (paramType !== 'string') existingParam.type = paramType;
                      }
                    }
                  });
                }

                // Process store_result_variable
                if (act.store_result_variable && typeof act.store_result_variable === 'string') {
                  toolRecord.returnVar = act.store_result_variable;
                }

                // Process mock_responses
                if (act.mock_responses && typeof act.mock_responses === 'object') {
                  if (!toolRecord.mockResponses) {
                    toolRecord.mockResponses = {};
                  }
                  Object.assign(toolRecord.mockResponses, act.mock_responses);
                }
              }
            });
          }
        });
      } catch {
        // ignore parsing errors
      }
    }
  });

  const tools: ToolDoc[] = [];
  toolsMap.forEach(t => {
    const paramsList: ToolParamDoc[] = Array.from(t.paramsMap.values());
    let returnType = 'dict';
    if (t.returnVar) {
      if (variablesMap.has(t.returnVar)) {
        returnType = `${t.returnVar} (${variablesMap.get(t.returnVar)})`;
      } else {
        returnType = `${t.returnVar} (dict)`;
      }
    } else if (t.mockResponses) {
      returnType = 'dict';
    } else {
      returnType = 'void';
    }

    tools.push({
      name: t.name,
      params: paramsList,
      returnType,
      returnVar: t.returnVar,
      mockResponses: t.mockResponses,
      usages: t.usages
    });
  });

  return tools;
}

export function generateToolsReportPdf(projectName: string, tools: ToolDoc[]): Uint8Array {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const studioVersion = getStudioVersion();
  let y = 26;

  function drawHeaderFooter() {
    doc.setDrawColor(220, 226, 235);
    doc.setLineWidth(0.4);
    doc.line(marginLeft, 15, pageWidth - marginRight, 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 140);
    doc.text(`ASOP Studio v${studioVersion} — Tools & Signatures Report`, marginLeft, 11);
    doc.text(`Project: ${projectName}`, pageWidth - marginRight, 11, { align: 'right' });
  }

  function checkNewPage(neededHeight: number) {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
      drawHeaderFooter();
    }
  }

  drawHeaderFooter();

  // Document Title Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text('Tools & Signatures Report', marginLeft, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  const dateStr = new Date().toISOString().split('T')[0];
  doc.text(`Project: ${projectName}   |   Generated: ${dateStr}   |   Total Tools: ${tools.length}`, marginLeft, y);
  y += 8;

  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(1.2);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 12;

  // Table of Contents Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Table of Contents', marginLeft, y);
  y += 10;

  if (tools.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('No tools were defined in this SOP project.', marginLeft, y);
  } else {
    tools.forEach((tool, index) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      
      const itemText = `•  ${tool.name}`;
      const pageText = `Page ${index + 2}`;
      
      doc.text(itemText, marginLeft, y);
      
      // Dotted lines
      doc.setFont('courier', 'normal');
      doc.setTextColor(203, 213, 225);
      const itemWidth = doc.getTextWidth(itemText);
      const dotStart = marginLeft + itemWidth + 3;
      const dotEnd = pageWidth - marginRight - doc.getTextWidth(pageText) - 3;
      
      let dots = '';
      if (dotEnd > dotStart) {
        const dotWidth = doc.getTextWidth('.');
        const dotCount = Math.floor((dotEnd - dotStart) / dotWidth);
        dots = '.'.repeat(dotCount);
      }
      doc.text(dots, dotStart, y);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text(pageText, pageWidth - marginRight, y, { align: 'right' });
      
      y += 8;
    });
  }

  // Page break after TOC
  doc.addPage();
  y = 20;
  drawHeaderFooter();

  if (tools.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('No tools were defined in this SOP project.', marginLeft, y);
  } else {
    const contentX = marginLeft + 8;
    tools.forEach((tool, index) => {
      checkNewPage(35);

      // Tool Box Header
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(marginLeft, y, contentWidth, 9, 1.5, 1.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.text(tool.name, marginLeft + 4, y + 6.2);

      y += 16;

      // Tool Signature Line
      const paramSig = tool.params.map(p => `${p.name}: ${p.type}`).join(', ');
      const signatureText = `${tool.name}(${paramSig}) -> ${tool.returnType}`;
      
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(67, 56, 202);
      doc.text('Signature: ', contentX, y);
      
      doc.setFont('courier', 'normal');
      doc.setTextColor(51, 65, 85);
      const splitSig = doc.splitTextToSize(signatureText, pageWidth - marginRight - (contentX + 22) - 3);
      doc.text(splitSig, contentX + 22, y);
      y += (splitSig.length * 4.5) + 3;

      // Parameters Table
      checkNewPage(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Parameters:', contentX, y);
      y += 6;

      if (tool.params.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text('No parameters required', contentX + 4, y);
        y += 7.5;
      } else {
        const tableWidth = pageWidth - marginRight - contentX;
        doc.setFillColor(238, 242, 255);
        doc.rect(contentX, y, tableWidth, 5.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229);
        doc.text('Parameter Name', contentX + 4, y + 3.8);
        doc.text('Parameter Type', contentX + 55, y + 3.8);
        doc.text('Bound Variable / Expression', contentX + 110, y + 3.8);
        y += 5.5;

        tool.params.forEach(p => {
          doc.setFont('courier', 'normal');
          doc.setFontSize(8);
          const splitType = doc.splitTextToSize(p.type, 52);
          const lineCount = splitType.length;
          const rowHeight = Math.max(5.5, (lineCount - 1) * 3.8 + 5.5);

          checkNewPage(rowHeight);

          doc.setFont('courier', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          doc.text(p.name, contentX + 4, y + 3.8);
          doc.text(splitType, contentX + 55, y + 3.8);
          doc.text(p.boundVariable || '-', contentX + 110, y + 3.8);

          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.line(contentX, y + rowHeight - 0.3, pageWidth - marginRight, y + rowHeight - 0.3);
          y += rowHeight;
        });
        y += 8; // Spacing below parameters table
      }

      // Return Type
      checkNewPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Return Type: ', contentX, y);
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(5, 150, 105);
      doc.text(tool.returnType, contentX + 24, y);
      y += 7.5;

      if (tool.mockResponses && Object.keys(tool.mockResponses).length > 0) {
        checkNewPage(14);
        const keys = Object.keys(tool.mockResponses);
        const selectedKey = keys.includes('default') ? 'default' : keys[0];

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Example Response (${selectedKey}):`, contentX, y);
        y += 6;

        const mockVal = tool.mockResponses[selectedKey];
        const mockStr = JSON.stringify(mockVal, null, 2);

        const splitMock = doc.splitTextToSize(mockStr, pageWidth - marginRight - contentX - 8);
        checkNewPage(splitMock.length * 3.5);

        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(splitMock, contentX + 4, y);
        y += (splitMock.length * 3.5) + 6;
      }

      // Usages
      checkNewPage(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Used In Flows & Nodes:', contentX, y);
      y += 6;

      if (tool.usages.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Not invoked in any nodes.', contentX + 4, y);
        y += 7;
      } else {
        const usageWidth = pageWidth - marginRight - contentX;
        tool.usages.forEach(u => {
          checkNewPage(5.5);
          doc.setFillColor(248, 250, 252);
          doc.rect(contentX, y, usageWidth, 5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text(`• Flow: `, contentX + 2, y + 3.5);
          doc.setFont('helvetica', 'normal');
          doc.text(`${u.flowFile}`, contentX + 14, y + 3.5);
          doc.setFont('helvetica', 'bold');
          doc.text(`   Node: `, contentX + 80, y + 3.5);
          doc.setFont('courier', 'bold');
          doc.setTextColor(79, 70, 229);
          doc.text(`${u.nodeId}`, contentX + 95, y + 3.5);
          y += 5.8;
        });
      }

      if (index < tools.length - 1) {
        doc.addPage();
        y = 20;
        drawHeaderFooter();
      }
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginRight, pageHeight - 10, { align: 'right' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

export const toolsSignaturesFormat: FormatModule = {
  id: 'tools-signatures',

  async export({ projectName, folderPath }: ExportOptions): Promise<ExportResult> {
    const files = readProjectFilesFromDisk(folderPath);
    const tools = collectToolsFromSopFiles(files);
    const pdfUint8 = generateToolsReportPdf(projectName, tools);
    const pdfBuffer = Buffer.from(pdfUint8);

    return {
      data: pdfBuffer,
      contentType: 'application/pdf',
      filename: `${projectName}_tools_signatures_report.pdf`
    };
  }
};
