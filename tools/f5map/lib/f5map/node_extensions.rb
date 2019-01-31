# Copyright 2018 Google LLC. This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreements with Google.

# Parser AST node extensions
require 'treetop'
module F5Persist
  module Values
    def values(elements)
      elements.each_with_object([]) do |node, ary|
        if node.respond_to? :value
          ary << node.value
        elsif node.elements
          ary.concat values(node.elements)
        end
      end
    end
  end

  class Block < Treetop::Runtime::SyntaxNode
    include Values
    def value
      values(self.elements)
    end
  end

  class YesNo < Treetop::Runtime::SyntaxNode
    def value
      self.text_value
    end
  end

  class DefaultYesNo < Treetop::Runtime::SyntaxNode
    def value
      ["default", yesno.text_value]
    end
  end

  class TopBlock < Treetop::Runtime::SyntaxNode
    def value
      [identifier.value, block.value]
    end
  end

  class NamedBlock < Treetop::Runtime::SyntaxNode
    def value
      [identifier.value, block.value.each_with_object([]) {|e,m| m.concat e }]
    end
  end

  class StateRemoved < Treetop::Runtime::SyntaxNode
    def value
      'STATE_REMOVED'
    end
  end

  class Identifier < Treetop::Runtime::SyntaxNode
    def value
      self.text_value.to_sym
    end
  end

  class Word < Treetop::Runtime::SyntaxNode
    def value
      self.text_value
    end
  end

  class Space < Treetop::Runtime::SyntaxNode
  end

  class Garbage < Treetop::Runtime::SyntaxNode
  end
end
