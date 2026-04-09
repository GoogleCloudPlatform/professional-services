# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Example of a custom Python tool for a generic automation task.
# This function will be loaded dynamically by the Gemini Agent.


def calculate_shipping_tax(zip_code: str, order_total: float) -> float:
    """
    Calculates the estimated shipping tax based on the zip code.

    Args:
        zip_code: The 5-digit destination zip code.
        order_total: The total amount of the order before tax.

    Returns:
        The calculated tax amount.
    """
    if not zip_code.isdigit() or len(zip_code) != 5:
        raise ValueError("Invalid zip code format.")

    # Simulated tax logic based on region (first digit of zip)
    region_code = int(zip_code[0])

    if region_code < 3:
        rate = 0.05  # East Coast
    elif region_code < 6:
        rate = 0.07  # Midwest/South
    else:
        rate = 0.09  # West Coast

    return round(order_total * rate, 2)
