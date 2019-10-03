"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const ajv = require("ajv");
const http = require("http");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const Url = require("url");
const exception_1 = require("../../exception/exception");
const utils_1 = require("../../utils");
const interface_1 = require("../interface");
const visitor_1 = require("./visitor");
class SchemaValidationException extends exception_1.BaseException {
    constructor(errors, baseMessage = 'Schema validation failed with the following errors:') {
        if (!errors || errors.length === 0) {
            super('Schema validation failed.');
            return;
        }
        const messages = SchemaValidationException.createMessages(errors);
        super(`${baseMessage}\n  ${messages.join('\n  ')}`);
        this.errors = errors;
    }
    static createMessages(errors) {
        if (!errors || errors.length === 0) {
            return [];
        }
        const messages = errors.map((err) => {
            let message = `Data path ${JSON.stringify(err.dataPath)} ${err.message}`;
            if (err.keyword === 'additionalProperties') {
                message += `(${err.params.additionalProperty})`;
            }
            return message + '.';
        });
        return messages;
    }
}
exports.SchemaValidationException = SchemaValidationException;
class CoreSchemaRegistry {
    constructor(formats = []) {
        /**
         * Build an AJV instance that will be used to validate schemas.
         */
        this._uriCache = new Map();
        this._uriHandlers = new Set();
        this._pre = new utils_1.PartiallyOrderedSet();
        this._post = new utils_1.PartiallyOrderedSet();
        this._smartDefaultKeyword = false;
        this._sourceMap = new Map();
        const formatsObj = {};
        for (const format of formats) {
            formatsObj[format.name] = format.formatter;
        }
        this._ajv = ajv({
            formats: formatsObj,
            loadSchema: (uri) => this._fetch(uri),
            schemaId: 'auto',
            passContext: true,
        });
        this._ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
        this._ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
    }
    _fetch(uri) {
        const maybeSchema = this._uriCache.get(uri);
        if (maybeSchema) {
            return Promise.resolve(maybeSchema);
        }
        // Try all handlers, one after the other.
        for (const maybeHandler of this._uriHandlers) {
            const handler = maybeHandler(uri);
            if (handler) {
                // The AJV API only understands Promises.
                return handler.pipe(operators_1.tap(json => this._uriCache.set(uri, json))).toPromise();
            }
        }
        // If none are found, handle using http client.
        return new Promise((resolve, reject) => {
            http.get(uri, res => {
                if (!res.statusCode || res.statusCode >= 300) {
                    // Consume the rest of the data to free memory.
                    res.resume();
                    reject(new Error(`Request failed. Status Code: ${res.statusCode}`));
                }
                else {
                    res.setEncoding('utf8');
                    let data = '';
                    res.on('data', chunk => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            this._uriCache.set(uri, json);
                            resolve(json);
                        }
                        catch (err) {
                            reject(err);
                        }
                    });
                }
            });
        });
    }
    /**
     * Add a transformation step before the validation of any Json.
     * @param {JsonVisitor} visitor The visitor to transform every value.
     * @param {JsonVisitor[]} deps A list of other visitors to run before.
     */
    addPreTransform(visitor, deps) {
        this._pre.add(visitor, deps);
    }
    /**
     * Add a transformation step after the validation of any Json. The JSON will not be validated
     * after the POST, so if transformations are not compatible with the Schema it will not result
     * in an error.
     * @param {JsonVisitor} visitor The visitor to transform every value.
     * @param {JsonVisitor[]} deps A list of other visitors to run before.
     */
    addPostTransform(visitor, deps) {
        this._post.add(visitor, deps);
    }
    _resolver(ref, validate) {
        if (!validate || !validate.refs || !validate.refVal || !ref) {
            return {};
        }
        let refMap = validate;
        const rootRefMap = validate.root;
        // Resolve from the root if it's different.
        if (validate.root && validate.schema !== rootRefMap.schema) {
            refMap = rootRefMap;
        }
        const schema = refMap.schema ? typeof refMap.schema == 'object' && refMap.schema : null;
        const maybeId = schema ? schema.id || schema.$id : null;
        if (typeof maybeId == 'string') {
            ref = Url.resolve(maybeId, ref);
        }
        let fullReference = (ref[0] === '#' && maybeId) ? maybeId + ref : ref;
        if (fullReference.endsWith('#')) {
            fullReference = fullReference.slice(0, -1);
        }
        // tslint:disable-next-line:no-any
        const context = validate.refVal[validate.refs[fullReference]];
        if (typeof context == 'function') {
            // Context will be a function if the schema isn't loaded yet, and an actual schema if it's
            // synchronously available.
            return { context, schema: context && context.schema };
        }
        else {
            return { context: validate, schema: context };
        }
    }
    /**
     * Flatten the Schema, resolving and replacing all the refs. Makes it into a synchronous schema
     * that is also easier to traverse. Does not cache the result.
     *
     * @param schema The schema or URI to flatten.
     * @returns An Observable of the flattened schema object.
     */
    flatten(schema) {
        this._ajv.removeSchema(schema);
        // Supports both synchronous and asynchronous compilation, by trying the synchronous
        // version first, then if refs are missing this will fails.
        // We also add any refs from external fetched schemas so that those will also be used
        // in synchronous (if available).
        let validator;
        try {
            this._currentCompilationSchemaInfo = undefined;
            validator = rxjs_1.of(this._ajv.compile(schema)).pipe(operators_1.tap(() => this._currentCompilationSchemaInfo = undefined));
        }
        catch (e) {
            // Propagate the error.
            if (!(e instanceof ajv.MissingRefError)) {
                return rxjs_1.throwError(e);
            }
            this._currentCompilationSchemaInfo = undefined;
            validator = rxjs_1.from(this._ajv.compileAsync(schema)).pipe(operators_1.tap(() => this._currentCompilationSchemaInfo = undefined));
        }
        return validator.pipe(operators_1.switchMap(validate => {
            const self = this;
            function visitor(current, pointer, parentSchema, index) {
                if (current
                    && parentSchema
                    && index
                    && interface_1.isJsonObject(current)
                    && current.hasOwnProperty('$ref')
                    && typeof current['$ref'] == 'string') {
                    const resolved = self._resolver(current['$ref'], validate);
                    if (resolved.schema) {
                        parentSchema[index] = resolved.schema;
                    }
                }
            }
            const schema = utils_1.deepCopy(validate.schema);
            visitor_1.visitJsonSchema(schema, visitor);
            return rxjs_1.of(schema);
        }));
    }
    /**
     * Compile and return a validation function for the Schema.
     *
     * @param schema The schema to validate. If a string, will fetch the schema before compiling it
     * (using schema as a URI).
     * @returns An Observable of the Validation function.
     */
    compile(schema) {
        const schemaInfo = {
            smartDefaultRecord: new Map(),
            promptDefinitions: [],
        };
        this._ajv.removeSchema(schema);
        // Supports both synchronous and asynchronous compilation, by trying the synchronous
        // version first, then if refs are missing this will fails.
        // We also add any refs from external fetched schemas so that those will also be used
        // in synchronous (if available).
        let validator;
        try {
            this._currentCompilationSchemaInfo = schemaInfo;
            validator = rxjs_1.of(this._ajv.compile(schema));
        }
        catch (e) {
            // Propagate the error.
            if (!(e instanceof ajv.MissingRefError)) {
                return rxjs_1.throwError(e);
            }
            try {
                validator = rxjs_1.from(this._ajv.compileAsync(schema));
            }
            catch (e) {
                return rxjs_1.throwError(e);
            }
        }
        return validator
            .pipe(operators_1.map(validate => (data, options) => {
            const validationOptions = Object.assign({ withPrompts: true, applyPostTransforms: true, applyPreTransforms: true }, options);
            const validationContext = {
                promptFieldsWithValue: new Set(),
            };
            let result = rxjs_1.of(data);
            if (validationOptions.applyPreTransforms) {
                // tslint:disable-next-line:no-any https://github.com/ReactiveX/rxjs/issues/3989
                result = result.pipe(...[...this._pre].map(visitor => operators_1.concatMap((data) => {
                    return visitor_1.visitJson(data, visitor, schema, this._resolver, validate);
                })));
            }
            return result.pipe(operators_1.switchMap(updateData => this._applySmartDefaults(updateData, schemaInfo.smartDefaultRecord)), operators_1.switchMap(updatedData => {
                if (validationOptions.withPrompts === false) {
                    return rxjs_1.of(updatedData);
                }
                const visitor = (value, pointer) => {
                    if (value !== undefined) {
                        validationContext.promptFieldsWithValue.add(pointer);
                    }
                    return value;
                };
                return visitor_1.visitJson(updatedData, visitor, schema, this._resolver, validate);
            }), operators_1.switchMap(updatedData => {
                if (validationOptions.withPrompts === false) {
                    return rxjs_1.of(updatedData);
                }
                const definitions = schemaInfo.promptDefinitions
                    .filter(def => !validationContext.promptFieldsWithValue.has(def.id));
                if (this._promptProvider && definitions.length > 0) {
                    return rxjs_1.from(this._applyPrompts(updatedData, definitions));
                }
                else {
                    return rxjs_1.of(updatedData);
                }
            }), operators_1.switchMap(updatedData => {
                const result = validate.call(validationContext, updatedData);
                return typeof result == 'boolean'
                    ? rxjs_1.of([updatedData, result])
                    : rxjs_1.from(result
                        .then(r => [updatedData, true])
                        .catch((err) => {
                        if (err.ajv) {
                            validate.errors = err.errors;
                            return Promise.resolve([updatedData, false]);
                        }
                        return Promise.reject(err);
                    }));
            }), operators_1.switchMap(([data, valid]) => {
                if (valid) {
                    let result = rxjs_1.of(data);
                    if (validationOptions.applyPostTransforms) {
                        // tslint:disable-next-line:no-any https://github.com/ReactiveX/rxjs/issues/3989
                        result = result.pipe(...[...this._post].map(visitor => operators_1.concatMap((data) => {
                            return visitor_1.visitJson(data, visitor, schema, this._resolver, validate);
                        })));
                    }
                    return result.pipe(operators_1.map(data => [data, valid]));
                }
                else {
                    return rxjs_1.of([data, valid]);
                }
            }), operators_1.map(([data, valid]) => {
                if (valid) {
                    return { data, success: true };
                }
                return {
                    data,
                    success: false,
                    errors: (validate.errors || []),
                };
            }));
        }));
    }
    addFormat(format) {
        // tslint:disable-next-line:no-any
        const validate = (data) => {
            const result = format.formatter.validate(data);
            if (typeof result == 'boolean') {
                return result;
            }
            else {
                return result.toPromise();
            }
        };
        this._ajv.addFormat(format.name, {
            async: format.formatter.async,
            validate,
        });
    }
    addSmartDefaultProvider(source, provider) {
        if (this._sourceMap.has(source)) {
            throw new Error(source);
        }
        this._sourceMap.set(source, provider);
        if (!this._smartDefaultKeyword) {
            this._smartDefaultKeyword = true;
            this._ajv.addKeyword('$default', {
                errors: false,
                valid: true,
                compile: (schema, _parentSchema, it) => {
                    const compilationSchemInfo = this._currentCompilationSchemaInfo;
                    if (compilationSchemInfo === undefined) {
                        return () => true;
                    }
                    // We cheat, heavily.
                    compilationSchemInfo.smartDefaultRecord.set(
                    // tslint:disable-next-line:no-any
                    JSON.stringify(it.dataPathArr.slice(1, it.dataLevel + 1)), schema);
                    return () => true;
                },
                metaSchema: {
                    type: 'object',
                    properties: {
                        '$source': { type: 'string' },
                    },
                    additionalProperties: true,
                    required: ['$source'],
                },
            });
        }
    }
    registerUriHandler(handler) {
        this._uriHandlers.add(handler);
    }
    usePromptProvider(provider) {
        const isSetup = !!this._promptProvider;
        this._promptProvider = provider;
        if (isSetup) {
            return;
        }
        this._ajv.addKeyword('x-prompt', {
            errors: false,
            valid: true,
            compile: (schema, parentSchema, it) => {
                const compilationSchemInfo = this._currentCompilationSchemaInfo;
                if (!compilationSchemInfo) {
                    return () => true;
                }
                // tslint:disable-next-line:no-any
                const pathArray = it.dataPathArr.slice(1, it.dataLevel + 1);
                const path = '/' + pathArray.map(p => p.replace(/^\'/, '').replace(/\'$/, '')).join('/');
                let type;
                let items;
                let message;
                if (typeof schema == 'string') {
                    message = schema;
                }
                else {
                    message = schema.message;
                    type = schema.type;
                    items = schema.items;
                }
                if (!type) {
                    if (parentSchema.type === 'boolean') {
                        type = 'confirmation';
                    }
                    else if (Array.isArray(parentSchema.enum)) {
                        type = 'list';
                    }
                    else {
                        type = 'input';
                    }
                }
                if (type === 'list' && !items) {
                    if (Array.isArray(parentSchema.enum)) {
                        type = 'list';
                        items = [];
                        for (const value of parentSchema.enum) {
                            if (typeof value == 'string') {
                                items.push(value);
                            }
                            else if (typeof value == 'object') {
                                // Invalid
                            }
                            else {
                                items.push({ label: value.toString(), value });
                            }
                        }
                    }
                }
                const definition = {
                    id: path,
                    type,
                    message,
                    priority: 0,
                    raw: schema,
                    items,
                    default: typeof parentSchema.default == 'object' ? undefined : parentSchema.default,
                    async validator(data) {
                        const result = it.self.validate(parentSchema, data);
                        if (typeof result === 'boolean') {
                            return result;
                        }
                        else {
                            try {
                                await result;
                                return true;
                            }
                            catch (_a) {
                                return false;
                            }
                        }
                    },
                };
                compilationSchemInfo.promptDefinitions.push(definition);
                return function () {
                    if (this) {
                        this.promptFieldsWithValue.add(path);
                    }
                    return true;
                };
            },
            metaSchema: {
                oneOf: [
                    { type: 'string' },
                    {
                        type: 'object',
                        properties: {
                            'type': { type: 'string' },
                            'message': { type: 'string' },
                        },
                        additionalProperties: true,
                        required: ['message'],
                    },
                ],
            },
        });
    }
    _applyPrompts(data, prompts) {
        const provider = this._promptProvider;
        if (!provider) {
            return rxjs_1.of(data);
        }
        prompts.sort((a, b) => b.priority - a.priority);
        return rxjs_1.from(provider(prompts)).pipe(operators_1.map(answers => {
            for (const path in answers) {
                const pathFragments = path.split('/').map(pf => {
                    if (/^\d+$/.test(pf)) {
                        return pf;
                    }
                    else {
                        return '\'' + pf + '\'';
                    }
                });
                CoreSchemaRegistry._set(data, pathFragments.slice(1), answers[path], null, undefined, true);
            }
            return data;
        }));
    }
    static _set(
    // tslint:disable-next-line:no-any
    data, fragments, value, 
    // tslint:disable-next-line:no-any
    parent = null, parentProperty, force) {
        for (let i = 0; i < fragments.length; i++) {
            const f = fragments[i];
            if (f[0] == 'i') {
                if (!Array.isArray(data)) {
                    return;
                }
                for (let j = 0; j < data.length; j++) {
                    CoreSchemaRegistry._set(data[j], fragments.slice(i + 1), value, data, '' + j);
                }
                return;
            }
            else if (f.startsWith('key')) {
                if (typeof data !== 'object') {
                    return;
                }
                Object.getOwnPropertyNames(data).forEach(property => {
                    CoreSchemaRegistry._set(data[property], fragments.slice(i + 1), value, data, property);
                });
                return;
            }
            else if (f.startsWith('\'') && f[f.length - 1] == '\'') {
                const property = f
                    .slice(1, -1)
                    .replace(/\\'/g, '\'')
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\f/g, '\f')
                    .replace(/\\t/g, '\t');
                // We know we need an object because the fragment is a property key.
                if (!data && parent !== null && parentProperty) {
                    data = parent[parentProperty] = {};
                }
                parent = data;
                parentProperty = property;
                data = data[property];
            }
            else {
                return;
            }
        }
        if (parent && parentProperty && (force || parent[parentProperty] === undefined)) {
            parent[parentProperty] = value;
        }
    }
    _applySmartDefaults(data, smartDefaults) {
        // tslint:disable-next-line:no-any https://github.com/ReactiveX/rxjs/issues/3989
        return rxjs_1.of(data).pipe(...[...smartDefaults.entries()].map(([pointer, schema]) => {
            return operators_1.concatMap(data => {
                const fragments = JSON.parse(pointer);
                const source = this._sourceMap.get(schema.$source);
                let value = source ? source(schema) : rxjs_1.of(undefined);
                if (!utils_1.isObservable(value)) {
                    value = rxjs_1.of(value);
                }
                return value.pipe(
                // Synchronously set the new data at the proper JsonSchema path.
                operators_1.tap(x => CoreSchemaRegistry._set(data, fragments, x)), 
                // But return the data object.
                operators_1.map(() => data));
            });
        }));
    }
}
exports.CoreSchemaRegistry = CoreSchemaRegistry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL2pzb24vc2NoZW1hL3JlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsMkJBQTJCO0FBQzNCLDZCQUE2QjtBQUM3QiwrQkFBd0Q7QUFDeEQsOENBQWdFO0FBQ2hFLDJCQUEyQjtBQUMzQix5REFBMEQ7QUFDMUQsdUNBQTBFO0FBQzFFLDRDQUE4RTtBQWU5RSx1Q0FBdUQ7QUFrQnZELE1BQWEseUJBQTBCLFNBQVEseUJBQWE7SUFHMUQsWUFDRSxNQUErQixFQUMvQixXQUFXLEdBQUcscURBQXFEO1FBRW5FLElBQUksQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDbEMsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFFbkMsT0FBTztTQUNSO1FBRUQsTUFBTSxRQUFRLEdBQUcseUJBQXlCLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xFLEtBQUssQ0FBQyxHQUFHLFdBQVcsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRU0sTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUErQjtRQUMxRCxJQUFJLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ2xDLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDbEMsSUFBSSxPQUFPLEdBQUcsYUFBYSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsT0FBTyxFQUFFLENB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LENBQUMsSUFBSSxDQUFDLENBQ2hCLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0NBQ0Y7QUF0b0JELGdEQXNvQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgKiBhcyBhanYgZnJvbSAnYWp2JztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBmcm9tLCBvZiwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY29uY2F0TWFwLCBtYXAsIHN3aXRjaE1hcCwgdGFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0ICogYXMgVXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uIH0gZnJvbSAnLi4vLi4vZXhjZXB0aW9uL2V4Y2VwdGlvbic7XG5pbXBvcnQgeyBQYXJ0aWFsbHlPcmRlcmVkU2V0LCBkZWVwQ29weSwgaXNPYnNlcnZhYmxlIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IHsgSnNvbkFycmF5LCBKc29uT2JqZWN0LCBKc29uVmFsdWUsIGlzSnNvbk9iamVjdCB9IGZyb20gJy4uL2ludGVyZmFjZSc7XG5pbXBvcnQge1xuICBKc29uUG9pbnRlcixcbiAgSnNvblZpc2l0b3IsXG4gIFByb21wdERlZmluaXRpb24sXG4gIFByb21wdFByb3ZpZGVyLFxuICBTY2hlbWFGb3JtYXQsXG4gIFNjaGVtYUZvcm1hdHRlcixcbiAgU2NoZW1hUmVnaXN0cnksXG4gIFNjaGVtYVZhbGlkYXRvcixcbiAgU2NoZW1hVmFsaWRhdG9yRXJyb3IsXG4gIFNjaGVtYVZhbGlkYXRvck9wdGlvbnMsXG4gIFNjaGVtYVZhbGlkYXRvclJlc3VsdCxcbiAgU21hcnREZWZhdWx0UHJvdmlkZXIsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IHZpc2l0SnNvbiwgdmlzaXRKc29uU2NoZW1hIH0gZnJvbSAnLi92aXNpdG9yJztcblxuLy8gVGhpcyBpbnRlcmZhY2Ugc2hvdWxkIGJlIGV4cG9ydGVkIGZyb20gYWp2LCBidXQgdGhleSBvbmx5IGV4cG9ydCB0aGUgY2xhc3MgYW5kIG5vdCB0aGUgdHlwZS5cbmludGVyZmFjZSBBanZWYWxpZGF0aW9uRXJyb3Ige1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIGVycm9yczogQXJyYXk8YWp2LkVycm9yT2JqZWN0PjtcbiAgYWp2OiB0cnVlO1xuICB2YWxpZGF0aW9uOiB0cnVlO1xufVxuXG5pbnRlcmZhY2UgQWp2UmVmTWFwIHtcbiAgcmVmczogc3RyaW5nW107XG4gIHJlZlZhbDogYW55OyAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLWFueVxuICBzY2hlbWE6IEpzb25PYmplY3Q7XG59XG5cbmV4cG9ydCB0eXBlIFVyaUhhbmRsZXIgPSAodXJpOiBzdHJpbmcpID0+IE9ic2VydmFibGU8SnNvbk9iamVjdD4gfCBudWxsIHwgdW5kZWZpbmVkO1xuXG5leHBvcnQgY2xhc3MgU2NoZW1hVmFsaWRhdGlvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBwdWJsaWMgcmVhZG9ubHkgZXJyb3JzOiBTY2hlbWFWYWxpZGF0b3JFcnJvcltdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGVycm9ycz86IFNjaGVtYVZhbGlkYXRvckVycm9yW10sXG4gICAgYmFzZU1lc3NhZ2UgPSAnU2NoZW1hIHZhbGlkYXRpb24gZmFpbGVkIHdpdGggdGhlIGZvbGxvd2luZyBlcnJvcnM6JyxcbiAgKSB7XG4gICAgaWYgKCFlcnJvcnMgfHwgZXJyb3JzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgc3VwZXIoJ1NjaGVtYSB2YWxpZGF0aW9uIGZhaWxlZC4nKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1lc3NhZ2VzID0gU2NoZW1hVmFsaWRhdGlvbkV4Y2VwdGlvbi5jcmVhdGVNZXNzYWdlcyhlcnJvcnMpO1xuICAgIHN1cGVyKGAke2Jhc2VNZXNzYWdlfVxcbiAgJHttZXNzYWdlcy5qb2luKCdcXG4gICcpfWApO1xuICAgIHRoaXMuZXJyb3JzID0gZXJyb3JzO1xuICB9XG5cbiAgcHVibGljIHN0YXRpYyBjcmVhdGVNZXNzYWdlcyhlcnJvcnM/OiBTY2hlbWFWYWxpZGF0b3JFcnJvcltdKTogc3RyaW5nW10ge1xuICAgIGlmICghZXJyb3JzIHx8IGVycm9ycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBtZXNzYWdlcyA9IGVycm9ycy5tYXAoKGVycikgPT4ge1xuICAgICAgbGV0IG1lc3NhZ2UgPSBgRGF0YSBwYXRoICR7SlNPTi5zdHJpbmdpZnkoZXJyLmRhdGFQYXRoKX0gJHtlcnIubWVzc2FnZX1gO1xuICAgICAgaWYgKGVyci5rZXl3b3JkID09PSAnYWRkaXRpb25hbFByb3BlcnRpZXMnKSB7XG4gICAgICAgIG1lc3NhZ2UgKz0gYCgke2Vyci5wYXJhbXMuYWRkaXRpb25hbFByb3BlcnR5fSlgO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbWVzc2FnZSArICcuJztcbiAgICB9KTtcblxuICAgIHJldHVybiBtZXNzYWdlcztcbiAgfVxufVxuXG5pbnRlcmZhY2UgU2NoZW1hSW5mbyB7XG4gIHNtYXJ0RGVmYXVsdFJlY29yZDogTWFwPHN0cmluZywgSnNvbk9iamVjdD47XG4gIHByb21wdERlZmluaXRpb25zOiBBcnJheTxQcm9tcHREZWZpbml0aW9uPjtcbn1cblxuZXhwb3J0IGNsYXNzIENvcmVTY2hlbWFSZWdpc3RyeSBpbXBsZW1lbnRzIFNjaGVtYVJlZ2lzdHJ5IHtcbiAgcHJpdmF0ZSBfYWp2OiBhanYuQWp2O1xuICBwcml2YXRlIF91cmlDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBKc29uT2JqZWN0PigpO1xuICBwcml2YXRlIF91cmlIYW5kbGVycyA9IG5ldyBTZXQ8VXJpSGFuZGxlcj4oKTtcbiAgcHJpdmF0ZSBfcHJlID0gbmV3IFBhcnRpYWxseU9yZGVyZWRTZXQ8SnNvblZpc2l0b3I+KCk7XG4gIHByaXZhdGUgX3Bvc3QgPSBuZXcgUGFydGlhbGx5T3JkZXJlZFNldDxKc29uVmlzaXRvcj4oKTtcblxuICBwcml2YXRlIF9jdXJyZW50Q29tcGlsYXRpb25TY2hlbWFJbmZvPzogU2NoZW1hSW5mbztcblxuICBwcml2YXRlIF9zbWFydERlZmF1bHRLZXl3b3JkID0gZmFsc2U7XG4gIHByaXZhdGUgX3Byb21wdFByb3ZpZGVyPzogUHJvbXB0UHJvdmlkZXI7XG4gIHByaXZhdGUgX3NvdXJjZU1hcCA9IG5ldyBNYXA8c3RyaW5nLCBTbWFydERlZmF1bHRQcm92aWRlcjx7fT4+KCk7XG5cbiAgY29uc3RydWN0b3IoZm9ybWF0czogU2NoZW1hRm9ybWF0W10gPSBbXSkge1xuICAgIC8qKlxuICAgICAqIEJ1aWxkIGFuIEFKViBpbnN0YW5jZSB0aGF0IHdpbGwgYmUgdXNlZCB0byB2YWxpZGF0ZSBzY2hlbWFzLlxuICAgICAqL1xuXG4gICAgY29uc3QgZm9ybWF0c09iajogeyBbbmFtZTogc3RyaW5nXTogU2NoZW1hRm9ybWF0dGVyIH0gPSB7fTtcblxuICAgIGZvciAoY29uc3QgZm9ybWF0IG9mIGZvcm1hdHMpIHtcbiAgICAgIGZvcm1hdHNPYmpbZm9ybWF0Lm5hbWVdID0gZm9ybWF0LmZvcm1hdHRlcjtcbiAgICB9XG5cbiAgICB0aGlzLl9hanYgPSBhanYoe1xuICAgICAgZm9ybWF0czogZm9ybWF0c09iaixcbiAgICAgIGxvYWRTY2hlbWE6ICh1cmk6IHN0cmluZykgPT4gdGhpcy5fZmV0Y2godXJpKSxcbiAgICAgIHNjaGVtYUlkOiAnYXV0bycsXG4gICAgICBwYXNzQ29udGV4dDogdHJ1ZSxcbiAgICB9KTtcblxuICAgIHRoaXMuX2Fqdi5hZGRNZXRhU2NoZW1hKHJlcXVpcmUoJ2Fqdi9saWIvcmVmcy9qc29uLXNjaGVtYS1kcmFmdC0wNC5qc29uJykpO1xuICAgIHRoaXMuX2Fqdi5hZGRNZXRhU2NoZW1hKHJlcXVpcmUoJ2Fqdi9saWIvcmVmcy9qc29uLXNjaGVtYS1kcmFmdC0wNi5qc29uJykpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZmV0Y2godXJpOiBzdHJpbmcpOiBQcm9taXNlPEpzb25PYmplY3Q+IHtcbiAgICBjb25zdCBtYXliZVNjaGVtYSA9IHRoaXMuX3VyaUNhY2hlLmdldCh1cmkpO1xuXG4gICAgaWYgKG1heWJlU2NoZW1hKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1heWJlU2NoZW1hKTtcbiAgICB9XG5cbiAgICAvLyBUcnkgYWxsIGhhbmRsZXJzLCBvbmUgYWZ0ZXIgdGhlIG90aGVyLlxuICAgIGZvciAoY29uc3QgbWF5YmVIYW5kbGVyIG9mIHRoaXMuX3VyaUhhbmRsZXJzKSB7XG4gICAgICBjb25zdCBoYW5kbGVyID0gbWF5YmVIYW5kbGVyKHVyaSk7XG4gICAgICBpZiAoaGFuZGxlcikge1xuICAgICAgICAvLyBUaGUgQUpWIEFQSSBvbmx5IHVuZGVyc3RhbmRzIFByb21pc2VzLlxuICAgICAgICByZXR1cm4gaGFuZGxlci5waXBlKFxuICAgICAgICAgIHRhcChqc29uID0+IHRoaXMuX3VyaUNhY2hlLnNldCh1cmksIGpzb24pKSxcbiAgICAgICAgKS50b1Byb21pc2UoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBub25lIGFyZSBmb3VuZCwgaGFuZGxlIHVzaW5nIGh0dHAgY2xpZW50LlxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxKc29uT2JqZWN0PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBodHRwLmdldCh1cmksIHJlcyA9PiB7XG4gICAgICAgIGlmICghcmVzLnN0YXR1c0NvZGUgfHwgcmVzLnN0YXR1c0NvZGUgPj0gMzAwKSB7XG4gICAgICAgICAgLy8gQ29uc3VtZSB0aGUgcmVzdCBvZiB0aGUgZGF0YSB0byBmcmVlIG1lbW9yeS5cbiAgICAgICAgICByZXMucmVzdW1lKCk7XG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgUmVxdWVzdCBmYWlsZWQuIFN0YXR1cyBDb2RlOiAke3Jlcy5zdGF0dXNDb2RlfWApKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXMuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICAgICAgICBsZXQgZGF0YSA9ICcnO1xuICAgICAgICAgIHJlcy5vbignZGF0YScsIGNodW5rID0+IHtcbiAgICAgICAgICAgIGRhdGEgKz0gY2h1bms7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVzLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBqc29uID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgICAgdGhpcy5fdXJpQ2FjaGUuc2V0KHVyaSwganNvbik7XG4gICAgICAgICAgICAgIHJlc29sdmUoanNvbik7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHRyYW5zZm9ybWF0aW9uIHN0ZXAgYmVmb3JlIHRoZSB2YWxpZGF0aW9uIG9mIGFueSBKc29uLlxuICAgKiBAcGFyYW0ge0pzb25WaXNpdG9yfSB2aXNpdG9yIFRoZSB2aXNpdG9yIHRvIHRyYW5zZm9ybSBldmVyeSB2YWx1ZS5cbiAgICogQHBhcmFtIHtKc29uVmlzaXRvcltdfSBkZXBzIEEgbGlzdCBvZiBvdGhlciB2aXNpdG9ycyB0byBydW4gYmVmb3JlLlxuICAgKi9cbiAgYWRkUHJlVHJhbnNmb3JtKHZpc2l0b3I6IEpzb25WaXNpdG9yLCBkZXBzPzogSnNvblZpc2l0b3JbXSkge1xuICAgIHRoaXMuX3ByZS5hZGQodmlzaXRvciwgZGVwcyk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgdHJhbnNmb3JtYXRpb24gc3RlcCBhZnRlciB0aGUgdmFsaWRhdGlvbiBvZiBhbnkgSnNvbi4gVGhlIEpTT04gd2lsbCBub3QgYmUgdmFsaWRhdGVkXG4gICAqIGFmdGVyIHRoZSBQT1NULCBzbyBpZiB0cmFuc2Zvcm1hdGlvbnMgYXJlIG5vdCBjb21wYXRpYmxlIHdpdGggdGhlIFNjaGVtYSBpdCB3aWxsIG5vdCByZXN1bHRcbiAgICogaW4gYW4gZXJyb3IuXG4gICAqIEBwYXJhbSB7SnNvblZpc2l0b3J9IHZpc2l0b3IgVGhlIHZpc2l0b3IgdG8gdHJhbnNmb3JtIGV2ZXJ5IHZhbHVlLlxuICAgKiBAcGFyYW0ge0pzb25WaXNpdG9yW119IGRlcHMgQSBsaXN0IG9mIG90aGVyIHZpc2l0b3JzIHRvIHJ1biBiZWZvcmUuXG4gICAqL1xuICBhZGRQb3N0VHJhbnNmb3JtKHZpc2l0b3I6IEpzb25WaXNpdG9yLCBkZXBzPzogSnNvblZpc2l0b3JbXSkge1xuICAgIHRoaXMuX3Bvc3QuYWRkKHZpc2l0b3IsIGRlcHMpO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9yZXNvbHZlcihcbiAgICByZWY6IHN0cmluZyxcbiAgICB2YWxpZGF0ZTogYWp2LlZhbGlkYXRlRnVuY3Rpb24sXG4gICk6IHsgY29udGV4dD86IGFqdi5WYWxpZGF0ZUZ1bmN0aW9uLCBzY2hlbWE/OiBKc29uT2JqZWN0IH0ge1xuICAgIGlmICghdmFsaWRhdGUgfHwgIXZhbGlkYXRlLnJlZnMgfHwgIXZhbGlkYXRlLnJlZlZhbCB8fCAhcmVmKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgbGV0IHJlZk1hcCA9IHZhbGlkYXRlIGFzIEFqdlJlZk1hcDtcbiAgICBjb25zdCByb290UmVmTWFwID0gdmFsaWRhdGUucm9vdCBhcyBBanZSZWZNYXA7XG5cbiAgICAvLyBSZXNvbHZlIGZyb20gdGhlIHJvb3QgaWYgaXQncyBkaWZmZXJlbnQuXG4gICAgaWYgKHZhbGlkYXRlLnJvb3QgJiYgdmFsaWRhdGUuc2NoZW1hICE9PSByb290UmVmTWFwLnNjaGVtYSkge1xuICAgICAgcmVmTWFwID0gcm9vdFJlZk1hcDtcbiAgICB9XG5cbiAgICBjb25zdCBzY2hlbWEgPSByZWZNYXAuc2NoZW1hID8gdHlwZW9mIHJlZk1hcC5zY2hlbWEgPT0gJ29iamVjdCcgJiYgcmVmTWFwLnNjaGVtYSA6IG51bGw7XG4gICAgY29uc3QgbWF5YmVJZCA9IHNjaGVtYSA/IChzY2hlbWEgYXMgSnNvbk9iamVjdCkuaWQgfHwgKHNjaGVtYSBhcyBKc29uT2JqZWN0KS4kaWQgOiBudWxsO1xuXG4gICAgaWYgKHR5cGVvZiBtYXliZUlkID09ICdzdHJpbmcnKSB7XG4gICAgICByZWYgPSBVcmwucmVzb2x2ZShtYXliZUlkLCByZWYpO1xuICAgIH1cblxuICAgIGxldCBmdWxsUmVmZXJlbmNlID0gKHJlZlswXSA9PT0gJyMnICYmIG1heWJlSWQpID8gbWF5YmVJZCArIHJlZiA6IHJlZjtcbiAgICBpZiAoZnVsbFJlZmVyZW5jZS5lbmRzV2l0aCgnIycpKSB7XG4gICAgICBmdWxsUmVmZXJlbmNlID0gZnVsbFJlZmVyZW5jZS5zbGljZSgwLCAtMSk7XG4gICAgfVxuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIGNvbnN0IGNvbnRleHQgPSB2YWxpZGF0ZS5yZWZWYWxbKHZhbGlkYXRlLnJlZnMgYXMgYW55KVtmdWxsUmVmZXJlbmNlXV07XG5cbiAgICBpZiAodHlwZW9mIGNvbnRleHQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gQ29udGV4dCB3aWxsIGJlIGEgZnVuY3Rpb24gaWYgdGhlIHNjaGVtYSBpc24ndCBsb2FkZWQgeWV0LCBhbmQgYW4gYWN0dWFsIHNjaGVtYSBpZiBpdCdzXG4gICAgICAvLyBzeW5jaHJvbm91c2x5IGF2YWlsYWJsZS5cbiAgICAgIHJldHVybiB7IGNvbnRleHQsIHNjaGVtYTogY29udGV4dCAmJiBjb250ZXh0LnNjaGVtYSBhcyBKc29uT2JqZWN0IH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7IGNvbnRleHQ6IHZhbGlkYXRlLCBzY2hlbWE6IGNvbnRleHQgYXMgSnNvbk9iamVjdCB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGbGF0dGVuIHRoZSBTY2hlbWEsIHJlc29sdmluZyBhbmQgcmVwbGFjaW5nIGFsbCB0aGUgcmVmcy4gTWFrZXMgaXQgaW50byBhIHN5bmNocm9ub3VzIHNjaGVtYVxuICAgKiB0aGF0IGlzIGFsc28gZWFzaWVyIHRvIHRyYXZlcnNlLiBEb2VzIG5vdCBjYWNoZSB0aGUgcmVzdWx0LlxuICAgKlxuICAgKiBAcGFyYW0gc2NoZW1hIFRoZSBzY2hlbWEgb3IgVVJJIHRvIGZsYXR0ZW4uXG4gICAqIEByZXR1cm5zIEFuIE9ic2VydmFibGUgb2YgdGhlIGZsYXR0ZW5lZCBzY2hlbWEgb2JqZWN0LlxuICAgKi9cbiAgZmxhdHRlbihzY2hlbWE6IEpzb25PYmplY3QpOiBPYnNlcnZhYmxlPEpzb25PYmplY3Q+IHtcbiAgICB0aGlzLl9hanYucmVtb3ZlU2NoZW1hKHNjaGVtYSk7XG5cbiAgICAvLyBTdXBwb3J0cyBib3RoIHN5bmNocm9ub3VzIGFuZCBhc3luY2hyb25vdXMgY29tcGlsYXRpb24sIGJ5IHRyeWluZyB0aGUgc3luY2hyb25vdXNcbiAgICAvLyB2ZXJzaW9uIGZpcnN0LCB0aGVuIGlmIHJlZnMgYXJlIG1pc3NpbmcgdGhpcyB3aWxsIGZhaWxzLlxuICAgIC8vIFdlIGFsc28gYWRkIGFueSByZWZzIGZyb20gZXh0ZXJuYWwgZmV0Y2hlZCBzY2hlbWFzIHNvIHRoYXQgdGhvc2Ugd2lsbCBhbHNvIGJlIHVzZWRcbiAgICAvLyBpbiBzeW5jaHJvbm91cyAoaWYgYXZhaWxhYmxlKS5cbiAgICBsZXQgdmFsaWRhdG9yOiBPYnNlcnZhYmxlPGFqdi5WYWxpZGF0ZUZ1bmN0aW9uPjtcbiAgICB0cnkge1xuICAgICAgdGhpcy5fY3VycmVudENvbXBpbGF0aW9uU2NoZW1hSW5mbyA9IHVuZGVmaW5lZDtcbiAgICAgIHZhbGlkYXRvciA9IG9mKHRoaXMuX2Fqdi5jb21waWxlKHNjaGVtYSkpLnBpcGUoXG4gICAgICAgIHRhcCgoKSA9PiB0aGlzLl9jdXJyZW50Q29tcGlsYXRpb25TY2hlbWFJbmZvID0gdW5kZWZpbmVkKSxcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gUHJvcGFnYXRlIHRoZSBlcnJvci5cbiAgICAgIGlmICghKGUgaW5zdGFuY2VvZiAoYWp2Lk1pc3NpbmdSZWZFcnJvciBhcyB7fSBhcyBGdW5jdGlvbikpKSB7XG4gICAgICAgIHJldHVybiB0aHJvd0Vycm9yKGUpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9jdXJyZW50Q29tcGlsYXRpb25TY2hlbWFJbmZvID0gdW5kZWZpbmVkO1xuICAgICAgdmFsaWRhdG9yID0gZnJvbSh0aGlzLl9hanYuY29tcGlsZUFzeW5jKHNjaGVtYSkpLnBpcGUoXG4gICAgICAgIHRhcCgoKSA9PiB0aGlzLl9jdXJyZW50Q29tcGlsYXRpb25TY2hlbWFJbmZvID0gdW5kZWZpbmVkKSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbGlkYXRvci5waXBlKFxuICAgICAgc3dpdGNoTWFwKHZhbGlkYXRlID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgZnVuY3Rpb24gdmlzaXRvcihcbiAgICAgICAgICBjdXJyZW50OiBKc29uT2JqZWN0IHwgSnNvbkFycmF5LFxuICAgICAgICAgIHBvaW50ZXI6IEpzb25Qb2ludGVyLFxuICAgICAgICAgIHBhcmVudFNjaGVtYT86IEpzb25PYmplY3QgfCBKc29uQXJyYXksXG4gICAgICAgICAgaW5kZXg/OiBzdHJpbmcsXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChjdXJyZW50XG4gICAgICAgICAgICAmJiBwYXJlbnRTY2hlbWFcbiAgICAgICAgICAgICYmIGluZGV4XG4gICAgICAgICAgICAmJiBpc0pzb25PYmplY3QoY3VycmVudClcbiAgICAgICAgICAgICYmIGN1cnJlbnQuaGFzT3duUHJvcGVydHkoJyRyZWYnKVxuICAgICAgICAgICAgJiYgdHlwZW9mIGN1cnJlbnRbJyRyZWYnXSA9PSAnc3RyaW5nJ1xuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSBzZWxmLl9yZXNvbHZlcihjdXJyZW50WyckcmVmJ10gYXMgc3RyaW5nLCB2YWxpZGF0ZSk7XG5cbiAgICAgICAgICAgIGlmIChyZXNvbHZlZC5zY2hlbWEpIHtcbiAgICAgICAgICAgICAgKHBhcmVudFNjaGVtYSBhcyBKc29uT2JqZWN0KVtpbmRleF0gPSByZXNvbHZlZC5zY2hlbWE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2NoZW1hID0gZGVlcENvcHkodmFsaWRhdGUuc2NoZW1hIGFzIEpzb25PYmplY3QpO1xuICAgICAgICB2aXNpdEpzb25TY2hlbWEoc2NoZW1hLCB2aXNpdG9yKTtcblxuICAgICAgICByZXR1cm4gb2Yoc2NoZW1hKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGlsZSBhbmQgcmV0dXJuIGEgdmFsaWRhdGlvbiBmdW5jdGlvbiBmb3IgdGhlIFNjaGVtYS5cbiAgICpcbiAgICogQHBhcmFtIHNjaGVtYSBUaGUgc2NoZW1hIHRvIHZhbGlkYXRlLiBJZiBhIHN0cmluZywgd2lsbCBmZXRjaCB0aGUgc2NoZW1hIGJlZm9yZSBjb21waWxpbmcgaXRcbiAgICogKHVzaW5nIHNjaGVtYSBhcyBhIFVSSSkuXG4gICAqIEByZXR1cm5zIEFuIE9ic2VydmFibGUgb2YgdGhlIFZhbGlkYXRpb24gZnVuY3Rpb24uXG4gICAqL1xuICBjb21waWxlKHNjaGVtYTogSnNvbk9iamVjdCk6IE9ic2VydmFibGU8U2NoZW1hVmFsaWRhdG9yPiB7XG4gICAgY29uc3Qgc2NoZW1hSW5mbzogU2NoZW1hSW5mbyA9IHtcbiAgICAgIHNtYXJ0RGVmYXVsdFJlY29yZDogbmV3IE1hcDxzdHJpbmcsIEpzb25PYmplY3Q+KCksXG4gICAgICBwcm9tcHREZWZpbml0aW9uczogW10sXG4gICAgfTtcblxuICAgIHRoaXMuX2Fqdi5yZW1vdmVTY2hlbWEoc2NoZW1hKTtcblxuICAgIC8vIFN1cHBvcnRzIGJvdGggc3luY2hyb25vdXMgYW5kIGFzeW5jaHJvbm91cyBjb21waWxhdGlvbiwgYnkgdHJ5aW5nIHRoZSBzeW5jaHJvbm91c1xuICAgIC8vIHZlcnNpb24gZmlyc3QsIHRoZW4gaWYgcmVmcyBhcmUgbWlzc2luZyB0aGlzIHdpbGwgZmFpbHMuXG4gICAgLy8gV2UgYWxzbyBhZGQgYW55IHJlZnMgZnJvbSBleHRlcm5hbCBmZXRjaGVkIHNjaGVtYXMgc28gdGhhdCB0aG9zZSB3aWxsIGFsc28gYmUgdXNlZFxuICAgIC8vIGluIHN5bmNocm9ub3VzIChpZiBhdmFpbGFibGUpLlxuICAgIGxldCB2YWxpZGF0b3I6IE9ic2VydmFibGU8YWp2LlZhbGlkYXRlRnVuY3Rpb24+O1xuICAgIHRyeSB7XG4gICAgICB0aGlzLl9jdXJyZW50Q29tcGlsYXRpb25TY2hlbWFJbmZvID0gc2NoZW1hSW5mbztcbiAgICAgIHZhbGlkYXRvciA9IG9mKHRoaXMuX2Fqdi5jb21waWxlKHNjaGVtYSkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIFByb3BhZ2F0ZSB0aGUgZXJyb3IuXG4gICAgICBpZiAoIShlIGluc3RhbmNlb2YgKGFqdi5NaXNzaW5nUmVmRXJyb3IgYXMge30gYXMgRnVuY3Rpb24pKSkge1xuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihlKTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgdmFsaWRhdG9yID0gZnJvbSh0aGlzLl9hanYuY29tcGlsZUFzeW5jKHNjaGVtYSkpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsaWRhdG9yXG4gICAgICAucGlwZShcbiAgICAgICAgbWFwKHZhbGlkYXRlID0+IChkYXRhOiBKc29uVmFsdWUsIG9wdGlvbnM/OiBTY2hlbWFWYWxpZGF0b3JPcHRpb25zKSA9PiB7XG4gICAgICAgICAgY29uc3QgdmFsaWRhdGlvbk9wdGlvbnM6IFNjaGVtYVZhbGlkYXRvck9wdGlvbnMgPSB7XG4gICAgICAgICAgICB3aXRoUHJvbXB0czogdHJ1ZSxcbiAgICAgICAgICAgIGFwcGx5UG9zdFRyYW5zZm9ybXM6IHRydWUsXG4gICAgICAgICAgICBhcHBseVByZVRyYW5zZm9ybXM6IHRydWUsXG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgIH07XG4gICAgICAgICAgY29uc3QgdmFsaWRhdGlvbkNvbnRleHQgPSB7XG4gICAgICAgICAgICBwcm9tcHRGaWVsZHNXaXRoVmFsdWU6IG5ldyBTZXQ8c3RyaW5nPigpLFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBsZXQgcmVzdWx0ID0gb2YoZGF0YSk7XG4gICAgICAgICAgaWYgKHZhbGlkYXRpb25PcHRpb25zLmFwcGx5UHJlVHJhbnNmb3Jtcykge1xuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueSBodHRwczovL2dpdGh1Yi5jb20vUmVhY3RpdmVYL3J4anMvaXNzdWVzLzM5ODlcbiAgICAgICAgICAgIHJlc3VsdCA9IChyZXN1bHQgYXMgYW55KS5waXBlKFxuICAgICAgICAgICAgICAuLi5bLi4udGhpcy5fcHJlXS5tYXAodmlzaXRvciA9PiBjb25jYXRNYXAoKGRhdGE6IEpzb25WYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB2aXNpdEpzb24oZGF0YSwgdmlzaXRvciwgc2NoZW1hLCB0aGlzLl9yZXNvbHZlciwgdmFsaWRhdGUpO1xuICAgICAgICAgICAgICB9KSksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZXN1bHQucGlwZShcbiAgICAgICAgICAgIHN3aXRjaE1hcCh1cGRhdGVEYXRhID0+IHRoaXMuX2FwcGx5U21hcnREZWZhdWx0cyhcbiAgICAgICAgICAgICAgdXBkYXRlRGF0YSxcbiAgICAgICAgICAgICAgc2NoZW1hSW5mby5zbWFydERlZmF1bHRSZWNvcmQsXG4gICAgICAgICAgICApKSxcbiAgICAgICAgICAgIHN3aXRjaE1hcCh1cGRhdGVkRGF0YSA9PiB7XG4gICAgICAgICAgICAgIGlmICh2YWxpZGF0aW9uT3B0aW9ucy53aXRoUHJvbXB0cyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2YodXBkYXRlZERhdGEpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgdmlzaXRvcjogSnNvblZpc2l0b3IgPSAodmFsdWUsIHBvaW50ZXIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbkNvbnRleHQucHJvbXB0RmllbGRzV2l0aFZhbHVlLmFkZChwb2ludGVyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHZpc2l0SnNvbih1cGRhdGVkRGF0YSwgdmlzaXRvciwgc2NoZW1hLCB0aGlzLl9yZXNvbHZlciwgdmFsaWRhdGUpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBzd2l0Y2hNYXAodXBkYXRlZERhdGEgPT4ge1xuICAgICAgICAgICAgICBpZiAodmFsaWRhdGlvbk9wdGlvbnMud2l0aFByb21wdHMgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9mKHVwZGF0ZWREYXRhKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IGRlZmluaXRpb25zID0gc2NoZW1hSW5mby5wcm9tcHREZWZpbml0aW9uc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoZGVmID0+ICF2YWxpZGF0aW9uQ29udGV4dC5wcm9tcHRGaWVsZHNXaXRoVmFsdWUuaGFzKGRlZi5pZCkpO1xuXG4gICAgICAgICAgICAgIGlmICh0aGlzLl9wcm9tcHRQcm92aWRlciAmJiBkZWZpbml0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZyb20odGhpcy5fYXBwbHlQcm9tcHRzKHVwZGF0ZWREYXRhLCBkZWZpbml0aW9ucykpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBvZih1cGRhdGVkRGF0YSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgc3dpdGNoTWFwKHVwZGF0ZWREYXRhID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGUuY2FsbCh2YWxpZGF0aW9uQ29udGV4dCwgdXBkYXRlZERhdGEpO1xuXG4gICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgcmVzdWx0ID09ICdib29sZWFuJ1xuICAgICAgICAgICAgICAgID8gb2YoW3VwZGF0ZWREYXRhLCByZXN1bHRdKVxuICAgICAgICAgICAgICAgIDogZnJvbSgocmVzdWx0IGFzIFByb21pc2U8Ym9vbGVhbj4pXG4gICAgICAgICAgICAgICAgICAudGhlbihyID0+IFt1cGRhdGVkRGF0YSwgdHJ1ZV0pXG4gICAgICAgICAgICAgICAgICAuY2F0Y2goKGVycjogRXJyb3IgfCBBanZWYWxpZGF0aW9uRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChlcnIgYXMgQWp2VmFsaWRhdGlvbkVycm9yKS5hanYpIHtcbiAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0ZS5lcnJvcnMgPSAoZXJyIGFzIEFqdlZhbGlkYXRpb25FcnJvcikuZXJyb3JzO1xuXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbdXBkYXRlZERhdGEsIGZhbHNlXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgc3dpdGNoTWFwKChbZGF0YSwgdmFsaWRdOiBbSnNvblZhbHVlLCBib29sZWFuXSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodmFsaWQpIHtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gb2YoZGF0YSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodmFsaWRhdGlvbk9wdGlvbnMuYXBwbHlQb3N0VHJhbnNmb3Jtcykge1xuICAgICAgICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueSBodHRwczovL2dpdGh1Yi5jb20vUmVhY3RpdmVYL3J4anMvaXNzdWVzLzM5ODlcbiAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IChyZXN1bHQgYXMgYW55KS5waXBlKFxuICAgICAgICAgICAgICAgICAgICAuLi5bLi4udGhpcy5fcG9zdF0ubWFwKHZpc2l0b3IgPT4gY29uY2F0TWFwKChkYXRhOiBKc29uVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmlzaXRKc29uKGRhdGEsIHZpc2l0b3IsIHNjaGVtYSwgdGhpcy5fcmVzb2x2ZXIsIHZhbGlkYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgfSkpLFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnBpcGUoXG4gICAgICAgICAgICAgICAgICBtYXAoZGF0YSA9PiBbZGF0YSwgdmFsaWRdKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBvZihbZGF0YSwgdmFsaWRdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBtYXAoKFtkYXRhLCB2YWxpZF06IFtKc29uVmFsdWUsIGJvb2xlYW5dKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh2YWxpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGRhdGEsIHN1Y2Nlc3M6IHRydWUgfSBhcyBTY2hlbWFWYWxpZGF0b3JSZXN1bHQ7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3JzOiAodmFsaWRhdGUuZXJyb3JzIHx8IFtdKSxcbiAgICAgICAgICAgICAgfSBhcyBTY2hlbWFWYWxpZGF0b3JSZXN1bHQ7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gIH1cblxuICBhZGRGb3JtYXQoZm9ybWF0OiBTY2hlbWFGb3JtYXQpOiB2b2lkIHtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgY29uc3QgdmFsaWRhdGUgPSAoZGF0YTogYW55KSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBmb3JtYXQuZm9ybWF0dGVyLnZhbGlkYXRlKGRhdGEpO1xuXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZXN1bHQudG9Qcm9taXNlKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX2Fqdi5hZGRGb3JtYXQoZm9ybWF0Lm5hbWUsIHtcbiAgICAgIGFzeW5jOiBmb3JtYXQuZm9ybWF0dGVyLmFzeW5jLFxuICAgICAgdmFsaWRhdGUsXG4gICAgLy8gQUpWIHR5cGluZ3MgbGlzdCBgY29tcGFyZWAgYXMgcmVxdWlyZWQsIGJ1dCBpdCBpcyBvcHRpb25hbC5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgfSBhcyBhbnkpO1xuICB9XG5cbiAgYWRkU21hcnREZWZhdWx0UHJvdmlkZXI8VD4oc291cmNlOiBzdHJpbmcsIHByb3ZpZGVyOiBTbWFydERlZmF1bHRQcm92aWRlcjxUPikge1xuICAgIGlmICh0aGlzLl9zb3VyY2VNYXAuaGFzKHNvdXJjZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihzb3VyY2UpO1xuICAgIH1cblxuICAgIHRoaXMuX3NvdXJjZU1hcC5zZXQoc291cmNlLCBwcm92aWRlcik7XG5cbiAgICBpZiAoIXRoaXMuX3NtYXJ0RGVmYXVsdEtleXdvcmQpIHtcbiAgICAgIHRoaXMuX3NtYXJ0RGVmYXVsdEtleXdvcmQgPSB0cnVlO1xuXG4gICAgICB0aGlzLl9hanYuYWRkS2V5d29yZCgnJGRlZmF1bHQnLCB7XG4gICAgICAgIGVycm9yczogZmFsc2UsXG4gICAgICAgIHZhbGlkOiB0cnVlLFxuICAgICAgICBjb21waWxlOiAoc2NoZW1hLCBfcGFyZW50U2NoZW1hLCBpdCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNvbXBpbGF0aW9uU2NoZW1JbmZvID0gdGhpcy5fY3VycmVudENvbXBpbGF0aW9uU2NoZW1hSW5mbztcbiAgICAgICAgICBpZiAoY29tcGlsYXRpb25TY2hlbUluZm8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gV2UgY2hlYXQsIGhlYXZpbHkuXG4gICAgICAgICAgY29tcGlsYXRpb25TY2hlbUluZm8uc21hcnREZWZhdWx0UmVjb3JkLnNldChcbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KChpdCBhcyBhbnkpLmRhdGFQYXRoQXJyLnNsaWNlKDEsIChpdCBhcyBhbnkpLmRhdGFMZXZlbCArIDEpIGFzIHN0cmluZ1tdKSxcbiAgICAgICAgICAgIHNjaGVtYSxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuICgpID0+IHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIG1ldGFTY2hlbWE6IHtcbiAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAnJHNvdXJjZSc6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiB0cnVlLFxuICAgICAgICAgIHJlcXVpcmVkOiBbICckc291cmNlJyBdLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXJVcmlIYW5kbGVyKGhhbmRsZXI6IFVyaUhhbmRsZXIpIHtcbiAgICB0aGlzLl91cmlIYW5kbGVycy5hZGQoaGFuZGxlcik7XG4gIH1cblxuICB1c2VQcm9tcHRQcm92aWRlcihwcm92aWRlcjogUHJvbXB0UHJvdmlkZXIpIHtcbiAgICBjb25zdCBpc1NldHVwID0gISF0aGlzLl9wcm9tcHRQcm92aWRlcjtcblxuICAgIHRoaXMuX3Byb21wdFByb3ZpZGVyID0gcHJvdmlkZXI7XG5cbiAgICBpZiAoaXNTZXR1cCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2Fqdi5hZGRLZXl3b3JkKCd4LXByb21wdCcsIHtcbiAgICAgIGVycm9yczogZmFsc2UsXG4gICAgICB2YWxpZDogdHJ1ZSxcbiAgICAgIGNvbXBpbGU6IChzY2hlbWEsIHBhcmVudFNjaGVtYTogSnNvbk9iamVjdCwgaXQpID0+IHtcbiAgICAgICAgY29uc3QgY29tcGlsYXRpb25TY2hlbUluZm8gPSB0aGlzLl9jdXJyZW50Q29tcGlsYXRpb25TY2hlbWFJbmZvO1xuICAgICAgICBpZiAoIWNvbXBpbGF0aW9uU2NoZW1JbmZvKSB7XG4gICAgICAgICAgcmV0dXJuICgpID0+IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgICAgIGNvbnN0IHBhdGhBcnJheSA9ICgoaXQgYXMgYW55KS5kYXRhUGF0aEFyciBhcyBzdHJpbmdbXSkuc2xpY2UoMSwgaXQuZGF0YUxldmVsICsgMSk7XG4gICAgICAgIGNvbnN0IHBhdGggPSAnLycgKyBwYXRoQXJyYXkubWFwKHAgPT4gcC5yZXBsYWNlKC9eXFwnLywgJycpLnJlcGxhY2UoL1xcJyQvLCAnJykpLmpvaW4oJy8nKTtcblxuICAgICAgICBsZXQgdHlwZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgICBsZXQgaXRlbXM6IEFycmF5PHN0cmluZyB8IHsgbGFiZWw6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfT4gfCB1bmRlZmluZWQ7XG4gICAgICAgIGxldCBtZXNzYWdlOiBzdHJpbmc7XG4gICAgICAgIGlmICh0eXBlb2Ygc2NoZW1hID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgbWVzc2FnZSA9IHNjaGVtYTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtZXNzYWdlID0gc2NoZW1hLm1lc3NhZ2U7XG4gICAgICAgICAgdHlwZSA9IHNjaGVtYS50eXBlO1xuICAgICAgICAgIGl0ZW1zID0gc2NoZW1hLml0ZW1zO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgaWYgKHBhcmVudFNjaGVtYS50eXBlID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnY29uZmlybWF0aW9uJztcbiAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocGFyZW50U2NoZW1hLmVudW0pKSB7XG4gICAgICAgICAgICB0eXBlID0gJ2xpc3QnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0eXBlID0gJ2lucHV0JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZSA9PT0gJ2xpc3QnICYmICFpdGVtcykge1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmVudFNjaGVtYS5lbnVtKSkge1xuICAgICAgICAgICAgdHlwZSA9ICdsaXN0JztcbiAgICAgICAgICAgIGl0ZW1zID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIHBhcmVudFNjaGVtYS5lbnVtKSB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAvLyBJbnZhbGlkXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaXRlbXMucHVzaCh7IGxhYmVsOiB2YWx1ZS50b1N0cmluZygpLCB2YWx1ZSB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRlZmluaXRpb246IFByb21wdERlZmluaXRpb24gPSB7XG4gICAgICAgICAgaWQ6IHBhdGgsXG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIHByaW9yaXR5OiAwLFxuICAgICAgICAgIHJhdzogc2NoZW1hLFxuICAgICAgICAgIGl0ZW1zLFxuICAgICAgICAgIGRlZmF1bHQ6IHR5cGVvZiBwYXJlbnRTY2hlbWEuZGVmYXVsdCA9PSAnb2JqZWN0JyA/IHVuZGVmaW5lZCA6IHBhcmVudFNjaGVtYS5kZWZhdWx0LFxuICAgICAgICAgIGFzeW5jIHZhbGlkYXRvcihkYXRhOiBzdHJpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGl0LnNlbGYudmFsaWRhdGUocGFyZW50U2NoZW1hLCBkYXRhKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVzdWx0O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG5cbiAgICAgICAgY29tcGlsYXRpb25TY2hlbUluZm8ucHJvbXB0RGVmaW5pdGlvbnMucHVzaChkZWZpbml0aW9uKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24odGhpczogeyBwcm9tcHRGaWVsZHNXaXRoVmFsdWU6IFNldDxzdHJpbmc+IH0pIHtcbiAgICAgICAgICBpZiAodGhpcykge1xuICAgICAgICAgICAgdGhpcy5wcm9tcHRGaWVsZHNXaXRoVmFsdWUuYWRkKHBhdGgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgICAgfSxcbiAgICAgIG1ldGFTY2hlbWE6IHtcbiAgICAgICAgb25lT2Y6IFtcbiAgICAgICAgICB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICd0eXBlJzogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgICAnbWVzc2FnZSc6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhZGRpdGlvbmFsUHJvcGVydGllczogdHJ1ZSxcbiAgICAgICAgICAgIHJlcXVpcmVkOiBbICdtZXNzYWdlJyBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfYXBwbHlQcm9tcHRzPFQ+KGRhdGE6IFQsIHByb21wdHM6IEFycmF5PFByb21wdERlZmluaXRpb24+KTogT2JzZXJ2YWJsZTxUPiB7XG4gICAgY29uc3QgcHJvdmlkZXIgPSB0aGlzLl9wcm9tcHRQcm92aWRlcjtcbiAgICBpZiAoIXByb3ZpZGVyKSB7XG4gICAgICByZXR1cm4gb2YoZGF0YSk7XG4gICAgfVxuXG4gICAgcHJvbXB0cy5zb3J0KChhLCBiKSA9PiBiLnByaW9yaXR5IC0gYS5wcmlvcml0eSk7XG5cbiAgICByZXR1cm4gZnJvbShwcm92aWRlcihwcm9tcHRzKSkucGlwZShcbiAgICAgIG1hcChhbnN3ZXJzID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBwYXRoIGluIGFuc3dlcnMpIHtcbiAgICAgICAgICBjb25zdCBwYXRoRnJhZ21lbnRzID0gcGF0aC5zcGxpdCgnLycpLm1hcChwZiA9PiB7XG4gICAgICAgICAgICBpZiAoL15cXGQrJC8udGVzdChwZikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHBmO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdcXCcnICsgcGYgKyAnXFwnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIENvcmVTY2hlbWFSZWdpc3RyeS5fc2V0KFxuICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgIHBhdGhGcmFnbWVudHMuc2xpY2UoMSksXG4gICAgICAgICAgICBhbnN3ZXJzW3BhdGhdIGFzIHt9LFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9zZXQoXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIGRhdGE6IGFueSxcbiAgICBmcmFnbWVudHM6IHN0cmluZ1tdLFxuICAgIHZhbHVlOiB7fSxcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgcGFyZW50OiBhbnkgfCBudWxsID0gbnVsbCxcbiAgICBwYXJlbnRQcm9wZXJ0eT86IHN0cmluZyxcbiAgICBmb3JjZT86IGJvb2xlYW4sXG4gICk6IHZvaWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJhZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBmID0gZnJhZ21lbnRzW2ldO1xuXG4gICAgICBpZiAoZlswXSA9PSAnaScpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkYXRhLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgQ29yZVNjaGVtYVJlZ2lzdHJ5Ll9zZXQoZGF0YVtqXSwgZnJhZ21lbnRzLnNsaWNlKGkgKyAxKSwgdmFsdWUsIGRhdGEsICcnICsgaik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm47XG4gICAgICB9IGVsc2UgaWYgKGYuc3RhcnRzV2l0aCgna2V5JykpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGRhdGEpLmZvckVhY2gocHJvcGVydHkgPT4ge1xuICAgICAgICAgIENvcmVTY2hlbWFSZWdpc3RyeS5fc2V0KGRhdGFbcHJvcGVydHldLCBmcmFnbWVudHMuc2xpY2UoaSArIDEpLCB2YWx1ZSwgZGF0YSwgcHJvcGVydHkpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9IGVsc2UgaWYgKGYuc3RhcnRzV2l0aCgnXFwnJykgJiYgZltmLmxlbmd0aCAtIDFdID09ICdcXCcnKSB7XG4gICAgICAgIGNvbnN0IHByb3BlcnR5ID0gZlxuICAgICAgICAgIC5zbGljZSgxLCAtMSlcbiAgICAgICAgICAucmVwbGFjZSgvXFxcXCcvZywgJ1xcJycpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXFxcci9nLCAnXFxyJylcbiAgICAgICAgICAucmVwbGFjZSgvXFxcXGYvZywgJ1xcZicpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcXFx0L2csICdcXHQnKTtcblxuICAgICAgICAvLyBXZSBrbm93IHdlIG5lZWQgYW4gb2JqZWN0IGJlY2F1c2UgdGhlIGZyYWdtZW50IGlzIGEgcHJvcGVydHkga2V5LlxuICAgICAgICBpZiAoIWRhdGEgJiYgcGFyZW50ICE9PSBudWxsICYmIHBhcmVudFByb3BlcnR5KSB7XG4gICAgICAgICAgZGF0YSA9IHBhcmVudFtwYXJlbnRQcm9wZXJ0eV0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBwYXJlbnQgPSBkYXRhO1xuICAgICAgICBwYXJlbnRQcm9wZXJ0eSA9IHByb3BlcnR5O1xuXG4gICAgICAgIGRhdGEgPSBkYXRhW3Byb3BlcnR5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocGFyZW50ICYmIHBhcmVudFByb3BlcnR5ICYmIChmb3JjZSB8fCBwYXJlbnRbcGFyZW50UHJvcGVydHldID09PSB1bmRlZmluZWQpKSB7XG4gICAgICBwYXJlbnRbcGFyZW50UHJvcGVydHldID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfYXBwbHlTbWFydERlZmF1bHRzPFQ+KFxuICAgIGRhdGE6IFQsXG4gICAgc21hcnREZWZhdWx0czogTWFwPHN0cmluZywgSnNvbk9iamVjdD4sXG4gICk6IE9ic2VydmFibGU8VD4ge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnkgaHR0cHM6Ly9naXRodWIuY29tL1JlYWN0aXZlWC9yeGpzL2lzc3Vlcy8zOTg5XG4gICAgcmV0dXJuIChvZihkYXRhKSBhcyBhbnkpLnBpcGUoXG4gICAgICAuLi5bLi4uc21hcnREZWZhdWx0cy5lbnRyaWVzKCldLm1hcCgoW3BvaW50ZXIsIHNjaGVtYV0pID0+IHtcbiAgICAgICAgcmV0dXJuIGNvbmNhdE1hcDxULCBUPihkYXRhID0+IHtcbiAgICAgICAgICBjb25zdCBmcmFnbWVudHMgPSBKU09OLnBhcnNlKHBvaW50ZXIpO1xuICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IHRoaXMuX3NvdXJjZU1hcC5nZXQoKHNjaGVtYSBhcyBKc29uT2JqZWN0KS4kc291cmNlIGFzIHN0cmluZyk7XG5cbiAgICAgICAgICBsZXQgdmFsdWUgPSBzb3VyY2UgPyBzb3VyY2Uoc2NoZW1hKSA6IG9mKHVuZGVmaW5lZCk7XG5cbiAgICAgICAgICBpZiAoIWlzT2JzZXJ2YWJsZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gb2YodmFsdWUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAodmFsdWUgYXMgT2JzZXJ2YWJsZTx7fT4pLnBpcGUoXG4gICAgICAgICAgICAvLyBTeW5jaHJvbm91c2x5IHNldCB0aGUgbmV3IGRhdGEgYXQgdGhlIHByb3BlciBKc29uU2NoZW1hIHBhdGguXG4gICAgICAgICAgICB0YXAoeCA9PiBDb3JlU2NoZW1hUmVnaXN0cnkuX3NldChkYXRhLCBmcmFnbWVudHMsIHgpKSxcbiAgICAgICAgICAgIC8vIEJ1dCByZXR1cm4gdGhlIGRhdGEgb2JqZWN0LlxuICAgICAgICAgICAgbWFwKCgpID0+IGRhdGEpLFxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxufVxuIl19