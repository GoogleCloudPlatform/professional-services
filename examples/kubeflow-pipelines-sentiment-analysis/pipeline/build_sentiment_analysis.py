# Copyright 2019 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""Builds Kubeflow Pipelines component and pipeline for sentiment analysis."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import datetime
import kfp.compiler
import kfp.dsl
import kfp.gcp


class SentimentAnalysisOp(kfp.dsl.ContainerOp):
  """Defines the operation."""
  def __init__(self,
               name,
               project,
               gcp_temp_location,
               input_path,
               output_path,
               window,
               period):
    super(SentimentAnalysisOp, self).__init__(
      name=name,
      image='gcr.io/rostam-193618/sentiment-analysis:latest',
      command=[
          'mvn', 'compile', 'exec:java',
          '-Dexec.mainClass=com.google.cloud.pso.pipelines.SentimentAnalysis',
          '-Dexec.cleanupDaemonThreads=false'
      ],
      # file_outputs={'blobs': '/blobs.txt'},
      arguments=[
          '-Dexec.args=--project={} \
            --runner=DataflowRunner \
            --gcpTempLocation={} \
            --inputPath={} \
            --outputPath={} \
            --windowDuration={} \
            --windowPeriod={}'.format(
              str(project),
              str(gcp_temp_location),
              str(input_path),
              str(output_path),
              str(window),
              str(period)),
      ]
    )


@kfp.dsl.pipeline(
  name='Sentiment analysis',
  description='Analyzes the sentiments of NYTimes front page headlines.'
)
def pipeline_func(
    project=kfp.dsl.PipelineParam('project', value='<PROJECT_ID>'),
    gcp_temp_location=kfp.dsl.PipelineParam(
        'runner', value='gs://<BUCKET_NAME>/tmp'),
    input_path=kfp.dsl.PipelineParam(
        'path', value='gs://<BUCKET_NAME>/<NYTIMES-ARCHIVE-API-JSON-FILE(S)>'),
    output_path=kfp.dsl.PipelineParam(
        'path', value='gs://<BUCKET_NAME>/output/output'),
    window=kfp.dsl.PipelineParam('window', value=280),
    period=kfp.dsl.PipelineParam('period', value=1)):
  """Defines the pipeline."""
  sentiment_analysis_task = SentimentAnalysisOp(
      'SentimentAnalysis',
      project, # To authenticate.
      gcp_temp_location,
      input_path,
      output_path,
      window, period).apply(
        kfp.gcp.use_gcp_secret()) # To apply gcp service account secret.


if __name__ == '__main__':
  """Compiles the pipeline to a file."""
  filename = 'sentiment_analysis{dt:%Y%m%d_%H%M%S}.pipeline.tar.gz'.format(
      dt=datetime.datetime.now())
  filepath = './{}'.format(filename)
  kfp.compiler.Compiler().compile(pipeline_func, filepath)
