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
/**
 * Used for tracking queries (e.g. ViewChild, ContentChild).
 * @record
 */
export function LQueries() { }
/**
 * The parent LQueries instance.
 *
 * When there is a content query, a new LQueries instance is created to avoid mutating any
 * existing LQueries. After we are done searching content children, the parent property allows
 * us to traverse back up to the original LQueries instance to continue to search for matches
 * in the main view.
 * @type {?}
 */
LQueries.prototype.parent;
/**
 * Ask queries to prepare copy of itself. This assures that tracking new queries on content nodes
 * doesn't mutate list of queries tracked on a parent node. We will clone LQueries before
 * constructing content queries.
 * @type {?}
 */
LQueries.prototype.clone;
/**
 * Notify `LQueries` that a new `TNode` has been created and needs to be added to query results
 * if matching query predicate.
 * @type {?}
 */
LQueries.prototype.addNode;
/**
 * Notify `LQueries` that a new LContainer was added to ivy data structures. As a result we need
 * to prepare room for views that might be inserted into this container.
 * @type {?}
 */
LQueries.prototype.container;
/**
 * Notify `LQueries` that a new `LView` has been created. As a result we need to prepare room
 * and collect nodes that match query predicate.
 * @type {?}
 */
LQueries.prototype.createView;
/**
 * Notify `LQueries` that a new `LView` has been added to `LContainer`. As a result all
 * the matching nodes from this view should be added to container's queries.
 * @type {?}
 */
LQueries.prototype.insertView;
/**
 * Notify `LQueries` that an `LView` has been removed from `LContainer`. As a result all
 * the matching nodes from this view should be removed from container's queries.
 * @type {?}
 */
LQueries.prototype.removeView;
/**
 * Add additional `QueryList` to track.
 *
 * \@param queryList `QueryList` to update with changes.
 * \@param predicate Either `Type` or selector array of [key, value] predicates.
 * \@param descend If true the query will recursively apply to the children.
 * \@param read Indicates which token should be read from DI for this query.
 * @type {?}
 */
LQueries.prototype.track;
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvcXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0RUEsYUFBYSw2QkFBNkIsR0FBRyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi8uLi9saW5rZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZX0gZnJvbSAnLi9ub2RlJztcblxuLyoqIFVzZWQgZm9yIHRyYWNraW5nIHF1ZXJpZXMgKGUuZy4gVmlld0NoaWxkLCBDb250ZW50Q2hpbGQpLiAqL1xuZXhwb3J0IGludGVyZmFjZSBMUXVlcmllcyB7XG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IExRdWVyaWVzIGluc3RhbmNlLlxuICAgKlxuICAgKiBXaGVuIHRoZXJlIGlzIGEgY29udGVudCBxdWVyeSwgYSBuZXcgTFF1ZXJpZXMgaW5zdGFuY2UgaXMgY3JlYXRlZCB0byBhdm9pZCBtdXRhdGluZyBhbnlcbiAgICogZXhpc3RpbmcgTFF1ZXJpZXMuIEFmdGVyIHdlIGFyZSBkb25lIHNlYXJjaGluZyBjb250ZW50IGNoaWxkcmVuLCB0aGUgcGFyZW50IHByb3BlcnR5IGFsbG93c1xuICAgKiB1cyB0byB0cmF2ZXJzZSBiYWNrIHVwIHRvIHRoZSBvcmlnaW5hbCBMUXVlcmllcyBpbnN0YW5jZSB0byBjb250aW51ZSB0byBzZWFyY2ggZm9yIG1hdGNoZXNcbiAgICogaW4gdGhlIG1haW4gdmlldy5cbiAgICovXG4gIHBhcmVudDogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogQXNrIHF1ZXJpZXMgdG8gcHJlcGFyZSBjb3B5IG9mIGl0c2VsZi4gVGhpcyBhc3N1cmVzIHRoYXQgdHJhY2tpbmcgbmV3IHF1ZXJpZXMgb24gY29udGVudCBub2Rlc1xuICAgKiBkb2Vzbid0IG11dGF0ZSBsaXN0IG9mIHF1ZXJpZXMgdHJhY2tlZCBvbiBhIHBhcmVudCBub2RlLiBXZSB3aWxsIGNsb25lIExRdWVyaWVzIGJlZm9yZVxuICAgKiBjb25zdHJ1Y3RpbmcgY29udGVudCBxdWVyaWVzLlxuICAgKi9cbiAgY2xvbmUoKTogTFF1ZXJpZXM7XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBgTFF1ZXJpZXNgIHRoYXQgYSBuZXcgYFROb2RlYCBoYXMgYmVlbiBjcmVhdGVkIGFuZCBuZWVkcyB0byBiZSBhZGRlZCB0byBxdWVyeSByZXN1bHRzXG4gICAqIGlmIG1hdGNoaW5nIHF1ZXJ5IHByZWRpY2F0ZS5cbiAgICovXG4gIGFkZE5vZGUodE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpOiBMUXVlcmllc3xudWxsO1xuXG4gIC8qKlxuICAgKiBOb3RpZnkgYExRdWVyaWVzYCB0aGF0IGEgbmV3IExDb250YWluZXIgd2FzIGFkZGVkIHRvIGl2eSBkYXRhIHN0cnVjdHVyZXMuIEFzIGEgcmVzdWx0IHdlIG5lZWRcbiAgICogdG8gcHJlcGFyZSByb29tIGZvciB2aWV3cyB0aGF0IG1pZ2h0IGJlIGluc2VydGVkIGludG8gdGhpcyBjb250YWluZXIuXG4gICAqL1xuICBjb250YWluZXIoKTogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogTm90aWZ5IGBMUXVlcmllc2AgdGhhdCBhIG5ldyBgTFZpZXdgIGhhcyBiZWVuIGNyZWF0ZWQuIEFzIGEgcmVzdWx0IHdlIG5lZWQgdG8gcHJlcGFyZSByb29tXG4gICAqIGFuZCBjb2xsZWN0IG5vZGVzIHRoYXQgbWF0Y2ggcXVlcnkgcHJlZGljYXRlLlxuICAgKi9cbiAgY3JlYXRlVmlldygpOiBMUXVlcmllc3xudWxsO1xuXG4gIC8qKlxuICAgKiBOb3RpZnkgYExRdWVyaWVzYCB0aGF0IGEgbmV3IGBMVmlld2AgaGFzIGJlZW4gYWRkZWQgdG8gYExDb250YWluZXJgLiBBcyBhIHJlc3VsdCBhbGxcbiAgICogdGhlIG1hdGNoaW5nIG5vZGVzIGZyb20gdGhpcyB2aWV3IHNob3VsZCBiZSBhZGRlZCB0byBjb250YWluZXIncyBxdWVyaWVzLlxuICAgKi9cbiAgaW5zZXJ0VmlldyhuZXdWaWV3SW5kZXg6IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBgTFF1ZXJpZXNgIHRoYXQgYW4gYExWaWV3YCBoYXMgYmVlbiByZW1vdmVkIGZyb20gYExDb250YWluZXJgLiBBcyBhIHJlc3VsdCBhbGxcbiAgICogdGhlIG1hdGNoaW5nIG5vZGVzIGZyb20gdGhpcyB2aWV3IHNob3VsZCBiZSByZW1vdmVkIGZyb20gY29udGFpbmVyJ3MgcXVlcmllcy5cbiAgICovXG4gIHJlbW92ZVZpZXcoKTogdm9pZDtcblxuICAvKipcbiAgICogQWRkIGFkZGl0aW9uYWwgYFF1ZXJ5TGlzdGAgdG8gdHJhY2suXG4gICAqXG4gICAqIEBwYXJhbSBxdWVyeUxpc3QgYFF1ZXJ5TGlzdGAgdG8gdXBkYXRlIHdpdGggY2hhbmdlcy5cbiAgICogQHBhcmFtIHByZWRpY2F0ZSBFaXRoZXIgYFR5cGVgIG9yIHNlbGVjdG9yIGFycmF5IG9mIFtrZXksIHZhbHVlXSBwcmVkaWNhdGVzLlxuICAgKiBAcGFyYW0gZGVzY2VuZCBJZiB0cnVlIHRoZSBxdWVyeSB3aWxsIHJlY3Vyc2l2ZWx5IGFwcGx5IHRvIHRoZSBjaGlsZHJlbi5cbiAgICogQHBhcmFtIHJlYWQgSW5kaWNhdGVzIHdoaWNoIHRva2VuIHNob3VsZCBiZSByZWFkIGZyb20gREkgZm9yIHRoaXMgcXVlcnkuXG4gICAqL1xuICB0cmFjazxUPihcbiAgICAgIHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+LCBwcmVkaWNhdGU6IFR5cGU8YW55PnxzdHJpbmdbXSwgZGVzY2VuZD86IGJvb2xlYW4sXG4gICAgICByZWFkPzogVHlwZTxUPik6IHZvaWQ7XG59XG5cbi8vIE5vdGU6IFRoaXMgaGFjayBpcyBuZWNlc3Nhcnkgc28gd2UgZG9uJ3QgZXJyb25lb3VzbHkgZ2V0IGEgY2lyY3VsYXIgZGVwZW5kZW5jeVxuLy8gZmFpbHVyZSBiYXNlZCBvbiB0eXBlcy5cbmV4cG9ydCBjb25zdCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCA9IDE7XG4iXX0=