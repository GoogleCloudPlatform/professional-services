/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AriaDescriber } from '@angular/cdk/a11y';
import { ElementRef, NgZone, OnDestroy, Renderer2 } from '@angular/core';
import { ThemePalette, CanDisableCtor, CanDisable } from '@angular/material/core';
/** @docs-private */
export declare class MatBadgeBase {
}
export declare const _MatBadgeMixinBase: CanDisableCtor & typeof MatBadgeBase;
export declare type MatBadgePosition = 'above after' | 'above before' | 'below before' | 'below after';
export declare type MatBadgeSize = 'small' | 'medium' | 'large';
/** Directive to display a text badge. */
export declare class MatBadge extends _MatBadgeMixinBase implements OnDestroy, CanDisable {
    private _document;
    private _ngZone;
    private _elementRef;
    private _ariaDescriber;
    /** @breaking-change 8.0.0 Make _renderer a required param and remove _document. */
    private _renderer?;
    /** Whether the badge has any content. */
    _hasContent: boolean;
    /** The color of the badge. Can be `primary`, `accent`, or `warn`. */
    color: ThemePalette;
    private _color;
    /** Whether the badge should overlap its contents or not */
    overlap: boolean;
    private _overlap;
    /**
     * Position the badge should reside.
     * Accepts any combination of 'above'|'below' and 'before'|'after'
     */
    position: MatBadgePosition;
    /** The content for the badge */
    content: string;
    private _content;
    /** Message used to describe the decorated element via aria-describedby */
    description: string;
    private _description;
    /** Size of the badge. Can be 'small', 'medium', or 'large'. */
    size: MatBadgeSize;
    /** Whether the badge is hidden. */
    hidden: boolean;
    private _hidden;
    /** Unique id for the badge */
    _id: number;
    private _badgeElement;
    constructor(_document: any, _ngZone: NgZone, _elementRef: ElementRef<HTMLElement>, _ariaDescriber: AriaDescriber, 
    /** @breaking-change 8.0.0 Make _renderer a required param and remove _document. */
    _renderer?: Renderer2 | undefined);
    /** Whether the badge is above the host or not */
    isAbove(): boolean;
    /** Whether the badge is after the host or not */
    isAfter(): boolean;
    ngOnDestroy(): void;
    /** Injects a span element into the DOM with the content. */
    private _updateTextContent;
    /** Creates the badge element */
    private _createBadgeElement;
    /** Sets the aria-label property on the element */
    private _updateHostAriaDescription;
    /** Adds css theme class given the color to the component host */
    private _setColor;
    /** Clears any existing badges that might be left over from server-side rendering. */
    private _clearExistingBadges;
}
