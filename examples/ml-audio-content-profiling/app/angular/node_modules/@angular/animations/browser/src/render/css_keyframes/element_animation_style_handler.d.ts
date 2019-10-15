export declare class ElementAnimationStyleHandler {
    private readonly _element;
    private readonly _name;
    private readonly _duration;
    private readonly _delay;
    private readonly _easing;
    private readonly _fillMode;
    private readonly _onDoneFn;
    private readonly _eventFn;
    private _finished;
    private _destroyed;
    private _startTime;
    private _position;
    constructor(_element: any, _name: string, _duration: number, _delay: number, _easing: string, _fillMode: '' | 'both' | 'forwards', _onDoneFn: () => any);
    apply(): void;
    pause(): void;
    resume(): void;
    setPosition(position: number): void;
    getPosition(): number;
    private _handleCallback;
    finish(): void;
    destroy(): void;
}
