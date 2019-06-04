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
public class ReleaseNotesFeedEntityTest {

  @Test
  public void setId_resultOk() throws Exception {
    ReleaseNotesFeedEntity rnFe=new ReleaseNotesFeedEntity();
    rnFe.setId("1234567890");
    assertTrue(rnFe.getId().equals("1234567890"));
  }

  @Test
  public void setContent_resultOk() throws Exception {
    ReleaseNotesFeedEntity rnFe=new ReleaseNotesFeedEntity();
    rnFe.setContent("ContentTest");
    assertTrue(rnFe.getContent().equals("ContentTest"));
  }

  @Test
  public void setLastUpdate_resultOk() throws Exception {
    ReleaseNotesFeedEntity rnFe=new ReleaseNotesFeedEntity();
    rnFe.setLastUpdate(1234567890);
    assertTrue(rnFe.getLastUpdate()==1234567890);
  }

  @Test
  public void setName_resultOk() throws Exception {
    ReleaseNotesFeedEntity rnFe=new ReleaseNotesFeedEntity();
    rnFe.setName("NameTest");
    assertTrue(rnFe.getName().equals("NameTest"));
  }

  @Test
  public void setPushNotificationFlag_resultOk() throws Exception {
    ReleaseNotesFeedEntity rnFe=new ReleaseNotesFeedEntity();
    rnFe.setPushNotificationFlag(true);
    assertTrue(rnFe.isPushNotificationFlag());
  }

  @Test
  public void setUrl_resultOk() throws Exception {
    ReleaseNotesFeedEntity rnFe=new ReleaseNotesFeedEntity();
    rnFe.setUrl("https://www.google.com");
    assertTrue(rnFe.getUrl().equals("https://www.google.com"));
  }
}
