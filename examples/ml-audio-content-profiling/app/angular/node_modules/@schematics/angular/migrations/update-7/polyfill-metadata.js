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
function isJsonObject(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
/**
 * Remove the Reflect import from a polyfill file.
 * @param tree The tree to use.
 * @param path Path of the polyfill file found.
 * @private
 */
function _removeReflectFromPolyfills(tree, path) {
    const source = tree.read(path);
    if (!source) {
        return;
    }
    // Start the update of the file.
    const recorder = tree.beginUpdate(path);
    const sourceFile = ts.createSourceFile(path, source.toString(), ts.ScriptTarget.Latest);
    const imports = sourceFile.statements
        .filter(s => s.kind === ts.SyntaxKind.ImportDeclaration);
    for (const i of imports) {
        const module = i.moduleSpecifier.kind == ts.SyntaxKind.StringLiteral
            && i.moduleSpecifier.text;
        switch (module) {
            case 'core-js/es7/reflect':
                recorder.remove(i.getStart(sourceFile), i.getWidth(sourceFile));
                break;
        }
    }
    tree.commitUpdate(recorder);
}
/**
 * Update a project's target, maybe. Only if it's a builder supported and the options look right.
 * This is a rule factory so we return the new rule (or noop if we don't support doing the change).
 * @param root The root of the project source.
 * @param targetObject The target information.
 * @private
 */
function _updateProjectTarget(targetObject) {
    // Make sure we're using the correct builder.
    if (targetObject.builder !== '@angular-devkit/build-angular:browser'
        || !isJsonObject(targetObject.options)) {
        return schematics_1.noop();
    }
    const options = targetObject.options;
    if (typeof options.polyfills != 'string') {
        return schematics_1.noop();
    }
    const polyfillsToUpdate = [options.polyfills];
    const configurations = targetObject.configurations;
    if (isJsonObject(configurations)) {
        for (const configName of Object.keys(configurations)) {
            const config = configurations[configName];
            // Just in case, only do non-AOT configurations.
            if (isJsonObject(config)
                && typeof config.polyfills == 'string'
                && config.aot !== true) {
                polyfillsToUpdate.push(config.polyfills);
            }
        }
    }
    return schematics_1.chain(polyfillsToUpdate.map(polyfillPath => {
        return (tree) => _removeReflectFromPolyfills(tree, polyfillPath);
    }));
}
/**
 * Move the import reflect metadata polyfill from the polyfill file to the dev environment. This is
 * not guaranteed to work, but if it doesn't it will result in no changes made.
 */
function polyfillMetadataRule() {
    return (tree) => {
        // Simple. Take the ast of polyfills (if it exists) and find the import metadata. Remove it.
        const angularConfigContent = tree.read('angular.json') || tree.read('.angular.json');
        const rules = [];
        if (!angularConfigContent) {
            // Is this even an angular project?
            return;
        }
        const angularJson = core_1.parseJson(angularConfigContent.toString(), core_1.JsonParseMode.Loose);
        if (!isJsonObject(angularJson) || !isJsonObject(angularJson.projects)) {
            // If that field isn't there, no use...
            return;
        }
        // For all projects, for all targets, read the polyfill field, and read the environment.
        for (const projectName of Object.keys(angularJson.projects)) {
            const project = angularJson.projects[projectName];
            if (!isJsonObject(project)) {
                continue;
            }
            if (typeof project.root != 'string') {
                continue;
            }
            const targets = project.targets || project.architect;
            if (!isJsonObject(targets)) {
                continue;
            }
            for (const targetName of Object.keys(targets)) {
                const target = targets[targetName];
                if (isJsonObject(target)) {
                    rules.push(_updateProjectTarget(target));
                }
            }
        }
        // Remove null or undefined rules.
        return schematics_1.chain(rules);
    };
}
exports.polyfillMetadataRule = polyfillMetadataRule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9seWZpbGwtbWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci9taWdyYXRpb25zL3VwZGF0ZS03L3BvbHlmaWxsLW1ldGFkYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQXVGO0FBQ3ZGLDJEQUFxRTtBQUNyRSxpQ0FBaUM7QUFFakMsU0FBUyxZQUFZLENBQUMsS0FBZ0I7SUFDcEMsT0FBTyxLQUFLLElBQUksSUFBSSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDN0UsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBUywyQkFBMkIsQ0FBQyxJQUFVLEVBQUUsSUFBWTtJQUMzRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxPQUFPO0tBQ1I7SUFFRCxnQ0FBZ0M7SUFDaEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUV4QyxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hGLE1BQU0sT0FBTyxHQUNYLFVBQVUsQ0FBQyxVQUFVO1NBQ2xCLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FDMUQsQ0FBQztJQUVGLEtBQUssTUFBTSxDQUFDLElBQUksT0FBTyxFQUFFO1FBQ3ZCLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxJQUFJ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VjtZQUNELElBQUksT0FBTyxPQUFPLENBQUMsSUFBSSxJQUFJLFFBQVEsRUFBRTtnQkFDbkMsU0FBUzthQUNWO1lBRUQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDO1lBQ3JELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQzFCLFNBQVM7YUFDVjtZQUVELEtBQUssTUFBTSxVQUFVLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDN0MsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNuQyxJQUFJLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDeEIsS0FBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2lCQUMxQzthQUNGO1NBQ0Y7UUFFRCxrQ0FBa0M7UUFDbEMsT0FBTyxrQkFBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RCLENBQUMsQ0FBQztBQUNKLENBQUM7QUE1Q0Qsb0RBNENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgSnNvbk9iamVjdCwgSnNvblBhcnNlTW9kZSwgSnNvblZhbHVlLCBwYXJzZUpzb24gfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBSdWxlLCBUcmVlLCBjaGFpbiwgbm9vcCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5mdW5jdGlvbiBpc0pzb25PYmplY3QodmFsdWU6IEpzb25WYWx1ZSk6IHZhbHVlIGlzIEpzb25PYmplY3Qge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxuLyoqXG4gKiBSZW1vdmUgdGhlIFJlZmxlY3QgaW1wb3J0IGZyb20gYSBwb2x5ZmlsbCBmaWxlLlxuICogQHBhcmFtIHRyZWUgVGhlIHRyZWUgdG8gdXNlLlxuICogQHBhcmFtIHBhdGggUGF0aCBvZiB0aGUgcG9seWZpbGwgZmlsZSBmb3VuZC5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIF9yZW1vdmVSZWZsZWN0RnJvbVBvbHlmaWxscyh0cmVlOiBUcmVlLCBwYXRoOiBzdHJpbmcpIHtcbiAgY29uc3Qgc291cmNlID0gdHJlZS5yZWFkKHBhdGgpO1xuICBpZiAoIXNvdXJjZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFN0YXJ0IHRoZSB1cGRhdGUgb2YgdGhlIGZpbGUuXG4gIGNvbnN0IHJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZShwYXRoKTtcblxuICBjb25zdCBzb3VyY2VGaWxlID0gdHMuY3JlYXRlU291cmNlRmlsZShwYXRoLCBzb3VyY2UudG9TdHJpbmcoKSwgdHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCk7XG4gIGNvbnN0IGltcG9ydHMgPSAoXG4gICAgc291cmNlRmlsZS5zdGF0ZW1lbnRzXG4gICAgICAuZmlsdGVyKHMgPT4gcy5raW5kID09PSB0cy5TeW50YXhLaW5kLkltcG9ydERlY2xhcmF0aW9uKSBhcyB0cy5JbXBvcnREZWNsYXJhdGlvbltdXG4gICk7XG5cbiAgZm9yIChjb25zdCBpIG9mIGltcG9ydHMpIHtcbiAgICBjb25zdCBtb2R1bGUgPSBpLm1vZHVsZVNwZWNpZmllci5raW5kID09IHRzLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbFxuICAgICAgJiYgKGkubW9kdWxlU3BlY2lmaWVyIGFzIHRzLlN0cmluZ0xpdGVyYWwpLnRleHQ7XG5cbiAgICBzd2l0Y2ggKG1vZHVsZSkge1xuICAgICAgY2FzZSAnY29yZS1qcy9lczcvcmVmbGVjdCc6XG4gICAgICAgIHJlY29yZGVyLnJlbW92ZShpLmdldFN0YXJ0KHNvdXJjZUZpbGUpLCBpLmdldFdpZHRoKHNvdXJjZUZpbGUpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdHJlZS5jb21taXRVcGRhdGUocmVjb3JkZXIpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHByb2plY3QncyB0YXJnZXQsIG1heWJlLiBPbmx5IGlmIGl0J3MgYSBidWlsZGVyIHN1cHBvcnRlZCBhbmQgdGhlIG9wdGlvbnMgbG9vayByaWdodC5cbiAqIFRoaXMgaXMgYSBydWxlIGZhY3Rvcnkgc28gd2UgcmV0dXJuIHRoZSBuZXcgcnVsZSAob3Igbm9vcCBpZiB3ZSBkb24ndCBzdXBwb3J0IGRvaW5nIHRoZSBjaGFuZ2UpLlxuICogQHBhcmFtIHJvb3QgVGhlIHJvb3Qgb2YgdGhlIHByb2plY3Qgc291cmNlLlxuICogQHBhcmFtIHRhcmdldE9iamVjdCBUaGUgdGFyZ2V0IGluZm9ybWF0aW9uLlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gX3VwZGF0ZVByb2plY3RUYXJnZXQodGFyZ2V0T2JqZWN0OiBKc29uT2JqZWN0KTogUnVsZSB7XG4gIC8vIE1ha2Ugc3VyZSB3ZSdyZSB1c2luZyB0aGUgY29ycmVjdCBidWlsZGVyLlxuICBpZiAodGFyZ2V0T2JqZWN0LmJ1aWxkZXIgIT09ICdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhcjpicm93c2VyJ1xuICAgICAgfHwgIWlzSnNvbk9iamVjdCh0YXJnZXRPYmplY3Qub3B0aW9ucykpIHtcbiAgICByZXR1cm4gbm9vcCgpO1xuICB9XG4gIGNvbnN0IG9wdGlvbnMgPSB0YXJnZXRPYmplY3Qub3B0aW9ucztcbiAgaWYgKHR5cGVvZiBvcHRpb25zLnBvbHlmaWxscyAhPSAnc3RyaW5nJykge1xuICAgIHJldHVybiBub29wKCk7XG4gIH1cblxuICBjb25zdCBwb2x5ZmlsbHNUb1VwZGF0ZSA9IFtvcHRpb25zLnBvbHlmaWxsc107XG4gIGNvbnN0IGNvbmZpZ3VyYXRpb25zID0gdGFyZ2V0T2JqZWN0LmNvbmZpZ3VyYXRpb25zO1xuICBpZiAoaXNKc29uT2JqZWN0KGNvbmZpZ3VyYXRpb25zKSkge1xuICAgIGZvciAoY29uc3QgY29uZmlnTmFtZSBvZiBPYmplY3Qua2V5cyhjb25maWd1cmF0aW9ucykpIHtcbiAgICAgIGNvbnN0IGNvbmZpZyA9IGNvbmZpZ3VyYXRpb25zW2NvbmZpZ05hbWVdO1xuXG4gICAgICAvLyBKdXN0IGluIGNhc2UsIG9ubHkgZG8gbm9uLUFPVCBjb25maWd1cmF0aW9ucy5cbiAgICAgIGlmIChpc0pzb25PYmplY3QoY29uZmlnKVxuICAgICAgICAgICYmIHR5cGVvZiBjb25maWcucG9seWZpbGxzID09ICdzdHJpbmcnXG4gICAgICAgICAgJiYgY29uZmlnLmFvdCAhPT0gdHJ1ZSkge1xuICAgICAgICBwb2x5ZmlsbHNUb1VwZGF0ZS5wdXNoKGNvbmZpZy5wb2x5ZmlsbHMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjaGFpbihcbiAgICBwb2x5ZmlsbHNUb1VwZGF0ZS5tYXAocG9seWZpbGxQYXRoID0+IHtcbiAgICAgIHJldHVybiAodHJlZTogVHJlZSkgPT4gX3JlbW92ZVJlZmxlY3RGcm9tUG9seWZpbGxzKHRyZWUsIHBvbHlmaWxsUGF0aCk7XG4gICAgfSksXG4gICk7XG59XG5cbi8qKlxuICogTW92ZSB0aGUgaW1wb3J0IHJlZmxlY3QgbWV0YWRhdGEgcG9seWZpbGwgZnJvbSB0aGUgcG9seWZpbGwgZmlsZSB0byB0aGUgZGV2IGVudmlyb25tZW50LiBUaGlzIGlzXG4gKiBub3QgZ3VhcmFudGVlZCB0byB3b3JrLCBidXQgaWYgaXQgZG9lc24ndCBpdCB3aWxsIHJlc3VsdCBpbiBubyBjaGFuZ2VzIG1hZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwb2x5ZmlsbE1ldGFkYXRhUnVsZSgpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlKSA9PiB7XG4gICAgLy8gU2ltcGxlLiBUYWtlIHRoZSBhc3Qgb2YgcG9seWZpbGxzIChpZiBpdCBleGlzdHMpIGFuZCBmaW5kIHRoZSBpbXBvcnQgbWV0YWRhdGEuIFJlbW92ZSBpdC5cbiAgICBjb25zdCBhbmd1bGFyQ29uZmlnQ29udGVudCA9IHRyZWUucmVhZCgnYW5ndWxhci5qc29uJykgfHwgdHJlZS5yZWFkKCcuYW5ndWxhci5qc29uJyk7XG4gICAgY29uc3QgcnVsZXM6IFJ1bGVbXSA9IFtdO1xuXG4gICAgaWYgKCFhbmd1bGFyQ29uZmlnQ29udGVudCkge1xuICAgICAgLy8gSXMgdGhpcyBldmVuIGFuIGFuZ3VsYXIgcHJvamVjdD9cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhbmd1bGFySnNvbiA9IHBhcnNlSnNvbihhbmd1bGFyQ29uZmlnQ29udGVudC50b1N0cmluZygpLCBKc29uUGFyc2VNb2RlLkxvb3NlKTtcblxuICAgIGlmICghaXNKc29uT2JqZWN0KGFuZ3VsYXJKc29uKSB8fCAhaXNKc29uT2JqZWN0KGFuZ3VsYXJKc29uLnByb2plY3RzKSkge1xuICAgICAgLy8gSWYgdGhhdCBmaWVsZCBpc24ndCB0aGVyZSwgbm8gdXNlLi4uXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRm9yIGFsbCBwcm9qZWN0cywgZm9yIGFsbCB0YXJnZXRzLCByZWFkIHRoZSBwb2x5ZmlsbCBmaWVsZCwgYW5kIHJlYWQgdGhlIGVudmlyb25tZW50LlxuICAgIGZvciAoY29uc3QgcHJvamVjdE5hbWUgb2YgT2JqZWN0LmtleXMoYW5ndWxhckpzb24ucHJvamVjdHMpKSB7XG4gICAgICBjb25zdCBwcm9qZWN0ID0gYW5ndWxhckpzb24ucHJvamVjdHNbcHJvamVjdE5hbWVdO1xuICAgICAgaWYgKCFpc0pzb25PYmplY3QocHJvamVjdCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHByb2plY3Qucm9vdCAhPSAnc3RyaW5nJykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGFyZ2V0cyA9IHByb2plY3QudGFyZ2V0cyB8fCBwcm9qZWN0LmFyY2hpdGVjdDtcbiAgICAgIGlmICghaXNKc29uT2JqZWN0KHRhcmdldHMpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IHRhcmdldE5hbWUgb2YgT2JqZWN0LmtleXModGFyZ2V0cykpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGFyZ2V0c1t0YXJnZXROYW1lXTtcbiAgICAgICAgaWYgKGlzSnNvbk9iamVjdCh0YXJnZXQpKSB7XG4gICAgICAgICAgcnVsZXMucHVzaChfdXBkYXRlUHJvamVjdFRhcmdldCh0YXJnZXQpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbW92ZSBudWxsIG9yIHVuZGVmaW5lZCBydWxlcy5cbiAgICByZXR1cm4gY2hhaW4ocnVsZXMpO1xuICB9O1xufVxuIl19