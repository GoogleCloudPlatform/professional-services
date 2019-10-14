/**
 * @license Angular v7.0.4
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */
!function(e,r){"object"==typeof exports&&"undefined"!=typeof module?r(exports,require("@angular/common"),require("@angular/core"),require("@angular/router"),require("@angular/upgrade/static")):"function"==typeof define&&define.amd?define("@angular/router/upgrade",["exports","@angular/common","@angular/core","@angular/router","@angular/upgrade/static"],r):r((e.ng=e.ng||{},e.ng.router=e.ng.router||{},e.ng.router.upgrade={}),e.ng.common,e.ng.core,e.ng.router,e.ng.upgrade.static)}(this,function(e,r,t,n,a){"use strict";
/**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */var o;function u(e){return function(){i(e)}}function i(e){if(!e.$injector)throw new Error("\n        RouterUpgradeInitializer can be used only after UpgradeModule.bootstrap has been called.\n        Remove RouterUpgradeInitializer and call setUpLocationSync after UpgradeModule.bootstrap.\n      ");var t=e.injector.get(n.Router),a=e.injector.get(r.Location);e.$injector.get("$rootScope").$on("$locationChangeStart",function(e,r,n){var u=function i(e){return o||(o=document.createElement("a")),o.setAttribute("href",e),o.setAttribute("href",o.href),{pathname:"/"+o.pathname.replace(/^\//,""),search:o.search,hash:o.hash}}
/**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
/**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */(r),c=a.normalize(u.pathname);t.navigateByUrl(c+u.search+u.hash)})}e.RouterUpgradeInitializer={provide:t.APP_BOOTSTRAP_LISTENER,multi:!0,useFactory:u,deps:[a.UpgradeModule]},e.locationSyncBootstrapListener=u,e.setUpLocationSync=i,Object.defineProperty(e,"__esModule",{value:!0})});