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
    isComponent: boolean;
    isDirective: boolean;
    isPipe: boolean;
    visitMethodDeclaration(method: ts.MethodDeclaration): void;
    protected visitNgInjectable(controller: ts.ClassDeclaration, decorator: ts.Decorator): void;
    protected visitNgComponent(metadata: ComponentMetadata): void;
    protected visitNgDirective(metadata: DirectiveMetadata): void;
    protected visitNgPipe(controller: ts.ClassDeclaration, decorator: ts.Decorator): void;
    private generateFailure;
}
