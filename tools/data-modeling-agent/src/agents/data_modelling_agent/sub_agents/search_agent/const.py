from pydantic import BaseModel, Field


class SourceModelContent(BaseModel):
    """Content of the source model."""

    existing_schema: str = Field(
        description="The complete string of the existing schema for the source database."
    )
    existing_kpis: str = Field(
        description="The complete string of the existing KPIs for the source database."
    )