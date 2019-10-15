"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RemoveHashPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        compiler.hooks.compilation.tap('remove-hash-plugin', compilation => {
            const mainTemplate = compilation.mainTemplate;
            mainTemplate.hooks.assetPath.tap('remove-hash-plugin', (path, data) => {
                const chunkName = data.chunk && data.chunk.name;
                const { chunkNames, hashFormat } = this.options;
                if (chunkName && chunkNames.includes(chunkName)) {
                    // Replace hash formats with empty strings.
                    return path
                        .replace(hashFormat.chunk, '')
                        .replace(hashFormat.extract, '');
                }
                return path;
            });
        });
    }
}
exports.RemoveHashPlugin = RemoveHashPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3ZlLWhhc2gtcGx1Z2luLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9hbmd1bGFyLWNsaS1maWxlcy9wbHVnaW5zL3JlbW92ZS1oYXNoLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWdCQSxNQUFhLGdCQUFnQjtJQUUzQixZQUFvQixPQUFnQztRQUFoQyxZQUFPLEdBQVAsT0FBTyxDQUF5QjtJQUFJLENBQUM7SUFFekQsS0FBSyxDQUFDLFFBQWtCO1FBQ3RCLFFBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxXQUFXLENBQUMsRUFBRTtZQUNqRSxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUMsWUFFaEMsQ0FBQztZQUVGLFlBQVksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFDbkQsQ0FBQyxJQUFZLEVBQUUsSUFBa0MsRUFBRSxFQUFFO2dCQUNuRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNoRCxNQUFNLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBRWhELElBQUksU0FBUyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7b0JBQy9DLDJDQUEyQztvQkFDM0MsT0FBTyxJQUFJO3lCQUNSLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQzt5QkFDN0IsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7aUJBQ3BDO2dCQUVELE9BQU8sSUFBSSxDQUFDO1lBQ2QsQ0FBQyxDQUNGLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTNCRCw0Q0EyQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBDb21waWxlciwgY29tcGlsYXRpb24gfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IEhhc2hGb3JtYXQgfSBmcm9tICcuLi9tb2RlbHMvd2VicGFjay1jb25maWdzL3V0aWxzJztcblxuXG5leHBvcnQgaW50ZXJmYWNlIFJlbW92ZUhhc2hQbHVnaW5PcHRpb25zIHtcbiAgY2h1bmtOYW1lczogc3RyaW5nW107XG4gIGhhc2hGb3JtYXQ6IEhhc2hGb3JtYXQ7XG59XG5cbmV4cG9ydCBjbGFzcyBSZW1vdmVIYXNoUGx1Z2luIHtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG9wdGlvbnM6IFJlbW92ZUhhc2hQbHVnaW5PcHRpb25zKSB7IH1cblxuICBhcHBseShjb21waWxlcjogQ29tcGlsZXIpOiB2b2lkIHtcbiAgICBjb21waWxlci5ob29rcy5jb21waWxhdGlvbi50YXAoJ3JlbW92ZS1oYXNoLXBsdWdpbicsIGNvbXBpbGF0aW9uID0+IHtcbiAgICAgIGNvbnN0IG1haW5UZW1wbGF0ZSA9IGNvbXBpbGF0aW9uLm1haW5UZW1wbGF0ZSBhcyBjb21waWxhdGlvbi5NYWluVGVtcGxhdGUgJiB7XG4gICAgICAgIGhvb2tzOiBjb21waWxhdGlvbi5Db21waWxhdGlvbkhvb2tzO1xuICAgICAgfTtcblxuICAgICAgbWFpblRlbXBsYXRlLmhvb2tzLmFzc2V0UGF0aC50YXAoJ3JlbW92ZS1oYXNoLXBsdWdpbicsXG4gICAgICAgIChwYXRoOiBzdHJpbmcsIGRhdGE6IHsgY2h1bms/OiB7IG5hbWU6IHN0cmluZyB9IH0pID0+IHtcbiAgICAgICAgICBjb25zdCBjaHVua05hbWUgPSBkYXRhLmNodW5rICYmIGRhdGEuY2h1bmsubmFtZTtcbiAgICAgICAgICBjb25zdCB7IGNodW5rTmFtZXMsIGhhc2hGb3JtYXQgfSA9IHRoaXMub3B0aW9ucztcblxuICAgICAgICAgIGlmIChjaHVua05hbWUgJiYgY2h1bmtOYW1lcy5pbmNsdWRlcyhjaHVua05hbWUpKSB7XG4gICAgICAgICAgICAvLyBSZXBsYWNlIGhhc2ggZm9ybWF0cyB3aXRoIGVtcHR5IHN0cmluZ3MuXG4gICAgICAgICAgICByZXR1cm4gcGF0aFxuICAgICAgICAgICAgICAucmVwbGFjZShoYXNoRm9ybWF0LmNodW5rLCAnJylcbiAgICAgICAgICAgICAgLnJlcGxhY2UoaGFzaEZvcm1hdC5leHRyYWN0LCAnJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgIH0pO1xuICB9XG59XG4iXX0=