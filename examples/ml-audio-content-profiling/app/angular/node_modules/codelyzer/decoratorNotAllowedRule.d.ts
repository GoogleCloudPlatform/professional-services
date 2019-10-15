import * as Lint from 'tslint';
import * as ts from 'typescript';
import { ComponentMetadata, DirectiveMetadata } from './angular/metadata';
import { NgWalker } from './angular/ngWalker';
export declare class Rule extends Lint.Rules.AbstractRule {
    static readonly metadata: Lint.IRuleMetadata;
    static readonly FAILURE_STRING: string;
    apply(sourceFile: ts.SourceFile): Lint.RuleFailure[];
}
export declare class ClassMetadataWalker extends NgWalker {
    className: string;
    isInjectable: boolean;
    protected visitNgInjectable(classDeclaration: ts.ClassDeclaration, decorator: ts.Decorator): void;
    protected visitNgDirective(metadata: DirectiveMetadata): void;
    protected visitNgPipe(controller: ts.ClassDeclaration, decorator: ts.Decorator): void;
    protected visitNgComponent(metadata: ComponentMetadata): void;
    protected visitNgInput(property: ts.PropertyDeclaration, input: ts.Decorator, args: string[]): void;
    protected visitNgOutput(property: ts.PropertyDeclaration, input: ts.Decorator, args: string[]): void;
    protected visitNgHostBinding(property: ts.PropertyDeclaration, decorator: ts.Decorator, args: string[]): void;
    protected visitNgHostListener(method: ts.MethodDeclaration, decorator: ts.Decorator, args: string[]): void;
    protected visitNgContentChild(property: ts.PropertyDeclaration, input: ts.Decorator, args: string[]): void;
    protected visitNgContentChildren(property: ts.PropertyDeclaration, input: ts.Decorator, args: string[]): void;
    protected visitNgViewChild(property: ts.PropertyDeclaration, input: ts.Decorator, args: string[]): void;
    protected visitNgViewChildren(property: ts.PropertyDeclaration, input: ts.Decorator, args: string[]): void;
    private generateFailure;
}
