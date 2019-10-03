import { CodeWithSourceMap } from './metadata';
export interface StyleTransformer {
    (style: string, url?: string): CodeWithSourceMap;
}
export interface TemplateTransformer {
    (template: string, url?: string): CodeWithSourceMap;
}
export interface UrlResolver {
    (url: string | null): string | null;
}
export declare const LogLevel: {
    Debug: number;
    Error: number;
    Info: number;
    None: number;
};
export interface Config {
    interpolation: [string, string];
    logLevel: number;
    predefinedDirectives: DirectiveDeclaration[];
    resolveUrl: UrlResolver;
    transformStyle: StyleTransformer;
    transformTemplate: TemplateTransformer;
}
export interface DirectiveDeclaration {
    exportAs?: string;
    hostAttributes?: string[];
    hostListeners?: string[];
    hostProperties?: string[];
    inputs?: string[];
    outputs?: string[];
    selector: string;
}
export declare const Config: Config;
