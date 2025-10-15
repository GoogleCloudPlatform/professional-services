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

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDividerModule} from '@angular/material/divider';

import {CreateWorkspaceModalComponent} from './components/create-workspace-modal/create-workspace-modal.component';
import {InviteUserModalComponent} from './components/invite-user-modal/invite-user-modal.component';
import {WorkspaceSwitcherComponent} from './components/workspace-switcher/workspace-switcher.component';
import {BrandGuidelineDialogComponent} from './components/brand-guideline-dialog/brand-guideline-dialog.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MarkdownModule} from 'ngx-markdown';

const DECLARATIONS = [
  CreateWorkspaceModalComponent,
  InviteUserModalComponent,
  WorkspaceSwitcherComponent,
  BrandGuidelineDialogComponent,
];

const MODULES = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  MatButtonModule,
  MatDialogModule,
  MatDividerModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatSelectModule,
  MatTooltipModule,
  MatProgressSpinnerModule,
  MarkdownModule.forRoot(),
];

const EXPORTED_MODULES = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  MatButtonModule,
  MatDialogModule,
  MatDividerModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatSelectModule,
  MatTooltipModule,
  MatProgressSpinnerModule,
  MarkdownModule,
];

@NgModule({
  declarations: [...DECLARATIONS],
  imports: [...MODULES],
  exports: [...DECLARATIONS, ...EXPORTED_MODULES],
})
export class SharedModule {}
