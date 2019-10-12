/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseOptions } from '../base_response_options';
import { ReadyState, RequestMethod, ResponseType } from '../enums';
import { ConnectionBackend } from '../interfaces';
import { Response } from '../static_response';
import { BrowserJsonp } from './browser_jsonp';
/** @type {?} */
const JSONP_ERR_NO_CALLBACK = 'JSONP injected script did not invoke callback.';
/** @type {?} */
const JSONP_ERR_WRONG_METHOD = 'JSONP requests must use GET request method.';
/**
 * Base class for an in-flight JSONP request.
 *
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 */
export class JSONPConnection {
    /**
     * \@internal
     * @param {?} req
     * @param {?} _dom
     * @param {?=} baseResponseOptions
     */
    constructor(req, _dom, baseResponseOptions) {
        this._dom = _dom;
        this.baseResponseOptions = baseResponseOptions;
        this._finished = false;
        if (req.method !== RequestMethod.Get) {
            throw new TypeError(JSONP_ERR_WRONG_METHOD);
        }
        this.request = req;
        this.response = new Observable((responseObserver) => {
            this.readyState = ReadyState.Loading;
            /** @type {?} */
            const id = this._id = _dom.nextRequestID();
            _dom.exposeConnection(id, this);
            /** @type {?} */
            const callback = _dom.requestCallback(this._id);
            /** @type {?} */
            let url = req.url;
            if (url.indexOf('=JSONP_CALLBACK&') > -1) {
                url = url.replace('=JSONP_CALLBACK&', `=${callback}&`);
            }
            else if (url.lastIndexOf('=JSONP_CALLBACK') === url.length - '=JSONP_CALLBACK'.length) {
                url = url.substring(0, url.length - '=JSONP_CALLBACK'.length) + `=${callback}`;
            }
            /** @type {?} */
            const script = this._script = _dom.build(url);
            /** @type {?} */
            const onLoad = (event) => {
                if (this.readyState === ReadyState.Cancelled)
                    return;
                this.readyState = ReadyState.Done;
                _dom.cleanup(script);
                if (!this._finished) {
                    /** @type {?} */
                    let responseOptions = new ResponseOptions({ body: JSONP_ERR_NO_CALLBACK, type: ResponseType.Error, url });
                    if (baseResponseOptions) {
                        responseOptions = baseResponseOptions.merge(responseOptions);
                    }
                    responseObserver.error(new Response(responseOptions));
                    return;
                }
                /** @type {?} */
                let responseOptions = new ResponseOptions({ body: this._responseData, url });
                if (this.baseResponseOptions) {
                    responseOptions = this.baseResponseOptions.merge(responseOptions);
                }
                responseObserver.next(new Response(responseOptions));
                responseObserver.complete();
            };
            /** @type {?} */
            const onError = (error) => {
                if (this.readyState === ReadyState.Cancelled)
                    return;
                this.readyState = ReadyState.Done;
                _dom.cleanup(script);
                /** @type {?} */
                let responseOptions = new ResponseOptions({ body: error.message, type: ResponseType.Error });
                if (baseResponseOptions) {
                    responseOptions = baseResponseOptions.merge(responseOptions);
                }
                responseObserver.error(new Response(responseOptions));
            };
            script.addEventListener('load', onLoad);
            script.addEventListener('error', onError);
            _dom.send(script);
            return () => {
                this.readyState = ReadyState.Cancelled;
                script.removeEventListener('load', onLoad);
                script.removeEventListener('error', onError);
                this._dom.cleanup(script);
            };
        });
    }
    /**
     * Callback called when the JSONP request completes, to notify the application
     * of the new data.
     * @param {?=} data
     * @return {?}
     */
    finished(data) {
        // Don't leak connections
        this._finished = true;
        this._dom.removeConnection(this._id);
        if (this.readyState === ReadyState.Cancelled)
            return;
        this._responseData = data;
    }
}
if (false) {
    /** @type {?} */
    JSONPConnection.prototype._id;
    /** @type {?} */
    JSONPConnection.prototype._script;
    /** @type {?} */
    JSONPConnection.prototype._responseData;
    /** @type {?} */
    JSONPConnection.prototype._finished;
    /**
     * The {\@link ReadyState} of this request.
     * @type {?}
     */
    JSONPConnection.prototype.readyState;
    /**
     * The outgoing HTTP request.
     * @type {?}
     */
    JSONPConnection.prototype.request;
    /**
     * An observable that completes with the response, when the request is finished.
     * @type {?}
     */
    JSONPConnection.prototype.response;
    /** @type {?} */
    JSONPConnection.prototype._dom;
    /** @type {?} */
    JSONPConnection.prototype.baseResponseOptions;
}
/**
 * A {\@link ConnectionBackend} that uses the JSONP strategy of making requests.
 *
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 */
export class JSONPBackend extends ConnectionBackend {
    /**
     * \@internal
     * @param {?} _browserJSONP
     * @param {?} _baseResponseOptions
     */
    constructor(_browserJSONP, _baseResponseOptions) {
        super();
        this._browserJSONP = _browserJSONP;
        this._baseResponseOptions = _baseResponseOptions;
    }
    /**
     * @param {?} request
     * @return {?}
     */
    createConnection(request) {
        return new JSONPConnection(request, this._browserJSONP, this._baseResponseOptions);
    }
}
JSONPBackend.decorators = [
    { type: Injectable }
];
/** @nocollapse */
JSONPBackend.ctorParameters = () => [
    { type: BrowserJsonp },
    { type: ResponseOptions }
];
if (false) {
    /** @type {?} */
    JSONPBackend.prototype._browserJSONP;
    /** @type {?} */
    JSONPBackend.prototype._baseResponseOptions;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbnBfYmFja2VuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2h0dHAvc3JjL2JhY2tlbmRzL2pzb25wX2JhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sRUFBQyxVQUFVLEVBQVcsTUFBTSxNQUFNLENBQUM7QUFFMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxVQUFVLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqRSxPQUFPLEVBQWEsaUJBQWlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFNUQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7QUFFN0MsTUFBTSxxQkFBcUIsR0FBRyxnREFBZ0QsQ0FBQzs7QUFDL0UsTUFBTSxzQkFBc0IsR0FBRyw2Q0FBNkMsQ0FBQzs7Ozs7OztBQVE3RSxNQUFNLE9BQU8sZUFBZTs7Ozs7OztJQXlCMUIsWUFDSSxHQUFZLEVBQVUsSUFBa0IsRUFBVSxtQkFBcUM7UUFBakUsU0FBSSxHQUFKLElBQUksQ0FBYztRQUFVLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBa0I7eUJBcEI5RCxLQUFLO1FBcUJoQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssYUFBYSxDQUFDLEdBQUcsRUFBRTtZQUNwQyxNQUFNLElBQUksU0FBUyxDQUFDLHNCQUFzQixDQUFDLENBQUM7U0FDN0M7UUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksVUFBVSxDQUFXLENBQUMsZ0JBQW9DLEVBQUUsRUFBRTtZQUVo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b0JBQXFDO1FBQzVGLEtBQUssRUFBRSxDQUFDO1FBRFUsa0JBQWEsR0FBYixhQUFhLENBQWM7UUFBVSx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQWlCO0tBRTdGOzs7OztJQUVELGdCQUFnQixDQUFDLE9BQWdCO1FBQy9CLE9BQU8sSUFBSSxlQUFlLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7S0FDcEY7OztZQVRGLFVBQVU7Ozs7WUFoSUgsWUFBWTtZQU5aLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIE9ic2VydmVyfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtSZXNwb25zZU9wdGlvbnN9IGZyb20gJy4uL2Jhc2VfcmVzcG9uc2Vfb3B0aW9ucyc7XG5pbXBvcnQge1JlYWR5U3RhdGUsIFJlcXVlc3RNZXRob2QsIFJlc3BvbnNlVHlwZX0gZnJvbSAnLi4vZW51bXMnO1xuaW1wb3J0IHtDb25uZWN0aW9uLCBDb25uZWN0aW9uQmFja2VuZH0gZnJvbSAnLi4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge1JlcXVlc3R9IGZyb20gJy4uL3N0YXRpY19yZXF1ZXN0JztcbmltcG9ydCB7UmVzcG9uc2V9IGZyb20gJy4uL3N0YXRpY19yZXNwb25zZSc7XG5cbmltcG9ydCB7QnJvd3Nlckpzb25wfSBmcm9tICcuL2Jyb3dzZXJfanNvbnAnO1xuXG5jb25zdCBKU09OUF9FUlJfTk9fQ0FMTEJBQ0sgPSAnSlNPTlAgaW5qZWN0ZWQgc2NyaXB0IGRpZCBub3QgaW52b2tlIGNhbGxiYWNrLic7XG5jb25zdCBKU09OUF9FUlJfV1JPTkdfTUVUSE9EID0gJ0pTT05QIHJlcXVlc3RzIG11c3QgdXNlIEdFVCByZXF1ZXN0IG1ldGhvZC4nO1xuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIGFuIGluLWZsaWdodCBKU09OUCByZXF1ZXN0LlxuICpcbiAqIEBkZXByZWNhdGVkIHNlZSBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaHR0cFxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgSlNPTlBDb25uZWN0aW9uIGltcGxlbWVudHMgQ29ubmVjdGlvbiB7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIF9pZCAhOiBzdHJpbmc7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIF9zY3JpcHQgITogRWxlbWVudDtcbiAgcHJpdmF0ZSBfcmVzcG9uc2VEYXRhOiBhbnk7XG4gIHByaXZhdGUgX2ZpbmlzaGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFRoZSB7QGxpbmsgUmVhZHlTdGF0ZX0gb2YgdGhpcyByZXF1ZXN0LlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHJlYWR5U3RhdGUgITogUmVhZHlTdGF0ZTtcblxuICAvKipcbiAgICogVGhlIG91dGdvaW5nIEhUVFAgcmVxdWVzdC5cbiAgICovXG4gIHJlcXVlc3Q6IFJlcXVlc3Q7XG5cbiAgLyoqXG4gICAqIEFuIG9ic2VydmFibGUgdGhhdCBjb21wbGV0ZXMgd2l0aCB0aGUgcmVzcG9uc2UsIHdoZW4gdGhlIHJlcXVlc3QgaXMgZmluaXNoZWQuXG4gICAqL1xuICByZXNwb25zZTogT2JzZXJ2YWJsZTxSZXNwb25zZT47XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHJlcTogUmVxdWVzdCwgcHJpdmF0ZSBfZG9tOiBCcm93c2VySnNvbnAsIHByaXZhdGUgYmFzZVJlc3BvbnNlT3B0aW9ucz86IFJlc3BvbnNlT3B0aW9ucykge1xuICAgIGlmIChyZXEubWV0aG9kICE9PSBSZXF1ZXN0TWV0aG9kLkdldCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihKU09OUF9FUlJfV1JPTkdfTUVUSE9EKTtcbiAgICB9XG4gICAgdGhpcy5yZXF1ZXN0ID0gcmVxO1xuICAgIHRoaXMucmVzcG9uc2UgPSBuZXcgT2JzZXJ2YWJsZTxSZXNwb25zZT4oKHJlc3BvbnNlT2JzZXJ2ZXI6IE9ic2VydmVyPFJlc3BvbnNlPikgPT4ge1xuXG4gICAgICB0aGlzLnJlYWR5U3RhdGUgPSBSZWFkeVN0YXRlLkxvYWRpbmc7XG4gICAgICBjb25zdCBpZCA9IHRoaXMuX2lkID0gX2RvbS5uZXh0UmVxdWVzdElEKCk7XG5cbiAgICAgIF9kb20uZXhwb3NlQ29ubmVjdGlvbihpZCwgdGhpcyk7XG5cbiAgICAgIC8vIFdvcmthcm91bmQgRGFydFxuICAgICAgLy8gdXJsID0gdXJsLnJlcGxhY2UoLz1KU09OUF9DQUxMQkFDSygmfCQpLywgYGdlbmVyYXRlZCBtZXRob2RgKTtcbiAgICAgIGNvbnN0IGNhbGxiYWNrID0gX2RvbS5yZXF1ZXN0Q2FsbGJhY2sodGhpcy5faWQpO1xuICAgICAgbGV0IHVybDogc3RyaW5nID0gcmVxLnVybDtcbiAgICAgIGlmICh1cmwuaW5kZXhPZignPUpTT05QX0NBTExCQUNLJicpID4gLTEpIHtcbiAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UoJz1KU09OUF9DQUxMQkFDSyYnLCBgPSR7Y2FsbGJhY2t9JmApO1xuICAgICAgfSBlbHNlIGlmICh1cmwubGFzdEluZGV4T2YoJz1KU09OUF9DQUxMQkFDSycpID09PSB1cmwubGVuZ3RoIC0gJz1KU09OUF9DQUxMQkFDSycubGVuZ3RoKSB7XG4gICAgICAgIHVybCA9IHVybC5zdWJzdHJpbmcoMCwgdXJsLmxlbmd0aCAtICc9SlNPTlBfQ0FMTEJBQ0snLmxlbmd0aCkgKyBgPSR7Y2FsbGJhY2t9YDtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2NyaXB0ID0gdGhpcy5fc2NyaXB0ID0gX2RvbS5idWlsZCh1cmwpO1xuXG4gICAgICBjb25zdCBvbkxvYWQgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IFJlYWR5U3RhdGUuQ2FuY2VsbGVkKSByZXR1cm47XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFJlYWR5U3RhdGUuRG9uZTtcbiAgICAgICAgX2RvbS5jbGVhbnVwKHNjcmlwdCk7XG4gICAgICAgIGlmICghdGhpcy5fZmluaXNoZWQpIHtcbiAgICAgICAgICBsZXQgcmVzcG9uc2VPcHRpb25zID1cbiAgICAgICAgICAgICAgbmV3IFJlc3BvbnNlT3B0aW9ucyh7Ym9keTogSlNPTlBfRVJSX05PX0NBTExCQUNLLCB0eXBlOiBSZXNwb25zZVR5cGUuRXJyb3IsIHVybH0pO1xuICAgICAgICAgIGlmIChiYXNlUmVzcG9uc2VPcHRpb25zKSB7XG4gICAgICAgICAgICByZXNwb25zZU9wdGlvbnMgPSBiYXNlUmVzcG9uc2VPcHRpb25zLm1lcmdlKHJlc3BvbnNlT3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc3BvbnNlT2JzZXJ2ZXIuZXJyb3IobmV3IFJlc3BvbnNlKHJlc3BvbnNlT3B0aW9ucykpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXNwb25zZU9wdGlvbnMgPSBuZXcgUmVzcG9uc2VPcHRpb25zKHtib2R5OiB0aGlzLl9yZXNwb25zZURhdGEsIHVybH0pO1xuICAgICAgICBpZiAodGhpcy5iYXNlUmVzcG9uc2VPcHRpb25zKSB7XG4gICAgICAgICAgcmVzcG9uc2VPcHRpb25zID0gdGhpcy5iYXNlUmVzcG9uc2VPcHRpb25zLm1lcmdlKHJlc3BvbnNlT3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXNwb25zZU9ic2VydmVyLm5leHQobmV3IFJlc3BvbnNlKHJlc3BvbnNlT3B0aW9ucykpO1xuICAgICAgICByZXNwb25zZU9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBvbkVycm9yID0gKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSBSZWFkeVN0YXRlLkNhbmNlbGxlZCkgcmV0dXJuO1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBSZWFkeVN0YXRlLkRvbmU7XG4gICAgICAgIF9kb20uY2xlYW51cChzY3JpcHQpO1xuICAgICAgICBsZXQgcmVzcG9uc2VPcHRpb25zID0gbmV3IFJlc3BvbnNlT3B0aW9ucyh7Ym9keTogZXJyb3IubWVzc2FnZSwgdHlwZTogUmVzcG9uc2VUeXBlLkVycm9yfSk7XG4gICAgICAgIGlmIChiYXNlUmVzcG9uc2VPcHRpb25zKSB7XG4gICAgICAgICAgcmVzcG9uc2VPcHRpb25zID0gYmFzZVJlc3BvbnNlT3B0aW9ucy5tZXJnZShyZXNwb25zZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3BvbnNlT2JzZXJ2ZXIuZXJyb3IobmV3IFJlc3BvbnNlKHJlc3BvbnNlT3B0aW9ucykpO1xuICAgICAgfTtcblxuICAgICAgc2NyaXB0LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBvbkxvYWQpO1xuICAgICAgc2NyaXB0LmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvcik7XG5cbiAgICAgIF9kb20uc2VuZChzY3JpcHQpO1xuXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBSZWFkeVN0YXRlLkNhbmNlbGxlZDtcbiAgICAgICAgc2NyaXB0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBvbkxvYWQpO1xuICAgICAgICBzY3JpcHQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCBvbkVycm9yKTtcbiAgICAgICAgdGhpcy5fZG9tLmNsZWFudXAoc2NyaXB0KTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGJhY2sgY2FsbGVkIHdoZW4gdGhlIEpTT05QIHJlcXVlc3QgY29tcGxldGVzLCB0byBub3RpZnkgdGhlIGFwcGxpY2F0aW9uXG4gICAqIG9mIHRoZSBuZXcgZGF0YS5cbiAgICovXG4gIGZpbmlzaGVkKGRhdGE/OiBhbnkpIHtcbiAgICAvLyBEb24ndCBsZWFrIGNvbm5lY3Rpb25zXG4gICAgdGhpcy5fZmluaXNoZWQgPSB0cnVlO1xuICAgIHRoaXMuX2RvbS5yZW1vdmVDb25uZWN0aW9uKHRoaXMuX2lkKTtcbiAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSBSZWFkeVN0YXRlLkNhbmNlbGxlZCkgcmV0dXJuO1xuICAgIHRoaXMuX3Jlc3BvbnNlRGF0YSA9IGRhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHtAbGluayBDb25uZWN0aW9uQmFja2VuZH0gdGhhdCB1c2VzIHRoZSBKU09OUCBzdHJhdGVneSBvZiBtYWtpbmcgcmVxdWVzdHMuXG4gKlxuICogQGRlcHJlY2F0ZWQgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9odHRwXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBKU09OUEJhY2tlbmQgZXh0ZW5kcyBDb25uZWN0aW9uQmFja2VuZCB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfYnJvd3NlckpTT05QOiBCcm93c2VySnNvbnAsIHByaXZhdGUgX2Jhc2VSZXNwb25zZU9wdGlvbnM6IFJlc3BvbnNlT3B0aW9ucykge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBjcmVhdGVDb25uZWN0aW9uKHJlcXVlc3Q6IFJlcXVlc3QpOiBKU09OUENvbm5lY3Rpb24ge1xuICAgIHJldHVybiBuZXcgSlNPTlBDb25uZWN0aW9uKHJlcXVlc3QsIHRoaXMuX2Jyb3dzZXJKU09OUCwgdGhpcy5fYmFzZVJlc3BvbnNlT3B0aW9ucyk7XG4gIH1cbn1cbiJdfQ==