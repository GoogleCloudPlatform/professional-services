/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, OnChanges, OnInit, SimpleChanges, InjectionToken, OnDestroy, AfterViewChecked } from '@angular/core';
import { CanColor, CanColorCtor } from '@angular/material/core';
import { MatIconRegistry } from './icon-registry';
/** @docs-private */
export declare class MatIconBase {
    _elementRef: ElementRef;
    constructor(_elementRef: ElementRef);
}
export declare const _MatIconMixinBase: CanColorCtor & typeof MatIconBase;
/**
 * Injection token used to provide the current location to `MatIcon`.
 * Used to handle server-side rendering and to stub out during unit tests.
 * @docs-private
 */
export declare const MAT_ICON_LOCATION: InjectionToken<MatIconLocation>;
/**
 * Stubbed out location for `MatIcon`.
 * @docs-private
 */
export interface MatIconLocation {
    getPathname: () => string;
}
/** @docs-private */
export declare function MAT_ICON_LOCATION_FACTORY(): MatIconLocation;
/**
 * Component to display an icon. It can be used in the following ways:
 *
 * - Specify the svgIcon input to load an SVG icon from a URL previously registered with the
 *   addSvgIcon, addSvgIconInNamespace, addSvgIconSet, or addSvgIconSetInNamespace methods of
 *   MatIconRegistry. If the svgIcon value contains a colon it is assumed to be in the format
 *   "[namespace]:[name]", if not the value will be the name of an icon in the default namespace.
 *   Examples:
 *     `<mat-icon svgIcon="left-arrow"></mat-icon>
 *     <mat-icon svgIcon="animals:cat"></mat-icon>`
 *
 * - Use a font ligature as an icon by putting the ligature text in the content of the `<mat-icon>`
 *   component. By default the Material icons font is used as described at
 *   http://google.github.io/material-design-icons/#icon-font-for-the-web. You can specify an
 *   alternate font by setting the fontSet input to either the CSS class to apply to use the
 *   desired font, or to an alias previously registered with MatIconRegistry.registerFontClassAlias.
 *   Examples:
 *     `<mat-icon>home</mat-icon>
 *     <mat-icon fontSet="myfont">sun</mat-icon>`
 *
 * - Specify a font glyph to be included via CSS rules by setting the fontSet input to specify the
 *   font, and the fontIcon input to specify the icon. Typically the fontIcon will specify a
 *   CSS class which causes the glyph to be displayed via a :before selector, as in
 *   https://fortawesome.github.io/Font-Awesome/examples/
 *   Example:
 *     `<mat-icon fontSet="fa" fontIcon="alarm"></mat-icon>`
 */
export declare class MatIcon extends _MatIconMixinBase implements OnChanges, OnInit, AfterViewChecked, CanColor, OnDestroy {
    private _iconRegistry;
    /**
     * @deprecated `location` parameter to be made required.
     * @breaking-change 8.0.0
     */
    private _location?;
    /**
     * Whether the icon should be inlined, automatically sizing the icon to match the font size of
     * the element the icon is contained in.
     */
    inline: boolean;
    private _inline;
    /** Name of the icon in the SVG icon set. */
    svgIcon: string;
    /** Font set that the icon is a part of. */
    fontSet: string;
    private _fontSet;
    /** Name of an icon within a font set. */
    fontIcon: string;
    private _fontIcon;
    private _previousFontSetClass;
    private _previousFontIconClass;
    /** Keeps track of the current page path. */
    private _previousPath?;
    /** Keeps track of the elements and attributes that we've prefixed with the current path. */
    private _elementsWithExternalReferences?;
    constructor(elementRef: ElementRef<HTMLElement>, _iconRegistry: MatIconRegistry, ariaHidden: string, 
    /**
     * @deprecated `location` parameter to be made required.
     * @breaking-change 8.0.0
     */
    _location?: MatIconLocation | undefined);
    /**
     * Splits an svgIcon binding value into its icon set and icon name components.
     * Returns a 2-element array of [(icon set), (icon name)].
     * The separator for the two fields is ':'. If there is no separator, an empty
     * string is returned for the icon set and the entire value is returned for
     * the icon name. If the argument is falsy, returns an array of two empty strings.
     * Throws an error if the name contains two or more ':' separators.
     * Examples:
     *   `'social:cake' -> ['social', 'cake']
     *   'penguin' -> ['', 'penguin']
     *   null -> ['', '']
     *   'a:b:c' -> (throws Error)`
     */
    private _splitIconName;
    ngOnChanges(changes: SimpleChanges): void;
    ngOnInit(): void;
    ngAfterViewChecked(): void;
    ngOnDestroy(): void;
    private _usingFontIcon;
    private _setSvgElement;
    private _clearSvgElement;
    private _updateFontIconClasses;
    /**
     * Cleans up a value to be used as a fontIcon or fontSet.
     * Since the value ends up being assigned as a CSS class, we
     * have to trim the value and omit space-separated values.
     */
    private _cleanupFontValue;
    /**
     * Prepends the current path to all elements that have an attribute pointing to a `FuncIRI`
     * reference. This is required because WebKit browsers require references to be prefixed with
     * the current path, if the page has a `base` tag.
     */
    private _prependPathToReferences;
    /**
     * Caches the children of an SVG element that have `url()`
     * references that we need to prefix with the current path.
     */
    private _cacheChildrenWithExternalReferences;
}
