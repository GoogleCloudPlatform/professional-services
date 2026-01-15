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

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  icon?: string;
  matIcon?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  show(
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    icon?: string,
    matIcon?: string,
    duration?: number,
  ) {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = {id, message, type, icon, matIcon};
    this.notificationsSubject.next([
      ...this.notificationsSubject.value,
      notification,
    ]);

    if (duration) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  remove(id: string) {
    this.notificationsSubject.next(this.notificationsSubject.value.filter(n => n.id !== id));
  }
}
