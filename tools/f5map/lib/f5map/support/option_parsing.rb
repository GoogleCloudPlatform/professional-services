# Copyright 2018 Google LLC. This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreements with Google.

require 'f5map/version'
require 'f5map/optimist'
require 'socket'

# rubocop:disable Metrics/ModuleLength
module F5map
  module Support
    ##
    # Support methods intended to be mixed into the application class.  These
    # methods are specific to command line parsing.  The model is [GLOBAL
    # OPTIONS] SUBCOMMAND [SUBCOMMAND OPTIONS]
    #
    # Configuration state parsed from options is intended to be stored in a
    # @opts hash and injected into dependencies, like API instances.
    module OptionParsing
      attr_reader :argv, :env, :opts

      ##
      # Reset the @opts instance variable by parsing @argv and @env.  Operates
      # against duplicate copies of the argument vector avoid side effects.
      #
      # @return [Hash<Symbol, String>] Options hash
      def reset_options!
        @opts = parse_options(argv, env)
      end

      ##
      # Parse options using the argument vector and the environment hash as
      # input. Option parsing occurs in two phases, first the global options are
      # parsed. These are the options specified before the subcommand.  The
      # subcommand, if any, is matched, and subcommand specific options are then
      # parsed from the remainder of the argument vector.
      #
      # @param [Array] argv The argument vector, passed to the option parser.
      #
      # @param [Hash] env The environment hash, passed to the option parser to
      #   supply defaults not specified on the command line argument vector.
      #
      # @return [Hash<Symbol, String>] options hash
      def parse_options(argv, env)
        argv_copy = argv.dup
        opts = parse_global_options!(argv_copy, env)
        subcommand = parse_subcommand!(argv_copy)
        opts[:subcommand] = subcommand
        if subcommand
          sub_opts = parse_subcommand_options!(subcommand, argv_copy, env)
          opts.merge!(sub_opts)
        end
        opts
      end

      ##
      # Parse out the global options, the ones specified between the main
      # executable and the subcommand argument.
      #
      # Modifies argv as a side effect, shifting elements from the array until
      # the first unknown option is found, which is assumed to be the subcommand
      # name.
      #
      # @return [Hash<Symbol, String>] Global options
      # rubocop:disable Metrics/MethodLength, Metrics/AbcSize
      def parse_global_options!(argv, env)
        semver = F5map::VERSION
        Optimist.options(argv) do
          stop_on_unknown
          version "f5map #{semver} (c) 2018 Google LLC"
          banner BANNER
          file_msg = 'F5 config file path to load or STDIN {INPUT}'
          opt :input, file_msg, default: env['INPUT'] || 'f5.conf'
          opt :format, 'Format, e.g. json, yaml {FORMAT}', default: env['FORMAT'] || 'json'
          log_msg = 'Log file to write to or keywords STDOUT, STDERR {LOGTO}'
          opt :logto, log_msg, default: env['LOGTO'] || 'STDERR'
          opt :syslog, 'Log to syslog', default: true, conflicts: :logto
          opt :verbose, 'Set log level to INFO'
          opt :debug, 'Set log level to DEBUG'
        end
      end
      # rubocop:enable Metrics/MethodLength, Metrics/AbcSize

      ##
      # Extract the subcommand, if any, from the arguments provided.  Modifies
      # argv as a side effect, shifting the subcommand name if it is present.
      #
      # @return [String] The subcommand name, e.g. 'backup' or 'restore', or
      #   false if no arguments remain in the argument vector.
      def parse_subcommand!(argv)
        argv.shift || false
      end

      ##
      # Parse the subcommand options.  This method branches out because each
      # subcommand can have quite different options, unlike global options which
      # are consistent across all invocations of the application.
      #
      # Modifies argv as a side effect, shifting all options as things are
      # parsed.
      #
      # @return [Hash<Symbol, String>] Subcommand specific options hash
      # rubocop:disable Metrics/MethodLength, Metrics/AbcSize
      def parse_subcommand_options!(subcommand, argv, env)
        case subcommand
        when 'print-irule'
          Optimist.options(argv) do
            banner "#{subcommand} options:"
            opt :rule, 'Rule to print code for. {RULE}', type: :string, default: env['RULE']
            opt :output, 'Write the rule output to a stream or file {OUTPUT}', default: env['RULE'] || 'STDOUT'
          end
        else
          {}
        end
      end
      # rubocop:enable Metrics/MethodLength, Metrics/AbcSize

      BANNER = <<-'EOBANNER'.freeze
usage: f5 [GLOBAL OPTIONS] SUBCOMMAND [ARGS]
Sub Commands:

  irules      Output all irule names (ltm rule config objects).
  pools       Output all pool names (ltm pool config objects).
  virtuals    Output all virtual servers (ltm virtual config objects).
  map         Output a list of all virtual servers including their configured
              target pool and their bound rules.
  print-irule Print the code for a named iRule

Global options: (Note, command line arguments supersede ENV vars in {}'s)
      EOBANNER
    end
  end
end
# rubocop:enable Metrics/ModuleLength
