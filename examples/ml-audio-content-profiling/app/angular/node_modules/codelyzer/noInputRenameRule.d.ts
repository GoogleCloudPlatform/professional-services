import * as Lint from 'tslint';
import * as ts from 'typescript';
import { DirectiveMetadata } from './angular/metadata';
import { NgWalker } from './angular/ngWalker';
export declare class Rule extends Lint.Rules.AbstractRule {
    static readonly metadata: Lint.IRuleMetadata;
    static readonly FAILURE_STRING: string;
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
}
export declare const getFailureMessage: (className: string, propertyName: string) => string;
export declare class InputMetadataWalker extends NgWalker {
    private directiveSelectors;
    protected visitNgDirective(metadata: DirectiveMetadata): void;
    protected visitNgInput(property: ts.PropertyDeclaration, input: ts.Decorator, args: string[]): void;
    private canPropertyBeAliased;
    private validateInput;
}
