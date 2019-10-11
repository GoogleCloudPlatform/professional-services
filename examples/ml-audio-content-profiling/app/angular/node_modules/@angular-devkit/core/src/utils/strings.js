"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const STRING_DASHERIZE_REGEXP = (/[ _]/g);
const STRING_DECAMELIZE_REGEXP = (/([a-z\d])([A-Z])/g);
const STRING_CAMELIZE_REGEXP = (/(-|_|\.|\s)+(.)?/g);
const STRING_UNDERSCORE_REGEXP_1 = (/([a-z\d])([A-Z]+)/g);
const STRING_UNDERSCORE_REGEXP_2 = (/-|\s+/g);
/**
 * Converts a camelized string into all lower case separated by underscores.
 *
 ```javascript
 decamelize('innerHTML');         // 'inner_html'
 decamelize('action_name');       // 'action_name'
 decamelize('css-class-name');    // 'css-class-name'
 decamelize('my favorite items'); // 'my favorite items'
 ```

 @method decamelize
 @param {String} str The string to decamelize.
 @return {String} the decamelized string.
 */
function decamelize(str) {
    return str.replace(STRING_DECAMELIZE_REGEXP, '$1_$2').toLowerCase();
}
exports.decamelize = decamelize;
/**
 Replaces underscores, spaces, or camelCase with dashes.

 ```javascript
 dasherize('innerHTML');         // 'inner-html'
 dasherize('action_name');       // 'action-name'
 dasherize('css-class-name');    // 'css-class-name'
 dasherize('my favorite items'); // 'my-favorite-items'
 ```

 @method dasherize
 @param {String} str The string to dasherize.
 @return {String} the dasherized string.
 */
function dasherize(str) {
    return decamelize(str).replace(STRING_DASHERIZE_REGEXP, '-');
}
exports.dasherize = dasherize;
/**
 Returns the lowerCamelCase form of a string.

 ```javascript
 camelize('innerHTML');          // 'innerHTML'
 camelize('action_name');        // 'actionName'
 camelize('css-class-name');     // 'cssClassName'
 camelize('my favorite items');  // 'myFavoriteItems'
 camelize('My Favorite Items');  // 'myFavoriteItems'
 ```

 @method camelize
 @param {String} str The string to camelize.
 @return {String} the camelized string.
 */
function camelize(str) {
    return str
        .replace(STRING_CAMELIZE_REGEXP, (_match, _separator, chr) => {
        return chr ? chr.toUpperCase() : '';
    })
        .replace(/^([A-Z])/, (match) => match.toLowerCase());
}
exports.camelize = camelize;
/**
 Returns the UpperCamelCase form of a string.

 ```javascript
 'innerHTML'.classify();          // 'InnerHTML'
 'action_name'.classify();        // 'ActionName'
 'css-class-name'.classify();     // 'CssClassName'
 'my favorite items'.classify();  // 'MyFavoriteItems'
 ```

 @method classify
 @param {String} str the string to classify
 @return {String} the classified string
 */
function classify(str) {
    return str.split('.').map(part => capitalize(camelize(part))).join('.');
}
exports.classify = classify;
/**
 More general than decamelize. Returns the lower\_case\_and\_underscored
 form of a string.

 ```javascript
 'innerHTML'.underscore();          // 'inner_html'
 'action_name'.underscore();        // 'action_name'
 'css-class-name'.underscore();     // 'css_class_name'
 'my favorite items'.underscore();  // 'my_favorite_items'
 ```

 @method underscore
 @param {String} str The string to underscore.
 @return {String} the underscored string.
 */
function underscore(str) {
    return str
        .replace(STRING_UNDERSCORE_REGEXP_1, '$1_$2')
        .replace(STRING_UNDERSCORE_REGEXP_2, '_')
        .toLowerCase();
}
exports.underscore = underscore;
/**
 Returns the Capitalized form of a string

 ```javascript
 'innerHTML'.capitalize()         // 'InnerHTML'
 'action_name'.capitalize()       // 'Action_name'
 'css-class-name'.capitalize()    // 'Css-class-name'
 'my favorite items'.capitalize() // 'My favorite items'
 ```

 @method capitalize
 @param {String} str The string to capitalize.
 @return {String} The capitalized string.
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.substr(1);
}
exports.capitalize = capitalize;
/**
 * Calculate the levenshtein distance of two strings.
 * See https://en.wikipedia.org/wiki/Levenshtein_distance.
 * Based off https://gist.github.com/andrei-m/982927 (for using the faster dynamic programming
 * version).
 *
 * @param a String a.
 * @param b String b.
 * @returns A number that represents the distance between the two strings. The greater the number
 *   the more distant the strings are from each others.
 */
function levenshtein(a, b) {
    if (a.length == 0) {
        return b.length;
    }
    if (b.length == 0) {
        return a.length;
    }
    const matrix = [];
    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}
exports.levenshtein = levenshtein;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5ncy5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvdXRpbHMvc3RyaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7R0FNRztBQUNILE1BQU0sdUJBQXVCLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMxQyxNQUFNLHdCQUF3QixHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUN2RCxNQUFNLHNCQUFzQixHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNyRCxNQUFNLDBCQUEwQixHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUMxRCxNQUFNLDBCQUEwQixHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFOUM7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILFNBQWdCLFVBQVUsQ0FBQyxHQUFXO0lBQ3BDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN0RSxDQUFDO0FBRkQsZ0NBRUM7QUFFRDs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsU0FBZ0IsU0FBUyxDQUFDLEdBQVc7SUFDbkMsT0FBTyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLHVCQUF1QixFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQy9ELENBQUM7QUFGRCw4QkFFQztBQUVEOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBQ0gsU0FBZ0IsUUFBUSxDQUFDLEdBQVc7SUFDbEMsT0FBTyxHQUFHO1NBQ1AsT0FBTyxDQUFDLHNCQUFzQixFQUFFLENBQUMsTUFBYyxFQUFFLFVBQWtCLEVBQUUsR0FBVyxFQUFFLEVBQUU7UUFDbkYsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ3RDLENBQUMsQ0FBQztTQUNELE9BQU8sQ0FB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QUUsWUFBWTtnQkFDbEMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQ3JCLENBQUM7YUFDSDtTQUNGO0tBQ0Y7SUFFRCxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BDLENBQUM7QUFwQ0Qsa0NBb0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuY29uc3QgU1RSSU5HX0RBU0hFUklaRV9SRUdFWFAgPSAoL1sgX10vZyk7XG5jb25zdCBTVFJJTkdfREVDQU1FTElaRV9SRUdFWFAgPSAoLyhbYS16XFxkXSkoW0EtWl0pL2cpO1xuY29uc3QgU1RSSU5HX0NBTUVMSVpFX1JFR0VYUCA9ICgvKC18X3xcXC58XFxzKSsoLik/L2cpO1xuY29uc3QgU1RSSU5HX1VOREVSU0NPUkVfUkVHRVhQXzEgPSAoLyhbYS16XFxkXSkoW0EtWl0rKS9nKTtcbmNvbnN0IFNUUklOR19VTkRFUlNDT1JFX1JFR0VYUF8yID0gKC8tfFxccysvZyk7XG5cbi8qKlxuICogQ29udmVydHMgYSBjYW1lbGl6ZWQgc3RyaW5nIGludG8gYWxsIGxvd2VyIGNhc2Ugc2VwYXJhdGVkIGJ5IHVuZGVyc2NvcmVzLlxuICpcbiBgYGBqYXZhc2NyaXB0XG4gZGVjYW1lbGl6ZSgnaW5uZXJIVE1MJyk7ICAgICAgICAgLy8gJ2lubmVyX2h0bWwnXG4gZGVjYW1lbGl6ZSgnYWN0aW9uX25hbWUnKTsgICAgICAgLy8gJ2FjdGlvbl9uYW1lJ1xuIGRlY2FtZWxpemUoJ2Nzcy1jbGFzcy1uYW1lJyk7ICAgIC8vICdjc3MtY2xhc3MtbmFtZSdcbiBkZWNhbWVsaXplKCdteSBmYXZvcml0ZSBpdGVtcycpOyAvLyAnbXkgZmF2b3JpdGUgaXRlbXMnXG4gYGBgXG5cbiBAbWV0aG9kIGRlY2FtZWxpemVcbiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gZGVjYW1lbGl6ZS5cbiBAcmV0dXJuIHtTdHJpbmd9IHRoZSBkZWNhbWVsaXplZCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNhbWVsaXplKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKFNUUklOR19ERUNBTUVMSVpFX1JFR0VYUCwgJyQxXyQyJykudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gUmVwbGFjZXMgdW5kZXJzY29yZXMsIHNwYWNlcywgb3IgY2FtZWxDYXNlIHdpdGggZGFzaGVzLlxuXG4gYGBgamF2YXNjcmlwdFxuIGRhc2hlcml6ZSgnaW5uZXJIVE1MJyk7ICAgICAgICAgLy8gJ2lubmVyLWh0bWwnXG4gZGFzaGVyaXplKCdhY3Rpb25fbmFtZScpOyAgICAgICAvLyAnYWN0aW9uLW5hbWUnXG4gZGFzaGVyaXplKCdjc3MtY2xhc3MtbmFtZScpOyAgICAvLyAnY3NzLWNsYXNzLW5hbWUnXG4gZGFzaGVyaXplKCdteSBmYXZvcml0ZSBpdGVtcycpOyAvLyAnbXktZmF2b3JpdGUtaXRlbXMnXG4gYGBgXG5cbiBAbWV0aG9kIGRhc2hlcml6ZVxuIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byBkYXNoZXJpemUuXG4gQHJldHVybiB7U3RyaW5nfSB0aGUgZGFzaGVyaXplZCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkYXNoZXJpemUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZGVjYW1lbGl6ZShzdHIpLnJlcGxhY2UoU1RSSU5HX0RBU0hFUklaRV9SRUdFWFAsICctJyk7XG59XG5cbi8qKlxuIFJldHVybnMgdGhlIGxvd2VyQ2FtZWxDYXNlIGZvcm0gb2YgYSBzdHJpbmcuXG5cbiBgYGBqYXZhc2NyaXB0XG4gY2FtZWxpemUoJ2lubmVySFRNTCcpOyAgICAgICAgICAvLyAnaW5uZXJIVE1MJ1xuIGNhbWVsaXplKCdhY3Rpb25fbmFtZScpOyAgICAgICAgLy8gJ2FjdGlvbk5hbWUnXG4gY2FtZWxpemUoJ2Nzcy1jbGFzcy1uYW1lJyk7ICAgICAvLyAnY3NzQ2xhc3NOYW1lJ1xuIGNhbWVsaXplKCdteSBmYXZvcml0ZSBpdGVtcycpOyAgLy8gJ215RmF2b3JpdGVJdGVtcydcbiBjYW1lbGl6ZSgnTXkgRmF2b3JpdGUgSXRlbXMnKTsgIC8vICdteUZhdm9yaXRlSXRlbXMnXG4gYGBgXG5cbiBAbWV0aG9kIGNhbWVsaXplXG4gQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIGNhbWVsaXplLlxuIEByZXR1cm4ge1N0cmluZ30gdGhlIGNhbWVsaXplZCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW1lbGl6ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZShTVFJJTkdfQ0FNRUxJWkVfUkVHRVhQLCAoX21hdGNoOiBzdHJpbmcsIF9zZXBhcmF0b3I6IHN0cmluZywgY2hyOiBzdHJpbmcpID0+IHtcbiAgICAgIHJldHVybiBjaHIgPyBjaHIudG9VcHBlckNhc2UoKSA6ICcnO1xuICAgIH0pXG4gICAgLnJlcGxhY2UoL14oW0EtWl0pLywgKG1hdGNoOiBzdHJpbmcpID0+IG1hdGNoLnRvTG93ZXJDYXNlKCkpO1xufVxuXG4vKipcbiBSZXR1cm5zIHRoZSBVcHBlckNhbWVsQ2FzZSBmb3JtIG9mIGEgc3RyaW5nLlxuXG4gYGBgamF2YXNjcmlwdFxuICdpbm5lckhUTUwnLmNsYXNzaWZ5KCk7ICAgICAgICAgIC8vICdJbm5lckhUTUwnXG4gJ2FjdGlvbl9uYW1lJy5jbGFzc2lmeSgpOyAgICAgICAgLy8gJ0FjdGlvbk5hbWUnXG4gJ2Nzcy1jbGFzcy1uYW1lJy5jbGFzc2lmeSgpOyAgICAgLy8gJ0Nzc0NsYXNzTmFtZSdcbiAnbXkgZmF2b3JpdGUgaXRlbXMnLmNsYXNzaWZ5KCk7ICAvLyAnTXlGYXZvcml0ZUl0ZW1zJ1xuIGBgYFxuXG4gQG1ldGhvZCBjbGFzc2lmeVxuIEBwYXJhbSB7U3RyaW5nfSBzdHIgdGhlIHN0cmluZyB0byBjbGFzc2lmeVxuIEByZXR1cm4ge1N0cmluZ30gdGhlIGNsYXNzaWZpZWQgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc2lmeShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHIuc3BsaXQoJy4nKS5tYXAocGFydCA9PiBjYXBpdGFsaXplKGNhbWVsaXplKHBhcnQpKSkuam9pbignLicpO1xufVxuXG4vKipcbiBNb3JlIGdlbmVyYWwgdGhhbiBkZWNhbWVsaXplLiBSZXR1cm5zIHRoZSBsb3dlclxcX2Nhc2VcXF9hbmRcXF91bmRlcnNjb3JlZFxuIGZvcm0gb2YgYSBzdHJpbmcuXG5cbiBgYGBqYXZhc2NyaXB0XG4gJ2lubmVySFRNTCcudW5kZXJzY29yZSgpOyAgICAgICAgICAvLyAnaW5uZXJfaHRtbCdcbiAnYWN0aW9uX25hbWUnLnVuZGVyc2NvcmUoKTsgICAgICAgIC8vICdhY3Rpb25fbmFtZSdcbiAnY3NzLWNsYXNzLW5hbWUnLnVuZGVyc2NvcmUoKTsgICAgIC8vICdjc3NfY2xhc3NfbmFtZSdcbiAnbXkgZmF2b3JpdGUgaXRlbXMnLnVuZGVyc2NvcmUoKTsgIC8vICdteV9mYXZvcml0ZV9pdGVtcydcbiBgYGBcblxuIEBtZXRob2QgdW5kZXJzY29yZVxuIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byB1bmRlcnNjb3JlLlxuIEByZXR1cm4ge1N0cmluZ30gdGhlIHVuZGVyc2NvcmVkIHN0cmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuZGVyc2NvcmUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyXG4gICAgLnJlcGxhY2UoU1RSSU5HX1VOREVSU0NPUkVfUkVHRVhQXzEsICckMV8kMicpXG4gICAgLnJlcGxhY2UoU1RSSU5HX1VOREVSU0NPUkVfUkVHRVhQXzIsICdfJylcbiAgICAudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gUmV0dXJucyB0aGUgQ2FwaXRhbGl6ZWQgZm9ybSBvZiBhIHN0cmluZ1xuXG4gYGBgamF2YXNjcmlwdFxuICdpbm5lckhUTUwnLmNhcGl0YWxpemUoKSAgICAgICAgIC8vICdJbm5lckhUTUwnXG4gJ2FjdGlvbl9uYW1lJy5jYXBpdGFsaXplKCkgICAgICAgLy8gJ0FjdGlvbl9uYW1lJ1xuICdjc3MtY2xhc3MtbmFtZScuY2FwaXRhbGl6ZSgpICAgIC8vICdDc3MtY2xhc3MtbmFtZSdcbiAnbXkgZmF2b3JpdGUgaXRlbXMnLmNhcGl0YWxpemUoKSAvLyAnTXkgZmF2b3JpdGUgaXRlbXMnXG4gYGBgXG5cbiBAbWV0aG9kIGNhcGl0YWxpemVcbiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gY2FwaXRhbGl6ZS5cbiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBjYXBpdGFsaXplZCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYXBpdGFsaXplKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zdWJzdHIoMSk7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlIHRoZSBsZXZlbnNodGVpbiBkaXN0YW5jZSBvZiB0d28gc3RyaW5ncy5cbiAqIFNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MZXZlbnNodGVpbl9kaXN0YW5jZS5cbiAqIEJhc2VkIG9mZiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9hbmRyZWktbS85ODI5MjcgKGZvciB1c2luZyB0aGUgZmFzdGVyIGR5bmFtaWMgcHJvZ3JhbW1pbmdcbiAqIHZlcnNpb24pLlxuICpcbiAqIEBwYXJhbSBhIFN0cmluZyBhLlxuICogQHBhcmFtIGIgU3RyaW5nIGIuXG4gKiBAcmV0dXJucyBBIG51bWJlciB0aGF0IHJlcHJlc2VudHMgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIHR3byBzdHJpbmdzLiBUaGUgZ3JlYXRlciB0aGUgbnVtYmVyXG4gKiAgIHRoZSBtb3JlIGRpc3RhbnQgdGhlIHN0cmluZ3MgYXJlIGZyb20gZWFjaCBvdGhlcnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZXZlbnNodGVpbihhOiBzdHJpbmcsIGI6IHN0cmluZyk6IG51bWJlciB7XG4gIGlmIChhLmxlbmd0aCA9PSAwKSB7XG4gICAgcmV0dXJuIGIubGVuZ3RoO1xuICB9XG4gIGlmIChiLmxlbmd0aCA9PSAwKSB7XG4gICAgcmV0dXJuIGEubGVuZ3RoO1xuICB9XG5cbiAgY29uc3QgbWF0cml4ID0gW107XG5cbiAgLy8gaW5jcmVtZW50IGFsb25nIHRoZSBmaXJzdCBjb2x1bW4gb2YgZWFjaCByb3dcbiAgZm9yIChsZXQgaSA9IDA7IGkgPD0gYi5sZW5ndGg7IGkrKykge1xuICAgIG1hdHJpeFtpXSA9IFtpXTtcbiAgfVxuXG4gIC8vIGluY3JlbWVudCBlYWNoIGNvbHVtbiBpbiB0aGUgZmlyc3Qgcm93XG4gIGZvciAobGV0IGogPSAwOyBqIDw9IGEubGVuZ3RoOyBqKyspIHtcbiAgICBtYXRyaXhbMF1bal0gPSBqO1xuICB9XG5cbiAgLy8gRmlsbCBpbiB0aGUgcmVzdCBvZiB0aGUgbWF0cml4XG4gIGZvciAobGV0IGkgPSAxOyBpIDw9IGIubGVuZ3RoOyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBhLmxlbmd0aDsgaisrKSB7XG4gICAgICBpZiAoYi5jaGFyQXQoaSAtIDEpID09IGEuY2hhckF0KGogLSAxKSkge1xuICAgICAgICBtYXRyaXhbaV1bal0gPSBtYXRyaXhbaSAtIDFdW2ogLSAxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hdHJpeFtpXVtqXSA9IE1hdGgubWluKFxuICAgICAgICAgIG1hdHJpeFtpIC0gMV1baiAtIDFdICsgMSwgLy8gc3Vic3RpdHV0aW9uXG4gICAgICAgICAgbWF0cml4W2ldW2ogLSAxXSArIDEsIC8vIGluc2VydGlvblxuICAgICAgICAgIG1hdHJpeFtpIC0gMV1bal0gKyAxLCAvLyBkZWxldGlvblxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtYXRyaXhbYi5sZW5ndGhdW2EubGVuZ3RoXTtcbn1cbiJdfQ==