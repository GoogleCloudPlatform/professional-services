"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-global-tslint-disable no-any
const core_1 = require("@angular-devkit/core");
const fs = require("fs");
const os = require("os");
const path = require("path");
const find_up_1 = require("./find-up");
function insideWorkspace() {
    return getWorkspaceDetails() !== null;
}
exports.insideWorkspace = insideWorkspace;
function getWorkspaceDetails() {
    const currentDir = process.cwd();
    const possibleConfigFiles = [
        'angular.json',
        '.angular.json',
        'angular-cli.json',
        '.angular-cli.json',
    ];
    const configFilePath = find_up_1.findUp(possibleConfigFiles, currentDir);
    if (configFilePath === null) {
        return null;
    }
    const configFileName = path.basename(configFilePath);
    const possibleDir = path.dirname(configFilePath);
    const homedir = os.homedir();
    if (core_1.normalize(possibleDir) === core_1.normalize(homedir)) {
        const packageJsonPath = path.join(possibleDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            // No package.json
            return null;
        }
        const packageJsonBuffer = fs.readFileSync(packageJsonPath);
        const packageJsonText = packageJsonBuffer === null ? '{}' : packageJsonBuffer.toString();
        const packageJson = JSON.parse(packageJsonText);
        if (!containsCliDep(packageJson)) {
            // No CLI dependency
            return null;
        }
    }
    return {
        root: possibleDir,
        configFile: configFileName,
    };
}
exports.getWorkspaceDetails = getWorkspaceDetails;
function containsCliDep(obj) {
    const pkgName = '@angular/cli';
    if (obj) {
        if (obj.dependencies && obj.dependencies[pkgName]) {
            return true;
        }
        if (obj.devDependencies && obj.devDependencies[pkgName]) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhci9jbGkvdXRpbGl0aWVzL3Byb2plY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCxpREFBaUQ7QUFDakQsK0NBQWlEO0FBQ2pELHlCQUF5QjtBQUN6Qix5QkFBeUI7QUFDekIsNkJBQTZCO0FBRTdCLHVDQUFtQztBQUVuQyxTQUFnQixlQUFlO0lBQzdCLE9BQU8sbUJBQW1CLEVBQUUsS0FBSyxJQUFJLENBQUM7QUFDeEMsQ0FBQztBQUZELDBDQUVDO0FBRUQsU0FBZ0IsbUJBQW1CO0lBQ2pDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNqQyxNQUFNLG1CQUFtQixHQUFHO1FBQzFCLGNBQWM7UUFDZCxlQUFlO1FBQ2Ysa0JBQWtCO1FBQ2xCLG1CQUFtQjtLQUNwQixDQUFDO0lBQ0YsTUFBTSxjQUFjLEdBQUcsZ0JBQU0sQ0FBQyxtQkFBbUIsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMvRCxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7UUFDM0IsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7SUFFckQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUVqRCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0IsSUFBSSxnQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLGdCQUFTLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDakQsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDL0QsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDbkMsa0JBQWtCO1lBQ2xCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDM0QsTUFBTSxlQUFlLEdBQUcsaUJBQWlCLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3pGLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUNoQyxvQkFBb0I7WUFDcEIsT0FBTyxJQUFJLENBQUM7U0FDYjtLQUNGO0lBRUQsT0FBTztRQUNMLElBQUksRUFBRSxXQUFXO1FBQ2pCLFVBQVUsRUFBRSxjQUFjO0tBQzNCLENBQUM7QUFDSixDQUFDO0FBcENELGtEQW9DQztBQUVELFNBQVMsY0FBYyxDQUFDLEdBQVE7SUFDOUIsTUFBTSxPQUFPLEdBQUcsY0FBYyxDQUFDO0lBQy9CLElBQUksR0FBRyxFQUFFO1FBQ1AsSUFBSSxHQUFHLENBQUMsWUFBWSxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDakQsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELElBQUksR0FBRyxDQUFDLGVBQWUsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3ZELE9BQU8sSUFBSSxDQUFDO1NBQ2I7S0FDRjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gdHNsaW50OmRpc2FibGU6bm8tZ2xvYmFsLXRzbGludC1kaXNhYmxlIG5vLWFueVxuaW1wb3J0IHsgbm9ybWFsaXplIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgb3MgZnJvbSAnb3MnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IENvbW1hbmRXb3Jrc3BhY2UgfSBmcm9tICcuLi9tb2RlbHMvaW50ZXJmYWNlJztcbmltcG9ydCB7IGZpbmRVcCB9IGZyb20gJy4vZmluZC11cCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnNpZGVXb3Jrc3BhY2UoKTogYm9vbGVhbiB7XG4gIHJldHVybiBnZXRXb3Jrc3BhY2VEZXRhaWxzKCkgIT09IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXb3Jrc3BhY2VEZXRhaWxzKCk6IENvbW1hbmRXb3Jrc3BhY2UgfCBudWxsIHtcbiAgY29uc3QgY3VycmVudERpciA9IHByb2Nlc3MuY3dkKCk7XG4gIGNvbnN0IHBvc3NpYmxlQ29uZmlnRmlsZXMgPSBbXG4gICAgJ2FuZ3VsYXIuanNvbicsXG4gICAgJy5hbmd1bGFyLmpzb24nLFxuICAgICdhbmd1bGFyLWNsaS5qc29uJyxcbiAgICAnLmFuZ3VsYXItY2xpLmpzb24nLFxuICBdO1xuICBjb25zdCBjb25maWdGaWxlUGF0aCA9IGZpbmRVcChwb3NzaWJsZUNvbmZpZ0ZpbGVzLCBjdXJyZW50RGlyKTtcbiAgaWYgKGNvbmZpZ0ZpbGVQYXRoID09PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgY29uZmlnRmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGNvbmZpZ0ZpbGVQYXRoKTtcblxuICBjb25zdCBwb3NzaWJsZURpciA9IHBhdGguZGlybmFtZShjb25maWdGaWxlUGF0aCk7XG5cbiAgY29uc3QgaG9tZWRpciA9IG9zLmhvbWVkaXIoKTtcbiAgaWYgKG5vcm1hbGl6ZShwb3NzaWJsZURpcikgPT09IG5vcm1hbGl6ZShob21lZGlyKSkge1xuICAgIGNvbnN0IHBhY2thZ2VKc29uUGF0aCA9IHBhdGguam9pbihwb3NzaWJsZURpciwgJ3BhY2thZ2UuanNvbicpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhwYWNrYWdlSnNvblBhdGgpKSB7XG4gICAgICAvLyBObyBwYWNrYWdlLmpzb25cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBwYWNrYWdlSnNvbkJ1ZmZlciA9IGZzLnJlYWRGaWxlU3luYyhwYWNrYWdlSnNvblBhdGgpO1xuICAgIGNvbnN0IHBhY2thZ2VKc29uVGV4dCA9IHBhY2thZ2VKc29uQnVmZmVyID09PSBudWxsID8gJ3t9JyA6IHBhY2thZ2VKc29uQnVmZmVyLnRvU3RyaW5nKCk7XG4gICAgY29uc3QgcGFja2FnZUpzb24gPSBKU09OLnBhcnNlKHBhY2thZ2VKc29uVGV4dCk7XG4gICAgaWYgKCFjb250YWluc0NsaURlcChwYWNrYWdlSnNvbikpIHtcbiAgICAgIC8vIE5vIENMSSBkZXBlbmRlbmN5XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJvb3Q6IHBvc3NpYmxlRGlyLFxuICAgIGNvbmZpZ0ZpbGU6IGNvbmZpZ0ZpbGVOYW1lLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjb250YWluc0NsaURlcChvYmo6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBwa2dOYW1lID0gJ0Bhbmd1bGFyL2NsaSc7XG4gIGlmIChvYmopIHtcbiAgICBpZiAob2JqLmRlcGVuZGVuY2llcyAmJiBvYmouZGVwZW5kZW5jaWVzW3BrZ05hbWVdKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKG9iai5kZXZEZXBlbmRlbmNpZXMgJiYgb2JqLmRldkRlcGVuZGVuY2llc1twa2dOYW1lXSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19