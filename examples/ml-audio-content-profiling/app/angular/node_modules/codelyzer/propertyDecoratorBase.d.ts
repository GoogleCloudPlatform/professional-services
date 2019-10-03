import * as Lint from 'tslint';
import * as ts from 'typescript';
export interface IUsePropertyDecoratorConfig {
    propertyName: string;
    decoratorName: string | string[];
    errorMessage: string;
}
export declare class UsePropertyDecorator extends Lint.Rules.AbstractRule {
    private config;
    static formatFailureString(config: IUsePropertyDecoratorConfig, decoratorStr: string, className: string): string;
    constructor(config: IUsePropertyDecoratorConfig, options: Lint.IOptions);
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
}
