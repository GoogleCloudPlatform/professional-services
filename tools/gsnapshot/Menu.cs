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
  class Menu {
    private List<string> options;
    private List<int> ids;
    private readonly String title;

    ConsoleColor defaultFg;
    ConsoleColor defaultBg;

    public Menu(string title, Dictionary<int, string> options) {
      this.title = title;
      this.options = new List<string>(options.Values);
      this.ids = new List<int>(options.Keys);
      this.defaultFg = Console.ForegroundColor;
      this.defaultBg = Console.BackgroundColor;
    }

    public void ShowOptions(List<string> options, int selectedOption) {
      for (int i = 0; i < options.Count; i++) {
        string index = (1 + i).ToString();
        Console.Write(selectedOption == i ? " > " : "   ");
        if (selectedOption == i) {
          Console.BackgroundColor = ConsoleColor.Gray;
          Console.ForegroundColor = ConsoleColor.Black;
        } else {
          Console.BackgroundColor = this.defaultBg;
          Console.ForegroundColor = this.defaultFg;
        }
        Console.Write(String.Format("{0,4}", index) + ". " + this.options[i] + " ");
        Console.BackgroundColor = this.defaultBg;
        Console.ForegroundColor = this.defaultFg;
        Console.WriteLine("");
      }
    }

    public int? Show() {
      int originalCursorTop = Console.CursorTop;
      int selectedOption = 0;
      bool selected = false;
      bool quit = false;
      int fillWidth = Console.WindowWidth - 10;

      Console.CursorVisible = false;
      Console.Write("\r");
      while (!selected && !quit) {
        Console.WriteLine("");
        Console.WriteLine($"  {this.title}");
        Console.WriteLine("");
        ShowOptions(this.options, selectedOption);
        Console.WriteLine("");
        Console.WriteLine("  Arrow keys to move selection, Enter to select, Esc to cancel.\n");
        Console.SetCursorPosition(0, originalCursorTop - this.options.Count - 6);

        var keyPress = Console.ReadKey(true);
        if (keyPress.Key == ConsoleKey.UpArrow || keyPress.Key == ConsoleKey.W ||
            keyPress.Key == ConsoleKey.K) {
          selectedOption -= 1;
          if (selectedOption < 0) {
            selectedOption = this.options.Count - 1;
          }
        }
        if (keyPress.Key == ConsoleKey.DownArrow || keyPress.Key == ConsoleKey.S ||
            keyPress.Key == ConsoleKey.J) {
          selectedOption += 1;
          if (selectedOption >= this.options.Count) {
            selectedOption = 0;
          }
        }
        if (keyPress.Key == ConsoleKey.Enter) {
          selected = true;
        }
        if (keyPress.Key == ConsoleKey.Escape) {
          quit = true;
        }
      }
      Console.SetCursorPosition(0, originalCursorTop - this.options.Count - 6);
      for (int i = 0; i < this.options.Count + 6; i++) {
        Console.WriteLine(String.Format("{0,-" + fillWidth + "}", ""));
      }
      Console.SetCursorPosition(0, originalCursorTop - this.options.Count - 6);

      Console.CursorVisible = true;
      if (quit) {
        return null;
      }
      return this.ids[selectedOption];
    }
  }
}