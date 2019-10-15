/**
 * @license Angular v7.0.4
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/http'), require('rxjs'), require('rxjs/operators')) :
    typeof define === 'function' && define.amd ? define('@angular/http/testing', ['exports', '@angular/core', '@angular/http', 'rxjs', 'rxjs/operators'], factory) :
    (factory((global.ng = global.ng || {}, global.ng.http = global.ng.http || {}, global.ng.http.testing = {}),global.ng.core,global.ng.http,global.rxjs,global.rxjs.operators));
}(this, (function (exports,core,http,rxjs,operators) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
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
            this.response = new rxjs.ReplaySubject(1).pipe(operators.take(1));
            this.readyState = http.ReadyState.Open;
            this.request = req;
        }
        /**
         * Sends a mock response to the connection. This response is the value that is emitted to the
         * {@link EventEmitter} returned by {@link Http}.
         *
         */
        MockConnection.prototype.mockRespond = function (res) {
            if (this.readyState === http.ReadyState.Done || this.readyState === http.ReadyState.Cancelled) {
                throw new Error('Connection has already been resolved');
            }
            this.readyState = http.ReadyState.Done;
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
            this.readyState = http.ReadyState.Done;
            this.response.error(err);
        };
        return MockConnection;
    }());
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
            this.connections = new rxjs.Subject();
            this.connections.subscribe(function (connection) { return _this.connectionsArray.push(connection); });
            this.pendingConnections = new rxjs.Subject();
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
            if (!req || !(req instanceof http.Request)) {
                throw new Error("createConnection requires an instance of Request, got " + req);
            }
            var connection = new MockConnection(req);
            this.connections.next(connection);
            return connection;
        };
        MockBackend = __decorate([
            core.Injectable(),
            __metadata("design:paramtypes", [])
        ], MockBackend);
        return MockBackend;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * Generated bundle index. Do not edit.
     */

    exports.MockConnection = MockConnection;
    exports.MockBackend = MockBackend;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=http-testing.umd.js.map
