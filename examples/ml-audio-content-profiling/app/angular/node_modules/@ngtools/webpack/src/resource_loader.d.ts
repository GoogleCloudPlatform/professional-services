export declare class WebpackResourceLoader {
    private _parentCompilation;
    private _context;
    private _fileDependencies;
    private _cachedSources;
    private _cachedEvaluatedSources;
    constructor();
    update(parentCompilation: any): void;
    getResourceDependencies(filePath: string): string[];
    private _compile;
    private _evaluate;
    get(filePath: string): Promise<string>;
}
