package msg.service;

import com.google.cloud.Timestamp;
import com.google.cloud.spanner.Database;
import com.google.cloud.spanner.DatabaseAdminClient;
import com.google.cloud.spanner.DatabaseClient;
import com.google.cloud.spanner.DatabaseId;
import com.google.cloud.spanner.Mutation;
import com.google.cloud.spanner.Operation;
import com.google.cloud.spanner.Options;
import com.google.cloud.spanner.ResultSet;
import com.google.cloud.spanner.Spanner;
import com.google.cloud.spanner.SpannerOptions;
import com.google.cloud.spanner.Statement;
import com.google.spanner.admin.database.v1.CreateDatabaseMetadata;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.annotation.PreDestroy;
import msg.domain.Message;
import org.springframework.stereotype.Component;

@Component
public class SpannerService {

  private final String instanceId = "chatlate-spanner";
  private final String databaseId = "chatlate";

  private Spanner spanner;
  private DatabaseId id;
  private DatabaseClient dbClient;

  public SpannerService() {
    initDb();
    dbClient = spanner.getDatabaseClient(id);
  }

  @PreDestroy
  public void preDestroy() {
    if (spanner != null) {
      spanner.close();
    }
  }

  public void initDb() {
    if (instanceId == null || databaseId == null) {
      return;
    }

    // Create ID

    SpannerOptions options = SpannerOptions.newBuilder().build();
    spanner = options.getService();

    id = DatabaseId.of(options.getProjectId(), instanceId, databaseId);

    // Instantiates a client
    DatabaseAdminClient dbAdminClient = spanner.getDatabaseAdminClient();
    Iterator<Database> databaseIterator =
        dbAdminClient.listDatabases(instanceId, Options.pageSize(10)).iterateAll().iterator();

    while (databaseIterator.hasNext()) {
      Database database = databaseIterator.next();
      if (database.getId().getDatabase().equalsIgnoreCase(databaseId)) {
        return; // Database exists, no need to initialize
      }
    }

    Operation<Database, CreateDatabaseMetadata> op =
        dbAdminClient.createDatabase(
            id.getInstanceId().getInstance(),
            id.getDatabase(),
            Arrays.asList(
                "CREATE TABLE "
                    + TABLE
                    + " (\n"
                    + "  ID_ATTRIBUTE   String(36) NOT NULL,\n"
                    + "  sender  STRING(1024),\n"
                    + "  message   STRING(1024),\n"
                    + "  language STRING(20),\n"
                    + "  recipient STRING(20),\n"
                    + "  read      BOOL,\n"
                    + "  create_time TIMESTAMP"
                    + ") PRIMARY KEY (ID_ATTRIBUTE)",
                "CREATE INDEX Message ON " + TABLE + "(sender,recipient,read)"));
    Database db = op.waitFor().getResult();
    System.out.println("Created database [" + db.getId() + "]");

    // DatabaseClient dbClient = spanner.getDatabaseClient(ID_ATTRIBUTE);

  }

  public static final String TABLE = "messages";
  public static final String ID_ATTRIBUTE = "ID_ATTRIBUTE";

  public static final String MESSAGE_ATTRIBUTE = "message";
  public static final String RECIPIENT_ATTRIBUTE = "recipient";
  public static final String LANGUAGE_ATTRIBUTE = "language";
  public static final String SENDER_ATTRIBUTE = "sender";
  public static final String TS_ATTTRIBUTE = "create_time";
  public static final String READ_ATTRIBUTE = "read";

  public void persistMessage(Message message) {
    dbClient.write(buildMutations(message));
  }

  public List<Message> getMessages(String recipient) {
    List<Message> messages = new ArrayList<>();
    try (ResultSet rs =
        dbClient
            .singleUse()
            .executeQuery(
                Statement.newBuilder(
                        "SELECT * FROM messages WHERE "
                            + "recipient = @recipient AND "
                            + "read = FALSE ORDER BY create_time ASC;")
                    .bind("recipient")
                    .to(recipient)
                    .build())) {
      while (rs.next()) {
        Message message = new Message();
        message.id = rs.getString(ID_ATTRIBUTE);
        message.message = rs.getString(MESSAGE_ATTRIBUTE);
        message.sender = rs.getString(SENDER_ATTRIBUTE);
        message.recipient = rs.getString(RECIPIENT_ATTRIBUTE);
        message.language = rs.getString(LANGUAGE_ATTRIBUTE);
        messages.add(message);
      }
    }
    List<Mutation> mutations = new ArrayList<>();
    for (Message message : messages) {
      mutations.add(
          Mutation.newUpdateBuilder(TABLE)
              .set(ID_ATTRIBUTE)
              .to(message.id)
              .set(RECIPIENT_ATTRIBUTE)
              .to(message.recipient)
              .set(SENDER_ATTRIBUTE)
              .to(message.sender)
              .set(MESSAGE_ATTRIBUTE)
              .to(message.message)
              .set(LANGUAGE_ATTRIBUTE)
              .to(message.language)
              .set(TS_ATTTRIBUTE)
              .to(Timestamp.now())
              .set(READ_ATTRIBUTE)
              .to(Boolean.TRUE)
              .build());
    }
    dbClient.write(mutations);
    return messages;
  }

  public List<Message> getMessageList(String recipient, String sender) {
    List<Message> messages = new ArrayList<>();
    try (ResultSet rs =
        dbClient
            .singleUse()
            .executeQuery(
                Statement.newBuilder(
                        "SELECT * FROM messages WHERE "
                            + "(sender = @sender AND recipient = @recipient) OR "
                            + "(recipient = @sender AND sender = @recipient) ORDER BY create_time ASC;")
                    .bind("recipient")
                    .to(recipient)
                    .bind("sender")
                    .to(sender)
                    .build())) {
      while (rs.next()) {
        Message message = new Message();
        message.id = rs.getString(ID_ATTRIBUTE);
        message.message = rs.getString(MESSAGE_ATTRIBUTE);
        message.sender = rs.getString(SENDER_ATTRIBUTE);
        message.recipient = rs.getString(RECIPIENT_ATTRIBUTE);
        message.language = rs.getString(LANGUAGE_ATTRIBUTE);
        messages.add(message);
      }
    }
    return messages;
  }

  private List<Mutation> buildMutations(Message... m) {
    return Arrays.asList(m)
        .stream()
        .map(
            message ->
                Mutation.newInsertBuilder(TABLE)
                    .set(ID_ATTRIBUTE)
                    .to(message.id)
                    .set(RECIPIENT_ATTRIBUTE)
                    .to(message.recipient)
                    .set(SENDER_ATTRIBUTE)
                    .to(message.sender)
                    .set(MESSAGE_ATTRIBUTE)
                    .to(message.message)
                    .set(LANGUAGE_ATTRIBUTE)
                    .to(message.language)
                    .set(TS_ATTTRIBUTE)
                    .to(Timestamp.now())
                    .set(READ_ATTRIBUTE)
                    .to(Boolean.FALSE)
                    .build())
        .collect(Collectors.toList());
  }

  public void writeExampleData() {
    Message testMessage = new Message();
    testMessage.recipient = "john";
    testMessage.sender = "jane";
    testMessage.message = "Hello";
    testMessage.language = "en";
    testMessage.id = UUID.randomUUID().toString();
    List<Mutation> mutations = buildMutations(testMessage);

    dbClient.write(mutations);
  }

  public String queryTest() {
    ResultSet resultSet =
        dbClient
            .singleUse()
            .executeQuery(
                Statement.of("SELECT ID_ATTRIBUTE, sender, message FROM messages LIMIT 2"));
    StringBuilder sb = new StringBuilder("");
    while (resultSet.next()) {
      sb.append(
          String.format(
              "%s %s %s\n",
              resultSet.getString(0), resultSet.getString(1), resultSet.getString(2)));
    }
    return sb.toString();
  }

  public String test() {
    writeExampleData();
    return queryTest();
  }
}
