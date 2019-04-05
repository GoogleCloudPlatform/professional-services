import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import * as StackTrace from 'stacktrace-js';
import {environment} from '../environments/environment';

import {LogMessage} from './log_message';

@Injectable({providedIn: 'root'})
export class LogService {
  private messagesSubject = new Subject<LogMessage[]>();
  public messagesSubject$ = this.messagesSubject.asObservable();
  private messages: LogMessage[] = [];
  private logToConsole = environment.name != 'test';

  public getMessages() {
    return this.messages;
  }

  public clear() {
    this.messages.length = 0;
    this.messagesSubject.next(this.messages);
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
        `${trace[0].functionName} (${fn}:${trace[0].lineNumber})`, trace);
    this.messages.push(message);
    this.messagesSubject.next(this.messages);
    if (this.logToConsole) {
      console.log(message.toString());
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
