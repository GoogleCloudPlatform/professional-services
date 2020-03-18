package util;

import java.util.LinkedList;
import java.util.List;

public class BashOutput {
    int status;
    List<String> output;
    List<String> error;

    public BashOutput(){
        output = new LinkedList<>();
        error = new LinkedList<>();
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public List<String> getOutput() {
        return output;
    }

    public void setOutput(List<String> output) {
        this.output = output;
    }

    public List<String> getError() {
        return error;
    }

    public void setError(List<String> error) {
        this.error = error;
    }
}