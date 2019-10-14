export interface Schema {
    /**
     * Specifies if declaring module exports the directive.
     */
    export?: boolean;
    /**
     * Flag to indicate if a directory is created.
     */
    flat?: boolean;
    /**
     * Specifies whether to apply lint fixes after generating the directive.
     */
    lintFix?: boolean;
    /**
     * Allows specification of the declaring module.
     */
    module?: string;
    /**
     * The name of the directive.
     */
    name: string;
    /**
     * The path to create the interface.
     */
    path?: string;
    /**
     * The prefix to apply to generated selectors.
     */
    prefix?: string;
    /**
     * The name of the project.
     */
    project?: string;
    /**
     * The selector to use for the directive.
     */
    selector?: string;
    /**
     * Flag to skip the module import.
     */
    skipImport?: boolean;
    /**
     * Specifies if a spec file is generated.
     */
    spec?: boolean;
}
