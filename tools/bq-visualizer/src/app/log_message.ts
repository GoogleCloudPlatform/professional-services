/**
 * log_message.ts used by logging service
 */
import * as StackTrace from 'stacktrace-js';

export class LogMessage {
  timestamp: Date;
  constructor(
      private severity: string,
      private message: string,
      private source: string,
      private stack: StackTrace.StackFrame[],
  ) {
    this.timestamp = new Date();
  }

  public toString(): string {
    return this.severity + ': ' + this.message + '. src=' + this.source;
  }
}
