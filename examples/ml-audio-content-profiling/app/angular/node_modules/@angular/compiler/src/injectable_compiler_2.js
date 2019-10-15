/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler/src/injectable_compiler_2", ["require", "exports", "tslib", "@angular/compiler/src/identifiers", "@angular/compiler/src/output/output_ast", "@angular/compiler/src/render3/r3_factory", "@angular/compiler/src/render3/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var identifiers_1 = require("@angular/compiler/src/identifiers");
    var o = require("@angular/compiler/src/output/output_ast");
    var r3_factory_1 = require("@angular/compiler/src/render3/r3_factory");
    var util_1 = require("@angular/compiler/src/render3/util");
    function compileInjectable(meta) {
        var result = null;
        function makeFn(ret) {
            return o.fn([], [new o.ReturnStatement(ret)], undefined, undefined, meta.name + "_Factory");
        }
        var factoryMeta = {
            name: meta.name,
            type: meta.type,
            deps: meta.ctorDeps,
            injectFn: identifiers_1.Identifiers.inject,
        };
        if (meta.useClass !== undefined) {
            // meta.useClass has two modes of operation. Either deps are specified, in which case `new` is
            // used to instantiate the class with dependencies injected, or deps are not specified and
            // the factory of the class is used to instantiate it.
            //
            // A special case exists for useClass: Type where Type is the injectable type itself, in which
            // case omitting deps just uses the constructor dependencies instead.
            var useClassOnSelf = meta.useClass.isEquivalent(meta.type);
            var deps = meta.userDeps || (useClassOnSelf && meta.ctorDeps) || undefined;
            if (deps !== undefined) {
                // factory: () => new meta.useClass(...deps)
                result = r3_factory_1.compileFactoryFunction(tslib_1.__assign({}, factoryMeta, { delegate: meta.useClass, delegateDeps: deps, delegateType: r3_factory_1.R3FactoryDelegateType.Class }));
            }
            else {
                result = r3_factory_1.compileFactoryFunction(tslib_1.__assign({}, factoryMeta, { delegate: meta.useClass, delegateType: r3_factory_1.R3FactoryDelegateType.Factory }));
            }
        }
        else if (meta.useFactory !== undefined) {
            result = r3_factory_1.compileFactoryFunction(tslib_1.__assign({}, factoryMeta, { delegate: meta.useFactory, delegateDeps: meta.userDeps || [], delegateType: r3_factory_1.R3FactoryDelegateType.Function }));
        }
        else if (meta.useValue !== undefined) {
            // Note: it's safe to use `meta.useValue` instead of the `USE_VALUE in meta` check used for
            // client code because meta.useValue is an Expression which will be defined even if the actual
            // value is undefined.
            result = r3_factory_1.compileFactoryFunction(tslib_1.__assign({}, factoryMeta, { expression: meta.useValue }));
        }
        else if (meta.useExisting !== undefined) {
            // useExisting is an `inject` call on the existing token.
            result = r3_factory_1.compileFactoryFunction(tslib_1.__assign({}, factoryMeta, { expression: o.importExpr(identifiers_1.Identifiers.inject).callFn([meta.useExisting]) }));
        }
        else {
            result = r3_factory_1.compileFactoryFunction(factoryMeta);
        }
        var token = meta.type;
        var providedIn = meta.providedIn;
        var expression = o.importExpr(identifiers_1.Identifiers.defineInjectable).callFn([util_1.mapToMapExpression({ token: token, factory: result.factory, providedIn: providedIn })]);
        var type = new o.ExpressionType(o.importExpr(identifiers_1.Identifiers.InjectableDef, [new o.ExpressionType(meta.type)]));
        return {
            expression: expression,
            type: type,
            statements: result.statements,
        };
    }
    exports.compileInjectable = compileInjectable;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZV9jb21waWxlcl8yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL2luamVjdGFibGVfY29tcGlsZXJfMi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFHSCxpRUFBMEM7SUFDMUMsMkRBQXlDO0lBQ3pDLHVFQUE0SDtJQUM1SCwyREFBa0Q7SUFvQmxELFNBQWdCLGlCQUFpQixDQUFDLElBQTBCO1FBQzFELElBQUksTUFBTSxHQUE0RCxJQUFJLENBQUM7UUFFM0UsU0FBUyxNQUFNLENBQUMsR0FBaUI7WUFDL0IsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUssSUFBSSxDQUFDLElBQUksYUFBVSxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUVELElBQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUTtZQUNuQixRQUFRLEVBQUUseUJBQVcsQ0FBQyxNQUFNO1NBQzdCLENBQUM7UUFFRixJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFO1lBQy9CLDhGQUE4RjtZQUM5RiwwRkFBMEY7WUFDMUYsc0RBQXNEO1lBQ3RELEVBQUU7WUFDRiw4RkFBOEY7WUFDOUYscUVBQXFFO1lBRXJFLElBQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3RCxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxTQUFTLENBQUM7WUFFN0UsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUN0Qiw0Q0FBNEM7Z0JBQzVDLE1BQU0sR0FBRyxtQ0FBc0Isc0JBQzFCLFdBQVcsSUFDZCxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFDdkIsWUFBWSxFQUFFLElBQUksRUFDbEIsWUFBWSxFQUFFLGtDQUFxQixDQUFDLEtBQUssSUFDekMsQ0FBQzthQUNKO2lCQUFNO2dCQUNMLE1BQU0sR0FBRyxtQ0FBc0Isc0JBQzFCLFdBQVcsSUFDZCxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFDdkIsWUFBWSxFQUFFLGtDQUFxQixDQUFDLE9BQU8sSUFDM0MsQ0FBQzthQUNKO1NBQ0Y7YUFBTSxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFO1lBQ3hDLE1BQU0sR0FBRyxtQ0FBc0Isc0JBQzFCLFdBQVcsSUFDZCxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFDekIsWUFBWSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxFQUNqQyxZQUFZLEVBQUUsa0NBQXFCLENBQUMsUUFBUSxJQUM1QyxDQUFDO1NBQ0o7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFO1lBQ3RDLDJGQUEyRjtZQUMzRiw4RkFBOEY7WUFDOUYsc0JBQXNCO1lBQ3RCLE1BQU0sR0FBRyxtQ0FBc0Isc0JBQzFCLFdBQVcsSUFDZCxVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFDekIsQ0FBQztTQUNKO2FBQU0sSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLFNBQVMsRUFBRTtZQUN6Qyx5REFBeUQ7WUFDekQsTUFBTSxHQUFHLG1DQUFzQixzQkFDMUIsV0FBVyxJQUNkLFVBQVUsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLHlCQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQ3ZFLENBQUM7U0FDSjthQUFNO1lBQ0wsTUFBTSxHQUFHLG1DQUFzQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQzlDO1FBRUQsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN4QixJQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBRW5DLElBQU0sVUFBVSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMseUJBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLHlCQUFrQixDQUNwRixFQUFDLEtBQUssT0FBQSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLFVBQVUsWUFBQSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEQsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsY0FBYyxDQUM3QixDQUFDLENBQUMsVUFBVSxDQUFDLHlCQUFXLENBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVoRixPQUFPO1lBQ0wsVUFBVSxZQUFBO1lBQ1YsSUFBSSxNQUFBO1lBQ0osVUFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVO1NBQzlCLENBQUM7SUFDSixDQUFDO0lBOUVELDhDQThFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi9jb3JlJztcbmltcG9ydCB7SWRlbnRpZmllcnN9IGZyb20gJy4vaWRlbnRpZmllcnMnO1xuaW1wb3J0ICogYXMgbyBmcm9tICcuL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCB7UjNEZXBlbmRlbmN5TWV0YWRhdGEsIFIzRmFjdG9yeURlbGVnYXRlVHlwZSwgUjNGYWN0b3J5TWV0YWRhdGEsIGNvbXBpbGVGYWN0b3J5RnVuY3Rpb259IGZyb20gJy4vcmVuZGVyMy9yM19mYWN0b3J5JztcbmltcG9ydCB7bWFwVG9NYXBFeHByZXNzaW9ufSBmcm9tICcuL3JlbmRlcjMvdXRpbCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5qZWN0YWJsZURlZiB7XG4gIGV4cHJlc3Npb246IG8uRXhwcmVzc2lvbjtcbiAgdHlwZTogby5UeXBlO1xuICBzdGF0ZW1lbnRzOiBvLlN0YXRlbWVudFtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFIzSW5qZWN0YWJsZU1ldGFkYXRhIHtcbiAgbmFtZTogc3RyaW5nO1xuICB0eXBlOiBvLkV4cHJlc3Npb247XG4gIGN0b3JEZXBzOiBSM0RlcGVuZGVuY3lNZXRhZGF0YVtdfG51bGw7XG4gIHByb3ZpZGVkSW46IG8uRXhwcmVzc2lvbjtcbiAgdXNlQ2xhc3M/OiBvLkV4cHJlc3Npb247XG4gIHVzZUZhY3Rvcnk/OiBvLkV4cHJlc3Npb247XG4gIHVzZUV4aXN0aW5nPzogby5FeHByZXNzaW9uO1xuICB1c2VWYWx1ZT86IG8uRXhwcmVzc2lvbjtcbiAgdXNlckRlcHM/OiBSM0RlcGVuZGVuY3lNZXRhZGF0YVtdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUluamVjdGFibGUobWV0YTogUjNJbmplY3RhYmxlTWV0YWRhdGEpOiBJbmplY3RhYmxlRGVmIHtcbiAgbGV0IHJlc3VsdDoge2ZhY3Rvcnk6IG8uRXhwcmVzc2lvbiwgc3RhdGVtZW50czogby5TdGF0ZW1lbnRbXX18bnVsbCA9IG51bGw7XG5cbiAgZnVuY3Rpb24gbWFrZUZuKHJldDogby5FeHByZXNzaW9uKTogby5FeHByZXNzaW9uIHtcbiAgICByZXR1cm4gby5mbihbXSwgW25ldyBvLlJldHVyblN0YXRlbWVudChyZXQpXSwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGAke21ldGEubmFtZX1fRmFjdG9yeWApO1xuICB9XG5cbiAgY29uc3QgZmFjdG9yeU1ldGEgPSB7XG4gICAgbmFtZTogbWV0YS5uYW1lLFxuICAgIHR5cGU6IG1ldGEudHlwZSxcbiAgICBkZXBzOiBtZXRhLmN0b3JEZXBzLFxuICAgIGluamVjdEZuOiBJZGVudGlmaWVycy5pbmplY3QsXG4gIH07XG5cbiAgaWYgKG1ldGEudXNlQ2xhc3MgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIG1ldGEudXNlQ2xhc3MgaGFzIHR3byBtb2RlcyBvZiBvcGVyYXRpb24uIEVpdGhlciBkZXBzIGFyZSBzcGVjaWZpZWQsIGluIHdoaWNoIGNhc2UgYG5ld2AgaXNcbiAgICAvLyB1c2VkIHRvIGluc3RhbnRpYXRlIHRoZSBjbGFzcyB3aXRoIGRlcGVuZGVuY2llcyBpbmplY3RlZCwgb3IgZGVwcyBhcmUgbm90IHNwZWNpZmllZCBhbmRcbiAgICAvLyB0aGUgZmFjdG9yeSBvZiB0aGUgY2xhc3MgaXMgdXNlZCB0byBpbnN0YW50aWF0ZSBpdC5cbiAgICAvL1xuICAgIC8vIEEgc3BlY2lhbCBjYXNlIGV4aXN0cyBmb3IgdXNlQ2xhc3M6IFR5cGUgd2hlcmUgVHlwZSBpcyB0aGUgaW5qZWN0YWJsZSB0eXBlIGl0c2VsZiwgaW4gd2hpY2hcbiAgICAvLyBjYXNlIG9taXR0aW5nIGRlcHMganVzdCB1c2VzIHRoZSBjb25zdHJ1Y3RvciBkZXBlbmRlbmNpZXMgaW5zdGVhZC5cblxuICAgIGNvbnN0IHVzZUNsYXNzT25TZWxmID0gbWV0YS51c2VDbGFzcy5pc0VxdWl2YWxlbnQobWV0YS50eXBlKTtcbiAgICBjb25zdCBkZXBzID0gbWV0YS51c2VyRGVwcyB8fCAodXNlQ2xhc3NPblNlbGYgJiYgbWV0YS5jdG9yRGVwcykgfHwgdW5kZWZpbmVkO1xuXG4gICAgaWYgKGRlcHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gZmFjdG9yeTogKCkgPT4gbmV3IG1ldGEudXNlQ2xhc3MoLi4uZGVwcylcbiAgICAgIHJlc3VsdCA9IGNvbXBpbGVGYWN0b3J5RnVuY3Rpb24oe1xuICAgICAgICAuLi5mYWN0b3J5TWV0YSxcbiAgICAgICAgZGVsZWdhdGU6IG1ldGEudXNlQ2xhc3MsXG4gICAgICAgIGRlbGVnYXRlRGVwczogZGVwcyxcbiAgICAgICAgZGVsZWdhdGVUeXBlOiBSM0ZhY3RvcnlEZWxlZ2F0ZVR5cGUuQ2xhc3MsXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gY29tcGlsZUZhY3RvcnlGdW5jdGlvbih7XG4gICAgICAgIC4uLmZhY3RvcnlNZXRhLFxuICAgICAgICBkZWxlZ2F0ZTogbWV0YS51c2VDbGFzcyxcbiAgICAgICAgZGVsZWdhdGVUeXBlOiBSM0ZhY3RvcnlEZWxlZ2F0ZVR5cGUuRmFjdG9yeSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfSBlbHNlIGlmIChtZXRhLnVzZUZhY3RvcnkgIT09IHVuZGVmaW5lZCkge1xuICAgIHJlc3VsdCA9IGNvbXBpbGVGYWN0b3J5RnVuY3Rpb24oe1xuICAgICAgLi4uZmFjdG9yeU1ldGEsXG4gICAgICBkZWxlZ2F0ZTogbWV0YS51c2VGYWN0b3J5LFxuICAgICAgZGVsZWdhdGVEZXBzOiBtZXRhLnVzZXJEZXBzIHx8IFtdLFxuICAgICAgZGVsZWdhdGVUeXBlOiBSM0ZhY3RvcnlEZWxlZ2F0ZVR5cGUuRnVuY3Rpb24sXG4gICAgfSk7XG4gIH0gZWxzZSBpZiAobWV0YS51c2VWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gTm90ZTogaXQncyBzYWZlIHRvIHVzZSBgbWV0YS51c2VWYWx1ZWAgaW5zdGVhZCBvZiB0aGUgYFVTRV9WQUxVRSBpbiBtZXRhYCBjaGVjayB1c2VkIGZvclxuICAgIC8vIGNsaWVudCBjb2RlIGJlY2F1c2UgbWV0YS51c2VWYWx1ZSBpcyBhbiBFeHByZXNzaW9uIHdoaWNoIHdpbGwgYmUgZGVmaW5lZCBldmVuIGlmIHRoZSBhY3R1YWxcbiAgICAvLyB2YWx1ZSBpcyB1bmRlZmluZWQuXG4gICAgcmVzdWx0ID0gY29tcGlsZUZhY3RvcnlGdW5jdGlvbih7XG4gICAgICAuLi5mYWN0b3J5TWV0YSxcbiAgICAgIGV4cHJlc3Npb246IG1ldGEudXNlVmFsdWUsXG4gICAgfSk7XG4gIH0gZWxzZSBpZiAobWV0YS51c2VFeGlzdGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gdXNlRXhpc3RpbmcgaXMgYW4gYGluamVjdGAgY2FsbCBvbiB0aGUgZXhpc3RpbmcgdG9rZW4uXG4gICAgcmVzdWx0ID0gY29tcGlsZUZhY3RvcnlGdW5jdGlvbih7XG4gICAgICAuLi5mYWN0b3J5TWV0YSxcbiAgICAgIGV4cHJlc3Npb246IG8uaW1wb3J0RXhwcihJZGVudGlmaWVycy5pbmplY3QpLmNhbGxGbihbbWV0YS51c2VFeGlzdGluZ10pLFxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJlc3VsdCA9IGNvbXBpbGVGYWN0b3J5RnVuY3Rpb24oZmFjdG9yeU1ldGEpO1xuICB9XG5cbiAgY29uc3QgdG9rZW4gPSBtZXRhLnR5cGU7XG4gIGNvbnN0IHByb3ZpZGVkSW4gPSBtZXRhLnByb3ZpZGVkSW47XG5cbiAgY29uc3QgZXhwcmVzc2lvbiA9IG8uaW1wb3J0RXhwcihJZGVudGlmaWVycy5kZWZpbmVJbmplY3RhYmxlKS5jYWxsRm4oW21hcFRvTWFwRXhwcmVzc2lvbihcbiAgICAgIHt0b2tlbiwgZmFjdG9yeTogcmVzdWx0LmZhY3RvcnksIHByb3ZpZGVkSW59KV0pO1xuICBjb25zdCB0eXBlID0gbmV3IG8uRXhwcmVzc2lvblR5cGUoXG4gICAgICBvLmltcG9ydEV4cHIoSWRlbnRpZmllcnMuSW5qZWN0YWJsZURlZiwgW25ldyBvLkV4cHJlc3Npb25UeXBlKG1ldGEudHlwZSldKSk7XG5cbiAgcmV0dXJuIHtcbiAgICBleHByZXNzaW9uLFxuICAgIHR5cGUsXG4gICAgc3RhdGVtZW50czogcmVzdWx0LnN0YXRlbWVudHMsXG4gIH07XG59XG4iXX0=