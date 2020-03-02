package util;

import org.apache.commons.io.FileUtils;

import java.io.File;

public class CompareContent {

    public static boolean compareFiles(String sourceFile1, String sourceFile2) throws Exception {
        return FileUtils.contentEquals(new File(sourceFile1), new File(sourceFile2));
    }

}
