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
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WorkspaceRole} from '../../models/workspace-member.model';

export interface InviteUserData {
  workspaceName: string;
}

@Component({
  selector: 'app-invite-user-modal',
  templateUrl: './invite-user-modal.component.html',
})
export class InviteUserModalComponent {
  inviteForm: FormGroup;
  roles = [WorkspaceRole.VIEWER, WorkspaceRole.EDITOR];

  constructor(
    public dialogRef: MatDialogRef<InviteUserModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InviteUserData,
    private fb: FormBuilder,
  ) {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: [WorkspaceRole.EDITOR, Validators.required],
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
