/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

// load CSS
/**
 * Load Javascript file from URL
 * @param {string} url the URL of your JavaScript file
 */
function loadJs(url) {
  var script = document.createElement('script');
  script.src = url;
  script.setAttribute('async', 'true');
  document.documentElement.firstChild.appendChild(script);
}

/**
 * Loads a CSS file from the supplied URL
 * @param {string} url    The URL of the CSS file, if its relative
                          it will be to the current page's url
 * @return {HTMLElement}  The <link> which was appended to the <head>
 */
function loadcss(url) {
  var head = document.getElementsByTagName('head')[0],
      link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = url;
  head.appendChild(link);
  return link;
}


// loadJS
loadJs('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.3.0/Chart.bundle.js');
loadcss(
    'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css');
loadcss(
    'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css');


// global variables
var intervals = [];
var map;
var cities = [];
var lastInfoView = null;

/**
        Clear all intervals stored in the global variable
*
*/
function removeAllIntervals() {
  // remove all intervals
  for (var i = 0; i < intervals.length; i++) {
    clearInterval(intervals[i]);
  }
  intervals = [];
}

/**
        Get formatted date from milliseconds
        HH:MM:SS
        @param {string} epoch - timestamp
        @return {string} timestamp formatted in HH:MM:SS format
*
*/
function getDateTimeFromEpoch(epoch) {
  var date = new Date(epoch);
  var dateTime = '';

  if (date.getHours() < 10) {
    dateTime += '0';
  }
  dateTime += date.getHours();
  dateTime += ':';

  if (date.getMinutes() < 10) {
    dateTime += '0';
  }
  dateTime += date.getMinutes();
  dateTime += ':';

  if (date.getSeconds() < 10) {
    dateTime += '0';
  }
  dateTime += date.getSeconds();

  return dateTime;
}

var URL_PREFIX = '';  //;"http://localhost:8081"; //--> NEEDED FOR Develpoment

// on document loading
$(document).ready(function() {
  // show the map
  document.getElementById('map').style.display = 'block';
});

/** Google Compute Engine Instances **/
function gceInstanceCreation() {
  // perform post to generate git
  xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  var url = URL_PREFIX + '/rest/simulation/start';
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        // ok
        console.log(xhr.responseText);
        var response = JSON.parse(xhr.responseText);
        console.log(response.message);
      } else {
        console.log('Error: ' + xhr.responseText);
      }
    }
  };

  var data = JSON.stringify({
    'instanceName': 'rest-test',
    'instanceType': 'n1-standard-4',
    'instanceZone': 'us-central1-a',
    'messagePostNumber': '1',
    'instance-number': '19'
  });
  xhr.send(data);
}

/**
        GCE - Get number of running instance
*
*/
function gceInstanceRunningList() {
  $.ajax({
    type: 'GET',
    url: URL_PREFIX + '/rest/simulation/start',
    async: true,
    xhrFields: {withCredentials: true},
    success: function(data) {
      if (data.code != 200) {
        console.log('ERROR in launching instance');
      }
      console.log(data.message);
      return data.message;
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      console.log('ERROR in launching instance');
    }
  });
}

/**
        GCE - Delete all running instances
*
*/
function gceInstanceRunningDelete() {
  // perform post to generate git
  xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  var url = URL_PREFIX + '/rest/simulation/stop';
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        // ok
        console.log(xhr.responseText);
        var response = JSON.parse(xhr.responseText);
        console.log(response.message);
      } else {
        console.log('Error: ' + xhr.responseText);
      }
    }
  };

  var data = JSON.stringify({});
  xhr.send(data);
}

/**
 * Initialize the map
 */
function initMap() {
  var milano = {lat: 45.4627124, lng: 9.1076926};
  map = new google.maps.Map(
      document.getElementById('map'), {zoom: 4, center: milano});

  function startBtn() {
    var btn = $(
        '<div class="my-button"><button id="startBtn" type="button" class="btn btn-primary">Start</button></div>');
    btn.bind('click', function() {
      // record vocal command
      gceInstanceCreation();
      // disable start button
      $('#startBtn').prop('disabled', true);
      // enable stop and show buttons
      $('#stopBtn').prop('disabled', false);
      $('#updateBtn').prop('disabled', false);
    });
    return btn[0];
  }

  function updateBtn() {
    var btn = $(
        '<div class="my-button"><button id="updateBtn" disabled type="button" class="btn btn-primary">Update</button></div>');
    btn.bind('click', function() {
      // record vocal command
      loadCity();
      // disable update button
      $('#updateBtn').prop('disabled', true);
    });
    return btn[0];
  }

  function stopBtn() {
    var btn = $(
        '<div class="my-button"><button id="stopBtn" disabled type="button" class="btn btn-primary">Stop</button></div>');
    btn.bind('click', function() {
      // record vocal command
      gceInstanceRunningDelete();
      // disable stop button and update button
      $('#stopBtn').prop('disabled', true);
      $('#updateBtn').prop('disabled', true);
      // enable start
      $('#startBtn').prop('disabled', false);
    });
    return btn[0];
  }

  map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(startBtn());
  map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(updateBtn());
  map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(stopBtn());


}  // init map

/**
 * Load cities
 */
function loadCity() {
  $.ajax({
    type: 'GET',
    url: URL_PREFIX + '/rest/city/loadCities',
    async: true,
    xhrFields: {withCredentials: true},
    success: function(data) {
      if (data.code != 200) {
        // route the user to the login page
        console.log('ERROR in get city');
      }
      citiesTemp = JSON.parse(data.message);
      for (var i = 0; i < citiesTemp.length; i++) {
        if (cities.indexOf(citiesTemp[i].id) == -1) {
          cities.push(citiesTemp[i].id);  // add city
          var city = {};
          city.lat = citiesTemp[i].lat;
          city.lng = citiesTemp[i].lng;

          var marker = new google.maps.Marker({
            position: city,
            map: map,
            animation: google.maps.Animation.DROP
          });

          var contentString =
              '<canvas id="myChart" width="500" height="400"></canvas>';


          var infowindow = new google.maps.InfoWindow();
          google.maps.event.addListener(
              marker, 'click', (function(marker, contentString, infowindow) {
                return function() {
                  // generate unique ID
                  var id = marker.getPosition().lat() + '-' +
                      marker.getPosition().lng();
                  console.log('ID: ' + id);
                  if (lastInfoView) {
                    lastInfoView.close();
                    removeAllIntervals();
                  }
                  infowindow.setContent(contentString);
                  infowindow.open(map, marker);
                  lastInfoView = infowindow;

                  $.ajax({
                    type: 'GET',
                    url: URL_PREFIX + '/rest/city/loadCityTemperatures?id=' + id +
                        '&numRecord=5',
                    async: true,
                    xhrFields: {withCredentials: true},
                    success: function(data) {
                      if (data.code != 200) {
                        // route the user to the login page
                        console.log('ERROR in get cityTemperature');
                      }
                      // print out data
                      var respData = JSON.parse(data.message);
                      console.log(respData);
                      var chartLabels = [];
                      var chartData = [];
                      for (var i = 0; i < respData.length; i++) {
                        chartLabels.push(getDateTimeFromEpoch(respData[i].id));
                        chartData.push(respData[i].temperature);
                      }

                      var myData = {
                        labels: chartLabels,
                        datasets: [{
                          label: 'Temperature in °C',
                          data: chartData,
                          borderColor: 'blue',
                          pointBorderColor: 'red',
                          pointBackgroundColor: 'red',
                          pointBorderWidth: 3
                        }]
                      };
                      loadChart(myData, id);
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                      console.log('ERROR in get cityTemperature');
                    }
                  });  // ajax call
                };
              })(marker, contentString, infowindow));

          google.maps.event.addListener(infowindow, 'closeclick', function() {
            removeAllIntervals();
          });
        }
      }  // for cycle
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      console.log('ERROR in get city');
    }
  });  // ajax call
}

/**
 * Load chart data
 * @param {json} inputData the data that you want to load
 * @param {string} id the id of the City to display
 *
 */
function loadChart(inputData, id) {
  var ctx = $('#myChart');
  var myChart = new Chart(ctx, {
    type: 'line',
    data: inputData,
    options: {scales: {yAxes: [{ticks: {beginAtZero: false}}]}}
  });

  // update chart every second
  intervals.push(setInterval(function() {
    $.ajax({
      type: 'GET',
      url: URL_PREFIX + '/rest/city/loadCityTemperatures?id=' + id + '&numRecord=1',
      async: true,
      xhrFields: {withCredentials: true},
      success: function(data) {
        if (data.code != 200) {
          // route the user to the login page
          console.log('ERROR in get city temperature');
        }
        // print out data
        var respData = JSON.parse(data.message);
        var chartLabels = [];
        var chartData = [];
        for (var i = 0; i < respData.length; i++) {
          chartLabels.push(getDateTimeFromEpoch(respData[i].id));
          chartData.push(respData[i].temperature);
        }


        // shift left old chart data
        myChart.data.datasets[0].data.shift();
        myChart.data.datasets[0].data =
            myChart.data.datasets[0].data.concat(chartData);
        myChart.data.labels.shift();
        myChart.data.labels = myChart.data.labels.concat(chartLabels);
        myChart.update();
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        console.log('ERROR in get city temperature');
      }
    });  // ajax call
  }, 3000));
}

