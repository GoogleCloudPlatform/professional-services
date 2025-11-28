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

import {Component, Inject, Input, Optional, Output, EventEmitter, ViewEncapsulation} from '@angular/core';
import {MatSnackBar, MAT_SNACK_BAR_DATA} from '@angular/material/snack-bar';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-toast-message',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './toast-message.component.html',
  styleUrls: ['./toast-message.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ToastMessageComponent {
  @Input() text: string = '';
  @Input() icon: string = '';
  @Input() matIcon: string = '';
  @Output() close = new EventEmitter<void>();

  constructor(
    @Optional() private _snackBar: MatSnackBar,
    @Optional() @Inject(MAT_SNACK_BAR_DATA) public snackBarData: any,
  ) {
    if (snackBarData) {
      this.text = snackBarData.text;
      this.icon = snackBarData.icon;
      this.matIcon = snackBarData.matIcon;
    }
  }

  closeToast() {
    if (this._snackBar) {
      this._snackBar.dismiss();
    }
    this.close.emit();
  }
}
