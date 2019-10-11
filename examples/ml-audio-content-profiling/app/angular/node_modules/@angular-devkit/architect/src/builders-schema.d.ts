export interface Schema {
    /**
     * Link to schema.
     */
    $schema?: string;
    builders?: Builders;
}
export declare type Builders = any[] | boolean | number | number | {
    [key: string]: Builder;
} | null | string;
/**
 * Target options.
 */
export interface Builder {
    /**
     * The builder class module.
     */
    class: string;
    /**
     * Builder description.
     */
    description: string;
    /**
     * Schema for builder option validation.
     */
    schema: string;
}
