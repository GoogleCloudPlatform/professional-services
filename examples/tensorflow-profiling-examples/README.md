# TensorFlow Profiling Examples

Before launching training job, please copy the raw data and define the environmental variables (the bucket for staging and the bucket where you are going to store data as well as training job's outputs)
`export BUCKET=YOUR_BUCKET
gsutil -m cp gs://cloud-training-demos/babyweight/preproc/* gs://$BUCKET/babyweight/preproc/
export BUCKET_STAGING=YOUR_STAGING_BUCKET`
You also need to have [bazel](https://docs.bazel.build/versions/master/install.html) installed.
The code below is based on this [codelab](https://codelabs.developers.google.com/codelabs/scd-babyweight2/index.html?index=..%2F..%2Fcloud-quest-scientific-data#0) (you can find more [here](https://github.com/GoogleCloudPlatform/training-data-analyst/tree/master/blogs/babyweight)).

## Profiler hooks
You can dump profiles for a every *n*-th step. We are going to demonstrate how to collect dumps both in distributed mode as well as when training is don on a single machine (including training with a GPU accelerator).
After you've trained a model (see examples below), you need to copy the dumps localy in order to inspect them. You can do it as follows:
```shell
rm -rf /tmp/profiler
mkdir -p /tmp/profiler
gsutil -m cp -r $OUTDIR/timeline*.json /tmp/profiler
```
And now you can launch a trace event profiling tool in your Chrome browser (chrome://tracing), load a specific timeline and visually inspect it.

### Training on a single CPU machine: BASIC CMLE tier
You can launch the job as following:
```shell
OUTDIR=gs://$BUCKET/babyweight/hooks_basic
JOBNAME=babyweight_$(date -u +%y%m%d_%H%M%S)
gsutil -m rm -rf $OUTDIR
gcloud ml-engine jobs submit training $JOBNAME \
  --region=us-west1 \
  --module-name=trainer-hooks.task \
  --package-path=trainer-hooks \
  --job-dir=$OUTDIR \
  --staging-bucket=gs://$BUCKET_STAGING \
  --scale-tier=BASIC \
  --runtime-version="1.10" \
  -- \
  --bucket=$BUCKET/babyweight \
  --output_dir=${OUTDIR} \
  --eval_int=1200 \
  --train_steps=50000
```

### Distributed training on CPUs: STANDARD tier
You can launch the job as following:
```shell
OUTDIR=gs://$BUCKET/babyweight/hooks_standard
JOBNAME=babyweight_$(date -u +%y%m%d_%H%M%S)
gsutil -m rm -rf $OUTDIR
gcloud ml-engine jobs submit training $JOBNAME \
  --region=us-west1 \
  --module-name=trainer-hooks.task \
  --package-path=trainer-hooks \
  --job-dir=$OUTDIR \
  --staging-bucket=gs://$BUCKET_STAGING \
  --scale-tier=STANDARD_1 \
  --runtime-version="1.10" \
  -- \
  --bucket=$BUCKET/babyweight \
  --output_dir=${OUTDIR} \
  --train_steps=50000
```

### Training on GPU:
```shell
OUTDIR=gs://$BUCKET/babyweight/hooks_gpu
JOBNAME=babyweight_$(date -u +%y%m%d_%H%M%S)
gsutil -m rm -rf $OUTDIR
gcloud ml-engine jobs submit training $JOBNAME \
  --region=us-west1 \
  --module-name=trainer-hooks.task \
  --package-path=trainer-hooks \
  --job-dir=$OUTDIR \
  --staging-bucket=gs://$BUCKET_STAGING \
  --scale-tier=BASIC_GPU \
  --runtime-version="1.10" \
  -- \
  --bucket=$BUCKET/babyweight \
  --output_dir=${OUTDIR} \
  --batch_size=8192 \
  --train_steps=21000
```

### Defining you own schedule
```shell
OUTDIR=gs://$BUCKET/babyweight/hooks_basic-ext
JOBNAME=babyweight_$(date -u +%y%m%d_%H%M%S)
gsutil -m rm -rf $OUTDIR
gcloud ml-engine jobs submit training $JOBNAME \
  --region=us-west1 \
  --module-name=trainer-hooks-ext.task \
  --package-path=trainer-hooks-ext \
  --job-dir=$OUTDIR \
  --staging-bucket=gs://$BUCKET_STAGING \
  --scale-tier=BASIC \
  --runtime-version="1.10" \
  -- \
  --bucket=$BUCKET/babyweight \
  --output_dir=${OUTDIR} \
  --eval_int=1200 \
  --train_steps=15000
```

## Deep profiling
We can collect a deep profiling dump that can be later analyzed with a profiling CLI tool or with a profiler-ui as described in a post (ADD LINK HERE).
Launch the training job as following:
```shell
OUTDIR=gs://$BUCKET/babyweight/profiler_standard
JOBNAME=babyweight_$(date -u +%y%m%d_%H%M%S)
gsutil -m rm -rf $OUTDIR
gcloud ml-engine jobs submit training $JOBNAME \
  --region=us-west1 \
  --module-name=trainer-deep-profiling.task \
  --package-path=trainer-deep-profiling \
  --job-dir=$OUTDIR \
  --staging-bucket=gs://$BUCKET_STAGING \
  --scale-tier=STANDARD_1 \
  --runtime-version="1.10" \
  -- \
  --bucket=$BUCKET/babyweight \
  --output_dir=${OUTDIR} \
  --train_steps=100000
```

### Profiler CLI
1. In order to use [profiler CLI](https://github.com/tensorflow/tensorflow/blob/9590c4c32dd4346ea5c35673336f5912c6072bf2/tensorflow/core/profiler/README.md), you need to build the profiler first:
`git clone https://github.com/tensorflow/tensorflow.git
cd tensorflow
bazel build -c opt tensorflow/core/profiler:profiler`
2. Copy dumps locally:
`rm -rf /tmp/profiler
mkdir -p /tmp/profiler
gsutil -m cp -r $OUTDIR/profiler /tmp`
3. Launch the profiler with `bazel-bin/tensorflow/core/profiler/profiler --profile_path=/tmp/profiler/$(ls /tmp/profiler/ | head -1)`

### Profiler UI
You can also use a [profiler-ui](https://github.com/tensorflow/profiler-ui), i.e. a web interface for a tensorflow profiler.
1. If you'd like to install [pprof](https://github.com/google/pprof), please follow the [installation instructions](https://github.com/google/pprof#building-pprof).
2. Clone the repository:
`git clone https://github.com/tensorflow/profiler-ui.git
cd profiler-ui`
3. Copy dumps locally:
`rm -rf /tmp/profiler
mkdir -p /tmp/profiler
gsutil -m cp -r $OUTDIR/$MODEL/profiler /tmp`
4. Launch the profiler with `python ui.py --profile_context_path=/tmp/profiler/$(ls /tmp/profiler/ | head -1)`
