import * as Lint from 'tslint';
import * as ts from 'typescript';
import { NgWalker } from './angular/ngWalker';
import { DirectiveMetadata } from './angular/metadata';
export declare class Rule extends Lint.Rules.AbstractRule {
    static readonly metadata: Lint.IRuleMetadata;
    static readonly FAILURE_STRING: string;
    static validate(className: string, suffixes: string[]): boolean;
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
}
export declare class ClassMetadataWalker extends NgWalker {
    protected visitNgDirective(metadata: DirectiveMetadata): void;
}
