/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { AUTO_STYLE } from '@angular/animations';
import { buildAnimationAst } from '../dsl/animation_ast_builder';
import { buildAnimationTimelines } from '../dsl/animation_timeline_builder';
import { ElementInstructionMap } from '../dsl/element_instruction_map';
import { ENTER_CLASSNAME, LEAVE_CLASSNAME } from '../util';
import { getOrSetAsInMap, listenOnPlayer, makeAnimationEvent, normalizeKeyframes, optimizeGroupPlayer } from './shared';
/** @type {?} */
const EMPTY_INSTRUCTION_MAP = new ElementInstructionMap();
export class TimelineAnimationEngine {
    /**
     * @param {?} bodyNode
     * @param {?} _driver
     * @param {?} _normalizer
     */
    constructor(bodyNode, _driver, _normalizer) {
        this.bodyNode = bodyNode;
        this._driver = _driver;
        this._normalizer = _normalizer;
        this._animations = {};
        this._playersById = {};
        this.players = [];
    }
    /**
     * @param {?} id
     * @param {?} metadata
     * @return {?}
     */
    register(id, metadata) {
        /** @type {?} */
        const errors = [];
        /** @type {?} */
        const ast = buildAnimationAst(this._driver, metadata, errors);
        if (errors.length) {
            throw new Error(`Unable to build the animation due to the following errors: ${errors.join("\n")}`);
        }
        else {
            this._animations[id] = ast;
        }
    }
    /**
     * @param {?} i
     * @param {?} preStyles
     * @param {?=} postStyles
     * @return {?}
     */
    _buildPlayer(i, preStyles, postStyles) {
        /** @type {?} */
        const element = i.element;
        /** @type {?} */
        const keyframes = normalizeKeyframes(this._driver, this._normalizer, element, i.keyframes, preStyles, postStyles);
        return this._driver.animate(element, keyframes, i.duration, i.delay, i.easing, [], true);
    }
    /**
     * @param {?} id
     * @param {?} element
     * @param {?=} options
     * @return {?}
     */
    create(id, element, options = {}) {
        /** @type {?} */
        const errors = [];
        /** @type {?} */
        const ast = this._animations[id];
        /** @type {?} */
        let instructions;
        /** @type {?} */
        const autoStylesMap = new Map();
        if (ast) {
            instructions = buildAnimationTimelines(this._driver, element, ast, ENTER_CLASSNAME, LEAVE_CLASSNAME, {}, {}, options, EMPTY_INSTRUCTION_MAP, errors);
            instructions.forEach(inst => {
                /** @type {?} */
                const styles = getOrSetAsInMap(autoStylesMap, inst.element, {});
                inst.postStyleProps.forEach(prop => styles[prop] = null);
            });
        }
        else {
            errors.push('The requested animation doesn\'t exist or has already been destroyed');
            instructions = [];
        }
        if (errors.length) {
            throw new Error(`Unable to create the animation due to the following errors: ${errors.join("\n")}`);
        }
        autoStylesMap.forEach((styles, element) => {
            Object.keys(styles).forEach(prop => { styles[prop] = this._driver.computeStyle(element, prop, AUTO_STYLE); });
        });
        /** @type {?} */
        const players = instructions.map(i => {
            /** @type {?} */
            const styles = autoStylesMap.get(i.element);
            return this._buildPlayer(i, {}, styles);
        });
        /** @type {?} */
        const player = optimizeGroupPlayer(players);
        this._playersById[id] = player;
        player.onDestroy(() => this.destroy(id));
        this.players.push(player);
        return player;
    }
    /**
     * @param {?} id
     * @return {?}
     */
    destroy(id) {
        /** @type {?} */
        const player = this._getPlayer(id);
        player.destroy();
        delete this._playersById[id];
        /** @type {?} */
        const index = this.players.indexOf(player);
        if (index >= 0) {
            this.players.splice(index, 1);
        }
    }
    /**
     * @param {?} id
     * @return {?}
     */
    _getPlayer(id) {
        /** @type {?} */
        const player = this._playersById[id];
        if (!player) {
            throw new Error(`Unable to find the timeline player referenced by ${id}`);
        }
        return player;
    }
    /**
     * @param {?} id
     * @param {?} element
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    listen(id, element, eventName, callback) {
        /** @type {?} */
        const baseEvent = makeAnimationEvent(element, '', '', '');
        listenOnPlayer(this._getPlayer(id), eventName, baseEvent, callback);
        return () => { };
    }
    /**
     * @param {?} id
     * @param {?} element
     * @param {?} command
     * @param {?} args
     * @return {?}
     */
    command(id, element, command, args) {
        if (command == 'register') {
            this.register(id, /** @type {?} */ (args[0]));
            return;
        }
        if (command == 'create') {
            /** @type {?} */
            const options = /** @type {?} */ ((args[0] || {}));
            this.create(id, element, options);
            return;
        }
        /** @type {?} */
        const player = this._getPlayer(id);
        switch (command) {
            case 'play':
                player.play();
                break;
            case 'pause':
                player.pause();
                break;
            case 'reset':
                player.reset();
                break;
            case 'restart':
                player.restart();
                break;
            case 'finish':
                player.finish();
                break;
            case 'init':
                player.init();
                break;
            case 'setPosition':
                player.setPosition(parseFloat(/** @type {?} */ (args[0])));
                break;
            case 'destroy':
                this.destroy(id);
                break;
        }
    }
}
if (false) {
    /** @type {?} */
    TimelineAnimationEngine.prototype._animations;
    /** @type {?} */
    TimelineAnimationEngine.prototype._playersById;
    /** @type {?} */
    TimelineAnimationEngine.prototype.players;
    /** @type {?} */
    TimelineAnimationEngine.prototype.bodyNode;
    /** @type {?} */
    TimelineAnimationEngine.prototype._driver;
    /** @type {?} */
    TimelineAnimationEngine.prototype._normalizer;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZWxpbmVfYW5pbWF0aW9uX2VuZ2luZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuaW1hdGlvbnMvYnJvd3Nlci9zcmMvcmVuZGVyL3RpbWVsaW5lX2FuaW1hdGlvbl9lbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQU9BLE9BQU8sRUFBQyxVQUFVLEVBQTBGLE1BQU0scUJBQXFCLENBQUM7QUFHeEksT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDL0QsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFFMUUsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFFckUsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHekQsT0FBTyxFQUFDLGVBQWUsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7O0FBRXRILE1BQU0scUJBQXFCLEdBQUcsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO0FBRTFELE1BQU0sT0FBTyx1QkFBdUI7Ozs7OztJQUtsQyxZQUNXLFVBQXVCLE9BQXdCLEVBQzlDO1FBREQsYUFBUSxHQUFSLFFBQVE7UUFBZSxZQUFPLEdBQVAsT0FBTyxDQUFpQjtRQUM5QyxnQkFBVyxHQUFYLFdBQVc7MkJBTjJDLEVBQUU7NEJBQ1osRUFBRTt1QkFDdEIsRUFBRTtLQUllOzs7Ozs7SUFFckQsUUFBUSxDQUFDLEVBQVUsRUFBRSxRQUErQzs7UUFDbEUsTUFBTSxNQUFNLEdBQVUsRUFBRSxDQUFDOztRQUN6QixNQUFNLEdBQUcsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM5RCxJQUFJLE1BQU0sQ0FBQyxNQUFN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Z0JBQ2hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxtQkFBQyxJQUFJLENBQUMsQ0FBQyxDQUFXLEVBQUMsQ0FBQyxDQUFDO2dCQUNsRCxNQUFNO1lBQ1IsS0FBSyxTQUFTO2dCQUNaLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2pCLE1BQU07U0FDVDtLQUNGO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0FVVE9fU1RZTEUsIEFuaW1hdGlvbk1ldGFkYXRhLCBBbmltYXRpb25NZXRhZGF0YVR5cGUsIEFuaW1hdGlvbk9wdGlvbnMsIEFuaW1hdGlvblBsYXllciwgybVTdHlsZURhdGF9IGZyb20gJ0Bhbmd1bGFyL2FuaW1hdGlvbnMnO1xuXG5pbXBvcnQge0FzdH0gZnJvbSAnLi4vZHNsL2FuaW1hdGlvbl9hc3QnO1xuaW1wb3J0IHtidWlsZEFuaW1hdGlvbkFzdH0gZnJvbSAnLi4vZHNsL2FuaW1hdGlvbl9hc3RfYnVpbGRlcic7XG5pbXBvcnQge2J1aWxkQW5pbWF0aW9uVGltZWxpbmVzfSBmcm9tICcuLi9kc2wvYW5pbWF0aW9uX3RpbWVsaW5lX2J1aWxkZXInO1xuaW1wb3J0IHtBbmltYXRpb25UaW1lbGluZUluc3RydWN0aW9ufSBmcm9tICcuLi9kc2wvYW5pbWF0aW9uX3RpbWVsaW5lX2luc3RydWN0aW9uJztcbmltcG9ydCB7RWxlbWVudEluc3RydWN0aW9uTWFwfSBmcm9tICcuLi9kc2wvZWxlbWVudF9pbnN0cnVjdGlvbl9tYXAnO1xuaW1wb3J0IHtBbmltYXRpb25TdHlsZU5vcm1hbGl6ZXJ9IGZyb20gJy4uL2RzbC9zdHlsZV9ub3JtYWxpemF0aW9uL2FuaW1hdGlvbl9zdHlsZV9ub3JtYWxpemVyJztcbmltcG9ydCB7RU5URVJfQ0xBU1NOQU1FLCBMRUFWRV9DTEFTU05BTUV9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge0FuaW1hdGlvbkRyaXZlcn0gZnJvbSAnLi9hbmltYXRpb25fZHJpdmVyJztcbmltcG9ydCB7Z2V0T3JTZXRBc0luTWFwLCBsaXN0ZW5PblBsYXllciwgbWFrZUFuaW1hdGlvbkV2ZW50LCBub3JtYWxpemVLZXlmcmFtZXMsIG9wdGltaXplR3JvdXBQbGF5ZXJ9IGZyb20gJy4vc2hhcmVkJztcblxuY29uc3QgRU1QVFlfSU5TVFJVQ1RJT05fTUFQID0gbmV3IEVsZW1lbnRJbnN0cnVjdGlvbk1hcCgpO1xuXG5leHBvcnQgY2xhc3MgVGltZWxpbmVBbmltYXRpb25FbmdpbmUge1xuICBwcml2YXRlIF9hbmltYXRpb25zOiB7W2lkOiBzdHJpbmddOiBBc3Q8QW5pbWF0aW9uTWV0YWRhdGFUeXBlPn0gPSB7fTtcbiAgcHJpdmF0ZSBfcGxheWVyc0J5SWQ6IHtbaWQ6IHN0cmluZ106IEFuaW1hdGlvblBsYXllcn0gPSB7fTtcbiAgcHVibGljIHBsYXllcnM6IEFuaW1hdGlvblBsYXllcltdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgYm9keU5vZGU6IGFueSwgcHJpdmF0ZSBfZHJpdmVyOiBBbmltYXRpb25Ecml2ZXIsXG4gICAgICBwcml2YXRlIF9ub3JtYWxpemVyOiBBbmltYXRpb25TdHlsZU5vcm1hbGl6ZXIpIHt9XG5cbiAgcmVnaXN0ZXIoaWQ6IHN0cmluZywgbWV0YWRhdGE6IEFuaW1hdGlvbk1ldGFkYXRhfEFuaW1hdGlvbk1ldGFkYXRhW10pIHtcbiAgICBjb25zdCBlcnJvcnM6IGFueVtdID0gW107XG4gICAgY29uc3QgYXN0ID0gYnVpbGRBbmltYXRpb25Bc3QodGhpcy5fZHJpdmVyLCBtZXRhZGF0YSwgZXJyb3JzKTtcbiAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBVbmFibGUgdG8gYnVpbGQgdGhlIGFuaW1hdGlvbiBkdWUgdG8gdGhlIGZvbGxvd2luZyBlcnJvcnM6ICR7ZXJyb3JzLmpvaW4oXCJcXG5cIil9YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2FuaW1hdGlvbnNbaWRdID0gYXN0O1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2J1aWxkUGxheWVyKFxuICAgICAgaTogQW5pbWF0aW9uVGltZWxpbmVJbnN0cnVjdGlvbiwgcHJlU3R5bGVzOiDJtVN0eWxlRGF0YSxcbiAgICAgIHBvc3RTdHlsZXM/OiDJtVN0eWxlRGF0YSk6IEFuaW1hdGlvblBsYXllciB7XG4gICAgY29uc3QgZWxlbWVudCA9IGkuZWxlbWVudDtcbiAgICBjb25zdCBrZXlmcmFtZXMgPSBub3JtYWxpemVLZXlmcmFtZXMoXG4gICAgICAgIHRoaXMuX2RyaXZlciwgdGhpcy5fbm9ybWFsaXplciwgZWxlbWVudCwgaS5rZXlmcmFtZXMsIHByZVN0eWxlcywgcG9zdFN0eWxlcyk7XG4gICAgcmV0dXJuIHRoaXMuX2RyaXZlci5hbmltYXRlKGVsZW1lbnQsIGtleWZyYW1lcywgaS5kdXJhdGlvbiwgaS5kZWxheSwgaS5lYXNpbmcsIFtdLCB0cnVlKTtcbiAgfVxuXG4gIGNyZWF0ZShpZDogc3RyaW5nLCBlbGVtZW50OiBhbnksIG9wdGlvbnM6IEFuaW1hdGlvbk9wdGlvbnMgPSB7fSk6IEFuaW1hdGlvblBsYXllciB7XG4gICAgY29uc3QgZXJyb3JzOiBhbnlbXSA9IFtdO1xuICAgIGNvbnN0IGFzdCA9IHRoaXMuX2FuaW1hdGlvbnNbaWRdO1xuICAgIGxldCBpbnN0cnVjdGlvbnM6IEFuaW1hdGlvblRpbWVsaW5lSW5zdHJ1Y3Rpb25bXTtcblxuICAgIGNvbnN0IGF1dG9TdHlsZXNNYXAgPSBuZXcgTWFwPGFueSwgybVTdHlsZURhdGE+KCk7XG5cbiAgICBpZiAoYXN0KSB7XG4gICAgICBpbnN0cnVjdGlvbnMgPSBidWlsZEFuaW1hdGlvblRpbWVsaW5lcyhcbiAgICAgICAgICB0aGlzLl9kcml2ZXIsIGVsZW1lbnQsIGFzdCwgRU5URVJfQ0xBU1NOQU1FLCBMRUFWRV9DTEFTU05BTUUsIHt9LCB7fSwgb3B0aW9ucyxcbiAgICAgICAgICBFTVBUWV9JTlNUUlVDVElPTl9NQVAsIGVycm9ycyk7XG4gICAgICBpbnN0cnVjdGlvbnMuZm9yRWFjaChpbnN0ID0+IHtcbiAgICAgICAgY29uc3Qgc3R5bGVzID0gZ2V0T3JTZXRBc0luTWFwKGF1dG9TdHlsZXNNYXAsIGluc3QuZWxlbWVudCwge30pO1xuICAgICAgICBpbnN0LnBvc3RTdHlsZVByb3BzLmZvckVhY2gocHJvcCA9PiBzdHlsZXNbcHJvcF0gPSBudWxsKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBlcnJvcnMucHVzaCgnVGhlIHJlcXVlc3RlZCBhbmltYXRpb24gZG9lc25cXCd0IGV4aXN0IG9yIGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkJyk7XG4gICAgICBpbnN0cnVjdGlvbnMgPSBbXTtcbiAgICB9XG5cbiAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBVbmFibGUgdG8gY3JlYXRlIHRoZSBhbmltYXRpb24gZHVlIHRvIHRoZSBmb2xsb3dpbmcgZXJyb3JzOiAke2Vycm9ycy5qb2luKFwiXFxuXCIpfWApO1xuICAgIH1cblxuICAgIGF1dG9TdHlsZXNNYXAuZm9yRWFjaCgoc3R5bGVzLCBlbGVtZW50KSA9PiB7XG4gICAgICBPYmplY3Qua2V5cyhzdHlsZXMpLmZvckVhY2goXG4gICAgICAgICAgcHJvcCA9PiB7IHN0eWxlc1twcm9wXSA9IHRoaXMuX2RyaXZlci5jb21wdXRlU3R5bGUoZWxlbWVudCwgcHJvcCwgQVVUT19TVFlMRSk7IH0pO1xuICAgIH0pO1xuXG4gICAgY29uc3QgcGxheWVycyA9IGluc3RydWN0aW9ucy5tYXAoaSA9PiB7XG4gICAgICBjb25zdCBzdHlsZXMgPSBhdXRvU3R5bGVzTWFwLmdldChpLmVsZW1lbnQpO1xuICAgICAgcmV0dXJuIHRoaXMuX2J1aWxkUGxheWVyKGksIHt9LCBzdHlsZXMpO1xuICAgIH0pO1xuICAgIGNvbnN0IHBsYXllciA9IG9wdGltaXplR3JvdXBQbGF5ZXIocGxheWVycyk7XG4gICAgdGhpcy5fcGxheWVyc0J5SWRbaWRdID0gcGxheWVyO1xuICAgIHBsYXllci5vbkRlc3Ryb3koKCkgPT4gdGhpcy5kZXN0cm95KGlkKSk7XG5cbiAgICB0aGlzLnBsYXllcnMucHVzaChwbGF5ZXIpO1xuICAgIHJldHVybiBwbGF5ZXI7XG4gIH1cblxuICBkZXN0cm95KGlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBwbGF5ZXIgPSB0aGlzLl9nZXRQbGF5ZXIoaWQpO1xuICAgIHBsYXllci5kZXN0cm95KCk7XG4gICAgZGVsZXRlIHRoaXMuX3BsYXllcnNCeUlkW2lkXTtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMucGxheWVycy5pbmRleE9mKHBsYXllcik7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHRoaXMucGxheWVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2dldFBsYXllcihpZDogc3RyaW5nKTogQW5pbWF0aW9uUGxheWVyIHtcbiAgICBjb25zdCBwbGF5ZXIgPSB0aGlzLl9wbGF5ZXJzQnlJZFtpZF07XG4gICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGZpbmQgdGhlIHRpbWVsaW5lIHBsYXllciByZWZlcmVuY2VkIGJ5ICR7aWR9YCk7XG4gICAgfVxuICAgIHJldHVybiBwbGF5ZXI7XG4gIH1cblxuICBsaXN0ZW4oaWQ6IHN0cmluZywgZWxlbWVudDogc3RyaW5nLCBldmVudE5hbWU6IHN0cmluZywgY2FsbGJhY2s6IChldmVudDogYW55KSA9PiBhbnkpOlxuICAgICAgKCkgPT4gdm9pZCB7XG4gICAgLy8gdHJpZ2dlck5hbWUsIGZyb21TdGF0ZSwgdG9TdGF0ZSBhcmUgYWxsIGlnbm9yZWQgZm9yIHRpbWVsaW5lIGFuaW1hdGlvbnNcbiAgICBjb25zdCBiYXNlRXZlbnQgPSBtYWtlQW5pbWF0aW9uRXZlbnQoZWxlbWVudCwgJycsICcnLCAnJyk7XG4gICAgbGlzdGVuT25QbGF5ZXIodGhpcy5fZ2V0UGxheWVyKGlkKSwgZXZlbnROYW1lLCBiYXNlRXZlbnQsIGNhbGxiYWNrKTtcbiAgICByZXR1cm4gKCkgPT4ge307XG4gIH1cblxuICBjb21tYW5kKGlkOiBzdHJpbmcsIGVsZW1lbnQ6IGFueSwgY29tbWFuZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IHZvaWQge1xuICAgIGlmIChjb21tYW5kID09ICdyZWdpc3RlcicpIHtcbiAgICAgIHRoaXMucmVnaXN0ZXIoaWQsIGFyZ3NbMF0gYXMgQW5pbWF0aW9uTWV0YWRhdGEgfCBBbmltYXRpb25NZXRhZGF0YVtdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZCA9PSAnY3JlYXRlJykge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IChhcmdzWzBdIHx8IHt9KSBhcyBBbmltYXRpb25PcHRpb25zO1xuICAgICAgdGhpcy5jcmVhdGUoaWQsIGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBsYXllciA9IHRoaXMuX2dldFBsYXllcihpZCk7XG4gICAgc3dpdGNoIChjb21tYW5kKSB7XG4gICAgICBjYXNlICdwbGF5JzpcbiAgICAgICAgcGxheWVyLnBsYXkoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwYXVzZSc6XG4gICAgICAgIHBsYXllci5wYXVzZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3Jlc2V0JzpcbiAgICAgICAgcGxheWVyLnJlc2V0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncmVzdGFydCc6XG4gICAgICAgIHBsYXllci5yZXN0YXJ0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZmluaXNoJzpcbiAgICAgICAgcGxheWVyLmZpbmlzaCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2luaXQnOlxuICAgICAgICBwbGF5ZXIuaW5pdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3NldFBvc2l0aW9uJzpcbiAgICAgICAgcGxheWVyLnNldFBvc2l0aW9uKHBhcnNlRmxvYXQoYXJnc1swXSBhcyBzdHJpbmcpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdkZXN0cm95JzpcbiAgICAgICAgdGhpcy5kZXN0cm95KGlkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59XG4iXX0=