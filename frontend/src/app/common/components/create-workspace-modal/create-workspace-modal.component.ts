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

import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {FormControl, Validators} from '@angular/forms';

@Component({
  selector: 'app-create-workspace-modal',
  templateUrl: './create-workspace-modal.component.html',
})
export class CreateWorkspaceModalComponent {
  workspaceName = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
  ]);

  constructor(public dialogRef: MatDialogRef<CreateWorkspaceModalComponent>) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  getErrorMessage() {
    if (this.workspaceName.hasError('required')) {
      return 'You must enter a name';
    }
    if (this.workspaceName.hasError('minlength')) {
      return 'Name must be at least 3 characters long';
    }
    return '';
  }

  create(): void {
    if (this.workspaceName.valid) {
      this.dialogRef.close(this.workspaceName.value);
    }
  }
}
