/*
 * Copyright (C) 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.google.cloud.pso.benchmarks.redis.serde;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.google.cloud.pso.benchmarks.redis.model.Profile;
import java.io.IOException;
import org.junit.jupiter.api.Test;

public class MessagePackTest {
  @Test
  void testDecoding_returns_OriginalValue() throws IOException {
    Profile userProfile = new Profile().get();
    MessagePack<Profile> messagePack = new MessagePack<>();

    byte[] encodedBytes = messagePack.encode(userProfile);
    Profile decodedProfile = messagePack.decode(encodedBytes, Profile.class);

    assertEquals(userProfile.getName(), decodedProfile.getName());
    assertEquals(userProfile.getVersion(), decodedProfile.getVersion());
    assertEquals(userProfile.getObjectList().size(), decodedProfile.getObjectList().size());
    assertEquals(userProfile.getKvpairs().size(), decodedProfile.getKvpairs().size());
  }
}
