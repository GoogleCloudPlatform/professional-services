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

package com.google.zetasql.toolkit.catalog.typeparser;

import com.google.zetasql.StructType.StructField;
import com.google.zetasql.Type;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.toolkit.catalog.typeparser.ZetaSQLTypeGrammarParser.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Stack;
import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.CommonTokenStream;
import org.antlr.v4.runtime.ConsoleErrorListener;
import org.antlr.v4.runtime.Lexer;
import org.antlr.v4.runtime.tree.ParseTreeWalker;

/**
 * Parser for ZetaSQL types.
 *
 * <p>Allows parsing string representations of SQL types to their corresponding Type objects. For
 * example; it can parse type strings such as "STRING", "ARRAY<INT64>" and "STRUCT<f DECIMAL>".
 *
 * <p>Uses an ANTLR4 based parser.
 */
public class ZetaSQLTypeParser {

  /**
   * Parses a SQL type string into its corresponding ZetaSQL Type.
   *
   * @param type The type string to parse
   * @return The corresponding ZetaSQL Type
   * @throws ZetaSQLTypeParseError if the provided type string is invalid
   */
  public static Type parse(String type) {
    Lexer lexer = new ZetaSQLTypeGrammarLexer(CharStreams.fromString(type));
    lexer.removeErrorListener(ConsoleErrorListener.INSTANCE);
    CommonTokenStream tokenStream = new CommonTokenStream(lexer);
    ZetaSQLTypeGrammarParser parser = new ZetaSQLTypeGrammarParser(tokenStream);
    ZetaSQLTypeParserListener listener = new ZetaSQLTypeParserListener();
    parser.removeErrorListener(ConsoleErrorListener.INSTANCE);
    TypeContext typeRule = parser.type();
    ParseTreeWalker.DEFAULT.walk(listener, typeRule);

    if (typeRule.exception != null) {
      throw new ZetaSQLTypeParseError(
          String.format("Invalid SQL type: %s", type), typeRule.exception);
    }

    return listener.getResult();
  }

  /**
   * ANTLR4 listener that traverses the type parse tree and builds the corresponding ZetaSQL Type
   */
  private static class ZetaSQLTypeParserListener extends ZetaSQLTypeGrammarBaseListener {

    private static final Map<String, TypeKind> simpleTypeMapping =
        Map.ofEntries(
            Map.entry("STRING", TypeKind.TYPE_STRING),
            Map.entry("BYTES", TypeKind.TYPE_BYTES),
            Map.entry("INT32", TypeKind.TYPE_INT32),
            Map.entry("INT64", TypeKind.TYPE_INT64),
            Map.entry("UINT32", TypeKind.TYPE_UINT32),
            Map.entry("UINT64", TypeKind.TYPE_UINT64),
            Map.entry("FLOAT64", TypeKind.TYPE_FLOAT),
            Map.entry("DECIMAL", TypeKind.TYPE_NUMERIC),
            Map.entry("NUMERIC", TypeKind.TYPE_NUMERIC),
            Map.entry("BIGNUMERIC", TypeKind.TYPE_BIGNUMERIC),
            Map.entry("INTERVAL", TypeKind.TYPE_INTERVAL),
            Map.entry("BOOL", TypeKind.TYPE_BOOL),
            Map.entry("TIMESTAMP", TypeKind.TYPE_TIMESTAMP),
            Map.entry("DATE", TypeKind.TYPE_DATE),
            Map.entry("TIME", TypeKind.TYPE_TIME),
            Map.entry("DATETIME", TypeKind.TYPE_DATETIME),
            Map.entry("GEOGRAPHY", TypeKind.TYPE_GEOGRAPHY),
            Map.entry("JSON", TypeKind.TYPE_JSON));
    private final Stack<Type> typeStack = new Stack<>();
    private final Stack<List<StructField>> structFieldStack = new Stack<>();

    public Type getResult() {
      return this.typeStack.pop();
    }

    @Override
    public void exitBasicType(BasicTypeContext ctx) {
      String basicTypeName = ctx.BASIC_TYPE().getText();
      TypeKind kind = simpleTypeMapping.getOrDefault(basicTypeName, TypeKind.TYPE_UNKNOWN);
      Type type = TypeFactory.createSimpleType(kind);
      this.typeStack.push(type);
    }

    @Override
    public void exitArrayType(ArrayTypeContext ctx) {
      Type elementType = this.typeStack.pop();
      Type type = TypeFactory.createArrayType(elementType);
      this.typeStack.push(type);
    }

    @Override
    public void enterStructType(StructTypeContext ctx) {
      this.structFieldStack.add(new ArrayList<>());
    }

    @Override
    public void exitStructField(StructFieldContext ctx) {
      String fieldName = ctx.IDENTIFIER().getText();
      Type fieldType = this.typeStack.pop();
      StructField field = new StructField(fieldName, fieldType);
      this.structFieldStack.peek().add(field);
    }

    @Override
    public void exitStructType(StructTypeContext ctx) {
      List<StructField> fields = this.structFieldStack.pop();
      Type type = TypeFactory.createStructType(fields);
      this.typeStack.push(type);
    }
  }
}
