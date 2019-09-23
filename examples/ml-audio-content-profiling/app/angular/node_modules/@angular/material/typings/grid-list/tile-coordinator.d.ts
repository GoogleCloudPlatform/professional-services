/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { MatGridTile } from './grid-tile';
/**
 * Class for determining, from a list of tiles, the (row, col) position of each of those tiles
 * in the grid. This is necessary (rather than just rendering the tiles in normal document flow)
 * because the tiles can have a rowspan.
 *
 * The positioning algorithm greedily places each tile as soon as it encounters a gap in the grid
 * large enough to accommodate it so that the tiles still render in the same order in which they
 * are given.
 *
 * The basis of the algorithm is the use of an array to track the already placed tiles. Each
 * element of the array corresponds to a column, and the value indicates how many cells in that
 * column are already occupied; zero indicates an empty cell. Moving "down" to the next row
 * decrements each value in the tracking array (indicating that the column is one cell closer to
 * being free).
 *
 * @docs-private
 */
export declare class TileCoordinator {
    /** Tracking array (see class description). */
    tracker: number[];
    /** Index at which the search for the next gap will start. */
    columnIndex: number;
    /** The current row index. */
    rowIndex: number;
    /** Gets the total number of rows occupied by tiles */
    readonly rowCount: number;
    /**
     * Gets the total span of rows occupied by tiles.
     * Ex: A list with 1 row that contains a tile with rowspan 2 will have a total rowspan of 2.
     */
    readonly rowspan: number;
    /** The computed (row, col) position of each tile (the output). */
    positions: TilePosition[];
    /**
     * Updates the tile positions.
     * @param numColumns Amount of columns in the grid.
     */
    update(numColumns: number, tiles: MatGridTile[]): void;
    /** Calculates the row and col position of a tile. */
    private _trackTile;
    /** Finds the next available space large enough to fit the tile. */
    private _findMatchingGap;
    /** Move "down" to the next row. */
    private _nextRow;
    /**
     * Finds the end index (exclusive) of a gap given the index from which to start looking.
     * The gap ends when a non-zero value is found.
     */
    private _findGapEndIndex;
    /** Update the tile tracker to account for the given tile in the given space. */
    private _markTilePosition;
}
/**
 * Simple data structure for tile position (row, col).
 * @docs-private
 */
export declare class TilePosition {
    row: number;
    col: number;
    constructor(row: number, col: number);
}
