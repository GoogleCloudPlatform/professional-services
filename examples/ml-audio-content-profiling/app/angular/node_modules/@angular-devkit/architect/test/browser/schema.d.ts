/**
 * Target options
 */
export interface Schema {
    /**
     * A required option
     */
    browserOption: number;
    /**
     * A non-required option with a default
     */
    optionalBrowserOption?: boolean;
}
