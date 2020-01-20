package util;

public class Test {
    public static void main(String[] args) throws Exception{
        String doneStateRunning="currentState: JOB_STATE_RUNNING";
        String doneStateDone="currentState: JOB_STATE_DONE";
        long time = 10;
        long startTime= System.currentTimeMillis();
        String jobId="2020-01-16_16_49_00-136536267439716521";
        String command = String.format("gcloud dataflow jobs describe %s", jobId);
        System.out.println(command);
        BashOutput result;
        do {
            result = MyBashExecutor.executeCommand(command);
            System.out.println(result.output.get(2));
            System.out.println((System.currentTimeMillis()-startTime));
            System.out.println((System.currentTimeMillis()-startTime) < time * 60 *1000L );

            Thread.sleep(10000L);
        } while (Utils.checkIfStringIsInList(result.getOutput(), doneStateRunning) &&
                (System.currentTimeMillis()-startTime) < time * 60 *1000L );
    }
}
