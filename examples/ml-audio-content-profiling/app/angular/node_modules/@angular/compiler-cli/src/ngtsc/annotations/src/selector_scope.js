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
        define("@angular/compiler-cli/src/ngtsc/annotations/src/selector_scope", ["require", "exports", "tslib", "@angular/compiler", "typescript", "@angular/compiler-cli/src/ngtsc/metadata", "@angular/compiler-cli/src/ngtsc/metadata/src/reflector", "@angular/compiler-cli/src/ngtsc/annotations/src/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var ts = require("typescript");
    var metadata_1 = require("@angular/compiler-cli/src/ngtsc/metadata");
    var reflector_1 = require("@angular/compiler-cli/src/ngtsc/metadata/src/reflector");
    var util_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/util");
    /**
     * Registry which records and correlates static analysis information of Angular types.
     *
     * Once a compilation unit's information is fed into the SelectorScopeRegistry, it can be asked to
     * produce transitive `CompilationScope`s for components.
     */
    var SelectorScopeRegistry = /** @class */ (function () {
        function SelectorScopeRegistry(checker, reflector) {
            this.checker = checker;
            this.reflector = reflector;
            /**
             *  Map of modules declared in the current compilation unit to their (local) metadata.
             */
            this._moduleToData = new Map();
            /**
             * Map of modules to their cached `CompilationScope`s.
             */
            this._compilationScopeCache = new Map();
            /**
             * Map of components/directives to their metadata.
             */
            this._directiveToMetadata = new Map();
            /**
             * Map of pipes to their name.
             */
            this._pipeToName = new Map();
            /**
             * Map of components/directives/pipes to their module.
             */
            this._declararedTypeToModule = new Map();
        }
        /**
         * Register a module's metadata with the registry.
         */
        SelectorScopeRegistry.prototype.registerModule = function (node, data) {
            var _this = this;
            node = ts.getOriginalNode(node);
            if (this._moduleToData.has(node)) {
                throw new Error("Module already registered: " + reflector_1.reflectNameOfDeclaration(node));
            }
            this._moduleToData.set(node, data);
            // Register all of the module's declarations in the context map as belonging to this module.
            data.declarations.forEach(function (decl) {
                _this._declararedTypeToModule.set(ts.getOriginalNode(decl.node), node);
            });
        };
        /**
         * Register the metadata of a component or directive with the registry.
         */
        SelectorScopeRegistry.prototype.registerDirective = function (node, metadata) {
            node = ts.getOriginalNode(node);
            if (this._directiveToMetadata.has(node)) {
                throw new Error("Selector already registered: " + reflector_1.reflectNameOfDeclaration(node) + " " + metadata.selector);
            }
            this._directiveToMetadata.set(node, metadata);
        };
        /**
         * Register the name of a pipe with the registry.
         */
        SelectorScopeRegistry.prototype.registerPipe = function (node, name) {
            node = ts.getOriginalNode(node);
            this._pipeToName.set(node, name);
        };
        SelectorScopeRegistry.prototype.lookupCompilationScopeAsRefs = function (node) {
            var _this = this;
            node = ts.getOriginalNode(node);
            // If the component has no associated module, then it has no compilation scope.
            if (!this._declararedTypeToModule.has(node)) {
                return null;
            }
            var module = this._declararedTypeToModule.get(node);
            // Compilation scope computation is somewhat expensive, so it's cached. Check the cache for
            // the module.
            if (this._compilationScopeCache.has(module)) {
                // The compilation scope was cached.
                var scope_1 = this._compilationScopeCache.get(module);
                // The scope as cached is in terms of References, not Expressions. Converting between them
                // requires knowledge of the context file (in this case, the component node's source file).
                return scope_1;
            }
            // This is the first time the scope for this module is being computed.
            var directives = new Map();
            var pipes = new Map();
            // Process the declaration scope of the module, and lookup the selector of every declared type.
            // The initial value of ngModuleImportedFrom is 'null' which signifies that the NgModule
            // was not imported from a .d.ts source.
            this.lookupScopesOrDie(module, /* ngModuleImportedFrom */ null).compilation.forEach(function (ref) {
                var node = ts.getOriginalNode(ref.node);
                // Either the node represents a directive or a pipe. Look for both.
                var metadata = _this.lookupDirectiveMetadata(ref);
                // Only directives/components with selectors get added to the scope.
                if (metadata != null) {
                    directives.set(metadata.selector, tslib_1.__assign({}, metadata, { directive: ref }));
                    return;
                }
                var name = _this.lookupPipeName(node);
                if (name != null) {
                    pipes.set(name, ref);
                }
            });
            var scope = { directives: directives, pipes: pipes };
            // Many components may be compiled in the same scope, so cache it.
            this._compilationScopeCache.set(node, scope);
            // Convert References to Expressions in the context of the component's source file.
            return scope;
        };
        /**
         * Produce the compilation scope of a component, which is determined by the module that declares
         * it.
         */
        SelectorScopeRegistry.prototype.lookupCompilationScope = function (node) {
            var scope = this.lookupCompilationScopeAsRefs(node);
            return scope !== null ? convertScopeToExpressions(scope, node) : null;
        };
        SelectorScopeRegistry.prototype.lookupScopesOrDie = function (node, ngModuleImportedFrom) {
            var result = this.lookupScopes(node, ngModuleImportedFrom);
            if (result === null) {
                throw new Error("Module not found: " + reflector_1.reflectIdentifierOfDeclaration(node));
            }
            return result;
        };
        /**
         * Lookup `SelectorScopes` for a given module.
         *
         * This function assumes that if the given module was imported from an absolute path
         * (`ngModuleImportedFrom`) then all of its declarations are exported at that same path, as well
         * as imports and exports from other modules that are relatively imported.
         */
        SelectorScopeRegistry.prototype.lookupScopes = function (node, ngModuleImportedFrom) {
            var _this = this;
            var data = null;
            // Either this module was analyzed directly, or has a precompiled ngModuleDef.
            if (this._moduleToData.has(node)) {
                // The module was analyzed before, and thus its data is available.
                data = this._moduleToData.get(node);
            }
            else {
                // The module wasn't analyzed before, and probably has a precompiled ngModuleDef with a type
                // annotation that specifies the needed metadata.
                data = this._readModuleDataFromCompiledClass(node, ngModuleImportedFrom);
                // Note that data here could still be null, if the class didn't have a precompiled
                // ngModuleDef.
            }
            if (data === null) {
                return null;
            }
            return {
                compilation: tslib_1.__spread(data.declarations, flatten(data.imports.map(function (ref) { return _this.lookupScopesOrDie(ref.node, absoluteModuleName(ref))
                    .exported; })), flatten(data.exports
                    .map(function (ref) { return _this.lookupScopes(ref.node, absoluteModuleName(ref)); })
                    .filter(function (scope) { return scope !== null; })
                    .map(function (scope) { return scope.exported; }))),
                exported: flatten(data.exports.map(function (ref) {
                    var scope = _this.lookupScopes(ref.node, absoluteModuleName(ref));
                    if (scope !== null) {
                        return scope.exported;
                    }
                    else {
                        return [ref];
                    }
                })),
            };
        };
        /**
         * Lookup the metadata of a component or directive class.
         *
         * Potentially this class is declared in a .d.ts file or otherwise has a manually created
         * ngComponentDef/ngDirectiveDef. In this case, the type metadata of that definition is read
         * to determine the metadata.
         */
        SelectorScopeRegistry.prototype.lookupDirectiveMetadata = function (ref) {
            var node = ts.getOriginalNode(ref.node);
            if (this._directiveToMetadata.has(node)) {
                return this._directiveToMetadata.get(node);
            }
            else {
                return this._readMetadataFromCompiledClass(ref);
            }
        };
        SelectorScopeRegistry.prototype.lookupPipeName = function (node) {
            if (this._pipeToName.has(node)) {
                return this._pipeToName.get(node);
            }
            else {
                return this._readNameFromCompiledClass(node);
            }
        };
        /**
         * Read the metadata from a class that has already been compiled somehow (either it's in a .d.ts
         * file, or in a .ts file with a handwritten definition).
         *
         * @param clazz the class of interest
         * @param ngModuleImportedFrom module specifier of the import path to assume for all declarations
         * stemming from this module.
         */
        SelectorScopeRegistry.prototype._readModuleDataFromCompiledClass = function (clazz, ngModuleImportedFrom) {
            // This operation is explicitly not memoized, as it depends on `ngModuleImportedFrom`.
            // TODO(alxhub): investigate caching of .d.ts module metadata.
            var ngModuleDef = this.reflector.getMembersOfClass(clazz).find(function (member) { return member.name === 'ngModuleDef' && member.isStatic; });
            if (ngModuleDef === undefined) {
                return null;
            }
            else if (
            // Validate that the shape of the ngModuleDef type is correct.
            ngModuleDef.type === null || !ts.isTypeReferenceNode(ngModuleDef.type) ||
                ngModuleDef.type.typeArguments === undefined ||
                ngModuleDef.type.typeArguments.length !== 4) {
                return null;
            }
            // Read the ModuleData out of the type arguments.
            var _a = tslib_1.__read(ngModuleDef.type.typeArguments, 4), _ = _a[0], declarationMetadata = _a[1], importMetadata = _a[2], exportMetadata = _a[3];
            return {
                declarations: this._extractReferencesFromType(declarationMetadata, ngModuleImportedFrom),
                exports: this._extractReferencesFromType(exportMetadata, ngModuleImportedFrom),
                imports: this._extractReferencesFromType(importMetadata, ngModuleImportedFrom),
            };
        };
        /**
         * Get the selector from type metadata for a class with a precompiled ngComponentDef or
         * ngDirectiveDef.
         */
        SelectorScopeRegistry.prototype._readMetadataFromCompiledClass = function (ref) {
            var clazz = ts.getOriginalNode(ref.node);
            var def = this.reflector.getMembersOfClass(clazz).find(function (field) {
                return field.isStatic && (field.name === 'ngComponentDef' || field.name === 'ngDirectiveDef');
            });
            if (def === undefined) {
                // No definition could be found.
                return null;
            }
            else if (def.type === null || !ts.isTypeReferenceNode(def.type) ||
                def.type.typeArguments === undefined || def.type.typeArguments.length < 2) {
                // The type metadata was the wrong shape.
                return null;
            }
            var selector = readStringType(def.type.typeArguments[1]);
            if (selector === null) {
                return null;
            }
            return tslib_1.__assign({ ref: ref, name: clazz.name.text, directive: ref, isComponent: def.name === 'ngComponentDef', selector: selector, exportAs: readStringType(def.type.typeArguments[2]), inputs: readStringMapType(def.type.typeArguments[3]), outputs: readStringMapType(def.type.typeArguments[4]), queries: readStringArrayType(def.type.typeArguments[5]) }, util_1.extractDirectiveGuards(clazz, this.reflector));
        };
        /**
         * Get the selector from type metadata for a class with a precompiled ngComponentDef or
         * ngDirectiveDef.
         */
        SelectorScopeRegistry.prototype._readNameFromCompiledClass = function (clazz) {
            var def = this.reflector.getMembersOfClass(clazz).find(function (field) { return field.isStatic && field.name === 'ngPipeDef'; });
            if (def === undefined) {
                // No definition could be found.
                return null;
            }
            else if (def.type === null || !ts.isTypeReferenceNode(def.type) ||
                def.type.typeArguments === undefined || def.type.typeArguments.length < 2) {
                // The type metadata was the wrong shape.
                return null;
            }
            var type = def.type.typeArguments[1];
            if (!ts.isLiteralTypeNode(type) || !ts.isStringLiteral(type.literal)) {
                // The type metadata was the wrong type.
                return null;
            }
            return type.literal.text;
        };
        /**
         * Process a `TypeNode` which is a tuple of references to other types, and return `Reference`s to
         * them.
         *
         * This operation assumes that these types should be imported from `ngModuleImportedFrom` unless
         * they themselves were imported from another absolute path.
         */
        SelectorScopeRegistry.prototype._extractReferencesFromType = function (def, ngModuleImportedFrom) {
            var _this = this;
            if (!ts.isTupleTypeNode(def)) {
                return [];
            }
            return def.elementTypes.map(function (element) {
                if (!ts.isTypeQueryNode(element)) {
                    throw new Error("Expected TypeQueryNode");
                }
                var type = element.exprName;
                if (ngModuleImportedFrom !== null) {
                    var _a = metadata_1.reflectTypeEntityToDeclaration(type, _this.checker), node = _a.node, from = _a.from;
                    var moduleName = (from !== null && !from.startsWith('.') ? from : ngModuleImportedFrom);
                    var id = reflector_1.reflectIdentifierOfDeclaration(node);
                    return new metadata_1.AbsoluteReference(node, id, moduleName, id.text);
                }
                else {
                    var node = metadata_1.reflectTypeEntityToDeclaration(type, _this.checker).node;
                    var id = reflector_1.reflectIdentifierOfDeclaration(node);
                    return new metadata_1.ResolvedReference(node, id);
                }
            });
        };
        return SelectorScopeRegistry;
    }());
    exports.SelectorScopeRegistry = SelectorScopeRegistry;
    function flatten(array) {
        return array.reduce(function (accum, subArray) {
            accum.push.apply(accum, tslib_1.__spread(subArray));
            return accum;
        }, []);
    }
    function absoluteModuleName(ref) {
        if (!(ref instanceof metadata_1.AbsoluteReference)) {
            return null;
        }
        return ref.moduleName;
    }
    function convertDirectiveReferenceMap(map, context) {
        var newMap = new Map();
        map.forEach(function (meta, selector) {
            newMap.set(selector, tslib_1.__assign({}, meta, { directive: util_1.toR3Reference(meta.directive, context).value }));
        });
        return newMap;
    }
    function convertPipeReferenceMap(map, context) {
        var newMap = new Map();
        map.forEach(function (meta, selector) { newMap.set(selector, util_1.toR3Reference(meta, context).value); });
        return newMap;
    }
    function convertScopeToExpressions(scope, context) {
        var sourceContext = ts.getOriginalNode(context).getSourceFile();
        var directives = convertDirectiveReferenceMap(scope.directives, sourceContext);
        var pipes = convertPipeReferenceMap(scope.pipes, sourceContext);
        var declPointer = maybeUnwrapNameOfDeclaration(context);
        var containsForwardDecls = false;
        directives.forEach(function (expr) {
            containsForwardDecls = containsForwardDecls ||
                isExpressionForwardReference(expr.directive, declPointer, sourceContext);
        });
        !containsForwardDecls && pipes.forEach(function (expr) {
            containsForwardDecls =
                containsForwardDecls || isExpressionForwardReference(expr, declPointer, sourceContext);
        });
        return { directives: directives, pipes: pipes, containsForwardDecls: containsForwardDecls };
    }
    function isExpressionForwardReference(expr, context, contextSource) {
        if (isWrappedTsNodeExpr(expr)) {
            var node = ts.getOriginalNode(expr.node);
            return node.getSourceFile() === contextSource && context.pos < node.pos;
        }
        return false;
    }
    function isWrappedTsNodeExpr(expr) {
        return expr instanceof compiler_1.WrappedNodeExpr;
    }
    function maybeUnwrapNameOfDeclaration(decl) {
        if ((ts.isClassDeclaration(decl) || ts.isVariableDeclaration(decl)) && decl.name !== undefined &&
            ts.isIdentifier(decl.name)) {
            return decl.name;
        }
        return decl;
    }
    function readStringType(type) {
        if (!ts.isLiteralTypeNode(type) || !ts.isStringLiteral(type.literal)) {
            return null;
        }
        return type.literal.text;
    }
    function readStringMapType(type) {
        if (!ts.isTypeLiteralNode(type)) {
            return {};
        }
        var obj = {};
        type.members.forEach(function (member) {
            if (!ts.isPropertySignature(member) || member.type === undefined || member.name === undefined ||
                !ts.isStringLiteral(member.name)) {
                return;
            }
            var value = readStringType(member.type);
            if (value === null) {
                return null;
            }
            obj[member.name.text] = value;
        });
        return obj;
    }
    function readStringArrayType(type) {
        if (!ts.isTupleTypeNode(type)) {
            return [];
        }
        var res = [];
        type.elementTypes.forEach(function (el) {
            if (!ts.isLiteralTypeNode(el) || !ts.isStringLiteral(el.literal)) {
                return;
            }
            res.push(el.literal.text);
        });
        return res;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0b3Jfc2NvcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL2Fubm90YXRpb25zL3NyYy9zZWxlY3Rvcl9zY29wZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCw4Q0FBK0Y7SUFDL0YsK0JBQWlDO0lBR2pDLHFFQUErRztJQUMvRyxvRkFBc0c7SUFHdEcsNkVBQTZEO0lBNEM3RDs7Ozs7T0FLRztJQUNIO1FBMEJFLCtCQUFvQixPQUF1QixFQUFVLFNBQXlCO1lBQTFELFlBQU8sR0FBUCxPQUFPLENBQWdCO1lBQVUsY0FBUyxHQUFULFNBQVMsQ0FBZ0I7WUF6QjlFOztlQUVHO1lBQ0ssa0JBQWEsR0FBRyxJQUFJLEdBQUcsRUFBOEIsQ0FBQztZQUU5RDs7ZUFFRztZQUNLLDJCQUFzQixHQUFHLElBQUksR0FBRyxFQUErQyxDQUFDO1lBRXhGOztlQUVHO1lBQ0sseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQTZDLENBQUM7WUFFcEY7O2VBRUc7WUFDSyxnQkFBVyxHQUFHLElBQUksR0FBRyxFQUEwQixDQUFDO1lBRXhEOztlQUVHO1lBQ0ssNEJBQXVCLEdBQUcsSUFBSSxHQUFHLEVBQWtDLENBQUM7UUFFSyxDQUFDO1FBRWxGOztXQUVHO1FBQ0gsOENBQWMsR0FBZCxVQUFlLElBQW9CLEVBQUUsSUFBZ0I7WUFBckQsaUJBWUM7WUFYQyxJQUFJLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQW1CLENBQUM7WUFFbEQsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBOEIsb0NBQXdCLENBQUMsSUFBSSxDQUFHLENBQUMsQ0FBQzthQUNqRjtZQUNELElBQUksQ0FBQyxhQUFh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QUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3BDLE9BQU87YUFDUjtZQUNELElBQU0sS0FBSyxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUMsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO2dCQUNsQixPQUFPLElBQUksQ0FBQzthQUNiO1lBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRUQsU0FBUyxtQkFBbUIsQ0FBQyxJQUFpQjtRQUM1QyxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM3QixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsSUFBTSxHQUFHLEdBQWEsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFVBQUEsRUFBRTtZQUMxQixJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ2hFLE9BQU87YUFDUjtZQUNELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFeHByZXNzaW9uLCBFeHRlcm5hbEV4cHIsIEV4dGVybmFsUmVmZXJlbmNlLCBXcmFwcGVkTm9kZUV4cHJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge1JlZmxlY3Rpb25Ib3N0fSBmcm9tICcuLi8uLi9ob3N0JztcbmltcG9ydCB7QWJzb2x1dGVSZWZlcmVuY2UsIFJlZmVyZW5jZSwgUmVzb2x2ZWRSZWZlcmVuY2UsIHJlZmxlY3RUeXBlRW50aXR5VG9EZWNsYXJhdGlvbn0gZnJvbSAnLi4vLi4vbWV0YWRhdGEnO1xuaW1wb3J0IHtyZWZsZWN0SWRlbnRpZmllck9mRGVjbGFyYXRpb24sIHJlZmxlY3ROYW1lT2ZEZWNsYXJhdGlvbn0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc3JjL3JlZmxlY3Rvcic7XG5pbXBvcnQge1R5cGVDaGVja2FibGVEaXJlY3RpdmVNZXRhfSBmcm9tICcuLi8uLi90eXBlY2hlY2snO1xuXG5pbXBvcnQge2V4dHJhY3REaXJlY3RpdmVHdWFyZHMsIHRvUjNSZWZlcmVuY2V9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqXG4gKiBNZXRhZGF0YSBleHRyYWN0ZWQgZm9yIGEgZ2l2ZW4gTmdNb2R1bGUgdGhhdCBjYW4gYmUgdXNlZCB0byBjb21wdXRlIHNlbGVjdG9yIHNjb3Blcy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNb2R1bGVEYXRhIHtcbiAgZGVjbGFyYXRpb25zOiBSZWZlcmVuY2U8dHMuRGVjbGFyYXRpb24+W107XG4gIGltcG9ydHM6IFJlZmVyZW5jZTx0cy5EZWNsYXJhdGlvbj5bXTtcbiAgZXhwb3J0czogUmVmZXJlbmNlPHRzLkRlY2xhcmF0aW9uPltdO1xufVxuXG4vKipcbiAqIFRyYW5zaXRpdmVseSBleHBhbmRlZCBtYXBzIG9mIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIHZpc2libGUgdG8gYSBjb21wb25lbnQgYmVpbmcgY29tcGlsZWQgaW4gdGhlXG4gKiBjb250ZXh0IG9mIHNvbWUgbW9kdWxlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBpbGF0aW9uU2NvcGU8VD4ge1xuICBkaXJlY3RpdmVzOiBNYXA8c3RyaW5nLCBTY29wZURpcmVjdGl2ZTxUPj47XG4gIHBpcGVzOiBNYXA8c3RyaW5nLCBUPjtcbiAgY29udGFpbnNGb3J3YXJkRGVjbHM/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNjb3BlRGlyZWN0aXZlPFQ+IGV4dGVuZHMgVHlwZUNoZWNrYWJsZURpcmVjdGl2ZU1ldGEge1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICBkaXJlY3RpdmU6IFQ7XG59XG5cbi8qKlxuICogQm90aCB0cmFuc2l0aXZlbHkgZXhwYW5kZWQgc2NvcGVzIGZvciBhIGdpdmVuIE5nTW9kdWxlLlxuICovXG5pbnRlcmZhY2UgU2VsZWN0b3JTY29wZXMge1xuICAvKipcbiAgICogU2V0IG9mIGNvbXBvbmVudHMsIGRpcmVjdGl2ZXMsIGFuZCBwaXBlcyB2aXNpYmxlIHRvIGFsbCBjb21wb25lbnRzIGJlaW5nIGNvbXBpbGVkIGluIHRoZVxuICAgKiBjb250ZXh0IG9mIHNvbWUgbW9kdWxlLlxuICAgKi9cbiAgY29tcGlsYXRpb246IFJlZmVyZW5jZTx0cy5EZWNsYXJhdGlvbj5bXTtcblxuICAvKipcbiAgICogU2V0IG9mIGNvbXBvbmVudHMsIGRpcmVjdGl2ZXMsIGFuZCBwaXBlcyBhZGRlZCB0byB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2YgYW55IG1vZHVsZSBpbXBvcnRpbmdcbiAgICogc29tZSBtb2R1bGUuXG4gICAqL1xuICBleHBvcnRlZDogUmVmZXJlbmNlPHRzLkRlY2xhcmF0aW9uPltdO1xufVxuXG4vKipcbiAqIFJlZ2lzdHJ5IHdoaWNoIHJlY29yZHMgYW5kIGNvcnJlbGF0ZXMgc3RhdGljIGFuYWx5c2lzIGluZm9ybWF0aW9uIG9mIEFuZ3VsYXIgdHlwZXMuXG4gKlxuICogT25jZSBhIGNvbXBpbGF0aW9uIHVuaXQncyBpbmZvcm1hdGlvbiBpcyBmZWQgaW50byB0aGUgU2VsZWN0b3JTY29wZVJlZ2lzdHJ5LCBpdCBjYW4gYmUgYXNrZWQgdG9cbiAqIHByb2R1Y2UgdHJhbnNpdGl2ZSBgQ29tcGlsYXRpb25TY29wZWBzIGZvciBjb21wb25lbnRzLlxuICovXG5leHBvcnQgY2xhc3MgU2VsZWN0b3JTY29wZVJlZ2lzdHJ5IHtcbiAgLyoqXG4gICAqICBNYXAgb2YgbW9kdWxlcyBkZWNsYXJlZCBpbiB0aGUgY3VycmVudCBjb21waWxhdGlvbiB1bml0IHRvIHRoZWlyIChsb2NhbCkgbWV0YWRhdGEuXG4gICAqL1xuICBwcml2YXRlIF9tb2R1bGVUb0RhdGEgPSBuZXcgTWFwPHRzLkRlY2xhcmF0aW9uLCBNb2R1bGVEYXRhPigpO1xuXG4gIC8qKlxuICAgKiBNYXAgb2YgbW9kdWxlcyB0byB0aGVpciBjYWNoZWQgYENvbXBpbGF0aW9uU2NvcGVgcy5cbiAgICovXG4gIHByaXZhdGUgX2NvbXBpbGF0aW9uU2NvcGVDYWNoZSA9IG5ldyBNYXA8dHMuRGVjbGFyYXRpb24sIENvbXBpbGF0aW9uU2NvcGU8UmVmZXJlbmNlPj4oKTtcblxuICAvKipcbiAgICogTWFwIG9mIGNvbXBvbmVudHMvZGlyZWN0aXZlcyB0byB0aGVpciBtZXRhZGF0YS5cbiAgICovXG4gIHByaXZhdGUgX2RpcmVjdGl2ZVRvTWV0YWRhdGEgPSBuZXcgTWFwPHRzLkRlY2xhcmF0aW9uLCBTY29wZURpcmVjdGl2ZTxSZWZlcmVuY2U+PigpO1xuXG4gIC8qKlxuICAgKiBNYXAgb2YgcGlwZXMgdG8gdGhlaXIgbmFtZS5cbiAgICovXG4gIHByaXZhdGUgX3BpcGVUb05hbWUgPSBuZXcgTWFwPHRzLkRlY2xhcmF0aW9uLCBzdHJpbmc+KCk7XG5cbiAgLyoqXG4gICAqIE1hcCBvZiBjb21wb25lbnRzL2RpcmVjdGl2ZXMvcGlwZXMgdG8gdGhlaXIgbW9kdWxlLlxuICAgKi9cbiAgcHJpdmF0ZSBfZGVjbGFyYXJlZFR5cGVUb01vZHVsZSA9IG5ldyBNYXA8dHMuRGVjbGFyYXRpb24sIHRzLkRlY2xhcmF0aW9uPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIHByaXZhdGUgcmVmbGVjdG9yOiBSZWZsZWN0aW9uSG9zdCkge31cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBtb2R1bGUncyBtZXRhZGF0YSB3aXRoIHRoZSByZWdpc3RyeS5cbiAgICovXG4gIHJlZ2lzdGVyTW9kdWxlKG5vZGU6IHRzLkRlY2xhcmF0aW9uLCBkYXRhOiBNb2R1bGVEYXRhKTogdm9pZCB7XG4gICAgbm9kZSA9IHRzLmdldE9yaWdpbmFsTm9kZShub2RlKSBhcyB0cy5EZWNsYXJhdGlvbjtcblxuICAgIGlmICh0aGlzLl9tb2R1bGVUb0RhdGEuaGFzKG5vZGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE1vZHVsZSBhbHJlYWR5IHJlZ2lzdGVyZWQ6ICR7cmVmbGVjdE5hbWVPZkRlY2xhcmF0aW9uKG5vZGUpfWApO1xuICAgIH1cbiAgICB0aGlzLl9tb2R1bGVUb0RhdGEuc2V0KG5vZGUsIGRhdGEpO1xuXG4gICAgLy8gUmVnaXN0ZXIgYWxsIG9mIHRoZSBtb2R1bGUncyBkZWNsYXJhdGlvbnMgaW4gdGhlIGNvbnRleHQgbWFwIGFzIGJlbG9uZ2luZyB0byB0aGlzIG1vZHVsZS5cbiAgICBkYXRhLmRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2wgPT4ge1xuICAgICAgdGhpcy5fZGVjbGFyYXJlZFR5cGVUb01vZHVsZS5zZXQodHMuZ2V0T3JpZ2luYWxOb2RlKGRlY2wubm9kZSkgYXMgdHMuRGVjbGFyYXRpb24sIG5vZGUpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIHRoZSBtZXRhZGF0YSBvZiBhIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgd2l0aCB0aGUgcmVnaXN0cnkuXG4gICAqL1xuICByZWdpc3RlckRpcmVjdGl2ZShub2RlOiB0cy5EZWNsYXJhdGlvbiwgbWV0YWRhdGE6IFNjb3BlRGlyZWN0aXZlPFJlZmVyZW5jZT4pOiB2b2lkIHtcbiAgICBub2RlID0gdHMuZ2V0T3JpZ2luYWxOb2RlKG5vZGUpIGFzIHRzLkRlY2xhcmF0aW9uO1xuXG4gICAgaWYgKHRoaXMuX2RpcmVjdGl2ZVRvTWV0YWRhdGEuaGFzKG5vZGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFNlbGVjdG9yIGFscmVhZHkgcmVnaXN0ZXJlZDogJHtyZWZsZWN0TmFtZU9mRGVjbGFyYXRpb24obm9kZSl9ICR7bWV0YWRhdGEuc2VsZWN0b3J9YCk7XG4gICAgfVxuICAgIHRoaXMuX2RpcmVjdGl2ZVRvTWV0YWRhdGEuc2V0KG5vZGUsIG1ldGFkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciB0aGUgbmFtZSBvZiBhIHBpcGUgd2l0aCB0aGUgcmVnaXN0cnkuXG4gICAqL1xuICByZWdpc3RlclBpcGUobm9kZTogdHMuRGVjbGFyYXRpb24sIG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIG5vZGUgPSB0cy5nZXRPcmlnaW5hbE5vZGUobm9kZSkgYXMgdHMuRGVjbGFyYXRpb247XG5cbiAgICB0aGlzLl9waXBlVG9OYW1lLnNldChub2RlLCBuYW1lKTtcbiAgfVxuXG4gIGxvb2t1cENvbXBpbGF0aW9uU2NvcGVBc1JlZnMobm9kZTogdHMuRGVjbGFyYXRpb24pOiBDb21waWxhdGlvblNjb3BlPFJlZmVyZW5jZT58bnVsbCB7XG4gICAgbm9kZSA9IHRzLmdldE9yaWdpbmFsTm9kZShub2RlKSBhcyB0cy5EZWNsYXJhdGlvbjtcblxuICAgIC8vIElmIHRoZSBjb21wb25lbnQgaGFzIG5vIGFzc29jaWF0ZWQgbW9kdWxlLCB0aGVuIGl0IGhhcyBubyBjb21waWxhdGlvbiBzY29wZS5cbiAgICBpZiAoIXRoaXMuX2RlY2xhcmFyZWRUeXBlVG9Nb2R1bGUuaGFzKG5vZGUpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGUgPSB0aGlzLl9kZWNsYXJhcmVkVHlwZVRvTW9kdWxlLmdldChub2RlKSAhO1xuXG4gICAgLy8gQ29tcGlsYXRpb24gc2NvcGUgY29tcHV0YXRpb24gaXMgc29tZXdoYXQgZXhwZW5zaXZlLCBzbyBpdCdzIGNhY2hlZC4gQ2hlY2sgdGhlIGNhY2hlIGZvclxuICAgIC8vIHRoZSBtb2R1bGUuXG4gICAgaWYgKHRoaXMuX2NvbXBpbGF0aW9uU2NvcGVDYWNoZS5oYXMobW9kdWxlKSkge1xuICAgICAgLy8gVGhlIGNvbXBpbGF0aW9uIHNjb3BlIHdhcyBjYWNoZWQuXG4gICAgICBjb25zdCBzY29wZSA9IHRoaXMuX2NvbXBpbGF0aW9uU2NvcGVDYWNoZS5nZXQobW9kdWxlKSAhO1xuXG4gICAgICAvLyBUaGUgc2NvcGUgYXMgY2FjaGVkIGlzIGluIHRlcm1zIG9mIFJlZmVyZW5jZXMsIG5vdCBFeHByZXNzaW9ucy4gQ29udmVydGluZyBiZXR3ZWVuIHRoZW1cbiAgICAgIC8vIHJlcXVpcmVzIGtub3dsZWRnZSBvZiB0aGUgY29udGV4dCBmaWxlIChpbiB0aGlzIGNhc2UsIHRoZSBjb21wb25lbnQgbm9kZSdzIHNvdXJjZSBmaWxlKS5cbiAgICAgIHJldHVybiBzY29wZTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIHRoZSBmaXJzdCB0aW1lIHRoZSBzY29wZSBmb3IgdGhpcyBtb2R1bGUgaXMgYmVpbmcgY29tcHV0ZWQuXG4gICAgY29uc3QgZGlyZWN0aXZlcyA9IG5ldyBNYXA8c3RyaW5nLCBTY29wZURpcmVjdGl2ZTxSZWZlcmVuY2U8dHMuRGVjbGFyYXRpb24+Pj4oKTtcbiAgICBjb25zdCBwaXBlcyA9IG5ldyBNYXA8c3RyaW5nLCBSZWZlcmVuY2U+KCk7XG5cbiAgICAvLyBQcm9jZXNzIHRoZSBkZWNsYXJhdGlvbiBzY29wZSBvZiB0aGUgbW9kdWxlLCBhbmQgbG9va3VwIHRoZSBzZWxlY3RvciBvZiBldmVyeSBkZWNsYXJlZCB0eXBlLlxuICAgIC8vIFRoZSBpbml0aWFsIHZhbHVlIG9mIG5nTW9kdWxlSW1wb3J0ZWRGcm9tIGlzICdudWxsJyB3aGljaCBzaWduaWZpZXMgdGhhdCB0aGUgTmdNb2R1bGVcbiAgICAvLyB3YXMgbm90IGltcG9ydGVkIGZyb20gYSAuZC50cyBzb3VyY2UuXG4gICAgdGhpcy5sb29rdXBTY29wZXNPckRpZShtb2R1bGUgISwgLyogbmdNb2R1bGVJbXBvcnRlZEZyb20gKi8gbnVsbCkuY29tcGlsYXRpb24uZm9yRWFjaChyZWYgPT4ge1xuICAgICAgY29uc3Qgbm9kZSA9IHRzLmdldE9yaWdpbmFsTm9kZShyZWYubm9kZSkgYXMgdHMuRGVjbGFyYXRpb247XG5cbiAgICAgIC8vIEVpdGhlciB0aGUgbm9kZSByZXByZXNlbnRzIGEgZGlyZWN0aXZlIG9yIGEgcGlwZS4gTG9vayBmb3IgYm90aC5cbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5sb29rdXBEaXJlY3RpdmVNZXRhZGF0YShyZWYpO1xuICAgICAgLy8gT25seSBkaXJlY3RpdmVzL2NvbXBvbmVudHMgd2l0aCBzZWxlY3RvcnMgZ2V0IGFkZGVkIHRvIHRoZSBzY29wZS5cbiAgICAgIGlmIChtZXRhZGF0YSAhPSBudWxsKSB7XG4gICAgICAgIGRpcmVjdGl2ZXMuc2V0KG1ldGFkYXRhLnNlbGVjdG9yLCB7Li4ubWV0YWRhdGEsIGRpcmVjdGl2ZTogcmVmfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmFtZSA9IHRoaXMubG9va3VwUGlwZU5hbWUobm9kZSk7XG4gICAgICBpZiAobmFtZSAhPSBudWxsKSB7XG4gICAgICAgIHBpcGVzLnNldChuYW1lLCByZWYpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2NvcGU6IENvbXBpbGF0aW9uU2NvcGU8UmVmZXJlbmNlPiA9IHtkaXJlY3RpdmVzLCBwaXBlc307XG5cbiAgICAvLyBNYW55IGNvbXBvbmVudHMgbWF5IGJlIGNvbXBpbGVkIGluIHRoZSBzYW1lIHNjb3BlLCBzbyBjYWNoZSBpdC5cbiAgICB0aGlzLl9jb21waWxhdGlvblNjb3BlQ2FjaGUuc2V0KG5vZGUsIHNjb3BlKTtcblxuICAgIC8vIENvbnZlcnQgUmVmZXJlbmNlcyB0byBFeHByZXNzaW9ucyBpbiB0aGUgY29udGV4dCBvZiB0aGUgY29tcG9uZW50J3Mgc291cmNlIGZpbGUuXG4gICAgcmV0dXJuIHNjb3BlO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb2R1Y2UgdGhlIGNvbXBpbGF0aW9uIHNjb3BlIG9mIGEgY29tcG9uZW50LCB3aGljaCBpcyBkZXRlcm1pbmVkIGJ5IHRoZSBtb2R1bGUgdGhhdCBkZWNsYXJlc1xuICAgKiBpdC5cbiAgICovXG4gIGxvb2t1cENvbXBpbGF0aW9uU2NvcGUobm9kZTogdHMuRGVjbGFyYXRpb24pOiBDb21waWxhdGlvblNjb3BlPEV4cHJlc3Npb24+fG51bGwge1xuICAgIGNvbnN0IHNjb3BlID0gdGhpcy5sb29rdXBDb21waWxhdGlvblNjb3BlQXNSZWZzKG5vZGUpO1xuICAgIHJldHVybiBzY29wZSAhPT0gbnVsbCA/IGNvbnZlcnRTY29wZVRvRXhwcmVzc2lvbnMoc2NvcGUsIG5vZGUpIDogbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgbG9va3VwU2NvcGVzT3JEaWUobm9kZTogdHMuRGVjbGFyYXRpb24sIG5nTW9kdWxlSW1wb3J0ZWRGcm9tOiBzdHJpbmd8bnVsbCk6XG4gICAgICBTZWxlY3RvclNjb3BlcyB7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5sb29rdXBTY29wZXMobm9kZSwgbmdNb2R1bGVJbXBvcnRlZEZyb20pO1xuICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTW9kdWxlIG5vdCBmb3VuZDogJHtyZWZsZWN0SWRlbnRpZmllck9mRGVjbGFyYXRpb24obm9kZSl9YCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogTG9va3VwIGBTZWxlY3RvclNjb3Blc2AgZm9yIGEgZ2l2ZW4gbW9kdWxlLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGFzc3VtZXMgdGhhdCBpZiB0aGUgZ2l2ZW4gbW9kdWxlIHdhcyBpbXBvcnRlZCBmcm9tIGFuIGFic29sdXRlIHBhdGhcbiAgICogKGBuZ01vZHVsZUltcG9ydGVkRnJvbWApIHRoZW4gYWxsIG9mIGl0cyBkZWNsYXJhdGlvbnMgYXJlIGV4cG9ydGVkIGF0IHRoYXQgc2FtZSBwYXRoLCBhcyB3ZWxsXG4gICAqIGFzIGltcG9ydHMgYW5kIGV4cG9ydHMgZnJvbSBvdGhlciBtb2R1bGVzIHRoYXQgYXJlIHJlbGF0aXZlbHkgaW1wb3J0ZWQuXG4gICAqL1xuICBwcml2YXRlIGxvb2t1cFNjb3Blcyhub2RlOiB0cy5EZWNsYXJhdGlvbiwgbmdNb2R1bGVJbXBvcnRlZEZyb206IHN0cmluZ3xudWxsKTogU2VsZWN0b3JTY29wZXNcbiAgICAgIHxudWxsIHtcbiAgICBsZXQgZGF0YTogTW9kdWxlRGF0YXxudWxsID0gbnVsbDtcblxuICAgIC8vIEVpdGhlciB0aGlzIG1vZHVsZSB3YXMgYW5hbHl6ZWQgZGlyZWN0bHksIG9yIGhhcyBhIHByZWNvbXBpbGVkIG5nTW9kdWxlRGVmLlxuICAgIGlmICh0aGlzLl9tb2R1bGVUb0RhdGEuaGFzKG5vZGUpKSB7XG4gICAgICAvLyBUaGUgbW9kdWxlIHdhcyBhbmFseXplZCBiZWZvcmUsIGFuZCB0aHVzIGl0cyBkYXRhIGlzIGF2YWlsYWJsZS5cbiAgICAgIGRhdGEgPSB0aGlzLl9tb2R1bGVUb0RhdGEuZ2V0KG5vZGUpICE7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZSBtb2R1bGUgd2Fzbid0IGFuYWx5emVkIGJlZm9yZSwgYW5kIHByb2JhYmx5IGhhcyBhIHByZWNvbXBpbGVkIG5nTW9kdWxlRGVmIHdpdGggYSB0eXBlXG4gICAgICAvLyBhbm5vdGF0aW9uIHRoYXQgc3BlY2lmaWVzIHRoZSBuZWVkZWQgbWV0YWRhdGEuXG4gICAgICBkYXRhID0gdGhpcy5fcmVhZE1vZHVsZURhdGFGcm9tQ29tcGlsZWRDbGFzcyhub2RlLCBuZ01vZHVsZUltcG9ydGVkRnJvbSk7XG4gICAgICAvLyBOb3RlIHRoYXQgZGF0YSBoZXJlIGNvdWxkIHN0aWxsIGJlIG51bGwsIGlmIHRoZSBjbGFzcyBkaWRuJ3QgaGF2ZSBhIHByZWNvbXBpbGVkXG4gICAgICAvLyBuZ01vZHVsZURlZi5cbiAgICB9XG5cbiAgICBpZiAoZGF0YSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBpbGF0aW9uOiBbXG4gICAgICAgIC4uLmRhdGEuZGVjbGFyYXRpb25zLFxuICAgICAgICAvLyBFeHBhbmQgaW1wb3J0cyB0byB0aGUgZXhwb3J0ZWQgc2NvcGUgb2YgdGhvc2UgaW1wb3J0cy5cbiAgICAgICAgLi4uZmxhdHRlbihkYXRhLmltcG9ydHMubWFwKFxuICAgICAgICAgICAgcmVmID0+IHRoaXMubG9va3VwU2NvcGVzT3JEaWUocmVmLm5vZGUgYXMgdHMuRGVjbGFyYXRpb24sIGFic29sdXRlTW9kdWxlTmFtZShyZWYpKVxuICAgICAgICAgICAgICAgICAgICAgICAuZXhwb3J0ZWQpKSxcbiAgICAgICAgLy8gQW5kIGluY2x1ZGUgdGhlIGNvbXBpbGF0aW9uIHNjb3BlIG9mIGV4cG9ydGVkIG1vZHVsZXMuXG4gICAgICAgIC4uLmZsYXR0ZW4oXG4gICAgICAgICAgICBkYXRhLmV4cG9ydHNcbiAgICAgICAgICAgICAgICAubWFwKHJlZiA9PiB0aGlzLmxvb2t1cFNjb3BlcyhyZWYubm9kZSBhcyB0cy5EZWNsYXJhdGlvbiwgYWJzb2x1dGVNb2R1bGVOYW1lKHJlZikpKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoKHNjb3BlOiBTZWxlY3RvclNjb3BlcyB8IG51bGwpOiBzY29wZSBpcyBTZWxlY3RvclNjb3BlcyA9PiBzY29wZSAhPT0gbnVsbClcbiAgICAgICAgICAgICAgICAubWFwKHNjb3BlID0+IHNjb3BlLmV4cG9ydGVkKSlcbiAgICAgIF0sXG4gICAgICBleHBvcnRlZDogZmxhdHRlbihkYXRhLmV4cG9ydHMubWFwKHJlZiA9PiB7XG4gICAgICAgIGNvbnN0IHNjb3BlID0gdGhpcy5sb29rdXBTY29wZXMocmVmLm5vZGUgYXMgdHMuRGVjbGFyYXRpb24sIGFic29sdXRlTW9kdWxlTmFtZShyZWYpKTtcbiAgICAgICAgaWYgKHNjb3BlICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHNjb3BlLmV4cG9ydGVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBbcmVmXTtcbiAgICAgICAgfVxuICAgICAgfSkpLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogTG9va3VwIHRoZSBtZXRhZGF0YSBvZiBhIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgY2xhc3MuXG4gICAqXG4gICAqIFBvdGVudGlhbGx5IHRoaXMgY2xhc3MgaXMgZGVjbGFyZWQgaW4gYSAuZC50cyBmaWxlIG9yIG90aGVyd2lzZSBoYXMgYSBtYW51YWxseSBjcmVhdGVkXG4gICAqIG5nQ29tcG9uZW50RGVmL25nRGlyZWN0aXZlRGVmLiBJbiB0aGlzIGNhc2UsIHRoZSB0eXBlIG1ldGFkYXRhIG9mIHRoYXQgZGVmaW5pdGlvbiBpcyByZWFkXG4gICAqIHRvIGRldGVybWluZSB0aGUgbWV0YWRhdGEuXG4gICAqL1xuICBwcml2YXRlIGxvb2t1cERpcmVjdGl2ZU1ldGFkYXRhKHJlZjogUmVmZXJlbmNlPHRzLkRlY2xhcmF0aW9uPik6IFNjb3BlRGlyZWN0aXZlPFJlZmVyZW5jZT58bnVsbCB7XG4gICAgY29uc3Qgbm9kZSA9IHRzLmdldE9yaWdpbmFsTm9kZShyZWYubm9kZSkgYXMgdHMuRGVjbGFyYXRpb247XG4gICAgaWYgKHRoaXMuX2RpcmVjdGl2ZVRvTWV0YWRhdGEuaGFzKG5vZGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGlyZWN0aXZlVG9NZXRhZGF0YS5nZXQobm9kZSkgITtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlYWRNZXRhZGF0YUZyb21Db21waWxlZENsYXNzKHJlZiBhcyBSZWZlcmVuY2U8dHMuQ2xhc3NEZWNsYXJhdGlvbj4pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbG9va3VwUGlwZU5hbWUobm9kZTogdHMuRGVjbGFyYXRpb24pOiBzdHJpbmd8bnVsbCB7XG4gICAgaWYgKHRoaXMuX3BpcGVUb05hbWUuaGFzKG5vZGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcGlwZVRvTmFtZS5nZXQobm9kZSkgITtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlYWROYW1lRnJvbUNvbXBpbGVkQ2xhc3Mobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlYWQgdGhlIG1ldGFkYXRhIGZyb20gYSBjbGFzcyB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gY29tcGlsZWQgc29tZWhvdyAoZWl0aGVyIGl0J3MgaW4gYSAuZC50c1xuICAgKiBmaWxlLCBvciBpbiBhIC50cyBmaWxlIHdpdGggYSBoYW5kd3JpdHRlbiBkZWZpbml0aW9uKS5cbiAgICpcbiAgICogQHBhcmFtIGNsYXp6IHRoZSBjbGFzcyBvZiBpbnRlcmVzdFxuICAgKiBAcGFyYW0gbmdNb2R1bGVJbXBvcnRlZEZyb20gbW9kdWxlIHNwZWNpZmllciBvZiB0aGUgaW1wb3J0IHBhdGggdG8gYXNzdW1lIGZvciBhbGwgZGVjbGFyYXRpb25zXG4gICAqIHN0ZW1taW5nIGZyb20gdGhpcyBtb2R1bGUuXG4gICAqL1xuICBwcml2YXRlIF9yZWFkTW9kdWxlRGF0YUZyb21Db21waWxlZENsYXNzKFxuICAgICAgY2xheno6IHRzLkRlY2xhcmF0aW9uLCBuZ01vZHVsZUltcG9ydGVkRnJvbTogc3RyaW5nfG51bGwpOiBNb2R1bGVEYXRhfG51bGwge1xuICAgIC8vIFRoaXMgb3BlcmF0aW9uIGlzIGV4cGxpY2l0bHkgbm90IG1lbW9pemVkLCBhcyBpdCBkZXBlbmRzIG9uIGBuZ01vZHVsZUltcG9ydGVkRnJvbWAuXG4gICAgLy8gVE9ETyhhbHhodWIpOiBpbnZlc3RpZ2F0ZSBjYWNoaW5nIG9mIC5kLnRzIG1vZHVsZSBtZXRhZGF0YS5cbiAgICBjb25zdCBuZ01vZHVsZURlZiA9IHRoaXMucmVmbGVjdG9yLmdldE1lbWJlcnNPZkNsYXNzKGNsYXp6KS5maW5kKFxuICAgICAgICBtZW1iZXIgPT4gbWVtYmVyLm5hbWUgPT09ICduZ01vZHVsZURlZicgJiYgbWVtYmVyLmlzU3RhdGljKTtcbiAgICBpZiAobmdNb2R1bGVEZWYgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgLy8gVmFsaWRhdGUgdGhhdCB0aGUgc2hhcGUgb2YgdGhlIG5nTW9kdWxlRGVmIHR5cGUgaXMgY29ycmVjdC5cbiAgICAgICAgbmdNb2R1bGVEZWYudHlwZSA9PT0gbnVsbCB8fCAhdHMuaXNUeXBlUmVmZXJlbmNlTm9kZShuZ01vZHVsZURlZi50eXBlKSB8fFxuICAgICAgICBuZ01vZHVsZURlZi50eXBlLnR5cGVBcmd1bWVudHMgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICBuZ01vZHVsZURlZi50eXBlLnR5cGVBcmd1bWVudHMubGVuZ3RoICE9PSA0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBSZWFkIHRoZSBNb2R1bGVEYXRhIG91dCBvZiB0aGUgdHlwZSBhcmd1bWVudHMuXG4gICAgY29uc3QgW18sIGRlY2xhcmF0aW9uTWV0YWRhdGEsIGltcG9ydE1ldGFkYXRhLCBleHBvcnRNZXRhZGF0YV0gPSBuZ01vZHVsZURlZi50eXBlLnR5cGVBcmd1bWVudHM7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRlY2xhcmF0aW9uczogdGhpcy5fZXh0cmFjdFJlZmVyZW5jZXNGcm9tVHlwZShkZWNsYXJhdGlvbk1ldGFkYXRhLCBuZ01vZHVsZUltcG9ydGVkRnJvbSksXG4gICAgICBleHBvcnRzOiB0aGlzLl9leHRyYWN0UmVmZXJlbmNlc0Zyb21UeXBlKGV4cG9ydE1ldGFkYXRhLCBuZ01vZHVsZUltcG9ydGVkRnJvbSksXG4gICAgICBpbXBvcnRzOiB0aGlzLl9leHRyYWN0UmVmZXJlbmNlc0Zyb21UeXBlKGltcG9ydE1ldGFkYXRhLCBuZ01vZHVsZUltcG9ydGVkRnJvbSksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHNlbGVjdG9yIGZyb20gdHlwZSBtZXRhZGF0YSBmb3IgYSBjbGFzcyB3aXRoIGEgcHJlY29tcGlsZWQgbmdDb21wb25lbnREZWYgb3JcbiAgICogbmdEaXJlY3RpdmVEZWYuXG4gICAqL1xuICBwcml2YXRlIF9yZWFkTWV0YWRhdGFGcm9tQ29tcGlsZWRDbGFzcyhyZWY6IFJlZmVyZW5jZTx0cy5DbGFzc0RlY2xhcmF0aW9uPik6XG4gICAgICBTY29wZURpcmVjdGl2ZTxSZWZlcmVuY2U+fG51bGwge1xuICAgIGNvbnN0IGNsYXp6ID0gdHMuZ2V0T3JpZ2luYWxOb2RlKHJlZi5ub2RlKSBhcyB0cy5DbGFzc0RlY2xhcmF0aW9uO1xuICAgIGNvbnN0IGRlZiA9IHRoaXMucmVmbGVjdG9yLmdldE1lbWJlcnNPZkNsYXNzKGNsYXp6KS5maW5kKFxuICAgICAgICBmaWVsZCA9PlxuICAgICAgICAgICAgZmllbGQuaXNTdGF0aWMgJiYgKGZpZWxkLm5hbWUgPT09ICduZ0NvbXBvbmVudERlZicgfHwgZmllbGQubmFtZSA9PT0gJ25nRGlyZWN0aXZlRGVmJykpO1xuICAgIGlmIChkZWYgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gTm8gZGVmaW5pdGlvbiBjb3VsZCBiZSBmb3VuZC5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIGRlZi50eXBlID09PSBudWxsIHx8ICF0cy5pc1R5cGVSZWZlcmVuY2VOb2RlKGRlZi50eXBlKSB8fFxuICAgICAgICBkZWYudHlwZS50eXBlQXJndW1lbnRzID09PSB1bmRlZmluZWQgfHwgZGVmLnR5cGUudHlwZUFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG4gICAgICAvLyBUaGUgdHlwZSBtZXRhZGF0YSB3YXMgdGhlIHdyb25nIHNoYXBlLlxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHNlbGVjdG9yID0gcmVhZFN0cmluZ1R5cGUoZGVmLnR5cGUudHlwZUFyZ3VtZW50c1sxXSk7XG4gICAgaWYgKHNlbGVjdG9yID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcmVmLFxuICAgICAgbmFtZTogY2xhenoubmFtZSAhLnRleHQsXG4gICAgICBkaXJlY3RpdmU6IHJlZixcbiAgICAgIGlzQ29tcG9uZW50OiBkZWYubmFtZSA9PT0gJ25nQ29tcG9uZW50RGVmJywgc2VsZWN0b3IsXG4gICAgICBleHBvcnRBczogcmVhZFN0cmluZ1R5cGUoZGVmLnR5cGUudHlwZUFyZ3VtZW50c1syXSksXG4gICAgICBpbnB1dHM6IHJlYWRTdHJpbmdNYXBUeXBlKGRlZi50eXBlLnR5cGVBcmd1bWVudHNbM10pLFxuICAgICAgb3V0cHV0czogcmVhZFN0cmluZ01hcFR5cGUoZGVmLnR5cGUudHlwZUFyZ3VtZW50c1s0XSksXG4gICAgICBxdWVyaWVzOiByZWFkU3RyaW5nQXJyYXlUeXBlKGRlZi50eXBlLnR5cGVBcmd1bWVudHNbNV0pLFxuICAgICAgLi4uZXh0cmFjdERpcmVjdGl2ZUd1YXJkcyhjbGF6eiwgdGhpcy5yZWZsZWN0b3IpLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBzZWxlY3RvciBmcm9tIHR5cGUgbWV0YWRhdGEgZm9yIGEgY2xhc3Mgd2l0aCBhIHByZWNvbXBpbGVkIG5nQ29tcG9uZW50RGVmIG9yXG4gICAqIG5nRGlyZWN0aXZlRGVmLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVhZE5hbWVGcm9tQ29tcGlsZWRDbGFzcyhjbGF6ejogdHMuRGVjbGFyYXRpb24pOiBzdHJpbmd8bnVsbCB7XG4gICAgY29uc3QgZGVmID0gdGhpcy5yZWZsZWN0b3IuZ2V0TWVtYmVyc09mQ2xhc3MoY2xhenopLmZpbmQoXG4gICAgICAgIGZpZWxkID0+IGZpZWxkLmlzU3RhdGljICYmIGZpZWxkLm5hbWUgPT09ICduZ1BpcGVEZWYnKTtcbiAgICBpZiAoZGVmID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIE5vIGRlZmluaXRpb24gY291bGQgYmUgZm91bmQuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICBkZWYudHlwZSA9PT0gbnVsbCB8fCAhdHMuaXNUeXBlUmVmZXJlbmNlTm9kZShkZWYudHlwZSkgfHxcbiAgICAgICAgZGVmLnR5cGUudHlwZUFyZ3VtZW50cyA9PT0gdW5kZWZpbmVkIHx8IGRlZi50eXBlLnR5cGVBcmd1bWVudHMubGVuZ3RoIDwgMikge1xuICAgICAgLy8gVGhlIHR5cGUgbWV0YWRhdGEgd2FzIHRoZSB3cm9uZyBzaGFwZS5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCB0eXBlID0gZGVmLnR5cGUudHlwZUFyZ3VtZW50c1sxXTtcbiAgICBpZiAoIXRzLmlzTGl0ZXJhbFR5cGVOb2RlKHR5cGUpIHx8ICF0cy5pc1N0cmluZ0xpdGVyYWwodHlwZS5saXRlcmFsKSkge1xuICAgICAgLy8gVGhlIHR5cGUgbWV0YWRhdGEgd2FzIHRoZSB3cm9uZyB0eXBlLlxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiB0eXBlLmxpdGVyYWwudGV4dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIGEgYFR5cGVOb2RlYCB3aGljaCBpcyBhIHR1cGxlIG9mIHJlZmVyZW5jZXMgdG8gb3RoZXIgdHlwZXMsIGFuZCByZXR1cm4gYFJlZmVyZW5jZWBzIHRvXG4gICAqIHRoZW0uXG4gICAqXG4gICAqIFRoaXMgb3BlcmF0aW9uIGFzc3VtZXMgdGhhdCB0aGVzZSB0eXBlcyBzaG91bGQgYmUgaW1wb3J0ZWQgZnJvbSBgbmdNb2R1bGVJbXBvcnRlZEZyb21gIHVubGVzc1xuICAgKiB0aGV5IHRoZW1zZWx2ZXMgd2VyZSBpbXBvcnRlZCBmcm9tIGFub3RoZXIgYWJzb2x1dGUgcGF0aC5cbiAgICovXG4gIHByaXZhdGUgX2V4dHJhY3RSZWZlcmVuY2VzRnJvbVR5cGUoZGVmOiB0cy5UeXBlTm9kZSwgbmdNb2R1bGVJbXBvcnRlZEZyb206IHN0cmluZ3xudWxsKTpcbiAgICAgIFJlZmVyZW5jZTx0cy5EZWNsYXJhdGlvbj5bXSB7XG4gICAgaWYgKCF0cy5pc1R1cGxlVHlwZU5vZGUoZGVmKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICByZXR1cm4gZGVmLmVsZW1lbnRUeXBlcy5tYXAoZWxlbWVudCA9PiB7XG4gICAgICBpZiAoIXRzLmlzVHlwZVF1ZXJ5Tm9kZShlbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIFR5cGVRdWVyeU5vZGVgKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHR5cGUgPSBlbGVtZW50LmV4cHJOYW1lO1xuICAgICAgaWYgKG5nTW9kdWxlSW1wb3J0ZWRGcm9tICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHtub2RlLCBmcm9tfSA9IHJlZmxlY3RUeXBlRW50aXR5VG9EZWNsYXJhdGlvbih0eXBlLCB0aGlzLmNoZWNrZXIpO1xuICAgICAgICBjb25zdCBtb2R1bGVOYW1lID0gKGZyb20gIT09IG51bGwgJiYgIWZyb20uc3RhcnRzV2l0aCgnLicpID8gZnJvbSA6IG5nTW9kdWxlSW1wb3J0ZWRGcm9tKTtcbiAgICAgICAgY29uc3QgaWQgPSByZWZsZWN0SWRlbnRpZmllck9mRGVjbGFyYXRpb24obm9kZSk7XG4gICAgICAgIHJldHVybiBuZXcgQWJzb2x1dGVSZWZlcmVuY2Uobm9kZSwgaWQgISwgbW9kdWxlTmFtZSwgaWQgIS50ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHtub2RlfSA9IHJlZmxlY3RUeXBlRW50aXR5VG9EZWNsYXJhdGlvbih0eXBlLCB0aGlzLmNoZWNrZXIpO1xuICAgICAgICBjb25zdCBpZCA9IHJlZmxlY3RJZGVudGlmaWVyT2ZEZWNsYXJhdGlvbihub2RlKTtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNvbHZlZFJlZmVyZW5jZShub2RlLCBpZCAhKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KGFycmF5OiBUW11bXSk6IFRbXSB7XG4gIHJldHVybiBhcnJheS5yZWR1Y2UoKGFjY3VtLCBzdWJBcnJheSkgPT4ge1xuICAgIGFjY3VtLnB1c2goLi4uc3ViQXJyYXkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfSwgW10gYXMgVFtdKTtcbn1cblxuZnVuY3Rpb24gYWJzb2x1dGVNb2R1bGVOYW1lKHJlZjogUmVmZXJlbmNlKTogc3RyaW5nfG51bGwge1xuICBpZiAoIShyZWYgaW5zdGFuY2VvZiBBYnNvbHV0ZVJlZmVyZW5jZSkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gcmVmLm1vZHVsZU5hbWU7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnREaXJlY3RpdmVSZWZlcmVuY2VNYXAoXG4gICAgbWFwOiBNYXA8c3RyaW5nLCBTY29wZURpcmVjdGl2ZTxSZWZlcmVuY2U+PixcbiAgICBjb250ZXh0OiB0cy5Tb3VyY2VGaWxlKTogTWFwPHN0cmluZywgU2NvcGVEaXJlY3RpdmU8RXhwcmVzc2lvbj4+IHtcbiAgY29uc3QgbmV3TWFwID0gbmV3IE1hcDxzdHJpbmcsIFNjb3BlRGlyZWN0aXZlPEV4cHJlc3Npb24+PigpO1xuICBtYXAuZm9yRWFjaCgobWV0YSwgc2VsZWN0b3IpID0+IHtcbiAgICBuZXdNYXAuc2V0KHNlbGVjdG9yLCB7Li4ubWV0YSwgZGlyZWN0aXZlOiB0b1IzUmVmZXJlbmNlKG1ldGEuZGlyZWN0aXZlLCBjb250ZXh0KS52YWx1ZX0pO1xuICB9KTtcbiAgcmV0dXJuIG5ld01hcDtcbn1cblxuZnVuY3Rpb24gY29udmVydFBpcGVSZWZlcmVuY2VNYXAoXG4gICAgbWFwOiBNYXA8c3RyaW5nLCBSZWZlcmVuY2U+LCBjb250ZXh0OiB0cy5Tb3VyY2VGaWxlKTogTWFwPHN0cmluZywgRXhwcmVzc2lvbj4ge1xuICBjb25zdCBuZXdNYXAgPSBuZXcgTWFwPHN0cmluZywgRXhwcmVzc2lvbj4oKTtcbiAgbWFwLmZvckVhY2goKG1ldGEsIHNlbGVjdG9yKSA9PiB7IG5ld01hcC5zZXQoc2VsZWN0b3IsIHRvUjNSZWZlcmVuY2UobWV0YSwgY29udGV4dCkudmFsdWUpOyB9KTtcbiAgcmV0dXJuIG5ld01hcDtcbn1cblxuZnVuY3Rpb24gY29udmVydFNjb3BlVG9FeHByZXNzaW9ucyhcbiAgICBzY29wZTogQ29tcGlsYXRpb25TY29wZTxSZWZlcmVuY2U+LCBjb250ZXh0OiB0cy5EZWNsYXJhdGlvbik6IENvbXBpbGF0aW9uU2NvcGU8RXhwcmVzc2lvbj4ge1xuICBjb25zdCBzb3VyY2VDb250ZXh0ID0gdHMuZ2V0T3JpZ2luYWxOb2RlKGNvbnRleHQpLmdldFNvdXJjZUZpbGUoKTtcbiAgY29uc3QgZGlyZWN0aXZlcyA9IGNvbnZlcnREaXJlY3RpdmVSZWZlcmVuY2VNYXAoc2NvcGUuZGlyZWN0aXZlcywgc291cmNlQ29udGV4dCk7XG4gIGNvbnN0IHBpcGVzID0gY29udmVydFBpcGVSZWZlcmVuY2VNYXAoc2NvcGUucGlwZXMsIHNvdXJjZUNvbnRleHQpO1xuICBjb25zdCBkZWNsUG9pbnRlciA9IG1heWJlVW53cmFwTmFtZU9mRGVjbGFyYXRpb24oY29udGV4dCk7XG4gIGxldCBjb250YWluc0ZvcndhcmREZWNscyA9IGZhbHNlO1xuICBkaXJlY3RpdmVzLmZvckVhY2goZXhwciA9PiB7XG4gICAgY29udGFpbnNGb3J3YXJkRGVjbHMgPSBjb250YWluc0ZvcndhcmREZWNscyB8fFxuICAgICAgICBpc0V4cHJlc3Npb25Gb3J3YXJkUmVmZXJlbmNlKGV4cHIuZGlyZWN0aXZlLCBkZWNsUG9pbnRlciwgc291cmNlQ29udGV4dCk7XG4gIH0pO1xuICAhY29udGFpbnNGb3J3YXJkRGVjbHMgJiYgcGlwZXMuZm9yRWFjaChleHByID0+IHtcbiAgICBjb250YWluc0ZvcndhcmREZWNscyA9XG4gICAgICAgIGNvbnRhaW5zRm9yd2FyZERlY2xzIHx8IGlzRXhwcmVzc2lvbkZvcndhcmRSZWZlcmVuY2UoZXhwciwgZGVjbFBvaW50ZXIsIHNvdXJjZUNvbnRleHQpO1xuICB9KTtcbiAgcmV0dXJuIHtkaXJlY3RpdmVzLCBwaXBlcywgY29udGFpbnNGb3J3YXJkRGVjbHN9O1xufVxuXG5mdW5jdGlvbiBpc0V4cHJlc3Npb25Gb3J3YXJkUmVmZXJlbmNlKFxuICAgIGV4cHI6IEV4cHJlc3Npb24sIGNvbnRleHQ6IHRzLk5vZGUsIGNvbnRleHRTb3VyY2U6IHRzLlNvdXJjZUZpbGUpOiBib29sZWFuIHtcbiAgaWYgKGlzV3JhcHBlZFRzTm9kZUV4cHIoZXhwcikpIHtcbiAgICBjb25zdCBub2RlID0gdHMuZ2V0T3JpZ2luYWxOb2RlKGV4cHIubm9kZSk7XG4gICAgcmV0dXJuIG5vZGUuZ2V0U291cmNlRmlsZSgpID09PSBjb250ZXh0U291cmNlICYmIGNvbnRleHQucG9zIDwgbm9kZS5wb3M7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc1dyYXBwZWRUc05vZGVFeHByKGV4cHI6IEV4cHJlc3Npb24pOiBleHByIGlzIFdyYXBwZWROb2RlRXhwcjx0cy5Ob2RlPiB7XG4gIHJldHVybiBleHByIGluc3RhbmNlb2YgV3JhcHBlZE5vZGVFeHByO1xufVxuXG5mdW5jdGlvbiBtYXliZVVud3JhcE5hbWVPZkRlY2xhcmF0aW9uKGRlY2w6IHRzLkRlY2xhcmF0aW9uKTogdHMuRGVjbGFyYXRpb258dHMuSWRlbnRpZmllciB7XG4gIGlmICgodHMuaXNDbGFzc0RlY2xhcmF0aW9uKGRlY2wpIHx8IHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbihkZWNsKSkgJiYgZGVjbC5uYW1lICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIHRzLmlzSWRlbnRpZmllcihkZWNsLm5hbWUpKSB7XG4gICAgcmV0dXJuIGRlY2wubmFtZTtcbiAgfVxuICByZXR1cm4gZGVjbDtcbn1cblxuZnVuY3Rpb24gcmVhZFN0cmluZ1R5cGUodHlwZTogdHMuVHlwZU5vZGUpOiBzdHJpbmd8bnVsbCB7XG4gIGlmICghdHMuaXNMaXRlcmFsVHlwZU5vZGUodHlwZSkgfHwgIXRzLmlzU3RyaW5nTGl0ZXJhbCh0eXBlLmxpdGVyYWwpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIHR5cGUubGl0ZXJhbC50ZXh0O1xufVxuXG5mdW5jdGlvbiByZWFkU3RyaW5nTWFwVHlwZSh0eXBlOiB0cy5UeXBlTm9kZSk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgaWYgKCF0cy5pc1R5cGVMaXRlcmFsTm9kZSh0eXBlKSkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuICBjb25zdCBvYmo6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gIHR5cGUubWVtYmVycy5mb3JFYWNoKG1lbWJlciA9PiB7XG4gICAgaWYgKCF0cy5pc1Byb3BlcnR5U2lnbmF0dXJlKG1lbWJlcikgfHwgbWVtYmVyLnR5cGUgPT09IHVuZGVmaW5lZCB8fCBtZW1iZXIubmFtZSA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICF0cy5pc1N0cmluZ0xpdGVyYWwobWVtYmVyLm5hbWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHZhbHVlID0gcmVhZFN0cmluZ1R5cGUobWVtYmVyLnR5cGUpO1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIG9ialttZW1iZXIubmFtZS50ZXh0XSA9IHZhbHVlO1xuICB9KTtcbiAgcmV0dXJuIG9iajtcbn1cblxuZnVuY3Rpb24gcmVhZFN0cmluZ0FycmF5VHlwZSh0eXBlOiB0cy5UeXBlTm9kZSk6IHN0cmluZ1tdIHtcbiAgaWYgKCF0cy5pc1R1cGxlVHlwZU5vZGUodHlwZSkpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgY29uc3QgcmVzOiBzdHJpbmdbXSA9IFtdO1xuICB0eXBlLmVsZW1lbnRUeXBlcy5mb3JFYWNoKGVsID0+IHtcbiAgICBpZiAoIXRzLmlzTGl0ZXJhbFR5cGVOb2RlKGVsKSB8fCAhdHMuaXNTdHJpbmdMaXRlcmFsKGVsLmxpdGVyYWwpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJlcy5wdXNoKGVsLmxpdGVyYWwudGV4dCk7XG4gIH0pO1xuICByZXR1cm4gcmVzO1xufVxuIl19