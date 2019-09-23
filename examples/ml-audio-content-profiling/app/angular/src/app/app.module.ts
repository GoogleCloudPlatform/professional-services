import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { Restangular, RestangularModule } from 'ngx-restangular';
import { AppRoutingModule } from './app-routing.module';
import { MainComponent } from './main/main.component';
import {
  MatButtonModule,
  MatProgressSpinnerModule,
  MatSliderModule,
  MatToolbarModule,
  MatCardModule,
  MatListModule,
  MatIconModule,
  MatExpansionModule,
  MatTabsModule,
  MatGridListModule,
  MatTableModule,
  MatPaginatorModule,
  MatCheckboxModule,
  MatSidenavModule,
  MatDialogModule,
  MatProgressBarModule,
  MatFormFieldModule,
  MatSelectModule,
} from '@angular/material';
import { FormsModule } from '@angular/forms';
import { AnalysisComponent } from './analysis/analysis.component';
import { EntityModalComponent } from './entity-modal/entity-modal.component';
import { HistogramComponent } from './histogram/histogram.component';
import { ErrorModalComponent } from './error-modal/error-modal.component';

// Function for setting the default restangular configuration
export function RestangularConfigFactory(RestangularProvider: any) {
  let baseUrl = '/';
  RestangularProvider.setBaseUrl(baseUrl);
  RestangularProvider.setDefaultHeaders({
    Authorization: 'Bearer UDXPx-Xko0w4BRKajozCVy20X11MRZs1',
  });
}

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    AnalysisComponent,
    EntityModalComponent,
    HistogramComponent,
    ErrorModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RestangularModule.forRoot(RestangularConfigFactory),
    BrowserAnimationsModule,
    MatButtonModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    FormsModule,
    MatExpansionModule,
    MatTabsModule,
    MatGridListModule,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatDialogModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [EntityModalComponent, ErrorModalComponent],
})
/**Class to important necessary modules and components.*/
export class AppModule {}
