import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {JobComponent} from './job/job.component';
import {LogDisplayComponent} from './log-display/log-display.component';
import {TimingDisplayComponent} from './timing-display/timing-display.component';
import {VisDisplayComponent} from './vis-display/vis-display.component';

const routes: Routes = [
  {path: '', redirectTo: '/jobs', pathMatch: 'full'},
  {path: 'jobs', component: JobComponent},
  {path: 'job/tree', component: VisDisplayComponent},
  {path: 'job/timing', component: TimingDisplayComponent},
  {path: 'log', component: LogDisplayComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
