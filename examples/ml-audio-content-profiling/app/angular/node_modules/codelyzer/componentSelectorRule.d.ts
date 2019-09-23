import { IRuleMetadata } from 'tslint/lib';
import { SelectorRule } from './selectorNameBase';
export declare class Rule extends SelectorRule {
    static readonly metadata: IRuleMetadata;
    handleType: string;
    getPrefixFailure(prefixes: string[]): string;
    getStyleFailure(): string;
    getTypeFailure(): string;
    isEnabled(): boolean;
}
