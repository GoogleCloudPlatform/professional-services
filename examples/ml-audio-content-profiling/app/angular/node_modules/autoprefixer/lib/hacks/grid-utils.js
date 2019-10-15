"use strict";

var parser = require('postcss-value-parser');

var list = require('postcss').list;

function convert(value) {
  if (value && value.length === 2 && value[0] === 'span' && parseInt(value[1], 10) > 0) {
    return [false, parseInt(value[1], 10)];
  }

  if (value && value.length === 1 && parseInt(value[0], 10) > 0) {
    return [parseInt(value[0], 10), false];
  }

  return [false, false];
}

function translate(values, startIndex, endIndex) {
  var startValue = values[startIndex];
  var endValue = values[endIndex];

  if (!startValue) {
    return [false, false];
  }

  var _convert = convert(startValue),
      start = _convert[0],
      spanStart = _convert[1];

  var _convert2 = convert(endValue),
      end = _convert2[0],
      spanEnd = _convert2[1];

  if (start && !endValue) {
    return [start, false];
  }

  if (spanStart && end) {
    return [end - spanStart, spanStart];
  }

  if (start && spanEnd) {
    return [start, spanEnd];
  }

  if (start && end) {
    return [start, end - start];
  }

  return [false, false];
}

function parse(decl) {
  var node = parser(decl.value);
  var values = [];
  var current = 0;
  values[current] = [];

  for (var _iterator = node.nodes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var i = _ref;

    if (i.type === 'div') {
      current += 1;
      values[current] = [];
    } else if (i.type === 'word') {
      values[current].push(i.value);
    }
  }

  return values;
}

function insertDecl(decl, prop, value) {
  if (value && !decl.parent.some(function (i) {
    return i.prop === "-ms-" + prop;
  })) {
    decl.cloneBefore({
      prop: "-ms-" + prop,
      value: value.toString()
    });
  }
} // Track transforms


function prefixTrackProp(_ref2) {
  var prop = _ref2.prop,
      prefix = _ref2.prefix;
  return prefix + prop.replace('template-', '');
}

function transformRepeat(_ref3, _ref4) {
  var nodes = _ref3.nodes;
  var gap = _ref4.gap;

  var _nodes$reduce = nodes.reduce(function (result, node) {
    if (node.type === 'div' && node.value === ',') {
      result.key = 'size';
    } else {
      result[result.key].push(parser.stringify(node));
    }

    return result;
  }, {
    key: 'count',
    size: [],
    count: []
  }),
      count = _nodes$reduce.count,
      size = _nodes$reduce.size;

  if (gap) {
    var val = [];

    for (var i = 1; i <= count; i++) {
      if (gap && i > 1) {
        val.push(gap);
      }

      val.push(size.join());
    }

    return val.join(' ');
  }

  return "(" + size.join('') + ")[" + count.join('') + "]";
}

function prefixTrackValue(_ref5) {
  var value = _ref5.value,
      gap = _ref5.gap;
  var result = parser(value).nodes.reduce(function (nodes, node) {
    if (node.type === 'function' && node.value === 'repeat') {
      return nodes.concat({
        type: 'word',
        value: transformRepeat(node, {
          gap: gap
        })
      });
    }

    if (gap && node.type === 'space') {
      return nodes.concat({
        type: 'space',
        value: ' '
      }, {
        type: 'word',
        value: gap
      }, node);
    }

    return nodes.concat(node);
  }, []);
  return parser.stringify(result);
}
/**
 * Parse grid areas from declaration
 * @param Declaration [decl]
 * @return Array<String>
 */


function parseGridTemplateStrings(decl) {
  var template = parseTemplate({
    decl: decl,
    gap: getGridGap(decl)
  });
  return Object.keys(template.areas);
}
/**
 * Walk through every grid-template(-areas)
 * declaration and try to find non-unique area names (duplicates)
 * @param  {Declaration} decl
 * @param  {Result} result
 * @return {void}
 */


function warnDuplicateNames(_ref6) {
  var decl = _ref6.decl,
      result = _ref6.result;
  var rule = decl.parent;
  var inMediaRule = !!getParentMedia(rule);
  var areas = parseGridTemplateStrings(decl);
  var root = decl.root(); // stop if no areas found

  if (areas.length === 0) {
    return false;
  }

  root.walkDecls(/grid-template(-areas)?$/g, function (d) {
    var nodeRule = d.parent;
    var nodeRuleMedia = getParentMedia(nodeRule);
    var isEqual = rule.toString() === nodeRule.toString();
    var foundAreas = parseGridTemplateStrings(d);
    var maxIndex = Math.max(root.index(nodeRule), root.index(nodeRuleMedia));
    var isLookingDown = root.index(rule) < maxIndex; // skip node if no grid areas is found

    if (foundAreas.length === 0) {
      return true;
    } // abort if we outside media rule and walking below our rule
    // (we need to check ONLY the rules that are above)


    if (!inMediaRule && isLookingDown) {
      return false;
    } // abort if we're in the same rule


    if (isEqual) {
      return false;
    } // if we're inside media rule, we need to compare selectors


    if (inMediaRule) {
      var selectors = list.comma(nodeRule.selector);
      var selectorIsFound = selectors.some(function (sel) {
        if (sel === rule.selector) {
          // compare selectors as a comma list
          return true;
        } else if (nodeRule.selector === rule.selector) {
          // compare selectors as a whole (e.g. ".i, .j" === ".i, .j")
          return true;
        }

        return false;
      }); // stop walking if we found the selector

      if (selectorIsFound) {
        return false;
      }
    }

    var duplicates = areas.filter(function (area) {
      return foundAreas.includes(area);
    });

    if (duplicates.length > 0) {
      var word = duplicates.length > 1 ? 'names' : 'name';
      decl.warn(result, ['', "  duplicate area " + word + " detected in rule: " + rule.selector, "  duplicate area " + word + ": " + duplicates.join(', '), "  duplicate area names cause unexpected behavior in IE"].join('\n'));
      return false;
    }

    return undefined;
  });
  return undefined;
} // Parse grid-template-areas


var DOTS = /^\.+$/;

function track(start, end) {
  return {
    start: start,
    end: end,
    span: end - start
  };
}

function getColumns(line) {
  return line.trim().split(/\s+/g);
}

function parseGridAreas(_ref7) {
  var rows = _ref7.rows,
      gap = _ref7.gap;
  return rows.reduce(function (areas, line, rowIndex) {
    if (gap.row) rowIndex *= 2;
    if (line.trim() === '') return areas;
    getColumns(line).forEach(function (area, columnIndex) {
      if (DOTS.test(area)) return;
      if (gap.column) columnIndex *= 2;

      if (typeof areas[area] === 'undefined') {
        areas[area] = {
          column: track(columnIndex + 1, columnIndex + 2),
          row: track(rowIndex + 1, rowIndex + 2)
        };
      } else {
        var _areas$area = areas[area],
            column = _areas$area.column,
            row = _areas$area.row;
        column.start = Math.min(column.start, columnIndex + 1);
        column.end = Math.max(column.end, columnIndex + 2);
        column.span = column.end - column.start;
        row.start = Math.min(row.start, rowIndex + 1);
        row.end = Math.max(row.end, rowIndex + 2);
        row.span = row.end - row.start;
      }
    });
    return areas;
  }, {});
} // Parse grid-template


function testTrack(node) {
  return node.type === 'word' && /^\[.+\]$/.test(node.value);
}

function verifyRowSize(result) {
  if (result.areas.length > result.rows.length) {
    result.rows.push('auto');
  }

  return result;
}

function parseTemplate(_ref8) {
  var decl = _ref8.decl,
      gap = _ref8.gap;
  var gridTemplate = parser(decl.value).nodes.reduce(function (result, node) {
    var type = node.type,
        value = node.value;
    if (testTrack(node) || type === 'space') return result; // area

    if (type === 'string') {
      result = verifyRowSize(result);
      result.areas.push(value);
    } // values and function


    if (type === 'word' || type === 'function') {
      result[result.key].push(parser.stringify(node));
    } // devider(/)


    if (type === 'div' && value === '/') {
      result.key = 'columns';
      result = verifyRowSize(result);
    }

    return result;
  }, {
    key: 'rows',
    columns: [],
    rows: [],
    areas: []
  });
  return {
    areas: parseGridAreas({
      rows: gridTemplate.areas,
      gap: gap
    }),
    columns: prefixTrackValue({
      value: gridTemplate.columns.join(' '),
      gap: gap.column
    }),
    rows: prefixTrackValue({
      value: gridTemplate.rows.join(' '),
      gap: gap.row
    })
  };
} // Insert parsed grid areas

/**
 * Get an array of -ms- prefixed props and values
 * @param  {Object} [area] area object with columm and row data
 * @param  {Boolean} [addRowSpan] should we add grid-column-row value?
 * @param  {Boolean} [addColumnSpan] should we add grid-column-span value?
 * @return {Array<Object>}
 */


function getMSDecls(area, addRowSpan, addColumnSpan) {
  if (addRowSpan === void 0) {
    addRowSpan = false;
  }

  if (addColumnSpan === void 0) {
    addColumnSpan = false;
  }

  return [].concat({
    prop: '-ms-grid-row',
    value: String(area.row.start)
  }, area.row.span > 1 || addRowSpan ? {
    prop: '-ms-grid-row-span',
    value: String(area.row.span)
  } : [], {
    prop: '-ms-grid-column',
    value: String(area.column.start)
  }, area.column.span > 1 || addColumnSpan ? {
    prop: '-ms-grid-column-span',
    value: String(area.column.span)
  } : []);
}

function getParentMedia(parent) {
  if (parent.type === 'atrule' && parent.name === 'media') {
    return parent;
  } else if (!parent.parent) {
    return false;
  }

  return getParentMedia(parent.parent);
}
/**
 * Check grid-template(-areas) rules with the same selector for
 * -ms-grid-(row|column)-span values. If initial and compared values are
 * different - return an array of boolean values which need to be updated
 * @param  {Declaration} decl
 * @param  {Object} area area object with column and row data
 * @param  {String} areaName area name (e.g. "head")
 * @return {Array<Boolean, Boolean>}
 */


function shouldAddSpan(decl, area, areaName) {
  var root = decl.root();
  var rule = decl.parent;
  var overrideValues = [false, false];
  root.walkRules(rule.selector, function (node) {
    // abort if we are on the same rule
    if (rule.toString() === node.toString()) {
      return false;
    }

    node.walkDecls('grid-template', function (d) {
      var template = parseTemplate({
        decl: d,
        gap: getGridGap(d)
      });
      var comparedArea = template.areas[areaName];

      if (!comparedArea) {
        return true;
      }

      if (area.row.span !== comparedArea.row.span) {
        overrideValues[0] = true;
      }

      if (area.column.span !== comparedArea.column.span) {
        overrideValues[1] = true;
      }

      return undefined;
    });
    return undefined;
  });
  return overrideValues;
}
/**
 * search the next siblings and find the latest media with
 * the same selectors inside
 * @param  {Rule | AtRule} rule
 * @param  {Array<String>} selectors
 * @return {AtRule}
 */


function getLastNextSimilarMedia(rule, selectors) {
  if (!rule) {
    return false;
  } else if (rule.type !== 'atrule' && rule.name !== 'media') {
    return rule.prev();
  }

  var selectorsToCompare = [];
  rule.walkRules(function (r) {
    return selectorsToCompare.push(r.selector);
  }); // check if every selector match

  var selectorsEqual = selectors.every(function (sel, index) {
    return sel === selectorsToCompare[index];
  });

  if (selectorsEqual) {
    // to check the next rule
    return getLastNextSimilarMedia(rule.next(), selectors);
  } else {
    // or return the last similar media
    return rule.prev();
  }
}

function insertAreas(areas, decl, result) {
  var missed = Object.keys(areas);
  var parentMedia = getParentMedia(decl.parent);
  var rules = [];
  var areasLength = Object.keys(areas).length;
  var areasCount = 0;
  decl.root().walkDecls('grid-area', function (gridArea) {
    var value = gridArea.value;
    var area = areas[value];
    missed = missed.filter(function (e) {
      return e !== value;
    });

    if (area && parentMedia) {
      // create new rule
      var rule = decl.parent.clone({
        selector: gridArea.parent.selector
      });
      rule.removeAll(); // insert prefixed decls in new rule

      var _shouldAddSpan = shouldAddSpan(decl, area, value),
          addRowSpan = _shouldAddSpan[0],
          addColumnSpan = _shouldAddSpan[1];

      getMSDecls(area, addRowSpan, addColumnSpan).forEach(function (i) {
        return rule.append(Object.assign(i, {
          raws: {
            between: gridArea.raws.between
          }
        }));
      });
      rules.push(rule);
      areasCount++;

      if (areasCount === areasLength) {
        var next = gridArea.parent.next();
        if (next && next.type === 'atrule' && next.name === 'media' && next.params === parentMedia.params && next.first.type === 'rule' && next.first.selector && parentMedia.first.selector && /^-ms-/.test(next.first.first.prop)) return undefined;
        var selectors = rules.map(function (r) {
          return r.selector;
        });
        var lastSimilarMedia = getLastNextSimilarMedia(next, selectors);
        var areaParentMedia = getParentMedia(gridArea.parent);
        var areaMedia = parentMedia.clone().removeAll().append(rules);

        if (areaParentMedia) {
          // insert after @media
          areaParentMedia.after(areaMedia);
        } else if (lastSimilarMedia) {
          // insert after the closest @media with the same selectors
          lastSimilarMedia.after(areaMedia);
        } else {
          // insert after every other Rule
          gridArea.parent.after(areaMedia);
        }
      }

      return undefined;
    }

    if (area) {
      gridArea.parent.walkDecls(/-ms-grid-(row|column)/, function (d) {
        d.remove();
      }); // insert prefixed decls before grid-area

      getMSDecls(area).forEach(function (i) {
        return gridArea.cloneBefore(i);
      });
    }

    return undefined;
  });

  if (missed.length > 0) {
    decl.warn(result, 'Can not find grid areas: ' + missed.join(', '));
  }
} // Gap utils


function getGridGap(decl) {
  var gap = {}; // try to find gap

  var testGap = /^(grid-)?((row|column)-)?gap$/;
  decl.parent.walkDecls(testGap, function (_ref9) {
    var prop = _ref9.prop,
        value = _ref9.value;

    if (/^(grid-)?gap$/.test(prop)) {
      var _parser$nodes = parser(value).nodes,
          _parser$nodes$ = _parser$nodes[0],
          row = _parser$nodes$ === void 0 ? {} : _parser$nodes$,
          _parser$nodes$2 = _parser$nodes[2],
          column = _parser$nodes$2 === void 0 ? {} : _parser$nodes$2;
      gap.row = row.value;
      gap.column = column.value || row.value;
    }

    if (/^(grid-)?row-gap$/.test(prop)) gap.row = value;
    if (/^(grid-)?column-gap$/.test(prop)) gap.column = value;
  });
  return gap;
}
/**
 * parse media parameters (for example 'min-width: 500px')
 * @param  {String} params parameter to parse
 * @return {}
 */


function parseMediaParams(params) {
  var parsed = parser(params);
  var prop;
  var value;
  parsed.walk(function (node) {
    if (node.type === 'word' && /min|max/g.test(node.value)) {
      prop = node.value;
    } else if (node.value.includes('px')) {
      value = parseInt(node.value.replace(/\D/g, ''));
    }
  });
  return [prop, value];
}
/**
 * inherit grid gap values from the closest rule above
 * with the same selector
 * @param  {Declaration} decl
 * @param  {Object} gap gap values
 * @return {Object | Boolean} return gap values or false (if not found)
 */


function inheritGridGap(decl, gap) {
  var rule = decl.parent;
  var mediaRule = getParentMedia(rule);
  var root = rule.root();

  if (Object.keys(gap).length > 0 || !mediaRule) {
    return false;
  } // e.g ['min-width']


  var _parseMediaParams = parseMediaParams(mediaRule.params),
      prop = _parseMediaParams[0]; // find the closest rule with the same selector


  var closestRuleGap;
  root.walkRules(rule.selector, function (r) {
    var gridGap; // abort if checking the same rule

    if (rule.toString() === r.toString()) {
      return false;
    } // find grid-gap values


    r.walkDecls('grid-gap', function (d) {
      return gridGap = getGridGap(d);
    }); // skip rule without gaps

    if (!gridGap || Object.keys(gridGap).length === 0) {
      return true;
    }

    var media = getParentMedia(r);

    if (media) {
      // if we are inside media, we need to check that media props match
      // e.g ('min-width' === 'min-width')
      var propToCompare = parseMediaParams(media.params)[0];

      if (propToCompare === prop) {
        closestRuleGap = gridGap;
        return true;
      }
    } else {
      closestRuleGap = gridGap;
      return true;
    }

    return undefined;
  }); // if we find the closest gap object

  if (closestRuleGap && Object.keys(closestRuleGap).length > 0) {
    return closestRuleGap;
  } else {
    return false;
  }
}

function warnGridGap(_ref10) {
  var gap = _ref10.gap,
      hasColumns = _ref10.hasColumns,
      decl = _ref10.decl,
      result = _ref10.result;
  var hasBothGaps = gap.row && gap.column;

  if (!hasColumns && (hasBothGaps || gap.column && !gap.row)) {
    delete gap.column;
    decl.warn(result, 'Can not impliment grid-gap without grid-tamplate-columns');
  }
}

module.exports = {
  parse: parse,
  translate: translate,
  parseTemplate: parseTemplate,
  parseGridAreas: parseGridAreas,
  insertAreas: insertAreas,
  insertDecl: insertDecl,
  prefixTrackProp: prefixTrackProp,
  prefixTrackValue: prefixTrackValue,
  getGridGap: getGridGap,
  warnGridGap: warnGridGap,
  warnDuplicateNames: warnDuplicateNames,
  inheritGridGap: inheritGridGap
};