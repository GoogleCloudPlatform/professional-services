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

package com.google.cloud.pso.coders;

import com.google.cloud.pso.common.ErrorMessage;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import org.apache.beam.sdk.coders.CoderException;
import org.apache.beam.sdk.coders.CustomCoder;
import org.apache.beam.sdk.coders.NullableCoder;
import org.apache.beam.sdk.coders.StringUtf8Coder;

/** {@link org.apache.beam.sdk.coders.Coder} for {@link ErrorMessage} */
public class ErrorMessageCoder extends CustomCoder<ErrorMessage> {

  private static final NullableCoder<String> STRING_CODER = NullableCoder.of(StringUtf8Coder.of());
  private static final StringUtf8Coder JSON_PAYLOAD_CODER = StringUtf8Coder.of();
  private static final StringUtf8Coder MESSAGE_CODER = StringUtf8Coder.of();

  private static final ErrorMessageCoder ERROR_MESSAGE_CODER_INSTANCE = new ErrorMessageCoder();

  private ErrorMessageCoder() {}

  public static ErrorMessageCoder of() {
    return ERROR_MESSAGE_CODER_INSTANCE;
  }

  @Override
  public void encode(ErrorMessage value, OutputStream outStream) throws IOException {
    if (value == null) {
      throw new CoderException("The ErrorMessageCoder cannot encode a null object!");
    }

    JSON_PAYLOAD_CODER.encode(value.jsonPayload(), outStream);
    MESSAGE_CODER.encode(value.errorMessage(), outStream);
    STRING_CODER.encode(value.errorStackTrace(), outStream);
  }

  @Override
  public ErrorMessage decode(InputStream inStream) throws IOException {

    String jsonPayload = JSON_PAYLOAD_CODER.decode(inStream);
    String message = MESSAGE_CODER.decode(inStream);
    String stackTrace = STRING_CODER.decode(inStream);

    ErrorMessage.Builder builder =
        ErrorMessage.newBuilder().withJsonPayload(jsonPayload).withErrorMessage(message);

    return (stackTrace == null) ? builder.build() : builder.withErrorStackTrace(stackTrace).build();
  }
}
