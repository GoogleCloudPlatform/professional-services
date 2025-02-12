# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

variable "project" {
  type        = string
  description = "The Google Cloud Platform (GCP) project within which resources are provisioned"
}

variable "source_bucket_prefix" {
  type        = string
  description = "The Google Cloud storage bucket name prefix of the data source"
  default     = "source"
}

variable "beam_examples_bucket" {
  type        = string
  description = "The Google Cloud storage bucket containing Apache Beam examples"
  default     = "apache-beam-samples"
}

variable "beam_examples_paths" {
  type        = list(string)
  description = "The Google Cloud storage object path containing Apache Beam examples"
  default = [
    "shakespeare/1kinghenryiv.txt",
    "shakespeare/1kinghenryvi.txt",
    "shakespeare/2kinghenryiv.txt",
    "shakespeare/2kinghenryvi.txt",
    "shakespeare/3kinghenryvi.txt",
    "shakespeare/allswellthatendswell.txt",
    "shakespeare/antonyandcleopatra.txt",
    "shakespeare/asyoulikeit.txt",
    "shakespeare/comedyoferrors.txt",
    "shakespeare/coriolanus.txt",
    "shakespeare/cymbeline.txt",
    "shakespeare/hamlet.txt",
    "shakespeare/juliuscaesar.txt",
    "shakespeare/kinghenryv.txt",
    "shakespeare/kinghenryviii.txt",
    "shakespeare/kingjohn.txt",
    "shakespeare/kinglear-hashtag.txt",
    "shakespeare/kinglear.txt",
    "shakespeare/kingrichardii.txt",
    "shakespeare/kingrichardiii.txt",
    "shakespeare/loverscomplaint.txt",
    "shakespeare/loveslabourslost.txt",
    "shakespeare/macbeth.txt",
    "shakespeare/measureforemeasure.txt",
    "shakespeare/merchantofvenice.txt",
    "shakespeare/merrywivesofwindsor.txt",
    "shakespeare/midsummersnightsdream.txt",
    "shakespeare/muchadoaboutnothing.txt",
    "shakespeare/othello.txt",
    "shakespeare/periclesprinceoftyre.txt",
    "shakespeare/rapeoflucrece.txt",
    "shakespeare/romeoandjuliet.txt",
    "shakespeare/sonnets.txt",
    "shakespeare/tamingoftheshrew.txt",
    "shakespeare/tempest.txt",
    "shakespeare/timonofathens.txt",
    "shakespeare/titusandronicus.txt",
    "shakespeare/troilusandcressida.txt",
    "shakespeare/twelfthnight.txt",
    "shakespeare/twogentlemenofverona.txt",
    "shakespeare/various.txt",
    "shakespeare/venusandadonis.txt",
    "shakespeare/winterstale.txt",
  ]
}
