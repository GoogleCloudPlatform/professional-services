/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Renderer2, RendererType2 } from '../render/api';
import { DebugRendererFactory2 } from '../view/services';
/**
 * Adapts the DebugRendererFactory2 to create a DebugRenderer2 specific for IVY.
 *
 * The created DebugRenderer know how to create a Debug Context specific to IVY.
 */
export declare class Render3DebugRendererFactory2 extends DebugRendererFactory2 {
    createRenderer(element: any, renderData: RendererType2 | null): Renderer2;
}
