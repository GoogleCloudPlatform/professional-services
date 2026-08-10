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
"""Interactive dashboard for comparing agent evaluation runs.

Requires optional dependencies: ``pip install agent-eval[dashboard]``
(gradio + plotly).
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

try:
    import gradio as gr
    import plotly.graph_objects as go
except ImportError as exc:
    raise ImportError(
        "Dashboard requires optional dependencies.\n"
        "Install them with:  pip install agent-eval[dashboard]\n"
        "            or:     uv pip install gradio plotly"
    ) from exc

from agent_eval.dashboard.data import (
    RunInfo,
    classify_metrics,
    compute_delta,
    discover_runs,
    load_analysis,
    runs_to_overview_df,
    runs_to_per_question_df,
)

# ---------------------------------------------------------------------------
# Colour constants
# ---------------------------------------------------------------------------

COLOR_BASELINE = "#5F6368"  # Gray
COLOR_CANDIDATE = "#1A73E8"  # Google Blue
COLOR_POSITIVE = "#188038"  # Green
COLOR_NEGATIVE = "#D93025"  # Red
COLOR_NEUTRAL = "#9AA0A6"  # Light gray

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_METRIC_DISPLAY = {
    "token_usage.estimated_cost_usd": "Est. Cost ($)",
    "token_usage.total_tokens": "Total Tokens",
    "token_usage.prompt_tokens": "Input Tokens",
    "token_usage.completion_tokens": "Output Tokens",
    "token_usage.cached_tokens": "Cached Tokens",
    "token_usage.llm_calls": "LLM Calls",
    "latency_metrics.total_latency_seconds": "Total Latency (s)",
    "latency_metrics.time_to_first_response_seconds": "Time to First Response (s)",
    "latency_metrics.average_turn_latency_seconds": "Avg Turn Latency (s)",
    "latency_metrics.llm_latency_seconds": "Model Latency (s)",
    "latency_metrics.tool_latency_seconds": "Tool Latency (s)",
    "cache_efficiency.cache_hit_rate": "Cache Hit Rate",
    "tool_success_rate.tool_success_rate": "Tool Success Rate",
    "thinking_metrics.reasoning_ratio": "Reasoning Ratio",
}


def _display_name(metric: str) -> str:
    return _METRIC_DISPLAY.get(
        metric, metric.replace("_", " ").replace(".", " > ").title()
    )


def _fmt_value(metric: str, val: float) -> str:
    if "cost" in metric:
        return f"${val:.4f}"
    if "latency" in metric or "seconds" in metric:
        return f"{val:.2f}s"
    if "rate" in metric or "ratio" in metric or "hit" in metric:
        return f"{val:.0%}" if val <= 1.0 else f"{val:.2f}"
    if val == int(val) and abs(val) < 1e6:
        return f"{int(val)}"
    return f"{val:.3f}"


# ---------------------------------------------------------------------------
# Scorecard HTML
# ---------------------------------------------------------------------------


def _render_scorecard(
    baseline_run: RunInfo | None,
    compare_run: RunInfo | None,
    metric: str,
    category: str,
) -> str:
    """Generate HTML for a single scorecard card showing delta vs baseline."""
    if not baseline_run or not compare_run or not metric:
        return ""

    # Get value from det or llm metrics
    def _val(run: RunInfo) -> float | None:
        if metric in run.deterministic_metrics:
            return run.deterministic_metrics[metric]
        if metric in run.llm_metrics:
            return run.llm_metrics[metric]["average"]
        return None

    b_val = _val(baseline_run)
    c_val = _val(compare_run)

    if b_val is None or c_val is None:
        return ""

    delta = compute_delta(b_val, c_val, metric)
    pct = delta["pct_change"]
    direction = delta["direction"]

    if direction == "improvement":
        color = COLOR_POSITIVE
        icon = "&#9650;"  # ▲
    elif direction == "regression":
        color = COLOR_NEGATIVE
        icon = "&#9660;"  # ▼
    else:
        color = COLOR_NEUTRAL
        icon = "&#8212;"  # —

    delta_str = f"{pct:+.1f}%" if b_val != 0 else "N/A"

    return f"""
    <div style="padding: 16px; background: white; border-radius: 8px;
                border: 1px solid #e0e0e0; height: 100%;">
        <div style="font-size: 12px; font-weight: 600; color: #5f6368;
                    text-transform: uppercase; letter-spacing: 0.5px;
                    margin-bottom: 8px;">{category}</div>
        <div style="font-size: 13px; color: #202124; margin-bottom: 4px;">
            {_display_name(metric)}</div>
        <div style="font-size: 32px; color: {color}; font-weight: bold;
                    line-height: 1.2;">{icon} {delta_str}</div>
        <div style="font-size: 12px; color: #70757a; margin-top: 8px;">
            Baseline: {_fmt_value(metric, b_val)} &rarr;
            Current: {_fmt_value(metric, c_val)}</div>
    </div>
    """


def _render_run_metadata(runs: list[RunInfo], baseline_id: str, compare_id: str) -> str:
    """Render an HTML banner showing metadata for baseline and compare runs."""

    def _run_row(run: RunInfo, label: str) -> str:
        commit = (
            run.git_info.get("commit", "")[:8] if run.git_info.get("commit") else "n/a"
        )
        branch = run.git_info.get("branch", "") or "n/a"
        dirty = " (dirty)" if run.git_info.get("dirty") else ""
        return (
            f"<tr>"
            f'<td style="padding:4px 12px;font-weight:600;color:#1A73E8;">{label}</td>'
            f'<td style="padding:4px 12px;">{run.run_id}</td>'
            f'<td style="padding:4px 12px;">{run.timestamp.strftime("%Y-%m-%d %H:%M")}</td>'
            f'<td style="padding:4px 12px;"><code>{commit}</code>{dirty}</td>'
            f'<td style="padding:4px 12px;">{branch}</td>'
            f"</tr>"
        )

    baseline = next((r for r in runs if r.run_id == baseline_id), None)
    compare = next((r for r in runs if r.run_id == compare_id), None)

    rows = ""
    if baseline:
        rows += _run_row(baseline, "Baseline")
    if compare and compare != baseline:
        rows += _run_row(compare, "Compare")

    return f"""
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin:8px 0;">
        <tr style="background:#f8f9fa;color:#5f6368;">
            <th style="padding:4px 12px;text-align:left;">Role</th>
            <th style="padding:4px 12px;text-align:left;">Run</th>
            <th style="padding:4px 12px;text-align:left;">Date</th>
            <th style="padding:4px 12px;text-align:left;">Commit</th>
            <th style="padding:4px 12px;text-align:left;">Branch</th>
        </tr>
        {rows}
    </table>
    """


# ---------------------------------------------------------------------------
# Charts
# ---------------------------------------------------------------------------


def _build_comparison_chart(
    overview_df: pd.DataFrame,
    selected_runs: list[str],
    selected_metrics: list[str],
    baseline_id: str,
    normalize: bool,
) -> go.Figure:
    """Grouped bar chart comparing runs across selected metrics."""
    if overview_df.empty or not selected_runs or not selected_metrics:
        fig = go.Figure()
        fig.update_layout(
            title="Select runs and metrics to compare.",
            xaxis={"visible": False},
            yaxis={"visible": False},
        )
        return fig

    filtered = overview_df[overview_df["run_id"].isin(selected_runs)].copy()

    # Ensure baseline is first
    baseline_rows = filtered[filtered["run_id"] == baseline_id]
    other_rows = filtered[filtered["run_id"] != baseline_id].sort_values("datetime")
    ordered = pd.concat([baseline_rows, other_rows])

    # Compute max values for normalization
    max_vals = {}
    if normalize:
        for m in selected_metrics:
            if m in ordered.columns:
                mx = ordered[m].max()
                max_vals[m] = mx if mx and mx > 0 else 1.0

    fig = go.Figure()
    for _, row in ordered.iterrows():
        run_id = row["run_id"]
        color = COLOR_BASELINE if run_id == baseline_id else COLOR_CANDIDATE

        raw_values = [row.get(m, 0) or 0 for m in selected_metrics]
        if normalize:
            y_values = [
                v / max_vals.get(m, 1.0)
                for v, m in zip(raw_values, selected_metrics, strict=False)
            ]
        else:
            y_values = raw_values

        display_metrics = [_display_name(m) for m in selected_metrics]
        fig.add_trace(
            go.Bar(
                name=run_id,
                x=display_metrics,
                y=y_values,
                marker_color=color,
                text=[f"{v:.3f}" for v in raw_values],
                textposition="auto",
                hovertemplate="<b>%{x}</b><br>Value: %{text}<extra></extra>",
            )
        )

    fig.update_layout(
        barmode="group",
        title_text="Metric Comparison (Normalized)"
        if normalize
        else "Metric Comparison",
        xaxis_title="Metrics",
        yaxis_title="Normalized (0-1)" if normalize else "Value",
        template="plotly_white",
        margin={"l": 50, "r": 50, "t": 80, "b": 120},
        height=500,
    )
    return fig


# ---------------------------------------------------------------------------
# App builder
# ---------------------------------------------------------------------------


def create_app(results_dir: str) -> gr.Blocks:
    """Build and return the Gradio Blocks app.

    Parameters
    ----------
    results_dir:
        Path to the parent directory containing all run sub-folders
        (e.g. ``eval/results/``).
    """
    runs = discover_runs(Path(results_dir))

    if not runs:
        with gr.Blocks(title="agent-eval Dashboard") as app:
            gr.Markdown("# agent-eval Dashboard")
            gr.Markdown(
                f"**No evaluation runs found** in `{results_dir}`.\n\n"
                "Run `agent-eval run` or `agent-eval evaluate` first to generate results."
            )
        return app

    # Derive initial state
    overview_df = runs_to_overview_df(runs)
    all_det_metrics = sorted({m for r in runs for m in r.deterministic_metrics})
    all_llm_metrics = sorted({m for r in runs for m in r.llm_metrics})
    all_metrics = all_det_metrics + all_llm_metrics
    metric_groups = classify_metrics(all_det_metrics, all_llm_metrics)

    run_ids = [r.run_id for r in runs]
    baseline_default = run_ids[0]
    compare_default = run_ids[-1] if len(run_ids) > 1 else run_ids[0]

    # Pick default scorecard metrics (first in each group if available)
    default_cost = metric_groups["Cost"][0] if metric_groups["Cost"] else None
    default_latency = metric_groups["Latency"][0] if metric_groups["Latency"] else None
    default_quality = metric_groups["Quality"][0] if metric_groups["Quality"] else None

    def _get_run(run_id: str) -> RunInfo | None:
        return next((r for r in runs if r.run_id == run_id), None)

    # ── Build Gradio UI ───────────────────────────────────────────────────

    with gr.Blocks(theme=gr.themes.Default(), title="agent-eval Dashboard") as app:
        gr.Markdown("# agent-eval Dashboard")
        gr.Markdown(
            f"Comparing **{len(runs)}** evaluation run{'s' if len(runs) != 1 else ''} "
            f"from `{results_dir}`"
        )

        # ── Run selectors ─────────────────────────────────────────────────
        with gr.Row():
            baseline_dd = gr.Dropdown(
                choices=run_ids,
                value=baseline_default,
                label="Baseline Run",
                info="Oldest run auto-selected",
            )
            compare_dd = gr.Dropdown(
                choices=run_ids,
                value=compare_default,
                label="Compare To",
                info="Select run to compare against baseline",
            )

        run_meta_html = gr.HTML(
            value=_render_run_metadata(runs, baseline_default, compare_default)
        )

        # ── Tab 1: Overview (Scorecards) ──────────────────────────────────
        with gr.Tab("Overview"):
            with gr.Row():
                with gr.Column():
                    cost_dd = gr.Dropdown(
                        choices=metric_groups["Cost"],
                        value=default_cost,
                        label="Cost Metric",
                    )
                    cost_html = gr.HTML(
                        value=_render_scorecard(
                            _get_run(baseline_default),
                            _get_run(compare_default),
                            default_cost,
                            "Cost",
                        )
                    )
                with gr.Column():
                    latency_dd = gr.Dropdown(
                        choices=metric_groups["Latency"],
                        value=default_latency,
                        label="Latency Metric",
                    )
                    latency_html = gr.HTML(
                        value=_render_scorecard(
                            _get_run(baseline_default),
                            _get_run(compare_default),
                            default_latency,
                            "Latency",
                        )
                    )
                with gr.Column():
                    quality_dd = gr.Dropdown(
                        choices=metric_groups["Quality"],
                        value=default_quality,
                        label="Quality Metric",
                    )
                    quality_html = gr.HTML(
                        value=_render_scorecard(
                            _get_run(baseline_default),
                            _get_run(compare_default),
                            default_quality,
                            "Quality",
                        )
                    )

            # Other metrics table
            gr.Markdown("### All Metrics — Baseline vs Compare")
            overview_table = gr.Dataframe(interactive=False)

        # ── Tab 2: Metrics Comparison ─────────────────────────────────────
        with gr.Tab("Metrics Comparison"):
            with gr.Row():
                chart_metric_dd = gr.Dropdown(
                    choices=all_metrics,
                    multiselect=True,
                    label="Metrics to Chart",
                    value=all_llm_metrics[:5]
                    if all_llm_metrics
                    else all_det_metrics[:5],
                )
                chart_run_dd = gr.Dropdown(
                    choices=run_ids,
                    multiselect=True,
                    label="Runs to Include",
                    value=run_ids,
                )
                normalize_cb = gr.Checkbox(label="Normalize (0-1)", value=False)
            chart_btn = gr.Button("Generate Chart", variant="primary")
            comparison_plot = gr.Plot()

        # ── Tab 3: Per-Question Drilldown ─────────────────────────────────
        with gr.Tab("Per-Question Drilldown"):
            pq_metric_dd = gr.Dropdown(
                choices=[*all_llm_metrics, "tool_success_rate.tool_success_rate"],
                label="Metric",
                value=all_llm_metrics[0] if all_llm_metrics else None,
            )
            pq_btn = gr.Button("Load Drilldown", variant="primary")
            pq_table = gr.Dataframe(interactive=False)

        # ── Tab 4: Analysis Viewer ────────────────────────────────────────
        with gr.Tab("Analysis"):
            analysis_run_dd = gr.Dropdown(
                choices=[r.run_id for r in runs if r.has_analysis],
                label="Select Run",
                value=next((r.run_id for r in reversed(runs) if r.has_analysis), None),
            )
            analysis_btn = gr.Button("Load Analysis", variant="primary")
            analysis_md = gr.Markdown()

        # ── Tab 5: Raw Data ───────────────────────────────────────────────
        with gr.Tab("Raw Data"):
            # Format numeric columns for display
            display_df = overview_df.copy()
            for col in display_df.select_dtypes(include=["number"]).columns:
                display_df[col] = display_df[col].apply(
                    lambda x: f"{x:.4f}" if pd.notnull(x) else ""
                )
            gr.Dataframe(value=display_df, interactive=False)

        # ── Event handlers ────────────────────────────────────────────────

        def update_metadata(baseline_id, compare_id):
            return _render_run_metadata(runs, baseline_id, compare_id)

        def update_scorecard(baseline_id, compare_id, metric, category):
            return _render_scorecard(
                _get_run(baseline_id), _get_run(compare_id), metric, category
            )

        def update_overview_table(baseline_id, compare_id):
            b = _get_run(baseline_id)
            c = _get_run(compare_id)
            if not b or not c:
                return pd.DataFrame()

            rows = []
            # Deterministic
            all_keys = sorted(
                set(
                    list(b.deterministic_metrics.keys())
                    + list(c.deterministic_metrics.keys())
                )
            )
            for key in all_keys:
                bv = b.deterministic_metrics.get(key)
                cv = c.deterministic_metrics.get(key)
                delta = (
                    compute_delta(bv or 0, cv or 0, key)
                    if bv is not None and cv is not None
                    else {}
                )
                rows.append(
                    {
                        "Metric": _display_name(key),
                        "Baseline": _fmt_value(key, bv) if bv is not None else "N/A",
                        "Current": _fmt_value(key, cv) if cv is not None else "N/A",
                        "Change": f"{delta.get('pct_change', 0):+.1f}%"
                        if delta
                        else "N/A",
                        "Direction": delta.get("direction", "").capitalize()
                        if delta
                        else "",
                    }
                )
            # LLM
            all_llm = sorted(
                set(list(b.llm_metrics.keys()) + list(c.llm_metrics.keys()))
            )
            for key in all_llm:
                bv = b.llm_metrics.get(key, {}).get("average")
                cv = c.llm_metrics.get(key, {}).get("average")
                delta = (
                    compute_delta(bv or 0, cv or 0, key)
                    if bv is not None and cv is not None
                    else {}
                )
                sr = b.llm_metrics.get(key, c.llm_metrics.get(key, {})).get(
                    "score_range", {}
                )
                score_label = (
                    f" ({sr.get('min', '?')}-{sr.get('max', '?')})" if sr else ""
                )
                rows.append(
                    {
                        "Metric": f"{_display_name(key)}{score_label}",
                        "Baseline": f"{bv:.3f}" if bv is not None else "N/A",
                        "Current": f"{cv:.3f}" if cv is not None else "N/A",
                        "Change": f"{delta.get('pct_change', 0):+.1f}%"
                        if delta
                        else "N/A",
                        "Direction": delta.get("direction", "").capitalize()
                        if delta
                        else "",
                    }
                )

            return pd.DataFrame(rows)

        def generate_chart(metrics, run_list, normalize, baseline_id):
            return _build_comparison_chart(
                overview_df,
                run_list or run_ids,
                metrics or [],
                baseline_id,
                normalize,
            )

        def load_drilldown(metric):
            if not metric:
                return pd.DataFrame()
            return runs_to_per_question_df(runs, metric)

        def load_analysis_content(run_id):
            run = _get_run(run_id)
            if not run:
                return "No run selected."
            content = load_analysis(run)
            return content if content else "*No analysis file found for this run.*"

        # Wire baseline/compare changes → metadata + scorecards + overview table
        for selector in [baseline_dd, compare_dd]:
            selector.change(
                fn=update_metadata,
                inputs=[baseline_dd, compare_dd],
                outputs=[run_meta_html],
            )
            selector.change(
                fn=lambda b, c, m: update_scorecard(b, c, m, "Cost"),
                inputs=[baseline_dd, compare_dd, cost_dd],
                outputs=[cost_html],
            )
            selector.change(
                fn=lambda b, c, m: update_scorecard(b, c, m, "Latency"),
                inputs=[baseline_dd, compare_dd, latency_dd],
                outputs=[latency_html],
            )
            selector.change(
                fn=lambda b, c, m: update_scorecard(b, c, m, "Quality"),
                inputs=[baseline_dd, compare_dd, quality_dd],
                outputs=[quality_html],
            )
            selector.change(
                fn=update_overview_table,
                inputs=[baseline_dd, compare_dd],
                outputs=[overview_table],
            )

        # Wire individual scorecard dropdown changes
        cost_dd.change(
            fn=lambda b, c, m: update_scorecard(b, c, m, "Cost"),
            inputs=[baseline_dd, compare_dd, cost_dd],
            outputs=[cost_html],
        )
        latency_dd.change(
            fn=lambda b, c, m: update_scorecard(b, c, m, "Latency"),
            inputs=[baseline_dd, compare_dd, latency_dd],
            outputs=[latency_html],
        )
        quality_dd.change(
            fn=lambda b, c, m: update_scorecard(b, c, m, "Quality"),
            inputs=[baseline_dd, compare_dd, quality_dd],
            outputs=[quality_html],
        )

        # Metrics comparison chart
        chart_btn.click(
            fn=generate_chart,
            inputs=[chart_metric_dd, chart_run_dd, normalize_cb, baseline_dd],
            outputs=[comparison_plot],
        )

        # Per-question drilldown
        pq_btn.click(
            fn=load_drilldown,
            inputs=[pq_metric_dd],
            outputs=[pq_table],
        )

        # Analysis viewer
        analysis_btn.click(
            fn=load_analysis_content,
            inputs=[analysis_run_dd],
            outputs=[analysis_md],
        )

    return app


# ---------------------------------------------------------------------------
# Launch
# ---------------------------------------------------------------------------


def launch(results_dir: str, port: int = 7860, share: bool = False) -> None:
    """Create and launch the dashboard."""
    app = create_app(results_dir)
    app.launch(server_port=port, share=share)
