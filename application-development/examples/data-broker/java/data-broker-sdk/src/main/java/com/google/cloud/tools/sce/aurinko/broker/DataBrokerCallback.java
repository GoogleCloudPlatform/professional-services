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
package com.google.cloud.tools.sce.aurinko.broker;

import java.util.concurrent.CountDownLatch;

import com.google.api.core.ApiFutureCallback;


/**
 * The DataBrokerCallback handles the asynchronous response from GCP. The results
 * will either be a success or a faulure.
 * 
 * @version 1.0-SNAPSHOT
 */
class DataBrokerCallback implements ApiFutureCallback<String> {

        private CountDownLatch doneSignal;
        private String messageId;
        private Throwable throwable;

        /**
         * Set the CountDownLatch object for concurrency.
         * @param doneSignal
         */
        public void setLatch(CountDownLatch doneSignal) {
                this.doneSignal = doneSignal;
        }

	@Override
	public void onFailure(Throwable throwable) {
                this.throwable = throwable;
                if (doneSignal != null) {
                        doneSignal.countDown();
                }
		
	}

	@Override
	public void onSuccess(String messageId) {
                // Once published, returns server-assigned message ids (unique within the topic)
                this.messageId = messageId;
                if (doneSignal != null) {
                        doneSignal.countDown();
                }
		
        }

        /**
         * If the message successfuly published, then the asynchronous return will
         * populute the message ID.
         * @return The ID of the message that was published.
         */
        public String getMessageId() {
                return this.messageId;
        }

        /**
         * If the message failed to be pusblished, then the asynchronous call will
         * return with a throwable.
         * @return The Throwable object
         */
        public Throwable getFailure() {
                return this.throwable;
        }
        


}