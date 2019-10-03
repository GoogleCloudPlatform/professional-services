export interface Schema {
    /**
     * Flag to control whether the CommonModule is imported.
     */
    commonModule?: boolean;
    /**
     * Flag to indicate if a directory is created.
     */
    flat?: boolean;
    /**
     * Allows specification of the declaring module.
     */
    module?: string;
    /**
     * The name of the module.
     */
    name: string;
    /**
     * The path to create the module.
     */
    path?: string;
    /**
     * The name of the project.
     */
    project?: string;
    /**
     * Generates a routing module.
     */
    routing?: boolean;
    /**
     * The scope for the generated routing.
     */
    routingScope?: RoutingScope;
}
/**
 * The scope for the generated routing.
 */
export declare enum RoutingScope {
    Child = "Child",
    Root = "Root"
}
