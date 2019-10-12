"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const process = require("process");
const benchmark_1 = require("./benchmark");
const gather_diagnostics_1 = require("./gather_diagnostics");
const type_checker_1 = require("./type_checker");
const type_checker_messages_1 = require("./type_checker_messages");
let typeChecker;
let lastCancellationToken;
// only listen to messages if started from the AngularCompilerPlugin
if (process.argv.indexOf(type_checker_1.AUTO_START_ARG) >= 0) {
    process.on('message', (message) => {
        benchmark_1.time('TypeChecker.message');
        switch (message.kind) {
            case type_checker_messages_1.MESSAGE_KIND.Init:
                const initMessage = message;
                typeChecker = new type_checker_1.TypeChecker(initMessage.compilerOptions, initMessage.basePath, initMessage.jitMode, initMessage.rootNames, initMessage.hostReplacementPaths);
                break;
            case type_checker_messages_1.MESSAGE_KIND.Update:
                if (!typeChecker) {
                    throw new Error('TypeChecker: update message received before initialization');
                }
                if (lastCancellationToken) {
                    // This cancellation token doesn't seem to do much, messages don't seem to be processed
                    // before the diagnostics finish.
                    lastCancellationToken.requestCancellation();
                }
                const updateMessage = message;
                lastCancellationToken = new gather_diagnostics_1.CancellationToken();
                typeChecker.update(updateMessage.rootNames, updateMessage.changedCompilationFiles, lastCancellationToken);
                break;
            default:
                throw new Error(`TypeChecker: Unexpected message received: ${message}.`);
        }
        benchmark_1.timeEnd('TypeChecker.message');
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZV9jaGVja2VyX3dvcmtlci5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvbmd0b29scy93ZWJwYWNrL3NyYy90eXBlX2NoZWNrZXJfd29ya2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsbUNBQW1DO0FBQ25DLDJDQUE0QztBQUM1Qyw2REFBeUQ7QUFDekQsaURBR3dCO0FBQ3hCLG1FQUtpQztBQUVqQyxJQUFJLFdBQXdCLENBQUM7QUFDN0IsSUFBSSxxQkFBd0MsQ0FBQztBQUU3QyxvRUFBb0U7QUFDcEUsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw2QkFBYyxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQzdDLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsT0FBMkIsRUFBRSxFQUFFO1FBQ3BELGdCQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUM1QixRQUFRLE9BQU8sQ0FBQyxJQUFJLEVBQUU7WUFDcEIsS0FBSyxvQ0FBWSxDQUFDLElBQUk7Z0JBQ3BCLE1BQU0sV0FBVyxHQUFHLE9BQXNCLENBQUM7Z0JBQzNDLFdBQVcsR0FBRyxJQUFJLDBCQUFXLENBQzNCLFdBQVcsQ0FBQyxlQUFlLEVBQzNCLFdBQVcsQ0FBQyxRQUFRLEVBQ3BCLFdBQVcsQ0FBQyxPQUFPLEVBQ25CLFdBQVcsQ0FBQyxTQUFTLEVBQ3JCLFdBQVcsQ0FBQyxvQkFBb0IsQ0FDakMsQ0FBQztnQkFDRixNQUFNO1lBQ1IsS0FBSyxvQ0FBWSxDQUFDLE1BQU07Z0JBQ3RCLElBQUksQ0FBQyxXQUFXLEVBQUU7b0JBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsNERBQTRELENBQUMsQ0FBQztpQkFDL0U7Z0JBQ0QsSUFBSSxxQkFBcUIsRUFBRTtvQkFDekIsdUZBQXVGO29CQUN2RixpQ0FBaUM7b0JBQ2pDLHFCQUFxQixDQUFDLG1CQUFtQixFQUFFLENBQUM7aUJBQzdDO2dCQUNELE1BQU0sYUFBYSxHQUFHLE9BQXdCLENBQUM7Z0JBQy9DLHFCQUFxQixHQUFHLElBQUksc0NBQWlCLEVBQUUsQ0FBQztnQkFDaEQsV0FBVyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyx1QkFBdUIsRUFDL0UscUJBQXFCLENBQUMsQ0FBQztnQkFDekIsTUFBTTtZQUNSO2dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsNkNBQTZDLE9BQU8sR0FBRyxDQUFDLENBQUM7U0FDNUU7UUFDRCxtQkFBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDakMsQ0FBQyxDQUFDLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIHByb2Nlc3MgZnJvbSAncHJvY2Vzcyc7XG5pbXBvcnQgeyB0aW1lLCB0aW1lRW5kIH0gZnJvbSAnLi9iZW5jaG1hcmsnO1xuaW1wb3J0IHsgQ2FuY2VsbGF0aW9uVG9rZW4gfSBmcm9tICcuL2dhdGhlcl9kaWFnbm9zdGljcyc7XG5pbXBvcnQge1xuICBBVVRPX1NUQVJUX0FSRyxcbiAgVHlwZUNoZWNrZXIsXG59IGZyb20gJy4vdHlwZV9jaGVja2VyJztcbmltcG9ydCB7XG4gIEluaXRNZXNzYWdlLFxuICBNRVNTQUdFX0tJTkQsXG4gIFR5cGVDaGVja2VyTWVzc2FnZSxcbiAgVXBkYXRlTWVzc2FnZSxcbn0gZnJvbSAnLi90eXBlX2NoZWNrZXJfbWVzc2FnZXMnO1xuXG5sZXQgdHlwZUNoZWNrZXI6IFR5cGVDaGVja2VyO1xubGV0IGxhc3RDYW5jZWxsYXRpb25Ub2tlbjogQ2FuY2VsbGF0aW9uVG9rZW47XG5cbi8vIG9ubHkgbGlzdGVuIHRvIG1lc3NhZ2VzIGlmIHN0YXJ0ZWQgZnJvbSB0aGUgQW5ndWxhckNvbXBpbGVyUGx1Z2luXG5pZiAocHJvY2Vzcy5hcmd2LmluZGV4T2YoQVVUT19TVEFSVF9BUkcpID49IDApIHtcbiAgcHJvY2Vzcy5vbignbWVzc2FnZScsIChtZXNzYWdlOiBUeXBlQ2hlY2tlck1lc3NhZ2UpID0+IHtcbiAgICB0aW1lKCdUeXBlQ2hlY2tlci5tZXNzYWdlJyk7XG4gICAgc3dpdGNoIChtZXNzYWdlLmtpbmQpIHtcbiAgICAgIGNhc2UgTUVTU0FHRV9LSU5ELkluaXQ6XG4gICAgICAgIGNvbnN0IGluaXRNZXNzYWdlID0gbWVzc2FnZSBhcyBJbml0TWVzc2FnZTtcbiAgICAgICAgdHlwZUNoZWNrZXIgPSBuZXcgVHlwZUNoZWNrZXIoXG4gICAgICAgICAgaW5pdE1lc3NhZ2UuY29tcGlsZXJPcHRpb25zLFxuICAgICAgICAgIGluaXRNZXNzYWdlLmJhc2VQYXRoLFxuICAgICAgICAgIGluaXRNZXNzYWdlLmppdE1vZGUsXG4gICAgICAgICAgaW5pdE1lc3NhZ2Uucm9vdE5hbWVzLFxuICAgICAgICAgIGluaXRNZXNzYWdlLmhvc3RSZXBsYWNlbWVudFBhdGhzLFxuICAgICAgICApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTUVTU0FHRV9LSU5ELlVwZGF0ZTpcbiAgICAgICAgaWYgKCF0eXBlQ2hlY2tlcikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVHlwZUNoZWNrZXI6IHVwZGF0ZSBtZXNzYWdlIHJlY2VpdmVkIGJlZm9yZSBpbml0aWFsaXphdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYXN0Q2FuY2VsbGF0aW9uVG9rZW4pIHtcbiAgICAgICAgICAvLyBUaGlzIGNhbmNlbGxhdGlvbiB0b2tlbiBkb2Vzbid0IHNlZW0gdG8gZG8gbXVjaCwgbWVzc2FnZXMgZG9uJ3Qgc2VlbSB0byBiZSBwcm9jZXNzZWRcbiAgICAgICAgICAvLyBiZWZvcmUgdGhlIGRpYWdub3N0aWNzIGZpbmlzaC5cbiAgICAgICAgICBsYXN0Q2FuY2VsbGF0aW9uVG9rZW4ucmVxdWVzdENhbmNlbGxhdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHVwZGF0ZU1lc3NhZ2UgPSBtZXNzYWdlIGFzIFVwZGF0ZU1lc3NhZ2U7XG4gICAgICAgIGxhc3RDYW5jZWxsYXRpb25Ub2tlbiA9IG5ldyBDYW5jZWxsYXRpb25Ub2tlbigpO1xuICAgICAgICB0eXBlQ2hlY2tlci51cGRhdGUodXBkYXRlTWVzc2FnZS5yb290TmFtZXMsIHVwZGF0ZU1lc3NhZ2UuY2hhbmdlZENvbXBpbGF0aW9uRmlsZXMsXG4gICAgICAgICAgbGFzdENhbmNlbGxhdGlvblRva2VuKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFR5cGVDaGVja2VyOiBVbmV4cGVjdGVkIG1lc3NhZ2UgcmVjZWl2ZWQ6ICR7bWVzc2FnZX0uYCk7XG4gICAgfVxuICAgIHRpbWVFbmQoJ1R5cGVDaGVja2VyLm1lc3NhZ2UnKTtcbiAgfSk7XG59XG4iXX0=