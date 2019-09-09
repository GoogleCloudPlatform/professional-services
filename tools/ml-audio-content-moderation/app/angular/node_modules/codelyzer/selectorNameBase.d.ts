import * as compiler from '@angular/compiler';
import * as Lint from 'tslint';
import * as ts from 'typescript';
export declare type SelectorType = 'element' | 'attribute';
export declare type SelectorTypeInternal = 'element' | 'attrs';
export declare type SelectorStyle = 'kebab-case' | 'camelCase';
export declare abstract class SelectorRule extends Lint.Rules.AbstractRule {
    handleType: string;
    prefixes: string[];
    types: SelectorTypeInternal[];
    style: SelectorStyle[];
    constructor(options: Lint.IOptions);
    validateType(selectors: compiler.CssSelector[]): boolean;
    validateStyle(selectors: compiler.CssSelector[]): boolean;
    validatePrefix(selectors: compiler.CssSelector[]): boolean;
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
    abstract getTypeFailure(): string;
    abstract getStyleFailure(): string;
    abstract getPrefixFailure(prefixes: string[]): string;
    private getValidSelectors;
}
export declare class SelectorValidatorWalker extends Lint.RuleWalker {
    private rule;
    constructor(sourceFile: ts.SourceFile, rule: SelectorRule);
    visitClassDeclaration(node: ts.ClassDeclaration): void;
    private validateDecorator;
    private validateSelector;
    private validateProperty;
    private extractMainSelector;
}
