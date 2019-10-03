"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const ts = require("typescript");
const refactor_1 = require("./refactor");
function _recursiveSymbolExportLookup(refactor, symbolName, host, program) {
    // Check this file.
    const hasSymbol = refactor.findAstNodes(null, ts.SyntaxKind.ClassDeclaration)
        .some((cd) => {
        return cd.name != undefined && cd.name.text == symbolName;
    });
    if (hasSymbol) {
        return refactor.fileName;
    }
    // We found the bootstrap variable, now we just need to get where it's imported.
    const exports = refactor.findAstNodes(null, ts.SyntaxKind.ExportDeclaration)
        .map(node => node);
    for (const decl of exports) {
        if (!decl.moduleSpecifier || decl.moduleSpecifier.kind !== ts.SyntaxKind.StringLiteral) {
            continue;
        }
        const modulePath = decl.moduleSpecifier.text;
        const resolvedModule = ts.resolveModuleName(modulePath, refactor.fileName, program.getCompilerOptions(), host);
        if (!resolvedModule.resolvedModule || !resolvedModule.resolvedModule.resolvedFileName) {
            return null;
        }
        const module = resolvedModule.resolvedModule.resolvedFileName;
        if (!decl.exportClause) {
            const moduleRefactor = new refactor_1.TypeScriptFileRefactor(module, host, program);
            const maybeModule = _recursiveSymbolExportLookup(moduleRefactor, symbolName, host, program);
            if (maybeModule) {
                return maybeModule;
            }
            continue;
        }
        const binding = decl.exportClause;
        for (const specifier of binding.elements) {
            if (specifier.name.text == symbolName) {
                // If it's a directory, load its index and recursively lookup.
                // If it's a file it will return false
                if (host.directoryExists && host.directoryExists(module)) {
                    const indexModule = core_1.join(module, 'index.ts');
                    if (host.fileExists(indexModule)) {
                        const indexRefactor = new refactor_1.TypeScriptFileRefactor(indexModule, host, program);
                        const maybeModule = _recursiveSymbolExportLookup(indexRefactor, symbolName, host, program);
                        if (maybeModule) {
                            return maybeModule;
                        }
                    }
                }
                // Create the source and verify that the symbol is at least a class.
                const source = new refactor_1.TypeScriptFileRefactor(module, host, program);
                const hasSymbol = source.findAstNodes(null, ts.SyntaxKind.ClassDeclaration)
                    .some((cd) => {
                    return cd.name != undefined && cd.name.text == symbolName;
                });
                if (hasSymbol) {
                    return module;
                }
            }
        }
    }
    return null;
}
function _symbolImportLookup(refactor, symbolName, host, program) {
    // We found the bootstrap variable, now we just need to get where it's imported.
    const imports = refactor.findAstNodes(null, ts.SyntaxKind.ImportDeclaration)
        .map(node => node);
    for (const decl of imports) {
        if (!decl.importClause || !decl.moduleSpecifier) {
            continue;
        }
        if (decl.moduleSpecifier.kind !== ts.SyntaxKind.StringLiteral) {
            continue;
        }
        const resolvedModule = ts.resolveModuleName(decl.moduleSpecifier.text, refactor.fileName, program.getCompilerOptions(), host);
        if (!resolvedModule.resolvedModule || !resolvedModule.resolvedModule.resolvedFileName) {
            continue;
        }
        const module = resolvedModule.resolvedModule.resolvedFileName;
        if (decl.importClause.namedBindings
            && decl.importClause.namedBindings.kind == ts.SyntaxKind.NamespaceImport) {
            const binding = decl.importClause.namedBindings;
            if (binding.name.text == symbolName) {
                // This is a default export.
                return module;
            }
        }
        else if (decl.importClause.namedBindings
            && decl.importClause.namedBindings.kind == ts.SyntaxKind.NamedImports) {
            const binding = decl.importClause.namedBindings;
            for (const specifier of binding.elements) {
                if (specifier.name.text == symbolName) {
                    // Create the source and recursively lookup the import.
                    const source = new refactor_1.TypeScriptFileRefactor(module, host, program);
                    const maybeModule = _recursiveSymbolExportLookup(source, symbolName, host, program);
                    if (maybeModule) {
                        return maybeModule;
                    }
                }
            }
        }
    }
    return null;
}
function resolveEntryModuleFromMain(mainPath, host, program) {
    const source = new refactor_1.TypeScriptFileRefactor(mainPath, host, program);
    const bootstrap = source.findAstNodes(source.sourceFile, ts.SyntaxKind.CallExpression, true)
        .map(node => node)
        .filter(call => {
        const access = call.expression;
        return access.kind == ts.SyntaxKind.PropertyAccessExpression
            && access.name.kind == ts.SyntaxKind.Identifier
            && (access.name.text == 'bootstrapModule'
                || access.name.text == 'bootstrapModuleFactory');
    })
        .map(node => node.arguments[0])
        .filter(node => node.kind == ts.SyntaxKind.Identifier);
    if (bootstrap.length === 1) {
        const bootstrapSymbolName = bootstrap[0].text;
        const module = _symbolImportLookup(source, bootstrapSymbolName, host, program);
        if (module) {
            return `${module.replace(/\.ts$/, '')}#${bootstrapSymbolName}`;
        }
    }
    return null;
}
exports.resolveEntryModuleFromMain = resolveEntryModuleFromMain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50cnlfcmVzb2x2ZXIuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvZW50cnlfcmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwrQ0FBa0Q7QUFDbEQsaUNBQWlDO0FBQ2pDLHlDQUFvRDtBQUdwRCxTQUFTLDRCQUE0QixDQUFDLFFBQWdDLEVBQ2hDLFVBQWtCLEVBQ2xCLElBQXFCLEVBQ3JCLE9BQW1CO0lBQ3ZELG1CQUFtQjtJQUNuQixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDO1NBQzFFLElBQUksQ0FBQyxDQUFDLEVBQXVCLEVBQUUsRUFBRTtRQUNoQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLElBQUksU0FBUyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLFVBQVUsQ0FBQztJQUM1RCxDQUFDLENBQUMsQ0FBQztJQUNMLElBQUksU0FBUyxFQUFFO1FBQ2IsT0FBTyxRQUFRLENBQUMsUUFBUSxDQUFDO0tBQzFCO0lBRUQsZ0ZBQWdGO0lBQ2hGLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUM7U0FDekUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBNEIsQ0FBQyxDQUFDO0lBRTdDLEtBQUssTUFBTSxJQUFJLElBQUksT0FBTyxFQUFFO1FBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUFFO1lBQ3RGLFNBQVM7U0FDVjtRQUVELE1BQU0sVUFBVSxHQUFJLElBQUksQ0FBQyxlQUFvQyxDQUFDLElBQUksQ0FBQztR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a0IsQ0FBQztTQUMvQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFekQsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUMxQixNQUFNLG1CQUFtQixHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDOUMsTUFBTSxNQUFNLEdBQUcsbUJBQW1CLENBQUMsTUFBTSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvRSxJQUFJLE1BQU0sRUFBRTtZQUNWLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1NBQ2hFO0tBQ0Y7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUEzQkQsZ0VBMkJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBQYXRoLCBqb2luIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBUeXBlU2NyaXB0RmlsZVJlZmFjdG9yIH0gZnJvbSAnLi9yZWZhY3Rvcic7XG5cblxuZnVuY3Rpb24gX3JlY3Vyc2l2ZVN5bWJvbEV4cG9ydExvb2t1cChyZWZhY3RvcjogVHlwZVNjcmlwdEZpbGVSZWZhY3RvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ltYm9sTmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3N0OiB0cy5Db21waWxlckhvc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyYW06IHRzLlByb2dyYW0pOiBzdHJpbmcgfCBudWxsIHtcbiAgLy8gQ2hlY2sgdGhpcyBmaWxlLlxuICBjb25zdCBoYXNTeW1ib2wgPSByZWZhY3Rvci5maW5kQXN0Tm9kZXMobnVsbCwgdHMuU3ludGF4S2luZC5DbGFzc0RlY2xhcmF0aW9uKVxuICAgIC5zb21lKChjZDogdHMuQ2xhc3NEZWNsYXJhdGlvbikgPT4ge1xuICAgICAgcmV0dXJuIGNkLm5hbWUgIT0gdW5kZWZpbmVkICYmIGNkLm5hbWUudGV4dCA9PSBzeW1ib2xOYW1lO1xuICAgIH0pO1xuICBpZiAoaGFzU3ltYm9sKSB7XG4gICAgcmV0dXJuIHJlZmFjdG9yLmZpbGVOYW1lO1xuICB9XG5cbiAgLy8gV2UgZm91bmQgdGhlIGJvb3RzdHJhcCB2YXJpYWJsZSwgbm93IHdlIGp1c3QgbmVlZCB0byBnZXQgd2hlcmUgaXQncyBpbXBvcnRlZC5cbiAgY29uc3QgZXhwb3J0cyA9IHJlZmFjdG9yLmZpbmRBc3ROb2RlcyhudWxsLCB0cy5TeW50YXhLaW5kLkV4cG9ydERlY2xhcmF0aW9uKVxuICAgIC5tYXAobm9kZSA9PiBub2RlIGFzIHRzLkV4cG9ydERlY2xhcmF0aW9uKTtcblxuICBmb3IgKGNvbnN0IGRlY2wgb2YgZXhwb3J0cykge1xuICAgIGlmICghZGVjbC5tb2R1bGVTcGVjaWZpZXIgfHwgZGVjbC5tb2R1bGVTcGVjaWZpZXIua2luZCAhPT0gdHMuU3ludGF4S2luZC5TdHJpbmdMaXRlcmFsKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVQYXRoID0gKGRlY2wubW9kdWxlU3BlY2lmaWVyIGFzIHRzLlN0cmluZ0xpdGVyYWwpLnRleHQ7XG4gICAgY29uc3QgcmVzb2x2ZWRNb2R1bGUgPSB0cy5yZXNvbHZlTW9kdWxlTmFtZShcbiAgICAgIG1vZHVsZVBhdGgsIHJlZmFjdG9yLmZpbGVOYW1lLCBwcm9ncmFtLmdldENvbXBpbGVyT3B0aW9ucygpLCBob3N0KTtcbiAgICBpZiAoIXJlc29sdmVkTW9kdWxlLnJlc29sdmVkTW9kdWxlIHx8ICFyZXNvbHZlZE1vZHVsZS5yZXNvbHZlZE1vZHVsZS5yZXNvbHZlZEZpbGVOYW1lKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGUgPSByZXNvbHZlZE1vZHVsZS5yZXNvbHZlZE1vZHVsZS5yZXNvbHZlZEZpbGVOYW1lO1xuICAgIGlmICghZGVjbC5leHBvcnRDbGF1c2UpIHtcbiAgICAgIGNvbnN0IG1vZHVsZVJlZmFjdG9yID0gbmV3IFR5cGVTY3JpcHRGaWxlUmVmYWN0b3IobW9kdWxlLCBob3N0LCBwcm9ncmFtKTtcbiAgICAgIGNvbnN0IG1heWJlTW9kdWxlID0gX3JlY3Vyc2l2ZVN5bWJvbEV4cG9ydExvb2t1cChtb2R1bGVSZWZhY3Rvciwgc3ltYm9sTmFtZSwgaG9zdCwgcHJvZ3JhbSk7XG4gICAgICBpZiAobWF5YmVNb2R1bGUpIHtcbiAgICAgICAgcmV0dXJuIG1heWJlTW9kdWxlO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYmluZGluZyA9IGRlY2wuZXhwb3J0Q2xhdXNlIGFzIHRzLk5hbWVkRXhwb3J0cztcbiAgICBmb3IgKGNvbnN0IHNwZWNpZmllciBvZiBiaW5kaW5nLmVsZW1lbnRzKSB7XG4gICAgICBpZiAoc3BlY2lmaWVyLm5hbWUudGV4dCA9PSBzeW1ib2xOYW1lKSB7XG4gICAgICAgIC8vIElmIGl0J3MgYSBkaXJlY3RvcnksIGxvYWQgaXRzIGluZGV4IGFuZCByZWN1cnNpdmVseSBsb29rdXAuXG4gICAgICAgIC8vIElmIGl0J3MgYSBmaWxlIGl0IHdpbGwgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChob3N0LmRpcmVjdG9yeUV4aXN0cyAmJiBob3N0LmRpcmVjdG9yeUV4aXN0cyhtb2R1bGUpKSB7XG4gICAgICAgICAgY29uc3QgaW5kZXhNb2R1bGUgPSBqb2luKG1vZHVsZSBhcyBQYXRoLCAnaW5kZXgudHMnKTtcbiAgICAgICAgICBpZiAoaG9zdC5maWxlRXhpc3RzKGluZGV4TW9kdWxlKSkge1xuICAgICAgICAgICAgY29uc3QgaW5kZXhSZWZhY3RvciA9IG5ldyBUeXBlU2NyaXB0RmlsZVJlZmFjdG9yKGluZGV4TW9kdWxlLCBob3N0LCBwcm9ncmFtKTtcbiAgICAgICAgICAgIGNvbnN0IG1heWJlTW9kdWxlID0gX3JlY3Vyc2l2ZVN5bWJvbEV4cG9ydExvb2t1cChcbiAgICAgICAgICAgICAgaW5kZXhSZWZhY3Rvciwgc3ltYm9sTmFtZSwgaG9zdCwgcHJvZ3JhbSk7XG4gICAgICAgICAgICBpZiAobWF5YmVNb2R1bGUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG1heWJlTW9kdWxlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlIGFuZCB2ZXJpZnkgdGhhdCB0aGUgc3ltYm9sIGlzIGF0IGxlYXN0IGEgY2xhc3MuXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IG5ldyBUeXBlU2NyaXB0RmlsZVJlZmFjdG9yKG1vZHVsZSwgaG9zdCwgcHJvZ3JhbSk7XG4gICAgICAgIGNvbnN0IGhhc1N5bWJvbCA9IHNvdXJjZS5maW5kQXN0Tm9kZXMobnVsbCwgdHMuU3ludGF4S2luZC5DbGFzc0RlY2xhcmF0aW9uKVxuICAgICAgICAgIC5zb21lKChjZDogdHMuQ2xhc3NEZWNsYXJhdGlvbikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNkLm5hbWUgIT0gdW5kZWZpbmVkICYmIGNkLm5hbWUudGV4dCA9PSBzeW1ib2xOYW1lO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChoYXNTeW1ib2wpIHtcbiAgICAgICAgICByZXR1cm4gbW9kdWxlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIF9zeW1ib2xJbXBvcnRMb29rdXAocmVmYWN0b3I6IFR5cGVTY3JpcHRGaWxlUmVmYWN0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN5bWJvbE5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9zdDogdHMuQ29tcGlsZXJIb3N0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmFtOiB0cy5Qcm9ncmFtKTogc3RyaW5nIHwgbnVsbCB7XG4gIC8vIFdlIGZvdW5kIHRoZSBib290c3RyYXAgdmFyaWFibGUsIG5vdyB3ZSBqdXN0IG5lZWQgdG8gZ2V0IHdoZXJlIGl0J3MgaW1wb3J0ZWQuXG4gIGNvbnN0IGltcG9ydHMgPSByZWZhY3Rvci5maW5kQXN0Tm9kZXMobnVsbCwgdHMuU3ludGF4S2luZC5JbXBvcnREZWNsYXJhdGlvbilcbiAgICAubWFwKG5vZGUgPT4gbm9kZSBhcyB0cy5JbXBvcnREZWNsYXJhdGlvbik7XG5cbiAgZm9yIChjb25zdCBkZWNsIG9mIGltcG9ydHMpIHtcbiAgICBpZiAoIWRlY2wuaW1wb3J0Q2xhdXNlIHx8ICFkZWNsLm1vZHVsZVNwZWNpZmllcikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChkZWNsLm1vZHVsZVNwZWNpZmllci5raW5kICE9PSB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWwpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc29sdmVkTW9kdWxlID0gdHMucmVzb2x2ZU1vZHVsZU5hbWUoXG4gICAgICAoZGVjbC5tb2R1bGVTcGVjaWZpZXIgYXMgdHMuU3RyaW5nTGl0ZXJhbCkudGV4dCxcbiAgICAgIHJlZmFjdG9yLmZpbGVOYW1lLCBwcm9ncmFtLmdldENvbXBpbGVyT3B0aW9ucygpLCBob3N0KTtcbiAgICBpZiAoIXJlc29sdmVkTW9kdWxlLnJlc29sdmVkTW9kdWxlIHx8ICFyZXNvbHZlZE1vZHVsZS5yZXNvbHZlZE1vZHVsZS5yZXNvbHZlZEZpbGVOYW1lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGUgPSByZXNvbHZlZE1vZHVsZS5yZXNvbHZlZE1vZHVsZS5yZXNvbHZlZEZpbGVOYW1lO1xuICAgIGlmIChkZWNsLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzXG4gICAgICAgICYmIGRlY2wuaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3Mua2luZCA9PSB0cy5TeW50YXhLaW5kLk5hbWVzcGFjZUltcG9ydCkge1xuICAgICAgY29uc3QgYmluZGluZyA9IGRlY2wuaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3MgYXMgdHMuTmFtZXNwYWNlSW1wb3J0O1xuICAgICAgaWYgKGJpbmRpbmcubmFtZS50ZXh0ID09IHN5bWJvbE5hbWUpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGRlZmF1bHQgZXhwb3J0LlxuICAgICAgICByZXR1cm4gbW9kdWxlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZGVjbC5pbXBvcnRDbGF1c2UubmFtZWRCaW5kaW5nc1xuICAgICAgICAgICAgICAgJiYgZGVjbC5pbXBvcnRDbGF1c2UubmFtZWRCaW5kaW5ncy5raW5kID09IHRzLlN5bnRheEtpbmQuTmFtZWRJbXBvcnRzKSB7XG4gICAgICBjb25zdCBiaW5kaW5nID0gZGVjbC5pbXBvcnRDbGF1c2UubmFtZWRCaW5kaW5ncyBhcyB0cy5OYW1lZEltcG9ydHM7XG4gICAgICBmb3IgKGNvbnN0IHNwZWNpZmllciBvZiBiaW5kaW5nLmVsZW1lbnRzKSB7XG4gICAgICAgIGlmIChzcGVjaWZpZXIubmFtZS50ZXh0ID09IHN5bWJvbE5hbWUpIHtcbiAgICAgICAgICAvLyBDcmVhdGUgdGhlIHNvdXJjZSBhbmQgcmVjdXJzaXZlbHkgbG9va3VwIHRoZSBpbXBvcnQuXG4gICAgICAgICAgY29uc3Qgc291cmNlID0gbmV3IFR5cGVTY3JpcHRGaWxlUmVmYWN0b3IobW9kdWxlLCBob3N0LCBwcm9ncmFtKTtcbiAgICAgICAgICBjb25zdCBtYXliZU1vZHVsZSA9IF9yZWN1cnNpdmVTeW1ib2xFeHBvcnRMb29rdXAoc291cmNlLCBzeW1ib2xOYW1lLCBob3N0LCBwcm9ncmFtKTtcbiAgICAgICAgICBpZiAobWF5YmVNb2R1bGUpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXliZU1vZHVsZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUVudHJ5TW9kdWxlRnJvbU1haW4obWFpblBhdGg6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3N0OiB0cy5Db21waWxlckhvc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3JhbTogdHMuUHJvZ3JhbSk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBzb3VyY2UgPSBuZXcgVHlwZVNjcmlwdEZpbGVSZWZhY3RvcihtYWluUGF0aCwgaG9zdCwgcHJvZ3JhbSk7XG5cbiAgY29uc3QgYm9vdHN0cmFwID0gc291cmNlLmZpbmRBc3ROb2Rlcyhzb3VyY2Uuc291cmNlRmlsZSwgdHMuU3ludGF4S2luZC5DYWxsRXhwcmVzc2lvbiwgdHJ1ZSlcbiAgICAubWFwKG5vZGUgPT4gbm9kZSBhcyB0cy5DYWxsRXhwcmVzc2lvbilcbiAgICAuZmlsdGVyKGNhbGwgPT4ge1xuICAgICAgY29uc3QgYWNjZXNzID0gY2FsbC5leHByZXNzaW9uIGFzIHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbjtcblxuICAgICAgcmV0dXJuIGFjY2Vzcy5raW5kID09IHRzLlN5bnRheEtpbmQuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uXG4gICAgICAgICAgJiYgYWNjZXNzLm5hbWUua2luZCA9PSB0cy5TeW50YXhLaW5kLklkZW50aWZpZXJcbiAgICAgICAgICAmJiAoYWNjZXNzLm5hbWUudGV4dCA9PSAnYm9vdHN0cmFwTW9kdWxlJ1xuICAgICAgICAgICAgICB8fCBhY2Nlc3MubmFtZS50ZXh0ID09ICdib290c3RyYXBNb2R1bGVGYWN0b3J5Jyk7XG4gICAgfSlcbiAgICAubWFwKG5vZGUgPT4gbm9kZS5hcmd1bWVudHNbMF0gYXMgdHMuSWRlbnRpZmllcilcbiAgICAuZmlsdGVyKG5vZGUgPT4gbm9kZS5raW5kID09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcik7XG5cbiAgaWYgKGJvb3RzdHJhcC5sZW5ndGggPT09IDEpIHtcbiAgICBjb25zdCBib290c3RyYXBTeW1ib2xOYW1lID0gYm9vdHN0cmFwWzBdLnRleHQ7XG4gICAgY29uc3QgbW9kdWxlID0gX3N5bWJvbEltcG9ydExvb2t1cChzb3VyY2UsIGJvb3RzdHJhcFN5bWJvbE5hbWUsIGhvc3QsIHByb2dyYW0pO1xuICAgIGlmIChtb2R1bGUpIHtcbiAgICAgIHJldHVybiBgJHttb2R1bGUucmVwbGFjZSgvXFwudHMkLywgJycpfSMke2Jvb3RzdHJhcFN5bWJvbE5hbWV9YDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==