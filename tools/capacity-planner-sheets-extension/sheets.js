/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Convenience functions for creating, writing to, and formatting sheets.
 */

/**
 * Creates a new sheet with the given name.
 * NOTE: If a sheet with sheetName already exists, this function will delete it and create a new
 * sheet with the same name.
 * @param {string} The name of the new sheet
 */
function createSheet_(sheetName){
  const ss = SpreadsheetApp.getActive();

  let sheet = ss.getSheetByName(sheetName);
  if (sheet != null){
    // If a sheet with the same name exists, delete it first
    ss.deleteSheet(sheet);
  }
  sheet = ss.insertSheet(sheetName);

  return sheet;
}

/**
 * Writes the specified values to the specified sheet.
 * NOTE: If a sheet with sheetName already exists, this function will delete it and create a new
 * sheet with the same name.
 * @param {string} The name of the new sheet
 * @param {Array} An array of arrays where each inner array is a row for the new sheet.
 */
function writeToSheet_(sheetName, values){
  let sheet = createSheet_(sheetName);
  for (row of values){
    sheet.appendRow(row);
  }
}

/**
 * Draw borders around merged cell sections.
 * This works because vertically merged cells only have content in the top-most row.
 * The border includes all columns after the first column.
 * @param {Sheet} The sheet object.
 * @param {Number} The first row to format.
 * @param {Number} The first column to format.
 */
function addBorder_(sheet, firstRow, firstColumn, borderColor=null, borderStyle=null) {
  const lastRowIndex = sheet.getLastRow();
  const lastColumnIndex = sheet.getLastColumn();
  const numColumns = lastColumnIndex - firstColumn + 1;

  let contentRowIndex = firstRow;

  for (let i = firstRow + 1; i <= lastRowIndex + 1; i++){
    let cellValue = sheet.getRange(i, firstColumn).getValues()[0][0]
    
    if (String(cellValue) !== "" || i > lastRowIndex){
      let numRows = i - contentRowIndex;
      let borderRange = sheet.getRange(contentRowIndex, firstColumn, numRows, numColumns);

      borderRange.setBorder(true, true, true, true, null, null, borderColor, borderStyle);
      contentRowIndex = i;
    }
  }
}

/**
 * Adds formulas to the sheeet to replicate the template.
 * This is hard to understand as code, reference "[SAMPLE] Combined Planning Sheet" 
 * for the intended output.
 * @param {Sheet}
 */
function addFormulasToSheet_(sheet) {
    const lastRowIndex = sheet.getLastRow();

    // Estimate / CCU section
    sheet.getRange(`E4:E${lastRowIndex}`).setFormula("F4/F$3");
    sheet.getRange(`G4:G${lastRowIndex}`).setFormula("G$3/$F$3*$F4");
    sheet.getRange(`H4:H${lastRowIndex}`).setFormula("H$3/$F$3*$F4");
    sheet.getRange(`I4:H${lastRowIndex}`).setFormula("I$3/$F$3*$F4");

    // Estimate for N
    sheet.getRange(`J4:J${lastRowIndex}`).setFormula(`$E4*J$3`);

    // Gap calculations
    sheet.getRange(`M4:M${lastRowIndex}`).setFormula(`IF( AND(J4 > 0, K4 > 0), K4 - J4, "NA")`);
    sheet.getRange(`N4:N${lastRowIndex}`).setFormula(`IF( AND(J4 > 0, K4 > 0), M4/J4, "NA")`);

}

/**
 * Formats the sheet to look like the template.
 * This is hard to understand as code, reference "[SAMPLE] Combined Planning Sheet" 
 * for the intended output.
 * This function handles the bulk of the formatting (font styles, merging cells, colors, etc.).
 * @param {Sheet}
 */
function formatSheet_(sheet) {
    const lastRowIndex = sheet.getLastRow();

    // Merge some header cells
    ["A1:D3", "E2:E3", "K2:O3"].forEach(range => sheet.getRange(range).mergeVertically());
    ["E1:I1", "J1:O1"].forEach(range => sheet.getRange(range).mergeAcross());

    const colors = {
      "blue": "#4285F4",
      "darkBlue": "#1C4587",
      "darkGrey": "#666666",
      "darkRed": "#990000",
      "green": "#38761D",
      "grey": "#B7B7B7",
      "lightBlue": "#CFE2F3",
      "lightGreen": "#D9EAD3",
      "lightGrey": "#F3F3F3",
      "lightYellow": "#FFF2CC",
      "olive": "#7F6000",
      "pink": "#F4CCCC"
    }

    // Font colors and styles
    sheet.getRange("J2:O3").setFontColor(colors["lightBlue"]);
    sheet.getRange("E4:I").setFontColor(colors["darkGrey"]);
    sheet.getRangeList(["A1:D3", "E1:I1", "E2:I3", "J1:O1", "J3"]).setFontColor("white");
    sheet.getRangeList(["A1:I3", "J1:O1", "J3", "A4:D"]).setFontWeight("bold");

    // Background colors
    sheet.getRangeList(["A1:D3", "E1:I1"]).setBackground("black");
    sheet.getRange("E2:I3").setBackground(colors["darkGrey"]);
    sheet.getRange("J1:O1").setBackground(colors["darkBlue"]);
    sheet.getRange("J2:O3").setBackground(colors["blue"]);
    sheet.getRange(`E4:I${lastRowIndex}`).setBackground(colors["lightGrey"])

    // Align header rows to center
    sheet.getRange("A1:O3").setHorizontalAlignment("center");

    // Widen first 4 columns, peak timestamp column (12), notes column (15)
    [1, 2, 3, 4].forEach(i => sheet.setColumnWidth(i, 150));
    [12, 15].forEach(i => sheet.setColumnWidth(i, 200));

    // Wrap text in the first 4 (A to D) columns and freeze
    sheet.getRangeList(["A1:D", "O4:O"]).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
    sheet.setFrozenColumns(4);

    // Hide columns E to I (Estimate/CCU) via a column group
    sheet.getRange("E1:I1").shiftColumnGroupDepth(1);

    // Percent formatting for Gap % column
    sheet.getRange("N4:N").setNumberFormat("0.0%");

    // Conditional Format rules for Gap, Gap %
    // NOTE: Rules added first are higher priority
    const emptyCellRule = SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo("NA")
        .setBackground(colors["lightGrey"])
        .setFontColor(colors["grey"])
        .setRanges([sheet.getRange(`M4:N${lastRowIndex}`)])
        .build();

    const gapIsGTFivePercent = SpreadsheetApp.newConditionalFormatRule()
        .whenCellNotEmpty()
        .whenNumberNotBetween(0.05, -0.05)
        .setBackground(colors["pink"])
        .setFontColor(colors["darkRed"])
        .setRanges([sheet.getRange(`N4:N${lastRowIndex}`)])
        .build();

    const gapIsNotZeroRule = SpreadsheetApp.newConditionalFormatRule()
        .whenNumberNotEqualTo(0)
        .setBackground(colors["lightYellow"])
        .setFontColor(colors["olive"])
        .setRanges([sheet.getRange(`M4:N${lastRowIndex}`)])
        .build();

    const gapIsZeroRule = SpreadsheetApp.newConditionalFormatRule()
        .whenNumberEqualTo(0)
        .setBackground(colors["lightGreen"])
        .setFontColor(colors["green"])
        .setRanges([sheet.getRange(`M4:N${lastRowIndex}`)])
        .build();

    let rules = sheet.getConditionalFormatRules();
    [emptyCellRule, gapIsGTFivePercent, gapIsNotZeroRule, gapIsZeroRule].forEach(rule => rules.push(rule));
    sheet.setConditionalFormatRules(rules);
}