import * as Lint from 'tslint';
import * as ts from 'typescript';
export declare class Rule extends Lint.Rules.AbstractRule {
    static readonly metadata: Lint.IRuleMetadata;
    static readonly FAILURE_STRING: string;
    private static readonly walkerBuilder;
    private static decoratorIsAttribute;
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
}
