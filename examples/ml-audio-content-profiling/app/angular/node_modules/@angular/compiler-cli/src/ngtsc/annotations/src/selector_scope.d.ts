/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/annotations/src/selector_scope" />
import { Expression } from '@angular/compiler';
import * as ts from 'typescript';
import { ReflectionHost } from '../../host';
import { Reference } from '../../metadata';
import { TypeCheckableDirectiveMeta } from '../../typecheck';
/**
 * Metadata extracted for a given NgModule that can be used to compute selector scopes.
 */
export interface ModuleData {
    declarations: Reference<ts.Declaration>[];
    imports: Reference<ts.Declaration>[];
    exports: Reference<ts.Declaration>[];
}
/**
 * Transitively expanded maps of directives and pipes visible to a component being compiled in the
 * context of some module.
 */
export interface CompilationScope<T> {
    directives: Map<string, ScopeDirective<T>>;
    pipes: Map<string, T>;
    containsForwardDecls?: boolean;
}
export interface ScopeDirective<T> extends TypeCheckableDirectiveMeta {
    selector: string;
    directive: T;
}
/**
 * Registry which records and correlates static analysis information of Angular types.
 *
 * Once a compilation unit's information is fed into the SelectorScopeRegistry, it can be asked to
 * produce transitive `CompilationScope`s for components.
 */
export declare class SelectorScopeRegistry {
    private checker;
    private reflector;
    /**
     *  Map of modules declared in the current compilation unit to their (local) metadata.
     */
    private _moduleToData;
    /**
     * Map of modules to their cached `CompilationScope`s.
     */
    private _compilationScopeCache;
    /**
     * Map of components/directives to their metadata.
     */
    private _directiveToMetadata;
    /**
     * Map of pipes to their name.
     */
    private _pipeToName;
    /**
     * Map of components/directives/pipes to their module.
     */
    private _declararedTypeToModule;
    constructor(checker: ts.TypeChecker, reflector: ReflectionHost);
    /**
     * Register a module's metadata with the registry.
     */
    registerModule(node: ts.Declaration, data: ModuleData): void;
    /**
     * Register the metadata of a component or directive with the registry.
     */
    registerDirective(node: ts.Declaration, metadata: ScopeDirective<Reference>): void;
    /**
     * Register the name of a pipe with the registry.
     */
    registerPipe(node: ts.Declaration, name: string): void;
    lookupCompilationScopeAsRefs(node: ts.Declaration): CompilationScope<Reference> | null;
    /**
     * Produce the compilation scope of a component, which is determined by the module that declares
     * it.
     */
    lookupCompilationScope(node: ts.Declaration): CompilationScope<Expression> | null;
    private lookupScopesOrDie;
    /**
     * Lookup `SelectorScopes` for a given module.
     *
     * This function assumes that if the given module was imported from an absolute path
     * (`ngModuleImportedFrom`) then all of its declarations are exported at that same path, as well
     * as imports and exports from other modules that are relatively imported.
     */
    private lookupScopes;
    /**
     * Lookup the metadata of a component or directive class.
     *
     * Potentially this class is declared in a .d.ts file or otherwise has a manually created
     * ngComponentDef/ngDirectiveDef. In this case, the type metadata of that definition is read
     * to determine the metadata.
     */
    private lookupDirectiveMetadata;
    private lookupPipeName;
    /**
     * Read the metadata from a class that has already been compiled somehow (either it's in a .d.ts
     * file, or in a .ts file with a handwritten definition).
     *
     * @param clazz the class of interest
     * @param ngModuleImportedFrom module specifier of the import path to assume for all declarations
     * stemming from this module.
     */
    private _readModuleDataFromCompiledClass;
    /**
     * Get the selector from type metadata for a class with a precompiled ngComponentDef or
     * ngDirectiveDef.
     */
    private _readMetadataFromCompiledClass;
    /**
     * Get the selector from type metadata for a class with a precompiled ngComponentDef or
     * ngDirectiveDef.
     */
    private _readNameFromCompiledClass;
    /**
     * Process a `TypeNode` which is a tuple of references to other types, and return `Reference`s to
     * them.
     *
     * This operation assumes that these types should be imported from `ngModuleImportedFrom` unless
     * they themselves were imported from another absolute path.
     */
    private _extractReferencesFromType;
}
