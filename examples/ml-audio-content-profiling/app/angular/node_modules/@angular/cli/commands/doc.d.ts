/**
 * Opens the official Angular documentation (angular.io) in a browser, and searches for a
 * given keyword.
 */
export interface Schema {
    /**
     * Shows a help message for this command in the console.
     */
    help?: HelpUnion;
    /**
     * The keyword to search for, as provided in the search bar in angular.io.
     */
    keyword?: string;
    /**
     * When true, searches all of angular.io. Otherwise, searches only API reference
     * documentation.
     */
    search?: boolean;
}
/**
 * Shows a help message for this command in the console.
 */
export declare type HelpUnion = boolean | HelpEnum;
export declare enum HelpEnum {
    HelpJSON = "JSON",
    JSON = "json"
}
