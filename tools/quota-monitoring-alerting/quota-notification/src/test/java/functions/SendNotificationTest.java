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
