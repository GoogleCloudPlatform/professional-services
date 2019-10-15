import { IOptions, IRuleMetadata, RuleFailure, Rules } from 'tslint/lib';
import { Decorator, SourceFile } from 'typescript';
import { NgWalker } from './angular/ngWalker';
export declare const decoratorKeys: ReadonlySet<string>;
export declare class Rule extends Rules.AbstractRule {
    static readonly metadata: IRuleMetadata;
    static readonly FAILURE_STRING: string;
    apply(sourceFile: SourceFile): RuleFailure[];
    isEnabled(): boolean;
}
export declare const getFailureMessage: () => string;
export declare class PreferInlineDecoratorWalker extends NgWalker {
    private readonly blacklistedDecorators;
    constructor(source: SourceFile, options: IOptions);
    protected visitMethodDecorator(decorator: Decorator): void;
    protected visitPropertyDecorator(decorator: Decorator): void;
    private validateDecorator;
}
