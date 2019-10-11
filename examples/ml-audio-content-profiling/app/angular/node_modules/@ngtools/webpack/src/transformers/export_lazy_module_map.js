"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const path = require("path");
const ts = require("typescript");
const ast_helpers_1 = require("./ast_helpers");
const interfaces_1 = require("./interfaces");
const make_transform_1 = require("./make_transform");
function exportLazyModuleMap(shouldTransform, lazyRoutesCb) {
    const standardTransform = function (sourceFile) {
        const ops = [];
        const lazyRoutes = lazyRoutesCb();
        if (!shouldTransform(sourceFile.fileName)) {
            return ops;
        }
        const dirName = path.normalize(path.dirname(sourceFile.fileName));
        const modules = Object.keys(lazyRoutes)
            .map((loadChildrenString) => {
            const [, moduleName] = loadChildrenString.split('#');
            const modulePath = lazyRoutes[loadChildrenString];
            return {
                modulePath,
                moduleName,
                loadChildrenString,
            };
        });
        modules.forEach((module, index) => {
            const modulePath = module.modulePath;
            if (!modulePath) {
                return;
            }
            let relativePath = path.relative(dirName, modulePath).replace(/\\/g, '/');
            if (!(relativePath.startsWith('./') || relativePath.startsWith('../'))) {
                // 'a/b/c' is a relative path for Node but an absolute path for TS, so we must convert it.
                relativePath = `./${relativePath}`;
            }
            // Create the new namespace import node.
            const namespaceImport = ts.createNamespaceImport(ts.createIdentifier(`__lazy_${index}__`));
            const importClause = ts.createImportClause(undefined, namespaceImport);
            const newImport = ts.createImportDeclaration(undefined, undefined, importClause, ts.createLiteral(relativePath));
            const firstNode = ast_helpers_1.getFirstNode(sourceFile);
            if (firstNode) {
                ops.push(new interfaces_1.AddNodeOperation(sourceFile, firstNode, newImport));
            }
        });
        const lazyModuleObjectLiteral = ts.createObjectLiteral(modules.map((mod, idx) => {
            let [modulePath, moduleName] = mod.loadChildrenString.split('#');
            if (modulePath.match(/\.ngfactory/)) {
                modulePath = modulePath.replace('.ngfactory', '');
                moduleName = moduleName.replace('NgFactory', '');
            }
            return ts.createPropertyAssignment(ts.createLiteral(`${modulePath}#${moduleName}`), ts.createPropertyAccess(ts.createIdentifier(`__lazy_${idx}__`), mod.moduleName));
        }));
        const lazyModuleVariableStmt = ts.createVariableStatement([ts.createToken(ts.SyntaxKind.ExportKeyword)], [ts.createVariableDeclaration('LAZY_MODULE_MAP', undefined, lazyModuleObjectLiteral)]);
        const lastNode = ast_helpers_1.getLastNode(sourceFile);
        if (lastNode) {
            ops.push(new interfaces_1.AddNodeOperation(sourceFile, lastNode, undefined, lazyModuleVariableStmt));
        }
        return ops;
    };
    return make_transform_1.makeTransform(standardTransform);
}
exports.exportLazyModuleMap = exportLazyModuleMap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0X2xhenlfbW9kdWxlX21hcC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvbmd0b29scy93ZWJwYWNrL3NyYy90cmFuc2Zvcm1lcnMvZXhwb3J0X2xhenlfbW9kdWxlX21hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILDZCQUE2QjtBQUM3QixpQ0FBaUM7QUFFakMsK0NBQTBEO0FBQzFELDZDQUF1RjtBQUN2RixxREFBaUQ7QUFFakQsU0FBZ0IsbUJBQW1CLENBQ2pDLGVBQThDLEVBQzlDLFlBQWdDO0lBR2hDLE1BQU0saUJBQWlCLEdBQXNCLFVBQVUsVUFBeUI7UUFDOUUsTUFBTSxHQUFHLEdBQXlCLEVBQUUsQ0FBQztRQUVyQyxNQUFNLFVBQVUsR0FBRyxZQUFZLEVBQUUsQ0FBQztRQUVsQyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUN6QyxPQUFPLEdBQUcsQ0FBQztTQUNaO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBRWxFLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2FBQ3BDLEdBQUcsQ0FBQyxDQUFDLGtCQUFrQixFQUFFLEVBQUU7WUFDMUIsTUFBTSxDQUFDLEVBQUUsVUFBVSxDQUFDLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRWxELE9BQU87Z0JBQ0wsVUFBVTtnQkFDVixVQUFVO2dCQUNWLGtCQUFrQjthQUNuQixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFTCxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFB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Q0FBQyxDQUFDO0FBQzFDLENBQUM7QUEvRUQsa0RBK0VDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgTGF6eVJvdXRlTWFwIH0gZnJvbSAnLi4vbGF6eV9yb3V0ZXMnO1xuaW1wb3J0IHsgZ2V0Rmlyc3ROb2RlLCBnZXRMYXN0Tm9kZSB9IGZyb20gJy4vYXN0X2hlbHBlcnMnO1xuaW1wb3J0IHsgQWRkTm9kZU9wZXJhdGlvbiwgU3RhbmRhcmRUcmFuc2Zvcm0sIFRyYW5zZm9ybU9wZXJhdGlvbiB9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQgeyBtYWtlVHJhbnNmb3JtIH0gZnJvbSAnLi9tYWtlX3RyYW5zZm9ybSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBvcnRMYXp5TW9kdWxlTWFwKFxuICBzaG91bGRUcmFuc2Zvcm06IChmaWxlTmFtZTogc3RyaW5nKSA9PiBib29sZWFuLFxuICBsYXp5Um91dGVzQ2I6ICgpID0+IExhenlSb3V0ZU1hcCxcbik6IHRzLlRyYW5zZm9ybWVyRmFjdG9yeTx0cy5Tb3VyY2VGaWxlPiB7XG5cbiAgY29uc3Qgc3RhbmRhcmRUcmFuc2Zvcm06IFN0YW5kYXJkVHJhbnNmb3JtID0gZnVuY3Rpb24gKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpIHtcbiAgICBjb25zdCBvcHM6IFRyYW5zZm9ybU9wZXJhdGlvbltdID0gW107XG5cbiAgICBjb25zdCBsYXp5Um91dGVzID0gbGF6eVJvdXRlc0NiKCk7XG5cbiAgICBpZiAoIXNob3VsZFRyYW5zZm9ybShzb3VyY2VGaWxlLmZpbGVOYW1lKSkge1xuICAgICAgcmV0dXJuIG9wcztcbiAgICB9XG5cbiAgICBjb25zdCBkaXJOYW1lID0gcGF0aC5ub3JtYWxpemUocGF0aC5kaXJuYW1lKHNvdXJjZUZpbGUuZmlsZU5hbWUpKTtcblxuICAgIGNvbnN0IG1vZHVsZXMgPSBPYmplY3Qua2V5cyhsYXp5Um91dGVzKVxuICAgICAgLm1hcCgobG9hZENoaWxkcmVuU3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IFssIG1vZHVsZU5hbWVdID0gbG9hZENoaWxkcmVuU3RyaW5nLnNwbGl0KCcjJyk7XG4gICAgICAgIGNvbnN0IG1vZHVsZVBhdGggPSBsYXp5Um91dGVzW2xvYWRDaGlsZHJlblN0cmluZ107XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBtb2R1bGVQYXRoLFxuICAgICAgICAgIG1vZHVsZU5hbWUsXG4gICAgICAgICAgbG9hZENoaWxkcmVuU3RyaW5nLFxuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICBtb2R1bGVzLmZvckVhY2goKG1vZHVsZSwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IG1vZHVsZVBhdGggPSBtb2R1bGUubW9kdWxlUGF0aDtcbiAgICAgIGlmICghbW9kdWxlUGF0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGxldCByZWxhdGl2ZVBhdGggPSBwYXRoLnJlbGF0aXZlKGRpck5hbWUsIG1vZHVsZVBhdGgpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgIGlmICghKHJlbGF0aXZlUGF0aC5zdGFydHNXaXRoKCcuLycpIHx8IHJlbGF0aXZlUGF0aC5zdGFydHNXaXRoKCcuLi8nKSkpIHtcbiAgICAgICAgLy8gJ2EvYi9jJyBpcyBhIHJlbGF0aXZlIHBhdGggZm9yIE5vZGUgYnV0IGFuIGFic29sdXRlIHBhdGggZm9yIFRTLCBzbyB3ZSBtdXN0IGNvbnZlcnQgaXQuXG4gICAgICAgIHJlbGF0aXZlUGF0aCA9IGAuLyR7cmVsYXRpdmVQYXRofWA7XG4gICAgICB9XG4gICAgICAvLyBDcmVhdGUgdGhlIG5ldyBuYW1lc3BhY2UgaW1wb3J0IG5vZGUuXG4gICAgICBjb25zdCBuYW1lc3BhY2VJbXBvcnQgPSB0cy5jcmVhdGVOYW1lc3BhY2VJbXBvcnQodHMuY3JlYXRlSWRlbnRpZmllcihgX19sYXp5XyR7aW5kZXh9X19gKSk7XG4gICAgICBjb25zdCBpbXBvcnRDbGF1c2UgPSB0cy5jcmVhdGVJbXBvcnRDbGF1c2UodW5kZWZpbmVkLCBuYW1lc3BhY2VJbXBvcnQpO1xuICAgICAgY29uc3QgbmV3SW1wb3J0ID0gdHMuY3JlYXRlSW1wb3J0RGVjbGFyYXRpb24odW5kZWZpbmVkLCB1bmRlZmluZWQsIGltcG9ydENsYXVzZSxcbiAgICAgICAgdHMuY3JlYXRlTGl0ZXJhbChyZWxhdGl2ZVBhdGgpKTtcblxuICAgICAgY29uc3QgZmlyc3ROb2RlID0gZ2V0Rmlyc3ROb2RlKHNvdXJjZUZpbGUpO1xuICAgICAgaWYgKGZpcnN0Tm9kZSkge1xuICAgICAgICBvcHMucHVzaChuZXcgQWRkTm9kZU9wZXJhdGlvbihzb3VyY2VGaWxlLCBmaXJzdE5vZGUsIG5ld0ltcG9ydCkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgbGF6eU1vZHVsZU9iamVjdExpdGVyYWwgPSB0cy5jcmVhdGVPYmplY3RMaXRlcmFsKFxuICAgICAgbW9kdWxlcy5tYXAoKG1vZCwgaWR4KSA9PiB7XG4gICAgICAgIGxldCBbbW9kdWxlUGF0aCwgbW9kdWxlTmFtZV0gPSBtb2QubG9hZENoaWxkcmVuU3RyaW5nLnNwbGl0KCcjJyk7XG4gICAgICAgIGlmIChtb2R1bGVQYXRoLm1hdGNoKC9cXC5uZ2ZhY3RvcnkvKSkge1xuICAgICAgICAgIG1vZHVsZVBhdGggPSBtb2R1bGVQYXRoLnJlcGxhY2UoJy5uZ2ZhY3RvcnknLCAnJyk7XG4gICAgICAgICAgbW9kdWxlTmFtZSA9IG1vZHVsZU5hbWUucmVwbGFjZSgnTmdGYWN0b3J5JywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRzLmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudChcbiAgICAgICAgICB0cy5jcmVhdGVMaXRlcmFsKGAke21vZHVsZVBhdGh9IyR7bW9kdWxlTmFtZX1gKSxcbiAgICAgICAgICB0cy5jcmVhdGVQcm9wZXJ0eUFjY2Vzcyh0cy5jcmVhdGVJZGVudGlmaWVyKGBfX2xhenlfJHtpZHh9X19gKSwgbW9kLm1vZHVsZU5hbWUpKTtcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICBjb25zdCBsYXp5TW9kdWxlVmFyaWFibGVTdG10ID0gdHMuY3JlYXRlVmFyaWFibGVTdGF0ZW1lbnQoXG4gICAgICBbdHMuY3JlYXRlVG9rZW4odHMuU3ludGF4S2luZC5FeHBvcnRLZXl3b3JkKV0sXG4gICAgICBbdHMuY3JlYXRlVmFyaWFibGVEZWNsYXJhdGlvbignTEFaWV9NT0RVTEVfTUFQJywgdW5kZWZpbmVkLCBsYXp5TW9kdWxlT2JqZWN0TGl0ZXJhbCldLFxuICAgICk7XG5cbiAgICBjb25zdCBsYXN0Tm9kZSA9IGdldExhc3ROb2RlKHNvdXJjZUZpbGUpO1xuICAgIGlmIChsYXN0Tm9kZSkge1xuICAgICAgb3BzLnB1c2gobmV3IEFkZE5vZGVPcGVyYXRpb24oc291cmNlRmlsZSwgbGFzdE5vZGUsIHVuZGVmaW5lZCwgbGF6eU1vZHVsZVZhcmlhYmxlU3RtdCkpO1xuICAgIH1cblxuICAgIHJldHVybiBvcHM7XG4gIH07XG5cbiAgcmV0dXJuIG1ha2VUcmFuc2Zvcm0oc3RhbmRhcmRUcmFuc2Zvcm0pO1xufVxuIl19