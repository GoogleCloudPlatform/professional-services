package com.example.dfdl;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;

/**
 *  Initializes components, configurations and services.
 */
@SpringBootApplication
public class ProcessorService {

  @Value("${server.port}")
  String port;

  public static void main(String[] args) {
    SpringApplication.run(ProcessorService.class, args);
  }

  /**
   * Runs on start up. Retrieves all the beans that were created by the {@link ProcessorService}
   */
  @Bean
  public CommandLineRunner commandLineRunner(ApplicationContext ctx) {

    return args -> {
      System.out.println("Service has been initialized in port " + port);
      System.out.println("Beans provided by Spring Boot:");
      String[] beanNames = ctx.getBeanDefinitionNames();
      Arrays.sort(beanNames);
      for (String beanName : beanNames) {
        System.out.println(beanName);
      }
    };
  }
}