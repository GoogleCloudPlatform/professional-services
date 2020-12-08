/*
 * Copyright 2020 Google LLC
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
package com.google.functions;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.firestore.dao.CheckpointDAO;

import io.cdap.cdap.etl.api.action.ActionContext;

/**
 * This class interfaces between CheckPointReadAction and CheckpointDAO.
 */
public class CheckPointReadFunction {

	private static final Logger LOG = LoggerFactory.getLogger(CheckPointReadFunction.class);

	private CheckpointDAO getCheckpointDAO(String serviceAccountFilePath, String projectId) {
		com.google.firestore.dao.CheckpointDAO pipelineCheckpointDAO = new com.google.firestore.dao.CheckpointDAO(serviceAccountFilePath, projectId);
		return pipelineCheckpointDAO;
	}

	public void execute(ActionContext context, String serviceAccountFilePath, String projectId, String collectionName, String documentName, String bufferTime) throws Exception {
		CheckpointDAO checkpointDAO = getCheckpointDAO(serviceAccountFilePath, projectId);
		String latestCheckpointValue = checkpointDAO.getLatestCheckpointValue(collectionName, documentName);
		LOG.info("latestCheckpointValue == " + latestCheckpointValue);
		if (bufferTime != null) {
			latestCheckpointValue = latestCheckpointValue.substring(0, 19);
			latestCheckpointValue = getWatermarkWithBufferTime(latestCheckpointValue, bufferTime);
        	LOG.info("latestCheckpointValue after adding bufferTime == " + latestCheckpointValue);
        }
		if (latestCheckpointValue != null && !latestCheckpointValue.trim().equals("")) {
			setWatermarkValueAsRuntimeArgument(context, latestCheckpointValue);
		} else {
			throw new RuntimeException("latestCheckpointValue is empty");
		}
	}

	private String getWatermarkWithBufferTime(String dateStr, String bufferTime) throws Exception {
		DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Date date = dateFormat.parse(dateStr);
		final long ONE_MINUTE_IN_MILLIS = 60000;//millisecs

	    long curTimeInMs = date.getTime();
	    Date afterAddingMins = new Date(curTimeInMs - (Integer.parseInt(bufferTime) * ONE_MINUTE_IN_MILLIS));
	    return dateFormat.format(afterAddingMins);
	}
	private void setWatermarkValueAsRuntimeArgument(ActionContext context, String formattedWatermarkValue) {
		if (context != null) {
			context.getArguments().set("latestWatermarkValue", formattedWatermarkValue);
		}
	}
}
