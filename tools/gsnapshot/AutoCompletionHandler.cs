/*
   Copyright 2022 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
using System;
using System.Collections.Generic;

#nullable enable
namespace GSnapshot {
  class AutoCompletionHandler : IAutoCompleteHandler {
    private List<string>? options;
    public char[] Separators { get; set; } = new char[] { ' ', '-', '_' };

    public AutoCompletionHandler(Dictionary<string, string> options) {
      this.options = new List<string>(options.Values);
    }

    public string[]? GetSuggestions(string text, int index) {
      if (text.Length == 0) {
        return null;
      }

      List<string> completes = new List<string>();
      if (this.options != null) {
        foreach (var label in this.options) {
          if (label.StartsWith(text, StringComparison.CurrentCultureIgnoreCase)) {
            completes.Add(label.Remove(0, index));
          }
        }
      }
      return completes.ToArray();
    }
  }
}