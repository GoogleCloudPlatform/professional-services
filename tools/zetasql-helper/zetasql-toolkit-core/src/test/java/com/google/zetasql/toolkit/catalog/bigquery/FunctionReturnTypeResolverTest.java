package com.google.zetasql.toolkit.catalog.bigquery;

import static org.junit.jupiter.api.Assertions.*;

import com.google.common.collect.ImmutableList;
import com.google.zetasql.FunctionArgumentType;
import com.google.zetasql.FunctionSignature;
import com.google.zetasql.LanguageOptions;
import com.google.zetasql.SimpleCatalog;
import com.google.zetasql.TVFRelation;
import com.google.zetasql.Type;
import com.google.zetasql.TypeFactory;
import com.google.zetasql.ZetaSQLBuiltinFunctionOptions;
import com.google.zetasql.ZetaSQLFunctions.FunctionEnums.Mode;
import com.google.zetasql.ZetaSQLFunctions.SignatureArgumentKind;
import com.google.zetasql.ZetaSQLType.TypeKind;
import com.google.zetasql.toolkit.options.BigQueryLanguageOptions;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class FunctionReturnTypeResolverTest {

  private LanguageOptions languageOptions = BigQueryLanguageOptions.get();

  private SimpleCatalog catalog = new SimpleCatalog("catalog");

  @BeforeEach
  void init() {
    catalog.addZetaSQLFunctionsAndTypes(new ZetaSQLBuiltinFunctionOptions(languageOptions));
  }

  @Test
  void testInferFunctionReturnType() {
    FunctionInfo functionInfo =
        FunctionInfo.newBuilder()
            .setNamePath(List.of("f"))
            .setGroup("UDF")
            .setMode(Mode.SCALAR)
            .setSignatures(
                List.of(
                    new FunctionSignature(
                        new FunctionArgumentType(
                            TypeFactory.createSimpleType(TypeKind.TYPE_UNKNOWN)),
                        List.of(),
                        -1)))
            .setLanguage(BigQueryRoutineLanguage.SQL)
            .setBody("CAST(FLOOR(5.5) AS INT64) + 1")
            .build();

    FunctionInfo resolvedFunctionInfo =
        FunctionResultTypeResolver.resolveFunctionReturnTypes(
            functionInfo, languageOptions, catalog);

    FunctionSignature resolvedSignature =
        assertDoesNotThrow(
            () -> resolvedFunctionInfo.getSignatures().get(0),
            "Expected result type to have been set after resolution");

    Type resolvedResultType = resolvedSignature.getResultType().getType();

    assertNotNull(resolvedResultType, "Expected result type to have resolved to INT");
    assertTrue(resolvedResultType.isInteger(), "Expected result type to have resolved to INT");
  }

  @Test
  void testInferTVFOutputSchema() {
    TVFInfo tvfInfo =
        TVFInfo.newBuilder()
            .setNamePath(ImmutableList.of("tvf"))
            .setSignature(
                new FunctionSignature(
                    new FunctionArgumentType(SignatureArgumentKind.ARG_TYPE_RELATION),
                    List.of(),
                    -1))
            .setOutputSchema(Optional.empty())
            .setBody("SELECT 1 AS column1, CONCAT('a', 'b') AS column2")
            .build();

    TVFInfo resolvedTVFInfo =
        FunctionResultTypeResolver.resolveTVFOutputSchema(tvfInfo, languageOptions, catalog);

    assertTrue(
        resolvedTVFInfo.getOutputSchema().isPresent(),
        "Expected TVF output schema to have been set after resolution");

    TVFRelation inferredOutputSchema = resolvedTVFInfo.getOutputSchema().get();

    // TVFRelation does not expose columns publicly, we assert using its string representation
    String expectedOutputSchemaString = "TABLE<column1 INT64, column2 STRING>";

    assertEquals(
        expectedOutputSchemaString,
        inferredOutputSchema.toString(),
        "Expected inferred output schema to be " + expectedOutputSchemaString);
  }
}
