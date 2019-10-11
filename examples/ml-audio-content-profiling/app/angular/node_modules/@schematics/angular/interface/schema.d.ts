export interface Schema {
    /**
     * Specifies whether to apply lint fixes after generating the directive.
     */
    lintFix?: boolean;
    /**
     * The name of the interface.
     */
    name: string;
    /**
     * The path to create the interface.
     */
    path?: string;
    /**
     * Specifies the prefix to use.
     */
    prefix?: string;
    /**
     * The name of the project.
     */
    project?: string;
    /**
     * Specifies the type of interface.
     */
    type?: string;
}
