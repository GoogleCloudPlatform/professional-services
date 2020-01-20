package util;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.LinkedList;
import java.util.List;
import java.util.logging.Logger;

public class MyBashExecutor {

    private final static Logger LOGGER = Logger.getLogger(MyBashExecutor.class.getName());

    public static BashOutput executeCommand(String command) throws Exception {

        LOGGER.info("Command execting in bash {}".format(command));
        Process process = Runtime.getRuntime()
                .exec(String.format(command));
        BufferedReader processInputReader =
                new BufferedReader(new InputStreamReader(process.getInputStream()));
        BufferedReader processErrorReader =
                new BufferedReader(new InputStreamReader(process.getErrorStream()));
        int status = process.waitFor();
        BashOutput bashOutput = new BashOutput() ;
        bashOutput.setStatus(status);
        if (status == 0) {
           bashOutput.setOutput(getResult(processInputReader));
        } else {
            bashOutput.setError(getResult(processErrorReader));
        }
        return bashOutput;
    }

    public static List<String> getResult(BufferedReader reader) throws Exception {
        List<String> output = new LinkedList<>();
        String line = reader.readLine();
        while (line != null) {
            output.add(line);
            line = reader.readLine();
        }
        return output;
    }
}
