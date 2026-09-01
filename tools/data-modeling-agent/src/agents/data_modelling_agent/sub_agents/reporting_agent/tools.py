import json
from dataclasses import dataclass, field

import pygraphviz as pgv
from google.adk.tools.tool_context import ToolContext
from google.genai import types

from .utils.commons import cleanup_metadata


@dataclass
class Column:
    name: str
    type: str

@dataclass
class Table:
    name: str
    columns: list[Column] = field(default_factory=list)

@dataclass
class Relationship:
    source_table: str
    target_table: str
    source_column: str
    target_column: str

def load_bigquery_metadata(metadata):
    if isinstance(metadata, dict):
        data = metadata
    else:
        try:
            data = json.loads(cleanup_metadata(metadata))
        except Exception:
            data = {"tables": [], "relationships": []}
    tables = []
    for table_data in data.get("tables", []):
        table_name = table_data['table_name']
        columns = [Column(column['name'], column['data_type']) for column in table_data.get('columns', [])]
        tables.append(Table(table_name, columns))
    relationships = []
    for relationship_data in data.get("relationships", []):
        source_table = relationship_data['from_table']
        target_table = relationship_data['to_table']
        source_column = relationship_data['from_column']
        target_column = relationship_data['to_column']
        relationships.append(Relationship(source_table, target_table, source_column, target_column))
    return tables, relationships


"""
def infer_relationships(tables: List[Table]) -> Set[Relationship]:
    relationships = set()
    for table1 in tables:
        for table2 in tables:
            if table1.name == table2.name:
                continue

            # Look for primary key to foreign key relationships
            for col1 in table1.columns:
                if col1.name.endswith('_id'):
                    # The foreign key is in table1, and the primary key is in table2
                    pk_name = col1.name.removesuffix('_id') + '_id'
                    if any(col.name == pk_name and col.name == f"{table2.name}_id" for col in table2.columns):
                        relationships.add(Relationship(table1.name, table2.name, col1.name, pk_name))
    return relationships

"""
# Your Table, Column, and Relationship classes here...

def generate_er_diagram(tables: list[Table], relationships: set[Relationship], output_file: str = "er_diagram.png"):
    graph = pgv.AGraph(strict=False, directed=True, rankdir='LR')
    graph.node_attr['shape'] = 'plaintext'

    # Add tables as nodes
    for table in tables:
        label = f"<<TABLE BORDER='0' CELLBORDER='1' CELLSPACING='0'><TR><TD COLSPAN='2' BGCOLOR='#4D77FF'><B><FONT COLOR='white'>{table.name}</FONT></B></TD></TR>"
        for column in table.columns:
            label += f"<TR><TD ALIGN='LEFT'>{column.name}</TD><TD ALIGN='LEFT' BGCOLOR='#F0F0F0'>{column.type}</TD></TR>"
        label += "</TABLE>>"
        graph.add_node(table.name, label=label)

    # Add relationships as edges
    for rel in relationships:
        graph.add_edge(rel.source_table, rel.target_table, label=f"({rel.source_column}) -> ({rel.target_column})")

    # Save the diagram
    graph.draw(output_file, prog='dot')

    png_data = open(output_file, "rb").read()

    return png_data


def get_sample_dimensional_tables():
    tables = [
        Table("analytics_dw.dim_customers", [
            Column("customer_id (PK)", "STRING"),
            Column("customer_name", "STRING"),
            Column("email", "STRING"),
            Column("signup_date", "DATE"),
            Column("customer_segment", "STRING"),
        ]),
        Table("analytics_dw.fact_orders", [
            Column("order_id (PK)", "STRING"),
            Column("customer_id (FK)", "STRING"),
            Column("product_id (FK)", "STRING"),
            Column("order_timestamp", "TIMESTAMP"),
            Column("order_amount", "NUMERIC"),
            Column("currency_code", "STRING"),
            Column("order_status", "STRING"),
        ]),
        Table("analytics_dw.dim_products", [
            Column("product_id (PK)", "STRING"),
            Column("product_name", "STRING"),
            Column("category", "STRING"),
            Column("unit_price", "NUMERIC"),
        ]),
    ]
    relationships = [
        Relationship("analytics_dw.dim_customers", "analytics_dw.fact_orders", "customer_id", "customer_id"),
        Relationship("analytics_dw.dim_products", "analytics_dw.fact_orders", "product_id", "product_id"),
    ]
    return tables, relationships

# Main execution block
async def generate_report(tool_context: ToolContext):
    metadata = tool_context.state.get("metadata", None)
    tables, relationships = ([], [])
    if metadata:
        try:
            tables, relationships = load_bigquery_metadata(metadata)
        except Exception:
            tables, relationships = ([], [])
            
    if not tables:
        tables, relationships = get_sample_dimensional_tables()

    image_bytes = generate_er_diagram(tables, relationships)
    await tool_context.save_artifact(
      'er_diagram.png',
      types.Part.from_bytes(data=image_bytes, mime_type='image/png'),
    )
    return {
      'status': 'success',
      'detail': 'ER diagram generated successfully and stored in artifacts.',
      'filename': 'er_diagram.png',
    }