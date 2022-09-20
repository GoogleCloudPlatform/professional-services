package com.google.cloud.sandbox;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest (
	properties = {"project.parent.id=folder/1234" }
)

class SandboxApplicationTests {

	@Test
	void contextLoads() {
	}

}
