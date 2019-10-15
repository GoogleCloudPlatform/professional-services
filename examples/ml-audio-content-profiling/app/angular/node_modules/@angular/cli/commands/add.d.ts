/**
 * Adds support for an external library to your project.
 */
export interface Schema {
    /**
     * The package to be added.
     */
    collection?: string;
    /**
     * When true, disables interactive input prompts for options with a default.
     */
    defaults?: boolean;
    /**
     * When true, run through and report activity without writing out results.
     */
    dryRun?: boolean;
    /**
     * When true, force overwriting of existing files.
     */
    force?: boolean;
    /**
     * Shows a help message for this command in the console.
     */
    help?: HelpUnion;
    /**
     * When false, disables interactive input prompts.
     */
    interactive?: boolean;
}
/**
 * Shows a help message for this command in the console.
 */
export declare type HelpUnion = boolean | HelpEnum;
export declare enum HelpEnum {
    HelpJSON = "JSON",
    JSON = "json"
}
