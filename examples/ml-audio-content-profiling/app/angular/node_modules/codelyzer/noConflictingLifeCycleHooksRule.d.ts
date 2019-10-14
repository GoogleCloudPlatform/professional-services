import * as Lint from 'tslint';
import * as ts from 'typescript';
export declare class Rule extends Lint.Rules.AbstractRule {
    static metadata: Lint.IRuleMetadata;
    static FAILURE_STRING: string;
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
}
export declare class ClassMetadataWalker extends Lint.RuleWalker {
    visitClassDeclaration(node: ts.ClassDeclaration): void;
    private validateInterfaces;
    private validateMethods;
}
