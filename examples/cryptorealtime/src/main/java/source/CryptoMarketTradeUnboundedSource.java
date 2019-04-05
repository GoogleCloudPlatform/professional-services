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
import org.apache.beam.sdk.coders.AvroCoder;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.io.UnboundedSource;
import org.apache.beam.sdk.options.PipelineOptions;
import org.knowm.xchange.currency.CurrencyPair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nullable;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * A Source that reads an unbounded amount of input and, because of that, supports some additional operations such as checkpointing, watermarks, and record ids.
 * Checkpointing allows sources to not re-read the same data again in the case of failures.
 * Watermarks allow for downstream parts of the pipeline to know up to what point in time the data is complete.
 * Record ids allow for efficient deduplication of input records; many streaming sources do not guarantee that a given record will only be read a single time.
 */
public class CryptoMarketTradeUnboundedSource extends UnboundedSource<TradeLoad, UnboundedSource.CheckpointMark> {

    /**
     *
     */
    private static final long serialVersionUID = 2440350551578614912L;
    private static final Logger LOG = LoggerFactory.getLogger(CryptoMarketTradeUnboundedSource.class);


    private String currencyExchangeName;
    private CurrencyPair currencyPair;
    private String exchangeNameShort;

    /**
     * Returns a list of UnboundedSource objects representing the instances of this source that should be used when executing the workflow. Each split should return a separate partition of the input data.
     * For example, for a source reading from a growing directory of files, each split could correspond to a prefix of file names.
     *
     * Some sources are not splittable, such as reading from a single TCP stream. In that case, only a single split should be returned.
     *
     * Some data sources automatically partition their data among readers. For these types of inputs, n identical replicas of the top-level source can be returned.
     *
     * The size of the returned list should be as close to desiredNumSplits as possible, but does not have to match exactly. A low number of splits will limit the amount of parallelism in the source.
     *
     * Throws:
     * java.lang.Exception
     * @param desiredNumSplits
     * @param options
     * @return List
     * @throws Exception
     */
    @Override
    public List<? extends UnboundedSource<TradeLoad, CheckpointMark>> split(int desiredNumSplits, PipelineOptions options)
            throws Exception {
        // TODO Auto-generated method stub
        return Arrays.asList(this);
    }

    /**
     * Create a new UnboundedSource.UnboundedReader to read from this source, resuming from the given checkpoint if present.
     * @param options
     * @param checkpointMark
     * @return UnboundedReader
     * @throws IOException
     */

    @Override
    public UnboundedReader<TradeLoad> createReader(PipelineOptions options, CheckpointMark checkpointMark)
            throws IOException {
        // TODO Auto-generated method stub
        return new CryptoMarketTradeUnboundedReader(this, this.currencyExchangeName, this.currencyPair, this.exchangeNameShort);
    }

    /**
     * Returns a Coder for encoding and decoding the checkpoints for this source.
     * @return Coder
     */

    @Nullable
    @Override
    public Coder<CheckpointMark> getCheckpointMarkCoder() {
        // TODO Auto-generated method stub
        return null;
    }

    /**
     * Returns the Coder to use for the data read from this source.
     * @return Coder
     */
    @Override
    public Coder<TradeLoad> getOutputCoder() {
        return AvroCoder.of(TradeLoad.class);

    }

    /**
     * Constructor
     * @param currencyExchangeName - configuration name
     * @param exchangeNameShort - bigtable rowkey name
     * @param currencyPair - trading pair on exchange
     */
    public CryptoMarketTradeUnboundedSource(String currencyExchangeName, String exchangeNameShort, CurrencyPair currencyPair) {
        this.currencyExchangeName = currencyExchangeName;
        this.currencyPair = currencyPair;
        this.exchangeNameShort = exchangeNameShort;
    }

}


