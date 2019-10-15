import * as Lint from 'tslint';
import * as ts from 'typescript';
import { NgWalker } from './angular/ngWalker';
export declare class Rule extends Lint.Rules.AbstractRule {
    static readonly metadata: Lint.IRuleMetadata;
    static readonly FAILURE_STRING: string;
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
}
export declare class ClassMetadataWalker extends NgWalker {
    protected visitNgPipe(controller: ts.ClassDeclaration, decorator: ts.Decorator): void;
    private validatePipe;
}
