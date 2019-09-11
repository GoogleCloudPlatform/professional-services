/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package pipelines;

import org.apache.avro.Schema;
import org.apache.avro.generic.GenericContainer;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.coders.ByteArrayCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;
import org.apache.beam.sdk.io.kafka.KafkaIO;
import org.apache.beam.sdk.options.Default;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.SerializableFunction;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.kafka.common.serialization.ByteArrayDeserializer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.log4j.Logger;

/**
 * An example of streaming job which reads unbounded data from Kafka.
 * It implements the following pipeline:
 * <pre>
 *     - Consume a message from input Kafka topic once it was arrived. Every message contains the
 *     coordinates (x,y) of point on the plot.
 *     - Filter out the points that .apply(
            "ExtractPayload",
            ParDo.of(
                new DoFn<String, KV<String, String>>() {
                	private static final long serialVersionUID = 1L;
                  @ProcessElement
                  public void processElement(ProcessContext c) throws Exception {
                	
                    c.output(KV.of("filtered", c.element()));
                  }
                }))
        .apply(
            "WriteToKafka",
            KafkaIO.<String, String>write()
                .withBootstrapServers(options.getBootstrap())
                .withTopic(options.getOutputTopic())
                .withKeySerializer(org.apache.kafka.common.serialization.StringSerializer.class)
                .withValueSerializer(org.apache.kafka.common.serialization.StringSerializer.class));

    pipeline.run();
  }
}are out of defined region on the plot.
 *     - Write filtered messages into output Kafka topic.
 * </pre>
 *
 * Format of message with coordinates:
 * <pre>
 *     id,x,y
 * </pre>
 */
public class ReadFromKafka {

  static final int COORD_X = 100;  // Default maximum coordinate value (axis X)
  static final int COORD_Y = 100;  // Default maximum coordinate value (axis Y)
  static final String OUTPUT_PATH = "/tmp/beam/objects_report";  // Default output path
  static final String BOOTSTRAP_SERVERS = "10.36.6.3:9092,10.36.6.6:9092,10.36.8.6:9092";  // Default bootstrap kafka servers
  static final String INPUT_TOPIC = "new_topic";  // Default input kafka topic name
  static final String OUTPUT_TOPIC = "test_topic";  // Default output kafka topic name
  private static final Logger LOG = Logger.getLogger(ReadFromKafka.class);
  /**
   * Specific pipeline options.
   */
  private interface Options extends PipelineOptions {
    @Description("Maximum coordinate value (axis X)")
    @Default.Integer(COORD_X)
    Integer getCoordX();
    void setCoordX(Integer value);

    @Description("Maximum coordinate value (axis Y)")
    @Default.Integer(COORD_Y)
    Integer getCoordY();
    void setCoordY(Integer value);

    @Description("Kafka bootstrap servers")
    @Default.String(BOOTSTRAP_SERVERS)
    String getBootstrap();
    void setBootstrap(String value);

    @Description("Kafka input topic name")
    @Default.String(INPUT_TOPIC)
    String getInputTopic();
    void setInputTopic(String value);

    @Description("Kafka output topic name")
    @Default.String(OUTPUT_TOPIC)
    String getOutputTopic();
    void setOutputTopic(String value);
    
    @Description("Kafka output path")
    @Default.String(OUTPUT_PATH)
    String getOutputPath();
    void setOutputPath(String value);

  }

  private static class FilterObjectsByCoordinates implements SerializableFunction<String, Boolean> {
	  private static final long serialVersionUID = 1L;
    private Integer maxCoordX;
    private Integer maxCoordY;

    public FilterObjectsByCoordinates(Integer maxCoordX, Integer maxCoordY) {
      this.maxCoordX = maxCoordX;
      this.maxCoordY = maxCoordY;
    }

    public Boolean apply(String input) {
      String[] split = input.split(",");
      if (split.length < 3) {
        return false;
      }
      Integer coordX = Integer.valueOf(split[1]);
      Integer coordY = Integer.valueOf(split[2]);
      return (coordX >= 0 && coordX < this.maxCoordX
          && coordY >= 0 && coordY < this.maxCoordY);
    }
  }

    /**
     *
     * @param args
     * @throws Exception
     */
    public static void main(String[] args) throws Exception {
    final Options options = PipelineOptionsFactory.fromArgs(args).withValidation().as(Options.class);
    Pipeline pipeline = Pipeline.create(options);
    
    
    PCollection<KV<String, byte[]>> values = pipeline.apply("Read From Kafka", KafkaIO.<String, byte[]>read()
            .withBootstrapServers(options.getBootstrap())
            .withTopic(options.getInputTopic())
	    .withValueDeserializerAndCoder(ByteArrayDeserializer.class, ByteArrayCoder.of())
            .withKeyDeserializerAndCoder(StringDeserializer.class, StringUtf8Coder.of())
            .withoutMetadata());
    PCollection<byte[]> bytes = values.apply("Convert into bytes", ParDo.of(new DoFn<KV<String,byte[]>, byte[]>() {
        @ProcessElement
        public void processElement(ProcessContext c) {
            //LOG.info("As read from kafka ***");
            //printing the String form of the data
		Schema schema =((GenericContainer) c.element()).getSchema();
        	LOG.info("Schema : "+schema.toString());
        	//DatumReader<GenericRecord> datumReader = new GenericDatumReader<GenericRecord>();
        	
        	

        }
    }));
    		
  /*public static void main(String args[]) throws Exception {
		// Instantiating the Schema.Parser class.
		Schema schema = new Schema.Parser().parse(new File(
				"/home/hduser/Desktop/AVRO/schema/emp.avsc"));
		DatumReader<GenericRecord> datumReader = new GenericDatumReader<GenericRecord>(
				schema);
		DataFileReader<GenericRecord> dataFileReader = new DataFileReader<GenericRecord>(
				new File("/home/hduser/Desktop/AVRO/mydata.txt"),
				datumReader);
		GenericRecord emp = null;
		while (dataFileReader.hasNext()) {
			emp = dataFileReader.next(emp);
			System.out.println(emp);
		}
		System.out.println("data deserialized wwoooooo...!");
	
   * 
   *   
   *   
   *   		
   */
       		
    		//org.apache.beam.sdk.schemas.Schema schema = values.getSchema();
    		//DatumReader<GenericRecord> datumReader = new GenericDatumReader<GenericRecord>();
    		
    
    
    
    
    /*pipeline
        .apply(
        		
        	KafkaIO.read()
        	.withBootstrapServers(options.getBootstrap())
        	.withKeyDeserializer(KafkaAvroDeserializer.class));*/
        	
        
        	//.withKeyDeserializer(java.lang.Class<? extends org.apache.kafka.common.serialization.Deserializer<K>> keyDeserializer)
        	
      
    		
        	
/*            KafkaIO.<Long, String>read()
                .withBootstrapServers(options.getBootstrap())
                .withTopic(options.getInputTopic())
                .withKeyDeserializer(LongDeserializer.class)
                .withValueDeserializer(StringDeserializer.class))
       	
        .apply(
            ParDo.of(
                new DoFn<KafkaRecord<Long, String>, String>() {
                	private static final long serialVersionUID = 1L;
                  @ProcessElement
                  public void processElement(ProcessContext processContext) {
                    KafkaRecord<Long, String> record = processContext.element();
                    processContext.output(record.getKV().getValue());
                    System.out.println(processContext.element().toString());
                  }
                }))
       
        .apply(TextIO.write().to(options.getOutputPath())));
        
        
      */          
    /*
        .apply(
            "FilterValidCoords",
            Filter.by(new FilterObjectsByCoordinates(options.getCoordX(), options.getCoordY())))

        .apply(
            "ExtractPayload",
            ParDo.of(
                new DoFn<String, KV<String, String>>() {
                	private static final long serialVersionUID = 1L;
                  @ProcessElement
                  public void processElement(ProcessContext c) throws Exception {
                	//System.out.println(c.element().toString());
                    c.output(KV.of("filtered", c.element()));
                  }
                }))
        .apply(
            "WriteToKafka",
            KafkaIO.<String, String>write()
                .withBootstrapServers(options.getBootstrap())
                .withTopic(options.getOutputTopic())
                .withKeySerializer(org.apache.kafka.common.serialization.StringSerializer.class)
                .withValueSerializer(org.apache.kafka.common.serialization.StringSerializer.class));
*/
    pipeline.run();
  }
}        
