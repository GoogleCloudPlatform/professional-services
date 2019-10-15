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
const base_1 = require("./base");
function rename(match, to) {
    return base_1.forEach(entry => {
        if (match(entry.path, entry)) {
            return {
                content: entry.content,
                path: core_1.normalize(to(entry.path, entry)),
            };
        }
        else {
            return entry;
        }
    });
}
exports.rename = rename;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuYW1lLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9ydWxlcy9yZW5hbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FBaUQ7QUFHakQsaUNBQWlDO0FBR2pDLFNBQWdCLE1BQU0sQ0FBQyxLQUE2QixFQUFFLEVBQXlCO0lBQzdFLE9BQU8sY0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3JCLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7WUFDNUIsT0FBTztnQkFDTCxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3RCLElBQUksRUFBRSxnQkFBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ3ZDLENBQUM7U0FDSDthQUFNO1lBQ0wsT0FBTyxLQUFLLENBQUM7U0FDZDtJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVhELHdCQVdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgbm9ybWFsaXplIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgUnVsZSB9IGZyb20gJy4uL2VuZ2luZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgRmlsZVByZWRpY2F0ZSB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7IGZvckVhY2ggfSBmcm9tICcuL2Jhc2UnO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiByZW5hbWUobWF0Y2g6IEZpbGVQcmVkaWNhdGU8Ym9vbGVhbj4sIHRvOiBGaWxlUHJlZGljYXRlPHN0cmluZz4pOiBSdWxlIHtcbiAgcmV0dXJuIGZvckVhY2goZW50cnkgPT4ge1xuICAgIGlmIChtYXRjaChlbnRyeS5wYXRoLCBlbnRyeSkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbnRlbnQ6IGVudHJ5LmNvbnRlbnQsXG4gICAgICAgIHBhdGg6IG5vcm1hbGl6ZSh0byhlbnRyeS5wYXRoLCBlbnRyeSkpLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGVudHJ5O1xuICAgIH1cbiAgfSk7XG59XG4iXX0=