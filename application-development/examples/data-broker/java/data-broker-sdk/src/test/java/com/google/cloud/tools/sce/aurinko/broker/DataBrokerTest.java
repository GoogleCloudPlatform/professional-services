package com.google.cloud.tools.sce.aurinko.broker;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;
import static org.mockito.Matchers.anyObject;
import static org.mockito.Mockito.mock;

import com.google.api.core.ApiFuture;
import com.google.api.core.ApiFutures;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.pubsub.v1.ProjectTopicName;
//import com.google.cloud.tools.sce.aurinko.validator.exception.SchemaMessageMismatchException;
//import com.google.cloud.tools.sce.aurinko.validator.exception.MissingSchemaException;
import com.google.cloud.tools.sce.aurinko.validator.exception.*;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

@RunWith(PowerMockRunner.class)
@PrepareForTest({ProjectTopicName.class,Publisher.class,ApiFutures.class,DataBroker.class})
public class DataBrokerTest {

    private DataBroker broker;
    private final String PROJECT_ID = "testprojectid";
    private final String TOPIC_ID = "testtopicid";
    private Publisher mockPublisher;

    @Before
    public void setup() throws Exception {
         mockPublisher = mock(Publisher.class);
    }

    @Test(expected = MissingSchemaException.class)
    public void testSendMissingSchemaThrows() throws Exception {
        broker = PowerMockito.spy(new DataBroker(this.PROJECT_ID, this.TOPIC_ID));
        String testMessage = "{ \"msg\": \"Hello\"}";

        @SuppressWarnings("unchecked")
        ApiFuture<String> mockFuture = mock(ApiFuture.class);

        PowerMockito.doReturn(mockFuture).when(broker, "getFuture", anyObject());
        PowerMockito.doReturn(mockPublisher).when(broker, "getPublisher");
        broker.send(testMessage, false);

    }
 
    @Test
    public void testSendGoodMessage() {
        String testMessage = "{\"Person\":{\"firstName\":\"Ima\",\"lastName\":\"Person\",\"age\":35}}";

        @SuppressWarnings("unchecked")
        ApiFuture<String> mockFuture = mock(ApiFuture.class);

        try {
            broker = PowerMockito.spy(new DataBroker(this.PROJECT_ID, this.TOPIC_ID));
            PowerMockito.doReturn(mockFuture).when(broker, "getFuture", anyObject());
            PowerMockito.doReturn(mockPublisher).when(broker, "getPublisher");
            DataBrokerMessage returnMessage = broker.send(testMessage, false);
            assertEquals(returnMessage.getProjectId(), this.PROJECT_ID);
            assertEquals(returnMessage.getTopicId(), this.TOPIC_ID);
            assertEquals(returnMessage.getPayload().toString(), testMessage);

        } catch (Exception e) {
            e.printStackTrace();
            fail();
        }
    }

    @Test(expected = SchemaMessageMismatchException.class)
    public void testSendBadMessage() throws Exception {
        // The age is a String, not an int, so this should result in an exception.
        String testMessage = "{\"Person\":{\"firstName\":\"Ima\",\"lastName\":\"Person\",\"age\":\"35\"}}";

        @SuppressWarnings("unchecked")
        ApiFuture<String> mockFuture = mock(ApiFuture.class);
 
        broker = PowerMockito.spy(new DataBroker(this.PROJECT_ID, this.TOPIC_ID));
        PowerMockito.doReturn(mockFuture).when(broker, "getFuture", anyObject());
        PowerMockito.doReturn(mockPublisher).when(broker, "getPublisher");
        broker.send(testMessage, false);


    }

}