"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const interface_1 = require("../tree/interface");
function _getTypeOfResult(value) {
    if (value === undefined) {
        return 'undefined';
    }
    else if (value === null) {
        return 'null';
    }
    else if (typeof value == 'function') {
        return `Function()`;
    }
    else if (typeof value != 'object') {
        return `${typeof value}(${JSON.stringify(value)})`;
    }
    else {
        if (Object.getPrototypeOf(value) == Object) {
            return `Object(${JSON.stringify(value)})`;
        }
        else if (value.constructor) {
            return `Instance of class ${value.constructor.name}`;
        }
        else {
            return 'Unknown Object';
        }
    }
}
/**
 * When a rule or source returns an invalid value.
 */
class InvalidRuleResultException extends core_1.BaseException {
    constructor(value) {
        super(`Invalid rule result: ${_getTypeOfResult(value)}.`);
    }
}
exports.InvalidRuleResultException = InvalidRuleResultException;
class InvalidSourceResultException extends core_1.BaseException {
    constructor(value) {
        super(`Invalid source result: ${_getTypeOfResult(value)}.`);
    }
}
exports.InvalidSourceResultException = InvalidSourceResultException;
function callSource(source, context) {
    const result = source(context);
    if (core_1.isObservable(result)) {
        // Only return the last Tree, and make sure it's a Tree.
        return result.pipe(operators_1.defaultIfEmpty(), operators_1.last(), operators_1.tap(inner => {
            if (!inner || !(interface_1.TreeSymbol in inner)) {
                throw new InvalidSourceResultException(inner);
            }
        }));
    }
    else if (result && interface_1.TreeSymbol in result) {
        return rxjs_1.of(result);
    }
    else {
        return rxjs_1.throwError(new InvalidSourceResultException(result));
    }
}
exports.callSource = callSource;
function callRule(rule, input, context) {
    return input.pipe(operators_1.mergeMap(inputTree => {
        const result = rule(inputTree, context);
        if (!result) {
            return rxjs_1.of(inputTree);
        }
        else if (typeof result == 'function') {
            // This is considered a Rule, chain the rule and return its output.
            return callRule(result, rxjs_1.of(inputTree), context);
        }
        else if (core_1.isObservable(result)) {
            // Only return the last Tree, and make sure it's a Tree.
            return result.pipe(operators_1.defaultIfEmpty(), operators_1.last(), operators_1.tap(inner => {
                if (!inner || !(interface_1.TreeSymbol in inner)) {
                    throw new InvalidRuleResultException(inner);
                }
            }));
        }
        else if (interface_1.TreeSymbol in result) {
            return rxjs_1.of(result);
        }
        else {
            return rxjs_1.throwError(new InvalidRuleResultException(result));
        }
    }));
}
exports.callRule = callRule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvcnVsZXMvY2FsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILCtDQUFtRTtBQUNuRSwrQkFBa0U7QUFDbEUsOENBQXFFO0FBRXJFLGlEQUFxRDtBQUdyRCxTQUFTLGdCQUFnQixDQUFDLEtBQVU7SUFDbEMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLE9BQU8sV0FBVyxDQUFDO0tBQ3BCO1NBQU0sSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1FBQ3pCLE9BQU8sTUFBTSxDQUFDO0tBQ2Y7U0FBTSxJQUFJLE9BQU8sS0FBSyxJQUFJLFVBQVUsRUFBRTtRQUNyQyxPQUFPLFlBQVksQ0FBQztLQUNyQjtTQUFNLElBQUksT0FBTyxLQUFLLElBQUksUUFBUSxFQUFFO1FBQ25DLE9BQU8sR0FBRyxPQUFPLEtBQUssSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7S0FDcEQ7U0FBTTtRQUNMLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxNQUFNLEVBQUU7WUFDMUMsT0FBTyxVQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztTQUMzQzthQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRTtZQUM1QixPQUFPLHFCQUFxQixLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ3REO2FBQU07WUFDTCxPQUFPLGdCQUFnQixDQUFDO1NBQ3pCO0tBQ0Y7QUFDSCxDQUFDO0FBR0Q7O0dBRUc7QUFDSCxNQUFhLDBCQUEyQixTQUFRLG9CQUFhO0lBQzNELFlBQVksS0FBVTtRQUNwQixLQUFLLENBQUMsd0JBQXdCLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM1RCxDQUFDO0NBQ0Y7QUFKRCxnRUFJQztBQUdELE1BQWEsNEJBQTZCLFNBQVEsb0JBQWE7SUFDN0QsWUFBWSxLQUFVO1FBQ3BCLEtBQUssQ0FBQywwQkFBMEIsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzlELENBQUM7Q0FDRjtBQUpELG9FQUlDO0FBR0QsU0FBZ0IsVUFBVSxDQUFDLE1BQWMsRUFBRSxPQUF5QjtJQUNsRSxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFL0IsSUFBSSxtQkFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ3hCLHdEQUF3RDtRQUN4RCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQ2hCLDBCQUFjLEVBQUUsRUFDaEIsZ0JBQUksRUFBRSxFQUNOLGVBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNWLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLHNCQUFVLElBQUksS0FBSyxDQUFDLEVBQUU7Z0JBQ3BDLE1BQU0sSUFBSSw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMvQztRQUNILENBQUMsQ0FBQyxDQUNILENBQUM7S0FDSDtTQUFNLElBQUksTUFBTSxJQUFJLHNCQUFVLElBQUksTUFBTSxFQUFFO1FBQ3pDLE9BQU8sU0FBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQzdCO1NBQU07UUFDTCxPQUFPLGlCQUFVLENBQUMsSUFBSSw0QkFBNEIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQzdEO0FBQ0gsQ0FBQztBQW5CRCxnQ0FtQkM7QUFHRCxTQUFnQixRQUFRLENBQ3RCLElBQVUsRUFDVixLQUF1QixFQUN2QixPQUF5QjtJQUV6QixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsb0JBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUNyQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRXhDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxPQUFPLFNBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNoQzthQUFNLElBQUksT0FBTyxNQUFNLElBQUksVUFBVSxFQUFFO1lBQ3RDLG1FQUFtRTtZQUNuRSxPQUFPLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBWSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzNEO2FBQU0sSUFBSSxtQkFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQy9CLHdEQUF3RDtZQUN4RCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQ2hCLDBCQUFjLEVBQUUsRUFDaEIsZ0JBQUksRUFBRSxFQUNOLGVBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDVixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxzQkFBVSxJQUFJLEtBQUssQ0FBQyxFQUFFO29CQUNwQyxNQUFNLElBQUksMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQzdDO1lBQ0gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztTQUNIO2FBQU0sSUFBSSxzQkFBVSxJQUFJLE1BQU0sRUFBRTtZQUMvQixPQUFPLFNBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUM3QjthQUFNO1lBQ0wsT0FBTyxpQkFBVSxDQUFDLElBQUksMEJBQTBCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztTQUMzRDtJQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDO0FBOUJELDRCQThCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24sIGlzT2JzZXJ2YWJsZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIG9mIGFzIG9ic2VydmFibGVPZiwgdGhyb3dFcnJvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZGVmYXVsdElmRW1wdHksIGxhc3QsIG1lcmdlTWFwLCB0YXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTb3VyY2UgfSBmcm9tICcuLi9lbmdpbmUvaW50ZXJmYWNlJztcbmltcG9ydCB7IFRyZWUsIFRyZWVTeW1ib2wgfSBmcm9tICcuLi90cmVlL2ludGVyZmFjZSc7XG5cblxuZnVuY3Rpb24gX2dldFR5cGVPZlJlc3VsdCh2YWx1ZT86IHt9KTogc3RyaW5nIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XG4gIH0gZWxzZSBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gJ251bGwnO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGBGdW5jdGlvbigpYDtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gYCR7dHlwZW9mIHZhbHVlfSgke0pTT04uc3RyaW5naWZ5KHZhbHVlKX0pYDtcbiAgfSBlbHNlIHtcbiAgICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbHVlKSA9PSBPYmplY3QpIHtcbiAgICAgIHJldHVybiBgT2JqZWN0KCR7SlNPTi5zdHJpbmdpZnkodmFsdWUpfSlgO1xuICAgIH0gZWxzZSBpZiAodmFsdWUuY29uc3RydWN0b3IpIHtcbiAgICAgIHJldHVybiBgSW5zdGFuY2Ugb2YgY2xhc3MgJHt2YWx1ZS5jb25zdHJ1Y3Rvci5uYW1lfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnVW5rbm93biBPYmplY3QnO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogV2hlbiBhIHJ1bGUgb3Igc291cmNlIHJldHVybnMgYW4gaW52YWxpZCB2YWx1ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEludmFsaWRSdWxlUmVzdWx0RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHZhbHVlPzoge30pIHtcbiAgICBzdXBlcihgSW52YWxpZCBydWxlIHJlc3VsdDogJHtfZ2V0VHlwZU9mUmVzdWx0KHZhbHVlKX0uYCk7XG4gIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgSW52YWxpZFNvdXJjZVJlc3VsdEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3Rvcih2YWx1ZT86IHt9KSB7XG4gICAgc3VwZXIoYEludmFsaWQgc291cmNlIHJlc3VsdDogJHtfZ2V0VHlwZU9mUmVzdWx0KHZhbHVlKX0uYCk7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY2FsbFNvdXJjZShzb3VyY2U6IFNvdXJjZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCk6IE9ic2VydmFibGU8VHJlZT4ge1xuICBjb25zdCByZXN1bHQgPSBzb3VyY2UoY29udGV4dCk7XG5cbiAgaWYgKGlzT2JzZXJ2YWJsZShyZXN1bHQpKSB7XG4gICAgLy8gT25seSByZXR1cm4gdGhlIGxhc3QgVHJlZSwgYW5kIG1ha2Ugc3VyZSBpdCdzIGEgVHJlZS5cbiAgICByZXR1cm4gcmVzdWx0LnBpcGUoXG4gICAgICBkZWZhdWx0SWZFbXB0eSgpLFxuICAgICAgbGFzdCgpLFxuICAgICAgdGFwKGlubmVyID0+IHtcbiAgICAgICAgaWYgKCFpbm5lciB8fCAhKFRyZWVTeW1ib2wgaW4gaW5uZXIpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRTb3VyY2VSZXN1bHRFeGNlcHRpb24oaW5uZXIpO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICApO1xuICB9IGVsc2UgaWYgKHJlc3VsdCAmJiBUcmVlU3ltYm9sIGluIHJlc3VsdCkge1xuICAgIHJldHVybiBvYnNlcnZhYmxlT2YocmVzdWx0KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdGhyb3dFcnJvcihuZXcgSW52YWxpZFNvdXJjZVJlc3VsdEV4Y2VwdGlvbihyZXN1bHQpKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxsUnVsZShcbiAgcnVsZTogUnVsZSxcbiAgaW5wdXQ6IE9ic2VydmFibGU8VHJlZT4sXG4gIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQsXG4pOiBPYnNlcnZhYmxlPFRyZWU+IHtcbiAgcmV0dXJuIGlucHV0LnBpcGUobWVyZ2VNYXAoaW5wdXRUcmVlID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBydWxlKGlucHV0VHJlZSwgY29udGV4dCk7XG5cbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihpbnB1dFRyZWUpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlc3VsdCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBUaGlzIGlzIGNvbnNpZGVyZWQgYSBSdWxlLCBjaGFpbiB0aGUgcnVsZSBhbmQgcmV0dXJuIGl0cyBvdXRwdXQuXG4gICAgICByZXR1cm4gY2FsbFJ1bGUocmVzdWx0LCBvYnNlcnZhYmxlT2YoaW5wdXRUcmVlKSwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChpc09ic2VydmFibGUocmVzdWx0KSkge1xuICAgICAgLy8gT25seSByZXR1cm4gdGhlIGxhc3QgVHJlZSwgYW5kIG1ha2Ugc3VyZSBpdCdzIGEgVHJlZS5cbiAgICAgIHJldHVybiByZXN1bHQucGlwZShcbiAgICAgICAgZGVmYXVsdElmRW1wdHkoKSxcbiAgICAgICAgbGFzdCgpLFxuICAgICAgICB0YXAoaW5uZXIgPT4ge1xuICAgICAgICAgIGlmICghaW5uZXIgfHwgIShUcmVlU3ltYm9sIGluIGlubmVyKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEludmFsaWRSdWxlUmVzdWx0RXhjZXB0aW9uKGlubmVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKFRyZWVTeW1ib2wgaW4gcmVzdWx0KSB7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aHJvd0Vycm9yKG5ldyBJbnZhbGlkUnVsZVJlc3VsdEV4Y2VwdGlvbihyZXN1bHQpKTtcbiAgICB9XG4gIH0pKTtcbn1cbiJdfQ==