/*
Copyright 2022 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
package functions;

import static com.google.common.truth.Truth.assertThat;

import com.google.common.testing.TestLogHandler;
import functions.eventpojos.PubSubMessage;
import java.util.logging.Logger;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class SendNotificationTest {
  private SendNotification sampleUnderTest;
  private static final Logger logger = Logger.getLogger(SendNotification.class.getName());

  private static final TestLogHandler LOG_HANDLER = new TestLogHandler();

  @Before
  public void setUp() {
    sampleUnderTest = new SendNotification();
    logger.addHandler(LOG_HANDLER);
    LOG_HANDLER.clear();
  }

  @Test
  public void sendNotification_shouldSendEmail() {
    PubSubMessage pubSubMessage = new PubSubMessage();
    pubSubMessage.setEmailIds("anuradhabajpai@google.com");
    pubSubMessage.setLimit("100");
    pubSubMessage.setMetric("VPC");
    pubSubMessage.setUsage("80");
    pubSubMessage.setConsumption(80f);
    /*pubSubMessage.setData(Base64.getEncoder().encodeToString(
    "anuradha.bajpai@gmail.com,anuradhabajpai@google.com".getBytes(StandardCharsets.UTF_8)));*/
    sampleUnderTest.accept(pubSubMessage, null);

    String logMessage = LOG_HANDLER.getStoredLogRecords().get(0).getMessage();
    assertThat("anuradhabajpai@google.com").isEqualTo(logMessage);
  }
}
