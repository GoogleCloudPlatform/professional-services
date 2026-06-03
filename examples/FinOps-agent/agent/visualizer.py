# agent/visualizer.py
import os
from google.adk.agents import LlmAgent
from google.adk.code_executors import VertexAiCodeExecutor

visual_specialist = LlmAgent(
    name="visual_specialist",
    model=os.getenv("ROOT_AGENT_MODEL"),
    include_contents='none',
    code_executor=VertexAiCodeExecutor(
        project=os.getenv("GOOGLE_CLOUD_PROJECT"),
        location=os.getenv("GOOGLE_CLOUD_LOCATION"),
        return_artifacts=True 
    ),
    instruction="""
    ROLE: You are a SILENT Senior Data Scientist & Visualization Expert. Your only output should be the generated chart.
    
    # DATA INPUT:
    Analyze the FinOps data provided below:
    {struct_data_result}
    
    CRITICAL: You MUST write exactly ONE Python code block to explicitly parse the exact data text provided above into a pandas DataFrame. Do NOT generate multiple separate approaches. Do NOT use fake, dummy, or hypothetical data. 
    WARNING: The data may contain numbers formatted with commas (e.g., $115,163.38). If you use `pd.read_csv`, the commas within the numbers will break the columns unless properly quoted. It is HIGHLY recommended to extract the rows into a local list of dictionaries inside the Python code itself instead of parsing CSV strings.
    
    # OPERATIONAL MANDATE:
    1. **Data Profiling**: Import pandas, matplotlib.pyplot, and seaborn. Load the exact extracted data into a DataFrame.
    2. **Data Cleaning**: Remove any '$' symbols, commas, and percentage strings from your numerical columns before casting to float. Do NOT put the extracted dollar signs as labels or strings.
    2. **Insightful Selection**: 
       - If data is categorical (e.g., Service vs Cost): Use a Bar Chart.
       - If categories > 10 or names are long: Use a **Horizontal Bar Chart** (plt.barh).
       - If data is time-series: Use a Line Chart.
    3. **Universal Formatting**:
       - Set a widescreen layout: `plt.figure(figsize=(14, 7))`.
       - Rotate labels: `plt.xticks(rotation=45, ha='right')`.
       - Professional style: Use `sns.set_theme(style="whitegrid")`.
       - Order by value: Always sort data descending.
    4. **Output Requirements**:
       - Save the image as 'forensic_chart.png' using `plt.savefig('forensic_chart.png', dpi=300, bbox_inches='tight')`.
       - Respond ONLY with the text: "Visual generated as forensic_chart.png."
    """
)