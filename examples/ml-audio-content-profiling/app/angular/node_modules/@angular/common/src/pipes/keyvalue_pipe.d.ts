/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { KeyValueDiffers, PipeTransform } from '@angular/core';
/**
 * A key value pair.
 * Usually used to represent the key value pairs from a Map or Object.
 *
 * @publicApi
 */
export interface KeyValue<K, V> {
    key: K;
    value: V;
}
/**
 * @ngModule CommonModule
 * @description
 *
 * Transforms Object or Map into an array of key value pairs.
 *
 * The output array will be ordered by keys.
 * By default the comparator will be by Unicode point value.
 * You can optionally pass a compareFn if your keys are complex types.
 *
 * @usageNotes
 * ### Examples
 *
 * This examples show how an Object or a Map and be iterated by ngFor with the use of this keyvalue
 * pipe.
 *
 * {@example common/pipes/ts/keyvalue_pipe.ts region='KeyValuePipe'}
 *
 * @publicApi
 */
export declare class KeyValuePipe implements PipeTransform {
    private readonly differs;
    constructor(differs: KeyValueDiffers);
    private differ;
    private keyValues;
    transform<K, V>(input: null, compareFn?: (a: KeyValue<K, V>, b: KeyValue<K, V>) => number): null;
    transform<V>(input: {
        [key: string]: V;
    } | Map<string, V>, compareFn?: (a: KeyValue<string, V>, b: KeyValue<string, V>) => number): Array<KeyValue<string, V>>;
    transform<V>(input: {
        [key: number]: V;
    } | Map<number, V>, compareFn?: (a: KeyValue<number, V>, b: KeyValue<number, V>) => number): Array<KeyValue<number, V>>;
    transform<K, V>(input: Map<K, V>, compareFn?: (a: KeyValue<K, V>, b: KeyValue<K, V>) => number): Array<KeyValue<K, V>>;
}
export declare function defaultComparator<K, V>(keyValueA: KeyValue<K, V>, keyValueB: KeyValue<K, V>): number;
