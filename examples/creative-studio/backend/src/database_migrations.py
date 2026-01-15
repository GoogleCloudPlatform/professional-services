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
import logging
import subprocess
from sqlalchemy import text
from src.database import get_connection

logger = logging.getLogger(__name__)

# A fixed ID for the advisory lock.
# This ensures that all instances of the application will contend for the same lock.
# The ID is arbitrary but must be consistent across all instances.
MIGRATION_LOCK_ID = 42

async def run_pending_migrations():
    """
    Acquires a Postgres advisory lock and runs Alembic migrations.
    This ensures that only one instance runs migrations at a time.
    """
    logger.info("Attempting to run pending database migrations...")

    conn = None
    try:
        # We need a raw connection to execute the lock command and keep it open
        # while the subprocess runs.
        # Using the existing get_connection helper which returns an asyncpg connection
        # wrapped in SQLAlchemy's AsyncConnection if using create_async_engine,
        # BUT get_connection returns the raw asyncpg connection from the Connector?
        # Let's check src/database.py again.
        # get_connection returns `conn` from `connector.connect_async`, which IS an asyncpg connection.
        
        conn = await get_connection()
        
        # Acquire advisory lock
        # pg_advisory_lock waits until the lock is available.
        # We use transaction-level lock or session-level?
        # Since we are holding the connection, session-level is fine.
        logger.info("Acquiring advisory lock for migrations...")
        await conn.execute("SELECT pg_advisory_lock($1)", MIGRATION_LOCK_ID)
        logger.info("Advisory lock acquired.")

        # Run Alembic migrations in a subprocess
        # We use subprocess to avoid event loop conflicts with the running app
        # and to ensure a clean environment for Alembic.
        # Resolve alembic executable path relative to the current python interpreter
        import sys
        import os
        alembic_cmd = os.path.join(os.path.dirname(sys.executable), "alembic")
        
        logger.info(f"Running '{alembic_cmd} upgrade head'...")
        process = await asyncio.create_subprocess_exec(
            alembic_cmd, "upgrade", "head",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()

        if process.returncode == 0:
            # Combine stdout and stderr to check for migration actions
            # Alembic often logs to stderr by default
            full_output = (stdout.decode() if stdout else "") + (stderr.decode() if stderr else "")
            
            if "Running upgrade" in full_output:
                logger.info("Migrations applied successfully.")
                logger.info(f"Alembic Output:\n{full_output.strip()}")
            else:
                logger.info("Database is already up to date. No pending migrations.")
                # We can still log the output at debug level if needed, or just skip it to reduce noise
                logger.debug(f"Alembic Output:\n{full_output.strip()}")
        else:
            logger.error("Migrations failed.")
            if stdout:
                logger.info(f"Alembic Output:\n{stdout.decode().strip()}")
            if stderr:
                logger.error(f"Alembic Error:\n{stderr.decode().strip()}")
            # We might want to raise an exception here to stop startup if migrations fail
            raise RuntimeError("Database migrations failed.")

    except Exception as e:
        logger.error(f"Error during migration process: {e}")
        raise
    finally:
        if conn:
            try:
                # Release advisory lock
                logger.info("Releasing advisory lock...")
                await conn.execute("SELECT pg_advisory_unlock($1)", MIGRATION_LOCK_ID)
                logger.info("Advisory lock released.")
                await conn.close()
            except Exception as e:
                logger.error(f"Error releasing lock or closing connection: {e}")
