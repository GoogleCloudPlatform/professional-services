/*
 * Copyright (C) 2019 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.google.cloud.demo.hangouts.chat.bot.datastore;

import com.google.api.services.chat.v1.model.Thread;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

import static junit.framework.TestCase.assertTrue;

@RunWith(JUnit4.class)
public class ReleaseNotesChatRoomThreadEntityTest {

  @Test
  public void setId_resultOk() throws Exception {
    ReleaseNotesChatRoomThreadEntity rnCrT=new ReleaseNotesChatRoomThreadEntity();
    rnCrT.setId("1234567890");
    assertTrue(rnCrT.getId().equals("1234567890"));
  }

  @Test
  public void setThread_resultOk() throws Exception {
    ReleaseNotesChatRoomThreadEntity rnCrT=new ReleaseNotesChatRoomThreadEntity();
    Thread thread=new Thread();
      thread.setName("Thread test");
    rnCrT.setThread(thread);
    assertTrue(rnCrT.getThread().getName().equals("Thread test"));
  }

}
