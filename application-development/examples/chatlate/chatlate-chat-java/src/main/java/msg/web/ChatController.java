/*
 * Copyright 2017 Google Inc.
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package msg.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.stream.Collectors;
import msg.domain.Message;
import msg.domain.Messages;
import msg.domain.Status;
import msg.service.SpannerService;
import msg.service.TranslateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/chat")
public class ChatController {

  @Autowired TranslateService translateService;

  @Autowired SpannerService spannerService;

  public static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  private String buildTopicName(String recipient) {
    return recipient + "_topic";
  }

  private String buildSubscriptionName(String recipient) {
    return recipient + "_subscription";
  }

  @RequestMapping(
    value = "/message",
    method = RequestMethod.POST,
    consumes = MediaType.APPLICATION_JSON_VALUE,
    produces = MediaType.APPLICATION_JSON_VALUE
  )
  public Status postMessage(@RequestBody Message message) throws Exception {

    String topic = buildTopicName(message.recipient);
    String text = OBJECT_MAPPER.writeValueAsString(message);
    spannerService.persistMessage(message);

    Status status = new Status();
    status.result = "Ok";
    return status;
  }

  @RequestMapping(
    value = "/message/{recipient}/{language}",
    method = RequestMethod.GET,
    produces = MediaType.APPLICATION_JSON_VALUE
  )
  public Messages getMessages(@PathVariable String recipient, @PathVariable String language)
      throws Exception {
    List<Message> messageList =
        spannerService
            .getMessages(recipient)
            .stream()
            .map(
                m -> {
                  if (!m.language.equalsIgnoreCase(language)) {
                    // Translate
                    m.message = translateService.translateText(m.message, language);
                  }
                  return m;
                })
            .collect(Collectors.toList());
    Messages messages = new Messages();
    messages.messages = messageList.toArray(new Message[messageList.size()]);
    return messages;
  }

  @RequestMapping(
    value = "/message",
    method = RequestMethod.GET,
    produces = MediaType.APPLICATION_JSON_VALUE
  )
  public Messages getMessagesWithHeaders(
      @RequestHeader(value = "Chat-Recipient") String recipient,
      @RequestHeader(value = "Chat-Language") String language)
      throws Exception {
    // This is a delegate method to make the signatures easier to match in the load test
    return getMessages(recipient, language);
  }

  @RequestMapping(
    value = "/login/{recipient}/{language}",
    method = RequestMethod.POST,
    produces = MediaType.APPLICATION_JSON_VALUE
  )
  public Status login(@PathVariable String recipient, @PathVariable String language)
      throws Exception {
    Status status = new Status();
    status.result = "Ok";
    return status;
  }

  @RequestMapping(
    value = "/login",
    method = RequestMethod.POST,
    produces = MediaType.APPLICATION_JSON_VALUE
  )
  public Status loginWithHeaders(
      @RequestHeader(value = "Chat-Recipient") String recipient,
      @RequestHeader(value = "Chat-Language") String language)
      throws Exception {
    // This is a delegate method to make the signatures easier to match in the load test
    return login(recipient, language);
  }

  @RequestMapping(
    value = "/history/{recipient}/{language}/{sender}",
    method = RequestMethod.GET,
    produces = MediaType.APPLICATION_JSON_VALUE
  )
  public Messages getHistory(
      @PathVariable String recipient, @PathVariable String language, @PathVariable String sender)
      throws Exception {
    List<Message> messageList = spannerService.getMessageList(recipient, sender);
    Messages messages = new Messages();
    messages.messages = messageList.toArray(new Message[messageList.size()]);
    return messages;
  }

  @RequestMapping(
    value = "/history",
    method = RequestMethod.GET,
    produces = MediaType.APPLICATION_JSON_VALUE
  )
  public Messages getHistoryWithHeaders(
      @RequestHeader(value = "Chat-Recipient") String recipient,
      @RequestHeader(value = "Chat-Language") String language,
      @RequestHeader(value = "Chat-Sender") String sender)
      throws Exception {
    // This is a delegate method to make the signatures easier to match in the load test
    return getHistory(recipient, language, sender);
  }
}
