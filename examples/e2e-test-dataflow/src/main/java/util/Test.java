/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
