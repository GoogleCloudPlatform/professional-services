
lib = File.expand_path("../lib", __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require "f5map/version"

Gem::Specification.new do |spec|
  spec.name          = "f5map"
  spec.version       = F5map::VERSION
  spec.authors       = ["Jeff McCune"]
  spec.email         = ["jmccune@google.com"]

  spec.summary       = %q{Parse F5 LTM configuration to map iRules to Services}
  spec.description   = %q{Parse F5 LTM configuration to map iRules to Services}
  spec.homepage      = 'https://github.com/GoogleCloudPlatform/professional-services'

  # Prevent pushing this gem to RubyGems.org. To allow pushes either set the 'allowed_push_host'
  # to allow pushing to a single host or delete this section to allow pushing to any host.
  if spec.respond_to?(:metadata)
    spec.metadata["allowed_push_host"] = "TODO: Set to 'http://mygemserver.com'"
  else
    raise "RubyGems 2.0 or newer is required to protect against " \
      "public gem pushes."
  end

  spec.files         = `git ls-files -z`.split("\x0").reject do |f|
    f.match(%r{^(test|spec|features)/})
  end
  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.16"
  spec.add_development_dependency "rake", "~> 10.0"
  spec.add_development_dependency "rspec", "~> 3.0"
  spec.add_development_dependency 'pry', '~> 0.11.3'
  spec.add_development_dependency 'yard', '~> 0.9.15'
  spec.add_dependency 'bigip_parse', '~> 0.1.0'
  spec.add_dependency 'treetop', '~> 1.6.10'
end
