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
        define("@angular/compiler-cli/src/ngtsc/annotations/src/base_def", ["require", "exports", "tslib", "@angular/compiler", "@angular/compiler-cli/src/ngtsc/metadata", "@angular/compiler-cli/src/ngtsc/annotations/src/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var metadata_1 = require("@angular/compiler-cli/src/ngtsc/metadata");
    var util_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/util");
    function containsNgTopLevelDecorator(decorators) {
        if (!decorators) {
            return false;
        }
        return decorators.find(function (decorator) { return (decorator.name === 'Component' || decorator.name === 'Directive' ||
            decorator.name === 'NgModule') &&
            util_1.isAngularCore(decorator); }) !== undefined;
    }
    var BaseDefDecoratorHandler = /** @class */ (function () {
        function BaseDefDecoratorHandler(checker, reflector) {
            this.checker = checker;
            this.reflector = reflector;
        }
        BaseDefDecoratorHandler.prototype.detect = function (node, decorators) {
            if (containsNgTopLevelDecorator(decorators)) {
                // If the class is already decorated by @Component or @Directive let that
                // DecoratorHandler handle this. BaseDef is unnecessary.
                return undefined;
            }
            var result = undefined;
            this.reflector.getMembersOfClass(node).forEach(function (property) {
                var e_1, _a;
                var decorators = property.decorators;
                if (decorators) {
                    try {
                        for (var decorators_1 = tslib_1.__values(decorators), decorators_1_1 = decorators_1.next(); !decorators_1_1.done; decorators_1_1 = decorators_1.next()) {
                            var decorator = decorators_1_1.value;
                            var decoratorName = decorator.name;
                            if (decoratorName === 'Input' && util_1.isAngularCore(decorator)) {
                                result = result || {};
                                var inputs = result.inputs = result.inputs || [];
                                inputs.push({ decorator: decorator, property: property });
                            }
                            else if (decoratorName === 'Output' && util_1.isAngularCore(decorator)) {
                                result = result || {};
                                var outputs = result.outputs = result.outputs || [];
                                outputs.push({ decorator: decorator, property: property });
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (decorators_1_1 && !decorators_1_1.done && (_a = decorators_1.return)) _a.call(decorators_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
            });
            return result;
        };
        BaseDefDecoratorHandler.prototype.analyze = function (node, metadata) {
            var _this = this;
            var analysis = {};
            if (metadata.inputs) {
                var inputs_1 = analysis.inputs = {};
                metadata.inputs.forEach(function (_a) {
                    var decorator = _a.decorator, property = _a.property;
                    var propName = property.name;
                    var args = decorator.args;
                    var value;
                    if (args && args.length > 0) {
                        var resolvedValue = metadata_1.staticallyResolve(args[0], _this.reflector, _this.checker);
                        if (typeof resolvedValue !== 'string') {
                            throw new TypeError('Input alias does not resolve to a string value');
                        }
                        value = [resolvedValue, propName];
                    }
                    else {
                        value = propName;
                    }
                    inputs_1[propName] = value;
                });
            }
            if (metadata.outputs) {
                var outputs_1 = analysis.outputs = {};
                metadata.outputs.forEach(function (_a) {
                    var decorator = _a.decorator, property = _a.property;
                    var propName = property.name;
                    var args = decorator.args;
                    var value;
                    if (args && args.length > 0) {
                        var resolvedValue = metadata_1.staticallyResolve(args[0], _this.reflector, _this.checker);
                        if (typeof resolvedValue !== 'string') {
                            throw new TypeError('Output alias does not resolve to a string value');
                        }
                        value = resolvedValue;
                    }
                    else {
                        value = propName;
                    }
                    outputs_1[propName] = value;
                });
            }
            return { analysis: analysis };
        };
        BaseDefDecoratorHandler.prototype.compile = function (node, analysis) {
            var _a = compiler_1.compileBaseDefFromMetadata(analysis), expression = _a.expression, type = _a.type;
            return {
                name: 'ngBaseDef',
                initializer: expression, type: type,
                statements: [],
            };
        };
        return BaseDefDecoratorHandler;
    }());
    exports.BaseDefDecoratorHandler = BaseDefDecoratorHandler;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9kZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL2Fubm90YXRpb25zL3NyYy9iYXNlX2RlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCw4Q0FBZ0Y7SUFJaEYscUVBQWlEO0lBRWpELDZFQUFxQztJQUVyQyxTQUFTLDJCQUEyQixDQUFDLFVBQThCO1FBQ2pFLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDZixPQUFPLEtBQUssQ0FBQztTQUNkO1FBQ0QsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUNYLFVBQUEsU0FBUyxJQUFJLE9BQUEsQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLFdBQVc7WUFDaEUsU0FBUyxDQUFDLElBQUksS0FBSyxVQUFVLENBQUM7WUFDeEMsb0JBQWEsQ0FBQyxTQUFTLENBQUMsRUFGZixDQUVlLENBQUMsS0FBSyxTQUFTLENBQUM7SUFDekQsQ0FBQztJQUVEO1FBRUUsaUNBQW9CLE9BQXVCLEVBQVUsU0FBeUI7WUFBMUQsWUFBTyxHQUFQLE9BQU8sQ0FBZ0I7WUFBVSxjQUFTLEdBQVQsU0FBUyxDQUFnQjtRQUFLLENBQUM7UUFFcEYsd0NBQU0sR0FBTixVQUFPLElBQXlCLEVBQUUsVUFBNEI7WUFFNUQsSUFBSSwyQkFBMkIsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDM0MseUVBQXlFO2dCQUN6RSx3REFBd0Q7Z0JBQ3hELE9BQU8sU0FBUyxDQUFDO2FBQ2xCO1lBRUQsSUFBSSxNQUFNLEdBQTBDLFNBQVMsQ0FBQztZQUU5RCxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLFFBQVE7O2dCQUM5QyxJQUFBLGdDQUFVLENBQWE7Z0JBQzlCLElB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QUMsQ0FBQyxFQUFFLEtBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUMvRSxJQUFJLE9BQU8sYUFBYSxLQUFLLFFBQVEsRUFBRTs0QkFDckMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO3lCQUN4RTt3QkFDRCxLQUFLLEdBQUcsYUFBYSxDQUFDO3FCQUN2Qjt5QkFBTTt3QkFDTCxLQUFLLEdBQUcsUUFBUSxDQUFDO3FCQUNsQjtvQkFDRCxTQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsS0FBSyxDQUFDO2dCQUM1QixDQUFDLENBQUMsQ0FBQzthQUNKO1lBRUQsT0FBTyxFQUFDLFFBQVEsVUFBQSxFQUFDLENBQUM7UUFDcEIsQ0FBQztRQUVELHlDQUFPLEdBQVAsVUFBUSxJQUFvQixFQUFFLFFBQTJCO1lBQ2pELElBQUEsb0RBQXlELEVBQXhELDBCQUFVLEVBQUUsY0FBNEMsQ0FBQztZQUVoRSxPQUFPO2dCQUNMLElBQUksRUFBRSxXQUFXO2dCQUNqQixXQUFXLEVBQUUsVUFBVSxFQUFFLElBQUksTUFBQTtnQkFDN0IsVUFBVSxFQUFFLEVBQUU7YUFDZixDQUFDO1FBQ0osQ0FBQztRQUNILDhCQUFDO0lBQUQsQ0FBQyxBQXhGRCxJQXdGQztJQXhGWSwwREFBdUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UjNCYXNlUmVmTWV0YURhdGEsIGNvbXBpbGVCYXNlRGVmRnJvbU1ldGFkYXRhfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtDbGFzc01lbWJlciwgRGVjb3JhdG9yLCBSZWZsZWN0aW9uSG9zdH0gZnJvbSAnLi4vLi4vaG9zdCc7XG5pbXBvcnQge3N0YXRpY2FsbHlSZXNvbHZlfSBmcm9tICcuLi8uLi9tZXRhZGF0YSc7XG5pbXBvcnQge0FuYWx5c2lzT3V0cHV0LCBDb21waWxlUmVzdWx0LCBEZWNvcmF0b3JIYW5kbGVyfSBmcm9tICcuLi8uLi90cmFuc2Zvcm0nO1xuaW1wb3J0IHtpc0FuZ3VsYXJDb3JlfSBmcm9tICcuL3V0aWwnO1xuXG5mdW5jdGlvbiBjb250YWluc05nVG9wTGV2ZWxEZWNvcmF0b3IoZGVjb3JhdG9yczogRGVjb3JhdG9yW10gfCBudWxsKTogYm9vbGVhbiB7XG4gIGlmICghZGVjb3JhdG9ycykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gZGVjb3JhdG9ycy5maW5kKFxuICAgICAgICAgICAgIGRlY29yYXRvciA9PiAoZGVjb3JhdG9yLm5hbWUgPT09ICdDb21wb25lbnQnIHx8IGRlY29yYXRvci5uYW1lID09PSAnRGlyZWN0aXZlJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVjb3JhdG9yLm5hbWUgPT09ICdOZ01vZHVsZScpICYmXG4gICAgICAgICAgICAgICAgIGlzQW5ndWxhckNvcmUoZGVjb3JhdG9yKSkgIT09IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGNsYXNzIEJhc2VEZWZEZWNvcmF0b3JIYW5kbGVyIGltcGxlbWVudHNcbiAgICBEZWNvcmF0b3JIYW5kbGVyPFIzQmFzZVJlZk1ldGFEYXRhLCBSM0Jhc2VSZWZEZWNvcmF0b3JEZXRlY3Rpb24+IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgcHJpdmF0ZSByZWZsZWN0b3I6IFJlZmxlY3Rpb25Ib3N0LCApIHt9XG5cbiAgZGV0ZWN0KG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIGRlY29yYXRvcnM6IERlY29yYXRvcltdfG51bGwpOiBSM0Jhc2VSZWZEZWNvcmF0b3JEZXRlY3Rpb25cbiAgICAgIHx1bmRlZmluZWQge1xuICAgIGlmIChjb250YWluc05nVG9wTGV2ZWxEZWNvcmF0b3IoZGVjb3JhdG9ycykpIHtcbiAgICAgIC8vIElmIHRoZSBjbGFzcyBpcyBhbHJlYWR5IGRlY29yYXRlZCBieSBAQ29tcG9uZW50IG9yIEBEaXJlY3RpdmUgbGV0IHRoYXRcbiAgICAgIC8vIERlY29yYXRvckhhbmRsZXIgaGFuZGxlIHRoaXMuIEJhc2VEZWYgaXMgdW5uZWNlc3NhcnkuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGxldCByZXN1bHQ6IFIzQmFzZVJlZkRlY29yYXRvckRldGVjdGlvbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgICB0aGlzLnJlZmxlY3Rvci5nZXRNZW1iZXJzT2ZDbGFzcyhub2RlKS5mb3JFYWNoKHByb3BlcnR5ID0+IHtcbiAgICAgIGNvbnN0IHtkZWNvcmF0b3JzfSA9IHByb3BlcnR5O1xuICAgICAgaWYgKGRlY29yYXRvcnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBkZWNvcmF0b3Igb2YgZGVjb3JhdG9ycykge1xuICAgICAgICAgIGNvbnN0IGRlY29yYXRvck5hbWUgPSBkZWNvcmF0b3IubmFtZTtcbiAgICAgICAgICBpZiAoZGVjb3JhdG9yTmFtZSA9PT0gJ0lucHV0JyAmJiBpc0FuZ3VsYXJDb3JlKGRlY29yYXRvcikpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0cyA9IHJlc3VsdC5pbnB1dHMgPSByZXN1bHQuaW5wdXRzIHx8IFtdO1xuICAgICAgICAgICAgaW5wdXRzLnB1c2goe2RlY29yYXRvciwgcHJvcGVydHl9KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGRlY29yYXRvck5hbWUgPT09ICdPdXRwdXQnICYmIGlzQW5ndWxhckNvcmUoZGVjb3JhdG9yKSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0IHx8IHt9O1xuICAgICAgICAgICAgY29uc3Qgb3V0cHV0cyA9IHJlc3VsdC5vdXRwdXRzID0gcmVzdWx0Lm91dHB1dHMgfHwgW107XG4gICAgICAgICAgICBvdXRwdXRzLnB1c2goe2RlY29yYXRvciwgcHJvcGVydHl9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhbmFseXplKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIG1ldGFkYXRhOiBSM0Jhc2VSZWZEZWNvcmF0b3JEZXRlY3Rpb24pOlxuICAgICAgQW5hbHlzaXNPdXRwdXQ8UjNCYXNlUmVmTWV0YURhdGE+IHtcbiAgICBjb25zdCBhbmFseXNpczogUjNCYXNlUmVmTWV0YURhdGEgPSB7fTtcbiAgICBpZiAobWV0YWRhdGEuaW5wdXRzKSB7XG4gICAgICBjb25zdCBpbnB1dHMgPSBhbmFseXNpcy5pbnB1dHMgPSB7fSBhc3tba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBbc3RyaW5nLCBzdHJpbmddfTtcbiAgICAgIG1ldGFkYXRhLmlucHV0cy5mb3JFYWNoKCh7ZGVjb3JhdG9yLCBwcm9wZXJ0eX0pID0+IHtcbiAgICAgICAgY29uc3QgcHJvcE5hbWUgPSBwcm9wZXJ0eS5uYW1lO1xuICAgICAgICBjb25zdCBhcmdzID0gZGVjb3JhdG9yLmFyZ3M7XG4gICAgICAgIGxldCB2YWx1ZTogc3RyaW5nfFtzdHJpbmcsIHN0cmluZ107XG4gICAgICAgIGlmIChhcmdzICYmIGFyZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGNvbnN0IHJlc29sdmVkVmFsdWUgPSBzdGF0aWNhbGx5UmVzb2x2ZShhcmdzWzBdLCB0aGlzLnJlZmxlY3RvciwgdGhpcy5jaGVja2VyKTtcbiAgICAgICAgICBpZiAodHlwZW9mIHJlc29sdmVkVmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnB1dCBhbGlhcyBkb2VzIG5vdCByZXNvbHZlIHRvIGEgc3RyaW5nIHZhbHVlJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhbHVlID0gW3Jlc29sdmVkVmFsdWUsIHByb3BOYW1lXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSA9IHByb3BOYW1lO1xuICAgICAgICB9XG4gICAgICAgIGlucHV0c1twcm9wTmFtZV0gPSB2YWx1ZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChtZXRhZGF0YS5vdXRwdXRzKSB7XG4gICAgICBjb25zdCBvdXRwdXRzID0gYW5hbHlzaXMub3V0cHV0cyA9IHt9IGFze1trZXk6IHN0cmluZ106IHN0cmluZ307XG4gICAgICBtZXRhZGF0YS5vdXRwdXRzLmZvckVhY2goKHtkZWNvcmF0b3IsIHByb3BlcnR5fSkgPT4ge1xuICAgICAgICBjb25zdCBwcm9wTmFtZSA9IHByb3BlcnR5Lm5hbWU7XG4gICAgICAgIGNvbnN0IGFyZ3MgPSBkZWNvcmF0b3IuYXJncztcbiAgICAgICAgbGV0IHZhbHVlOiBzdHJpbmc7XG4gICAgICAgIGlmIChhcmdzICYmIGFyZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGNvbnN0IHJlc29sdmVkVmFsdWUgPSBzdGF0aWNhbGx5UmVzb2x2ZShhcmdzWzBdLCB0aGlzLnJlZmxlY3RvciwgdGhpcy5jaGVja2VyKTtcbiAgICAgICAgICBpZiAodHlwZW9mIHJlc29sdmVkVmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdPdXRwdXQgYWxpYXMgZG9lcyBub3QgcmVzb2x2ZSB0byBhIHN0cmluZyB2YWx1ZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YWx1ZSA9IHJlc29sdmVkVmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgPSBwcm9wTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBvdXRwdXRzW3Byb3BOYW1lXSA9IHZhbHVlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHthbmFseXNpc307XG4gIH1cblxuICBjb21waWxlKG5vZGU6IHRzLkRlY2xhcmF0aW9uLCBhbmFseXNpczogUjNCYXNlUmVmTWV0YURhdGEpOiBDb21waWxlUmVzdWx0W118Q29tcGlsZVJlc3VsdCB7XG4gICAgY29uc3Qge2V4cHJlc3Npb24sIHR5cGV9ID0gY29tcGlsZUJhc2VEZWZGcm9tTWV0YWRhdGEoYW5hbHlzaXMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6ICduZ0Jhc2VEZWYnLFxuICAgICAgaW5pdGlhbGl6ZXI6IGV4cHJlc3Npb24sIHR5cGUsXG4gICAgICBzdGF0ZW1lbnRzOiBbXSxcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUjNCYXNlUmVmRGVjb3JhdG9yRGV0ZWN0aW9uIHtcbiAgaW5wdXRzPzogQXJyYXk8e3Byb3BlcnR5OiBDbGFzc01lbWJlciwgZGVjb3JhdG9yOiBEZWNvcmF0b3J9PjtcbiAgb3V0cHV0cz86IEFycmF5PHtwcm9wZXJ0eTogQ2xhc3NNZW1iZXIsIGRlY29yYXRvcjogRGVjb3JhdG9yfT47XG59XG4iXX0=