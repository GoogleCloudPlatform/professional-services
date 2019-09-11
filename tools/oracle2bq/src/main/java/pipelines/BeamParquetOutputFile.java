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
import java.io.OutputStream;
import org.apache.parquet.io.OutputFile;
import org.apache.parquet.io.PositionOutputStream;

/**
 * BeamParquetOutputFile class.
 */
public  class BeamParquetOutputFile  implements OutputFile {
    private OutputStream outputStream;

    BeamParquetOutputFile(OutputStream outputStream) {
        this.outputStream = outputStream;
    }

    @Override
    public PositionOutputStream create(long l) throws IOException {
        return new BeamOutputStream(outputStream);
    }

    @Override
    public PositionOutputStream createOrOverwrite(long l) throws IOException {
        return new BeamOutputStream(outputStream);
    }

    @Override
    public boolean supportsBlockSize() {
        return false;
    }

    @Override
    public long defaultBlockSize() {
        return 0;
    }
}
