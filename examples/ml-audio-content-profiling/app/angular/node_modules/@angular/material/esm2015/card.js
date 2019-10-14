/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Component, ViewEncapsulation, ChangeDetectionStrategy, Directive, Input, NgModule } from '@angular/core';
import { MatCommonModule } from '@angular/material/core';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Content of a card, needed as it's used as a selector in the API.
 * \@docs-private
 */
class MatCardContent {
}
MatCardContent.decorators = [
    { type: Directive, args: [{
                selector: 'mat-card-content',
                host: { 'class': 'mat-card-content' }
            },] },
];
/**
 * Title of a card, needed as it's used as a selector in the API.
 * \@docs-private
 */
class MatCardTitle {
}
MatCardTitle.decorators = [
    { type: Directive, args: [{
                selector: `mat-card-title, [mat-card-title], [matCardTitle]`,
                host: {
                    'class': 'mat-card-title'
                }
            },] },
];
/**
 * Sub-title of a card, needed as it's used as a selector in the API.
 * \@docs-private
 */
class MatCardSubtitle {
}
MatCardSubtitle.decorators = [
    { type: Directive, args: [{
                selector: `mat-card-subtitle, [mat-card-subtitle], [matCardSubtitle]`,
                host: {
                    'class': 'mat-card-subtitle'
                }
            },] },
];
/**
 * Action section of a card, needed as it's used as a selector in the API.
 * \@docs-private
 */
class MatCardActions {
    constructor() {
        /**
         * Position of the actions inside the card.
         */
        this.align = 'start';
    }
}
MatCardActions.decorators = [
    { type: Directive, args: [{
                selector: 'mat-card-actions',
                exportAs: 'matCardActions',
                host: {
                    'class': 'mat-card-actions',
                    '[class.mat-card-actions-align-end]': 'align === "end"',
                }
            },] },
];
MatCardActions.propDecorators = {
    align: [{ type: Input }]
};
/**
 * Footer of a card, needed as it's used as a selector in the API.
 * \@docs-private
 */
class MatCardFooter {
}
MatCardFooter.decorators = [
    { type: Directive, args: [{
                selector: 'mat-card-footer',
                host: { 'class': 'mat-card-footer' }
            },] },
];
/**
 * Image used in a card, needed to add the mat- CSS styling.
 * \@docs-private
 */
class MatCardImage {
}
MatCardImage.decorators = [
    { type: Directive, args: [{
                selector: '[mat-card-image], [matCardImage]',
                host: { 'class': 'mat-card-image' }
            },] },
];
/**
 * Image used in a card, needed to add the mat- CSS styling.
 * \@docs-private
 */
class MatCardSmImage {
}
MatCardSmImage.decorators = [
    { type: Directive, args: [{
                selector: '[mat-card-sm-image], [matCardImageSmall]',
                host: { 'class': 'mat-card-sm-image' }
            },] },
];
/**
 * Image used in a card, needed to add the mat- CSS styling.
 * \@docs-private
 */
class MatCardMdImage {
}
MatCardMdImage.decorators = [
    { type: Directive, args: [{
                selector: '[mat-card-md-image], [matCardImageMedium]',
                host: { 'class': 'mat-card-md-image' }
            },] },
];
/**
 * Image used in a card, needed to add the mat- CSS styling.
 * \@docs-private
 */
class MatCardLgImage {
}
MatCardLgImage.decorators = [
    { type: Directive, args: [{
                selector: '[mat-card-lg-image], [matCardImageLarge]',
                host: { 'class': 'mat-card-lg-image' }
            },] },
];
/**
 * Large image used in a card, needed to add the mat- CSS styling.
 * \@docs-private
 */
class MatCardXlImage {
}
MatCardXlImage.decorators = [
    { type: Directive, args: [{
                selector: '[mat-card-xl-image], [matCardImageXLarge]',
                host: { 'class': 'mat-card-xl-image' }
            },] },
];
/**
 * Avatar image used in a card, needed to add the mat- CSS styling.
 * \@docs-private
 */
class MatCardAvatar {
}
MatCardAvatar.decorators = [
    { type: Directive, args: [{
                selector: '[mat-card-avatar], [matCardAvatar]',
                host: { 'class': 'mat-card-avatar' }
            },] },
];
/**
 * A basic content container component that adds the styles of a Material design card.
 *
 * While this component can be used alone, it also provides a number
 * of preset styles for common card sections, including:
 * - mat-card-title
 * - mat-card-subtitle
 * - mat-card-content
 * - mat-card-actions
 * - mat-card-footer
 */
class MatCard {
}
MatCard.decorators = [
    { type: Component, args: [{selector: 'mat-card',
                exportAs: 'matCard',
                template: "<ng-content></ng-content><ng-content select=\"mat-card-footer\"></ng-content>",
                styles: [".mat-card{transition:box-shadow 280ms cubic-bezier(.4,0,.2,1);display:block;position:relative;padding:16px;border-radius:4px}.mat-card .mat-divider-horizontal{position:absolute;left:0;width:100%}[dir=rtl] .mat-card .mat-divider-horizontal{left:auto;right:0}.mat-card .mat-divider-horizontal.mat-divider-inset{position:static;margin:0}[dir=rtl] .mat-card .mat-divider-horizontal.mat-divider-inset{margin-right:0}@media (-ms-high-contrast:active){.mat-card{outline:solid 1px}}.mat-card-actions,.mat-card-content,.mat-card-subtitle{display:block;margin-bottom:16px}.mat-card-title{display:block;margin-bottom:8px}.mat-card-actions{margin-left:-8px;margin-right:-8px;padding:8px 0}.mat-card-actions-align-end{display:flex;justify-content:flex-end}.mat-card-image{width:calc(100% + 32px);margin:0 -16px 16px -16px}.mat-card-footer{display:block;margin:0 -16px -16px -16px}.mat-card-actions .mat-button,.mat-card-actions .mat-raised-button{margin:0 8px}.mat-card-header{display:flex;flex-direction:row}.mat-card-header .mat-card-title{margin-bottom:12px}.mat-card-header-text{margin:0 16px}.mat-card-avatar{height:40px;width:40px;border-radius:50%;flex-shrink:0;object-fit:cover}.mat-card-title-group{display:flex;justify-content:space-between}.mat-card-sm-image{width:80px;height:80px}.mat-card-md-image{width:112px;height:112px}.mat-card-lg-image{width:152px;height:152px}.mat-card-xl-image{width:240px;height:240px;margin:-8px}.mat-card-title-group>.mat-card-xl-image{margin:-8px 0 8px 0}@media (max-width:599px){.mat-card-title-group{margin:0}.mat-card-xl-image{margin-left:0;margin-right:0}}.mat-card-content>:first-child,.mat-card>:first-child{margin-top:0}.mat-card-content>:last-child:not(.mat-card-footer),.mat-card>:last-child:not(.mat-card-footer){margin-bottom:0}.mat-card-image:first-child{margin-top:-16px;border-top-left-radius:inherit;border-top-right-radius:inherit}.mat-card>.mat-card-actions:last-child{margin-bottom:-8px;padding-bottom:0}.mat-card-actions .mat-button:first-child,.mat-card-actions .mat-raised-button:first-child{margin-left:0;margin-right:0}.mat-card-subtitle:not(:first-child),.mat-card-title:not(:first-child){margin-top:-4px}.mat-card-header .mat-card-subtitle:not(:first-child){margin-top:-8px}.mat-card>.mat-card-xl-image:first-child{margin-top:-8px}.mat-card>.mat-card-xl-image:last-child{margin-bottom:-8px}"],
                encapsulation: ViewEncapsulation.None,
                changeDetection: ChangeDetectionStrategy.OnPush,
                host: { 'class': 'mat-card' }
            },] },
];
/**
 * Component intended to be used within the `<mat-card>` component. It adds styles for a
 * preset header section (i.e. a title, subtitle, and avatar layout).
 * \@docs-private
 */
class MatCardHeader {
}
MatCardHeader.decorators = [
    { type: Component, args: [{selector: 'mat-card-header',
                template: "<ng-content select=\"[mat-card-avatar], [matCardAvatar]\"></ng-content><div class=\"mat-card-header-text\"><ng-content select=\"mat-card-title, mat-card-subtitle, [mat-card-title], [mat-card-subtitle], [matCardTitle], [matCardSubtitle]\"></ng-content></div><ng-content></ng-content>",
                encapsulation: ViewEncapsulation.None,
                changeDetection: ChangeDetectionStrategy.OnPush,
                host: { 'class': 'mat-card-header' }
            },] },
];
/**
 * Component intended to be used within the `<mat-card>` component. It adds styles for a preset
 * layout that groups an image with a title section.
 * \@docs-private
 */
class MatCardTitleGroup {
}
MatCardTitleGroup.decorators = [
    { type: Component, args: [{selector: 'mat-card-title-group',
                template: "<div><ng-content select=\"mat-card-title, mat-card-subtitle, [mat-card-title], [mat-card-subtitle], [matCardTitle], [matCardSubtitle]\"></ng-content></div><ng-content select=\"img\"></ng-content><ng-content></ng-content>",
                encapsulation: ViewEncapsulation.None,
                changeDetection: ChangeDetectionStrategy.OnPush,
                host: { 'class': 'mat-card-title-group' }
            },] },
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
class MatCardModule {
}
MatCardModule.decorators = [
    { type: NgModule, args: [{
                imports: [MatCommonModule],
                exports: [
                    MatCard,
                    MatCardHeader,
                    MatCardTitleGroup,
                    MatCardContent,
                    MatCardTitle,
                    MatCardSubtitle,
                    MatCardActions,
                    MatCardFooter,
                    MatCardSmImage,
                    MatCardMdImage,
                    MatCardLgImage,
                    MatCardImage,
                    MatCardXlImage,
                    MatCardAvatar,
                    MatCommonModule,
                ],
                declarations: [
                    MatCard, MatCardHeader, MatCardTitleGroup, MatCardContent, MatCardTitle, MatCardSubtitle,
                    MatCardActions, MatCardFooter, MatCardSmImage, MatCardMdImage, MatCardLgImage, MatCardImage,
                    MatCardXlImage, MatCardAvatar,
                ],
            },] },
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

export { MatCardContent, MatCardTitle, MatCardSubtitle, MatCardActions, MatCardFooter, MatCardImage, MatCardSmImage, MatCardMdImage, MatCardLgImage, MatCardXlImage, MatCardAvatar, MatCard, MatCardHeader, MatCardTitleGroup, MatCardModule };
//# sourceMappingURL=card.js.map
