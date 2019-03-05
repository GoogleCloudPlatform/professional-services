/**
 * Copyright 2019 Google LLC
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
*/

/**
 * This file prepares the BigQuery query plan JSON data 
 * into a format acceptable by D3JS' Sankey library
 */
var bqsankey = (function () {

  /** 
   * Check if stage is for repartitioning
   * @param {string} stageName - Name of the stage
   */
  function isRepartitionStage(stageName) {
    return stageName.match(/repartition/gi);
  };

  /**
   * Given a query plan and its stages, get list of tables referenced in the steps
   * @param {Object[]} refTables - Array of referenced tables in the query
   * @param {Object[]} queryPlan - BigQuery's query plan JSON
   */
  function getInputTables(refTables, queryPlan) {
    // Input stage is any stage with direct input from a table
    var substepLines = queryPlan.steps.filter(function(step) { 
      return step.kind === "READ"; 
    }).flatMap(function(step) {
      return step.substeps;
    }).filter(function(substepLine) {
      return substepLine.match(/FROM/gi);
    });

    return refTables.map(function(r) { 
      return r.tableId; 
    }).filter(function(table) {
      return substepLines.some(function(line) {
        return line.indexOf(table) != -1;
      });
    });
  };

  /**
   * Get stage based on stage id
   * @param {Object[]} stages - Array of stage objects
   * @param {string} stageid - stage id to find
   */
  function getStage(stages, stageid) {
    return stages.find(function(stage) {
      return stage.id == stageid;
    });
  };

  // 
  /**
   * Utility function to check empty array
   * @param {Object[]} arr - Array to check
   */
  function arrayOrEmpty(arr) {
    if (arr) {
      return arr;
    } else {
      return [];
    }
  };

  /**
   * Get unique stages from a list with duplicates
   * from https://codeburst.io/javascript-array-distinct-5edc93501dc4
   * @param {Object[]} stages - Array of stage objects
   */
  function unique(stages) {
    const result = [];
    if (!stages || stages.length == 0) return result;
    const map = new Map();
    for (const stage of stages) {
        if(!map.has(stage.id)){
            map.set(stage.id, true);    // set any value to Map
            result.push({
                id: stage.id,
                name: stage.name,
                recordsWritten: stage.recordsWritten,
                inputStages: []
            });
        }
    }
    return result;
  };

  /**
   * Parse query plan to get relevant stage information for use in Sankey.
   * Also add a layer of stages to show tables from which data is read from.
   * @param {Object} bqjson - BigQuery query plan JSON
   */
  function extractStages(bqjson) {
    var stages = bqjson.statistics.query.queryPlan.map(function(qp) {
      // Only pick properties needed
      var stage = {
        id: qp.id,
        name: qp.name,
        recordsWritten: qp.recordsWritten,
        inputStages: arrayOrEmpty(qp.inputStages)
      };
      // check for any tables that input data into a step directly
      // Encode them as inputStages
      var inputTables = getInputTables(bqjson.statistics.query.referencedTables, qp);
      if (inputTables && inputTables.length > 0) {
        stage.hasInputTables = true;
        stage.inputTables = inputTables.map(function(tableName) {
          return {
            id: tableName,
            name: tableName,
            recordsWritten: qp.recordsRead,
            inputStages: []
          };
        });
        stage.inputStages = stage.inputStages.concat(inputTables);
      } else {
        stage.hasInputTables = false;
        stage.inputTables = [];
      }
      return stage;
    });
    // Get all unique inputStages and add them as stages
    var tableStages = stages.flatMap(function(stage) {
      return stage.inputTables;
    });
    return stages.concat(unique(tableStages));
  };

  /**
   * Create node objects needed by Sankey from stages
   * Ignore repartitioning stages as they represent duplicate data points for a stage
   * For a correct Sankey diagram, we need unique data points for each node and link
   * @param {Object[]} stages - List of stage objects that absracts query plan information needed for Sankey
   */
  function transformToNodes(stages) {
    return stages.filter(function(stage) {
      return !isRepartitionStage(stage.name);
    }).map(function(stage) {
      return { name: stage.name };
    });
  };

  /**
   * Create link objects needed by Sankey from stages
   * @param {Object[]} stages - List of stage objects that absracts query plan information needed for Sankey
   * @param {Object[]} nodes - List of Sankey's node objects
   */
  function transformToLinks(stages, nodes) {
    return stages.flatMap(function(stage) {
      return stage.inputStages.map(function(stageid) {
        var sourceStage = getStage(stages, stageid);
        var link = {
          source: sourceStage.name,
          target: stage.name,
          value: sourceStage.recordsWritten
        };
        if (link.value == 0) link.value = 0.1 // With value 0 sankey is all messed up!
        return link;
      });
    }).filter(function(link) {
        return !isRepartitionStage(link.source) && !isRepartitionStage(link.target);
    }).map(function(link) {
      var nodeNames = nodes.map(function(node) { return node.name; });
      return {
        source: nodeNames.indexOf(link.source),
        target: nodeNames.indexOf(link.target),
        value: link.value
      };
    });
  };

  /**
   * Main public function to be called to transform a query plan in JSONformat
   * to nodes and links format expected by d3js' Sankey library
   * @param {Object} bqjson - BigQuery query plan JSON
   */
  function qp2sankey(bqjson) {
    var stages = extractStages(bqjson);
    var nodes = transformToNodes(stages);
    var links = transformToLinks(stages, nodes);
    return { nodes: nodes, links: links };
  }

  // public interface
  return { qp2sankey: qp2sankey };

})();

