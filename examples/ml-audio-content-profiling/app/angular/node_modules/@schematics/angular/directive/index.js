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
const schematics_1 = require("@angular-devkit/schematics");
const ts = require("typescript");
const ast_utils_1 = require("../utility/ast-utils");
const change_1 = require("../utility/change");
const find_module_1 = require("../utility/find-module");
const lint_fix_1 = require("../utility/lint-fix");
const parse_name_1 = require("../utility/parse-name");
const project_1 = require("../utility/project");
const validation_1 = require("../utility/validation");
function addDeclarationToNgModule(options) {
    return (host) => {
        if (options.skipImport || !options.module) {
            return host;
        }
        const modulePath = options.module;
        const text = host.read(modulePath);
        if (text === null) {
            throw new schematics_1.SchematicsException(`File ${modulePath} does not exist.`);
        }
        const sourceText = text.toString('utf-8');
        const source = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
        const directivePath = `/${options.path}/`
            + (options.flat ? '' : core_1.strings.dasherize(options.name) + '/')
            + core_1.strings.dasherize(options.name)
            + '.directive';
        const relativePath = find_module_1.buildRelativePath(modulePath, directivePath);
        const classifiedName = core_1.strings.classify(`${options.name}Directive`);
        const declarationChanges = ast_utils_1.addDeclarationToModule(source, modulePath, classifiedName, relativePath);
        const declarationRecorder = host.beginUpdate(modulePath);
        for (const change of declarationChanges) {
            if (change instanceof change_1.InsertChange) {
                declarationRecorder.insertLeft(change.pos, change.toAdd);
            }
        }
        host.commitUpdate(declarationRecorder);
        if (options.export) {
            // Need to refresh the AST because we overwrote the file in the host.
            const text = host.read(modulePath);
            if (text === null) {
                throw new schematics_1.SchematicsException(`File ${modulePath} does not exist.`);
            }
            const sourceText = text.toString('utf-8');
            const source = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
            const exportRecorder = host.beginUpdate(modulePath);
            const exportChanges = ast_utils_1.addExportToModule(source, modulePath, core_1.strings.classify(`${options.name}Directive`), relativePath);
            for (const change of exportChanges) {
                if (change instanceof change_1.InsertChange) {
                    exportRecorder.insertLeft(change.pos, change.toAdd);
                }
            }
            host.commitUpdate(exportRecorder);
        }
        return host;
    };
}
function buildSelector(options, projectPrefix) {
    let selector = options.name;
    if (options.prefix) {
        selector = `${options.prefix}-${selector}`;
    }
    else if (options.prefix === undefined && projectPrefix) {
        selector = `${projectPrefix}-${selector}`;
    }
    return core_1.strings.camelize(selector);
}
function default_1(options) {
    return (host) => {
        if (!options.project) {
            throw new schematics_1.SchematicsException('Option (project) is required.');
        }
        const project = project_1.getProject(host, options.project);
        if (options.path === undefined) {
            options.path = project_1.buildDefaultPath(project);
        }
        options.module = find_module_1.findModuleFromOptions(host, options);
        const parsedPath = parse_name_1.parseName(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        options.selector = options.selector || buildSelector(options, project.prefix);
        validation_1.validateHtmlSelector(options.selector);
        const templateSource = schematics_1.apply(schematics_1.url('./files'), [
            options.spec ? schematics_1.noop() : schematics_1.filter(path => !path.endsWith('.spec.ts')),
            schematics_1.template(Object.assign({}, core_1.strings, { 'if-flat': (s) => options.flat ? '' : s }, options)),
            schematics_1.move(parsedPath.path),
        ]);
        return schematics_1.chain([
            schematics_1.branchAndMerge(schematics_1.chain([
                addDeclarationToNgModule(options),
                schematics_1.mergeWith(templateSource),
            ])),
            options.lintFix ? lint_fix_1.applyLintFix(options.path) : schematics_1.noop(),
        ]);
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci9kaXJlY3RpdmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0VBTUU7QUFDRiwrQ0FBK0M7QUFDL0MsMkRBYW9DO0FBQ3BDLGlDQUFpQztBQUNqQyxvREFBaUY7QUFDakYsOENBQWlEO0FBQ2pELHdEQUFrRjtBQUNsRixrREFBbUQ7QUFDbkQsc0RBQWtEO0FBQ2xELGdEQUFrRTtBQUNsRSxzREFBNkQ7QUFJN0QsU0FBUyx3QkFBd0IsQ0FBQyxPQUF5QjtJQUN6RCxPQUFPLENBQUMsSUFBVSxFQUFFLEVBQUU7UUFDcEIsSUFBSSxPQUFPLENBQUMsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtZQUN6QyxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNsQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25DLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtZQUNqQixNQUFNLElBQUksZ0NBQW1CLENBQUMsUUFBUSxVQUFVLGtCQUFrQixDQUFDLENBQUM7U0FDckU7UUFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXpGLE1BQU0sYUFBYSxHQUFHLElBQUksT0FBTyxDQUFDLElBQUksR0FBRztjQUNqQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsY0FBTyxDQUFDLFNBQVMsQ0FBQyxP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QUM7U0FDdEIsQ0FBQyxDQUFDO1FBRUgsT0FBTyxrQkFBSyxDQUFDO1lBQ1gsMkJBQWMsQ0FBQyxrQkFBSyxDQUFDO2dCQUNuQix3QkFBd0IsQ0FBQyxPQUFPLENBQUM7Z0JBQ2pDLHNCQUFTLENBQUMsY0FBYyxDQUFDO2FBQzFCLENBQUMsQ0FBQztZQUNILE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHVCQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBSSxFQUFFO1NBQ3RELENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztBQUNKLENBQUM7QUF0Q0QsNEJBc0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHsgc3RyaW5ncyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7XG4gIFJ1bGUsXG4gIFNjaGVtYXRpY3NFeGNlcHRpb24sXG4gIFRyZWUsXG4gIGFwcGx5LFxuICBicmFuY2hBbmRNZXJnZSxcbiAgY2hhaW4sXG4gIGZpbHRlcixcbiAgbWVyZ2VXaXRoLFxuICBtb3ZlLFxuICBub29wLFxuICB0ZW1wbGF0ZSxcbiAgdXJsLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7IGFkZERlY2xhcmF0aW9uVG9Nb2R1bGUsIGFkZEV4cG9ydFRvTW9kdWxlIH0gZnJvbSAnLi4vdXRpbGl0eS9hc3QtdXRpbHMnO1xuaW1wb3J0IHsgSW5zZXJ0Q2hhbmdlIH0gZnJvbSAnLi4vdXRpbGl0eS9jaGFuZ2UnO1xuaW1wb3J0IHsgYnVpbGRSZWxhdGl2ZVBhdGgsIGZpbmRNb2R1bGVGcm9tT3B0aW9ucyB9IGZyb20gJy4uL3V0aWxpdHkvZmluZC1tb2R1bGUnO1xuaW1wb3J0IHsgYXBwbHlMaW50Rml4IH0gZnJvbSAnLi4vdXRpbGl0eS9saW50LWZpeCc7XG5pbXBvcnQgeyBwYXJzZU5hbWUgfSBmcm9tICcuLi91dGlsaXR5L3BhcnNlLW5hbWUnO1xuaW1wb3J0IHsgYnVpbGREZWZhdWx0UGF0aCwgZ2V0UHJvamVjdCB9IGZyb20gJy4uL3V0aWxpdHkvcHJvamVjdCc7XG5pbXBvcnQgeyB2YWxpZGF0ZUh0bWxTZWxlY3RvciB9IGZyb20gJy4uL3V0aWxpdHkvdmFsaWRhdGlvbic7XG5pbXBvcnQgeyBTY2hlbWEgYXMgRGlyZWN0aXZlT3B0aW9ucyB9IGZyb20gJy4vc2NoZW1hJztcblxuXG5mdW5jdGlvbiBhZGREZWNsYXJhdGlvblRvTmdNb2R1bGUob3B0aW9uczogRGlyZWN0aXZlT3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUpID0+IHtcbiAgICBpZiAob3B0aW9ucy5za2lwSW1wb3J0IHx8ICFvcHRpb25zLm1vZHVsZSkge1xuICAgICAgcmV0dXJuIGhvc3Q7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kdWxlUGF0aCA9IG9wdGlvbnMubW9kdWxlO1xuICAgIGNvbnN0IHRleHQgPSBob3N0LnJlYWQobW9kdWxlUGF0aCk7XG4gICAgaWYgKHRleHQgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKGBGaWxlICR7bW9kdWxlUGF0aH0gZG9lcyBub3QgZXhpc3QuYCk7XG4gICAgfVxuICAgIGNvbnN0IHNvdXJjZVRleHQgPSB0ZXh0LnRvU3RyaW5nKCd1dGYtOCcpO1xuICAgIGNvbnN0IHNvdXJjZSA9IHRzLmNyZWF0ZVNvdXJjZUZpbGUobW9kdWxlUGF0aCwgc291cmNlVGV4dCwgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCwgdHJ1ZSk7XG5cbiAgICBjb25zdCBkaXJlY3RpdmVQYXRoID0gYC8ke29wdGlvbnMucGF0aH0vYFxuICAgICAgICAgICAgICAgICAgICAgICAgICArIChvcHRpb25zLmZsYXQgPyAnJyA6IHN0cmluZ3MuZGFzaGVyaXplKG9wdGlvbnMubmFtZSkgKyAnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICsgc3RyaW5ncy5kYXNoZXJpemUob3B0aW9ucy5uYW1lKVxuICAgICAgICAgICAgICAgICAgICAgICAgICArICcuZGlyZWN0aXZlJztcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBidWlsZFJlbGF0aXZlUGF0aChtb2R1bGVQYXRoLCBkaXJlY3RpdmVQYXRoKTtcbiAgICBjb25zdCBjbGFzc2lmaWVkTmFtZSA9IHN0cmluZ3MuY2xhc3NpZnkoYCR7b3B0aW9ucy5uYW1lfURpcmVjdGl2ZWApO1xuICAgIGNvbnN0IGRlY2xhcmF0aW9uQ2hhbmdlcyA9IGFkZERlY2xhcmF0aW9uVG9Nb2R1bGUoc291cmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzaWZpZWROYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmVQYXRoKTtcbiAgICBjb25zdCBkZWNsYXJhdGlvblJlY29yZGVyID0gaG9zdC5iZWdpblVwZGF0ZShtb2R1bGVQYXRoKTtcbiAgICBmb3IgKGNvbnN0IGNoYW5nZSBvZiBkZWNsYXJhdGlvbkNoYW5nZXMpIHtcbiAgICAgIGlmIChjaGFuZ2UgaW5zdGFuY2VvZiBJbnNlcnRDaGFuZ2UpIHtcbiAgICAgICAgZGVjbGFyYXRpb25SZWNvcmRlci5pbnNlcnRMZWZ0KGNoYW5nZS5wb3MsIGNoYW5nZS50b0FkZCk7XG4gICAgICB9XG4gICAgfVxuICAgIGhvc3QuY29tbWl0VXBkYXRlKGRlY2xhcmF0aW9uUmVjb3JkZXIpO1xuXG4gICAgaWYgKG9wdGlvbnMuZXhwb3J0KSB7XG4gICAgICAvLyBOZWVkIHRvIHJlZnJlc2ggdGhlIEFTVCBiZWNhdXNlIHdlIG92ZXJ3cm90ZSB0aGUgZmlsZSBpbiB0aGUgaG9zdC5cbiAgICAgIGNvbnN0IHRleHQgPSBob3N0LnJlYWQobW9kdWxlUGF0aCk7XG4gICAgICBpZiAodGV4dCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgRmlsZSAke21vZHVsZVBhdGh9IGRvZXMgbm90IGV4aXN0LmApO1xuICAgICAgfVxuICAgICAgY29uc3Qgc291cmNlVGV4dCA9IHRleHQudG9TdHJpbmcoJ3V0Zi04Jyk7XG4gICAgICBjb25zdCBzb3VyY2UgPSB0cy5jcmVhdGVTb3VyY2VGaWxlKG1vZHVsZVBhdGgsIHNvdXJjZVRleHQsIHRzLlNjcmlwdFRhcmdldC5MYXRlc3QsIHRydWUpO1xuXG4gICAgICBjb25zdCBleHBvcnRSZWNvcmRlciA9IGhvc3QuYmVnaW5VcGRhdGUobW9kdWxlUGF0aCk7XG4gICAgICBjb25zdCBleHBvcnRDaGFuZ2VzID0gYWRkRXhwb3J0VG9Nb2R1bGUoc291cmNlLCBtb2R1bGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZ3MuY2xhc3NpZnkoYCR7b3B0aW9ucy5uYW1lfURpcmVjdGl2ZWApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aXZlUGF0aCk7XG5cbiAgICAgIGZvciAoY29uc3QgY2hhbmdlIG9mIGV4cG9ydENoYW5nZXMpIHtcbiAgICAgICAgaWYgKGNoYW5nZSBpbnN0YW5jZW9mIEluc2VydENoYW5nZSkge1xuICAgICAgICAgIGV4cG9ydFJlY29yZGVyLmluc2VydExlZnQoY2hhbmdlLnBvcywgY2hhbmdlLnRvQWRkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaG9zdC5jb21taXRVcGRhdGUoZXhwb3J0UmVjb3JkZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBob3N0O1xuICB9O1xufVxuXG5cbmZ1bmN0aW9uIGJ1aWxkU2VsZWN0b3Iob3B0aW9uczogRGlyZWN0aXZlT3B0aW9ucywgcHJvamVjdFByZWZpeDogc3RyaW5nKSB7XG4gIGxldCBzZWxlY3RvciA9IG9wdGlvbnMubmFtZTtcbiAgaWYgKG9wdGlvbnMucHJlZml4KSB7XG4gICAgc2VsZWN0b3IgPSBgJHtvcHRpb25zLnByZWZpeH0tJHtzZWxlY3Rvcn1gO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMucHJlZml4ID09PSB1bmRlZmluZWQgJiYgcHJvamVjdFByZWZpeCkge1xuICAgIHNlbGVjdG9yID0gYCR7cHJvamVjdFByZWZpeH0tJHtzZWxlY3Rvcn1gO1xuICB9XG5cbiAgcmV0dXJuIHN0cmluZ3MuY2FtZWxpemUoc2VsZWN0b3IpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAob3B0aW9uczogRGlyZWN0aXZlT3B0aW9ucyk6IFJ1bGUge1xuICByZXR1cm4gKGhvc3Q6IFRyZWUpID0+IHtcbiAgICBpZiAoIW9wdGlvbnMucHJvamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ09wdGlvbiAocHJvamVjdCkgaXMgcmVxdWlyZWQuJyk7XG4gICAgfVxuICAgIGNvbnN0IHByb2plY3QgPSBnZXRQcm9qZWN0KGhvc3QsIG9wdGlvbnMucHJvamVjdCk7XG5cbiAgICBpZiAob3B0aW9ucy5wYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIG9wdGlvbnMucGF0aCA9IGJ1aWxkRGVmYXVsdFBhdGgocHJvamVjdCk7XG4gICAgfVxuXG4gICAgb3B0aW9ucy5tb2R1bGUgPSBmaW5kTW9kdWxlRnJvbU9wdGlvbnMoaG9zdCwgb3B0aW9ucyk7XG5cbiAgICBjb25zdCBwYXJzZWRQYXRoID0gcGFyc2VOYW1lKG9wdGlvbnMucGF0aCwgb3B0aW9ucy5uYW1lKTtcbiAgICBvcHRpb25zLm5hbWUgPSBwYXJzZWRQYXRoLm5hbWU7XG4gICAgb3B0aW9ucy5wYXRoID0gcGFyc2VkUGF0aC5wYXRoO1xuICAgIG9wdGlvbnMuc2VsZWN0b3IgPSBvcHRpb25zLnNlbGVjdG9yIHx8IGJ1aWxkU2VsZWN0b3Iob3B0aW9ucywgcHJvamVjdC5wcmVmaXgpO1xuXG4gICAgdmFsaWRhdGVIdG1sU2VsZWN0b3Iob3B0aW9ucy5zZWxlY3Rvcik7XG5cbiAgICBjb25zdCB0ZW1wbGF0ZVNvdXJjZSA9IGFwcGx5KHVybCgnLi9maWxlcycpLCBbXG4gICAgICBvcHRpb25zLnNwZWMgPyBub29wKCkgOiBmaWx0ZXIocGF0aCA9PiAhcGF0aC5lbmRzV2l0aCgnLnNwZWMudHMnKSksXG4gICAgICB0ZW1wbGF0ZSh7XG4gICAgICAgIC4uLnN0cmluZ3MsXG4gICAgICAgICdpZi1mbGF0JzogKHM6IHN0cmluZykgPT4gb3B0aW9ucy5mbGF0ID8gJycgOiBzLFxuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgfSksXG4gICAgICBtb3ZlKHBhcnNlZFBhdGgucGF0aCksXG4gICAgXSk7XG5cbiAgICByZXR1cm4gY2hhaW4oW1xuICAgICAgYnJhbmNoQW5kTWVyZ2UoY2hhaW4oW1xuICAgICAgICBhZGREZWNsYXJhdGlvblRvTmdNb2R1bGUob3B0aW9ucyksXG4gICAgICAgIG1lcmdlV2l0aCh0ZW1wbGF0ZVNvdXJjZSksXG4gICAgICBdKSksXG4gICAgICBvcHRpb25zLmxpbnRGaXggPyBhcHBseUxpbnRGaXgob3B0aW9ucy5wYXRoKSA6IG5vb3AoKSxcbiAgICBdKTtcbiAgfTtcbn1cbiJdfQ==