/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Subject, Subscription } from 'rxjs';
/**
 * Use in directives and components to emit custom events synchronously
 * or asynchronously, and register handlers for those events by subscribing
 * to an instance.
 *
 * @usageNotes
 *
 * In the following example, a component defines two output properties
 * that create event emitters. When the title is clicked, the emitter
 * emits an open or close event to toggle the current visibility state.
 *
 * ```
 * @Component({
 *   selector: 'zippy',
 *   template: `
 *   <div class="zippy">
 *     <div (click)="toggle()">Toggle</div>
 *     <div [hidden]="!visible">
 *       <ng-content></ng-content>
 *     </div>
 *  </div>`})
 * export class Zippy {
 *   visible: boolean = true;
 *   @Output() open: EventEmitter<any> = new EventEmitter();
 *   @Output() close: EventEmitter<any> = new EventEmitter();
 *
 *   toggle() {
 *     this.visible = !this.visible;
 *     if (this.visible) {
 *       this.open.emit(null);
 *     } else {
 *       this.close.emit(null);
 *     }
 *   }
 * }
 * ```
 *
 * Access the event object with the `$event` argument passed to the output event
 * handler:
 *
 * ```
 * <zippy (open)="onOpen($event)" (close)="onClose($event)"></zippy>
 * ```
 *
 * ### Notes
 *
 * Uses Rx.Observable but provides an adapter to make it work as specified here:
 * https://github.com/jhusain/observable-spec
 *
 * Once a reference implementation of the spec is available, switch to it.
 *
 * @publicApi
 */
var EventEmitter = /** @class */ (function (_super) {
    tslib_1.__extends(EventEmitter, _super);
    /**
     * Creates an instance of this class that can
     * deliver events synchronously or asynchronously.
     *
     * @param isAsync When true, deliver events asynchronously.
     *
     */
    function EventEmitter(isAsync) {
        if (isAsync === void 0) { isAsync = false; }
        var _this = _super.call(this) || this;
        _this.__isAsync = isAsync;
        return _this;
    }
    /**
     * Emits an event containing a given value.
     * @param value The value to emit.
     */
    EventEmitter.prototype.emit = function (value) { _super.prototype.next.call(this, value); };
    /**
     * Registers handlers for events emitted by this instance.
     * @param generatorOrNext When supplied, a custom handler for emitted events.
     * @param error When supplied, a custom handler for an error notification
     * from this emitter.
     * @param complete When supplied, a custom handler for a completion
     * notification from this emitter.
     */
    EventEmitter.prototype.subscribe = function (generatorOrNext, error, complete) {
        var schedulerFn;
        var errorFn = function (err) { return null; };
        var completeFn = function () { return null; };
        if (generatorOrNext && typeof generatorOrNext === 'object') {
            schedulerFn = this.__isAsync ? function (value) {
                setTimeout(function () { return generatorOrNext.next(value); });
            } : function (value) { generatorOrNext.next(value); };
            if (generatorOrNext.error) {
                errorFn = this.__isAsync ? function (err) { setTimeout(function () { return generatorOrNext.error(err); }); } :
                    function (err) { generatorOrNext.error(err); };
            }
            if (generatorOrNext.complete) {
                completeFn = this.__isAsync ? function () { setTimeout(function () { return generatorOrNext.complete(); }); } :
                    function () { generatorOrNext.complete(); };
            }
        }
        else {
            schedulerFn = this.__isAsync ? function (value) { setTimeout(function () { return generatorOrNext(value); }); } :
                function (value) { generatorOrNext(value); };
            if (error) {
                errorFn =
                    this.__isAsync ? function (err) { setTimeout(function () { return error(err); }); } : function (err) { error(err); };
            }
            if (complete) {
                completeFn =
                    this.__isAsync ? function () { setTimeout(function () { return complete(); }); } : function () { complete(); };
            }
        }
        var sink = _super.prototype.subscribe.call(this, schedulerFn, errorFn, completeFn);
        if (generatorOrNext instanceof Subscription) {
            generatorOrNext.add(sink);
        }
        return sink;
    };
    return EventEmitter;
}(Subject));
export { EventEmitter };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfZW1pdHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2V2ZW50X2VtaXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRTNDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBb0RHO0FBQ0g7SUFBcUMsd0NBQVU7SUFVN0M7Ozs7OztPQU1HO0lBQ0gsc0JBQVksT0FBd0I7UUFBeEIsd0JBQUEsRUFBQSxlQUF3QjtRQUFwQyxZQUNFLGlCQUFPLFNBRVI7UUFEQyxLQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQzs7SUFDM0IsQ0FBQztJQUVEOzs7T0FHRztJQUNILDJCQUFJLEdBQUosVUFBSyxLQUFTLElBQUksaUJBQU0sSUFBSSxZQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV0Qzs7Ozs7OztPQU9HO0lBQ0gsZ0NBQVMsR0FBVCxVQUFVLGVBQXFCLEVBQUUsS0FBVyxFQUFFLFFBQWM7UUFDMUQsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksT0FBTyxHQUFHLFVBQUMsR0FBUSxJQUFVLE9BQUEsSUFBSSxFQUFKLENBQUksQ0FBQztRQUN0QyxJQUFJLFVBQVUsR0FBRyxjQUFXLE9BQUEsSUFBSSxFQUFKLENBQUksQ0FBQztRQUVqQyxJQUFJLGVBQWUsSUFBSSxPQUFPLGVBQWUsS0FBSyxRQUFRLEVBQUU7WUFDMUQsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQUMsS0FBVTtnQkFDeEMsVUFBVSxDQUFDLGNBQU0sT0FBQSxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUEzQixDQUEyQixDQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFDLEtBQVUsSUFBTyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXJELElBQUksZUFBZSxDQUFDLEtBQUssRUFBRTtnQkFDekIsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQUMsR0FBRyxJQUFPLFVBQVUsQ0FBQyxjQUFNLE9BQUEsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBMUIsQ0FBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVELFVBQUMsR0FBRyxJQUFPLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDckU7WUFFRCxJQUFJLGVBQWUsQ0FBQyxRQUFRLEVBQUU7Z0JBQzVCLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxjQUFRLFVBQVUsQ0FBQyxjQUFNLE9BQUEsZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUExQixDQUEwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDekQsY0FBUSxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDckU7U0FDRjthQUFNO1lBQ0wsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQUMsS0FBVSxJQUFPLFVBQVUsQ0FBQyxjQUFNLE9BQUEsZUFBZSxDQUFDLEtBQUssQ0FBQyxFQUF0QixDQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0QsVUFBQyxLQUFVLElBQU8sZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTNFLElBQUksS0FBSyxFQUFFO2dCQUNULE9BQU87b0JBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBQyxHQUFHLElBQU8sVUFBVSxDQUFDLGNBQU0sT0FBQSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQVYsQ0FBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQUMsR0FBRyxJQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUM1RjtZQUVELElBQUksUUFBUSxFQUFFO2dCQUNaLFVBQVU7b0JBQ04sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsY0FBUSxVQUFVLENBQUMsY0FBTSxPQUFBLFFBQVEsRUFBRSxFQUFWLENBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFRLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3RGO1NBQ0Y7UUFFRCxJQUFNLElBQUksR0FBRyxpQkFBTSxTQUFTLFlBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUUvRCxJQUFJLGVBQWUsWUFBWSxZQUFZLEVBQUU7WUFDM0MsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FBQyxBQTlFRCxDQUFxQyxPQUFPLEdBOEUzQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG4vKipcbiAqIFVzZSBpbiBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzIHRvIGVtaXQgY3VzdG9tIGV2ZW50cyBzeW5jaHJvbm91c2x5XG4gKiBvciBhc3luY2hyb25vdXNseSwgYW5kIHJlZ2lzdGVyIGhhbmRsZXJzIGZvciB0aG9zZSBldmVudHMgYnkgc3Vic2NyaWJpbmdcbiAqIHRvIGFuIGluc3RhbmNlLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCBhIGNvbXBvbmVudCBkZWZpbmVzIHR3byBvdXRwdXQgcHJvcGVydGllc1xuICogdGhhdCBjcmVhdGUgZXZlbnQgZW1pdHRlcnMuIFdoZW4gdGhlIHRpdGxlIGlzIGNsaWNrZWQsIHRoZSBlbWl0dGVyXG4gKiBlbWl0cyBhbiBvcGVuIG9yIGNsb3NlIGV2ZW50IHRvIHRvZ2dsZSB0aGUgY3VycmVudCB2aXNpYmlsaXR5IHN0YXRlLlxuICpcbiAqIGBgYFxuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnemlwcHknLFxuICogICB0ZW1wbGF0ZTogYFxuICogICA8ZGl2IGNsYXNzPVwiemlwcHlcIj5cbiAqICAgICA8ZGl2IChjbGljayk9XCJ0b2dnbGUoKVwiPlRvZ2dsZTwvZGl2PlxuICogICAgIDxkaXYgW2hpZGRlbl09XCIhdmlzaWJsZVwiPlxuICogICAgICAgPG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PlxuICogICAgIDwvZGl2PlxuICogIDwvZGl2PmB9KVxuICogZXhwb3J0IGNsYXNzIFppcHB5IHtcbiAqICAgdmlzaWJsZTogYm9vbGVhbiA9IHRydWU7XG4gKiAgIEBPdXRwdXQoKSBvcGVuOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAqICAgQE91dHB1dCgpIGNsb3NlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAqXG4gKiAgIHRvZ2dsZSgpIHtcbiAqICAgICB0aGlzLnZpc2libGUgPSAhdGhpcy52aXNpYmxlO1xuICogICAgIGlmICh0aGlzLnZpc2libGUpIHtcbiAqICAgICAgIHRoaXMub3Blbi5lbWl0KG51bGwpO1xuICogICAgIH0gZWxzZSB7XG4gKiAgICAgICB0aGlzLmNsb3NlLmVtaXQobnVsbCk7XG4gKiAgICAgfVxuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBBY2Nlc3MgdGhlIGV2ZW50IG9iamVjdCB3aXRoIHRoZSBgJGV2ZW50YCBhcmd1bWVudCBwYXNzZWQgdG8gdGhlIG91dHB1dCBldmVudFxuICogaGFuZGxlcjpcbiAqXG4gKiBgYGBcbiAqIDx6aXBweSAob3Blbik9XCJvbk9wZW4oJGV2ZW50KVwiIChjbG9zZSk9XCJvbkNsb3NlKCRldmVudClcIj48L3ppcHB5PlxuICogYGBgXG4gKlxuICogIyMjIE5vdGVzXG4gKlxuICogVXNlcyBSeC5PYnNlcnZhYmxlIGJ1dCBwcm92aWRlcyBhbiBhZGFwdGVyIHRvIG1ha2UgaXQgd29yayBhcyBzcGVjaWZpZWQgaGVyZTpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9qaHVzYWluL29ic2VydmFibGUtc3BlY1xuICpcbiAqIE9uY2UgYSByZWZlcmVuY2UgaW1wbGVtZW50YXRpb24gb2YgdGhlIHNwZWMgaXMgYXZhaWxhYmxlLCBzd2l0Y2ggdG8gaXQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRFbWl0dGVyPFQ+IGV4dGVuZHMgU3ViamVjdDxUPiB7XG4gIC8vIFRPRE86IG1hcmsgdGhpcyBhcyBpbnRlcm5hbCBvbmNlIGFsbCB0aGUgZmFjYWRlcyBhcmUgZ29uZVxuICAvLyB3ZSBjYW4ndCBtYXJrIGl0IGFzIGludGVybmFsIG5vdyBiZWNhdXNlIEV2ZW50RW1pdHRlciBleHBvcnRlZCB2aWEgQGFuZ3VsYXIvY29yZSB3b3VsZCBub3RcbiAgLy8gY29udGFpbiB0aGlzIHByb3BlcnR5IG1ha2luZyBpdCBpbmNvbXBhdGlibGUgd2l0aCBhbGwgdGhlIGNvZGUgdGhhdCB1c2VzIEV2ZW50RW1pdHRlciB2aWFcbiAgLy8gZmFjYWRlcywgd2hpY2ggYXJlIGxvY2FsIHRvIHRoZSBjb2RlIGFuZCBkbyBub3QgaGF2ZSB0aGlzIHByb3BlcnR5IHN0cmlwcGVkLlxuICAvKipcbiAgICogSW50ZXJuYWxcbiAgICovXG4gIF9faXNBc3luYzogYm9vbGVhbjsgIC8vIHRzbGludDpkaXNhYmxlLWxpbmVcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIHRoYXQgY2FuXG4gICAqIGRlbGl2ZXIgZXZlbnRzIHN5bmNocm9ub3VzbHkgb3IgYXN5bmNocm9ub3VzbHkuXG4gICAqXG4gICAqIEBwYXJhbSBpc0FzeW5jIFdoZW4gdHJ1ZSwgZGVsaXZlciBldmVudHMgYXN5bmNocm9ub3VzbHkuXG4gICAqXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihpc0FzeW5jOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX19pc0FzeW5jID0gaXNBc3luYztcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBhbiBldmVudCBjb250YWluaW5nIGEgZ2l2ZW4gdmFsdWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gZW1pdC5cbiAgICovXG4gIGVtaXQodmFsdWU/OiBUKSB7IHN1cGVyLm5leHQodmFsdWUpOyB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBoYW5kbGVycyBmb3IgZXZlbnRzIGVtaXR0ZWQgYnkgdGhpcyBpbnN0YW5jZS5cbiAgICogQHBhcmFtIGdlbmVyYXRvck9yTmV4dCBXaGVuIHN1cHBsaWVkLCBhIGN1c3RvbSBoYW5kbGVyIGZvciBlbWl0dGVkIGV2ZW50cy5cbiAgICogQHBhcmFtIGVycm9yIFdoZW4gc3VwcGxpZWQsIGEgY3VzdG9tIGhhbmRsZXIgZm9yIGFuIGVycm9yIG5vdGlmaWNhdGlvblxuICAgKiBmcm9tIHRoaXMgZW1pdHRlci5cbiAgICogQHBhcmFtIGNvbXBsZXRlIFdoZW4gc3VwcGxpZWQsIGEgY3VzdG9tIGhhbmRsZXIgZm9yIGEgY29tcGxldGlvblxuICAgKiBub3RpZmljYXRpb24gZnJvbSB0aGlzIGVtaXR0ZXIuXG4gICAqL1xuICBzdWJzY3JpYmUoZ2VuZXJhdG9yT3JOZXh0PzogYW55LCBlcnJvcj86IGFueSwgY29tcGxldGU/OiBhbnkpOiBhbnkge1xuICAgIGxldCBzY2hlZHVsZXJGbjogKHQ6IGFueSkgPT4gYW55O1xuICAgIGxldCBlcnJvckZuID0gKGVycjogYW55KTogYW55ID0+IG51bGw7XG4gICAgbGV0IGNvbXBsZXRlRm4gPSAoKTogYW55ID0+IG51bGw7XG5cbiAgICBpZiAoZ2VuZXJhdG9yT3JOZXh0ICYmIHR5cGVvZiBnZW5lcmF0b3JPck5leHQgPT09ICdvYmplY3QnKSB7XG4gICAgICBzY2hlZHVsZXJGbiA9IHRoaXMuX19pc0FzeW5jID8gKHZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiBnZW5lcmF0b3JPck5leHQubmV4dCh2YWx1ZSkpO1xuICAgICAgfSA6ICh2YWx1ZTogYW55KSA9PiB7IGdlbmVyYXRvck9yTmV4dC5uZXh0KHZhbHVlKTsgfTtcblxuICAgICAgaWYgKGdlbmVyYXRvck9yTmV4dC5lcnJvcikge1xuICAgICAgICBlcnJvckZuID0gdGhpcy5fX2lzQXN5bmMgPyAoZXJyKSA9PiB7IHNldFRpbWVvdXQoKCkgPT4gZ2VuZXJhdG9yT3JOZXh0LmVycm9yKGVycikpOyB9IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVycikgPT4geyBnZW5lcmF0b3JPck5leHQuZXJyb3IoZXJyKTsgfTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdlbmVyYXRvck9yTmV4dC5jb21wbGV0ZSkge1xuICAgICAgICBjb21wbGV0ZUZuID0gdGhpcy5fX2lzQXN5bmMgPyAoKSA9PiB7IHNldFRpbWVvdXQoKCkgPT4gZ2VuZXJhdG9yT3JOZXh0LmNvbXBsZXRlKCkpOyB9IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4geyBnZW5lcmF0b3JPck5leHQuY29tcGxldGUoKTsgfTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2NoZWR1bGVyRm4gPSB0aGlzLl9faXNBc3luYyA/ICh2YWx1ZTogYW55KSA9PiB7IHNldFRpbWVvdXQoKCkgPT4gZ2VuZXJhdG9yT3JOZXh0KHZhbHVlKSk7IH0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh2YWx1ZTogYW55KSA9PiB7IGdlbmVyYXRvck9yTmV4dCh2YWx1ZSk7IH07XG5cbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBlcnJvckZuID1cbiAgICAgICAgICAgIHRoaXMuX19pc0FzeW5jID8gKGVycikgPT4geyBzZXRUaW1lb3V0KCgpID0+IGVycm9yKGVycikpOyB9IDogKGVycikgPT4geyBlcnJvcihlcnIpOyB9O1xuICAgICAgfVxuXG4gICAgICBpZiAoY29tcGxldGUpIHtcbiAgICAgICAgY29tcGxldGVGbiA9XG4gICAgICAgICAgICB0aGlzLl9faXNBc3luYyA/ICgpID0+IHsgc2V0VGltZW91dCgoKSA9PiBjb21wbGV0ZSgpKTsgfSA6ICgpID0+IHsgY29tcGxldGUoKTsgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBzaW5rID0gc3VwZXIuc3Vic2NyaWJlKHNjaGVkdWxlckZuLCBlcnJvckZuLCBjb21wbGV0ZUZuKTtcblxuICAgIGlmIChnZW5lcmF0b3JPck5leHQgaW5zdGFuY2VvZiBTdWJzY3JpcHRpb24pIHtcbiAgICAgIGdlbmVyYXRvck9yTmV4dC5hZGQoc2luayk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNpbms7XG4gIH1cbn1cbiJdfQ==