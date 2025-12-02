import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService, Notification } from '../../services/notification.service';
import { Observable } from 'rxjs';
import { ToastMessageComponent } from '../toast-message/toast-message.component';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule, MatIconModule, ToastMessageComponent],
  templateUrl: './notification-container.component.html',
  styleUrls: ['./notification-container.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)', height: 0, marginBottom: 0 }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)', height: '*', marginBottom: '10px' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateX(0)', height: '*', marginBottom: '10px' }),
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(100%)', height: 0, marginBottom: 0, padding: 0 }))
      ])
    ])
  ]
})
export class NotificationContainerComponent implements OnInit {
  notifications$: Observable<Notification[]>;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
  }

  ngOnInit(): void {}

  remove(id: string) {
    this.notificationService.remove(id);
  }
}
