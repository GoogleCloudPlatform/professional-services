"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tasks_1 = require("@angular-devkit/schematics/tasks"); // tslint:disable-line:no-implicit-dependencies
const path = require("path");
function default_1(options) {
    return (_, context) => {
        context.addTask(new tasks_1.TslintFixTask({
            rulesDirectory: path.join(__dirname, 'rules'),
            rules: {
                'custom-rule': [true, options.shouldPass],
            },
        }, {
            includes: '*.ts',
            silent: false,
        }));
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tLXJ1bGUuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MvdHNsaW50LWZpeC90ZXN0L2N1c3RvbS1ydWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBWUEsNERBRTBDLENBQUUsK0NBQStDO0FBQzNGLDZCQUE2QjtBQUU3QixtQkFBd0IsT0FBZ0M7SUFDdEQsT0FBTyxDQUFDLENBQU8sRUFBRSxPQUF5QixFQUFFLEVBQUU7UUFDNUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLHFCQUFhLENBQUM7WUFDaEMsY0FBYyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQztZQUM3QyxLQUFLLEVBQUU7Z0JBQ0wsYUFBYSxFQUFFLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUM7YUFDMUM7U0FDRixFQUFFO1lBQ0QsUUFBUSxFQUFFLE1BQU07WUFDaEIsTUFBTSxFQUFFLEtBQUs7U0FDZCxDQUFDLENBQUMsQ0FBQztJQUNOLENBQUMsQ0FBQztBQUNKLENBQUM7QUFaRCw0QkFZQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7XG4gIFJ1bGUsXG4gIFNjaGVtYXRpY0NvbnRleHQsXG4gIFRyZWUsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJzsgIC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8taW1wbGljaXQtZGVwZW5kZW5jaWVzXG5pbXBvcnQge1xuICBUc2xpbnRGaXhUYXNrLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90YXNrcyc7ICAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLWltcGxpY2l0LWRlcGVuZGVuY2llc1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24ob3B0aW9uczogeyBzaG91bGRQYXNzOiBib29sZWFuIH0pOiBSdWxlIHtcbiAgcmV0dXJuIChfOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29udGV4dC5hZGRUYXNrKG5ldyBUc2xpbnRGaXhUYXNrKHtcbiAgICAgIHJ1bGVzRGlyZWN0b3J5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAncnVsZXMnKSxcbiAgICAgIHJ1bGVzOiB7XG4gICAgICAgICdjdXN0b20tcnVsZSc6IFt0cnVlLCBvcHRpb25zLnNob3VsZFBhc3NdLFxuICAgICAgfSxcbiAgICB9LCB7XG4gICAgICBpbmNsdWRlczogJyoudHMnLFxuICAgICAgc2lsZW50OiBmYWxzZSxcbiAgICB9KSk7XG4gIH07XG59XG4iXX0=