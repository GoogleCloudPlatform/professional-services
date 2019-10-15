import { IRuleMetadata, RuleFailure, Rules } from 'tslint/lib';
import { SourceFile } from 'typescript/lib/typescript';
export declare class Rule extends Rules.AbstractRule {
    static readonly metadata: IRuleMetadata;
    static readonly DEFAULT_MAX_COMPLEXITY: number;
    static readonly FAILURE_STRING: string;
    apply(sourceFile: SourceFile): RuleFailure[];
    isEnabled(): boolean;
}
export declare const getFailureMessage: (totalComplexity: number, maxComplexity?: number) => string;
