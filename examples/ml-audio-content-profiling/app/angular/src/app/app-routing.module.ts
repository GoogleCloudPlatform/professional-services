import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { AnalysisComponent } from './analysis/analysis.component';

const ROUTES: Routes = [
  { path: '', component: MainComponent },
  { path: 'analysis', component: AnalysisComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(ROUTES)],
  exports: [RouterModule],
})
/**Class creates routing for navigating between pages.*/
export class AppRoutingModule {}
