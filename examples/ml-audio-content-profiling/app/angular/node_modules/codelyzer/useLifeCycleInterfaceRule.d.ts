import * as Lint from 'tslint';
import * as ts from 'typescript';
export declare class Rule extends Lint.Rules.AbstractRule {
    static readonly metadata: Lint.IRuleMetadata;
    static readonly FAILURE_STRING: string;
    static readonly HOOKS_PREFIX: string;
    static readonly LIFE_CYCLE_HOOKS_NAMES: string[];
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
}
export declare class ClassMetadataWalker extends Lint.RuleWalker {
    visitClassDeclaration(node: ts.ClassDeclaration): void;
    private extractInterfaces;
    private validateMethods;
    private isMethodValidHook;
}
