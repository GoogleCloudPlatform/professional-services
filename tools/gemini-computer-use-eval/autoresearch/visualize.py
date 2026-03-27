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

import csv
import os
import json


def generate_dashboard():
    tsv_path = "autoresearch/results.tsv"
    if not os.path.exists(tsv_path):
        print(f"File not found: {tsv_path}")
        return

    runs = []
    with open(tsv_path, "r") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for idx, row in enumerate(reader):
            # Parse row: run_id, score, avg_steps, avg_tokens, status, description
            runs.append(
                {
                    "experiment": idx + 1,
                    "run_id": row["run_id"],
                    "score": float(row["score"]),
                    "avg_steps": float(row["avg_steps"]),
                    "avg_tokens": float(row["avg_tokens"]),
                    "status": row["status"],
                    "description": row["description"],
                }
            )

    if not runs:
        print("No data in results.tsv")
        return

    # Extract data for plotting
    labels = [f"Exp {r['experiment']}" for r in runs]
    scores = [r["score"] for r in runs]
    steps = [r["avg_steps"] for r in runs]
    tokens = [r["avg_tokens"] for r in runs]

    # Point colors based on status
    bg_colors = []
    for r in runs:
        if r["status"] == "KEEP":
            bg_colors.append("rgba(46, 204, 113, 1)")  # Green
        elif r["status"] == "CRASH":
            bg_colors.append("rgba(231, 76, 60, 1)")  # Red
        else:
            bg_colors.append("rgba(149, 165, 166, 0.5)")  # Gray (Discard)

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Autoresearch Progress</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body {{ font-family: sans-serif; background: #f4f6f8; margin: 0; padding: 20px; }}
            .container {{ max-width: 1200px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            canvas {{ margin-bottom: 40px; }}
            h1 {{ color: #2c3e50; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Prompt Autoresearch Progress</h1>
            <canvas id="scoreChart" height="100"></canvas>
            <canvas id="stepsChart" height="80"></canvas>
            <canvas id="tokensChart" height="80"></canvas>
        </div>
        <script>
            const runs = {json.dumps(runs)};
            const labels = {json.dumps(labels)};
            const bgColors = {json.dumps(bg_colors)};
            
            const commonOptions = {{
                plugins: {{
                    tooltip: {{
                        callbacks: {{
                            label: function(context) {{
                                const run = runs[context.dataIndex];
                                return [
                                    `Score: ${{run.score.toFixed(2)}}`,
                                    `Steps: ${{run.avg_steps.toFixed(1)}}`,
                                    `Tokens: ${{run.avg_tokens.toFixed(0)}}`,
                                    `Status: ${{run.status}}`,
                                    `Desc: ${{run.description}}`
                                ];
                            }}
                        }}
                    }}
                }}
            }};

            // Score Chart
            new Chart(document.getElementById('scoreChart'), {{
                type: 'line',
                data: {{
                    labels: labels,
                    datasets: [{{
                        label: 'Reward Score',
                        data: {json.dumps(scores)},
                        borderColor: 'rgba(52, 152, 219, 1)',
                        pointBackgroundColor: bgColors,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        fill: false,
                        tension: 0.1
                    }}]
                }},
                options: Object.assign({{}}, commonOptions, {{
                    scales: {{ y: {{ title: {{ display: true, text: 'Reward (Higher is Better)' }} }} }}
                }})
            }});

            // Steps Chart
            new Chart(document.getElementById('stepsChart'), {{
                type: 'bar',
                data: {{
                    labels: labels,
                    datasets: [{{
                        label: 'Avg Steps',
                        data: {json.dumps(steps)},
                        backgroundColor: bgColors,
                    }}]
                }},
                options: Object.assign({{}}, commonOptions, {{
                    scales: {{ y: {{ title: {{ display: true, text: 'Steps (Lower is Better)' }} }} }}
                }})
            }});

            // Tokens Chart
            new Chart(document.getElementById('tokensChart'), {{
                type: 'bar',
                data: {{
                    labels: labels,
                    datasets: [{{
                        label: 'Avg Tokens',
                        data: {json.dumps(tokens)},
                        backgroundColor: bgColors,
                    }}]
                }},
                options: Object.assign({{}}, commonOptions, {{
                    scales: {{ y: {{ title: {{ display: true, text: 'Tokens (Lower is Better)' }} }} }}
                }})
            }});
        </script>
    </body>
    </html>
    """

    output_path = "autoresearch/progress.html"
    with open(output_path, "w") as f:
        f.write(html_content)
    print(f"Dashboard generated at {output_path}")


if __name__ == "__main__":
    generate_dashboard()
