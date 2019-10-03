/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { LContext } from './interfaces/context';
import { LViewData } from './interfaces/view';
/** Returns the matching `LContext` data for a given DOM node, directive or component instance.
 *
 * This function will examine the provided DOM element, component, or directive instance\'s
 * monkey-patched property to derive the `LContext` data. Once called then the monkey-patched
 * value will be that of the newly created `LContext`.
 *
 * If the monkey-patched value is the `LViewData` instance then the context value for that
 * target will be created and the monkey-patch reference will be updated. Therefore when this
 * function is called it may mutate the provided element\'s, component\'s or any of the associated
 * directive\'s monkey-patch values.
 *
 * If the monkey-patch value is not detected then the code will walk up the DOM until an element
 * is found which contains a monkey-patch reference. When that occurs then the provided element
 * will be updated with a new context (which is then returned). If the monkey-patch value is not
 * detected for a component/directive instance then it will throw an error (all components and
 * directives should be automatically monkey-patched by ivy).
 */
export declare function getContext(target: any): LContext | null;
/**
 * Takes a component instance and returns the view for that component.
 *
 * @param componentInstance
 * @returns The component's view
 */
export declare function getComponentViewByInstance(componentInstance: {}): LViewData;
/**
 * Assigns the given data to the given target (which could be a component,
 * directive or DOM node instance) using monkey-patching.
 */
export declare function attachPatchData(target: any, data: LViewData | LContext): void;
export declare function isComponentInstance(instance: any): boolean;
export declare function isDirectiveInstance(instance: any): boolean;
/**
 * Returns a list of directives extracted from the given view based on the
 * provided list of directive index values.
 *
 * @param nodeIndex The node index
 * @param lViewData The target view data
 * @param includeComponents Whether or not to include components in returned directives
 */
export declare function discoverDirectives(nodeIndex: number, lViewData: LViewData, includeComponents: boolean): any[] | null;
/**
 * Returns a map of local references (local reference name => element or directive instance) that
 * exist on a given element.
 */
export declare function discoverLocalRefs(lViewData: LViewData, nodeIndex: number): {
    [key: string]: any;
} | null;
