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
import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '../dom_tokens';
import { EventManagerPlugin } from './event_manager';
const ɵ0 = function (v) {
    return '__zone_symbol__' + v;
};
/** *
 * Detect if Zone is present. If it is then use simple zone aware 'addEventListener'
 * since Angular can do much more
 * efficient bookkeeping than Zone can, because we have additional information. This speeds up
 * addEventListener by 3x.
  @type {?} */
const __symbol__ = (typeof Zone !== 'undefined') && (/** @type {?} */ (Zone))['__symbol__'] || ɵ0;
/** @type {?} */
const ADD_EVENT_LISTENER = __symbol__('addEventListener');
/** @type {?} */
const REMOVE_EVENT_LISTENER = __symbol__('removeEventListener');
/** @type {?} */
const symbolNames = {};
/** @type {?} */
const FALSE = 'FALSE';
/** @type {?} */
const ANGULAR = 'ANGULAR';
/** @type {?} */
const NATIVE_ADD_LISTENER = 'addEventListener';
/** @type {?} */
const NATIVE_REMOVE_LISTENER = 'removeEventListener';
/** @type {?} */
const stopSymbol = '__zone_symbol__propagationStopped';
/** @type {?} */
const stopMethodSymbol = '__zone_symbol__stopImmediatePropagation';
/** @type {?} */
const blackListedEvents = (typeof Zone !== 'undefined') && (/** @type {?} */ (Zone))[__symbol__('BLACK_LISTED_EVENTS')];
/** @type {?} */
let blackListedMap;
if (blackListedEvents) {
    blackListedMap = {};
    blackListedEvents.forEach(eventName => { blackListedMap[eventName] = eventName; });
}
/** @type {?} */
const isBlackListedEvent = function (eventName) {
    if (!blackListedMap) {
        return false;
    }
    return blackListedMap.hasOwnProperty(eventName);
};
const ɵ1 = isBlackListedEvent;
/**
 * @record
 */
function TaskData() { }
/** @type {?} */
TaskData.prototype.zone;
/** @type {?} */
TaskData.prototype.handler;
/** @type {?} */
const globalListener = function (event) {
    /** @type {?} */
    const symbolName = symbolNames[event.type];
    if (!symbolName) {
        return;
    }
    /** @type {?} */
    const taskDatas = this[symbolName];
    if (!taskDatas) {
        return;
    }
    /** @type {?} */
    const args = [event];
    if (taskDatas.length === 1) {
        /** @type {?} */
        const taskData = taskDatas[0];
        if (taskData.zone !== Zone.current) {
            // only use Zone.run when Zone.current not equals to stored zone
            return taskData.zone.run(taskData.handler, this, args);
        }
        else {
            return taskData.handler.apply(this, args);
        }
    }
    else {
        /** @type {?} */
        const copiedTasks = taskDatas.slice();
        for (let i = 0; i < copiedTasks.length; i++) {
            // if other listener call event.stopImmediatePropagation
            // just break
            if ((/** @type {?} */ (event))[stopSymbol] === true) {
                break;
            }
            /** @type {?} */
            const taskData = copiedTasks[i];
            if (taskData.zone !== Zone.current) {
                // only use Zone.run when Zone.current not equals to stored zone
                taskData.zone.run(taskData.handler, this, args);
            }
            else {
                taskData.handler.apply(this, args);
            }
        }
    }
};
const ɵ2 = globalListener;
export class DomEventsPlugin extends EventManagerPlugin {
    /**
     * @param {?} doc
     * @param {?} ngZone
     * @param {?} platformId
     */
    constructor(doc, ngZone, platformId) {
        super(doc);
        this.ngZone = ngZone;
        if (!platformId || !isPlatformServer(platformId)) {
            this.patchEvent();
        }
    }
    /**
     * @return {?}
     */
    patchEvent() {
        if (typeof Event === 'undefined' || !Event || !Event.prototype) {
            return;
        }
        if ((/** @type {?} */ (Event.prototype))[stopMethodSymbol]) {
            // already patched by zone.js
            return;
        }
        /** @type {?} */
        const delegate = (/** @type {?} */ (Event.prototype))[stopMethodSymbol] =
            Event.prototype.stopImmediatePropagation;
        Event.prototype.stopImmediatePropagation = function () {
            if (this) {
                this[stopSymbol] = true;
            }
            // should call native delegate in case
            // in some environment part of the application
            // will not use the patched Event
            delegate && delegate.apply(this, arguments);
        };
    }
    /**
     * @param {?} eventName
     * @return {?}
     */
    supports(eventName) { return true; }
    /**
     * @param {?} element
     * @param {?} eventName
     * @param {?} handler
     * @return {?}
     */
    addEventListener(element, eventName, handler) {
        /** *
         * This code is about to add a listener to the DOM. If Zone.js is present, than
         * `addEventListener` has been patched. The patched code adds overhead in both
         * memory and speed (3x slower) than native. For this reason if we detect that
         * Zone.js is present we use a simple version of zone aware addEventListener instead.
         * The result is faster registration and the zone will be restored.
         * But ZoneSpec.onScheduleTask, ZoneSpec.onInvokeTask, ZoneSpec.onCancelTask
         * will not be invoked
         * We also do manual zone restoration in element.ts renderEventHandlerClosure method.
         *
         * NOTE: it is possible that the element is from different iframe, and so we
         * have to check before we execute the method.
          @type {?} */
        const self = this;
        /** @type {?} */
        const zoneJsLoaded = element[ADD_EVENT_LISTENER];
        /** @type {?} */
        let callback = /** @type {?} */ (handler);
        // if zonejs is loaded and current zone is not ngZone
        // we keep Zone.current on target for later restoration.
        if (zoneJsLoaded && (!NgZone.isInAngularZone() || isBlackListedEvent(eventName))) {
            /** @type {?} */
            let symbolName = symbolNames[eventName];
            if (!symbolName) {
                symbolName = symbolNames[eventName] = __symbol__(ANGULAR + eventName + FALSE);
            }
            /** @type {?} */
            let taskDatas = (/** @type {?} */ (element))[symbolName];
            /** @type {?} */
            const globalListenerRegistered = taskDatas && taskDatas.length > 0;
            if (!taskDatas) {
                taskDatas = (/** @type {?} */ (element))[symbolName] = [];
            }
            /** @type {?} */
            const zone = isBlackListedEvent(eventName) ? Zone.root : Zone.current;
            if (taskDatas.length === 0) {
                taskDatas.push({ zone: zone, handler: callback });
            }
            else {
                /** @type {?} */
                let callbackRegistered = false;
                for (let i = 0; i < taskDatas.length; i++) {
                    if (taskDatas[i].handler === callback) {
                        callbackRegistered = true;
                        break;
                    }
                }
                if (!callbackRegistered) {
                    taskDatas.push({ zone: zone, handler: callback });
                }
            }
            if (!globalListenerRegistered) {
                element[ADD_EVENT_LISTENER](eventName, globalListener, false);
            }
        }
        else {
            element[NATIVE_ADD_LISTENER](eventName, callback, false);
        }
        return () => this.removeEventListener(element, eventName, callback);
    }
    /**
     * @param {?} target
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    removeEventListener(target, eventName, callback) {
        /** @type {?} */
        let underlyingRemove = target[REMOVE_EVENT_LISTENER];
        // zone.js not loaded, use native removeEventListener
        if (!underlyingRemove) {
            return target[NATIVE_REMOVE_LISTENER].apply(target, [eventName, callback, false]);
        }
        /** @type {?} */
        let symbolName = symbolNames[eventName];
        /** @type {?} */
        let taskDatas = symbolName && target[symbolName];
        if (!taskDatas) {
            // addEventListener not using patched version
            // just call native removeEventListener
            return target[NATIVE_REMOVE_LISTENER].apply(target, [eventName, callback, false]);
        }
        /** @type {?} */
        let found = false;
        for (let i = 0; i < taskDatas.length; i++) {
            // remove listener from taskDatas if the callback equals
            if (taskDatas[i].handler === callback) {
                found = true;
                taskDatas.splice(i, 1);
                break;
            }
        }
        if (found) {
            if (taskDatas.length === 0) {
                // all listeners are removed, we can remove the globalListener from target
                underlyingRemove.apply(target, [eventName, globalListener, false]);
            }
        }
        else {
            // not found in taskDatas, the callback may be added inside of ngZone
            // use native remove listener to remove the callback
            target[NATIVE_REMOVE_LISTENER].apply(target, [eventName, callback, false]);
        }
    }
}
DomEventsPlugin.decorators = [
    { type: Injectable }
];
/** @nocollapse */
DomEventsPlugin.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: NgZone },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [PLATFORM_ID,] }] }
];
if (false) {
    /** @type {?} */
    DomEventsPlugin.prototype.ngZone;
}
export { ɵ0, ɵ1, ɵ2 };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tX2V2ZW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3BsYXRmb3JtLWJyb3dzZXIvc3JjL2RvbS9ldmVudHMvZG9tX2V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBR2hGLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFdkMsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0saUJBQWlCLENBQUM7V0FTaUIsVUFBUyxDQUFTO0lBQ2hGLE9BQU8saUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0NBQzlCOzs7Ozs7O0FBSEwsTUFBTSxVQUFVLEdBQ1osQ0FBQyxPQUFPLElBQUksS0FBSyxXQUFXLENBQUMsSUFBSSxtQkFBQyxJQUFXLEVBQUMsQ0FBQyxZQUFZLENBQUMsTUFFM0QsQ0FBQzs7QUFDTixNQUFNLGtCQUFrQixHQUF1QixVQUFVLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7QUFDOUUsTUFBTSxxQkFBcUIsR0FBMEIsVUFBVSxDQUFDLHFCQUFxQixDQUFDLENBQUM7O0FBRXZGLE1BQU0sV0FBVyxHQUE0QixFQUFFLENBQUM7O0FBRWhELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQzs7QUFDdEIsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDOztBQUMxQixNQUFNLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDOztBQUMvQyxNQUFNLHNCQUFzQixHQUFHLHFCQUFxQixDQUFDOztBQUdyRCxNQUFNLFVBQVUsR0FBRyxtQ0FBbUMsQ0FBQzs7QUFDdkQsTUFBTSxnQkFBZ0IsR0FBRyx5Q0FBeUMsQ0FBQzs7QUFFbkUsTUFB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Q0QsSUFBSSxLQUFLLEVBQUU7WUFDVCxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFOztnQkFFMUIsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQzthQUNwRTtTQUNGO2FBQU07OztZQUdMLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDNUU7S0FDRjs7O1lBL0hGLFVBQVU7Ozs7NENBR0osTUFBTSxTQUFDLFFBQVE7WUFoR00sTUFBTTs0Q0FpRzNCLFFBQVEsWUFBSSxNQUFNLFNBQUMsV0FBVyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpc1BsYXRmb3JtU2VydmVyfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGUsIE5nWm9uZSwgT3B0aW9uYWwsIFBMQVRGT1JNX0lEfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuXG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICcuLi9kb21fdG9rZW5zJztcblxuaW1wb3J0IHtFdmVudE1hbmFnZXJQbHVnaW59IGZyb20gJy4vZXZlbnRfbWFuYWdlcic7XG5cbi8qKlxuICogRGV0ZWN0IGlmIFpvbmUgaXMgcHJlc2VudC4gSWYgaXQgaXMgdGhlbiB1c2Ugc2ltcGxlIHpvbmUgYXdhcmUgJ2FkZEV2ZW50TGlzdGVuZXInXG4gKiBzaW5jZSBBbmd1bGFyIGNhbiBkbyBtdWNoIG1vcmVcbiAqIGVmZmljaWVudCBib29ra2VlcGluZyB0aGFuIFpvbmUgY2FuLCBiZWNhdXNlIHdlIGhhdmUgYWRkaXRpb25hbCBpbmZvcm1hdGlvbi4gVGhpcyBzcGVlZHMgdXBcbiAqIGFkZEV2ZW50TGlzdGVuZXIgYnkgM3guXG4gKi9cbmNvbnN0IF9fc3ltYm9sX18gPVxuICAgICh0eXBlb2YgWm9uZSAhPT0gJ3VuZGVmaW5lZCcpICYmIChab25lIGFzIGFueSlbJ19fc3ltYm9sX18nXSB8fCBmdW5jdGlvbih2OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgcmV0dXJuICdfX3pvbmVfc3ltYm9sX18nICsgdjtcbiAgICB9O1xuY29uc3QgQUREX0VWRU5UX0xJU1RFTkVSOiAnYWRkRXZlbnRMaXN0ZW5lcicgPSBfX3N5bWJvbF9fKCdhZGRFdmVudExpc3RlbmVyJyk7XG5jb25zdCBSRU1PVkVfRVZFTlRfTElTVEVORVI6ICdyZW1vdmVFdmVudExpc3RlbmVyJyA9IF9fc3ltYm9sX18oJ3JlbW92ZUV2ZW50TGlzdGVuZXInKTtcblxuY29uc3Qgc3ltYm9sTmFtZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG5cbmNvbnN0IEZBTFNFID0gJ0ZBTFNFJztcbmNvbnN0IEFOR1VMQVIgPSAnQU5HVUxBUic7XG5jb25zdCBOQVRJVkVfQUREX0xJU1RFTkVSID0gJ2FkZEV2ZW50TGlzdGVuZXInO1xuY29uc3QgTkFUSVZFX1JFTU9WRV9MSVNURU5FUiA9ICdyZW1vdmVFdmVudExpc3RlbmVyJztcblxuLy8gdXNlIHRoZSBzYW1lIHN5bWJvbCBzdHJpbmcgd2hpY2ggaXMgdXNlZCBpbiB6b25lLmpzXG5jb25zdCBzdG9wU3ltYm9sID0gJ19fem9uZV9zeW1ib2xfX3Byb3BhZ2F0aW9uU3RvcHBlZCc7XG5jb25zdCBzdG9wTWV0aG9kU3ltYm9sID0gJ19fem9uZV9zeW1ib2xfX3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbic7XG5cbmNvbnN0IGJsYWNrTGlzdGVkRXZlbnRzOiBzdHJpbmdbXSA9XG4gICAgKHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJykgJiYgKFpvbmUgYXMgYW55KVtfX3N5bWJvbF9fKCdCTEFDS19MSVNURURfRVZFTlRTJyldO1xubGV0IGJsYWNrTGlzdGVkTWFwOiB7W2V2ZW50TmFtZTogc3RyaW5nXTogc3RyaW5nfTtcbmlmIChibGFja0xpc3RlZEV2ZW50cykge1xuICBibGFja0xpc3RlZE1hcCA9IHt9O1xuICBibGFja0xpc3RlZEV2ZW50cy5mb3JFYWNoKGV2ZW50TmFtZSA9PiB7IGJsYWNrTGlzdGVkTWFwW2V2ZW50TmFtZV0gPSBldmVudE5hbWU7IH0pO1xufVxuXG5jb25zdCBpc0JsYWNrTGlzdGVkRXZlbnQgPSBmdW5jdGlvbihldmVudE5hbWU6IHN0cmluZykge1xuICBpZiAoIWJsYWNrTGlzdGVkTWFwKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBibGFja0xpc3RlZE1hcC5oYXNPd25Qcm9wZXJ0eShldmVudE5hbWUpO1xufTtcblxuaW50ZXJmYWNlIFRhc2tEYXRhIHtcbiAgem9uZTogYW55O1xuICBoYW5kbGVyOiBGdW5jdGlvbjtcbn1cblxuLy8gYSBnbG9iYWwgbGlzdGVuZXIgdG8gaGFuZGxlIGFsbCBkb20gZXZlbnQsXG4vLyBzbyB3ZSBkbyBub3QgbmVlZCB0byBjcmVhdGUgYSBjbG9zdXJlIGV2ZXJ5IHRpbWVcbmNvbnN0IGdsb2JhbExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQ6IEV2ZW50KSB7XG4gIGNvbnN0IHN5bWJvbE5hbWUgPSBzeW1ib2xOYW1lc1tldmVudC50eXBlXTtcbiAgaWYgKCFzeW1ib2xOYW1lKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHRhc2tEYXRhczogVGFza0RhdGFbXSA9IHRoaXNbc3ltYm9sTmFtZV07XG4gIGlmICghdGFza0RhdGFzKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGFyZ3M6IGFueSA9IFtldmVudF07XG4gIGlmICh0YXNrRGF0YXMubGVuZ3RoID09PSAxKSB7XG4gICAgLy8gaWYgdGFza0RhdGFzIG9ubHkgaGF2ZSBvbmUgZWxlbWVudCwganVzdCBpbnZva2UgaXRcbiAgICBjb25zdCB0YXNrRGF0YSA9IHRhc2tEYXRhc1swXTtcbiAgICBpZiAodGFza0RhdGEuem9uZSAhPT0gWm9uZS5jdXJyZW50KSB7XG4gICAgICAvLyBvbmx5IHVzZSBab25lLnJ1biB3aGVuIFpvbmUuY3VycmVudCBub3QgZXF1YWxzIHRvIHN0b3JlZCB6b25lXG4gICAgICByZXR1cm4gdGFza0RhdGEuem9uZS5ydW4odGFza0RhdGEuaGFuZGxlciwgdGhpcywgYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0YXNrRGF0YS5oYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBjb3B5IHRhc2tzIGFzIGEgc25hcHNob3QgdG8gYXZvaWQgZXZlbnQgaGFuZGxlcnMgcmVtb3ZlXG4gICAgLy8gaXRzZWxmIG9yIG90aGVyc1xuICAgIGNvbnN0IGNvcGllZFRhc2tzID0gdGFza0RhdGFzLnNsaWNlKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3BpZWRUYXNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gaWYgb3RoZXIgbGlzdGVuZXIgY2FsbCBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb25cbiAgICAgIC8vIGp1c3QgYnJlYWtcbiAgICAgIGlmICgoZXZlbnQgYXMgYW55KVtzdG9wU3ltYm9sXSA9PT0gdHJ1ZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRhc2tEYXRhID0gY29waWVkVGFza3NbaV07XG4gICAgICBpZiAodGFza0RhdGEuem9uZSAhPT0gWm9uZS5jdXJyZW50KSB7XG4gICAgICAgIC8vIG9ubHkgdXNlIFpvbmUucnVuIHdoZW4gWm9uZS5jdXJyZW50IG5vdCBlcXVhbHMgdG8gc3RvcmVkIHpvbmVcbiAgICAgICAgdGFza0RhdGEuem9uZS5ydW4odGFza0RhdGEuaGFuZGxlciwgdGhpcywgYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXNrRGF0YS5oYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIERvbUV2ZW50c1BsdWdpbiBleHRlbmRzIEV2ZW50TWFuYWdlclBsdWdpbiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgQEluamVjdChET0NVTUVOVCkgZG9jOiBhbnksIHByaXZhdGUgbmdab25lOiBOZ1pvbmUsXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KFBMQVRGT1JNX0lEKSBwbGF0Zm9ybUlkOiB7fXxudWxsKSB7XG4gICAgc3VwZXIoZG9jKTtcblxuICAgIGlmICghcGxhdGZvcm1JZCB8fCAhaXNQbGF0Zm9ybVNlcnZlcihwbGF0Zm9ybUlkKSkge1xuICAgICAgdGhpcy5wYXRjaEV2ZW50KCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaEV2ZW50KCkge1xuICAgIGlmICh0eXBlb2YgRXZlbnQgPT09ICd1bmRlZmluZWQnIHx8ICFFdmVudCB8fCAhRXZlbnQucHJvdG90eXBlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICgoRXZlbnQucHJvdG90eXBlIGFzIGFueSlbc3RvcE1ldGhvZFN5bWJvbF0pIHtcbiAgICAgIC8vIGFscmVhZHkgcGF0Y2hlZCBieSB6b25lLmpzXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGRlbGVnYXRlID0gKEV2ZW50LnByb3RvdHlwZSBhcyBhbnkpW3N0b3BNZXRob2RTeW1ib2xdID1cbiAgICAgICAgRXZlbnQucHJvdG90eXBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbjtcbiAgICBFdmVudC5wcm90b3R5cGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcykge1xuICAgICAgICB0aGlzW3N0b3BTeW1ib2xdID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gc2hvdWxkIGNhbGwgbmF0aXZlIGRlbGVnYXRlIGluIGNhc2VcbiAgICAgIC8vIGluIHNvbWUgZW52aXJvbm1lbnQgcGFydCBvZiB0aGUgYXBwbGljYXRpb25cbiAgICAgIC8vIHdpbGwgbm90IHVzZSB0aGUgcGF0Y2hlZCBFdmVudFxuICAgICAgZGVsZWdhdGUgJiYgZGVsZWdhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gVGhpcyBwbHVnaW4gc2hvdWxkIGNvbWUgbGFzdCBpbiB0aGUgbGlzdCBvZiBwbHVnaW5zLCBiZWNhdXNlIGl0IGFjY2VwdHMgYWxsXG4gIC8vIGV2ZW50cy5cbiAgc3VwcG9ydHMoZXZlbnROYW1lOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIHRydWU7IH1cblxuICBhZGRFdmVudExpc3RlbmVyKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBldmVudE5hbWU6IHN0cmluZywgaGFuZGxlcjogRnVuY3Rpb24pOiBGdW5jdGlvbiB7XG4gICAgLyoqXG4gICAgICogVGhpcyBjb2RlIGlzIGFib3V0IHRvIGFkZCBhIGxpc3RlbmVyIHRvIHRoZSBET00uIElmIFpvbmUuanMgaXMgcHJlc2VudCwgdGhhblxuICAgICAqIGBhZGRFdmVudExpc3RlbmVyYCBoYXMgYmVlbiBwYXRjaGVkLiBUaGUgcGF0Y2hlZCBjb2RlIGFkZHMgb3ZlcmhlYWQgaW4gYm90aFxuICAgICAqIG1lbW9yeSBhbmQgc3BlZWQgKDN4IHNsb3dlcikgdGhhbiBuYXRpdmUuIEZvciB0aGlzIHJlYXNvbiBpZiB3ZSBkZXRlY3QgdGhhdFxuICAgICAqIFpvbmUuanMgaXMgcHJlc2VudCB3ZSB1c2UgYSBzaW1wbGUgdmVyc2lvbiBvZiB6b25lIGF3YXJlIGFkZEV2ZW50TGlzdGVuZXIgaW5zdGVhZC5cbiAgICAgKiBUaGUgcmVzdWx0IGlzIGZhc3RlciByZWdpc3RyYXRpb24gYW5kIHRoZSB6b25lIHdpbGwgYmUgcmVzdG9yZWQuXG4gICAgICogQnV0IFpvbmVTcGVjLm9uU2NoZWR1bGVUYXNrLCBab25lU3BlYy5vbkludm9rZVRhc2ssIFpvbmVTcGVjLm9uQ2FuY2VsVGFza1xuICAgICAqIHdpbGwgbm90IGJlIGludm9rZWRcbiAgICAgKiBXZSBhbHNvIGRvIG1hbnVhbCB6b25lIHJlc3RvcmF0aW9uIGluIGVsZW1lbnQudHMgcmVuZGVyRXZlbnRIYW5kbGVyQ2xvc3VyZSBtZXRob2QuXG4gICAgICpcbiAgICAgKiBOT1RFOiBpdCBpcyBwb3NzaWJsZSB0aGF0IHRoZSBlbGVtZW50IGlzIGZyb20gZGlmZmVyZW50IGlmcmFtZSwgYW5kIHNvIHdlXG4gICAgICogaGF2ZSB0byBjaGVjayBiZWZvcmUgd2UgZXhlY3V0ZSB0aGUgbWV0aG9kLlxuICAgICAqL1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGNvbnN0IHpvbmVKc0xvYWRlZCA9IGVsZW1lbnRbQUREX0VWRU5UX0xJU1RFTkVSXTtcbiAgICBsZXQgY2FsbGJhY2s6IEV2ZW50TGlzdGVuZXIgPSBoYW5kbGVyIGFzIEV2ZW50TGlzdGVuZXI7XG4gICAgLy8gaWYgem9uZWpzIGlzIGxvYWRlZCBhbmQgY3VycmVudCB6b25lIGlzIG5vdCBuZ1pvbmVcbiAgICAvLyB3ZSBrZWVwIFpvbmUuY3VycmVudCBvbiB0YXJnZXQgZm9yIGxhdGVyIHJlc3RvcmF0aW9uLlxuICAgIGlmICh6b25lSnNMb2FkZWQgJiYgKCFOZ1pvbmUuaXNJbkFuZ3VsYXJab25lKCkgfHwgaXNCbGFja0xpc3RlZEV2ZW50KGV2ZW50TmFtZSkpKSB7XG4gICAgICBsZXQgc3ltYm9sTmFtZSA9IHN5bWJvbE5hbWVzW2V2ZW50TmFtZV07XG4gICAgICBpZiAoIXN5bWJvbE5hbWUpIHtcbiAgICAgICAgc3ltYm9sTmFtZSA9IHN5bWJvbE5hbWVzW2V2ZW50TmFtZV0gPSBfX3N5bWJvbF9fKEFOR1VMQVIgKyBldmVudE5hbWUgKyBGQUxTRSk7XG4gICAgICB9XG4gICAgICBsZXQgdGFza0RhdGFzOiBUYXNrRGF0YVtdID0gKGVsZW1lbnQgYXMgYW55KVtzeW1ib2xOYW1lXTtcbiAgICAgIGNvbnN0IGdsb2JhbExpc3RlbmVyUmVnaXN0ZXJlZCA9IHRhc2tEYXRhcyAmJiB0YXNrRGF0YXMubGVuZ3RoID4gMDtcbiAgICAgIGlmICghdGFza0RhdGFzKSB7XG4gICAgICAgIHRhc2tEYXRhcyA9IChlbGVtZW50IGFzIGFueSlbc3ltYm9sTmFtZV0gPSBbXTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgem9uZSA9IGlzQmxhY2tMaXN0ZWRFdmVudChldmVudE5hbWUpID8gWm9uZS5yb290IDogWm9uZS5jdXJyZW50O1xuICAgICAgaWYgKHRhc2tEYXRhcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGFza0RhdGFzLnB1c2goe3pvbmU6IHpvbmUsIGhhbmRsZXI6IGNhbGxiYWNrfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgY2FsbGJhY2tSZWdpc3RlcmVkID0gZmFsc2U7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFza0RhdGFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHRhc2tEYXRhc1tpXS5oYW5kbGVyID09PSBjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tSZWdpc3RlcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNhbGxiYWNrUmVnaXN0ZXJlZCkge1xuICAgICAgICAgIHRhc2tEYXRhcy5wdXNoKHt6b25lOiB6b25lLCBoYW5kbGVyOiBjYWxsYmFja30pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghZ2xvYmFsTGlzdGVuZXJSZWdpc3RlcmVkKSB7XG4gICAgICAgIGVsZW1lbnRbQUREX0VWRU5UX0xJU1RFTkVSXShldmVudE5hbWUsIGdsb2JhbExpc3RlbmVyLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnRbTkFUSVZFX0FERF9MSVNURU5FUl0oZXZlbnROYW1lLCBjYWxsYmFjaywgZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gKCkgPT4gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGVsZW1lbnQsIGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICB9XG5cbiAgcmVtb3ZlRXZlbnRMaXN0ZW5lcih0YXJnZXQ6IGFueSwgZXZlbnROYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiBGdW5jdGlvbik6IHZvaWQge1xuICAgIGxldCB1bmRlcmx5aW5nUmVtb3ZlID0gdGFyZ2V0W1JFTU9WRV9FVkVOVF9MSVNURU5FUl07XG4gICAgLy8gem9uZS5qcyBub3QgbG9hZGVkLCB1c2UgbmF0aXZlIHJlbW92ZUV2ZW50TGlzdGVuZXJcbiAgICBpZiAoIXVuZGVybHlpbmdSZW1vdmUpIHtcbiAgICAgIHJldHVybiB0YXJnZXRbTkFUSVZFX1JFTU9WRV9MSVNURU5FUl0uYXBwbHkodGFyZ2V0LCBbZXZlbnROYW1lLCBjYWxsYmFjaywgZmFsc2VdKTtcbiAgICB9XG4gICAgbGV0IHN5bWJvbE5hbWUgPSBzeW1ib2xOYW1lc1tldmVudE5hbWVdO1xuICAgIGxldCB0YXNrRGF0YXM6IFRhc2tEYXRhW10gPSBzeW1ib2xOYW1lICYmIHRhcmdldFtzeW1ib2xOYW1lXTtcbiAgICBpZiAoIXRhc2tEYXRhcykge1xuICAgICAgLy8gYWRkRXZlbnRMaXN0ZW5lciBub3QgdXNpbmcgcGF0Y2hlZCB2ZXJzaW9uXG4gICAgICAvLyBqdXN0IGNhbGwgbmF0aXZlIHJlbW92ZUV2ZW50TGlzdGVuZXJcbiAgICAgIHJldHVybiB0YXJnZXRbTkFUSVZFX1JFTU9WRV9MSVNURU5FUl0uYXBwbHkodGFyZ2V0LCBbZXZlbnROYW1lLCBjYWxsYmFjaywgZmFsc2VdKTtcbiAgICB9XG4gICAgLy8gZml4IGlzc3VlIDIwNTMyLCBzaG91bGQgYmUgYWJsZSB0byByZW1vdmVcbiAgICAvLyBsaXN0ZW5lciB3aGljaCB3YXMgYWRkZWQgaW5zaWRlIG9mIG5nWm9uZVxuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFza0RhdGFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyByZW1vdmUgbGlzdGVuZXIgZnJvbSB0YXNrRGF0YXMgaWYgdGhlIGNhbGxiYWNrIGVxdWFsc1xuICAgICAgaWYgKHRhc2tEYXRhc1tpXS5oYW5kbGVyID09PSBjYWxsYmFjaykge1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIHRhc2tEYXRhcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZm91bmQpIHtcbiAgICAgIGlmICh0YXNrRGF0YXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vIGFsbCBsaXN0ZW5lcnMgYXJlIHJlbW92ZWQsIHdlIGNhbiByZW1vdmUgdGhlIGdsb2JhbExpc3RlbmVyIGZyb20gdGFyZ2V0XG4gICAgICAgIHVuZGVybHlpbmdSZW1vdmUuYXBwbHkodGFyZ2V0LCBbZXZlbnROYW1lLCBnbG9iYWxMaXN0ZW5lciwgZmFsc2VdKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gbm90IGZvdW5kIGluIHRhc2tEYXRhcywgdGhlIGNhbGxiYWNrIG1heSBiZSBhZGRlZCBpbnNpZGUgb2Ygbmdab25lXG4gICAgICAvLyB1c2UgbmF0aXZlIHJlbW92ZSBsaXN0ZW5lciB0byByZW1vdmUgdGhlIGNhbGxiYWNrXG4gICAgICB0YXJnZXRbTkFUSVZFX1JFTU9WRV9MSVNURU5FUl0uYXBwbHkodGFyZ2V0LCBbZXZlbnROYW1lLCBjYWxsYmFjaywgZmFsc2VdKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==