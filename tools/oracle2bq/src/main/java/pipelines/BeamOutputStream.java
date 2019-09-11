package pipelines;

import java.io.IOException;
import java.io.OutputStream;
import org.apache.parquet.io.PositionOutputStream;

/**
 * BeamOutputStream class.
 */
public  class BeamOutputStream extends PositionOutputStream {
    private long position = 0;
    private OutputStream outputStream;

    public BeamOutputStream(OutputStream outputStream) {
        this.outputStream = outputStream;
    }

    @Override
    public long getPos() throws IOException {
        return position;
    }

    @Override
    public void write(int b) throws IOException {
        position++;
        outputStream.write(b);
    }

    @Override
    public void write(byte[] b) throws IOException {
        write(b, 0, b.length);
    }

    @Override
    public void write(byte[] b, int off, int len) throws IOException {
        outputStream.write(b, off, len);
        position += len;
    }

    @Override
    public void flush() throws IOException {
        outputStream.flush();
    }

    @Override
    public void close() throws IOException {
        outputStream.close();
    }
}

