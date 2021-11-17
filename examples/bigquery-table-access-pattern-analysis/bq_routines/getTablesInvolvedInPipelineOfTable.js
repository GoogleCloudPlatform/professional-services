// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function getDirectDestinations(table, allSourceDestTablePairs) {
    return allSourceDestTablePairs.filter(sourceDestTablePair => sourceDestTablePair.sourceTable == table).map(sourceDestTablePair => sourceDestTablePair.destinationTable).filter(x => x);
}

function getDirectSources(table, allSourceDestTablePairs) {
    return allSourceDestTablePairs.filter(sourceDestTablePair => sourceDestTablePair.destinationTable == table).map(sourceDestTablePair => sourceDestTablePair.sourceTable).filter(x => x);
}

function getTablesInvolvedInPipelineOfTable(table, allSourceDestTablePairs) {
    var tablesInvolved = [table];
    var visitedDestinations = [];
    var tablesToBeExplored = [table];
    while (tablesToBeExplored.length != 0) {
        var currentTable = tablesToBeExplored.pop();
        var directDestinations = getDirectDestinations(currentTable, allSourceDestTablePairs);
        visitedDestinations.push(currentTable);
        for (const directDestination of directDestinations) {
            if (!visitedDestinations.includes(directDestination) && directDestination != currentTable) {
                tablesInvolved.push(directDestination);
                tablesToBeExplored.push(directDestination);    
            }
        }
    }

    var visitedSources = [];
    tablesToBeExplored = [table];
    while (tablesToBeExplored.length != 0) {
        var currentTable = tablesToBeExplored.pop();
        var directSources = getDirectSources(currentTable, allSourceDestTablePairs);
        visitedSources.push(currentTable);
        for (const directSource of directSources) {
            if (!visitedSources.includes(directSource) && directSource != currentTable) {
                tablesInvolved.push(directSource);
                tablesToBeExplored.push(directSource);    
            }
        }
    }
    return tablesInvolved.filter(x => x);
}