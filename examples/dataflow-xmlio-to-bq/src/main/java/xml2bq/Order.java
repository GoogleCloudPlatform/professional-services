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

@XmlRootElement(name = "Order")
@XmlAccessorType(XmlAccessType.FIELD)
public class Order {

  @XmlElement(name = "CustomerID")
  private String customerID;

  @XmlElement(name = "EmployeeID")
  private String employeeID;

  @XmlElement(name = "OrderDate")
  private String orderDate;

  @XmlElement(name = "RequiredDate")
  private String requiredDate;

  @XmlElement(name = "ShipInfo")
  private ShipInfo shipInfo;

  public Order() {}

  public Order(
      String customerID,
      String employeeID,
      String orderDate,
      String requiredDate,
      ShipInfo shipInfo) {
    this.customerID = customerID;
    this.employeeID = employeeID;
    this.orderDate = orderDate;
    this.requiredDate = requiredDate;
    this.shipInfo = shipInfo;
  }

  public String getCustomerID() {
    return customerID;
  }

  public void setCustomerID(String value) {
    this.customerID = value;
  }

  public String getEmployeeID() {
    return employeeID;
  }

  public void setEmployeeID(String value) {
    this.employeeID = value;
  }

  public String getOrderDate() {
    return orderDate;
  }

  public void setOrderDate(String value) {
    this.orderDate = value;
  }

  public String getRequiredDate() {
    return requiredDate;
  }

  public void setRequiredDate(String value) {
    this.requiredDate = value;
  }

  public ShipInfo getShipInfo() {
    return shipInfo;
  }

  public void setShipInfo(ShipInfo value) {
    this.shipInfo = value;
  }
}
