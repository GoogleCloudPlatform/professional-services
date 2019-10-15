"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const exception_1 = require("../exception");
class InvalidPathException extends exception_1.BaseException {
    constructor(path) { super(`Path ${JSON.stringify(path)} is invalid.`); }
}
exports.InvalidPathException = InvalidPathException;
class PathMustBeAbsoluteException extends exception_1.BaseException {
    constructor(path) { super(`Path ${JSON.stringify(path)} must be absolute.`); }
}
exports.PathMustBeAbsoluteException = PathMustBeAbsoluteException;
class PathCannotBeFragmentException extends exception_1.BaseException {
    constructor(path) { super(`Path ${JSON.stringify(path)} cannot be made a fragment.`); }
}
exports.PathCannotBeFragmentException = PathCannotBeFragmentException;
/**
 * The Separator for normalized path.
 * @type {Path}
 */
exports.NormalizedSep = '/';
/**
 * The root of a normalized path.
 * @type {Path}
 */
exports.NormalizedRoot = exports.NormalizedSep;
/**
 * Split a path into multiple path fragments. Each fragments except the last one will end with
 * a path separator.
 * @param {Path} path The path to split.
 * @returns {Path[]} An array of path fragments.
 */
function split(path) {
    const fragments = path.split(exports.NormalizedSep).map(x => fragment(x));
    if (fragments[fragments.length - 1].length === 0) {
        fragments.pop();
    }
    return fragments;
}
exports.split = split;
/**
 *
 */
function extname(path) {
    const base = basename(path);
    const i = base.lastIndexOf('.');
    if (i < 1) {
        return '';
    }
    else {
        return base.substr(i);
    }
}
exports.extname = extname;
/**
 * Return the basename of the path, as a Path. See path.basename
 */
function basename(path) {
    const i = path.lastIndexOf(exports.NormalizedSep);
    if (i == -1) {
        return fragment(path);
    }
    else {
        return fragment(path.substr(path.lastIndexOf(exports.NormalizedSep) + 1));
    }
}
exports.basename = basename;
/**
 * Return the dirname of the path, as a Path. See path.dirname
 */
function dirname(path) {
    const index = path.lastIndexOf(exports.NormalizedSep);
    if (index === -1) {
        return '';
    }
    const endIndex = index === 0 ? 1 : index; // case of file under root: '/file'
    return normalize(path.substr(0, endIndex));
}
exports.dirname = dirname;
/**
 * Join multiple paths together, and normalize the result. Accepts strings that will be
 * normalized as well (but the original must be a path).
 */
function join(p1, ...others) {
    if (others.length > 0) {
        return normalize((p1 ? p1 + exports.NormalizedSep : '') + others.join(exports.NormalizedSep));
    }
    else {
        return p1;
    }
}
exports.join = join;
/**
 * Returns true if a path is absolute.
 */
function isAbsolute(p) {
    return p.startsWith(exports.NormalizedSep);
}
exports.isAbsolute = isAbsolute;
/**
 * Returns a path such that `join(from, relative(from, to)) == to`.
 * Both paths must be absolute, otherwise it does not make much sense.
 */
function relative(from, to) {
    if (!isAbsolute(from)) {
        throw new PathMustBeAbsoluteException(from);
    }
    if (!isAbsolute(to)) {
        throw new PathMustBeAbsoluteException(to);
    }
    let p;
    if (from == to) {
        p = '';
    }
    else {
        const splitFrom = from.split(exports.NormalizedSep);
        const splitTo = to.split(exports.NormalizedSep);
        while (splitFrom.length > 0 && splitTo.length > 0 && splitFrom[0] == splitTo[0]) {
            splitFrom.shift();
            splitTo.shift();
        }
        if (splitFrom.length == 0) {
            p = splitTo.join(exports.NormalizedSep);
        }
        else {
            p = splitFrom.map(_ => '..').concat(splitTo).join(exports.NormalizedSep);
        }
    }
    return normalize(p);
}
exports.relative = relative;
/**
 * Returns a Path that is the resolution of p2, from p1. If p2 is absolute, it will return p2,
 * otherwise will join both p1 and p2.
 */
function resolve(p1, p2) {
    if (isAbsolute(p2)) {
        return p2;
    }
    else {
        return join(p1, p2);
    }
}
exports.resolve = resolve;
function fragment(path) {
    if (path.indexOf(exports.NormalizedSep) != -1) {
        throw new PathCannotBeFragmentException(path);
    }
    return path;
}
exports.fragment = fragment;
/**
 * normalize() cache to reduce computation. For now this grows and we never flush it, but in the
 * future we might want to add a few cache flush to prevent this from growing too large.
 */
let normalizedCache = new Map();
/**
 * Reset the cache. This is only useful for testing.
 * @private
 */
function resetNormalizeCache() {
    normalizedCache = new Map();
}
exports.resetNormalizeCache = resetNormalizeCache;
/**
 * Normalize a string into a Path. This is the only mean to get a Path type from a string that
 * represents a system path. This method cache the results as real world paths tend to be
 * duplicated often.
 * Normalization includes:
 *   - Windows backslashes `\\` are replaced with `/`.
 *   - Windows drivers are replaced with `/X/`, where X is the drive letter.
 *   - Absolute paths starts with `/`.
 *   - Multiple `/` are replaced by a single one.
 *   - Path segments `.` are removed.
 *   - Path segments `..` are resolved.
 *   - If a path is absolute, having a `..` at the start is invalid (and will throw).
 * @param path The path to be normalized.
 */
function normalize(path) {
    let maybePath = normalizedCache.get(path);
    if (!maybePath) {
        maybePath = noCacheNormalize(path);
        normalizedCache.set(path, maybePath);
    }
    return maybePath;
}
exports.normalize = normalize;
/**
 * The no cache version of the normalize() function. Used for benchmarking and testing.
 */
function noCacheNormalize(path) {
    if (path == '' || path == '.') {
        return '';
    }
    else if (path == exports.NormalizedRoot) {
        return exports.NormalizedRoot;
    }
    // Match absolute windows path.
    const original = path;
    if (path.match(/^[A-Z]:[\/\\]/i)) {
        path = '\\' + path[0] + '\\' + path.substr(3);
    }
    // We convert Windows paths as well here.
    const p = path.split(/[\/\\]/g);
    let relative = false;
    let i = 1;
    // Special case the first one.
    if (p[0] != '') {
        p.unshift('.');
        relative = true;
    }
    while (i < p.length) {
        if (p[i] == '.') {
            p.splice(i, 1);
        }
        else if (p[i] == '..') {
            if (i < 2 && !relative) {
                throw new InvalidPathException(original);
            }
            else if (i >= 2 && p[i - 1] != '..') {
                p.splice(i - 1, 2);
                i--;
            }
            else {
                i++;
            }
        }
        else if (p[i] == '') {
            p.splice(i, 1);
        }
        else {
            i++;
        }
    }
    if (p.length == 1) {
        return p[0] == '' ? exports.NormalizedSep : '';
    }
    else {
        if (p[0] == '.') {
            p.shift();
        }
        return p.join(exports.NormalizedSep);
    }
}
exports.noCacheNormalize = noCacheNormalize;
exports.path = (strings, ...values) => {
    return normalize(String.raw(strings, ...values));
};
function asWindowsPath(path) {
    const drive = path.match(/^\/(\w)(?:\/(.*))?$/);
    if (drive) {
        const subPath = drive[2] ? drive[2].replace(/\//g, '\\') : '';
        return `${drive[1]}:\\${subPath}`;
    }
    return path.replace(/\//g, '\\');
}
exports.asWindowsPath = asWindowsPath;
function asPosixPath(path) {
    return path;
}
exports.asPosixPath = asPosixPath;
function getSystemPath(path) {
    if (process.platform.startsWith('win32')) {
        return asWindowsPath(path);
    }
    else {
        return asPosixPath(path);
    }
}
exports.getSystemPath = getSystemPath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvdmlydHVhbC1mcy9wYXRoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsNENBQTZDO0FBSTdDLE1BQWEsb0JBQXFCLFNBQVEseUJBQWE7SUFDckQsWUFBWSxJQUFZLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2pGO0FBRkQsb0RBRUM7QUFDRCxNQUFhLDJCQUE0QixTQUFRLHlCQUFhO0lBQzVELFlBQVksSUFBWSxJQUFJLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3ZGO0FBRkQsa0VBRUM7QUFDRCxNQUFhLDZCQUE4QixTQUFRLHlCQUFhO0lBQzlELFlBQVksSUFBWSxJQUFJLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2hHO0FBRkQsc0VBRUM7QUFrQkQ7OztHQUdHO0FBQ1UsUUFBQSxhQUFhLEdBQUcsR0FBVyxDQUFDO0FBR3pDOzs7R0FHRztBQUNVLFFBQUEsY0FBYyxHQUFHLHFCQUFxQixDQUFDO0FBR3BEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsS0FBSyxDQUFDLElBQVU7SUFDOUIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxxQkFBYSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEUsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFF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c0NBTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uIH0gZnJvbSAnLi4vZXhjZXB0aW9uJztcbmltcG9ydCB7IFRlbXBsYXRlVGFnIH0gZnJvbSAnLi4vdXRpbHMvbGl0ZXJhbHMnO1xuXG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkUGF0aEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcpIHsgc3VwZXIoYFBhdGggJHtKU09OLnN0cmluZ2lmeShwYXRoKX0gaXMgaW52YWxpZC5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIFBhdGhNdXN0QmVBYnNvbHV0ZUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcpIHsgc3VwZXIoYFBhdGggJHtKU09OLnN0cmluZ2lmeShwYXRoKX0gbXVzdCBiZSBhYnNvbHV0ZS5gKTsgfVxufVxuZXhwb3J0IGNsYXNzIFBhdGhDYW5ub3RCZUZyYWdtZW50RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZykgeyBzdXBlcihgUGF0aCAke0pTT04uc3RyaW5naWZ5KHBhdGgpfSBjYW5ub3QgYmUgbWFkZSBhIGZyYWdtZW50LmApOyB9XG59XG5cblxuLyoqXG4gKiBBIFBhdGggcmVjb2duaXplZCBieSBtb3N0IG1ldGhvZHMgaW4gdGhlIERldktpdC5cbiAqL1xuZXhwb3J0IHR5cGUgUGF0aCA9IHN0cmluZyAmIHtcbiAgX19QUklWQVRFX0RFVktJVF9QQVRIOiB2b2lkO1xufTtcblxuLyoqXG4gKiBBIFBhdGggZnJhZ21lbnQgKGZpbGUgb3IgZGlyZWN0b3J5IG5hbWUpIHJlY29nbml6ZWQgYnkgbW9zdCBtZXRob2RzIGluIHRoZSBEZXZLaXQuXG4gKi9cbmV4cG9ydCB0eXBlIFBhdGhGcmFnbWVudCA9IFBhdGggJiB7XG4gIF9fUFJJVkFURV9ERVZLSVRfUEFUSF9GUkFHTUVOVDogdm9pZDtcbn07XG5cblxuLyoqXG4gKiBUaGUgU2VwYXJhdG9yIGZvciBub3JtYWxpemVkIHBhdGguXG4gKiBAdHlwZSB7UGF0aH1cbiAqL1xuZXhwb3J0IGNvbnN0IE5vcm1hbGl6ZWRTZXAgPSAnLycgYXMgUGF0aDtcblxuXG4vKipcbiAqIFRoZSByb290IG9mIGEgbm9ybWFsaXplZCBwYXRoLlxuICogQHR5cGUge1BhdGh9XG4gKi9cbmV4cG9ydCBjb25zdCBOb3JtYWxpemVkUm9vdCA9IE5vcm1hbGl6ZWRTZXAgYXMgUGF0aDtcblxuXG4vKipcbiAqIFNwbGl0IGEgcGF0aCBpbnRvIG11bHRpcGxlIHBhdGggZnJhZ21lbnRzLiBFYWNoIGZyYWdtZW50cyBleGNlcHQgdGhlIGxhc3Qgb25lIHdpbGwgZW5kIHdpdGhcbiAqIGEgcGF0aCBzZXBhcmF0b3IuXG4gKiBAcGFyYW0ge1BhdGh9IHBhdGggVGhlIHBhdGggdG8gc3BsaXQuXG4gKiBAcmV0dXJucyB7UGF0aFtdfSBBbiBhcnJheSBvZiBwYXRoIGZyYWdtZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0KHBhdGg6IFBhdGgpOiBQYXRoRnJhZ21lbnRbXSB7XG4gIGNvbnN0IGZyYWdtZW50cyA9IHBhdGguc3BsaXQoTm9ybWFsaXplZFNlcCkubWFwKHggPT4gZnJhZ21lbnQoeCkpO1xuICBpZiAoZnJhZ21lbnRzW2ZyYWdtZW50cy5sZW5ndGggLSAxXS5sZW5ndGggPT09IDApIHtcbiAgICBmcmFnbWVudHMucG9wKCk7XG4gIH1cblxuICByZXR1cm4gZnJhZ21lbnRzO1xufVxuXG4vKipcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRuYW1lKHBhdGg6IFBhdGgpOiBzdHJpbmcge1xuICBjb25zdCBiYXNlID0gYmFzZW5hbWUocGF0aCk7XG4gIGNvbnN0IGkgPSBiYXNlLmxhc3RJbmRleE9mKCcuJyk7XG4gIGlmIChpIDwgMSkge1xuICAgIHJldHVybiAnJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZS5zdWJzdHIoaSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFJldHVybiB0aGUgYmFzZW5hbWUgb2YgdGhlIHBhdGgsIGFzIGEgUGF0aC4gU2VlIHBhdGguYmFzZW5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhc2VuYW1lKHBhdGg6IFBhdGgpOiBQYXRoRnJhZ21lbnQge1xuICBjb25zdCBpID0gcGF0aC5sYXN0SW5kZXhPZihOb3JtYWxpemVkU2VwKTtcbiAgaWYgKGkgPT0gLTEpIHtcbiAgICByZXR1cm4gZnJhZ21lbnQocGF0aCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZyYWdtZW50KHBhdGguc3Vic3RyKHBhdGgubGFzdEluZGV4T2YoTm9ybWFsaXplZFNlcCkgKyAxKSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFJldHVybiB0aGUgZGlybmFtZSBvZiB0aGUgcGF0aCwgYXMgYSBQYXRoLiBTZWUgcGF0aC5kaXJuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJuYW1lKHBhdGg6IFBhdGgpOiBQYXRoIHtcbiAgY29uc3QgaW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKE5vcm1hbGl6ZWRTZXApO1xuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgcmV0dXJuICcnIGFzIFBhdGg7XG4gIH1cblxuICBjb25zdCBlbmRJbmRleCA9IGluZGV4ID09PSAwID8gMSA6IGluZGV4OyAvLyBjYXNlIG9mIGZpbGUgdW5kZXIgcm9vdDogJy9maWxlJ1xuXG4gIHJldHVybiBub3JtYWxpemUocGF0aC5zdWJzdHIoMCwgZW5kSW5kZXgpKTtcbn1cblxuXG4vKipcbiAqIEpvaW4gbXVsdGlwbGUgcGF0aHMgdG9nZXRoZXIsIGFuZCBub3JtYWxpemUgdGhlIHJlc3VsdC4gQWNjZXB0cyBzdHJpbmdzIHRoYXQgd2lsbCBiZVxuICogbm9ybWFsaXplZCBhcyB3ZWxsIChidXQgdGhlIG9yaWdpbmFsIG11c3QgYmUgYSBwYXRoKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW4ocDE6IFBhdGgsIC4uLm90aGVyczogc3RyaW5nW10pOiBQYXRoIHtcbiAgaWYgKG90aGVycy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZSgocDEgPyBwMSArIE5vcm1hbGl6ZWRTZXAgOiAnJykgKyBvdGhlcnMuam9pbihOb3JtYWxpemVkU2VwKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHAxO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgYSBwYXRoIGlzIGFic29sdXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNBYnNvbHV0ZShwOiBQYXRoKSB7XG4gIHJldHVybiBwLnN0YXJ0c1dpdGgoTm9ybWFsaXplZFNlcCk7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgcGF0aCBzdWNoIHRoYXQgYGpvaW4oZnJvbSwgcmVsYXRpdmUoZnJvbSwgdG8pKSA9PSB0b2AuXG4gKiBCb3RoIHBhdGhzIG11c3QgYmUgYWJzb2x1dGUsIG90aGVyd2lzZSBpdCBkb2VzIG5vdCBtYWtlIG11Y2ggc2Vuc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWxhdGl2ZShmcm9tOiBQYXRoLCB0bzogUGF0aCk6IFBhdGgge1xuICBpZiAoIWlzQWJzb2x1dGUoZnJvbSkpIHtcbiAgICB0aHJvdyBuZXcgUGF0aE11c3RCZUFic29sdXRlRXhjZXB0aW9uKGZyb20pO1xuICB9XG4gIGlmICghaXNBYnNvbHV0ZSh0bykpIHtcbiAgICB0aHJvdyBuZXcgUGF0aE11c3RCZUFic29sdXRlRXhjZXB0aW9uKHRvKTtcbiAgfVxuXG4gIGxldCBwOiBzdHJpbmc7XG5cbiAgaWYgKGZyb20gPT0gdG8pIHtcbiAgICBwID0gJyc7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgc3BsaXRGcm9tID0gZnJvbS5zcGxpdChOb3JtYWxpemVkU2VwKTtcbiAgICBjb25zdCBzcGxpdFRvID0gdG8uc3BsaXQoTm9ybWFsaXplZFNlcCk7XG5cbiAgICB3aGlsZSAoc3BsaXRGcm9tLmxlbmd0aCA+IDAgJiYgc3BsaXRUby5sZW5ndGggPiAwICYmIHNwbGl0RnJvbVswXSA9PSBzcGxpdFRvWzBdKSB7XG4gICAgICBzcGxpdEZyb20uc2hpZnQoKTtcbiAgICAgIHNwbGl0VG8uc2hpZnQoKTtcbiAgICB9XG5cbiAgICBpZiAoc3BsaXRGcm9tLmxlbmd0aCA9PSAwKSB7XG4gICAgICBwID0gc3BsaXRUby5qb2luKE5vcm1hbGl6ZWRTZXApO1xuICAgIH0gZWxzZSB7XG4gICAgICBwID0gc3BsaXRGcm9tLm1hcChfID0+ICcuLicpLmNvbmNhdChzcGxpdFRvKS5qb2luKE5vcm1hbGl6ZWRTZXApO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBub3JtYWxpemUocCk7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgUGF0aCB0aGF0IGlzIHRoZSByZXNvbHV0aW9uIG9mIHAyLCBmcm9tIHAxLiBJZiBwMiBpcyBhYnNvbHV0ZSwgaXQgd2lsbCByZXR1cm4gcDIsXG4gKiBvdGhlcndpc2Ugd2lsbCBqb2luIGJvdGggcDEgYW5kIHAyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZShwMTogUGF0aCwgcDI6IFBhdGgpIHtcbiAgaWYgKGlzQWJzb2x1dGUocDIpKSB7XG4gICAgcmV0dXJuIHAyO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBqb2luKHAxLCBwMik7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZnJhZ21lbnQocGF0aDogc3RyaW5nKTogUGF0aEZyYWdtZW50IHtcbiAgaWYgKHBhdGguaW5kZXhPZihOb3JtYWxpemVkU2VwKSAhPSAtMSkge1xuICAgIHRocm93IG5ldyBQYXRoQ2Fubm90QmVGcmFnbWVudEV4Y2VwdGlvbihwYXRoKTtcbiAgfVxuXG4gIHJldHVybiBwYXRoIGFzIFBhdGhGcmFnbWVudDtcbn1cblxuXG4vKipcbiAqIG5vcm1hbGl6ZSgpIGNhY2hlIHRvIHJlZHVjZSBjb21wdXRhdGlvbi4gRm9yIG5vdyB0aGlzIGdyb3dzIGFuZCB3ZSBuZXZlciBmbHVzaCBpdCwgYnV0IGluIHRoZVxuICogZnV0dXJlIHdlIG1pZ2h0IHdhbnQgdG8gYWRkIGEgZmV3IGNhY2hlIGZsdXNoIHRvIHByZXZlbnQgdGhpcyBmcm9tIGdyb3dpbmcgdG9vIGxhcmdlLlxuICovXG5sZXQgbm9ybWFsaXplZENhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFBhdGg+KCk7XG5cblxuLyoqXG4gKiBSZXNldCB0aGUgY2FjaGUuIFRoaXMgaXMgb25seSB1c2VmdWwgZm9yIHRlc3RpbmcuXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXROb3JtYWxpemVDYWNoZSgpIHtcbiAgbm9ybWFsaXplZENhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFBhdGg+KCk7XG59XG5cblxuLyoqXG4gKiBOb3JtYWxpemUgYSBzdHJpbmcgaW50byBhIFBhdGguIFRoaXMgaXMgdGhlIG9ubHkgbWVhbiB0byBnZXQgYSBQYXRoIHR5cGUgZnJvbSBhIHN0cmluZyB0aGF0XG4gKiByZXByZXNlbnRzIGEgc3lzdGVtIHBhdGguIFRoaXMgbWV0aG9kIGNhY2hlIHRoZSByZXN1bHRzIGFzIHJlYWwgd29ybGQgcGF0aHMgdGVuZCB0byBiZVxuICogZHVwbGljYXRlZCBvZnRlbi5cbiAqIE5vcm1hbGl6YXRpb24gaW5jbHVkZXM6XG4gKiAgIC0gV2luZG93cyBiYWNrc2xhc2hlcyBgXFxcXGAgYXJlIHJlcGxhY2VkIHdpdGggYC9gLlxuICogICAtIFdpbmRvd3MgZHJpdmVycyBhcmUgcmVwbGFjZWQgd2l0aCBgL1gvYCwgd2hlcmUgWCBpcyB0aGUgZHJpdmUgbGV0dGVyLlxuICogICAtIEFic29sdXRlIHBhdGhzIHN0YXJ0cyB3aXRoIGAvYC5cbiAqICAgLSBNdWx0aXBsZSBgL2AgYXJlIHJlcGxhY2VkIGJ5IGEgc2luZ2xlIG9uZS5cbiAqICAgLSBQYXRoIHNlZ21lbnRzIGAuYCBhcmUgcmVtb3ZlZC5cbiAqICAgLSBQYXRoIHNlZ21lbnRzIGAuLmAgYXJlIHJlc29sdmVkLlxuICogICAtIElmIGEgcGF0aCBpcyBhYnNvbHV0ZSwgaGF2aW5nIGEgYC4uYCBhdCB0aGUgc3RhcnQgaXMgaW52YWxpZCAoYW5kIHdpbGwgdGhyb3cpLlxuICogQHBhcmFtIHBhdGggVGhlIHBhdGggdG8gYmUgbm9ybWFsaXplZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZShwYXRoOiBzdHJpbmcpOiBQYXRoIHtcbiAgbGV0IG1heWJlUGF0aCA9IG5vcm1hbGl6ZWRDYWNoZS5nZXQocGF0aCk7XG4gIGlmICghbWF5YmVQYXRoKSB7XG4gICAgbWF5YmVQYXRoID0gbm9DYWNoZU5vcm1hbGl6ZShwYXRoKTtcbiAgICBub3JtYWxpemVkQ2FjaGUuc2V0KHBhdGgsIG1heWJlUGF0aCk7XG4gIH1cblxuICByZXR1cm4gbWF5YmVQYXRoO1xufVxuXG5cbi8qKlxuICogVGhlIG5vIGNhY2hlIHZlcnNpb24gb2YgdGhlIG5vcm1hbGl6ZSgpIGZ1bmN0aW9uLiBVc2VkIGZvciBiZW5jaG1hcmtpbmcgYW5kIHRlc3RpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub0NhY2hlTm9ybWFsaXplKHBhdGg6IHN0cmluZyk6IFBhdGgge1xuICBpZiAocGF0aCA9PSAnJyB8fCBwYXRoID09ICcuJykge1xuICAgIHJldHVybiAnJyBhcyBQYXRoO1xuICB9IGVsc2UgaWYgKHBhdGggPT0gTm9ybWFsaXplZFJvb3QpIHtcbiAgICByZXR1cm4gTm9ybWFsaXplZFJvb3Q7XG4gIH1cblxuICAvLyBNYXRjaCBhYnNvbHV0ZSB3aW5kb3dzIHBhdGguXG4gIGNvbnN0IG9yaWdpbmFsID0gcGF0aDtcbiAgaWYgKHBhdGgubWF0Y2goL15bQS1aXTpbXFwvXFxcXF0vaSkpIHtcbiAgICBwYXRoID0gJ1xcXFwnICsgcGF0aFswXSArICdcXFxcJyArIHBhdGguc3Vic3RyKDMpO1xuICB9XG5cbiAgLy8gV2UgY29udmVydCBXaW5kb3dzIHBhdGhzIGFzIHdlbGwgaGVyZS5cbiAgY29uc3QgcCA9IHBhdGguc3BsaXQoL1tcXC9cXFxcXS9nKTtcbiAgbGV0IHJlbGF0aXZlID0gZmFsc2U7XG4gIGxldCBpID0gMTtcblxuICAvLyBTcGVjaWFsIGNhc2UgdGhlIGZpcnN0IG9uZS5cbiAgaWYgKHBbMF0gIT0gJycpIHtcbiAgICBwLnVuc2hpZnQoJy4nKTtcbiAgICByZWxhdGl2ZSA9IHRydWU7XG4gIH1cblxuICB3aGlsZSAoaSA8IHAubGVuZ3RoKSB7XG4gICAgaWYgKHBbaV0gPT0gJy4nKSB7XG4gICAgICBwLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKHBbaV0gPT0gJy4uJykge1xuICAgICAgaWYgKGkgPCAyICYmICFyZWxhdGl2ZSkge1xuICAgICAgICB0aHJvdyBuZXcgSW52YWxpZFBhdGhFeGNlcHRpb24ob3JpZ2luYWwpO1xuICAgICAgfSBlbHNlIGlmIChpID49IDIgJiYgcFtpIC0gMV0gIT0gJy4uJykge1xuICAgICAgICBwLnNwbGljZShpIC0gMSwgMik7XG4gICAgICAgIGktLTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHBbaV0gPT0gJycpIHtcbiAgICAgIHAuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgaWYgKHAubGVuZ3RoID09IDEpIHtcbiAgICByZXR1cm4gcFswXSA9PSAnJyA/IE5vcm1hbGl6ZWRTZXAgOiAnJyBhcyBQYXRoO1xuICB9IGVsc2Uge1xuICAgIGlmIChwWzBdID09ICcuJykge1xuICAgICAgcC5zaGlmdCgpO1xuICAgIH1cblxuICAgIHJldHVybiBwLmpvaW4oTm9ybWFsaXplZFNlcCkgYXMgUGF0aDtcbiAgfVxufVxuXG5cbmV4cG9ydCBjb25zdCBwYXRoOiBUZW1wbGF0ZVRhZzxQYXRoPiA9IChzdHJpbmdzLCAuLi52YWx1ZXMpID0+IHtcbiAgcmV0dXJuIG5vcm1hbGl6ZShTdHJpbmcucmF3KHN0cmluZ3MsIC4uLnZhbHVlcykpO1xufTtcblxuXG4vLyBQbGF0Zm9ybS1zcGVjaWZpYyBwYXRocy5cbmV4cG9ydCB0eXBlIFdpbmRvd3NQYXRoID0gc3RyaW5nICYge1xuICBfX1BSSVZBVEVfREVWS0lUX1dJTkRPV1NfUEFUSDogdm9pZDtcbn07XG5leHBvcnQgdHlwZSBQb3NpeFBhdGggPSBzdHJpbmcgJiB7XG4gIF9fUFJJVkFURV9ERVZLSVRfUE9TSVhfUEFUSDogdm9pZDtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBhc1dpbmRvd3NQYXRoKHBhdGg6IFBhdGgpOiBXaW5kb3dzUGF0aCB7XG4gIGNvbnN0IGRyaXZlID0gcGF0aC5tYXRjaCgvXlxcLyhcXHcpKD86XFwvKC4qKSk/JC8pO1xuICBpZiAoZHJpdmUpIHtcbiAgICBjb25zdCBzdWJQYXRoID0gZHJpdmVbMl0gPyBkcml2ZVsyXS5yZXBsYWNlKC9cXC8vZywgJ1xcXFwnKSA6ICcnO1xuXG4gICAgcmV0dXJuIGAke2RyaXZlWzFdfTpcXFxcJHtzdWJQYXRofWAgYXMgV2luZG93c1BhdGg7XG4gIH1cblxuICByZXR1cm4gcGF0aC5yZXBsYWNlKC9cXC8vZywgJ1xcXFwnKSBhcyBXaW5kb3dzUGF0aDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzUG9zaXhQYXRoKHBhdGg6IFBhdGgpOiBQb3NpeFBhdGgge1xuICByZXR1cm4gcGF0aCBhcyBzdHJpbmcgYXMgUG9zaXhQYXRoO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3lzdGVtUGF0aChwYXRoOiBQYXRoKTogc3RyaW5nIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0uc3RhcnRzV2l0aCgnd2luMzInKSkge1xuICAgIHJldHVybiBhc1dpbmRvd3NQYXRoKHBhdGgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBhc1Bvc2l4UGF0aChwYXRoKTtcbiAgfVxufVxuIl19