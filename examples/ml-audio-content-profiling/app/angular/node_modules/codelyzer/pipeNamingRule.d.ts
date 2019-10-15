import * as Lint from 'tslint';
import * as ts from 'typescript';
import { NgWalker } from './angular/ngWalker';
export declare class Rule extends Lint.Rules.AbstractRule {
    static readonly metadata: Lint.IRuleMetadata;
    static FAILURE_WITHOUT_PREFIX: string;
    static FAILURE_WITH_PREFIX: string;
    prefix: string;
    hasPrefix: boolean;
    private prefixChecker;
    private validator;
    constructor(options: Lint.IOptions);
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
    isEnabled(): boolean;
    validateName(name: string): boolean;
    validatePrefix(prefix: string): boolean;
}
export declare class ClassMetadataWalker extends NgWalker {
    private rule;
    constructor(sourceFile: ts.SourceFile, rule: Rule);
    protected visitNgPipe(controller: ts.ClassDeclaration, decorator: ts.Decorator): void;
    private validateProperties;
    private validateProperty;
    private getFailureMessage;
}
