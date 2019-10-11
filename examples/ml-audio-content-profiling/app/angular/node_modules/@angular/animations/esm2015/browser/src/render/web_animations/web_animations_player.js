/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { computeStyle } from '../../util';
export class WebAnimationsPlayer {
    /**
     * @param {?} element
     * @param {?} keyframes
     * @param {?} options
     */
    constructor(element, keyframes, options) {
        this.element = element;
        this.keyframes = keyframes;
        this.options = options;
        this._onDoneFns = [];
        this._onStartFns = [];
        this._onDestroyFns = [];
        this._initialized = false;
        this._finished = false;
        this._started = false;
        this._destroyed = false;
        this.time = 0;
        this.parentPlayer = null;
        this.currentSnapshot = {};
        this._duration = /** @type {?} */ (options['duration']);
        this._delay = /** @type {?} */ (options['delay']) || 0;
        this.time = this._duration + this._delay;
    }
    /**
     * @return {?}
     */
    _onFinish() {
        if (!this._finished) {
            this._finished = true;
            this._onDoneFns.forEach(fn => fn());
            this._onDoneFns = [];
        }
    }
    /**
     * @return {?}
     */
    init() {
        this._buildPlayer();
        this._preparePlayerBeforeStart();
    }
    /**
     * @return {?}
     */
    _buildPlayer() {
        if (this._initialized)
            return;
        this._initialized = true;
        /** @type {?} */
        const keyframes = this.keyframes;
        (/** @type {?} */ (this)).domPlayer =
            this._triggerWebAnimation(this.element, keyframes, this.options);
        this._finalKeyframe = keyframes.length ? keyframes[keyframes.length - 1] : {};
        this.domPlayer.addEventListener('finish', () => this._onFinish());
    }
    /**
     * @return {?}
     */
    _preparePlayerBeforeStart() {
        // this is required so that the player doesn't start to animate right away
        if (this._delay) {
            this._resetDomPlayerState();
        }
        else {
            this.domPlayer.pause();
        }
    }
    /**
     * \@internal
     * @param {?} element
     * @param {?} keyframes
     * @param {?} options
     * @return {?}
     */
    _triggerWebAnimation(element, keyframes, options) {
        // jscompiler doesn't seem to know animate is a native property because it's not fully
        // supported yet across common browsers (we polyfill it for Edge/Safari) [CL #143630929]
        return /** @type {?} */ (element['animate'](keyframes, options));
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    onStart(fn) { this._onStartFns.push(fn); }
    /**
     * @param {?} fn
     * @return {?}
     */
    onDone(fn) { this._onDoneFns.push(fn); }
    /**
     * @param {?} fn
     * @return {?}
     */
    onDestroy(fn) { this._onDestroyFns.push(fn); }
    /**
     * @return {?}
     */
    play() {
        this._buildPlayer();
        if (!this.hasStarted()) {
            this._onStartFns.forEach(fn => fn());
            this._onStartFns = [];
            this._started = true;
        }
        this.domPlayer.play();
    }
    /**
     * @return {?}
     */
    pause() {
        this.init();
        this.domPlayer.pause();
    }
    /**
     * @return {?}
     */
    finish() {
        this.init();
        this._onFinish();
        this.domPlayer.finish();
    }
    /**
     * @return {?}
     */
    reset() {
        this._resetDomPlayerState();
        this._destroyed = false;
        this._finished = false;
        this._started = false;
    }
    /**
     * @return {?}
     */
    _resetDomPlayerState() {
        if (this.domPlayer) {
            this.domPlayer.cancel();
        }
    }
    /**
     * @return {?}
     */
    restart() {
        this.reset();
        this.play();
    }
    /**
     * @return {?}
     */
    hasStarted() { return this._started; }
    /**
     * @return {?}
     */
    destroy() {
        if (!this._destroyed) {
            this._destroyed = true;
            this._resetDomPlayerState();
            this._onFinish();
            this._onDestroyFns.forEach(fn => fn());
            this._onDestroyFns = [];
        }
    }
    /**
     * @param {?} p
     * @return {?}
     */
    setPosition(p) { this.domPlayer.currentTime = p * this.time; }
    /**
     * @return {?}
     */
    getPosition() { return this.domPlayer.currentTime / this.time; }
    /**
     * @return {?}
     */
    get totalTime() { return this._delay + this._duration; }
    /**
     * @return {?}
     */
    beforeDestroy() {
        /** @type {?} */
        const styles = {};
        if (this.hasStarted()) {
            Object.keys(this._finalKeyframe).forEach(prop => {
                if (prop != 'offset') {
                    styles[prop] =
                        this._finished ? this._finalKeyframe[prop] : computeStyle(this.element, prop);
                }
            });
        }
        this.currentSnapshot = styles;
    }
    /**
     * \@internal
     * @param {?} phaseName
     * @return {?}
     */
    triggerCallback(phaseName) {
        /** @type {?} */
        const methods = phaseName == 'start' ? this._onStartFns : this._onDoneFns;
        methods.forEach(fn => fn());
        methods.length = 0;
    }
}
if (false) {
    /** @type {?} */
    WebAnimationsPlayer.prototype._onDoneFns;
    /** @type {?} */
    WebAnimationsPlayer.prototype._onStartFns;
    /** @type {?} */
    WebAnimationsPlayer.prototype._onDestroyFns;
    /** @type {?} */
    WebAnimationsPlayer.prototype._duration;
    /** @type {?} */
    WebAnimationsPlayer.prototype._delay;
    /** @type {?} */
    WebAnimationsPlayer.prototype._initialized;
    /** @type {?} */
    WebAnimationsPlayer.prototype._finished;
    /** @type {?} */
    WebAnimationsPlayer.prototype._started;
    /** @type {?} */
    WebAnimationsPlayer.prototype._destroyed;
    /** @type {?} */
    WebAnimationsPlayer.prototype._finalKeyframe;
    /** @type {?} */
    WebAnimationsPlayer.prototype.domPlayer;
    /** @type {?} */
    WebAnimationsPlayer.prototype.time;
    /** @type {?} */
    WebAnimationsPlayer.prototype.parentPlayer;
    /** @type {?} */
    WebAnimationsPlayer.prototype.currentSnapshot;
    /** @type {?} */
    WebAnimationsPlayer.prototype.element;
    /** @type {?} */
    WebAnimationsPlayer.prototype.keyframes;
    /** @type {?} */
    WebAnimationsPlayer.prototype.options;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViX2FuaW1hdGlvbnNfcGxheWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5pbWF0aW9ucy9icm93c2VyL3NyYy9yZW5kZXIvd2ViX2FuaW1hdGlvbnMvd2ViX2FuaW1hdGlvbnNfcGxheWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxPQUFPLEVBQXFFLFlBQVksRUFBYSxNQUFNLFlBQVksQ0FBQztBQUl4SCxNQUFNLE9BQU8sbUJBQW1COzs7Ozs7SUFvQjlCLFlBQ1csU0FBcUIsU0FBNkMsRUFDbEU7UUFEQSxZQUFPLEdBQVAsT0FBTztRQUFjLGNBQVMsR0FBVCxTQUFTLENBQW9DO1FBQ2xFLFlBQU8sR0FBUCxPQUFPOzBCQXJCZSxFQUFFOzJCQUNELEVBQUU7NkJBQ0EsRUFBRTs0QkFHZixLQUFLO3lCQUNSLEtBQUs7d0JBQ04sS0FBSzswQkFDSCxLQUFLO29CQU1aLENBQUM7NEJBRTZCLElBQUk7K0JBQ2lCLEVBQUU7UUFLakUsSUFBSSxDQUFDLFNBQVMscUJBQVcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFBLENBQUM7UUFDN0MsSUFBSSxDQUFDLE1BQU0scUJBQVcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFJLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztLQUMxQzs7OztJQUVPLFNBQVM7UUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNuQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUN0QixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7U0FDdEI7Ozs7O0lBR0gsSUFBSTtRQUNG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LENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDbkY7YUFDRixDQUFDLENBQUM7U0FDSjtRQUNELElBQUksQ0FBQyxlQUFlLEdBQUcsTUFBTSxDQUFDO0tBQy9COzs7Ozs7SUFHRCxlQUFlLENBQUMsU0FBaUI7O1FBQy9CLE1BQU0sT0FBTyxHQUFHLFNBQVMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDMUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDNUIsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7S0FDcEI7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7QW5pbWF0aW9uUGxheWVyfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcblxuaW1wb3J0IHthbGxvd1ByZXZpb3VzUGxheWVyU3R5bGVzTWVyZ2UsIGJhbGFuY2VQcmV2aW91c1N0eWxlc0ludG9LZXlmcmFtZXMsIGNvbXB1dGVTdHlsZSwgY29weVN0eWxlc30gZnJvbSAnLi4vLi4vdXRpbCc7XG5cbmltcG9ydCB7RE9NQW5pbWF0aW9ufSBmcm9tICcuL2RvbV9hbmltYXRpb24nO1xuXG5leHBvcnQgY2xhc3MgV2ViQW5pbWF0aW9uc1BsYXllciBpbXBsZW1lbnRzIEFuaW1hdGlvblBsYXllciB7XG4gIHByaXZhdGUgX29uRG9uZUZuczogRnVuY3Rpb25bXSA9IFtdO1xuICBwcml2YXRlIF9vblN0YXJ0Rm5zOiBGdW5jdGlvbltdID0gW107XG4gIHByaXZhdGUgX29uRGVzdHJveUZuczogRnVuY3Rpb25bXSA9IFtdO1xuICBwcml2YXRlIF9kdXJhdGlvbjogbnVtYmVyO1xuICBwcml2YXRlIF9kZWxheTogbnVtYmVyO1xuICBwcml2YXRlIF9pbml0aWFsaXplZCA9IGZhbHNlO1xuICBwcml2YXRlIF9maW5pc2hlZCA9IGZhbHNlO1xuICBwcml2YXRlIF9zdGFydGVkID0gZmFsc2U7XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IGZhbHNlO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBfZmluYWxLZXlmcmFtZSAhOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyfTtcblxuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHVibGljIHJlYWRvbmx5IGRvbVBsYXllciAhOiBET01BbmltYXRpb247XG4gIHB1YmxpYyB0aW1lID0gMDtcblxuICBwdWJsaWMgcGFyZW50UGxheWVyOiBBbmltYXRpb25QbGF5ZXJ8bnVsbCA9IG51bGw7XG4gIHB1YmxpYyBjdXJyZW50U25hcHNob3Q6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXJ9ID0ge307XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgZWxlbWVudDogYW55LCBwdWJsaWMga2V5ZnJhbWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyfVtdLFxuICAgICAgcHVibGljIG9wdGlvbnM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXJ9KSB7XG4gICAgdGhpcy5fZHVyYXRpb24gPSA8bnVtYmVyPm9wdGlvbnNbJ2R1cmF0aW9uJ107XG4gICAgdGhpcy5fZGVsYXkgPSA8bnVtYmVyPm9wdGlvbnNbJ2RlbGF5J10gfHwgMDtcbiAgICB0aGlzLnRpbWUgPSB0aGlzLl9kdXJhdGlvbiArIHRoaXMuX2RlbGF5O1xuICB9XG5cbiAgcHJpdmF0ZSBfb25GaW5pc2goKSB7XG4gICAgaWYgKCF0aGlzLl9maW5pc2hlZCkge1xuICAgICAgdGhpcy5fZmluaXNoZWQgPSB0cnVlO1xuICAgICAgdGhpcy5fb25Eb25lRm5zLmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgICB0aGlzLl9vbkRvbmVGbnMgPSBbXTtcbiAgICB9XG4gIH1cblxuICBpbml0KCk6IHZvaWQge1xuICAgIHRoaXMuX2J1aWxkUGxheWVyKCk7XG4gICAgdGhpcy5fcHJlcGFyZVBsYXllckJlZm9yZVN0YXJ0KCk7XG4gIH1cblxuICBwcml2YXRlIF9idWlsZFBsYXllcigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHJldHVybjtcbiAgICB0aGlzLl9pbml0aWFsaXplZCA9IHRydWU7XG5cbiAgICBjb25zdCBrZXlmcmFtZXMgPSB0aGlzLmtleWZyYW1lcztcbiAgICAodGhpcyBhc3tkb21QbGF5ZXI6IERPTUFuaW1hdGlvbn0pLmRvbVBsYXllciA9XG4gICAgICAgIHRoaXMuX3RyaWdnZXJXZWJBbmltYXRpb24odGhpcy5lbGVtZW50LCBrZXlmcmFtZXMsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5fZmluYWxLZXlmcmFtZSA9IGtleWZyYW1lcy5sZW5ndGggPyBrZXlmcmFtZXNba2V5ZnJhbWVzLmxlbmd0aCAtIDFdIDoge307XG4gICAgdGhpcy5kb21QbGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignZmluaXNoJywgKCkgPT4gdGhpcy5fb25GaW5pc2goKSk7XG4gIH1cblxuICBwcml2YXRlIF9wcmVwYXJlUGxheWVyQmVmb3JlU3RhcnQoKSB7XG4gICAgLy8gdGhpcyBpcyByZXF1aXJlZCBzbyB0aGF0IHRoZSBwbGF5ZXIgZG9lc24ndCBzdGFydCB0byBhbmltYXRlIHJpZ2h0IGF3YXlcbiAgICBpZiAodGhpcy5fZGVsYXkpIHtcbiAgICAgIHRoaXMuX3Jlc2V0RG9tUGxheWVyU3RhdGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kb21QbGF5ZXIucGF1c2UoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF90cmlnZ2VyV2ViQW5pbWF0aW9uKGVsZW1lbnQ6IGFueSwga2V5ZnJhbWVzOiBhbnlbXSwgb3B0aW9uczogYW55KTogRE9NQW5pbWF0aW9uIHtcbiAgICAvLyBqc2NvbXBpbGVyIGRvZXNuJ3Qgc2VlbSB0byBrbm93IGFuaW1hdGUgaXMgYSBuYXRpdmUgcHJvcGVydHkgYmVjYXVzZSBpdCdzIG5vdCBmdWxseVxuICAgIC8vIHN1cHBvcnRlZCB5ZXQgYWNyb3NzIGNvbW1vbiBicm93c2VycyAod2UgcG9seWZpbGwgaXQgZm9yIEVkZ2UvU2FmYXJpKSBbQ0wgIzE0MzYzMDkyOV1cbiAgICByZXR1cm4gZWxlbWVudFsnYW5pbWF0ZSddKGtleWZyYW1lcywgb3B0aW9ucykgYXMgRE9NQW5pbWF0aW9uO1xuICB9XG5cbiAgb25TdGFydChmbjogKCkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLl9vblN0YXJ0Rm5zLnB1c2goZm4pOyB9XG5cbiAgb25Eb25lKGZuOiAoKSA9PiB2b2lkKTogdm9pZCB7IHRoaXMuX29uRG9uZUZucy5wdXNoKGZuKTsgfVxuXG4gIG9uRGVzdHJveShmbjogKCkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLl9vbkRlc3Ryb3lGbnMucHVzaChmbik7IH1cblxuICBwbGF5KCk6IHZvaWQge1xuICAgIHRoaXMuX2J1aWxkUGxheWVyKCk7XG4gICAgaWYgKCF0aGlzLmhhc1N0YXJ0ZWQoKSkge1xuICAgICAgdGhpcy5fb25TdGFydEZucy5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgICAgdGhpcy5fb25TdGFydEZucyA9IFtdO1xuICAgICAgdGhpcy5fc3RhcnRlZCA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMuZG9tUGxheWVyLnBsYXkoKTtcbiAgfVxuXG4gIHBhdXNlKCk6IHZvaWQge1xuICAgIHRoaXMuaW5pdCgpO1xuICAgIHRoaXMuZG9tUGxheWVyLnBhdXNlKCk7XG4gIH1cblxuICBmaW5pc2goKTogdm9pZCB7XG4gICAgdGhpcy5pbml0KCk7XG4gICAgdGhpcy5fb25GaW5pc2goKTtcbiAgICB0aGlzLmRvbVBsYXllci5maW5pc2goKTtcbiAgfVxuXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0RG9tUGxheWVyU3RhdGUoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9maW5pc2hlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3N0YXJ0ZWQgPSBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX3Jlc2V0RG9tUGxheWVyU3RhdGUoKSB7XG4gICAgaWYgKHRoaXMuZG9tUGxheWVyKSB7XG4gICAgICB0aGlzLmRvbVBsYXllci5jYW5jZWwoKTtcbiAgICB9XG4gIH1cblxuICByZXN0YXJ0KCk6IHZvaWQge1xuICAgIHRoaXMucmVzZXQoKTtcbiAgICB0aGlzLnBsYXkoKTtcbiAgfVxuXG4gIGhhc1N0YXJ0ZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9zdGFydGVkOyB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuX3Jlc2V0RG9tUGxheWVyU3RhdGUoKTtcbiAgICAgIHRoaXMuX29uRmluaXNoKCk7XG4gICAgICB0aGlzLl9vbkRlc3Ryb3lGbnMuZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICAgIHRoaXMuX29uRGVzdHJveUZucyA9IFtdO1xuICAgIH1cbiAgfVxuXG4gIHNldFBvc2l0aW9uKHA6IG51bWJlcik6IHZvaWQgeyB0aGlzLmRvbVBsYXllci5jdXJyZW50VGltZSA9IHAgKiB0aGlzLnRpbWU7IH1cblxuICBnZXRQb3NpdGlvbigpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5kb21QbGF5ZXIuY3VycmVudFRpbWUgLyB0aGlzLnRpbWU7IH1cblxuICBnZXQgdG90YWxUaW1lKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9kZWxheSArIHRoaXMuX2R1cmF0aW9uOyB9XG5cbiAgYmVmb3JlRGVzdHJveSgpIHtcbiAgICBjb25zdCBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXJ9ID0ge307XG4gICAgaWYgKHRoaXMuaGFzU3RhcnRlZCgpKSB7XG4gICAgICBPYmplY3Qua2V5cyh0aGlzLl9maW5hbEtleWZyYW1lKS5mb3JFYWNoKHByb3AgPT4ge1xuICAgICAgICBpZiAocHJvcCAhPSAnb2Zmc2V0Jykge1xuICAgICAgICAgIHN0eWxlc1twcm9wXSA9XG4gICAgICAgICAgICAgIHRoaXMuX2ZpbmlzaGVkID8gdGhpcy5fZmluYWxLZXlmcmFtZVtwcm9wXSA6IGNvbXB1dGVTdHlsZSh0aGlzLmVsZW1lbnQsIHByb3ApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5jdXJyZW50U25hcHNob3QgPSBzdHlsZXM7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIHRyaWdnZXJDYWxsYmFjayhwaGFzZU5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IG1ldGhvZHMgPSBwaGFzZU5hbWUgPT0gJ3N0YXJ0JyA/IHRoaXMuX29uU3RhcnRGbnMgOiB0aGlzLl9vbkRvbmVGbnM7XG4gICAgbWV0aG9kcy5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgIG1ldGhvZHMubGVuZ3RoID0gMDtcbiAgfVxufVxuIl19