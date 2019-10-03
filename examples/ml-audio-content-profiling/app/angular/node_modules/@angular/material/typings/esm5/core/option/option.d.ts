/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterViewChecked, ChangeDetectorRef, ElementRef, EventEmitter, InjectionToken, OnDestroy, QueryList } from '@angular/core';
import { Subject } from 'rxjs';
import { MatOptgroup } from './optgroup';
/** Event object emitted by MatOption when selected or deselected. */
export declare class MatOptionSelectionChange {
    /** Reference to the option that emitted the event. */
    source: MatOption;
    /** Whether the change in the option's value was a result of a user action. */
    isUserInput: boolean;
    constructor(
    /** Reference to the option that emitted the event. */
    source: MatOption, 
    /** Whether the change in the option's value was a result of a user action. */
    isUserInput?: boolean);
}
/**
 * Describes a parent component that manages a list of options.
 * Contains properties that the options can inherit.
 * @docs-private
 */
export interface MatOptionParentComponent {
    disableRipple?: boolean;
    multiple?: boolean;
}
/**
 * Injection token used to provide the parent component to options.
 */
export declare const MAT_OPTION_PARENT_COMPONENT: InjectionToken<MatOptionParentComponent>;
/**
 * Single option inside of a `<mat-select>` element.
 */
export declare class MatOption implements AfterViewChecked, OnDestroy {
    private _element;
    private _changeDetectorRef;
    private _parent;
    readonly group: MatOptgroup;
    private _selected;
    private _active;
    private _disabled;
    private _mostRecentViewValue;
    /** Whether the wrapping component is in multiple selection mode. */
    readonly multiple: boolean | undefined;
    /** Whether or not the option is currently selected. */
    readonly selected: boolean;
    /** The form value of the option. */
    value: any;
    /** The unique ID of the option. */
    id: string;
    /** Whether the option is disabled. */
    disabled: any;
    /** Whether ripples for the option are disabled. */
    readonly disableRipple: boolean | undefined;
    /** Event emitted when the option is selected or deselected. */
    readonly onSelectionChange: EventEmitter<MatOptionSelectionChange>;
    /** Emits when the state of the option changes and any parents have to be notified. */
    readonly _stateChanges: Subject<void>;
    constructor(_element: ElementRef<HTMLElement>, _changeDetectorRef: ChangeDetectorRef, _parent: MatOptionParentComponent, group: MatOptgroup);
    /**
     * Whether or not the option is currently active and ready to be selected.
     * An active option displays styles as if it is focused, but the
     * focus is actually retained somewhere else. This comes in handy
     * for components like autocomplete where focus must remain on the input.
     */
    readonly active: boolean;
    /**
     * The displayed value of the option. It is necessary to show the selected option in the
     * select's trigger.
     */
    readonly viewValue: string;
    /** Selects the option. */
    select(): void;
    /** Deselects the option. */
    deselect(): void;
    /** Sets focus onto this option. */
    focus(): void;
    /**
     * This method sets display styles on the option to make it appear
     * active. This is used by the ActiveDescendantKeyManager so key
     * events will display the proper options as active on arrow key events.
     */
    setActiveStyles(): void;
    /**
     * This method removes display styles on the option that made it appear
     * active. This is used by the ActiveDescendantKeyManager so key
     * events will display the proper options as active on arrow key events.
     */
    setInactiveStyles(): void;
    /** Gets the label to be used when determining whether the option should be focused. */
    getLabel(): string;
    /** Ensures the option is selected when activated from the keyboard. */
    _handleKeydown(event: KeyboardEvent): void;
    /**
     * `Selects the option while indicating the selection came from the user. Used to
     * determine if the select's view -> model callback should be invoked.`
     */
    _selectViaInteraction(): void;
    /**
     * Gets the `aria-selected` value for the option. We explicitly omit the `aria-selected`
     * attribute from single-selection, unselected options. Including the `aria-selected="false"`
     * attributes adds a significant amount of noise to screen-reader users without providing useful
     * information.
     */
    _getAriaSelected(): boolean | null;
    /** Returns the correct tabindex for the option depending on disabled state. */
    _getTabIndex(): string;
    /** Gets the host DOM element. */
    _getHostElement(): HTMLElement;
    ngAfterViewChecked(): void;
    ngOnDestroy(): void;
    /** Emits the selection change event. */
    private _emitSelectionChangeEvent;
}
/**
 * Counts the amount of option group labels that precede the specified option.
 * @param optionIndex Index of the option at which to start counting.
 * @param options Flat list of all of the options.
 * @param optionGroups Flat list of all of the option groups.
 * @docs-private
 */
export declare function _countGroupLabelsBeforeOption(optionIndex: number, options: QueryList<MatOption>, optionGroups: QueryList<MatOptgroup>): number;
/**
 * Determines the position to which to scroll a panel in order for an option to be into view.
 * @param optionIndex Index of the option to be scrolled into the view.
 * @param optionHeight Height of the options.
 * @param currentScrollPosition Current scroll position of the panel.
 * @param panelHeight Height of the panel.
 * @docs-private
 */
export declare function _getOptionScrollPosition(optionIndex: number, optionHeight: number, currentScrollPosition: number, panelHeight: number): number;
