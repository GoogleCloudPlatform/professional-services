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


import com.google.auto.value.AutoValue;
import org.apache.beam.sdk.coders.AvroCoder;
import org.apache.beam.sdk.coders.DefaultCoder;
import org.apache.beam.sdk.options.ValueProvider;

import java.util.Map;

/**
 * Domain class for the Go Bike Data.
 */
@AutoValue
@DefaultCoder(AvroCoder.class)
public class GoBike {
    private int durationSec;
    private String startTime;
    private String endTime;

    private int startStationId;
    private String startStationName;
    private String startStationLatitude;
    private String startStationLongitude;

    private int endStationId;
    private String endStationName;
    private String endStationLatitude;
    private String endStationLongitude;

    private int bikerId;

    private String userType;
    private int memeberBirthYear;
    private String memberGender;

    private boolean bikeShareForAllTrip;

    public static GoBike createFromMap(Map<String,String> data) {
        String[] header = getHeader();
        Builder builder = new GoBike.Builder().setDurationSec(Integer.parseInt(data.get(header[0])))
                .setStartTime(data.get(header[1]))
                .setEndTime(data.get(header[2]))
                .setStartStationId(Integer.parseInt(data.get(header[3])))
                .setStartStationName(data.get(header[4]))
                .setStartStationLatitude(header[5])
                .setStartStationLongitude(header[6])
                .setEndStationId(Integer.parseInt(data.get(header[7])))
                .setEndStationName(data.get(header[8]))
                .setEndStationLatitude(header[9])
                .setEndStationLongitude(header[10])
                .setBikerId(Integer.parseInt(data.get(header[11])))
                .setUserType(data.get(header[12]))
                .setMemeberBirthYear(Integer.parseInt(data.get(header[13])))
                .setMemberGender(data.get(header[14]))
                .setBikeShareForAllTrip(Boolean.parseBoolean(data.get(header[15])));
        return builder.build();
    }

    private GoBike(int durationSec, String startTime, String endTime, int startStationId, String startStationName, String startStationLatitude,
                  String startStationLongitude, Integer endStationId, String endStationName, String endStationLatitude, String endStationLongitude,
                  int bikerId, String userType, int memeberBirthYear, String memberGender, boolean bikeShareForAllTrip) {
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
    public GoBike() {
    }

    public int getDurationSec() {
        return durationSec;
    }

    public void setDurationSec(int durationSec) {
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

    public int getStartStationId() {
        return startStationId;
    }

    public void setStartStationId(int startStationId) {
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

    public int getEndStationId() {
        return endStationId;
    }

    public void setEndStationId(int endStationId) {
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

    public int getBikerId() {
        return bikerId;
    }

    public void setBikerId(int bikerId) {
        this.bikerId = bikerId;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }

    public int getMemeberBirthYear() {
        return memeberBirthYear;
    }

    public void setMemeberBirthYear(int memeberBirthYear) {
        this.memeberBirthYear = memeberBirthYear;
    }

    public String getMemberGender() {
        return memberGender;
    }

    public void setMemberGender(String memberGender) {
        this.memberGender = memberGender;
    }

    public boolean getBikeShareForAllTrip() {
        return bikeShareForAllTrip;
    }

    public void setBikeShareForAllTrip(boolean bikeShareForAllTrip) {
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
    public static class Builder {
        private int durationSec;
        private String startTime;
        private String endTime;

        private int startStationId;
        private String startStationName;
        private String startStationLatitude;
        private String startStationLongitude;

        private int endStationId;
        private String endStationName;
        private String endStationLatitude;
        private String endStationLongitude;

        private int bikerId;

        private String userType;
        private int memeberBirthYear;
        private String memberGender;

        private boolean bikeShareForAllTrip;

        public Builder() {
        }

        public Builder setDurationSec(int durationSec) {
            this.durationSec = durationSec;
            return this;
        }

        public Builder setStartTime(String startTime) {
            this.startTime = startTime;
            return this;
        }

        public Builder setEndTime(String endTime) {
            this.endTime = endTime;
            return this;
        }

        public Builder setStartStationId(int startStationId) {
            this.startStationId = startStationId;
            return this;
        }

        public Builder setStartStationName(String startStationName) {
            this.startStationName = startStationName;
            return this;
        }

        public Builder setStartStationLatitude(String startStationLatitude) {
            this.startStationLatitude = startStationLatitude;
            return this;
        }

        public Builder setStartStationLongitude(String startStationLongitude) {
            this.startStationLongitude = startStationLongitude;
            return this;

        }

        public Builder setEndStationId(int endStationId) {
            this.endStationId = endStationId;
            return this;
        }

        public Builder setEndStationName(String endStationName) {
            this.endStationName = endStationName;
            return this;
        }

        public Builder setEndStationLatitude(String endStationLatitude) {
            this.endStationLatitude = endStationLatitude;
            return this;
        }

        public Builder setEndStationLongitude(String endStationLongitude) {
            this.endStationLongitude = endStationLongitude;
            return this;
        }

        public Builder setBikerId(int bikerId) {
            this.bikerId = bikerId;
            return this;
        }

        public Builder setUserType(String userType) {
            this.userType = userType;
            return this;
        }

        public Builder setMemeberBirthYear(int memeberBirthYear) {
            this.memeberBirthYear = memeberBirthYear;
            return this;
        }

        public Builder setMemberGender(String memberGender) {
            this.memberGender = memberGender;
            return this;
        }

        public Builder setBikeShareForAllTrip(boolean bikeShareForAllTrip) {
            this.bikeShareForAllTrip = bikeShareForAllTrip;
            return this;
        }
        public GoBike build(){
            return new GoBike(durationSec,startTime,endTime,startStationId,startStationName,startStationLatitude,startStationLongitude,endStationId,
                    endStationName,endStationLatitude,endStationLongitude,bikerId,userType,memeberBirthYear,memberGender,bikeShareForAllTrip);
        }
    }
}