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

package com.google.zetasql.toolkit.validation;

import com.google.zetasql.Table;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedJoinScan;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedScan;
import com.google.zetasql.resolvedast.ResolvedNodes.ResolvedTableScan;

public class ShouldNotUseSelfJoinsVisitor extends ValidatingVisitor {

  @Override
  public void visit(ResolvedJoinScan joinScan) {
    ResolvedScan leftScan = joinScan.getLeftScan();
    ResolvedScan rightScan = joinScan.getRightScan();

    boolean leftScanIsTable = leftScan instanceof ResolvedTableScan;
    boolean rightScanIsTable = rightScan instanceof ResolvedTableScan;

    if (leftScanIsTable && rightScanIsTable) {
      Table leftTable = ((ResolvedTableScan) leftScan).getTable();
      Table rightTable = ((ResolvedTableScan) rightScan).getTable();

      if (leftTable.getFullName().equalsIgnoreCase(rightTable.getFullName())) {
        String errorMessage =
            String.format("Performed self join on table %s", leftTable.getFullName());
        this.setError(new ValidationError(errorMessage, joinScan));
      }
    }
  }
}
