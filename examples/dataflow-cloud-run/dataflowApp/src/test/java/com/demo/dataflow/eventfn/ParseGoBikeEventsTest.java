package com.demo.dataflow.eventfn;

import com.demo.dataflow.model.FailedMessage;
import com.demo.dataflow.model.GoBike;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Count;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.junit.Rule;
import org.junit.Test;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

public class ParseGoBikeEventsTest  implements Serializable {
    @Rule
    public TestPipeline pipeline = TestPipeline.create();

    @Test
    public void testParseFunctionsWithoutErrors() throws Exception {
        List<String> events = getFilesContent("testDataWithoutErrors.csv");
        PCollection<String> input = pipeline.apply(Create.of(events));
        PCollectionTuple parsedGoBikeCollection = ParseGoBikeEvents.process(input);
        PCollection<GoBike> validGoBikeCollection = parsedGoBikeCollection.get(ParseGoBikeEvents.successTag);
        PAssert
                .that(validGoBikeCollection.apply(Count.globally()))
                .containsInAnyOrder(7L);
        pipeline.run().waitUntilFinish();
    }

    @Test
    public void testParseFunctionsWithErrors() throws Exception {
        List<String> events = getFilesContent("testDataWithErrors.csv");
        PCollection<String> input = pipeline.apply(Create.of(events));
        PCollectionTuple parsedGoBikeCollection = ParseGoBikeEvents.process(input);
        PCollection<FailedMessage> invalidGoBikeCollection = parsedGoBikeCollection.get(ParseGoBikeEvents.deadLetterTag);
        PAssert
                .that(invalidGoBikeCollection.apply(Count.globally()))
                .containsInAnyOrder(4L);
        pipeline.run().waitUntilFinish();
    }

    private List<String> getFilesContent(String fileName) throws Exception {
        Path resourceDirectory = Paths.get("src","test","resources", fileName);
        return Files.readAllLines(resourceDirectory);
    }
}
