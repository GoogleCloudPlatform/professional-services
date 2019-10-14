/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/metadata/symbols", ["require", "exports", "tslib", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var Symbols = /** @class */ (function () {
        function Symbols(sourceFile) {
            this.sourceFile = sourceFile;
            this.references = new Map();
        }
        Symbols.prototype.resolve = function (name, preferReference) {
            return (preferReference && this.references.get(name)) || this.symbols.get(name);
        };
        Symbols.prototype.define = function (name, value) { this.symbols.set(name, value); };
        Symbols.prototype.defineReference = function (name, value) {
            this.references.set(name, value);
        };
        Symbols.prototype.has = function (name) { return this.symbols.has(name); };
        Object.defineProperty(Symbols.prototype, "symbols", {
            get: function () {
                var result = this._symbols;
                if (!result) {
                    result = this._symbols = new Map();
                    populateBuiltins(result);
                    this.buildImports();
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });
        Symbols.prototype.buildImports = function () {
            var _this = this;
            var symbols = this._symbols;
            // Collect the imported symbols into this.symbols
            var stripQuotes = function (s) { return s.replace(/^['"]|['"]$/g, ''); };
            var visit = function (node) {
                var e_1, _a;
                switch (node.kind) {
                    case ts.SyntaxKind.ImportEqualsDeclaration:
                        var importEqualsDeclaration = node;
                        if (importEqualsDeclaration.moduleReference.kind ===
                            ts.SyntaxKind.ExternalModuleReference) {
                            var externalReference = importEqualsDeclaration.moduleReference;
                            if (externalReference.expression) {
                                // An `import <identifier> = require(<module-specifier>);
                                if (!externalReference.expression.parent) {
                                    // The `parent` field of a node is set by the TypeScript binder (run as
                                    // part of the type checker). Setting it here allows us to call `getText()`
                                    // even if the `SourceFile` was not type checked (which looks for `SourceFile`
                                    // in the parent chain). This doesn't damage the node as the binder unconditionally
                                    // sets the parent.
                                    externalReference.expression.parent = externalReference;
                                    externalReference.parent = _this.sourceFile;
                                }
                                var from_1 = stripQuotes(externalReference.expression.getText());
                                symbols.set(importEqualsDeclaration.name.text, { __symbolic: 'reference', module: from_1 });
                                break;
                            }
                        }
                        symbols.set(importEqualsDeclaration.name.text, { __symbolic: 'error', message: "Unsupported import syntax" });
                        break;
                    case ts.SyntaxKind.ImportDeclaration:
                        var importDecl = node;
                        if (!importDecl.importClause) {
                            // An `import <module-specifier>` clause which does not bring symbols into scope.
                            break;
                        }
                        if (!importDecl.moduleSpecifier.parent) {
                            // See note above in the `ImportEqualDeclaration` case.
                            importDecl.moduleSpecifier.parent = importDecl;
                            importDecl.parent = _this.sourceFile;
                        }
                        var from = stripQuotes(importDecl.moduleSpecifier.getText());
                        if (importDecl.importClause.name) {
                            // An `import <identifier> form <module-specifier>` clause. Record the default symbol.
                            symbols.set(importDecl.importClause.name.text, { __symbolic: 'reference', module: from, default: true });
                        }
                        var bindings = importDecl.importClause.namedBindings;
                        if (bindings) {
                            switch (bindings.kind) {
                                case ts.SyntaxKind.NamedImports:
                                    try {
                                        // An `import { [<identifier> [, <identifier>] } from <module-specifier>` clause
                                        for (var _b = tslib_1.__values(bindings.elements), _c = _b.next(); !_c.done; _c = _b.next()) {
                                            var binding = _c.value;
                                            symbols.set(binding.name.text, {
                                                __symbolic: 'reference',
                                                module: from,
                                                name: binding.propertyName ? binding.propertyName.text : binding.name.text
                                            });
                                        }
                                    }
                                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                                    finally {
                                        try {
                                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                                        }
                                        finally { if (e_1) throw e_1.error; }
                                    }
                                    break;
                                case ts.SyntaxKind.NamespaceImport:
                                    // An `input * as <identifier> from <module-specifier>` clause.
                                    symbols.set(bindings.name.text, { __symbolic: 'reference', module: from });
                                    break;
                            }
                        }
                        break;
                }
                ts.forEachChild(node, visit);
            };
            if (this.sourceFile) {
                ts.forEachChild(this.sourceFile, visit);
            }
        };
        return Symbols;
    }());
    exports.Symbols = Symbols;
    function populateBuiltins(symbols) {
        // From lib.core.d.ts (all "define const")
        ['Object', 'Function', 'String', 'Number', 'Array', 'Boolean', 'Map', 'NaN', 'Infinity', 'Math',
            'Date', 'RegExp', 'Error', 'Error', 'EvalError', 'RangeError', 'ReferenceError', 'SyntaxError',
            'TypeError', 'URIError', 'JSON', 'ArrayBuffer', 'DataView', 'Int8Array', 'Uint8Array',
            'Uint8ClampedArray', 'Uint16Array', 'Int16Array', 'Int32Array', 'Uint32Array', 'Float32Array',
            'Float64Array']
            .forEach(function (name) { return symbols.set(name, { __symbolic: 'reference', name: name }); });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ltYm9scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbWV0YWRhdGEvc3ltYm9scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCwrQkFBaUM7SUFJakM7UUFLRSxpQkFBb0IsVUFBeUI7WUFBekIsZUFBVSxHQUFWLFVBQVUsQ0FBZTtZQUZyQyxlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQStDLENBQUM7UUFFNUIsQ0FBQztRQUVqRCx5QkFBTyxHQUFQLFVBQVEsSUFBWSxFQUFFLGVBQXlCO1lBQzdDLE9BQU8sQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBRUQsd0JBQU0sR0FBTixVQUFPLElBQVksRUFBRSxLQUFvQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0UsaUNBQWUsR0FBZixVQUFnQixJQUFZLEVBQUUsS0FBMEM7WUFDdEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxxQkFBRyxHQUFILFVBQUksSUFBWSxJQUFhLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTdELHNCQUFZLDRCQUFPO2lCQUFuQjtnQkFDRSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUMzQixJQUFJLENBQUMsTUFBTSxFQUFFO29CQUNYLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLElB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QixDQUFDLE9BQW1DO1FBQzNELDBDQUEwQztRQUMxQyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE1BQU07WUFDOUYsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYTtZQUM5RixXQUFXLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxZQUFZO1lBQ3JGLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxjQUFjO1lBQzdGLGNBQWMsQ0FBQzthQUNYLE9BQU8sQ0FBQyxVQUFBLElBQUksSUFBSSxPQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxJQUFJLE1BQUEsRUFBQyxDQUFDLEVBQWxELENBQWtELENBQUMsQ0FBQztJQUMzRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtNZXRhZGF0YVN5bWJvbGljUmVmZXJlbmNlRXhwcmVzc2lvbiwgTWV0YWRhdGFWYWx1ZX0gZnJvbSAnLi9zY2hlbWEnO1xuXG5leHBvcnQgY2xhc3MgU3ltYm9scyB7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIF9zeW1ib2xzICE6IE1hcDxzdHJpbmcsIE1ldGFkYXRhVmFsdWU+O1xuICBwcml2YXRlIHJlZmVyZW5jZXMgPSBuZXcgTWFwPHN0cmluZywgTWV0YWRhdGFTeW1ib2xpY1JlZmVyZW5jZUV4cHJlc3Npb24+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKSB7fVxuXG4gIHJlc29sdmUobmFtZTogc3RyaW5nLCBwcmVmZXJSZWZlcmVuY2U/OiBib29sZWFuKTogTWV0YWRhdGFWYWx1ZXx1bmRlZmluZWQge1xuICAgIHJldHVybiAocHJlZmVyUmVmZXJlbmNlICYmIHRoaXMucmVmZXJlbmNlcy5nZXQobmFtZSkpIHx8IHRoaXMuc3ltYm9scy5nZXQobmFtZSk7XG4gIH1cblxuICBkZWZpbmUobmFtZTogc3RyaW5nLCB2YWx1ZTogTWV0YWRhdGFWYWx1ZSkgeyB0aGlzLnN5bWJvbHMuc2V0KG5hbWUsIHZhbHVlKTsgfVxuICBkZWZpbmVSZWZlcmVuY2UobmFtZTogc3RyaW5nLCB2YWx1ZTogTWV0YWRhdGFTeW1ib2xpY1JlZmVyZW5jZUV4cHJlc3Npb24pIHtcbiAgICB0aGlzLnJlZmVyZW5jZXMuc2V0KG5hbWUsIHZhbHVlKTtcbiAgfVxuXG4gIGhhcyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuc3ltYm9scy5oYXMobmFtZSk7IH1cblxuICBwcml2YXRlIGdldCBzeW1ib2xzKCk6IE1hcDxzdHJpbmcsIE1ldGFkYXRhVmFsdWU+IHtcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5fc3ltYm9scztcbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgcmVzdWx0ID0gdGhpcy5fc3ltYm9scyA9IG5ldyBNYXA8c3RyaW5nLCBNZXRhZGF0YVZhbHVlPigpO1xuICAgICAgcG9wdWxhdGVCdWlsdGlucyhyZXN1bHQpO1xuICAgICAgdGhpcy5idWlsZEltcG9ydHMoKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRJbXBvcnRzKCk6IHZvaWQge1xuICAgIGNvbnN0IHN5bWJvbHMgPSB0aGlzLl9zeW1ib2xzO1xuICAgIC8vIENvbGxlY3QgdGhlIGltcG9ydGVkIHN5bWJvbHMgaW50byB0aGlzLnN5bWJvbHNcbiAgICBjb25zdCBzdHJpcFF1b3RlcyA9IChzOiBzdHJpbmcpID0+IHMucmVwbGFjZSgvXlsnXCJdfFsnXCJdJC9nLCAnJyk7XG4gICAgY29uc3QgdmlzaXQgPSAobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgc3dpdGNoIChub2RlLmtpbmQpIHtcbiAgICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkltcG9ydEVxdWFsc0RlY2xhcmF0aW9uOlxuICAgICAgICAgIGNvbnN0IGltcG9ydEVxdWFsc0RlY2xhcmF0aW9uID0gPHRzLkltcG9ydEVxdWFsc0RlY2xhcmF0aW9uPm5vZGU7XG4gICAgICAgICAgaWYgKGltcG9ydEVxdWFsc0RlY2xhcmF0aW9uLm1vZHVsZVJlZmVyZW5jZS5raW5kID09PVxuICAgICAgICAgICAgICB0cy5TeW50YXhLaW5kLkV4dGVybmFsTW9kdWxlUmVmZXJlbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBleHRlcm5hbFJlZmVyZW5jZSA9XG4gICAgICAgICAgICAgICAgPHRzLkV4dGVybmFsTW9kdWxlUmVmZXJlbmNlPmltcG9ydEVxdWFsc0RlY2xhcmF0aW9uLm1vZHVsZVJlZmVyZW5jZTtcbiAgICAgICAgICAgIGlmIChleHRlcm5hbFJlZmVyZW5jZS5leHByZXNzaW9uKSB7XG4gICAgICAgICAgICAgIC8vIEFuIGBpbXBvcnQgPGlkZW50aWZpZXI+ID0gcmVxdWlyZSg8bW9kdWxlLXNwZWNpZmllcj4pO1xuICAgICAgICAgICAgICBpZiAoIWV4dGVybmFsUmVmZXJlbmNlLmV4cHJlc3Npb24ucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGBwYXJlbnRgIGZpZWxkIG9mIGEgbm9kZSBpcyBzZXQgYnkgdGhlIFR5cGVTY3JpcHQgYmluZGVyIChydW4gYXNcbiAgICAgICAgICAgICAgICAvLyBwYXJ0IG9mIHRoZSB0eXBlIGNoZWNrZXIpLiBTZXR0aW5nIGl0IGhlcmUgYWxsb3dzIHVzIHRvIGNhbGwgYGdldFRleHQoKWBcbiAgICAgICAgICAgICAgICAvLyBldmVuIGlmIHRoZSBgU291cmNlRmlsZWAgd2FzIG5vdCB0eXBlIGNoZWNrZWQgKHdoaWNoIGxvb2tzIGZvciBgU291cmNlRmlsZWBcbiAgICAgICAgICAgICAgICAvLyBpbiB0aGUgcGFyZW50IGNoYWluKS4gVGhpcyBkb2Vzbid0IGRhbWFnZSB0aGUgbm9kZSBhcyB0aGUgYmluZGVyIHVuY29uZGl0aW9uYWxseVxuICAgICAgICAgICAgICAgIC8vIHNldHMgdGhlIHBhcmVudC5cbiAgICAgICAgICAgICAgICBleHRlcm5hbFJlZmVyZW5jZS5leHByZXNzaW9uLnBhcmVudCA9IGV4dGVybmFsUmVmZXJlbmNlO1xuICAgICAgICAgICAgICAgIGV4dGVybmFsUmVmZXJlbmNlLnBhcmVudCA9IHRoaXMuc291cmNlRmlsZSBhcyBhbnk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc3QgZnJvbSA9IHN0cmlwUXVvdGVzKGV4dGVybmFsUmVmZXJlbmNlLmV4cHJlc3Npb24uZ2V0VGV4dCgpKTtcbiAgICAgICAgICAgICAgc3ltYm9scy5zZXQoXG4gICAgICAgICAgICAgICAgICBpbXBvcnRFcXVhbHNEZWNsYXJhdGlvbi5uYW1lLnRleHQsIHtfX3N5bWJvbGljOiAncmVmZXJlbmNlJywgbW9kdWxlOiBmcm9tfSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBzeW1ib2xzLnNldChcbiAgICAgICAgICAgICAgaW1wb3J0RXF1YWxzRGVjbGFyYXRpb24ubmFtZS50ZXh0LFxuICAgICAgICAgICAgICB7X19zeW1ib2xpYzogJ2Vycm9yJywgbWVzc2FnZTogYFVuc3VwcG9ydGVkIGltcG9ydCBzeW50YXhgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5JbXBvcnREZWNsYXJhdGlvbjpcbiAgICAgICAgICBjb25zdCBpbXBvcnREZWNsID0gPHRzLkltcG9ydERlY2xhcmF0aW9uPm5vZGU7XG4gICAgICAgICAgaWYgKCFpbXBvcnREZWNsLmltcG9ydENsYXVzZSkge1xuICAgICAgICAgICAgLy8gQW4gYGltcG9ydCA8bW9kdWxlLXNwZWNpZmllcj5gIGNsYXVzZSB3aGljaCBkb2VzIG5vdCBicmluZyBzeW1ib2xzIGludG8gc2NvcGUuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFpbXBvcnREZWNsLm1vZHVsZVNwZWNpZmllci5wYXJlbnQpIHtcbiAgICAgICAgICAgIC8vIFNlZSBub3RlIGFib3ZlIGluIHRoZSBgSW1wb3J0RXF1YWxEZWNsYXJhdGlvbmAgY2FzZS5cbiAgICAgICAgICAgIGltcG9ydERlY2wubW9kdWxlU3BlY2lmaWVyLnBhcmVudCA9IGltcG9ydERlY2w7XG4gICAgICAgICAgICBpbXBvcnREZWNsLnBhcmVudCA9IHRoaXMuc291cmNlRmlsZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgZnJvbSA9IHN0cmlwUXVvdGVzKGltcG9ydERlY2wubW9kdWxlU3BlY2lmaWVyLmdldFRleHQoKSk7XG4gICAgICAgICAgaWYgKGltcG9ydERlY2wuaW1wb3J0Q2xhdXNlLm5hbWUpIHtcbiAgICAgICAgICAgIC8vIEFuIGBpbXBvcnQgPGlkZW50aWZpZXI+IGZvcm0gPG1vZHVsZS1zcGVjaWZpZXI+YCBjbGF1c2UuIFJlY29yZCB0aGUgZGVmYXVsdCBzeW1ib2wuXG4gICAgICAgICAgICBzeW1ib2xzLnNldChcbiAgICAgICAgICAgICAgICBpbXBvcnREZWNsLmltcG9ydENsYXVzZS5uYW1lLnRleHQsXG4gICAgICAgICAgICAgICAge19fc3ltYm9saWM6ICdyZWZlcmVuY2UnLCBtb2R1bGU6IGZyb20sIGRlZmF1bHQ6IHRydWV9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgYmluZGluZ3MgPSBpbXBvcnREZWNsLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzO1xuICAgICAgICAgIGlmIChiaW5kaW5ncykge1xuICAgICAgICAgICAgc3dpdGNoIChiaW5kaW5ncy5raW5kKSB7XG4gICAgICAgICAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5OYW1lZEltcG9ydHM6XG4gICAgICAgICAgICAgICAgLy8gQW4gYGltcG9ydCB7IFs8aWRlbnRpZmllcj4gWywgPGlkZW50aWZpZXI+XSB9IGZyb20gPG1vZHVsZS1zcGVjaWZpZXI+YCBjbGF1c2VcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGJpbmRpbmcgb2YgKDx0cy5OYW1lZEltcG9ydHM+YmluZGluZ3MpLmVsZW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgICBzeW1ib2xzLnNldChiaW5kaW5nLm5hbWUudGV4dCwge1xuICAgICAgICAgICAgICAgICAgICBfX3N5bWJvbGljOiAncmVmZXJlbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlOiBmcm9tLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBiaW5kaW5nLnByb3BlcnR5TmFtZSA/IGJpbmRpbmcucHJvcGVydHlOYW1lLnRleHQgOiBiaW5kaW5nLm5hbWUudGV4dFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIHRzLlN5bnRheEtpbmQuTmFtZXNwYWNlSW1wb3J0OlxuICAgICAgICAgICAgICAgIC8vIEFuIGBpbnB1dCAqIGFzIDxpZGVudGlmaWVyPiBmcm9tIDxtb2R1bGUtc3BlY2lmaWVyPmAgY2xhdXNlLlxuICAgICAgICAgICAgICAgIHN5bWJvbHMuc2V0KFxuICAgICAgICAgICAgICAgICAgICAoPHRzLk5hbWVzcGFjZUltcG9ydD5iaW5kaW5ncykubmFtZS50ZXh0LFxuICAgICAgICAgICAgICAgICAgICB7X19zeW1ib2xpYzogJ3JlZmVyZW5jZScsIG1vZHVsZTogZnJvbX0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCB2aXNpdCk7XG4gICAgfTtcbiAgICBpZiAodGhpcy5zb3VyY2VGaWxlKSB7XG4gICAgICB0cy5mb3JFYWNoQ2hpbGQodGhpcy5zb3VyY2VGaWxlLCB2aXNpdCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHBvcHVsYXRlQnVpbHRpbnMoc3ltYm9sczogTWFwPHN0cmluZywgTWV0YWRhdGFWYWx1ZT4pIHtcbiAgLy8gRnJvbSBsaWIuY29yZS5kLnRzIChhbGwgXCJkZWZpbmUgY29uc3RcIilcbiAgWydPYmplY3QnLCAnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdBcnJheScsICdCb29sZWFuJywgJ01hcCcsICdOYU4nLCAnSW5maW5pdHknLCAnTWF0aCcsXG4gICAnRGF0ZScsICdSZWdFeHAnLCAnRXJyb3InLCAnRXJyb3InLCAnRXZhbEVycm9yJywgJ1JhbmdlRXJyb3InLCAnUmVmZXJlbmNlRXJyb3InLCAnU3ludGF4RXJyb3InLFxuICAgJ1R5cGVFcnJvcicsICdVUklFcnJvcicsICdKU09OJywgJ0FycmF5QnVmZmVyJywgJ0RhdGFWaWV3JywgJ0ludDhBcnJheScsICdVaW50OEFycmF5JyxcbiAgICdVaW50OENsYW1wZWRBcnJheScsICdVaW50MTZBcnJheScsICdJbnQxNkFycmF5JywgJ0ludDMyQXJyYXknLCAnVWludDMyQXJyYXknLCAnRmxvYXQzMkFycmF5JyxcbiAgICdGbG9hdDY0QXJyYXknXVxuICAgICAgLmZvckVhY2gobmFtZSA9PiBzeW1ib2xzLnNldChuYW1lLCB7X19zeW1ib2xpYzogJ3JlZmVyZW5jZScsIG5hbWV9KSk7XG59XG4iXX0=