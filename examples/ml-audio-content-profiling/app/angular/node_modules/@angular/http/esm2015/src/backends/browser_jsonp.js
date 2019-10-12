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
import { Injectable } from '@angular/core';
/** @type {?} */
let _nextRequestId = 0;
/** @type {?} */
export const JSONP_HOME = '__ng_jsonp__';
/** @type {?} */
let _jsonpConnections = null;
/**
 * @return {?}
 */
function _getJsonpConnections() {
    /** @type {?} */
    const w = typeof window == 'object' ? window : {};
    if (_jsonpConnections === null) {
        _jsonpConnections = w[JSONP_HOME] = {};
    }
    return _jsonpConnections;
}
export class BrowserJsonp {
    /**
     * @param {?} url
     * @return {?}
     */
    build(url) {
        /** @type {?} */
        const node = document.createElement('script');
        node.src = url;
        return node;
    }
    /**
     * @return {?}
     */
    nextRequestID() { return `__req${_nextRequestId++}`; }
    /**
     * @param {?} id
     * @return {?}
     */
    requestCallback(id) { return `${JSONP_HOME}.${id}.finished`; }
    /**
     * @param {?} id
     * @param {?} connection
     * @return {?}
     */
    exposeConnection(id, connection) {
        /** @type {?} */
        const connections = _getJsonpConnections();
        connections[id] = connection;
    }
    /**
     * @param {?} id
     * @return {?}
     */
    removeConnection(id) {
        /** @type {?} */
        const connections = _getJsonpConnections();
        connections[id] = null;
    }
    /**
     * @param {?} node
     * @return {?}
     */
    send(node) { document.body.appendChild(/** @type {?} */ ((node))); }
    /**
     * @param {?} node
     * @return {?}
     */
    cleanup(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(/** @type {?} */ ((node)));
        }
    }
}
BrowserJsonp.decorators = [
    { type: Injectable }
];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlcl9qc29ucC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2h0dHAvc3JjL2JhY2tlbmRzL2Jyb3dzZXJfanNvbnAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDOztBQUV6QyxJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7O0FBQ3ZCLGFBQWEsVUFBVSxHQUFHLGNBQWMsQ0FBQzs7QUFDekMsSUFBSSxpQkFBaUIsR0FBOEIsSUFBSSxDQUFDOzs7O0FBRXhELFNBQVMsb0JBQW9COztJQUMzQixNQUFNLENBQUMsR0FBeUIsT0FBTyxNQUFNLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUN4RSxJQUFJLGlCQUFpQixLQUFLLElBQUksRUFBRTtRQUM5QixpQkFBaUIsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDO0tBQ3hDO0lBQ0QsT0FBTyxpQkFBaUIsQ0FBQztDQUMxQjtBQUlELE1BQU0sT0FBTyxZQUFZOzs7OztJQUV2QixLQUFLLENBQUMsR0FBVzs7UUFDZixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsT0FBTyxJQUFJLENBQUM7S0FDYjs7OztJQUVELGFBQWEsS0FBYSxPQUFPLFFBQVEsY0FBYyxFQUFFLEVBQUUsQ0FBQyxFQUFFOzs7OztJQUU5RCxlQUFlLENBQUMsRUFBVSxJQUFZLE9BQU8sR0FBRyxVQUFVLElBQUksRUFBRSxXQUFXLENBQUMsRUFBRTs7Ozs7O0lBRTlFLGdCQUFnQixDQUFDLEVBQVUsRUFBRSxVQUFlOztRQUMxQyxNQUFNLFdBQVcsR0FBRyxvQkFBb0IsRUFBRSxDQUFDO1FBQzNDLFdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUM7S0FDOUI7Ozs7O0lBRUQsZ0JBQWdCLENBQUMsRUFBVTs7UUFDekIsTUFBTSxXQUFXLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQztRQUMzQyxXQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQ3hCOzs7OztJQUdELElBQUksQ0FBQyxJQUFTLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLG1CQUFPLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxFQUFFOzs7OztJQUc1RCxPQUFPLENBQUMsSUFBUztRQUNmLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsbUJBQU8sQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDO1NBQzNDO0tBQ0Y7OztZQS9CRixVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5sZXQgX25leHRSZXF1ZXN0SWQgPSAwO1xuZXhwb3J0IGNvbnN0IEpTT05QX0hPTUUgPSAnX19uZ19qc29ucF9fJztcbmxldCBfanNvbnBDb25uZWN0aW9uczoge1trZXk6IHN0cmluZ106IGFueX18bnVsbCA9IG51bGw7XG5cbmZ1bmN0aW9uIF9nZXRKc29ucENvbm5lY3Rpb25zKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgY29uc3Qgdzoge1trZXk6IHN0cmluZ106IGFueX0gPSB0eXBlb2Ygd2luZG93ID09ICdvYmplY3QnID8gd2luZG93IDoge307XG4gIGlmIChfanNvbnBDb25uZWN0aW9ucyA9PT0gbnVsbCkge1xuICAgIF9qc29ucENvbm5lY3Rpb25zID0gd1tKU09OUF9IT01FXSA9IHt9O1xuICB9XG4gIHJldHVybiBfanNvbnBDb25uZWN0aW9ucztcbn1cblxuLy8gTWFrZSBzdXJlIG5vdCB0byBldmFsdWF0ZSB0aGlzIGluIGEgbm9uLWJyb3dzZXIgZW52aXJvbm1lbnQhXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQnJvd3Nlckpzb25wIHtcbiAgLy8gQ29uc3RydWN0IGEgPHNjcmlwdD4gZWxlbWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgVVJMXG4gIGJ1aWxkKHVybDogc3RyaW5nKTogYW55IHtcbiAgICBjb25zdCBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgbm9kZS5zcmMgPSB1cmw7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBuZXh0UmVxdWVzdElEKCk6IHN0cmluZyB7IHJldHVybiBgX19yZXEke19uZXh0UmVxdWVzdElkKyt9YDsgfVxuXG4gIHJlcXVlc3RDYWxsYmFjayhpZDogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIGAke0pTT05QX0hPTUV9LiR7aWR9LmZpbmlzaGVkYDsgfVxuXG4gIGV4cG9zZUNvbm5lY3Rpb24oaWQ6IHN0cmluZywgY29ubmVjdGlvbjogYW55KSB7XG4gICAgY29uc3QgY29ubmVjdGlvbnMgPSBfZ2V0SnNvbnBDb25uZWN0aW9ucygpO1xuICAgIGNvbm5lY3Rpb25zW2lkXSA9IGNvbm5lY3Rpb247XG4gIH1cblxuICByZW1vdmVDb25uZWN0aW9uKGlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjb25uZWN0aW9ucyA9IF9nZXRKc29ucENvbm5lY3Rpb25zKCk7XG4gICAgY29ubmVjdGlvbnNbaWRdID0gbnVsbDtcbiAgfVxuXG4gIC8vIEF0dGFjaCB0aGUgPHNjcmlwdD4gZWxlbWVudCB0byB0aGUgRE9NXG4gIHNlbmQobm9kZTogYW55KSB7IGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoPE5vZGU+KG5vZGUpKTsgfVxuXG4gIC8vIFJlbW92ZSA8c2NyaXB0PiBlbGVtZW50IGZyb20gdGhlIERPTVxuICBjbGVhbnVwKG5vZGU6IGFueSkge1xuICAgIGlmIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCg8Tm9kZT4obm9kZSkpO1xuICAgIH1cbiAgfVxufVxuIl19