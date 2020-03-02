package e2etest;

import cucumber.api.CucumberOptions;
import cucumber.api.junit.Cucumber;
import org.junit.runner.RunWith;


@RunWith(Cucumber.class)
@CucumberOptions(plugin = "pretty", features = "src/test/resources/e2etest")
public class RunCucumberTest
{
}