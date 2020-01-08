/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.demo.dataflow.model;


import org.apache.beam.sdk.coders.AvroCoder;
import org.apache.beam.sdk.coders.DefaultCoder;

import java.util.Map;

@DefaultCoder(AvroCoder.class)
public class GoBike {
    private Integer durationSec;
    private String startTime;
    private String endTime;

    private Integer startStationId;
    private String startStationName;
    private String startStationLatitude;
    private String startStationLongitude;

    private Integer endStationId;
    private String endStationName;
    private String endStationLatitude;
    private String endStationLongitude;

    private Integer bikerId;

    private String userType;
    private Integer memeberBirthYear;

    private String memberGender;

    private Boolean bikeShareForAllTrip;


    public static GoBike createFromMap(Map<String,String> data) {
        String[] headers = getHeader();
        return new GoBike(Integer.parseInt(data.get(headers[0])), data.get(headers[1]), data.get(headers[2]), Integer.parseInt(data.get(headers[3])), data.get(headers[4])
                ,data.get(headers[5]), data.get(headers[6]), Integer.parseInt(data.get(headers[7])),data.get(headers[8]),
                data.get(headers[9]), data.get(headers[10]), Integer.parseInt(data.get(headers[11])), data.get(headers[12]), Integer.parseInt(data.get(headers[13])), data.get(headers[14]), Boolean.parseBoolean(data.get(headers[15])));
    }

    public GoBike() {
    }

    public GoBike(Integer durationSec, String startTime, String endTime, Integer startStationId, String startStationName, String startStationLatitude, String startStationLongitude, Integer endStationId, String endStationName, String endStationLatitude, String endStationLongitude, Integer bikerId, String userType, Integer memeberBirthYear, String memberGender, Boolean bikeShareForAllTrip) {
        this.durationSec = durationSec;
        this.startTime = startTime;
        this.endTime = endTime;
        this.startStationId = startStationId;
        this.startStationName = startStationName;
        this.startStationLatitude = startStationLatitude;
        this.startStationLongitude = startStationLongitude;
        this.endStationId = endStationId;
        this.endStationName = endStationName;
        this.endStationLatitude = endStationLatitude;
        this.endStationLongitude = endStationLongitude;
        this.bikerId = bikerId;
        this.userType = userType;
        this.memeberBirthYear = memeberBirthYear;
        this.memberGender = memberGender;
        this.bikeShareForAllTrip = bikeShareForAllTrip;
    }

    public Integer getDurationSec() {
        return durationSec;
    }

    public void setDurationSec(Integer durationSec) {
        this.durationSec = durationSec;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public Integer getStartStationId() {
        return startStationId;
    }

    public void setStartStationId(Integer startStationId) {
        this.startStationId = startStationId;
    }

    public String getStartStationName() {
        return startStationName;
    }

    public void setStartStationName(String startStationName) {
        this.startStationName = startStationName;
    }

    public String getStartStationLatitude() {
        return startStationLatitude;
    }

    public void setStartStationLatitude(String startStationLatitude) {
        this.startStationLatitude = startStationLatitude;
    }

    public String getStartStationLongitude() {
        return startStationLongitude;
    }

    public void setStartStationLongitude(String startStationLongitude) {
        this.startStationLongitude = startStationLongitude;
    }

    public Integer getEndStationId() {
        return endStationId;
    }

    public void setEndStationId(Integer endStationId) {
        this.endStationId = endStationId;
    }

    public String getEndStationName() {
        return endStationName;
    }

    public void setEndStationName(String endStationName) {
        this.endStationName = endStationName;
    }

    public String getEndStationLatitude() {
        return endStationLatitude;
    }

    public void setEndStationLatitude(String endStationLatitude) {
        this.endStationLatitude = endStationLatitude;
    }

    public String getEndStationLongitude() {
        return endStationLongitude;
    }

    public void setEndStationLongitude(String endStationLongitude) {
        this.endStationLongitude = endStationLongitude;
    }

    public Integer getBikerId() {
        return bikerId;
    }

    public void setBikerId(Integer bikerId) {
        this.bikerId = bikerId;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }

    public Integer getMemeberBirthYear() {
        return memeberBirthYear;
    }

    public void setMemeberBirthYear(Integer memeberBirthYear) {
        this.memeberBirthYear = memeberBirthYear;
    }

    public String getMemberGender() {
        return memberGender;
    }

    public void setMemberGender(String memberGender) {
        this.memberGender = memberGender;
    }

    public Boolean getBikeShareForAllTrip() {
        return bikeShareForAllTrip;
    }

    public void setBikeShareForAllTrip(Boolean bikeShareForAllTrip) {
        this.bikeShareForAllTrip = bikeShareForAllTrip;
    }

    public static String[] getHeader(){
        String[] header = new String[16];
        header[0] = "duration_sec";
        header[1] ="start_time";
        header[2] ="end_time";
        header[3] ="start_station_id";
        header[4] ="start_station_name";
        header[5] ="start_station_latitude";
        header[6] ="start_station_longitude";
        header[7] = "end_station_id";
        header[8] = "end_station_name";
        header[9] ="end_station_latitude";
        header[10] ="end_station_longitude";
        header[11] ="bike_id";
        header[12] ="user_type";
        header[13] ="member_birth_year";
        header[14] = "member_gender";
        header[15] ="bike_share_for_all_trip";
        return header;
    }
}
