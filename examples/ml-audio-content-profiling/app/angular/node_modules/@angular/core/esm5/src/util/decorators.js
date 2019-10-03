/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
export var ANNOTATIONS = '__annotations__';
export var PARAMETERS = '__parameters__';
export var PROP_METADATA = '__prop__metadata__';
/**
 * @suppress {globalThis}
 */
export function makeDecorator(name, props, parentClass, additionalProcessing, typeFn) {
    var metaCtor = makeMetadataCtor(props);
    function DecoratorFactory() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _a;
        if (this instanceof DecoratorFactory) {
            metaCtor.call.apply(metaCtor, tslib_1.__spread([this], args));
            return this;
        }
        var annotationInstance = new ((_a = DecoratorFactory).bind.apply(_a, tslib_1.__spread([void 0], args)))();
        return function TypeDecorator(cls) {
            if (typeFn)
                typeFn.apply(void 0, tslib_1.__spread([cls], args));
            // Use of Object.defineProperty is important since it creates non-enumerable property which
            // prevents the property is copied during subclassing.
            var annotations = cls.hasOwnProperty(ANNOTATIONS) ?
                cls[ANNOTATIONS] :
                Object.defineProperty(cls, ANNOTATIONS, { value: [] })[ANNOTATIONS];
            annotations.push(annotationInstance);
            if (additionalProcessing)
                additionalProcessing(cls);
            return cls;
        };
    }
    if (parentClass) {
        DecoratorFactory.prototype = Object.create(parentClass.prototype);
    }
    DecoratorFactory.prototype.ngMetadataName = name;
    DecoratorFactory.annotationCls = DecoratorFactory;
    return DecoratorFactory;
}
function makeMetadataCtor(props) {
    return function ctor() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (props) {
            var values = props.apply(void 0, tslib_1.__spread(args));
            for (var propName in values) {
                this[propName] = values[propName];
            }
        }
    };
}
export function makeParamDecorator(name, props, parentClass) {
    var metaCtor = makeMetadataCtor(props);
    function ParamDecoratorFactory() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _a;
        if (this instanceof ParamDecoratorFactory) {
            metaCtor.apply(this, args);
            return this;
        }
        var annotationInstance = new ((_a = ParamDecoratorFactory).bind.apply(_a, tslib_1.__spread([void 0], args)))();
        ParamDecorator.annotation = annotationInstance;
        return ParamDecorator;
        function ParamDecorator(cls, unusedKey, index) {
            // Use of Object.defineProperty is important since it creates non-enumerable property which
            // prevents the property is copied during subclassing.
            var parameters = cls.hasOwnProperty(PARAMETERS) ?
                cls[PARAMETERS] :
                Object.defineProperty(cls, PARAMETERS, { value: [] })[PARAMETERS];
            // there might be gaps if some in between parameters do not have annotations.
            // we pad with nulls.
            while (parameters.length <= index) {
                parameters.push(null);
            }
            (parameters[index] = parameters[index] || []).push(annotationInstance);
            return cls;
        }
    }
    if (parentClass) {
        ParamDecoratorFactory.prototype = Object.create(parentClass.prototype);
    }
    ParamDecoratorFactory.prototype.ngMetadataName = name;
    ParamDecoratorFactory.annotationCls = ParamDecoratorFactory;
    return ParamDecoratorFactory;
}
export function makePropDecorator(name, props, parentClass, additionalProcessing) {
    var metaCtor = makeMetadataCtor(props);
    function PropDecoratorFactory() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _a;
        if (this instanceof PropDecoratorFactory) {
            metaCtor.apply(this, args);
            return this;
        }
        var decoratorInstance = new ((_a = PropDecoratorFactory).bind.apply(_a, tslib_1.__spread([void 0], args)))();
        function PropDecorator(target, name) {
            var constructor = target.constructor;
            // Use of Object.defineProperty is important since it creates non-enumerable property which
            // prevents the property is copied during subclassing.
            var meta = constructor.hasOwnProperty(PROP_METADATA) ?
                constructor[PROP_METADATA] :
                Object.defineProperty(constructor, PROP_METADATA, { value: {} })[PROP_METADATA];
            meta[name] = meta.hasOwnProperty(name) && meta[name] || [];
            meta[name].unshift(decoratorInstance);
            if (additionalProcessing)
                additionalProcessing.apply(void 0, tslib_1.__spread([target, name], args));
        }
        return PropDecorator;
    }
    if (parentClass) {
        PropDecoratorFactory.prototype = Object.create(parentClass.prototype);
    }
    PropDecoratorFactory.prototype.ngMetadataName = name;
    PropDecoratorFactory.annotationCls = PropDecoratorFactory;
    return PropDecoratorFactory;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3V0aWwvZGVjb3JhdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBK0JILE1BQU0sQ0FBQyxJQUFNLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQztBQUM3QyxNQUFNLENBQUMsSUFBTSxVQUFVLEdBQUcsZ0JBQWdCLENBQUM7QUFDM0MsTUFBTSxDQUFDLElBQU0sYUFBYSxHQUFHLG9CQUFvQixDQUFDO0FBRWxEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGFBQWEsQ0FDekIsSUFBWSxFQUFFLEtBQStCLEVBQUUsV0FBaUIsRUFDaEUsb0JBQThDLEVBQzlDLE1BQWdEO0lBRWxELElBQU0sUUFBUSxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXpDLFNBQVMsZ0JBQWdCO1FBQUMsY0FBYzthQUFkLFVBQWMsRUFBZCxxQkFBYyxFQUFkLElBQWM7WUFBZCx5QkFBYzs7O1FBQ3RDLElBQUksSUFBSSxZQUFZLGdCQUFnQixFQUFFO1lBQ3BDLFFBQVEsQ0FBQyxJQUFJLE9BQWIsUUFBUSxvQkFBTSxJQUFJLEdBQUssSUFBSSxHQUFFO1lBQzdCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxJQUFNLGtCQUFrQixRQUFPLENBQUEsS0FBQyxnQkFBd0IsQ0FBQSwyQ0FBSSxJQUFJLEtBQUMsQ0FBQztRQUNsRSxPQUFPLFNBQVMsYUFBYSxDQUFDLEdBQVk7WUFDeEMsSUFBSSxNQUFNO2dCQUFFLE1BQU0saUNBQUMsR0FBRyxHQUFLLElBQUksR0FBRTtZQUNqQywyRkFBMkY7WUFDM0Ysc0RBQXNEO1lBQ3RELElBQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFDaEQsR0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7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LE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRXRDLElBQUksb0JBQW9CO2dCQUFFLG9CQUFvQixpQ0FBQyxNQUFNLEVBQUUsSUFBSSxHQUFLLElBQUksR0FBRTtRQUN4RSxDQUFDO1FBRUQsT0FBTyxhQUFhLENBQUM7SUFDdkIsQ0FBQztJQUVELElBQUksV0FBVyxFQUFFO1FBQ2Ysb0JBQW9CLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQ3ZFO0lBRUQsb0JBQW9CLENBQUMsU0FBUyxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7SUFDL0Msb0JBQXFCLENBQUMsYUFBYSxHQUFHLG9CQUFvQixDQUFDO0lBQ2pFLE9BQU8sb0JBQW9CLENBQUM7QUFDOUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuLyoqXG4gKiBBbiBpbnRlcmZhY2UgaW1wbGVtZW50ZWQgYnkgYWxsIEFuZ3VsYXIgdHlwZSBkZWNvcmF0b3JzLCB3aGljaCBhbGxvd3MgdGhlbSB0byBiZSB1c2VkIGFzIEVTN1xuICogZGVjb3JhdG9ycyBhcyB3ZWxsIGFzXG4gKiBBbmd1bGFyIERTTCBzeW50YXguXG4gKlxuICogRVM3IHN5bnRheDpcbiAqXG4gKiBgYGBcbiAqIEBuZy5Db21wb25lbnQoey4uLn0pXG4gKiBjbGFzcyBNeUNsYXNzIHsuLi59XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVHlwZURlY29yYXRvciB7XG4gIC8qKlxuICAgKiBJbnZva2UgYXMgRVM3IGRlY29yYXRvci5cbiAgICovXG4gIDxUIGV4dGVuZHMgVHlwZTxhbnk+Pih0eXBlOiBUKTogVDtcblxuICAvLyBNYWtlIFR5cGVEZWNvcmF0b3IgYXNzaWduYWJsZSB0byBidWlsdC1pbiBQYXJhbWV0ZXJEZWNvcmF0b3IgdHlwZS5cbiAgLy8gUGFyYW1ldGVyRGVjb3JhdG9yIGlzIGRlY2xhcmVkIGluIGxpYi5kLnRzIGFzIGEgYGRlY2xhcmUgdHlwZWBcbiAgLy8gc28gd2UgY2Fubm90IGRlY2xhcmUgdGhpcyBpbnRlcmZhY2UgYXMgYSBzdWJ0eXBlLlxuICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMzM3OSNpc3N1ZWNvbW1lbnQtMTI2MTY5NDE3XG4gICh0YXJnZXQ6IE9iamVjdCwgcHJvcGVydHlLZXk/OiBzdHJpbmd8c3ltYm9sLCBwYXJhbWV0ZXJJbmRleD86IG51bWJlcik6IHZvaWQ7XG59XG5cbmV4cG9ydCBjb25zdCBBTk5PVEFUSU9OUyA9ICdfX2Fubm90YXRpb25zX18nO1xuZXhwb3J0IGNvbnN0IFBBUkFNRVRFUlMgPSAnX19wYXJhbWV0ZXJzX18nO1xuZXhwb3J0IGNvbnN0IFBST1BfTUVUQURBVEEgPSAnX19wcm9wX19tZXRhZGF0YV9fJztcblxuLyoqXG4gKiBAc3VwcHJlc3Mge2dsb2JhbFRoaXN9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYWtlRGVjb3JhdG9yPFQ+KFxuICAgIG5hbWU6IHN0cmluZywgcHJvcHM/OiAoLi4uYXJnczogYW55W10pID0+IGFueSwgcGFyZW50Q2xhc3M/OiBhbnksXG4gICAgYWRkaXRpb25hbFByb2Nlc3Npbmc/OiAodHlwZTogVHlwZTxUPikgPT4gdm9pZCxcbiAgICB0eXBlRm4/OiAodHlwZTogVHlwZTxUPiwgLi4uYXJnczogYW55W10pID0+IHZvaWQpOlxuICAgIHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogYW55OyAoLi4uYXJnczogYW55W10pOiBhbnk7ICguLi5hcmdzOiBhbnlbXSk6IChjbHM6IGFueSkgPT4gYW55O30ge1xuICBjb25zdCBtZXRhQ3RvciA9IG1ha2VNZXRhZGF0YUN0b3IocHJvcHMpO1xuXG4gIGZ1bmN0aW9uIERlY29yYXRvckZhY3RvcnkoLi4uYXJnczogYW55W10pOiAoY2xzOiBUeXBlPFQ+KSA9PiBhbnkge1xuICAgIGlmICh0aGlzIGluc3RhbmNlb2YgRGVjb3JhdG9yRmFjdG9yeSkge1xuICAgICAgbWV0YUN0b3IuY2FsbCh0aGlzLCAuLi5hcmdzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbnN0IGFubm90YXRpb25JbnN0YW5jZSA9IG5ldyAoRGVjb3JhdG9yRmFjdG9yeSBhcyBhbnkpKC4uLmFyZ3MpO1xuICAgIHJldHVybiBmdW5jdGlvbiBUeXBlRGVjb3JhdG9yKGNsczogVHlwZTxUPikge1xuICAgICAgaWYgKHR5cGVGbikgdHlwZUZuKGNscywgLi4uYXJncyk7XG4gICAgICAvLyBVc2Ugb2YgT2JqZWN0LmRlZmluZVByb3BlcnR5IGlzIGltcG9ydGFudCBzaW5jZSBpdCBjcmVhdGVzIG5vbi1lbnVtZXJhYmxlIHByb3BlcnR5IHdoaWNoXG4gICAgICAvLyBwcmV2ZW50cyB0aGUgcHJvcGVydHkgaXMgY29waWVkIGR1cmluZyBzdWJjbGFzc2luZy5cbiAgICAgIGNvbnN0IGFubm90YXRpb25zID0gY2xzLmhhc093blByb3BlcnR5KEFOTk9UQVRJT05TKSA/XG4gICAgICAgICAgKGNscyBhcyBhbnkpW0FOTk9UQVRJT05TXSA6XG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscywgQU5OT1RBVElPTlMsIHt2YWx1ZTogW119KVtBTk5PVEFUSU9OU107XG4gICAgICBhbm5vdGF0aW9ucy5wdXNoKGFubm90YXRpb25JbnN0YW5jZSk7XG5cblxuICAgICAgaWYgKGFkZGl0aW9uYWxQcm9jZXNzaW5nKSBhZGRpdGlvbmFsUHJvY2Vzc2luZyhjbHMpO1xuXG4gICAgICByZXR1cm4gY2xzO1xuICAgIH07XG4gIH1cblxuICBpZiAocGFyZW50Q2xhc3MpIHtcbiAgICBEZWNvcmF0b3JGYWN0b3J5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUocGFyZW50Q2xhc3MucHJvdG90eXBlKTtcbiAgfVxuXG4gIERlY29yYXRvckZhY3RvcnkucHJvdG90eXBlLm5nTWV0YWRhdGFOYW1lID0gbmFtZTtcbiAgKERlY29yYXRvckZhY3RvcnkgYXMgYW55KS5hbm5vdGF0aW9uQ2xzID0gRGVjb3JhdG9yRmFjdG9yeTtcbiAgcmV0dXJuIERlY29yYXRvckZhY3RvcnkgYXMgYW55O1xufVxuXG5mdW5jdGlvbiBtYWtlTWV0YWRhdGFDdG9yKHByb3BzPzogKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnkpOiBhbnkge1xuICByZXR1cm4gZnVuY3Rpb24gY3RvciguLi5hcmdzOiBhbnlbXSkge1xuICAgIGlmIChwcm9wcykge1xuICAgICAgY29uc3QgdmFsdWVzID0gcHJvcHMoLi4uYXJncyk7XG4gICAgICBmb3IgKGNvbnN0IHByb3BOYW1lIGluIHZhbHVlcykge1xuICAgICAgICB0aGlzW3Byb3BOYW1lXSA9IHZhbHVlc1twcm9wTmFtZV07XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZVBhcmFtRGVjb3JhdG9yKFxuICAgIG5hbWU6IHN0cmluZywgcHJvcHM/OiAoLi4uYXJnczogYW55W10pID0+IGFueSwgcGFyZW50Q2xhc3M/OiBhbnkpOiBhbnkge1xuICBjb25zdCBtZXRhQ3RvciA9IG1ha2VNZXRhZGF0YUN0b3IocHJvcHMpO1xuICBmdW5jdGlvbiBQYXJhbURlY29yYXRvckZhY3RvcnkoLi4uYXJnczogYW55W10pOiBhbnkge1xuICAgIGlmICh0aGlzIGluc3RhbmNlb2YgUGFyYW1EZWNvcmF0b3JGYWN0b3J5KSB7XG4gICAgICBtZXRhQ3Rvci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBjb25zdCBhbm5vdGF0aW9uSW5zdGFuY2UgPSBuZXcgKDxhbnk+UGFyYW1EZWNvcmF0b3JGYWN0b3J5KSguLi5hcmdzKTtcblxuICAgICg8YW55PlBhcmFtRGVjb3JhdG9yKS5hbm5vdGF0aW9uID0gYW5ub3RhdGlvbkluc3RhbmNlO1xuICAgIHJldHVybiBQYXJhbURlY29yYXRvcjtcblxuICAgIGZ1bmN0aW9uIFBhcmFtRGVjb3JhdG9yKGNsczogYW55LCB1bnVzZWRLZXk6IGFueSwgaW5kZXg6IG51bWJlcik6IGFueSB7XG4gICAgICAvLyBVc2Ugb2YgT2JqZWN0LmRlZmluZVByb3BlcnR5IGlzIGltcG9ydGFudCBzaW5jZSBpdCBjcmVhdGVzIG5vbi1lbnVtZXJhYmxlIHByb3BlcnR5IHdoaWNoXG4gICAgICAvLyBwcmV2ZW50cyB0aGUgcHJvcGVydHkgaXMgY29waWVkIGR1cmluZyBzdWJjbGFzc2luZy5cbiAgICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBjbHMuaGFzT3duUHJvcGVydHkoUEFSQU1FVEVSUykgP1xuICAgICAgICAgIChjbHMgYXMgYW55KVtQQVJBTUVURVJTXSA6XG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscywgUEFSQU1FVEVSUywge3ZhbHVlOiBbXX0pW1BBUkFNRVRFUlNdO1xuXG4gICAgICAvLyB0aGVyZSBtaWdodCBiZSBnYXBzIGlmIHNvbWUgaW4gYmV0d2VlbiBwYXJhbWV0ZXJzIGRvIG5vdCBoYXZlIGFubm90YXRpb25zLlxuICAgICAgLy8gd2UgcGFkIHdpdGggbnVsbHMuXG4gICAgICB3aGlsZSAocGFyYW1ldGVycy5sZW5ndGggPD0gaW5kZXgpIHtcbiAgICAgICAgcGFyYW1ldGVycy5wdXNoKG51bGwpO1xuICAgICAgfVxuXG4gICAgICAocGFyYW1ldGVyc1tpbmRleF0gPSBwYXJhbWV0ZXJzW2luZGV4XSB8fCBbXSkucHVzaChhbm5vdGF0aW9uSW5zdGFuY2UpO1xuICAgICAgcmV0dXJuIGNscztcbiAgICB9XG4gIH1cbiAgaWYgKHBhcmVudENsYXNzKSB7XG4gICAgUGFyYW1EZWNvcmF0b3JGYWN0b3J5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUocGFyZW50Q2xhc3MucHJvdG90eXBlKTtcbiAgfVxuICBQYXJhbURlY29yYXRvckZhY3RvcnkucHJvdG90eXBlLm5nTWV0YWRhdGFOYW1lID0gbmFtZTtcbiAgKDxhbnk+UGFyYW1EZWNvcmF0b3JGYWN0b3J5KS5hbm5vdGF0aW9uQ2xzID0gUGFyYW1EZWNvcmF0b3JGYWN0b3J5O1xuICByZXR1cm4gUGFyYW1EZWNvcmF0b3JGYWN0b3J5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZVByb3BEZWNvcmF0b3IoXG4gICAgbmFtZTogc3RyaW5nLCBwcm9wcz86ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55LCBwYXJlbnRDbGFzcz86IGFueSxcbiAgICBhZGRpdGlvbmFsUHJvY2Vzc2luZz86ICh0YXJnZXQ6IGFueSwgbmFtZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCk6IGFueSB7XG4gIGNvbnN0IG1ldGFDdG9yID0gbWFrZU1ldGFkYXRhQ3Rvcihwcm9wcyk7XG5cbiAgZnVuY3Rpb24gUHJvcERlY29yYXRvckZhY3RvcnkoLi4uYXJnczogYW55W10pOiBhbnkge1xuICAgIGlmICh0aGlzIGluc3RhbmNlb2YgUHJvcERlY29yYXRvckZhY3RvcnkpIHtcbiAgICAgIG1ldGFDdG9yLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY29uc3QgZGVjb3JhdG9ySW5zdGFuY2UgPSBuZXcgKDxhbnk+UHJvcERlY29yYXRvckZhY3RvcnkpKC4uLmFyZ3MpO1xuXG4gICAgZnVuY3Rpb24gUHJvcERlY29yYXRvcih0YXJnZXQ6IGFueSwgbmFtZTogc3RyaW5nKSB7XG4gICAgICBjb25zdCBjb25zdHJ1Y3RvciA9IHRhcmdldC5jb25zdHJ1Y3RvcjtcbiAgICAgIC8vIFVzZSBvZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgaXMgaW1wb3J0YW50IHNpbmNlIGl0IGNyZWF0ZXMgbm9uLWVudW1lcmFibGUgcHJvcGVydHkgd2hpY2hcbiAgICAgIC8vIHByZXZlbnRzIHRoZSBwcm9wZXJ0eSBpcyBjb3BpZWQgZHVyaW5nIHN1YmNsYXNzaW5nLlxuICAgICAgY29uc3QgbWV0YSA9IGNvbnN0cnVjdG9yLmhhc093blByb3BlcnR5KFBST1BfTUVUQURBVEEpID9cbiAgICAgICAgICAoY29uc3RydWN0b3IgYXMgYW55KVtQUk9QX01FVEFEQVRBXSA6XG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvbnN0cnVjdG9yLCBQUk9QX01FVEFEQVRBLCB7dmFsdWU6IHt9fSlbUFJPUF9NRVRBREFUQV07XG4gICAgICBtZXRhW25hbWVdID0gbWV0YS5oYXNPd25Qcm9wZXJ0eShuYW1lKSAmJiBtZXRhW25hbWVdIHx8IFtdO1xuICAgICAgbWV0YVtuYW1lXS51bnNoaWZ0KGRlY29yYXRvckluc3RhbmNlKTtcblxuICAgICAgaWYgKGFkZGl0aW9uYWxQcm9jZXNzaW5nKSBhZGRpdGlvbmFsUHJvY2Vzc2luZyh0YXJnZXQsIG5hbWUsIC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9wRGVjb3JhdG9yO1xuICB9XG5cbiAgaWYgKHBhcmVudENsYXNzKSB7XG4gICAgUHJvcERlY29yYXRvckZhY3RvcnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShwYXJlbnRDbGFzcy5wcm90b3R5cGUpO1xuICB9XG5cbiAgUHJvcERlY29yYXRvckZhY3RvcnkucHJvdG90eXBlLm5nTWV0YWRhdGFOYW1lID0gbmFtZTtcbiAgKDxhbnk+UHJvcERlY29yYXRvckZhY3RvcnkpLmFubm90YXRpb25DbHMgPSBQcm9wRGVjb3JhdG9yRmFjdG9yeTtcbiAgcmV0dXJuIFByb3BEZWNvcmF0b3JGYWN0b3J5O1xufVxuIl19