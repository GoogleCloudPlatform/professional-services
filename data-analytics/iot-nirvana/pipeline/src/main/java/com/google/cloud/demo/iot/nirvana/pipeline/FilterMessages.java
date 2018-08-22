/*
 * Copyright (C) 2018 Google Inc.
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

package com.google.cloud.demo.iot.nirvana.pipeline;

import com.google.auto.value.AutoValue;
import com.google.cloud.demo.iot.nirvana.common.City;
import com.google.cloud.demo.iot.nirvana.common.FormatException;
import com.google.cloud.demo.iot.nirvana.common.Message;
import java.util.Map;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.PCollectionView;
import org.apache.beam.sdk.values.TupleTag;

/** Transformation filtering out temperature messages that don't contain data for actual cities. */
@AutoValue
public abstract class FilterMessages extends DoFn<String, Message> {

  public abstract TupleTag<String> getErrorTag();

  public abstract PCollectionView<Map<String, City>> getCities();

  /** Builder for FilterMessages. */
  @AutoValue.Builder
  public abstract static class Builder {
    public abstract Builder setCities(PCollectionView<Map<String, City>> cities);

    public abstract Builder setErrorTag(TupleTag<String> errorTag);

    public abstract FilterMessages build();
  }

  public static Builder newBuilder() {
    return new AutoValue_FilterMessages.Builder();
  }

  private static final String INVALID_MESSAGE =
      "Invalid message, cause: %s.\nOriginal message: %s\n";

  @ProcessElement
  public void processElement(ProcessContext c) {
    // Read the next message to process in JSON format
    String strMessage = c.element();
    try {
      // Filter out messages that don't contain temperatures for actual cities
      Message message = Message.fromJson(strMessage);
      Map<String, City> citiesMap = c.sideInput(getCities());
      if (citiesMap.containsKey(message.getId())) {
        City city = citiesMap.get(message.getId());
        c.output(cloneMessageWithMetadata(message, city));
      } else {
        String invalidMessage = String.format(INVALID_MESSAGE, "Invalid id", strMessage);
        c.output(getErrorTag(), invalidMessage);
      }
    } catch (FormatException e) {
      String invalidMessage = String.format(INVALID_MESSAGE, e.getMessage(), strMessage);
      c.output(getErrorTag(), invalidMessage);
    }
  }

  /**
   * Adds to a Message object City metadata: city name, longitude and latitude
   *
   * @param message
   * @param city
   * @return
   */
  Message cloneMessageWithMetadata(Message message, City city) {
    Message.Builder messageBuilder = Message.newBuilder();
    messageBuilder.setId(message.getId());
    messageBuilder.setTemperature(message.getTemperature());
    messageBuilder.setTimestamp(message.getTimestamp());
    messageBuilder.setCity(city.getCity());
    messageBuilder.setLat(String.valueOf(city.getLat()));
    messageBuilder.setLng(String.valueOf(city.getLng()));
    return messageBuilder.build();
  }
}
