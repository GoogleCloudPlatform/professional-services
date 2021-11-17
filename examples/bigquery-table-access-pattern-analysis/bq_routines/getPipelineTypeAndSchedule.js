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

Array.prototype.median = function () {
    return this.slice().sort((a, b) => a - b)[Math.floor(this.length / 2)]; 
};

var toHoursUnit = function(time) {
    return time/1000/60/60;
}

var toDayUnit = function(time) {
    return time/1000/60/60/24;
}

function getPipelineTypeAndSchedule(runHistory) {
    if (runHistory.length < 3) {
        return {
            pipelineType: 'AD HOC',
            schedule: 'NON DETERMINISTICALLY'
        };
    }

    // Sort the array
    runHistory.sort((a,b) => new Date(a).getTime()  - new Date(b).getTime());

    // Get the time differences between the schedule
    var timeDifferences = runHistory.map(function(time, index) {
        if (time != runHistory[0]) {
            return (time - runHistory[index -1]);
        }
    })
    .filter(x => x);

    // Get the time differences between the schedule in hours
    var timeDifferencesInHour = timeDifferences.map(timeDifference => toHoursUnit(timeDifference));

    // Set the schedule if it is more than serveral times every hour
    var schedule = null;
    var timeDifferencesInHoursMedian = timeDifferencesInHour.median();
    if (timeDifferencesInHoursMedian <= 0.5) {
        var elementsFollowingPattern = timeDifferencesInHour.filter(x => x <= 0.5); 
        if (elementsFollowingPattern.length > 0.5 * timeDifferencesInHour.length && elementsFollowingPattern.length > 20) {
        schedule = 'SEVERAL TIMES EVERY HOUR';
        }
    }

    // Set the schedule if it is hourly
    if (timeDifferencesInHoursMedian > 0.5 && timeDifferencesInHoursMedian <= 1.5) { 
        var elementsFollowingPattern = timeDifferencesInHour.filter(x => x > 0.5 && x <= 1.5)
        if (elementsFollowingPattern.length > 0.5 * timeDifferencesInHour.length && elementsFollowingPattern.length > 3) {
            schedule = 'HOURLY';
        }
    }

    // Set the schedule if it is daily
    if (timeDifferencesInHoursMedian >= 23 && timeDifferencesInHoursMedian <= 25) {
        var elementsFollowingPattern = timeDifferencesInHour.filter(x => x <= 23 && x >= 25)
        if (elementsFollowingPattern.length > 0.5 * timeDifferencesInHour.length && elementsFollowingPattern.length > 3) {
            schedule = 'DAILY';
        }
    }

    // Set the schedule if it is monthly
    var timeDifferencesInDays = timeDifferences.map(timeDifference => timeDifference/1000/60/60/24);
    var timeDifferencesInDaysMedian = timeDifferencesInDays.median();
    if (timeDifferencesInDaysMedian >= 27 && timeDifferencesInDaysMedian <= 32) {
        var elementsFollowingPattern = timeDifferencesInDays.filter(x => x >=27 && x <= 32);
        if (elementsFollowingPattern.length > 0.5 * timeDifferencesInDays.length && elementsFollowingPattern.length > 2) {
            schedule = 'MONTHLY';
        }
    }

    if (schedule == null) {
        return {
            pipelineType: 'AD HOC',
            schedule: 'NON DETERMINISTICALLY'
        };
    }

    var pipelineType = null;
    var timeGapFromNowToLastRun = new Date() - runHistory[runHistory.length - 1];
    if (schedule == 'SEVERAL TIMES EVERY HOUR') {
        if (toHoursUnit(timeGapFromNowToLastRun) > 1.5) {
            pipelineType = 'DEAD';
        } else {
            pipelineType = 'LIVE';
        }
    }

    if (schedule == 'HOURLY') {
        if (toHoursUnit(timeGapFromNowToLastRun) > 3) {
            pipelineType = 'DEAD';
        } else {
            pipelineType = 'LIVE';
        }
    }

    if (schedule == 'DAILY') {
        if (toDayUnit(timeGapFromNowToLastRun) > 3) {
            pipelineType = 'DEAD';
        } else {
            pipelineType = 'LIVE';
        }
    }

    if (schedule == 'MONTHLY') {
        if (toDayUnit(timeGapFromNowToLastRun) > 50) {
            pipelineType = 'DEAD';
        } else {
            pipelineType = 'LIVE';
        }
    }

    return {
        pipelineType: pipelineType,
        schedule: schedule
    }
}