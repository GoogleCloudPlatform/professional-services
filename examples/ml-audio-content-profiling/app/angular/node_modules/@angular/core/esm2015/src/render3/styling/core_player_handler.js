/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
export class CorePlayerHandler {
    constructor() {
        this._players = [];
    }
    /**
     * @return {?}
     */
    flushPlayers() {
        for (let i = 0; i < this._players.length; i++) {
            /** @type {?} */
            const player = this._players[i];
            if (!player.parent && player.state === 0 /* Pending */) {
                player.play();
            }
        }
        this._players.length = 0;
    }
    /**
     * @param {?} player
     * @return {?}
     */
    queuePlayer(player) { this._players.push(player); }
}
if (false) {
    /** @type {?} */
    CorePlayerHandler.prototype._players;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZV9wbGF5ZXJfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy9jb3JlX3BsYXllcl9oYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxNQUFNLE9BQU8saUJBQWlCOzt3QkFDQyxFQUFFOzs7OztJQUUvQixZQUFZO1FBQ1YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztZQUM3QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLG9CQUFzQixFQUFFO2dCQUN4RCxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDZjtTQUNGO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0tBQzFCOzs7OztJQUVELFdBQVcsQ0FBQyxNQUFjLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRTtDQUM1RCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7UGxheVN0YXRlLCBQbGF5ZXIsIFBsYXllckhhbmRsZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcGxheWVyJztcblxuZXhwb3J0IGNsYXNzIENvcmVQbGF5ZXJIYW5kbGVyIGltcGxlbWVudHMgUGxheWVySGFuZGxlciB7XG4gIHByaXZhdGUgX3BsYXllcnM6IFBsYXllcltdID0gW107XG5cbiAgZmx1c2hQbGF5ZXJzKCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fcGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5fcGxheWVyc1tpXTtcbiAgICAgIGlmICghcGxheWVyLnBhcmVudCAmJiBwbGF5ZXIuc3RhdGUgPT09IFBsYXlTdGF0ZS5QZW5kaW5nKSB7XG4gICAgICAgIHBsYXllci5wbGF5KCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3BsYXllcnMubGVuZ3RoID0gMDtcbiAgfVxuXG4gIHF1ZXVlUGxheWVyKHBsYXllcjogUGxheWVyKSB7IHRoaXMuX3BsYXllcnMucHVzaChwbGF5ZXIpOyB9XG59XG4iXX0=