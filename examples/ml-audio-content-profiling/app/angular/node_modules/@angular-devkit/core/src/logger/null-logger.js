"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const rxjs_1 = require("rxjs");
const logger_1 = require("./logger");
class NullLogger extends logger_1.Logger {
    constructor(parent = null) {
        super('', parent);
        this._observable = rxjs_1.EMPTY;
    }
    asApi() {
        return {
            createChild: () => new NullLogger(this),
            log() { },
            debug() { },
            info() { },
            warn() { },
            error() { },
            fatal() { },
        };
    }
}
exports.NullLogger = NullLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbC1sb2dnZXIuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL2xvZ2dlci9udWxsLWxvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtCQUE2QjtBQUM3QixxQ0FBNkM7QUFHN0MsTUFBYSxVQUFXLFNBQVEsZUFBTTtJQUNwQyxZQUFZLFNBQXdCLElBQUk7UUFDdEMsS0FBSyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNsQixJQUFJLENBQUMsV0FBVyxHQUFHLFlBQUssQ0FBQztJQUMzQixDQUFDO0lBRUQsS0FBSztRQUNILE9BQU87WUFDTCxXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDO1lBQ3ZDLEdBQUcsS0FBSSxDQUFDO1lBQ1IsS0FBSyxLQUFJLENBQUM7WUFDVixJQUFJLEtBQUksQ0FBQztZQUNULElBQUksS0FBSSxDQUFDO1lBQ1QsS0FBSyxLQUFJLENBQUM7WUFDVixLQUFLLEtBQUksQ0FBQztTQUNFLENBQUM7SUFDakIsQ0FBQztDQUNGO0FBakJELGdDQWlCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IEVNUFRZIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBMb2dnZXIsIExvZ2dlckFwaSB9IGZyb20gJy4vbG9nZ2VyJztcblxuXG5leHBvcnQgY2xhc3MgTnVsbExvZ2dlciBleHRlbmRzIExvZ2dlciB7XG4gIGNvbnN0cnVjdG9yKHBhcmVudDogTG9nZ2VyIHwgbnVsbCA9IG51bGwpIHtcbiAgICBzdXBlcignJywgcGFyZW50KTtcbiAgICB0aGlzLl9vYnNlcnZhYmxlID0gRU1QVFk7XG4gIH1cblxuICBhc0FwaSgpOiBMb2dnZXJBcGkge1xuICAgIHJldHVybiB7XG4gICAgICBjcmVhdGVDaGlsZDogKCkgPT4gbmV3IE51bGxMb2dnZXIodGhpcyksXG4gICAgICBsb2coKSB7fSxcbiAgICAgIGRlYnVnKCkge30sXG4gICAgICBpbmZvKCkge30sXG4gICAgICB3YXJuKCkge30sXG4gICAgICBlcnJvcigpIHt9LFxuICAgICAgZmF0YWwoKSB7fSxcbiAgICB9IGFzIExvZ2dlckFwaTtcbiAgfVxufVxuIl19