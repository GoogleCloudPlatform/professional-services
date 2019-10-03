export interface Schema {
    /**
     * Specifies if declaring module exports the pipe.
     */
    export?: boolean;
    /**
     * Flag to indicate if a directory is created.
     */
    flat?: boolean;
    /**
     * Specifies whether to apply lint fixes after generating the pipe.
     */
    lintFix?: boolean;
    /**
     * Allows specification of the declaring module.
     */
    module?: string;
    /**
     * The name of the pipe.
     */
    name: string;
    /**
     * The path to create the pipe.
     */
    path?: string;
    /**
     * The name of the project.
     */
    project?: string;
    /**
     * Allows for skipping the module import.
     */
    skipImport?: boolean;
    /**
     * Specifies if a spec file is generated.
     */
    spec?: boolean;
}
