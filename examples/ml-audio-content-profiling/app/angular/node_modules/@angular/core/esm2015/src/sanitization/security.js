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
/** @enum {number} */
var SecurityContext = {
    NONE: 0,
    HTML: 1,
    STYLE: 2,
    SCRIPT: 3,
    URL: 4,
    RESOURCE_URL: 5,
};
export { SecurityContext };
SecurityContext[SecurityContext.NONE] = 'NONE';
SecurityContext[SecurityContext.HTML] = 'HTML';
SecurityContext[SecurityContext.STYLE] = 'STYLE';
SecurityContext[SecurityContext.SCRIPT] = 'SCRIPT';
SecurityContext[SecurityContext.URL] = 'URL';
SecurityContext[SecurityContext.RESOURCE_URL] = 'RESOURCE_URL';
/**
 * Sanitizer is used by the views to sanitize potentially dangerous values.
 *
 * \@publicApi
 * @abstract
 */
export class Sanitizer {
}
if (false) {
    /**
     * @abstract
     * @param {?} context
     * @param {?} value
     * @return {?}
     */
    Sanitizer.prototype.sanitize = function (context, value) { };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zYW5pdGl6YXRpb24vc2VjdXJpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQWtCRSxPQUFRO0lBQ1IsT0FBUTtJQUNSLFFBQVM7SUFDVCxTQUFVO0lBQ1YsTUFBTztJQUNQLGVBQWdCOzs7Z0NBTGhCLElBQUk7Z0NBQ0osSUFBSTtnQ0FDSixLQUFLO2dDQUNMLE1BQU07Z0NBQ04sR0FBRztnQ0FDSCxZQUFZOzs7Ozs7O0FBUWQsTUFBTSxPQUFnQixTQUFTO0NBRTlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEEgU2VjdXJpdHlDb250ZXh0IG1hcmtzIGEgbG9jYXRpb24gdGhhdCBoYXMgZGFuZ2Vyb3VzIHNlY3VyaXR5IGltcGxpY2F0aW9ucywgZS5nLiBhIERPTSBwcm9wZXJ0eVxuICogbGlrZSBgaW5uZXJIVE1MYCB0aGF0IGNvdWxkIGNhdXNlIENyb3NzIFNpdGUgU2NyaXB0aW5nIChYU1MpIHNlY3VyaXR5IGJ1Z3Mgd2hlbiBpbXByb3Blcmx5XG4gKiBoYW5kbGVkLlxuICpcbiAqIFNlZSBEb21TYW5pdGl6ZXIgZm9yIG1vcmUgZGV0YWlscyBvbiBzZWN1cml0eSBpbiBBbmd1bGFyIGFwcGxpY2F0aW9ucy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBlbnVtIFNlY3VyaXR5Q29udGV4dCB7XG4gIE5PTkUgPSAwLFxuICBIVE1MID0gMSxcbiAgU1RZTEUgPSAyLFxuICBTQ1JJUFQgPSAzLFxuICBVUkwgPSA0LFxuICBSRVNPVVJDRV9VUkwgPSA1LFxufVxuXG4vKipcbiAqIFNhbml0aXplciBpcyB1c2VkIGJ5IHRoZSB2aWV3cyB0byBzYW5pdGl6ZSBwb3RlbnRpYWxseSBkYW5nZXJvdXMgdmFsdWVzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNhbml0aXplciB7XG4gIGFic3RyYWN0IHNhbml0aXplKGNvbnRleHQ6IFNlY3VyaXR5Q29udGV4dCwgdmFsdWU6IHt9fHN0cmluZ3xudWxsKTogc3RyaW5nfG51bGw7XG59XG4iXX0=