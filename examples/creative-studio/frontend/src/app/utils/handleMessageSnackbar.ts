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
import {AppInjector} from '../app-injector';
import {NotificationService} from '../common/services/notification.service';

export const handleErrorSnackbar: (
  snackBar: MatSnackBar,
  error: any,
  context: string,
  duration?: number,
) => void = (
  snackBar: MatSnackBar,
  error: any,
  context: string,
  duration: number = 20000,
) => {
  console.error(`${context} error:`, error);
  const errorMessage =
    error?.error?.detail?.[0]?.msg ||
    error?.error?.detail ||
    error?.message ||
    'Something went wrong';

  try {
    const notificationService = AppInjector.get(NotificationService);
    notificationService.show(
      errorMessage,
      'error',
      'cross-in-circle-white',
      undefined,
      duration,
    );
  } catch (e) {
    console.error('NotificationService not available', e);
  }
};

export const handleSuccessSnackbar: (
  snackBar: MatSnackBar,
  msg: any,
  duration?: number,
) => void = (snackBar: MatSnackBar, msg: any, duration?: number) => {
  try {
    const notificationService = AppInjector.get(NotificationService);
    notificationService.show(
      msg,
      'success',
      undefined,
      'check_small',
      duration,
    );
  } catch (e) {
    console.error('NotificationService not available', e);
  }
};

export const handleInfoSnackbar: (
  snackBar: MatSnackBar,
  msg: any,
  duration?: number,
) => void = (snackBar: MatSnackBar, msg: any, duration: number = 10000) => {
  try {
    const notificationService = AppInjector.get(NotificationService);
    notificationService.show(msg, 'info', undefined, 'info', duration);
  } catch (e) {
    console.error('NotificationService not available', e);
  }
};
