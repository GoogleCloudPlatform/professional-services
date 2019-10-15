import { DirectiveDef } from '../interfaces/definition';
/**
 * This feature publishes the directive (or component) into the DI system, making it visible to
 * others for injection.
 *
 * @param definition
 */
export declare function PublicFeature<T>(definition: DirectiveDef<T>): void;
