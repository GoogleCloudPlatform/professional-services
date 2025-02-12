/*
 * Copyright (C) 2021 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.pso.xml2bq;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "ShipInfo")
@XmlAccessorType(XmlAccessType.FIELD)
public class ShipInfo {

  @XmlElement(name = "ShipVia")
  private String shipVia;

  @XmlElement(name = "Freight")
  private Double freight;

  @XmlElement(name = "ShipName")
  private String shipName;

  @XmlElement(name = "ShipAddress")
  private String shipAddress;

  @XmlElement(name = "ShipCity")
  private String shipCity;

  @XmlElement(name = "ShipRegion")
  private String shipRegion;

  @XmlElement(name = "ShipPostalCode")
  private String shipPostalCode;

  @XmlElement(name = "ShipCountry")
  private String shipCountry;

  @XmlElement(name = "ShippedDate")
  private String shippedDate;

  public ShipInfo() {}

  public ShipInfo(
      String shipVia,
      Double freight,
      String shipName,
      String shipAddress,
      String shipCity,
      String shipRegion,
      String shipPostalCode,
      String shipCountry,
      String shippedDate) {
    this.freight = freight;
    this.shipName = shipName;
    this.shipAddress = shipAddress;
    this.shipCity = shipCity;
    this.shipRegion = shipRegion;
    this.shipPostalCode = shipPostalCode;
    this.shipCountry = shipCountry;
    this.shippedDate = shippedDate;
  }

  public String getShipVia() {
    return shipVia;
  }

  public void setShipVia(String value) {
    this.shipVia = value;
  }

  public Double getFreight() {
    return freight;
  }

  public void setFreight(Double value) {
    this.freight = value;
  }

  public String getShipName() {
    return shipName;
  }

  public void setShipName(String value) {
    this.shipName = value;
  }

  public String getShipAddress() {
    return shipAddress;
  }

  public void setShipAddress(String value) {
    this.shipAddress = value;
  }

  public String getShipCity() {
    return shipCity;
  }

  public void setShipCity(String value) {
    this.shipCity = value;
  }

  public String getShipRegion() {
    return shipRegion;
  }

  public void setShipRegion(String value) {
    this.shipRegion = value;
  }

  public String getShipPostalCode() {
    return shipPostalCode;
  }

  public void setShipPostalCode(String value) {
    this.shipPostalCode = value;
  }

  public String getShipCountry() {
    return shipCountry;
  }

  public void setShipCountry(String value) {
    this.shipCountry = value;
  }

  public String getShippedDate() {
    return shippedDate;
  }

  public void setShippedDate(String value) {
    this.shippedDate = value;
  }
}
