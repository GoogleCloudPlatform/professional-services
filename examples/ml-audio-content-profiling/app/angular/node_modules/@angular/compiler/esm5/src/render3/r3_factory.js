/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { StaticSymbol } from '../aot/static_symbol';
import { tokenReference } from '../compile_metadata';
import { Identifiers } from '../identifiers';
import * as o from '../output/output_ast';
import { Identifiers as R3 } from '../render3/r3_identifiers';
import { unsupported } from './view/util';
export var R3FactoryDelegateType;
(function (R3FactoryDelegateType) {
    R3FactoryDelegateType[R3FactoryDelegateType["Class"] = 0] = "Class";
    R3FactoryDelegateType[R3FactoryDelegateType["Function"] = 1] = "Function";
    R3FactoryDelegateType[R3FactoryDelegateType["Factory"] = 2] = "Factory";
})(R3FactoryDelegateType || (R3FactoryDelegateType = {}));
/**
 * Resolved type of a dependency.
 *
 * Occasionally, dependencies will have special significance which is known statically. In that
 * case the `R3ResolvedDependencyType` informs the factory generator that a particular dependency
 * should be generated specially (usually by calling a special injection function instead of the
 * standard one).
 */
export var R3ResolvedDependencyType;
(function (R3ResolvedDependencyType) {
    /**
     * A normal token dependency.
     */
    R3ResolvedDependencyType[R3ResolvedDependencyType["Token"] = 0] = "Token";
    /**
     * The dependency is for an attribute.
     *
     * The token expression is a string representing the attribute name.
     */
    R3ResolvedDependencyType[R3ResolvedDependencyType["Attribute"] = 1] = "Attribute";
    /**
     * The dependency is for the `Injector` type itself.
     */
    R3ResolvedDependencyType[R3ResolvedDependencyType["Injector"] = 2] = "Injector";
})(R3ResolvedDependencyType || (R3ResolvedDependencyType = {}));
/**
 * Construct a factory function expression for the given `R3FactoryMetadata`.
 */
export function compileFactoryFunction(meta) {
    var t = o.variable('t');
    var statements = [];
    // The type to instantiate via constructor invocation. If there is no delegated factory, meaning
    // this type is always created by constructor invocation, then this is the type-to-create
    // parameter provided by the user (t) if specified, or the current type if not. If there is a
    // delegated factory (which is used to create the current type) then this is only the type-to-
    // create parameter (t).
    var typeForCtor = !isDelegatedMetadata(meta) ? new o.BinaryOperatorExpr(o.BinaryOperator.Or, t, meta.type) : t;
    var ctorExpr = null;
    if (meta.deps !== null) {
        // There is a constructor (either explicitly or implicitly defined).
        ctorExpr = new o.InstantiateExpr(typeForCtor, injectDependencies(meta.deps, meta.injectFn));
    }
    else {
        var baseFactory = o.variable("\u0275" + meta.name + "_BaseFactory");
        var getInheritedFactory = o.importExpr(R3.getInheritedFactory);
        var baseFactoryStmt = baseFactory.set(getInheritedFactory.callFn([meta.type])).toDeclStmt(o.INFERRED_TYPE, [
            o.StmtModifier.Exported, o.StmtModifier.Final
        ]);
        statements.push(baseFactoryStmt);
        // There is no constructor, use the base class' factory to construct typeForCtor.
        ctorExpr = baseFactory.callFn([typeForCtor]);
    }
    var ctorExprFinal = ctorExpr;
    var body = [];
    var retExpr = null;
    function makeConditionalFactory(nonCtorExpr) {
        var r = o.variable('r');
        body.push(r.set(o.NULL_EXPR).toDeclStmt());
        body.push(o.ifStmt(t, [r.set(ctorExprFinal).toStmt()], [r.set(nonCtorExpr).toStmt()]));
        return r;
    }
    if (isDelegatedMetadata(meta) && meta.delegateType === R3FactoryDelegateType.Factory) {
        var delegateFactory = o.variable("\u0275" + meta.name + "_BaseFactory");
        var getFactoryOf = o.importExpr(R3.getFactoryOf);
        if (meta.delegate.isEquivalent(meta.type)) {
            throw new Error("Illegal state: compiling factory that delegates to itself");
        }
        var delegateFactoryStmt = delegateFactory.set(getFactoryOf.callFn([meta.delegate])).toDeclStmt(o.INFERRED_TYPE, [
            o.StmtModifier.Exported, o.StmtModifier.Final
        ]);
        statements.push(delegateFactoryStmt);
        var r = makeConditionalFactory(delegateFactory.callFn([]));
        retExpr = r;
    }
    else if (isDelegatedMetadata(meta)) {
        // This type is created with a delegated factory. If a type parameter is not specified, call
        // the factory instead.
        var delegateArgs = injectDependencies(meta.delegateDeps, meta.injectFn);
        // Either call `new delegate(...)` or `delegate(...)` depending on meta.useNewForDelegate.
        var factoryExpr = new (meta.delegateType === R3FactoryDelegateType.Class ?
            o.InstantiateExpr :
            o.InvokeFunctionExpr)(meta.delegate, delegateArgs);
        retExpr = makeConditionalFactory(factoryExpr);
    }
    else if (isExpressionFactoryMetadata(meta)) {
        // TODO(alxhub): decide whether to lower the value here or in the caller
        retExpr = makeConditionalFactory(meta.expression);
    }
    else {
        retExpr = ctorExpr;
    }
    return {
        factory: o.fn([new o.FnParam('t', o.DYNAMIC_TYPE)], tslib_1.__spread(body, [new o.ReturnStatement(retExpr)]), o.INFERRED_TYPE, undefined, meta.name + "_Factory"),
        statements: statements,
    };
}
function injectDependencies(deps, injectFn) {
    return deps.map(function (dep) { return compileInjectDependency(dep, injectFn); });
}
function compileInjectDependency(dep, injectFn) {
    // Interpret the dependency according to its resolved type.
    switch (dep.resolved) {
        case R3ResolvedDependencyType.Token:
        case R3ResolvedDependencyType.Injector: {
            // Build up the injection flags according to the metadata.
            var flags = 0 /* Default */ | (dep.self ? 2 /* Self */ : 0) |
                (dep.skipSelf ? 4 /* SkipSelf */ : 0) | (dep.host ? 1 /* Host */ : 0) |
                (dep.optional ? 8 /* Optional */ : 0);
            // Determine the token used for injection. In almost all cases this is the given token, but
            // if the dependency is resolved to the `Injector` then the special `INJECTOR` token is used
            // instead.
            var token = dep.token;
            if (dep.resolved === R3ResolvedDependencyType.Injector) {
                token = o.importExpr(Identifiers.INJECTOR);
            }
            // Build up the arguments to the injectFn call.
            var injectArgs = [token];
            // If this dependency is optional or otherwise has non-default flags, then additional
            // parameters describing how to inject the dependency must be passed to the inject function
            // that's being used.
            if (flags !== 0 /* Default */ || dep.optional) {
                injectArgs.push(o.literal(flags));
            }
            return o.importExpr(injectFn).callFn(injectArgs);
        }
        case R3ResolvedDependencyType.Attribute:
            // In the case of attributes, the attribute name in question is given as the token.
            return o.importExpr(R3.injectAttribute).callFn([dep.token]);
        default:
            return unsupported("Unknown R3ResolvedDependencyType: " + R3ResolvedDependencyType[dep.resolved]);
    }
}
/**
 * A helper function useful for extracting `R3DependencyMetadata` from a Render2
 * `CompileTypeMetadata` instance.
 */
export function dependenciesFromGlobalMetadata(type, outputCtx, reflector) {
    var e_1, _a;
    // Use the `CompileReflector` to look up references to some well-known Angular types. These will
    // be compared with the token to statically determine whether the token has significance to
    // Angular, and set the correct `R3ResolvedDependencyType` as a result.
    var injectorRef = reflector.resolveExternalReference(Identifiers.Injector);
    // Iterate through the type's DI dependencies and produce `R3DependencyMetadata` for each of them.
    var deps = [];
    try {
        for (var _b = tslib_1.__values(type.diDeps), _c = _b.next(); !_c.done; _c = _b.next()) {
            var dependency = _c.value;
            if (dependency.token) {
                var tokenRef = tokenReference(dependency.token);
                var resolved = R3ResolvedDependencyType.Token;
                if (tokenRef === injectorRef) {
                    resolved = R3ResolvedDependencyType.Injector;
                }
                else if (dependency.isAttribute) {
                    resolved = R3ResolvedDependencyType.Attribute;
                }
                // In the case of most dependencies, the token will be a reference to a type. Sometimes,
                // however, it can be a string, in the case of older Angular code or @Attribute injection.
                var token = tokenRef instanceof StaticSymbol ? outputCtx.importExpr(tokenRef) : o.literal(tokenRef);
                // Construct the dependency.
                deps.push({
                    token: token,
                    resolved: resolved,
                    host: !!dependency.isHost,
                    optional: !!dependency.isOptional,
                    self: !!dependency.isSelf,
                    skipSelf: !!dependency.isSkipSelf,
                });
            }
            else {
                unsupported('dependency without a token');
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return deps;
}
function isDelegatedMetadata(meta) {
    return meta.delegateType !== undefined;
}
function isExpressionFactoryMetadata(meta) {
    return meta.expression !== undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9yZW5kZXIzL3IzX2ZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEVBQXNCLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBR3hFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMzQyxPQUFPLEtBQUssQ0FBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzFDLE9BQU8sRUFBQyxXQUFXLElBQUksRUFBRSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFHNUQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQW9DeEMsTUFBTSxDQUFOLElBQVkscUJBSVg7QUFKRCxXQUFZLHFCQUFxQjtJQUMvQixtRUFBSyxDQUFBO0lBQ0wseUVBQVEsQ0FBQTtJQUNSLHVFQUFPLENBQUE7QUFDVCxDQUFDLEVBSlcscUJBQXFCLEtBQXJCLHFCQUFxQixRQUloQztBQW9CRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxDQUFOLElBQVksd0JBaUJYO0FBakJELFdBQVksd0JBQXdCO0lBQ2xDOztPQUVHO0lBQ0gseUVBQVMsQ0FBQTtJQUVUOzs7O09BSUc7SUFDSCxpRkFBYSxDQUFBO0lBRWI7O09BRUc7SUFDSCwrRUFBWSxDQUFBO0FBQ2QsQ0FBQyxFQWpCVyx3QkFBd0IsS0FBeEIsd0JBQXdCLFFBaUJuQztBQXNDRDs7R0FFRztBQUNILE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxJQUF1QjtJQUU1RCxJQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLElBQU0sVUFBVSxHQUFrQixFQUFFLENBQUM7SUFF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LDJCQUEyQixDQUFDLElBQXVCO0lBQzFELE9BQVEsSUFBWSxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUM7QUFDaEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTdGF0aWNTeW1ib2x9IGZyb20gJy4uL2FvdC9zdGF0aWNfc3ltYm9sJztcbmltcG9ydCB7Q29tcGlsZVR5cGVNZXRhZGF0YSwgdG9rZW5SZWZlcmVuY2V9IGZyb20gJy4uL2NvbXBpbGVfbWV0YWRhdGEnO1xuaW1wb3J0IHtDb21waWxlUmVmbGVjdG9yfSBmcm9tICcuLi9jb21waWxlX3JlZmxlY3Rvcic7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuLi9jb3JlJztcbmltcG9ydCB7SWRlbnRpZmllcnN9IGZyb20gJy4uL2lkZW50aWZpZXJzJztcbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtJZGVudGlmaWVycyBhcyBSM30gZnJvbSAnLi4vcmVuZGVyMy9yM19pZGVudGlmaWVycyc7XG5pbXBvcnQge091dHB1dENvbnRleHR9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge3Vuc3VwcG9ydGVkfSBmcm9tICcuL3ZpZXcvdXRpbCc7XG5cblxuLyoqXG4gKiBNZXRhZGF0YSByZXF1aXJlZCBieSB0aGUgZmFjdG9yeSBnZW5lcmF0b3IgdG8gZ2VuZXJhdGUgYSBgZmFjdG9yeWAgZnVuY3Rpb24gZm9yIGEgdHlwZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSM0NvbnN0cnVjdG9yRmFjdG9yeU1ldGFkYXRhIHtcbiAgLyoqXG4gICAqIFN0cmluZyBuYW1lIG9mIHRoZSB0eXBlIGJlaW5nIGdlbmVyYXRlZCAodXNlZCB0byBuYW1lIHRoZSBmYWN0b3J5IGZ1bmN0aW9uKS5cbiAgICovXG4gIG5hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogQW4gZXhwcmVzc2lvbiByZXByZXNlbnRpbmcgdGhlIGZ1bmN0aW9uIChvciBjb25zdHJ1Y3Rvcikgd2hpY2ggd2lsbCBpbnN0YW50aWF0ZSB0aGUgcmVxdWVzdGVkXG4gICAqIHR5cGUuXG4gICAqXG4gICAqIFRoaXMgY291bGQgYmUgYSByZWZlcmVuY2UgdG8gYSBjb25zdHJ1Y3RvciB0eXBlLCBvciB0byBhIHVzZXItZGVmaW5lZCBmYWN0b3J5IGZ1bmN0aW9uLiBUaGVcbiAgICogYHVzZU5ld2AgcHJvcGVydHkgZGV0ZXJtaW5lcyB3aGV0aGVyIGl0IHdpbGwgYmUgY2FsbGVkIGFzIGEgY29uc3RydWN0b3Igb3Igbm90LlxuICAgKi9cbiAgdHlwZTogby5FeHByZXNzaW9uO1xuXG4gIC8qKlxuICAgKiBSZWdhcmRsZXNzIG9mIHdoZXRoZXIgYGZuT3JDbGFzc2AgaXMgYSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBvciBhIHVzZXItZGVmaW5lZCBmYWN0b3J5LCBpdFxuICAgKiBtYXkgaGF2ZSAwIG9yIG1vcmUgcGFyYW1ldGVycywgd2hpY2ggd2lsbCBiZSBpbmplY3RlZCBhY2NvcmRpbmcgdG8gdGhlIGBSM0RlcGVuZGVuY3lNZXRhZGF0YWBcbiAgICogZm9yIHRob3NlIHBhcmFtZXRlcnMuIElmIHRoaXMgaXMgYG51bGxgLCB0aGVuIHRoZSB0eXBlJ3MgY29uc3RydWN0b3IgaXMgbm9uZXhpc3RlbnQgYW5kIHdpbGxcbiAgICogYmUgaW5oZXJpdGVkIGZyb20gYGZuT3JDbGFzc2Agd2hpY2ggaXMgaW50ZXJwcmV0ZWQgYXMgdGhlIGN1cnJlbnQgdHlwZS5cbiAgICovXG4gIGRlcHM6IFIzRGVwZW5kZW5jeU1ldGFkYXRhW118bnVsbDtcblxuICAvKipcbiAgICogQW4gZXhwcmVzc2lvbiBmb3IgdGhlIGZ1bmN0aW9uIHdoaWNoIHdpbGwgYmUgdXNlZCB0byBpbmplY3QgZGVwZW5kZW5jaWVzLiBUaGUgQVBJIG9mIHRoaXNcbiAgICogZnVuY3Rpb24gY291bGQgYmUgZGlmZmVyZW50LCBhbmQgb3RoZXIgb3B0aW9ucyBjb250cm9sIGhvdyBpdCB3aWxsIGJlIGludm9rZWQuXG4gICAqL1xuICBpbmplY3RGbjogby5FeHRlcm5hbFJlZmVyZW5jZTtcbn1cblxuZXhwb3J0IGVudW0gUjNGYWN0b3J5RGVsZWdhdGVUeXBlIHtcbiAgQ2xhc3MsXG4gIEZ1bmN0aW9uLFxuICBGYWN0b3J5LFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFIzRGVsZWdhdGVkRmFjdG9yeU1ldGFkYXRhIGV4dGVuZHMgUjNDb25zdHJ1Y3RvckZhY3RvcnlNZXRhZGF0YSB7XG4gIGRlbGVnYXRlOiBvLkV4cHJlc3Npb247XG4gIGRlbGVnYXRlVHlwZTogUjNGYWN0b3J5RGVsZWdhdGVUeXBlLkZhY3Rvcnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUjNEZWxlZ2F0ZWRGbk9yQ2xhc3NNZXRhZGF0YSBleHRlbmRzIFIzQ29uc3RydWN0b3JGYWN0b3J5TWV0YWRhdGEge1xuICBkZWxlZ2F0ZTogby5FeHByZXNzaW9uO1xuICBkZWxlZ2F0ZVR5cGU6IFIzRmFjdG9yeURlbGVnYXRlVHlwZS5DbGFzc3xSM0ZhY3RvcnlEZWxlZ2F0ZVR5cGUuRnVuY3Rpb247XG4gIGRlbGVnYXRlRGVwczogUjNEZXBlbmRlbmN5TWV0YWRhdGFbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSM0V4cHJlc3Npb25GYWN0b3J5TWV0YWRhdGEgZXh0ZW5kcyBSM0NvbnN0cnVjdG9yRmFjdG9yeU1ldGFkYXRhIHtcbiAgZXhwcmVzc2lvbjogby5FeHByZXNzaW9uO1xufVxuXG5leHBvcnQgdHlwZSBSM0ZhY3RvcnlNZXRhZGF0YSA9IFIzQ29uc3RydWN0b3JGYWN0b3J5TWV0YWRhdGEgfCBSM0RlbGVnYXRlZEZhY3RvcnlNZXRhZGF0YSB8XG4gICAgUjNEZWxlZ2F0ZWRGbk9yQ2xhc3NNZXRhZGF0YSB8IFIzRXhwcmVzc2lvbkZhY3RvcnlNZXRhZGF0YTtcblxuLyoqXG4gKiBSZXNvbHZlZCB0eXBlIG9mIGEgZGVwZW5kZW5jeS5cbiAqXG4gKiBPY2Nhc2lvbmFsbHksIGRlcGVuZGVuY2llcyB3aWxsIGhhdmUgc3BlY2lhbCBzaWduaWZpY2FuY2Ugd2hpY2ggaXMga25vd24gc3RhdGljYWxseS4gSW4gdGhhdFxuICogY2FzZSB0aGUgYFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZWAgaW5mb3JtcyB0aGUgZmFjdG9yeSBnZW5lcmF0b3IgdGhhdCBhIHBhcnRpY3VsYXIgZGVwZW5kZW5jeVxuICogc2hvdWxkIGJlIGdlbmVyYXRlZCBzcGVjaWFsbHkgKHVzdWFsbHkgYnkgY2FsbGluZyBhIHNwZWNpYWwgaW5qZWN0aW9uIGZ1bmN0aW9uIGluc3RlYWQgb2YgdGhlXG4gKiBzdGFuZGFyZCBvbmUpLlxuICovXG5leHBvcnQgZW51bSBSM1Jlc29sdmVkRGVwZW5kZW5jeVR5cGUge1xuICAvKipcbiAgICogQSBub3JtYWwgdG9rZW4gZGVwZW5kZW5jeS5cbiAgICovXG4gIFRva2VuID0gMCxcblxuICAvKipcbiAgICogVGhlIGRlcGVuZGVuY3kgaXMgZm9yIGFuIGF0dHJpYnV0ZS5cbiAgICpcbiAgICogVGhlIHRva2VuIGV4cHJlc3Npb24gaXMgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBhdHRyaWJ1dGUgbmFtZS5cbiAgICovXG4gIEF0dHJpYnV0ZSA9IDEsXG5cbiAgLyoqXG4gICAqIFRoZSBkZXBlbmRlbmN5IGlzIGZvciB0aGUgYEluamVjdG9yYCB0eXBlIGl0c2VsZi5cbiAgICovXG4gIEluamVjdG9yID0gMixcbn1cblxuLyoqXG4gKiBNZXRhZGF0YSByZXByZXNlbnRpbmcgYSBzaW5nbGUgZGVwZW5kZW5jeSB0byBiZSBpbmplY3RlZCBpbnRvIGEgY29uc3RydWN0b3Igb3IgZnVuY3Rpb24gY2FsbC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSM0RlcGVuZGVuY3lNZXRhZGF0YSB7XG4gIC8qKlxuICAgKiBBbiBleHByZXNzaW9uIHJlcHJlc2VudGluZyB0aGUgdG9rZW4gb3IgdmFsdWUgdG8gYmUgaW5qZWN0ZWQuXG4gICAqL1xuICB0b2tlbjogby5FeHByZXNzaW9uO1xuXG4gIC8qKlxuICAgKiBBbiBlbnVtIGluZGljYXRpbmcgd2hldGhlciB0aGlzIGRlcGVuZGVuY3kgaGFzIHNwZWNpYWwgbWVhbmluZyB0byBBbmd1bGFyIGFuZCBuZWVkcyB0byBiZVxuICAgKiBpbmplY3RlZCBzcGVjaWFsbHkuXG4gICAqL1xuICByZXNvbHZlZDogUjNSZXNvbHZlZERlcGVuZGVuY3lUeXBlO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBkZXBlbmRlbmN5IGhhcyBhbiBASG9zdCBxdWFsaWZpZXIuXG4gICAqL1xuICBob3N0OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBkZXBlbmRlbmN5IGhhcyBhbiBAT3B0aW9uYWwgcXVhbGlmaWVyLlxuICAgKi9cbiAgb3B0aW9uYWw6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGRlcGVuZGVuY3kgaGFzIGFuIEBTZWxmIHF1YWxpZmllci5cbiAgICovXG4gIHNlbGY6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGRlcGVuZGVuY3kgaGFzIGFuIEBTa2lwU2VsZiBxdWFsaWZpZXIuXG4gICAqL1xuICBza2lwU2VsZjogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3QgYSBmYWN0b3J5IGZ1bmN0aW9uIGV4cHJlc3Npb24gZm9yIHRoZSBnaXZlbiBgUjNGYWN0b3J5TWV0YWRhdGFgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUZhY3RvcnlGdW5jdGlvbihtZXRhOiBSM0ZhY3RvcnlNZXRhZGF0YSk6XG4gICAge2ZhY3Rvcnk6IG8uRXhwcmVzc2lvbiwgc3RhdGVtZW50czogby5TdGF0ZW1lbnRbXX0ge1xuICBjb25zdCB0ID0gby52YXJpYWJsZSgndCcpO1xuICBjb25zdCBzdGF0ZW1lbnRzOiBvLlN0YXRlbWVudFtdID0gW107XG5cbiAgLy8gVGhlIHR5cGUgdG8gaW5zdGFudGlhdGUgdmlhIGNvbnN0cnVjdG9yIGludm9jYXRpb24uIElmIHRoZXJlIGlzIG5vIGRlbGVnYXRlZCBmYWN0b3J5LCBtZWFuaW5nXG4gIC8vIHRoaXMgdHlwZSBpcyBhbHdheXMgY3JlYXRlZCBieSBjb25zdHJ1Y3RvciBpbnZvY2F0aW9uLCB0aGVuIHRoaXMgaXMgdGhlIHR5cGUtdG8tY3JlYXRlXG4gIC8vIHBhcmFtZXRlciBwcm92aWRlZCBieSB0aGUgdXNlciAodCkgaWYgc3BlY2lmaWVkLCBvciB0aGUgY3VycmVudCB0eXBlIGlmIG5vdC4gSWYgdGhlcmUgaXMgYVxuICAvLyBkZWxlZ2F0ZWQgZmFjdG9yeSAod2hpY2ggaXMgdXNlZCB0byBjcmVhdGUgdGhlIGN1cnJlbnQgdHlwZSkgdGhlbiB0aGlzIGlzIG9ubHkgdGhlIHR5cGUtdG8tXG4gIC8vIGNyZWF0ZSBwYXJhbWV0ZXIgKHQpLlxuICBjb25zdCB0eXBlRm9yQ3RvciA9XG4gICAgICAhaXNEZWxlZ2F0ZWRNZXRhZGF0YShtZXRhKSA/IG5ldyBvLkJpbmFyeU9wZXJhdG9yRXhwcihvLkJpbmFyeU9wZXJhdG9yLk9yLCB0LCBtZXRhLnR5cGUpIDogdDtcblxuICBsZXQgY3RvckV4cHI6IG8uRXhwcmVzc2lvbnxudWxsID0gbnVsbDtcbiAgaWYgKG1ldGEuZGVwcyAhPT0gbnVsbCkge1xuICAgIC8vIFRoZXJlIGlzIGEgY29uc3RydWN0b3IgKGVpdGhlciBleHBsaWNpdGx5IG9yIGltcGxpY2l0bHkgZGVmaW5lZCkuXG4gICAgY3RvckV4cHIgPSBuZXcgby5JbnN0YW50aWF0ZUV4cHIodHlwZUZvckN0b3IsIGluamVjdERlcGVuZGVuY2llcyhtZXRhLmRlcHMsIG1ldGEuaW5qZWN0Rm4pKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBiYXNlRmFjdG9yeSA9IG8udmFyaWFibGUoYMm1JHttZXRhLm5hbWV9X0Jhc2VGYWN0b3J5YCk7XG4gICAgY29uc3QgZ2V0SW5oZXJpdGVkRmFjdG9yeSA9IG8uaW1wb3J0RXhwcihSMy5nZXRJbmhlcml0ZWRGYWN0b3J5KTtcbiAgICBjb25zdCBiYXNlRmFjdG9yeVN0bXQgPVxuICAgICAgICBiYXNlRmFjdG9yeS5zZXQoZ2V0SW5oZXJpdGVkRmFjdG9yeS5jYWxsRm4oW21ldGEudHlwZV0pKS50b0RlY2xTdG10KG8uSU5GRVJSRURfVFlQRSwgW1xuICAgICAgICAgIG8uU3RtdE1vZGlmaWVyLkV4cG9ydGVkLCBvLlN0bXRNb2RpZmllci5GaW5hbFxuICAgICAgICBdKTtcbiAgICBzdGF0ZW1lbnRzLnB1c2goYmFzZUZhY3RvcnlTdG10KTtcblxuICAgIC8vIFRoZXJlIGlzIG5vIGNvbnN0cnVjdG9yLCB1c2UgdGhlIGJhc2UgY2xhc3MnIGZhY3RvcnkgdG8gY29uc3RydWN0IHR5cGVGb3JDdG9yLlxuICAgIGN0b3JFeHByID0gYmFzZUZhY3RvcnkuY2FsbEZuKFt0eXBlRm9yQ3Rvcl0pO1xuICB9XG4gIGNvbnN0IGN0b3JFeHByRmluYWwgPSBjdG9yRXhwcjtcblxuICBjb25zdCBib2R5OiBvLlN0YXRlbWVudFtdID0gW107XG4gIGxldCByZXRFeHByOiBvLkV4cHJlc3Npb258bnVsbCA9IG51bGw7XG5cbiAgZnVuY3Rpb24gbWFrZUNvbmRpdGlvbmFsRmFjdG9yeShub25DdG9yRXhwcjogby5FeHByZXNzaW9uKTogby5SZWFkVmFyRXhwciB7XG4gICAgY29uc3QgciA9IG8udmFyaWFibGUoJ3InKTtcbiAgICBib2R5LnB1c2goci5zZXQoby5OVUxMX0VYUFIpLnRvRGVjbFN0bXQoKSk7XG4gICAgYm9keS5wdXNoKG8uaWZTdG10KHQsIFtyLnNldChjdG9yRXhwckZpbmFsKS50b1N0bXQoKV0sIFtyLnNldChub25DdG9yRXhwcikudG9TdG10KCldKSk7XG4gICAgcmV0dXJuIHI7XG4gIH1cblxuICBpZiAoaXNEZWxlZ2F0ZWRNZXRhZGF0YShtZXRhKSAmJiBtZXRhLmRlbGVnYXRlVHlwZSA9PT0gUjNGYWN0b3J5RGVsZWdhdGVUeXBlLkZhY3RvcnkpIHtcbiAgICBjb25zdCBkZWxlZ2F0ZUZhY3RvcnkgPSBvLnZhcmlhYmxlKGDJtSR7bWV0YS5uYW1lfV9CYXNlRmFjdG9yeWApO1xuICAgIGNvbnN0IGdldEZhY3RvcnlPZiA9IG8uaW1wb3J0RXhwcihSMy5nZXRGYWN0b3J5T2YpO1xuICAgIGlmIChtZXRhLmRlbGVnYXRlLmlzRXF1aXZhbGVudChtZXRhLnR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYElsbGVnYWwgc3RhdGU6IGNvbXBpbGluZyBmYWN0b3J5IHRoYXQgZGVsZWdhdGVzIHRvIGl0c2VsZmApO1xuICAgIH1cbiAgICBjb25zdCBkZWxlZ2F0ZUZhY3RvcnlTdG10ID1cbiAgICAgICAgZGVsZWdhdGVGYWN0b3J5LnNldChnZXRGYWN0b3J5T2YuY2FsbEZuKFttZXRhLmRlbGVnYXRlXSkpLnRvRGVjbFN0bXQoby5JTkZFUlJFRF9UWVBFLCBbXG4gICAgICAgICAgby5TdG10TW9kaWZpZXIuRXhwb3J0ZWQsIG8uU3RtdE1vZGlmaWVyLkZpbmFsXG4gICAgICAgIF0pO1xuXG4gICAgc3RhdGVtZW50cy5wdXNoKGRlbGVnYXRlRmFjdG9yeVN0bXQpO1xuICAgIGNvbnN0IHIgPSBtYWtlQ29uZGl0aW9uYWxGYWN0b3J5KGRlbGVnYXRlRmFjdG9yeS5jYWxsRm4oW10pKTtcbiAgICByZXRFeHByID0gcjtcbiAgfSBlbHNlIGlmIChpc0RlbGVnYXRlZE1ldGFkYXRhKG1ldGEpKSB7XG4gICAgLy8gVGhpcyB0eXBlIGlzIGNyZWF0ZWQgd2l0aCBhIGRlbGVnYXRlZCBmYWN0b3J5LiBJZiBhIHR5cGUgcGFyYW1ldGVyIGlzIG5vdCBzcGVjaWZpZWQsIGNhbGxcbiAgICAvLyB0aGUgZmFjdG9yeSBpbnN0ZWFkLlxuICAgIGNvbnN0IGRlbGVnYXRlQXJncyA9IGluamVjdERlcGVuZGVuY2llcyhtZXRhLmRlbGVnYXRlRGVwcywgbWV0YS5pbmplY3RGbik7XG4gICAgLy8gRWl0aGVyIGNhbGwgYG5ldyBkZWxlZ2F0ZSguLi4pYCBvciBgZGVsZWdhdGUoLi4uKWAgZGVwZW5kaW5nIG9uIG1ldGEudXNlTmV3Rm9yRGVsZWdhdGUuXG4gICAgY29uc3QgZmFjdG9yeUV4cHIgPSBuZXcgKFxuICAgICAgICBtZXRhLmRlbGVnYXRlVHlwZSA9PT0gUjNGYWN0b3J5RGVsZWdhdGVUeXBlLkNsYXNzID9cbiAgICAgICAgICAgIG8uSW5zdGFudGlhdGVFeHByIDpcbiAgICAgICAgICAgIG8uSW52b2tlRnVuY3Rpb25FeHByKShtZXRhLmRlbGVnYXRlLCBkZWxlZ2F0ZUFyZ3MpO1xuICAgIHJldEV4cHIgPSBtYWtlQ29uZGl0aW9uYWxGYWN0b3J5KGZhY3RvcnlFeHByKTtcbiAgfSBlbHNlIGlmIChpc0V4cHJlc3Npb25GYWN0b3J5TWV0YWRhdGEobWV0YSkpIHtcbiAgICAvLyBUT0RPKGFseGh1Yik6IGRlY2lkZSB3aGV0aGVyIHRvIGxvd2VyIHRoZSB2YWx1ZSBoZXJlIG9yIGluIHRoZSBjYWxsZXJcbiAgICByZXRFeHByID0gbWFrZUNvbmRpdGlvbmFsRmFjdG9yeShtZXRhLmV4cHJlc3Npb24pO1xuICB9IGVsc2Uge1xuICAgIHJldEV4cHIgPSBjdG9yRXhwcjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZmFjdG9yeTogby5mbihcbiAgICAgICAgW25ldyBvLkZuUGFyYW0oJ3QnLCBvLkRZTkFNSUNfVFlQRSldLCBbLi4uYm9keSwgbmV3IG8uUmV0dXJuU3RhdGVtZW50KHJldEV4cHIpXSxcbiAgICAgICAgby5JTkZFUlJFRF9UWVBFLCB1bmRlZmluZWQsIGAke21ldGEubmFtZX1fRmFjdG9yeWApLFxuICAgIHN0YXRlbWVudHMsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGluamVjdERlcGVuZGVuY2llcyhcbiAgICBkZXBzOiBSM0RlcGVuZGVuY3lNZXRhZGF0YVtdLCBpbmplY3RGbjogby5FeHRlcm5hbFJlZmVyZW5jZSk6IG8uRXhwcmVzc2lvbltdIHtcbiAgcmV0dXJuIGRlcHMubWFwKGRlcCA9PiBjb21waWxlSW5qZWN0RGVwZW5kZW5jeShkZXAsIGluamVjdEZuKSk7XG59XG5cbmZ1bmN0aW9uIGNvbXBpbGVJbmplY3REZXBlbmRlbmN5KFxuICAgIGRlcDogUjNEZXBlbmRlbmN5TWV0YWRhdGEsIGluamVjdEZuOiBvLkV4dGVybmFsUmVmZXJlbmNlKTogby5FeHByZXNzaW9uIHtcbiAgLy8gSW50ZXJwcmV0IHRoZSBkZXBlbmRlbmN5IGFjY29yZGluZyB0byBpdHMgcmVzb2x2ZWQgdHlwZS5cbiAgc3dpdGNoIChkZXAucmVzb2x2ZWQpIHtcbiAgICBjYXNlIFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZS5Ub2tlbjpcbiAgICBjYXNlIFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZS5JbmplY3Rvcjoge1xuICAgICAgLy8gQnVpbGQgdXAgdGhlIGluamVjdGlvbiBmbGFncyBhY2NvcmRpbmcgdG8gdGhlIG1ldGFkYXRhLlxuICAgICAgY29uc3QgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0IHwgKGRlcC5zZWxmID8gSW5qZWN0RmxhZ3MuU2VsZiA6IDApIHxcbiAgICAgICAgICAoZGVwLnNraXBTZWxmID8gSW5qZWN0RmxhZ3MuU2tpcFNlbGYgOiAwKSB8IChkZXAuaG9zdCA/IEluamVjdEZsYWdzLkhvc3QgOiAwKSB8XG4gICAgICAgICAgKGRlcC5vcHRpb25hbCA/IEluamVjdEZsYWdzLk9wdGlvbmFsIDogMCk7XG4gICAgICAvLyBEZXRlcm1pbmUgdGhlIHRva2VuIHVzZWQgZm9yIGluamVjdGlvbi4gSW4gYWxtb3N0IGFsbCBjYXNlcyB0aGlzIGlzIHRoZSBnaXZlbiB0b2tlbiwgYnV0XG4gICAgICAvLyBpZiB0aGUgZGVwZW5kZW5jeSBpcyByZXNvbHZlZCB0byB0aGUgYEluamVjdG9yYCB0aGVuIHRoZSBzcGVjaWFsIGBJTkpFQ1RPUmAgdG9rZW4gaXMgdXNlZFxuICAgICAgLy8gaW5zdGVhZC5cbiAgICAgIGxldCB0b2tlbjogby5FeHByZXNzaW9uID0gZGVwLnRva2VuO1xuICAgICAgaWYgKGRlcC5yZXNvbHZlZCA9PT0gUjNSZXNvbHZlZERlcGVuZGVuY3lUeXBlLkluamVjdG9yKSB7XG4gICAgICAgIHRva2VuID0gby5pbXBvcnRFeHByKElkZW50aWZpZXJzLklOSkVDVE9SKTtcbiAgICAgIH1cblxuICAgICAgLy8gQnVpbGQgdXAgdGhlIGFyZ3VtZW50cyB0byB0aGUgaW5qZWN0Rm4gY2FsbC5cbiAgICAgIGNvbnN0IGluamVjdEFyZ3MgPSBbdG9rZW5dO1xuICAgICAgLy8gSWYgdGhpcyBkZXBlbmRlbmN5IGlzIG9wdGlvbmFsIG9yIG90aGVyd2lzZSBoYXMgbm9uLWRlZmF1bHQgZmxhZ3MsIHRoZW4gYWRkaXRpb25hbFxuICAgICAgLy8gcGFyYW1ldGVycyBkZXNjcmliaW5nIGhvdyB0byBpbmplY3QgdGhlIGRlcGVuZGVuY3kgbXVzdCBiZSBwYXNzZWQgdG8gdGhlIGluamVjdCBmdW5jdGlvblxuICAgICAgLy8gdGhhdCdzIGJlaW5nIHVzZWQuXG4gICAgICBpZiAoZmxhZ3MgIT09IEluamVjdEZsYWdzLkRlZmF1bHQgfHwgZGVwLm9wdGlvbmFsKSB7XG4gICAgICAgIGluamVjdEFyZ3MucHVzaChvLmxpdGVyYWwoZmxhZ3MpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvLmltcG9ydEV4cHIoaW5qZWN0Rm4pLmNhbGxGbihpbmplY3RBcmdzKTtcbiAgICB9XG4gICAgY2FzZSBSM1Jlc29sdmVkRGVwZW5kZW5jeVR5cGUuQXR0cmlidXRlOlxuICAgICAgLy8gSW4gdGhlIGNhc2Ugb2YgYXR0cmlidXRlcywgdGhlIGF0dHJpYnV0ZSBuYW1lIGluIHF1ZXN0aW9uIGlzIGdpdmVuIGFzIHRoZSB0b2tlbi5cbiAgICAgIHJldHVybiBvLmltcG9ydEV4cHIoUjMuaW5qZWN0QXR0cmlidXRlKS5jYWxsRm4oW2RlcC50b2tlbl0pO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5zdXBwb3J0ZWQoXG4gICAgICAgICAgYFVua25vd24gUjNSZXNvbHZlZERlcGVuZGVuY3lUeXBlOiAke1IzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZVtkZXAucmVzb2x2ZWRdfWApO1xuICB9XG59XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdXNlZnVsIGZvciBleHRyYWN0aW5nIGBSM0RlcGVuZGVuY3lNZXRhZGF0YWAgZnJvbSBhIFJlbmRlcjJcbiAqIGBDb21waWxlVHlwZU1ldGFkYXRhYCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlcGVuZGVuY2llc0Zyb21HbG9iYWxNZXRhZGF0YShcbiAgICB0eXBlOiBDb21waWxlVHlwZU1ldGFkYXRhLCBvdXRwdXRDdHg6IE91dHB1dENvbnRleHQsXG4gICAgcmVmbGVjdG9yOiBDb21waWxlUmVmbGVjdG9yKTogUjNEZXBlbmRlbmN5TWV0YWRhdGFbXSB7XG4gIC8vIFVzZSB0aGUgYENvbXBpbGVSZWZsZWN0b3JgIHRvIGxvb2sgdXAgcmVmZXJlbmNlcyB0byBzb21lIHdlbGwta25vd24gQW5ndWxhciB0eXBlcy4gVGhlc2Ugd2lsbFxuICAvLyBiZSBjb21wYXJlZCB3aXRoIHRoZSB0b2tlbiB0byBzdGF0aWNhbGx5IGRldGVybWluZSB3aGV0aGVyIHRoZSB0b2tlbiBoYXMgc2lnbmlmaWNhbmNlIHRvXG4gIC8vIEFuZ3VsYXIsIGFuZCBzZXQgdGhlIGNvcnJlY3QgYFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZWAgYXMgYSByZXN1bHQuXG4gIGNvbnN0IGluamVjdG9yUmVmID0gcmVmbGVjdG9yLnJlc29sdmVFeHRlcm5hbFJlZmVyZW5jZShJZGVudGlmaWVycy5JbmplY3Rvcik7XG5cbiAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSB0eXBlJ3MgREkgZGVwZW5kZW5jaWVzIGFuZCBwcm9kdWNlIGBSM0RlcGVuZGVuY3lNZXRhZGF0YWAgZm9yIGVhY2ggb2YgdGhlbS5cbiAgY29uc3QgZGVwczogUjNEZXBlbmRlbmN5TWV0YWRhdGFbXSA9IFtdO1xuICBmb3IgKGxldCBkZXBlbmRlbmN5IG9mIHR5cGUuZGlEZXBzKSB7XG4gICAgaWYgKGRlcGVuZGVuY3kudG9rZW4pIHtcbiAgICAgIGNvbnN0IHRva2VuUmVmID0gdG9rZW5SZWZlcmVuY2UoZGVwZW5kZW5jeS50b2tlbik7XG4gICAgICBsZXQgcmVzb2x2ZWQ6IFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZSA9IFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZS5Ub2tlbjtcbiAgICAgIGlmICh0b2tlblJlZiA9PT0gaW5qZWN0b3JSZWYpIHtcbiAgICAgICAgcmVzb2x2ZWQgPSBSM1Jlc29sdmVkRGVwZW5kZW5jeVR5cGUuSW5qZWN0b3I7XG4gICAgICB9IGVsc2UgaWYgKGRlcGVuZGVuY3kuaXNBdHRyaWJ1dGUpIHtcbiAgICAgICAgcmVzb2x2ZWQgPSBSM1Jlc29sdmVkRGVwZW5kZW5jeVR5cGUuQXR0cmlidXRlO1xuICAgICAgfVxuXG4gICAgICAvLyBJbiB0aGUgY2FzZSBvZiBtb3N0IGRlcGVuZGVuY2llcywgdGhlIHRva2VuIHdpbGwgYmUgYSByZWZlcmVuY2UgdG8gYSB0eXBlLiBTb21ldGltZXMsXG4gICAgICAvLyBob3dldmVyLCBpdCBjYW4gYmUgYSBzdHJpbmcsIGluIHRoZSBjYXNlIG9mIG9sZGVyIEFuZ3VsYXIgY29kZSBvciBAQXR0cmlidXRlIGluamVjdGlvbi5cbiAgICAgIGNvbnN0IHRva2VuID1cbiAgICAgICAgICB0b2tlblJlZiBpbnN0YW5jZW9mIFN0YXRpY1N5bWJvbCA/IG91dHB1dEN0eC5pbXBvcnRFeHByKHRva2VuUmVmKSA6IG8ubGl0ZXJhbCh0b2tlblJlZik7XG5cbiAgICAgIC8vIENvbnN0cnVjdCB0aGUgZGVwZW5kZW5jeS5cbiAgICAgIGRlcHMucHVzaCh7XG4gICAgICAgIHRva2VuLFxuICAgICAgICByZXNvbHZlZCxcbiAgICAgICAgaG9zdDogISFkZXBlbmRlbmN5LmlzSG9zdCxcbiAgICAgICAgb3B0aW9uYWw6ICEhZGVwZW5kZW5jeS5pc09wdGlvbmFsLFxuICAgICAgICBzZWxmOiAhIWRlcGVuZGVuY3kuaXNTZWxmLFxuICAgICAgICBza2lwU2VsZjogISFkZXBlbmRlbmN5LmlzU2tpcFNlbGYsXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdW5zdXBwb3J0ZWQoJ2RlcGVuZGVuY3kgd2l0aG91dCBhIHRva2VuJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRlcHM7XG59XG5cbmZ1bmN0aW9uIGlzRGVsZWdhdGVkTWV0YWRhdGEobWV0YTogUjNGYWN0b3J5TWV0YWRhdGEpOiBtZXRhIGlzIFIzRGVsZWdhdGVkRmFjdG9yeU1ldGFkYXRhfFxuICAgIFIzRGVsZWdhdGVkRm5PckNsYXNzTWV0YWRhdGEge1xuICByZXR1cm4gKG1ldGEgYXMgYW55KS5kZWxlZ2F0ZVR5cGUgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNFeHByZXNzaW9uRmFjdG9yeU1ldGFkYXRhKG1ldGE6IFIzRmFjdG9yeU1ldGFkYXRhKTogbWV0YSBpcyBSM0V4cHJlc3Npb25GYWN0b3J5TWV0YWRhdGEge1xuICByZXR1cm4gKG1ldGEgYXMgYW55KS5leHByZXNzaW9uICE9PSB1bmRlZmluZWQ7XG59XG4iXX0=