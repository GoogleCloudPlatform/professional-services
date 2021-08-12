import json

class PipelineInfo():
    PIPELINE_ID = "pipelineId"
    SOURCE_TABLES = "sourceTables"
    DESTINATION_TABLE = "destinationTable"
    FREQUENCY = "frequency"
    PIPELINE_TYPE = "pipelineType"
    SCHEDULE = "schedule"
    def __init__(self, pipeline_id, source_tables, destination_table, frequency, pipeline_type, schedule):
        self.pipeline_id = pipeline_id
        self.source_tables = json.loads(source_tables or "[]")
        self.destination_table = destination_table
        self.frequency = frequency
        self.pipeline_type = pipeline_type
        self.schedule = schedule

class TableDirectPipelines():
    def __init__(self, table, direct_forward_pipeline_objects, direct_backward_pipeline_objects):
        self.table = table
        self.direct_forward_pipeline_objects = direct_forward_pipeline_objects
        self.direct_backward_pipeline_objects = direct_backward_pipeline_objects

    @staticmethod
    def from_query_result(table_direct_pipelines_query_result):
        table = table_direct_pipelines_query_result.get('table')
        direct_forward_pipelines = table_direct_pipelines_query_result.get('directForwardPipelines')
        direct_backward_pipelines = table_direct_pipelines_query_result.get('directBackwardPipelines')
        direct_forward_pipeline_objects = list(map(
            lambda pipeline_query_result: PipelineInfo(
                pipeline_query_result.get(PipelineInfo.PIPELINE_ID),
                pipeline_query_result.get(PipelineInfo.SOURCE_TABLES),
                pipeline_query_result.get(PipelineInfo.DESTINATION_TABLE),
                pipeline_query_result.get(PipelineInfo.FREQUENCY),
                pipeline_query_result.get(PipelineInfo.PIPELINE_TYPE),
                pipeline_query_result.get(PipelineInfo.SCHEDULE)
            ),
            direct_forward_pipelines
        ))
        direct_backward_pipeline_objects = list(map(
            lambda pipeline_query_result: PipelineInfo(
                pipeline_query_result.get(PipelineInfo.PIPELINE_ID),
                pipeline_query_result.get(PipelineInfo.SOURCE_TABLES),
                pipeline_query_result.get(PipelineInfo.DESTINATION_TABLE),
                pipeline_query_result.get(PipelineInfo.FREQUENCY),
                pipeline_query_result.get(PipelineInfo.PIPELINE_TYPE),
                pipeline_query_result.get(PipelineInfo.SCHEDULE)
            ),
            direct_backward_pipelines
        ))
        return TableDirectPipelines(table, direct_forward_pipeline_objects, direct_backward_pipeline_objects)
