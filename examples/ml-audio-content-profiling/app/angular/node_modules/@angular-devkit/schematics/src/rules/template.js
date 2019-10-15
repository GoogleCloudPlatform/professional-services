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
const base_1 = require("./base");
const rename_1 = require("./rename");
const is_binary_1 = require("./utils/is-binary");
exports.TEMPLATE_FILENAME_RE = /\.template$/;
class OptionIsNotDefinedException extends core_1.BaseException {
    constructor(name) { super(`Option "${name}" is not defined.`); }
}
exports.OptionIsNotDefinedException = OptionIsNotDefinedException;
class UnknownPipeException extends core_1.BaseException {
    constructor(name) { super(`Pipe "${name}" is not defined.`); }
}
exports.UnknownPipeException = UnknownPipeException;
class InvalidPipeException extends core_1.BaseException {
    constructor(name) { super(`Pipe "${name}" is invalid.`); }
}
exports.InvalidPipeException = InvalidPipeException;
function applyContentTemplate(options) {
    return (entry) => {
        const { path, content } = entry;
        if (is_binary_1.isBinary(content)) {
            return entry;
        }
        return {
            path: path,
            content: Buffer.from(core_1.template(content.toString('utf-8'), {})(options)),
        };
    };
}
exports.applyContentTemplate = applyContentTemplate;
function contentTemplate(options) {
    return base_1.forEach(applyContentTemplate(options));
}
exports.contentTemplate = contentTemplate;
function applyPathTemplate(data, options = {
    interpolationStart: '__',
    interpolationEnd: '__',
    pipeSeparator: '@',
}) {
    const is = options.interpolationStart;
    const ie = options.interpolationEnd;
    const isL = is.length;
    const ieL = ie.length;
    return (entry) => {
        let path = entry.path;
        const content = entry.content;
        const original = path;
        let start = path.indexOf(is);
        // + 1 to have at least a length 1 name. `____` is not valid.
        let end = path.indexOf(ie, start + isL + 1);
        while (start != -1 && end != -1) {
            const match = path.substring(start + isL, end);
            let replacement = data[match];
            if (!options.pipeSeparator) {
                if (typeof replacement == 'function') {
                    replacement = replacement.call(data, original);
                }
                if (replacement === undefined) {
                    throw new OptionIsNotDefinedException(match);
                }
            }
            else {
                const [name, ...pipes] = match.split(options.pipeSeparator);
                replacement = data[name];
                if (typeof replacement == 'function') {
                    replacement = replacement.call(data, original);
                }
                if (replacement === undefined) {
                    throw new OptionIsNotDefinedException(name);
                }
                replacement = pipes.reduce((acc, pipe) => {
                    if (!pipe) {
                        return acc;
                    }
                    if (!(pipe in data)) {
                        throw new UnknownPipeException(pipe);
                    }
                    if (typeof data[pipe] != 'function') {
                        throw new InvalidPipeException(pipe);
                    }
                    // Coerce to string.
                    return '' + data[pipe](acc);
                }, '' + replacement);
            }
            path = path.substring(0, start) + replacement + path.substring(end + ieL);
            start = path.indexOf(options.interpolationStart);
            // See above.
            end = path.indexOf(options.interpolationEnd, start + isL + 1);
        }
        return { path: core_1.normalize(path), content };
    };
}
exports.applyPathTemplate = applyPathTemplate;
function pathTemplate(options) {
    return base_1.forEach(applyPathTemplate(options));
}
exports.pathTemplate = pathTemplate;
/**
 * Remove every `.template` suffix from file names.
 */
function renameTemplateFiles() {
    return rename_1.rename(path => !!path.match(exports.TEMPLATE_FILENAME_RE), path => path.replace(exports.TEMPLATE_FILENAME_RE, ''));
}
exports.renameTemplateFiles = renameTemplateFiles;
function template(options) {
    return base_1.chain([
        contentTemplate(options),
        // Force cast to PathTemplateData. We need the type for the actual pathTemplate() call,
        // but in this case we cannot do anything as contentTemplate are more permissive.
        // Since values are coerced to strings in PathTemplates it will be fine in the end.
        pathTemplate(options),
    ]);
}
exports.template = template;
function applyTemplates(options) {
    return base_1.forEach(base_1.when(path => path.endsWith('.template'), base_1.composeFileOperators([
        applyContentTemplate(options),
        // See above for this weird cast.
        applyPathTemplate(options),
        entry => {
            return {
                content: entry.content,
                path: entry.path.replace(exports.TEMPLATE_FILENAME_RE, ''),
            };
        },
    ])));
}
exports.applyTemplates = applyTemplates;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3J1bGVzL3RlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQTBGO0FBRzFGLGlDQUFvRTtBQUNwRSxxQ0FBa0M7QUFDbEMsaURBQTZDO0FBR2hDLFFBQUEsb0JBQW9CLEdBQUcsYUFBYSxDQUFDO0FBR2xELE1BQWEsMkJBQTRCLFNBQVEsb0JBQWE7SUFDNUQsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLFdBQVcsSUFBSSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUN6RTtBQUZELGtFQUVDO0FBR0QsTUFBYSxvQkFBcUIsU0FBUSxvQkFBYTtJQUNyRCxZQUFZLElBQVksSUFBSSxLQUFLLENBQUMsU0FBUyxJQUFJLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZFO0FBRkQsb0RBRUM7QUFHRCxNQUFhLG9CQUFxQixTQUFRLG9CQUFhO0lBQ3JELFlBQVksSUFBWSxJQUFJLEtBQUssQ0FBQyxTQUFTLElBQUksZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ25FO0FBRkQsb0RBRUM7QUFxQkQsU0FBZ0Isb0JBQW9CLENBQUksT0FBVTtJQUNoRCxPQUFPLENBQUMsS0FBZ0IsRUFBRSxFQUFFO1FBQzFCLE1BQU0sRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDLEdBQUcsS0FBSyxDQUFDO1FBQzlCLElBQUksb0JBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNyQixPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsT0FBTztZQUNMLElBQUksRUFBRSxJQUFJO1lBQ1YsT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBWSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7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O1FBQ3ZGLGlGQUFpRjtRQUNqRixtRkFBbUY7UUFDbkYsWUFBWSxDQUFDLE9BQWlDLENBQUM7S0FDaEQsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVJELDRCQVFDO0FBR0QsU0FBZ0IsY0FBYyxDQUFJLE9BQVU7SUFDMUMsT0FBTyxjQUFPLENBQ1osV0FBSSxDQUNGLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFDbEMsMkJBQW9CLENBQUM7UUFDbkIsb0JBQW9CLENBQUMsT0FBTyxDQUFDO1FBQzdCLGlDQUFpQztRQUNqQyxpQkFBaUIsQ0FBQyxPQUFpQyxDQUFDO1FBQ3BELEtBQUssQ0FBQyxFQUFFO1lBQ04sT0FBTztnQkFDTCxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3RCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw0QkFBb0IsRUFBRSxFQUFFLENBQUM7YUFDdEMsQ0FBQztRQUNqQixDQUFDO0tBQ0YsQ0FBQyxDQUNILENBQ0YsQ0FBQztBQUNKLENBQUM7QUFqQkQsd0NBaUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiwgbm9ybWFsaXplLCB0ZW1wbGF0ZSBhcyB0ZW1wbGF0ZUltcGwgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBGaWxlT3BlcmF0b3IsIFJ1bGUgfSBmcm9tICcuLi9lbmdpbmUvaW50ZXJmYWNlJztcbmltcG9ydCB7IEZpbGVFbnRyeSB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7IGNoYWluLCBjb21wb3NlRmlsZU9wZXJhdG9ycywgZm9yRWFjaCwgd2hlbiB9IGZyb20gJy4vYmFzZSc7XG5pbXBvcnQgeyByZW5hbWUgfSBmcm9tICcuL3JlbmFtZSc7XG5pbXBvcnQgeyBpc0JpbmFyeSB9IGZyb20gJy4vdXRpbHMvaXMtYmluYXJ5JztcblxuXG5leHBvcnQgY29uc3QgVEVNUExBVEVfRklMRU5BTUVfUkUgPSAvXFwudGVtcGxhdGUkLztcblxuXG5leHBvcnQgY2xhc3MgT3B0aW9uSXNOb3REZWZpbmVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykgeyBzdXBlcihgT3B0aW9uIFwiJHtuYW1lfVwiIGlzIG5vdCBkZWZpbmVkLmApOyB9XG59XG5cblxuZXhwb3J0IGNsYXNzIFVua25vd25QaXBlRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykgeyBzdXBlcihgUGlwZSBcIiR7bmFtZX1cIiBpcyBub3QgZGVmaW5lZC5gKTsgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkUGlwZUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHsgc3VwZXIoYFBpcGUgXCIke25hbWV9XCIgaXMgaW52YWxpZC5gKTsgfVxufVxuXG5cbmV4cG9ydCB0eXBlIFBhdGhUZW1wbGF0ZVZhbHVlID0gYm9vbGVhbiB8IHN0cmluZyB8IG51bWJlciB8IHVuZGVmaW5lZDtcbmV4cG9ydCB0eXBlIFBhdGhUZW1wbGF0ZVBpcGVGdW5jdGlvbiA9ICh4OiBzdHJpbmcpID0+IFBhdGhUZW1wbGF0ZVZhbHVlO1xuZXhwb3J0IHR5cGUgUGF0aFRlbXBsYXRlRGF0YSA9IHtcbiAgW2tleTogc3RyaW5nXTogUGF0aFRlbXBsYXRlVmFsdWUgfCBQYXRoVGVtcGxhdGVEYXRhIHwgUGF0aFRlbXBsYXRlUGlwZUZ1bmN0aW9uLFxufTtcblxuXG5leHBvcnQgaW50ZXJmYWNlIFBhdGhUZW1wbGF0ZU9wdGlvbnMge1xuICAvLyBJbnRlcnBvbGF0aW9uIHN0YXJ0IGFuZCBlbmQgc3RyaW5ncy5cbiAgaW50ZXJwb2xhdGlvblN0YXJ0OiBzdHJpbmc7XG4gIC8vIEludGVycG9sYXRpb24gc3RhcnQgYW5kIGVuZCBzdHJpbmdzLlxuICBpbnRlcnBvbGF0aW9uRW5kOiBzdHJpbmc7XG5cbiAgLy8gU2VwYXJhdG9yIGZvciBwaXBlcy4gRG8gbm90IHNwZWNpZnkgdG8gcmVtb3ZlIHBpcGUgc3VwcG9ydC5cbiAgcGlwZVNlcGFyYXRvcj86IHN0cmluZztcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlDb250ZW50VGVtcGxhdGU8VD4ob3B0aW9uczogVCk6IEZpbGVPcGVyYXRvciB7XG4gIHJldHVybiAoZW50cnk6IEZpbGVFbnRyeSkgPT4ge1xuICAgIGNvbnN0IHtwYXRoLCBjb250ZW50fSA9IGVudHJ5O1xuICAgIGlmIChpc0JpbmFyeShjb250ZW50KSkge1xuICAgICAgcmV0dXJuIGVudHJ5O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBwYXRoOiBwYXRoLFxuICAgICAgY29udGVudDogQnVmZmVyLmZyb20odGVtcGxhdGVJbXBsKGNvbnRlbnQudG9TdHJpbmcoJ3V0Zi04JyksIHt9KShvcHRpb25zKSksXG4gICAgfTtcbiAgfTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY29udGVudFRlbXBsYXRlPFQ+KG9wdGlvbnM6IFQpOiBSdWxlIHtcbiAgcmV0dXJuIGZvckVhY2goYXBwbHlDb250ZW50VGVtcGxhdGUob3B0aW9ucykpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVBhdGhUZW1wbGF0ZTxUIGV4dGVuZHMgUGF0aFRlbXBsYXRlRGF0YT4oXG4gIGRhdGE6IFQsXG4gIG9wdGlvbnM6IFBhdGhUZW1wbGF0ZU9wdGlvbnMgPSB7XG4gICAgaW50ZXJwb2xhdGlvblN0YXJ0OiAnX18nLFxuICAgIGludGVycG9sYXRpb25FbmQ6ICdfXycsXG4gICAgcGlwZVNlcGFyYXRvcjogJ0AnLFxuICB9LFxuKTogRmlsZU9wZXJhdG9yIHtcbiAgY29uc3QgaXMgPSBvcHRpb25zLmludGVycG9sYXRpb25TdGFydDtcbiAgY29uc3QgaWUgPSBvcHRpb25zLmludGVycG9sYXRpb25FbmQ7XG4gIGNvbnN0IGlzTCA9IGlzLmxlbmd0aDtcbiAgY29uc3QgaWVMID0gaWUubGVuZ3RoO1xuXG4gIHJldHVybiAoZW50cnk6IEZpbGVFbnRyeSkgPT4ge1xuICAgIGxldCBwYXRoID0gZW50cnkucGF0aCBhcyBzdHJpbmc7XG4gICAgY29uc3QgY29udGVudCA9IGVudHJ5LmNvbnRlbnQ7XG4gICAgY29uc3Qgb3JpZ2luYWwgPSBwYXRoO1xuXG4gICAgbGV0IHN0YXJ0ID0gcGF0aC5pbmRleE9mKGlzKTtcbiAgICAvLyArIDEgdG8gaGF2ZSBhdCBsZWFzdCBhIGxlbmd0aCAxIG5hbWUuIGBfX19fYCBpcyBub3QgdmFsaWQuXG4gICAgbGV0IGVuZCA9IHBhdGguaW5kZXhPZihpZSwgc3RhcnQgKyBpc0wgKyAxKTtcblxuICAgIHdoaWxlIChzdGFydCAhPSAtMSAmJiBlbmQgIT0gLTEpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gcGF0aC5zdWJzdHJpbmcoc3RhcnQgKyBpc0wsIGVuZCk7XG4gICAgICBsZXQgcmVwbGFjZW1lbnQgPSBkYXRhW21hdGNoXTtcblxuICAgICAgaWYgKCFvcHRpb25zLnBpcGVTZXBhcmF0b3IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXBsYWNlbWVudCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgcmVwbGFjZW1lbnQgPSByZXBsYWNlbWVudC5jYWxsKGRhdGEsIG9yaWdpbmFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXBsYWNlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE9wdGlvbklzTm90RGVmaW5lZEV4Y2VwdGlvbihtYXRjaCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IFtuYW1lLCAuLi5waXBlc10gPSBtYXRjaC5zcGxpdChvcHRpb25zLnBpcGVTZXBhcmF0b3IpO1xuICAgICAgICByZXBsYWNlbWVudCA9IGRhdGFbbmFtZV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiByZXBsYWNlbWVudCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgcmVwbGFjZW1lbnQgPSByZXBsYWNlbWVudC5jYWxsKGRhdGEsIG9yaWdpbmFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXBsYWNlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE9wdGlvbklzTm90RGVmaW5lZEV4Y2VwdGlvbihuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcGxhY2VtZW50ID0gcGlwZXMucmVkdWNlKChhY2M6IHN0cmluZywgcGlwZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgaWYgKCFwaXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIShwaXBlIGluIGRhdGEpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVW5rbm93blBpcGVFeGNlcHRpb24ocGlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2YgZGF0YVtwaXBlXSAhPSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFBpcGVFeGNlcHRpb24ocGlwZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ29lcmNlIHRvIHN0cmluZy5cbiAgICAgICAgICByZXR1cm4gJycgKyAoZGF0YVtwaXBlXSBhcyBQYXRoVGVtcGxhdGVQaXBlRnVuY3Rpb24pKGFjYyk7XG4gICAgICAgIH0sICcnICsgcmVwbGFjZW1lbnQpO1xuICAgICAgfVxuXG4gICAgICBwYXRoID0gcGF0aC5zdWJzdHJpbmcoMCwgc3RhcnQpICsgcmVwbGFjZW1lbnQgKyBwYXRoLnN1YnN0cmluZyhlbmQgKyBpZUwpO1xuXG4gICAgICBzdGFydCA9IHBhdGguaW5kZXhPZihvcHRpb25zLmludGVycG9sYXRpb25TdGFydCk7XG4gICAgICAvLyBTZWUgYWJvdmUuXG4gICAgICBlbmQgPSBwYXRoLmluZGV4T2Yob3B0aW9ucy5pbnRlcnBvbGF0aW9uRW5kLCBzdGFydCArIGlzTCArIDEpO1xuICAgIH1cblxuICAgIHJldHVybiB7IHBhdGg6IG5vcm1hbGl6ZShwYXRoKSwgY29udGVudCB9O1xuICB9O1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRoVGVtcGxhdGU8VCBleHRlbmRzIFBhdGhUZW1wbGF0ZURhdGE+KG9wdGlvbnM6IFQpOiBSdWxlIHtcbiAgcmV0dXJuIGZvckVhY2goYXBwbHlQYXRoVGVtcGxhdGUob3B0aW9ucykpO1xufVxuXG5cbi8qKlxuICogUmVtb3ZlIGV2ZXJ5IGAudGVtcGxhdGVgIHN1ZmZpeCBmcm9tIGZpbGUgbmFtZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5hbWVUZW1wbGF0ZUZpbGVzKCk6IFJ1bGUge1xuICByZXR1cm4gcmVuYW1lKFxuICAgIHBhdGggPT4gISFwYXRoLm1hdGNoKFRFTVBMQVRFX0ZJTEVOQU1FX1JFKSxcbiAgICBwYXRoID0+IHBhdGgucmVwbGFjZShURU1QTEFURV9GSUxFTkFNRV9SRSwgJycpLFxuICApO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZTxUPihvcHRpb25zOiBUKTogUnVsZSB7XG4gIHJldHVybiBjaGFpbihbXG4gICAgY29udGVudFRlbXBsYXRlKG9wdGlvbnMpLFxuICAgIC8vIEZvcmNlIGNhc3QgdG8gUGF0aFRlbXBsYXRlRGF0YS4gV2UgbmVlZCB0aGUgdHlwZSBmb3IgdGhlIGFjdHVhbCBwYXRoVGVtcGxhdGUoKSBjYWxsLFxuICAgIC8vIGJ1dCBpbiB0aGlzIGNhc2Ugd2UgY2Fubm90IGRvIGFueXRoaW5nIGFzIGNvbnRlbnRUZW1wbGF0ZSBhcmUgbW9yZSBwZXJtaXNzaXZlLlxuICAgIC8vIFNpbmNlIHZhbHVlcyBhcmUgY29lcmNlZCB0byBzdHJpbmdzIGluIFBhdGhUZW1wbGF0ZXMgaXQgd2lsbCBiZSBmaW5lIGluIHRoZSBlbmQuXG4gICAgcGF0aFRlbXBsYXRlKG9wdGlvbnMgYXMge30gYXMgUGF0aFRlbXBsYXRlRGF0YSksXG4gIF0pO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVRlbXBsYXRlczxUPihvcHRpb25zOiBUKTogUnVsZSB7XG4gIHJldHVybiBmb3JFYWNoKFxuICAgIHdoZW4oXG4gICAgICBwYXRoID0+IHBhdGguZW5kc1dpdGgoJy50ZW1wbGF0ZScpLFxuICAgICAgY29tcG9zZUZpbGVPcGVyYXRvcnMoW1xuICAgICAgICBhcHBseUNvbnRlbnRUZW1wbGF0ZShvcHRpb25zKSxcbiAgICAgICAgLy8gU2VlIGFib3ZlIGZvciB0aGlzIHdlaXJkIGNhc3QuXG4gICAgICAgIGFwcGx5UGF0aFRlbXBsYXRlKG9wdGlvbnMgYXMge30gYXMgUGF0aFRlbXBsYXRlRGF0YSksXG4gICAgICAgIGVudHJ5ID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29udGVudDogZW50cnkuY29udGVudCxcbiAgICAgICAgICAgIHBhdGg6IGVudHJ5LnBhdGgucmVwbGFjZShURU1QTEFURV9GSUxFTkFNRV9SRSwgJycpLFxuICAgICAgICAgIH0gYXMgRmlsZUVudHJ5O1xuICAgICAgICB9LFxuICAgICAgXSksXG4gICAgKSxcbiAgKTtcbn1cbiJdfQ==