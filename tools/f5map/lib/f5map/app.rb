# Copyright 2018 Google LLC. This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreements with Google.

# rubocop:disable Style/IndentationWidth
require 'bigip_parse'
require 'f5map'
require 'f5map/optimist'
require 'f5map/parser'
require 'f5map/support'
require 'f5map/support/option_parsing'
require 'f5map/version'
require 'json'
require 'socket'
require 'yaml'

module F5map
##
# The main Application class.  Intended to be instantiated and called with
# using the `run` method.
class App
  # rubocop:enable Style/IndentationWidth
  # include support methods (option handling, logging, I/O helpers)
  include Support
  include Support::OptionParsing

  ##
  # @param [Array] argv The argument vector, passed to the option parser.
  #
  # @param [Hash] env The environment hash, passed to the option parser to
  #   supply defaults not specified on the command line argument vector.
  #
  # @return [Ncio::App] the application instance.
  def initialize(argv = ARGV.dup, env = ENV.to_hash)
    @argv = argv
    @env = env
    reset!
  end

  ##
  # Reset all state associated with this application instance.
  def reset!
    reset_options!
    reset_logging!(opts)
    # Reverse Lookup Cache
    @reverse_lookup_cache = {}
  end

  ##
  # Run the application instance.  This method is responsible for the
  # application lifecycle.  Command line arguments are parsed, unspecified
  # options are read from the environment, and the specified subcommand is
  # executed.
  #
  # @return [Fixnum] the exit code to pass to Kernel.exit in the calling
  #   script.
  # rubocop:disable Metrics/MethodLength
  def run
    case opts[:subcommand]
    when 'help'
      Optimist.educate
    when 'irules'
      config = load_f5_config(map_file_option(opts[:input]))
      $stdout.puts fmt(irules(config))
    when 'pools'
      config = load_f5_config(map_file_option(opts[:input]))
      $stdout.puts fmt(pools(config))
    when 'virtuals'
      config = load_f5_config(map_file_option(opts[:input]))
      $stdout.puts fmt(virtuals(config))
    when 'map'
      config = load_f5_config(map_file_option(opts[:input]))
      $stdout.puts fmt(map_rules(config))
    when 'print-irule'
      if opts[:rule] == ''
        msg = 'Specify a rule name to print using --rule'
        fatal msg
        $stderr.puts msg
        return 1
      end
      config = load_f5_config(map_file_option(opts[:input]))
      if rule_str = irule(opts[:rule], config)
        write_output(fmt_rule(rule_str), map_file_option(opts[:output]))
        info "Wrote output to #{opts[:output]}"
      else
        error "No ltm rule #{opts[:rule]} { ... } block found in config file"
        return 1
      end
    else
      msg = 'Unknown subcommand.  See --help for a list of subcommands.'
      fatal msg
      $stderr.puts msg
      return 1
    end
    return 0
  rescue Exception => e
    msg = "ERROR: #{friendly_error(e)}"
    fatal msg
    $stderr.puts msg
    $stderr.puts e.backtrace if opts[:debug]
    return 1
  end
  # rubocop:enable Metrics/MethodLength

  ##
  # Return a list of irule names
  #
  # @param [BigIParse::Config] config
  #
  # @return [Array<String>] Array of iRule names
  def irules(config)
    # Extract the irules into an Array<BigIParse::Config::Section>
    irules = config.subsections.select {|s| s.header.starts_with?('ltm rule')}
    # Extract the irule names into an Array<String>
    irule_names = irules.collect do |irule|
      # irule.header e.g. "ltm rule API_Issue_v1"
      irule.header.split(/\s+/)[2]
    end
  end

  ##
  # Return the named iRule code as a string with newlines
  #
  # @param [String] name the name of the iRule
  # @param [BigIParse::Config] config
  # @return [String, false] the code defining the named iRule or false if no irule is
  #   found in the configuration.
  def irule(name, config)
    @config_str ||= input_stream(opts[:input]) {|io| io.read }
    re = %r{(?<rule>ltm rule #{name}\s+\{(?<code>.*?)\})\nltm }m
    if md = re.match(@config_str)
      md[:rule]
    else
      false
    end
  end

  ##
  # Return a list of irule names
  # @param [BigIParse::Config] config
  # @return [Array<String>] Array of iRule names
  def pools(config)
    pools = config.subsections.select {|s| s.header.starts_with?('ltm pool')}
    pools.collect do |s|
      # section.header e.g. "ltm pool POOL-10.0.12.237-blackcat-8080"
      s.header.split(/\s+/)[2]
    end
  end

  ##
  # Return a list of virtual servers
  # @param [BigIParse::Config] config
  # @return [Array<String>] Array of iRule names
  def virtuals(config)
    ary = config.subsections.select {|s| s.header.starts_with?('ltm virtual')}
    ary.collect do |s|
      # section.header e.g. "ltm virtual DMZ_Internet_VS"
      s.header.split(/\s+/)[2]
    end
  end

  ##
  # Return a list of virtual servers indicating the target pool and the
  # associated rules.
  #
  # @param [BigIParse::Config] config The F5 configuration instance.  `ltm
  # virtual` sections are extracted to map out the active iRules.
  #
  # @return [Hash<Symbol, <String,Array<String>>] Mapping of the virtual server
  # configuration with keys :virtual, :pool, :rules, :destination and :vip.
  def map_rules(config)
    ary = config.subsections.select {|s| s.header.starts_with?('ltm virtual')}
    ary.collect do |v|
      dest = destination(v)
      vip = dest ? reverse_lookup(dest.split(':').first) : false
      {
        virtual: header_name(v.header),
        pool: pool(v),
        rules: rules(v),
        persist: persist(v),
        destination: dest,
        vip: vip,
      }
    end
  end

  ##
  # Parse a BigIParse::Section#header string to return the name.
  #
  # @return [String]
  def header_name(header)
    header.split(/\s+/).last
  end

  ##
  # Extract the destination associated with the F5 Virtual Server configuration.
  # Returns false if the destination cannot be determined. Some virtual servers,
  # e.g. `DMZ_Internet_VS` contain a VIP of `0.0.0.0:any` which this method will
  # return as `"0.0.0.0:any"`
  #
  # @param [BigIParse::Config::Section] virtual The `ltm virtual` config
  #   section instance.
  #
  # @return [String] the destination associated with the virtual server or false
  # if the destination could not be determined.  For example
  def destination(virtual)
    if md = DESTINATION_RE.match(virtual.content)
      md[:destination]
    else
      false
    end
  end

  ##
  # Extract the pool from a virtual server config object
  def pool(virtual)
    re = /pool\s+(?<pool>[^\s]+)/mx
    if md = re.match(virtual.content)
      md[:pool]
    else
      false
    end
  end

  ##
  # Extract the rules from a virtual server config object
  def rules(virtual)
    # There's surely a better way to do this, but I'm trying to keep the regular
    # expressions simple and clear.
    re = /rules\s+{(?<rules>.*?)}/mx # Match the whole inner block
    rule = /\n\s+(?<rule>[^ \n]+)/mx # Match a single rule inside the block
    if md = re.match(virtual.content)
      md[:rules].scan(rule).flatten
    else
      []
    end
  end

  ##
  # Extract the persistence elements from a virtual server config object
  def persist(virtual)
    # Match to end to parse it out
    re = /persist\s+(.*)/mx
    rv = []
    if md = re.match(virtual.content)
      if ast = Parser.parse(md.to_s.gsub("\n", ' '))
        rv = ast.value[1].each_with_object([]) do |v, m|
          m.concat(v.to_a)
        end
      else
        require 'pry'; binding.pry
        rv
      end
    end
    rv
  end

  ##
  # Given an IP address, perform a reverse DNS lookup to determine the FQDN.
  # This method uses the system configured resolver.
  #
  # @param [String] ip the IP Address to resolve to a DNS name.
  #
  # @return [String] the FQDN(s) of the reverse DNS lookup result or
  # false if no result came back from the DNS system.
  def reverse_lookup(ip)
    # Cache results otherwise we hammer DNS
    if @reverse_lookup_cache[ip]
      return @reverse_lookup_cache[ip]
    end
    fqdn_ary = Socket.getaddrinfo(ip, 0, Socket::AF_UNSPEC, Socket::SOCK_STREAM, nil, Socket::AI_CANONNAME, true).collect { |a| a[2]  }
    # There is always one result, so no need to return an array.
    @reverse_lookup_cache[ip] = fqdn_ary.first
  end

  ##
  # @param [String] input The input IO stream or file path to load.
  #
  # @return [BigIParse::Config]
  def load_f5_config(input)
    # Read the whole input file into a string
    @config_str ||= input_stream(input) {|io| io.read }
    # Parse the string.
    BigIParse::Config.new(@config_str)
  end

  ##
  # Formatted output
  #
  # @param [String] format The format, e.g. 'plain', 'json', or 'yaml'
  #
  # @return [Object] Formatted output string or pass-through object.
  def fmt(obj)
    case opts[:format]
    when 'json'
      JSON.pretty_generate(obj)
    when 'yaml'
      YAML.dump(obj)
    when 'plain'
      obj
    else
      obj
    end
  end

  ##
  # Formatted output for iRule code.  Returns a string.  A potential improvement
  # is to load the format from a template and render the template.
  #
  # @param [String] rule_str The rule code to format.
  # @return [String] the formatted output, e.g. Markdown.
  def fmt_rule(rule_str)
    case opts[:format]
    when 'markdown'
      <<~HEREDOC
        # #{opts[:rule]}
        
        ## Description

        FIXME: Describe the iRule here.

        ## Code
        
        ```
        #{rule_str}
        ```
      HEREDOC
    else
      rule_str
    end
  end

  # regexp to match a destination entry in the `lvm virtual` content
  DESTINATION_RE = %r{destination\s+(?<destination>(?<ip>[^\s]+):(?<protocol>[^\s+]+))}
end
end
