import { RawSourceMap } from 'source-map';
import * as ts from 'typescript';
export interface CodeWithSourceMap {
    code: string;
    map?: RawSourceMap;
    source?: string;
}
export interface PropertyMetadata {
    node?: ts.Node;
    url?: string;
}
export interface AnimationMetadata extends PropertyMetadata {
    animation: CodeWithSourceMap;
}
export interface StyleMetadata extends PropertyMetadata {
    style: CodeWithSourceMap;
}
export interface TemplateMetadata extends PropertyMetadata {
    template: CodeWithSourceMap;
}
export declare class DirectiveMetadata {
    readonly controller: ts.ClassDeclaration;
    readonly decorator: ts.Decorator;
    readonly selector?: string;
    constructor(controller: ts.ClassDeclaration, decorator: ts.Decorator, selector?: string);
}
export declare class ComponentMetadata extends DirectiveMetadata {
    readonly controller: ts.ClassDeclaration;
    readonly decorator: ts.Decorator;
    readonly selector?: string;
    readonly animations?: (AnimationMetadata | undefined)[];
    readonly styles?: (StyleMetadata | undefined)[];
    readonly template?: TemplateMetadata;
    constructor(controller: ts.ClassDeclaration, decorator: ts.Decorator, selector?: string, animations?: (AnimationMetadata | undefined)[], styles?: (StyleMetadata | undefined)[], template?: TemplateMetadata);
}
