"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const portfinder = require('portfinder');
function checkPort(port, host, basePort = 49152) {
    return new rxjs_1.Observable(obs => {
        portfinder.basePort = basePort;
        // tslint:disable:no-any
        portfinder.getPort({ port, host }, (err, foundPort) => {
            if (err) {
                obs.error(err);
            }
            else if (port !== foundPort && port !== 0) {
                // If the port isn't available and we weren't looking for any port, throw error.
                obs.error(`Port ${port} is already in use. Use '--port' to specify a different port.`);
            }
            else {
                // Otherwise, our found port is good.
                obs.next(foundPort);
                obs.complete();
            }
        });
    });
}
exports.checkPort = checkPort;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2stcG9ydC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYW5ndWxhci1jbGktZmlsZXMvdXRpbGl0aWVzL2NoZWNrLXBvcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQkFBa0M7QUFDbEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBR3pDLFNBQWdCLFNBQVMsQ0FBQyxJQUFZLEVBQUUsSUFBWSxFQUFFLFFBQVEsR0FBRyxLQUFLO0lBQ3BFLE9BQU8sSUFBSSxpQkFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQzFCLFVBQVUsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQy9CLHdCQUF3QjtRQUN4QixVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsR0FBUSxFQUFFLFNBQWlCLEVBQUUsRUFBRTtZQUNqRSxJQUFJLEdBQUcsRUFBRTtnQkFDUCxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2hCO2lCQUFNLElBQUksSUFBSSxLQUFLLFNBQVMsSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFO2dCQUMzQyxnRkFBZ0Y7Z0JBQ2hGLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLCtEQUErRCxDQUFDLENBQUM7YUFDeEY7aUJBQU07Z0JBQ0wscUNBQXFDO2dCQUNyQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNwQixHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDaEI7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQWpCRCw4QkFpQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmNvbnN0IHBvcnRmaW5kZXIgPSByZXF1aXJlKCdwb3J0ZmluZGVyJyk7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrUG9ydChwb3J0OiBudW1iZXIsIGhvc3Q6IHN0cmluZywgYmFzZVBvcnQgPSA0OTE1Mik6IE9ic2VydmFibGU8bnVtYmVyPiB7XG4gIHJldHVybiBuZXcgT2JzZXJ2YWJsZShvYnMgPT4ge1xuICAgIHBvcnRmaW5kZXIuYmFzZVBvcnQgPSBiYXNlUG9ydDtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZTpuby1hbnlcbiAgICBwb3J0ZmluZGVyLmdldFBvcnQoeyBwb3J0LCBob3N0IH0sIChlcnI6IGFueSwgZm91bmRQb3J0OiBudW1iZXIpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgb2JzLmVycm9yKGVycik7XG4gICAgICB9IGVsc2UgaWYgKHBvcnQgIT09IGZvdW5kUG9ydCAmJiBwb3J0ICE9PSAwKSB7XG4gICAgICAgIC8vIElmIHRoZSBwb3J0IGlzbid0IGF2YWlsYWJsZSBhbmQgd2Ugd2VyZW4ndCBsb29raW5nIGZvciBhbnkgcG9ydCwgdGhyb3cgZXJyb3IuXG4gICAgICAgIG9icy5lcnJvcihgUG9ydCAke3BvcnR9IGlzIGFscmVhZHkgaW4gdXNlLiBVc2UgJy0tcG9ydCcgdG8gc3BlY2lmeSBhIGRpZmZlcmVudCBwb3J0LmApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gT3RoZXJ3aXNlLCBvdXIgZm91bmQgcG9ydCBpcyBnb29kLlxuICAgICAgICBvYnMubmV4dChmb3VuZFBvcnQpO1xuICAgICAgICBvYnMuY29tcGxldGUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59XG4iXX0=