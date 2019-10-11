"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createAppModule(tree, path) {
    tree.create(path || '/src/app/app.module.ts', `
    import { BrowserModule } from '@angular/platform-browser';
    import { NgModule } from '@angular/core';
    import { AppComponent } from './app.component';

    @NgModule({
    declarations: [
      AppComponent
    ],
    imports: [
      BrowserModule
    ],
    providers: [],
    bootstrap: [AppComponent]
    })
    export class AppModule { }
  `);
    return tree;
}
exports.createAppModule = createAppModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWFwcC1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3Rlc3QvY3JlYXRlLWFwcC1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFVQSxTQUFnQixlQUFlLENBQUMsSUFBa0IsRUFBRSxJQUFhO0lBQy9ELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLHdCQUF3QixFQUFFOzs7Ozs7Ozs7Ozs7Ozs7O0dBZ0I3QyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFwQkQsMENBb0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHsgVW5pdFRlc3RUcmVlIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGVzdGluZyc7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFwcE1vZHVsZSh0cmVlOiBVbml0VGVzdFRyZWUsIHBhdGg/OiBzdHJpbmcpOiBVbml0VGVzdFRyZWUge1xuICB0cmVlLmNyZWF0ZShwYXRoIHx8ICcvc3JjL2FwcC9hcHAubW9kdWxlLnRzJywgYFxuICAgIGltcG9ydCB7IEJyb3dzZXJNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJztcbiAgICBpbXBvcnQgeyBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICAgIGltcG9ydCB7IEFwcENvbXBvbmVudCB9IGZyb20gJy4vYXBwLmNvbXBvbmVudCc7XG5cbiAgICBATmdNb2R1bGUoe1xuICAgIGRlY2xhcmF0aW9uczogW1xuICAgICAgQXBwQ29tcG9uZW50XG4gICAgXSxcbiAgICBpbXBvcnRzOiBbXG4gICAgICBCcm93c2VyTW9kdWxlXG4gICAgXSxcbiAgICBwcm92aWRlcnM6IFtdLFxuICAgIGJvb3RzdHJhcDogW0FwcENvbXBvbmVudF1cbiAgICB9KVxuICAgIGV4cG9ydCBjbGFzcyBBcHBNb2R1bGUgeyB9XG4gIGApO1xuXG4gIHJldHVybiB0cmVlO1xufVxuIl19