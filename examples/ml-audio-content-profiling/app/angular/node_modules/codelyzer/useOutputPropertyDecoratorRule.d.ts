import { IOptions, IRuleMetadata } from 'tslint/lib';
import { UsePropertyDecorator } from './propertyDecoratorBase';
export declare class Rule extends UsePropertyDecorator {
    static readonly metadata: IRuleMetadata;
    static readonly FAILURE_STRING: string;
    constructor(options: IOptions);
}
