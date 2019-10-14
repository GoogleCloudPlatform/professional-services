/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TemplateRef as ViewEngine_TemplateRef } from '../linker/template_ref';
import { TNode } from './interfaces/node';
import { LViewData } from './interfaces/view';
/**
 * Retrieves `TemplateRef` instance from `Injector` when a local reference is placed on the
 * `<ng-template>` element.
 */
export declare function templateRefExtractor(tNode: TNode, currentView: LViewData): ViewEngine_TemplateRef<{}>;
