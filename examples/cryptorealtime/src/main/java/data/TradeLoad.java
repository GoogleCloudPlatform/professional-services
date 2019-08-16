// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package data;

import java.io.Serializable;
import org.knowm.xchange.dto.marketdata.Trade;

/**
 * DTO - Data transfer object to carry to @Trade object and some other information like exchange
 */
public class TradeLoad implements Serializable {

    /**
     * Trade DTO from org.knowm.xchange.dto.marketdata.Trade
     */
    private Trade trade;

    /**
     * Bigtable row key name used for exchange
     */
    private String exchange;

    public Trade getTrade() {
        return trade;
    }

    public void setTrade(Trade trade) {
        this.trade = trade;
    }

    public String getExchange() {
        return exchange;
    }

    public void setExchange(String exchange) {
        this.exchange = exchange;
    }

    /**
     *
     * @param trade - Trade DTO from org.knowm.xchange.dto.marketdata.Trade
     * @param exchange - Bigtable row key name used for exchange
     */
    public TradeLoad(Trade trade, String exchange) {
        super();
        this.trade = trade;
        this.exchange = exchange;
    }

}

