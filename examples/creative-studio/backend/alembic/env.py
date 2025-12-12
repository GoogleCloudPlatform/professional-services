# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

from src.database import Base, get_conn_string
from src.users.user_model import User
from src.workspaces.schema.workspace_model import Workspace
from src.brand_guidelines.schema.brand_guideline_model import BrandGuideline
from src.common.schema.media_item_model import MediaItem
from src.media_templates.schema.media_template_model import MediaTemplate
from src.source_assets.schema.source_asset_model import SourceAsset

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the database URL from our database module
config.set_main_option("sqlalchemy.url", get_conn_string())

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


from google.cloud.sql.connector import Connector, IPTypes
from src.config.config_service import config_service

# Define a local get_connection for Alembic to avoid loop issues with the global one
async def alembic_get_connection():
    import asyncio
    
    # Explicitly get the running loop and pass it to Connector if supported,
    # or ensure Connector uses it.
    # Note: Connector() might not accept loop in newer versions, but let's try to force it
    # by setting the event loop if needed, or just relying on get_running_loop.
    # If Connector uses get_event_loop(), we might need to set it.
    loop = asyncio.get_running_loop()
    
    try:
        connector = Connector(loop=loop)
    except TypeError:
        # Fallback if loop arg is not supported
        connector = Connector()
        
    conn = await connector.connect_async(
        config_service.INSTANCE_CONNECTION_NAME,
        "asyncpg",
        user=config_service.DB_USER,
        password=config_service.DB_PASS,
        db=config_service.DB_NAME,
        ip_type=IPTypes.PUBLIC,
    )
    return conn

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Create a configuration dict from the alembic config
    configuration = config.get_section(config.config_ini_section, {})
    
    # If using Cloud SQL Connector, we need to pass the async_creator
    connect_args = {}
    if config_service.INSTANCE_CONNECTION_NAME and not config_service.USE_CLOUD_SQL_AUTH_PROXY:
        # We override the URL to be empty/generic because the connector handles it
        configuration["sqlalchemy.url"] = "postgresql+asyncpg://"
        connect_args["async_creator"] = alembic_get_connection

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        **connect_args,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
