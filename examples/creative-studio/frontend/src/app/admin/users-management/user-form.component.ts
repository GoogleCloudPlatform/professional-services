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

import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {UserModel, UserRolesEnum} from '../../common/models/user.model';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode: boolean;
  availableRoles: UserRolesEnum[] = Object.values(UserRolesEnum);

  constructor(
    public dialogRef: MatDialogRef<UserFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {user: UserModel; isEditMode: boolean}, // Data passed to the dialog
    private fb: FormBuilder,
  ) {
    this.isEditMode = data.isEditMode;
    const user = data.user;

    this.userForm = this.fb.group({
      id: [user?.id],
      email: [{value: user?.email || '', disabled: true}, Validators.required],
      roles: [user?.roles || [], Validators.required],
    });
  }

  ngOnInit(): void {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.getRawValue()); // Pass the raw form value back to include disabled fields
    } else {
      this.userForm.markAllAsTouched(); // Show validation errors
    }
  }
}
