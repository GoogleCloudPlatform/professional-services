#!/usr/bin/env node

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

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import os from 'os';
import pc from 'picocolors';
import AdmZip from 'adm-zip';
import { getFormat } from '../core/formats/registry';
import { mountSubagent } from '../core/formats/cxas/mount';

const program = new Command();

program
  .name('asopcli')
  .description('ASOP Studio CLI - Work with Agentic workflows and SOP specs from the command line')
  .version('0.1.0');

// Helper to determine the project name from a path
function getProjectName(sourcePath: string): string {
  const baseName = path.basename(sourcePath);
  return baseName.replace(/\.[^/.]+$/, ""); // strip extension
}

// Helper to create a temp directory and import the source into it
async function prepareSourceFolder(sourcePath: string): Promise<{ folderPath: string; cleanup: () => void }> {
  const resolvedPath = path.resolve(sourcePath);
  
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Source path not found: ${sourcePath}`);
  }

  const stats = fs.statSync(resolvedPath);
  
  // If it's a directory, use it directly
  if (stats.isDirectory()) {
    return {
      folderPath: resolvedPath,
      cleanup: () => {}
    };
  }

  // Create a temporary directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asop-cli-'));
  const cleanup = () => {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (e) {
      // ignore cleanup errors
    }
  };

  const buffer = fs.readFileSync(resolvedPath);
  const projectName = getProjectName(resolvedPath);
  const sanitizedName = projectName.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '-');

  // Detect format based on file extension
  const ext = path.extname(resolvedPath).toLowerCase();
  let importFormat = '';
  if (ext === '.zip') {
    importFormat = 'zip';
  } else if (ext === '.yaml' || ext === '.yml') {
    importFormat = 'yaml';
  } else if (ext === '.html' || ext === '.htm') {
    importFormat = 'visualizer';
  } else {
    cleanup();
    throw new Error(`Unsupported source file extension: ${ext}. Expected .zip, .yaml, or .html`);
  }

  const formatModule = getFormat(importFormat);
  if (!formatModule || !formatModule.import) {
    cleanup();
    throw new Error(`No import handler found for format: ${importFormat}`);
  }

  try {
    await formatModule.import({
      buffer,
      targetDir: tempDir,
      sanitizedName
    });
    return {
      folderPath: tempDir,
      cleanup
    };
  } catch (err) {
    cleanup();
    throw err;
  }
}

// Export Command Group
const exportCmd = program
  .command('export')
  .description('Export SOP workflows or agent blueprints');

// Command 1: export sop
exportCmd
  .command('sop')
  .argument('<source>', 'Source path (ZIP file, YAML file, or folder)')
  .argument('<target>', 'Target file path')
  .option('-f, --format <format>', 'Export format (zip, yaml, visualizer)', 'zip')
  .description('Export a SOP into zip, yaml, or visualizer format')
  .action(async (source, target, options) => {
    const format = options.format.toLowerCase();
    if (!['zip', 'yaml', 'visualizer'].includes(format)) {
      console.error(pc.red(`Error: Invalid format "${format}". Supported formats: zip, yaml, visualizer`));
      process.exit(1);
    }

    console.log(pc.cyan(`\n🚀 ASOP Studio - Exporting SOP`));
    console.log(pc.dim(`----------------------------------------`));
    console.log(`${pc.blue('Source:')} ${source}`);
    console.log(`${pc.blue('Target:')} ${target}`);
    console.log(`${pc.blue('Format:')} ${format}`);

    let cleanup: (() => void) | undefined;
    try {
      const { folderPath, cleanup: clean } = await prepareSourceFolder(source);
      cleanup = clean;

      const projectName = getProjectName(source);
      const formatModule = getFormat(format);
      if (!formatModule || !formatModule.export) {
        throw new Error(`Unsupported or non-exportable format: ${format}`);
      }

      console.log(pc.yellow(`🔄 Processing and packaging...`));
      const result = await formatModule.export({
        projectName,
        folderPath
      });

      const targetPath = path.resolve(target);
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFileSync(targetPath, result.data);
      console.log(pc.green(`✔ Export successful!`));
      console.log(`${pc.bold('Saved to:')} ${targetPath}\n`);
    } catch (err: any) {
      console.error(pc.red(`❌ Export failed: ${err.message}`));
      process.exit(1);
    } finally {
      if (cleanup) cleanup();
    }
  });

// Command 2: export agent
exportCmd
  .command('agent')
  .argument('<source>', 'Source path (ZIP file, YAML file, or folder)')
  .argument('<target>', 'Target file path')
  .option('-f, --format <format>', 'Export format (adk, cxas)', 'adk')
  .option('-e, --engine <engine>', 'Execution engine (fully-agentic, graph-guided)', 'fully-agentic')
  .description('Export a SOP into ADK or CXAS agent blueprints')
  .action(async (source, target, options) => {
    const format = options.format.toLowerCase();
    const engine = options.engine.toLowerCase();

    if (!['adk', 'cxas'].includes(format)) {
      console.error(pc.red(`Error: Invalid format "${format}". Supported formats: adk, cxas`));
      process.exit(1);
    }

    if (!['fully-agentic', 'graph-guided'].includes(engine)) {
      console.error(pc.red(`Error: Invalid engine "${engine}". Supported engines: fully-agentic, graph-guided`));
      process.exit(1);
    }

    console.log(pc.cyan(`\n🚀 ASOP Studio - Exporting Agent Blueprint`));
    console.log(pc.dim(`----------------------------------------`));
    console.log(`${pc.blue('Source:')} ${source}`);
    console.log(`${pc.blue('Target:')} ${target}`);
    console.log(`${pc.blue('Format:')} ${format}`);
    console.log(`${pc.blue('Engine:')} ${engine}`);

    let cleanup: (() => void) | undefined;
    try {
      const { folderPath, cleanup: clean } = await prepareSourceFolder(source);
      cleanup = clean;

      const projectName = getProjectName(source);
      const formatModule = getFormat(format);
      if (!formatModule || !formatModule.export) {
        throw new Error(`Unsupported or non-exportable format: ${format}`);
      }

      console.log(pc.yellow(`🔄 Generating agent code and packaging...`));
      
      // For ADK and CXAS exports, the backend uses 'mode' parameter for engine type.
      const result = await formatModule.export({
        projectName,
        folderPath,
        mode: engine
      });

      const targetPath = path.resolve(target);
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(w => {
          console.warn(pc.yellow(`⚠️ Warning: ${w}`));
        });
      }

      fs.writeFileSync(targetPath, result.data);
      console.log(pc.green(`✔ Export successful!`));
      console.log(`${pc.bold('Saved to:')} ${targetPath}\n`);
    } catch (err: any) {
      console.error(pc.red(`❌ Export failed: ${err.message}`));
      process.exit(1);
    } finally {
      if (cleanup) cleanup();
    }
  });

// Command 3: export report
exportCmd
  .command('report')
  .argument('<source>', 'Source path (ZIP file, YAML file, or folder)')
  .argument('<target>', 'Target file path')
  .option('-f, --format <format>', 'Report format (tools-signatures)', 'tools-signatures')
  .description('Export SOP reports (e.g. tools and signatures PDF)')
  .action(async (source, target, options) => {
    const format = options.format.toLowerCase().replace(/_/g, '-');
    if (!['tools-signatures'].includes(format)) {
      console.error(pc.red(`Error: Invalid report format "${format}". Supported formats: tools-signatures`));
      process.exit(1);
    }

    console.log(pc.cyan(`\n🚀 ASOP Studio - Exporting Report`));
    console.log(pc.dim(`----------------------------------------`));
    console.log(`${pc.blue('Source:')} ${source}`);
    console.log(`${pc.blue('Target:')} ${target}`);
    console.log(`${pc.blue('Format:')} ${format}`);

    let cleanup: (() => void) | undefined;
    try {
      const { folderPath, cleanup: clean } = await prepareSourceFolder(source);
      cleanup = clean;

      const projectName = getProjectName(source);
      const formatModule = getFormat(format);
      if (!formatModule || !formatModule.export) {
        throw new Error(`Unsupported or non-exportable format: ${format}`);
      }

      console.log(pc.yellow(`🔄 Generating report...`));
      const result = await formatModule.export({
        projectName,
        folderPath
      });

      const targetPath = path.resolve(target);
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFileSync(targetPath, result.data);
      console.log(pc.green(`✔ Export successful!`));
      console.log(`${pc.bold('Saved to:')} ${targetPath}\n`);
    } catch (err: any) {
      console.error(pc.red(`❌ Export failed: ${err.message}`));
      process.exit(1);
    } finally {
      if (cleanup) cleanup();
    }
  });

// Command 4: export cxas-mount
exportCmd
  .command('cxas-mount')
  .argument('<source>', 'Source path (ZIP file, YAML file, or folder) of the SOP')
  .argument('<target>', 'Target path of the CXAS agent (ZIP file or directory)')
  .option('-s, --sub-agent <subagent>', 'Name of the sub-agent in the target agent')
  .option('-e, --engine <engine>', 'Execution engine (fully-agentic, graph-guided)', 'fully-agentic')
  .option('-p, --prefix <prefix>', 'Prefix for child agent and framework tool names', '')
  .option('--agent', 'Mount the SOP subagent itself')
  .option('--global-instructions', 'Mount/overwrite global instructions')
  .option('--prompt-guard', 'Mount/overwrite prompt guardrail')
  .option('--golden-evals', 'Mount golden evaluation cases')
  .option('--scenario-evals', 'Mount scenario evaluation cases')
  .description('Mount an exported agent into an existing CXAS agent')
  .action(async (source, target, options) => {
    const engine = options.engine.toLowerCase();
    if (!['fully-agentic', 'graph-guided'].includes(engine)) {
      console.error(pc.red(`Error: Invalid engine "${engine}". Supported engines: fully-agentic, graph-guided`));
      process.exit(1);
    }

    const defaultName = getProjectName(source);
    let subagentName = options.subAgent;
    if (!subagentName) {
      subagentName = defaultName;
      console.warn(pc.yellow(`Warning: No sub-agent name specified. Defaulting to "${subagentName}". It is recommended to explicitly define the sub-agent to mount to using --sub-agent.`));
    }

    console.log(pc.cyan(`\n🚀 ASOP Studio - Mounting Subagent to CXAS`));
    console.log(pc.dim(`----------------------------------------`));
    console.log(`${pc.blue('Source SOP:')} ${source}`);
    console.log(`${pc.blue('Target Agent:')} ${target}`);
    console.log(`${pc.blue('Sub-Agent Name:')} ${subagentName}`);
    console.log(`${pc.blue('Engine:')} ${engine}`);
    if (options.prefix) {
      console.log(`${pc.blue('Prefix:')} ${options.prefix}`);
    }

    const resolvedTarget = path.resolve(target);
    if (!fs.existsSync(resolvedTarget)) {
      console.error(pc.red(`Error: Target path not found: ${target}`));
      process.exit(1);
    }

    const targetStats = fs.statSync(resolvedTarget);
    let targetDir = resolvedTarget;
    let isZip = false;
    let tempTargetDir = '';

    if (targetStats.isFile() && path.extname(resolvedTarget).toLowerCase() === '.zip') {
      isZip = true;
      tempTargetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asop-mount-target-'));
      targetDir = tempTargetDir;
      try {
        const zip = new AdmZip(resolvedTarget);
        zip.extractAllTo(tempTargetDir, true);
      } catch (err: any) {
        console.error(pc.red(`❌ Failed to extract target ZIP: ${err.message}`));
        if (fs.existsSync(tempTargetDir)) {
          fs.rmSync(tempTargetDir, { recursive: true, force: true });
        }
        process.exit(1);
      }
    } else if (!targetStats.isDirectory()) {
      console.error(pc.red(`Error: Target must be a directory or a ZIP file.`));
      process.exit(1);
    }

    let sourceCleanup: (() => void) | undefined;
    try {
      const { folderPath: sourceDir, cleanup } = await prepareSourceFolder(source);
      sourceCleanup = cleanup;

      console.log(pc.yellow(`🔄 Mounting subagent and updating configurations...`));
      await mountSubagent({
        sourceSopDir: sourceDir,
        targetDir,
        subagentName,
        engine,
        prefix: options.prefix,
        agent: options.agent,
        globalInstructions: options.globalInstructions,
        promptGuard: options.promptGuard,
        goldenEvals: options.goldenEvals,
        scenarioEvals: options.scenarioEvals
      });

      if (isZip) {
        console.log(pc.yellow(`🔄 Repackaging target ZIP...`));
        const zip = new AdmZip();
        zip.addLocalFolder(targetDir);
        zip.writeZip(resolvedTarget);
      }

      console.log(pc.green(`✔ Mounting successful!`));
    } catch (err: any) {
      console.error(pc.red(`❌ Mounting failed: ${err.message}`));
      process.exit(1);
    } finally {
      if (sourceCleanup) sourceCleanup();
      if (tempTargetDir && fs.existsSync(tempTargetDir)) {
        try {
          fs.rmSync(tempTargetDir, { recursive: true, force: true });
        } catch (e) {
          // ignore
        }
      }
    }
  });

program.parse(process.argv);

