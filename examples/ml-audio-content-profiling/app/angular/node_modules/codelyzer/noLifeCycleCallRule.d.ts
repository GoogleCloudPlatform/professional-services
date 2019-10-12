import * as Lint from 'tslint';
import * as ts from 'typescript';
import { NgWalker } from './angular/ngWalker';
export declare class Rule extends Lint.Rules.AbstractRule {
    static readonly metadata: Lint.IRuleMetadata;
    static readonly FAILURE_STRING: string;
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
}
export declare type LifecycleHooksMethods = 'ngAfterContentChecked' | 'ngAfterContentInit' | 'ngAfterViewChecked' | 'ngAfterViewInit' | 'ngDoCheck' | 'ngOnChanges' | 'ngOnDestroy' | 'ngOnInit';
export declare const lifecycleHooksMethods: Set<LifecycleHooksMethods>;
export declare class ExpressionCallMetadataWalker extends NgWalker {
    visitCallExpression(node: ts.CallExpression): void;
    private validateCallExpression;
}
