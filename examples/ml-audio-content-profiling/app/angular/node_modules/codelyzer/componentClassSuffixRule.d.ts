import * as Lint from 'tslint';
import * as ts from 'typescript';
import { F2 } from './util/function';
import { NgWalker } from '.';
export declare class Rule extends Lint.Rules.AbstractRule {
    static readonly metadata: Lint.IRuleMetadata;
    static readonly FAILURE_STRING: string;
    static walkerBuilder: F2<ts.SourceFile, Lint.IOptions, NgWalker>;
    static validate(className: string, suffixList: string[]): boolean;
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
}
