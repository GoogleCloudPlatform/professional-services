//package com.google.cloud.gszutil.io.`export`
//
//import com.google.cloud.bigquery.BigQuery.TableDataListOption
//import com.google.cloud.bigquery.FieldValue.Attribute
//import com.google.cloud.bigquery._
//import com.google.cloud.bqsh.ExportConfig
//import com.google.cloud.bqsh.cmd.Result
//import com.google.cloud.gszutil.io.`export`.{BqSelectResultParallelExporter, SimpleFileExporter}
//import com.google.cloud.gszutil.{BinaryEncoder, CopyBook, SchemaProvider}
//import com.google.cloud.imf.gzos.Linux
//import com.google.cloud.storage.{BlobId, Storage}
//import com.google.cloud.storage.Storage.ComposeRequest
//import org.mockito.{ArgumentMatchers, Mockito}
//import org.scalatest.flatspec.AnyFlatSpec
//
//import java.math.BigInteger
//import java.net.URI
//import java.util
//import scala.jdk.CollectionConverters._
//
//class BqSelectResultParallelExporterSpec extends AnyFlatSpec {
//  private val tableId: TableId = TableId.of("a", "b", "c")
//  private val zos = Linux
//  private val alphabet = List("A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K",
//    "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z")
//  private val exportCfg = ExportConfig(
//    partitionSize = 10,
//    partitionPageSize = 2,
//    workerThreads = 2
//  )
//  private val schema: SchemaProvider = CopyBook(
//    """01  ALPHABET-LAYOUT.
//      |   02  SYMBOL  PIC X(1).
//      |""".stripMargin)
//
//  it should "export alphabet" in {
//    var fileExporters = Set[SimpleFileExporter]()
//
//    val exporter = new BqSelectResultParallelExporter(
//      exportCfg, buildBQMock, buildGCSMock, new URI("test-uri"),
//      zos.getInfo, schema,
//      (_, _) => {
//        val fileExporter = new NoOutputExporter()
//        fileExporters += fileExporter
//        fileExporter
//      })
//
//    exporter.exportData(buildJobMock)
//
//    val actual = fileExporters.flatMap(_.asInstanceOf[NoOutputExporter].content).toList.sorted
//    assertResult(alphabet)(actual)
//  }
//
//  it should "export should fail when size of exported records > real records" in {
//    val exporter = new BqSelectResultParallelExporter(
//      exportCfg, buildBQMock, buildGCSMock, new URI("test-uri"),
//      zos.getInfo, schema,
//      (_, _) => new BrokenExporterSizeLarger()
//    )
//    assertThrows[IllegalStateException](
//      exporter.exportData(buildJobMock)
//    )
//  }
//
//  it should "export should fail when size of exported records < real records" in {
//    val exporter = new BqSelectResultParallelExporter(
//      exportCfg, buildBQMock, buildGCSMock, new URI("test-uri"),
//      zos.getInfo, schema,
//      (_, _) => new BrokenExporterSizeSmaller()
//    )
//    assertThrows[IllegalArgumentException](
//      exporter.exportData(buildJobMock)
//    )
//  }
//
//  it should "export should fail when file exporter return failed result" in {
//    val exporter = new BqSelectResultParallelExporter(
//      exportCfg, buildBQMock, buildGCSMock, new URI("test-uri"),
//      zos.getInfo,
//      schema,
//      (_, _) => new BrokenResponseExporter()
//    )
//    assertThrows[IllegalStateException](
//      exporter.exportData(buildJobMock)
//    )
//  }
//
//  it should "fail on 2 guardian blocks" in {
//    val job = Mockito.mock(classOf[Job])
//    Mockito.when(job.getJobId).thenReturn(JobId.of("test-job"))
//
//    val exporter = new BqSelectResultParallelExporter(
//      ExportConfig(),
//      Mockito.mock(classOf[BigQuery]),
//      buildGCSMock, new URI("test-uri"),
//      zos.getInfo,
//      Mockito.mock(classOf[SchemaProvider]),
//      (_, _) => Mockito.mock(classOf[SimpleFileExporter])
//    )
//
//    Mockito.when(job.isDone).thenReturn(false)
//    assertThrows[IllegalArgumentException](exporter.exportData(job))
//
//    Mockito.when(job.isDone).thenReturn(true)
//    assertThrows[IllegalArgumentException](exporter.exportData(job))
//  }
//
//  /*MOCKS*/
//  private class NoOutputExporter extends SimpleFileExporter {
//    var content: Set[String] = Set()
//
//    override def validateData(schema: FieldList, encoders: Array[BinaryEncoder]): Unit = {}
//
//    override def exportData(rows: Iterable[FieldValueList], schema: FieldList, encoders: Array[BinaryEncoder]): Result = {
//      content = content ++ rows.map(_.get(0).getStringValue)
//      Result.Success.copy(activityCount = rows.size)
//    }
//
//    override def getCurrentExporter(): FileExport = {
//      Mockito.mock(classOf[SimpleFileExport])
//    }
//
//    override def endIfOpen(): Unit = {
//    }
//  }
//
//  private class BrokenExporterSizeLarger extends SimpleFileExporter {
//    override def validateData(schema: FieldList, encoders: Array[BinaryEncoder]): Unit = {
//    }
//
//    override def exportData(rows: Iterable[FieldValueList], schema: FieldList, encoders: Array[BinaryEncoder]): Result = {
//      Result.Success.copy(activityCount = rows.size + 1)
//    }
//
//    override def getCurrentExporter: FileExport = {
//      Mockito.mock(classOf[SimpleFileExport])
//    }
//
//    override def endIfOpen(): Unit = {}
//  }
//
//  private class BrokenExporterSizeSmaller extends SimpleFileExporter {
//    override def validateData(schema: FieldList, encoders: Array[BinaryEncoder]): Unit = {
//    }
//
//    override def exportData(rows: Iterable[FieldValueList], schema: FieldList, encoders: Array[BinaryEncoder]): Result = {
//      Result.Success.copy(activityCount = rows.size - 1)
//    }
//
//    override def getCurrentExporter: FileExport = {
//      Mockito.mock(classOf[SimpleFileExport])
//    }
//
//    override def endIfOpen(): Unit = {}
//  }
//
//  private class BrokenResponseExporter extends SimpleFileExporter {
//    override def validateData(schema: FieldList, encoders: Array[BinaryEncoder]): Unit = {
//    }
//
//    override def exportData(rows: Iterable[FieldValueList], schema: FieldList, encoders: Array[BinaryEncoder]): Result = {
//      Result.Failure("error")
//    }
//
//    override def getCurrentExporter: FileExport = {
//      Mockito.mock(classOf[SimpleFileExport])
//    }
//
//    override def endIfOpen(): Unit = {}
//  }
//
//  private def buildBQMock: BigQuery = {
//    val bqMock = Mockito.mock(classOf[BigQuery])
//    val tableMock = buildTableMock
//    Mockito.when(bqMock.getTable(tableId)).thenReturn(tableMock)
//    Mockito.when(bqMock.listTableData(ArgumentMatchers.eq(tableId), ArgumentMatchers.any[TableDataListOption]()))
//      .thenAnswer(a => {
//        val indexArg = a.getArgument[TableDataListOption](1)
//        val sizeArg = a.getArgument[TableDataListOption](2)
//
//        val field = classOf[TableDataListOption].getSuperclass.getDeclaredField("value")
//        field.setAccessible(true)
//
//        val index = field.get(indexArg).asInstanceOf[Long]
//        val size = field.get(sizeArg).asInstanceOf[Long]
//        //mimic database here
//        val values = alphabet.slice(index.toInt, (index + size).toInt)
//          .map(FieldValue.of(Attribute.PRIMITIVE, _))
//          .map(s => FieldValueList.of(util.Arrays.asList(s)))
//
//        val result = Mockito.mock(classOf[TableResult])
//        Mockito.when(result.getValues).thenReturn(values.asJava)
//        result
//      })
//    bqMock
//  }
//
//  private def buildGCSMock: Storage = {
//    val gcsMock = Mockito.mock(classOf[Storage])
//    Mockito.when(gcsMock.compose(ArgumentMatchers.any[ComposeRequest])).thenAnswer(_ => null)
//    Mockito.when(gcsMock.delete(ArgumentMatchers.any[BlobId])).thenAnswer(_ => null)
//    gcsMock
//  }
//
//  private def buildJobMock: Job = {
//    val job = Mockito.mock(classOf[Job])
//    val cfg = QueryJobConfiguration.newBuilder("select symbol from alphabet;")
//      .setDestinationTable(tableId).build()
//    Mockito.when(job.getConfiguration).thenReturn(cfg)
//    Mockito.when(job.isDone).thenReturn(true)
//    Mockito.when(job.getJobId).thenReturn(JobId.of("test-job"))
//    job
//  }
//
//  private def buildTableDefinitionMock: TableDefinition = {
//    val result = Mockito.mock(classOf[TableDefinition])
//    val schema = Schema.of(FieldList.of(Field.of("symbol", StandardSQLTypeName.STRING)))
//    Mockito.when(result.getSchema).thenReturn(schema)
//    result
//  }
//
//  private def buildTableMock: Table = {
//    val result = Mockito.mock(classOf[Table])
//    val tableDefinitionMock = buildTableDefinitionMock
//    Mockito.when(result.getTableId).thenReturn(tableId)
//    Mockito.when(result.getNumRows).thenReturn(BigInteger.valueOf(alphabet.size))
//    Mockito.when(result.getDefinition[TableDefinition]).thenReturn(tableDefinitionMock)
//    result
//  }
//}
