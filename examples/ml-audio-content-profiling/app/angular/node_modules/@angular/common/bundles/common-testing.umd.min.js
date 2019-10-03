/**
 * @license Angular v7.0.4
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports,require("@angular/core"),require("@angular/common")):"function"==typeof define&&define.amd?define("@angular/common/testing",["exports","@angular/core","@angular/common"],e):e((t.ng=t.ng||{},t.ng.common=t.ng.common||{},t.ng.common.testing={}),t.ng.core,t.ng.common)}(this,function(t,e,n){"use strict";var r=function(t,e){return(r=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)};function i(t,e,n,r){var i,o=arguments.length,s=o<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,n):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(t,e,n,r);else for(var h=t.length-1;h>=0;h--)(i=t[h])&&(s=(o<3?i(s):o>3?i(e,n,s):i(e,n))||s);return o>3&&s&&Object.defineProperty(e,n,s),s}
/**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
var o=function(){function t(){this.urlChanges=[],this._history=[new s("","",null)],this._historyIndex=0,this._subject=new e.EventEmitter,this._baseHref="",this._platformStrategy=null}return t.prototype.setInitialPath=function(t){this._history[this._historyIndex].path=t},t.prototype.setBaseHref=function(t){this._baseHref=t},t.prototype.path=function(){return this._history[this._historyIndex].path},t.prototype.state=function(){return this._history[this._historyIndex].state},t.prototype.isCurrentPathEqualTo=function(t,e){void 0===e&&(e="");var n=t.endsWith("/")?t.substring(0,t.length-1):t;return(this.path().endsWith("/")?this.path().substring(0,this.path().length-1):this.path())==n+(e.length>0?"?"+e:"")},t.prototype.simulateUrlPop=function(t){this._subject.emit({url:t,pop:!0,type:"popstate"})},t.prototype.simulateHashChange=function(t){this.setInitialPath(t),this.urlChanges.push("hash: "+t),this._subject.emit({url:t,pop:!0,type:"hashchange"})},t.prototype.prepareExternalUrl=function(t){return t.length>0&&!t.startsWith("/")&&(t="/"+t),this._baseHref+t},t.prototype.go=function(t,e,n){void 0===e&&(e=""),void 0===n&&(n=null),t=this.prepareExternalUrl(t),this._historyIndex>0&&this._history.splice(this._historyIndex+1),this._history.push(new s(t,e,n)),this._historyIndex=this._history.length-1;var r=this._history[this._historyIndex-1];if(r.path!=t||r.query!=e){var i=t+(e.length>0?"?"+e:"");this.urlChanges.push(i),this._subject.emit({url:i,pop:!1})}},t.prototype.replaceState=function(t,e,n){void 0===e&&(e=""),void 0===n&&(n=null),t=this.prepareExternalUrl(t);var r=this._history[this._historyIndex];r.path==t&&r.query==e||(r.path=t,r.query=e,r.state=n,this.urlChanges.push("replace: "+t+(e.length>0?"?"+e:"")))},t.prototype.forward=function(){this._historyIndex<this._history.length-1&&(this._historyIndex++,this._subject.emit({url:this.path(),state:this.state(),pop:!0}))},t.prototype.back=function(){this._historyIndex>0&&(this._historyIndex--,this._subject.emit({url:this.path(),state:this.state(),pop:!0}))},t.prototype.subscribe=function(t,e,n){return this._subject.subscribe({next:t,error:e,complete:n})},t.prototype.normalize=function(t){return null},i([e.Injectable()],t)}(),s=function s(t,e,n){this.path=t,this.query=e,this.state=n},h=function(t){function n(){var n=t.call(this)||this;return n.internalBaseHref="/",n.internalPath="/",n.internalTitle="",n.urlChanges=[],n._subject=new e.EventEmitter,n}return function o(t,e){function n(){this.constructor=t}r(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)}(n,t),n.prototype.simulatePopState=function(t){this.internalPath=t,this._subject.emit(new a(this.path()))},n.prototype.path=function(t){return void 0===t&&(t=!1),this.internalPath},n.prototype.prepareExternalUrl=function(t){return t.startsWith("/")&&this.internalBaseHref.endsWith("/")?this.internalBaseHref+t.substring(1):this.internalBaseHref+t},n.prototype.pushState=function(t,e,n,r){this.internalTitle=e;var i=n+(r.length>0?"?"+r:"");this.internalPath=i;var o=this.prepareExternalUrl(i);this.urlChanges.push(o)},n.prototype.replaceState=function(t,e,n,r){this.internalTitle=e;var i=n+(r.length>0?"?"+r:"");this.internalPath=i;var o=this.prepareExternalUrl(i);this.urlChanges.push("replace: "+o)},n.prototype.onPopState=function(t){this._subject.subscribe({next:t})},n.prototype.getBaseHref=function(){return this.internalBaseHref},n.prototype.back=function(){this.urlChanges.length>0&&(this.urlChanges.pop(),this.simulatePopState(this.urlChanges.length>0?this.urlChanges[this.urlChanges.length-1]:""))},n.prototype.forward=function(){throw"not implemented"},i([e.Injectable(),function s(t,e){if("object"==typeof Reflect&&"function"==typeof Reflect.metadata)return Reflect.metadata(t,e)}("design:paramtypes",[])],n)}(n.LocationStrategy),a=function a(t){this.newUrl=t,this.pop=!0,this.type="popstate"};
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
t.SpyLocation=o,t.MockLocationStrategy=h,Object.defineProperty(t,"__esModule",{value:!0})});