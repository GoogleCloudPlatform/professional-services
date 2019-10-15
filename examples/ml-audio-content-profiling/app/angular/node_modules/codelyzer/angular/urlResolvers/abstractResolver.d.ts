import * as ts from 'typescript';
export interface MetadataUrls {
    templateUrl: string;
    styleUrls: string[];
}
export declare abstract class AbstractResolver {
    abstract resolve(decorator: ts.Decorator): MetadataUrls | null;
    protected getTemplateUrl(decorator: ts.Decorator): string | undefined;
    protected getStyleUrls(decorator: ts.Decorator): string[];
}
