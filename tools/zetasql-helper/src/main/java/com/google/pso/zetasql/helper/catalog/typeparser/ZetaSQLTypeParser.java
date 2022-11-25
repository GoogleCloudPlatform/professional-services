package com.google.pso.zetasql.helper.catalog.typeparser;

import com.google.pso.zetasql.helper.catalog.typeparser.ZetaSQLTypeGrammarParser.ArrayTypeContext;
import com.google.pso.zetasql.helper.catalog.typeparser.ZetaSQLTypeGrammarParser.BasicTypeContext;
import com.google.pso.zetasql.helper.catalog.typeparser.ZetaSQLTypeGrammarParser.StructFieldContext;
import com.google.pso.zetasql.helper.catalog.typeparser.ZetaSQLTypeGrammarParser.StructTypeContext;
import com.google.zetasql.StructType.StructField;
import com.google.zetasql.Type;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLType.TypeKind;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Stack;
import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.CommonTokenStream;
import org.antlr.v4.runtime.Lexer;
import org.antlr.v4.runtime.tree.ParseTreeWalker;

public class ZetaSQLTypeParser {

  public static Type parse(String type) {
    Lexer lexer = new ZetaSQLTypeGrammarLexer(CharStreams.fromString(type));
    CommonTokenStream tokenStream = new CommonTokenStream(lexer);
    ZetaSQLTypeGrammarParser parser = new ZetaSQLTypeGrammarParser(tokenStream);
    ZetaSQLTypeParserListener listener = new ZetaSQLTypeParserListener();
    ParseTreeWalker.DEFAULT.walk(listener, parser.type());
    return listener.getResult();
  }

  private static class ZetaSQLTypeParserListener extends ZetaSQLTypeGrammarBaseListener {

    private final Stack<Type> typeStack = new Stack<>();
    private final Stack<List<StructField>> structFieldStack = new Stack<>();

    private static final Map<String, TypeKind> simpleTypeMapping = Map.ofEntries(
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
        Map.entry("JSON", TypeKind.TYPE_JSON)
    );

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
