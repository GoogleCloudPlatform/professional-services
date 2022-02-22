/*
   Copyright 2022 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
using System;
using System.IO;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NLog;
using NLog.Extensions.Logging;
using CommandLine;

#nullable enable
namespace GSnapshot {
  class Program {
    private static IServiceProvider BuildDI(IConfiguration config,
                                            Microsoft.Extensions.Logging.LogLevel logLevel) {
            return new ServiceCollection()
                .AddTransient<Runner>() // Runner is the custom class
                .AddLogging(loggingBuilder =>
                {
                    // configure Logging with NLog
                    loggingBuilder.ClearProviders();
            loggingBuilder.SetMinimumLevel(logLevel);
            loggingBuilder.AddNLog(config);
    })
                .BuildServiceProvider();
  }

  static void Main(string[] args) {
    CommandLine.Parser.Default.ParseArguments<Options>(args)
        .WithParsed(RunOptions)
        .WithNotParsed(HandleParseError);
  }

  static void HandleParseError(IEnumerable<Error> errs) {
    TextWriter errorWriter = Console.Error;

    errorWriter.WriteLine("Error parsing command line arguments:");
    foreach (var error in errs) {
      errorWriter.WriteLine(error.ToString());
      if (error is CommandLine.MissingGroupOptionError) {
        CommandLine.MissingGroupOptionError optionError =
            (CommandLine.MissingGroupOptionError)error;
        errorWriter.WriteLine("  " + CommandLine.MissingGroupOptionError.ErrorMessage + " (" +
                              optionError.Group + ")");
      }
    }
    System.Environment.Exit(1);
  }

  static void RunOptions(Options opts) {
    var logger = LogManager.GetCurrentClassLogger();
    try {
      var config = new ConfigurationBuilder().Build();
      var logConfig = new NLog.Config.LoggingConfiguration();
      var consoleTarget = new NLog.Targets.ColoredConsoleTarget();
      consoleTarget.Layout = "${longdate} [${level:uppercase=true}] ${message}";

      var highlightRules = new Dictionary<string, NLog.Targets.ConsoleOutputColor> {
        { "level == LogLevel.Information", NLog.Targets.ConsoleOutputColor.NoChange },
        { "level == LogLevel.Debug", NLog.Targets.ConsoleOutputColor.Cyan },
        { "level == LogLevel.Error", NLog.Targets.ConsoleOutputColor.Red },
        { "level == LogLevel.Fatal", NLog.Targets.ConsoleOutputColor.Magenta },
        { "level == LogLevel.Warning", NLog.Targets.ConsoleOutputColor.Yellow },
      };
      foreach (KeyValuePair<string, NLog.Targets.ConsoleOutputColor> entry in highlightRules) {
        var highlightRule = new NLog.Targets.ConsoleRowHighlightingRule();
        highlightRule.Condition = NLog.Conditions.ConditionParser.ParseExpression(entry.Key);
        highlightRule.ForegroundColor = entry.Value;
        consoleTarget.RowHighlightingRules.Add(highlightRule);
      }

      logConfig.AddRule(NLog.LogLevel.Trace, NLog.LogLevel.Fatal, consoleTarget);
      NLog.LogManager.Configuration = logConfig;

      var servicesProvider =
          BuildDI(config, opts.Verbose ? Microsoft.Extensions.Logging.LogLevel.Debug
                                       : Microsoft.Extensions.Logging.LogLevel.Information);
      using (servicesProvider as IDisposable) {
        var runner = servicesProvider.GetRequiredService<Runner>();
        runner.DoAction(opts);
      }
    } catch (Exception ex) {
      logger.Error(ex, "Stopped program because of exception");
      throw;
    } finally {
      LogManager.Shutdown();
    }
  }
}
}
