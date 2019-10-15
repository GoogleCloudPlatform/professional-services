import { IRuleMetadata, RuleFailure, Rules } from 'tslint/lib';
import { Decorator, PropertyDeclaration, SourceFile } from 'typescript/lib/typescript';
import { NgWalker } from './angular/ngWalker';
export declare class Rule extends Rules.AbstractRule {
    static readonly metadata: IRuleMetadata;
    static readonly FAILURE_STRING: string;
    apply(sourceFile: SourceFile): RuleFailure[];
}
export declare class OutputMetadataWalker extends NgWalker {
    protected visitNgOutput(property: PropertyDeclaration, output: Decorator, args: string[]): void;
    private validateOutput;
}
