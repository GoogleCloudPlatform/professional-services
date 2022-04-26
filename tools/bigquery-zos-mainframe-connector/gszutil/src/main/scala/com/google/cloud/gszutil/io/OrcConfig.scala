package com.google.cloud.gszutil.io

import com.google.cloud.imf.gzos.Util
import org.apache.hadoop.conf.Configuration
import org.apache.hadoop.fs.FileSystem
import org.apache.orc.OrcFile.WriterOptions
import org.apache.orc.{InMemoryKeystore, NoOpMemoryManager, OrcConf, OrcFile, TypeDescription}

object OrcConfig {
  private final val OptimalGZipBuffer = 32*1024

  private def orcConfig(isIbm: Boolean, schema: TypeDescription): Configuration = {
    val c = new Configuration(false)
    if (isIbm) OrcConf.COMPRESS.setString(c, "ZLIB")
    else OrcConf.COMPRESS.setString(c, "SNAPPY")
    OrcConf.BUFFER_SIZE.setLong(c, OptimalGZipBuffer)
    OrcConf.ENFORCE_COMPRESSION_BUFFER_SIZE.setBoolean(c, true)
    OrcConf.COMPRESSION_STRATEGY.setString(c, "SPEED")
    OrcConf.ENABLE_INDEXES.setBoolean(c, false)
    OrcConf.OVERWRITE_OUTPUT_FILE.setBoolean(c, true)
    OrcConf.MEMORY_POOL.setDouble(c, 0.5d)
    OrcConf.ROW_INDEX_STRIDE.setLong(c, 0)
    OrcConf.DICTIONARY_KEY_SIZE_THRESHOLD.setDouble(c, 0)
    OrcConf.DIRECT_ENCODING_COLUMNS.setString(c, String.join(",",schema.getFieldNames))
    OrcConf.ROWS_BETWEEN_CHECKS.setLong(c, 0)
    c
  }

  def buildWriterOptions(schema: TypeDescription, fs: FileSystem): WriterOptions = OrcFile
    .writerOptions(orcConfig(Util.isIbm, schema))
    .setSchema(schema)
    .memory(NoOpMemoryManager)
    .encrypt("")
    .setKeyProvider(new InMemoryKeystore())
    .fileSystem(fs)
}
