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
class InvalidInputOptions extends core_1.schema.SchemaValidationException {
    constructor(options, errors) {
        super(errors, `Schematic input does not validate against the Schema: ${JSON.stringify(options)}\nErrors:\n`);
    }
}
exports.InvalidInputOptions = InvalidInputOptions;
// This can only be used in NodeJS.
function validateOptionsWithSchema(registry) {
    return (schematic, options, context) => {
        // Prevent a schematic from changing the options object by making a copy of it.
        options = core_1.deepCopy(options);
        const withPrompts = context ? context.interactive : true;
        if (schematic.schema && schematic.schemaJson) {
            // Make a deep copy of options.
            return registry
                .compile(schematic.schemaJson)
                .pipe(operators_1.mergeMap(validator => validator(options, { withPrompts })), operators_1.first(), operators_1.map(result => {
                if (!result.success) {
                    throw new InvalidInputOptions(options, result.errors || []);
                }
                return options;
            }));
        }
        return rxjs_1.of(options);
    };
}
exports.validateOptionsWithSchema = validateOptionsWithSchema;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvc2NoZW1hLW9wdGlvbi10cmFuc2Zvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCwrQ0FBd0Q7QUFDeEQsK0JBQXNEO0FBQ3RELDhDQUFzRDtBQUd0RCxNQUFhLG1CQUE0QixTQUFRLGFBQU0sQ0FBQyx5QkFBeUI7SUFDL0UsWUFBWSxPQUFVLEVBQUUsTUFBcUM7UUFDM0QsS0FBSyxDQUNILE1BQU0sRUFDTix5REFBeUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUM5RixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBUEQsa0RBT0M7QUFFRCxtQ0FBbUM7QUFDbkMsU0FBZ0IseUJBQXlCLENBQUMsUUFBK0I7SUFDdkUsT0FBTyxDQUNMLFNBQXlDLEVBQ3pDLE9BQVUsRUFDVixPQUFvQyxFQUNyQixFQUFFO1FBQ2pCLCtFQUErRTtRQUMvRSxPQUFPLEdBQUcsZUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTVCLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRXpELElBQUksU0FBUyxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsVUFBVSxFQUFFO1lBQzVDLCtCQUErQjtZQUMvQixPQUFPLFFBQVE7aUJBQ1osT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7aUJBQzdCLElBQUksQ0FDSCxvQkFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFDMUQsaUJBQUssRUFBRSxFQUNQLGVBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDWCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtvQkFDbkIsTUFBTSxJQUFJLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2lCQUM3RDtnQkFFRCxPQUFPLE9BQU8sQ0FBQztZQUNqQixDQUFDLENBQUMsQ0FDSCxDQUFDO1NBQ0w7UUFFRCxPQUFPLFNBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQixDQUFDLENBQUM7QUFDSixDQUFDO0FBOUJELDhEQThCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IGRlZXBDb3B5LCBzY2hlbWEgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGZpcnN0LCBtYXAsIG1lcmdlTWFwIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQsIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbiB9IGZyb20gJy4vZGVzY3JpcHRpb24nO1xuXG5leHBvcnQgY2xhc3MgSW52YWxpZElucHV0T3B0aW9uczxUID0ge30+IGV4dGVuZHMgc2NoZW1hLlNjaGVtYVZhbGlkYXRpb25FeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBULCBlcnJvcnM6IHNjaGVtYS5TY2hlbWFWYWxpZGF0b3JFcnJvcltdKSB7XG4gICAgc3VwZXIoXG4gICAgICBlcnJvcnMsXG4gICAgICBgU2NoZW1hdGljIGlucHV0IGRvZXMgbm90IHZhbGlkYXRlIGFnYWluc3QgdGhlIFNjaGVtYTogJHtKU09OLnN0cmluZ2lmeShvcHRpb25zKX1cXG5FcnJvcnM6XFxuYCxcbiAgICApO1xuICB9XG59XG5cbi8vIFRoaXMgY2FuIG9ubHkgYmUgdXNlZCBpbiBOb2RlSlMuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVPcHRpb25zV2l0aFNjaGVtYShyZWdpc3RyeTogc2NoZW1hLlNjaGVtYVJlZ2lzdHJ5KSB7XG4gIHJldHVybiA8VCBleHRlbmRzIHt9PihcbiAgICBzY2hlbWF0aWM6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbixcbiAgICBvcHRpb25zOiBULFxuICAgIGNvbnRleHQ/OiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCxcbiAgKTogT2JzZXJ2YWJsZTxUPiA9PiB7XG4gICAgLy8gUHJldmVudCBhIHNjaGVtYXRpYyBmcm9tIGNoYW5naW5nIHRoZSBvcHRpb25zIG9iamVjdCBieSBtYWtpbmcgYSBjb3B5IG9mIGl0LlxuICAgIG9wdGlvbnMgPSBkZWVwQ29weShvcHRpb25zKTtcblxuICAgIGNvbnN0IHdpdGhQcm9tcHRzID0gY29udGV4dCA/IGNvbnRleHQuaW50ZXJhY3RpdmUgOiB0cnVlO1xuXG4gICAgaWYgKHNjaGVtYXRpYy5zY2hlbWEgJiYgc2NoZW1hdGljLnNjaGVtYUpzb24pIHtcbiAgICAgIC8vIE1ha2UgYSBkZWVwIGNvcHkgb2Ygb3B0aW9ucy5cbiAgICAgIHJldHVybiByZWdpc3RyeVxuICAgICAgICAuY29tcGlsZShzY2hlbWF0aWMuc2NoZW1hSnNvbilcbiAgICAgICAgLnBpcGUoXG4gICAgICAgICAgbWVyZ2VNYXAodmFsaWRhdG9yID0+IHZhbGlkYXRvcihvcHRpb25zLCB7IHdpdGhQcm9tcHRzIH0pKSxcbiAgICAgICAgICBmaXJzdCgpLFxuICAgICAgICAgIG1hcChyZXN1bHQgPT4ge1xuICAgICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZElucHV0T3B0aW9ucyhvcHRpb25zLCByZXN1bHQuZXJyb3JzIHx8IFtdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9ic2VydmFibGVPZihvcHRpb25zKTtcbiAgfTtcbn1cbiJdfQ==