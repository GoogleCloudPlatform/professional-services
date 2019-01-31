# Copyright 2018 Google LLC. This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreements with Google.

require 'treetop'
require 'f5map/node_extensions'
module F5map
  ##
  # The f5 configuration parser.
  class Parser
    # Load the grammar
    Treetop.load(File.expand_path('../f5.treetop', __FILE__))
    @@parser = F5PersistParser.new

    def self.parse(data)
      tree = @@parser.parse(data)
      # self.clean_tree!(tree)
      tree
    end

    def self.parser
      @@parser
    end

    private

    # Would be nice to make this functional instead of imperative.
    def self.clean_tree!(root_node)
      return if root_node.elements.nil?
      root_node.elements.delete_if { |node| node.class.name == "Treetop::Runtime::SyntaxNode" }
      root_node.elements.each {|node| self.clean_tree!(node) }
    end
  end
end
