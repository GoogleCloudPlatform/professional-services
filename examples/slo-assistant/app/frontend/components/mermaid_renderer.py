# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-8.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json

import streamlit.components.v1 as components

# [Action item]- Get rid of this and replace with streamlit mermaid once support for latest mermaid v11.12 is available


def st_mermaid_v11(mermaid_code, height=600):
    """
    Robust Renderer (v11.12.0) with Zoom & Pan.
    - Includes 'svg-pan-zoom' for interactive exploration.
    - Includes auto-retry logic for Streamlit tabs.
    """
    if not mermaid_code:
        return

    json_code = json.dumps(mermaid_code)

    html_code = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"></script>
        <script type="module">
            import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs';
            
            mermaid.initialize({{ 
                startOnLoad: false,
                theme: 'dark', 
                securityLevel: 'loose',
                suppressErrorRendering: true 
            }});
            
            async function renderDiagram() {{
                const element = document.querySelector('#graphDiv');
                const graphDefinition = {json_code}; 

                try {{
                    // 1. Parse
                    await mermaid.parse(graphDefinition);
                    
                    // 2. Render
                    const {{ svg }} = await mermaid.render('mermaidSvgId', graphDefinition);
                    element.innerHTML = svg;
                    
                    // 3. Zoom Logic
                    const svgElement = document.querySelector('#mermaidSvgId');
                    if (svgElement) {{
                        svgElement.style.maxWidth = 'none'; 
                        svgElement.style.height = '100%';
                        svgElement.style.width = '100%';
                        
                        svgPanZoom('#mermaidSvgId', {{
                            zoomEnabled: true,
                            controlIconsEnabled: false,
                            fit: true,
                            center: true,
                            minZoom: 0.1,
                            maxZoom: 10
                        }});
                    }}

                }} catch (error) {{
                    const errorMsg = error.message || error.str || error.toString();
                    element.innerHTML = `
                        <div style="
                            color: #ffaaaa; 
                            background: #2b1111; 
                            padding: 12px; 
                            font-family: monospace; 
                            border-left: 4px solid #ff4444;
                            white-space: pre-wrap;
                        ">
                            <strong>DIAGRAM ERROR:</strong><br>${{errorMsg}}
                        </div>
                    `;
                }}
            }}
            
            // --- VISIBILITY LOGIC (Fix for Hidden Tabs) ---
            // Instead of running immediately, we wait until the element is visible.
            // This prevents "render tree" errors for diagrams in background tabs.
            document.addEventListener("DOMContentLoaded", function() {{
                const graphDiv = document.getElementById('graphDiv');
                
                if (!graphDiv) return;

                const observer = new IntersectionObserver((entries) => {{
                    entries.forEach(entry => {{
                        if (entry.isIntersecting) {{
                            // Element is now visible (User clicked the tab)
                            renderDiagram();
                            observer.disconnect(); // Stop watching once rendered
                        }}
                    }});
                }}, {{ threshold: 0.1 }});

                observer.observe(graphDiv);
            }});

        </script>
        <style>
            body {{ background: transparent; margin: 0; overflow: hidden; }}
            #graphDiv {{ 
                width: 100vw; 
                height: 100vh;
                display: flex; 
                justify-content: center; 
                align-items: center; 
                color: #ccc; 
                font-family: sans-serif;
                overflow: hidden; 
            }}
        </style>
    </head>
    <body>
        <div id="graphDiv">Loading Diagram...</div>
    </body>
    </html>
    """
    components.html(html_code, height=height, scrolling=False)
