/**
 * @license Angular v7.0.4
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */
!function(e,r){"object"==typeof exports&&"undefined"!=typeof module?r(exports,require("@angular/core"),require("@angular/core/testing"),require("@angular/platform-browser"),require("@angular/compiler"),require("@angular/compiler/testing"),require("@angular/platform-browser-dynamic"),require("@angular/platform-browser/testing")):"function"==typeof define&&define.amd?define("@angular/platform-browser-dynamic/testing",["exports","@angular/core","@angular/core/testing","@angular/platform-browser","@angular/compiler","@angular/compiler/testing","@angular/platform-browser-dynamic","@angular/platform-browser/testing"],r):r((e.ng=e.ng||{},e.ng.platformBrowserDynamic=e.ng.platformBrowserDynamic||{},e.ng.platformBrowserDynamic.testing={}),e.ng.core,e.ng.core.testing,e.ng.platformBrowser,e.ng.compiler,e.ng.compiler.testing,e.ng.platformBrowserDynamic,e.ng.platformBrowser.testing)}(this,function(e,r,o,t,i,n,c,l){"use strict";var s=function(e,r){return(s=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,r){e.__proto__=r}||function(e,r){for(var o in r)r.hasOwnProperty(o)&&(e[o]=r[o])})(e,r)};function a(e,r,o,t){var i,n=arguments.length,c=n<3?r:null===t?t=Object.getOwnPropertyDescriptor(r,o):t;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)c=Reflect.decorate(e,r,o,t);else for(var l=e.length-1;l>=0;l--)(i=e[l])&&(c=(n<3?i(c):n>3?i(r,o,c):i(r,o))||c);return n>3&&c&&Object.defineProperty(r,o,c),c}
/**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
var p=function(e){function o(r){var o=e.call(this)||this;return o._doc=r,o}return function i(e,r){function o(){this.constructor=e}s(e,r),e.prototype=null===r?Object.create(r):(o.prototype=r.prototype,new o)}(o,e),o.prototype.insertRootElement=function(e){for(var r=t.ɵgetDOM().firstChild(t.ɵgetDOM().content(t.ɵgetDOM().createTemplate('<div id="'+e+'"></div>'))),o=t.ɵgetDOM().querySelectorAll(this._doc,"[id^=root]"),i=0;i<o.length;i++)t.ɵgetDOM().remove(o[i]);t.ɵgetDOM().appendChild(this._doc.body,r)},a([r.Injectable(),function n(e,r){return function(o,t){r(o,t,e)}}(0,r.Inject(t.DOCUMENT)),function c(e,r){if("object"==typeof Reflect&&"function"==typeof Reflect.metadata)return Reflect.metadata(e,r)}("design:paramtypes",[Object])],o)}(o.TestComponentRenderer),u=[{provide:n.MockPipeResolver,deps:[i.CompileReflector]},{provide:i.PipeResolver,useExisting:n.MockPipeResolver},{provide:n.MockDirectiveResolver,deps:[i.CompileReflector]},{provide:i.DirectiveResolver,useExisting:n.MockDirectiveResolver},{provide:n.MockNgModuleResolver,deps:[i.CompileReflector]},{provide:i.NgModuleResolver,useExisting:n.MockNgModuleResolver}],d=function(){function e(e,r){this._injector=e,this._compilerFactory=r}return e.prototype.createTestingCompiler=function(e){var r=this._compilerFactory.createCompiler(e);return new m(r,r.injector.get(n.MockDirectiveResolver),r.injector.get(n.MockPipeResolver),r.injector.get(n.MockNgModuleResolver))},e}(),m=function(){function e(e,r,t,i){this._compiler=e,this._directiveResolver=r,this._pipeResolver=t,this._moduleResolver=i,this._overrider=new o.ɵMetadataOverrider}return Object.defineProperty(e.prototype,"injector",{get:function(){return this._compiler.injector},enumerable:!0,configurable:!0}),e.prototype.compileModuleSync=function(e){return this._compiler.compileModuleSync(e)},e.prototype.compileModuleAsync=function(e){return this._compiler.compileModuleAsync(e)},e.prototype.compileModuleAndAllComponentsSync=function(e){return this._compiler.compileModuleAndAllComponentsSync(e)},e.prototype.compileModuleAndAllComponentsAsync=function(e){return this._compiler.compileModuleAndAllComponentsAsync(e)},e.prototype.getComponentFactory=function(e){return this._compiler.getComponentFactory(e)},e.prototype.checkOverrideAllowed=function(e){if(this._compiler.hasAotSummary(e))throw new Error(r.ɵstringify(e)+" was AOT compiled, so its metadata cannot be changed.")},e.prototype.overrideModule=function(e,o){this.checkOverrideAllowed(e);var t=this._moduleResolver.resolve(e,!1);this._moduleResolver.setNgModule(e,this._overrider.overrideMetadata(r.NgModule,t,o)),this.clearCacheFor(e)},e.prototype.overrideDirective=function(e,o){this.checkOverrideAllowed(e);var t=this._directiveResolver.resolve(e,!1);this._directiveResolver.setDirective(e,this._overrider.overrideMetadata(r.Directive,t,o)),this.clearCacheFor(e)},e.prototype.overrideComponent=function(e,o){this.checkOverrideAllowed(e);var t=this._directiveResolver.resolve(e,!1);this._directiveResolver.setDirective(e,this._overrider.overrideMetadata(r.Component,t,o)),this.clearCacheFor(e)},e.prototype.overridePipe=function(e,o){this.checkOverrideAllowed(e);var t=this._pipeResolver.resolve(e,!1);this._pipeResolver.setPipe(e,this._overrider.overrideMetadata(r.Pipe,t,o)),this.clearCacheFor(e)},e.prototype.loadAotSummaries=function(e){this._compiler.loadAotSummaries(e)},e.prototype.clearCache=function(){this._compiler.clearCache()},e.prototype.clearCacheFor=function(e){this._compiler.clearCacheFor(e)},e.prototype.getComponentFromError=function(e){return e[i.ERROR_COMPONENT_TYPE]||null},e.prototype.getModuleId=function(e){return this._moduleResolver.resolve(e,!0).id},e}(),f=r.createPlatformFactory(c.ɵplatformCoreDynamic,"coreDynamicTesting",[{provide:r.COMPILER_OPTIONS,useValue:{providers:u},multi:!0},{provide:o.ɵTestingCompilerFactory,useClass:d,deps:[r.Injector,r.CompilerFactory]}]),v=r.createPlatformFactory(f,"browserDynamicTesting",c.ɵINTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS),g=function(){return a([r.NgModule({exports:[l.BrowserTestingModule],providers:[{provide:o.TestComponentRenderer,useClass:p}]})],function e(){})}();
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
     */
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
     */
e.ɵangular_packages_platform_browser_dynamic_testing_testing_a=u,e.ɵangular_packages_platform_browser_dynamic_testing_testing_b=d,e.platformBrowserDynamicTesting=v,e.BrowserDynamicTestingModule=g,e.ɵDOMTestComponentRenderer=p,e.ɵplatformCoreDynamicTesting=f,Object.defineProperty(e,"__esModule",{value:!0})});