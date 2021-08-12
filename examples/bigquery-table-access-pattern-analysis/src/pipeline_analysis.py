# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from collections import defaultdict
from src.bq_query import BQQuery
import pandas as pd
from jinja2 import Environment, FileSystemLoader

nodes_in_graph = []
table_names_in_graph = []
links_in_graph = []
table_to_node_id = dict()

def get_tables_read_write_frequency_df(top):
    tables_read_write_frequency = BQQuery.get_tables_read_write_frequency(top)
    tables_read_write_frequency_in_list = []
    for table, read_frequency, write_frequency in tables_read_write_frequency:
        tables_read_write_frequency_in_list.append([table, read_frequency, write_frequency])
    return pd.DataFrame(tables_read_write_frequency_in_list, columns=["Table", "Read Frequency", "Write Frequency"])

def reset_graph_data():
    global nodes_in_graph, table_names_in_graph, links_in_graph, table_to_node_id
    nodes_in_graph = []
    table_names_in_graph = []
    links_in_graph = []
    table_to_node_id = dict()

def display_pipelines_of_table(table):
    reset_graph_data()
    get_graph_data(table)    

def get_graph_data(table):
    tables_involved = BQQuery.get_tables_involved(table)
    table_and_direct_forward_and_backward_pipelines_list = BQQuery.get_table_direct_pipelines(tables_involved)
    if len(list(table_and_direct_forward_and_backward_pipelines_list)) == 0:
        return {}
    table_to_direct_forward_and_backward_pipelines = dict()
    for table_and_forward_and_backward_pipelines in table_and_direct_forward_and_backward_pipelines_list:
        current_table = table_and_forward_and_backward_pipelines.table
        table_to_direct_forward_and_backward_pipelines[current_table] = table_and_forward_and_backward_pipelines
    
    visited_pipeline_ids = []
    forward_and_backward_pipelines_of_table = table_to_direct_forward_and_backward_pipelines.get(table)
    direct_forward_pipelines = forward_and_backward_pipelines_of_table.direct_forward_pipeline_objects
    forward_pipelines_to_be_explored = direct_forward_pipelines.copy()
    while forward_pipelines_to_be_explored:
        current_forward_pipeline = forward_pipelines_to_be_explored.pop()
        if current_forward_pipeline.pipeline_id not in visited_pipeline_ids:
            update_graph_data_of_pipeline(current_forward_pipeline, table_to_direct_forward_and_backward_pipelines)
            forward_pipelines_of_destination_table = get_forward_pipelines_of_destination_table(current_forward_pipeline, table_to_direct_forward_and_backward_pipelines)
            forward_pipelines_to_be_explored.extend(forward_pipelines_of_destination_table)
            visited_pipeline_ids.append(current_forward_pipeline.pipeline_id)
    
    visited_pipeline_ids = []
    direct_backward_pipelines = forward_and_backward_pipelines_of_table.direct_backward_pipeline_objects
    backward_pipelines_to_be_explored = direct_backward_pipelines.copy()
    while backward_pipelines_to_be_explored:
        current_backward_pipeline = backward_pipelines_to_be_explored.pop()
        if current_backward_pipeline.pipeline_id not in visited_pipeline_ids:
            update_graph_data_of_pipeline(current_backward_pipeline, table_to_direct_forward_and_backward_pipelines)
            backward_pipelines_of_source_tables = get_backward_pipelines_of_source_tables(current_backward_pipeline, table_to_direct_forward_and_backward_pipelines)
            backward_pipelines_to_be_explored.extend(backward_pipelines_of_source_tables)
            visited_pipeline_ids.append(current_backward_pipeline.pipeline_id)

    graph_data = {
        'tableName': table,
        'nodes': nodes_in_graph,
        'links': links_in_graph
    }

    write_to_template(graph_data)

def write_to_template(graph_data):
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('template.html')
    output_from_parsed_template = template.render(graph_data=graph_data)

    with open("pipeline_graph/index.html", "w") as f:
        f.write(output_from_parsed_template)

def is_dash(pipelineType):
    if pipelineType == 'AD HOC':
        return True
    return False

def get_node_id(table):
    global table_to_node_id
    node_id_of_current_table = -1
    if table_to_node_id.get(table) != None:
        node_id_of_current_table = table_to_node_id.get(table)
    else:
        node_id_of_current_table = len(table_to_node_id)
        table_to_node_id[table] = node_id_of_current_table
    return node_id_of_current_table

def update_graph_data_of_pipeline(current_pipeline, table_to_direct_forward_and_backward_pipelines):
    global table_to_node_id
    global nodes_in_graph
    global links_in_graph
    global table_names_in_graph
    source_tables_of_current_pipeline = current_pipeline.source_tables
    destination_table_of_current_pipeline = current_pipeline.destination_table
    weight_of_current_pipeline = current_pipeline.frequency
    for current_table in source_tables_of_current_pipeline + [destination_table_of_current_pipeline]:
        forward_and_backward_pipelines_of_current_table = table_to_direct_forward_and_backward_pipelines.get(current_table)
        if current_table not in table_names_in_graph:
            node_id_of_current_table = get_node_id(current_table)
            nodes_in_graph.append(
                {
                    'id': node_id_of_current_table,
                    'label':current_table,
                    'pipelineInformation': get_summarised_pipeline_information(current_table, forward_and_backward_pipelines_of_current_table)
                }
            )
            table_names_in_graph.append(current_table)
    node_id_of_destination_table = get_node_id(destination_table_of_current_pipeline)
    for source_table in source_tables_of_current_pipeline:
        node_id_of_source_table = get_node_id(source_table)
        links_in_graph.append(
            {
                'from': node_id_of_source_table,
                'to': node_id_of_destination_table,
                'value': weight_of_current_pipeline
            }
        )

def get_forward_pipelines_of_destination_table(current_pipeline, table_to_direct_forward_and_backward_pipelines):
    destination_table_of_current_pipeline = current_pipeline.destination_table
    direct_pipelines_of_destination_table = table_to_direct_forward_and_backward_pipelines.get(destination_table_of_current_pipeline)
    if not direct_pipelines_of_destination_table:
        return []
    forward_pipelines_of_destination_table = direct_pipelines_of_destination_table.direct_forward_pipeline_objects or []
    return forward_pipelines_of_destination_table

def get_backward_pipelines_of_source_tables(current_pipeline, table_to_direct_forward_and_backward_pipelines):
    source_tables_of_current_pipeline = current_pipeline.source_tables
    backward_pipelines_of_source_tables = []
    for source_table_of_current_pipeline in source_tables_of_current_pipeline:
        direct_pipelines_of_source_table = table_to_direct_forward_and_backward_pipelines.get(source_table_of_current_pipeline)
        if not direct_pipelines_of_source_table:
            continue
        backward_pipelines_of_source_table = direct_pipelines_of_source_table.direct_backward_pipeline_objects or []
        backward_pipelines_of_source_tables.extend(backward_pipelines_of_source_table)
    return backward_pipelines_of_source_tables

def get_summarised_pipeline_information(table, forward_and_backward_pipelines_of_table):
    info = [f'<h2>{table}</h2>']
    if not forward_and_backward_pipelines_of_table:
        return info

    direct_forward_pipeline_objects = forward_and_backward_pipelines_of_table.direct_forward_pipeline_objects
    if direct_forward_pipeline_objects:
        info.append("<b>As a source table:</b>")
        info.append("<ul>")
        pipelines_info = defaultdict(list)
        for direct_forward_pipeline in direct_forward_pipeline_objects:
            schedule = direct_forward_pipeline.schedule
            pipeline_type = direct_forward_pipeline.pipeline_type
            information_of_schedule = (f"<li>{direct_forward_pipeline.destination_table} {schedule} in pipeline ID {direct_forward_pipeline.pipeline_id}")
            pipelines_info[pipeline_type].append(information_of_schedule)
        
        for pipeline_type, schedule_of_this_pipeline_type in pipelines_info.items():
            if not schedule_of_this_pipeline_type:
                continue
            info.append(f"<li>{pipeline_type}")
            info.append("<ul>")
            info.extend(schedule_of_this_pipeline_type)
            info.append("</ul>")
        info.append("</ul>")

    if info:
        info.append('')

    direct_backward_pipeline_objects = forward_and_backward_pipelines_of_table.direct_backward_pipeline_objects
    if direct_backward_pipeline_objects:
        info.append("<b>As a destination table:</b>")
        info.append("<ul>")
        pipelines_info = defaultdict(list)
        for direct_backward_pipeline in direct_backward_pipeline_objects:
            schedule = direct_backward_pipeline.schedule
            pipeline_type = direct_backward_pipeline.pipeline_type
            information_of_schedule = (f"<li>{direct_backward_pipeline.source_tables} {schedule} in pipeline ID {direct_backward_pipeline.pipeline_id}")
            pipelines_info[pipeline_type].append(information_of_schedule)
        
        for pipeline_type, schedule_of_this_pipeline_type in pipelines_info.items():
            if not schedule_of_this_pipeline_type:
                continue
            info.append(f"<li>{pipeline_type}")
            info.append("<ul>")
            info.extend(schedule_of_this_pipeline_type)
            info.append("</ul>")
        info.append("</ul>")
    return "".join(info)
