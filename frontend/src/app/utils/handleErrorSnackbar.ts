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

import {MatSnackBar} from '@angular/material/snack-bar';
import {ToastMessageComponent} from '../common/components/toast-message/toast-message.component';

export const handleErrorSnackbar: (
  snackBar: MatSnackBar,
  error: any,
  context: string,
) => void = (snackBar: MatSnackBar, error: any, context: string) => {
  console.error(`${context} error:`, error);
  const errorMessage =
    error?.error?.detail?.[0]?.msg ||
    error?.error?.detail ||
    error?.message ||
    'Something went wrong';

  snackBar.openFromComponent(ToastMessageComponent, {
    panelClass: ['red-toast'],
    verticalPosition: 'top',
    horizontalPosition: 'right',
    duration: 6000,
    data: {
      text: errorMessage,
      icon: 'cross-in-circle-white',
    },
  });
};

export const handleSuccessSnackbar: (
  snackBar: MatSnackBar,
  msg: any,
) => void = (snackBar: MatSnackBar, msg: any) => {
  snackBar.openFromComponent(ToastMessageComponent, {
    panelClass: ['green-toast'],
    verticalPosition: 'top',
    horizontalPosition: 'right',
    duration: 6000,
    data: {
      text: msg,
      matIcon: 'check_small',
    },
  });
};
