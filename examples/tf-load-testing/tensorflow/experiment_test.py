import unittest

import experiment


class TestExperiment(unittest.TestCase):

    def test_params_line_enable_batching(self):
        e = experiment.Experiment(
            max_batch_size=100, enable_batching=True, tensorflow_intra_op_parallelism=100,
            some_bullshit=500)
        self.assertTrue(e.enable_batching)
        self.assertCountEqual(['"--tensorflow_intra_op_parallelism=100"', '"--enable_batching"'],
                              e._get_parameters_line())
        params = e._merge_params(
            ['"--tensorflow_intra_op_parallelism=100"', '"--enable_batching"'])
        self.assertEqual(
            '"--tensorflow_intra_op_parallelism=100", "--enable_batching"',
            params)


if __name__ == '__main__':
    unittest.main()
