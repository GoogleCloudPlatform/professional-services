import * as ts from 'typescript';
import { Maybe } from '../util/function';
import { FileResolver } from './fileResolver/fileResolver';
import { AnimationMetadata, ComponentMetadata, DirectiveMetadata, StyleMetadata, TemplateMetadata } from './metadata';
import { AbstractResolver, MetadataUrls } from './urlResolvers/abstractResolver';
export declare class MetadataReader {
    private _fileResolver;
    private _urlResolver?;
    constructor(_fileResolver: FileResolver, _urlResolver?: AbstractResolver);
    read(d: ts.ClassDeclaration): DirectiveMetadata | undefined;
    protected readDirectiveMetadata(d: ts.ClassDeclaration, dec: ts.Decorator): DirectiveMetadata;
    protected readComponentMetadata(d: ts.ClassDeclaration, dec: ts.Decorator): ComponentMetadata;
    protected getDecoratorArgument(decorator: ts.Decorator): Maybe<ts.ObjectLiteralExpression | undefined>;
    protected readComponentAnimationsMetadata(dec: ts.Decorator): Maybe<(AnimationMetadata | undefined)[] | undefined>;
    protected readComponentTemplateMetadata(dec: ts.Decorator, external: MetadataUrls): Maybe<TemplateMetadata | undefined>;
    protected readComponentStylesMetadata(dec: ts.Decorator, external: MetadataUrls): Maybe<(StyleMetadata | undefined)[] | undefined>;
    private _resolve;
}
