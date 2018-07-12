package com.google.cloud.tools.sce.aurinko.validator;

import static org.junit.Assert.fail;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import com.github.fge.jsonschema.core.exceptions.ProcessingException;
import com.google.cloud.tools.sce.aurinko.validator.Validator;
import com.google.cloud.tools.sce.aurinko.validator.exception.MissingSchemaException;
import com.google.cloud.tools.sce.aurinko.validator.exception.SchemaMessageMismatchException;

import org.junit.Test;

public class ValidatorTest {

    @Test
    public void testGoodSchemaRequired() throws IOException, ProcessingException, MissingSchemaException {
        Validator testValidator = new Validator();
        String fileName = getClass().getResource("/person-right-test.json").getFile();
        // First Read in the the payload file
        byte[] encoded = Files.readAllBytes(Paths.get(fileName));
        // Make it a string
        String payload = new String(encoded); 
        try {
			testValidator.validate(payload, true);
		} catch (SchemaMessageMismatchException e) {
			
			fail();
		}
    }

    @Test
    public void TestMissingSchemaNotRequired() {
        try {
            Validator testValidator = new Validator();
            String testMessage = "{\"msg\":\"Hello\"}";
            testValidator.validate(testMessage, false);
        } catch (Exception e) {
            e.printStackTrace();
            fail();
        }
    }

    @Test(expected = SchemaMessageMismatchException.class)
    public void testBadSchemaRequired() throws IOException, ProcessingException, MissingSchemaException, SchemaMessageMismatchException {
        Validator testValidator = new Validator();
        String fileName = getClass().getResource("/person-wrong-test.json").getFile();
        // First Read in the the payload file
        byte[] encoded = Files.readAllBytes(Paths.get(fileName));
        // Make it a string
        String payload = new String(encoded); 
        testValidator.validate(payload, true);
        
    }


}