/*
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.tools.sce.aurinko.cli;

import static org.junit.Assert.assertEquals;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyBoolean;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.fge.jsonschema.core.exceptions.ProcessingException;
import com.google.cloud.tools.sce.aurinko.broker.DataBroker;
import com.google.cloud.tools.sce.aurinko.broker.DataBrokerMessage;
import com.google.cloud.tools.sce.aurinko.validator.exception.MissingSchemaException;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

@RunWith(PowerMockRunner.class)
@PrepareForTest({App.class, DataBroker.class})
public class AppTest {

    private App testApp;
    private final String PROJECT_ID = "testprojectid";
    private final String TOPIC_ID = "testtopicid";
    private DataBroker mockDataBroker;
    @Before
    public void setup() throws IOException, ProcessingException, MissingSchemaException {
        mockDataBroker = PowerMockito.spy(new DataBroker(this.TOPIC_ID, this.PROJECT_ID));

    }

    @Test
    public void testSendSmallFile() throws Exception {
        String fileName = getClass().getResource("/person-right-test.json").getFile();
        byte[] encoded = Files.readAllBytes(Paths.get(fileName));
        String payload = new String(encoded);
        ObjectMapper mapper = new ObjectMapper();
        JsonNode payloadJson = mapper.readTree(payload);
        DataBrokerMessage successfulMessage = new DataBrokerMessage(payloadJson, this.TOPIC_ID, this.PROJECT_ID);
        
        successfulMessage.setMessageId("testmessageid");
        PowerMockito.doReturn(successfulMessage).when(mockDataBroker, "publish", any(DataBrokerMessage.class), anyBoolean());
        PowerMockito.whenNew(DataBroker.class).withAnyArguments().thenReturn(mockDataBroker);
        
        // The actual method under test
        testApp = new App();
        DataBrokerMessage returnMessage = testApp.execute(this.PROJECT_ID, this.TOPIC_ID, fileName);

        assertEquals(payloadJson.toString(), returnMessage.getPayload().toString());
        assertEquals(this.PROJECT_ID, returnMessage.getProjectId());
        assertEquals(this.TOPIC_ID, returnMessage.getTopicId());



        

    }


    
}