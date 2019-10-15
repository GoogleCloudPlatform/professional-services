/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * A codec for encoding and decoding parameters in URLs.
 *
 * Used by `HttpParams`.
 *
 * @publicApi
 **/
export interface HttpParameterCodec {
    encodeKey(key: string): string;
    encodeValue(value: string): string;
    decodeKey(key: string): string;
    decodeValue(value: string): string;
}
/**
 * A `HttpParameterCodec` that uses `encodeURIComponent` and `decodeURIComponent` to
 * serialize and parse URL parameter keys and values.
 *
 * @publicApi
 */
export declare class HttpUrlEncodingCodec implements HttpParameterCodec {
    encodeKey(key: string): string;
    encodeValue(value: string): string;
    decodeKey(key: string): string;
    decodeValue(value: string): string;
}
/** Options used to construct an `HttpParams` instance. */
export interface HttpParamsOptions {
    /**
     * String representation of the HTTP params in URL-query-string format. Mutually exclusive with
     * `fromObject`.
     */
    fromString?: string;
    /** Object map of the HTTP params. Mutally exclusive with `fromString`. */
    fromObject?: {
        [param: string]: string | string[];
    };
    /** Encoding codec used to parse and serialize the params. */
    encoder?: HttpParameterCodec;
}
/**
 * An HTTP request/response body that represents serialized parameters,
 * per the MIME type `application/x-www-form-urlencoded`.
 *
 * This class is immutable - all mutation operations return a new instance.
 *
 * @publicApi
 */
export declare class HttpParams {
    private map;
    private encoder;
    private updates;
    private cloneFrom;
    constructor(options?: HttpParamsOptions);
    /**
     * Check whether the body has one or more values for the given parameter name.
     */
    has(param: string): boolean;
    /**
     * Get the first value for the given parameter name, or `null` if it's not present.
     */
    get(param: string): string | null;
    /**
     * Get all values for the given parameter name, or `null` if it's not present.
     */
    getAll(param: string): string[] | null;
    /**
     * Get all the parameter names for this body.
     */
    keys(): string[];
    /**
     * Construct a new body with an appended value for the given parameter name.
     */
    append(param: string, value: string): HttpParams;
    /**
     * Construct a new body with a new value for the given parameter name.
     */
    set(param: string, value: string): HttpParams;
    /**
     * Construct a new body with either the given value for the given parameter
     * removed, if a value is given, or all values for the given parameter removed
     * if not.
     */
    delete(param: string, value?: string): HttpParams;
    /**
     * Serialize the body to an encoded string, where key-value pairs (separated by `=`) are
     * separated by `&`s.
     */
    toString(): string;
    private clone;
    private init;
}
