# QAOA Examples for Max-SAT Problems

These are examples of parsing a max-SAT problem in a proprietary format. Problems can be converted into QUBO form as described in [this article, appendix C](https://arxiv.org/pdf/1708.09780.pdf) to be later simulated with [cirq](https://github.com/quantumlib/Cirq/).

The maxSAT problem (after being converted into QUBO form) can be also saved into a proprietary format that is supported by DWave machine to be run on the hardware.

In order only parse problems, convert them into QUBO format and collect some statistics (e.g., about ancillary qubits and total qubits), you can run it as following:
```shell
python parse_raw_sat.py --dir=YOUR_DIR_WITH_PROBLEMS
```

If you would also like to save this in [format](https://github.com/dwavesystems/qbsolv) for DWave machine, please add a ```--dwave=True``` flag.
