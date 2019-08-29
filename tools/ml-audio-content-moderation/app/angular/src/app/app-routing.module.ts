import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { AnalysisComponent } from './analysis/analysis.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'analysis', component: AnalysisComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
