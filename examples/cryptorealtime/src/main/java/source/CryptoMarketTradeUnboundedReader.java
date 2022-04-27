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

package source;

import data.TradeLoad;
import info.bitrich.xchangestream.core.StreamingExchange;
import info.bitrich.xchangestream.core.StreamingExchangeFactory;
import org.apache.beam.sdk.io.UnboundedSource;
import org.apache.beam.sdk.io.UnboundedSource.CheckpointMark;
import org.joda.time.Duration;
import org.joda.time.Instant;
import org.knowm.xchange.currency.CurrencyPair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.util.NoSuchElementException;
import java.util.Queue;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * A CryptoMarketTradeUnboundedReader connection to the exchange
 * A Reader that reads an unbounded amount of input.
 * A given UnboundedReader object will only be accessed by a single thread at once.
 */

public class CryptoMarketTradeUnboundedReader extends UnboundedSource.UnboundedReader<TradeLoad>{

    private static final Logger LOG = LoggerFactory.getLogger(CryptoMarketTradeUnboundedReader.class);

    /**
     * A Source that reads an unbounded amount of input and, because of that, supports some additional operations such as checkpointing, watermarks, and record ids.
     */
    private CryptoMarketTradeUnboundedSource marketSource;

    /**
     * Lastest current tradeload
     */
    private TradeLoad current;

    /**
     * Latest reading timestamp
     */
    private Instant currentTimestamp;

    /**
     * Exchange connection object - used to receive
     */
    private StreamingExchange exchange;

    /**
     * Internal exchange name - e.g. BitstampStreamingExchange
     */
    private String currencyExchangeName;

    /**
     * Bigtable key exchange name - e.g Bitstamp
     */
    private String exchangeNameShort;

    /**
     * Trading pair that we are observing - e.g. BTC_USD
     */
    private CurrencyPair currencyPair;

    /**
     * This queue is provided to us to
     * receive trades from Exchanges so that it can be polled as nextTuple()
     */
    private Queue<TradeLoad> queue;

    /**
     * Create the CryptoMarketTradeUnboundedReader.
     * @param marketSource This is the Dataflow source for the getCurrentSource call
     */
    public CryptoMarketTradeUnboundedReader(CryptoMarketTradeUnboundedSource marketSource,String currencyExchangeName,CurrencyPair currencyPair, String exchangeNameShort) {
        LOG.info("socket to market created");
        this.marketSource = marketSource;
        this.queue = new LinkedBlockingQueue<>();
        this.currencyPair = currencyPair;
        this.currencyExchangeName = currencyExchangeName;
        this.exchangeNameShort =  exchangeNameShort;
    }

    /**
     *
     * Initializes the reader and advances the reader to the first record. If the reader has been restored from a checkpoint then it should advance to the next unread record at the point the checkpoint was taken.
     * This method will be called exactly once. The invocation will occur prior to calling advance() or Source.Reader.getCurrent(). This method may perform expensive operations that are needed to initialize the reader.
     *
     * Returns true if a record was read, false if there is no more input currently available. Future calls to advance() may return true once more data is available. Regardless of the return value of start, start will not be called again on the same UnboundedReader object; it will only be called again when a new reader object is constructed for the same source, e.g. on recovery.
     * @return boolean
     * @throws IOException
     */
    @Override
    public boolean start() throws IOException {
        // Create an exchange connection
         exchange = StreamingExchangeFactory.INSTANCE.createExchange(this.currencyExchangeName);

        // Connect to the Exchange WebSocket API. Blocking wait for the connection.
        exchange.connect().blockingAwait();

        // Subscribe to live trades update.
        exchange.getStreamingMarketDataService()
                .getTrades(this.currencyPair)
                .subscribe(trade -> {
                    LOG.info("Incoming trade: {}" + trade);
                    // create DTO object
                    TradeLoad t1 = new TradeLoad(trade,exchangeNameShort);
                    // put it in the queue
                    queue.offer(t1);
                }, throwable -> {
                    LOG.error("Error in subscribing trades." + throwable);
                });
        // signal next batch
        return advance();
    }

    /**
     * Advances the reader to the next valid record.
     * Returns true if a record was read, false if there is no more input available. Future calls to advance() may return true once more data is available.
     * @return boolean
     * @throws IOException
     */
    @Override
    public boolean advance() throws IOException {
        // TODO Auto-generated method stub
        current = queue.poll();
        currentTimestamp = Instant.now();
        return (current != null);
    }

    /**
     * Returns a timestamp before or at the timestamps of all future elements read by this reader.
     * This can be approximate. If records are read that violate this guarantee, they will be considered late, which will affect how they will be processed. See Window for more information on late data and how to handle it.
     *
     * However, this value should be as late as possible. Downstream windows may not be able to close until this watermark passes their end.
     *
     * For example, a source may know that the records it reads will be in timestamp order. In this case, the watermark can be the timestamp of the last record read. For a source that does not have natural timestamps, timestamps can be set to the time of reading, in which case the watermark is the current clock time.
     *
     * See Window and Trigger for more information on timestamps and watermarks.
     *
     * May be called after advance() or start() has returned false, but not before start() has been called.
     * @return Instant
     */
    @Override
    public Instant getWatermark() {
        return currentTimestamp.minus(new Duration(1));
    }


    /**
     * Returns a UnboundedSource.CheckpointMark representing the progress of this UnboundedReader.
     * If this UnboundedReader does not support checkpoints, it may return a CheckpointMark which does nothing, like:
     *
     *
     *  public UnboundedSource.CheckpointMark getCheckpointMark() {
     *    return new UnboundedSource.CheckpointMark() {
     *      public void finalizeCheckpoint() throws IOException {
     *        // nothing to do
     *      }
     *    };
     *  }
     *
     * All elements read between the last time this method was called (or since this reader was created, if this method has not been called on this reader) until this method is called will be processed together as a bundle. (An element is considered 'read' if it could be returned by a call to Source.Reader.getCurrent().)
     *
     * Once the result of processing those elements and the returned checkpoint have been durably committed, UnboundedSource.CheckpointMark.finalizeCheckpoint() will be called at most once at some later point on the returned UnboundedSource.CheckpointMark object. Checkpoint finalization is best-effort, and checkpoints may not be finalized. If duplicate elements may be produced if checkpoints are not finalized in a timely manner, UnboundedSource.requiresDeduping() should be overridden to return true, and getCurrentRecordId() should be overridden to return unique record IDs.
     *
     * A checkpoint will be committed to durable storage only if all all previous checkpoints produced by the same reader have also been committed.
     *
     * The returned object should not be modified.
     *
     * May not be called before start() has been called.
     * @return CheckpointMark
     */
    @Override
    public CheckpointMark getCheckpointMark() {
        return new UnboundedSource.CheckpointMark() {
            @Override
            public void finalizeCheckpoint() throws IOException {}
        };
    }


    /**
     * Returns the UnboundedSource that created this reader. This will not change over the life of the reader.
     * @return UnboundedSource
     */
    @Override
    public UnboundedSource getCurrentSource() {
        return marketSource;
    }

    /**
     * Returns the value of the data item that was read by the last start() or advance() call. The returned value must be effectively immutable and remain valid indefinitely.
     * Multiple calls to this method without an intervening call to advance() should return the same result.
     * @return TradeLoad
     * @throws NoSuchElementException
     */
    @Override
    public TradeLoad getCurrent() throws NoSuchElementException {
        if (current == null) {
            throw new NoSuchElementException();
        }
        return current;
    }

    /**
     * Returns the timestamp associated with the current data item.
     * If the source does not support timestamps, this should return BoundedWindow.TIMESTAMP_MIN_VALUE.
     *
     * Multiple calls to this method without an intervening call to advance() should return the same result.
     * @return Instant
     * @throws NoSuchElementException
     */
    @Override
    public Instant getCurrentTimestamp() throws NoSuchElementException {
        if (current == null) {
            throw new NoSuchElementException();
        }
        return currentTimestamp;
    }

    /**
     * Closes the reader. The reader cannot be used after this method is called.
     * @throws IOException
     */
    @Override
    public void close() throws IOException {
        // TODO Auto-generated method stub
        exchange.disconnect();

    }

}
