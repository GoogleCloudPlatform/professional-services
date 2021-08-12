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