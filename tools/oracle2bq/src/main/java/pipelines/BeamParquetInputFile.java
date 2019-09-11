/*
 * Copyright (C) 2018 Google Inc.
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

package pipelines;

import java.io.IOException;
import java.nio.channels.Channels;
import java.nio.channels.SeekableByteChannel;
import org.apache.parquet.io.DelegatingSeekableInputStream;
import org.apache.parquet.io.InputFile;
import org.apache.parquet.io.SeekableInputStream;

/**
 * BeamParquetInputFile class.
 */
public class BeamParquetInputFile implements InputFile {

    private SeekableByteChannel seekableByteChannel;

    BeamParquetInputFile(SeekableByteChannel seekableByteChannel) {
        this.seekableByteChannel = seekableByteChannel;
    }

    @Override
    public long getLength() throws IOException {
        return seekableByteChannel.size();
    }

    @Override
    public SeekableInputStream newStream() {
        return new DelegatingSeekableInputStream(Channels.newInputStream(seekableByteChannel)) {

            @Override
            public long getPos() throws IOException {
                return seekableByteChannel.position();
            }

            @Override
            public void seek(long newPos) throws IOException {
                seekableByteChannel.position(newPos);
            }
        };
    }
}
