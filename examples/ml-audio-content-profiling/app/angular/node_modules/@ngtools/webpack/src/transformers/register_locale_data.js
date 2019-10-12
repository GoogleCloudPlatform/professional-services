"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const ts = require("typescript");
const ast_helpers_1 = require("./ast_helpers");
const insert_import_1 = require("./insert_import");
const interfaces_1 = require("./interfaces");
const make_transform_1 = require("./make_transform");
function registerLocaleData(shouldTransform, getEntryModule, locale) {
    const standardTransform = function (sourceFile) {
        const ops = [];
        const entryModule = getEntryModule();
        if (!shouldTransform(sourceFile.fileName) || !entryModule || !locale) {
            return ops;
        }
        // Find all identifiers using the entry module class name.
        const entryModuleIdentifiers = ast_helpers_1.collectDeepNodes(sourceFile, ts.SyntaxKind.Identifier)
            .filter(identifier => identifier.text === entryModule.className);
        if (entryModuleIdentifiers.length === 0) {
            return [];
        }
        // Find the bootstrap call
        entryModuleIdentifiers.forEach(entryModuleIdentifier => {
            // Figure out if it's a `platformBrowserDynamic().bootstrapModule(AppModule)` call.
            if (!(entryModuleIdentifier.parent
                && entryModuleIdentifier.parent.kind === ts.SyntaxKind.CallExpression)) {
                return;
            }
            const callExpr = entryModuleIdentifier.parent;
            if (callExpr.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) {
                return;
            }
            const propAccessExpr = callExpr.expression;
            if (propAccessExpr.name.text !== 'bootstrapModule'
                || propAccessExpr.expression.kind !== ts.SyntaxKind.CallExpression) {
                return;
            }
            const firstNode = ast_helpers_1.getFirstNode(sourceFile);
            if (!firstNode) {
                return;
            }
            // Create the import node for the locale.
            const localeNamespaceId = ts.createUniqueName('__NgCli_locale_');
            ops.push(...insert_import_1.insertStarImport(sourceFile, localeNamespaceId, `@angular/common/locales/${locale}`, firstNode, true));
            // Create the import node for the registerLocaleData function.
            const regIdentifier = ts.createIdentifier(`registerLocaleData`);
            const regNamespaceId = ts.createUniqueName('__NgCli_locale_');
            ops.push(...insert_import_1.insertStarImport(sourceFile, regNamespaceId, '@angular/common', firstNode, true));
            // Create the register function call
            const registerFunctionCall = ts.createCall(ts.createPropertyAccess(regNamespaceId, regIdentifier), undefined, [ts.createPropertyAccess(localeNamespaceId, 'default')]);
            const registerFunctionStatement = ts.createStatement(registerFunctionCall);
            ops.push(new interfaces_1.AddNodeOperation(sourceFile, firstNode, registerFunctionStatement));
        });
        return ops;
    };
    return make_transform_1.makeTransform(standardTransform);
}
exports.registerLocaleData = registerLocaleData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0ZXJfbG9jYWxlX2RhdGEuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvdHJhbnNmb3JtZXJzL3JlZ2lzdGVyX2xvY2FsZV9kYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsaUNBQWlDO0FBQ2pDLCtDQUErRDtBQUMvRCxtREFBbUQ7QUFDbkQsNkNBQXVGO0FBQ3ZGLHFEQUFpRDtBQUdqRCxTQUFnQixrQkFBa0IsQ0FDaEMsZUFBOEMsRUFDOUMsY0FBZ0UsRUFDaEUsTUFBYztJQUdkLE1BQU0saUJBQWlCLEdBQXNCLFVBQVUsVUFBeUI7UUFDOUUsTUFBTSxHQUFHLEdBQXlCLEVBQUUsQ0FBQztRQUVyQyxNQUFNLFdBQVcsR0FBRyxjQUFjLEVBQUUsQ0FBQztRQUVyQyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNwRSxPQUFPLEdBQUcsQ0FBQztTQUNaO1FBRUQsMERBQTBEO1FBQzFELE1BQU0sc0JBQXNCLEdBQUcsOEJBQWdCLENBQWdCLFVBQVUsRUFDdkUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUM7YUFDeEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFbkUsSUFBSSxzQkFBc0IsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3ZDLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFFRCwwQkFBMEI7UUFDMUIsc0JBQXNCLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLEVBQUU7WUFDckQsbUZBQW1GO1lBQ25GLElBQUksQ0FBQyxDQUNILHFCQUFxQixDQUFDLE1BQU07bUJBQ3pCLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQ3RFLEVBQUU7Z0JBQ0QsT0FBTzthQUNSO1lBRUQsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsTUFBMkIsQ0FBQztZQUVuRSxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLEVBQUU7Z0JBQ3ZFLE9BQU87YUFDUjtZQUVELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxVQUF5QyxDQUFDO1lBRTFFLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssaUJBQWlCO21CQUM3QyxjQUFjLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRTtnQkFDcEUsT0FBTzthQUNSO1lBRUQsTUFBTSxTQUFTLEdBQUcsMEJBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUUzQyxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNkLE9BQU87YUFDUjtZQUVELHlDQUF5QztZQUN6QyxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ2pFLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxnQ0FBZ0IsQ0FDMUIsVUFBVSxFQUNWLGlCQUFpQixFQUNqQiwyQkFBMkIsTUFBTSxFQUFFLEVBQ25DLFNBQVMsRUFDVCxJQUFJLENBQ0wsQ0FBQyxDQUFDO1lBRUgsOERBQThEO1lBQzlELE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzlELEdBQUcsQ0FBQyxJQUFJLENBQ04sR0FBRyxnQ0FBZ0IsQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FDcEYsQ0FBQztZQUVGLG9DQUFvQztZQUNwQyxNQUFNLG9CQUFvQixHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQ3hDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLEVBQUUsYUFBYSxDQUFDLEVBQ3RELFNBQVMsRUFDVCxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUN4RCxDQUFDO1lBQ0YsTUFBTSx5QkFBeUIsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFFM0UsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLDZCQUFnQixDQUMzQixVQUFVLEVBQ1YsU0FBUyxFQUNULHlCQUF5QixDQUMxQixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQyxDQUFDO0lBRUYsT0FBTyw4QkFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDMUMsQ0FBQztBQXpGRCxnREF5RkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7IGNvbGxlY3REZWVwTm9kZXMsIGdldEZpcnN0Tm9kZSB9IGZyb20gJy4vYXN0X2hlbHBlcnMnO1xuaW1wb3J0IHsgaW5zZXJ0U3RhckltcG9ydCB9IGZyb20gJy4vaW5zZXJ0X2ltcG9ydCc7XG5pbXBvcnQgeyBBZGROb2RlT3BlcmF0aW9uLCBTdGFuZGFyZFRyYW5zZm9ybSwgVHJhbnNmb3JtT3BlcmF0aW9uIH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7IG1ha2VUcmFuc2Zvcm0gfSBmcm9tICcuL21ha2VfdHJhbnNmb3JtJztcblxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJMb2NhbGVEYXRhKFxuICBzaG91bGRUcmFuc2Zvcm06IChmaWxlTmFtZTogc3RyaW5nKSA9PiBib29sZWFuLFxuICBnZXRFbnRyeU1vZHVsZTogKCkgPT4geyBwYXRoOiBzdHJpbmcsIGNsYXNzTmFtZTogc3RyaW5nIH0gfCBudWxsLFxuICBsb2NhbGU6IHN0cmluZyxcbik6IHRzLlRyYW5zZm9ybWVyRmFjdG9yeTx0cy5Tb3VyY2VGaWxlPiB7XG5cbiAgY29uc3Qgc3RhbmRhcmRUcmFuc2Zvcm06IFN0YW5kYXJkVHJhbnNmb3JtID0gZnVuY3Rpb24gKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpIHtcbiAgICBjb25zdCBvcHM6IFRyYW5zZm9ybU9wZXJhdGlvbltdID0gW107XG5cbiAgICBjb25zdCBlbnRyeU1vZHVsZSA9IGdldEVudHJ5TW9kdWxlKCk7XG5cbiAgICBpZiAoIXNob3VsZFRyYW5zZm9ybShzb3VyY2VGaWxlLmZpbGVOYW1lKSB8fCAhZW50cnlNb2R1bGUgfHwgIWxvY2FsZSkge1xuICAgICAgcmV0dXJuIG9wcztcbiAgICB9XG5cbiAgICAvLyBGaW5kIGFsbCBpZGVudGlmaWVycyB1c2luZyB0aGUgZW50cnkgbW9kdWxlIGNsYXNzIG5hbWUuXG4gICAgY29uc3QgZW50cnlNb2R1bGVJZGVudGlmaWVycyA9IGNvbGxlY3REZWVwTm9kZXM8dHMuSWRlbnRpZmllcj4oc291cmNlRmlsZSxcbiAgICAgIHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcilcbiAgICAgIC5maWx0ZXIoaWRlbnRpZmllciA9PiBpZGVudGlmaWVyLnRleHQgPT09IGVudHJ5TW9kdWxlLmNsYXNzTmFtZSk7XG5cbiAgICBpZiAoZW50cnlNb2R1bGVJZGVudGlmaWVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICAvLyBGaW5kIHRoZSBib290c3RyYXAgY2FsbFxuICAgIGVudHJ5TW9kdWxlSWRlbnRpZmllcnMuZm9yRWFjaChlbnRyeU1vZHVsZUlkZW50aWZpZXIgPT4ge1xuICAgICAgLy8gRmlndXJlIG91dCBpZiBpdCdzIGEgYHBsYXRmb3JtQnJvd3NlckR5bmFtaWMoKS5ib290c3RyYXBNb2R1bGUoQXBwTW9kdWxlKWAgY2FsbC5cbiAgICAgIGlmICghKFxuICAgICAgICBlbnRyeU1vZHVsZUlkZW50aWZpZXIucGFyZW50XG4gICAgICAgICYmIGVudHJ5TW9kdWxlSWRlbnRpZmllci5wYXJlbnQua2luZCA9PT0gdHMuU3ludGF4S2luZC5DYWxsRXhwcmVzc2lvblxuICAgICAgKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNhbGxFeHByID0gZW50cnlNb2R1bGVJZGVudGlmaWVyLnBhcmVudCBhcyB0cy5DYWxsRXhwcmVzc2lvbjtcblxuICAgICAgaWYgKGNhbGxFeHByLmV4cHJlc3Npb24ua2luZCAhPT0gdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwcm9wQWNjZXNzRXhwciA9IGNhbGxFeHByLmV4cHJlc3Npb24gYXMgdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uO1xuXG4gICAgICBpZiAocHJvcEFjY2Vzc0V4cHIubmFtZS50ZXh0ICE9PSAnYm9vdHN0cmFwTW9kdWxlJ1xuICAgICAgICB8fCBwcm9wQWNjZXNzRXhwci5leHByZXNzaW9uLmtpbmQgIT09IHRzLlN5bnRheEtpbmQuQ2FsbEV4cHJlc3Npb24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBmaXJzdE5vZGUgPSBnZXRGaXJzdE5vZGUoc291cmNlRmlsZSk7XG5cbiAgICAgIGlmICghZmlyc3ROb2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIHRoZSBpbXBvcnQgbm9kZSBmb3IgdGhlIGxvY2FsZS5cbiAgICAgIGNvbnN0IGxvY2FsZU5hbWVzcGFjZUlkID0gdHMuY3JlYXRlVW5pcXVlTmFtZSgnX19OZ0NsaV9sb2NhbGVfJyk7XG4gICAgICBvcHMucHVzaCguLi5pbnNlcnRTdGFySW1wb3J0KFxuICAgICAgICBzb3VyY2VGaWxlLFxuICAgICAgICBsb2NhbGVOYW1lc3BhY2VJZCxcbiAgICAgICAgYEBhbmd1bGFyL2NvbW1vbi9sb2NhbGVzLyR7bG9jYWxlfWAsXG4gICAgICAgIGZpcnN0Tm9kZSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICkpO1xuXG4gICAgICAvLyBDcmVhdGUgdGhlIGltcG9ydCBub2RlIGZvciB0aGUgcmVnaXN0ZXJMb2NhbGVEYXRhIGZ1bmN0aW9uLlxuICAgICAgY29uc3QgcmVnSWRlbnRpZmllciA9IHRzLmNyZWF0ZUlkZW50aWZpZXIoYHJlZ2lzdGVyTG9jYWxlRGF0YWApO1xuICAgICAgY29uc3QgcmVnTmFtZXNwYWNlSWQgPSB0cy5jcmVhdGVVbmlxdWVOYW1lKCdfX05nQ2xpX2xvY2FsZV8nKTtcbiAgICAgIG9wcy5wdXNoKFxuICAgICAgICAuLi5pbnNlcnRTdGFySW1wb3J0KHNvdXJjZUZpbGUsIHJlZ05hbWVzcGFjZUlkLCAnQGFuZ3VsYXIvY29tbW9uJywgZmlyc3ROb2RlLCB0cnVlKSxcbiAgICAgICk7XG5cbiAgICAgIC8vIENyZWF0ZSB0aGUgcmVnaXN0ZXIgZnVuY3Rpb24gY2FsbFxuICAgICAgY29uc3QgcmVnaXN0ZXJGdW5jdGlvbkNhbGwgPSB0cy5jcmVhdGVDYWxsKFxuICAgICAgICB0cy5jcmVhdGVQcm9wZXJ0eUFjY2VzcyhyZWdOYW1lc3BhY2VJZCwgcmVnSWRlbnRpZmllciksXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgW3RzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKGxvY2FsZU5hbWVzcGFjZUlkLCAnZGVmYXVsdCcpXSxcbiAgICAgICk7XG4gICAgICBjb25zdCByZWdpc3RlckZ1bmN0aW9uU3RhdGVtZW50ID0gdHMuY3JlYXRlU3RhdGVtZW50KHJlZ2lzdGVyRnVuY3Rpb25DYWxsKTtcblxuICAgICAgb3BzLnB1c2gobmV3IEFkZE5vZGVPcGVyYXRpb24oXG4gICAgICAgIHNvdXJjZUZpbGUsXG4gICAgICAgIGZpcnN0Tm9kZSxcbiAgICAgICAgcmVnaXN0ZXJGdW5jdGlvblN0YXRlbWVudCxcbiAgICAgICkpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG9wcztcbiAgfTtcblxuICByZXR1cm4gbWFrZVRyYW5zZm9ybShzdGFuZGFyZFRyYW5zZm9ybSk7XG59XG4iXX0=