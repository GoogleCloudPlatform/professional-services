/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable } from 'rxjs';
/**
 * Data source for nested tree.
 *
 * The data source for nested tree doesn't have to consider node flattener, or the way to expand
 * or collapse. The expansion/collapsion will be handled by TreeControl and each non-leaf node.
 */
export declare class MatTreeNestedDataSource<T> extends DataSource<T> {
    _data: BehaviorSubject<T[]>;
    /**
     * Data for the nested tree
     */
    data: T[];
    connect(collectionViewer: CollectionViewer): Observable<T[]>;
    disconnect(): void;
}
