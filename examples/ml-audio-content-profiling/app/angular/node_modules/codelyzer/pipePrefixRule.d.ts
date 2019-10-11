import * as Lint from 'tslint';
import * as ts from 'typescript';
import { NgWalker } from './angular/ngWalker';
export declare class Rule extends Lint.Rules.AbstractRule {
    static readonly metadata: Lint.IRuleMetadata;
    static FAILURE_STRING: string;
    prefix: string;
    private prefixChecker;
    constructor(options: Lint.IOptions);
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
    isEnabled(): boolean;
    validatePrefix(prefix: string): boolean;
}
export declare class ClassMetadataWalker extends NgWalker {
    private rule;
    constructor(sourceFile: ts.SourceFile, rule: Rule);
    protected visitNgPipe(controller: ts.ClassDeclaration, decorator: ts.Decorator): void;
    private validateProperties;
    private validateProperty;
}
