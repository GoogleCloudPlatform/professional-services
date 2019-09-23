import { InjectionToken } from '@angular/core';
export declare const RESTANGULAR: InjectionToken<string>;
export declare function RestangularFactory([callbackOrServices, callback]: [any, any]): {
    fn: any;
    arrServices: any[];
};
