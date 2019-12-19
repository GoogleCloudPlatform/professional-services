/*
 * Copyright 2019 Google LLC
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

@DefaultCoder(AvroCoder.class)
public class GoBike {

    private String startStationName, endStationName,userType,memberGender;
    private Integer startStationId;
    private Integer endStationId;
    private Integer memeberBirthYear;
    private Integer durationSec;
    private Integer bikerId;
    private String startTime, endTime;
    private String startStationLatitude;
    private String startStationLongitude;
    private String endStationLatitude;
    private String endStationLongitude;
    private Boolean bikeShareForAllTrip;

    public GoBike(Integer durationSec, String startStationName, String endStationName, Integer startStationId, Integer endStationId, String startTime, String endTime, String startStationLatitude, String startStationLongitude, String endStationLatitude, String endStationLongitude, Integer bikerId, String userType, Integer memeberBirthYear, String memberGender, Boolean bikeShareForAllTrip) {
        this.durationSec = durationSec;
        this.startStationName = startStationName;
        this.endStationName = endStationName;
        this.startStationId = startStationId;
        this.endStationId = endStationId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.startStationLatitude = startStationLatitude;
        this.startStationLongitude = startStationLongitude;
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

    public String getStartStationName() {
        return startStationName;
    }

    public String getEndStationName() {
        return endStationName;
    }

    public Integer getStartStationId() {
        return startStationId;
    }

    public Integer getEndStationId() {
        return endStationId;
    }

    public String getStartTime() {
        return startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public String getStartStationLatitude() {
        return startStationLatitude;
    }

    public String getStartStationLongitude() {
        return startStationLongitude;
    }

    public String getEndStationLatitude() {
        return endStationLatitude;
    }

    public String getEndStationLongitude() {
        return endStationLongitude;
    }

    public Integer getBikerId() {
        return bikerId;
    }

    public String getUserType() {
        return userType;
    }

    public Integer getMemeberBirthYear() {
        return memeberBirthYear;
    }

    public String getMemberGender() {
        return memberGender;
    }

    public Boolean getBikeShareForAllTrip() {
        return bikeShareForAllTrip;
    }

    public void setDurationSec(Integer durationSec) {
        this.durationSec = durationSec;
    }

    public void setStartStationName(String startStationName) {
        this.startStationName = startStationName;
    }

    public void setEndStationName(String endStationName) {
        this.endStationName = endStationName;
    }

    public void setStartStationId(Integer startStationId) {
        this.startStationId = startStationId;
    }

    public void setEndStationId(Integer endStationId) {
        this.endStationId = endStationId;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public void setStartStationLatitude(String startStationLatitude) {
        this.startStationLatitude = startStationLatitude;
    }

    public void setStartStationLongitude(String startStationLongitude) {
        this.startStationLongitude = startStationLongitude;
    }

    public void setEndStationLatitude(String endStationLatitude) {
        this.endStationLatitude = endStationLatitude;
    }

    public void setEndStationLongitude(String endStationLongitude) {
        this.endStationLongitude = endStationLongitude;
    }

    public void setBikerId(Integer bikerId) {
        this.bikerId = bikerId;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }

    public void setMemeberBirthYear(Integer memeberBirthYear) {
        this.memeberBirthYear = memeberBirthYear;
    }

    public void setMemberGender(String memberGender) {
        this.memberGender = memberGender;
    }

    public void setBikeShareForAllTrip(Boolean bikeShareForAllTrip) {
        this.bikeShareForAllTrip = bikeShareForAllTrip;
    }
}
