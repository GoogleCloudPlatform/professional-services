/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isDevMode } from '../is_dev_mode';
/**
 * A pattern that recognizes a commonly useful subset of URLs that are safe.
 *
 * This regular expression matches a subset of URLs that will not cause script
 * execution if used in URL context within a HTML document. Specifically, this
 * regular expression matches if (comment from here on and regex copied from
 * Soy's EscapingConventions):
 * (1) Either a protocol in a whitelist (http, https, mailto or ftp).
 * (2) or no protocol.  A protocol must be followed by a colon. The below
 *     allows that by allowing colons only after one of the characters [/?#].
 *     A colon after a hash (#) must be in the fragment.
 *     Otherwise, a colon after a (?) must be in a query.
 *     Otherwise, a colon after a single solidus (/) must be in a path.
 *     Otherwise, a colon after a double solidus (//) must be in the authority
 *     (before port).
 *
 * The pattern disallows &, used in HTML entity declarations before
 * one of the characters in [/?#]. This disallows HTML entities used in the
 * protocol name, which should never happen, e.g. "h&#116;tp" for "http".
 * It also disallows HTML entities in the first path part of a relative path,
 * e.g. "foo&lt;bar/baz".  Our existing escaping functions should not produce
 * that. More importantly, it disallows masking of a colon,
 * e.g. "javascript&#58;...".
 *
 * This regular expression was taken from the Closure sanitization library.
 */
var SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file):|[^&:/?#]*(?:[/?#]|$))/gi;
/* A pattern that matches safe srcset values */
var SAFE_SRCSET_PATTERN = /^(?:(?:https?|file):|[^&:/?#]*(?:[/?#]|$))/gi;
/** A pattern that matches safe data URLs. Only matches image, video and audio types. */
var DATA_URL_PATTERN = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z0-9+\/]+=*$/i;
export function _sanitizeUrl(url) {
    url = String(url);
    if (url.match(SAFE_URL_PATTERN) || url.match(DATA_URL_PATTERN))
        return url;
    if (isDevMode()) {
        console.warn("WARNING: sanitizing unsafe URL value " + url + " (see http://g.co/ng/security#xss)");
    }
    return 'unsafe:' + url;
}
export function sanitizeSrcset(srcset) {
    srcset = String(srcset);
    return srcset.split(',').map(function (srcset) { return _sanitizeUrl(srcset.trim()); }).join(', ');
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsX3Nhbml0aXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3Nhbml0aXphdGlvbi91cmxfc2FuaXRpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUV6Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlCRztBQUNILElBQU0sZ0JBQWdCLEdBQUcsNkRBQTZELENBQUM7QUFFdkYsK0NBQStDO0FBQy9DLElBQU0sbUJBQW1CLEdBQUcsOENBQThDLENBQUM7QUFFM0Usd0ZBQXdGO0FBQ3hGLElBQU0sZ0JBQWdCLEdBQ2xCLHNJQUFzSSxDQUFDO0FBRTNJLE1BQU0sVUFBVSxZQUFZLENBQUMsR0FBVztJQUN0QyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xCLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUM7UUFBRSxPQUFPLEdBQUcsQ0FBQztJQUUzRSxJQUFJLFNBQVMsRUFBRSxFQUFFO1FBQ2YsT0FBTyxDQUFDLElBQUksQ0FBQywwQ0FBd0MsR0FBRyx1Q0FBb0MsQ0FBQyxDQUFDO0tBQy9GO0lBRUQsT0FBTyxTQUFTLEdBQUcsR0FBRyxDQUFDO0FBQ3pCLENBQUM7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLE1BQWM7SUFDM0MsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsTUFBTSxJQUFLLE9BQUEsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUEzQixDQUEyQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25GLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aXNEZXZNb2RlfSBmcm9tICcuLi9pc19kZXZfbW9kZSc7XG5cbi8qKlxuICogQSBwYXR0ZXJuIHRoYXQgcmVjb2duaXplcyBhIGNvbW1vbmx5IHVzZWZ1bCBzdWJzZXQgb2YgVVJMcyB0aGF0IGFyZSBzYWZlLlxuICpcbiAqIFRoaXMgcmVndWxhciBleHByZXNzaW9uIG1hdGNoZXMgYSBzdWJzZXQgb2YgVVJMcyB0aGF0IHdpbGwgbm90IGNhdXNlIHNjcmlwdFxuICogZXhlY3V0aW9uIGlmIHVzZWQgaW4gVVJMIGNvbnRleHQgd2l0aGluIGEgSFRNTCBkb2N1bWVudC4gU3BlY2lmaWNhbGx5LCB0aGlzXG4gKiByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hlcyBpZiAoY29tbWVudCBmcm9tIGhlcmUgb24gYW5kIHJlZ2V4IGNvcGllZCBmcm9tXG4gKiBTb3kncyBFc2NhcGluZ0NvbnZlbnRpb25zKTpcbiAqICgxKSBFaXRoZXIgYSBwcm90b2NvbCBpbiBhIHdoaXRlbGlzdCAoaHR0cCwgaHR0cHMsIG1haWx0byBvciBmdHApLlxuICogKDIpIG9yIG5vIHByb3RvY29sLiAgQSBwcm90b2NvbCBtdXN0IGJlIGZvbGxvd2VkIGJ5IGEgY29sb24uIFRoZSBiZWxvd1xuICogICAgIGFsbG93cyB0aGF0IGJ5IGFsbG93aW5nIGNvbG9ucyBvbmx5IGFmdGVyIG9uZSBvZiB0aGUgY2hhcmFjdGVycyBbLz8jXS5cbiAqICAgICBBIGNvbG9uIGFmdGVyIGEgaGFzaCAoIykgbXVzdCBiZSBpbiB0aGUgZnJhZ21lbnQuXG4gKiAgICAgT3RoZXJ3aXNlLCBhIGNvbG9uIGFmdGVyIGEgKD8pIG11c3QgYmUgaW4gYSBxdWVyeS5cbiAqICAgICBPdGhlcndpc2UsIGEgY29sb24gYWZ0ZXIgYSBzaW5nbGUgc29saWR1cyAoLykgbXVzdCBiZSBpbiBhIHBhdGguXG4gKiAgICAgT3RoZXJ3aXNlLCBhIGNvbG9uIGFmdGVyIGEgZG91YmxlIHNvbGlkdXMgKC8vKSBtdXN0IGJlIGluIHRoZSBhdXRob3JpdHlcbiAqICAgICAoYmVmb3JlIHBvcnQpLlxuICpcbiAqIFRoZSBwYXR0ZXJuIGRpc2FsbG93cyAmLCB1c2VkIGluIEhUTUwgZW50aXR5IGRlY2xhcmF0aW9ucyBiZWZvcmVcbiAqIG9uZSBvZiB0aGUgY2hhcmFjdGVycyBpbiBbLz8jXS4gVGhpcyBkaXNhbGxvd3MgSFRNTCBlbnRpdGllcyB1c2VkIGluIHRoZVxuICogcHJvdG9jb2wgbmFtZSwgd2hpY2ggc2hvdWxkIG5ldmVyIGhhcHBlbiwgZS5nLiBcImgmIzExNjt0cFwiIGZvciBcImh0dHBcIi5cbiAqIEl0IGFsc28gZGlzYWxsb3dzIEhUTUwgZW50aXRpZXMgaW4gdGhlIGZpcnN0IHBhdGggcGFydCBvZiBhIHJlbGF0aXZlIHBhdGgsXG4gKiBlLmcuIFwiZm9vJmx0O2Jhci9iYXpcIi4gIE91ciBleGlzdGluZyBlc2NhcGluZyBmdW5jdGlvbnMgc2hvdWxkIG5vdCBwcm9kdWNlXG4gKiB0aGF0LiBNb3JlIGltcG9ydGFudGx5LCBpdCBkaXNhbGxvd3MgbWFza2luZyBvZiBhIGNvbG9uLFxuICogZS5nLiBcImphdmFzY3JpcHQmIzU4Oy4uLlwiLlxuICpcbiAqIFRoaXMgcmVndWxhciBleHByZXNzaW9uIHdhcyB0YWtlbiBmcm9tIHRoZSBDbG9zdXJlIHNhbml0aXphdGlvbiBsaWJyYXJ5LlxuICovXG5jb25zdCBTQUZFX1VSTF9QQVRURVJOID0gL14oPzooPzpodHRwcz98bWFpbHRvfGZ0cHx0ZWx8ZmlsZSk6fFteJjovPyNdKig/OlsvPyNdfCQpKS9naTtcblxuLyogQSBwYXR0ZXJuIHRoYXQgbWF0Y2hlcyBzYWZlIHNyY3NldCB2YWx1ZXMgKi9cbmNvbnN0IFNBRkVfU1JDU0VUX1BBVFRFUk4gPSAvXig/Oig/Omh0dHBzP3xmaWxlKTp8W14mOi8/I10qKD86Wy8/I118JCkpL2dpO1xuXG4vKiogQSBwYXR0ZXJuIHRoYXQgbWF0Y2hlcyBzYWZlIGRhdGEgVVJMcy4gT25seSBtYXRjaGVzIGltYWdlLCB2aWRlbyBhbmQgYXVkaW8gdHlwZXMuICovXG5jb25zdCBEQVRBX1VSTF9QQVRURVJOID1cbiAgICAvXmRhdGE6KD86aW1hZ2VcXC8oPzpibXB8Z2lmfGpwZWd8anBnfHBuZ3x0aWZmfHdlYnApfHZpZGVvXFwvKD86bXBlZ3xtcDR8b2dnfHdlYm0pfGF1ZGlvXFwvKD86bXAzfG9nYXxvZ2d8b3B1cykpO2Jhc2U2NCxbYS16MC05K1xcL10rPSokL2k7XG5cbmV4cG9ydCBmdW5jdGlvbiBfc2FuaXRpemVVcmwodXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICB1cmwgPSBTdHJpbmcodXJsKTtcbiAgaWYgKHVybC5tYXRjaChTQUZFX1VSTF9QQVRURVJOKSB8fCB1cmwubWF0Y2goREFUQV9VUkxfUEFUVEVSTikpIHJldHVybiB1cmw7XG5cbiAgaWYgKGlzRGV2TW9kZSgpKSB7XG4gICAgY29uc29sZS53YXJuKGBXQVJOSU5HOiBzYW5pdGl6aW5nIHVuc2FmZSBVUkwgdmFsdWUgJHt1cmx9IChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKWApO1xuICB9XG5cbiAgcmV0dXJuICd1bnNhZmU6JyArIHVybDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplU3Jjc2V0KHNyY3NldDogc3RyaW5nKTogc3RyaW5nIHtcbiAgc3Jjc2V0ID0gU3RyaW5nKHNyY3NldCk7XG4gIHJldHVybiBzcmNzZXQuc3BsaXQoJywnKS5tYXAoKHNyY3NldCkgPT4gX3Nhbml0aXplVXJsKHNyY3NldC50cmltKCkpKS5qb2luKCcsICcpO1xufVxuIl19