/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { ENTER_CLASSNAME, LEAVE_CLASSNAME, normalizeStyles } from '../util';
import { buildAnimationAst } from './animation_ast_builder';
import { buildAnimationTimelines } from './animation_timeline_builder';
import { ElementInstructionMap } from './element_instruction_map';
export class Animation {
    /**
     * @param {?} _driver
     * @param {?} input
     */
    constructor(_driver, input) {
        this._driver = _driver;
        /** @type {?} */
        const errors = [];
        /** @type {?} */
        const ast = buildAnimationAst(_driver, input, errors);
        if (errors.length) {
            /** @type {?} */
            const errorMessage = `animation validation failed:\n${errors.join("\n")}`;
            throw new Error(errorMessage);
        }
        this._animationAst = ast;
    }
    /**
     * @param {?} element
     * @param {?} startingStyles
     * @param {?} destinationStyles
     * @param {?} options
     * @param {?=} subInstructions
     * @return {?}
     */
    buildTimelines(element, startingStyles, destinationStyles, options, subInstructions) {
        /** @type {?} */
        const start = Array.isArray(startingStyles) ? normalizeStyles(startingStyles) : /** @type {?} */ (startingStyles);
        /** @type {?} */
        const dest = Array.isArray(destinationStyles) ? normalizeStyles(destinationStyles) : /** @type {?} */ (destinationStyles);
        /** @type {?} */
        const errors = [];
        subInstructions = subInstructions || new ElementInstructionMap();
        /** @type {?} */
        const result = buildAnimationTimelines(this._driver, element, this._animationAst, ENTER_CLASSNAME, LEAVE_CLASSNAME, start, dest, options, subInstructions, errors);
        if (errors.length) {
            /** @type {?} */
            const errorMessage = `animation building failed:\n${errors.join("\n")}`;
            throw new Error(errorMessage);
        }
        return result;
    }
}
if (false) {
    /** @type {?} */
    Animation.prototype._animationAst;
    /** @type {?} */
    Animation.prototype._driver;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5pbWF0aW9ucy9icm93c2VyL3NyYy9kc2wvYW5pbWF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFVQSxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHMUUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDMUQsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFckUsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFFaEUsTUFBTSxPQUFPLFNBQVM7Ozs7O0lBRXBCLFlBQW9CLE9BQXdCLEVBQUUsS0FBNEM7UUFBdEUsWUFBTyxHQUFQLE9BQU8sQ0FBaUI7O1FBQzFDLE1BQU0sTUFBTSxHQUFVLEVBQUUsQ0FBQzs7UUFDekIsTUFBTSxHQUFHLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN0RCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7O1lBQ2pCLE1BQU0sWUFBWSxHQUFHLGlDQUFpQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDMUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUMvQjtRQUNELElBQUksQ0FBQyxhQUFhLEdBQUcsR0FBRyxDQUFDO0tBQzFCOzs7Ozs7Ozs7SUFFRCxjQUFjLENBQ1YsT0FBWSxFQUFFLGNBQXVDLEVBQ3JELGlCQUEwQyxFQUFFLE9BQXlCLEVBQ3JFLGVBQXVDOztRQUN6QyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxtQkFDckIsY0FBYyxDQUFBLENBQUM7O1FBQ3pFLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxtQkFDeEIsaUJBQWlCLENBQUEsQ0FBQzs7UUFDOUUsTUFBTSxNQUFNLEdBQVEsRUFBRSxDQUFDO1FBQ3ZCLGVBQWUsR0FBRyxlQUFlLElBQUksSUFBSSxxQkFBcUIsRUFBRSxDQUFDOztRQUNqRSxNQUFNLE1BQU0sR0FBRyx1QkFBdUIsQ0FDbEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQ3hGLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdEMsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFOztZQUNqQixNQUFNLFlBQVksR0FBRywrQkFBK0IsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3hFLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDL0I7UUFDRCxPQUFPLE1BQU0sQ0FBQztLQUNmO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0FuaW1hdGlvbk1ldGFkYXRhLCBBbmltYXRpb25NZXRhZGF0YVR5cGUsIEFuaW1hdGlvbk9wdGlvbnMsIMm1U3R5bGVEYXRhfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcblxuaW1wb3J0IHtBbmltYXRpb25Ecml2ZXJ9IGZyb20gJy4uL3JlbmRlci9hbmltYXRpb25fZHJpdmVyJztcbmltcG9ydCB7RU5URVJfQ0xBU1NOQU1FLCBMRUFWRV9DTEFTU05BTUUsIG5vcm1hbGl6ZVN0eWxlc30gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7QXN0fSBmcm9tICcuL2FuaW1hdGlvbl9hc3QnO1xuaW1wb3J0IHtidWlsZEFuaW1hdGlvbkFzdH0gZnJvbSAnLi9hbmltYXRpb25fYXN0X2J1aWxkZXInO1xuaW1wb3J0IHtidWlsZEFuaW1hdGlvblRpbWVsaW5lc30gZnJvbSAnLi9hbmltYXRpb25fdGltZWxpbmVfYnVpbGRlcic7XG5pbXBvcnQge0FuaW1hdGlvblRpbWVsaW5lSW5zdHJ1Y3Rpb259IGZyb20gJy4vYW5pbWF0aW9uX3RpbWVsaW5lX2luc3RydWN0aW9uJztcbmltcG9ydCB7RWxlbWVudEluc3RydWN0aW9uTWFwfSBmcm9tICcuL2VsZW1lbnRfaW5zdHJ1Y3Rpb25fbWFwJztcblxuZXhwb3J0IGNsYXNzIEFuaW1hdGlvbiB7XG4gIHByaXZhdGUgX2FuaW1hdGlvbkFzdDogQXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZT47XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2RyaXZlcjogQW5pbWF0aW9uRHJpdmVyLCBpbnB1dDogQW5pbWF0aW9uTWV0YWRhdGF8QW5pbWF0aW9uTWV0YWRhdGFbXSkge1xuICAgIGNvbnN0IGVycm9yczogYW55W10gPSBbXTtcbiAgICBjb25zdCBhc3QgPSBidWlsZEFuaW1hdGlvbkFzdChfZHJpdmVyLCBpbnB1dCwgZXJyb3JzKTtcbiAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gYGFuaW1hdGlvbiB2YWxpZGF0aW9uIGZhaWxlZDpcXG4ke2Vycm9ycy5qb2luKFwiXFxuXCIpfWA7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICB9XG4gICAgdGhpcy5fYW5pbWF0aW9uQXN0ID0gYXN0O1xuICB9XG5cbiAgYnVpbGRUaW1lbGluZXMoXG4gICAgICBlbGVtZW50OiBhbnksIHN0YXJ0aW5nU3R5bGVzOiDJtVN0eWxlRGF0YXzJtVN0eWxlRGF0YVtdLFxuICAgICAgZGVzdGluYXRpb25TdHlsZXM6IMm1U3R5bGVEYXRhfMm1U3R5bGVEYXRhW10sIG9wdGlvbnM6IEFuaW1hdGlvbk9wdGlvbnMsXG4gICAgICBzdWJJbnN0cnVjdGlvbnM/OiBFbGVtZW50SW5zdHJ1Y3Rpb25NYXApOiBBbmltYXRpb25UaW1lbGluZUluc3RydWN0aW9uW10ge1xuICAgIGNvbnN0IHN0YXJ0ID0gQXJyYXkuaXNBcnJheShzdGFydGluZ1N0eWxlcykgPyBub3JtYWxpemVTdHlsZXMoc3RhcnRpbmdTdHlsZXMpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPMm1U3R5bGVEYXRhPnN0YXJ0aW5nU3R5bGVzO1xuICAgIGNvbnN0IGRlc3QgPSBBcnJheS5pc0FycmF5KGRlc3RpbmF0aW9uU3R5bGVzKSA/IG5vcm1hbGl6ZVN0eWxlcyhkZXN0aW5hdGlvblN0eWxlcykgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDzJtVN0eWxlRGF0YT5kZXN0aW5hdGlvblN0eWxlcztcbiAgICBjb25zdCBlcnJvcnM6IGFueSA9IFtdO1xuICAgIHN1Ykluc3RydWN0aW9ucyA9IHN1Ykluc3RydWN0aW9ucyB8fCBuZXcgRWxlbWVudEluc3RydWN0aW9uTWFwKCk7XG4gICAgY29uc3QgcmVzdWx0ID0gYnVpbGRBbmltYXRpb25UaW1lbGluZXMoXG4gICAgICAgIHRoaXMuX2RyaXZlciwgZWxlbWVudCwgdGhpcy5fYW5pbWF0aW9uQXN0LCBFTlRFUl9DTEFTU05BTUUsIExFQVZFX0NMQVNTTkFNRSwgc3RhcnQsIGRlc3QsXG4gICAgICAgIG9wdGlvbnMsIHN1Ykluc3RydWN0aW9ucywgZXJyb3JzKTtcbiAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gYGFuaW1hdGlvbiBidWlsZGluZyBmYWlsZWQ6XFxuJHtlcnJvcnMuam9pbihcIlxcblwiKX1gO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cbiJdfQ==