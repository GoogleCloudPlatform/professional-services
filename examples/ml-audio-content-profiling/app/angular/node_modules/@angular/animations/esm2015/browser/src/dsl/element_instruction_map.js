/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
export class ElementInstructionMap {
    constructor() {
        this._map = new Map();
    }
    /**
     * @param {?} element
     * @return {?}
     */
    consume(element) {
        /** @type {?} */
        let instructions = this._map.get(element);
        if (instructions) {
            this._map.delete(element);
        }
        else {
            instructions = [];
        }
        return instructions;
    }
    /**
     * @param {?} element
     * @param {?} instructions
     * @return {?}
     */
    append(element, instructions) {
        /** @type {?} */
        let existingInstructions = this._map.get(element);
        if (!existingInstructions) {
            this._map.set(element, existingInstructions = []);
        }
        existingInstructions.push(...instructions);
    }
    /**
     * @param {?} element
     * @return {?}
     */
    has(element) { return this._map.has(element); }
    /**
     * @return {?}
     */
    clear() { this._map.clear(); }
}
if (false) {
    /** @type {?} */
    ElementInstructionMap.prototype._map;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudF9pbnN0cnVjdGlvbl9tYXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmltYXRpb25zL2Jyb3dzZXIvc3JjL2RzbC9lbGVtZW50X2luc3RydWN0aW9uX21hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBU0EsTUFBTSxPQUFPLHFCQUFxQjs7b0JBQ2pCLElBQUksR0FBRyxFQUF1Qzs7Ozs7O0lBRTdELE9BQU8sQ0FBQyxPQUFZOztRQUNsQixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxQyxJQUFJLFlBQVksRUFBRTtZQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUMzQjthQUFNO1lBQ0wsWUFBWSxHQUFHLEVBQUUsQ0FBQztTQUNuQjtRQUNELE9BQU8sWUFBWSxDQUFDO0tBQ3JCOzs7Ozs7SUFFRCxNQUFNLENBQUMsT0FBWSxFQUFFLFlBQTRDOztRQUMvRCxJQUFJLG9CQUFvQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2xELElBQUksQ0FBQyxvQkFBb0IsRUFBRTtZQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsb0JBQW9CLEdBQUcsRUFBRSxDQUFDLENBQUM7U0FDbkQ7UUFDRCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQztLQUM1Qzs7Ozs7SUFFRCxHQUFHLENBQUMsT0FBWSxJQUFhLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTs7OztJQUU3RCxLQUFLLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFO0NBQy9CIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtBbmltYXRpb25UaW1lbGluZUluc3RydWN0aW9ufSBmcm9tICcuL2FuaW1hdGlvbl90aW1lbGluZV9pbnN0cnVjdGlvbic7XG5cbmV4cG9ydCBjbGFzcyBFbGVtZW50SW5zdHJ1Y3Rpb25NYXAge1xuICBwcml2YXRlIF9tYXAgPSBuZXcgTWFwPGFueSwgQW5pbWF0aW9uVGltZWxpbmVJbnN0cnVjdGlvbltdPigpO1xuXG4gIGNvbnN1bWUoZWxlbWVudDogYW55KTogQW5pbWF0aW9uVGltZWxpbmVJbnN0cnVjdGlvbltdIHtcbiAgICBsZXQgaW5zdHJ1Y3Rpb25zID0gdGhpcy5fbWFwLmdldChlbGVtZW50KTtcbiAgICBpZiAoaW5zdHJ1Y3Rpb25zKSB7XG4gICAgICB0aGlzLl9tYXAuZGVsZXRlKGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnN0cnVjdGlvbnMgPSBbXTtcbiAgICB9XG4gICAgcmV0dXJuIGluc3RydWN0aW9ucztcbiAgfVxuXG4gIGFwcGVuZChlbGVtZW50OiBhbnksIGluc3RydWN0aW9uczogQW5pbWF0aW9uVGltZWxpbmVJbnN0cnVjdGlvbltdKSB7XG4gICAgbGV0IGV4aXN0aW5nSW5zdHJ1Y3Rpb25zID0gdGhpcy5fbWFwLmdldChlbGVtZW50KTtcbiAgICBpZiAoIWV4aXN0aW5nSW5zdHJ1Y3Rpb25zKSB7XG4gICAgICB0aGlzLl9tYXAuc2V0KGVsZW1lbnQsIGV4aXN0aW5nSW5zdHJ1Y3Rpb25zID0gW10pO1xuICAgIH1cbiAgICBleGlzdGluZ0luc3RydWN0aW9ucy5wdXNoKC4uLmluc3RydWN0aW9ucyk7XG4gIH1cblxuICBoYXMoZWxlbWVudDogYW55KTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9tYXAuaGFzKGVsZW1lbnQpOyB9XG5cbiAgY2xlYXIoKSB7IHRoaXMuX21hcC5jbGVhcigpOyB9XG59XG4iXX0=