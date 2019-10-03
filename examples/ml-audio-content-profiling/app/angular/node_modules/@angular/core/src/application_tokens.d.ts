/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from './di';
import { ComponentRef } from './linker/component_factory';
/**
 * A DI Token representing a unique string id assigned to the application by Angular and used
 * primarily for prefixing application attributes and CSS styles when
 * {@link ViewEncapsulation#Emulated ViewEncapsulation.Emulated} is being used.
 *
 * If you need to avoid randomly generated value to be used as an application id, you can provide
 * a custom value via a DI provider <!-- TODO: provider --> configuring the root {@link Injector}
 * using this token.
 * @publicApi
 */
export declare const APP_ID: InjectionToken<string>;
export declare function _appIdRandomProviderFactory(): string;
/**
 * Providers that will generate a random APP_ID_TOKEN.
 * @publicApi
 */
export declare const APP_ID_RANDOM_PROVIDER: {
    provide: InjectionToken<string>;
    useFactory: typeof _appIdRandomProviderFactory;
    deps: any[];
};
/**
 * A function that will be executed when a platform is initialized.
 * @publicApi
 */
export declare const PLATFORM_INITIALIZER: InjectionToken<(() => void)[]>;
/**
 * A token that indicates an opaque platform id.
 * @publicApi
 */
export declare const PLATFORM_ID: InjectionToken<Object>;
/**
 * All callbacks provided via this token will be called for every component that is bootstrapped.
 * Signature of the callback:
 *
 * `(componentRef: ComponentRef) => void`.
 *
 * @publicApi
 */
export declare const APP_BOOTSTRAP_LISTENER: InjectionToken<((compRef: ComponentRef<any>) => void)[]>;
/**
 * A token which indicates the root directory of the application
 * @publicApi
 */
export declare const PACKAGE_ROOT_URL: InjectionToken<string>;
