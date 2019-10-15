"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:no-any
function oneLine(strings, ...values) {
    const endResult = String.raw(strings, ...values);
    return endResult.replace(/(?:\r?\n(?:\s*))+/gm, ' ').trim();
}
exports.oneLine = oneLine;
function indentBy(indentations) {
    let i = '';
    while (indentations--) {
        i += ' ';
    }
    return (strings, ...values) => {
        return i + stripIndent(strings, ...values).replace(/\n/g, '\n' + i);
    };
}
exports.indentBy = indentBy;
// tslint:disable-next-line:no-any
function stripIndent(strings, ...values) {
    const endResult = String.raw(strings, ...values);
    // remove the shortest leading indentation from each line
    const match = endResult.match(/^[ \t]*(?=\S)/gm);
    // return early if there's nothing to strip
    if (match === null) {
        return endResult;
    }
    const indent = Math.min(...match.map(el => el.length));
    const regexp = new RegExp('^[ \\t]{' + indent + '}', 'gm');
    return (indent > 0 ? endResult.replace(regexp, '') : endResult).trim();
}
exports.stripIndent = stripIndent;
// tslint:disable-next-line:no-any
function stripIndents(strings, ...values) {
    return String.raw(strings, ...values)
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .trim();
}
exports.stripIndents = stripIndents;
// tslint:disable-next-line:no-any
function trimNewlines(strings, ...values) {
    const endResult = String.raw(strings, ...values);
    return endResult
        // Remove the newline at the start.
        .replace(/^(?:\r?\n)+/, '')
        // Remove the newline at the end and following whitespace.
        .replace(/(?:\r?\n(?:\s*))$/, '');
}
exports.trimNewlines = trimNewlines;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGl0ZXJhbHMuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL3V0aWxzL2xpdGVyYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBY0Esa0NBQWtDO0FBQ2xDLFNBQWdCLE9BQU8sQ0FBQyxPQUE2QixFQUFFLEdBQUcsTUFBYTtJQUNyRSxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBRWpELE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUM5RCxDQUFDO0FBSkQsMEJBSUM7QUFFRCxTQUFnQixRQUFRLENBQUMsWUFBb0I7SUFDM0MsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ1gsT0FBTyxZQUFZLEVBQUUsRUFBRTtRQUNyQixDQUFDLElBQUksR0FBRyxDQUFDO0tBQ1Y7SUFFRCxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsTUFBTSxFQUFFLEVBQUU7UUFDNUIsT0FBTyxDQUFDLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLENBQUMsQ0FBQztBQUNKLENBQUM7QUFURCw0QkFTQztBQUdELGtDQUFrQztBQUNsQyxTQUFnQixXQUFXLENBQUMsT0FBNkIsRUFBRSxHQUFHLE1BQWE7SUFDekUsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQztJQUVqRCx5REFBeUQ7SUFDekQsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBRWpELDJDQUEyQztJQUMzQyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDbEIsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLFVBQVUsR0FBRyxNQUFNLEdBQUcsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRTNELE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDekUsQ0FBQztBQWZELGtDQWVDO0FBR0Qsa0NBQWtDO0FBQ2xDLFNBQWdCLFlBQVksQ0FBQyxPQUE2QixFQUFFLEdBQUcsTUFBYTtJQUMxRSxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsTUFBTSxDQUFDO1NBQ2xDLEtBQUssQ0FBQyxJQUFJLENBQUM7U0FDWCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQztTQUNWLElBQUksRUFBRSxDQUFDO0FBQ1osQ0FBQztBQU5ELG9DQU1DO0FBRUQsa0NBQWtDO0FBQ2xDLFNBQWdCLFlBQVksQ0FBQyxPQUE2QixFQUFFLEdBQUcsTUFBYTtJQUMxRSxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBRWpELE9BQU8sU0FBUztRQUNkLG1DQUFtQztTQUNsQyxPQUFPLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQztRQUMzQiwwREFBMEQ7U0FDekQsT0FBTyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUFSRCxvQ0FRQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVGVtcGxhdGVUYWc8UiA9IHN0cmluZz4ge1xuICAvLyBBbnkgaXMgdGhlIG9ubHkgd2F5IGhlcmUuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgKHRlbXBsYXRlOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgLi4uc3Vic3RpdHV0aW9uczogYW55W10pOiBSO1xufVxuXG5cbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbmV4cG9ydCBmdW5jdGlvbiBvbmVMaW5lKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gIGNvbnN0IGVuZFJlc3VsdCA9IFN0cmluZy5yYXcoc3RyaW5ncywgLi4udmFsdWVzKTtcblxuICByZXR1cm4gZW5kUmVzdWx0LnJlcGxhY2UoLyg/Olxccj9cXG4oPzpcXHMqKSkrL2dtLCAnICcpLnRyaW0oKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZGVudEJ5KGluZGVudGF0aW9uczogbnVtYmVyKTogVGVtcGxhdGVUYWcge1xuICBsZXQgaSA9ICcnO1xuICB3aGlsZSAoaW5kZW50YXRpb25zLS0pIHtcbiAgICBpICs9ICcgJztcbiAgfVxuXG4gIHJldHVybiAoc3RyaW5ncywgLi4udmFsdWVzKSA9PiB7XG4gICAgcmV0dXJuIGkgKyBzdHJpcEluZGVudChzdHJpbmdzLCAuLi52YWx1ZXMpLnJlcGxhY2UoL1xcbi9nLCAnXFxuJyArIGkpO1xuICB9O1xufVxuXG5cbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbmV4cG9ydCBmdW5jdGlvbiBzdHJpcEluZGVudChzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICBjb25zdCBlbmRSZXN1bHQgPSBTdHJpbmcucmF3KHN0cmluZ3MsIC4uLnZhbHVlcyk7XG5cbiAgLy8gcmVtb3ZlIHRoZSBzaG9ydGVzdCBsZWFkaW5nIGluZGVudGF0aW9uIGZyb20gZWFjaCBsaW5lXG4gIGNvbnN0IG1hdGNoID0gZW5kUmVzdWx0Lm1hdGNoKC9eWyBcXHRdKig/PVxcUykvZ20pO1xuXG4gIC8vIHJldHVybiBlYXJseSBpZiB0aGVyZSdzIG5vdGhpbmcgdG8gc3RyaXBcbiAgaWYgKG1hdGNoID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGVuZFJlc3VsdDtcbiAgfVxuXG4gIGNvbnN0IGluZGVudCA9IE1hdGgubWluKC4uLm1hdGNoLm1hcChlbCA9PiBlbC5sZW5ndGgpKTtcbiAgY29uc3QgcmVnZXhwID0gbmV3IFJlZ0V4cCgnXlsgXFxcXHRdeycgKyBpbmRlbnQgKyAnfScsICdnbScpO1xuXG4gIHJldHVybiAoaW5kZW50ID4gMCA/IGVuZFJlc3VsdC5yZXBsYWNlKHJlZ2V4cCwgJycpIDogZW5kUmVzdWx0KS50cmltKCk7XG59XG5cblxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwSW5kZW50cyhzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgLi4udmFsdWVzOiBhbnlbXSkge1xuICByZXR1cm4gU3RyaW5nLnJhdyhzdHJpbmdzLCAuLi52YWx1ZXMpXG4gICAgLnNwbGl0KCdcXG4nKVxuICAgIC5tYXAobGluZSA9PiBsaW5lLnRyaW0oKSlcbiAgICAuam9pbignXFxuJylcbiAgICAudHJpbSgpO1xufVxuXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG5leHBvcnQgZnVuY3Rpb24gdHJpbU5ld2xpbmVzKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gIGNvbnN0IGVuZFJlc3VsdCA9IFN0cmluZy5yYXcoc3RyaW5ncywgLi4udmFsdWVzKTtcblxuICByZXR1cm4gZW5kUmVzdWx0XG4gICAgLy8gUmVtb3ZlIHRoZSBuZXdsaW5lIGF0IHRoZSBzdGFydC5cbiAgICAucmVwbGFjZSgvXig/Olxccj9cXG4pKy8sICcnKVxuICAgIC8vIFJlbW92ZSB0aGUgbmV3bGluZSBhdCB0aGUgZW5kIGFuZCBmb2xsb3dpbmcgd2hpdGVzcGFjZS5cbiAgICAucmVwbGFjZSgvKD86XFxyP1xcbig/OlxccyopKSQvLCAnJyk7XG59XG4iXX0=