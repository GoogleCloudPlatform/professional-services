/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare class Log {
    logItems: any[];
    constructor();
    add(value: any /** TODO #9100 */): void;
    fn(value: any /** TODO #9100 */): (a1?: any, a2?: any, a3?: any, a4?: any, a5?: any) => void;
    clear(): void;
    result(): string;
}
