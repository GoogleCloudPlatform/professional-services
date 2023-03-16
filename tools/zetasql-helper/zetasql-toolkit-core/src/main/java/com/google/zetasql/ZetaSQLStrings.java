/*
 * Copyright 2023 Google LLC All Rights Reserved
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

package com.google.zetasql;

import com.google.common.base.Preconditions;
import com.google.common.escape.Escaper;
import com.google.common.escape.Escapers;
import com.google.common.io.BaseEncoding;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import org.joda.time.DateTime;

/** A utility class helps decorate strings */
public class ZetaSQLStrings {
  private static final DateTime EPOCH = new DateTime(1970, 1, 1, 0, 0);
  private static final Charset UTF_8 = StandardCharsets.UTF_8;
  private static final Escaper BACKTICK_ESCAPER = Escapers.builder().addEscape('`', "\\`").build();
  private static final Escaper DOUBLE_QUOTE_ESCAPER =
      Escapers.builder().addEscape('"', "\\\"").build();
  private static final Escaper SINGLE_QUOTE_ESCAPER =
      Escapers.builder().addEscape('\'', "\\'").build();

  /**
   * Convert a string to a ZetaSQL identifier literal. The output will be quoted (with backticks)
   * and escaped if necessary.
   *
   * @param str String to be converted to identifier.
   * @return Legal ZetaSQL identifier converted from the string.
   */
  public static String toIdentifierLiteral(String str) {
    return '`' + BACKTICK_ESCAPER.escape(str) + '`';
  }

  /**
   * Return a quoted and escaped ZetaSQL bytes literal for this byte array. Prefixes with b and may
   * choose to quote with ' or " to produce nicer output.
   *
   * @param bytes Binary bytes to escape
   * @return Quoted and escaped ZetaSQL bytes literal.
   */
  public static String toBytesLiteral(byte[] bytes) {
    return toSingleQuotedBytesLiteral(bytes);
  }

  /**
   * Return a quoted and escaped ZetaSQL bytes literal for this string. Prefixes with b and may
   * choose to quote with ' or " to produce nicer output.
   *
   * @param str String to escape
   * @return Quoted and escaped ZetaSQL bytes literal.
   */
  public static String toBytesLiteral(String str) {
    return toBytesLiteral(str.getBytes(UTF_8));
  }

  /**
   * Return a quoted and escaped ZetaSQL bytes literal for this byte array. Prefixes with b and
   * always uses single quotes.
   *
   * @param bytes Binary bytes to escape
   * @return Quoted and escaped ZetaSQL bytes literal.
   */
  public static String toSingleQuotedBytesLiteral(byte[] bytes) {
    return "b'" + BaseEncoding.base16().encode(bytes) + '\'';
  }

  /**
   * Return a quoted and escaped ZetaSQL bytes literal for this string. Prefixes with b and always
   * uses single quotes.
   *
   * @param str String to escape
   * @return Quoted and escaped ZetaSQL bytes literal.
   */
  public static String toSingleQuotedBytesLiteral(String str) {
    return toSingleQuotedBytesLiteral(str.getBytes(UTF_8));
  }

  /**
   * Return a quoted and escaped ZetaSQL bytes literal for this byte array. Prefixes with b and
   * always uses double quotes.
   *
   * @param bytes Binary bytes to escape
   * @return Quoted and escaped ZetaSQL bytes literal.
   */
  public static String toDoubleQuotedBytesLiteral(byte[] bytes) {
    return "b\"" + BaseEncoding.base16().encode(bytes) + '"';
  }

  /**
   * Return a quoted and escaped ZetaSQL bytes literal for this string. Prefixes with b and always
   * uses double quotes.
   *
   * @param str String to escape
   * @return Quoted and escaped ZetaSQL bytes literal.
   */
  public static String toDoubleQuotedBytesLiteral(String str) {
    return toDoubleQuotedBytesLiteral(str.getBytes(UTF_8));
  }

  /**
   * Return a quoted and escaped ZetaSQL string literal for this string. May choose to quote with '
   * or " to produce nicer output.
   *
   * @param str String to escape
   * @return Quoted and escaped ZetaSQL string literal.
   */
  public static String toStringLiteral(String str) {
    return toSingleQuotedStringLiteral(str);
  }

  /**
   * Return a quoted and escaped ZetaSQL string literal for this string. Always uses single quotes.
   *
   * @param str String to escape
   * @return Quoted and escaped ZetaSQL string literal.
   */
  public static String toSingleQuotedStringLiteral(String str) {
    return '\'' + SINGLE_QUOTE_ESCAPER.escape(str) + '\'';
  }

  /**
   * Return a quoted and escaped ZetaSQL string literal for this string. Always uses double quotes.
   *
   * @param str String to escape
   * @return Quoted and escaped ZetaSQL string literal.
   */
  public static String toDoubleQuotedStringLiteral(String str) {
    return '"' + DOUBLE_QUOTE_ESCAPER.escape(str) + '"';
  }

  /**
   * @param date Number of days since 1970-01-01
   * @return A string of format "YYYY-MM-DD" for this date
   */
  public static String convertDateToString(int date) {
    DateTime d = EPOCH.plusDays(date);
    return String.format("%04d-%02d-%02d", d.getYear(), d.getMonthOfYear(), d.getDayOfMonth());
  }

  public static String convertSimpleValueToString(Value value, boolean verbose) {
    Type type = value.getType();
    Preconditions.checkArgument(type.isSimpleType());
    return value.getProto().toString().trim();
  }

  /**
   * Return an unescaped ZetaSQL identifier for this string. Return {@code null} if the string is
   * not a valid ZetaSQL identifier.
   *
   * <p>Examples: {@code unescapeIdentifier("foo")} is {@code "foo"}. {@code
   * unescapeIdentifier("`foo.bar`")} is {@code "foo.bar"}. {@code unescapeIdentifier("3foo")} is
   * {@code null}.
   *
   * @param str ZetaSQL identifier to unescape
   * @return Unescaped ZetaSQL identifier or {@code null}.
   */
  public static String unescapeIdentifier(String str) {
    throw new UnsupportedOperationException();
  }
}
