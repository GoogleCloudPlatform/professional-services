import { IRuleMetadata, RuleFailure, Rules, RuleWalker } from 'tslint/lib';
import { CallExpression, SourceFile } from 'typescript/lib/typescript';
export declare class Rule extends Rules.AbstractRule {
    static metadata: IRuleMetadata;
    static readonly FAILURE_STRING_CLASS: string;
    static readonly FAILURE_STRING_VARIABLE: string;
    apply(sourceFile: SourceFile): RuleFailure[];
}
export declare class ExpressionCallMetadataWalker extends RuleWalker {
    visitCallExpression(node: CallExpression): void;
    private validateCallExpression;
}
