/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentChecked, OnInit, QueryList, ElementRef } from '@angular/core';
import { MatGridTile } from './grid-tile';
import { Directionality } from '@angular/cdk/bidi';
import { MatGridListBase } from './grid-list-base';
export declare class MatGridList implements MatGridListBase, OnInit, AfterContentChecked {
    private _element;
    private _dir;
    /** Number of columns being rendered. */
    private _cols;
    /** Used for determiningthe position of each tile in the grid. */
    private _tileCoordinator;
    /**
     * Row height value passed in by user. This can be one of three types:
     * - Number value (ex: "100px"):  sets a fixed row height to that value
     * - Ratio value (ex: "4:3"): sets the row height based on width:height ratio
     * - "Fit" mode (ex: "fit"): sets the row height to total height divided by number of rows
     */
    private _rowHeight;
    /** The amount of space between tiles. This will be something like '5px' or '2em'. */
    private _gutter;
    /** Sets position and size styles for a tile */
    private _tileStyler;
    /** Query list of tiles that are being rendered. */
    _tiles: QueryList<MatGridTile>;
    constructor(_element: ElementRef<HTMLElement>, _dir: Directionality);
    /** Amount of columns in the grid list. */
    cols: number;
    /** Size of the grid list's gutter in pixels. */
    gutterSize: string;
    /** Set internal representation of row height from the user-provided value. */
    rowHeight: string | number;
    ngOnInit(): void;
    /**
     * The layout calculation is fairly cheap if nothing changes, so there's little cost
     * to run it frequently.
     */
    ngAfterContentChecked(): void;
    /** Throw a friendly error if cols property is missing */
    private _checkCols;
    /** Default to equal width:height if rowHeight property is missing */
    private _checkRowHeight;
    /** Creates correct Tile Styler subtype based on rowHeight passed in by user */
    private _setTileStyler;
    /** Computes and applies the size and position for all children grid tiles. */
    private _layoutTiles;
    /** Sets style on the main grid-list element, given the style name and value. */
    _setListStyle(style: [string, string | null] | null): void;
}
