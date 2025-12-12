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
