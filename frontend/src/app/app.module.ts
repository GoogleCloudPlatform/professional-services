/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {importProvidersFrom, NgModule, Injector} from '@angular/core';
import {setAppInjector} from './app-injector';
import {NotificationContainerComponent} from './common/components/notification-container/notification-container.component';
import {BrowserModule, provideClientHydration} from '@angular/platform-browser';
import {MatTooltipModule} from '@angular/material/tooltip';
import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {provideAuth, getAuth} from '@angular/fire/auth';
import {provideFirestore, getFirestore} from '@angular/fire/firestore';
import {environment} from '../environments/environment';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatMenuModule} from '@angular/material/menu';
import {MatDividerModule} from '@angular/material/divider';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HeaderComponent} from './header/header.component';
import {FooterComponent} from './footer/footer.component';
import {HomeComponent} from './home/home.component';
import {MatStepperModule} from '@angular/material/stepper';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {ToastMessageComponent} from './common/components/toast-message/toast-message.component';
import {LoginComponent} from './login/login.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {provideAnalytics, getAnalytics} from '@angular/fire/analytics';
import {MatRadioModule} from '@angular/material/radio';
import {AngularFireModule} from '@angular/fire/compat';
import {AngularFireAuthModule} from '@angular/fire/compat/auth';
import {AngularFireDatabaseModule} from '@angular/fire/compat/database';
import {AngularFirestoreModule} from '@angular/fire/compat/firestore';
import {
  AngularFireAnalyticsModule,
  ScreenTrackingService,
  UserTrackingService,
} from '@angular/fire/compat/analytics';
import {MatCardModule} from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import {ConfirmationDialogComponent} from './common/components/confirmation-dialog/confirmation-dialog.component';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AuthInterceptor} from './auth.interceptor';
import {FunTemplatesComponent} from './fun-templates/fun-templates.component';
import {VideoComponent} from './video/video.component';
import {ArenaComponent} from './arena/arena.component';
import {NgOptimizedImage} from '@angular/common';
import {MediaGalleryComponent} from './gallery/media-gallery/media-gallery.component';
import {MediaDetailComponent} from './gallery/media-detail/media-detail.component';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MediaLightboxComponent} from './common/components/media-lightbox/media-lightbox.component';
import {VtoComponent} from './vto/vto.component';
import {ImageSelectorComponent} from './common/components/image-selector/image-selector.component';
import {MatDialogModule} from '@angular/material/dialog';
import {SourceAssetGalleryComponent} from './common/components/source-asset-gallery/source-asset-gallery.component';
import {SharedModule} from './common/shared.module';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {ImageCropperComponent} from 'ngx-image-cropper';
import {ImageCropperDialogComponent} from './common/components/image-cropper-dialog/image-cropper-dialog.component';
import {AudioComponent} from './audio/audio.component';
import {AddVoiceDialogComponent} from './components/add-voice-dialog/add-voice-dialog.component';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { FlowPromptBoxComponent } from "./common/components/flow-prompt-box/flow-prompt-box.component";

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    LoginComponent,
    ConfirmationDialogComponent,
    FunTemplatesComponent,
    VideoComponent,
    ArenaComponent,
    MediaGalleryComponent,
    MediaDetailComponent,
    MediaLightboxComponent,
    VtoComponent,
    ImageSelectorComponent,
    SourceAssetGalleryComponent,
    ImageCropperDialogComponent,
    AudioComponent,
    AddVoiceDialogComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgOptimizedImage,
    MatTooltipModule,
    MatToolbarModule,
    MatDividerModule,
    MatButtonModule,
    MatChipsModule,
    MatRadioModule,
    MatIconModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatCheckboxModule,
    MatCardModule,
    MatTableModule,
    FormsModule,
    ScrollingModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatTabsModule,
    MatDialogModule,
    SharedModule,
    MatSlideToggleModule,
    ImageCropperComponent,
    MatButtonToggleModule,
    MatSliderModule,
    NotificationContainerComponent,
    FlowPromptBoxComponent
],
  providers: [
    provideClientHydration(),
    provideHttpClient(withInterceptorsFromDi()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideAnalytics(() => getAnalytics()),
    importProvidersFrom([
      AngularFireModule.initializeApp(environment.firebase),
      AngularFireAuthModule,
      AngularFirestoreModule,
      AngularFireDatabaseModule,
      AngularFireAnalyticsModule,
    ]),
    {
      provide: ScreenTrackingService, // Automatically track screen views
    },
    {
      provide: UserTrackingService, // Automatically track user interactions
    },
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(injector: Injector) {
    setAppInjector(injector);
  }
}
