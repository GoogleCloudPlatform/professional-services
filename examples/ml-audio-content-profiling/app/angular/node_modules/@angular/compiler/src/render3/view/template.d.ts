/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LocalResolver } from '../../compiler_util/expression_converter';
import { ConstantPool } from '../../constant_pool';
import * as core from '../../core';
import { AST, AstMemoryEfficientTransformer, BindingPipe, LiteralArray, LiteralMap } from '../../expression_parser/ast';
import * as o from '../../output/output_ast';
import { ParseError, ParseSourceSpan } from '../../parse_util';
import { SelectorMatcher } from '../../selector';
import { BindingParser } from '../../template_parser/binding_parser';
import * as t from '../r3_ast';
import { R3QueryMetadata } from './api';
import { I18nContext } from './i18n';
import { invalid } from './util';
export declare function renderFlagCheckIfStmt(flags: core.RenderFlags, statements: o.Statement[]): o.IfStmt;
export declare class TemplateDefinitionBuilder implements t.Visitor<void>, LocalResolver {
    private constantPool;
    private level;
    private contextName;
    private i18nContext;
    private templateIndex;
    private templateName;
    private viewQueries;
    private directiveMatcher;
    private directives;
    private pipeTypeByName;
    private pipes;
    private _namespace;
    private relativeContextFilePath;
    private _dataIndex;
    private _bindingContext;
    private _prefixCode;
    /**
     * List of callbacks to generate creation mode instructions. We store them here as we process
     * the template so bindings in listeners are resolved only once all nodes have been visited.
     * This ensures all local refs and context variables are available for matching.
     */
    private _creationCodeFns;
    /**
     * List of callbacks to generate update mode instructions. We store them here as we process
     * the template so bindings are resolved only once all nodes have been visited. This ensures
     * all local refs and context variables are available for matching.
     */
    private _updateCodeFns;
    /** Temporary variable declarations generated from visiting pipes, literals, etc. */
    private _tempVariables;
    /**
     * List of callbacks to build nested templates. Nested templates must not be visited until
     * after the parent template has finished visiting all of its nodes. This ensures that all
     * local ref bindings in nested templates are able to find local ref values if the refs
     * are defined after the template declaration.
     */
    private _nestedTemplateFns;
    /**
     * This scope contains local variables declared in the update mode block of the template.
     * (e.g. refs and context vars in bindings)
     */
    private _bindingScope;
    private _valueConverter;
    private _unsupported;
    private i18n;
    private _pureFunctionSlots;
    private _bindingSlots;
    private fileBasedI18nSuffix;
    constructor(constantPool: ConstantPool, parentBindingScope: BindingScope, level: number, contextName: string | null, i18nContext: I18nContext | null, templateIndex: number | null, templateName: string | null, viewQueries: R3QueryMetadata[], directiveMatcher: SelectorMatcher | null, directives: Set<o.Expression>, pipeTypeByName: Map<string, o.Expression>, pipes: Set<o.Expression>, _namespace: o.ExternalReference, relativeContextFilePath: string);
    registerContextVariables(variable: t.Variable): void;
    buildTemplateFunction(nodes: t.Node[], variables: t.Variable[], hasNgContent?: boolean, ngContentSelectors?: string[]): o.FunctionExpr;
    getLocal(name: string): o.Expression | null;
    i18nTranslate(label: string, meta?: string): o.Expression;
    i18nAppendTranslationMeta(meta?: string): void;
    i18nAllocateRef(): o.ReadVarExpr;
    i18nUpdateRef(context: I18nContext): void;
    i18nStart(span?: ParseSourceSpan | null, meta?: string): void;
    i18nEnd(span?: ParseSourceSpan | null): void;
    visitContent(ngContent: t.Content): void;
    getNamespaceInstruction(namespaceKey: string | null): o.ExternalReference;
    addNamespaceInstruction(nsInstruction: o.ExternalReference, element: t.Element): void;
    visitElement(element: t.Element): void;
    visitTemplate(template: t.Template): void;
    readonly visitReference: typeof invalid;
    readonly visitVariable: typeof invalid;
    readonly visitTextAttribute: typeof invalid;
    readonly visitBoundAttribute: typeof invalid;
    readonly visitBoundEvent: typeof invalid;
    visitBoundText(text: t.BoundText): void;
    visitText(text: t.Text): void;
    private allocateDataSlot;
    getConstCount(): number;
    getVarCount(): number;
    private bindingContext;
    private instructionFn;
    private creationInstruction;
    private updateInstruction;
    private allocatePureFunctionSlots;
    private allocateBindingSlots;
    private convertExpressionBinding;
    private convertPropertyBinding;
    private matchDirectives;
    private prepareSyntheticAndSelectOnlyAttrs;
    private toAttrsParam;
    private prepareRefsParameter;
    private prepareListenerParameter;
}
export declare class ValueConverter extends AstMemoryEfficientTransformer {
    private constantPool;
    private allocateSlot;
    private allocatePureFunctionSlots;
    private definePipe;
    private _pipeBindExprs;
    constructor(constantPool: ConstantPool, allocateSlot: () => number, allocatePureFunctionSlots: (numSlots: number) => number, definePipe: (name: string, localName: string, slot: number, value: o.Expression) => void);
    visitPipe(pipe: BindingPipe, context: any): AST;
    updatePipeSlotOffsets(bindingSlots: number): void;
    visitLiteralArray(array: LiteralArray, context: any): AST;
    visitLiteralMap(map: LiteralMap, context: any): AST;
}
/**
 * Function which is executed whenever a variable is referenced for the first time in a given
 * scope.
 *
 * It is expected that the function creates the `const localName = expression`; statement.
 */
export declare type DeclareLocalVarCallback = (scope: BindingScope, relativeLevel: number) => o.Statement[];
/**
 * This is used when one refers to variable such as: 'let abc = x(2).$implicit`.
 * - key to the map is the string literal `"abc"`.
 * - value `retrievalLevel` is the level from which this value can be retrieved, which is 2 levels
 * up in example.
 * - value `lhs` is the left hand side which is an AST representing `abc`.
 * - value `declareLocalCallback` is a callback that is invoked when declaring the local.
 * - value `declare` is true if this value needs to be declared.
 * - value `priority` dictates the sorting priority of this var declaration compared
 * to other var declarations on the same retrieval level. For example, if there is a
 * context variable and a local ref accessing the same parent view, the context var
 * declaration should always come before the local ref declaration.
 */
declare type BindingData = {
    retrievalLevel: number;
    lhs: o.ReadVarExpr;
    declareLocalCallback?: DeclareLocalVarCallback;
    declare: boolean;
    priority: number;
};
export declare class BindingScope implements LocalResolver {
    bindingLevel: number;
    private parent;
    /** Keeps a map from local variables to their BindingData. */
    private map;
    private referenceNameIndex;
    private restoreViewVariable;
    private static _ROOT_SCOPE;
    static readonly ROOT_SCOPE: BindingScope;
    private constructor();
    get(name: string): o.Expression | null;
    /**
     * Create a local variable for later reference.
     *
     * @param retrievalLevel The level from which this value can be retrieved
     * @param name Name of the variable.
     * @param lhs AST representing the left hand side of the `let lhs = rhs;`.
     * @param priority The sorting priority of this var
     * @param declareLocalCallback The callback to invoke when declaring this local var
     */
    set(retrievalLevel: number, name: string, lhs: o.ReadVarExpr, priority?: number, declareLocalCallback?: DeclareLocalVarCallback): BindingScope;
    getLocal(name: string): (o.Expression | null);
    nestedScope(level: number): BindingScope;
    getSharedContextName(retrievalLevel: number): o.ReadVarExpr | null;
    maybeGenerateSharedContextVar(value: BindingData): void;
    generateSharedContextVar(retrievalLevel: number): void;
    getComponentProperty(name: string): o.Expression;
    maybeRestoreView(retrievalLevel: number): void;
    restoreViewStatement(): o.Statement[];
    viewSnapshotStatements(): o.Statement[];
    isListenerScope(): boolean | null;
    variableDeclarations(): o.Statement[];
    freshReferenceName(): string;
}
/**
 * Parse a template into render3 `Node`s and additional metadata, with no other dependencies.
 *
 * @param template text of the template to parse
 * @param templateUrl URL to use for source mapping of the parsed template
 */
export declare function parseTemplate(template: string, templateUrl: string, options: {
    preserveWhitespaces?: boolean | undefined;
} | undefined, relativeContextFilePath: string): {
    errors?: ParseError[];
    nodes: t.Node[];
    hasNgContent: boolean;
    ngContentSelectors: string[];
    relativeContextFilePath: string;
};
/**
 * Construct a `BindingParser` with a default configuration.
 */
export declare function makeBindingParser(): BindingParser;
export {};
