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


package utils;

import org.knowm.xchange.currency.CurrencyPair;

import java.io.Serializable;
import java.util.ArrayList;

/**
 * Exchange Configuration class to support easy add-on of multiple exchanges
 */
public class ExchangeConfiguration implements Serializable {


    private static final long serialVersionUID = 1L;

    /**
     * Configuration internal exchange name used for the bitrich-info framework https://github.com/bitrich-info/xchange-stream
     * Access it via e.g. BitstampStreamingExchange.class.getName()
     * Result = BitstampStreamingExchange
     */
    private String exchange;

    /**
     * Exchange name for BigTable key storage
     * e.g. bitstamp
     */
    private String exchangeKeyName;


    /**
     * List of trading pairs that we will store (e.g. BTC_USD, ETH_EUR...)
     * For every pair we open one websocket
     */
    private ArrayList<CurrencyPair> listOfPairs;


    /**
     * Constructor for exhange
     * @param exchange - Internal exchange name
     * @param exchangeKeyName - Bigtable key exchange name
     * @param listOfPairs - List of trading pairs for exchange
     */
    public ExchangeConfiguration(String exchange, String exchangeKeyName, ArrayList<CurrencyPair> listOfPairs) {
        super();
        this.exchange = exchange;
        this.exchangeKeyName = exchangeKeyName;
        this.listOfPairs = listOfPairs;
    }



    public String getExchange() {
        return exchange;
    }


    public void setExchange(String exchange) {
        this.exchange = exchange;
    }


    public ArrayList<CurrencyPair> getListOfPairs() {
        return listOfPairs;
    }


    public void setListOfPairs(ArrayList<CurrencyPair> listOfPairs) {
        this.listOfPairs = listOfPairs;
    }


    public String getExchangeKeyName() {
        return exchangeKeyName;
    }


    public void setExchangeKeyName(String exchangeKeyName) {
        this.exchangeKeyName = exchangeKeyName;
    }


}