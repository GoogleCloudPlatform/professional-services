/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Component, Inject} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {BrandGuidelineModel} from '../../models/brand-guideline.model';

export interface BrandGuidelineDialogData {
  workspaceId: string;
  guideline: BrandGuidelineModel | null;
  canEdit: boolean;
}

@Component({
  selector: 'app-brand-guideline-dialog',
  templateUrl: './brand-guideline-dialog.component.html',
  styleUrls: ['./brand-guideline-dialog.component.scss'],
})
export class BrandGuidelineDialogComponent {
  form: FormGroup;
  isUploading = false;
  isEditing = false;
  fileName: string | null = null;
  isToneOfVoiceExpanded = false;
  isVisualStyleExpanded = false;

  constructor(
    public dialogRef: MatDialogRef<BrandGuidelineDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BrandGuidelineDialogData,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {
    this.isEditing = !!this.data.guideline;
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      file: [null, Validators.required],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const maxSize = 50 * 1024 * 1024; // 50MB

      if (file.size > maxSize) {
        this.snackBar.open('File size cannot exceed 50MB.', 'OK', {
          duration: 5000,
        });
        this.form.get('file')?.setValue(null);
        this.fileName = null;
        input.value = ''; // Reset file input to allow re-selection of the same file
        return;
      }

      this.form.patchValue({file: file});
      this.fileName = file.name;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onUpload(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onDelete(): void {
    this.dialogRef.close({delete: true});
  }

  replaceGuideline(): void {
    this.isEditing = false;
  }

  toggleToneOfVoiceExpansion(): void {
    this.isToneOfVoiceExpanded = !this.isToneOfVoiceExpanded;
  }

  toggleVisualStyleExpansion(): void {
    this.isVisualStyleExpanded = !this.isVisualStyleExpanded;
  }
}
