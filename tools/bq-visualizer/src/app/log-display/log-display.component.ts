/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {Component, OnDestroy, OnInit} from '@angular/core';
import {PageEvent} from '@angular/material/paginator';
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
