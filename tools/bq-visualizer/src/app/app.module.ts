/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {ScrollingModule} from '@angular/cdk/scrolling';
import {HttpClientModule} from '@angular/common/http';
import {ErrorHandler, Injectable, NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatMenuModule} from '@angular/material/menu';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
//import {RouterModule} from '@angular/router';
//import * as Sentry from '@sentry/browser';
import {OAuthModule} from 'angular-oauth2-oidc';
//import {AngularResizeEventModule} from 'angular-resize-event';

import {environment} from '../environments/environment';

import {AppRoutingModule} from './/app-routing.module';
import {AppComponent} from './app.component';
import {JobComponent} from './job/job.component';
import {LogDisplayComponent} from './log-display/log-display.component';
import {MainComponent} from './main/main.component';
import {PlanSideDisplayComponent} from './plan-side-display/plan-side-display.component';
import {PlanStatusCardComponent} from './plan-status-card/plan-status-card.component';
import {ProgressDisplayComponent} from './progress-display/progress-display.component';
import {ProjectsComponent} from './projects/projects.component';
import {StageDetailsComponent} from './stage-details/stage-details.component';
import {StepDetailsComponent} from './step-details/step-details.component';
import {TermsComponent} from './terms/terms.component';
import {TimingDisplayComponent} from './timing-display/timing-display.component';
import {VisDisplayComponent} from './vis-display/vis-display.component';

/*
Sentry.init({
  dsn: 'https://1cfbb9646b584e9b9e4973d39970075a@sentry.io/1370691',
  environment: environment.name,
});
*/

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  handleError(error:any) {
    //Sentry.captureException(error.originalError || error);
    throw error;
  }
}

@NgModule({
  declarations: [
    AppComponent,
    JobComponent,
    TimingDisplayComponent,
    PlanStatusCardComponent,
    ProjectsComponent,
    VisDisplayComponent,
    LogDisplayComponent,
    PlanSideDisplayComponent,
    StageDetailsComponent,
    StepDetailsComponent,
    TermsComponent,
    MainComponent,
    ProgressDisplayComponent,
  ],
  imports: [
    //AngularResizeEventModule,
    FlexLayoutModule,
    ScrollingModule,
    MatDividerModule,
    MatTabsModule,
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatCardModule,
    MatExpansionModule,
    MatInputModule,
    MatListModule,
    MatPaginatorModule,
    MatTableModule,
    MatGridListModule,
    MatMenuModule,
    MatIconModule,
    BrowserModule,
    MatButtonToggleModule,
  
    // note to self: import HttpClientModule after BrowserModule, otherwise
    // there is trouble.
    HttpClientModule,
    OAuthModule.forRoot(),
  ],
  exports:[
    PlanSideDisplayComponent
  ],
  providers: [
    {provide: ErrorHandler, useClass: SentryErrorHandler},
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
