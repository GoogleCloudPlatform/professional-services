import { IRuleMetadata, RuleFailure, Rules, RuleWalker } from 'tslint/lib';
import { ClassDeclaration, SourceFile } from 'typescript/lib/typescript';
export declare class Rule extends Rules.AbstractRule {
    static readonly metadata: IRuleMetadata;
    static readonly FAILURE_STRING: string;
    static readonly PIPE_INTERFACE_NAME: string;
    apply(sourceFile: SourceFile): RuleFailure[];
}
export declare class ClassMetadataWalker extends RuleWalker {
    visitClassDeclaration(node: ClassDeclaration): void;
    private validateClassDeclaration;
}
