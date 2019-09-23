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
var RequestMethod = {
    Get: 0,
    Post: 1,
    Put: 2,
    Delete: 3,
    Options: 4,
    Head: 5,
    Patch: 6,
};
export { RequestMethod };
RequestMethod[RequestMethod.Get] = 'Get';
RequestMethod[RequestMethod.Post] = 'Post';
RequestMethod[RequestMethod.Put] = 'Put';
RequestMethod[RequestMethod.Delete] = 'Delete';
RequestMethod[RequestMethod.Options] = 'Options';
RequestMethod[RequestMethod.Head] = 'Head';
RequestMethod[RequestMethod.Patch] = 'Patch';
/** @enum {number} */
var ReadyState = {
    Unsent: 0,
    Open: 1,
    HeadersReceived: 2,
    Loading: 3,
    Done: 4,
    Cancelled: 5,
};
export { ReadyState };
ReadyState[ReadyState.Unsent] = 'Unsent';
ReadyState[ReadyState.Open] = 'Open';
ReadyState[ReadyState.HeadersReceived] = 'HeadersReceived';
ReadyState[ReadyState.Loading] = 'Loading';
ReadyState[ReadyState.Done] = 'Done';
ReadyState[ReadyState.Cancelled] = 'Cancelled';
/** @enum {number} */
var ResponseType = {
    Basic: 0,
    Cors: 1,
    Default: 2,
    Error: 3,
    Opaque: 4,
};
export { ResponseType };
ResponseType[ResponseType.Basic] = 'Basic';
ResponseType[ResponseType.Cors] = 'Cors';
ResponseType[ResponseType.Default] = 'Default';
ResponseType[ResponseType.Error] = 'Error';
ResponseType[ResponseType.Opaque] = 'Opaque';
/** @enum {number} */
var ContentType = {
    NONE: 0,
    JSON: 1,
    FORM: 2,
    FORM_DATA: 3,
    TEXT: 4,
    BLOB: 5,
    ARRAY_BUFFER: 6,
};
export { ContentType };
ContentType[ContentType.NONE] = 'NONE';
ContentType[ContentType.JSON] = 'JSON';
ContentType[ContentType.FORM] = 'FORM';
ContentType[ContentType.FORM_DATA] = 'FORM_DATA';
ContentType[ContentType.TEXT] = 'TEXT';
ContentType[ContentType.BLOB] = 'BLOB';
ContentType[ContentType.ARRAY_BUFFER] = 'ARRAY_BUFFER';
/** @enum {number} */
var ResponseContentType = {
    Text: 0,
    Json: 1,
    ArrayBuffer: 2,
    Blob: 3,
};
export { ResponseContentType };
ResponseContentType[ResponseContentType.Text] = 'Text';
ResponseContentType[ResponseContentType.Json] = 'Json';
ResponseContentType[ResponseContentType.ArrayBuffer] = 'ArrayBuffer';
ResponseContentType[ResponseContentType.Blob] = 'Blob';

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9odHRwL3NyYy9lbnVtcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBY0UsTUFBRztJQUNILE9BQUk7SUFDSixNQUFHO0lBQ0gsU0FBTTtJQUNOLFVBQU87SUFDUCxPQUFJO0lBQ0osUUFBSzs7OzRCQU5MLEdBQUc7NEJBQ0gsSUFBSTs0QkFDSixHQUFHOzRCQUNILE1BQU07NEJBQ04sT0FBTzs0QkFDUCxJQUFJOzRCQUNKLEtBQUs7OztJQVdMLFNBQU07SUFDTixPQUFJO0lBQ0osa0JBQWU7SUFDZixVQUFPO0lBQ1AsT0FBSTtJQUNKLFlBQVM7OztzQkFMVCxNQUFNO3NCQUNOLElBQUk7c0JBQ0osZUFBZTtzQkFDZixPQUFPO3NCQUNQLElBQUk7c0JBQ0osU0FBUzs7O0lBVVQsUUFBSztJQUNMLE9BQUk7SUFDSixVQUFPO0lBQ1AsUUFBSztJQUNMLFNBQU07OzswQkFKTixLQUFLOzBCQUNMLElBQUk7MEJBQ0osT0FBTzswQkFDUCxLQUFLOzBCQUNMLE1BQU07OztJQVFOLE9BQUk7SUFDSixPQUFJO0lBQ0osT0FBSTtJQUNKLFlBQVM7SUFDVCxPQUFJO0lBQ0osT0FBSTtJQUNKLGVBQVk7Ozt3QkFOWixJQUFJO3dCQUNKLElBQUk7d0JBQ0osSUFBSTt3QkFDSixTQUFTO3dCQUNULElBQUk7d0JBQ0osSUFBSTt3QkFDSixZQUFZOzs7SUFTWixPQUFJO0lBQ0osT0FBSTtJQUNKLGNBQVc7SUFDWCxPQUFJOzs7d0NBSEosSUFBSTt3Q0FDSixJQUFJO3dDQUNKLFdBQVc7d0NBQ1gsSUFBSSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBTdXBwb3J0ZWQgaHR0cCBtZXRob2RzLlxuICogQGRlcHJlY2F0ZWQgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9odHRwXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBlbnVtIFJlcXVlc3RNZXRob2Qge1xuICBHZXQsXG4gIFBvc3QsXG4gIFB1dCxcbiAgRGVsZXRlLFxuICBPcHRpb25zLFxuICBIZWFkLFxuICBQYXRjaFxufVxuXG4vKipcbiAqIEFsbCBwb3NzaWJsZSBzdGF0ZXMgaW4gd2hpY2ggYSBjb25uZWN0aW9uIGNhbiBiZSwgYmFzZWQgb25cbiAqIFtTdGF0ZXNdKGh0dHA6Ly93d3cudzMub3JnL1RSL1hNTEh0dHBSZXF1ZXN0LyNzdGF0ZXMpIGZyb20gdGhlIGBYTUxIdHRwUmVxdWVzdGAgc3BlYywgYnV0IHdpdGggYW5cbiAqIGFkZGl0aW9uYWwgXCJDQU5DRUxMRURcIiBzdGF0ZS5cbiAqIEBkZXByZWNhdGVkIHNlZSBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaHR0cFxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZW51bSBSZWFkeVN0YXRlIHtcbiAgVW5zZW50LFxuICBPcGVuLFxuICBIZWFkZXJzUmVjZWl2ZWQsXG4gIExvYWRpbmcsXG4gIERvbmUsXG4gIENhbmNlbGxlZFxufVxuXG4vKipcbiAqIEFjY2VwdGFibGUgcmVzcG9uc2UgdHlwZXMgdG8gYmUgYXNzb2NpYXRlZCB3aXRoIGEge0BsaW5rIFJlc3BvbnNlfSwgYmFzZWQgb25cbiAqIFtSZXNwb25zZVR5cGVdKGh0dHBzOi8vZmV0Y2guc3BlYy53aGF0d2cub3JnLyNyZXNwb25zZXR5cGUpIGZyb20gdGhlIEZldGNoIHNwZWMuXG4gKiBAZGVwcmVjYXRlZCBzZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2h0dHBcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGVudW0gUmVzcG9uc2VUeXBlIHtcbiAgQmFzaWMsXG4gIENvcnMsXG4gIERlZmF1bHQsXG4gIEVycm9yLFxuICBPcGFxdWVcbn1cblxuLyoqXG4gKiBTdXBwb3J0ZWQgY29udGVudCB0eXBlIHRvIGJlIGF1dG9tYXRpY2FsbHkgYXNzb2NpYXRlZCB3aXRoIGEge0BsaW5rIFJlcXVlc3R9LlxuICogQGRlcHJlY2F0ZWQgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9odHRwXG4gKi9cbmV4cG9ydCBlbnVtIENvbnRlbnRUeXBlIHtcbiAgTk9ORSxcbiAgSlNPTixcbiAgRk9STSxcbiAgRk9STV9EQVRBLFxuICBURVhULFxuICBCTE9CLFxuICBBUlJBWV9CVUZGRVJcbn1cblxuLyoqXG4gKiBEZWZpbmUgd2hpY2ggYnVmZmVyIHRvIHVzZSB0byBzdG9yZSB0aGUgcmVzcG9uc2VcbiAqIEBkZXByZWNhdGVkIHNlZSBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaHR0cFxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZW51bSBSZXNwb25zZUNvbnRlbnRUeXBlIHtcbiAgVGV4dCxcbiAgSnNvbixcbiAgQXJyYXlCdWZmZXIsXG4gIEJsb2Jcbn1cbiJdfQ==