import { IRuleMetadata, RuleFailure, Rules } from 'tslint/lib';
import { SourceFile } from 'typescript';
export declare class Rule extends Rules.AbstractRule {
    static readonly metadata: IRuleMetadata;
    static readonly FAILURE_STRING_NEGATED_PIPE: string;
    static readonly FAILURE_STRING_UNSTRICT_EQUALITY: string;
    apply(sourceFile: SourceFile): RuleFailure[];
}
