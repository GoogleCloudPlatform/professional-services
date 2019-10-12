"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
// Host is used instead of ReadonlyHost due to most decorators only supporting Hosts
class WebpackInputHost {
    constructor(inputFileSystem) {
        this.inputFileSystem = inputFileSystem;
    }
    get capabilities() {
        return { synchronous: true };
    }
    write(_path, _content) {
        return rxjs_1.throwError(new Error('Not supported.'));
    }
    delete(_path) {
        return rxjs_1.throwError(new Error('Not supported.'));
    }
    rename(_from, _to) {
        return rxjs_1.throwError(new Error('Not supported.'));
    }
    read(path) {
        return new rxjs_1.Observable(obs => {
            // TODO: remove this try+catch when issue https://github.com/ReactiveX/rxjs/issues/3740 is
            // fixed.
            try {
                const data = this.inputFileSystem.readFileSync(core_1.getSystemPath(path));
                obs.next(new Uint8Array(data).buffer);
                obs.complete();
            }
            catch (e) {
                obs.error(e);
            }
        });
    }
    list(path) {
        return new rxjs_1.Observable(obs => {
            // TODO: remove this try+catch when issue https://github.com/ReactiveX/rxjs/issues/3740 is
            // fixed.
            try {
                // tslint:disable-next-line:no-any
                const names = this.inputFileSystem.readdirSync(core_1.getSystemPath(path));
                obs.next(names.map(name => core_1.fragment(name)));
                obs.complete();
            }
            catch (err) {
                obs.error(err);
            }
        });
    }
    exists(path) {
        return this.stat(path).pipe(operators_1.map(stats => stats != null));
    }
    isDirectory(path) {
        return this.stat(path).pipe(operators_1.map(stats => stats != null && stats.isDirectory()));
    }
    isFile(path) {
        return this.stat(path).pipe(operators_1.map(stats => stats != null && stats.isFile()));
    }
    stat(path) {
        return new rxjs_1.Observable(obs => {
            try {
                const stats = this.inputFileSystem.statSync(core_1.getSystemPath(path));
                obs.next(stats);
                obs.complete();
            }
            catch (e) {
                if (e.code === 'ENOENT') {
                    obs.next(null);
                    obs.complete();
                }
                else {
                    obs.error(e);
                }
            }
        });
    }
    watch(_path, _options) {
        return null;
    }
}
exports.WebpackInputHost = WebpackInputHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VicGFjay1pbnB1dC1ob3N0LmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9uZ3Rvb2xzL3dlYnBhY2svc3JjL3dlYnBhY2staW5wdXQtaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUE4RjtBQUU5RiwrQkFBOEM7QUFDOUMsOENBQXFDO0FBR3JDLG9GQUFvRjtBQUNwRixNQUFhLGdCQUFnQjtJQUUzQixZQUE0QixlQUFnQztRQUFoQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7SUFBSSxDQUFDO0lBRWpFLElBQUksWUFBWTtRQUNkLE9BQU8sRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFXLEVBQUUsUUFBa0M7UUFDbkQsT0FBTyxpQkFBVSxDQUFDLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQVc7UUFDaEIsT0FBTyxpQkFBVSxDQUFDLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQVcsRUFBRSxHQUFTO1FBQzNCLE9BQU8saUJBQVUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFVO1FBQ2IsT0FBTyxJQUFJLGlCQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDMUIsMEZBQTBGO1lBQzFGLFNBQVM7WUFDVCxJQUFJO2dCQUNGLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLG9CQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDcEUsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFxQixDQUFDLENBQUM7Z0JBQ3JELEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQzthQUNoQjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNWLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDZDtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFVO1FBQ2IsT0FBTyxJQUFJLGlCQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDMUIsMEZBQTBGO1lBQzFGLFNBQVM7WUFDVCxJQUFJO2dCQUNGLGtDQUFrQztnQkFDbEMsTUFBTSxLQUFLLEdBQWMsSUFBSSxDQUFDLGVBQXVCLENBQUMsV0FBVyxDQUFDLG9CQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDdkYsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO2FBQ2hCO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNoQjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELE1BQU0sQ0FBQyxJQUFVO1FBQ2YsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsV0FBVyxDQUFDLElBQVU7UUFDcEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbEYsQ0FBQztJQUVELE1BQU0sQ0FBQyxJQUFVO1FBQ2YsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFVO1FBQ2IsT0FBTyxJQUFJLGlCQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDMUIsSUFBSTtnQkFDRixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxvQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hCLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQzthQUNoQjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNWLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7b0JBQ3ZCLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2YsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO2lCQUNoQjtxQkFBTTtvQkFDTCxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNkO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsS0FBVyxFQUFFLFFBQXFDO1FBQ3RELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBakZELDRDQWlGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IFBhdGgsIFBhdGhGcmFnbWVudCwgZnJhZ21lbnQsIGdldFN5c3RlbVBhdGgsIHZpcnR1YWxGcyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFN0YXRzIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgbWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgSW5wdXRGaWxlU3lzdGVtIH0gZnJvbSAnd2VicGFjayc7XG5cbi8vIEhvc3QgaXMgdXNlZCBpbnN0ZWFkIG9mIFJlYWRvbmx5SG9zdCBkdWUgdG8gbW9zdCBkZWNvcmF0b3JzIG9ubHkgc3VwcG9ydGluZyBIb3N0c1xuZXhwb3J0IGNsYXNzIFdlYnBhY2tJbnB1dEhvc3QgaW1wbGVtZW50cyB2aXJ0dWFsRnMuSG9zdDxTdGF0cz4ge1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBpbnB1dEZpbGVTeXN0ZW06IElucHV0RmlsZVN5c3RlbSkgeyB9XG5cbiAgZ2V0IGNhcGFiaWxpdGllcygpOiB2aXJ0dWFsRnMuSG9zdENhcGFiaWxpdGllcyB7XG4gICAgcmV0dXJuIHsgc3luY2hyb25vdXM6IHRydWUgfTtcbiAgfVxuXG4gIHdyaXRlKF9wYXRoOiBQYXRoLCBfY29udGVudDogdmlydHVhbEZzLkZpbGVCdWZmZXJMaWtlKSB7XG4gICAgcmV0dXJuIHRocm93RXJyb3IobmV3IEVycm9yKCdOb3Qgc3VwcG9ydGVkLicpKTtcbiAgfVxuXG4gIGRlbGV0ZShfcGF0aDogUGF0aCkge1xuICAgIHJldHVybiB0aHJvd0Vycm9yKG5ldyBFcnJvcignTm90IHN1cHBvcnRlZC4nKSk7XG4gIH1cblxuICByZW5hbWUoX2Zyb206IFBhdGgsIF90bzogUGF0aCkge1xuICAgIHJldHVybiB0aHJvd0Vycm9yKG5ldyBFcnJvcignTm90IHN1cHBvcnRlZC4nKSk7XG4gIH1cblxuICByZWFkKHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPHZpcnR1YWxGcy5GaWxlQnVmZmVyPiB7XG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKG9icyA9PiB7XG4gICAgICAvLyBUT0RPOiByZW1vdmUgdGhpcyB0cnkrY2F0Y2ggd2hlbiBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vUmVhY3RpdmVYL3J4anMvaXNzdWVzLzM3NDAgaXNcbiAgICAgIC8vIGZpeGVkLlxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuaW5wdXRGaWxlU3lzdGVtLnJlYWRGaWxlU3luYyhnZXRTeXN0ZW1QYXRoKHBhdGgpKTtcbiAgICAgICAgb2JzLm5leHQobmV3IFVpbnQ4QXJyYXkoZGF0YSkuYnVmZmVyIGFzIEFycmF5QnVmZmVyKTtcbiAgICAgICAgb2JzLmNvbXBsZXRlKCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIG9icy5lcnJvcihlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGxpc3QocGF0aDogUGF0aCk6IE9ic2VydmFibGU8UGF0aEZyYWdtZW50W10+IHtcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUob2JzID0+IHtcbiAgICAgIC8vIFRPRE86IHJlbW92ZSB0aGlzIHRyeStjYXRjaCB3aGVuIGlzc3VlIGh0dHBzOi8vZ2l0aHViLmNvbS9SZWFjdGl2ZVgvcnhqcy9pc3N1ZXMvMzc0MCBpc1xuICAgICAgLy8gZml4ZWQuXG4gICAgICB0cnkge1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgICAgIGNvbnN0IG5hbWVzOiBzdHJpbmdbXSA9ICh0aGlzLmlucHV0RmlsZVN5c3RlbSBhcyBhbnkpLnJlYWRkaXJTeW5jKGdldFN5c3RlbVBhdGgocGF0aCkpO1xuICAgICAgICBvYnMubmV4dChuYW1lcy5tYXAobmFtZSA9PiBmcmFnbWVudChuYW1lKSkpO1xuICAgICAgICBvYnMuY29tcGxldGUoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBvYnMuZXJyb3IoZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGV4aXN0cyhwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdChwYXRoKS5waXBlKG1hcChzdGF0cyA9PiBzdGF0cyAhPSBudWxsKSk7XG4gIH1cblxuICBpc0RpcmVjdG9yeShwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdChwYXRoKS5waXBlKG1hcChzdGF0cyA9PiBzdGF0cyAhPSBudWxsICYmIHN0YXRzLmlzRGlyZWN0b3J5KCkpKTtcbiAgfVxuXG4gIGlzRmlsZShwYXRoOiBQYXRoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdChwYXRoKS5waXBlKG1hcChzdGF0cyA9PiBzdGF0cyAhPSBudWxsICYmIHN0YXRzLmlzRmlsZSgpKSk7XG4gIH1cblxuICBzdGF0KHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPFN0YXRzIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZShvYnMgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc3RhdHMgPSB0aGlzLmlucHV0RmlsZVN5c3RlbS5zdGF0U3luYyhnZXRTeXN0ZW1QYXRoKHBhdGgpKTtcbiAgICAgICAgb2JzLm5leHQoc3RhdHMpO1xuICAgICAgICBvYnMuY29tcGxldGUoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGUuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICBvYnMubmV4dChudWxsKTtcbiAgICAgICAgICBvYnMuY29tcGxldGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvYnMuZXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHdhdGNoKF9wYXRoOiBQYXRoLCBfb3B0aW9ucz86IHZpcnR1YWxGcy5Ib3N0V2F0Y2hPcHRpb25zKTogbnVsbCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==