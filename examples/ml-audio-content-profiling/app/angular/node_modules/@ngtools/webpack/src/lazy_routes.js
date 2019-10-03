"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const path_1 = require("path");
const ts = require("typescript");
const refactor_1 = require("./refactor");
function _getContentOfKeyLiteral(_source, node) {
    if (node.kind == ts.SyntaxKind.Identifier) {
        return node.text;
    }
    else if (node.kind == ts.SyntaxKind.StringLiteral) {
        return node.text;
    }
    else {
        return null;
    }
}
function findLazyRoutes(filePath, host, program, compilerOptions) {
    if (!compilerOptions) {
        if (!program) {
            throw new Error('Must pass either program or compilerOptions to findLazyRoutes.');
        }
        compilerOptions = program.getCompilerOptions();
    }
    const fileName = refactor_1.resolve(filePath, host, compilerOptions).replace(/\\/g, '/');
    let sourceFile;
    if (program) {
        sourceFile = program.getSourceFile(fileName);
    }
    if (!sourceFile) {
        const content = host.readFile(fileName);
        if (content) {
            sourceFile = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);
        }
    }
    if (!sourceFile) {
        throw new Error(`Source file not found: '${fileName}'.`);
    }
    const sf = sourceFile;
    return refactor_1.findAstNodes(null, sourceFile, ts.SyntaxKind.ObjectLiteralExpression, true)
        // Get all their property assignments.
        .map((node) => {
        return refactor_1.findAstNodes(node, sf, ts.SyntaxKind.PropertyAssignment, false);
    })
        // Take all `loadChildren` elements.
        .reduce((acc, props) => {
        return acc.concat(props.filter(literal => {
            return _getContentOfKeyLiteral(sf, literal.name) == 'loadChildren';
        }));
    }, [])
        // Get only string values.
        .filter((node) => node.initializer.kind == ts.SyntaxKind.StringLiteral)
        // Get the string value.
        .map((node) => node.initializer.text)
        // Map those to either [path, absoluteModulePath], or [path, null] if the module pointing to
        // does not exist.
        .map((routePath) => {
        const moduleName = routePath.split('#')[0];
        const compOptions = (program && program.getCompilerOptions()) || compilerOptions || {};
        const resolvedModuleName = moduleName[0] == '.'
            ? {
                resolvedModule: { resolvedFileName: path_1.join(path_1.dirname(filePath), moduleName) + '.ts' },
            }
            : ts.resolveModuleName(moduleName, filePath, compOptions, host);
        if (resolvedModuleName.resolvedModule
            && resolvedModuleName.resolvedModule.resolvedFileName
            && host.fileExists(resolvedModuleName.resolvedModule.resolvedFileName)) {
            return [routePath, resolvedModuleName.resolvedModule.resolvedFileName];
        }
        else {
            return [routePath, null];
        }
    })
        // Reduce to the LazyRouteMap map.
        .reduce((acc, [routePath, resolvedModuleName]) => {
        if (resolvedModuleName) {
            acc[routePath] = resolvedModuleName;
        }
        return acc;
    }, {});
}
exports.findLazyRoutes = findLazyRoutes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF6eV9yb3V0ZXMuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvbGF6eV9yb3V0ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQkFBcUM7QUFDckMsaUNBQWlDO0FBQ2pDLHlDQUFtRDtBQUduRCxTQUFTLHVCQUF1QixDQUFDLE9BQXNCLEVBQUUsSUFBYTtJQUNwRSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUU7UUFDekMsT0FBUSxJQUFzQixDQUFDLElBQUksQ0FBQztLQUNyQztTQUFNLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRTtRQUNuRCxPQUFRLElBQXlCLENBQUMsSUFBSSxDQUFDO0tBQ3hDO1NBQU07UUFDTCxPQUFPLElBQUksQ0FBQztLQUNiO0FBQ0gsQ0FBQztBQVFELFNBQWdCLGNBQWMsQ0FDNUIsUUFBZ0IsRUFDaEIsSUFBcUIsRUFDckIsT0FBb0IsRUFDcEIsZUFBb0M7SUFFcEMsSUFBSSxDQUFDLGVBQWUsRUFBRTtRQUNwQixJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyxnRUFBZ0UsQ0FBQyxDQUFDO1NBQ25GO1FBQ0QsZUFBZSxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0tBQ2hEO0lBQ0QsTUFBTSxRQUFRLEdBQUcsa0JBQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDOUUsSUFBSSxVQUFxQyxDQUFDO0lBQzFDLElBQUksT0FBTyxFQUFFO1FBQ1gsVUFBVSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDOUM7SUFFRCxJQUFJLENBQUMsVUFBVSxF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QixFQUFFLEVBQUU7UUFDdEYsSUFBSSxrQkFBa0IsRUFBRTtZQUN0QixHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsa0JBQWtCLENBQUM7U0FDckM7UUFFRCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNYLENBQUM7QUF2RUQsd0NBdUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgZGlybmFtZSwgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBmaW5kQXN0Tm9kZXMsIHJlc29sdmUgfSBmcm9tICcuL3JlZmFjdG9yJztcblxuXG5mdW5jdGlvbiBfZ2V0Q29udGVudE9mS2V5TGl0ZXJhbChfc291cmNlOiB0cy5Tb3VyY2VGaWxlLCBub2RlOiB0cy5Ob2RlKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmIChub2RlLmtpbmQgPT0gdHMuU3ludGF4S2luZC5JZGVudGlmaWVyKSB7XG4gICAgcmV0dXJuIChub2RlIGFzIHRzLklkZW50aWZpZXIpLnRleHQ7XG4gIH0gZWxzZSBpZiAobm9kZS5raW5kID09IHRzLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbCkge1xuICAgIHJldHVybiAobm9kZSBhcyB0cy5TdHJpbmdMaXRlcmFsKS50ZXh0O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cblxuZXhwb3J0IGludGVyZmFjZSBMYXp5Um91dGVNYXAge1xuICBbcGF0aDogc3RyaW5nXTogc3RyaW5nO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTGF6eVJvdXRlcyhcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgaG9zdDogdHMuQ29tcGlsZXJIb3N0LFxuICBwcm9ncmFtPzogdHMuUHJvZ3JhbSxcbiAgY29tcGlsZXJPcHRpb25zPzogdHMuQ29tcGlsZXJPcHRpb25zLFxuKTogTGF6eVJvdXRlTWFwIHtcbiAgaWYgKCFjb21waWxlck9wdGlvbnMpIHtcbiAgICBpZiAoIXByb2dyYW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTXVzdCBwYXNzIGVpdGhlciBwcm9ncmFtIG9yIGNvbXBpbGVyT3B0aW9ucyB0byBmaW5kTGF6eVJvdXRlcy4nKTtcbiAgICB9XG4gICAgY29tcGlsZXJPcHRpb25zID0gcHJvZ3JhbS5nZXRDb21waWxlck9wdGlvbnMoKTtcbiAgfVxuICBjb25zdCBmaWxlTmFtZSA9IHJlc29sdmUoZmlsZVBhdGgsIGhvc3QsIGNvbXBpbGVyT3B0aW9ucykucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICBsZXQgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSB8IHVuZGVmaW5lZDtcbiAgaWYgKHByb2dyYW0pIHtcbiAgICBzb3VyY2VGaWxlID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlKGZpbGVOYW1lKTtcbiAgfVxuXG4gIGlmICghc291cmNlRmlsZSkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBob3N0LnJlYWRGaWxlKGZpbGVOYW1lKTtcbiAgICBpZiAoY29udGVudCkge1xuICAgICAgc291cmNlRmlsZSA9IHRzLmNyZWF0ZVNvdXJjZUZpbGUoZmlsZU5hbWUsIGNvbnRlbnQsIHRzLlNjcmlwdFRhcmdldC5MYXRlc3QsIHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc291cmNlRmlsZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgU291cmNlIGZpbGUgbm90IGZvdW5kOiAnJHtmaWxlTmFtZX0nLmApO1xuICB9XG4gIGNvbnN0IHNmOiB0cy5Tb3VyY2VGaWxlID0gc291cmNlRmlsZTtcblxuICByZXR1cm4gZmluZEFzdE5vZGVzKG51bGwsIHNvdXJjZUZpbGUsIHRzLlN5bnRheEtpbmQuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24sIHRydWUpXG4gICAgLy8gR2V0IGFsbCB0aGVpciBwcm9wZXJ0eSBhc3NpZ25tZW50cy5cbiAgICAubWFwKChub2RlOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikgPT4ge1xuICAgICAgcmV0dXJuIGZpbmRBc3ROb2Rlcyhub2RlLCBzZiwgdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFzc2lnbm1lbnQsIGZhbHNlKTtcbiAgICB9KVxuICAgIC8vIFRha2UgYWxsIGBsb2FkQ2hpbGRyZW5gIGVsZW1lbnRzLlxuICAgIC5yZWR1Y2UoKGFjYzogdHMuUHJvcGVydHlBc3NpZ25tZW50W10sIHByb3BzOiB0cy5Qcm9wZXJ0eUFzc2lnbm1lbnRbXSkgPT4ge1xuICAgICAgcmV0dXJuIGFjYy5jb25jYXQocHJvcHMuZmlsdGVyKGxpdGVyYWwgPT4ge1xuICAgICAgICByZXR1cm4gX2dldENvbnRlbnRPZktleUxpdGVyYWwoc2YsIGxpdGVyYWwubmFtZSkgPT0gJ2xvYWRDaGlsZHJlbic7XG4gICAgICB9KSk7XG4gICAgfSwgW10pXG4gICAgLy8gR2V0IG9ubHkgc3RyaW5nIHZhbHVlcy5cbiAgICAuZmlsdGVyKChub2RlOiB0cy5Qcm9wZXJ0eUFzc2lnbm1lbnQpID0+IG5vZGUuaW5pdGlhbGl6ZXIua2luZCA9PSB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWwpXG4gICAgLy8gR2V0IHRoZSBzdHJpbmcgdmFsdWUuXG4gICAgLm1hcCgobm9kZTogdHMuUHJvcGVydHlBc3NpZ25tZW50KSA9PiAobm9kZS5pbml0aWFsaXplciBhcyB0cy5TdHJpbmdMaXRlcmFsKS50ZXh0KVxuICAgIC8vIE1hcCB0aG9zZSB0byBlaXRoZXIgW3BhdGgsIGFic29sdXRlTW9kdWxlUGF0aF0sIG9yIFtwYXRoLCBudWxsXSBpZiB0aGUgbW9kdWxlIHBvaW50aW5nIHRvXG4gICAgLy8gZG9lcyBub3QgZXhpc3QuXG4gICAgLm1hcCgocm91dGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IG1vZHVsZU5hbWUgPSByb3V0ZVBhdGguc3BsaXQoJyMnKVswXTtcbiAgICAgIGNvbnN0IGNvbXBPcHRpb25zID0gKHByb2dyYW0gJiYgcHJvZ3JhbS5nZXRDb21waWxlck9wdGlvbnMoKSkgfHwgY29tcGlsZXJPcHRpb25zIHx8IHt9O1xuICAgICAgY29uc3QgcmVzb2x2ZWRNb2R1bGVOYW1lOiB0cy5SZXNvbHZlZE1vZHVsZVdpdGhGYWlsZWRMb29rdXBMb2NhdGlvbnMgPSBtb2R1bGVOYW1lWzBdID09ICcuJ1xuICAgICAgICA/ICh7XG4gICAgICAgICAgICByZXNvbHZlZE1vZHVsZTogeyByZXNvbHZlZEZpbGVOYW1lOiBqb2luKGRpcm5hbWUoZmlsZVBhdGgpLCBtb2R1bGVOYW1lKSArICcudHMnIH0sXG4gICAgICAgICAgfSBhcyB0cy5SZXNvbHZlZE1vZHVsZVdpdGhGYWlsZWRMb29rdXBMb2NhdGlvbnMpXG4gICAgICAgIDogdHMucmVzb2x2ZU1vZHVsZU5hbWUobW9kdWxlTmFtZSwgZmlsZVBhdGgsIGNvbXBPcHRpb25zLCBob3N0KTtcbiAgICAgIGlmIChyZXNvbHZlZE1vZHVsZU5hbWUucmVzb2x2ZWRNb2R1bGVcbiAgICAgICAgICAmJiByZXNvbHZlZE1vZHVsZU5hbWUucmVzb2x2ZWRNb2R1bGUucmVzb2x2ZWRGaWxlTmFtZVxuICAgICAgICAgICYmIGhvc3QuZmlsZUV4aXN0cyhyZXNvbHZlZE1vZHVsZU5hbWUucmVzb2x2ZWRNb2R1bGUucmVzb2x2ZWRGaWxlTmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIFtyb3V0ZVBhdGgsIHJlc29sdmVkTW9kdWxlTmFtZS5yZXNvbHZlZE1vZHVsZS5yZXNvbHZlZEZpbGVOYW1lXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBbcm91dGVQYXRoLCBudWxsXTtcbiAgICAgIH1cbiAgICB9KVxuICAgIC8vIFJlZHVjZSB0byB0aGUgTGF6eVJvdXRlTWFwIG1hcC5cbiAgICAucmVkdWNlKChhY2M6IExhenlSb3V0ZU1hcCwgW3JvdXRlUGF0aCwgcmVzb2x2ZWRNb2R1bGVOYW1lXTogW3N0cmluZywgc3RyaW5nIHwgbnVsbF0pID0+IHtcbiAgICAgIGlmIChyZXNvbHZlZE1vZHVsZU5hbWUpIHtcbiAgICAgICAgYWNjW3JvdXRlUGF0aF0gPSByZXNvbHZlZE1vZHVsZU5hbWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30pO1xufVxuIl19