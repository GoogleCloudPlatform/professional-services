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
        define("@angular/compiler-cli/src/ngtsc/typecheck/src/type_constructor", ["require", "exports", "tslib", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    /**
     * Generate a type constructor for the given class and metadata.
     *
     * A type constructor is a specially shaped TypeScript static method, intended to be placed within
     * a directive class itself, that permits type inference of any generic type parameters of the class
     * from the types of expressions bound to inputs or outputs, and the types of elements that match
     * queries performed by the directive. It also catches any errors in the types of these expressions.
     * This method is never called at runtime, but is used in type-check blocks to construct directive
     * types.
     *
     * A type constructor for NgFor looks like:
     *
     * static ngTypeCtor<T>(init: Partial<Pick<NgForOf<T>, 'ngForOf'|'ngForTrackBy'|'ngForTemplate'>>):
     *   NgForOf<T>;
     *
     * A typical usage would be:
     *
     * NgForOf.ngTypeCtor(init: {ngForOf: ['foo', 'bar']}); // Infers a type of NgForOf<string>.
     *
     * @param node the `ts.ClassDeclaration` for which a type constructor will be generated.
     * @param meta additional metadata required to generate the type constructor.
     * @returns a `ts.MethodDeclaration` for the type constructor.
     */
    function generateTypeCtor(node, meta) {
        // Build rawType, a `ts.TypeNode` of the class with its generic parameters passed through from
        // the definition without any type bounds. For example, if the class is
        // `FooDirective<T extends Bar>`, its rawType would be `FooDirective<T>`.
        var rawTypeArgs = node.typeParameters !== undefined ?
            node.typeParameters.map(function (param) { return ts.createTypeReferenceNode(param.name, undefined); }) :
            undefined;
        var rawType = ts.createTypeReferenceNode(node.name, rawTypeArgs);
        // initType is the type of 'init', the single argument to the type constructor method.
        // If the Directive has any inputs, outputs, or queries, its initType will be:
        //
        // Partial<Pick<rawType, 'inputField'|'outputField'|'queryField'>>
        //
        // Pick here is used to select only those fields from which the generic type parameters of the
        // directive will be inferred. Partial is used because inputs are optional, so there may not be
        // bindings for each field.
        //
        // In the special case there are no inputs/outputs/etc, initType is set to {}.
        var initType;
        var keys = tslib_1.__spread(meta.fields.inputs, meta.fields.outputs, meta.fields.queries);
        if (keys.length === 0) {
            // Special case - no inputs, outputs, or other fields which could influence the result type.
            initType = ts.createTypeLiteralNode([]);
        }
        else {
            // Construct a union of all the field names.
            var keyTypeUnion = ts.createUnionTypeNode(keys.map(function (key) { return ts.createLiteralTypeNode(ts.createStringLiteral(key)); }));
            // Construct the Pick<rawType, keyTypeUnion>.
            var pickType = ts.createTypeReferenceNode('Pick', [rawType, keyTypeUnion]);
            // Construct the Partial<pickType>.
            initType = ts.createTypeReferenceNode('Partial', [pickType]);
        }
        // If this constructor is being generated into a .ts file, then it needs a fake body. The body
        // is set to a return of `null!`. If the type constructor is being generated into a .d.ts file,
        // it needs no body.
        var body = undefined;
        if (meta.body) {
            body = ts.createBlock([
                ts.createReturn(ts.createNonNullExpression(ts.createNull())),
            ]);
        }
        // Create the 'init' parameter itself.
        var initParam = ts.createParameter(
        /* decorators */ undefined, 
        /* modifiers */ undefined, 
        /* dotDotDotToken */ undefined, 
        /* name */ 'init', 
        /* questionToken */ undefined, 
        /* type */ initType, 
        /* initializer */ undefined);
        // Create the type constructor method declaration.
        return ts.createMethod(
        /* decorators */ undefined, 
        /* modifiers */ [ts.createModifier(ts.SyntaxKind.StaticKeyword)], 
        /* asteriskToken */ undefined, 
        /* name */ meta.fnName, 
        /* questionToken */ undefined, 
        /* typeParameters */ node.typeParameters, 
        /* parameters */ [initParam], 
        /* type */ rawType, 
        /* body */ body);
    }
    exports.generateTypeCtor = generateTypeCtor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZV9jb25zdHJ1Y3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvdHlwZWNoZWNrL3NyYy90eXBlX2NvbnN0cnVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILCtCQUFpQztJQUlqQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXNCRztJQUNILFNBQWdCLGdCQUFnQixDQUM1QixJQUF5QixFQUFFLElBQXNCO1FBQ25ELDhGQUE4RjtRQUM5Rix1RUFBdUU7UUFDdkUseUVBQXlFO1FBQ3pFLElBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLEtBQUssU0FBUyxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsVUFBQSxLQUFLLElBQUksT0FBQSxFQUFFLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsRUFBakQsQ0FBaUQsQ0FBQyxDQUFDLENBQUM7WUFDckYsU0FBUyxDQUFDO1FBQ2QsSUFBTSxPQUFPLEdBQWdCLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRWxGLHNGQUFzRjtRQUN0Riw4RUFBOEU7UUFDOUUsRUFBRTtRQUNGLGtFQUFrRTtRQUNsRSxFQUFFO1FBQ0YsOEZBQThGO1FBQzlGLCtGQUErRjtRQUMvRiwyQkFBMkI7UUFDM0IsRUFBRTtRQUNGLDhFQUE4RTtRQUM5RSxJQUFJLFFBQXFCLENBQUM7UUFFMUIsSUFBTSxJQUFJLG9CQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUNsQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFDbkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQ3ZCLENBQUM7UUFDRixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3JCLDRGQUE0RjtZQUM1RixRQUFRLEdBQUcsRUFBRSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ3pDO2FBQU07WUFDTCw0Q0FBNEM7WUFDNUMsSUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLG1CQUFtQixDQUN2QyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsRUFBRSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFyRCxDQUFxRCxDQUFDLENBQUMsQ0FBQztZQUU1RSw2Q0FBNkM7WUFDN0MsSUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBRTdFLG1DQUFtQztZQUNuQyxRQUFRLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDOUQ7UUFFRCw4RkFBOEY7UUFDOUYsK0ZBQStGO1FBQy9GLG9CQUFvQjtRQUNwQixJQUFJLElBQUksR0FBdUIsU0FBUyxDQUFDO1FBQ3pDLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtZQUNiLElBQUksR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDO2dCQUNwQixFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQzthQUM3RCxDQUFDLENBQUM7U0FDSjtRQUVELHNDQUFzQztRQUN0QyxJQUFNLFNBQVMsR0FBRyxFQUFFLENBQUMsZUFBZTtRQUNoQyxnQkFBZ0IsQ0FBQyxTQUFTO1FBQzFCLGVBQWUsQ0FBQyxTQUFTO1FBQ3pCLG9CQUFvQixDQUFDLFNBQVM7UUFDOUIsVUFBVSxDQUFDLE1BQU07UUFDakIsbUJBQW1CLENBQUMsU0FBUztRQUM3QixVQUFVLENBQUMsUUFBUTtRQUNuQixpQkFBaUIsQ0FBQyxTQUFTLENBQUcsQ0FBQztRQUVuQyxrREFBa0Q7UUFDbEQsT0FBTyxFQUFFLENBQUMsWUFBWTtRQUNsQixnQkFBZ0IsQ0FBQyxTQUFTO1FBQzFCLGVBQWUsQ0FBQSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMvRCxtQkFBbUIsQ0FBQyxTQUFTO1FBQzdCLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTTtRQUN0QixtQkFBbUIsQ0FBQyxTQUFTO1FBQzdCLG9CQUFvQixDQUFDLElBQUksQ0FBQyxjQUFjO1FBQ3hDLGdCQUFnQixDQUFBLENBQUMsU0FBUyxDQUFDO1FBQzNCLFVBQVUsQ0FBQyxPQUFPO1FBQ2xCLFVBQVUsQ0FBQyxJQUFJLENBQUcsQ0FBQztJQUN6QixDQUFDO0lBekVELDRDQXlFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7VHlwZUN0b3JNZXRhZGF0YX0gZnJvbSAnLi9hcGknO1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgdHlwZSBjb25zdHJ1Y3RvciBmb3IgdGhlIGdpdmVuIGNsYXNzIGFuZCBtZXRhZGF0YS5cbiAqXG4gKiBBIHR5cGUgY29uc3RydWN0b3IgaXMgYSBzcGVjaWFsbHkgc2hhcGVkIFR5cGVTY3JpcHQgc3RhdGljIG1ldGhvZCwgaW50ZW5kZWQgdG8gYmUgcGxhY2VkIHdpdGhpblxuICogYSBkaXJlY3RpdmUgY2xhc3MgaXRzZWxmLCB0aGF0IHBlcm1pdHMgdHlwZSBpbmZlcmVuY2Ugb2YgYW55IGdlbmVyaWMgdHlwZSBwYXJhbWV0ZXJzIG9mIHRoZSBjbGFzc1xuICogZnJvbSB0aGUgdHlwZXMgb2YgZXhwcmVzc2lvbnMgYm91bmQgdG8gaW5wdXRzIG9yIG91dHB1dHMsIGFuZCB0aGUgdHlwZXMgb2YgZWxlbWVudHMgdGhhdCBtYXRjaFxuICogcXVlcmllcyBwZXJmb3JtZWQgYnkgdGhlIGRpcmVjdGl2ZS4gSXQgYWxzbyBjYXRjaGVzIGFueSBlcnJvcnMgaW4gdGhlIHR5cGVzIG9mIHRoZXNlIGV4cHJlc3Npb25zLlxuICogVGhpcyBtZXRob2QgaXMgbmV2ZXIgY2FsbGVkIGF0IHJ1bnRpbWUsIGJ1dCBpcyB1c2VkIGluIHR5cGUtY2hlY2sgYmxvY2tzIHRvIGNvbnN0cnVjdCBkaXJlY3RpdmVcbiAqIHR5cGVzLlxuICpcbiAqIEEgdHlwZSBjb25zdHJ1Y3RvciBmb3IgTmdGb3IgbG9va3MgbGlrZTpcbiAqXG4gKiBzdGF0aWMgbmdUeXBlQ3RvcjxUPihpbml0OiBQYXJ0aWFsPFBpY2s8TmdGb3JPZjxUPiwgJ25nRm9yT2YnfCduZ0ZvclRyYWNrQnknfCduZ0ZvclRlbXBsYXRlJz4+KTpcbiAqICAgTmdGb3JPZjxUPjtcbiAqXG4gKiBBIHR5cGljYWwgdXNhZ2Ugd291bGQgYmU6XG4gKlxuICogTmdGb3JPZi5uZ1R5cGVDdG9yKGluaXQ6IHtuZ0Zvck9mOiBbJ2ZvbycsICdiYXInXX0pOyAvLyBJbmZlcnMgYSB0eXBlIG9mIE5nRm9yT2Y8c3RyaW5nPi5cbiAqXG4gKiBAcGFyYW0gbm9kZSB0aGUgYHRzLkNsYXNzRGVjbGFyYXRpb25gIGZvciB3aGljaCBhIHR5cGUgY29uc3RydWN0b3Igd2lsbCBiZSBnZW5lcmF0ZWQuXG4gKiBAcGFyYW0gbWV0YSBhZGRpdGlvbmFsIG1ldGFkYXRhIHJlcXVpcmVkIHRvIGdlbmVyYXRlIHRoZSB0eXBlIGNvbnN0cnVjdG9yLlxuICogQHJldHVybnMgYSBgdHMuTWV0aG9kRGVjbGFyYXRpb25gIGZvciB0aGUgdHlwZSBjb25zdHJ1Y3Rvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlVHlwZUN0b3IoXG4gICAgbm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgbWV0YTogVHlwZUN0b3JNZXRhZGF0YSk6IHRzLk1ldGhvZERlY2xhcmF0aW9uIHtcbiAgLy8gQnVpbGQgcmF3VHlwZSwgYSBgdHMuVHlwZU5vZGVgIG9mIHRoZSBjbGFzcyB3aXRoIGl0cyBnZW5lcmljIHBhcmFtZXRlcnMgcGFzc2VkIHRocm91Z2ggZnJvbVxuICAvLyB0aGUgZGVmaW5pdGlvbiB3aXRob3V0IGFueSB0eXBlIGJvdW5kcy4gRm9yIGV4YW1wbGUsIGlmIHRoZSBjbGFzcyBpc1xuICAvLyBgRm9vRGlyZWN0aXZlPFQgZXh0ZW5kcyBCYXI+YCwgaXRzIHJhd1R5cGUgd291bGQgYmUgYEZvb0RpcmVjdGl2ZTxUPmAuXG4gIGNvbnN0IHJhd1R5cGVBcmdzID0gbm9kZS50eXBlUGFyYW1ldGVycyAhPT0gdW5kZWZpbmVkID9cbiAgICAgIG5vZGUudHlwZVBhcmFtZXRlcnMubWFwKHBhcmFtID0+IHRzLmNyZWF0ZVR5cGVSZWZlcmVuY2VOb2RlKHBhcmFtLm5hbWUsIHVuZGVmaW5lZCkpIDpcbiAgICAgIHVuZGVmaW5lZDtcbiAgY29uc3QgcmF3VHlwZTogdHMuVHlwZU5vZGUgPSB0cy5jcmVhdGVUeXBlUmVmZXJlbmNlTm9kZShub2RlLm5hbWUgISwgcmF3VHlwZUFyZ3MpO1xuXG4gIC8vIGluaXRUeXBlIGlzIHRoZSB0eXBlIG9mICdpbml0JywgdGhlIHNpbmdsZSBhcmd1bWVudCB0byB0aGUgdHlwZSBjb25zdHJ1Y3RvciBtZXRob2QuXG4gIC8vIElmIHRoZSBEaXJlY3RpdmUgaGFzIGFueSBpbnB1dHMsIG91dHB1dHMsIG9yIHF1ZXJpZXMsIGl0cyBpbml0VHlwZSB3aWxsIGJlOlxuICAvL1xuICAvLyBQYXJ0aWFsPFBpY2s8cmF3VHlwZSwgJ2lucHV0RmllbGQnfCdvdXRwdXRGaWVsZCd8J3F1ZXJ5RmllbGQnPj5cbiAgLy9cbiAgLy8gUGljayBoZXJlIGlzIHVzZWQgdG8gc2VsZWN0IG9ubHkgdGhvc2UgZmllbGRzIGZyb20gd2hpY2ggdGhlIGdlbmVyaWMgdHlwZSBwYXJhbWV0ZXJzIG9mIHRoZVxuICAvLyBkaXJlY3RpdmUgd2lsbCBiZSBpbmZlcnJlZC4gUGFydGlhbCBpcyB1c2VkIGJlY2F1c2UgaW5wdXRzIGFyZSBvcHRpb25hbCwgc28gdGhlcmUgbWF5IG5vdCBiZVxuICAvLyBiaW5kaW5ncyBmb3IgZWFjaCBmaWVsZC5cbiAgLy9cbiAgLy8gSW4gdGhlIHNwZWNpYWwgY2FzZSB0aGVyZSBhcmUgbm8gaW5wdXRzL291dHB1dHMvZXRjLCBpbml0VHlwZSBpcyBzZXQgdG8ge30uXG4gIGxldCBpbml0VHlwZTogdHMuVHlwZU5vZGU7XG5cbiAgY29uc3Qga2V5czogc3RyaW5nW10gPSBbXG4gICAgLi4ubWV0YS5maWVsZHMuaW5wdXRzLFxuICAgIC4uLm1ldGEuZmllbGRzLm91dHB1dHMsXG4gICAgLi4ubWV0YS5maWVsZHMucXVlcmllcyxcbiAgXTtcbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gU3BlY2lhbCBjYXNlIC0gbm8gaW5wdXRzLCBvdXRwdXRzLCBvciBvdGhlciBmaWVsZHMgd2hpY2ggY291bGQgaW5mbHVlbmNlIHRoZSByZXN1bHQgdHlwZS5cbiAgICBpbml0VHlwZSA9IHRzLmNyZWF0ZVR5cGVMaXRlcmFsTm9kZShbXSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQ29uc3RydWN0IGEgdW5pb24gb2YgYWxsIHRoZSBmaWVsZCBuYW1lcy5cbiAgICBjb25zdCBrZXlUeXBlVW5pb24gPSB0cy5jcmVhdGVVbmlvblR5cGVOb2RlKFxuICAgICAgICBrZXlzLm1hcChrZXkgPT4gdHMuY3JlYXRlTGl0ZXJhbFR5cGVOb2RlKHRzLmNyZWF0ZVN0cmluZ0xpdGVyYWwoa2V5KSkpKTtcblxuICAgIC8vIENvbnN0cnVjdCB0aGUgUGljazxyYXdUeXBlLCBrZXlUeXBlVW5pb24+LlxuICAgIGNvbnN0IHBpY2tUeXBlID0gdHMuY3JlYXRlVHlwZVJlZmVyZW5jZU5vZGUoJ1BpY2snLCBbcmF3VHlwZSwga2V5VHlwZVVuaW9uXSk7XG5cbiAgICAvLyBDb25zdHJ1Y3QgdGhlIFBhcnRpYWw8cGlja1R5cGU+LlxuICAgIGluaXRUeXBlID0gdHMuY3JlYXRlVHlwZVJlZmVyZW5jZU5vZGUoJ1BhcnRpYWwnLCBbcGlja1R5cGVdKTtcbiAgfVxuXG4gIC8vIElmIHRoaXMgY29uc3RydWN0b3IgaXMgYmVpbmcgZ2VuZXJhdGVkIGludG8gYSAudHMgZmlsZSwgdGhlbiBpdCBuZWVkcyBhIGZha2UgYm9keS4gVGhlIGJvZHlcbiAgLy8gaXMgc2V0IHRvIGEgcmV0dXJuIG9mIGBudWxsIWAuIElmIHRoZSB0eXBlIGNvbnN0cnVjdG9yIGlzIGJlaW5nIGdlbmVyYXRlZCBpbnRvIGEgLmQudHMgZmlsZSxcbiAgLy8gaXQgbmVlZHMgbm8gYm9keS5cbiAgbGV0IGJvZHk6IHRzLkJsb2NrfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgaWYgKG1ldGEuYm9keSkge1xuICAgIGJvZHkgPSB0cy5jcmVhdGVCbG9jayhbXG4gICAgICB0cy5jcmVhdGVSZXR1cm4odHMuY3JlYXRlTm9uTnVsbEV4cHJlc3Npb24odHMuY3JlYXRlTnVsbCgpKSksXG4gICAgXSk7XG4gIH1cblxuICAvLyBDcmVhdGUgdGhlICdpbml0JyBwYXJhbWV0ZXIgaXRzZWxmLlxuICBjb25zdCBpbml0UGFyYW0gPSB0cy5jcmVhdGVQYXJhbWV0ZXIoXG4gICAgICAvKiBkZWNvcmF0b3JzICovIHVuZGVmaW5lZCxcbiAgICAgIC8qIG1vZGlmaWVycyAqLyB1bmRlZmluZWQsXG4gICAgICAvKiBkb3REb3REb3RUb2tlbiAqLyB1bmRlZmluZWQsXG4gICAgICAvKiBuYW1lICovICdpbml0JyxcbiAgICAgIC8qIHF1ZXN0aW9uVG9rZW4gKi8gdW5kZWZpbmVkLFxuICAgICAgLyogdHlwZSAqLyBpbml0VHlwZSxcbiAgICAgIC8qIGluaXRpYWxpemVyICovIHVuZGVmaW5lZCwgKTtcblxuICAvLyBDcmVhdGUgdGhlIHR5cGUgY29uc3RydWN0b3IgbWV0aG9kIGRlY2xhcmF0aW9uLlxuICByZXR1cm4gdHMuY3JlYXRlTWV0aG9kKFxuICAgICAgLyogZGVjb3JhdG9ycyAqLyB1bmRlZmluZWQsXG4gICAgICAvKiBtb2RpZmllcnMgKi9bdHMuY3JlYXRlTW9kaWZpZXIodHMuU3ludGF4S2luZC5TdGF0aWNLZXl3b3JkKV0sXG4gICAgICAvKiBhc3Rlcmlza1Rva2VuICovIHVuZGVmaW5lZCxcbiAgICAgIC8qIG5hbWUgKi8gbWV0YS5mbk5hbWUsXG4gICAgICAvKiBxdWVzdGlvblRva2VuICovIHVuZGVmaW5lZCxcbiAgICAgIC8qIHR5cGVQYXJhbWV0ZXJzICovIG5vZGUudHlwZVBhcmFtZXRlcnMsXG4gICAgICAvKiBwYXJhbWV0ZXJzICovW2luaXRQYXJhbV0sXG4gICAgICAvKiB0eXBlICovIHJhd1R5cGUsXG4gICAgICAvKiBib2R5ICovIGJvZHksICk7XG59XG4iXX0=