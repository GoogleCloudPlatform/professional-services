After you’ve built a successful prototype of a machine learning model, there’s still plenty of
things to do. To some extent, your journey as an ML engineer only begins here. You’d need to take
care about plenty of things such as operationalization of your model: monitoring, CI/CD, reliability
and reproducibility, and many others. What’s important, you should expect that other engineers would
be working on your code and occasionally changing it. Your code should be readable and maintainable.
One way to achieve this  is splitting it into smaller pieces (separate functions and classes) that
are covered by unit tests. This helps you to find errors earlier (before submitting a training job
or - even worse - deploying a model to production to find out serving is broken because of a typo)

Get to know recommended [practices](https://www.tensorflow.org/community/contribute/tests) for testing Tensorflow code. It’s also typically a good idea to
look at test cases examples in TensorFlow source code. Use [tf.test.TestCase](https://www.tensorflow.org/api_docs/python/tf/test/TestCase) class to implement your
unit tests. Get to know this class and how it makes your life easier - e.g., it takes care to use
the same random seed (to make your tests more stable), has a lot of useful assertions as well as
takes care about creating temp dir or managing TensorFlow sessions.

Start simple and continue extending your test coverage as long as your model gets more complex and
needs more debugging. It’s typically a good idea to add a unit test each time you fix any specific
error to make sure this error wouldn’t occur again.

## Testing custom layers
When you implement custom training routines, the recommended
practice is to create
[custom layers](https://www.tensorflow.org/guide/keras/custom_layers_and_models)
by subclassing [tf.keras.layers.Layer](https://www.tensorflow.org/api_docs/python/tf/keras/layers/Layer).
This gives you a possibility to isolate (and test) logical pieces of your code, which makes it more
readable and easier to maintain.

Let's play with `ExampleBlock` - a simple custom layer. First, we’d like to test whether the shape of the output tensor is the one we expect.
```python
class LinearBlockTest(tf.test.TestCase):
   def test_shape_default(self):
       x = np.ones((4, 32))
       layer = example.LinearBlock()
       output = layer(x)
       self.assertAllEqual(output.shape, (4, 32))
```

You can find more examples testing output shape by exploring the `LinearBlockTest` class.

The next thing we can also check is the actual output. It’s not always needed but it might be a good
idea when you have a layer with a custom logic that needs to be double-checked.
Please note that despite using initializers for weights, our test is not flaky (tf.test.TestCase
takes care about it).
We can also patch various pieces of the layer we’re concerned about (other layers used, loss
functions, stdout, etc.) to check the desired output. Let’s have a look at the example where we’ve
patched initializer:
```python
@patch.object(initializers, 'get', lambda _: tf.compat.v1.keras.initializers.Ones)
def test_output_ones(self):
   dim = 4
   batch_size = 3
   output_dim = 2
   x = np.ones((batch_size, dim))
   layer = example.LinearBlock(output_dim)
   output = layer(x)
   expected_output = np.ones((batch_size, output_dim)) * (dim + 1)
   self.assertAllClose(output, expected_output, atol=1e-4)
```

## Testing custom keras models
The easiest way to test your model is to prepare a small fake dataset and run a few training steps on
this dataset to check whether the model can be successfully trained, and validation and prediction
also works. Please keep in mind, that successfully means all steps can be run without generating
errors, but in the basic case we don’t check whether the training itself makes sense - i.e., whether
a loss decreases to any meaningful value. But more about it later.
Let’s have a look at a simple example of how to test a model from this [tutorial](https://www.tensorflow.org/tutorials/keras/regression).
```python
class ExampleModelTest(tf.test.TestCase):
   def _get_data(self):
       dataset_path = tf.keras.utils.get_file(
           'auto-mpg.data',
           'http://archive.ics.uci.edu/ml/machine-learning-databases/auto-mpg/auto-mpg.data')
       column_names = ['MPG','Cylinders','Displacement','Horsepower','Weight',
                       'Acceleration', 'Model Year', 'Origin']
       dataset = pd.read_csv(dataset_path, names=column_names, na_values='?', comment='\t',
                             sep=' ', skipinitialspace=True)
       dataset = dataset.dropna()
       dataset['Origin'] = dataset['Origin'].map({1: 'USA', 2: 'Europe', 3: 'Japan'})
       dataset = pd.get_dummies(dataset, prefix='', prefix_sep='')
       dataset = dataset[dataset.columns].astype('float64')
       labels = dataset.pop('MPG')
       return dataset, labels

   def test_basic(self):
       train_dataset, train_labels = self._get_data()
       dim = len(train_dataset.keys())
       example_model = example.get_model(dim)
       test_ind = train_dataset.sample(10).index
       test_dataset, test_labels = train_dataset.iloc[test_ind], train_labels.iloc[test_ind]
       history = example_model.fit(
           train_dataset, train_labels, steps_per_epoch=2, epochs=2,
           batch_size=10,
           validation_split=0.1,
           validation_steps=1)
       self.assertAlmostEqual(
           history.history['mse'][-1],
           history.history['loss'][-1],
           places=2)
       _ = example_model.evaluate(test_dataset, test_labels)
       _ = example_model.predict(test_dataset)
```
You can find additional examples by looking at `ExampleModelTest` class.

## Testing custom estimators
If we’re using tf.estimator API, we can use the same approach. There are a few moments to keep in
mind though. First, if you might want to convert your pandas DataFrame (you’ve read from csv or other
source) into a [tf.data.Dataset](https://www.tensorflow.org/api_docs/python/tf/data/Dataset) to make a dataset for testing purposes:
```
faked_dataset = tf.data.Dataset.from_tensor_slices((dict(df.pop(LABEL)), df[LABEL].values))
return faked_dataset.repeat().batch(batch_size)
```

Tensorflow training routine consists of two main pieces - first, the graph is created and compiled,
and then the same computational graph is run over input data step by step. You can test whether the 
graph can be compiled in train/eval/... mode with just invoking the `model_fn`:
```python
...
features = make_faked_batch(...)
model_fn(features, {}, tf.estimator.ModeKeys.TRAIN))
```

Or you actually can create an estimator run a few training steps on a faked dataset you’ve prepared:
```python
...
e = tf.estimator.Estimator(model_fn, config=tf.estimator.RunConfig(model_dir=self.get_temp_dir())))
e.train(input_fn=lambda: make_faked_batch(...), steps=3)
```

## Testing model logic
All above guarantees only that our model is formally correct (i.e., tensor input and output shapes
match one another, there’s no typos and other formal errors in the code). Having these unit tests
typically is a huge step forward since it speeds up the model development process. We still might
want to extend the test coverage, but it’s also worth looking into other possibilities, for example:
* use [TensorFlow Data Validation](https://www.tensorflow.org/tfx/tutorials/data_validation/tfdv_basic) to inspect your data for anomalies and skewness
* use [TensorFlow Model Analysis](https://www.tensorflow.org/tfx/tutorials/model_analysis/tfma_basic) to check for performance of your trained model
* have a look how [PerfZero](https://github.com/tensorflow/benchmarks/tree/master/perfzero) helps
debug and track TensorFlow models performance with help of [tf.test.Benchmark](https://www.tensorflow.org/api_docs/python/tf/test/Benchmark)
* implement integration tests if needed
* consider adding unit tests for your tfx/kubeflow pipelines
* implement proper monitoring and alerting for your ML models
* check additional materials, e.g. [What is your ML test score](https://research.google/pubs/pub45742/)
and [Testing & Debugging ML systems](https://developers.google.com/machine-learning/testing-debugging) course
