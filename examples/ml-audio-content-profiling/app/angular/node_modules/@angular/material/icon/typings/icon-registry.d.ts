/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { HttpClient } from '@angular/common/http';
import { Optional, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs';
/**
 * Returns an exception to be thrown in the case when attempting to
 * load an icon with a name that cannot be found.
 * @docs-private
 */
export declare function getMatIconNameNotFoundError(iconName: string): Error;
/**
 * Returns an exception to be thrown when the consumer attempts to use
 * `<mat-icon>` without including @angular/http.
 * @docs-private
 */
export declare function getMatIconNoHttpProviderError(): Error;
/**
 * Returns an exception to be thrown when a URL couldn't be sanitized.
 * @param url URL that was attempted to be sanitized.
 * @docs-private
 */
export declare function getMatIconFailedToSanitizeUrlError(url: SafeResourceUrl): Error;
/**
 * Returns an exception to be thrown when a HTML string couldn't be sanitized.
 * @param literal HTML that was attempted to be sanitized.
 * @docs-private
 */
export declare function getMatIconFailedToSanitizeLiteralError(literal: SafeHtml): Error;
/**
 * Service to register and display icons used by the `<mat-icon>` component.
 * - Registers icon URLs by namespace and name.
 * - Registers icon set URLs by namespace.
 * - Registers aliases for CSS classes, for use with icon fonts.
 * - Loads icons from URLs and extracts individual icons from icon sets.
 */
export declare class MatIconRegistry implements OnDestroy {
    private _httpClient;
    private _sanitizer;
    private _document;
    /**
     * URLs and cached SVG elements for individual icons. Keys are of the format "[namespace]:[icon]".
     */
    private _svgIconConfigs;
    /**
     * SvgIconConfig objects and cached SVG elements for icon sets, keyed by namespace.
     * Multiple icon sets can be registered under the same namespace.
     */
    private _iconSetConfigs;
    /** Cache for icons loaded by direct URLs. */
    private _cachedIconsByUrl;
    /** In-progress icon fetches. Used to coalesce multiple requests to the same URL. */
    private _inProgressUrlFetches;
    /** Map from font identifiers to their CSS class names. Used for icon fonts. */
    private _fontCssClassesByAlias;
    /**
     * The CSS class to apply when an `<mat-icon>` component has no icon name, url, or font specified.
     * The default 'material-icons' value assumes that the material icon font has been loaded as
     * described at http://google.github.io/material-design-icons/#icon-font-for-the-web
     */
    private _defaultFontSetClass;
    constructor(_httpClient: HttpClient, _sanitizer: DomSanitizer, document: any);
    /**
     * Registers an icon by URL in the default namespace.
     * @param iconName Name under which the icon should be registered.
     * @param url
     */
    addSvgIcon(iconName: string, url: SafeResourceUrl): this;
    /**
     * Registers an icon using an HTML string in the default namespace.
     * @param iconName Name under which the icon should be registered.
     * @param literal SVG source of the icon.
     */
    addSvgIconLiteral(iconName: string, literal: SafeHtml): this;
    /**
     * Registers an icon by URL in the specified namespace.
     * @param namespace Namespace in which the icon should be registered.
     * @param iconName Name under which the icon should be registered.
     * @param url
     */
    addSvgIconInNamespace(namespace: string, iconName: string, url: SafeResourceUrl): this;
    /**
     * Registers an icon using an HTML string in the specified namespace.
     * @param namespace Namespace in which the icon should be registered.
     * @param iconName Name under which the icon should be registered.
     * @param literal SVG source of the icon.
     */
    addSvgIconLiteralInNamespace(namespace: string, iconName: string, literal: SafeHtml): this;
    /**
     * Registers an icon set by URL in the default namespace.
     * @param url
     */
    addSvgIconSet(url: SafeResourceUrl): this;
    /**
     * Registers an icon set using an HTML string in the default namespace.
     * @param literal SVG source of the icon set.
     */
    addSvgIconSetLiteral(literal: SafeHtml): this;
    /**
     * Registers an icon set by URL in the specified namespace.
     * @param namespace Namespace in which to register the icon set.
     * @param url
     */
    addSvgIconSetInNamespace(namespace: string, url: SafeResourceUrl): this;
    /**
     * Registers an icon set using an HTML string in the specified namespace.
     * @param namespace Namespace in which to register the icon set.
     * @param literal SVG source of the icon set.
     */
    addSvgIconSetLiteralInNamespace(namespace: string, literal: SafeHtml): this;
    /**
     * Defines an alias for a CSS class name to be used for icon fonts. Creating an matIcon
     * component with the alias as the fontSet input will cause the class name to be applied
     * to the `<mat-icon>` element.
     *
     * @param alias Alias for the font.
     * @param className Class name override to be used instead of the alias.
     */
    registerFontClassAlias(alias: string, className?: string): this;
    /**
     * Returns the CSS class name associated with the alias by a previous call to
     * registerFontClassAlias. If no CSS class has been associated, returns the alias unmodified.
     */
    classNameForFontAlias(alias: string): string;
    /**
     * Sets the CSS class name to be used for icon fonts when an `<mat-icon>` component does not
     * have a fontSet input value, and is not loading an icon by name or URL.
     *
     * @param className
     */
    setDefaultFontSetClass(className: string): this;
    /**
     * Returns the CSS class name to be used for icon fonts when an `<mat-icon>` component does not
     * have a fontSet input value, and is not loading an icon by name or URL.
     */
    getDefaultFontSetClass(): string;
    /**
     * Returns an Observable that produces the icon (as an `<svg>` DOM element) from the given URL.
     * The response from the URL may be cached so this will not always cause an HTTP request, but
     * the produced element will always be a new copy of the originally fetched icon. (That is,
     * it will not contain any modifications made to elements previously returned).
     *
     * @param safeUrl URL from which to fetch the SVG icon.
     */
    getSvgIconFromUrl(safeUrl: SafeResourceUrl): Observable<SVGElement>;
    /**
     * Returns an Observable that produces the icon (as an `<svg>` DOM element) with the given name
     * and namespace. The icon must have been previously registered with addIcon or addIconSet;
     * if not, the Observable will throw an error.
     *
     * @param name Name of the icon to be retrieved.
     * @param namespace Namespace in which to look for the icon.
     */
    getNamedSvgIcon(name: string, namespace?: string): Observable<SVGElement>;
    ngOnDestroy(): void;
    /**
     * Returns the cached icon for a SvgIconConfig if available, or fetches it from its URL if not.
     */
    private _getSvgFromConfig;
    /**
     * Attempts to find an icon with the specified name in any of the SVG icon sets.
     * First searches the available cached icons for a nested element with a matching name, and
     * if found copies the element to a new `<svg>` element. If not found, fetches all icon sets
     * that have not been cached, and searches again after all fetches are completed.
     * The returned Observable produces the SVG element if possible, and throws
     * an error if no icon with the specified name can be found.
     */
    private _getSvgFromIconSetConfigs;
    /**
     * Searches the cached SVG elements for the given icon sets for a nested icon element whose "id"
     * tag matches the specified name. If found, copies the nested element to a new SVG element and
     * returns it. Returns null if no matching element is found.
     */
    private _extractIconWithNameFromAnySet;
    /**
     * Loads the content of the icon URL specified in the SvgIconConfig and creates an SVG element
     * from it.
     */
    private _loadSvgIconFromConfig;
    /**
     * Loads the content of the icon set URL specified in the SvgIconConfig and creates an SVG element
     * from it.
     */
    private _loadSvgIconSetFromConfig;
    /**
     * Creates a DOM element from the given SVG string, and adds default attributes.
     */
    private _createSvgElementForSingleIcon;
    /**
     * Searches the cached element of the given SvgIconConfig for a nested icon element whose "id"
     * tag matches the specified name. If found, copies the nested element to a new SVG element and
     * returns it. Returns null if no matching element is found.
     */
    private _extractSvgIconFromSet;
    /**
     * Creates a DOM element from the given SVG string.
     */
    private _svgElementFromString;
    /**
     * Converts an element into an SVG node by cloning all of its children.
     */
    private _toSvgElement;
    /**
     * Sets the default attributes for an SVG element to be used as an icon.
     */
    private _setSvgAttributes;
    /**
     * Returns an Observable which produces the string contents of the given URL. Results may be
     * cached, so future calls with the same URL may not cause another HTTP request.
     */
    private _fetchUrl;
    /**
     * Registers an icon config by name in the specified namespace.
     * @param namespace Namespace in which to register the icon config.
     * @param iconName Name under which to register the config.
     * @param config Config to be registered.
     */
    private _addSvgIconConfig;
    /**
     * Registers an icon set config in the specified namespace.
     * @param namespace Namespace in which to register the icon config.
     * @param config Config to be registered.
     */
    private _addSvgIconSetConfig;
}
/** @docs-private */
export declare function ICON_REGISTRY_PROVIDER_FACTORY(parentRegistry: MatIconRegistry, httpClient: HttpClient, sanitizer: DomSanitizer, document?: any): MatIconRegistry;
/** @docs-private */
export declare const ICON_REGISTRY_PROVIDER: {
    provide: typeof MatIconRegistry;
    deps: (Optional[] | typeof DomSanitizer)[];
    useFactory: typeof ICON_REGISTRY_PROVIDER_FACTORY;
};
