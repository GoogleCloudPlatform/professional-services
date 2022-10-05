/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

package com.google.zetasql;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import java.util.ArrayList;
import java.util.List;

/** Interface for pretty printing recursively defined tree-like structures. */
public interface DebugPrintableNode {

  String nodeKindString();

  /**
   * Print the tree recursively. The implementation is nearly identical to the C++ implementation in
   * ResolvedNode::DebugStringImpl. The outputs need to be identical so the implementations should
   * be kept similar to make changes to the output easier.
   *
   * @param prefix1 is the indentation to attach to child nodes.
   * @param prefix2 is the indentation to attach to the root of this tree.
   * @param sb is the output StringBuilder
   */
  default void debugStringImpl(String prefix1, String prefix2, StringBuilder sb) {
    List<DebugStringField> fields = new ArrayList<>();
    collectDebugStringFields(fields);

    // Use multiline DebugString format if any of the fields are Nodes.
    boolean multiline = false;
    for (DebugStringField field : fields) {
      if (!field.nodes.isEmpty()) {
        multiline = true;
        break;
      }
    }

    sb.append(prefix2).append(getNameForDebugString());
    if (fields.isEmpty()) {
      sb.append("\n");
    } else if (multiline) {
      sb.append("\n");
      for (DebugStringField field : fields) {
        boolean printFieldName = !field.name.isEmpty();
        boolean printOneLine = field.nodes.isEmpty();

        if (printFieldName) {
          sb.append(prefix1).append("+-").append(field.name).append("=");
          if (printOneLine) {
            sb.append(field.value);
          }
          sb.append("\n");
        } else if (printOneLine) {
          sb.append(prefix1).append("+-").append(field.value).append("\n");
        }

        if (!printOneLine) {
          for (DebugPrintableNode node : field.nodes) {
            Preconditions.checkState(node != null);
            String fieldNameIndent =
                printFieldName ? (field != fields.get(fields.size() - 1) ? "| " : "  ") : "";
            String fieldValueIndent = node != field.nodes.get(field.nodes.size() - 1) ? "| " : "  ";
            node.debugStringImpl(
                prefix1 + fieldNameIndent + fieldValueIndent, prefix1 + fieldNameIndent + "+-", sb);
          }
        }
      }
    } else {
      sb.append("(");
      for (DebugStringField field : fields) {
        if (field != fields.get(0)) {
          sb.append(", ");
        }
        if (field.name.isEmpty()) {
          sb.append(field.value);
        } else {
          sb.append(field.name).append("=").append(field.value);
        }
      }
      sb.append(")\n");
    }
  }

  /**
   * Add all fields that should be printed in debugString to {@code fields}. Implementations should
   * recursively call same method in the superclass.
   */
  default void collectDebugStringFields(List<DebugStringField> fields) {}

  /**
   * Get the name string displayed for this node in the debugString. Normally it's just
   * nodeKindString(), but it can be customized.
   */
  default String getNameForDebugString() {
    return nodeKindString();
  }
  ;

  /** Class used to collect all fields that should be printed in debugString. */
  final class DebugStringField {

    // If name is non-empty, "<name>=" will be printed in front of the values.
    private final String name;

    // One of the two fields below will be filled in.
    // If nodes is non-empty, all nodes are non-NULL.
    private final String value; // Print this value directly.
    private final ImmutableList<? extends DebugPrintableNode> nodes; // Print debugString for these

    public DebugStringField(String name, String value) {
      this.name = Preconditions.checkNotNull(name);
      this.value = Preconditions.checkNotNull(value);
      this.nodes = ImmutableList.of();
    }

    public DebugStringField(String name, ImmutableList<? extends DebugPrintableNode> nodes) {
      this.name = Preconditions.checkNotNull(name);
      this.value = null;
      this.nodes = Preconditions.checkNotNull(nodes);
    }

    public DebugStringField(String name, DebugPrintableNode node) {
      this.name = Preconditions.checkNotNull(name);
      this.value = null;
      this.nodes = ImmutableList.of(node);
    }

    public DebugStringField(String name, Object value) {
      this.name = name;
      this.value = value == null ? "<null>" : value.toString();
      this.nodes = ImmutableList.of();
    }

    public boolean hasNodes() {
      return !nodes.isEmpty();
    }
  }
}
