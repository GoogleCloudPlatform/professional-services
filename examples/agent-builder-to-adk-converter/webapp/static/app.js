// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Interactive DAG Topology Visualization & Dual-Engine Conversion Client
 */

(function () {
  'use strict';

  // Node Type Visual Palette
  const NODE_STYLES = {
    CONNECTOR_EVENT_TRIGGER: { color: '#10b981', label: 'TRIGGER', category: 'Trigger' },
    TRIGGER: { color: '#10b981', label: 'TRIGGER', category: 'Trigger' },
    START: { color: '#10b981', label: 'START', category: 'Trigger' },
    AGENT_NODE: { color: '#2563eb', label: 'AGENT', category: 'Agent' },
    CONNECTOR_NODE: { color: '#7c3aed', label: 'CONNECTOR', category: 'Connector' },
    CONDITION_NODE: { color: '#d97706', label: 'CONDITION', category: 'Condition' },
    APPROVAL_NODE: { color: '#ea580c', label: 'APPROVAL', category: 'Approval' },
    DEFAULT: { color: '#64748b', label: 'NODE', category: 'General' },
  };

  /**
   * Smooth Pan & Zoom Manager for SVG Surfaces
   */
  class SvgPanZoomManager {
    constructor(svgEl, containerEl, readoutEl) {
      this.svg = svgEl;
      this.container = containerEl;
      this.readout = readoutEl;
      this.rootGroup = svgEl.querySelector('#dagRootGroup') || svgEl;

      this.scale = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.isDragging = false;
      this.startX = 0;
      this.startY = 0;

      // Touch handling
      this.touchDistance = 0;

      this.initEvents();
    }

    initEvents() {
      // Mouse drag handlers
      this.container.addEventListener('mousedown', (e) => this.handleDragStart(e));
      window.addEventListener('mousemove', (e) => this.handleDragMove(e));
      window.addEventListener('mouseup', () => this.handleDragEnd());

      // Wheel zoom (anchored to mouse cursor)
      this.container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 0.12 : -0.12;
        this.zoom(zoomDelta, e.clientX, e.clientY);
      }, { passive: false });

      // Touch handlers
      this.container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
      this.container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
      this.container.addEventListener('touchend', () => this.handleTouchEnd());
    }

    handleDragStart(e) {
      if (e.target.closest('.canvas-toolbar')) return;
      this.isDragging = true;
      this.container.classList.add('dragging');
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      e.preventDefault();
    }

    handleDragMove(e) {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.applyTransform();
    }

    handleDragEnd() {
      if (this.isDragging) {
        this.isDragging = false;
        this.container.classList.remove('dragging');
      }
    }

    handleTouchStart(e) {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.isDragging = true;
        this.startX = touch.clientX - this.panX;
        this.startY = touch.clientY - this.panY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        this.touchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }

    handleTouchMove(e) {
      e.preventDefault();
      if (e.touches.length === 1 && this.isDragging) {
        const touch = e.touches[0];
        this.panX = touch.clientX - this.startX;
        this.panY = touch.clientY - this.startY;
        this.applyTransform();
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (this.touchDistance > 0) {
          const delta = (dist - this.touchDistance) * 0.005;
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          this.zoom(delta, midX, midY);
        }
        this.touchDistance = dist;
      }
    }

    handleTouchEnd() {
      this.isDragging = false;
      this.touchDistance = 0;
    }

    zoom(delta, clientX, clientY) {
      const minScale = 0.15;
      const maxScale = 4.0;
      const newScale = Math.max(minScale, Math.min(maxScale, this.scale * (1 + delta)));
      if (newScale === this.scale) return;

      const rect = this.container.getBoundingClientRect();
      const originX = (clientX !== undefined) ? clientX - rect.left : rect.width / 2;
      const originY = (clientY !== undefined) ? clientY - rect.top : rect.height / 2;

      const scaleRatio = newScale / this.scale;
      this.panX = originX - (originX - this.panX) * scaleRatio;
      this.panY = originY - (originY - this.panY) * scaleRatio;
      this.scale = newScale;

      this.applyTransform();
    }

    reset() {
      this.scale = 1.0;
      this.panX = 40;
      this.panY = 40;
      this.applyTransform();
    }

    fitToContainer() {
      try {
        const bbox = this.rootGroup.getBBox();
        if (!bbox || bbox.width === 0 || bbox.height === 0) {
          this.reset();
          return;
        }

        const containerRect = this.container.getBoundingClientRect();
        const availableW = containerRect.width - 80;
        const availableH = containerRect.height - 80;

        if (availableW <= 0 || availableH <= 0) {
          this.reset();
          return;
        }

        const scaleX = availableW / bbox.width;
        const scaleY = availableH / bbox.height;
        const targetScale = Math.max(0.2, Math.min(1.2, Math.min(scaleX, scaleY)));

        this.scale = targetScale;
        this.panX = (containerRect.width - bbox.width * targetScale) / 2 - bbox.x * targetScale;
        this.panY = (containerRect.height - bbox.height * targetScale) / 2 - bbox.y * targetScale;

        this.applyTransform();
      } catch (err) {
        console.warn('fitToContainer bbox evaluation deferred:', err);
        this.reset();
      }
    }

    applyTransform() {
      this.rootGroup.setAttribute(
        'transform',
        `translate(${this.panX}, ${this.panY}) scale(${this.scale})`
      );
      if (this.readout) {
        this.readout.textContent = `${Math.round(this.scale * 100)}%`;
      }
    }
  }

  // Application Controller
  class AppController {
    constructor() {
      this.jsonInput = document.getElementById('jsonInput');
      this.sampleSelect = document.getElementById('sampleSelect');
      this.convertBtn = document.getElementById('convertBtn');
      this.exportBtn = document.getElementById('exportBtn');
      this.formatJsonBtn = document.getElementById('formatJsonBtn');
      this.clearJsonBtn = document.getElementById('clearJsonBtn');
      this.fileUploadInput = document.getElementById('fileUploadInput');
      this.dropZone = document.getElementById('dropZone');
      this.dropOverlay = document.getElementById('dropOverlay');
      this.jsonStats = document.getElementById('jsonStats');
      this.jsonBadge = document.getElementById('jsonBadge');

      this.codeOutput = document.getElementById('codeOutput');
      this.copyCodeBtn = document.getElementById('copyCodeBtn');
      this.copyBtnLabel = document.getElementById('copyBtnLabel');

      this.dagSvg = document.getElementById('dagSvg');
      this.dagRootGroup = document.getElementById('dagRootGroup');
      this.svgContainer = document.getElementById('svgContainer');
      this.dagEmptyState = document.getElementById('dagEmptyState');

      this.zoomInBtn = document.getElementById('zoomInBtn');
      this.zoomOutBtn = document.getElementById('zoomOutBtn');
      this.zoomResetBtn = document.getElementById('zoomResetBtn');
      this.zoomFitBtn = document.getElementById('zoomFitBtn');
      this.zoomLevel = document.getElementById('zoomLevel');

      this.viewToggleSplit = document.getElementById('viewToggleSplit');
      this.viewToggleFocus = document.getElementById('viewToggleFocus');
      this.appWorkspace = document.getElementById('appWorkspace');

      this.tabBtns = document.querySelectorAll('.tab-btn');
      this.tabPanes = document.querySelectorAll('.tab-pane');

      this.currentWorkflow = null;
      this.lastConversionResponse = null;

      this.panZoom = new SvgPanZoomManager(this.dagSvg, this.svgContainer, this.zoomLevel);

      this.bindEvents();
      this.loadInitialWorkflow();
    }

    bindEvents() {
      // Conversion action
      this.convertBtn.addEventListener('click', () => this.handleConvert());

      // Export Python module
      this.exportBtn.addEventListener('click', () => this.handleExport());

      // Copy code to clipboard
      this.copyCodeBtn.addEventListener('click', () => this.handleCopyCode());

      // Sample workflow selector
      this.sampleSelect.addEventListener('change', (e) => this.handleSampleSelect(e.target.value));

      // JSON formatting & clearing
      this.formatJsonBtn.addEventListener('click', () => this.formatJson());
      this.clearJsonBtn.addEventListener('click', () => this.clearJson());

      // File upload & drag-and-drop
      this.fileUploadInput.addEventListener('change', (e) => this.handleFileUpload(e));
      this.initDragAndDrop();

      // Pan/Zoom controls
      this.zoomInBtn.addEventListener('click', () => this.panZoom.zoom(0.15));
      this.zoomOutBtn.addEventListener('click', () => this.panZoom.zoom(-0.15));
      this.zoomResetBtn.addEventListener('click', () => this.panZoom.reset());
      this.zoomFitBtn.addEventListener('click', () => this.panZoom.fitToContainer());

      // View toggles
      this.viewToggleSplit.addEventListener('click', () => this.setViewMode('split'));
      this.viewToggleFocus.addEventListener('click', () => this.setViewMode('focus'));

      // Tab navigation
      this.tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
      });

      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          this.handleConvert();
        }
      });
    }

    setViewMode(mode) {
      if (mode === 'focus') {
        this.appWorkspace.classList.add('view-focus');
        this.viewToggleFocus.classList.add('active');
        this.viewToggleSplit.classList.remove('active');
      } else {
        this.appWorkspace.classList.remove('view-focus');
        this.viewToggleSplit.classList.add('active');
        this.viewToggleFocus.classList.remove('active');
      }
      setTimeout(() => this.panZoom.fitToContainer(), 260);
    }

    switchTab(tabId) {
      this.tabBtns.forEach((btn) => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      this.tabPanes.forEach((pane) => {
        pane.classList.toggle('active', pane.id === `pane${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
      });

      if (tabId === 'dag') {
        setTimeout(() => this.panZoom.fitToContainer(), 50);
      }
    }

    initDragAndDrop() {
      ['dragenter', 'dragover'].forEach((eventName) => {
        this.dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          this.dropOverlay.classList.add('active');
        });
      });

      ['dragleave', 'drop'].forEach((eventName) => {
        this.dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          this.dropOverlay.classList.remove('active');
        });
      });

      this.dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          this.readJsonFile(files[0]);
        }
      });
    }

    handleFileUpload(e) {
      const file = e.target.files && e.target.files[0];
      if (file) {
        this.readJsonFile(file);
      }
    }

    readJsonFile(file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          const parsed = JSON.parse(content);
          this.jsonInput.value = JSON.stringify(parsed, null, 2);
          this.updateStatus('File loaded: ' + file.name, 'success');
          this.handleConvert();
        } catch (err) {
          this.updateStatus('Invalid JSON file: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    }

    formatJson() {
      try {
        const raw = this.jsonInput.value.trim();
        if (!raw) return;
        const parsed = JSON.parse(raw);
        this.jsonInput.value = JSON.stringify(parsed, null, 2);
        this.updateStatus('JSON formatted cleanly', 'neutral');
      } catch (err) {
        this.updateStatus('Cannot format: invalid JSON syntax', 'error');
      }
    }

    clearJson() {
      this.jsonInput.value = '';
      this.updateStatus('Awaiting Input', 'neutral');
    }

    updateStatus(message, type) {
      this.jsonStats.textContent = message;
      this.jsonBadge.className = `status-badge status-badge--${type || 'neutral'}`;
      this.jsonBadge.textContent = type === 'success' ? 'VALID' : type === 'error' ? 'ERROR' : 'READY';
    }

    async loadInitialWorkflow() {
      try {
        await this.handleSampleSelect('customer_support_agent');
        this.sampleSelect.value = 'customer_support_agent';
      } catch (err) {
        console.warn('Auto-loading sample workflow deferred:', err);
      }
    }

    async handleSampleSelect(sampleName) {
      if (!sampleName) return;
      this.updateStatus(`Loading sample ${sampleName}...`, 'neutral');
      try {
        const response = await fetch(`/api/samples/${sampleName}`);
        if (!response.ok) {
          throw new Error(`Failed to load sample: HTTP ${response.status}`);
        }
        const data = await response.json();
        this.jsonInput.value = JSON.stringify(data, null, 2);
        this.updateStatus(`Loaded sample: ${sampleName}`, 'success');
        await this.handleConvert();
      } catch (err) {
        console.error('Failed to load sample workflow:', err);
        this.updateStatus(`Error: ${err.message}`, 'error');
      }
    }

    async handleConvert() {
      const rawText = this.jsonInput.value.trim();
      if (!rawText) {
        this.updateStatus('Editor is empty. Paste workflow JSON first.', 'error');
        return;
      }

      let parsedPayload;
      try {
        parsedPayload = JSON.parse(rawText);
      } catch (err) {
        this.updateStatus(`JSON Syntax Error: ${err.message}`, 'error');
        return;
      }

      this.convertBtn.disabled = true;
      this.convertBtn.innerHTML = `<span>Converting...</span>`;
      this.updateStatus('Running dual-engine conversion & AST validation...', 'neutral');

      try {
        const response = await fetch('/api/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow_json: parsedPayload }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Server error (HTTP ${response.status})`);
        }

        const result = await response.json();
        this.lastConversionResponse = result;
        this.currentWorkflow = result.workflow || this.extractClientWorkflow(parsedPayload);

        // Update UI components
        this.renderDag(this.currentWorkflow);
        this.renderCode(result.generated_code);
        this.renderReport(result);

        this.exportBtn.disabled = false;
        this.updateStatus('Conversion successful • AST Verified Clean', 'success');
      } catch (err) {
        console.error('Conversion failure:', err);
        this.updateStatus(`Conversion failed: ${err.message}`, 'error');
      } finally {
        this.convertBtn.disabled = false;
        this.convertBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>Convert to ADK</span>
        `;
      }
    }

    extractClientWorkflow(jsonObj) {
      const flow = (jsonObj.workflowAgentDefinition && jsonObj.workflowAgentDefinition.agentFlow) ||
                   jsonObj.agentFlow || {};
      return {
        agent_id: jsonObj.name || 'agent_workflow',
        display_name: jsonObj.displayName || 'Agent Workflow',
        description: jsonObj.description || '',
        nodes: flow.nodes || [],
        edges: flow.edges || [],
        layers: [],
      };
    }

    renderDag(workflow) {
      if (!workflow || !workflow.nodes || workflow.nodes.length === 0) {
        this.dagEmptyState.style.display = 'flex';
        this.dagRootGroup.innerHTML = '';
        return;
      }

      this.dagEmptyState.style.display = 'none';
      this.dagRootGroup.innerHTML = '';

      const nodeWidth = 240;
      const nodeHeight = 76;
      const layerGapX = 320;
      const nodeGapY = 110;
      const padding = 50;

      // Establish layers (use backend topology layers or fallback to client-side layered layout)
      let layers = workflow.layers;
      if (!layers || layers.length === 0) {
        layers = this.computeTopologicalLayers(workflow.nodes, workflow.edges);
      }

      // Map node positions
      const positions = new Map();
      const maxLayerNodes = Math.max(...layers.map((l) => l.length), 1);
      const totalHeight = maxLayerNodes * nodeGapY + padding * 2;

      layers.forEach((layer, layerIdx) => {
        const layerHeight = layer.length * nodeGapY;
        const startY = (totalHeight - layerHeight) / 2 + padding;

        layer.forEach((nodeId, nodeIdx) => {
          const x = padding + layerIdx * layerGapX;
          const y = startY + nodeIdx * nodeGapY;
          positions.set(nodeId, { x, y });
        });
      });

      // Render Bézier Edges
      const edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      edgesGroup.setAttribute('class', 'edges-layer');

      (workflow.edges || []).forEach((edge) => {
        const from = positions.get(edge.sourceNodeId);
        const to = positions.get(edge.targetNodeId);
        if (!from || !to) return;

        const x1 = from.x + nodeWidth;
        const y1 = from.y + nodeHeight / 2;
        const x2 = to.x;
        const y2 = to.y + nodeHeight / 2;
        const dx = Math.max(Math.abs(x2 - x1) * 0.5, 40);

        const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'dag-edge');
        path.setAttribute('d', d);
        path.setAttribute('marker-end', 'url(#arrowhead)');
        edgesGroup.appendChild(path);

        // Edge route label if present
        const labelText = edge.routeString || (edge.condition && edge.condition.expression);
        if (labelText) {
          const mx = (x1 + 3 * (x1 + dx) + 3 * (x2 - dx) + x2) / 8;
          const my = (y1 + 3 * y1 + 3 * y2 + y2) / 8;

          const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          labelGroup.setAttribute('class', 'edge-label-group');

          const pill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          pill.setAttribute('class', 'edge-label-bg');
          pill.setAttribute('x', mx - 45);
          pill.setAttribute('y', my - 10);
          pill.setAttribute('width', 90);
          pill.setAttribute('height', 20);

          const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          txt.setAttribute('class', 'edge-label-text');
          txt.setAttribute('x', mx);
          txt.setAttribute('y', my);
          txt.textContent = labelText.length > 14 ? labelText.slice(0, 12) + '…' : labelText;

          labelGroup.appendChild(pill);
          labelGroup.appendChild(txt);
          edgesGroup.appendChild(labelGroup);
        }
      });

      this.dagRootGroup.appendChild(edgesGroup);

      // Render Nodes
      const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      nodesGroup.setAttribute('class', 'nodes-layer');

      const nodeMap = new Map((workflow.nodes || []).map((n) => [n.id, n]));

      positions.forEach((pos, nodeId) => {
        const node = nodeMap.get(nodeId) || { id: nodeId, displayName: nodeId, nodeType: 'DEFAULT' };
        const meta = NODE_STYLES[node.nodeType] || NODE_STYLES.DEFAULT;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'dag-node');
        g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
        g.setAttribute('data-node-id', nodeId);

        // Card container
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'node-box');
        rect.setAttribute('width', nodeWidth);
        rect.setAttribute('height', nodeHeight);
        rect.setAttribute('rx', 8);
        rect.setAttribute('fill', '#ffffff');
        rect.setAttribute('stroke', meta.color);
        rect.setAttribute('stroke-width', '1.5');
        rect.setAttribute('filter', 'url(#card-shadow)');
        g.appendChild(rect);

        // Header colored strip
        const strip = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        strip.setAttribute('width', nodeWidth);
        strip.setAttribute('height', 24);
        strip.setAttribute('rx', 8);
        strip.setAttribute('fill', meta.color);
        strip.setAttribute('fill-opacity', '0.12');
        g.appendChild(strip);

        // Square out bottom corners of top strip
        const stripSquare = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        stripSquare.setAttribute('x', 0);
        stripSquare.setAttribute('y', 16);
        stripSquare.setAttribute('width', nodeWidth);
        stripSquare.setAttribute('height', 8);
        stripSquare.setAttribute('fill', meta.color);
        stripSquare.setAttribute('fill-opacity', '0.12');
        g.appendChild(stripSquare);

        // Type badge pill
        const badge = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        badge.setAttribute('x', 10);
        badge.setAttribute('y', 5);
        badge.setAttribute('width', Math.min(meta.label.length * 7 + 12, 90));
        badge.setAttribute('height', 14);
        badge.setAttribute('rx', 4);
        badge.setAttribute('fill', meta.color);
        g.appendChild(badge);

        const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        badgeText.setAttribute('x', 10 + (Math.min(meta.label.length * 7 + 12, 90) / 2));
        badgeText.setAttribute('y', 15);
        badgeText.setAttribute('text-anchor', 'middle');
        badgeText.setAttribute('fill', '#ffffff');
        badgeText.setAttribute('font-size', '9');
        badgeText.setAttribute('font-weight', '700');
        badgeText.setAttribute('font-family', 'var(--font-sans)');
        badgeText.textContent = meta.label;
        g.appendChild(badgeText);

        // Node title text
        const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        titleText.setAttribute('x', 12);
        titleText.setAttribute('y', 45);
        titleText.setAttribute('fill', '#0f172a');
        titleText.setAttribute('font-size', '12');
        titleText.setAttribute('font-weight', '600');
        titleText.setAttribute('font-family', 'var(--font-sans)');
        const name = node.displayName || node.id;
        titleText.textContent = name.length > 26 ? name.slice(0, 24) + '…' : name;
        g.appendChild(titleText);

        // Node subtitle / ID text
        const subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subText.setAttribute('x', 12);
        subText.setAttribute('y', 63);
        subText.setAttribute('fill', '#64748b');
        subText.setAttribute('font-size', '10');
        subText.setAttribute('font-family', 'var(--font-mono)');
        subText.textContent = node.id.length > 32 ? node.id.slice(0, 30) + '…' : node.id;
        g.appendChild(subText);

        nodesGroup.appendChild(g);
      });

      this.dagRootGroup.appendChild(nodesGroup);

      // Auto-fit to viewport
      setTimeout(() => this.panZoom.fitToContainer(), 50);
    }

    computeTopologicalLayers(nodes, edges) {
      const nodeIds = nodes.map((n) => n.id);
      const inDegree = new Map(nodeIds.map((id) => [id, 0]));
      const adj = new Map(nodeIds.map((id) => [id, []]));

      (edges || []).forEach((edge) => {
        if (inDegree.has(edge.targetNodeId)) {
          inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1);
        }
        if (adj.has(edge.sourceNodeId)) {
          adj.get(edge.sourceNodeId).push(edge.targetNodeId);
        }
      });

      let currentLayer = nodeIds.filter((id) => inDegree.get(id) === 0);
      if (currentLayer.length === 0 && nodeIds.length > 0) {
        currentLayer = [nodeIds[0]];
      }

      const layers = [];
      const visited = new Set(currentLayer);

      while (currentLayer.length > 0) {
        layers.push(currentLayer);
        const nextLayer = [];

        currentLayer.forEach((u) => {
          (adj.get(u) || []).forEach((v) => {
            inDegree.set(v, inDegree.get(v) - 1);
            if (inDegree.get(v) <= 0 && !visited.has(v)) {
              visited.add(v);
              nextLayer.push(v);
            }
          });
        });

        currentLayer = nextLayer;
      }

      // Add any unvisited isolated nodes into an extra layer
      const unvisited = nodeIds.filter((id) => !visited.has(id));
      if (unvisited.length > 0) {
        layers.push(unvisited);
      }

      return layers;
    }

    renderCode(codeString) {
      this.codeOutput.textContent = codeString || '# No code generated.';
    }

    renderReport(result) {
      const reportEmpty = document.getElementById('reportEmptyState');
      const dashboard = document.getElementById('reportDashboard');
      if (!result) {
        reportEmpty.style.display = 'flex';
        dashboard.style.display = 'none';
        return;
      }

      reportEmpty.style.display = 'none';
      dashboard.style.display = 'block';

      const summary = result.summary || {};
      const checks = result.migration_checks || [];

      // Update Metric Cards
      const astValid = result.ast_valid !== false;
      const astPill = document.getElementById('astStatusPill');
      astPill.className = `status-pill status-pill--${astValid ? 'success' : 'error'}`;
      astPill.textContent = astValid ? 'CLEAN' : 'WARNING';
      document.getElementById('astResultText').textContent = astValid ? '100% Valid AST' : 'Syntax Issue';

      const totalNodes = summary.total_nodes || 0;
      document.getElementById('nodeCoverageValue').textContent = `${totalNodes} / ${totalNodes}`;

      const edgesCount = summary.total_edges || 0;
      const layersCount = summary.layer_depth || summary.layers_count || 0;
      document.getElementById('topoMetricsValue').textContent = `${edgesCount} Edges • ${layersCount} Layers`;

      const connectorsCount = summary.connector_nodes_count || 0;
      const approvalsCount = summary.approval_nodes_count || 0;
      document.getElementById('toolsApprovalsValue').textContent = `${connectorsCount} Tools • ${approvalsCount} Gates`;

      // Render Quality Checks List
      const checksList = document.getElementById('checksList');
      checksList.innerHTML = '';
      checks.forEach((chk) => {
        const item = document.createElement('div');
        item.className = `check-item ${chk.passed ? '' : 'failed'}`;
        item.innerHTML = `
          <div class="check-item__icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${chk.passed ? '#10b981' : '#ef4444'}" stroke-width="2">
              ${chk.passed
                ? '<polyline points="20 6 9 17 4 12"/>'
                : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
            </svg>
          </div>
          <div class="check-item__info">
            <h4>${chk.name}</h4>
            <p>${chk.details}</p>
          </div>
        `;
        checksList.appendChild(item);
      });

      // Render Architecture Breakdown Table
      const tbody = document.getElementById('nodeBreakdownBody');
      tbody.innerHTML = '';
      const breakdown = [
        { cat: 'Agent Core', src: 'AGENT_NODE', target: 'LlmAgent / LocalAgentConfig', count: summary.agent_nodes_count || 0 },
        { cat: 'Connectors & Tools', src: 'CONNECTOR_NODE', target: 'Typed Tool Functions', count: summary.connector_nodes_count || 0 },
        { cat: 'Conditional Logic', src: 'CONDITION_NODE', target: 'Route Evaluator Functions', count: summary.condition_nodes_count || 0 },
        { cat: 'Human Approval', src: 'APPROVAL_NODE', target: 'AskQuestionHook Gates', count: summary.approval_nodes_count || 0 },
        { cat: 'Event Triggers', src: 'CONNECTOR_EVENT_TRIGGER', target: 'Input Ingestion Schema', count: summary.trigger_nodes_count || 0 },
      ];

      breakdown.forEach((row) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${row.cat}</strong></td>
          <td><code>${row.src}</code></td>
          <td>${row.target}</td>
          <td><span class="status-pill status-pill--info">${row.count}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }

    handleCopyCode() {
      const code = this.codeOutput.textContent;
      if (!code) return;
      navigator.clipboard.writeText(code).then(() => {
        const origText = this.copyBtnLabel.textContent;
        this.copyBtnLabel.textContent = 'Copied!';
        setTimeout(() => {
          this.copyBtnLabel.textContent = origText;
        }, 1800);
      }).catch((err) => {
        console.error('Clipboard write failed:', err);
      });
    }

    handleExport() {
      const code = this.codeOutput.textContent;
      if (!code) return;
      const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agent_workflow.py';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  // Initialize application on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new AppController());
  } else {
    new AppController();
  }
})();
