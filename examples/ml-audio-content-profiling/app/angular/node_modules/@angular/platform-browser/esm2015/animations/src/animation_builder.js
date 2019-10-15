/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { AnimationBuilder, AnimationFactory, sequence } from '@angular/animations';
import { Inject, Injectable, RendererFactory2, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
export class BrowserAnimationBuilder extends AnimationBuilder {
    /**
     * @param {?} rootRenderer
     * @param {?} doc
     */
    constructor(rootRenderer, doc) {
        super();
        this._nextAnimationId = 0;
        /** @type {?} */
        const typeData = /** @type {?} */ ({
            id: '0',
            encapsulation: ViewEncapsulation.None,
            styles: [],
            data: { animation: [] }
        });
        this._renderer = /** @type {?} */ (rootRenderer.createRenderer(doc.body, typeData));
    }
    /**
     * @param {?} animation
     * @return {?}
     */
    build(animation) {
        /** @type {?} */
        const id = this._nextAnimationId.toString();
        this._nextAnimationId++;
        /** @type {?} */
        const entry = Array.isArray(animation) ? sequence(animation) : animation;
        issueAnimationCommand(this._renderer, null, id, 'register', [entry]);
        return new BrowserAnimationFactory(id, this._renderer);
    }
}
BrowserAnimationBuilder.decorators = [
    { type: Injectable }
];
/** @nocollapse */
BrowserAnimationBuilder.ctorParameters = () => [
    { type: RendererFactory2 },
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
];
if (false) {
    /** @type {?} */
    BrowserAnimationBuilder.prototype._nextAnimationId;
    /** @type {?} */
    BrowserAnimationBuilder.prototype._renderer;
}
export class BrowserAnimationFactory extends AnimationFactory {
    /**
     * @param {?} _id
     * @param {?} _renderer
     */
    constructor(_id, _renderer) {
        super();
        this._id = _id;
        this._renderer = _renderer;
    }
    /**
     * @param {?} element
     * @param {?=} options
     * @return {?}
     */
    create(element, options) {
        return new RendererAnimationPlayer(this._id, element, options || {}, this._renderer);
    }
}
if (false) {
    /** @type {?} */
    BrowserAnimationFactory.prototype._id;
    /** @type {?} */
    BrowserAnimationFactory.prototype._renderer;
}
export class RendererAnimationPlayer {
    /**
     * @param {?} id
     * @param {?} element
     * @param {?} options
     * @param {?} _renderer
     */
    constructor(id, element, options, _renderer) {
        this.id = id;
        this.element = element;
        this._renderer = _renderer;
        this.parentPlayer = null;
        this._started = false;
        this.totalTime = 0;
        this._command('create', options);
    }
    /**
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    _listen(eventName, callback) {
        return this._renderer.listen(this.element, `@@${this.id}:${eventName}`, callback);
    }
    /**
     * @param {?} command
     * @param {...?} args
     * @return {?}
     */
    _command(command, ...args) {
        return issueAnimationCommand(this._renderer, this.element, this.id, command, args);
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    onDone(fn) { this._listen('done', fn); }
    /**
     * @param {?} fn
     * @return {?}
     */
    onStart(fn) { this._listen('start', fn); }
    /**
     * @param {?} fn
     * @return {?}
     */
    onDestroy(fn) { this._listen('destroy', fn); }
    /**
     * @return {?}
     */
    init() { this._command('init'); }
    /**
     * @return {?}
     */
    hasStarted() { return this._started; }
    /**
     * @return {?}
     */
    play() {
        this._command('play');
        this._started = true;
    }
    /**
     * @return {?}
     */
    pause() { this._command('pause'); }
    /**
     * @return {?}
     */
    restart() { this._command('restart'); }
    /**
     * @return {?}
     */
    finish() { this._command('finish'); }
    /**
     * @return {?}
     */
    destroy() { this._command('destroy'); }
    /**
     * @return {?}
     */
    reset() { this._command('reset'); }
    /**
     * @param {?} p
     * @return {?}
     */
    setPosition(p) { this._command('setPosition', p); }
    /**
     * @return {?}
     */
    getPosition() { return 0; }
}
if (false) {
    /** @type {?} */
    RendererAnimationPlayer.prototype.parentPlayer;
    /** @type {?} */
    RendererAnimationPlayer.prototype._started;
    /** @type {?} */
    RendererAnimationPlayer.prototype.totalTime;
    /** @type {?} */
    RendererAnimationPlayer.prototype.id;
    /** @type {?} */
    RendererAnimationPlayer.prototype.element;
    /** @type {?} */
    RendererAnimationPlayer.prototype._renderer;
}
/**
 * @param {?} renderer
 * @param {?} element
 * @param {?} id
 * @param {?} command
 * @param {?} args
 * @return {?}
 */
function issueAnimationCommand(renderer, element, id, command, args) {
    return renderer.setProperty(element, `@@${id}:${command}`, args);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uX2J1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9wbGF0Zm9ybS1icm93c2VyL2FuaW1hdGlvbnMvc3JjL2FuaW1hdGlvbl9idWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFPQSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQTZFLFFBQVEsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzVKLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFpQixpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNyRyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFLbkQsTUFBTSxPQUFPLHVCQUF3QixTQUFRLGdCQUFnQjs7Ozs7SUFJM0QsWUFBWSxZQUE4QixFQUFvQixHQUFRO1FBQ3BFLEtBQUssRUFBRSxDQUFDO2dDQUppQixDQUFDOztRQUsxQixNQUFNLFFBQVEscUJBQUc7WUFDZixFQUFFLEVBQUUsR0FBRztZQUNQLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO1lBQ3JDLE1BQU0sRUFBRSxFQUFFO1lBQ1YsSUFBSSxFQUFFLEVBQUMsU0FBUyxFQUFFLEVBQUUsRUFBQztTQUNMLEVBQUM7UUFDbkIsSUFBSSxDQUFDLFNBQVMscUJBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBc0IsQ0FBQSxDQUFDO0tBQ3ZGOzs7OztJQUVELEtBQUssQ0FBQyxTQUFnRDs7UUFDcEQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzVDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDOztRQUN4QixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENB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QUFRLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTs7Ozs7SUFFekMsV0FBVyxDQUFDLENBQVMsSUFBVSxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFOzs7O0lBRWpFLFdBQVcsS0FBYSxPQUFPLENBQUMsQ0FBQyxFQUFFO0NBR3BDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVELFNBQVMscUJBQXFCLENBQzFCLFFBQTJCLEVBQUUsT0FBWSxFQUFFLEVBQVUsRUFBRSxPQUFlLEVBQUUsSUFBVztJQUNyRixPQUFPLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLE9BQU8sRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0NBQ2xFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtBbmltYXRpb25CdWlsZGVyLCBBbmltYXRpb25GYWN0b3J5LCBBbmltYXRpb25NZXRhZGF0YSwgQW5pbWF0aW9uT3B0aW9ucywgQW5pbWF0aW9uUGxheWVyLCBOb29wQW5pbWF0aW9uUGxheWVyLCBzZXF1ZW5jZX0gZnJvbSAnQGFuZ3VsYXIvYW5pbWF0aW9ucyc7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgUmVuZGVyZXJGYWN0b3J5MiwgUmVuZGVyZXJUeXBlMiwgVmlld0VuY2Fwc3VsYXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlcic7XG5cbmltcG9ydCB7QW5pbWF0aW9uUmVuZGVyZXJ9IGZyb20gJy4vYW5pbWF0aW9uX3JlbmRlcmVyJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEJyb3dzZXJBbmltYXRpb25CdWlsZGVyIGV4dGVuZHMgQW5pbWF0aW9uQnVpbGRlciB7XG4gIHByaXZhdGUgX25leHRBbmltYXRpb25JZCA9IDA7XG4gIHByaXZhdGUgX3JlbmRlcmVyOiBBbmltYXRpb25SZW5kZXJlcjtcblxuICBjb25zdHJ1Y3Rvcihyb290UmVuZGVyZXI6IFJlbmRlcmVyRmFjdG9yeTIsIEBJbmplY3QoRE9DVU1FTlQpIGRvYzogYW55KSB7XG4gICAgc3VwZXIoKTtcbiAgICBjb25zdCB0eXBlRGF0YSA9IHtcbiAgICAgIGlkOiAnMCcsXG4gICAgICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICAgICAgc3R5bGVzOiBbXSxcbiAgICAgIGRhdGE6IHthbmltYXRpb246IFtdfVxuICAgIH0gYXMgUmVuZGVyZXJUeXBlMjtcbiAgICB0aGlzLl9yZW5kZXJlciA9IHJvb3RSZW5kZXJlci5jcmVhdGVSZW5kZXJlcihkb2MuYm9keSwgdHlwZURhdGEpIGFzIEFuaW1hdGlvblJlbmRlcmVyO1xuICB9XG5cbiAgYnVpbGQoYW5pbWF0aW9uOiBBbmltYXRpb25NZXRhZGF0YXxBbmltYXRpb25NZXRhZGF0YVtdKTogQW5pbWF0aW9uRmFjdG9yeSB7XG4gICAgY29uc3QgaWQgPSB0aGlzLl9uZXh0QW5pbWF0aW9uSWQudG9TdHJpbmcoKTtcbiAgICB0aGlzLl9uZXh0QW5pbWF0aW9uSWQrKztcbiAgICBjb25zdCBlbnRyeSA9IEFycmF5LmlzQXJyYXkoYW5pbWF0aW9uKSA/IHNlcXVlbmNlKGFuaW1hdGlvbikgOiBhbmltYXRpb247XG4gICAgaXNzdWVBbmltYXRpb25Db21tYW5kKHRoaXMuX3JlbmRlcmVyLCBudWxsLCBpZCwgJ3JlZ2lzdGVyJywgW2VudHJ5XSk7XG4gICAgcmV0dXJuIG5ldyBCcm93c2VyQW5pbWF0aW9uRmFjdG9yeShpZCwgdGhpcy5fcmVuZGVyZXIpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBCcm93c2VyQW5pbWF0aW9uRmFjdG9yeSBleHRlbmRzIEFuaW1hdGlvbkZhY3Rvcnkge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9pZDogc3RyaW5nLCBwcml2YXRlIF9yZW5kZXJlcjogQW5pbWF0aW9uUmVuZGVyZXIpIHsgc3VwZXIoKTsgfVxuXG4gIGNyZWF0ZShlbGVtZW50OiBhbnksIG9wdGlvbnM/OiBBbmltYXRpb25PcHRpb25zKTogQW5pbWF0aW9uUGxheWVyIHtcbiAgICByZXR1cm4gbmV3IFJlbmRlcmVyQW5pbWF0aW9uUGxheWVyKHRoaXMuX2lkLCBlbGVtZW50LCBvcHRpb25zIHx8IHt9LCB0aGlzLl9yZW5kZXJlcik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlbmRlcmVyQW5pbWF0aW9uUGxheWVyIGltcGxlbWVudHMgQW5pbWF0aW9uUGxheWVyIHtcbiAgcHVibGljIHBhcmVudFBsYXllcjogQW5pbWF0aW9uUGxheWVyfG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9zdGFydGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgaWQ6IHN0cmluZywgcHVibGljIGVsZW1lbnQ6IGFueSwgb3B0aW9uczogQW5pbWF0aW9uT3B0aW9ucyxcbiAgICAgIHByaXZhdGUgX3JlbmRlcmVyOiBBbmltYXRpb25SZW5kZXJlcikge1xuICAgIHRoaXMuX2NvbW1hbmQoJ2NyZWF0ZScsIG9wdGlvbnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbGlzdGVuKGV2ZW50TmFtZTogc3RyaW5nLCBjYWxsYmFjazogKGV2ZW50OiBhbnkpID0+IGFueSk6ICgpID0+IHZvaWQge1xuICAgIHJldHVybiB0aGlzLl9yZW5kZXJlci5saXN0ZW4odGhpcy5lbGVtZW50LCBgQEAke3RoaXMuaWR9OiR7ZXZlbnROYW1lfWAsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbW1hbmQoY29tbWFuZDogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgIHJldHVybiBpc3N1ZUFuaW1hdGlvbkNvbW1hbmQodGhpcy5fcmVuZGVyZXIsIHRoaXMuZWxlbWVudCwgdGhpcy5pZCwgY29tbWFuZCwgYXJncyk7XG4gIH1cblxuICBvbkRvbmUoZm46ICgpID0+IHZvaWQpOiB2b2lkIHsgdGhpcy5fbGlzdGVuKCdkb25lJywgZm4pOyB9XG5cbiAgb25TdGFydChmbjogKCkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLl9saXN0ZW4oJ3N0YXJ0JywgZm4pOyB9XG5cbiAgb25EZXN0cm95KGZuOiAoKSA9PiB2b2lkKTogdm9pZCB7IHRoaXMuX2xpc3RlbignZGVzdHJveScsIGZuKTsgfVxuXG4gIGluaXQoKTogdm9pZCB7IHRoaXMuX2NvbW1hbmQoJ2luaXQnKTsgfVxuXG4gIGhhc1N0YXJ0ZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9zdGFydGVkOyB9XG5cbiAgcGxheSgpOiB2b2lkIHtcbiAgICB0aGlzLl9jb21tYW5kKCdwbGF5Jyk7XG4gICAgdGhpcy5fc3RhcnRlZCA9IHRydWU7XG4gIH1cblxuICBwYXVzZSgpOiB2b2lkIHsgdGhpcy5fY29tbWFuZCgncGF1c2UnKTsgfVxuXG4gIHJlc3RhcnQoKTogdm9pZCB7IHRoaXMuX2NvbW1hbmQoJ3Jlc3RhcnQnKTsgfVxuXG4gIGZpbmlzaCgpOiB2b2lkIHsgdGhpcy5fY29tbWFuZCgnZmluaXNoJyk7IH1cblxuICBkZXN0cm95KCk6IHZvaWQgeyB0aGlzLl9jb21tYW5kKCdkZXN0cm95Jyk7IH1cblxuICByZXNldCgpOiB2b2lkIHsgdGhpcy5fY29tbWFuZCgncmVzZXQnKTsgfVxuXG4gIHNldFBvc2l0aW9uKHA6IG51bWJlcik6IHZvaWQgeyB0aGlzLl9jb21tYW5kKCdzZXRQb3NpdGlvbicsIHApOyB9XG5cbiAgZ2V0UG9zaXRpb24oKTogbnVtYmVyIHsgcmV0dXJuIDA7IH1cblxuICBwdWJsaWMgdG90YWxUaW1lID0gMDtcbn1cblxuZnVuY3Rpb24gaXNzdWVBbmltYXRpb25Db21tYW5kKFxuICAgIHJlbmRlcmVyOiBBbmltYXRpb25SZW5kZXJlciwgZWxlbWVudDogYW55LCBpZDogc3RyaW5nLCBjb21tYW5kOiBzdHJpbmcsIGFyZ3M6IGFueVtdKTogYW55IHtcbiAgcmV0dXJuIHJlbmRlcmVyLnNldFByb3BlcnR5KGVsZW1lbnQsIGBAQCR7aWR9OiR7Y29tbWFuZH1gLCBhcmdzKTtcbn1cbiJdfQ==