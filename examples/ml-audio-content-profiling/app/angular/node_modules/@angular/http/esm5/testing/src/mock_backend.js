/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Injectable } from '@angular/core';
import { ReadyState, Request } from '@angular/http';
import { ReplaySubject, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
/**
 *
 * Mock Connection to represent a {@link Connection} for tests.
 *
 * @usageNotes
 * ### Example of `mockRespond()`
 *
 * ```
 * var connection;
 * backend.connections.subscribe(c => connection = c);
 * http.request('data.json').subscribe(res => console.log(res.text()));
 * connection.mockRespond(new Response(new ResponseOptions({ body: 'fake response' }))); //logs
 * 'fake response'
 * ```
 *
 * ### Example of `mockError()`
 *
 * ```
 * var connection;
 * backend.connections.subscribe(c => connection = c);
 * http.request('data.json').subscribe(res => res, err => console.log(err)));
 * connection.mockError(new Error('error'));
 * ```
 *
 * @deprecated see https://angular.io/guide/http
 * @publicApi
 */
var MockConnection = /** @class */ (function () {
    function MockConnection(req) {
        this.response = new ReplaySubject(1).pipe(take(1));
        this.readyState = ReadyState.Open;
        this.request = req;
    }
    /**
     * Sends a mock response to the connection. This response is the value that is emitted to the
     * {@link EventEmitter} returned by {@link Http}.
     *
     */
    MockConnection.prototype.mockRespond = function (res) {
        if (this.readyState === ReadyState.Done || this.readyState === ReadyState.Cancelled) {
            throw new Error('Connection has already been resolved');
        }
        this.readyState = ReadyState.Done;
        this.response.next(res);
        this.response.complete();
    };
    /**
     * Not yet implemented!
     *
     * Sends the provided {@link Response} to the `downloadObserver` of the `Request`
     * associated with this connection.
     */
    MockConnection.prototype.mockDownload = function (res) {
        // this.request.downloadObserver.onNext(res);
        // if (res.bytesLoaded === res.totalBytes) {
        //   this.request.downloadObserver.onCompleted();
        // }
    };
    // TODO(jeffbcross): consider using Response type
    /**
     * Emits the provided error object as an error to the {@link Response} {@link EventEmitter}
     * returned
     * from {@link Http}.
     *
     */
    MockConnection.prototype.mockError = function (err) {
        // Matches ResourceLoader semantics
        this.readyState = ReadyState.Done;
        this.response.error(err);
    };
    return MockConnection;
}());
export { MockConnection };
/**
 * A mock backend for testing the {@link Http} service.
 *
 * This class can be injected in tests, and should be used to override providers
 * to other backends, such as {@link XHRBackend}.
 *
 * @usageNotes
 * ### Example
 *
 * ```
 * import {Injectable, Injector} from '@angular/core';
 * import {async, fakeAsync, tick} from '@angular/core/testing';
 * import {BaseRequestOptions, ConnectionBackend, Http, RequestOptions} from '@angular/http';
 * import {Response, ResponseOptions} from '@angular/http';
 * import {MockBackend, MockConnection} from '@angular/http/testing';
 *
 * const HERO_ONE = 'HeroNrOne';
 * const HERO_TWO = 'WillBeAlwaysTheSecond';
 *
 * @Injectable()
 * class HeroService {
 *   constructor(private http: Http) {}
 *
 *   getHeroes(): Promise<String[]> {
 *     return this.http.get('myservices.de/api/heroes')
 *         .toPromise()
 *         .then(response => response.json().data)
 *         .catch(e => this.handleError(e));
 *   }
 *
 *   private handleError(error: any): Promise<any> {
 *     console.error('An error occurred', error);
 *     return Promise.reject(error.message || error);
 *   }
 * }
 *
 * describe('MockBackend HeroService Example', () => {
 *   beforeEach(() => {
 *     this.injector = Injector.create([
 *       {provide: ConnectionBackend, useClass: MockBackend},
 *       {provide: RequestOptions, useClass: BaseRequestOptions},
 *       Http,
 *       HeroService,
 *     ]);
 *     this.heroService = this.injector.get(HeroService);
 *     this.backend = this.injector.get(ConnectionBackend) as MockBackend;
 *     this.backend.connections.subscribe((connection: any) => this.lastConnection = connection);
 *   });
 *
 *   it('getHeroes() should query current service url', () => {
 *     this.heroService.getHeroes();
 *     expect(this.lastConnection).toBeDefined('no http service connection at all?');
 *     expect(this.lastConnection.request.url).toMatch(/api\/heroes$/, 'url invalid');
 *   });
 *
 *   it('getHeroes() should return some heroes', fakeAsync(() => {
 *        let result: String[];
 *        this.heroService.getHeroes().then((heroes: String[]) => result = heroes);
 *        this.lastConnection.mockRespond(new Response(new ResponseOptions({
 *          body: JSON.stringify({data: [HERO_ONE, HERO_TWO]}),
 *        })));
 *        tick();
 *        expect(result.length).toEqual(2, 'should contain given amount of heroes');
 *        expect(result[0]).toEqual(HERO_ONE, ' HERO_ONE should be the first hero');
 *        expect(result[1]).toEqual(HERO_TWO, ' HERO_TWO should be the second hero');
 *      }));
 *
 *   it('getHeroes() while server is down', fakeAsync(() => {
 *        let result: String[];
 *        let catchedError: any;
 *        this.heroService.getHeroes()
 *            .then((heroes: String[]) => result = heroes)
 *            .catch((error: any) => catchedError = error);
 *        this.lastConnection.mockError(new Response(new ResponseOptions({
 *          status: 404,
 *          statusText: 'URL not Found',
 *        })));
 *        tick();
 *        expect(result).toBeUndefined();
 *        expect(catchedError).toBeDefined();
 *      }));
 * });
 * ```
 *
 * @deprecated see https://angular.io/guide/http
 * @publicApi
 */
var MockBackend = /** @class */ (function () {
    function MockBackend() {
        var _this = this;
        this.connectionsArray = [];
        this.connections = new Subject();
        this.connections.subscribe(function (connection) { return _this.connectionsArray.push(connection); });
        this.pendingConnections = new Subject();
    }
    /**
     * Checks all connections, and raises an exception if any connection has not received a response.
     *
     * This method only exists in the mock implementation, not in real Backends.
     */
    MockBackend.prototype.verifyNoPendingRequests = function () {
        var pending = 0;
        this.pendingConnections.subscribe(function (c) { return pending++; });
        if (pending > 0)
            throw new Error(pending + " pending connections to be resolved");
    };
    /**
     * Can be used in conjunction with `verifyNoPendingRequests` to resolve any not-yet-resolve
     * connections, if it's expected that there are connections that have not yet received a response.
     *
     * This method only exists in the mock implementation, not in real Backends.
     */
    MockBackend.prototype.resolveAllConnections = function () { this.connections.subscribe(function (c) { return c.readyState = 4; }); };
    /**
     * Creates a new {@link MockConnection}. This is equivalent to calling `new
     * MockConnection()`, except that it also will emit the new `Connection` to the `connections`
     * emitter of this `MockBackend` instance. This method will usually only be used by tests
     * against the framework itself, not by end-users.
     */
    MockBackend.prototype.createConnection = function (req) {
        if (!req || !(req instanceof Request)) {
            throw new Error("createConnection requires an instance of Request, got " + req);
        }
        var connection = new MockConnection(req);
        this.connections.next(connection);
        return connection;
    };
    MockBackend = tslib_1.__decorate([
        Injectable(),
        tslib_1.__metadata("design:paramtypes", [])
    ], MockBackend);
    return MockBackend;
}());
export { MockBackend };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja19iYWNrZW5kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvaHR0cC90ZXN0aW5nL3NyYy9tb2NrX2JhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFnQyxVQUFVLEVBQUUsT0FBTyxFQUFXLE1BQU0sZUFBZSxDQUFDO0FBQzNGLE9BQU8sRUFBQyxhQUFhLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUdwQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwQkc7QUFDSDtJQW9CRSx3QkFBWSxHQUFZO1FBQ3RCLElBQUksQ0FBQyxRQUFRLEdBQVEsSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQztRQUNsQyxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztJQUNyQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILG9DQUFXLEdBQVgsVUFBWSxHQUFhO1FBQ3ZCLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxVQUFVLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssVUFBVSxDQUFDLFNBQVMsRUFBRTtZQUNuRixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7U0FDekQ7UUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7UUFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxxQ0FBWSxHQUFaLFVBQWEsR0FBYTtRQUN4Qiw2Q0FBNkM7UUFDN0MsNENBQTRDO1FBQzVDLGlEQUFpRDtRQUNqRCxJQUFJO0lBQ04sQ0FBQztJQUVELGlEQUFpRDtJQUNqRDs7Ozs7T0FLRztJQUNILGtDQUFTLEdBQVQsVUFBVSxHQUFXO1FBQ25CLG1DQUFtQztRQUNuQyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7UUFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUNILHFCQUFDO0FBQUQsQ0FBQyxBQWpFRCxJQWlFQzs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzRkc7QUFFSDtJQTBCRTtRQUFBLGlCQU1DO1FBTEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztRQUMzQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7UUFDakMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQ3RCLFVBQUMsVUFBMEIsSUFBSyxPQUFBLEtBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQXRDLENBQXNDLENBQUMsQ0FBQztRQUM1RSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILDZDQUF1QixHQUF2QjtRQUNFLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztRQUNoQixJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLFVBQUMsQ0FBaUIsSUFBSyxPQUFBLE9BQU8sRUFBRSxFQUFULENBQVMsQ0FBQyxDQUFDO1FBQ3BFLElBQUksT0FBTyxHQUFHLENBQUM7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFJLE9BQU8sd0NBQXFDLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCwyQ0FBcUIsR0FBckIsY0FBMEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsVUFBQyxDQUFpQixJQUFLLE9BQUEsQ0FBQyxDQUFDLFVBQVUsR0FBRyxDQUFDLEVBQWhCLENBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFaEc7Ozs7O09BS0c7SUFDSCxzQ0FBZ0IsR0FBaEIsVUFBaUIsR0FBWTtRQUMzQixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLFlBQVksT0FBTyxDQUFDLEVBQUU7WUFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQywyREFBeUQsR0FBSyxDQUFDLENBQUM7U0FDakY7UUFDRCxJQUFNLFVBQVUsR0FBRyxJQUFJLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNsQyxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBbEVVLFdBQVc7UUFEdkIsVUFBVSxFQUFFOztPQUNBLFdBQVcsQ0FtRXZCO0lBQUQsa0JBQUM7Q0FBQSxBQW5FRCxJQW1FQztTQW5FWSxXQUFXIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDb25uZWN0aW9uLCBDb25uZWN0aW9uQmFja2VuZCwgUmVhZHlTdGF0ZSwgUmVxdWVzdCwgUmVzcG9uc2V9IGZyb20gJ0Bhbmd1bGFyL2h0dHAnO1xuaW1wb3J0IHtSZXBsYXlTdWJqZWN0LCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5cbi8qKlxuICpcbiAqIE1vY2sgQ29ubmVjdGlvbiB0byByZXByZXNlbnQgYSB7QGxpbmsgQ29ubmVjdGlvbn0gZm9yIHRlc3RzLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZSBvZiBgbW9ja1Jlc3BvbmQoKWBcbiAqXG4gKiBgYGBcbiAqIHZhciBjb25uZWN0aW9uO1xuICogYmFja2VuZC5jb25uZWN0aW9ucy5zdWJzY3JpYmUoYyA9PiBjb25uZWN0aW9uID0gYyk7XG4gKiBodHRwLnJlcXVlc3QoJ2RhdGEuanNvbicpLnN1YnNjcmliZShyZXMgPT4gY29uc29sZS5sb2cocmVzLnRleHQoKSkpO1xuICogY29ubmVjdGlvbi5tb2NrUmVzcG9uZChuZXcgUmVzcG9uc2UobmV3IFJlc3BvbnNlT3B0aW9ucyh7IGJvZHk6ICdmYWtlIHJlc3BvbnNlJyB9KSkpOyAvL2xvZ3NcbiAqICdmYWtlIHJlc3BvbnNlJ1xuICogYGBgXG4gKlxuICogIyMjIEV4YW1wbGUgb2YgYG1vY2tFcnJvcigpYFxuICpcbiAqIGBgYFxuICogdmFyIGNvbm5lY3Rpb247XG4gKiBiYWNrZW5kLmNvbm5lY3Rpb25zLnN1YnNjcmliZShjID0+IGNvbm5lY3Rpb24gPSBjKTtcbiAqIGh0dHAucmVxdWVzdCgnZGF0YS5qc29uJykuc3Vic2NyaWJlKHJlcyA9PiByZXMsIGVyciA9PiBjb25zb2xlLmxvZyhlcnIpKSk7XG4gKiBjb25uZWN0aW9uLm1vY2tFcnJvcihuZXcgRXJyb3IoJ2Vycm9yJykpO1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9odHRwXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBNb2NrQ29ubmVjdGlvbiBpbXBsZW1lbnRzIENvbm5lY3Rpb24ge1xuICAvLyBUT0RPOiBOYW1lIGByZWFkeVN0YXRlYCBzaG91bGQgY2hhbmdlIHRvIGJlIG1vcmUgZ2VuZXJpYywgYW5kIHN0YXRlcyBjb3VsZCBiZSBtYWRlIHRvIGJlIG1vcmVcbiAgLy8gZGVzY3JpcHRpdmUgdGhhbiBSZXNvdXJjZUxvYWRlciBzdGF0ZXMuXG4gIC8qKlxuICAgKiBEZXNjcmliZXMgdGhlIHN0YXRlIG9mIHRoZSBjb25uZWN0aW9uLCBiYXNlZCBvbiBgWE1MSHR0cFJlcXVlc3QucmVhZHlTdGF0ZWAsIGJ1dCB3aXRoXG4gICAqIGFkZGl0aW9uYWwgc3RhdGVzLiBGb3IgZXhhbXBsZSwgc3RhdGUgNSBpbmRpY2F0ZXMgYW4gYWJvcnRlZCBjb25uZWN0aW9uLlxuICAgKi9cbiAgcmVhZHlTdGF0ZTogUmVhZHlTdGF0ZTtcblxuICAvKipcbiAgICoge0BsaW5rIFJlcXVlc3R9IGluc3RhbmNlIHVzZWQgdG8gY3JlYXRlIHRoZSBjb25uZWN0aW9uLlxuICAgKi9cbiAgcmVxdWVzdDogUmVxdWVzdDtcblxuICAvKipcbiAgICoge0BsaW5rIEV2ZW50RW1pdHRlcn0gb2Yge0BsaW5rIFJlc3BvbnNlfS4gQ2FuIGJlIHN1YnNjcmliZWQgdG8gaW4gb3JkZXIgdG8gYmUgbm90aWZpZWQgd2hlbiBhXG4gICAqIHJlc3BvbnNlIGlzIGF2YWlsYWJsZS5cbiAgICovXG4gIHJlc3BvbnNlOiBSZXBsYXlTdWJqZWN0PFJlc3BvbnNlPjtcblxuICBjb25zdHJ1Y3RvcihyZXE6IFJlcXVlc3QpIHtcbiAgICB0aGlzLnJlc3BvbnNlID0gPGFueT5uZXcgUmVwbGF5U3ViamVjdCgxKS5waXBlKHRha2UoMSkpO1xuICAgIHRoaXMucmVhZHlTdGF0ZSA9IFJlYWR5U3RhdGUuT3BlbjtcbiAgICB0aGlzLnJlcXVlc3QgPSByZXE7XG4gIH1cblxuICAvKipcbiAgICogU2VuZHMgYSBtb2NrIHJlc3BvbnNlIHRvIHRoZSBjb25uZWN0aW9uLiBUaGlzIHJlc3BvbnNlIGlzIHRoZSB2YWx1ZSB0aGF0IGlzIGVtaXR0ZWQgdG8gdGhlXG4gICAqIHtAbGluayBFdmVudEVtaXR0ZXJ9IHJldHVybmVkIGJ5IHtAbGluayBIdHRwfS5cbiAgICpcbiAgICovXG4gIG1vY2tSZXNwb25kKHJlczogUmVzcG9uc2UpIHtcbiAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSBSZWFkeVN0YXRlLkRvbmUgfHwgdGhpcy5yZWFkeVN0YXRlID09PSBSZWFkeVN0YXRlLkNhbmNlbGxlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25uZWN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gcmVzb2x2ZWQnKTtcbiAgICB9XG4gICAgdGhpcy5yZWFkeVN0YXRlID0gUmVhZHlTdGF0ZS5Eb25lO1xuICAgIHRoaXMucmVzcG9uc2UubmV4dChyZXMpO1xuICAgIHRoaXMucmVzcG9uc2UuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3QgeWV0IGltcGxlbWVudGVkIVxuICAgKlxuICAgKiBTZW5kcyB0aGUgcHJvdmlkZWQge0BsaW5rIFJlc3BvbnNlfSB0byB0aGUgYGRvd25sb2FkT2JzZXJ2ZXJgIG9mIHRoZSBgUmVxdWVzdGBcbiAgICogYXNzb2NpYXRlZCB3aXRoIHRoaXMgY29ubmVjdGlvbi5cbiAgICovXG4gIG1vY2tEb3dubG9hZChyZXM6IFJlc3BvbnNlKSB7XG4gICAgLy8gdGhpcy5yZXF1ZXN0LmRvd25sb2FkT2JzZXJ2ZXIub25OZXh0KHJlcyk7XG4gICAgLy8gaWYgKHJlcy5ieXRlc0xvYWRlZCA9PT0gcmVzLnRvdGFsQnl0ZXMpIHtcbiAgICAvLyAgIHRoaXMucmVxdWVzdC5kb3dubG9hZE9ic2VydmVyLm9uQ29tcGxldGVkKCk7XG4gICAgLy8gfVxuICB9XG5cbiAgLy8gVE9ETyhqZWZmYmNyb3NzKTogY29uc2lkZXIgdXNpbmcgUmVzcG9uc2UgdHlwZVxuICAvKipcbiAgICogRW1pdHMgdGhlIHByb3ZpZGVkIGVycm9yIG9iamVjdCBhcyBhbiBlcnJvciB0byB0aGUge0BsaW5rIFJlc3BvbnNlfSB7QGxpbmsgRXZlbnRFbWl0dGVyfVxuICAgKiByZXR1cm5lZFxuICAgKiBmcm9tIHtAbGluayBIdHRwfS5cbiAgICpcbiAgICovXG4gIG1vY2tFcnJvcihlcnI/OiBFcnJvcikge1xuICAgIC8vIE1hdGNoZXMgUmVzb3VyY2VMb2FkZXIgc2VtYW50aWNzXG4gICAgdGhpcy5yZWFkeVN0YXRlID0gUmVhZHlTdGF0ZS5Eb25lO1xuICAgIHRoaXMucmVzcG9uc2UuZXJyb3IoZXJyKTtcbiAgfVxufVxuXG4vKipcbiAqIEEgbW9jayBiYWNrZW5kIGZvciB0ZXN0aW5nIHRoZSB7QGxpbmsgSHR0cH0gc2VydmljZS5cbiAqXG4gKiBUaGlzIGNsYXNzIGNhbiBiZSBpbmplY3RlZCBpbiB0ZXN0cywgYW5kIHNob3VsZCBiZSB1c2VkIHRvIG92ZXJyaWRlIHByb3ZpZGVyc1xuICogdG8gb3RoZXIgYmFja2VuZHMsIHN1Y2ggYXMge0BsaW5rIFhIUkJhY2tlbmR9LlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYFxuICogaW1wb3J0IHtJbmplY3RhYmxlLCBJbmplY3Rvcn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKiBpbXBvcnQge2FzeW5jLCBmYWtlQXN5bmMsIHRpY2t9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvdGVzdGluZyc7XG4gKiBpbXBvcnQge0Jhc2VSZXF1ZXN0T3B0aW9ucywgQ29ubmVjdGlvbkJhY2tlbmQsIEh0dHAsIFJlcXVlc3RPcHRpb25zfSBmcm9tICdAYW5ndWxhci9odHRwJztcbiAqIGltcG9ydCB7UmVzcG9uc2UsIFJlc3BvbnNlT3B0aW9uc30gZnJvbSAnQGFuZ3VsYXIvaHR0cCc7XG4gKiBpbXBvcnQge01vY2tCYWNrZW5kLCBNb2NrQ29ubmVjdGlvbn0gZnJvbSAnQGFuZ3VsYXIvaHR0cC90ZXN0aW5nJztcbiAqXG4gKiBjb25zdCBIRVJPX09ORSA9ICdIZXJvTnJPbmUnO1xuICogY29uc3QgSEVST19UV08gPSAnV2lsbEJlQWx3YXlzVGhlU2Vjb25kJztcbiAqXG4gKiBASW5qZWN0YWJsZSgpXG4gKiBjbGFzcyBIZXJvU2VydmljZSB7XG4gKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgaHR0cDogSHR0cCkge31cbiAqXG4gKiAgIGdldEhlcm9lcygpOiBQcm9taXNlPFN0cmluZ1tdPiB7XG4gKiAgICAgcmV0dXJuIHRoaXMuaHR0cC5nZXQoJ215c2VydmljZXMuZGUvYXBpL2hlcm9lcycpXG4gKiAgICAgICAgIC50b1Byb21pc2UoKVxuICogICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkuZGF0YSlcbiAqICAgICAgICAgLmNhdGNoKGUgPT4gdGhpcy5oYW5kbGVFcnJvcihlKSk7XG4gKiAgIH1cbiAqXG4gKiAgIHByaXZhdGUgaGFuZGxlRXJyb3IoZXJyb3I6IGFueSk6IFByb21pc2U8YW55PiB7XG4gKiAgICAgY29uc29sZS5lcnJvcignQW4gZXJyb3Igb2NjdXJyZWQnLCBlcnJvcik7XG4gKiAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpO1xuICogICB9XG4gKiB9XG4gKlxuICogZGVzY3JpYmUoJ01vY2tCYWNrZW5kIEhlcm9TZXJ2aWNlIEV4YW1wbGUnLCAoKSA9PiB7XG4gKiAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICogICAgIHRoaXMuaW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoW1xuICogICAgICAge3Byb3ZpZGU6IENvbm5lY3Rpb25CYWNrZW5kLCB1c2VDbGFzczogTW9ja0JhY2tlbmR9LFxuICogICAgICAge3Byb3ZpZGU6IFJlcXVlc3RPcHRpb25zLCB1c2VDbGFzczogQmFzZVJlcXVlc3RPcHRpb25zfSxcbiAqICAgICAgIEh0dHAsXG4gKiAgICAgICBIZXJvU2VydmljZSxcbiAqICAgICBdKTtcbiAqICAgICB0aGlzLmhlcm9TZXJ2aWNlID0gdGhpcy5pbmplY3Rvci5nZXQoSGVyb1NlcnZpY2UpO1xuICogICAgIHRoaXMuYmFja2VuZCA9IHRoaXMuaW5qZWN0b3IuZ2V0KENvbm5lY3Rpb25CYWNrZW5kKSBhcyBNb2NrQmFja2VuZDtcbiAqICAgICB0aGlzLmJhY2tlbmQuY29ubmVjdGlvbnMuc3Vic2NyaWJlKChjb25uZWN0aW9uOiBhbnkpID0+IHRoaXMubGFzdENvbm5lY3Rpb24gPSBjb25uZWN0aW9uKTtcbiAqICAgfSk7XG4gKlxuICogICBpdCgnZ2V0SGVyb2VzKCkgc2hvdWxkIHF1ZXJ5IGN1cnJlbnQgc2VydmljZSB1cmwnLCAoKSA9PiB7XG4gKiAgICAgdGhpcy5oZXJvU2VydmljZS5nZXRIZXJvZXMoKTtcbiAqICAgICBleHBlY3QodGhpcy5sYXN0Q29ubmVjdGlvbikudG9CZURlZmluZWQoJ25vIGh0dHAgc2VydmljZSBjb25uZWN0aW9uIGF0IGFsbD8nKTtcbiAqICAgICBleHBlY3QodGhpcy5sYXN0Q29ubmVjdGlvbi5yZXF1ZXN0LnVybCkudG9NYXRjaCgvYXBpXFwvaGVyb2VzJC8sICd1cmwgaW52YWxpZCcpO1xuICogICB9KTtcbiAqXG4gKiAgIGl0KCdnZXRIZXJvZXMoKSBzaG91bGQgcmV0dXJuIHNvbWUgaGVyb2VzJywgZmFrZUFzeW5jKCgpID0+IHtcbiAqICAgICAgICBsZXQgcmVzdWx0OiBTdHJpbmdbXTtcbiAqICAgICAgICB0aGlzLmhlcm9TZXJ2aWNlLmdldEhlcm9lcygpLnRoZW4oKGhlcm9lczogU3RyaW5nW10pID0+IHJlc3VsdCA9IGhlcm9lcyk7XG4gKiAgICAgICAgdGhpcy5sYXN0Q29ubmVjdGlvbi5tb2NrUmVzcG9uZChuZXcgUmVzcG9uc2UobmV3IFJlc3BvbnNlT3B0aW9ucyh7XG4gKiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7ZGF0YTogW0hFUk9fT05FLCBIRVJPX1RXT119KSxcbiAqICAgICAgICB9KSkpO1xuICogICAgICAgIHRpY2soKTtcbiAqICAgICAgICBleHBlY3QocmVzdWx0Lmxlbmd0aCkudG9FcXVhbCgyLCAnc2hvdWxkIGNvbnRhaW4gZ2l2ZW4gYW1vdW50IG9mIGhlcm9lcycpO1xuICogICAgICAgIGV4cGVjdChyZXN1bHRbMF0pLnRvRXF1YWwoSEVST19PTkUsICcgSEVST19PTkUgc2hvdWxkIGJlIHRoZSBmaXJzdCBoZXJvJyk7XG4gKiAgICAgICAgZXhwZWN0KHJlc3VsdFsxXSkudG9FcXVhbChIRVJPX1RXTywgJyBIRVJPX1RXTyBzaG91bGQgYmUgdGhlIHNlY29uZCBoZXJvJyk7XG4gKiAgICAgIH0pKTtcbiAqXG4gKiAgIGl0KCdnZXRIZXJvZXMoKSB3aGlsZSBzZXJ2ZXIgaXMgZG93bicsIGZha2VBc3luYygoKSA9PiB7XG4gKiAgICAgICAgbGV0IHJlc3VsdDogU3RyaW5nW107XG4gKiAgICAgICAgbGV0IGNhdGNoZWRFcnJvcjogYW55O1xuICogICAgICAgIHRoaXMuaGVyb1NlcnZpY2UuZ2V0SGVyb2VzKClcbiAqICAgICAgICAgICAgLnRoZW4oKGhlcm9lczogU3RyaW5nW10pID0+IHJlc3VsdCA9IGhlcm9lcylcbiAqICAgICAgICAgICAgLmNhdGNoKChlcnJvcjogYW55KSA9PiBjYXRjaGVkRXJyb3IgPSBlcnJvcik7XG4gKiAgICAgICAgdGhpcy5sYXN0Q29ubmVjdGlvbi5tb2NrRXJyb3IobmV3IFJlc3BvbnNlKG5ldyBSZXNwb25zZU9wdGlvbnMoe1xuICogICAgICAgICAgc3RhdHVzOiA0MDQsXG4gKiAgICAgICAgICBzdGF0dXNUZXh0OiAnVVJMIG5vdCBGb3VuZCcsXG4gKiAgICAgICAgfSkpKTtcbiAqICAgICAgICB0aWNrKCk7XG4gKiAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZVVuZGVmaW5lZCgpO1xuICogICAgICAgIGV4cGVjdChjYXRjaGVkRXJyb3IpLnRvQmVEZWZpbmVkKCk7XG4gKiAgICAgIH0pKTtcbiAqIH0pO1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9odHRwXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBNb2NrQmFja2VuZCBpbXBsZW1lbnRzIENvbm5lY3Rpb25CYWNrZW5kIHtcbiAgLyoqXG4gICAqIHtAbGluayBFdmVudEVtaXR0ZXJ9XG4gICAqIG9mIHtAbGluayBNb2NrQ29ubmVjdGlvbn0gaW5zdGFuY2VzIHRoYXQgaGF2ZSBiZWVuIGNyZWF0ZWQgYnkgdGhpcyBiYWNrZW5kLiBDYW4gYmUgc3Vic2NyaWJlZFxuICAgKiB0byBpbiBvcmRlciB0byByZXNwb25kIHRvIGNvbm5lY3Rpb25zLlxuICAgKlxuICAgKiBUaGlzIHByb3BlcnR5IG9ubHkgZXhpc3RzIGluIHRoZSBtb2NrIGltcGxlbWVudGF0aW9uLCBub3QgaW4gcmVhbCBCYWNrZW5kcy5cbiAgICovXG4gIGNvbm5lY3Rpb25zOiBhbnk7ICAvLzxNb2NrQ29ubmVjdGlvbj5cblxuICAvKipcbiAgICogQW4gYXJyYXkgcmVwcmVzZW50YXRpb24gb2YgYGNvbm5lY3Rpb25zYC4gVGhpcyBhcnJheSB3aWxsIGJlIHVwZGF0ZWQgd2l0aCBlYWNoIGNvbm5lY3Rpb24gdGhhdFxuICAgKiBpcyBjcmVhdGVkIGJ5IHRoaXMgYmFja2VuZC5cbiAgICpcbiAgICogVGhpcyBwcm9wZXJ0eSBvbmx5IGV4aXN0cyBpbiB0aGUgbW9jayBpbXBsZW1lbnRhdGlvbiwgbm90IGluIHJlYWwgQmFja2VuZHMuXG4gICAqL1xuICBjb25uZWN0aW9uc0FycmF5OiBNb2NrQ29ubmVjdGlvbltdO1xuICAvKipcbiAgICoge0BsaW5rIEV2ZW50RW1pdHRlcn0gb2Yge0BsaW5rIE1vY2tDb25uZWN0aW9ufSBpbnN0YW5jZXMgdGhhdCBoYXZlbid0IHlldCBiZWVuIHJlc29sdmVkIChpLmUuXG4gICAqIHdpdGggYSBgcmVhZHlTdGF0ZWBcbiAgICogbGVzcyB0aGFuIDQpLiBVc2VkIGludGVybmFsbHkgdG8gdmVyaWZ5IHRoYXQgbm8gY29ubmVjdGlvbnMgYXJlIHBlbmRpbmcgdmlhIHRoZVxuICAgKiBgdmVyaWZ5Tm9QZW5kaW5nUmVxdWVzdHNgIG1ldGhvZC5cbiAgICpcbiAgICogVGhpcyBwcm9wZXJ0eSBvbmx5IGV4aXN0cyBpbiB0aGUgbW9jayBpbXBsZW1lbnRhdGlvbiwgbm90IGluIHJlYWwgQmFja2VuZHMuXG4gICAqL1xuICBwZW5kaW5nQ29ubmVjdGlvbnM6IGFueTsgIC8vIFN1YmplY3Q8TW9ja0Nvbm5lY3Rpb24+XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuY29ubmVjdGlvbnNBcnJheSA9IFtdO1xuICAgIHRoaXMuY29ubmVjdGlvbnMgPSBuZXcgU3ViamVjdCgpO1xuICAgIHRoaXMuY29ubmVjdGlvbnMuc3Vic2NyaWJlKFxuICAgICAgICAoY29ubmVjdGlvbjogTW9ja0Nvbm5lY3Rpb24pID0+IHRoaXMuY29ubmVjdGlvbnNBcnJheS5wdXNoKGNvbm5lY3Rpb24pKTtcbiAgICB0aGlzLnBlbmRpbmdDb25uZWN0aW9ucyA9IG5ldyBTdWJqZWN0KCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGFsbCBjb25uZWN0aW9ucywgYW5kIHJhaXNlcyBhbiBleGNlcHRpb24gaWYgYW55IGNvbm5lY3Rpb24gaGFzIG5vdCByZWNlaXZlZCBhIHJlc3BvbnNlLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBvbmx5IGV4aXN0cyBpbiB0aGUgbW9jayBpbXBsZW1lbnRhdGlvbiwgbm90IGluIHJlYWwgQmFja2VuZHMuXG4gICAqL1xuICB2ZXJpZnlOb1BlbmRpbmdSZXF1ZXN0cygpIHtcbiAgICBsZXQgcGVuZGluZyA9IDA7XG4gICAgdGhpcy5wZW5kaW5nQ29ubmVjdGlvbnMuc3Vic2NyaWJlKChjOiBNb2NrQ29ubmVjdGlvbikgPT4gcGVuZGluZysrKTtcbiAgICBpZiAocGVuZGluZyA+IDApIHRocm93IG5ldyBFcnJvcihgJHtwZW5kaW5nfSBwZW5kaW5nIGNvbm5lY3Rpb25zIHRvIGJlIHJlc29sdmVkYCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FuIGJlIHVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCBgdmVyaWZ5Tm9QZW5kaW5nUmVxdWVzdHNgIHRvIHJlc29sdmUgYW55IG5vdC15ZXQtcmVzb2x2ZVxuICAgKiBjb25uZWN0aW9ucywgaWYgaXQncyBleHBlY3RlZCB0aGF0IHRoZXJlIGFyZSBjb25uZWN0aW9ucyB0aGF0IGhhdmUgbm90IHlldCByZWNlaXZlZCBhIHJlc3BvbnNlLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBvbmx5IGV4aXN0cyBpbiB0aGUgbW9jayBpbXBsZW1lbnRhdGlvbiwgbm90IGluIHJlYWwgQmFja2VuZHMuXG4gICAqL1xuICByZXNvbHZlQWxsQ29ubmVjdGlvbnMoKSB7IHRoaXMuY29ubmVjdGlvbnMuc3Vic2NyaWJlKChjOiBNb2NrQ29ubmVjdGlvbikgPT4gYy5yZWFkeVN0YXRlID0gNCk7IH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB7QGxpbmsgTW9ja0Nvbm5lY3Rpb259LiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gY2FsbGluZyBgbmV3XG4gICAqIE1vY2tDb25uZWN0aW9uKClgLCBleGNlcHQgdGhhdCBpdCBhbHNvIHdpbGwgZW1pdCB0aGUgbmV3IGBDb25uZWN0aW9uYCB0byB0aGUgYGNvbm5lY3Rpb25zYFxuICAgKiBlbWl0dGVyIG9mIHRoaXMgYE1vY2tCYWNrZW5kYCBpbnN0YW5jZS4gVGhpcyBtZXRob2Qgd2lsbCB1c3VhbGx5IG9ubHkgYmUgdXNlZCBieSB0ZXN0c1xuICAgKiBhZ2FpbnN0IHRoZSBmcmFtZXdvcmsgaXRzZWxmLCBub3QgYnkgZW5kLXVzZXJzLlxuICAgKi9cbiAgY3JlYXRlQ29ubmVjdGlvbihyZXE6IFJlcXVlc3QpOiBNb2NrQ29ubmVjdGlvbiB7XG4gICAgaWYgKCFyZXEgfHwgIShyZXEgaW5zdGFuY2VvZiBSZXF1ZXN0KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBjcmVhdGVDb25uZWN0aW9uIHJlcXVpcmVzIGFuIGluc3RhbmNlIG9mIFJlcXVlc3QsIGdvdCAke3JlcX1gKTtcbiAgICB9XG4gICAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyBNb2NrQ29ubmVjdGlvbihyZXEpO1xuICAgIHRoaXMuY29ubmVjdGlvbnMubmV4dChjb25uZWN0aW9uKTtcbiAgICByZXR1cm4gY29ubmVjdGlvbjtcbiAgfVxufVxuIl19