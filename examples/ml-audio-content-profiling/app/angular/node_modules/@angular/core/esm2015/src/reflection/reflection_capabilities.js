/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type, isType } from '../type';
import { global, stringify } from '../util';
import { ANNOTATIONS, PARAMETERS, PROP_METADATA } from '../util/decorators';
/** *
 * Attention: These regex has to hold even if the code is minified!
  @type {?} */
export const DELEGATE_CTOR = /^function\s+\S+\(\)\s*{[\s\S]+\.apply\(this,\s*arguments\)/;
/** @type {?} */
export const INHERITED_CLASS = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{/;
/** @type {?} */
export const INHERITED_CLASS_WITH_CTOR = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{[\s\S]*constructor\s*\(/;
export class ReflectionCapabilities {
    /**
     * @param {?=} reflect
     */
    constructor(reflect) { this._reflect = reflect || global['Reflect']; }
    /**
     * @return {?}
     */
    isReflectionEnabled() { return true; }
    /**
     * @template T
     * @param {?} t
     * @return {?}
     */
    factory(t) { return (...args) => new t(...args); }
    /**
     * \@internal
     * @param {?} paramTypes
     * @param {?} paramAnnotations
     * @return {?}
     */
    _zipTypesAndAnnotations(paramTypes, paramAnnotations) {
        /** @type {?} */
        let result;
        if (typeof paramTypes === 'undefined') {
            result = new Array(paramAnnotations.length);
        }
        else {
            result = new Array(paramTypes.length);
        }
        for (let i = 0; i < result.length; i++) {
            // TS outputs Object for parameters without types, while Traceur omits
            // the annotations. For now we preserve the Traceur behavior to aid
            // migration, but this can be revisited.
            if (typeof paramTypes === 'undefined') {
                result[i] = [];
            }
            else if (paramTypes[i] != Object) {
                result[i] = [paramTypes[i]];
            }
            else {
                result[i] = [];
            }
            if (paramAnnotations && paramAnnotations[i] != null) {
                result[i] = result[i].concat(paramAnnotations[i]);
            }
        }
        return result;
    }
    /**
     * @param {?} type
     * @param {?} parentCtor
     * @return {?}
     */
    _ownParameters(type, parentCtor) {
        /** @type {?} */
        const typeStr = type.toString();
        // If we have no decorators, we only have function.length as metadata.
        // In that case, to detect whether a child class declared an own constructor or not,
        // we need to look inside of that constructor to check whether it is
        // just calling the parent.
        // This also helps to work around for https://github.com/Microsoft/TypeScript/issues/12439
        // that sets 'design:paramtypes' to []
        // if a class inherits from another class but has no ctor declared itself.
        if (DELEGATE_CTOR.exec(typeStr) ||
            (INHERITED_CLASS.exec(typeStr) && !INHERITED_CLASS_WITH_CTOR.exec(typeStr))) {
            return null;
        }
        // Prefer the direct API.
        if ((/** @type {?} */ (type)).parameters && (/** @type {?} */ (type)).parameters !== parentCtor.parameters) {
            return (/** @type {?} */ (type)).parameters;
        }
        /** @type {?} */
        const tsickleCtorParams = (/** @type {?} */ (type)).ctorParameters;
        if (tsickleCtorParams && tsickleCtorParams !== parentCtor.ctorParameters) {
            /** @type {?} */
            const ctorParameters = typeof tsickleCtorParams === 'function' ? tsickleCtorParams() : tsickleCtorParams;
            /** @type {?} */
            const paramTypes = ctorParameters.map((ctorParam) => ctorParam && ctorParam.type);
            /** @type {?} */
            const paramAnnotations = ctorParameters.map((ctorParam) => ctorParam && convertTsickleDecoratorIntoMetadata(ctorParam.decorators));
            return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
        }
        /** @type {?} */
        const paramAnnotations = type.hasOwnProperty(PARAMETERS) && (/** @type {?} */ (type))[PARAMETERS];
        /** @type {?} */
        const paramTypes = this._reflect && this._reflect.getOwnMetadata &&
            this._reflect.getOwnMetadata('design:paramtypes', type);
        if (paramTypes || paramAnnotations) {
            return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
        }
        // If a class has no decorators, at least create metadata
        // based on function.length.
        // Note: We know that this is a real constructor as we checked
        // the content of the constructor above.
        return new Array((/** @type {?} */ (type.length))).fill(undefined);
    }
    /**
     * @param {?} type
     * @return {?}
     */
    parameters(type) {
        // Note: only report metadata if we have at least one class decorator
        // to stay in sync with the static reflector.
        if (!isType(type)) {
            return [];
        }
        /** @type {?} */
        const parentCtor = getParentCtor(type);
        /** @type {?} */
        let parameters = this._ownParameters(type, parentCtor);
        if (!parameters && parentCtor !== Object) {
            parameters = this.parameters(parentCtor);
        }
        return parameters || [];
    }
    /**
     * @param {?} typeOrFunc
     * @param {?} parentCtor
     * @return {?}
     */
    _ownAnnotations(typeOrFunc, parentCtor) {
        // Prefer the direct API.
        if ((/** @type {?} */ (typeOrFunc)).annotations && (/** @type {?} */ (typeOrFunc)).annotations !== parentCtor.annotations) {
            /** @type {?} */
            let annotations = (/** @type {?} */ (typeOrFunc)).annotations;
            if (typeof annotations === 'function' && annotations.annotations) {
                annotations = annotations.annotations;
            }
            return annotations;
        }
        // API of tsickle for lowering decorators to properties on the class.
        if ((/** @type {?} */ (typeOrFunc)).decorators && (/** @type {?} */ (typeOrFunc)).decorators !== parentCtor.decorators) {
            return convertTsickleDecoratorIntoMetadata((/** @type {?} */ (typeOrFunc)).decorators);
        }
        // API for metadata created by invoking the decorators.
        if (typeOrFunc.hasOwnProperty(ANNOTATIONS)) {
            return (/** @type {?} */ (typeOrFunc))[ANNOTATIONS];
        }
        return null;
    }
    /**
     * @param {?} typeOrFunc
     * @return {?}
     */
    annotations(typeOrFunc) {
        if (!isType(typeOrFunc)) {
            return [];
        }
        /** @type {?} */
        const parentCtor = getParentCtor(typeOrFunc);
        /** @type {?} */
        const ownAnnotations = this._ownAnnotations(typeOrFunc, parentCtor) || [];
        /** @type {?} */
        const parentAnnotations = parentCtor !== Object ? this.annotations(parentCtor) : [];
        return parentAnnotations.concat(ownAnnotations);
    }
    /**
     * @param {?} typeOrFunc
     * @param {?} parentCtor
     * @return {?}
     */
    _ownPropMetadata(typeOrFunc, parentCtor) {
        // Prefer the direct API.
        if ((/** @type {?} */ (typeOrFunc)).propMetadata &&
            (/** @type {?} */ (typeOrFunc)).propMetadata !== parentCtor.propMetadata) {
            /** @type {?} */
            let propMetadata = (/** @type {?} */ (typeOrFunc)).propMetadata;
            if (typeof propMetadata === 'function' && propMetadata.propMetadata) {
                propMetadata = propMetadata.propMetadata;
            }
            return propMetadata;
        }
        // API of tsickle for lowering decorators to properties on the class.
        if ((/** @type {?} */ (typeOrFunc)).propDecorators &&
            (/** @type {?} */ (typeOrFunc)).propDecorators !== parentCtor.propDecorators) {
            /** @type {?} */
            const propDecorators = (/** @type {?} */ (typeOrFunc)).propDecorators;
            /** @type {?} */
            const propMetadata = /** @type {?} */ ({});
            Object.keys(propDecorators).forEach(prop => {
                propMetadata[prop] = convertTsickleDecoratorIntoMetadata(propDecorators[prop]);
            });
            return propMetadata;
        }
        // API for metadata created by invoking the decorators.
        if (typeOrFunc.hasOwnProperty(PROP_METADATA)) {
            return (/** @type {?} */ (typeOrFunc))[PROP_METADATA];
        }
        return null;
    }
    /**
     * @param {?} typeOrFunc
     * @return {?}
     */
    propMetadata(typeOrFunc) {
        if (!isType(typeOrFunc)) {
            return {};
        }
        /** @type {?} */
        const parentCtor = getParentCtor(typeOrFunc);
        /** @type {?} */
        const propMetadata = {};
        if (parentCtor !== Object) {
            /** @type {?} */
            const parentPropMetadata = this.propMetadata(parentCtor);
            Object.keys(parentPropMetadata).forEach((propName) => {
                propMetadata[propName] = parentPropMetadata[propName];
            });
        }
        /** @type {?} */
        const ownPropMetadata = this._ownPropMetadata(typeOrFunc, parentCtor);
        if (ownPropMetadata) {
            Object.keys(ownPropMetadata).forEach((propName) => {
                /** @type {?} */
                const decorators = [];
                if (propMetadata.hasOwnProperty(propName)) {
                    decorators.push(...propMetadata[propName]);
                }
                decorators.push(...ownPropMetadata[propName]);
                propMetadata[propName] = decorators;
            });
        }
        return propMetadata;
    }
    /**
     * @param {?} type
     * @param {?} lcProperty
     * @return {?}
     */
    hasLifecycleHook(type, lcProperty) {
        return type instanceof Type && lcProperty in type.prototype;
    }
    /**
     * @param {?} type
     * @return {?}
     */
    guards(type) { return {}; }
    /**
     * @param {?} name
     * @return {?}
     */
    getter(name) { return /** @type {?} */ (new Function('o', 'return o.' + name + ';')); }
    /**
     * @param {?} name
     * @return {?}
     */
    setter(name) {
        return /** @type {?} */ (new Function('o', 'v', 'return o.' + name + ' = v;'));
    }
    /**
     * @param {?} name
     * @return {?}
     */
    method(name) {
        /** @type {?} */
        const functionBody = `if (!o.${name}) throw new Error('"${name}" is undefined');
        return o.${name}.apply(o, args);`;
        return /** @type {?} */ (new Function('o', 'args', functionBody));
    }
    /**
     * @param {?} type
     * @return {?}
     */
    importUri(type) {
        // StaticSymbol
        if (typeof type === 'object' && type['filePath']) {
            return type['filePath'];
        }
        // Runtime type
        return `./${stringify(type)}`;
    }
    /**
     * @param {?} type
     * @return {?}
     */
    resourceUri(type) { return `./${stringify(type)}`; }
    /**
     * @param {?} name
     * @param {?} moduleUrl
     * @param {?} members
     * @param {?} runtime
     * @return {?}
     */
    resolveIdentifier(name, moduleUrl, members, runtime) {
        return runtime;
    }
    /**
     * @param {?} enumIdentifier
     * @param {?} name
     * @return {?}
     */
    resolveEnum(enumIdentifier, name) { return enumIdentifier[name]; }
}
if (false) {
    /** @type {?} */
    ReflectionCapabilities.prototype._reflect;
}
/**
 * @param {?} decoratorInvocations
 * @return {?}
 */
function convertTsickleDecoratorIntoMetadata(decoratorInvocations) {
    if (!decoratorInvocations) {
        return [];
    }
    return decoratorInvocations.map(decoratorInvocation => {
        /** @type {?} */
        const decoratorType = decoratorInvocation.type;
        /** @type {?} */
        const annotationCls = decoratorType.annotationCls;
        /** @type {?} */
        const annotationArgs = decoratorInvocation.args ? decoratorInvocation.args : [];
        return new annotationCls(...annotationArgs);
    });
}
/**
 * @param {?} ctor
 * @return {?}
 */
function getParentCtor(ctor) {
    /** @type {?} */
    const parentProto = ctor.prototype ? Object.getPrototypeOf(ctor.prototype) : null;
    /** @type {?} */
    const parentCtor = parentProto ? parentProto.constructor : null;
    // Note: We always use `Object` as the null value
    // to simplify checking later on.
    return parentCtor || Object;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZWZsZWN0aW9uL3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDckMsT0FBTyxFQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxFQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7Ozs7QUFTMUUsYUFBYSxhQUFhLEdBQUcsNERBQTRELENBQUM7O0FBQzFGLGFBQWEsZUFBZSxHQUFHLDJDQUEyQyxDQUFDOztBQUMzRSxhQUFhLHlCQUF5QixHQUNsQyxrRUFBa0UsQ0FBQztBQUV2RSxNQUFNLE9BQU8sc0JBQXNCOzs7O0lBR2pDLFlBQVksT0FBYSxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFOzs7O0lBRTVFLG1CQUFtQixLQUFjLE9BQU8sSUFBSSxDQUFDLEVBQUU7Ozs7OztJQUUvQyxPQUFPLENBQUksQ0FBVSxJQUF3QixPQUFPLENBQUMsR0FBRyxJQUFXLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRTs7Ozs7OztJQUd6Rix1QkFBdUIsQ0FBQyxVQUFpQixFQUFFLGdCQUF1Qjs7UUFDaEUsSUFBSSxNQUFNLENBQVU7UUFFcEIsSUFBSSxPQUFPLFVBQVUsS0FBSyxXQUFXLEVBQUU7WUFDckMsTUFBTSxHQUFHLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzdDO2FBQU07WUFDTCxNQUFNLEdBQUcs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Q0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQzs7SUFDbEYsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7OztJQUdoRSxPQUFPLFVBQVUsSUFBSSxNQUFNLENBQUM7Q0FDN0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZSwgaXNUeXBlfSBmcm9tICcuLi90eXBlJztcbmltcG9ydCB7Z2xvYmFsLCBzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwnO1xuaW1wb3J0IHtBTk5PVEFUSU9OUywgUEFSQU1FVEVSUywgUFJPUF9NRVRBREFUQX0gZnJvbSAnLi4vdXRpbC9kZWNvcmF0b3JzJztcblxuaW1wb3J0IHtQbGF0Zm9ybVJlZmxlY3Rpb25DYXBhYmlsaXRpZXN9IGZyb20gJy4vcGxhdGZvcm1fcmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMnO1xuaW1wb3J0IHtHZXR0ZXJGbiwgTWV0aG9kRm4sIFNldHRlckZufSBmcm9tICcuL3R5cGVzJztcblxuXG4vKipcbiAqIEF0dGVudGlvbjogVGhlc2UgcmVnZXggaGFzIHRvIGhvbGQgZXZlbiBpZiB0aGUgY29kZSBpcyBtaW5pZmllZCFcbiAqL1xuZXhwb3J0IGNvbnN0IERFTEVHQVRFX0NUT1IgPSAvXmZ1bmN0aW9uXFxzK1xcUytcXChcXClcXHMqe1tcXHNcXFNdK1xcLmFwcGx5XFwodGhpcyxcXHMqYXJndW1lbnRzXFwpLztcbmV4cG9ydCBjb25zdCBJTkhFUklURURfQ0xBU1MgPSAvXmNsYXNzXFxzK1tBLVphLXpcXGQkX10qXFxzKmV4dGVuZHNcXHMrW157XSt7LztcbmV4cG9ydCBjb25zdCBJTkhFUklURURfQ0xBU1NfV0lUSF9DVE9SID1cbiAgICAvXmNsYXNzXFxzK1tBLVphLXpcXGQkX10qXFxzKmV4dGVuZHNcXHMrW157XSt7W1xcc1xcU10qY29uc3RydWN0b3JcXHMqXFwoLztcblxuZXhwb3J0IGNsYXNzIFJlZmxlY3Rpb25DYXBhYmlsaXRpZXMgaW1wbGVtZW50cyBQbGF0Zm9ybVJlZmxlY3Rpb25DYXBhYmlsaXRpZXMge1xuICBwcml2YXRlIF9yZWZsZWN0OiBhbnk7XG5cbiAgY29uc3RydWN0b3IocmVmbGVjdD86IGFueSkgeyB0aGlzLl9yZWZsZWN0ID0gcmVmbGVjdCB8fCBnbG9iYWxbJ1JlZmxlY3QnXTsgfVxuXG4gIGlzUmVmbGVjdGlvbkVuYWJsZWQoKTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9XG5cbiAgZmFjdG9yeTxUPih0OiBUeXBlPFQ+KTogKGFyZ3M6IGFueVtdKSA9PiBUIHsgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gbmV3IHQoLi4uYXJncyk7IH1cblxuICAvKiogQGludGVybmFsICovXG4gIF96aXBUeXBlc0FuZEFubm90YXRpb25zKHBhcmFtVHlwZXM6IGFueVtdLCBwYXJhbUFubm90YXRpb25zOiBhbnlbXSk6IGFueVtdW10ge1xuICAgIGxldCByZXN1bHQ6IGFueVtdW107XG5cbiAgICBpZiAodHlwZW9mIHBhcmFtVHlwZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXN1bHQgPSBuZXcgQXJyYXkocGFyYW1Bbm5vdGF0aW9ucy5sZW5ndGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBuZXcgQXJyYXkocGFyYW1UeXBlcy5sZW5ndGgpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBUUyBvdXRwdXRzIE9iamVjdCBmb3IgcGFyYW1ldGVycyB3aXRob3V0IHR5cGVzLCB3aGlsZSBUcmFjZXVyIG9taXRzXG4gICAgICAvLyB0aGUgYW5ub3RhdGlvbnMuIEZvciBub3cgd2UgcHJlc2VydmUgdGhlIFRyYWNldXIgYmVoYXZpb3IgdG8gYWlkXG4gICAgICAvLyBtaWdyYXRpb24sIGJ1dCB0aGlzIGNhbiBiZSByZXZpc2l0ZWQuXG4gICAgICBpZiAodHlwZW9mIHBhcmFtVHlwZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJlc3VsdFtpXSA9IFtdO1xuICAgICAgfSBlbHNlIGlmIChwYXJhbVR5cGVzW2ldICE9IE9iamVjdCkge1xuICAgICAgICByZXN1bHRbaV0gPSBbcGFyYW1UeXBlc1tpXV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbaV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmIChwYXJhbUFubm90YXRpb25zICYmIHBhcmFtQW5ub3RhdGlvbnNbaV0gIT0gbnVsbCkge1xuICAgICAgICByZXN1bHRbaV0gPSByZXN1bHRbaV0uY29uY2F0KHBhcmFtQW5ub3RhdGlvbnNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBfb3duUGFyYW1ldGVycyh0eXBlOiBUeXBlPGFueT4sIHBhcmVudEN0b3I6IGFueSk6IGFueVtdW118bnVsbCB7XG4gICAgY29uc3QgdHlwZVN0ciA9IHR5cGUudG9TdHJpbmcoKTtcbiAgICAvLyBJZiB3ZSBoYXZlIG5vIGRlY29yYXRvcnMsIHdlIG9ubHkgaGF2ZSBmdW5jdGlvbi5sZW5ndGggYXMgbWV0YWRhdGEuXG4gICAgLy8gSW4gdGhhdCBjYXNlLCB0byBkZXRlY3Qgd2hldGhlciBhIGNoaWxkIGNsYXNzIGRlY2xhcmVkIGFuIG93biBjb25zdHJ1Y3RvciBvciBub3QsXG4gICAgLy8gd2UgbmVlZCB0byBsb29rIGluc2lkZSBvZiB0aGF0IGNvbnN0cnVjdG9yIHRvIGNoZWNrIHdoZXRoZXIgaXQgaXNcbiAgICAvLyBqdXN0IGNhbGxpbmcgdGhlIHBhcmVudC5cbiAgICAvLyBUaGlzIGFsc28gaGVscHMgdG8gd29yayBhcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMTI0MzlcbiAgICAvLyB0aGF0IHNldHMgJ2Rlc2lnbjpwYXJhbXR5cGVzJyB0byBbXVxuICAgIC8vIGlmIGEgY2xhc3MgaW5oZXJpdHMgZnJvbSBhbm90aGVyIGNsYXNzIGJ1dCBoYXMgbm8gY3RvciBkZWNsYXJlZCBpdHNlbGYuXG4gICAgaWYgKERFTEVHQVRFX0NUT1IuZXhlYyh0eXBlU3RyKSB8fFxuICAgICAgICAoSU5IRVJJVEVEX0NMQVNTLmV4ZWModHlwZVN0cikgJiYgIUlOSEVSSVRFRF9DTEFTU19XSVRIX0NUT1IuZXhlYyh0eXBlU3RyKSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIFByZWZlciB0aGUgZGlyZWN0IEFQSS5cbiAgICBpZiAoKDxhbnk+dHlwZSkucGFyYW1ldGVycyAmJiAoPGFueT50eXBlKS5wYXJhbWV0ZXJzICE9PSBwYXJlbnRDdG9yLnBhcmFtZXRlcnMpIHtcbiAgICAgIHJldHVybiAoPGFueT50eXBlKS5wYXJhbWV0ZXJzO1xuICAgIH1cblxuICAgIC8vIEFQSSBvZiB0c2lja2xlIGZvciBsb3dlcmluZyBkZWNvcmF0b3JzIHRvIHByb3BlcnRpZXMgb24gdGhlIGNsYXNzLlxuICAgIGNvbnN0IHRzaWNrbGVDdG9yUGFyYW1zID0gKDxhbnk+dHlwZSkuY3RvclBhcmFtZXRlcnM7XG4gICAgaWYgKHRzaWNrbGVDdG9yUGFyYW1zICYmIHRzaWNrbGVDdG9yUGFyYW1zICE9PSBwYXJlbnRDdG9yLmN0b3JQYXJhbWV0ZXJzKSB7XG4gICAgICAvLyBOZXdlciB0c2lja2xlIHVzZXMgYSBmdW5jdGlvbiBjbG9zdXJlXG4gICAgICAvLyBSZXRhaW4gdGhlIG5vbi1mdW5jdGlvbiBjYXNlIGZvciBjb21wYXRpYmlsaXR5IHdpdGggb2xkZXIgdHNpY2tsZVxuICAgICAgY29uc3QgY3RvclBhcmFtZXRlcnMgPVxuICAgICAgICAgIHR5cGVvZiB0c2lja2xlQ3RvclBhcmFtcyA9PT0gJ2Z1bmN0aW9uJyA/IHRzaWNrbGVDdG9yUGFyYW1zKCkgOiB0c2lja2xlQ3RvclBhcmFtcztcbiAgICAgIGNvbnN0IHBhcmFtVHlwZXMgPSBjdG9yUGFyYW1ldGVycy5tYXAoKGN0b3JQYXJhbTogYW55KSA9PiBjdG9yUGFyYW0gJiYgY3RvclBhcmFtLnR5cGUpO1xuICAgICAgY29uc3QgcGFyYW1Bbm5vdGF0aW9ucyA9IGN0b3JQYXJhbWV0ZXJzLm1hcChcbiAgICAgICAgICAoY3RvclBhcmFtOiBhbnkpID0+XG4gICAgICAgICAgICAgIGN0b3JQYXJhbSAmJiBjb252ZXJ0VHNpY2tsZURlY29yYXRvckludG9NZXRhZGF0YShjdG9yUGFyYW0uZGVjb3JhdG9ycykpO1xuICAgICAgcmV0dXJuIHRoaXMuX3ppcFR5cGVzQW5kQW5ub3RhdGlvbnMocGFyYW1UeXBlcywgcGFyYW1Bbm5vdGF0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8gQVBJIGZvciBtZXRhZGF0YSBjcmVhdGVkIGJ5IGludm9raW5nIHRoZSBkZWNvcmF0b3JzLlxuICAgIGNvbnN0IHBhcmFtQW5ub3RhdGlvbnMgPSB0eXBlLmhhc093blByb3BlcnR5KFBBUkFNRVRFUlMpICYmICh0eXBlIGFzIGFueSlbUEFSQU1FVEVSU107XG4gICAgY29uc3QgcGFyYW1UeXBlcyA9IHRoaXMuX3JlZmxlY3QgJiYgdGhpcy5fcmVmbGVjdC5nZXRPd25NZXRhZGF0YSAmJlxuICAgICAgICB0aGlzLl9yZWZsZWN0LmdldE93bk1ldGFkYXRhKCdkZXNpZ246cGFyYW10eXBlcycsIHR5cGUpO1xuICAgIGlmIChwYXJhbVR5cGVzIHx8IHBhcmFtQW5ub3RhdGlvbnMpIHtcbiAgICAgIHJldHVybiB0aGlzLl96aXBUeXBlc0FuZEFubm90YXRpb25zKHBhcmFtVHlwZXMsIHBhcmFtQW5ub3RhdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIElmIGEgY2xhc3MgaGFzIG5vIGRlY29yYXRvcnMsIGF0IGxlYXN0IGNyZWF0ZSBtZXRhZGF0YVxuICAgIC8vIGJhc2VkIG9uIGZ1bmN0aW9uLmxlbmd0aC5cbiAgICAvLyBOb3RlOiBXZSBrbm93IHRoYXQgdGhpcyBpcyBhIHJlYWwgY29uc3RydWN0b3IgYXMgd2UgY2hlY2tlZFxuICAgIC8vIHRoZSBjb250ZW50IG9mIHRoZSBjb25zdHJ1Y3RvciBhYm92ZS5cbiAgICByZXR1cm4gbmV3IEFycmF5KCg8YW55PnR5cGUubGVuZ3RoKSkuZmlsbCh1bmRlZmluZWQpO1xuICB9XG5cbiAgcGFyYW1ldGVycyh0eXBlOiBUeXBlPGFueT4pOiBhbnlbXVtdIHtcbiAgICAvLyBOb3RlOiBvbmx5IHJlcG9ydCBtZXRhZGF0YSBpZiB3ZSBoYXZlIGF0IGxlYXN0IG9uZSBjbGFzcyBkZWNvcmF0b3JcbiAgICAvLyB0byBzdGF5IGluIHN5bmMgd2l0aCB0aGUgc3RhdGljIHJlZmxlY3Rvci5cbiAgICBpZiAoIWlzVHlwZSh0eXBlKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnRDdG9yID0gZ2V0UGFyZW50Q3Rvcih0eXBlKTtcbiAgICBsZXQgcGFyYW1ldGVycyA9IHRoaXMuX293blBhcmFtZXRlcnModHlwZSwgcGFyZW50Q3Rvcik7XG4gICAgaWYgKCFwYXJhbWV0ZXJzICYmIHBhcmVudEN0b3IgIT09IE9iamVjdCkge1xuICAgICAgcGFyYW1ldGVycyA9IHRoaXMucGFyYW1ldGVycyhwYXJlbnRDdG9yKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcmFtZXRlcnMgfHwgW107XG4gIH1cblxuICBwcml2YXRlIF9vd25Bbm5vdGF0aW9ucyh0eXBlT3JGdW5jOiBUeXBlPGFueT4sIHBhcmVudEN0b3I6IGFueSk6IGFueVtdfG51bGwge1xuICAgIC8vIFByZWZlciB0aGUgZGlyZWN0IEFQSS5cbiAgICBpZiAoKDxhbnk+dHlwZU9yRnVuYykuYW5ub3RhdGlvbnMgJiYgKDxhbnk+dHlwZU9yRnVuYykuYW5ub3RhdGlvbnMgIT09IHBhcmVudEN0b3IuYW5ub3RhdGlvbnMpIHtcbiAgICAgIGxldCBhbm5vdGF0aW9ucyA9ICg8YW55PnR5cGVPckZ1bmMpLmFubm90YXRpb25zO1xuICAgICAgaWYgKHR5cGVvZiBhbm5vdGF0aW9ucyA9PT0gJ2Z1bmN0aW9uJyAmJiBhbm5vdGF0aW9ucy5hbm5vdGF0aW9ucykge1xuICAgICAgICBhbm5vdGF0aW9ucyA9IGFubm90YXRpb25zLmFubm90YXRpb25zO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFubm90YXRpb25zO1xuICAgIH1cblxuICAgIC8vIEFQSSBvZiB0c2lja2xlIGZvciBsb3dlcmluZyBkZWNvcmF0b3JzIHRvIHByb3BlcnRpZXMgb24gdGhlIGNsYXNzLlxuICAgIGlmICgoPGFueT50eXBlT3JGdW5jKS5kZWNvcmF0b3JzICYmICg8YW55PnR5cGVPckZ1bmMpLmRlY29yYXRvcnMgIT09IHBhcmVudEN0b3IuZGVjb3JhdG9ycykge1xuICAgICAgcmV0dXJuIGNvbnZlcnRUc2lja2xlRGVjb3JhdG9ySW50b01ldGFkYXRhKCg8YW55PnR5cGVPckZ1bmMpLmRlY29yYXRvcnMpO1xuICAgIH1cblxuICAgIC8vIEFQSSBmb3IgbWV0YWRhdGEgY3JlYXRlZCBieSBpbnZva2luZyB0aGUgZGVjb3JhdG9ycy5cbiAgICBpZiAodHlwZU9yRnVuYy5oYXNPd25Qcm9wZXJ0eShBTk5PVEFUSU9OUykpIHtcbiAgICAgIHJldHVybiAodHlwZU9yRnVuYyBhcyBhbnkpW0FOTk9UQVRJT05TXTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBhbm5vdGF0aW9ucyh0eXBlT3JGdW5jOiBUeXBlPGFueT4pOiBhbnlbXSB7XG4gICAgaWYgKCFpc1R5cGUodHlwZU9yRnVuYykpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50Q3RvciA9IGdldFBhcmVudEN0b3IodHlwZU9yRnVuYyk7XG4gICAgY29uc3Qgb3duQW5ub3RhdGlvbnMgPSB0aGlzLl9vd25Bbm5vdGF0aW9ucyh0eXBlT3JGdW5jLCBwYXJlbnRDdG9yKSB8fCBbXTtcbiAgICBjb25zdCBwYXJlbnRBbm5vdGF0aW9ucyA9IHBhcmVudEN0b3IgIT09IE9iamVjdCA/IHRoaXMuYW5ub3RhdGlvbnMocGFyZW50Q3RvcikgOiBbXTtcbiAgICByZXR1cm4gcGFyZW50QW5ub3RhdGlvbnMuY29uY2F0KG93bkFubm90YXRpb25zKTtcbiAgfVxuXG4gIHByaXZhdGUgX293blByb3BNZXRhZGF0YSh0eXBlT3JGdW5jOiBhbnksIHBhcmVudEN0b3I6IGFueSk6IHtba2V5OiBzdHJpbmddOiBhbnlbXX18bnVsbCB7XG4gICAgLy8gUHJlZmVyIHRoZSBkaXJlY3QgQVBJLlxuICAgIGlmICgoPGFueT50eXBlT3JGdW5jKS5wcm9wTWV0YWRhdGEgJiZcbiAgICAgICAgKDxhbnk+dHlwZU9yRnVuYykucHJvcE1ldGFkYXRhICE9PSBwYXJlbnRDdG9yLnByb3BNZXRhZGF0YSkge1xuICAgICAgbGV0IHByb3BNZXRhZGF0YSA9ICg8YW55PnR5cGVPckZ1bmMpLnByb3BNZXRhZGF0YTtcbiAgICAgIGlmICh0eXBlb2YgcHJvcE1ldGFkYXRhID09PSAnZnVuY3Rpb24nICYmIHByb3BNZXRhZGF0YS5wcm9wTWV0YWRhdGEpIHtcbiAgICAgICAgcHJvcE1ldGFkYXRhID0gcHJvcE1ldGFkYXRhLnByb3BNZXRhZGF0YTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcm9wTWV0YWRhdGE7XG4gICAgfVxuXG4gICAgLy8gQVBJIG9mIHRzaWNrbGUgZm9yIGxvd2VyaW5nIGRlY29yYXRvcnMgdG8gcHJvcGVydGllcyBvbiB0aGUgY2xhc3MuXG4gICAgaWYgKCg8YW55PnR5cGVPckZ1bmMpLnByb3BEZWNvcmF0b3JzICYmXG4gICAgICAgICg8YW55PnR5cGVPckZ1bmMpLnByb3BEZWNvcmF0b3JzICE9PSBwYXJlbnRDdG9yLnByb3BEZWNvcmF0b3JzKSB7XG4gICAgICBjb25zdCBwcm9wRGVjb3JhdG9ycyA9ICg8YW55PnR5cGVPckZ1bmMpLnByb3BEZWNvcmF0b3JzO1xuICAgICAgY29uc3QgcHJvcE1ldGFkYXRhID0gPHtba2V5OiBzdHJpbmddOiBhbnlbXX0+e307XG4gICAgICBPYmplY3Qua2V5cyhwcm9wRGVjb3JhdG9ycykuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgICAgcHJvcE1ldGFkYXRhW3Byb3BdID0gY29udmVydFRzaWNrbGVEZWNvcmF0b3JJbnRvTWV0YWRhdGEocHJvcERlY29yYXRvcnNbcHJvcF0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcHJvcE1ldGFkYXRhO1xuICAgIH1cblxuICAgIC8vIEFQSSBmb3IgbWV0YWRhdGEgY3JlYXRlZCBieSBpbnZva2luZyB0aGUgZGVjb3JhdG9ycy5cbiAgICBpZiAodHlwZU9yRnVuYy5oYXNPd25Qcm9wZXJ0eShQUk9QX01FVEFEQVRBKSkge1xuICAgICAgcmV0dXJuICh0eXBlT3JGdW5jIGFzIGFueSlbUFJPUF9NRVRBREFUQV07XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJvcE1ldGFkYXRhKHR5cGVPckZ1bmM6IGFueSk6IHtba2V5OiBzdHJpbmddOiBhbnlbXX0ge1xuICAgIGlmICghaXNUeXBlKHR5cGVPckZ1bmMpKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICAgIGNvbnN0IHBhcmVudEN0b3IgPSBnZXRQYXJlbnRDdG9yKHR5cGVPckZ1bmMpO1xuICAgIGNvbnN0IHByb3BNZXRhZGF0YToge1trZXk6IHN0cmluZ106IGFueVtdfSA9IHt9O1xuICAgIGlmIChwYXJlbnRDdG9yICE9PSBPYmplY3QpIHtcbiAgICAgIGNvbnN0IHBhcmVudFByb3BNZXRhZGF0YSA9IHRoaXMucHJvcE1ldGFkYXRhKHBhcmVudEN0b3IpO1xuICAgICAgT2JqZWN0LmtleXMocGFyZW50UHJvcE1ldGFkYXRhKS5mb3JFYWNoKChwcm9wTmFtZSkgPT4ge1xuICAgICAgICBwcm9wTWV0YWRhdGFbcHJvcE5hbWVdID0gcGFyZW50UHJvcE1ldGFkYXRhW3Byb3BOYW1lXTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBvd25Qcm9wTWV0YWRhdGEgPSB0aGlzLl9vd25Qcm9wTWV0YWRhdGEodHlwZU9yRnVuYywgcGFyZW50Q3Rvcik7XG4gICAgaWYgKG93blByb3BNZXRhZGF0YSkge1xuICAgICAgT2JqZWN0LmtleXMob3duUHJvcE1ldGFkYXRhKS5mb3JFYWNoKChwcm9wTmFtZSkgPT4ge1xuICAgICAgICBjb25zdCBkZWNvcmF0b3JzOiBhbnlbXSA9IFtdO1xuICAgICAgICBpZiAocHJvcE1ldGFkYXRhLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAgIGRlY29yYXRvcnMucHVzaCguLi5wcm9wTWV0YWRhdGFbcHJvcE5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgICBkZWNvcmF0b3JzLnB1c2goLi4ub3duUHJvcE1ldGFkYXRhW3Byb3BOYW1lXSk7XG4gICAgICAgIHByb3BNZXRhZGF0YVtwcm9wTmFtZV0gPSBkZWNvcmF0b3JzO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9wTWV0YWRhdGE7XG4gIH1cblxuICBoYXNMaWZlY3ljbGVIb29rKHR5cGU6IGFueSwgbGNQcm9wZXJ0eTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHR5cGUgaW5zdGFuY2VvZiBUeXBlICYmIGxjUHJvcGVydHkgaW4gdHlwZS5wcm90b3R5cGU7XG4gIH1cblxuICBndWFyZHModHlwZTogYW55KToge1trZXk6IHN0cmluZ106IGFueX0geyByZXR1cm4ge307IH1cblxuICBnZXR0ZXIobmFtZTogc3RyaW5nKTogR2V0dGVyRm4geyByZXR1cm4gPEdldHRlckZuPm5ldyBGdW5jdGlvbignbycsICdyZXR1cm4gby4nICsgbmFtZSArICc7Jyk7IH1cblxuICBzZXR0ZXIobmFtZTogc3RyaW5nKTogU2V0dGVyRm4ge1xuICAgIHJldHVybiA8U2V0dGVyRm4+bmV3IEZ1bmN0aW9uKCdvJywgJ3YnLCAncmV0dXJuIG8uJyArIG5hbWUgKyAnID0gdjsnKTtcbiAgfVxuXG4gIG1ldGhvZChuYW1lOiBzdHJpbmcpOiBNZXRob2RGbiB7XG4gICAgY29uc3QgZnVuY3Rpb25Cb2R5ID0gYGlmICghby4ke25hbWV9KSB0aHJvdyBuZXcgRXJyb3IoJ1wiJHtuYW1lfVwiIGlzIHVuZGVmaW5lZCcpO1xuICAgICAgICByZXR1cm4gby4ke25hbWV9LmFwcGx5KG8sIGFyZ3MpO2A7XG4gICAgcmV0dXJuIDxNZXRob2RGbj5uZXcgRnVuY3Rpb24oJ28nLCAnYXJncycsIGZ1bmN0aW9uQm9keSk7XG4gIH1cblxuICAvLyBUaGVyZSBpcyBub3QgYSBjb25jZXB0IG9mIGltcG9ydCB1cmkgaW4gSnMsIGJ1dCB0aGlzIGlzIHVzZWZ1bCBpbiBkZXZlbG9waW5nIERhcnQgYXBwbGljYXRpb25zLlxuICBpbXBvcnRVcmkodHlwZTogYW55KTogc3RyaW5nIHtcbiAgICAvLyBTdGF0aWNTeW1ib2xcbiAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdvYmplY3QnICYmIHR5cGVbJ2ZpbGVQYXRoJ10pIHtcbiAgICAgIHJldHVybiB0eXBlWydmaWxlUGF0aCddO1xuICAgIH1cbiAgICAvLyBSdW50aW1lIHR5cGVcbiAgICByZXR1cm4gYC4vJHtzdHJpbmdpZnkodHlwZSl9YDtcbiAgfVxuXG4gIHJlc291cmNlVXJpKHR5cGU6IGFueSk6IHN0cmluZyB7IHJldHVybiBgLi8ke3N0cmluZ2lmeSh0eXBlKX1gOyB9XG5cbiAgcmVzb2x2ZUlkZW50aWZpZXIobmFtZTogc3RyaW5nLCBtb2R1bGVVcmw6IHN0cmluZywgbWVtYmVyczogc3RyaW5nW10sIHJ1bnRpbWU6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHJ1bnRpbWU7XG4gIH1cbiAgcmVzb2x2ZUVudW0oZW51bUlkZW50aWZpZXI6IGFueSwgbmFtZTogc3RyaW5nKTogYW55IHsgcmV0dXJuIGVudW1JZGVudGlmaWVyW25hbWVdOyB9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUc2lja2xlRGVjb3JhdG9ySW50b01ldGFkYXRhKGRlY29yYXRvckludm9jYXRpb25zOiBhbnlbXSk6IGFueVtdIHtcbiAgaWYgKCFkZWNvcmF0b3JJbnZvY2F0aW9ucykge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICByZXR1cm4gZGVjb3JhdG9ySW52b2NhdGlvbnMubWFwKGRlY29yYXRvckludm9jYXRpb24gPT4ge1xuICAgIGNvbnN0IGRlY29yYXRvclR5cGUgPSBkZWNvcmF0b3JJbnZvY2F0aW9uLnR5cGU7XG4gICAgY29uc3QgYW5ub3RhdGlvbkNscyA9IGRlY29yYXRvclR5cGUuYW5ub3RhdGlvbkNscztcbiAgICBjb25zdCBhbm5vdGF0aW9uQXJncyA9IGRlY29yYXRvckludm9jYXRpb24uYXJncyA/IGRlY29yYXRvckludm9jYXRpb24uYXJncyA6IFtdO1xuICAgIHJldHVybiBuZXcgYW5ub3RhdGlvbkNscyguLi5hbm5vdGF0aW9uQXJncyk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRQYXJlbnRDdG9yKGN0b3I6IEZ1bmN0aW9uKTogVHlwZTxhbnk+IHtcbiAgY29uc3QgcGFyZW50UHJvdG8gPSBjdG9yLnByb3RvdHlwZSA/IE9iamVjdC5nZXRQcm90b3R5cGVPZihjdG9yLnByb3RvdHlwZSkgOiBudWxsO1xuICBjb25zdCBwYXJlbnRDdG9yID0gcGFyZW50UHJvdG8gPyBwYXJlbnRQcm90by5jb25zdHJ1Y3RvciA6IG51bGw7XG4gIC8vIE5vdGU6IFdlIGFsd2F5cyB1c2UgYE9iamVjdGAgYXMgdGhlIG51bGwgdmFsdWVcbiAgLy8gdG8gc2ltcGxpZnkgY2hlY2tpbmcgbGF0ZXIgb24uXG4gIHJldHVybiBwYXJlbnRDdG9yIHx8IE9iamVjdDtcbn1cbiJdfQ==