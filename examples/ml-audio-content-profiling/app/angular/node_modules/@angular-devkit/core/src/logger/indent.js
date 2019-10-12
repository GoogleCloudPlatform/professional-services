"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const operators_1 = require("rxjs/operators");
const logger_1 = require("./logger");
/**
 * Keep an map of indentation => array of indentations based on the level.
 * This is to optimize calculating the prefix based on the indentation itself. Since most logs
 * come from similar levels, and with similar indentation strings, this will be shared by all
 * loggers. Also, string concatenation is expensive so performing concats for every log entries
 * is expensive; this alleviates it.
 */
const indentationMap = {};
class IndentLogger extends logger_1.Logger {
    constructor(name, parent = null, indentation = '  ') {
        super(name, parent);
        indentationMap[indentation] = indentationMap[indentation] || [''];
        const indentMap = indentationMap[indentation];
        this._observable = this._observable.pipe(operators_1.map(entry => {
            const l = entry.path.filter(x => !!x).length;
            if (l >= indentMap.length) {
                let current = indentMap[indentMap.length - 1];
                while (l >= indentMap.length) {
                    current += indentation;
                    indentMap.push(current);
                }
            }
            entry.message = indentMap[l] + entry.message.split(/\n/).join('\n' + indentMap[l]);
            return entry;
        }));
    }
}
exports.IndentLogger = IndentLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50LmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy9sb2dnZXIvaW5kZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsOENBQXFDO0FBQ3JDLHFDQUFrQztBQUdsQzs7Ozs7O0dBTUc7QUFDSCxNQUFNLGNBQWMsR0FBMEMsRUFBRSxDQUFDO0FBR2pFLE1BQWEsWUFBYSxTQUFRLGVBQU07SUFDdEMsWUFBWSxJQUFZLEVBQUUsU0FBd0IsSUFBSSxFQUFFLFdBQVcsR0FBRyxJQUFJO1FBQ3hFLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFcEIsY0FBYyxDQUFDLFdBQVcsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xFLE1BQU0sU0FBUyxHQUFHLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUU5QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGVBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNuRCxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDN0MsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRTtnQkFDekIsSUFBSSxPQUFPLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLE9BQU8sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUU7b0JBQzVCLE9BQU8sSUFBSSxXQUFXLENBQUM7b0JBQ3ZCLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ3pCO2FBQ0Y7WUFFRCxLQUFLLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRW5GLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNOLENBQUM7Q0FDRjtBQXRCRCxvQ0FzQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuL2xvZ2dlcic7XG5cblxuLyoqXG4gKiBLZWVwIGFuIG1hcCBvZiBpbmRlbnRhdGlvbiA9PiBhcnJheSBvZiBpbmRlbnRhdGlvbnMgYmFzZWQgb24gdGhlIGxldmVsLlxuICogVGhpcyBpcyB0byBvcHRpbWl6ZSBjYWxjdWxhdGluZyB0aGUgcHJlZml4IGJhc2VkIG9uIHRoZSBpbmRlbnRhdGlvbiBpdHNlbGYuIFNpbmNlIG1vc3QgbG9nc1xuICogY29tZSBmcm9tIHNpbWlsYXIgbGV2ZWxzLCBhbmQgd2l0aCBzaW1pbGFyIGluZGVudGF0aW9uIHN0cmluZ3MsIHRoaXMgd2lsbCBiZSBzaGFyZWQgYnkgYWxsXG4gKiBsb2dnZXJzLiBBbHNvLCBzdHJpbmcgY29uY2F0ZW5hdGlvbiBpcyBleHBlbnNpdmUgc28gcGVyZm9ybWluZyBjb25jYXRzIGZvciBldmVyeSBsb2cgZW50cmllc1xuICogaXMgZXhwZW5zaXZlOyB0aGlzIGFsbGV2aWF0ZXMgaXQuXG4gKi9cbmNvbnN0IGluZGVudGF0aW9uTWFwOiB7W2luZGVudGF0aW9uVHlwZTogc3RyaW5nXTogc3RyaW5nW119ID0ge307XG5cblxuZXhwb3J0IGNsYXNzIEluZGVudExvZ2dlciBleHRlbmRzIExvZ2dlciB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgcGFyZW50OiBMb2dnZXIgfCBudWxsID0gbnVsbCwgaW5kZW50YXRpb24gPSAnICAnKSB7XG4gICAgc3VwZXIobmFtZSwgcGFyZW50KTtcblxuICAgIGluZGVudGF0aW9uTWFwW2luZGVudGF0aW9uXSA9IGluZGVudGF0aW9uTWFwW2luZGVudGF0aW9uXSB8fCBbJyddO1xuICAgIGNvbnN0IGluZGVudE1hcCA9IGluZGVudGF0aW9uTWFwW2luZGVudGF0aW9uXTtcblxuICAgIHRoaXMuX29ic2VydmFibGUgPSB0aGlzLl9vYnNlcnZhYmxlLnBpcGUobWFwKGVudHJ5ID0+IHtcbiAgICAgIGNvbnN0IGwgPSBlbnRyeS5wYXRoLmZpbHRlcih4ID0+ICEheCkubGVuZ3RoO1xuICAgICAgaWYgKGwgPj0gaW5kZW50TWFwLmxlbmd0aCkge1xuICAgICAgICBsZXQgY3VycmVudCA9IGluZGVudE1hcFtpbmRlbnRNYXAubGVuZ3RoIC0gMV07XG4gICAgICAgIHdoaWxlIChsID49IGluZGVudE1hcC5sZW5ndGgpIHtcbiAgICAgICAgICBjdXJyZW50ICs9IGluZGVudGF0aW9uO1xuICAgICAgICAgIGluZGVudE1hcC5wdXNoKGN1cnJlbnQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGVudHJ5Lm1lc3NhZ2UgPSBpbmRlbnRNYXBbbF0gKyBlbnRyeS5tZXNzYWdlLnNwbGl0KC9cXG4vKS5qb2luKCdcXG4nICsgaW5kZW50TWFwW2xdKTtcblxuICAgICAgcmV0dXJuIGVudHJ5O1xuICAgIH0pKTtcbiAgfVxufVxuIl19