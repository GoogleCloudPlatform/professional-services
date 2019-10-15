/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getCurrentSanitizer } from '../render3/instructions';
import { stringify } from '../render3/util';
import { allowSanitizationBypass } from './bypass';
import { _sanitizeHtml as _sanitizeHtml } from './html_sanitizer';
import { SecurityContext } from './security';
import { _sanitizeStyle as _sanitizeStyle } from './style_sanitizer';
import { _sanitizeUrl as _sanitizeUrl } from './url_sanitizer';
/**
 * An `html` sanitizer which converts untrusted `html` **string** into trusted string by removing
 * dangerous content.
 *
 * This method parses the `html` and locates potentially dangerous content (such as urls and
 * javascript) and removes it.
 *
 * It is possible to mark a string as trusted by calling {\@link bypassSanitizationTrustHtml}.
 *
 * @param {?} unsafeHtml untrusted `html`, typically from the user.
 * @return {?} `html` string which is safe to display to user, because all of the dangerous javascript
 * and urls have been removed.
 */
export function sanitizeHtml(unsafeHtml) {
    /** @type {?} */
    const s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.HTML, unsafeHtml) || '';
    }
    if (allowSanitizationBypass(unsafeHtml, "Html" /* Html */)) {
        return unsafeHtml.toString();
    }
    return _sanitizeHtml(document, stringify(unsafeHtml));
}
/**
 * A `style` sanitizer which converts untrusted `style` **string** into trusted string by removing
 * dangerous content.
 *
 * This method parses the `style` and locates potentially dangerous content (such as urls and
 * javascript) and removes it.
 *
 * It is possible to mark a string as trusted by calling {\@link bypassSanitizationTrustStyle}.
 *
 * @param {?} unsafeStyle untrusted `style`, typically from the user.
 * @return {?} `style` string which is safe to bind to the `style` properties, because all of the
 * dangerous javascript and urls have been removed.
 */
export function sanitizeStyle(unsafeStyle) {
    /** @type {?} */
    const s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.STYLE, unsafeStyle) || '';
    }
    if (allowSanitizationBypass(unsafeStyle, "Style" /* Style */)) {
        return unsafeStyle.toString();
    }
    return _sanitizeStyle(stringify(unsafeStyle));
}
/**
 * A `url` sanitizer which converts untrusted `url` **string** into trusted string by removing
 * dangerous
 * content.
 *
 * This method parses the `url` and locates potentially dangerous content (such as javascript) and
 * removes it.
 *
 * It is possible to mark a string as trusted by calling {\@link bypassSanitizationTrustUrl}.
 *
 * @param {?} unsafeUrl untrusted `url`, typically from the user.
 * @return {?} `url` string which is safe to bind to the `src` properties such as `<img src>`, because
 * all of the dangerous javascript has been removed.
 */
export function sanitizeUrl(unsafeUrl) {
    /** @type {?} */
    const s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.URL, unsafeUrl) || '';
    }
    if (allowSanitizationBypass(unsafeUrl, "Url" /* Url */)) {
        return unsafeUrl.toString();
    }
    return _sanitizeUrl(stringify(unsafeUrl));
}
/**
 * A `url` sanitizer which only lets trusted `url`s through.
 *
 * This passes only `url`s marked trusted by calling {\@link bypassSanitizationTrustResourceUrl}.
 *
 * @param {?} unsafeResourceUrl untrusted `url`, typically from the user.
 * @return {?} `url` string which is safe to bind to the `src` properties such as `<img src>`, because
 * only trusted `url`s have been allowed to pass.
 */
export function sanitizeResourceUrl(unsafeResourceUrl) {
    /** @type {?} */
    const s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.RESOURCE_URL, unsafeResourceUrl) || '';
    }
    if (allowSanitizationBypass(unsafeResourceUrl, "ResourceUrl" /* ResourceUrl */)) {
        return unsafeResourceUrl.toString();
    }
    throw new Error('unsafe value used in a resource URL context (see http://g.co/ng/security#xss)');
}
/**
 * A `script` sanitizer which only lets trusted javascript through.
 *
 * This passes only `script`s marked trusted by calling {\@link bypassSanitizationTrustScript}.
 *
 * @param {?} unsafeScript untrusted `script`, typically from the user.
 * @return {?} `url` string which is safe to bind to the `<script>` element such as `<img src>`,
 * because only trusted `scripts`s have been allowed to pass.
 */
export function sanitizeScript(unsafeScript) {
    /** @type {?} */
    const s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.SCRIPT, unsafeScript) || '';
    }
    if (allowSanitizationBypass(unsafeScript, "Script" /* Script */)) {
        return unsafeScript.toString();
    }
    throw new Error('unsafe value used in a script context');
}
/** *
 * The default style sanitizer will handle sanitization for style properties by
 * sanitizing any CSS property that can include a `url` value (usually image-based properties)
  @type {?} */
export const defaultStyleSanitizer = (/** @type {?} */ (function (prop, value) {
    if (value === undefined) {
        return prop === 'background-image' || prop === 'background' || prop === 'border-image' ||
            prop === 'filter' || prop === 'filter' || prop === 'list-style' ||
            prop === 'list-style-image';
    }
    return sanitizeStyle(value);
}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuaXRpemF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQzVELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUUxQyxPQUFPLEVBQWEsdUJBQXVCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0QsT0FBTyxFQUFDLGFBQWEsSUFBSSxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNoRSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQzNDLE9BQU8sRUFBa0IsY0FBYyxJQUFJLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3BGLE9BQU8sRUFBQyxZQUFZLElBQUksWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBaUI3RCxNQUFNLFVBQVUsWUFBWSxDQUFDLFVBQWU7O0lBQzFDLE1BQU0sQ0FBQyxHQUFHLG1CQUFtQixFQUFFLENBQUM7SUFDaEMsSUFBSSxDQUFDLEVBQUU7UUFDTCxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDM0Q7SUFDRCxJQUFJLHVCQUF1QixDQUFDLFVBQVUsb0JBQWtCLEVBQUU7UUFDeEQsT0FBTyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7S0FDOUI7SUFDRCxPQUFPLGFBQWEsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Q0FDdkQ7Ozs7Ozs7Ozs7Ozs7O0FBZUQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxXQUFnQjs7SUFDNUMsTUFBTSxDQUFDLEdBQUcsbUJBQW1CLEVBQUUsQ0FBQztJQUNoQyxJQUFJLENBQUMsRUFBRTtRQUNMLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUM3RDtJQUNELElBQUksdUJBQXVCLENBQUMsV0FBVyxzQkFBbUIsRUFBRTtRQUMxRCxPQUFPLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUMvQjtJQUNELE9BQU8sY0FBYyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0NBQy9DOzs7Ozs7Ozs7Ozs7Ozs7QUFnQkQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxTQUFjOztJQUN4QyxNQUFNLENBQUMsR0FBRyxtQkFBbUIsRUFBRSxDQUFDO0lBQ2hDLElBQUksQ0FBQyxFQUFFO1FBQ0wsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ3pEO0lBQ0QsSUFBSSx1QkFBdUIsQ0FBQyxTQUFTLGtCQUFpQixFQUFFO1FBQ3RELE9BQU8sU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQzdCO0lBQ0QsT0FBTyxZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Q0FDM0M7Ozs7Ozs7Ozs7QUFXRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsaUJBQXNCOztJQUN4RCxNQUFNLENBQUMsR0FBRyxtQkFBbUIsRUFBRSxDQUFDO0lBQ2hDLElBQUksQ0FBQyxFQUFFO1FBQ0wsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDMUU7SUFDRCxJQUFJLHVCQUF1QixDQUFDLGlCQUFpQixrQ0FBeUIsRUFBRTtRQUN0RSxPQUFPLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQ3JDO0lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQywrRUFBK0UsQ0FBQyxDQUFDO0NBQ2xHOzs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxZQUFpQjs7SUFDOUMsTUFBTSxDQUFDLEdBQUcsbUJBQW1CLEVBQUUsQ0FBQztJQUNoQyxJQUFJLENBQUMsRUFBRTtRQUNMLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUMvRDtJQUNELElBQUksdUJBQXVCLENBQUMsWUFBWSx3QkFBb0IsRUFBRTtRQUM1RCxPQUFPLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUNoQztJQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsdUNBQXVDLENBQUMsQ0FBQztDQUMxRDs7Ozs7QUFNRCxhQUFhLHFCQUFxQixHQUFHLG1CQUFDLFVBQVMsSUFBWSxFQUFFLEtBQWM7SUFDekUsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLE9BQU8sSUFBSSxLQUFLLGtCQUFrQixJQUFJLElBQUksS0FBSyxZQUFZLElBQUksSUFBSSxLQUFLLGNBQWM7WUFDbEYsSUFBSSxLQUFLLFFBQVEsSUFBSSxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksS0FBSyxZQUFZO1lBQy9ELElBQUksS0FBSyxrQkFBa0IsQ0FBQztLQUNqQztJQUVELE9BQU8sYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ1YsRUFBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2dldEN1cnJlbnRTYW5pdGl6ZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi9yZW5kZXIzL3V0aWwnO1xuXG5pbXBvcnQge0J5cGFzc1R5cGUsIGFsbG93U2FuaXRpemF0aW9uQnlwYXNzfSBmcm9tICcuL2J5cGFzcyc7XG5pbXBvcnQge19zYW5pdGl6ZUh0bWwgYXMgX3Nhbml0aXplSHRtbH0gZnJvbSAnLi9odG1sX3Nhbml0aXplcic7XG5pbXBvcnQge1NlY3VyaXR5Q29udGV4dH0gZnJvbSAnLi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbiwgX3Nhbml0aXplU3R5bGUgYXMgX3Nhbml0aXplU3R5bGV9IGZyb20gJy4vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7X3Nhbml0aXplVXJsIGFzIF9zYW5pdGl6ZVVybH0gZnJvbSAnLi91cmxfc2FuaXRpemVyJztcblxuXG5cbi8qKlxuICogQW4gYGh0bWxgIHNhbml0aXplciB3aGljaCBjb252ZXJ0cyB1bnRydXN0ZWQgYGh0bWxgICoqc3RyaW5nKiogaW50byB0cnVzdGVkIHN0cmluZyBieSByZW1vdmluZ1xuICogZGFuZ2Vyb3VzIGNvbnRlbnQuXG4gKlxuICogVGhpcyBtZXRob2QgcGFyc2VzIHRoZSBgaHRtbGAgYW5kIGxvY2F0ZXMgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNvbnRlbnQgKHN1Y2ggYXMgdXJscyBhbmRcbiAqIGphdmFzY3JpcHQpIGFuZCByZW1vdmVzIGl0LlxuICpcbiAqIEl0IGlzIHBvc3NpYmxlIHRvIG1hcmsgYSBzdHJpbmcgYXMgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdEh0bWx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVIdG1sIHVudHJ1c3RlZCBgaHRtbGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYGh0bWxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGRpc3BsYXkgdG8gdXNlciwgYmVjYXVzZSBhbGwgb2YgdGhlIGRhbmdlcm91cyBqYXZhc2NyaXB0XG4gKiBhbmQgdXJscyBoYXZlIGJlZW4gcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplSHRtbCh1bnNhZmVIdG1sOiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzID0gZ2V0Q3VycmVudFNhbml0aXplcigpO1xuICBpZiAocykge1xuICAgIHJldHVybiBzLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5IVE1MLCB1bnNhZmVIdG1sKSB8fCAnJztcbiAgfVxuICBpZiAoYWxsb3dTYW5pdGl6YXRpb25CeXBhc3ModW5zYWZlSHRtbCwgQnlwYXNzVHlwZS5IdG1sKSkge1xuICAgIHJldHVybiB1bnNhZmVIdG1sLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIF9zYW5pdGl6ZUh0bWwoZG9jdW1lbnQsIHN0cmluZ2lmeSh1bnNhZmVIdG1sKSk7XG59XG5cbi8qKlxuICogQSBgc3R5bGVgIHNhbml0aXplciB3aGljaCBjb252ZXJ0cyB1bnRydXN0ZWQgYHN0eWxlYCAqKnN0cmluZyoqIGludG8gdHJ1c3RlZCBzdHJpbmcgYnkgcmVtb3ZpbmdcbiAqIGRhbmdlcm91cyBjb250ZW50LlxuICpcbiAqIFRoaXMgbWV0aG9kIHBhcnNlcyB0aGUgYHN0eWxlYCBhbmQgbG9jYXRlcyBwb3RlbnRpYWxseSBkYW5nZXJvdXMgY29udGVudCAoc3VjaCBhcyB1cmxzIGFuZFxuICogamF2YXNjcmlwdCkgYW5kIHJlbW92ZXMgaXQuXG4gKlxuICogSXQgaXMgcG9zc2libGUgdG8gbWFyayBhIHN0cmluZyBhcyB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0U3R5bGV9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVTdHlsZSB1bnRydXN0ZWQgYHN0eWxlYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcmV0dXJucyBgc3R5bGVgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQgdG8gdGhlIGBzdHlsZWAgcHJvcGVydGllcywgYmVjYXVzZSBhbGwgb2YgdGhlXG4gKiBkYW5nZXJvdXMgamF2YXNjcmlwdCBhbmQgdXJscyBoYXZlIGJlZW4gcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplU3R5bGUodW5zYWZlU3R5bGU6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHMgPSBnZXRDdXJyZW50U2FuaXRpemVyKCk7XG4gIGlmIChzKSB7XG4gICAgcmV0dXJuIHMuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LlNUWUxFLCB1bnNhZmVTdHlsZSkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZVN0eWxlLCBCeXBhc3NUeXBlLlN0eWxlKSkge1xuICAgIHJldHVybiB1bnNhZmVTdHlsZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiBfc2FuaXRpemVTdHlsZShzdHJpbmdpZnkodW5zYWZlU3R5bGUpKTtcbn1cblxuLyoqXG4gKiBBIGB1cmxgIHNhbml0aXplciB3aGljaCBjb252ZXJ0cyB1bnRydXN0ZWQgYHVybGAgKipzdHJpbmcqKiBpbnRvIHRydXN0ZWQgc3RyaW5nIGJ5IHJlbW92aW5nXG4gKiBkYW5nZXJvdXNcbiAqIGNvbnRlbnQuXG4gKlxuICogVGhpcyBtZXRob2QgcGFyc2VzIHRoZSBgdXJsYCBhbmQgbG9jYXRlcyBwb3RlbnRpYWxseSBkYW5nZXJvdXMgY29udGVudCAoc3VjaCBhcyBqYXZhc2NyaXB0KSBhbmRcbiAqIHJlbW92ZXMgaXQuXG4gKlxuICogSXQgaXMgcG9zc2libGUgdG8gbWFyayBhIHN0cmluZyBhcyB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0VXJsfS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlVXJsIHVudHJ1c3RlZCBgdXJsYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcmV0dXJucyBgdXJsYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kIHRvIHRoZSBgc3JjYCBwcm9wZXJ0aWVzIHN1Y2ggYXMgYDxpbWcgc3JjPmAsIGJlY2F1c2VcbiAqIGFsbCBvZiB0aGUgZGFuZ2Vyb3VzIGphdmFzY3JpcHQgaGFzIGJlZW4gcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplVXJsKHVuc2FmZVVybDogYW55KTogc3RyaW5nIHtcbiAgY29uc3QgcyA9IGdldEN1cnJlbnRTYW5pdGl6ZXIoKTtcbiAgaWYgKHMpIHtcbiAgICByZXR1cm4gcy5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuVVJMLCB1bnNhZmVVcmwpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzcyh1bnNhZmVVcmwsIEJ5cGFzc1R5cGUuVXJsKSkge1xuICAgIHJldHVybiB1bnNhZmVVcmwudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gX3Nhbml0aXplVXJsKHN0cmluZ2lmeSh1bnNhZmVVcmwpKTtcbn1cblxuLyoqXG4gKiBBIGB1cmxgIHNhbml0aXplciB3aGljaCBvbmx5IGxldHMgdHJ1c3RlZCBgdXJsYHMgdGhyb3VnaC5cbiAqXG4gKiBUaGlzIHBhc3NlcyBvbmx5IGB1cmxgcyBtYXJrZWQgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFJlc291cmNlVXJsfS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlUmVzb3VyY2VVcmwgdW50cnVzdGVkIGB1cmxgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGB1cmxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQgdG8gdGhlIGBzcmNgIHByb3BlcnRpZXMgc3VjaCBhcyBgPGltZyBzcmM+YCwgYmVjYXVzZVxuICogb25seSB0cnVzdGVkIGB1cmxgcyBoYXZlIGJlZW4gYWxsb3dlZCB0byBwYXNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVSZXNvdXJjZVVybCh1bnNhZmVSZXNvdXJjZVVybDogYW55KTogc3RyaW5nIHtcbiAgY29uc3QgcyA9IGdldEN1cnJlbnRTYW5pdGl6ZXIoKTtcbiAgaWYgKHMpIHtcbiAgICByZXR1cm4gcy5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuUkVTT1VSQ0VfVVJMLCB1bnNhZmVSZXNvdXJjZVVybCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZVJlc291cmNlVXJsLCBCeXBhc3NUeXBlLlJlc291cmNlVXJsKSkge1xuICAgIHJldHVybiB1bnNhZmVSZXNvdXJjZVVybC50b1N0cmluZygpO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcigndW5zYWZlIHZhbHVlIHVzZWQgaW4gYSByZXNvdXJjZSBVUkwgY29udGV4dCAoc2VlIGh0dHA6Ly9nLmNvL25nL3NlY3VyaXR5I3hzcyknKTtcbn1cblxuLyoqXG4gKiBBIGBzY3JpcHRgIHNhbml0aXplciB3aGljaCBvbmx5IGxldHMgdHJ1c3RlZCBqYXZhc2NyaXB0IHRocm91Z2guXG4gKlxuICogVGhpcyBwYXNzZXMgb25seSBgc2NyaXB0YHMgbWFya2VkIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTY3JpcHR9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVTY3JpcHQgdW50cnVzdGVkIGBzY3JpcHRgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGB1cmxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQgdG8gdGhlIGA8c2NyaXB0PmAgZWxlbWVudCBzdWNoIGFzIGA8aW1nIHNyYz5gLFxuICogYmVjYXVzZSBvbmx5IHRydXN0ZWQgYHNjcmlwdHNgcyBoYXZlIGJlZW4gYWxsb3dlZCB0byBwYXNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVTY3JpcHQodW5zYWZlU2NyaXB0OiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzID0gZ2V0Q3VycmVudFNhbml0aXplcigpO1xuICBpZiAocykge1xuICAgIHJldHVybiBzLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5TQ1JJUFQsIHVuc2FmZVNjcmlwdCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZVNjcmlwdCwgQnlwYXNzVHlwZS5TY3JpcHQpKSB7XG4gICAgcmV0dXJuIHVuc2FmZVNjcmlwdC50b1N0cmluZygpO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcigndW5zYWZlIHZhbHVlIHVzZWQgaW4gYSBzY3JpcHQgY29udGV4dCcpO1xufVxuXG4vKipcbiAqIFRoZSBkZWZhdWx0IHN0eWxlIHNhbml0aXplciB3aWxsIGhhbmRsZSBzYW5pdGl6YXRpb24gZm9yIHN0eWxlIHByb3BlcnRpZXMgYnlcbiAqIHNhbml0aXppbmcgYW55IENTUyBwcm9wZXJ0eSB0aGF0IGNhbiBpbmNsdWRlIGEgYHVybGAgdmFsdWUgKHVzdWFsbHkgaW1hZ2UtYmFzZWQgcHJvcGVydGllcylcbiAqL1xuZXhwb3J0IGNvbnN0IGRlZmF1bHRTdHlsZVNhbml0aXplciA9IChmdW5jdGlvbihwcm9wOiBzdHJpbmcsIHZhbHVlPzogc3RyaW5nKTogc3RyaW5nIHwgYm9vbGVhbiB7XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHByb3AgPT09ICdiYWNrZ3JvdW5kLWltYWdlJyB8fCBwcm9wID09PSAnYmFja2dyb3VuZCcgfHwgcHJvcCA9PT0gJ2JvcmRlci1pbWFnZScgfHxcbiAgICAgICAgcHJvcCA9PT0gJ2ZpbHRlcicgfHwgcHJvcCA9PT0gJ2ZpbHRlcicgfHwgcHJvcCA9PT0gJ2xpc3Qtc3R5bGUnIHx8XG4gICAgICAgIHByb3AgPT09ICdsaXN0LXN0eWxlLWltYWdlJztcbiAgfVxuXG4gIHJldHVybiBzYW5pdGl6ZVN0eWxlKHZhbHVlKTtcbn0gYXMgU3R5bGVTYW5pdGl6ZUZuKTtcbiJdfQ==