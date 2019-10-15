'use strict';

module.exports = function(acorn) {
  if (acorn.version.substr(0, 1) !== "5") {
    throw new Error("Unsupported acorn version " + acorn.version + ", please use acorn 5");
  }
  var tt = acorn.tokTypes;
  var pp = acorn.Parser.prototype;

  // this is the same parseObj that acorn has with...
  function parseObj(isPattern, refDestructuringErrors) {
    let node = this.startNode(), first = true, propHash = {}
    node.properties = []
    this.next()
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this.expect(tt.comma)
        if (this.afterTrailingComma(tt.braceR)) break
      } else first = false

      let prop = this.startNode(), isGenerator, isAsync, startPos, startLoc
      if (this.options.ecmaVersion >= 6) {
        // ...the spread logic borrowed from babylon :)
        if (this.type === tt.ellipsis) {
          if (isPattern) {
            this.next()
            prop.argument = this.parseIdent()
            this.finishNode(prop, "RestElement")
          } else {
            prop = this.parseSpread(refDestructuringErrors)
          }
          node.properties.push(prop)
          if (this.type === tt.comma) {
            if (isPattern) {
              this.raise(this.start, "Comma is not permitted after the rest element")
            } else if (refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
              refDestructuringErrors.trailingComma = this.start
            }
          }
          continue
        }

        prop.method = false
        prop.shorthand = false
        if (isPattern || refDestructuringErrors) {
          startPos = this.start
          startLoc = this.startLoc
        }
        if (!isPattern)
          isGenerator = this.eat(tt.star)
      }
      this.parsePropertyName(prop)
      if (!isPattern && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
        isAsync = true
        this.parsePropertyName(prop, refDestructuringErrors)
      } else {
        isAsync = false
      }
      this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors)
      if (!isPattern) this.checkPropClash(prop, propHash)
      node.properties.push(this.finishNode(prop, "Property"))
    }
    return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
  }

  const getCheckLVal = origCheckLVal => function (expr, bindingType, checkClashes) {
    if (expr.type == "ObjectPattern") {
      for (let prop of expr.properties)
        this.checkLVal(prop, bindingType, checkClashes)
      return
    } else if (expr.type === "Property") {
      // AssignmentProperty has type == "Property"
      return this.checkLVal(expr.value, bindingType, checkClashes)
    }
    return origCheckLVal.apply(this, arguments)
  }

  acorn.plugins.objectSpread = function objectSpreadPlugin(instance) {
    pp.parseObj = parseObj;
    instance.extend("checkLVal", getCheckLVal)
    instance.extend("toAssignable", nextMethod => function(node, isBinding) {
      if (this.options.ecmaVersion >= 6 && node) {
        if (node.type == "ObjectExpression") {
          node.type = "ObjectPattern"
          for (let prop of node.properties)
            this.toAssignable(prop, isBinding)
          return node
        } else if (node.type === "Property") {
          // AssignmentProperty has type == "Property"
          if (node.kind !== "init") this.raise(node.key.start, "Object pattern can't contain getter or setter")
          return this.toAssignable(node.value, isBinding)
        } else if (node.type === "SpreadElement") {
          node.type = "RestElement"
          return this.toAssignable(node.argument, isBinding)
        }
      }
      return nextMethod.apply(this, arguments)
    })
    instance.extend("checkPatternExport", nextMethod => function(exports, pat) {
      if (pat.type == "ObjectPattern") {
        for (let prop of pat.properties)
          this.checkPatternExport(exports, prop)
        return
      } else if (pat.type === "Property") {
        return this.checkPatternExport(exports, pat.value)
      } else if (pat.type === "RestElement") {
        return this.checkPatternExport(exports, pat.argument)
      }
      nextMethod.apply(this, arguments)
    })
  };

  return acorn;
};
