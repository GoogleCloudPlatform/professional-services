/*
 * Copyright 2022 Google LLC All Rights Reserved
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

package com.google.cloud.bqsh

object ReturnCodes {
  // https://docs.teradata.com/reader/jmAxXLdiDu6NiyjT6hhk7g/geGjJyn6ceNXGJyY2ye2UQ
  val NotActive: Int = 2580
  val IndexAlreadyExists: Int = 3534
  val TableAlreadyExists: Int = 3803
  val ViewAlreadyExists: Int = 3804
  val MacroAlreadyExists: Int = 3805
  val DoesNotExist: Int = 3807
}
