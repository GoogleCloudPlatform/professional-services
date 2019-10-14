/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * A set of interfaces which are shared between `@angular/core` and `@angular/compiler` to allow
 * for late binding of `@angular/compiler` for JIT purposes.
 *
 * This file has two copies. Please ensure that they are in sync:
 *  - packages/compiler/src/compiler_facade_interface.ts             (master)
 *  - packages/core/src/render3/jit/compiler_facade_interface.ts     (copy)
 *
 * Please ensure that the two files are in sync using this command:
 * ```
 * cp packages/compiler/src/compiler_facade_interface.ts \
 *    packages/core/src/render3/jit/compiler_facade_interface.ts
 * ```
 */
/**
 * @record
 */
export function ExportedCompilerFacade() { }
/** @type {?} */
ExportedCompilerFacade.prototype.ɵcompilerFacade;
/**
 * @record
 */
export function CompilerFacade() { }
/** @type {?} */
CompilerFacade.prototype.compilePipe;
/** @type {?} */
CompilerFacade.prototype.compileInjectable;
/** @type {?} */
CompilerFacade.prototype.compileInjector;
/** @type {?} */
CompilerFacade.prototype.compileNgModule;
/** @type {?} */
CompilerFacade.prototype.compileDirective;
/** @type {?} */
CompilerFacade.prototype.compileComponent;
/** @type {?} */
CompilerFacade.prototype.R3ResolvedDependencyType;
/**
 * @record
 */
export function CoreEnvironment() { }
/** @typedef {?} */
var StringMap;
export { StringMap };
/** @typedef {?} */
var StringMapWithRename;
export { StringMapWithRename };
/** @typedef {?} */
var Provider;
export { Provider };
/** @enum {number} */
var R3ResolvedDependencyType = {
    Token: 0,
    Attribute: 1,
    Injector: 2,
};
export { R3ResolvedDependencyType };
R3ResolvedDependencyType[R3ResolvedDependencyType.Token] = 'Token';
R3ResolvedDependencyType[R3ResolvedDependencyType.Attribute] = 'Attribute';
R3ResolvedDependencyType[R3ResolvedDependencyType.Injector] = 'Injector';
/**
 * @record
 */
export function R3DependencyMetadataFacade() { }
/** @type {?} */
R3DependencyMetadataFacade.prototype.token;
/** @type {?} */
R3DependencyMetadataFacade.prototype.resolved;
/** @type {?} */
R3DependencyMetadataFacade.prototype.host;
/** @type {?} */
R3DependencyMetadataFacade.prototype.optional;
/** @type {?} */
R3DependencyMetadataFacade.prototype.self;
/** @type {?} */
R3DependencyMetadataFacade.prototype.skipSelf;
/**
 * @record
 */
export function R3PipeMetadataFacade() { }
/** @type {?} */
R3PipeMetadataFacade.prototype.name;
/** @type {?} */
R3PipeMetadataFacade.prototype.type;
/** @type {?} */
R3PipeMetadataFacade.prototype.pipeName;
/** @type {?} */
R3PipeMetadataFacade.prototype.deps;
/** @type {?} */
R3PipeMetadataFacade.prototype.pure;
/**
 * @record
 */
export function R3InjectableMetadataFacade() { }
/** @type {?} */
R3InjectableMetadataFacade.prototype.name;
/** @type {?} */
R3InjectableMetadataFacade.prototype.type;
/** @type {?} */
R3InjectableMetadataFacade.prototype.ctorDeps;
/** @type {?} */
R3InjectableMetadataFacade.prototype.providedIn;
/** @type {?|undefined} */
R3InjectableMetadataFacade.prototype.useClass;
/** @type {?|undefined} */
R3InjectableMetadataFacade.prototype.useFactory;
/** @type {?|undefined} */
R3InjectableMetadataFacade.prototype.useExisting;
/** @type {?|undefined} */
R3InjectableMetadataFacade.prototype.useValue;
/** @type {?|undefined} */
R3InjectableMetadataFacade.prototype.userDeps;
/**
 * @record
 */
export function R3NgModuleMetadataFacade() { }
/** @type {?} */
R3NgModuleMetadataFacade.prototype.type;
/** @type {?} */
R3NgModuleMetadataFacade.prototype.bootstrap;
/** @type {?} */
R3NgModuleMetadataFacade.prototype.declarations;
/** @type {?} */
R3NgModuleMetadataFacade.prototype.imports;
/** @type {?} */
R3NgModuleMetadataFacade.prototype.exports;
/** @type {?} */
R3NgModuleMetadataFacade.prototype.emitInline;
/**
 * @record
 */
export function R3InjectorMetadataFacade() { }
/** @type {?} */
R3InjectorMetadataFacade.prototype.name;
/** @type {?} */
R3InjectorMetadataFacade.prototype.type;
/** @type {?} */
R3InjectorMetadataFacade.prototype.deps;
/** @type {?} */
R3InjectorMetadataFacade.prototype.providers;
/** @type {?} */
R3InjectorMetadataFacade.prototype.imports;
/**
 * @record
 */
export function R3DirectiveMetadataFacade() { }
/** @type {?} */
R3DirectiveMetadataFacade.prototype.name;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.type;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.typeArgumentCount;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.typeSourceSpan;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.deps;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.selector;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.queries;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.host;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.propMetadata;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.lifecycle;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.inputs;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.outputs;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.usesInheritance;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.exportAs;
/** @type {?} */
R3DirectiveMetadataFacade.prototype.providers;
/**
 * @record
 */
export function R3ComponentMetadataFacade() { }
/** @type {?} */
R3ComponentMetadataFacade.prototype.template;
/** @type {?} */
R3ComponentMetadataFacade.prototype.preserveWhitespaces;
/** @type {?} */
R3ComponentMetadataFacade.prototype.animations;
/** @type {?} */
R3ComponentMetadataFacade.prototype.viewQueries;
/** @type {?} */
R3ComponentMetadataFacade.prototype.pipes;
/** @type {?} */
R3ComponentMetadataFacade.prototype.directives;
/** @type {?} */
R3ComponentMetadataFacade.prototype.styles;
/** @type {?} */
R3ComponentMetadataFacade.prototype.encapsulation;
/** @type {?} */
R3ComponentMetadataFacade.prototype.viewProviders;
/** @typedef {?} */
var ViewEncapsulation;
export { ViewEncapsulation };
/**
 * @record
 */
export function R3QueryMetadataFacade() { }
/** @type {?} */
R3QueryMetadataFacade.prototype.propertyName;
/** @type {?} */
R3QueryMetadataFacade.prototype.first;
/** @type {?} */
R3QueryMetadataFacade.prototype.predicate;
/** @type {?} */
R3QueryMetadataFacade.prototype.descendants;
/** @type {?} */
R3QueryMetadataFacade.prototype.read;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXJfZmFjYWRlX2ludGVyZmFjZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L2NvbXBpbGVyX2ZhY2FkZV9pbnRlcmZhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXdERSxRQUFTO0lBQ1QsWUFBYTtJQUNiLFdBQVk7OztrREFGWixLQUFLO2tEQUNMLFNBQVM7a0RBQ1QsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG4vKipcbiAqIEEgc2V0IG9mIGludGVyZmFjZXMgd2hpY2ggYXJlIHNoYXJlZCBiZXR3ZWVuIGBAYW5ndWxhci9jb3JlYCBhbmQgYEBhbmd1bGFyL2NvbXBpbGVyYCB0byBhbGxvd1xuICogZm9yIGxhdGUgYmluZGluZyBvZiBgQGFuZ3VsYXIvY29tcGlsZXJgIGZvciBKSVQgcHVycG9zZXMuXG4gKlxuICogVGhpcyBmaWxlIGhhcyB0d28gY29waWVzLiBQbGVhc2UgZW5zdXJlIHRoYXQgdGhleSBhcmUgaW4gc3luYzpcbiAqICAtIHBhY2thZ2VzL2NvbXBpbGVyL3NyYy9jb21waWxlcl9mYWNhZGVfaW50ZXJmYWNlLnRzICAgICAgICAgICAgIChtYXN0ZXIpXG4gKiAgLSBwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ppdC9jb21waWxlcl9mYWNhZGVfaW50ZXJmYWNlLnRzICAgICAoY29weSlcbiAqXG4gKiBQbGVhc2UgZW5zdXJlIHRoYXQgdGhlIHR3byBmaWxlcyBhcmUgaW4gc3luYyB1c2luZyB0aGlzIGNvbW1hbmQ6XG4gKiBgYGBcbiAqIGNwIHBhY2thZ2VzL2NvbXBpbGVyL3NyYy9jb21waWxlcl9mYWNhZGVfaW50ZXJmYWNlLnRzIFxcXG4gKiAgICBwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ppdC9jb21waWxlcl9mYWNhZGVfaW50ZXJmYWNlLnRzXG4gKiBgYGBcbiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIEV4cG9ydGVkQ29tcGlsZXJGYWNhZGUgeyDJtWNvbXBpbGVyRmFjYWRlOiBDb21waWxlckZhY2FkZTsgfVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBpbGVyRmFjYWRlIHtcbiAgY29tcGlsZVBpcGUoYW5ndWxhckNvcmVFbnY6IENvcmVFbnZpcm9ubWVudCwgc291cmNlTWFwVXJsOiBzdHJpbmcsIG1ldGE6IFIzUGlwZU1ldGFkYXRhRmFjYWRlKTpcbiAgICAgIGFueTtcbiAgY29tcGlsZUluamVjdGFibGUoXG4gICAgICBhbmd1bGFyQ29yZUVudjogQ29yZUVudmlyb25tZW50LCBzb3VyY2VNYXBVcmw6IHN0cmluZywgbWV0YTogUjNJbmplY3RhYmxlTWV0YWRhdGFGYWNhZGUpOiBhbnk7XG4gIGNvbXBpbGVJbmplY3RvcihcbiAgICAgIGFuZ3VsYXJDb3JlRW52OiBDb3JlRW52aXJvbm1lbnQsIHNvdXJjZU1hcFVybDogc3RyaW5nLCBtZXRhOiBSM0luamVjdG9yTWV0YWRhdGFGYWNhZGUpOiBhbnk7XG4gIGNvbXBpbGVOZ01vZHVsZShcbiAgICAgIGFuZ3VsYXJDb3JlRW52OiBDb3JlRW52aXJvbm1lbnQsIHNvdXJjZU1hcFVybDogc3RyaW5nLCBtZXRhOiBSM05nTW9kdWxlTWV0YWRhdGFGYWNhZGUpOiBhbnk7XG4gIGNvbXBpbGVEaXJlY3RpdmUoXG4gICAgICBhbmd1bGFyQ29yZUVudjogQ29yZUVudmlyb25tZW50LCBzb3VyY2VNYXBVcmw6IHN0cmluZywgbWV0YTogUjNEaXJlY3RpdmVNZXRhZGF0YUZhY2FkZSk6IGFueTtcbiAgY29tcGlsZUNvbXBvbmVudChcbiAgICAgIGFuZ3VsYXJDb3JlRW52OiBDb3JlRW52aXJvbm1lbnQsIHNvdXJjZU1hcFVybDogc3RyaW5nLCBtZXRhOiBSM0NvbXBvbmVudE1ldGFkYXRhRmFjYWRlKTogYW55O1xuXG4gIFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZTogdHlwZW9mIFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb3JlRW52aXJvbm1lbnQgeyBbbmFtZTogc3RyaW5nXTogRnVuY3Rpb247IH1cblxuZXhwb3J0IHR5cGUgU3RyaW5nTWFwID0ge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmc7XG59O1xuXG5leHBvcnQgdHlwZSBTdHJpbmdNYXBXaXRoUmVuYW1lID0ge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBbc3RyaW5nLCBzdHJpbmddO1xufTtcblxuZXhwb3J0IHR5cGUgUHJvdmlkZXIgPSBhbnk7XG5cbmV4cG9ydCBlbnVtIFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZSB7XG4gIFRva2VuID0gMCxcbiAgQXR0cmlidXRlID0gMSxcbiAgSW5qZWN0b3IgPSAyLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFIzRGVwZW5kZW5jeU1ldGFkYXRhRmFjYWRlIHtcbiAgdG9rZW46IGFueTtcbiAgcmVzb2x2ZWQ6IFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZTtcbiAgaG9zdDogYm9vbGVhbjtcbiAgb3B0aW9uYWw6IGJvb2xlYW47XG4gIHNlbGY6IGJvb2xlYW47XG4gIHNraXBTZWxmOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFIzUGlwZU1ldGFkYXRhRmFjYWRlIHtcbiAgbmFtZTogc3RyaW5nO1xuICB0eXBlOiBhbnk7XG4gIHBpcGVOYW1lOiBzdHJpbmc7XG4gIGRlcHM6IFIzRGVwZW5kZW5jeU1ldGFkYXRhRmFjYWRlW118bnVsbDtcbiAgcHVyZTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSM0luamVjdGFibGVNZXRhZGF0YUZhY2FkZSB7XG4gIG5hbWU6IHN0cmluZztcbiAgdHlwZTogYW55O1xuICBjdG9yRGVwczogUjNEZXBlbmRlbmN5TWV0YWRhdGFGYWNhZGVbXXxudWxsO1xuICBwcm92aWRlZEluOiBhbnk7XG4gIHVzZUNsYXNzPzogYW55O1xuICB1c2VGYWN0b3J5PzogYW55O1xuICB1c2VFeGlzdGluZz86IGFueTtcbiAgdXNlVmFsdWU/OiBhbnk7XG4gIHVzZXJEZXBzPzogUjNEZXBlbmRlbmN5TWV0YWRhdGFGYWNhZGVbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSM05nTW9kdWxlTWV0YWRhdGFGYWNhZGUge1xuICB0eXBlOiBhbnk7XG4gIGJvb3RzdHJhcDogRnVuY3Rpb25bXTtcbiAgZGVjbGFyYXRpb25zOiBGdW5jdGlvbltdO1xuICBpbXBvcnRzOiBGdW5jdGlvbltdO1xuICBleHBvcnRzOiBGdW5jdGlvbltdO1xuICBlbWl0SW5saW5lOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFIzSW5qZWN0b3JNZXRhZGF0YUZhY2FkZSB7XG4gIG5hbWU6IHN0cmluZztcbiAgdHlwZTogYW55O1xuICBkZXBzOiBSM0RlcGVuZGVuY3lNZXRhZGF0YUZhY2FkZVtdfG51bGw7XG4gIHByb3ZpZGVyczogYW55O1xuICBpbXBvcnRzOiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUjNEaXJlY3RpdmVNZXRhZGF0YUZhY2FkZSB7XG4gIG5hbWU6IHN0cmluZztcbiAgdHlwZTogYW55O1xuICB0eXBlQXJndW1lbnRDb3VudDogbnVtYmVyO1xuICB0eXBlU291cmNlU3BhbjogbnVsbDtcbiAgZGVwczogUjNEZXBlbmRlbmN5TWV0YWRhdGFGYWNhZGVbXXxudWxsO1xuICBzZWxlY3Rvcjogc3RyaW5nfG51bGw7XG4gIHF1ZXJpZXM6IFIzUXVlcnlNZXRhZGF0YUZhY2FkZVtdO1xuICBob3N0OiB7W2tleTogc3RyaW5nXTogc3RyaW5nfTtcbiAgcHJvcE1ldGFkYXRhOiB7W2tleTogc3RyaW5nXTogYW55W119O1xuICBsaWZlY3ljbGU6IHt1c2VzT25DaGFuZ2VzOiBib29sZWFuO307XG4gIGlucHV0czogc3RyaW5nW107XG4gIG91dHB1dHM6IHN0cmluZ1tdO1xuICB1c2VzSW5oZXJpdGFuY2U6IGJvb2xlYW47XG4gIGV4cG9ydEFzOiBzdHJpbmd8bnVsbDtcbiAgcHJvdmlkZXJzOiBQcm92aWRlcltdfG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUjNDb21wb25lbnRNZXRhZGF0YUZhY2FkZSBleHRlbmRzIFIzRGlyZWN0aXZlTWV0YWRhdGFGYWNhZGUge1xuICB0ZW1wbGF0ZTogc3RyaW5nO1xuICBwcmVzZXJ2ZVdoaXRlc3BhY2VzOiBib29sZWFuO1xuICBhbmltYXRpb25zOiBhbnlbXXx1bmRlZmluZWQ7XG4gIHZpZXdRdWVyaWVzOiBSM1F1ZXJ5TWV0YWRhdGFGYWNhZGVbXTtcbiAgcGlwZXM6IE1hcDxzdHJpbmcsIGFueT47XG4gIGRpcmVjdGl2ZXM6IE1hcDxzdHJpbmcsIGFueT47XG4gIHN0eWxlczogc3RyaW5nW107XG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uO1xuICB2aWV3UHJvdmlkZXJzOiBQcm92aWRlcltdfG51bGw7XG59XG5cbmV4cG9ydCB0eXBlIFZpZXdFbmNhcHN1bGF0aW9uID0gbnVtYmVyO1xuXG5leHBvcnQgaW50ZXJmYWNlIFIzUXVlcnlNZXRhZGF0YUZhY2FkZSB7XG4gIHByb3BlcnR5TmFtZTogc3RyaW5nO1xuICBmaXJzdDogYm9vbGVhbjtcbiAgcHJlZGljYXRlOiBhbnl8c3RyaW5nW107XG4gIGRlc2NlbmRhbnRzOiBib29sZWFuO1xuICByZWFkOiBhbnl8bnVsbDtcbn1cbiJdfQ==