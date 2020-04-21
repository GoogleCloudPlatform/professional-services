# Copyright 2019 Google LLC
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

"""Module for creating optimizers in tensorflow for model training."""

import tensorflow as tf


class Optimizer(object):
    """
    Creates an instance of optimizer whose attributes are extended to
    tf optimizers.
    """

    def __init__(
            self,
            rho=0.95,
            epsilon=1e-08,
            use_locking=False,
            global_step=tf.train.get_global_step(),
            initial_gradient_squared_accumulator_value=0.1,
            l1_regularization_strength=0.0,
            l2_regularization_strength=0.0,
            beta1=0.9,
            beta2=0.999,
            learning_rate_power=-0.5,
            initial_accumulator_value=0.1,
            accum_name=None,
            linear_name=None,
            l2_shrinkage_regularization_strength=0.0,
            momentum=0.0,
            use_nesterov=False,
            decay=0.9,
            centered=False,
            lr_decay=0.9,
            decay_steps=2500):
        """Total number of arguments any optimizer can take.

        Arguments:
            rho : A Tensor containing the value to minimize or a callable taking no arguments which returns the value to minimize.
                  When eager execution is enabled it must be a callable.
            epsilon : Small value to avoid zero denominator.
            use_locking : boolean, If True use locks for update operations.
            global_step : tf.train.get_global_step() object
            initial_gradient_squared_accumulator_value : float,
            l1_regularization_strength : A float value, must be greater than or equal to zero.
            l2_regularization_strength : A float value, must be greater than or equal to zero.
            beta1 : A float value or a constant float tensor. The exponential decay rate for the 1st moment estimates.
            beta2 : A float value or a constant float tensor. The exponential decay rate for the 2nd moment estimates.
            learning_rate_power : A float value, must be less or equal to zero.
            initial_accumulator_value : The starting value for accumulators. Only zero or positive values are allowed.
            accum_name : The suffix for the variable that keeps the gradient squared accumulator. If not present, defaults to name.
            linear_name : The suffix for the variable that keeps the linear gradient accumulator. If not present, defaults to name + "_1".
            l2_shrinkage_regularization_strength : A float value, must be greater than or equal to zero.
                    This differs from L2 above in that the L2 above is a stabilization penalty, whereas this L2 shrinkage is a magnitude penalty.
            momentum : A scalar tensor.
            use_nesterov :  If True use Nesterov Momentum. See Sutskever et al., 2013.
                          This implementation always computes gradients at the value of the variable(s) passed to the optimizer.
                          Using Nesterov Momentum makes the variable(s) track the values called theta_t + mu*v_t in the paper.
            decay : Discounting factor for the history/coming gradient
            centered : boolean, If True, gradients are normalized by the estimated variance of the gradient; if False, by the uncentered second moment.
                    Setting this to True may help with training, but is slightly more expensive in terms of computation and memory. Defaults to False.
            lr_decay : A float value, must be greater than or equal to zero.
            decay_steps : A scalar int32 or int64 Tensor or a Python number. Must be positive. See the decay computation above.
        """
        self.rho = rho
        self.epsilon = epsilon
        self.use_locking = use_locking
        self.global_step = global_step
        self.initial_gradient_squared_accumulator_value = (
            initial_gradient_squared_accumulator_value)
        self.initial_accumulator_value = initial_accumulator_value
        self.l1_regularization_strength = l1_regularization_strength
        self.l2_regularization_strength = l2_regularization_strength
        self.beta1 = beta1
        self.beta2 = beta2
        self.learning_rate_power = learning_rate_power
        self.l2_shrinkage_regularization_strength = (
            l2_shrinkage_regularization_strength)
        self.momentum = momentum
        self.use_nesterov = use_nesterov
        self.accum_name = accum_name
        self.linear_name = linear_name
        self.decay = decay
        self.centered = centered
        self.lr_decay = lr_decay
        self.decay_steps = decay_steps

    def decay_lr(self, learning_rate):
        """Creates an instance of exponential decay fn.

        Arguments:
            learning_rate : float, Learning rate for the optimizer
        """
        return tf.train.exponential_decay(
            learning_rate=learning_rate,
            decay_rate=self.lr_decay,
            decay_steps=self.decay_steps,
            global_step=tf.train.get_global_step()
        )

    def adadelta(self, learning_rate):
        """Sets up an instance of ada delta optimizer.
        Infers most parameters from init.

        Arguments:
            learning_rate : float, Learning rate for the optimizer
        """
        return tf.train.AdadeltaOptimizer(
            learning_rate=learning_rate,
            rho=self.rho,
            epsilon=self.epsilon,
            use_locking=self.use_locking,
            name='Adadelta'
        )

    def adagrad(self, learning_rate):
        """Sets up an instance of adagrad optimizer.

        Arguments:
            learning_rate : float, Learning rate for the optimizer
        """
        return tf.train.AdagradOptimizer(
            learning_rate=learning_rate,
            initial_accumulator_value=self.initial_accumulator_value,
            use_locking=self.use_locking,
            name='Adagrad'
        )

    def adagradDA(self, learning_rate):
        """Sets up an instance of adagradDA optimizer.

        Arguments:
            learning_rate : float, Learning rate for the optimizer
        """
        return tf.train.AdagradDAOptimizer(
            learning_rate=learning_rate,
            global_step=self.global_step,
            initial_gradient_squared_accumulator_value=(
                self.initial_gradient_squared_accumulator_value),
            l1_regularization_strength=self.l1_regularization_strength,
            l2_regularization_strength=self.l2_regularization_strength,
            use_locking=self.use_locking,
            name='AdagradDA'
        )

    def adam(self, learning_rate):
        """Sets up an instance of adam optimizer.

        Arguments:
            learning_rate : float, Learning rate for the optimizer
        """
        return tf.train.AdamOptimizer(
            learning_rate=learning_rate,
            beta1=self.beta1,
            beta2=self.beta2,
            epsilon=self.epsilon,
            use_locking=self.use_locking,
            name='Adam'
        )

    def ftrl(self, learning_rate):
        """Sets up an instance of ftrl optimizer.

        Arguments:
            learning_rate : float, Learning rate for the optimizer
        """
        return tf.train.FtrlOptimizer(
            learning_rate=learning_rate,
            learning_rate_power=self.learning_rate_power,
            initial_accumulator_value=self.initial_accumulator_value,
            l1_regularization_strength=self.l1_regularization_strength,
            l2_regularization_strength=self.l2_regularization_strength,
            use_locking=self.use_locking,
            name='Ftrl',
            accum_name=self.accum_name,
            linear_name=self.linear_name,
            l2_shrinkage_regularization_strength=(
                self.l2_shrinkage_regularization_strength)
        )

    @classmethod
    def gradient_descent(cls, learning_rate):
        """Sets up an instance of simple gradient descent optimizer.

        Arguments:
            learning_rate : float, Learning rate for the optimizer
        """
        return tf.train.GradientDescentOptimizer(
            learning_rate=learning_rate,
            use_locking=False,
            name='GradientDescent'
        )

    def momentum_optimizer(self, learning_rate):
        """Sets up an instance of momentum optimizer.

        Arguments:
            learning_rate : float, Learning rate for the optimizer
        """
        return tf.train.MomentumOptimizer(
            learning_rate=learning_rate,
            momentum=self.momentum,
            use_locking=self.use_locking,
            use_nesterov=self.use_nesterov,
            name='MomentumOptimizer'
        )

    def proximal_adagrad(self, learning_rate):
        """Sets up an instance of proximal adagrad optimizer.

        Arguments:
            learning_rate : float, Learning rate for the optimizer
        """
        return tf.train.ProximalAdagradOptimizer(
            learning_rate=learning_rate,
            initial_accumulator_value=self.initial_accumulator_value,
            l1_regularization_strength=self.l1_regularization_strength,
            l2_regularization_strength=self.l2_regularization_strength,
            use_locking=self.use_locking,
            name='ProximalAdagrad'
        )

    def proximal_gradient_desc(self, learning_rate):
        """Sets up an instance of proximal gradient descent optimizer.

        Arguments:
            learning_rate : float, Learning rate for the optimizer"""
        return tf.train.ProximalGradientDescentOptimizer(
            learning_rate=learning_rate,
            l1_regularization_strength=self.l1_regularization_strength,
            l2_regularization_strength=self.l2_regularization_strength,
            use_locking=False,
            name='ProximalGradientDesc'
        )

    def rmsprop(self, learning_rate):
        """Sets up an instance of rms prop optimizer.

        Arguments:
            learning_rate : float, Learning rate for the optimizer
        """
        return tf.train.RMSPropOptimizer(
            learning_rate=learning_rate,
            decay=self.decay,
            momentum=self.momentum,
            epsilon=self.epsilon,
            use_locking=self.use_locking,
            centered=self.centered,
            name='RmsProp'
        )

    def set_opt_wrap(self, name, learning_rate, decay):
        """
        Wrapper fn for _set_opt function

        Arguments:
            name : str, Name of the optimizer to be used
            learning_rate : float, Learning rate for the optimizer
            decay : Boolean, whether or not to use learning rate decay
        Returns:
            _set_opt function
        """
        return self._set_opt(name, learning_rate, decay)

    def _set_opt(self, name, learning_rate, decay):
        """Choose the optimizer and infer parameters from init.
        Arguments:
          name : str, Name of the optimizer to be used
          learning_rate : float, Learning rate for the optimizer
          decay : Boolean, whether or not to use learning rate decay
        Returns:
          Instance of an optimizer with paramters parsed
        """
        if decay:
            learning_rate = self.decay_lr(learning_rate)
        else:
            learning_rate = learning_rate

        optimizer_mapping = {
            'adadelta': self.adadelta,
            'adagradDA': self.adagradDA,
            'adagrad': self.adagrad,
            'adam': self.adam,
            'gradientdescent': self.gradient_descent,
            'momentumoptimizer': self.momentum_optimizer,
            'proximaladagrad': self.proximal_adagrad,
            'proximalgradientdesc': self.proximal_gradient_desc,
            'rmsprop': self.rmsprop,
            'ftrl': self.ftrl
        }
        return optimizer_mapping[name](learning_rate)
