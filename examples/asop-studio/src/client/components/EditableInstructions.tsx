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

import React, { useState, useEffect, useRef } from 'react';

interface EditableInstructionsProps {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  textareaClassName?: string;
}

export function EditableInstructions({
  value,
  onSave,
  placeholder = "Type instructions here...",
  className = "inspector-instruction-box",
  textareaClassName = "inspector-instruction-textarea"
}: EditableInstructionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  // Sync internal state when prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus textarea and adjust height when entering edit mode or typing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      if (editValue === value) {
        // Set selection range to end of text only on initial edit start
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
      
      // Auto-resize
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const targetHeight = measuredHeight ? Math.max(measuredHeight, scrollHeight) : scrollHeight;
      textareaRef.current.style.height = `${targetHeight + 2}px`;
    }
  }, [isEditing, editValue, measuredHeight, value]);

  const handleBlur = () => {
    setIsEditing(false);
    onSave(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      textareaRef.current?.blur();
    }
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        className={textareaClassName}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
    );
  }

  const handleStartEdit = (e: React.MouseEvent<HTMLDivElement>) => {
    setMeasuredHeight(e.currentTarget.offsetHeight);
    setIsEditing(true);
  };

  return (
    <div
      className={`${className} editable ${!value ? 'empty' : ''}`}
      onClick={handleStartEdit}
      title="Click to edit (Ctrl/Cmd+Enter to save)"
    >
      {value ? (
        value
      ) : (
        <span className="inspector-instruction-placeholder">
          {placeholder}
        </span>
      )}
    </div>
  );
}
