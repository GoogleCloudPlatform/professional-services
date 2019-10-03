import * as Lint from 'tslint';
import * as ts from 'typescript';
import { NgWalker } from './angular/ngWalker';
import { CssAst } from './angular/styles/cssAst';
import { ComponentMetadata, StyleMetadata } from './angular/metadata';
export declare class Rule extends Lint.Rules.AbstractRule {
    static metadata: Lint.IRuleMetadata;
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
}
export declare class UnusedCssNgVisitor extends NgWalker {
    private templateAst;
    visitClassDeclaration(declaration: ts.ClassDeclaration): void;
    protected visitNgStyleHelper(style: CssAst, context: ComponentMetadata, styleMetadata: StyleMetadata, baseStart: number): void;
    private validateStyles;
}
