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
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import * as StackTrace from 'stacktrace-js';
import {environment} from '../environments/environment';

import {LogMessage} from './log_message';
import { localservices } from 'googleapis/build/src/apis/localservices';

@Injectable({providedIn: 'root'})
export class LogService {
  private messagesSubject = new Subject<LogMessage[]>();
  public messagesSubject$ = this.messagesSubject.asObservable();
  private messages: LogMessage[] = [];
  private logToConsole = environment.name != 'test';

  constructor(){
    const logs = localStorage.getItem('logs')||"";
    //console.log(logs) 
    const asarr = '[' + logs + '{}]'
    try {
      const parsedmessages:any[] = JSON.parse(asarr);
      //console.log(messages) ;
      this.messages = parsedmessages.map((rec) => new LogMessage(rec.severity, rec.message, rec.source));
    } catch(e:any){
       //console.log(asarr)
      console.error(e);
    }
  }
   
  public getMessages() {
    return this.messages;
  }

  public clear() {
    this.messages.length = 0;
    this.messagesSubject.next(this.messages);
    if (!environment.production){
      localStorage.removeItem('logs');
    }
  }

  private async mkMessage(severity: string, msg: string): Promise<any> {
    const trace = await StackTrace.get()
    // Shift off the generated promise wrappers.
    for (let i = 0; i < 11; i++) {
      if (trace[0].fileName.match(/.*(main|zone)\.js$/) ||
          trace[0].fileName.match(/.*\/node_modules\/.*/)) {
        trace.shift();
      } else {
        break;
      }
    }

    const fn = trace[0].fileName.replace('webpack://', '');
    const message = new LogMessage(
        severity, msg,
        `${trace[0].functionName} (${fn}:${trace[0].lineNumber})`);
    this.messages.push(message);
    this.messagesSubject.next(this.messages);
    if (this.logToConsole) {
      console.log(message.toString());
    }
    if (!environment.production){
      let logs = localStorage.getItem('logs')||"";
      logs  += JSON.stringify(message, null, 2) +',';
      localStorage.setItem('logs', logs);
    }
  }

  public async info(msg: string): Promise<any> {
    return this.mkMessage('INFO', msg);
  }

  public async debug(msg: string): Promise<any> {
    return this.mkMessage('DEBUG', msg);
  }

  public async warn(msg: string): Promise<any> {
    return this.mkMessage('WARN', msg);
  }

  public async error(msg: string): Promise<any> {
    return this.mkMessage('ERROR', msg);
  }

  public async fatal(msg: string): Promise<any> {
    return this.mkMessage('FATAL', msg);
  }
}
