export declare class ExportStringRef<T> {
    private _ref?;
    private _module;
    private _path;
    constructor(ref: string, parentPath?: string, inner?: boolean);
    readonly ref: T | undefined;
    readonly module: string;
    readonly path: string;
}
