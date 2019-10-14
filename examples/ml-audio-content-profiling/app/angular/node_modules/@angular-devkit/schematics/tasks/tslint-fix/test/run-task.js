"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tasks_1 = require("@angular-devkit/schematics/tasks"); // tslint:disable-line:no-implicit-dependencies
function default_1() {
    return (_, context) => {
        context.addTask(new tasks_1.TslintFixTask({
            rules: {
                'max-line-length': [true, 80],
            },
        }, {
            includes: '*.ts',
            silent: false,
        }));
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLXRhc2suanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MvdHNsaW50LWZpeC90ZXN0L3J1bi10YXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBWUEsNERBRTBDLENBQUUsK0NBQStDO0FBRTNGO0lBQ0UsT0FBTyxDQUFDLENBQU8sRUFBRSxPQUF5QixFQUFFLEVBQUU7UUFDNUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLHFCQUFhLENBQUM7WUFDaEMsS0FBSyxFQUFFO2dCQUNMLGlCQUFpQixFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQzthQUM5QjtTQUNGLEVBQUU7WUFDRCxRQUFRLEVBQUUsTUFBTTtZQUNoQixNQUFNLEVBQUUsS0FBSztTQUNkLENBQUMsQ0FBQyxDQUFDO0lBQ04sQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVhELDRCQVdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgUnVsZSxcbiAgU2NoZW1hdGljQ29udGV4dCxcbiAgVHJlZSxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnOyAgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1pbXBsaWNpdC1kZXBlbmRlbmNpZXNcbmltcG9ydCB7XG4gIFRzbGludEZpeFRhc2ssXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rhc2tzJzsgIC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8taW1wbGljaXQtZGVwZW5kZW5jaWVzXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKF86IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb250ZXh0LmFkZFRhc2sobmV3IFRzbGludEZpeFRhc2soe1xuICAgICAgcnVsZXM6IHtcbiAgICAgICAgJ21heC1saW5lLWxlbmd0aCc6IFt0cnVlLCA4MF0sXG4gICAgICB9LFxuICAgIH0sIHtcbiAgICAgIGluY2x1ZGVzOiAnKi50cycsXG4gICAgICBzaWxlbnQ6IGZhbHNlLFxuICAgIH0pKTtcbiAgfTtcbn1cbiJdfQ==