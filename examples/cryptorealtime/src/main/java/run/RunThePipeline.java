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

package run;

import com.google.cloud.bigtable.beam.CloudBigtableIO;
import com.google.cloud.bigtable.beam.CloudBigtableScanConfiguration;
import data.TradeLoad;
import info.bitrich.xchangestream.bitfinex.BitfinexStreamingExchange;
import info.bitrich.xchangestream.bitstamp.BitstampStreamingExchange;
import info.bitrich.xchangestream.gemini.GeminiStreamingExchange;
import info.bitrich.xchangestream.hitbtc.HitbtcStreamingExchange;
import info.bitrich.xchangestream.okcoin.OkCoinStreamingExchange;
import info.bitrich.xchangestream.poloniex2.PoloniexStreamingExchange;
import org.apache.beam.runners.dataflow.DataflowRunner;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.Read;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.PCollection;
import org.apache.hadoop.hbase.client.Mutation;
import org.apache.hadoop.hbase.client.Put;
import org.apache.hadoop.hbase.util.Bytes;
import org.joda.time.Instant;
import org.knowm.xchange.currency.CurrencyPair;
import org.knowm.xchange.dto.marketdata.Trade;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import source.CryptoMarketTradeUnboundedSource;
import utils.CloudBigtableCustomOptions;
import utils.ExchangeConfiguration;
import java.util.ArrayList;

public class RunThePipeline {

    private static final Logger LOG = LoggerFactory.getLogger(RunThePipeline.class);

    /**
     * Column family - default
     */
    private static final  byte[] FAMILY = Bytes.toBytes("market");

    /**
     * Mutation for writing the data into BigTable
     * Row key consists of TradingCurrency#Exchange#SystemTimestampEpoch#NanoSystemTime
     * e.g. BTC/USD#Bitfinex#19525192501#63187358085
     *
     * Following information is stored
     * volume - trading volume (may be negative for type ASK on some exchanges)
     * price - current price
     * orderType - BID or ASK
     * market - exchange e.g. bitfinex, bitstamp
     * delta - miliseconds difference between system time and time when the trade was received in dataflow step 2 mutation
     * exchangeTIme - timestamp of trade from exchange
     */
    static final DoFn<TradeLoad, Mutation> MUTATION_TRANSFORM = new DoFn<TradeLoad, Mutation>() {

        @ProcessElement
        public void processElement(DoFn<TradeLoad, Mutation>.ProcessContext c) throws Exception {
            TradeLoad tl = c.element();
            Trade t = tl.getTrade();

            String rowkey =   t.getCurrencyPair().toString()+"#"+tl.getExchange()+"#"+System.currentTimeMillis()+"#"+System.nanoTime();

            long delta =  System.currentTimeMillis() - t.getTimestamp().getTime();

            /**
             * Adds the given element to the main output PCollection, with the given timestamp.
             * Once passed to outputWithTimestamp the element should not be modified in any way.
             *
             * If invoked from DoFn.ProcessElement), the timestamp must not be older than the input element's timestamp minus DoFn.getAllowedTimestampSkew().
             * The output element will be in the same windows as the input element.
             *
             * If invoked from DoFn.StartBundle or DoFn.FinishBundle, this will attempt to use the WindowFn of the input PCollection
             * to determine what windows the element should be in, throwing an exception if the WindowFn attempts to access any information about the input element except for the timestamp.
             *
             * Note: A splittable DoFn is not allowed to output from DoFn.StartBundle or DoFn.FinishBundle methods.
             */
            c.outputWithTimestamp(
                    new Put(Bytes.toBytes(rowkey))
                            .addColumn(FAMILY, Bytes.toBytes("volume"), Bytes.toBytes(t.getOriginalAmount().toString()))
                            .addColumn(FAMILY, Bytes.toBytes("price"), Bytes.toBytes(t.getPrice().toString()))
                            .addColumn(FAMILY, Bytes.toBytes("orderType"), Bytes.toBytes(t.getType().toString()))
                            .addColumn(FAMILY, Bytes.toBytes("market"), Bytes.toBytes(tl.getExchange()))
                            .addColumn(FAMILY, Bytes.toBytes("delta"), Bytes.toBytes( Long.toString(delta)))
                            .addColumn(FAMILY, Bytes.toBytes("exchangeTime"), Bytes.toBytes( Long.toString(t.getTimestamp().getTime()))),
                    Instant.now()
            );
        }
    };

    /**
     * Main entry point // see readme.md on how to run the code
     * @param args - see run.sh for more info
     */
    public static void main(String[] args) {
        CloudBigtableCustomOptions options = PipelineOptionsFactory.fromArgs(args).withValidation().as(CloudBigtableCustomOptions.class);

        CloudBigtableScanConfiguration config =
                new CloudBigtableScanConfiguration.Builder()
                        .withProjectId(options.getBigtableProjectId())
                        .withInstanceId(options.getBigtableInstanceId())
                        .withTableId(options.getBigtableTableId())
                        .build();
        options.setStreaming(true);
        options.setRunner(DataflowRunner.class);
        options.setNumWorkers(2);
        options.setUsePublicIps(true);
        //options.setSubnetwork(); // configure worker location?

        Pipeline p = Pipeline.create(options);
        /**
         * Create Arraylist of ExchangeConfiguration that will be later dispached
         */
        ArrayList<ExchangeConfiguration> allExchanges = new  ArrayList<ExchangeConfiguration>();

        // BITFINEX
        ArrayList<CurrencyPair> bitFinexPair = new  ArrayList<CurrencyPair>();
        bitFinexPair.add(CurrencyPair.BTC_USD);
        bitFinexPair.add(CurrencyPair.ETH_USD);
        bitFinexPair.add(CurrencyPair.XRP_USD);
        bitFinexPair.add(CurrencyPair.BCH_USD);
        /* how to add additional custom pairs?
        bitFinexPair.add(new CurrencyPair("XTZ", "BTC"));*/
        allExchanges.add(new ExchangeConfiguration(BitfinexStreamingExchange.class.getName(),"bitfinex", bitFinexPair));
	/*
        // BITSTAMP
        ArrayList<CurrencyPair> bitStampPair = new  ArrayList<CurrencyPair>();
        bitStampPair.add(CurrencyPair.BTC_USD);
        bitStampPair.add(CurrencyPair.ETH_USD);
        allExchanges.add(new ExchangeConfiguration(BitstampStreamingExchange.class.getName(),"bitStamp", bitStampPair));

        // OkCOIN
        ArrayList<CurrencyPair> okCoinPair = new  ArrayList<CurrencyPair>();
        okCoinPair.add(CurrencyPair.BTC_USD);
        okCoinPair.add(CurrencyPair.ETH_BTC);
        okCoinPair.add(CurrencyPair.ETH_USD);
        okCoinPair.add(CurrencyPair.BCH_BTC);
        allExchanges.add(new ExchangeConfiguration(OkCoinStreamingExchange.class.getName(),"okCoin", okCoinPair));

        // GEMINI
        ArrayList<CurrencyPair> geminiPair = new  ArrayList<CurrencyPair>();
        geminiPair.add(CurrencyPair.BTC_USD);
        geminiPair.add(CurrencyPair.ETH_USD);
        geminiPair.add(CurrencyPair.BTC_EUR);
        allExchanges.add(new ExchangeConfiguration(GeminiStreamingExchange.class.getName(),"gemini", geminiPair));

        // POLONIEX
        ArrayList<CurrencyPair> poloniexPair = new  ArrayList<CurrencyPair>();
        poloniexPair.add(CurrencyPair.BTC_USDT);
        poloniexPair.add(CurrencyPair.XRP_USDT);
        poloniexPair.add(CurrencyPair.ETH_BTC);
        allExchanges.add(new ExchangeConfiguration(PoloniexStreamingExchange.class.getName(),"poloniex", poloniexPair));

        // HitBtc
        ArrayList<CurrencyPair> HitBTCPair = new  ArrayList<CurrencyPair>();
        HitBTCPair.add(CurrencyPair.BTC_USD);
        HitBTCPair.add(CurrencyPair.ETH_USD);
        allExchanges.add(new ExchangeConfiguration(HitbtcStreamingExchange.class.getName(),"hitBTC", HitBTCPair));
	*/
        // Dispatcher
        // 1) iterate all exchanges
        for (ExchangeConfiguration exConf : allExchanges) {
            // 2) iterate all trading pairs and spawn jobs
            for(CurrencyPair cuPair : exConf.getListOfPairs()) {
                PCollection<TradeLoad> ptemp = p.apply(exConf.getExchangeKeyName(),Read.from(new CryptoMarketTradeUnboundedSource(exConf.getExchange(), exConf.getExchangeKeyName(),cuPair)));
                ptemp
                        .apply(cuPair.base.toString()+"-"+cuPair.counter.toString()+" Mut",ParDo.of(MUTATION_TRANSFORM))
                        .apply(cuPair.base.toString()+"-"+cuPair.counter.toString(),CloudBigtableIO.writeToTable(config));
            }
        }

        // run the pipeline
        p.run();
    }
}
