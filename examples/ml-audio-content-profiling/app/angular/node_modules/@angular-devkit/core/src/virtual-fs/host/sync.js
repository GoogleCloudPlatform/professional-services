"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exception_1 = require("../../exception");
class SynchronousDelegateExpectedException extends exception_1.BaseException {
    constructor() { super(`Expected a synchronous delegate but got an asynchronous one.`); }
}
exports.SynchronousDelegateExpectedException = SynchronousDelegateExpectedException;
/**
 * Implement a synchronous-only host interface (remove the Observable parts).
 */
class SyncDelegateHost {
    constructor(_delegate) {
        this._delegate = _delegate;
        if (!_delegate.capabilities.synchronous) {
            throw new SynchronousDelegateExpectedException();
        }
    }
    _doSyncCall(observable) {
        let completed = false;
        let result = undefined;
        let errorResult = undefined;
        observable.subscribe({
            next(x) { result = x; },
            error(err) { errorResult = err; },
            complete() { completed = true; },
        });
        if (errorResult !== undefined) {
            throw errorResult;
        }
        if (!completed) {
            throw new SynchronousDelegateExpectedException();
        }
        // The non-null operation is to work around `void` type. We don't allow to return undefined
        // but ResultT could be void, which is undefined in JavaScript, so this doesn't change the
        // behaviour.
        // tslint:disable-next-line:no-non-null-assertion
        return result;
    }
    get capabilities() {
        return this._delegate.capabilities;
    }
    get delegate() {
        return this._delegate;
    }
    write(path, content) {
        return this._doSyncCall(this._delegate.write(path, content));
    }
    read(path) {
        return this._doSyncCall(this._delegate.read(path));
    }
    delete(path) {
        return this._doSyncCall(this._delegate.delete(path));
    }
    rename(from, to) {
        return this._doSyncCall(this._delegate.rename(from, to));
    }
    list(path) {
        return this._doSyncCall(this._delegate.list(path));
    }
    exists(path) {
        return this._doSyncCall(this._delegate.exists(path));
    }
    isDirectory(path) {
        return this._doSyncCall(this._delegate.isDirectory(path));
    }
    isFile(path) {
        return this._doSyncCall(this._delegate.isFile(path));
    }
    // Some hosts may not support stat.
    stat(path) {
        const result = this._delegate.stat(path);
        if (result) {
            return this._doSyncCall(result);
        }
        else {
            return null;
        }
    }
    watch(path, options) {
        return this._delegate.watch(path, options);
    }
}
exports.SyncDelegateHost = SyncDelegateHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3luYy5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvdmlydHVhbC1mcy9ob3N0L3N5bmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSwrQ0FBZ0Q7QUFhaEQsTUFBYSxvQ0FBcUMsU0FBUSx5QkFBYTtJQUNyRSxnQkFBZ0IsS0FBSyxDQUFDLDhEQUE4RCxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3pGO0FBRkQsb0ZBRUM7QUFFRDs7R0FFRztBQUNILE1BQWEsZ0JBQWdCO0lBQzNCLFlBQXNCLFNBQWtCO1FBQWxCLGNBQVMsR0FBVCxTQUFTLENBQVM7UUFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFO1lBQ3ZDLE1BQU0sSUFBSSxvQ0FBb0MsRUFBRSxDQUFDO1NBQ2xEO0lBQ0gsQ0FBQztJQUVTLFdBQVcsQ0FBVSxVQUErQjtRQUM1RCxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdEIsSUFBSSxNQUFNLEdBQXdCLFNBQVMsQ0FBQztRQUM1QyxJQUFJLFdBQVcsR0FBc0IsU0FBUyxDQUFDO1FBQy9DLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFDbkIsSUFBSSxDQUFDLENBQVUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQyxLQUFLLENBQUMsR0FBVSxJQUFJLFdBQVcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLFFBQVEsS0FBSyxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUNqQyxDQUFDLENBQUM7UUFFSCxJQUFJLFdBQVcsS0FBSyxTQUFTLEVBQUU7WUFDN0IsTUFBTSxXQUFXLENBQUM7U0FDbkI7UUFDRCxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2QsTUFBTSxJQUFJLG9DQUFvQyxFQUFFLENBQUM7U0FDbEQ7UUFFRCwyRkFBMkY7UUFDM0YsMEZBQTBGO1FBQzFGLGFBQWE7UUFDYixpREFBaUQ7UUFDakQsT0FBTyxNQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVELElBQUksWUFBWTtRQUNkLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUM7SUFDckMsQ0FBQztJQUNELElBQUksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQVUsRUFBRSxPQUF1QjtRQUN2QyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUNELElBQUksQ0FBQyxJQUFVO1FBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFVO1FBQ2YsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFVLEVBQUUsRUFBUTtRQUN6QixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFVO1FBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELE1BQU0sQ0FBQyxJQUFVO1FBQ2YsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUNELFdBQVcsQ0FBQyxJQUFVO1FBQ3BCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFDRCxNQUFNLENBQUMsSUFBVTtRQUNmLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxtQ0FBbUM7SUFDbkMsSUFBSSxDQUFDLElBQVU7UUFDYixNQUFNLE1BQU0sR0FBdUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFN0UsSUFBSSxNQUFNLEVBQUU7WUFDVixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDakM7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLElBQVUsRUFBRSxPQUEwQjtRQUMxQyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM3QyxDQUFDO0NBQ0Y7QUEvRUQsNENBK0VDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJy4uLy4uL2V4Y2VwdGlvbic7XG5pbXBvcnQgeyBQYXRoLCBQYXRoRnJhZ21lbnQgfSBmcm9tICcuLi9wYXRoJztcbmltcG9ydCB7XG4gIEZpbGVCdWZmZXIsXG4gIEZpbGVCdWZmZXJMaWtlLFxuICBIb3N0LFxuICBIb3N0Q2FwYWJpbGl0aWVzLFxuICBIb3N0V2F0Y2hFdmVudCxcbiAgSG9zdFdhdGNoT3B0aW9ucyxcbiAgU3RhdHMsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcblxuXG5leHBvcnQgY2xhc3MgU3luY2hyb25vdXNEZWxlZ2F0ZUV4cGVjdGVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKCkgeyBzdXBlcihgRXhwZWN0ZWQgYSBzeW5jaHJvbm91cyBkZWxlZ2F0ZSBidXQgZ290IGFuIGFzeW5jaHJvbm91cyBvbmUuYCk7IH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnQgYSBzeW5jaHJvbm91cy1vbmx5IGhvc3QgaW50ZXJmYWNlIChyZW1vdmUgdGhlIE9ic2VydmFibGUgcGFydHMpLlxuICovXG5leHBvcnQgY2xhc3MgU3luY0RlbGVnYXRlSG9zdDxUIGV4dGVuZHMgb2JqZWN0ID0ge30+IHtcbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIF9kZWxlZ2F0ZTogSG9zdDxUPikge1xuICAgIGlmICghX2RlbGVnYXRlLmNhcGFiaWxpdGllcy5zeW5jaHJvbm91cykge1xuICAgICAgdGhyb3cgbmV3IFN5bmNocm9ub3VzRGVsZWdhdGVFeHBlY3RlZEV4Y2VwdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBfZG9TeW5jQ2FsbDxSZXN1bHRUPihvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFJlc3VsdFQ+KTogUmVzdWx0VCB7XG4gICAgbGV0IGNvbXBsZXRlZCA9IGZhbHNlO1xuICAgIGxldCByZXN1bHQ6IFJlc3VsdFQgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgbGV0IGVycm9yUmVzdWx0OiBFcnJvciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBvYnNlcnZhYmxlLnN1YnNjcmliZSh7XG4gICAgICBuZXh0KHg6IFJlc3VsdFQpIHsgcmVzdWx0ID0geDsgfSxcbiAgICAgIGVycm9yKGVycjogRXJyb3IpIHsgZXJyb3JSZXN1bHQgPSBlcnI7IH0sXG4gICAgICBjb21wbGV0ZSgpIHsgY29tcGxldGVkID0gdHJ1ZTsgfSxcbiAgICB9KTtcblxuICAgIGlmIChlcnJvclJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBlcnJvclJlc3VsdDtcbiAgICB9XG4gICAgaWYgKCFjb21wbGV0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBTeW5jaHJvbm91c0RlbGVnYXRlRXhwZWN0ZWRFeGNlcHRpb24oKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgbm9uLW51bGwgb3BlcmF0aW9uIGlzIHRvIHdvcmsgYXJvdW5kIGB2b2lkYCB0eXBlLiBXZSBkb24ndCBhbGxvdyB0byByZXR1cm4gdW5kZWZpbmVkXG4gICAgLy8gYnV0IFJlc3VsdFQgY291bGQgYmUgdm9pZCwgd2hpY2ggaXMgdW5kZWZpbmVkIGluIEphdmFTY3JpcHQsIHNvIHRoaXMgZG9lc24ndCBjaGFuZ2UgdGhlXG4gICAgLy8gYmVoYXZpb3VyLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICByZXR1cm4gcmVzdWx0ICE7XG4gIH1cblxuICBnZXQgY2FwYWJpbGl0aWVzKCk6IEhvc3RDYXBhYmlsaXRpZXMge1xuICAgIHJldHVybiB0aGlzLl9kZWxlZ2F0ZS5jYXBhYmlsaXRpZXM7XG4gIH1cbiAgZ2V0IGRlbGVnYXRlKCkge1xuICAgIHJldHVybiB0aGlzLl9kZWxlZ2F0ZTtcbiAgfVxuXG4gIHdyaXRlKHBhdGg6IFBhdGgsIGNvbnRlbnQ6IEZpbGVCdWZmZXJMaWtlKTogdm9pZCB7XG4gICAgcmV0dXJuIHRoaXMuX2RvU3luY0NhbGwodGhpcy5fZGVsZWdhdGUud3JpdGUocGF0aCwgY29udGVudCkpO1xuICB9XG4gIHJlYWQocGF0aDogUGF0aCk6IEZpbGVCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHRoaXMuX2RlbGVnYXRlLnJlYWQocGF0aCkpO1xuICB9XG4gIGRlbGV0ZShwYXRoOiBQYXRoKTogdm9pZCB7XG4gICAgcmV0dXJuIHRoaXMuX2RvU3luY0NhbGwodGhpcy5fZGVsZWdhdGUuZGVsZXRlKHBhdGgpKTtcbiAgfVxuICByZW5hbWUoZnJvbTogUGF0aCwgdG86IFBhdGgpOiB2b2lkIHtcbiAgICByZXR1cm4gdGhpcy5fZG9TeW5jQ2FsbCh0aGlzLl9kZWxlZ2F0ZS5yZW5hbWUoZnJvbSwgdG8pKTtcbiAgfVxuXG4gIGxpc3QocGF0aDogUGF0aCk6IFBhdGhGcmFnbWVudFtdIHtcbiAgICByZXR1cm4gdGhpcy5fZG9TeW5jQ2FsbCh0aGlzLl9kZWxlZ2F0ZS5saXN0KHBhdGgpKTtcbiAgfVxuXG4gIGV4aXN0cyhwYXRoOiBQYXRoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2RvU3luY0NhbGwodGhpcy5fZGVsZWdhdGUuZXhpc3RzKHBhdGgpKTtcbiAgfVxuICBpc0RpcmVjdG9yeShwYXRoOiBQYXRoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2RvU3luY0NhbGwodGhpcy5fZGVsZWdhdGUuaXNEaXJlY3RvcnkocGF0aCkpO1xuICB9XG4gIGlzRmlsZShwYXRoOiBQYXRoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2RvU3luY0NhbGwodGhpcy5fZGVsZWdhdGUuaXNGaWxlKHBhdGgpKTtcbiAgfVxuXG4gIC8vIFNvbWUgaG9zdHMgbWF5IG5vdCBzdXBwb3J0IHN0YXQuXG4gIHN0YXQocGF0aDogUGF0aCk6IFN0YXRzPFQ+IHwgbnVsbCB7XG4gICAgY29uc3QgcmVzdWx0OiBPYnNlcnZhYmxlPFN0YXRzPFQ+IHwgbnVsbD4gfCBudWxsID0gdGhpcy5fZGVsZWdhdGUuc3RhdChwYXRoKTtcblxuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHdhdGNoKHBhdGg6IFBhdGgsIG9wdGlvbnM/OiBIb3N0V2F0Y2hPcHRpb25zKTogT2JzZXJ2YWJsZTxIb3N0V2F0Y2hFdmVudD4gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fZGVsZWdhdGUud2F0Y2gocGF0aCwgb3B0aW9ucyk7XG4gIH1cbn1cbiJdfQ==