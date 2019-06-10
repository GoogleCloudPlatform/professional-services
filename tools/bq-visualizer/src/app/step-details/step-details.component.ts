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
import {Component, Input, OnInit} from '@angular/core';

import {QueryStep} from '../rest_interfaces';

/**
 * Display step details in an easy to read fashion
 */
@Component({
  selector: 'app-step-details',
  templateUrl: './step-details.component.html',
  styleUrls: ['./step-details.component.css']
})

export class StepDetailsComponent {
  @Input('details') steps: QueryStep[] = [];
}
