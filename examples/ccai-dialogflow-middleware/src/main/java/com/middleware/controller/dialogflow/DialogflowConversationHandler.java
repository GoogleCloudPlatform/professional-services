/*
 * Copyright 2023 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 *  except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.middleware.controller.dialogflow;

import com.google.cloud.dialogflow.v2beta1.AnalyzeContentRequest;
import com.google.cloud.dialogflow.v2beta1.AnalyzeContentResponse;
import com.google.cloud.dialogflow.v2beta1.CompleteConversationRequest;
import com.google.cloud.dialogflow.v2beta1.Conversation;
import com.google.cloud.dialogflow.v2beta1.ConversationProfileName;
import com.google.cloud.dialogflow.v2beta1.ConversationsClient;
import com.google.cloud.dialogflow.v2beta1.CreateParticipantRequest;
import com.google.cloud.dialogflow.v2beta1.Participant;
import com.google.cloud.dialogflow.v2beta1.Participant.Role;
import com.google.cloud.dialogflow.v2beta1.ParticipantsClient;
import com.google.cloud.dialogflow.v2beta1.ParticipantsSettings;
import com.google.cloud.dialogflow.v2beta1.ProjectName;
import com.google.cloud.dialogflow.v2beta1.ResponseMessage;
import com.google.cloud.dialogflow.v2beta1.TextInput;
import com.google.common.base.Strings;
import com.middleware.controller.cache.MapperCache;
import com.middleware.controller.dialogflow.DialogflowDetailsProto.DialogflowDetails;
import com.middleware.controller.twilio.MarketplaceAddOn;
import com.middleware.controller.wehbook.NewMessage;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Handles the creation of a new conversation and manages the participants. */
public class DialogflowConversationHandler {

  // Create logger
  private static final Logger logger = LoggerFactory.getLogger(DialogflowConversationHandler.class);

  /**
   * Creates a new dialogflow conversation and add participant.
   *
   * @param marketplaceAddOn object, used to get the project id and conversation profile id
   */
  private static DialogflowDetails createNewConversation(MarketplaceAddOn marketplaceAddOn)
      throws IOException {
    // Create new conversation
    ProjectName projectName = ProjectName.of(marketplaceAddOn.getProjectId());
    ConversationProfileName conversationProfileName =
        ConversationProfileName.of(
            projectName.getProject(), marketplaceAddOn.getConversationProfileId());

    Conversation newConversation =
        Conversation.newBuilder()
            .setConversationProfile(conversationProfileName.toString())
            .build();

    // Create a end user participant
    Participant participant = Participant.newBuilder().setRole(Role.END_USER).build();

    try (ConversationsClient conversationsClient = ConversationsClient.create();
        ParticipantsClient participantsClient = ParticipantsClient.create()) {
      Conversation conversation =
          conversationsClient.createConversation(projectName, newConversation);

      logger.info("New Conversation created: " + conversation.getName());

      CreateParticipantRequest participantRequest =
          CreateParticipantRequest.newBuilder()
              .setParent(conversation.getName())
              .setParticipant(participant)
              .build();

      Participant participantResponse = participantsClient.createParticipant(participantRequest);
      logger.info("Participant added: " + participantResponse.getName());

      return DialogflowDetails.newBuilder()
          .setConversationName(conversation.getName())
          .setParticipantName(participantResponse.getName())
          .setConversationStartTime(System.currentTimeMillis())
          .setLanguageCode(marketplaceAddOn.getLanguageCode())
          .setBillingProjectId(marketplaceAddOn.getProjectId())
          .build();
    }
  }

  /**
   * Gets the Dialogflow details for the twilio conversation.
   *
   * <p>If the twilio conversation doesn't exist in the map (redis):
   *
   * <ul>
   *   <li>create a new conversation
   *   <li>add the participant
   *   <li>save the conversation sid and participant sid reference in the redis database map
   * </ul>
   *
   * @param newMessage Incoming message from the participant.
   * @return Dialogflow details for the conversation.
   */
  public static DialogflowDetails getDialogflowDetails(NewMessage newMessage) throws IOException {
    String twilioConversationSid = newMessage.getTwilioConversationSid();
    DialogflowDetails dialogflowDetails = MapperCache.getDialogflowDetails(twilioConversationSid);

    // Create a new conversation if it doesn't exist
    if (dialogflowDetails == null) {
      // TODO: Get Conversation details from marketplace add on. Replace this dummy code
      MarketplaceAddOn marketplaceAddOn = new MarketplaceAddOn();

      dialogflowDetails = createNewConversation(marketplaceAddOn);
      logger.info("New participant added to conversation:" + twilioConversationSid);
      MapperCache.putDialogflowDetails(twilioConversationSid, dialogflowDetails);
    }
    return dialogflowDetails;
  }

  /**
   * Sends the message to Dialogflow and gets the response for the participant using analyzeContent
   *
   * @param newMessage Message to be analyzed.
   * @param dialogflowDetails Details of the dialogflow conversation.
   * @return Response from Dialogflow.
   */
  public static String analyzeMessage(NewMessage newMessage, DialogflowDetails dialogflowDetails)
      throws IOException {

    TextInput message =
        TextInput.newBuilder()
            .setText(newMessage.getMessage())
            .setLanguageCode(dialogflowDetails.getLanguageCode())
            .build();
    AnalyzeContentRequest analyzeContentRequest =
        AnalyzeContentRequest.newBuilder()
            .setParticipant(dialogflowDetails.getParticipantName())
            .setTextInput(message)
            .build();

    ParticipantsSettings settings = getParticipantsSettings(dialogflowDetails);

    try (ParticipantsClient participantsClient = ParticipantsClient.create(settings)) {
      AnalyzeContentResponse analyzeContentResponse =
          participantsClient.analyzeContent(analyzeContentRequest);

      String replyText = analyzeContentResponse.getReplyText();
      logger.debug("Response: " + replyText);
      newMessage.replyToMessage(replyText);

      boolean isLiveAgentHandoff =
          analyzeContentResponse.getAutomatedAgentReply().getResponseMessagesList().stream()
              .anyMatch(ResponseMessage::hasLiveAgentHandoff);

      boolean isEndOfInteraction =
          analyzeContentResponse.getAutomatedAgentReply().getResponseMessagesList().stream()
              .anyMatch(ResponseMessage::hasEndInteraction);

      if (isLiveAgentHandoff) {
        logger.info("Handing over " + newMessage.getTwilioConversationSid() + " to agent");

        // Remove all webhooks to middleware before handing over to agent
        newMessage.removeScopedWebhooks();

        // Create the handover event
        newMessage.handOverToAgent();
      }

      if (isEndOfInteraction || isLiveAgentHandoff) {
        logger.info("Conversation ended: " + newMessage.getTwilioConversationSid());

        // Complete the dialogflow conversation
        try (ConversationsClient conversationsClient = ConversationsClient.create()) {
          CompleteConversationRequest completeConversationRequest =
              CompleteConversationRequest.newBuilder()
                  .setName(dialogflowDetails.getConversationName())
                  .build();

          // Mark the conversation as complete in Dialogflow
          conversationsClient.completeConversation(completeConversationRequest);
          logger.info("Conversation completed: " + dialogflowDetails.getConversationName());

          // Remove the conversation from the cache
          MapperCache.deleteDialogflowDetails(newMessage.getTwilioConversationSid());
        }
      }

      // Close the conversation in Twilio if the conversation is ended in Dialogflow and not
      // handed over to agent
      if (isEndOfInteraction && !isLiveAgentHandoff) {
        // End the conversation in Twilio
        newMessage.closeTwilioConversation();
      }

      return replyText;
    }
  }

  /**
   * Gets the participants settings for the conversation.
   *
   * <p>If the billing project id is not null or empty, add the quota project id header to the
   * client context.
   *
   * <p>This will ensure that the correct billing project is used for the conversation.
   *
   * @param dialogflowDetails The details of the dialogflow conversation.
   * @return The participants settings for the conversation.
   */
  private static ParticipantsSettings getParticipantsSettings(DialogflowDetails dialogflowDetails)
      throws IOException {
    ParticipantsSettings.Builder builder = ParticipantsSettings.newBuilder();

    // Add the quota project id header to the client context if the billing project id is not null
    String billingProjectId = dialogflowDetails.getBillingProjectId();
    if (!Strings.isNullOrEmpty(billingProjectId)) {
      builder.setQuotaProjectId(billingProjectId);
    }

    return builder.build();
  }
}
