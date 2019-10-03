export interface Schema {
    /**
     * Initial repository commit information.
     */
    commit?: null | Commit;
    /**
     * Link CLI to global version (internal development only).
     */
    linkCli?: boolean;
    /**
     * Create a barebones project without any testing frameworks
     */
    minimal?: boolean;
    /**
     * The name of the workspace.
     */
    name: string;
    /**
     * The path where new projects will be created.
     */
    newProjectRoot?: string;
    /**
     * Skip initializing a git repository.
     */
    skipGit?: boolean;
    /**
     * Skip installing dependency packages.
     */
    skipInstall?: boolean;
    /**
     * The version of the Angular CLI to use.
     */
    version: string;
}
export interface Commit {
    email: string;
    message?: string;
    name: string;
}
