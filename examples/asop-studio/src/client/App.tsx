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

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
  type OnSelectionChangeParams
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SopNode } from './components/SopNode';
import FloatingEdge from './components/FloatingEdge';
import { type SopNodeData, type SopEdgeData, type ReviewRequest } from './utils/review';
import { parseAndLayoutFlow } from './utils/flowParser';
import { 
  Play, 
  Sparkles, 
  Search, 
  ArrowRight, 
  AlertCircle,
  Cpu,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Maximize,
  ExternalLink,
  Upload,
  Download,
  Lock,
  BookOpen,
  Braces,
  PlayCircle,
  X,
  MessageSquare,
  GitBranch,
  Brain,
  Crosshair,
  Undo,
  Redo,
  History,
  Pencil,
  Check,
  Trash2,
  Shield,
  Sun,
  Moon
} from 'lucide-react';
import YAML from 'yaml';
import JSZip from 'jszip';
import {
  parseYamlToSopProject,
  validateSopProject,
  buildUnifiedSop,
  type SopProject
} from '../common/sopCommon';
import { collectToolsFromSopFiles, generateToolsReportPdf } from '../core/formats/report/tools_signatures';
import {
  initializeSnapshots,
  createSnapshot,
  updateNodeInstructionsInYaml,
  updateGlobalInstructionsInYaml,
  updatePromptGuardInYaml,
  updateRouteInYaml,
  hasChangesSinceLatestSnapshot,
  addReviewRequestToNodeInYaml,
  addReviewRequestToRouteInYaml,
  resolveReviewRequestInYaml,
  deleteReviewRequestInYaml
} from './utils/snapshots';
import { EditableInstructions } from './components/EditableInstructions';
import { HistoryPanel } from './components/HistoryPanel';
import { shortcutMappings, matchesShortcut, isTypingEvent } from './utils/shortcuts';

declare const __APP_VERSION__: string;

// Define the custom node types map
const nodeTypes = {
  sopNode: SopNode
};

// Define the custom edge types map
const edgeTypes = {
  floating: FloatingEdge
};

interface NavNode {
  id: string;
  isRoot: boolean;
  type: string;
}

const initEmbeddedSop = () => {
  const scriptEl = document.getElementById('sop-data');
  if (!scriptEl) return null;
  let content = scriptEl.textContent;
  if (!content) return null;
  if (scriptEl.getAttribute('data-encoding') === 'base64') {
    try {
      content = atob(content.trim());
    } catch (e) {
      console.error('Failed to base64 decode embedded SOP data:', e);
      return null;
    }
  }
  try {
    const parsed = YAML.parse(content);
    if (parsed && parsed.sop) {
      const sop = parsed.sop;
      const files: Record<string, string> = {};
      const flowKeys = Object.keys(sop.flows);
      
      const flowIdToFilename: Record<string, string> = {};
      const mainFileKey = flowKeys.find(k => k === 'main' || k.endsWith('-main-flow') || k.endsWith('-main')) || flowKeys[0];
      const mainFile = 'main.yml';

      flowKeys.forEach(k => {
        flowIdToFilename[k] = k === mainFileKey ? 'main.yml' : `${k}.yml`;
      });
      
      const rewriteRoutesToFiles = (routes: any[]) => {
        if (!Array.isArray(routes)) return;
        routes.forEach(route => {
          if (route && route.target_flow) {
            const filename = flowIdToFilename[route.target_flow];
            if (filename) {
              route.target_flow = filename;
            }
          }
        });
      };

      let exampleJourneys = sop.example_journeys;
      if (Array.isArray(exampleJourneys)) {
        // Clone to avoid mutations
        exampleJourneys = JSON.parse(JSON.stringify(exampleJourneys));
        exampleJourneys.forEach((journey: any) => {
          if (Array.isArray(journey.steps)) {
            journey.steps.forEach((step: any) => {
              if (step && step.current_flow) {
                const filename = flowIdToFilename[step.current_flow];
                if (filename) {
                  step.current_flow = filename;
                }
              }
            });
          }
        });
      }

      for (const [flowId, flowSpecRaw] of Object.entries(sop.flows)) {
        const flowSpec = JSON.parse(JSON.stringify(flowSpecRaw));
        
        if (flowSpec.global_intent_routes) {
          rewriteRoutesToFiles(flowSpec.global_intent_routes);
        }
        if (flowSpec.nodes && Array.isArray(flowSpec.nodes)) {
          flowSpec.nodes.forEach((node: any) => {
            if (node.condition_routes) {
              rewriteRoutesToFiles(node.condition_routes);
            }
            if (node.intent_routes) {
              rewriteRoutesToFiles(node.intent_routes);
            }
          });
        }

        const fileContent: any = {
          flow: {
            id: flowId,
            version: sop.version,
            ...flowSpec
          }
        };

        if (flowId === mainFileKey && exampleJourneys) {
          fileContent.example_journeys = exampleJourneys;
        }

        const filename = flowIdToFilename[flowId];
        files[filename] = YAML.stringify(fileContent);
      }
      
      const projectName = (window as any).EMBEDDED_SOP_NAME || sop.id || 'embedded-sop';
      return {
        projectName,
        projectData: {
          mainFile,
          files
        }
      };
    }
  } catch (err) {
    console.error('Failed to parse embedded SOP:', err);
  }
  return null;
};

function AppContent() {
  const embedded = useMemo(() => {
    if (typeof window !== 'undefined' && (window as any).IS_EMBEDDED_VISUALIZER) {
      return initEmbeddedSop();
    }
    return null;
  }, []);

  const [sops, setSops] = useState<Record<string, SopProject>>(() => {
    if (embedded) {
      const initializedProject = {
        ...embedded.projectData,
        files: initializeSnapshots(embedded.projectData.files)
      };
      return { [embedded.projectName]: initializedProject };
    }
    const localSopName = localStorage.getItem('asop_local_sop_name');
    const localSopDataStr = localStorage.getItem('asop_local_sop_data');
    if (localSopName && localSopDataStr) {
      try {
        const localSopData = JSON.parse(localSopDataStr);
        if (localSopData && localSopData.mainFile && localSopData.files) {
          const initializedProject = {
            ...localSopData,
            files: initializeSnapshots(localSopData.files)
          };
          return { [localSopName]: initializedProject };
        }
      } catch (e) {
        console.error('Failed to parse local storage SOP data during init', e);
      }
    }
    return {};
  });

  const [selectedSop, setSelectedSop] = useState<string>(() => {
    if (embedded) {
      return embedded.projectName;
    }
    return localStorage.getItem('asop_local_sop_name') || '';
  });
  const [activeFlowFile, setActiveFlowFile] = useState<string>(() => {
    if (embedded) {
      return embedded.projectData.mainFile;
    }
    const localSopDataStr = localStorage.getItem('asop_local_sop_data');
    if (localSopDataStr) {
      try {
        const localSopData = JSON.parse(localSopDataStr);
        if (localSopData && localSopData.mainFile) {
          return localSopData.mainFile;
        }
      } catch (e) {}
    }
    return '';
  });
  const [expandedFlow, setExpandedFlow] = useState<string>('');

  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  // File loading inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const loadMenuRef = useRef<HTMLDivElement>(null);

  // Drag and Drop State
  const [isDraggingHeader, setIsDraggingHeader] = useState(false);
  const [isDraggingWelcome, setIsDraggingWelcome] = useState(false);
  const headerDragCounter = useRef(0);
  const welcomeDragCounter = useRef(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (loadMenuRef.current && !loadMenuRef.current.contains(event.target as HTMLElement)) {
        setShowLoadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const format = file.name.endsWith('.zip')
      ? 'zip'
      : file.name.endsWith('.html')
      ? 'visualizer'
      : 'yaml';
    const name = file.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-zA-Z0-9-]/g, "-");
    if ((window as any).IS_EMBEDDED_VISUALIZER) {
      await loadSopFileClientSide(file, name, format);
    } else {
      await uploadSopFile(file, name, format);
    }
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    let folderName = '';
    const filesMap: Record<string, string> = {};
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = file.webkitRelativePath || file.name;
      const parts = relativePath.split('/');
      if (parts.length > 1 && !folderName) {
        folderName = parts[0];
      }
      
      if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
        const text = await file.text();
        filesMap[file.name] = text;
      }
    }
    
    if (!folderName) {
      folderName = 'uploaded-folder';
    }
    const name = folderName.toLowerCase().replace(/[^a-zA-Z0-9-]/g, "-");
    if ((window as any).IS_EMBEDDED_VISUALIZER) {
      await loadSopFolderClientSide(filesMap, name);
    } else {
      await uploadSopFolder(filesMap, name);
    }
  };

  interface DroppedFile {
    file: File;
    relativePath: string;
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setError(null);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    try {
      const entries: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = (items[i] as any).webkitGetAsEntry();
        if (entry) {
          entries.push(entry);
        }
      }

      if (entries.length === 0) return;

      const hasDirectory = entries.some(entry => entry.isDirectory);

      const getFilesFromEntry = async (entry: any, path: string = ''): Promise<DroppedFile[]> => {
        if (entry.isFile) {
          return new Promise((resolve) => {
            entry.file((file: File) => {
              resolve([{ file, relativePath: path + file.name }]);
            }, () => {
              resolve([]);
            });
          });
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const readEntries = (): Promise<any[]> => {
            return new Promise((resolve) => {
              dirReader.readEntries((results: any[]) => resolve(results), () => resolve([]));
            });
          };
          
          const allEntries: any[] = [];
          while (true) {
            const batch = await readEntries();
            if (batch.length === 0) break;
            allEntries.push(...batch);
          }
          
          const filePromises = allEntries.map(e => getFilesFromEntry(e, path + entry.name + '/'));
          const filesArrays = await Promise.all(filePromises);
          return filesArrays.flat();
        }
        return [];
      };

      const filesPromises = entries.map(entry => getFilesFromEntry(entry));
      const filesArrays = await Promise.all(filesPromises);
      const droppedFiles = filesArrays.flat();

      if (droppedFiles.length === 0) return;

      if (!hasDirectory && entries.length === 1) {
        // Single file upload
        const { file } = droppedFiles[0];
        const format = file.name.endsWith('.zip')
          ? 'zip'
          : file.name.endsWith('.html')
          ? 'visualizer'
          : 'yaml';
        const name = file.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-zA-Z0-9-]/g, "-");
        if ((window as any).IS_EMBEDDED_VISUALIZER) {
          await loadSopFileClientSide(file, name, format);
        } else {
          await uploadSopFile(file, name, format);
        }
      } else {
        // Folder/multiple files upload
        let folderName = '';
        const filesMap: Record<string, string> = {};

        for (const { file, relativePath } of droppedFiles) {
          const parts = relativePath.split('/');
          if (parts.length > 1 && !folderName) {
            folderName = parts[0];
          }
          
          if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
            const text = await file.text();
            filesMap[file.name] = text;
          }
        }

        if (!folderName) {
          folderName = 'dropped-folder';
        }
        const name = folderName.toLowerCase().replace(/[^a-zA-Z0-9-]/g, "-");
        if (Object.keys(filesMap).length === 0) {
          setError('No .yml or .yaml files found in the dropped files/folders.');
          return;
        }
        if ((window as any).IS_EMBEDDED_VISUALIZER) {
          await loadSopFolderClientSide(filesMap, name);
        } else {
          await uploadSopFolder(filesMap, name);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during drag and drop import.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleHeaderDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    headerDragCounter.current++;
    if (headerDragCounter.current === 1) {
      setIsDraggingHeader(true);
    }
  };

  const handleHeaderDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    headerDragCounter.current--;
    if (headerDragCounter.current === 0) {
      setIsDraggingHeader(false);
    }
  };

  const handleHeaderDrop = (e: React.DragEvent) => {
    e.preventDefault();
    headerDragCounter.current = 0;
    setIsDraggingHeader(false);
    handleDrop(e);
  };

  const handleWelcomeDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    welcomeDragCounter.current++;
    if (welcomeDragCounter.current === 1) {
      setIsDraggingWelcome(true);
    }
  };

  const handleWelcomeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    welcomeDragCounter.current--;
    if (welcomeDragCounter.current === 0) {
      setIsDraggingWelcome(false);
    }
  };

  const handleWelcomeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    welcomeDragCounter.current = 0;
    setIsDraggingWelcome(false);
    handleDrop(e);
  };

  const uploadSopFile = async (file: File, name: string, format: 'zip' | 'yaml' | 'visualizer') => {
    setError(null);
    try {
      const res = await fetch(`/api/sops/import?name=${encodeURIComponent(name)}&format=${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: file
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to import SOP project.');
      }
      
      const result = await res.json();
      await fetchSops(result.name);
    } catch (err: any) {
      setError(err.message || 'Error occurred during import.');
    }
  };

  const uploadSopFolder = async (filesMap: Record<string, string>, name: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/sops/import?name=${encodeURIComponent(name)}&format=folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: filesMap })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to import SOP folder.');
      }
      
      const result = await res.json();
      await fetchSops(result.name);
    } catch (err: any) {
      setError(err.message || 'Error occurred during folder import.');
    }
  };

  const loadSopFileClientSide = async (file: File, name: string, format: 'zip' | 'yaml' | 'visualizer') => {
    setError(null);
    try {
      let projectData: SopProject;
      if (format === 'yaml') {
        const text = await file.text();
        projectData = parseYamlToSopProject(text, name);
      } else if (format === 'visualizer') {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const scriptEl = doc.getElementById('sop-data');
        if (!scriptEl || !scriptEl.textContent) {
          throw new Error('Invalid HTML Visualizer: Missing embedded SOP data block.');
        }
        let yamlContent = scriptEl.textContent.trim();
        if (scriptEl.getAttribute('data-encoding') === 'base64') {
          yamlContent = atob(yamlContent);
        }
        projectData = parseYamlToSopProject(yamlContent, name);
      } else { // zip
        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        const files: Record<string, string> = {};
        let mainFile = '';
        
        for (const [relativePath, entry] of Object.entries(zip.files)) {
          const parts = relativePath.split('/');
          if (parts.includes('_snapshots')) {
            continue;
          }
          if (!entry.dir && (relativePath.endsWith('.yml') || relativePath.endsWith('.yaml'))) {
            const text = await entry.async('string');
            const filename = relativePath.split('/').pop() || relativePath;
            files[filename] = text;
            if (filename === 'main.yml' || filename.endsWith('-main.yml')) {
              mainFile = filename;
            }
          }
        }
        
        if (Object.keys(files).length === 0) {
          throw new Error('No .yml or .yaml files found in the ZIP archive.');
        }
        if (!mainFile) {
          mainFile = Object.keys(files)[0];
        }
        const initializedFiles = initializeSnapshots(files);
        projectData = { mainFile, files: initializedFiles };
        validateSopProject(projectData);
      }
      
      localStorage.setItem('asop_local_sop_name', name);
      localStorage.setItem('asop_local_sop_data', JSON.stringify(projectData));
      
      setSops(prev => ({ ...prev, [name]: projectData }));
      setSelectedSop(name);
      setActiveFlowFile(projectData.mainFile);
    } catch (err: any) {
      setError(err.message || 'Error occurred during offline import.');
    }
  };

  const loadSopFolderClientSide = async (filesMap: Record<string, string>, name: string) => {
    setError(null);
    try {
      // Filter out files inside _snapshots
      const cleanFiles: Record<string, string> = {};
      Object.entries(filesMap).forEach(([filename, content]) => {
        const parts = filename.split('/');
        if (!parts.includes('_snapshots')) {
          cleanFiles[filename] = content;
        }
      });

      const mainFile = Object.keys(cleanFiles).find(f => f === 'main.yml' || f.endsWith('-main.yml')) || Object.keys(cleanFiles)[0];
      if (!mainFile) {
        throw new Error('No files found.');
      }
      const initializedFiles = initializeSnapshots(cleanFiles);
      const projectData = { mainFile, files: initializedFiles };
      validateSopProject(projectData);
      
      localStorage.setItem('asop_local_sop_name', name);
      localStorage.setItem('asop_local_sop_data', JSON.stringify(projectData));
      
      setSops(prev => ({ ...prev, [name]: projectData }));
      setSelectedSop(name);
      setActiveFlowFile(projectData.mainFile);
    } catch (err: any) {
      setError(err.message || 'Error occurred during offline folder import.');
    }
  };


  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const triggerFolderInput = () => {
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
      folderInputRef.current.click();
    }
  };

  const loadExampleSop = async () => {
    setError(null);
    try {
      const res = await fetch('/api/sops/load-example', { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to load example SOP.');
      }
      const result = await res.json();
      localStorage.removeItem('asop_local_sop_name');
      localStorage.removeItem('asop_local_sop_data');
      await fetchSops(result.name);
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading example SOP.');
    }
  };





  // Export state
  const [exportCategory, setExportCategory] = useState<'sop' | 'agent' | 'reports'>('sop');
  const [sopFormat, setSopFormat] = useState<'zip' | 'yaml' | 'visualizer'>('zip');
  const [agentFormat, setAgentFormat] = useState<'cxas' | 'adk'>('cxas');
  const [reportsFormat, setReportsFormat] = useState<'tools-signatures'>('tools-signatures');
  const [agentMode, setAgentMode] = useState<'fully-agentic' | 'graph-guided' | 'fully-deterministic'>('fully-agentic');
  const [exporting, setExporting] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  // Edit history type
  interface EditHistoryEntry {
    type: 'update_instructions' | 'update_route' | 'update_global_instructions' | 'update_prompt_guard';
    flowFile: string;
    nodeId?: string;
    sourceNodeId?: string;
    routeType?: 'condition' | 'intent' | 'global_intent';
    routeIndex?: number;
    edgeId?: string;
    prevVal: string;
    newVal: string;
  }

  const [past, setPast] = useState<EditHistoryEntry[]>([]);
  const [future, setFuture] = useState<EditHistoryEntry[]>([]);
  const [pendingNodeFocus, setPendingNodeFocus] = useState<{ nodeId: string; select: boolean } | null>(null);
  const [pendingEdgeFocus, setPendingEdgeFocus] = useState<{ edgeId: string } | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<SopNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedNode, setSelectedNode] = useState<Node<SopNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // Inspector section collapsible states
  const [isIncomingExpanded, setIsIncomingExpanded] = useState(false);
  const [isRawExpanded, setIsRawExpanded] = useState(false);
  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({});
  const [isReviewSectionExpanded, setIsReviewSectionExpanded] = useState(true);
  const [isResolvedExpanded, setIsResolvedExpanded] = useState(false);

  // User info and Review Request addition state
  const [userInfo, setUserInfo] = useState<{ email: string } | null>(null);
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [newReviewId, setNewReviewId] = useState('');
  const [newReviewFrom, setNewReviewFrom] = useState('');
  const [newReviewTopic, setNewReviewTopic] = useState<'DESIGN' | 'TECHNICAL'>('DESIGN');
  const [newReviewReason, setNewReviewReason] = useState('');
  const [newReviewError, setNewReviewError] = useState<string | null>(null);
  const [lastFromValue, setLastFromValue] = useState<string>(() => localStorage.getItem('asop_last_from_value') || '');

  // Theme mode state (dark / light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('asop_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('asop_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Inspector panel resizability state
  const [inspectorWidth, setInspectorWidth] = useState(() => {
    return Math.max(320, Math.min(window.innerWidth * 0.25, 600));
  });
  const [isResizing, setIsResizing] = useState(false);

  // Navigator panel resizability state
  const [navigatorWidth, setNavigatorWidth] = useState(() => {
    return Math.max(320, Math.min(window.innerWidth * 0.25, 450));
  });
  const [isResizingNavigator, setIsResizingNavigator] = useState(false);

  // Navigator sections expanded states
  const [isFlowsSectionExpanded, setIsFlowsSectionExpanded] = useState(true);
  const [isGlobalInstructionsExpanded, setIsGlobalInstructionsExpanded] = useState(false);
  const [isPromptGuardExpanded, setIsPromptGuardExpanded] = useState(false);
  const [isInputVariablesExpanded, setIsInputVariablesExpanded] = useState(false);
  const [isExampleJourneysExpanded, setIsExampleJourneysExpanded] = useState(false);
  const [isReviewRequestsExpanded, setIsReviewRequestsExpanded] = useState(false);

  // Keep track of fitView scheduled state
  const [shouldFitView, setShouldFitView] = useState(false);

  // Temporary focus highlight state and ref
  const [tempFocusedNodeId, setTempFocusedNodeId] = useState<string | null>(null);
  const tempFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tempFocusTimeoutRef.current) clearTimeout(tempFocusTimeoutRef.current);
    };
  }, []);

  const { fitView, setCenter, getViewport } = useReactFlow();

  const isElementInViewport = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    const container = document.querySelector('.canvas-container');
    if (!container) return false;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const { x, y, zoom } = getViewport();

    const xStart = rect.x * zoom + x;
    const xEnd = (rect.x + rect.width) * zoom + x;
    const yStart = rect.y * zoom + y;
    const yEnd = (rect.y + rect.height) * zoom + y;

    const centerX = (xStart + xEnd) / 2;
    const centerY = (yStart + yEnd) / 2;

    const padding = 100;
    return (
      centerX >= padding &&
      centerX <= containerWidth - padding &&
      centerY >= padding &&
      centerY <= containerHeight - padding
    );
  }, [getViewport]);

  // Reset expansion states when selection changes
  useEffect(() => {
    setIsIncomingExpanded(false);
    setIsRawExpanded(false);
    setExpandedActions({});
  }, [selectedNode]);

  // Auto-expand review section by default when a node or edge is selected
  useEffect(() => {
    setIsResolvedExpanded(false);
    if (selectedNode || selectedEdge) {
      setIsReviewSectionExpanded(true);
    } else {
      setIsReviewSectionExpanded(false);
    }
  }, [selectedNode, selectedEdge]);

  // Sync expandedFlow with activeFlowFile
  useEffect(() => {
    if (activeFlowFile) {
      setExpandedFlow(activeFlowFile);
    }
  }, [activeFlowFile]);

  const loadFromLocalStorageFallback = useCallback(() => {
    const localSopName = localStorage.getItem('asop_local_sop_name');
    const localSopDataStr = localStorage.getItem('asop_local_sop_data');
    if (localSopName && localSopDataStr) {
      try {
        const localSopData = JSON.parse(localSopDataStr);
        if (localSopData && localSopData.mainFile && localSopData.files) {
          const initializedProject = {
            ...localSopData,
            files: initializeSnapshots(localSopData.files)
          };
          setSops({ [localSopName]: initializedProject });
          setSelectedSop(localSopName);
          setActiveFlowFile(localSopData.mainFile);
          return;
        }
      } catch (e) {
        console.error('Failed to parse local storage fallback', e);
      }
    }
    setSops({});
    setSelectedSop('');
    setActiveFlowFile('');
  }, []);

  // Fetch SOPs from the API
  const fetchSops = useCallback(async (selectNewSopName?: string) => {
    try {
      const res = await fetch('/api/sops');
      if (res.ok) {
        const data = await res.json();
        
        // Initialize snapshots for all backend projects
        const initializedBackendData: Record<string, SopProject> = {};
        Object.entries(data).forEach(([projName, project]: [string, any]) => {
          initializedBackendData[projName] = {
            ...project,
            files: initializeSnapshots(project.files)
          };
        });

        // Merge with local storage SOP if any
        const localSopName = localStorage.getItem('asop_local_sop_name');
        const localSopDataStr = localStorage.getItem('asop_local_sop_data');
        let mergedData = { ...initializedBackendData };
        
        if (localSopName && localSopDataStr) {
          try {
            const localSopData = JSON.parse(localSopDataStr);
            if (localSopData && localSopData.mainFile && localSopData.files) {
              const initializedLocalProject = {
                ...localSopData,
                files: initializeSnapshots(localSopData.files)
              };
              mergedData[localSopName] = initializedLocalProject;
            }
          } catch (e) {
            console.error('Failed to parse local storage SOP data during fetch', e);
          }
        }

        setSops(mergedData);
        if (selectNewSopName && mergedData[selectNewSopName]) {
          setSelectedSop(selectNewSopName);
          const newMain = mergedData[selectNewSopName].mainFile;
          if (newMain) {
            setActiveFlowFile(newMain);
          }
        } else if (Object.keys(mergedData).length > 0) {
          if (!selectedSop || !mergedData[selectedSop]) {
            const firstSop = Object.keys(mergedData)[0];
            setSelectedSop(firstSop);
            const newMain = mergedData[firstSop]?.mainFile || '';
            setActiveFlowFile(newMain);
          }
        } else {
          setSelectedSop('');
          setActiveFlowFile('');
        }
      } else {
        loadFromLocalStorageFallback();
      }
    } catch (err) {
      console.warn('API /api/sops not available.', err);
      loadFromLocalStorageFallback();
    }
  }, [selectedSop, loadFromLocalStorageFallback]);

  useEffect(() => {
    if (!(window as any).IS_EMBEDDED_VISUALIZER) {
      fetchSops();
    }
  }, [fetchSops]);

  useEffect(() => {
    if (!(window as any).IS_EMBEDDED_VISUALIZER) {
      fetch('/api/user')
        .then(r => r.json())
        .then(data => {
          if (data && data.email) {
            setUserInfo({ email: data.email });
          }
        })
        .catch(err => {
          console.warn('Failed to fetch user info', err);
        });
    }
  }, []);

  // Save current SOP to local storage when selectedSop or its files change
  useEffect(() => {
    if (selectedSop && sops[selectedSop]) {
      localStorage.setItem('asop_local_sop_name', selectedSop);
      localStorage.setItem('asop_local_sop_data', JSON.stringify(sops[selectedSop]));
    }
  }, [selectedSop, sops]);



  const handleExport = async () => {
    if (!selectedSop) return;
    setExporting(true);
    setError(null);
    try {
      const currentSopData = sops[selectedSop];
      const finalFormat = exportCategory === 'sop' ? sopFormat : exportCategory === 'agent' ? agentFormat : reportsFormat;

      if ((window as any).IS_EMBEDDED_VISUALIZER) {
        if (!currentSopData) {
          throw new Error('No SOP data loaded.');
        }

        if (finalFormat === 'yaml') {
          const unified = buildUnifiedSop(selectedSop, currentSopData.files);
          const yamlString = YAML.stringify(unified);
          const blob = new Blob([yamlString], { type: 'text/yaml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${selectedSop}.yaml`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (finalFormat === 'zip') {
          const zip = new JSZip();
          Object.entries(currentSopData.files).forEach(([filename, content]) => {
            zip.file(filename, content);
          });
          const blob = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${selectedSop}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (finalFormat === 'visualizer') {
          const unified = buildUnifiedSop(selectedSop, currentSopData.files);
          const yamlString = YAML.stringify(unified);
          const base64Yaml = btoa(unescape(encodeURIComponent(yamlString)));
          let baseHtml = document.documentElement.outerHTML;
          const closeScript = '</' + 'script>';
          if (baseHtml.includes('<script id="sop-data"')) {
            baseHtml = baseHtml.replace(/<script id="sop-data"[^>]*>[\s\S]*?<\/script>/, `<script id="sop-data" type="application/yaml" data-encoding="base64">\n${base64Yaml}\n${closeScript}`);
          } else {
            baseHtml = baseHtml.replace('</body>', `<script id="sop-data" type="application/yaml" data-encoding="base64">\n${base64Yaml}\n${closeScript}\n</body>`);
          }
          const blob = new Blob(['<!DOCTYPE html>\n<html>' + baseHtml + '</html>'], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${selectedSop}_visualizer.html`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (finalFormat === 'tools-signatures') {
          const tools = collectToolsFromSopFiles(currentSopData.files);
          const pdfUint8 = generateToolsReportPdf(selectedSop, tools);
          const blob = new Blob([pdfUint8.buffer as any], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${selectedSop}_tools_signatures_report.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          throw new Error(`Export format ${finalFormat} is not supported in offline visualizer mode.`);
        }
      } else {
        if (currentSopData) {
          const syncRes = await fetch(`/api/sops/import?name=${encodeURIComponent(selectedSop)}&format=folder`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: currentSopData.files })
          });
          if (!syncRes.ok) {
            const errData = await syncRes.json();
            throw new Error(errData.error || 'Failed to sync SOP to server before export.');
          }
        }

        let exportUrl = `/api/sops/${encodeURIComponent(selectedSop)}/export?format=${finalFormat}`;
        if (exportCategory === 'agent' && (finalFormat === 'cxas' || finalFormat === 'adk')) {
          exportUrl += `&mode=${agentMode}`;
        }
        const res = await fetch(exportUrl);
        if (!res.ok) {
          let errorMsg = 'Failed to export SOP.';
          try {
            const errData = await res.json();
            errorMsg = errData.error || errorMsg;
          } catch {
            errorMsg = `Export failed with status ${res.status}`;
          }
          throw new Error(errorMsg);
        }

        const warningsHeader = res.headers.get('X-Export-Warnings');
        if (warningsHeader) {
          try {
            const exportWarnings: string[] = JSON.parse(warningsHeader);
            if (exportWarnings.length > 0) {
              console.warn('Export warnings:', exportWarnings);
              setError(`Export warning:\n${exportWarnings.join('\n')}`);
            }
          } catch {
            // ignore
          }
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filenameHeader = res.headers.get('Content-Disposition');
        let defaultExt = 'zip';
        if (finalFormat === 'yaml') defaultExt = 'yaml';
        else if (finalFormat === 'visualizer') defaultExt = 'html';
        else if (finalFormat === 'tools-signatures') defaultExt = 'pdf';
        let filename = `${selectedSop}_export.${defaultExt}`;
        if (filenameHeader && filenameHeader.includes('filename=')) {
          const match = filenameHeader.match(/filename="?([^";]+)"?/);
          if (match && match[1]) {
            filename = match[1];
          }
        }
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('Failed to export:', err);
      setError(err.message || 'Failed to export SOP.');
    } finally {
      setExporting(false);
    }
  };

  const selectedNodeIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedNodeIdRef.current = selectedNode ? selectedNode.id : null;
  }, [selectedNode]);

  const selectedEdgeIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedEdgeIdRef.current = selectedEdge ? selectedEdge.id : null;
  }, [selectedEdge]);

  const pendingNodeFocusRef = useRef<any>(null);
  useEffect(() => {
    pendingNodeFocusRef.current = pendingNodeFocus;
  }, [pendingNodeFocus]);

  const pendingEdgeFocusRef = useRef<any>(null);
  useEffect(() => {
    pendingEdgeFocusRef.current = pendingEdgeFocus;
  }, [pendingEdgeFocus]);

  const lastLoadedFlowFileRef = useRef<string | null>(null);

  // Load and layout flow spec whenever selected SOP or active flow file changes
  useEffect(() => {
    if (!selectedSop || !activeFlowFile) return;
    try {
      const yamlContent = sops[selectedSop]?.files[activeFlowFile];
      if (!yamlContent) {
        throw new Error(`File ${activeFlowFile} not found in SOP ${selectedSop}`);
      }
      const { nodes: parsedNodes, edges: parsedEdges } = parseAndLayoutFlow(yamlContent);
      
      const currentSelectedNodeId = selectedNodeIdRef.current;
      const currentSelectedEdgeId = selectedEdgeIdRef.current;
      const hasPendingFocus = !!pendingNodeFocusRef.current || !!pendingEdgeFocusRef.current;
      const flowFileChanged = lastLoadedFlowFileRef.current !== activeFlowFile;
      lastLoadedFlowFileRef.current = activeFlowFile;

      let preservedNode: Node<SopNodeData> | null = null;
      let preservedEdge: Edge | null = null;

      if (currentSelectedNodeId) {
        const matchingNode = parsedNodes.find(n => n.id === currentSelectedNodeId);
        if (matchingNode) {
          matchingNode.selected = true;
          preservedNode = matchingNode;
        }
      }

      if (currentSelectedEdgeId) {
        const matchingEdge = parsedEdges.find(e => e.id === currentSelectedEdgeId);
        if (matchingEdge) {
          matchingEdge.selected = true;
          preservedEdge = matchingEdge;
        }
      }

      setNodes(parsedNodes);
      setEdges(parsedEdges);
      
      if (preservedNode || preservedEdge || hasPendingFocus) {
        if (preservedNode) {
          setSelectedNode(preservedNode);
          setSelectedEdge(null);
        } else if (preservedEdge) {
          setSelectedEdge(preservedEdge);
          setSelectedNode(null);
        }
        
        if (flowFileChanged) {
          setShouldFitView(true);
        } else {
          setShouldFitView(false);
        }
      } else {
        setSelectedNode(null);
        setSelectedEdge(null);
        setShouldFitView(true);
      }
      
      Promise.resolve().then(() => {
        setError(null);
      });
    } catch (err: unknown) {
      console.error(err);
      Promise.resolve().then(() => {
        setError(err instanceof Error ? err.message : 'Failed to parse flow specification.');
      });
    }
  }, [selectedSop, activeFlowFile, sops, setNodes, setEdges]);

  // Handler to switch flow files within the current SOP, with optional node focus scheduling
  const handleFlowFileChange = useCallback((filename: string, focusNodeId?: string) => {
    if (!selectedSop) return;
    try {
      setError(null);
      const content = sops[selectedSop]?.files[filename];
      if (!content) {
        throw new Error(`File ${filename} not found in SOP ${selectedSop}`);
      }
      const { nodes: parsedNodes, edges: parsedEdges } = parseAndLayoutFlow(content);
      setNodes(parsedNodes);
      setEdges(parsedEdges);
      setActiveFlowFile(filename);
      setSelectedNode(null);
      setSelectedEdge(null);
      
      if (focusNodeId) {
        setTimeout(() => {
          const node = parsedNodes.find(n => n.id === focusNodeId);
          if (node) {
            setCenter(node.position.x + 140, node.position.y + 60, { zoom: 1.3, duration: 600 });
            setSelectedNode(node);
            setNodes(nds => nds.map(n => ({
              ...n,
              selected: n.id === focusNodeId
            })));
          }
        }, 100);
      } else {
        setShouldFitView(true);
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : `Failed to parse ${filename}`);
    }
  }, [selectedSop, setNodes, setEdges, setCenter]);



  // Parse and cache all flow files in the current SOP for Navigator rendering
  const parsedFlows = useMemo(() => {
    if (!selectedSop || !sops[selectedSop]) return [];
    const sopData = sops[selectedSop];
    return Object.entries(sopData.files)
      .filter(([filename]) => !filename.startsWith('_snapshots/'))
      .map(([filename, content]) => {
      try {
        const parsed = YAML.parse(content);
        const flow = parsed?.flow || {};
        const nodes = flow.nodes || [];
        const rootNodeId = flow.root_node_id;
        
        const nodeInfos = nodes.map((n: { id: string; actions?: unknown[] }) => ({
          id: n.id,
          isRoot: n.id === rootNodeId,
          type: (n.actions && n.actions.length > 0) ? 'action' : 'default'
        }));
        
        if (flow.global_intent_routes && flow.global_intent_routes.length > 0) {
          nodeInfos.unshift({
            id: 'GLOBAL_SCOPE',
            isRoot: false,
            type: 'global_scope'
          });
        }
        
        return {
          filename,
          flowId: flow.id || filename,
          nodes: nodeInfos,
          content,
          globalInstructions: flow.global_instructions || '',
          promptGuard: flow.prompt_guard || '',
          inputVariables: flow.input_variables || []
        };
      } catch (err) {
        console.error(`Failed to parse ${filename}:`, err);
        return {
          filename,
          flowId: filename,
          nodes: [],
          content,
          globalInstructions: '',
          promptGuard: '',
          sessionVariables: []
        };
      }
    }).sort((a, b) => {
      const isAMain = a.filename === sopData.mainFile;
      const isBMain = b.filename === sopData.mainFile;
      if (isAMain) return -1;
      if (isBMain) return 1;
      return a.filename.localeCompare(b.filename);
    });
  }, [selectedSop, sops]);

  // Memoized main and current flow info for global instructions
  const mainFlowInfo = useMemo(() => {
    if (!selectedSop || !sops[selectedSop]) return null;
    const mainFile = sops[selectedSop].mainFile;
    return parsedFlows.find(f => f.filename === mainFile) || null;
  }, [parsedFlows, selectedSop, sops]);

  const currentFlowInfo = useMemo(() => {
    return parsedFlows.find(f => f.filename === activeFlowFile) || null;
  }, [parsedFlows, activeFlowFile]);

  // Fit graph view after nodes are loaded/changed initially
  useEffect(() => {
    if (shouldFitView && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.15, duration: 400 });
        setShouldFitView(false);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [shouldFitView, nodes, fitView]);

  // Resize handler logic
  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - mouseMoveEvent.clientX;
      if (newWidth > 280 && newWidth < window.innerWidth * 0.7) {
        setInspectorWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Resize handler logic for SOP Navigator
  const startResizingNavigator = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizingNavigator(true);
  }, []);

  const stopResizingNavigator = useCallback(() => {
    setIsResizingNavigator(false);
  }, []);

  const resizeNavigator = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizingNavigator) {
      const newWidth = mouseMoveEvent.clientX;
      if (newWidth > 200 && newWidth < window.innerWidth * 0.6) {
        setNavigatorWidth(newWidth);
      }
    }
  }, [isResizingNavigator]);

  useEffect(() => {
    if (isResizingNavigator) {
      window.addEventListener('mousemove', resizeNavigator);
      window.addEventListener('mouseup', stopResizingNavigator);
    }
    return () => {
      window.removeEventListener('mousemove', resizeNavigator);
      window.removeEventListener('mouseup', stopResizingNavigator);
    };
  }, [isResizingNavigator, resizeNavigator, stopResizingNavigator]);

  // Compute faded states for nodes and edges
  const highlightedNodeIds = useMemo(() => {
    if (selectedNode) {
      const ids = new Set<string>();
      ids.add(selectedNode.id);
      
      // Add target nodes of outgoing edges
      edges.forEach(e => {
        if (e.source === selectedNode.id) {
          ids.add(e.target);
        }
      });
      return ids;
    }
    
    if (selectedEdge) {
      const ids = new Set<string>();
      ids.add(selectedEdge.source);
      ids.add(selectedEdge.target);
      return ids;
    }
    
    return null;
  }, [selectedNode, selectedEdge, edges]);

  const memoizedNodes = useMemo(() => {
    return nodes.map(n => {
      const isHighlighted = !highlightedNodeIds || highlightedNodeIds.has(n.id) || n.id === tempFocusedNodeId;
      const isTempFocused = n.id === tempFocusedNodeId;
      
      let extraClass = '';
      if (isTempFocused) {
        extraClass = 'temp-focused-highlight';
      } else if (!isHighlighted) {
        extraClass = 'faded';
      }
      
      const nodeWithCallback = {
        ...n,
        className: `${n.className || ''} ${extraClass}`.trim()
      };

      if (nodeWithCallback.data?.type === 'sub_flow') {
        nodeWithCallback.data = {
          ...nodeWithCallback.data,
          onOpenFlow: handleFlowFileChange
        };
      }
      
      return nodeWithCallback;
    });
  }, [nodes, highlightedNodeIds, tempFocusedNodeId, handleFlowFileChange]);

  const memoizedEdges = useMemo(() => {
    if (selectedNode) {
      return edges.map(e => ({
        ...e,
        className: `${e.className || ''} ${e.source === selectedNode.id ? '' : 'faded'}`.trim()
      }));
    }
    if (selectedEdge) {
      return edges.map(e => ({
        ...e,
        className: `${e.className || ''} ${e.id === selectedEdge.id ? '' : 'faded'}`.trim()
      }));
    }
    return edges;
  }, [edges, selectedNode, selectedEdge]);

  // Memoize custom node types
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

  // Handle selection changes (nodes and edges)
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    if (params.nodes.length > 0) {
      const match = nodes.find(n => n.id === params.nodes[0].id);
      setSelectedNode(match || (params.nodes[0] as Node<SopNodeData>));
      setSelectedEdge(null);
      setShowExportPanel(false);
    } else if (params.edges.length > 0) {
      const match = edges.find(e => e.id === params.edges[0].id);
      setSelectedEdge(match || params.edges[0]);
      setSelectedNode(null);
      setShowExportPanel(false);
    } else {
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  }, [nodes, edges]);

  // Focus on a node (center and zoom) on demand, optionally selecting it
  const handleFocusNode = useCallback((nodeId: string, select = true, onlyPanIfNotVisible = false) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const rect = {
        x: node.position.x,
        y: node.position.y,
        width: node.width || 280,
        height: node.height || 180
      };

      const shouldPan = !onlyPanIfNotVisible || !isElementInViewport(rect);
      if (shouldPan) {
        if (onlyPanIfNotVisible) {
          fitView({ padding: 0.15, duration: 400 });
        } else {
          // Add standard offset to center the node card
          setCenter(node.position.x + 140, node.position.y + 60, { zoom: 1.3, duration: 600 });
        }
      }
      
      if (select) {
        setSelectedNode(node);
        setSelectedEdge(null);
        setTempFocusedNodeId(null);
        if (tempFocusTimeoutRef.current) clearTimeout(tempFocusTimeoutRef.current);
        
        // Select the node in React Flow
        setNodes(nds => nds.map(n => ({
          ...n,
          selected: n.id === nodeId
        })));
      } else {
        // Temporarily highlight the node
        setTempFocusedNodeId(nodeId);
        if (tempFocusTimeoutRef.current) clearTimeout(tempFocusTimeoutRef.current);
        tempFocusTimeoutRef.current = setTimeout(() => {
          setTempFocusedNodeId(null);
        }, 2000);
      }
    }
  }, [nodes, setCenter, setNodes, isElementInViewport, fitView]);

  // Focus pending node once nodes are rendered and laid out
  useEffect(() => {
    if (pendingNodeFocus) {
      const node = nodes.find(n => n.id === pendingNodeFocus.nodeId);
      if (node) {
        handleFocusNode(pendingNodeFocus.nodeId, pendingNodeFocus.select, true);
        setPendingNodeFocus(null);
      }
    }
  }, [nodes, pendingNodeFocus, handleFocusNode]);

  // Focus and select an edge programmatically (centering the view on it)
  const handleSelectEdge = useCallback((edgeId: string, onlyPanIfNotVisible = false) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    setSelectedEdge(edge);
    setSelectedNode(null);

    // Update selected states in React Flow elements
    setEdges(eds => eds.map(e => ({
      ...e,
      selected: e.id === edgeId
    })));
    setNodes(nds => nds.map(n => ({
      ...n,
      selected: false
    })));

    // Focus / center the view on the edge midpoint
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (sourceNode && targetNode) {
      const midX = (sourceNode.position.x + targetNode.position.x) / 2 + 140;
      const midY = (sourceNode.position.y + targetNode.position.y) / 2 + 60;

      const rect = {
        x: midX - 100,
        y: midY - 40,
        width: 200,
        height: 80
      };

      const shouldPan = !onlyPanIfNotVisible || !isElementInViewport(rect);
      if (shouldPan) {
        if (onlyPanIfNotVisible) {
          fitView({ padding: 0.15, duration: 400 });
        } else {
          setCenter(midX, midY, { zoom: 1.3, duration: 600 });
        }
      }
    }
  }, [edges, nodes, setEdges, setNodes, setCenter, isElementInViewport, fitView]);

  // Focus pending edge once edges are rendered and laid out
  useEffect(() => {
    if (pendingEdgeFocus) {
      const edge = edges.find(e => e.id === pendingEdgeFocus.edgeId);
      if (edge) {
        handleSelectEdge(pendingEdgeFocus.edgeId, true);
        setPendingEdgeFocus(null);
      }
    }
  }, [edges, pendingEdgeFocus, handleSelectEdge]);

  // Reset history on SOP changes
  useEffect(() => {
    setPast([]);
    setFuture([]);
  }, [selectedSop]);

  const toggleActionExpanded = useCallback((actionKey: string) => {
    setExpandedActions(prev => ({
      ...prev,
      [actionKey]: !prev[actionKey]
    }));
  }, []);

  // Parse and aggregate example journeys from all flow files in the current SOP
  const exampleJourneys = useMemo(() => {
    if (!selectedSop || !sops[selectedSop]) return [];
    const sopData = sops[selectedSop];
    let journeys: any[] = [];
    
    const filenameMap: Record<string, string> = {};
    Object.keys(sopData.files)
      .filter(filename => !filename.startsWith('_snapshots/'))
      .forEach(filename => {
        filenameMap[filename] = filename;
        const base = filename.replace(/\.[^/.]+$/, "");
        filenameMap[base] = filename;
      });

    Object.entries(sopData.files)
      .filter(([filename]) => !filename.startsWith('_snapshots/'))
      .forEach(([filename, content]) => {
      try {
        const parsed = YAML.parse(content);
        if (parsed) {
          const fileJourneys = parsed.example_journeys || parsed.flow?.example_journeys;
          if (Array.isArray(fileJourneys)) {
            const mappedJourneys = fileJourneys.map((journey: any) => {
              const steps = Array.isArray(journey.steps)
                ? journey.steps.map((step: any) => {
                    let flowFile = step.current_flow || '';
                    if (flowFile) {
                      if (filenameMap[flowFile]) {
                        flowFile = filenameMap[flowFile];
                      } else if (filenameMap[flowFile.replace(/\.[^/.]+$/, "")]) {
                        flowFile = filenameMap[flowFile.replace(/\.[^/.]+$/, "")];
                      }
                    }
                    return {
                      ...step,
                      current_flow: flowFile
                    };
                  })
                : [];
              return {
                ...journey,
                steps
              };
            });
            journeys = journeys.concat(mappedJourneys);
          }
        }
      } catch (err) {
        console.error(`Failed to parse journeys from ${filename}:`, err);
      }
    });
    return journeys;
  }, [selectedSop, sops]);

  // Parse and aggregate all unresolved review requests across all flow files in the SOP
  const unresolvedReviewRequests = useMemo(() => {
    if (!selectedSop || !sops[selectedSop]) return [];
    const sopData = sops[selectedSop];
    const results: Array<{
      id: string;
      date: string;
      topic: 'TECHNICAL' | 'DESIGN';
      from?: string;
      reason: string;
      flowFile: string;
      nodeId: string;
      nodeLabel: string;
      context: string;
    }> = [];

    Object.entries(sopData.files)
      .filter(([filename]) => !filename.startsWith('_snapshots/'))
      .forEach(([filename, content]) => {
        try {
          const parsed = YAML.parse(content);
          const flow = parsed?.flow || {};
          const nodes = flow.nodes || [];
          
          nodes.forEach((n: any) => {
            if (!n || !n.id) return;
            const nodeLabel = n.id;
            
            // Node-level review requests
            if (Array.isArray(n.review_requests)) {
              n.review_requests.forEach((r: any) => {
                if (r && !r.resolved) {
                  results.push({
                    ...r,
                    flowFile: filename,
                    nodeId: n.id,
                    nodeLabel,
                    context: 'Node'
                  });
                }
              });
            }

            // Actions review requests
            if (Array.isArray(n.actions)) {
              n.actions.forEach((act: any) => {
                if (act && Array.isArray(act.review_requests)) {
                  act.review_requests.forEach((r: any) => {
                    if (r && !r.resolved) {
                      results.push({
                        ...r,
                        flowFile: filename,
                        nodeId: n.id,
                        nodeLabel,
                        context: `Action: ${act.tool_name || 'unnamed'}`
                      });
                    }
                  });
                }
              });
            }

            // Condition routes review requests
            if (Array.isArray(n.condition_routes)) {
              n.condition_routes.forEach((route: any) => {
                if (route && Array.isArray(route.review_requests)) {
                  route.review_requests.forEach((r: any) => {
                    if (r && !r.resolved) {
                      results.push({
                        ...r,
                        flowFile: filename,
                        nodeId: n.id,
                        nodeLabel,
                        context: `Condition: ${route.condition || 'true'} -> ${route.target_node || 'unknown'}`
                      });
                    }
                  });
                }
              });
            }

            // Intent routes review requests
            if (Array.isArray(n.intent_routes)) {
              n.intent_routes.forEach((route: any) => {
                if (route && Array.isArray(route.review_requests)) {
                  route.review_requests.forEach((r: any) => {
                    if (r && !r.resolved) {
                      results.push({
                        ...r,
                        flowFile: filename,
                        nodeId: n.id,
                        nodeLabel,
                        context: `Intent: ${route.intent || 'unknown'} -> ${route.target_node || 'unknown'}`
                      });
                    }
                  });
                }
              });
            }
          });

          // Global intent routes review requests
          if (Array.isArray(flow.global_intent_routes)) {
            flow.global_intent_routes.forEach((route: any) => {
              if (route && Array.isArray(route.review_requests)) {
                route.review_requests.forEach((r: any) => {
                  if (r && !r.resolved) {
                    results.push({
                      ...r,
                      flowFile: filename,
                      nodeId: 'GLOBAL_SCOPE',
                      nodeLabel: 'Global Scope',
                      context: `Global Intent: ${route.intent || 'unknown'}`
                    });
                  }
                });
              }
            });
          }
        } catch (err) {
          console.error(`Failed to parse review requests from ${filename}:`, err);
        }
      });

    return results;
  }, [selectedSop, sops]);

  // Click on a review request to focus and select its relevant node
  const handleSelectReviewRequest = useCallback((flowFile: string, nodeId: string) => {
    if (activeFlowFile !== flowFile) {
      handleFlowFileChange(flowFile, nodeId);
    } else {
      handleFocusNode(nodeId, true);
    }
  }, [activeFlowFile, handleFlowFileChange, handleFocusNode]);

  // Player state
  const [activeJourney, setActiveJourney] = useState<any | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Reset player when SOP changes
  useEffect(() => {
    setActiveJourney(null);
    setCurrentStepIndex(0);
  }, [selectedSop]);

  // Navigate through steps
  const goToJourneyStep = useCallback((journey: any, index: number) => {
    if (!journey || !journey.steps || index < 0 || index >= journey.steps.length) return;
    const step = journey.steps[index];
    setCurrentStepIndex(index);

    if (step.current_flow && step.current_flow !== activeFlowFile) {
      handleFlowFileChange(step.current_flow, step.current_node);
    } else if (step.current_node) {
      handleFocusNode(step.current_node);
    }
  }, [activeFlowFile, handleFlowFileChange, handleFocusNode]);

  const startJourney = (journey: any) => {
    setActiveJourney(journey);
    setCurrentStepIndex(0);
    if (journey.steps && journey.steps.length > 0) {
      goToJourneyStep(journey, 0);
    }
  };

  const endJourney = () => {
    setActiveJourney(null);
    setCurrentStepIndex(0);
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const handleCloseSop = () => {
    setShowCloseConfirm(true);
  };

  const handleConfirmCloseSop = async () => {
    if (!(window as any).IS_EMBEDDED_VISUALIZER) {
      try {
        const res = await fetch('/api/sops/clear', { method: 'POST' });
        if (!res.ok) {
          console.warn('Server clear endpoint failed, proceeding with local clear.', await res.text());
        }
      } catch (err) {
        console.warn('Failed to call clear server state endpoint. Maybe server is offline.', err);
      }
    }

    localStorage.removeItem('asop_local_sop_name');
    localStorage.removeItem('asop_local_sop_data');

    setShowHistoryPanel(false);
    setShowExportPanel(false);
    setPast([]);
    setFuture([]);

    if ((window as any).IS_EMBEDDED_VISUALIZER && embedded) {
      setSops({ [embedded.projectName]: embedded.projectData });
      setSelectedSop(embedded.projectName);
      setActiveFlowFile(embedded.projectData.mainFile);
    } else {
      setSops({});
      setSelectedSop('');
      setActiveFlowFile('');
      setNodes([]);
      setEdges([]);
    }
    setSelectedNode(null);
    setSelectedEdge(null);
    endJourney();
    setError(null);
    setShowCloseConfirm(false);
  };

  const handleUpdateNodeInstructions = useCallback((nodeId: string, newInstructions: string) => {
    if (!selectedSop || !activeFlowFile) return;
    const currentSop = sops[selectedSop];
    if (!currentSop) return;

    const prevYaml = currentSop.files[activeFlowFile];
    if (!prevYaml) return;

    // Extract old instructions to store in history
    let oldInstructions = '';
    try {
      const parsed = YAML.parse(prevYaml);
      const flowNodes = parsed?.flow?.nodes || [];
      const node = flowNodes.find((n: any) => n.id === nodeId);
      oldInstructions = node?.agent_instructions || '';
    } catch (e) {
      console.error('Failed to parse previous YAML for old instructions', e);
    }

    if (oldInstructions.trim() === newInstructions.trim()) return;

    // Generate new YAML using AST helper
    const newYaml = updateNodeInstructionsInYaml(prevYaml, nodeId, newInstructions);

    // Record in history
    const historyEntry: EditHistoryEntry = {
      type: 'update_instructions',
      flowFile: activeFlowFile,
      nodeId,
      prevVal: oldInstructions,
      newVal: newInstructions
    };

    setPast(prev => [...prev, historyEntry]);
    setFuture([]); // Clear redo history on new edit

    // Update files state
    const updatedFiles = {
      ...currentSop.files,
      [activeFlowFile]: newYaml
    };

    const updatedSop = {
      ...currentSop,
      files: updatedFiles
    };

    // Persist in local storage and state
    localStorage.setItem('asop_local_sop_data', JSON.stringify(updatedSop));
    setSops(prev => ({
      ...prev,
      [selectedSop]: updatedSop
    }));

    // Update selectedNode state so instructions update in UI instantly
    setSelectedNode(prev => {
      if (prev && prev.id === nodeId) {
        return {
          ...prev,
          data: {
            ...prev.data,
            agent_instructions: newInstructions
          }
        };
      }
      return prev;
    });
  }, [selectedSop, activeFlowFile, sops]);

  const handleUpdateGlobalInstructions = useCallback((filename: string, newInstructions: string) => {
    if (!selectedSop || !filename) return;
    const currentSop = sops[selectedSop];
    if (!currentSop) return;

    const prevYaml = currentSop.files[filename];
    if (!prevYaml) return;

    // Extract old instructions to store in history
    let oldInstructions = '';
    try {
      const parsed = YAML.parse(prevYaml);
      oldInstructions = parsed?.flow?.global_instructions || '';
    } catch (e) {
      console.error('Failed to parse previous YAML for old global instructions', e);
    }

    if (oldInstructions.trim() === newInstructions.trim()) return;

    // Generate new YAML using AST helper
    const newYaml = updateGlobalInstructionsInYaml(prevYaml, newInstructions);

    // Record in history
    const historyEntry: EditHistoryEntry = {
      type: 'update_global_instructions',
      flowFile: filename,
      prevVal: oldInstructions,
      newVal: newInstructions
    };

    setPast(prev => [...prev, historyEntry]);
    setFuture([]); // Clear redo history on new edit

    // Update files state
    const updatedFiles = {
      ...currentSop.files,
      [filename]: newYaml
    };
    const updatedSop = {
      ...currentSop,
      files: updatedFiles
    };

    // Persist in local storage and state
    localStorage.setItem('asop_local_sop_data', JSON.stringify(updatedSop));
    setSops(prev => ({
      ...prev,
      [selectedSop]: updatedSop
    }));
  }, [selectedSop, sops]);

  const handleUpdatePromptGuard = useCallback((filename: string, newPromptGuard: string) => {
    if (!selectedSop || !filename) return;
    const currentSop = sops[selectedSop];
    if (!currentSop) return;

    const prevYaml = currentSop.files[filename];
    if (!prevYaml) return;

    let oldPromptGuard = '';
    try {
      const parsed = YAML.parse(prevYaml);
      oldPromptGuard = parsed?.flow?.prompt_guard || '';
    } catch (e) {
      console.error('Failed to parse previous YAML for old prompt guard', e);
    }

    if (oldPromptGuard.trim() === newPromptGuard.trim()) return;

    const newYaml = updatePromptGuardInYaml(prevYaml, newPromptGuard);

    const historyEntry: EditHistoryEntry = {
      type: 'update_prompt_guard',
      flowFile: filename,
      prevVal: oldPromptGuard,
      newVal: newPromptGuard
    };

    setPast(prev => [...prev, historyEntry]);
    setFuture([]);

    const updatedFiles = {
      ...currentSop.files,
      [filename]: newYaml
    };
    const updatedSop = {
      ...currentSop,
      files: updatedFiles
    };

    localStorage.setItem('asop_local_sop_data', JSON.stringify(updatedSop));
    setSops(prev => ({
      ...prev,
      [selectedSop]: updatedSop
    }));
  }, [selectedSop, sops]);

  const handleUpdateRouteValue = useCallback((edge: Edge, newValue: string) => {
    if (!selectedSop || !activeFlowFile) return;
    const currentSop = sops[selectedSop];
    if (!currentSop) return;

    const prevYaml = currentSop.files[activeFlowFile];
    if (!prevYaml) return;

    const edgeData = edge.data as any;
    const routeIndex = edgeData?.routeIndex;
    const routeType = edgeData?.type;

    if (routeIndex === undefined || !routeType) {
      console.error('Edge missing routeIndex or type in data', edge);
      return;
    }

    const sourceNodeId = edge.source;
    const oldVal = edgeData?.fullLabel || '';

    if (oldVal.trim() === newValue.trim()) return;

    // Generate new YAML using updateRouteInYaml AST helper
    const newYaml = updateRouteInYaml(prevYaml, sourceNodeId, routeType, routeIndex, newValue);

    // Record in history
    const historyEntry: EditHistoryEntry = {
      type: 'update_route',
      flowFile: activeFlowFile,
      sourceNodeId,
      routeType,
      routeIndex,
      edgeId: edge.id,
      prevVal: oldVal,
      newVal: newValue
    };

    setPast(prev => [...prev, historyEntry]);
    setFuture([]); // Clear redo history

    // Update files state
    const updatedFiles = {
      ...currentSop.files,
      [activeFlowFile]: newYaml
    };

    const updatedSop = {
      ...currentSop,
      files: updatedFiles
    };

    // Persist in local storage and state
    localStorage.setItem('asop_local_sop_data', JSON.stringify(updatedSop));
    setSops(prev => ({
      ...prev,
      [selectedSop]: updatedSop
    }));

    // Update selectedEdge state so route label updates in UI instantly
    setSelectedEdge(prev => {
      if (prev && prev.id === edge.id) {
        return {
          ...prev,
          data: {
            ...prev.data,
            fullLabel: newValue
          }
        };
      }
      return prev;
    });
  }, [selectedSop, activeFlowFile, sops]);

  const generateUniqueReviewRequestId = useCallback((sopsData: Record<string, SopProject>, selectedSopName: string): string => {
    const currentSop = sopsData[selectedSopName];
    if (!currentSop) return 'req-001';

    const ids = new Set<string>();
    const idRegex = /\bid:\s*['"]?(req-\d+)['"]?/g;

    for (const [filename, content] of Object.entries(currentSop.files)) {
      if (filename.startsWith('_snapshots/')) continue;
      let match;
      idRegex.lastIndex = 0;
      while ((match = idRegex.exec(content)) !== null) {
        ids.add(match[1]);
      }
    }

    let maxNum = 0;
    for (const id of ids) {
      const match = id.match(/^req-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `req-${padded}`;
  }, []);

  const isReviewRequestIdUnique = useCallback((sopsData: Record<string, SopProject>, selectedSopName: string, idToTest: string): boolean => {
    const currentSop = sopsData[selectedSopName];
    if (!currentSop) return true;

    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const idRegex = new RegExp(`\\bid:\\s*['"]?${escapeRegExp(idToTest)}['"]?\\b`);
    
    for (const [filename, content] of Object.entries(currentSop.files)) {
      if (filename.startsWith('_snapshots/')) continue;
      if (idRegex.test(content)) {
        return false;
      }
    }
    return true;
  }, []);

  const handleAddNodeReviewRequest = useCallback((nodeId: string, newRequest: ReviewRequest) => {
    if (!selectedSop || !activeFlowFile) return;
    const currentSop = sops[selectedSop];
    if (!currentSop) return;

    const prevYaml = currentSop.files[activeFlowFile];
    if (!prevYaml) return;

    const newYaml = addReviewRequestToNodeInYaml(prevYaml, nodeId, newRequest);

    const updatedFiles = {
      ...currentSop.files,
      [activeFlowFile]: newYaml
    };

    const updatedSop = {
      ...currentSop,
      files: updatedFiles
    };

    localStorage.setItem('asop_local_sop_data', JSON.stringify(updatedSop));
    setSops(prev => ({
      ...prev,
      [selectedSop]: updatedSop
    }));

    setSelectedNode(prev => {
      if (prev && prev.id === nodeId) {
        return {
          ...prev,
          data: {
            ...prev.data,
            review_requests: [...(prev.data.review_requests || []), newRequest]
          }
        };
      }
      return prev;
    });
  }, [selectedSop, activeFlowFile, sops]);

  const handleAddRouteReviewRequest = useCallback((edge: Edge, newRequest: ReviewRequest) => {
    if (!selectedSop || !activeFlowFile) return;
    const currentSop = sops[selectedSop];
    if (!currentSop) return;

    const prevYaml = currentSop.files[activeFlowFile];
    if (!prevYaml) return;

    const edgeData = edge.data as any;
    const routeIndex = edgeData?.routeIndex;
    const routeType = edgeData?.type;

    if (routeIndex === undefined || !routeType) {
      console.error('Edge missing routeIndex or type in data', edge);
      return;
    }

    const sourceNodeId = edge.source;
    const newYaml = addReviewRequestToRouteInYaml(prevYaml, sourceNodeId, routeType, routeIndex, newRequest);

    const updatedFiles = {
      ...currentSop.files,
      [activeFlowFile]: newYaml
    };

    const updatedSop = {
      ...currentSop,
      files: updatedFiles
    };

    localStorage.setItem('asop_local_sop_data', JSON.stringify(updatedSop));
    setSops(prev => ({
      ...prev,
      [selectedSop]: updatedSop
    }));

    setSelectedEdge(prev => {
      if (prev && prev.id === edge.id) {
        return {
          ...prev,
          data: {
            ...prev.data,
            review_requests: [...((prev.data as any)?.review_requests || []), newRequest]
          }
        };
      }
      return prev;
    });
  }, [selectedSop, activeFlowFile, sops]);

  const handleResolveReviewRequest = useCallback((reviewId: string, resolved = true) => {
    if (!selectedSop) return;
    const currentSop = sops[selectedSop];
    if (!currentSop) return;

    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const idRegex = new RegExp(`\\bid:\\s*['"]?${escapeRegExp(reviewId)}['"]?\\b`);

    let foundFile: string | null = null;
    let originalYaml: string | null = null;

    for (const [filename, content] of Object.entries(currentSop.files)) {
      if (filename.startsWith('_snapshots/')) continue;
      if (idRegex.test(content)) {
        foundFile = filename;
        originalYaml = content;
        break;
      }
    }

    if (!foundFile || !originalYaml) {
      console.error(`Could not find file containing review request ${reviewId}`);
      return;
    }

    const newYaml = resolveReviewRequestInYaml(originalYaml, reviewId, resolved);

    const updatedFiles = {
      ...currentSop.files,
      [foundFile]: newYaml
    };

    const updatedSop = {
      ...currentSop,
      files: updatedFiles
    };

    localStorage.setItem('asop_local_sop_data', JSON.stringify(updatedSop));
    setSops(prev => ({
      ...prev,
      [selectedSop]: updatedSop
    }));
  }, [selectedSop, sops]);

  const handleConfirmDeleteReview = useCallback((reviewId: string) => {
    if (!selectedSop) return;
    const currentSop = sops[selectedSop];
    if (!currentSop) return;

    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const idRegex = new RegExp(`\\bid:\\s*['"]?${escapeRegExp(reviewId)}['"]?\\b`);

    let foundFile: string | null = null;
    let originalYaml: string | null = null;

    for (const [filename, content] of Object.entries(currentSop.files)) {
      if (filename.startsWith('_snapshots/')) continue;
      if (idRegex.test(content)) {
        foundFile = filename;
        originalYaml = content;
        break;
      }
    }

    if (!foundFile || !originalYaml) {
      console.error(`Could not find file containing review request ${reviewId}`);
      return;
    }

    const newYaml = deleteReviewRequestInYaml(originalYaml, reviewId);

    const updatedFiles = {
      ...currentSop.files,
      [foundFile]: newYaml
    };

    const updatedSop = {
      ...currentSop,
      files: updatedFiles
    };

    localStorage.setItem('asop_local_sop_data', JSON.stringify(updatedSop));
    setSops(prev => ({
      ...prev,
      [selectedSop]: updatedSop
    }));
  }, [selectedSop, sops]);


  const handleStartAddReview = useCallback(() => {
    if (!selectedSop) return;
    const nextId = generateUniqueReviewRequestId(sops, selectedSop);
    setNewReviewId(nextId);
    setNewReviewFrom(lastFromValue || userInfo?.email || '');
    setNewReviewTopic('DESIGN');
    setNewReviewReason('');
    setNewReviewError(null);
    setIsAddingReview(true);
  }, [selectedSop, sops, lastFromValue, userInfo, generateUniqueReviewRequestId]);

  useEffect(() => {
    setIsAddingReview(false);
  }, [selectedNode?.id, selectedEdge?.id]);

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const entry = past[past.length - 1];
    setPast(prev => prev.slice(0, -1));
    setFuture(prev => [...prev, entry]);

    if (!selectedSop) return;
    const currentSop = sops[selectedSop];
    if (!currentSop) return;

    const yaml = currentSop.files[entry.flowFile];
    if (yaml) {
      let revertedYaml = yaml;
      if (entry.type === 'update_instructions') {
        revertedYaml = updateNodeInstructionsInYaml(yaml, entry.nodeId!, entry.prevVal);
      } else if (entry.type === 'update_route') {
        revertedYaml = updateRouteInYaml(yaml, entry.sourceNodeId!, entry.routeType!, entry.routeIndex!, entry.prevVal);
      } else if (entry.type === 'update_global_instructions') {
        revertedYaml = updateGlobalInstructionsInYaml(yaml, entry.prevVal);
      } else if (entry.type === 'update_prompt_guard') {
        revertedYaml = updatePromptGuardInYaml(yaml, entry.prevVal);
      }

      const updatedFiles = {
        ...currentSop.files,
        [entry.flowFile]: revertedYaml
      };
      const updatedSop = {
        ...currentSop,
        files: updatedFiles
      };
      localStorage.setItem('asop_local_sop_data', JSON.stringify(updatedSop));
      setSops(prev => ({
        ...prev,
        [selectedSop]: updatedSop
      }));

      // Update selection states if they are currently active
      if (entry.type === 'update_instructions') {
        setSelectedNode(prev => {
          if (prev && prev.id === entry.nodeId) {
            return {
              ...prev,
              data: {
                ...prev.data,
                agent_instructions: entry.prevVal
              }
            };
          }
          return prev;
        });
      } else if (entry.type === 'update_route') {
        setSelectedEdge(prev => {
          if (prev && prev.id === entry.edgeId) {
            return {
              ...prev,
              data: {
                ...prev.data,
                fullLabel: entry.prevVal
              }
            };
          }
          return prev;
        });
      } else if (entry.type === 'update_global_instructions') {
        setIsGlobalInstructionsExpanded(true);
      } else if (entry.type === 'update_prompt_guard') {
        setIsPromptGuardExpanded(true);
      }
    }

    // Move view to the node or edge
    if (activeFlowFile !== entry.flowFile) {
      setActiveFlowFile(entry.flowFile);
    }
    
    if (entry.type === 'update_instructions') {
      setPendingNodeFocus({ nodeId: entry.nodeId!, select: true });
    } else if (entry.type === 'update_route') {
      setPendingEdgeFocus({ edgeId: entry.edgeId! });
    }
  }, [past, selectedSop, sops, activeFlowFile]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const entry = future[future.length - 1];
    setFuture(prev => prev.slice(0, -1));
    setPast(prev => [...prev, entry]);

    if (!selectedSop) return;
    const currentSop = sops[selectedSop];
    if (!currentSop) return;

    const yaml = currentSop.files[entry.flowFile];
    if (yaml) {
      let redoneYaml = yaml;
      if (entry.type === 'update_instructions') {
        redoneYaml = updateNodeInstructionsInYaml(yaml, entry.nodeId!, entry.newVal);
      } else if (entry.type === 'update_route') {
        redoneYaml = updateRouteInYaml(yaml, entry.sourceNodeId!, entry.routeType!, entry.routeIndex!, entry.newVal);
      } else if (entry.type === 'update_global_instructions') {
        redoneYaml = updateGlobalInstructionsInYaml(yaml, entry.newVal);
      } else if (entry.type === 'update_prompt_guard') {
        redoneYaml = updatePromptGuardInYaml(yaml, entry.newVal);
      }

      const updatedFiles = {
        ...currentSop.files,
        [entry.flowFile]: redoneYaml
      };
      const updatedSop = {
        ...currentSop,
        files: updatedFiles
      };
      localStorage.setItem('asop_local_sop_data', JSON.stringify(updatedSop));
      setSops(prev => ({
        ...prev,
        [selectedSop]: updatedSop
      }));

      // Update selection states if they are currently active
      if (entry.type === 'update_instructions') {
        setSelectedNode(prev => {
          if (prev && prev.id === entry.nodeId) {
            return {
              ...prev,
              data: {
                ...prev.data,
                agent_instructions: entry.newVal
              }
            };
          }
          return prev;
        });
      } else if (entry.type === 'update_route') {
        setSelectedEdge(prev => {
          if (prev && prev.id === entry.edgeId) {
            return {
              ...prev,
              data: {
                ...prev.data,
                fullLabel: entry.newVal
              }
            };
          }
          return prev;
        });
      } else if (entry.type === 'update_global_instructions') {
        setIsGlobalInstructionsExpanded(true);
      } else if (entry.type === 'update_prompt_guard') {
        setIsPromptGuardExpanded(true);
      }
    }

    // Move view to the node or edge
    if (activeFlowFile !== entry.flowFile) {
      setActiveFlowFile(entry.flowFile);
    }
    
    if (entry.type === 'update_instructions') {
      setPendingNodeFocus({ nodeId: entry.nodeId!, select: true });
    } else if (entry.type === 'update_route') {
      setPendingEdgeFocus({ edgeId: entry.edgeId! });
    }
  }, [future, selectedSop, sops, activeFlowFile]);

  const handleCreateSnapshot = useCallback((name: string, description: string) => {
    if (!selectedSop) return;
    const currentSop = sops[selectedSop];
    if (!currentSop) return;

    const { updatedFiles } = createSnapshot(currentSop.files, name, description);

    const updatedSop = {
      ...currentSop,
      files: updatedFiles
    };

    localStorage.setItem('asop_local_sop_data', JSON.stringify(updatedSop));
    setSops(prev => ({
      ...prev,
      [selectedSop]: updatedSop
    }));
  }, [selectedSop, sops]);

  const toggleHistoryPanel = () => {
    setShowHistoryPanel(prev => !prev);
    setShowExportPanel(false);
  };

  const toggleExportPanel = () => {
    setShowExportPanel(prev => !prev);
    setShowHistoryPanel(false);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentStepIndex, activeJourney]);



  // Find outgoing routes for the currently inspected node
  const outgoingRoutes = useMemo(() => {
    if (!selectedNode) return [];
    return edges.filter(e => e.source === selectedNode.id);
  }, [selectedNode, edges]);

  // Find incoming routes for the currently inspected node
  const incomingRoutes = useMemo(() => {
    if (!selectedNode) return [];
    return edges.filter(e => e.target === selectedNode.id);
  }, [selectedNode, edges]);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isTypingEvent(e)) return;

      if (matchesShortcut(e, shortcutMappings.undo)) {
        e.preventDefault();
        handleUndo();
      } else if (matchesShortcut(e, shortcutMappings.redo)) {
        e.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleUndo, handleRedo]);

  // Calculate if History panel button should be disabled
  const currentSop = selectedSop ? sops[selectedSop] : null;
  const hasChanges = useMemo(() => {
    return currentSop ? hasChangesSinceLatestSnapshot(currentSop.files) : false;
  }, [currentSop]);

  const historySnapshotCount = useMemo(() => {
    if (!currentSop || !currentSop.files['_snapshots/metadata.yml']) return 0;
    try {
      const parsed = YAML.parse(currentSop.files['_snapshots/metadata.yml']);
      return parsed?.snapshots?.length || 0;
    } catch (e) {
      return 0;
    }
  }, [currentSop]);

  const renderAddReviewForm = (targetId: string | Edge, targetType: 'node' | 'edge') => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newReviewId.trim()) {
        setNewReviewError('Review ID is required');
        return;
      }
      const cleanId = newReviewId.trim();
      if (!/^[a-zA-Z0-9-_]+$/.test(cleanId)) {
        setNewReviewError('ID must only contain letters, numbers, hyphens, or underscores');
        return;
      }
      if (!isReviewRequestIdUnique(sops, selectedSop, cleanId)) {
        setNewReviewError(`Review ID "${cleanId}" is already used in this SOP`);
        return;
      }
      if (!newReviewFrom.trim()) {
        setNewReviewError('"From" is required');
        return;
      }
      if (!newReviewReason.trim()) {
        setNewReviewError('Reason for request is required');
        return;
      }

      const req: ReviewRequest = {
        id: cleanId,
        date: new Date().toISOString(),
        topic: newReviewTopic,
        from: newReviewFrom.trim(),
        reason: newReviewReason.trim(),
        resolved: false
      };

      if (targetType === 'node') {
        handleAddNodeReviewRequest(targetId as string, req);
      } else {
        handleAddRouteReviewRequest(targetId as Edge, req);
      }
      
      // Persist the "from" value to remember it for future requests
      const fromVal = newReviewFrom.trim();
      localStorage.setItem('asop_last_from_value', fromVal);
      setLastFromValue(fromVal);

      setIsAddingReview(false);
    };

    return (
      <form onSubmit={handleSubmit} className="inspector-card flex flex-col gap-3" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-medium)' }}>
        <div className="flex flex-col gap-1">
          <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Review ID</label>
          <input 
            type="text" 
            value={newReviewId}
            onChange={(e) => setNewReviewId(e.target.value)}
            className="form-input font-mono"
            style={{ width: '100%', boxSizing: 'border-box' }}
            placeholder="e.g. req-001"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>From (Email/Name)</label>
          <input 
            type="text" 
            value={newReviewFrom}
            onChange={(e) => setNewReviewFrom(e.target.value)}
            className="form-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
            placeholder="e.g. reviewer@google.com"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Topic</label>
          <select 
            value={newReviewTopic}
            onChange={(e) => setNewReviewTopic(e.target.value as 'DESIGN' | 'TECHNICAL')}
            className="form-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
          >
            <option value="DESIGN">DESIGN</option>
            <option value="TECHNICAL">TECHNICAL</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Reason for request</label>
          <textarea 
            value={newReviewReason}
            onChange={(e) => setNewReviewReason(e.target.value)}
            className="form-textarea"
            style={{ width: '100%', boxSizing: 'border-box', minHeight: '60px' }}
            placeholder="Why is this review needed?"
          />
        </div>

        {newReviewError && (
          <div className="text-xs text-red-400 bg-red-950/20 p-2 rounded border border-red-500/20">
            {newReviewError}
          </div>
        )}

        <div className="flex gap-2 justify-end mt-1">
          <button 
            type="button" 
            onClick={() => setIsAddingReview(false)}
            className="btn btn-secondary text-xs"
            style={{ padding: '6px 12px' }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary text-xs"
            style={{ padding: '6px 12px' }}
          >
            Create
          </button>
        </div>
      </form>
    );
  };

  const isHistoryDisabled = !hasChanges && historySnapshotCount <= 1;

  return (
    <div className="app-container">
      {/* Hidden inputs for loading SOP */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".zip,.yaml,.yml,.html" 
        style={{ display: 'none' }} 
      />
      <input 
        type="file" 
        ref={folderInputRef} 
        onChange={handleFolderChange} 
        style={{ display: 'none' }} 
        {...({ webkitdirectory: '', directory: '' } as any)}
        multiple 
      />

      {/* Premium Glass Header */}
      <header 
        className={`app-header ${isDraggingHeader ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleHeaderDragEnter}
        onDragLeave={handleHeaderDragLeave}
        onDrop={handleHeaderDrop}
      >
        <div className="brand-section">
          <div className="brand-logo">
            <Sparkles size={18} />
          </div>
          <span className="brand-title">ASOP Studio</span>
          {(window as any).IS_EMBEDDED_VISUALIZER && (
            <span className="visualizer-highlight">Visualizer</span>
          )}
          <span className="brand-badge">v{__APP_VERSION__}</span>
        </div>
        
        <div className="flow-title-section">
          <span className="flow-title-desc" style={{ marginRight: 8 }}>Active SOP:</span>
          {selectedSop ? (
            <div className="active-sop-badge-container" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="active-sop-badge" title={selectedSop}>{selectedSop}</span>
              {(!(window as any).IS_EMBEDDED_VISUALIZER || (embedded && selectedSop !== embedded.projectName) || (!embedded && selectedSop)) && (
                <button 
                  className="btn-close-sop" 
                  onClick={handleCloseSop} 
                  title="Close SOP"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px',
                    transition: 'color 0.2s, background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent-rose)';
                    e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <span className="no-sop-badge">None Loaded</span>
          )}

          <div className="header-load-menu" ref={loadMenuRef}>
            <button className="btn-load-sop" onClick={() => setShowLoadMenu(prev => !prev)}>
              <Upload size={14} />
              <span>Load SOP</span>
              <ChevronDown size={12} />
            </button>
            {showLoadMenu && (
              <div className="load-dropdown-menu">
                <button className="dropdown-item" onClick={() => { triggerFileInput(); setShowLoadMenu(false); }}>
                  File (.yml, .zip, .html)
                </button>
                <button className="dropdown-item" onClick={() => { triggerFolderInput(); setShowLoadMenu(false); }}>
                  Folder
                </button>
                {!(window as any).IS_EMBEDDED_VISUALIZER && (
                  <button className="dropdown-item" onClick={() => { loadExampleSop(); setShowLoadMenu(false); }}>
                    Example: Pizza Order Flow
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="header-actions">
          <button 
            className={`theme-toggle-btn ${theme}`} 
            onClick={toggleTheme}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle light/dark theme"
          >
            <div className="theme-toggle-track">
              <Sun size={13} className="theme-icon sun" />
              <Moon size={13} className="theme-icon moon" />
              <div className="theme-toggle-thumb" />
            </div>
          </button>

          {selectedSop && (
            <>
              <button 
                className="btn btn-icon btn-secondary" 
                onClick={handleUndo} 
                disabled={past.length === 0}
                title="Undo Edit"
                style={{ minWidth: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Undo size={16} />
              </button>
              <button 
                className="btn btn-icon btn-secondary" 
                onClick={handleRedo} 
                disabled={future.length === 0}
                title="Redo Edit"
                style={{ minWidth: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Redo size={16} />
              </button>
              <button 
                className={`btn ${showHistoryPanel ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleHistoryPanel}
                disabled={isHistoryDisabled}
                title={isHistoryDisabled ? "No changes or history to show" : "SOP History"}
              >
                <History size={16} />
                History
              </button>
            </>
          )}
          <button 
            className={`btn ${showExportPanel ? 'btn-primary' : 'btn-secondary'}`}
            onClick={toggleExportPanel}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} className="shrink-0" />
          <div>
            <strong>Flow Loading Error:</strong>
            <p className="font-mono text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="editor-layout">
        
        {/* Left Sidebar - SOP Navigator */}
        <aside className="editor-sidebar" style={{ width: `${navigatorWidth}px` }}>
          {/* Resize Handle */}
          <div 
            className="navigator-resize-handle" 
            onMouseDown={startResizingNavigator}
          />

          <div className="sidebar-header">
            <h2>SOP Navigator</h2>
            <p>Search and inspect active workflow elements</p>
          </div>
          
          <div className="sidebar-content">




            {/* Vertical Accordion Sections */}
            <div className="navigator-sections-container">
              {/* Flows Section */}
              <div className="navigator-section">
                <button
                  className="navigator-section-header"
                  onClick={() => setIsFlowsSectionExpanded(!isFlowsSectionExpanded)}
                >
                  <span className="navigator-section-header-title">
                    <GitBranch size={14} />
                    <span>Flows</span>
                  </span>
                  {isFlowsSectionExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {isFlowsSectionExpanded && (
                  <div className="navigator-section-content">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Node Search */}
                      <div className="search-container">
                        <Search className="search-icon" size={16} />
                        <input 
                          type="text" 
                          className="search-input" 
                          placeholder="Search steps across all flows..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      {parsedFlows.map((flowInfo) => {
                        const flowNodesFiltered = flowInfo.nodes.filter((n: NavNode) => 
                          n.id.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        
                        // If searching, hide empty flows
                        if (searchQuery && flowNodesFiltered.length === 0) {
                          return null;
                        }
                        
                        const isExpanded = expandedFlow === flowInfo.filename || (searchQuery && flowNodesFiltered.length > 0);
                        const isActive = activeFlowFile === flowInfo.filename;
                        
                        return (
                          <div key={flowInfo.filename} className={`sop-navigator-accordion-item ${isActive ? 'active' : ''}`}>
                            <button 
                              className="sop-navigator-accordion-header"
                              onClick={() => {
                                if (activeFlowFile !== flowInfo.filename) {
                                  handleFlowFileChange(flowInfo.filename);
                                } else {
                                  setExpandedFlow(prev => prev === flowInfo.filename ? '' : flowInfo.filename);
                                }
                              }}
                            >
                              <span className="sop-navigator-flow-name">
                                {flowInfo.filename}
                                {isActive && <span className="active-flow-dot" />}
                              </span>
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            
                            {isExpanded && (
                              <div className="sop-navigator-accordion-content">
                                <div className="nav-node-list">
                                  {flowNodesFiltered.length > 0 ? (
                                    flowNodesFiltered.map((node: NavNode) => {
                                      const nodeType = node.type || 'default';
                                      const isNodeSelected = selectedNode?.id === node.id && isActive;
                                      
                                      return (
                                        <button 
                                          key={node.id} 
                                          onClick={() => {
                                            if (!isActive) {
                                              handleFlowFileChange(flowInfo.filename, node.id);
                                            } else {
                                              handleFocusNode(node.id);
                                            }
                                          }}
                                          className={`nav-node-item ${isNodeSelected ? 'selected' : ''}`}
                                        >
                                          <span className="nav-node-name" title={node.id}>
                                            {node.id}
                                          </span>
                                          <span className={`nav-node-type-badge ${node.isRoot ? 'root' : nodeType}`}>
                                            {node.isRoot ? 'root' : nodeType}
                                          </span>
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <p className="text-center text-xs text-muted py-2">No steps found.</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Global Instructions Section */}
              {selectedSop && (
                <div className="navigator-section">
                  <button
                    className="navigator-section-header"
                    onClick={() => setIsGlobalInstructionsExpanded(!isGlobalInstructionsExpanded)}
                  >
                    <span className="navigator-section-header-title">
                      <BookOpen size={14} />
                      <span>Global Instructions</span>
                    </span>
                    {isGlobalInstructionsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isGlobalInstructionsExpanded && (
                    <div className="navigator-section-content">
                      <div className="global-instructions-block">
                        <div className="global-instructions-label">
                          <span>Main Agent</span>
                          <span className="text-xxs text-muted font-mono">{sops[selectedSop]?.mainFile}</span>
                        </div>
                        <EditableInstructions
                          value={mainFlowInfo?.globalInstructions || ''}
                          placeholder="Set global instructions for the main agent..."
                          className="global-instructions-box"
                          textareaClassName="global-instructions-textarea"
                          onSave={(newVal) => handleUpdateGlobalInstructions(sops[selectedSop]?.mainFile, newVal)}
                        />
                      </div>

                      {activeFlowFile !== sops[selectedSop]?.mainFile && (
                        <div className="global-instructions-block">
                          <div className="global-instructions-label">
                            <span>Current Flow</span>
                            <span className="text-xxs text-muted font-mono">{activeFlowFile}</span>
                          </div>
                          <EditableInstructions
                            value={currentFlowInfo?.globalInstructions || ''}
                            placeholder="Set global instructions for this sub-flow..."
                            className="global-instructions-box"
                            textareaClassName="global-instructions-textarea"
                            onSave={(newVal) => handleUpdateGlobalInstructions(activeFlowFile, newVal)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Prompt Guard Section */}
              {selectedSop && (
                <div className="navigator-section">
                  <button
                    className="navigator-section-header"
                    onClick={() => setIsPromptGuardExpanded(!isPromptGuardExpanded)}
                  >
                    <span className="navigator-section-header-title">
                      <Shield size={14} />
                      <span>Prompt Guard</span>
                    </span>
                    {isPromptGuardExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isPromptGuardExpanded && (
                    <div className="navigator-section-content">
                      <div className="global-instructions-block">
                        <div className="global-instructions-label">
                          <span>Main Agent</span>
                          <span className="text-xxs text-muted font-mono">{sops[selectedSop]?.mainFile}</span>
                        </div>
                        <EditableInstructions
                          value={mainFlowInfo?.promptGuard || ''}
                          placeholder="Define a guard rail prompt..."
                          className="global-instructions-box"
                          textareaClassName="global-instructions-textarea"
                          onSave={(newVal) => handleUpdatePromptGuard(sops[selectedSop]?.mainFile, newVal)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Input Variables Section */}
              {selectedSop && (
                <div className="navigator-section">
                  <button
                    className="navigator-section-header"
                    onClick={() => setIsInputVariablesExpanded(!isInputVariablesExpanded)}
                  >
                    <span className="navigator-section-header-title">
                      <Braces size={14} />
                      <span>Input Variables</span>
                    </span>
                    {isInputVariablesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isInputVariablesExpanded && (
                    <div className="navigator-section-content">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {mainFlowInfo?.inputVariables && mainFlowInfo.inputVariables.length > 0 ? (
                          mainFlowInfo.inputVariables.map((v: any) => (
                            <div key={v.name} className="sidebar-variable-item">
                              <div className="sidebar-variable-info">
                                <span className="sidebar-variable-name" title={v.name}>{v.name}</span>
                                <span className={`inspector-variable-type-badge ${v.type?.split('[')[0]}`}>
                                  {v.type}
                                </span>
                              </div>
                              {v.default !== undefined && (
                                <div className="sidebar-variable-default">
                                  <span className="default-label">default: </span>
                                  <code className="default-value">{JSON.stringify(v.default)}</code>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="global-instructions-empty">No input variables defined in main flow.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Example Journeys Section */}
              {selectedSop && (
                <div className="navigator-section">
                  <button
                    className="navigator-section-header"
                    onClick={() => setIsExampleJourneysExpanded(!isExampleJourneysExpanded)}
                  >
                    <span className="navigator-section-header-title">
                      <PlayCircle size={14} />
                      <span>Example Journeys</span>
                    </span>
                    {isExampleJourneysExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isExampleJourneysExpanded && (
                    <div className="navigator-section-content">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {exampleJourneys.length > 0 ? (
                          exampleJourneys.map((journey: any, jIdx: number) => {
                            const isActive = activeJourney?.name === journey.name;
                            return (
                              <button
                                key={journey.name || jIdx}
                                className={`sidebar-example-item ${isActive ? 'active' : ''}`}
                                onClick={() => startJourney(journey)}
                              >
                                <Play size={12} fill={isActive ? "currentColor" : "none"} />
                                <div className="sidebar-example-info">
                                  <span className="sidebar-example-name" title={journey.name}>{journey.name || `Journey ${jIdx + 1}`}</span>
                                  <span className="sidebar-example-steps">{journey.steps?.length || 0} steps</span>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="sidebar-examples-empty-box">
                            <span className="global-instructions-empty">No example journeys defined.</span>
                            <p className="sidebar-tip-text">
                              Tip: Add an <code>example_journeys</code> section to your main flow YAML to specify interactive walkthroughs of user-agent turns!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Review Requests Section */}
              {selectedSop && (
                <div className="navigator-section">
                  <button
                    className="navigator-section-header"
                    onClick={() => setIsReviewRequestsExpanded(!isReviewRequestsExpanded)}
                  >
                    <span className="navigator-section-header-title">
                      <AlertCircle size={14} />
                      <span>Review Requests ({unresolvedReviewRequests.length})</span>
                    </span>
                    {isReviewRequestsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isReviewRequestsExpanded && (
                    <div className="navigator-section-content">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {unresolvedReviewRequests.length > 0 ? (
                          unresolvedReviewRequests.map((req: any, rIdx: number) => {
                            return (
                              <button
                                key={req.id || rIdx}
                                className="sidebar-review-item"
                                onClick={() => handleSelectReviewRequest(req.flowFile, req.nodeId)}
                              >
                                <div className="sidebar-review-header">
                                  <span className="sidebar-review-id font-mono">{req.id}</span>
                                  <span className={`review-topic-badge ${req.topic?.toLowerCase() || ''}`}>
                                    {req.topic}
                                  </span>
                                </div>
                                <div className="sidebar-review-reason text-xs">
                                  {req.reason}
                                </div>
                                <div className="sidebar-review-meta text-[10px]">
                                  <span>Node: {req.nodeLabel}</span>
                                  {req.context && req.context !== 'Node' && (
                                    <span className="sidebar-review-context-tag"> ({req.context})</span>
                                  )}
                                  <span style={{ float: 'right' }}>{req.flowFile.split('/').pop()}</span>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="sidebar-examples-empty-box">
                            <span className="global-instructions-empty">No unresolved review requests.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Canvas Area with React Flow */}
        <main className="canvas-container">
          {selectedSop ? (
            <>
              <ReactFlow
                nodes={memoizedNodes}
                edges={memoizedEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={memoizedNodeTypes}
                edgeTypes={memoizedEdgeTypes}
                onSelectionChange={onSelectionChange}
                fitView={false}
                minZoom={0.1}
                maxZoom={2}
              >
                <Background
                  color={theme === 'dark' ? "#131522" : "#cbd5e1"}
                  variant={BackgroundVariant.Dots}
                  gap={16}
                  size={1}
                />
                <Controls showInteractive={false} />
              </ReactFlow>

              {/* Floating Canvas Legend */}
              <div className="legend-floating-panel">
                <h3 className="legend-title">Legend</h3>
                
                <div className="legend-item">
                  <div className="legend-symbol-container">
                    <div className="legend-color-line condition" />
                  </div>
                  <span>Condition Route (Data)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-symbol-container">
                    <div className="legend-color-line intent" />
                  </div>
                  <span>Intent Route (LLM)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-symbol-container">
                    <div className="legend-color-line global" />
                  </div>
                  <span>Global Intent Route</span>
                </div>
                <div className="legend-item">
                  <div className="legend-symbol-container">
                    <div className="legend-color-dot action" />
                  </div>
                  <span>Contains Actions / Tools</span>
                </div>
                <div className="legend-item">
                  <div className="legend-symbol-container">
                    <div className="legend-color-dot missing" />
                  </div>
                  <span>Missing Target Reference</span>
                </div>
                <div className="legend-item">
                  <div className="legend-symbol-container">
                    <div className="legend-color-square review-request" />
                  </div>
                  <span>Open Review Requests</span>
                </div>
              </div>

              {/* Floating Fit View Button */}
              <button 
                onClick={() => fitView({ padding: 0.15, duration: 400 })}
                className="fit-view-btn"
                title="Fit View"
              >
                <Maximize size={14} />
                <span>Fit View</span>
              </button>

              {/* Journey Player Controls */}
              {activeJourney && (
                <div className="journey-player-panel">
                  <div className="player-info">
                    <PlayCircle className="player-pulse-icon" size={20} />
                    <div className="player-text">
                      <span className="player-title" title={activeJourney.name}>
                        {activeJourney.name}
                      </span>
                      <span className="player-step-count">
                        Step {currentStepIndex + 1} of {activeJourney.steps?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="player-controls">
                    <button 
                      className="player-control-btn" 
                      onClick={() => goToJourneyStep(activeJourney, currentStepIndex - 1)}
                      disabled={currentStepIndex === 0}
                      title="Previous Step"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      className="player-control-btn" 
                      onClick={() => goToJourneyStep(activeJourney, 0)}
                      disabled={currentStepIndex === 0}
                      title="Restart Journey"
                    >
                      Reset
                    </button>
                    <button 
                      className="player-control-btn next-btn" 
                      onClick={() => goToJourneyStep(activeJourney, currentStepIndex + 1)}
                      disabled={currentStepIndex === (activeJourney.steps?.length - 1)}
                      title="Next Step"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <button className="player-close-btn" onClick={endJourney} title="Exit Journey">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Journey Chat Log Panel */}
              {activeJourney && (
                <div className="journey-chat-panel">
                  <div className="chat-header">
                    <MessageSquare size={16} className="chat-header-icon" />
                    <span>{activeJourney.name}</span>
                    <button className="chat-close-btn" onClick={endJourney} title="Close Player">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="chat-messages-container">
                    {activeJourney.steps?.slice(0, currentStepIndex + 1).map((step: any, idx: number) => {
                      const isCurrent = idx === currentStepIndex;
                      
                      return (
                        <div 
                          key={idx} 
                          className={`chat-step-wrapper active ${isCurrent ? 'current' : ''}`}
                          onClick={() => goToJourneyStep(activeJourney, idx)}
                          title="Click to jump to this step"
                        >
                          {/* Step Header / Metadata */}
                          <div className="chat-step-meta">
                            <span className="chat-step-number">Step {idx + 1}</span>
                            {step.current_flow && (
                              <span className="chat-step-flow-pill" title={`${step.current_flow} / ${step.current_node}`}>
                                {step.current_flow.replace(/\.[^/.]+$/, "")} / {step.current_node}
                              </span>
                            )}
                          </div>

                          {/* Chat Bubbles */}
                          <div className="chat-bubbles-list">
                            {(step.agent_says || step.agent_answers) && (
                              <div className="chat-bubble agent">
                                <span className="bubble-speaker">Agent</span>
                                <p className="bubble-text">{step.agent_says || step.agent_answers}</p>
                              </div>
                            )}

                            {step.user_says && (
                              <div className="chat-bubble user">
                                <span className="bubble-speaker">User</span>
                                <p className="bubble-text">{step.user_says}</p>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {step.notes && (
                            <div className="chat-step-notes">
                              <span className="notes-label">Note:</span>
                              <p className="notes-text">{step.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div 
              className={`canvas-welcome-overlay ${isDraggingWelcome ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={handleWelcomeDragEnter}
              onDragLeave={handleWelcomeDragLeave}
              onDrop={handleWelcomeDrop}
            >
              <div className="welcome-card">
                <div className="welcome-icon">
                  <Sparkles size={40} className="pulse-animation" />
                </div>
                <h2>Welcome to ASOP Studio</h2>
                <p>
                  Design and visualize agentic workflows with React Flow.
                  Get started by loading an SOP file or folder.
                </p>
                
                <div className="welcome-actions">
                  {!(window as any).IS_EMBEDDED_VISUALIZER && (
                    <button onClick={loadExampleSop} className="btn btn-primary">
                      <Sparkles size={16} />
                      Try Example SOP (Pizza Order Flow)
                    </button>
                  )}
                  <button onClick={triggerFileInput} className="btn btn-secondary">
                    <Upload size={16} />
                    Load SOP File (.yml, .zip, .html)
                  </button>
                  <button onClick={triggerFolderInput} className="btn btn-secondary">
                    <Upload size={16} />
                    Load SOP Folder
                  </button>
                </div>
                
                <div className="welcome-footer">
                  Supports unified YAML, multi-file ZIP, HTML visualizers, and local folder uploads.
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Inspector Panel */}
        <aside className="inspector-sidebar" style={{ width: `${inspectorWidth}px` }}>
          {/* Resize Handle */}
          <div 
            className="inspector-resize-handle" 
            onMouseDown={startResizing}
          />

          {showExportPanel ? (
            <div className="import-export-panel">
              <div className="inspector-header">
                <h2>
                  <Download size={18} />
                  Export SOP
                </h2>
                <button 
                  onClick={() => setShowExportPanel(false)}
                  className="close-inspector-btn"
                  title="Close Panel"
                >
                  Close
                </button>
              </div>

              <div className="inspector-content">
                <div className="inspector-section">
                  <span className="inspector-section-title">Export SOP Project</span>
                  
                  <div className="inspector-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>


                    <div className="export-accordion-container">
                      {/* SOP Category Accordion Item */}
                      <div className={`export-accordion-item ${exportCategory === 'sop' ? 'active' : ''}`}>
                        <div 
                          className="export-accordion-header"
                          onClick={() => setExportCategory('sop')}
                        >
                          <label className="export-category-label">
                            <input 
                              type="radio" 
                              name="exportCategory" 
                              checked={exportCategory === 'sop'} 
                              onChange={() => setExportCategory('sop')}
                              className="export-category-radio"
                            />
                            <span className="export-category-title">SOP</span>
                          </label>
                          {exportCategory === 'sop' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                        
                        {exportCategory === 'sop' && (
                          <div className="export-accordion-content">
                            <span className="inspector-card-section-title">SOP Format</span>
                            <div className="sop-toggle-switch">
                              <button 
                                type="button"
                                className={`sop-toggle-btn ${sopFormat === 'zip' ? 'active' : ''}`}
                                onClick={() => setSopFormat('zip')}
                              >
                                ZIP Archive
                              </button>
                              <button 
                                type="button"
                                className={`sop-toggle-btn ${sopFormat === 'yaml' ? 'active' : ''}`}
                                onClick={() => setSopFormat('yaml')}
                              >
                                Unified YAML
                              </button>
                              {!(window as any).IS_EMBEDDED_VISUALIZER && (
                                <button 
                                  type="button"
                                  className={`sop-toggle-btn ${sopFormat === 'visualizer' ? 'active' : ''}`}
                                  onClick={() => setSopFormat('visualizer')}
                                >
                                  Visualizer
                                </button>
                              )}
                            </div>
                            <p className="export-help-text">
                              {sopFormat === 'zip' 
                                ? 'Exports the raw multi-file SOP project directory as a ZIP archive.' 
                                : sopFormat === 'yaml'
                                ? 'Combines all sub-flows and variables into a single unified YAML file.'
                                : 'Exports a self-contained HTML file that visualizes the SOP offline without a backend.'}
                            </p>
                          </div>
                        )}
                      </div>
 
                      {/* Agent Category Accordion Item */}
                      {!(window as any).IS_EMBEDDED_VISUALIZER && (
                        <div className={`export-accordion-item ${exportCategory === 'agent' ? 'active' : ''}`}>
                          <div 
                            className="export-accordion-header"
                            onClick={() => setExportCategory('agent')}
                          >
                            <label className="export-category-label">
                              <input 
                                type="radio" 
                                name="exportCategory" 
                                checked={exportCategory === 'agent'} 
                                onChange={() => setExportCategory('agent')}
                                className="export-category-radio"
                              />
                              <span className="export-category-title">Agent</span>
                            </label>
                            {exportCategory === 'agent' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                          
                          {exportCategory === 'agent' && (
                            <div className="export-accordion-content">
                              <span className="inspector-card-section-title">Agent Format</span>
                              <div className="agent-format-selector">
                                <button 
                                  type="button"
                                  className={`agent-format-btn ${agentFormat === 'cxas' ? 'active' : ''}`}
                                  onClick={() => setAgentFormat('cxas')}
                                >
                                  <span className="agent-format-title">CX Agent Studio</span>
                                  <span className="agent-format-desc">Deploy to CX Agent Studio</span>
                                </button>
                                <button 
                                  type="button"
                                  className={`agent-format-btn ${agentFormat === 'adk' ? 'active' : ''}`}
                                  onClick={() => setAgentFormat('adk')}
                                >
                                  <span className="agent-format-title">ADK</span>
                                  <span className="agent-format-desc">Export agent as a ADK package</span>
                                </button>
                              </div>

                              {exportCategory === 'agent' && agentFormat === 'adk' && !!mainFlowInfo?.promptGuard?.trim() && (
                                <div className="snapshot-status-card modified" style={{ marginTop: 8, padding: 10 }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <AlertCircle className="text-[#f59e0b] shrink-0 mt-0.5" size={16} />
                                    <div>
                                      <strong className="text-[#f59e0b] text-xs">ADK Guardrails Warning</strong>
                                      <p className="text-xxs text-muted mt-0.5" style={{ margin: 0 }}>
                                        ADK exports do not support prompt guardrails. The prompt guard will be omitted from the exported package.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
  
                              <div className="agent-mode-slider-container">
                                <span className="inspector-card-section-title">Execution Engine Mode</span>
                                
                                <div className="agent-mode-slider-track">
                                  <div 
                                    className={`agent-mode-slider-thumb position-${agentMode}`}
                                  />
                                  <button 
                                    type="button"
                                    className={`agent-mode-step-btn ${agentMode === 'fully-agentic' ? 'active' : ''}`}
                                    onClick={() => setAgentMode('fully-agentic')}
                                  >
                                    Fully Agentic
                                  </button>
                                  <button 
                                    type="button"
                                    className={`agent-mode-step-btn ${agentMode === 'graph-guided' ? 'active' : ''}`}
                                    onClick={() => setAgentMode('graph-guided')}
                                  >
                                    Graph-guided
                                  </button>
                                  <button 
                                    type="button"
                                    className="agent-mode-step-btn disabled"
                                    disabled
                                    title="Fully Deterministic (Coming Soon)"
                                  >
                                    <Lock size={10} style={{ marginRight: 4 }} />
                                    Deterministic
                                  </button>
                                </div>
                                
                                <div className="agent-mode-description">
                                  {agentMode === 'fully-agentic' && (
                                    <span className="text-[11px] text-muted block mt-2">
                                      <strong>Fully Agentic:</strong> The agent is given a text version of the SOP, divided in sub-flows, and will execute it by dynamically following instructions at runtime.
                                    </span>
                                  )}
                                  {agentMode === 'graph-guided' && (
                                    <span className="text-[11px] text-muted block mt-2">
                                      <strong>Graph-guided Agentic:</strong> Agent uses a deterministic graph-traversal tool to get guidance from the current state of the graph at each turn.
                                    </span>
                                  )}
                                  {agentMode === 'fully-deterministic' && (
                                    <span className="text-[11px] text-muted block mt-2">
                                      <strong>Fully Deterministic:</strong> (Coming Soon) Strict intent classification forces the LLM to strictly follow the state graph sequentially.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reports Category Accordion Item */}
                      <div className={`export-accordion-item ${exportCategory === 'reports' ? 'active' : ''}`}>
                        <div 
                          className="export-accordion-header"
                          onClick={() => setExportCategory('reports')}
                        >
                          <label className="export-category-label">
                            <input 
                              type="radio" 
                              name="exportCategory" 
                              checked={exportCategory === 'reports'} 
                              onChange={() => setExportCategory('reports')}
                              className="export-category-radio"
                            />
                            <span className="export-category-title">Reports</span>
                          </label>
                          {exportCategory === 'reports' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                        
                        {exportCategory === 'reports' && (
                          <div className="export-accordion-content">
                            <span className="inspector-card-section-title">Report Type</span>
                            <div className="agent-format-selector">
                              <button 
                                type="button"
                                className={`agent-format-btn ${reportsFormat === 'tools-signatures' ? 'active' : ''}`}
                                onClick={() => setReportsFormat('tools-signatures')}
                              >
                                <span className="agent-format-title">Tools and signatures</span>
                                <span className="agent-format-desc">Export technical documentation for tools and their signatures as PDF</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
 
                    <button 
                      onClick={handleExport}
                      className="subflow-go-btn"
                      style={{ background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))', marginTop: 8 }}
                      disabled={exporting || !selectedSop}
                    >
                      <Download size={14} />
                      <span>{exporting ? 'Exporting...' : 'Export Project'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : showHistoryPanel ? (
            <HistoryPanel 
              files={selectedSop && sops[selectedSop] ? sops[selectedSop].files : {}}
              onCreateSnapshot={handleCreateSnapshot}
              onClose={() => setShowHistoryPanel(false)}
            />
          ) : (
            <>
              <div className="inspector-header">
                <h2>Inspector</h2>
                {(selectedNode || selectedEdge) && (
                  <button 
                    onClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
                    className="close-inspector-btn"
                    title="Clear Selection"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="inspector-content">
                {selectedNode ? (
                  selectedNode.data.type === 'sub_flow' ? (
                    <div>
                      {/* Sub-flow Node Inspector View */}
                      <div className="inspector-section">
                        <span className="inspector-section-title">Sub-flow Reference</span>
                        <div className="subflow-reference-card">
                          <div className="subflow-icon-wrapper">
                            <ExternalLink size={24} />
                          </div>
                          <h3>{selectedNode.id}</h3>
                          <p className="subflow-description">
                            This step triggers a transition into the sub-flow workflow defined in <code>{selectedNode.id}</code>.
                          </p>
                          
                          <button 
                            onClick={() => handleFlowFileChange(selectedNode.id)}
                            className="subflow-go-btn"
                          >
                            <Play size={14} />
                            <span>Open Flow Diagram</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Step Title */}
                      <span className="inspector-step-title select-all">
                        {selectedNode.id}
                      </span>


                      {/* Flow Evaluation Sequence: Actions -> Instructions -> Condition routes -> Intent Routes */}
                      {(() => {
                        const hasActions = selectedNode.data.actions && selectedNode.data.actions.length > 0;
                        const hasInstructions = !!selectedNode.data.agent_instructions;
                        const canEditInstructions = selectedNode && (selectedNode.data.type === 'default' || selectedNode.data.type === 'action');
                        const condRoutes = outgoingRoutes.filter(r => r.data?.type === 'condition');
                        const intRoutes = outgoingRoutes.filter(r => r.data?.type === 'intent' || r.data?.type === 'global_intent');
                        const hasConditionRoutes = condRoutes.length > 0;
                        const hasIntentRoutes = intRoutes.length > 0;

                        const flowSections: { type: string; component: React.ReactNode }[] = [];

                        if (hasActions) {
                          flowSections.push({
                            type: 'actions',
                            component: (
                              <div className="inspector-flow-box actions-box">
                                <div className="inspector-flow-box-header">
                                  <Cpu size={14} className="text-[#f59e0b]" />
                                  <span className="inspector-flow-box-title">Actions & Tools ({selectedNode.data.actions!.length})</span>
                                </div>
                                <div className="inspector-flow-box-content">
                                  {selectedNode.data.actions!.map((action, idx) => {
                                    const actionKey = `${selectedNode.id}-${idx}`;
                                    const isExpanded = !!expandedActions[actionKey];
                                    const hasParams = action.tool_params && Object.keys(action.tool_params).length > 0;
                                    const hasMock = action.mock_responses && Object.keys(action.mock_responses).length > 0;
                                    const hasDetails = hasParams || hasMock;

                                    return (
                                      <div key={idx} className={`inspector-action-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
                                        <div 
                                          className="inspector-action-header clickable"
                                          onClick={() => hasDetails && toggleActionExpanded(actionKey)}
                                          style={{ cursor: hasDetails ? 'pointer' : 'default' }}
                                        >
                                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                                            {hasDetails ? (
                                              <span className="text-muted flex-shrink-0">
                                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                              </span>
                                            ) : (
                                              <span className="w-3.5 flex-shrink-0" />
                                            )}
                                            <span className="inspector-action-title truncate" title={action.tool_name}>
                                              {action.tool_name}
                                            </span>
                                            {action.store_result_variable && (
                                              <span className="inspector-action-result-var font-mono text-[10px] text-[#c084fc] bg-[#8b5cf6]/10 px-1.5 py-0.5 rounded border border-[#8b5cf6]/20 truncate flex-shrink-0">
                                                → {action.store_result_variable}
                                              </span>
                                            )}
                                          </div>
                                          <span className="nav-node-type-badge action flex-shrink-0">
                                            {action.type}
                                          </span>
                                        </div>
                                        {isExpanded && (
                                          <div className="inspector-action-details mt-2.5 pt-2.5 border-t border-white/5 flex flex-col gap-2.5">
                                            {hasParams && (
                                              <div>
                                                <span className="inspector-card-section-title">Parameters</span>
                                                <pre className="inspector-yaml-block">
                                                  {YAML.stringify(action.tool_params)}
                                                </pre>
                                              </div>
                                            )}
                                            {hasMock && (
                                              <div>
                                                <span className="inspector-card-section-title">Mock Responses</span>
                                                <pre className="inspector-yaml-block" style={{ color: '#60a5fa' }}>
                                                  {YAML.stringify(action.mock_responses)}
                                                </pre>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )
                          });
                        }

                        if (hasInstructions || canEditInstructions) {
                          flowSections.push({
                            type: 'instructions',
                            component: (
                              <div className="inspector-flow-box instructions-box">
                                <div className="inspector-flow-box-header">
                                  <MessageSquare size={14} className="text-[#3b82f6]" />
                                  <span className="inspector-flow-box-title">Agent Instructions</span>
                                </div>
                                <div className="inspector-flow-box-content">
                                  <EditableInstructions 
                                    value={selectedNode.data.agent_instructions || ''}
                                    onSave={(newVal) => handleUpdateNodeInstructions(selectedNode.id, newVal)}
                                  />
                                </div>
                              </div>
                            )
                          });
                        }

                        if (hasConditionRoutes) {
                          flowSections.push({
                            type: 'condition_routes',
                            component: (
                              <div className="inspector-flow-box condition-routes-box">
                                <div className="inspector-flow-box-header">
                                  <GitBranch size={14} className="text-[#f97316]" />
                                  <span className="inspector-flow-box-title">Condition Routes ({condRoutes.length})</span>
                                </div>
                                <div className="inspector-flow-box-content flex flex-col gap-2">
                                  {condRoutes.map((route, idx) => (
                                    <div key={idx} className="inspector-route-item condition-route-item has-edit-btn">
                                      <div className="inspector-route-expr font-mono">
                                        {(route.data?.fullLabel as string) || 'true'}
                                      </div>
                                      <div className="inspector-route-target-row mt-1">
                                        <span className="inspector-route-target-label">TARGET:</span>
                                        <button 
                                          onClick={() => handleFocusNode(route.target, false)}
                                          className="inspector-route-target font-mono"
                                        >
                                          {route.target}
                                          <Crosshair size={11} className="inline-block ml-1" />
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => handleSelectEdge(route.id)}
                                        className="inspector-route-edit-btn"
                                        title="Edit Route"
                                      >
                                        <Pencil size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          });
                        }

                        if (hasIntentRoutes) {
                          flowSections.push({
                            type: 'intent_routes',
                            component: (
                              <div className="inspector-flow-box intent-routes-box">
                                <div className="inspector-flow-box-header">
                                  <Brain size={14} className="text-[#3b82f6]" />
                                  <span className="inspector-flow-box-title">Intent Routes ({intRoutes.length})</span>
                                </div>
                                <div className="inspector-flow-box-content flex flex-col gap-2">
                                  {intRoutes.map((route, idx) => (
                                    <div key={idx} className="inspector-route-item intent-route-item has-edit-btn">
                                      <div className="inspector-route-expr italic">
                                        {(route.data?.fullLabel as string) || 'no intent'}
                                      </div>
                                      <div className="inspector-route-target-row mt-1">
                                        <span className="inspector-route-target-label">TARGET:</span>
                                        <button 
                                          onClick={() => handleFocusNode(route.target, false)}
                                          className="inspector-route-target font-mono"
                                        >
                                          {route.target}
                                          <Crosshair size={11} className="inline-block ml-1" />
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => handleSelectEdge(route.id)}
                                        className="inspector-route-edit-btn"
                                        title="Edit Route"
                                      >
                                        <Pencil size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          });
                        }

                        if (flowSections.length === 0) return null;

                        return (
                          <div className="inspector-flow-container mt-4 flex flex-col">
                            {flowSections.map((sec, index) => (
                              <div key={sec.type} className="inspector-flow-step-wrapper">
                                {sec.component}
                                {index < flowSections.length - 1 && (
                                  <div className="inspector-flow-connector">
                                    <div className="inspector-flow-line" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Review Requests - Collapsible */}
                      {(() => {
                        const nodeReviews = selectedNode.data.review_requests || [];
                        const actionReviews = (selectedNode.data.actions || []).flatMap(
                          (act) => (act.review_requests || []).map(r => ({ ...r, context: `Action: ${act.tool_name}` }))
                        );
                        const routeReviews = [
                          ...(selectedNode.data.condition_routes || []).flatMap(
                            (r) => (r.review_requests || []).map(req => ({ ...req, context: `Condition: ${r.condition} -> ${r.target_node}` }))
                          ),
                          ...(selectedNode.data.intent_routes || []).flatMap(
                            (r) => (r.review_requests || []).map(req => ({ ...req, context: `Intent: ${r.intent} -> ${r.target_node}` }))
                          )
                        ];

                        const allReviews = [
                          ...nodeReviews.map(r => ({ ...r, context: 'Node' })),
                          ...actionReviews,
                          ...routeReviews
                        ];

                        const unresolvedReviews = allReviews.filter(r => !r.resolved);
                        const resolvedReviews = allReviews.filter(r => r.resolved);

                        return (
                          <div className="inspector-section collapsible-section">
                            <button 
                              onClick={() => setIsReviewSectionExpanded(!isReviewSectionExpanded)}
                              className="collapsible-header"
                            >
                              <span className="inspector-section-title">
                                Review Requests ({unresolvedReviews.length})
                              </span>
                              {isReviewSectionExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>

                            {isReviewSectionExpanded && (
                              <div className="flex flex-col gap-2 mt-2">
                                {allReviews.length === 0 ? (
                                  isAddingReview ? (
                                    renderAddReviewForm(selectedNode.id, 'node')
                                  ) : (
                                    <button 
                                      onClick={handleStartAddReview}
                                      className="btn btn-secondary text-xs w-full"
                                    >
                                      Add Request
                                    </button>
                                  )
                                ) : (
                                  <>
                                    {/* Unresolved Reviews */}
                                    {unresolvedReviews.map((req, idx) => (
                                      <div key={idx} className="inspector-card review-request-card unresolved" style={{ padding: '12px' }}>
                                        <div className="review-request-header">
                                          <div className="review-request-badges">
                                            <span className={`review-topic-badge ${req.topic?.toLowerCase() || ''}`}>
                                              {req.topic}
                                            </span>
                                            {req.context && (
                                              <span className="review-context-badge" title={req.context}>
                                                {req.context.length > 25 ? req.context.substring(0, 25) + '...' : req.context}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <span className="review-request-id" title="Review ID" style={{ marginRight: '4px' }}>
                                              ID: {req.id}
                                            </span>
                                            <button
                                              onClick={() => handleResolveReviewRequest(req.id)}
                                              className="review-action-btn resolve-btn"
                                              title="Resolve request"
                                            >
                                              <Check size={12} />
                                            </button>
                                            <button
                                              onClick={() => setReviewToDelete(req.id)}
                                              className="review-action-btn delete-btn"
                                              title="Delete request"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </div>
                                        {(req.date || req.from) && (
                                          <div className="review-request-date">
                                            {req.date && `Added ${new Date(req.date).toLocaleDateString()}`}
                                            {req.date && req.from && ' • '}
                                            {req.from && `From: ${req.from}`}
                                          </div>
                                        )}
                                        <div className="review-request-reason">
                                          {req.reason}
                                        </div>
                                      </div>
                                    ))}

                                    {/* Resolved Reviews Collapsible */}
                                    {resolvedReviews.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-border-subtle">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setIsResolvedExpanded(!isResolvedExpanded); }}
                                          className="resolved-toggle-link"
                                        >
                                          {isResolvedExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                          <span>{isResolvedExpanded ? 'Hide' : `+${resolvedReviews.length} resolved`}</span>
                                        </button>
                                        
                                        {isResolvedExpanded && (
                                          <div className="flex flex-col gap-2 mt-2">
                                            {resolvedReviews.map((req, idx) => (
                                              <div key={idx} className="inspector-card review-request-card resolved" style={{ padding: '12px' }}>
                                                <div className="review-request-header">
                                                  <div className="review-request-badges">
                                                    <span className={`review-topic-badge ${req.topic?.toLowerCase() || ''}`}>
                                                      {req.topic}
                                                    </span>
                                                    {req.context && (
                                                      <span className="review-context-badge" title={req.context}>
                                                        {req.context.length > 25 ? req.context.substring(0, 25) + '...' : req.context}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <span className="review-request-id" title="Review ID" style={{ marginRight: '4px' }}>
                                                      ID: {req.id}
                                                    </span>
                                                    <button
                                                      onClick={() => handleResolveReviewRequest(req.id, false)}
                                                      className="review-action-btn unresolve-btn"
                                                      title="Un-resolve request"
                                                    >
                                                      <Undo size={12} />
                                                    </button>
                                                    <button
                                                      onClick={() => setReviewToDelete(req.id)}
                                                      className="review-action-btn delete-btn"
                                                      title="Delete request"
                                                    >
                                                      <Trash2 size={12} />
                                                    </button>
                                                  </div>
                                                </div>
                                                {(req.date || req.from) && (
                                                  <div className="review-request-date">
                                                    {req.date && `Resolved ${new Date(req.date).toLocaleDateString()}`}
                                                    {req.date && req.from && ' • '}
                                                    {req.from && `From: ${req.from}`}
                                                  </div>
                                                )}
                                                <div className="review-request-reason" style={{ fontStyle: 'italic', textDecoration: 'line-through', opacity: 0.8 }}>
                                                  {req.reason}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Add Review Request form or button at bottom */}
                                    {isAddingReview ? (
                                      renderAddReviewForm(selectedNode.id, 'node')
                                    ) : (
                                      <button 
                                        onClick={handleStartAddReview}
                                        className="btn btn-secondary text-xs mt-2 w-full"
                                      >
                                        Add Request
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Incoming Connections - Collapsible */}
                      <div className="inspector-section collapsible-section">
                        <button 
                          onClick={() => setIsIncomingExpanded(!isIncomingExpanded)}
                          className="collapsible-header"
                        >
                          <span className="inspector-section-title">Incoming Routes ({incomingRoutes.length})</span>
                          {isIncomingExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {isIncomingExpanded && (
                          <div className="flex flex-col gap-2 mt-2">
                            {incomingRoutes.length > 0 ? (
                              incomingRoutes.map((route, idx) => (
                                <div key={idx} className="inspector-route-item">
                                  <div className="inspector-route-header">
                                    <span className={`inspector-route-type ${route.data?.type}`}>
                                      {route.data?.type === 'global_intent' ? 'Global Intent' : 
                                       route.data?.type === 'condition' ? 'Condition' : 'Intent'}
                                    </span>
                                    <button 
                                      onClick={() => handleFocusNode(route.source, false)}
                                      className="inspector-route-target font-mono"
                                    >
                                      {route.source}
                                    </button>
                                  </div>
                                  {!!route.data?.fullLabel && (
                                    <div className={`inspector-route-expr ${route.data?.type === 'intent' || route.data?.type === 'global_intent' ? 'italic' : ''}`}>
                                      {route.data.fullLabel as string}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted italic p-2 bg-black/10 rounded">No incoming routes</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Raw Step Spec (YAML) - Collapsible */}
                      <div className="inspector-section collapsible-section">
                        <button 
                          onClick={() => setIsRawExpanded(!isRawExpanded)}
                          className="collapsible-header"
                        >
                          <span className="inspector-section-title">Raw Step Spec (YAML)</span>
                          {isRawExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {isRawExpanded && (
                          <div className="mt-2">
                            <pre className="inspector-yaml-block">
                              {YAML.stringify({
                                id: selectedNode.id,
                                agent_instructions: selectedNode.data.agent_instructions,
                                actions: selectedNode.data.actions,
                                condition_routes: selectedNode.data.condition_routes,
                                intent_routes: selectedNode.data.intent_routes
                              })}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : selectedEdge ? (() => {
                  const edgeData = (selectedEdge.data || {}) as unknown as SopEdgeData;
                  const setVars = edgeData.set_variables;
                  const hasVars = Array.isArray(setVars) && setVars.length > 0;
                  return (
                    <div>
                      {/* Edge Header */}
                      <div className="inspector-section">
                        <span className="inspector-section-title">Transition Route</span>
                        <div className="inspector-card">
                          <div className="flex items-center justify-between">
                            <span className={`nav-node-type-badge ${edgeData.type}`}>
                              {edgeData.type === 'global_intent' ? 'GLOBAL INTENT' : 
                               edgeData.type === 'condition' ? 'CONDITION ROUTE' : 
                               'INTENT ROUTE'}
                            </span>
                          </div>
                          
                          {/* Source -> Target */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                            <button 
                              onClick={() => handleFocusNode(selectedEdge.source, false)}
                              className="inspector-route-target font-mono"
                            >
                              {selectedEdge.source}
                            </button>
                            <ArrowRight size={14} className="text-secondary" />
                            <button 
                              onClick={() => handleFocusNode(selectedEdge.target, false)}
                              className="inspector-route-target font-mono"
                            >
                              {selectedEdge.target}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expression */}
                      <div className="inspector-section">
                        <span className="inspector-section-title">
                          {edgeData.type === 'condition' ? 'Condition Expression' : 'Intent Description'}
                        </span>
                        <div className="inspector-card">
                          <EditableInstructions 
                            value={edgeData.fullLabel || ''}
                            placeholder={edgeData.type === 'condition' ? 'e.g. placement_status.success == true' : 'Describe the customer intent...'}
                            className={`inspector-route-expr ${edgeData.type === 'condition' ? 'font-mono' : 'italic'}`}
                            textareaClassName={`inspector-route-textarea ${edgeData.type === 'condition' ? 'font-mono' : ''}`}
                            onSave={(newVal) => handleUpdateRouteValue(selectedEdge, newVal)}
                          />
                        </div>
                      </div>

                      {/* Edge Review Requests - Collapsible */}
                      {(() => {
                        const edgeReviews = edgeData.review_requests || [];
                        const unresolvedReviews = edgeReviews.filter(r => !r.resolved);
                        const resolvedReviews = edgeReviews.filter(r => r.resolved);

                        return (
                          <div className="inspector-section collapsible-section">
                            <button 
                              onClick={() => setIsReviewSectionExpanded(!isReviewSectionExpanded)}
                              className="collapsible-header"
                            >
                              <span className="inspector-section-title">
                                Review Requests ({unresolvedReviews.length})
                              </span>
                              {isReviewSectionExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>

                            {isReviewSectionExpanded && (
                              <div className="flex flex-col gap-2 mt-2">
                                {edgeReviews.length === 0 ? (
                                  isAddingReview ? (
                                    renderAddReviewForm(selectedEdge, 'edge')
                                  ) : (
                                    <button 
                                      onClick={handleStartAddReview}
                                      className="btn btn-secondary text-xs w-full"
                                    >
                                      Add Request
                                    </button>
                                  )
                                ) : (
                                  <>
                                    {/* Unresolved Reviews */}
                                    {unresolvedReviews.map((req, idx) => (
                                      <div key={idx} className="inspector-card review-request-card unresolved" style={{ padding: '12px' }}>
                                        <div className="review-request-header">
                                          <div className="review-request-badges">
                                            <span className={`review-topic-badge ${req.topic?.toLowerCase() || ''}`}>
                                              {req.topic}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <span className="review-request-id" title="Review ID" style={{ marginRight: '4px' }}>
                                              ID: {req.id}
                                            </span>
                                            <button
                                              onClick={() => handleResolveReviewRequest(req.id)}
                                              className="review-action-btn resolve-btn"
                                              title="Resolve request"
                                            >
                                              <Check size={12} />
                                            </button>
                                            <button
                                              onClick={() => setReviewToDelete(req.id)}
                                              className="review-action-btn delete-btn"
                                              title="Delete request"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </div>
                                        {(req.date || req.from) && (
                                          <div className="review-request-date">
                                            {req.date && `Added ${new Date(req.date).toLocaleDateString()}`}
                                            {req.date && req.from && ' • '}
                                            {req.from && `From: ${req.from}`}
                                          </div>
                                        )}
                                        <div className="review-request-reason">
                                          {req.reason}
                                        </div>
                                      </div>
                                    ))}

                                    {/* Resolved Reviews Collapsible */}
                                    {resolvedReviews.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-border-subtle">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setIsResolvedExpanded(!isResolvedExpanded); }}
                                          className="resolved-toggle-link"
                                        >
                                          {isResolvedExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                          <span>{isResolvedExpanded ? 'Hide' : `+${resolvedReviews.length} resolved`}</span>
                                        </button>
                                        
                                        {isResolvedExpanded && (
                                          <div className="flex flex-col gap-2 mt-2">
                                            {resolvedReviews.map((req, idx) => (
                                              <div key={idx} className="inspector-card review-request-card resolved" style={{ padding: '12px' }}>
                                                <div className="review-request-header">
                                                  <div className="review-request-badges">
                                                    <span className={`review-topic-badge ${req.topic?.toLowerCase() || ''}`}>
                                                      {req.topic}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <span className="review-request-id" title="Review ID" style={{ marginRight: '4px' }}>
                                                      ID: {req.id}
                                                    </span>
                                                    <button
                                                      onClick={() => handleResolveReviewRequest(req.id, false)}
                                                      className="review-action-btn unresolve-btn"
                                                      title="Un-resolve request"
                                                    >
                                                      <Undo size={12} />
                                                    </button>
                                                    <button
                                                      onClick={() => setReviewToDelete(req.id)}
                                                      className="review-action-btn delete-btn"
                                                      title="Delete request"
                                                    >
                                                      <Trash2 size={12} />
                                                    </button>
                                                  </div>
                                                </div>
                                                {(req.date || req.from) && (
                                                  <div className="review-request-date">
                                                    {req.date && `Resolved ${new Date(req.date).toLocaleDateString()}`}
                                                    {req.date && req.from && ' • '}
                                                    {req.from && `From: ${req.from}`}
                                                  </div>
                                                )}
                                                <div className="review-request-reason" style={{ fontStyle: 'italic', textDecoration: 'line-through', opacity: 0.8 }}>
                                                  {req.reason}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Add Review Request form or button at bottom */}
                                    {isAddingReview ? (
                                      renderAddReviewForm(selectedEdge, 'edge')
                                    ) : (
                                      <button 
                                        onClick={handleStartAddReview}
                                        className="btn btn-secondary text-xs mt-2 w-full"
                                      >
                                        Add Request
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Extracts/Sets variables */}
                      {edgeData.type !== 'condition' && hasVars && (
                        <div className="inspector-section">
                          <span className="inspector-section-title">Parameters Extracted</span>
                          <div className="inspector-card">
                            <p className="text-xs text-secondary" style={{ marginBottom: 12 }}>
                              This transition triggers an LLM slot-filling extraction when matching this user intent.
                            </p>
                            <div className="inspector-variables-list">
                              {setVars.map((variable, idx) => {
                                const varObj = variable as { name?: string; type?: string } | string;
                                const isString = typeof varObj === 'string';
                                const name = isString ? varObj : varObj?.name || 'unknown';
                                const rawType = isString ? 'string' : varObj?.type || 'string';
                                // Extract base type name if it's enum[...], e.g. "enum"
                                const badgeClass = rawType.startsWith('enum') ? 'enum' : rawType;
                                return (
                                  <div key={idx} className="inspector-variable-item">
                                    <span className="inspector-variable-name">{name}</span>
                                    <span className={`inspector-variable-type-badge ${badgeClass}`} title={rawType}>
                                      {rawType}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="inspector-empty-state">
                    <Cpu size={36} />
                    <div className="inspector-empty-state-title">No Element Selected</div>
                    <p className="inspector-empty-state-text">
                      Select a step node or routing line to inspect instructions, parameter contexts, and raw specifications.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

      {showCloseConfirm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <AlertCircle size={20} className="text-warning" />
              <h3>Close SOP Workflow</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to close the current SOP <strong>"{selectedSop}"</strong>?
              </p>
              <p className="text-muted text-sm mt-2">
                This will clear local storage and delete the workflow data from the server.
              </p>
              <p className="text-muted text-sm">
                We strongly recommend exporting your work first.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowCloseConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-secondary"
                style={{ borderColor: 'var(--accent-purple)' }}
                onClick={async () => {
                  await handleExport();
                  await handleConfirmCloseSop();
                }}
              >
                Export & Close
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleConfirmCloseSop}
              >
                Close without Export
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewToDelete && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <AlertCircle size={20} className="text-warning" />
              <h3>Delete Review Request</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the review request <strong>"{reviewToDelete}"</strong>?
              </p>
              <p className="text-muted text-sm mt-2">
                This action is permanent and will remove the review request from the SOP files.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setReviewToDelete(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  handleConfirmDeleteReview(reviewToDelete);
                  setReviewToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}
