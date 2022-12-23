# Copyright 2022 Google, LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from dataclasses import field
from decimal import Decimal
from pydantic.dataclasses import dataclass
from typing import List, Optional
from xsdata.models.datatype import XmlDateTime


@dataclass
class AddressType:
    address: Optional[str] = field(default=None,
                                   metadata={
                                       "name": "Address",
                                       "type": "Element",
                                       "namespace": "",
                                       "required": True,
                                   })
    city: Optional[str] = field(default=None,
                                metadata={
                                    "name": "City",
                                    "type": "Element",
                                    "namespace": "",
                                    "required": True,
                                })
    region: Optional[str] = field(default=None,
                                  metadata={
                                      "name": "Region",
                                      "type": "Element",
                                      "namespace": "",
                                      "required": True,
                                  })
    postal_code: Optional[str] = field(default=None,
                                       metadata={
                                           "name": "PostalCode",
                                           "type": "Element",
                                           "namespace": "",
                                           "required": True,
                                       })
    country: Optional[str] = field(default=None,
                                   metadata={
                                       "name": "Country",
                                       "type": "Element",
                                       "namespace": "",
                                       "required": True,
                                   })
    customer_id: Optional[str] = field(default=None,
                                       metadata={
                                           "name": "CustomerID",
                                           "type": "Attribute",
                                       })


@dataclass
class ShipInfoType:
    ship_via: Optional[int] = field(default=None,
                                    metadata={
                                        "name": "ShipVia",
                                        "type": "Element",
                                        "namespace": "",
                                        "required": True,
                                    })
    freight: Optional[Decimal] = field(default=None,
                                       metadata={
                                           "name": "Freight",
                                           "type": "Element",
                                           "namespace": "",
                                           "required": True,
                                       })
    ship_name: Optional[str] = field(default=None,
                                     metadata={
                                         "name": "ShipName",
                                         "type": "Element",
                                         "namespace": "",
                                         "required": True,
                                     })
    ship_address: Optional[str] = field(default=None,
                                        metadata={
                                            "name": "ShipAddress",
                                            "type": "Element",
                                            "namespace": "",
                                            "required": True,
                                        })
    ship_city: Optional[str] = field(default=None,
                                     metadata={
                                         "name": "ShipCity",
                                         "type": "Element",
                                         "namespace": "",
                                         "required": True,
                                     })
    ship_region: Optional[str] = field(default=None,
                                       metadata={
                                           "name": "ShipRegion",
                                           "type": "Element",
                                           "namespace": "",
                                           "required": True,
                                       })
    ship_postal_code: Optional[str] = field(default=None,
                                            metadata={
                                                "name": "ShipPostalCode",
                                                "type": "Element",
                                                "namespace": "",
                                                "required": True,
                                            })
    ship_country: Optional[str] = field(default=None,
                                        metadata={
                                            "name": "ShipCountry",
                                            "type": "Element",
                                            "namespace": "",
                                            "required": True,
                                        })
    shipped_date: Optional[XmlDateTime] = field(default=None,
                                                metadata={
                                                    "name": "ShippedDate",
                                                    "type": "Attribute",
                                                })


@dataclass
class CustomerType:
    company_name: Optional[str] = field(default=None,
                                        metadata={
                                            "name": "CompanyName",
                                            "type": "Element",
                                            "namespace": "",
                                            "required": True,
                                        })
    contact_name: Optional[str] = field(default=None,
                                        metadata={
                                            "name": "ContactName",
                                            "type": "Element",
                                            "namespace": "",
                                            "required": True,
                                        })
    contact_title: Optional[str] = field(default=None,
                                         metadata={
                                             "name": "ContactTitle",
                                             "type": "Element",
                                             "namespace": "",
                                             "required": True,
                                         })
    phone: Optional[str] = field(default=None,
                                 metadata={
                                     "name": "Phone",
                                     "type": "Element",
                                     "namespace": "",
                                     "required": True,
                                 })
    fax: Optional[str] = field(default=None,
                               metadata={
                                   "name": "Fax",
                                   "type": "Element",
                                   "namespace": "",
                               })
    full_address: Optional[AddressType] = field(default=None,
                                                metadata={
                                                    "name": "FullAddress",
                                                    "type": "Element",
                                                    "namespace": "",
                                                    "required": True,
                                                })
    customer_id: Optional[str] = field(default=None,
                                       metadata={
                                           "name": "CustomerID",
                                           "type": "Attribute",
                                       })


@dataclass
class OrderType:
    customer_id: Optional[str] = field(default=None,
                                       metadata={
                                           "name": "CustomerID",
                                           "type": "Element",
                                           "namespace": "",
                                           "required": True,
                                       })
    employee_id: Optional[str] = field(default=None,
                                       metadata={
                                           "name": "EmployeeID",
                                           "type": "Element",
                                           "namespace": "",
                                           "required": True,
                                       })
    order_date: Optional[XmlDateTime] = field(default=None,
                                              metadata={
                                                  "name": "OrderDate",
                                                  "type": "Element",
                                                  "namespace": "",
                                                  "required": True,
                                              })
    required_date: Optional[XmlDateTime] = field(default=None,
                                                 metadata={
                                                     "name": "RequiredDate",
                                                     "type": "Element",
                                                     "namespace": "",
                                                     "required": True,
                                                 })
    ship_info: Optional[ShipInfoType] = field(default=None,
                                              metadata={
                                                  "name": "ShipInfo",
                                                  "type": "Element",
                                                  "namespace": "",
                                                  "required": True,
                                              })


@dataclass
class RootCustomers:

    class Meta:
        global_type = False

    customer: List[CustomerType] = field(default_factory=list,
                                         metadata={
                                             "name": "Customer",
                                             "type": "Element",
                                             "namespace": "",
                                         })


@dataclass
class RootOrders:

    class Meta:
        global_type = False

    order: List[OrderType] = field(default_factory=list,
                                   metadata={
                                       "name": "Order",
                                       "type": "Element",
                                       "namespace": "",
                                   })


@dataclass
class Root:
    customers: Optional[RootCustomers] = field(default=None,
                                               metadata={
                                                   "name": "Customers",
                                                   "type": "Element",
                                                   "namespace": "",
                                                   "required": True,
                                               })
    orders: Optional[RootOrders] = field(default=None,
                                         metadata={
                                             "name": "Orders",
                                             "type": "Element",
                                             "namespace": "",
                                             "required": True,
                                         })
