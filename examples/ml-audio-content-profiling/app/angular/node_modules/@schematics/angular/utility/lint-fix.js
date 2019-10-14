"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
function applyLintFix(path = '/') {
    return (tree, context) => {
        // Find the closest tsling.json
        let dir = tree.getDir(path.substr(0, path.lastIndexOf('/')));
        do {
            if (dir.subfiles.includes('tslint.json')) {
                break;
            }
            dir = dir.parent;
        } while (dir !== null);
        if (dir === null) {
            throw new schematics_1.SchematicsException('Asked to run lint fixes, but could not find a tslint.json.');
        }
        // Only include files that have been touched.
        const files = tree.actions.reduce((acc, action) => {
            const path = action.path.substr(1); // Remove the starting '/'.
            if (path.endsWith('.ts') && dir && action.path.startsWith(dir.path)) {
                acc.add(path);
            }
            return acc;
        }, new Set());
        context.addTask(new tasks_1.TslintFixTask({
            ignoreErrors: true,
            tsConfigPath: 'tsconfig.json',
            files: [...files],
        }));
    };
}
exports.applyLintFix = applyLintFix;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGludC1maXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2xpbnQtZml4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsMkRBTW9DO0FBQ3BDLDREQUFpRTtBQUVqRSxTQUFnQixZQUFZLENBQUMsSUFBSSxHQUFHLEdBQUc7SUFDckMsT0FBTyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7UUFDL0MsK0JBQStCO1FBQy9CLElBQUksR0FBRyxHQUFvQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTlFLEdBQUc7WUFDRCxJQUFLLEdBQUcsQ0FBQyxRQUFxQixDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRTtnQkFDdEQsTUFBTTthQUNQO1lBRUQsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7U0FDbEIsUUFBUSxHQUFHLEtBQUssSUFBSSxFQUFFO1FBRXZCLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtZQUNoQixNQUFNLElBQUksZ0NBQW1CLENBQUMsNERBQTRELENBQUMsQ0FBQztTQUM3RjtRQUVELDZDQUE2QztRQUM3QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQWdCLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDN0QsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSwyQkFBMkI7WUFDaEUsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ25FLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDZjtZQUVELE9BQU8sR0FBRyxDQUFDO1FBQ2IsQ0FBQyxFQUFFLElBQUksR0FBRyxFQUFVLENBQUMsQ0FBQztRQUV0QixPQUFPLENBQUMsT0FBTyxDQUFDLElBQUkscUJBQWEsQ0FBQztZQUNoQyxZQUFZLEVBQUUsSUFBSTtZQUNsQixZQUFZLEVBQUUsZUFBZTtZQUM3QixLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUNsQixDQUFDLENBQUMsQ0FBQztJQUNOLENBQUMsQ0FBQztBQUNKLENBQUM7QUFqQ0Qsb0NBaUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgRGlyRW50cnksXG4gIFJ1bGUsXG4gIFNjaGVtYXRpY0NvbnRleHQsXG4gIFNjaGVtYXRpY3NFeGNlcHRpb24sXG4gIFRyZWUsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7IFRzbGludEZpeFRhc2sgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90YXNrcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseUxpbnRGaXgocGF0aCA9ICcvJyk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICAvLyBGaW5kIHRoZSBjbG9zZXN0IHRzbGluZy5qc29uXG4gICAgbGV0IGRpcjogRGlyRW50cnkgfCBudWxsID0gdHJlZS5nZXREaXIocGF0aC5zdWJzdHIoMCwgcGF0aC5sYXN0SW5kZXhPZignLycpKSk7XG5cbiAgICBkbyB7XG4gICAgICBpZiAoKGRpci5zdWJmaWxlcyBhcyBzdHJpbmdbXSkuaW5jbHVkZXMoJ3RzbGludC5qc29uJykpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGRpciA9IGRpci5wYXJlbnQ7XG4gICAgfSB3aGlsZSAoZGlyICE9PSBudWxsKTtcblxuICAgIGlmIChkaXIgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdBc2tlZCB0byBydW4gbGludCBmaXhlcywgYnV0IGNvdWxkIG5vdCBmaW5kIGEgdHNsaW50Lmpzb24uJyk7XG4gICAgfVxuXG4gICAgLy8gT25seSBpbmNsdWRlIGZpbGVzIHRoYXQgaGF2ZSBiZWVuIHRvdWNoZWQuXG4gICAgY29uc3QgZmlsZXMgPSB0cmVlLmFjdGlvbnMucmVkdWNlKChhY2M6IFNldDxzdHJpbmc+LCBhY3Rpb24pID0+IHtcbiAgICAgIGNvbnN0IHBhdGggPSBhY3Rpb24ucGF0aC5zdWJzdHIoMSk7ICAvLyBSZW1vdmUgdGhlIHN0YXJ0aW5nICcvJy5cbiAgICAgIGlmIChwYXRoLmVuZHNXaXRoKCcudHMnKSAmJiBkaXIgJiYgYWN0aW9uLnBhdGguc3RhcnRzV2l0aChkaXIucGF0aCkpIHtcbiAgICAgICAgYWNjLmFkZChwYXRoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCBuZXcgU2V0PHN0cmluZz4oKSk7XG5cbiAgICBjb250ZXh0LmFkZFRhc2sobmV3IFRzbGludEZpeFRhc2soe1xuICAgICAgaWdub3JlRXJyb3JzOiB0cnVlLFxuICAgICAgdHNDb25maWdQYXRoOiAndHNjb25maWcuanNvbicsXG4gICAgICBmaWxlczogWy4uLmZpbGVzXSxcbiAgICB9KSk7XG4gIH07XG59XG4iXX0=