export interface Schema {
    /**
     * Flag to indicate if a directory is created.
     */
    flat?: boolean;
    /**
     * Specifies whether to apply lint fixes after generating the guard.
     */
    lintFix?: boolean;
    /**
     * The name of the guard.
     */
    name: string;
    /**
     * The path to create the interface.
     */
    path?: string;
    /**
     * The name of the project.
     */
    project: string;
    /**
     * Specifies if a spec file is generated.
     */
    spec?: boolean;
}
