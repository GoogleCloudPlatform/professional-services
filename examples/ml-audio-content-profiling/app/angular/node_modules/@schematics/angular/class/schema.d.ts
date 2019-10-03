export interface Schema {
    /**
     * The name of the class.
     */
    name: string;
    /**
     * The path to create the class.
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
    /**
     * Specifies the type of class.
     */
    type?: string;
}
