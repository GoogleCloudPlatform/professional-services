export interface Schema {
    /**
     * The name of the e2e application.
     */
    name: string;
    /**
     * The root directory of the new application.
     */
    projectRoot?: string;
    /**
     * The name of the app being tested.
     */
    relatedAppName: string;
    /**
     * HTML selector for the root component.
     */
    rootSelector?: string;
}
