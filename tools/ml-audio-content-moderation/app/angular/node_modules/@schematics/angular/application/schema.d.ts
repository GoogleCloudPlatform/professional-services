export interface Schema {
    /**
     * EXPERIMENTAL: Specifies whether to create a new application which uses the Ivy rendering
     * engine.
     */
    experimentalIvy?: boolean;
    /**
     * Specifies if the style will be in the ts file.
     */
    inlineStyle?: boolean;
    /**
     * Specifies if the template will be in the ts file.
     */
    inlineTemplate?: boolean;
    /**
     * Create a barebones project without any testing frameworks
     */
    minimal?: boolean;
    /**
     * The name of the application.
     */
    name: string;
    /**
     * The prefix to apply to generated selectors.
     */
    prefix?: string;
    /**
     * The root directory of the new application.
     */
    projectRoot?: string;
    /**
     * Generates a routing module.
     */
    routing?: boolean;
    /**
     * Do not add dependencies to package.json.
     */
    skipPackageJson?: boolean;
    /**
     * Skip creating spec files.
     */
    skipTests?: boolean;
    /**
     * The file extension to be used for style files.
     */
    style?: string;
    /**
     * Specifies the view encapsulation strategy.
     */
    viewEncapsulation?: ViewEncapsulation;
}
/**
 * Specifies the view encapsulation strategy.
 */
export declare enum ViewEncapsulation {
    Emulated = "Emulated",
    Native = "Native",
    None = "None",
    ShadowDOM = "ShadowDom"
}
