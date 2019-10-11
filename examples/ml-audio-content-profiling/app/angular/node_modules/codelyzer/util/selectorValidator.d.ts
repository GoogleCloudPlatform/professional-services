export declare const SelectorValidator: {
    attribute(selector: string): boolean;
    element(selector: string): boolean;
    kebabCase(selector: string): boolean;
    camelCase(selector: string): boolean;
    prefix(prefix: string, selectorType: string): Function;
};
