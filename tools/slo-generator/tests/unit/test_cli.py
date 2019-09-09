import os
import unittest

from slo_generator.cli import parse_args

cwd = os.path.dirname(os.path.abspath(__file__))

class TestCLI(unittest.TestCase):

    def test_parse_args(self):
        slo_config_path = f'{cwd}/fixtures/slo_config.json'
        error_budget_policy_path = f'{cwd}/fixtures/error_budget_policy.json'
        args = parse_args([
            "--slo-config",
            slo_config_path,
            "--error-budget-policy",
            error_budget_policy_path
        ])
        self.assertEqual(args.slo_config, slo_config_path)
        self.assertEqual(args.error_budget_policy, error_budget_policy_path)

    # def test_main(self):
    #     s2 = main()
    #     pass


if __name__ == '__main__':
    unittest.main()
