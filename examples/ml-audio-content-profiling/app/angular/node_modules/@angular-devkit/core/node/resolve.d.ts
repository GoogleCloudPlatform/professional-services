import { BaseException } from '../src';
/**
 * Exception thrown when a module could not be resolved.
 */
export declare class ModuleNotFoundException extends BaseException {
    readonly moduleName: string;
    readonly basePath: string;
    readonly code: string;
    constructor(moduleName: string, basePath: string);
}
export interface ResolveOptions {
    /**
     * The basedir to use from which to resolve.
     */
    basedir: string;
    /**
     * The list of extensions to resolve. By default uses Object.keys(require.extensions).
     */
    extensions?: string[];
    /**
     * An additional list of paths to look into.
     */
    paths?: string[];
    /**
     * Whether or not to preserve symbolic links. If false, the actual paths pointed by
     * the symbolic links will be used. This defaults to true.
     */
    preserveSymlinks?: boolean;
    /**
     * Whether to fallback to a global lookup if the basedir one failed.
     */
    checkGlobal?: boolean;
    /**
     * Whether to fallback to using the local caller's directory if the basedir failed.
     */
    checkLocal?: boolean;
    /**
     * Whether to only resolve and return the first package.json file found. By default,
     * resolves the main field or the index of the package.
     */
    resolvePackageJson?: boolean;
}
export declare function setResolveHook(hook: ((x: string, options: ResolveOptions) => string | null) | null): void;
/**
 * Resolve a package using a logic similar to npm require.resolve, but with more options.
 * @param x The package name to resolve.
 * @param options A list of options. See documentation of those options.
 * @returns {string} Path to the index to include, or if `resolvePackageJson` option was
 *                   passed, a path to that file.
 * @throws {ModuleNotFoundException} If no module with that name was found anywhere.
 */
export declare function resolve(x: string, options: ResolveOptions): string;
