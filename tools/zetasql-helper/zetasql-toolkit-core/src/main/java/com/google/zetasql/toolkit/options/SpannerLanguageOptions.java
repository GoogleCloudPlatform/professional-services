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

package com.google.zetasql.toolkit.options;

import com.google.zetasql.LanguageOptions;
import com.google.zetasql.ZetaSQLOptions.LanguageFeature;
import com.google.zetasql.ZetaSQLOptions.NameResolutionMode;
import com.google.zetasql.ZetaSQLOptions.ProductMode;
import com.google.zetasql.ZetaSQLResolvedNodeKind.ResolvedNodeKind;
import java.util.Set;

public class SpannerLanguageOptions {

  private static final LanguageOptions languageOptions = new LanguageOptions();

  static {
    languageOptions.setNameResolutionMode(NameResolutionMode.NAME_RESOLUTION_DEFAULT);
    languageOptions.setProductMode(ProductMode.PRODUCT_EXTERNAL);

    languageOptions.setEnabledLanguageFeatures(
        Set.of(
            LanguageFeature.FEATURE_ANALYTIC_FUNCTIONS,
            LanguageFeature.FEATURE_NUMERIC_TYPE,
            LanguageFeature.FEATURE_TABLESAMPLE,
            LanguageFeature.FEATURE_TIMESTAMP_NANOS,
            LanguageFeature.FEATURE_V_1_1_HAVING_IN_AGGREGATE,
            LanguageFeature.FEATURE_V_1_1_NULL_HANDLING_MODIFIER_IN_AGGREGATE,
            LanguageFeature.FEATURE_V_1_1_ORDER_BY_COLLATE,
            LanguageFeature.FEATURE_V_1_1_SELECT_STAR_EXCEPT_REPLACE,
            LanguageFeature.FEATURE_V_1_2_SAFE_FUNCTION_CALL,
            LanguageFeature.FEATURE_V_1_3_REPLACE_FIELDS,
            LanguageFeature.FEATURE_TABLE_VALUED_FUNCTIONS,
            LanguageFeature.FEATURE_NAMED_ARGUMENTS,
            LanguageFeature.FEATURE_PARAMETERIZED_TYPES,
            LanguageFeature.FEATURE_V_1_4_WITH_EXPRESSION,
            LanguageFeature.FEATURE_JSON_TYPE,
            LanguageFeature.FEATURE_JSON_ARRAY_FUNCTIONS,
            LanguageFeature.FEATURE_JSON_STRICT_NUMBER_PARSING,
            LanguageFeature.FEATURE_V_1_3_ANNOTATION_FRAMEWORK,
            LanguageFeature.FEATURE_V_1_3_NULLS_FIRST_LAST_IN_ORDER_BY,
            LanguageFeature.FEATURE_EXTENDED_TYPES,
            LanguageFeature.FEATURE_V_1_3_DML_RETURNING));

    languageOptions.setSupportedStatementKinds(
        Set.of(
            ResolvedNodeKind.RESOLVED_QUERY_STMT,
            ResolvedNodeKind.RESOLVED_INSERT_STMT,
            ResolvedNodeKind.RESOLVED_UPDATE_STMT,
            ResolvedNodeKind.RESOLVED_DELETE_STMT,
            ResolvedNodeKind.RESOLVED_CREATE_DATABASE_STMT,
            ResolvedNodeKind.RESOLVED_CREATE_TABLE_STMT,
            ResolvedNodeKind.RESOLVED_CREATE_TABLE_AS_SELECT_STMT,
            ResolvedNodeKind.RESOLVED_CREATE_VIEW_STMT,
            ResolvedNodeKind.RESOLVED_CREATE_INDEX_STMT,
            ResolvedNodeKind.RESOLVED_CREATE_MODEL_STMT,
            ResolvedNodeKind.RESOLVED_ALTER_DATABASE_STMT,
            ResolvedNodeKind.RESOLVED_ALTER_TABLE_STMT,
            ResolvedNodeKind.RESOLVED_ALTER_MODEL_STMT,
            ResolvedNodeKind.RESOLVED_BEGIN_STMT,
            ResolvedNodeKind.RESOLVED_COMMIT_STMT,
            ResolvedNodeKind.RESOLVED_ROLLBACK_STMT,
            ResolvedNodeKind.RESOLVED_DROP_STMT,
            ResolvedNodeKind.RESOLVED_GRANT_STMT,
            ResolvedNodeKind.RESOLVED_REVOKE_STMT));
  }

  public static LanguageOptions get() {
    return languageOptions;
  }
}
