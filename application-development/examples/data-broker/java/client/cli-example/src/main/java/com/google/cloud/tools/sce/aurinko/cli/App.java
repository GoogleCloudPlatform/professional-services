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

import java.nio.file.Files;
import java.nio.file.Paths;

import com.google.cloud.tools.sce.aurinko.broker.DataBroker;
import com.google.cloud.tools.sce.aurinko.broker.DataBrokerMessage;

import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;

public class App {

    public App() {

    }

    public DataBrokerMessage execute(String projectId, String topicId, String payloadFile) throws Exception {
        // First Read in the the payload file
        byte[] encoded = Files.readAllBytes(Paths.get(payloadFile));
        // Make it a string
        String payload = new String(encoded);
        DataBroker dataBroker = null;
        if (projectId == null) {
            dataBroker = new DataBroker(topicId);
        } else {
            dataBroker = new DataBroker(projectId, topicId);
        }
        return dataBroker.send(payload, true);

    }

    public static void main(String[] args) throws ParseException {
        // create Options object
        Options options = new Options();
        //Create each option
        Option projectOption = Option.builder("p").required(false).longOpt("project").hasArg(true).build();
        Option topicOption = Option.builder("t").required(false).longOpt("topic").hasArg(true).build();
        Option fileOption = Option.builder("f").required(true).longOpt("file").hasArg(true).build();
        // add project option
        options.addOption(projectOption);
        options.addOption(topicOption);
        options.addOption(fileOption);
        options.addOption("h", "help", false, "Display this usage information.");

        //HelpFormatter formatter = new HelpFormatter();
        //formatter.printHelp("cli-example", options, false);

        CommandLineParser parser = new DefaultParser();
        CommandLine cmd = null;
        try {
            cmd = parser.parse(options, args);
        } catch (org.apache.commons.cli.MissingOptionException e) {
            System.out.println("Missing required arguments.  Exiting...");
            System.exit(1);
        }

        String projectId = cmd.getOptionValue("p");
        String topicId = cmd.getOptionValue("t");
        String payloadFile = cmd.getOptionValue("f");

        if(topicId == null) {
            // print default date
            topicId = "default-topic";
        }

        App cliApp = new App();

        try {
            DataBrokerMessage returnMessage = cliApp.execute(projectId, topicId, payloadFile);
            if (returnMessage.getMessageId() != null) {
                System.out.printf("Published message with ID %s to topic %s in project %s.\n",
                    returnMessage.getMessageId(),
                    returnMessage.getTopicId(),
                    returnMessage.getProjectId());
            } else if (returnMessage.getFailure() != null) {
                returnMessage.getFailure().printStackTrace();
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
        System.exit(0);
    }
}
