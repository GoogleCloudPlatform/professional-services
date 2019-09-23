import { IOptions, IRuleMetadata, RuleFailure, Rules } from 'tslint/lib';
import { SourceFile } from 'typescript/lib/typescript';
import { ComponentMetadata } from './angular/metadata';
import { NgWalker } from './angular/ngWalker';
export declare class Rule extends Rules.AbstractRule {
    static readonly metadata: IRuleMetadata;
    static readonly FAILURE_STRING: string;
    apply(sourceFile: SourceFile): RuleFailure[];
    isEnabled(): boolean;
}
export declare type PropertyType = 'animations' | 'styles' | 'template';
export declare type PropertyPair = {
    [key in PropertyType]?: number;
};
export declare const getAnimationsFailure: (value: number, limit?: number) => string;
export declare const getStylesFailure: (value: number, limit?: number) => string;
export declare const getTemplateFailure: (value: number, limit?: number) => string;
export declare class MaxInlineDeclarationsWalker extends NgWalker {
    private readonly animationsLinesLimit;
    private readonly stylesLinesLimit;
    private readonly templateLinesLimit;
    private readonly newLineRegExp;
    constructor(sourceFile: SourceFile, options: IOptions);
    protected visitNgComponent(metadata: ComponentMetadata): void;
    private getLinesCount;
    private getInlineAnimationsLinesCount;
    private validateInlineAnimations;
    private getInlineStylesLinesCount;
    private validateInlineStyles;
    private getTemplateLinesCount;
    private hasInlineTemplate;
    private validateInlineTemplate;
}
