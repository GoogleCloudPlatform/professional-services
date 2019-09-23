export interface Schema {
    /**
     * Specifies whether to apply lint fixes after generating the enum.
     */
    lintFix?: boolean;
    /**
     * The name of the enum.
     */
    name: string;
    /**
     * The path to create the enum.
     */
    path?: string;
    /**
     * The name of the project.
     */
    project?: string;
}
