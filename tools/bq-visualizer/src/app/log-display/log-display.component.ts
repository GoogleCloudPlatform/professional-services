import {Component, OnDestroy, OnInit} from '@angular/core';
import {PageEvent} from '@angular/material';
import {Subject, Subscription} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {LogService} from '../log.service';
import {LogMessage} from '../log_message';

@Component({
  selector: 'app-log-display',
  templateUrl: './log-display.component.html',
  styleUrls: ['./log-display.component.css']
})
export class LogDisplayComponent implements OnInit, OnDestroy {
  private readonly subscriptions = new Subscription();

  messages: LogMessage[];
  paginatedMessages: LogMessage[];
  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [
    5,
    10,
    25,
    100,
  ];
  readonly displayedColumns = [
    'severity',
    'timestamp',
    'source',
    'message',
  ];
  private readonly destroy = new Subject<void>();

  constructor(public logSvc: LogService) {}

  ngOnInit() {
    this.logSvc.messagesSubject$.pipe(takeUntil(this.destroy))
        .subscribe(
            messages => {
              this.messages = messages;
              this.paginateMessages(this.pageIndex, this.pageSize);
            },
            error => {
              console.log(error);
            });
    this.messages = this.logSvc.getMessages();
    this.paginateMessages(this.pageIndex, this.pageSize);
  }

  ngOnDestroy() {
    this.destroy.next();
  }

  switchPage(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.paginateMessages(event.pageIndex, event.pageSize);
  }

  private paginateMessages(pageIndex: number, pageSize: number) {
    this.paginatedMessages =
        this.messages.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  }
}
