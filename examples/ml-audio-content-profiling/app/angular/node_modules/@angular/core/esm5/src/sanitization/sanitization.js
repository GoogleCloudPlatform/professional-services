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
 * It is possible to mark a string as trusted by calling {@link bypassSanitizationTrustHtml}.
 *
 * @param unsafeHtml untrusted `html`, typically from the user.
 * @returns `html` string which is safe to display to user, because all of the dangerous javascript
 * and urls have been removed.
 */
export function sanitizeHtml(unsafeHtml) {
    var s = getCurrentSanitizer();
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
 * It is possible to mark a string as trusted by calling {@link bypassSanitizationTrustStyle}.
 *
 * @param unsafeStyle untrusted `style`, typically from the user.
 * @returns `style` string which is safe to bind to the `style` properties, because all of the
 * dangerous javascript and urls have been removed.
 */
export function sanitizeStyle(unsafeStyle) {
    var s = getCurrentSanitizer();
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
 * It is possible to mark a string as trusted by calling {@link bypassSanitizationTrustUrl}.
 *
 * @param unsafeUrl untrusted `url`, typically from the user.
 * @returns `url` string which is safe to bind to the `src` properties such as `<img src>`, because
 * all of the dangerous javascript has been removed.
 */
export function sanitizeUrl(unsafeUrl) {
    var s = getCurrentSanitizer();
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
 * This passes only `url`s marked trusted by calling {@link bypassSanitizationTrustResourceUrl}.
 *
 * @param unsafeResourceUrl untrusted `url`, typically from the user.
 * @returns `url` string which is safe to bind to the `src` properties such as `<img src>`, because
 * only trusted `url`s have been allowed to pass.
 */
export function sanitizeResourceUrl(unsafeResourceUrl) {
    var s = getCurrentSanitizer();
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
 * This passes only `script`s marked trusted by calling {@link bypassSanitizationTrustScript}.
 *
 * @param unsafeScript untrusted `script`, typically from the user.
 * @returns `url` string which is safe to bind to the `<script>` element such as `<img src>`,
 * because only trusted `scripts`s have been allowed to pass.
 */
export function sanitizeScript(unsafeScript) {
    var s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.SCRIPT, unsafeScript) || '';
    }
    if (allowSanitizationBypass(unsafeScript, "Script" /* Script */)) {
        return unsafeScript.toString();
    }
    throw new Error('unsafe value used in a script context');
}
/**
 * The default style sanitizer will handle sanitization for style properties by
 * sanitizing any CSS property that can include a `url` value (usually image-based properties)
 */
export var defaultStyleSanitizer = function (prop, value) {
    if (value === undefined) {
        return prop === 'background-image' || prop === 'background' || prop === 'border-image' ||
            prop === 'filter' || prop === 'filter' || prop === 'list-style' ||
            prop === 'list-style-image';
    }
    return sanitizeStyle(value);
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuaXRpemF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUM1RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFFMUMsT0FBTyxFQUFhLHVCQUF1QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzdELE9BQU8sRUFBQyxhQUFhLElBQUksYUFBYSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDaEUsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUMzQyxPQUFPLEVBQWtCLGNBQWMsSUFBSSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRixPQUFPLEVBQUMsWUFBWSxJQUFJLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBSTdEOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQUMsVUFBZTtJQUMxQyxJQUFNLENBQUMsR0FBRyxtQkFBbUIsRUFBRSxDQUFDO0lBQ2hDLElBQUksQ0FBQyxFQUFFO1FBQ0wsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQzNEO0lBQ0QsSUFBSSx1QkFBdUIsQ0FBQyxVQUFVLG9CQUFrQixFQUFFO1FBQ3hELE9BQU8sVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQzlCO0lBQ0QsT0FBTyxhQUFhLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUFFRDs7Ozs7Ozs7Ozs7O0dBWUc7QUFDSCxNQUFNLFVBQVUsYUFBYSxDQUFDLFdBQWdCO0lBQzVDLElBQU0sQ0FBQyxHQUFHLG1CQUFtQixFQUFFLENBQUM7SUFDaEMsSUFBSSxDQUFDLEVBQUU7UUFDTCxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDN0Q7SUFDRCxJQUFJLHVCQUF1QixDQUFDLFdBQVcsc0JBQW1CLEVBQUU7UUFDMUQsT0FBTyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7S0FDL0I7SUFDRCxPQUFPLGNBQWMsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztBQUNoRCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQUMsU0FBYztJQUN4QyxJQUFNLENBQUMsR0FBRyxtQkFBbUIsRUFBRSxDQUFDO0lBQ2hDLElBQUksQ0FBQyxFQUFFO1FBQ0wsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ3pEO0lBQ0QsSUFBSSx1QkFBdUIsQ0FBQyxTQUFTLGtCQUFpQixFQUFFO1FBQ3RELE9BQU8sU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQzdCO0lBQ0QsT0FBTyxZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUFDLGlCQUFzQjtJQUN4RCxJQUFNLENBQUMsR0FBRyxtQkFBbUIsRUFBRSxDQUFDO0lBQ2hDLElBQUksQ0FBQyxFQUFFO1FBQ0wsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDMUU7SUFDRCxJQUFJLHVCQUF1QixDQUFDLGlCQUFpQixrQ0FBeUIsRUFBRTtRQUN0RSxPQUFPLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQ3JDO0lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQywrRUFBK0UsQ0FBQyxDQUFDO0FBQ25HLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQUMsWUFBaUI7SUFDOUMsSUFBTSxDQUFDLEdBQUcsbUJBQW1CLEVBQUUsQ0FBQztJQUNoQyxJQUFJLENBQUMsRUFBRTtRQUNMLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUMvRDtJQUNELElBQUksdUJBQXVCLENBQUMsWUFBWSx3QkFBb0IsRUFBRTtRQUM1RCxPQUFPLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUNoQztJQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsdUNBQXVDLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLElBQU0scUJBQXFCLEdBQUksVUFBUyxJQUFZLEVBQUUsS0FBYztJQUN6RSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDdkIsT0FBTyxJQUFJLEtBQUssa0JBQWtCLElBQUksSUFBSSxLQUFLLFlBQVksSUFBSSxJQUFJLEtBQUssY0FBYztZQUNsRixJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxLQUFLLFlBQVk7WUFDL0QsSUFBSSxLQUFLLGtCQUFrQixDQUFDO0tBQ2pDO0lBRUQsT0FBTyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUIsQ0FBcUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXRDdXJyZW50U2FuaXRpemVyfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsJztcblxuaW1wb3J0IHtCeXBhc3NUeXBlLCBhbGxvd1Nhbml0aXphdGlvbkJ5cGFzc30gZnJvbSAnLi9ieXBhc3MnO1xuaW1wb3J0IHtfc2FuaXRpemVIdG1sIGFzIF9zYW5pdGl6ZUh0bWx9IGZyb20gJy4vaHRtbF9zYW5pdGl6ZXInO1xuaW1wb3J0IHtTZWN1cml0eUNvbnRleHR9IGZyb20gJy4vc2VjdXJpdHknO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm4sIF9zYW5pdGl6ZVN0eWxlIGFzIF9zYW5pdGl6ZVN0eWxlfSBmcm9tICcuL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge19zYW5pdGl6ZVVybCBhcyBfc2FuaXRpemVVcmx9IGZyb20gJy4vdXJsX3Nhbml0aXplcic7XG5cblxuXG4vKipcbiAqIEFuIGBodG1sYCBzYW5pdGl6ZXIgd2hpY2ggY29udmVydHMgdW50cnVzdGVkIGBodG1sYCAqKnN0cmluZyoqIGludG8gdHJ1c3RlZCBzdHJpbmcgYnkgcmVtb3ZpbmdcbiAqIGRhbmdlcm91cyBjb250ZW50LlxuICpcbiAqIFRoaXMgbWV0aG9kIHBhcnNlcyB0aGUgYGh0bWxgIGFuZCBsb2NhdGVzIHBvdGVudGlhbGx5IGRhbmdlcm91cyBjb250ZW50IChzdWNoIGFzIHVybHMgYW5kXG4gKiBqYXZhc2NyaXB0KSBhbmQgcmVtb3ZlcyBpdC5cbiAqXG4gKiBJdCBpcyBwb3NzaWJsZSB0byBtYXJrIGEgc3RyaW5nIGFzIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RIdG1sfS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlSHRtbCB1bnRydXN0ZWQgYGh0bWxgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGBodG1sYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBkaXNwbGF5IHRvIHVzZXIsIGJlY2F1c2UgYWxsIG9mIHRoZSBkYW5nZXJvdXMgamF2YXNjcmlwdFxuICogYW5kIHVybHMgaGF2ZSBiZWVuIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZUh0bWwodW5zYWZlSHRtbDogYW55KTogc3RyaW5nIHtcbiAgY29uc3QgcyA9IGdldEN1cnJlbnRTYW5pdGl6ZXIoKTtcbiAgaWYgKHMpIHtcbiAgICByZXR1cm4gcy5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuSFRNTCwgdW5zYWZlSHRtbCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZUh0bWwsIEJ5cGFzc1R5cGUuSHRtbCkpIHtcbiAgICByZXR1cm4gdW5zYWZlSHRtbC50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiBfc2FuaXRpemVIdG1sKGRvY3VtZW50LCBzdHJpbmdpZnkodW5zYWZlSHRtbCkpO1xufVxuXG4vKipcbiAqIEEgYHN0eWxlYCBzYW5pdGl6ZXIgd2hpY2ggY29udmVydHMgdW50cnVzdGVkIGBzdHlsZWAgKipzdHJpbmcqKiBpbnRvIHRydXN0ZWQgc3RyaW5nIGJ5IHJlbW92aW5nXG4gKiBkYW5nZXJvdXMgY29udGVudC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBwYXJzZXMgdGhlIGBzdHlsZWAgYW5kIGxvY2F0ZXMgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNvbnRlbnQgKHN1Y2ggYXMgdXJscyBhbmRcbiAqIGphdmFzY3JpcHQpIGFuZCByZW1vdmVzIGl0LlxuICpcbiAqIEl0IGlzIHBvc3NpYmxlIHRvIG1hcmsgYSBzdHJpbmcgYXMgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFN0eWxlfS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlU3R5bGUgdW50cnVzdGVkIGBzdHlsZWAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHN0eWxlYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kIHRvIHRoZSBgc3R5bGVgIHByb3BlcnRpZXMsIGJlY2F1c2UgYWxsIG9mIHRoZVxuICogZGFuZ2Vyb3VzIGphdmFzY3JpcHQgYW5kIHVybHMgaGF2ZSBiZWVuIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZVN0eWxlKHVuc2FmZVN0eWxlOiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzID0gZ2V0Q3VycmVudFNhbml0aXplcigpO1xuICBpZiAocykge1xuICAgIHJldHVybiBzLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5TVFlMRSwgdW5zYWZlU3R5bGUpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzcyh1bnNhZmVTdHlsZSwgQnlwYXNzVHlwZS5TdHlsZSkpIHtcbiAgICByZXR1cm4gdW5zYWZlU3R5bGUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gX3Nhbml0aXplU3R5bGUoc3RyaW5naWZ5KHVuc2FmZVN0eWxlKSk7XG59XG5cbi8qKlxuICogQSBgdXJsYCBzYW5pdGl6ZXIgd2hpY2ggY29udmVydHMgdW50cnVzdGVkIGB1cmxgICoqc3RyaW5nKiogaW50byB0cnVzdGVkIHN0cmluZyBieSByZW1vdmluZ1xuICogZGFuZ2Vyb3VzXG4gKiBjb250ZW50LlxuICpcbiAqIFRoaXMgbWV0aG9kIHBhcnNlcyB0aGUgYHVybGAgYW5kIGxvY2F0ZXMgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNvbnRlbnQgKHN1Y2ggYXMgamF2YXNjcmlwdCkgYW5kXG4gKiByZW1vdmVzIGl0LlxuICpcbiAqIEl0IGlzIHBvc3NpYmxlIHRvIG1hcmsgYSBzdHJpbmcgYXMgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFVybH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVVybCB1bnRydXN0ZWQgYHVybGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYHNyY2AgcHJvcGVydGllcyBzdWNoIGFzIGA8aW1nIHNyYz5gLCBiZWNhdXNlXG4gKiBhbGwgb2YgdGhlIGRhbmdlcm91cyBqYXZhc2NyaXB0IGhhcyBiZWVuIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZVVybCh1bnNhZmVVcmw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHMgPSBnZXRDdXJyZW50U2FuaXRpemVyKCk7XG4gIGlmIChzKSB7XG4gICAgcmV0dXJuIHMuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LlVSTCwgdW5zYWZlVXJsKSB8fCAnJztcbiAgfVxuICBpZiAoYWxsb3dTYW5pdGl6YXRpb25CeXBhc3ModW5zYWZlVXJsLCBCeXBhc3NUeXBlLlVybCkpIHtcbiAgICByZXR1cm4gdW5zYWZlVXJsLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIF9zYW5pdGl6ZVVybChzdHJpbmdpZnkodW5zYWZlVXJsKSk7XG59XG5cbi8qKlxuICogQSBgdXJsYCBzYW5pdGl6ZXIgd2hpY2ggb25seSBsZXRzIHRydXN0ZWQgYHVybGBzIHRocm91Z2guXG4gKlxuICogVGhpcyBwYXNzZXMgb25seSBgdXJsYHMgbWFya2VkIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RSZXNvdXJjZVVybH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVJlc291cmNlVXJsIHVudHJ1c3RlZCBgdXJsYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcmV0dXJucyBgdXJsYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kIHRvIHRoZSBgc3JjYCBwcm9wZXJ0aWVzIHN1Y2ggYXMgYDxpbWcgc3JjPmAsIGJlY2F1c2VcbiAqIG9ubHkgdHJ1c3RlZCBgdXJsYHMgaGF2ZSBiZWVuIGFsbG93ZWQgdG8gcGFzcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplUmVzb3VyY2VVcmwodW5zYWZlUmVzb3VyY2VVcmw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHMgPSBnZXRDdXJyZW50U2FuaXRpemVyKCk7XG4gIGlmIChzKSB7XG4gICAgcmV0dXJuIHMuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LlJFU09VUkNFX1VSTCwgdW5zYWZlUmVzb3VyY2VVcmwpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzcyh1bnNhZmVSZXNvdXJjZVVybCwgQnlwYXNzVHlwZS5SZXNvdXJjZVVybCkpIHtcbiAgICByZXR1cm4gdW5zYWZlUmVzb3VyY2VVcmwudG9TdHJpbmcoKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc2FmZSB2YWx1ZSB1c2VkIGluIGEgcmVzb3VyY2UgVVJMIGNvbnRleHQgKHNlZSBodHRwOi8vZy5jby9uZy9zZWN1cml0eSN4c3MpJyk7XG59XG5cbi8qKlxuICogQSBgc2NyaXB0YCBzYW5pdGl6ZXIgd2hpY2ggb25seSBsZXRzIHRydXN0ZWQgamF2YXNjcmlwdCB0aHJvdWdoLlxuICpcbiAqIFRoaXMgcGFzc2VzIG9ubHkgYHNjcmlwdGBzIG1hcmtlZCB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0U2NyaXB0fS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlU2NyaXB0IHVudHJ1c3RlZCBgc2NyaXB0YCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcmV0dXJucyBgdXJsYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kIHRvIHRoZSBgPHNjcmlwdD5gIGVsZW1lbnQgc3VjaCBhcyBgPGltZyBzcmM+YCxcbiAqIGJlY2F1c2Ugb25seSB0cnVzdGVkIGBzY3JpcHRzYHMgaGF2ZSBiZWVuIGFsbG93ZWQgdG8gcGFzcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplU2NyaXB0KHVuc2FmZVNjcmlwdDogYW55KTogc3RyaW5nIHtcbiAgY29uc3QgcyA9IGdldEN1cnJlbnRTYW5pdGl6ZXIoKTtcbiAgaWYgKHMpIHtcbiAgICByZXR1cm4gcy5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuU0NSSVBULCB1bnNhZmVTY3JpcHQpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzcyh1bnNhZmVTY3JpcHQsIEJ5cGFzc1R5cGUuU2NyaXB0KSkge1xuICAgIHJldHVybiB1bnNhZmVTY3JpcHQudG9TdHJpbmcoKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc2FmZSB2YWx1ZSB1c2VkIGluIGEgc2NyaXB0IGNvbnRleHQnKTtcbn1cblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBzdHlsZSBzYW5pdGl6ZXIgd2lsbCBoYW5kbGUgc2FuaXRpemF0aW9uIGZvciBzdHlsZSBwcm9wZXJ0aWVzIGJ5XG4gKiBzYW5pdGl6aW5nIGFueSBDU1MgcHJvcGVydHkgdGhhdCBjYW4gaW5jbHVkZSBhIGB1cmxgIHZhbHVlICh1c3VhbGx5IGltYWdlLWJhc2VkIHByb3BlcnRpZXMpXG4gKi9cbmV4cG9ydCBjb25zdCBkZWZhdWx0U3R5bGVTYW5pdGl6ZXIgPSAoZnVuY3Rpb24ocHJvcDogc3RyaW5nLCB2YWx1ZT86IHN0cmluZyk6IHN0cmluZyB8IGJvb2xlYW4ge1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBwcm9wID09PSAnYmFja2dyb3VuZC1pbWFnZScgfHwgcHJvcCA9PT0gJ2JhY2tncm91bmQnIHx8IHByb3AgPT09ICdib3JkZXItaW1hZ2UnIHx8XG4gICAgICAgIHByb3AgPT09ICdmaWx0ZXInIHx8IHByb3AgPT09ICdmaWx0ZXInIHx8IHByb3AgPT09ICdsaXN0LXN0eWxlJyB8fFxuICAgICAgICBwcm9wID09PSAnbGlzdC1zdHlsZS1pbWFnZSc7XG4gIH1cblxuICByZXR1cm4gc2FuaXRpemVTdHlsZSh2YWx1ZSk7XG59IGFzIFN0eWxlU2FuaXRpemVGbik7XG4iXX0=