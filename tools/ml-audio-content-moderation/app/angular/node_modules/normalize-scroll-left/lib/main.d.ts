export declare type ScrollType = 'indeterminate' | 'default' | 'negative' | 'reverse';
export declare function _setScrollType(type?: ScrollType): void;
export declare function detectScrollType(): ScrollType;
export declare function getNormalizedScrollLeft(element: HTMLElement, direction: 'rtl' | 'ltr'): number;
export declare function setNormalizedScrollLeft(element: HTMLElement, scrollLeft: number, direction: 'rtl' | 'ltr'): void;
