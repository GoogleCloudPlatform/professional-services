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

import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-voice-dialog',
  templateUrl: './add-voice-dialog.component.html',
  styleUrls: ['./add-voice-dialog.component.scss']
})
export class AddVoiceDialogComponent {
  voiceName = '';
  file1: File | null = null;
  file2: File | null = null;

  constructor(public dialogRef: MatDialogRef<AddVoiceDialogComponent>) {}

  onFileSelected(event: any, sampleNum: number) {
    const file = event.target.files[0];
    if (file) {
      if (sampleNum === 1) this.file1 = file;
      else this.file2 = file;
    }
  }

  submit() {
    // Here you would usually create FormData to send to backend
    this.dialogRef.close({
      name: this.voiceName,
      sample1: this.file1,
      sample2: this.file2
    });
  }
}
