"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const utils_1 = require("../../utils");
const pointer_1 = require("./pointer");
function _getObjectSubSchema(schema, key) {
    if (typeof schema !== 'object' || schema === null) {
        return undefined;
    }
    // Is it an object schema?
    if (typeof schema.properties == 'object' || schema.type == 'object') {
        if (typeof schema.properties == 'object'
            && typeof schema.properties[key] == 'object') {
            return schema.properties[key];
        }
        if (typeof schema.additionalProperties == 'object') {
            return schema.additionalProperties;
        }
        return undefined;
    }
    // Is it an array schema?
    if (typeof schema.items == 'object' || schema.type == 'array') {
        return typeof schema.items == 'object' ? schema.items : undefined;
    }
    return undefined;
}
function _visitJsonRecursive(json, visitor, ptr, schema, refResolver, context, // tslint:disable-line:no-any
root) {
    if (schema && schema.hasOwnProperty('$ref') && typeof schema['$ref'] == 'string') {
        if (refResolver) {
            const resolved = refResolver(schema['$ref'], context);
            schema = resolved.schema;
            context = resolved.context;
        }
    }
    const value = visitor(json, ptr, schema, root);
    return (utils_1.isObservable(value)
        ? value
        : rxjs_1.of(value)).pipe(operators_1.concatMap((value) => {
        if (Array.isArray(value)) {
            return rxjs_1.concat(rxjs_1.from(value).pipe(operators_1.mergeMap((item, i) => {
                return _visitJsonRecursive(item, visitor, pointer_1.joinJsonPointer(ptr, '' + i), _getObjectSubSchema(schema, '' + i), refResolver, context, root || value).pipe(operators_1.tap(x => value[i] = x));
            }), operators_1.ignoreElements()), rxjs_1.of(value));
        }
        else if (typeof value == 'object' && value !== null) {
            return rxjs_1.concat(rxjs_1.from(Object.getOwnPropertyNames(value)).pipe(operators_1.mergeMap(key => {
                return _visitJsonRecursive(value[key], visitor, pointer_1.joinJsonPointer(ptr, key), _getObjectSubSchema(schema, key), refResolver, context, root || value).pipe(operators_1.tap(x => value[key] = x));
            }), operators_1.ignoreElements()), rxjs_1.of(value));
        }
        else {
            return rxjs_1.of(value);
        }
    }));
}
/**
 * Visit all the properties in a JSON object, allowing to transform them. It supports calling
 * properties synchronously or asynchronously (through Observables).
 * The original object can be mutated or replaced entirely. In case where it's replaced, the new
 * value is returned. When it's mutated though the original object will be changed.
 *
 * Please note it is possible to have an infinite loop here (which will result in a stack overflow)
 * if you return 2 objects that references each others (or the same object all the time).
 *
 * @param {JsonValue} json The Json value to visit.
 * @param {JsonVisitor} visitor A function that will be called on every items.
 * @param {JsonObject} schema A JSON schema to pass through to the visitor (where possible).
 * @param refResolver a function to resolve references in the schema.
 * @returns {Observable< | undefined>} The observable of the new root, if the root changed.
 */
function visitJson(json, visitor, schema, refResolver, context) {
    return _visitJsonRecursive(json, visitor, pointer_1.buildJsonPointer([]), schema, refResolver, context);
}
exports.visitJson = visitJson;
function visitJsonSchema(schema, visitor) {
    const keywords = {
        additionalItems: true,
        items: true,
        contains: true,
        additionalProperties: true,
        propertyNames: true,
        not: true,
    };
    const arrayKeywords = {
        items: true,
        allOf: true,
        anyOf: true,
        oneOf: true,
    };
    const propsKeywords = {
        definitions: true,
        properties: true,
        patternProperties: true,
        additionalProperties: true,
        dependencies: true,
        items: true,
    };
    function _traverse(schema, jsonPtr, rootSchema, parentSchema, keyIndex) {
        if (schema && typeof schema == 'object' && !Array.isArray(schema)) {
            visitor(schema, jsonPtr, parentSchema, keyIndex);
            for (const key of Object.keys(schema)) {
                const sch = schema[key];
                if (key in propsKeywords) {
                    if (sch && typeof sch == 'object') {
                        for (const prop of Object.keys(sch)) {
                            _traverse(sch[prop], pointer_1.joinJsonPointer(jsonPtr, key, prop), rootSchema, schema, prop);
                        }
                    }
                }
                else if (key in keywords) {
                    _traverse(sch, pointer_1.joinJsonPointer(jsonPtr, key), rootSchema, schema, key);
                }
                else if (key in arrayKeywords) {
                    if (Array.isArray(sch)) {
                        for (let i = 0; i < sch.length; i++) {
                            _traverse(sch[i], pointer_1.joinJsonPointer(jsonPtr, key, '' + i), rootSchema, sch, '' + i);
                        }
                    }
                }
                else if (Array.isArray(sch)) {
                    for (let i = 0; i < sch.length; i++) {
                        _traverse(sch[i], pointer_1.joinJsonPointer(jsonPtr, key, '' + i), rootSchema, sch, '' + i);
                    }
                }
            }
        }
    }
    _traverse(schema, pointer_1.buildJsonPointer([]), schema);
}
exports.visitJsonSchema = visitJsonSchema;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvanNvbi9zY2hlbWEvdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtCQUFvRTtBQUNwRSw4Q0FBMEU7QUFDMUUsdUNBQTJDO0FBRzNDLHVDQUE4RDtBQU85RCxTQUFTLG1CQUFtQixDQUMxQixNQUE4QixFQUM5QixHQUFXO0lBRVgsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtRQUNqRCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELDBCQUEwQjtJQUMxQixJQUFJLE9BQU8sTUFBTSxDQUFDLFVBQVUsSUFBSSxRQUFRLElBQUksTUFBTSxDQUFDLElBQUksSUFBSSxRQUFRLEVBQUU7UUFDbkUsSUFBSSxPQUFPLE1BQU0sQ0FBQyxVQUFVLElBQUksUUFBUTtlQUNqQyxPQUFRLE1BQU0sQ0FBQyxVQUF5QixDQUFDLEdBQUcsQ0FBQyxJQUFJLFFBQVEsRUFBRTtZQUNoRSxPQUFRLE1BQU0sQ0FBQyxVQUF5QixDQUFDLEdBQUcsQ0FBZSxDQUFDO1NBQzdEO1FBQ0QsSUFBSSxPQUFPLE1BQU0sQ0FBQyxvQkFBb0IsSUFBSSxRQUFRLEVBQUU7WUFDbEQsT0FBTyxNQUFNLENBQUMsb0JBQWtDLENBQUM7U0FDbEQ7UUFFRCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELHlCQUF5QjtJQUN6QixJQUFJLE9BQU8sTUFBTSxDQUFDLEtBQUssSUFBSSxRQUFRLElBQUksTUFBTSxDQUFDLElBQUksSUFBSSxPQUFPLEVBQUU7UUFDN0QsT0FBTyxPQUFPLE1BQU0sQ0FBQyxLQUFLLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBRSxNQUFNLENBQUMsS0FBb0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0tBQ25GO0lBRUQsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVELFNBQVMsbUJBQW1CLENBQzFCLElBQWUsRUFDZixPQUFvQixFQUNwQixHQUFnQixFQUNoQixNQUFtQixFQUNuQixXQUF5QyxFQUN6QyxPQUFrQixFQUFHLDZCQUE2QjtBQUNsRCxJQUE2QjtJQUU3QixJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFFBQVEsRUFBRTtRQUNoRixJQUFJLFdBQVcsRUFBRTtZQUNmLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDaEUsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7WUFDekIsT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUM7U0FDNUI7S0FDRjtJQUVELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUUvQyxPQUFPLENBQUMsb0JBQVksQ0FBQyxLQUFLLENBQUM7UUFDdkIsQ0FBQyxDQUFDLEtBQThCO1FBQ2hDLENBQUMsQ0FBQyxTQUFZLENBQUMsS0FBa0IsQ0FBQyxDQUNyQyxDQUFDLElBQUksQ0FDSixxQkFBUyxDQUFDLENBQUMsS0FBZ0IsRUFBRSxFQUFFO1FBQzdCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN4QixPQUFPLGFBQU0sQ0FDWCxXQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUNkLG9CQUFRLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25CLE9BQU8sbUJBQW1CLENBQ3hCLElBQUksRUFDSixPQUFPLEVBQ1AseUJBQWUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUM1QixtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUNuQyxXQUFXLEVBQ1gsT0FBTyxFQUNQLElBQUksSUFBSSxLQUFLLENBQ2QsQ0FBQyxJQUFJLENBQUMsZUFBRyxDQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsQ0FBQyxDQUFDLEVBQ0YsMEJBQWMsRUFBRSxDQUNqQixFQUNELFNBQVksQ0FBWSxLQUFLLENBQUMsQ0FDL0IsQ0FBQztTQUNIO2FBQU0sSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtZQUNyRCxPQUFPLGFBQU0sQ0FDWCxXQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUMxQyxvQkFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNiLE9BQU8sbUJBQW1CLENBQ3hCLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFDVixPQUFPLEVBQ1AseUJBQWUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQ3pCLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsRUFDaEMsV0FBVyxFQUNYLE9BQU8sRUFDUCxJQUFJLElBQUksS0FBSyxDQUNkLENBQUMsSUFBSSxDQUFDLGVBQUcsQ0FBWSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlDLENBQUMsQ0FBQyxFQUNGLDBCQUFjLEVBQUUsQ0FDaEIsRUFDRCxTQUFZLENBQUMsS0FBSyxDQUFDLENBQ3JCLENBQUM7U0FDSDthQUFNO1lBQ0wsT0FBTyxTQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDLENBQUMsQ0FDSCxDQUFDO0FBQ0osQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBQ0gsU0FBZ0IsU0FBUyxDQUN2QixJQUFlLEVBQ2YsT0FBb0IsRUFDcEIsTUFBbUIsRUFDbkIsV0FBeUMsRUFDekMsT0FBa0I7SUFFbEIsT0FBTyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLDBCQUFnQixDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDaEcsQ0FBQztBQVJELDhCQVFDO0FBR0QsU0FBZ0IsZUFBZSxDQUFDLE1BQWtCLEVBQUUsT0FBMEI7SUFDNUUsTUFBTSxRQUFRLEdBQUc7UUFDZixlQUFlLEVBQUUsSUFBSTtRQUNyQixLQUFLLEVBQUUsSUFBSTtRQUNYLFFBQVEsRUFBRSxJQUFJO1FBQ2Qsb0JBQW9CLEVBQUUsSUFBSTtRQUMxQixhQUFhLEVBQUUsSUFBSTtRQUNuQixHQUFHLEVBQUUsSUFBSTtLQUNWLENBQUM7SUFFRixNQUFNLGFBQWEsR0FBRztRQUNwQixLQUFLLEVBQUUsSUFBSTtRQUNYLEtBQUssRUFBRSxJQUFJO1FBQ1gsS0FBSyxFQUFFLElBQUk7UUFDWCxLQUFLLEVBQUUsSUFBSTtLQUNaLENBQUM7SUFFRixNQUFNLGFBQWEsR0FBRztRQUNwQixXQUFXLEVBQUUsSUFBSTtRQUNqQixVQUFVLEVBQUUsSUFBSTtRQUNoQixpQkFBaUIsRUFBRSxJQUFJO1FBQ3ZCLG9CQUFvQixFQUFFLElBQUk7UUFDMUIsWUFBWSxFQUFFLElBQUk7UUFDbEIsS0FBSyxFQUFFLElBQUk7S0FDWixDQUFDO0lBRUYsU0FBUyxTQUFTLENBQ2hCLE1BQThCLEVBQzlCLE9BQW9CLEVBQ3BCLFVBQXNCLEVBQ3RCLFlBQXFDLEVBQ3JDLFFBQWlCO1FBRWpCLElBQUksTUFBTSxJQUFJLE9BQU8sTUFBTSxJQUFJLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDakUsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRWpELEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDckMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QixJQUFJLEdBQUcsSUFBSSxhQUFhLEVBQUU7b0JBQ3hCLElBQUksR0FBRyxJQUFJLE9BQU8sR0FBRyxJQUFJLFFBQVEsRUFBRTt3QkFDakMsS0FBSyxNQUFNLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFOzRCQUNuQyxTQUFTLENBQ04sR0FBa0IsQ0FBQyxJQUFJLENBQWUsRUFDdkMseUJBQWUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUNuQyxVQUFVLEVBQ1YsTUFBTSxFQUNOLElBQUksQ0FDTCxDQUFDO3lCQUNIO3FCQUNGO2lCQUNGO3FCQUFNLElBQUksR0FBRyxJQUFJLFFBQVEsRUFBRTtvQkFDMUIsU0FBUyxDQUFDLEdBQWlCLEVBQUUseUJBQWUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDdEY7cUJBQU0sSUFBSSxHQUFHLElBQUksYUFBYSxFQUFFO29CQUMvQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7d0JBQ3RCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOzRCQUNuQyxTQUFTLENBQ1AsR0FBRyxDQUFDLENBQUMsQ0FBYyxFQUNuQix5QkFBZSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUNyQyxVQUFVLEVBQ1YsR0FBRyxFQUNILEVBQUUsR0FBRyxDQUFDLENBQ1AsQ0FBQzt5QkFDSDtxQkFDRjtpQkFDRjtxQkFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQzdCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO3dCQUNuQyxTQUFTLENBQ1AsR0FBRyxDQUFDLENBQUMsQ0FBYyxFQUNuQix5QkFBZSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUNyQyxVQUFVLEVBQ1YsR0FBRyxFQUNILEVBQUUsR0FBRyxDQUFDLENBQ1AsQ0FBQztxQkFDSDtpQkFDRjthQUNGO1NBQ0Y7SUFDSCxDQUFDO0lBRUQsU0FBUyxDQUFDLE1BQU0sRUFBRSwwQkFBZ0IsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBaEZELDBDQWdGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IE9ic2VydmFibGUsIGNvbmNhdCwgZnJvbSwgb2YgYXMgb2JzZXJ2YWJsZU9mIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBjb25jYXRNYXAsIGlnbm9yZUVsZW1lbnRzLCBtZXJnZU1hcCwgdGFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgaXNPYnNlcnZhYmxlIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IHsgSnNvbkFycmF5LCBKc29uT2JqZWN0LCBKc29uVmFsdWUgfSBmcm9tICcuLi9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgSnNvblBvaW50ZXIsIEpzb25TY2hlbWFWaXNpdG9yLCBKc29uVmlzaXRvciB9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IGJ1aWxkSnNvblBvaW50ZXIsIGpvaW5Kc29uUG9pbnRlciB9IGZyb20gJy4vcG9pbnRlcic7XG5cblxuZXhwb3J0IGludGVyZmFjZSBSZWZlcmVuY2VSZXNvbHZlcjxDb250ZXh0VD4ge1xuICAocmVmOiBzdHJpbmcsIGNvbnRleHQ/OiBDb250ZXh0VCk6IHsgY29udGV4dD86IENvbnRleHRULCBzY2hlbWE/OiBKc29uT2JqZWN0IH07XG59XG5cbmZ1bmN0aW9uIF9nZXRPYmplY3RTdWJTY2hlbWEoXG4gIHNjaGVtYTogSnNvbk9iamVjdCB8IHVuZGVmaW5lZCxcbiAga2V5OiBzdHJpbmcsXG4pOiBKc29uT2JqZWN0IHwgdW5kZWZpbmVkIHtcbiAgaWYgKHR5cGVvZiBzY2hlbWEgIT09ICdvYmplY3QnIHx8IHNjaGVtYSA9PT0gbnVsbCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBJcyBpdCBhbiBvYmplY3Qgc2NoZW1hP1xuICBpZiAodHlwZW9mIHNjaGVtYS5wcm9wZXJ0aWVzID09ICdvYmplY3QnIHx8IHNjaGVtYS50eXBlID09ICdvYmplY3QnKSB7XG4gICAgaWYgKHR5cGVvZiBzY2hlbWEucHJvcGVydGllcyA9PSAnb2JqZWN0J1xuICAgICAgICAmJiB0eXBlb2YgKHNjaGVtYS5wcm9wZXJ0aWVzIGFzIEpzb25PYmplY3QpW2tleV0gPT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiAoc2NoZW1hLnByb3BlcnRpZXMgYXMgSnNvbk9iamVjdClba2V5XSBhcyBKc29uT2JqZWN0O1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllcyA9PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllcyBhcyBKc29uT2JqZWN0O1xuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBJcyBpdCBhbiBhcnJheSBzY2hlbWE/XG4gIGlmICh0eXBlb2Ygc2NoZW1hLml0ZW1zID09ICdvYmplY3QnIHx8IHNjaGVtYS50eXBlID09ICdhcnJheScpIHtcbiAgICByZXR1cm4gdHlwZW9mIHNjaGVtYS5pdGVtcyA9PSAnb2JqZWN0JyA/IChzY2hlbWEuaXRlbXMgYXMgSnNvbk9iamVjdCkgOiB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBfdmlzaXRKc29uUmVjdXJzaXZlPENvbnRleHRUPihcbiAganNvbjogSnNvblZhbHVlLFxuICB2aXNpdG9yOiBKc29uVmlzaXRvcixcbiAgcHRyOiBKc29uUG9pbnRlcixcbiAgc2NoZW1hPzogSnNvbk9iamVjdCxcbiAgcmVmUmVzb2x2ZXI/OiBSZWZlcmVuY2VSZXNvbHZlcjxDb250ZXh0VD4sXG4gIGNvbnRleHQ/OiBDb250ZXh0VCwgIC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tYW55XG4gIHJvb3Q/OiBKc29uT2JqZWN0IHwgSnNvbkFycmF5LFxuKTogT2JzZXJ2YWJsZTxKc29uVmFsdWU+IHtcbiAgaWYgKHNjaGVtYSAmJiBzY2hlbWEuaGFzT3duUHJvcGVydHkoJyRyZWYnKSAmJiB0eXBlb2Ygc2NoZW1hWyckcmVmJ10gPT0gJ3N0cmluZycpIHtcbiAgICBpZiAocmVmUmVzb2x2ZXIpIHtcbiAgICAgIGNvbnN0IHJlc29sdmVkID0gcmVmUmVzb2x2ZXIoc2NoZW1hWyckcmVmJ10gYXMgc3RyaW5nLCBjb250ZXh0KTtcbiAgICAgIHNjaGVtYSA9IHJlc29sdmVkLnNjaGVtYTtcbiAgICAgIGNvbnRleHQgPSByZXNvbHZlZC5jb250ZXh0O1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHZhbHVlID0gdmlzaXRvcihqc29uLCBwdHIsIHNjaGVtYSwgcm9vdCk7XG5cbiAgcmV0dXJuIChpc09ic2VydmFibGUodmFsdWUpXG4gICAgICA/IHZhbHVlIGFzIE9ic2VydmFibGU8SnNvblZhbHVlPlxuICAgICAgOiBvYnNlcnZhYmxlT2YodmFsdWUgYXMgSnNvblZhbHVlKVxuICApLnBpcGUoXG4gICAgY29uY2F0TWFwKCh2YWx1ZTogSnNvblZhbHVlKSA9PiB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGNvbmNhdChcbiAgICAgICAgICBmcm9tKHZhbHVlKS5waXBlKFxuICAgICAgICAgICAgbWVyZ2VNYXAoKGl0ZW0sIGkpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIF92aXNpdEpzb25SZWN1cnNpdmUoXG4gICAgICAgICAgICAgICAgaXRlbSxcbiAgICAgICAgICAgICAgICB2aXNpdG9yLFxuICAgICAgICAgICAgICAgIGpvaW5Kc29uUG9pbnRlcihwdHIsICcnICsgaSksXG4gICAgICAgICAgICAgICAgX2dldE9iamVjdFN1YlNjaGVtYShzY2hlbWEsICcnICsgaSksXG4gICAgICAgICAgICAgICAgcmVmUmVzb2x2ZXIsXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICByb290IHx8IHZhbHVlLFxuICAgICAgICAgICAgICApLnBpcGUodGFwPEpzb25WYWx1ZT4oeCA9PiB2YWx1ZVtpXSA9IHgpKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgaWdub3JlRWxlbWVudHMoKSxcbiAgICAgICAgICApLFxuICAgICAgICAgIG9ic2VydmFibGVPZjxKc29uVmFsdWU+KHZhbHVlKSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBjb25jYXQoXG4gICAgICAgICAgZnJvbShPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSkpLnBpcGUoXG4gICAgICAgICAgICBtZXJnZU1hcChrZXkgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gX3Zpc2l0SnNvblJlY3Vyc2l2ZShcbiAgICAgICAgICAgICAgICB2YWx1ZVtrZXldLFxuICAgICAgICAgICAgICAgIHZpc2l0b3IsXG4gICAgICAgICAgICAgICAgam9pbkpzb25Qb2ludGVyKHB0ciwga2V5KSxcbiAgICAgICAgICAgICAgICBfZ2V0T2JqZWN0U3ViU2NoZW1hKHNjaGVtYSwga2V5KSxcbiAgICAgICAgICAgICAgICByZWZSZXNvbHZlcixcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgIHJvb3QgfHwgdmFsdWUsXG4gICAgICAgICAgICAgICkucGlwZSh0YXA8SnNvblZhbHVlPih4ID0+IHZhbHVlW2tleV0gPSB4KSk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGlnbm9yZUVsZW1lbnRzKCksXG4gICAgICAgICAgICksXG4gICAgICAgICAgIG9ic2VydmFibGVPZih2YWx1ZSksXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KSxcbiAgKTtcbn1cblxuLyoqXG4gKiBWaXNpdCBhbGwgdGhlIHByb3BlcnRpZXMgaW4gYSBKU09OIG9iamVjdCwgYWxsb3dpbmcgdG8gdHJhbnNmb3JtIHRoZW0uIEl0IHN1cHBvcnRzIGNhbGxpbmdcbiAqIHByb3BlcnRpZXMgc3luY2hyb25vdXNseSBvciBhc3luY2hyb25vdXNseSAodGhyb3VnaCBPYnNlcnZhYmxlcykuXG4gKiBUaGUgb3JpZ2luYWwgb2JqZWN0IGNhbiBiZSBtdXRhdGVkIG9yIHJlcGxhY2VkIGVudGlyZWx5LiBJbiBjYXNlIHdoZXJlIGl0J3MgcmVwbGFjZWQsIHRoZSBuZXdcbiAqIHZhbHVlIGlzIHJldHVybmVkLiBXaGVuIGl0J3MgbXV0YXRlZCB0aG91Z2ggdGhlIG9yaWdpbmFsIG9iamVjdCB3aWxsIGJlIGNoYW5nZWQuXG4gKlxuICogUGxlYXNlIG5vdGUgaXQgaXMgcG9zc2libGUgdG8gaGF2ZSBhbiBpbmZpbml0ZSBsb29wIGhlcmUgKHdoaWNoIHdpbGwgcmVzdWx0IGluIGEgc3RhY2sgb3ZlcmZsb3cpXG4gKiBpZiB5b3UgcmV0dXJuIDIgb2JqZWN0cyB0aGF0IHJlZmVyZW5jZXMgZWFjaCBvdGhlcnMgKG9yIHRoZSBzYW1lIG9iamVjdCBhbGwgdGhlIHRpbWUpLlxuICpcbiAqIEBwYXJhbSB7SnNvblZhbHVlfSBqc29uIFRoZSBKc29uIHZhbHVlIHRvIHZpc2l0LlxuICogQHBhcmFtIHtKc29uVmlzaXRvcn0gdmlzaXRvciBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgb24gZXZlcnkgaXRlbXMuXG4gKiBAcGFyYW0ge0pzb25PYmplY3R9IHNjaGVtYSBBIEpTT04gc2NoZW1hIHRvIHBhc3MgdGhyb3VnaCB0byB0aGUgdmlzaXRvciAod2hlcmUgcG9zc2libGUpLlxuICogQHBhcmFtIHJlZlJlc29sdmVyIGEgZnVuY3Rpb24gdG8gcmVzb2x2ZSByZWZlcmVuY2VzIGluIHRoZSBzY2hlbWEuXG4gKiBAcmV0dXJucyB7T2JzZXJ2YWJsZTwgfCB1bmRlZmluZWQ+fSBUaGUgb2JzZXJ2YWJsZSBvZiB0aGUgbmV3IHJvb3QsIGlmIHRoZSByb290IGNoYW5nZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2aXNpdEpzb248Q29udGV4dFQ+KFxuICBqc29uOiBKc29uVmFsdWUsXG4gIHZpc2l0b3I6IEpzb25WaXNpdG9yLFxuICBzY2hlbWE/OiBKc29uT2JqZWN0LFxuICByZWZSZXNvbHZlcj86IFJlZmVyZW5jZVJlc29sdmVyPENvbnRleHRUPixcbiAgY29udGV4dD86IENvbnRleHRULCAgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1hbnlcbik6IE9ic2VydmFibGU8SnNvblZhbHVlPiB7XG4gIHJldHVybiBfdmlzaXRKc29uUmVjdXJzaXZlKGpzb24sIHZpc2l0b3IsIGJ1aWxkSnNvblBvaW50ZXIoW10pLCBzY2hlbWEsIHJlZlJlc29sdmVyLCBjb250ZXh0KTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gdmlzaXRKc29uU2NoZW1hKHNjaGVtYTogSnNvbk9iamVjdCwgdmlzaXRvcjogSnNvblNjaGVtYVZpc2l0b3IpIHtcbiAgY29uc3Qga2V5d29yZHMgPSB7XG4gICAgYWRkaXRpb25hbEl0ZW1zOiB0cnVlLFxuICAgIGl0ZW1zOiB0cnVlLFxuICAgIGNvbnRhaW5zOiB0cnVlLFxuICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiB0cnVlLFxuICAgIHByb3BlcnR5TmFtZXM6IHRydWUsXG4gICAgbm90OiB0cnVlLFxuICB9O1xuXG4gIGNvbnN0IGFycmF5S2V5d29yZHMgPSB7XG4gICAgaXRlbXM6IHRydWUsXG4gICAgYWxsT2Y6IHRydWUsXG4gICAgYW55T2Y6IHRydWUsXG4gICAgb25lT2Y6IHRydWUsXG4gIH07XG5cbiAgY29uc3QgcHJvcHNLZXl3b3JkcyA9IHtcbiAgICBkZWZpbml0aW9uczogdHJ1ZSxcbiAgICBwcm9wZXJ0aWVzOiB0cnVlLFxuICAgIHBhdHRlcm5Qcm9wZXJ0aWVzOiB0cnVlLFxuICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiB0cnVlLFxuICAgIGRlcGVuZGVuY2llczogdHJ1ZSxcbiAgICBpdGVtczogdHJ1ZSxcbiAgfTtcblxuICBmdW5jdGlvbiBfdHJhdmVyc2UoXG4gICAgc2NoZW1hOiBKc29uT2JqZWN0IHwgSnNvbkFycmF5LFxuICAgIGpzb25QdHI6IEpzb25Qb2ludGVyLFxuICAgIHJvb3RTY2hlbWE6IEpzb25PYmplY3QsXG4gICAgcGFyZW50U2NoZW1hPzogSnNvbk9iamVjdCB8IEpzb25BcnJheSxcbiAgICBrZXlJbmRleD86IHN0cmluZyxcbiAgKSB7XG4gICAgaWYgKHNjaGVtYSAmJiB0eXBlb2Ygc2NoZW1hID09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KHNjaGVtYSkpIHtcbiAgICAgIHZpc2l0b3Ioc2NoZW1hLCBqc29uUHRyLCBwYXJlbnRTY2hlbWEsIGtleUluZGV4KTtcblxuICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoc2NoZW1hKSkge1xuICAgICAgICBjb25zdCBzY2ggPSBzY2hlbWFba2V5XTtcbiAgICAgICAgaWYgKGtleSBpbiBwcm9wc0tleXdvcmRzKSB7XG4gICAgICAgICAgaWYgKHNjaCAmJiB0eXBlb2Ygc2NoID09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb3Agb2YgT2JqZWN0LmtleXMoc2NoKSkge1xuICAgICAgICAgICAgICBfdHJhdmVyc2UoXG4gICAgICAgICAgICAgICAgKHNjaCBhcyBKc29uT2JqZWN0KVtwcm9wXSBhcyBKc29uT2JqZWN0LFxuICAgICAgICAgICAgICAgIGpvaW5Kc29uUG9pbnRlcihqc29uUHRyLCBrZXksIHByb3ApLFxuICAgICAgICAgICAgICAgIHJvb3RTY2hlbWEsXG4gICAgICAgICAgICAgICAgc2NoZW1hLFxuICAgICAgICAgICAgICAgIHByb3AsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGtleSBpbiBrZXl3b3Jkcykge1xuICAgICAgICAgIF90cmF2ZXJzZShzY2ggYXMgSnNvbk9iamVjdCwgam9pbkpzb25Qb2ludGVyKGpzb25QdHIsIGtleSksIHJvb3RTY2hlbWEsIHNjaGVtYSwga2V5KTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgaW4gYXJyYXlLZXl3b3Jkcykge1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaCkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIF90cmF2ZXJzZShcbiAgICAgICAgICAgICAgICBzY2hbaV0gYXMgSnNvbkFycmF5LFxuICAgICAgICAgICAgICAgIGpvaW5Kc29uUG9pbnRlcihqc29uUHRyLCBrZXksICcnICsgaSksXG4gICAgICAgICAgICAgICAgcm9vdFNjaGVtYSxcbiAgICAgICAgICAgICAgICBzY2gsXG4gICAgICAgICAgICAgICAgJycgKyBpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHNjaCkpIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjaC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgX3RyYXZlcnNlKFxuICAgICAgICAgICAgICBzY2hbaV0gYXMgSnNvbkFycmF5LFxuICAgICAgICAgICAgICBqb2luSnNvblBvaW50ZXIoanNvblB0ciwga2V5LCAnJyArIGkpLFxuICAgICAgICAgICAgICByb290U2NoZW1hLFxuICAgICAgICAgICAgICBzY2gsXG4gICAgICAgICAgICAgICcnICsgaSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgX3RyYXZlcnNlKHNjaGVtYSwgYnVpbGRKc29uUG9pbnRlcihbXSksIHNjaGVtYSk7XG59XG4iXX0=