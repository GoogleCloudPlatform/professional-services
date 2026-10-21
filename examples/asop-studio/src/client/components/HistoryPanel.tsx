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

import React, { useState } from 'react';
import { History, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { type SnapshotMetadata, hasChangesSinceLatestSnapshot } from '../utils/snapshots';
import YAML from 'yaml';

interface HistoryPanelProps {
  files: Record<string, string>;
  onCreateSnapshot: (name: string, description: string) => void;
  onClose: () => void;
}

export function HistoryPanel({ files, onCreateSnapshot, onClose }: HistoryPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDesc, setSnapshotDesc] = useState('');

  const isModified = hasChangesSinceLatestSnapshot(files);

  // Extract metadata from metadata.yml
  const metadataKey = '_snapshots/metadata.yml';
  let snapshotsList: SnapshotMetadata[] = [];
  if (files[metadataKey]) {
    try {
      const parsed = YAML.parse(files[metadataKey]);
      snapshotsList = parsed?.snapshots || [];
    } catch (e) {}
  }

  // Sort latest first for display
  const sortedSnapshots = [...snapshotsList].sort((a, b) => b.timestamp - a.timestamp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateSnapshot(snapshotName, snapshotDesc);
    setSnapshotName('');
    setSnapshotDesc('');
    setShowForm(false);
  };

  return (
    <div className="import-export-panel">
      <div className="inspector-header">
        <h2>
          <History size={18} />
          SOP History
        </h2>
        <button 
          onClick={onClose}
          className="close-inspector-btn"
          title="Close Panel"
        >
          Close
        </button>
      </div>

      <div className="inspector-content">
        <div className="inspector-section">
          <span className="inspector-section-title">Working Copy Status</span>
          <div className={`snapshot-status-card ${isModified ? 'modified' : 'clean'}`}>
            <div className="flex items-start gap-2">
              {isModified ? (
                <>
                  <AlertCircle className="text-[#f59e0b] shrink-0 mt-0.5" size={16} />
                  <div>
                    <strong className="text-[#f59e0b] text-sm">Unsaved Edits</strong>
                    <p className="text-xs text-muted mt-0.5">Your working copy has edits compared to the latest history snapshot.</p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="text-[#22c55e] shrink-0 mt-0.5" size={16} />
                  <div>
                    <strong className="text-[#22c55e] text-sm">Up to Date</strong>
                    <p className="text-xs text-muted mt-0.5">All edits have been captured in the latest snapshot.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="inspector-section">
          {showForm ? (
            <form onSubmit={handleSubmit} className="snapshot-form">
              <span className="inspector-section-title mb-2 block">Create Snapshot</span>
              <div className="form-group">
                <label htmlFor="snapshot-name-input" className="form-label">Snapshot Name</label>
                <input
                  id="snapshot-name-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Update node instructions"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group mt-2">
                <label htmlFor="snapshot-desc-input" className="form-label">Description (Optional)</label>
                <textarea
                  id="snapshot-desc-input"
                  className="form-textarea"
                  placeholder="Describe your changes..."
                  value={snapshotDesc}
                  onChange={(e) => setSnapshotDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={() => {
                    setShowForm(false);
                    setSnapshotName('');
                    setSnapshotDesc('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 flex items-center justify-center gap-1.5"
                  disabled={!isModified}
                >
                  Save Snapshot
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="btn btn-primary w-full flex items-center justify-center gap-1.5"
              disabled={!isModified}
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} />
              Create Snapshot
            </button>
          )}
        </div>

        <div className="inspector-section flex-1 overflow-hidden flex flex-col">
          <span className="inspector-section-title">History Log ({snapshotsList.length})</span>
          <div className="snapshots-history-list overflow-y-auto pr-1 flex-1 mt-2">
            {sortedSnapshots.length === 0 ? (
              <div className="snapshots-empty-state">No history found.</div>
            ) : (
              sortedSnapshots.map((snap) => (
                <div key={snap.id} className="snapshot-history-card">
                  <div className="snapshot-history-header">
                    <span className="snapshot-history-name" title={snap.name}>{snap.name}</span>
                    <span className="snapshot-history-time">
                      {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="snapshot-history-date">
                    {new Date(snap.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {snap.description && (
                    <p className="snapshot-history-description">{snap.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
