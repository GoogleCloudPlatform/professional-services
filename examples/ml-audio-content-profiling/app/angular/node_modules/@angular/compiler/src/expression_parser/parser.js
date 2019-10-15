/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler/src/expression_parser/parser", ["require", "exports", "@angular/compiler/src/chars", "@angular/compiler/src/ml_parser/interpolation_config", "@angular/compiler/src/util", "@angular/compiler/src/expression_parser/ast", "@angular/compiler/src/expression_parser/lexer"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var chars = require("@angular/compiler/src/chars");
    var interpolation_config_1 = require("@angular/compiler/src/ml_parser/interpolation_config");
    var util_1 = require("@angular/compiler/src/util");
    var ast_1 = require("@angular/compiler/src/expression_parser/ast");
    var lexer_1 = require("@angular/compiler/src/expression_parser/lexer");
    var SplitInterpolation = /** @class */ (function () {
        function SplitInterpolation(strings, expressions, offsets) {
            this.strings = strings;
            this.expressions = expressions;
            this.offsets = offsets;
        }
        return SplitInterpolation;
    }());
    exports.SplitInterpolation = SplitInterpolation;
    var TemplateBindingParseResult = /** @class */ (function () {
        function TemplateBindingParseResult(templateBindings, warnings, errors) {
            this.templateBindings = templateBindings;
            this.warnings = warnings;
            this.errors = errors;
        }
        return TemplateBindingParseResult;
    }());
    exports.TemplateBindingParseResult = TemplateBindingParseResult;
    function _createInterpolateRegExp(config) {
        var pattern = util_1.escapeRegExp(config.start) + '([\\s\\S]*?)' + util_1.escapeRegExp(config.end);
        return new RegExp(pattern, 'g');
    }
    var Parser = /** @class */ (function () {
        function Parser(_lexer) {
            this._lexer = _lexer;
            this.errors = [];
        }
        Parser.prototype.parseAction = function (input, location, interpolationConfig) {
            if (interpolationConfig === void 0) { interpolationConfig = interpolation_config_1.DEFAULT_INTERPOLATION_CONFIG; }
            this._checkNoInterpolation(input, location, interpolationConfig);
            var sourceToLex = this._stripComments(input);
            var tokens = this._lexer.tokenize(this._stripComments(input));
            var ast = new _ParseAST(input, location, tokens, sourceToLex.length, true, this.errors, input.length - sourceToLex.length)
                .parseChain();
            return new ast_1.ASTWithSource(ast, input, location, this.errors);
        };
        Parser.prototype.parseBinding = function (input, location, interpolationConfig) {
            if (interpolationConfig === void 0) { interpolationConfig = interpolation_config_1.DEFAULT_INTERPOLATION_CONFIG; }
            var ast = this._parseBindingAst(input, location, interpolationConfig);
            return new ast_1.ASTWithSource(ast, input, location, this.errors);
        };
        Parser.prototype.parseSimpleBinding = function (input, location, interpolationConfig) {
            if (interpolationConfig === void 0) { interpolationConfig = interpolation_config_1.DEFAULT_INTERPOLATION_CONFIG; }
            var ast = this._parseBindingAst(input, location, interpolationConfig);
            var errors = SimpleExpressionChecker.check(ast);
            if (errors.length > 0) {
                this._reportError("Host binding expression cannot contain " + errors.join(' '), input, location);
            }
            return new ast_1.ASTWithSource(ast, input, location, this.errors);
        };
        Parser.prototype._reportError = function (message, input, errLocation, ctxLocation) {
            this.errors.push(new ast_1.ParserError(message, input, errLocation, ctxLocation));
        };
        Parser.prototype._parseBindingAst = function (input, location, interpolationConfig) {
            // Quotes expressions use 3rd-party expression language. We don't want to use
            // our lexer or parser for that, so we check for that ahead of time.
            var quote = this._parseQuote(input, location);
            if (quote != null) {
                return quote;
            }
            this._checkNoInterpolation(input, location, interpolationConfig);
            var sourceToLex = this._stripComments(input);
            var tokens = this._lexer.tokenize(sourceToLex);
            return new _ParseAST(input, location, tokens, sourceToLex.length, false, this.errors, input.length - sourceToLex.length)
                .parseChain();
        };
        Parser.prototype._parseQuote = function (input, location) {
            if (input == null)
                return null;
            var prefixSeparatorIndex = input.indexOf(':');
            if (prefixSeparatorIndex == -1)
                return null;
            var prefix = input.substring(0, prefixSeparatorIndex).trim();
            if (!lexer_1.isIdentifier(prefix))
                return null;
            var uninterpretedExpression = input.substring(prefixSeparatorIndex + 1);
            return new ast_1.Quote(new ast_1.ParseSpan(0, input.length), prefix, uninterpretedExpression, location);
        };
        Parser.prototype.parseTemplateBindings = function (tplKey, tplValue, location) {
            var tokens = this._lexer.tokenize(tplValue);
            return new _ParseAST(tplValue, location, tokens, tplValue.length, false, this.errors, 0)
                .parseTemplateBindings(tplKey);
        };
        Parser.prototype.parseInterpolation = function (input, location, interpolationConfig) {
            if (interpolationConfig === void 0) { interpolationConfig = interpolation_config_1.DEFAULT_INTERPOLATION_CONFIG; }
            var split = this.splitInterpolation(input, location, interpolationConfig);
            if (split == null)
                return null;
            var expressions = [];
            for (var i = 0; i < split.expressions.length; ++i) {
                var expressionText = split.expressions[i];
                var sourceToLex = this._stripComments(expressionText);
                var tokens = this._lexer.tokenize(sourceToLex);
                var ast = new _ParseAST(input, location, tokens, sourceToLex.length, false, this.errors, split.offsets[i] + (expressionText.length - sourceToLex.length))
                    .parseChain();
                expressions.push(ast);
            }
            return new ast_1.ASTWithSource(new ast_1.Interpolation(new ast_1.ParseSpan(0, input == null ? 0 : input.length), split.strings, expressions), input, location, this.errors);
        };
        Parser.prototype.splitInterpolation = function (input, location, interpolationConfig) {
            if (interpolationConfig === void 0) { interpolationConfig = interpolation_config_1.DEFAULT_INTERPOLATION_CONFIG; }
            var regexp = _createInterpolateRegExp(interpolationConfig);
            var parts = input.split(regexp);
            if (parts.length <= 1) {
                return null;
            }
            var strings = [];
            var expressions = [];
            var offsets = [];
            var offset = 0;
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                if (i % 2 === 0) {
                    // fixed string
                    strings.push(part);
                    offset += part.length;
                }
                else if (part.trim().length > 0) {
                    offset += interpolationConfig.start.length;
                    expressions.push(part);
                    offsets.push(offset);
                    offset += part.length + interpolationConfig.end.length;
                }
                else {
                    this._reportError('Blank expressions are not allowed in interpolated strings', input, "at column " + this._findInterpolationErrorColumn(parts, i, interpolationConfig) + " in", location);
                    expressions.push('$implict');
                    offsets.push(offset);
                }
            }
            return new SplitInterpolation(strings, expressions, offsets);
        };
        Parser.prototype.wrapLiteralPrimitive = function (input, location) {
            return new ast_1.ASTWithSource(new ast_1.LiteralPrimitive(new ast_1.ParseSpan(0, input == null ? 0 : input.length), input), input, location, this.errors);
        };
        Parser.prototype._stripComments = function (input) {
            var i = this._commentStart(input);
            return i != null ? input.substring(0, i).trim() : input;
        };
        Parser.prototype._commentStart = function (input) {
            var outerQuote = null;
            for (var i = 0; i < input.length - 1; i++) {
                var char = input.charCodeAt(i);
                var nextChar = input.charCodeAt(i + 1);
                if (char === chars.$SLASH && nextChar == chars.$SLASH && outerQuote == null)
                    return i;
                if (outerQuote === char) {
                    outerQuote = null;
                }
                else if (outerQuote == null && lexer_1.isQuote(char)) {
                    outerQuote = char;
                }
            }
            return null;
        };
        Parser.prototype._checkNoInterpolation = function (input, location, interpolationConfig) {
            var regexp = _createInterpolateRegExp(interpolationConfig);
            var parts = input.split(regexp);
            if (parts.length > 1) {
                this._reportError("Got interpolation (" + interpolationConfig.start + interpolationConfig.end + ") where expression was expected", input, "at column " + this._findInterpolationErrorColumn(parts, 1, interpolationConfig) + " in", location);
            }
        };
        Parser.prototype._findInterpolationErrorColumn = function (parts, partInErrIdx, interpolationConfig) {
            var errLocation = '';
            for (var j = 0; j < partInErrIdx; j++) {
                errLocation += j % 2 === 0 ?
                    parts[j] :
                    "" + interpolationConfig.start + parts[j] + interpolationConfig.end;
            }
            return errLocation.length;
        };
        return Parser;
    }());
    exports.Parser = Parser;
    var _ParseAST = /** @class */ (function () {
        function _ParseAST(input, location, tokens, inputLength, parseAction, errors, offset) {
            this.input = input;
            this.location = location;
            this.tokens = tokens;
            this.inputLength = inputLength;
            this.parseAction = parseAction;
            this.errors = errors;
            this.offset = offset;
            this.rparensExpected = 0;
            this.rbracketsExpected = 0;
            this.rbracesExpected = 0;
            this.index = 0;
        }
        _ParseAST.prototype.peek = function (offset) {
            var i = this.index + offset;
            return i < this.tokens.length ? this.tokens[i] : lexer_1.EOF;
        };
        Object.defineProperty(_ParseAST.prototype, "next", {
            get: function () { return this.peek(0); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(_ParseAST.prototype, "inputIndex", {
            get: function () {
                return (this.index < this.tokens.length) ? this.next.index + this.offset :
                    this.inputLength + this.offset;
            },
            enumerable: true,
            configurable: true
        });
        _ParseAST.prototype.span = function (start) { return new ast_1.ParseSpan(start, this.inputIndex); };
        _ParseAST.prototype.advance = function () { this.index++; };
        _ParseAST.prototype.optionalCharacter = function (code) {
            if (this.next.isCharacter(code)) {
                this.advance();
                return true;
            }
            else {
                return false;
            }
        };
        _ParseAST.prototype.peekKeywordLet = function () { return this.next.isKeywordLet(); };
        _ParseAST.prototype.peekKeywordAs = function () { return this.next.isKeywordAs(); };
        _ParseAST.prototype.expectCharacter = function (code) {
            if (this.optionalCharacter(code))
                return;
            this.error("Missing expected " + String.fromCharCode(code));
        };
        _ParseAST.prototype.optionalOperator = function (op) {
            if (this.next.isOperator(op)) {
                this.advance();
                return true;
            }
            else {
                return false;
            }
        };
        _ParseAST.prototype.expectOperator = function (operator) {
            if (this.optionalOperator(operator))
                return;
            this.error("Missing expected operator " + operator);
        };
        _ParseAST.prototype.expectIdentifierOrKeyword = function () {
            var n = this.next;
            if (!n.isIdentifier() && !n.isKeyword()) {
                this.error("Unexpected token " + n + ", expected identifier or keyword");
                return '';
            }
            this.advance();
            return n.toString();
        };
        _ParseAST.prototype.expectIdentifierOrKeywordOrString = function () {
            var n = this.next;
            if (!n.isIdentifier() && !n.isKeyword() && !n.isString()) {
                this.error("Unexpected token " + n + ", expected identifier, keyword, or string");
                return '';
            }
            this.advance();
            return n.toString();
        };
        _ParseAST.prototype.parseChain = function () {
            var exprs = [];
            var start = this.inputIndex;
            while (this.index < this.tokens.length) {
                var expr = this.parsePipe();
                exprs.push(expr);
                if (this.optionalCharacter(chars.$SEMICOLON)) {
                    if (!this.parseAction) {
                        this.error('Binding expression cannot contain chained expression');
                    }
                    while (this.optionalCharacter(chars.$SEMICOLON)) {
                    } // read all semicolons
                }
                else if (this.index < this.tokens.length) {
                    this.error("Unexpected token '" + this.next + "'");
                }
            }
            if (exprs.length == 0)
                return new ast_1.EmptyExpr(this.span(start));
            if (exprs.length == 1)
                return exprs[0];
            return new ast_1.Chain(this.span(start), exprs);
        };
        _ParseAST.prototype.parsePipe = function () {
            var result = this.parseExpression();
            if (this.optionalOperator('|')) {
                if (this.parseAction) {
                    this.error('Cannot have a pipe in an action expression');
                }
                do {
                    var name_1 = this.expectIdentifierOrKeyword();
                    var args = [];
                    while (this.optionalCharacter(chars.$COLON)) {
                        args.push(this.parseExpression());
                    }
                    result = new ast_1.BindingPipe(this.span(result.span.start), result, name_1, args);
                } while (this.optionalOperator('|'));
            }
            return result;
        };
        _ParseAST.prototype.parseExpression = function () { return this.parseConditional(); };
        _ParseAST.prototype.parseConditional = function () {
            var start = this.inputIndex;
            var result = this.parseLogicalOr();
            if (this.optionalOperator('?')) {
                var yes = this.parsePipe();
                var no = void 0;
                if (!this.optionalCharacter(chars.$COLON)) {
                    var end = this.inputIndex;
                    var expression = this.input.substring(start, end);
                    this.error("Conditional expression " + expression + " requires all 3 expressions");
                    no = new ast_1.EmptyExpr(this.span(start));
                }
                else {
                    no = this.parsePipe();
                }
                return new ast_1.Conditional(this.span(start), result, yes, no);
            }
            else {
                return result;
            }
        };
        _ParseAST.prototype.parseLogicalOr = function () {
            // '||'
            var result = this.parseLogicalAnd();
            while (this.optionalOperator('||')) {
                var right = this.parseLogicalAnd();
                result = new ast_1.Binary(this.span(result.span.start), '||', result, right);
            }
            return result;
        };
        _ParseAST.prototype.parseLogicalAnd = function () {
            // '&&'
            var result = this.parseEquality();
            while (this.optionalOperator('&&')) {
                var right = this.parseEquality();
                result = new ast_1.Binary(this.span(result.span.start), '&&', result, right);
            }
            return result;
        };
        _ParseAST.prototype.parseEquality = function () {
            // '==','!=','===','!=='
            var result = this.parseRelational();
            while (this.next.type == lexer_1.TokenType.Operator) {
                var operator = this.next.strValue;
                switch (operator) {
                    case '==':
                    case '===':
                    case '!=':
                    case '!==':
                        this.advance();
                        var right = this.parseRelational();
                        result = new ast_1.Binary(this.span(result.span.start), operator, result, right);
                        continue;
                }
                break;
            }
            return result;
        };
        _ParseAST.prototype.parseRelational = function () {
            // '<', '>', '<=', '>='
            var result = this.parseAdditive();
            while (this.next.type == lexer_1.TokenType.Operator) {
                var operator = this.next.strValue;
                switch (operator) {
                    case '<':
                    case '>':
                    case '<=':
                    case '>=':
                        this.advance();
                        var right = this.parseAdditive();
                        result = new ast_1.Binary(this.span(result.span.start), operator, result, right);
                        continue;
                }
                break;
            }
            return result;
        };
        _ParseAST.prototype.parseAdditive = function () {
            // '+', '-'
            var result = this.parseMultiplicative();
            while (this.next.type == lexer_1.TokenType.Operator) {
                var operator = this.next.strValue;
                switch (operator) {
                    case '+':
                    case '-':
                        this.advance();
                        var right = this.parseMultiplicative();
                        result = new ast_1.Binary(this.span(result.span.start), operator, result, right);
                        continue;
                }
                break;
            }
            return result;
        };
        _ParseAST.prototype.parseMultiplicative = function () {
            // '*', '%', '/'
            var result = this.parsePrefix();
            while (this.next.type == lexer_1.TokenType.Operator) {
                var operator = this.next.strValue;
                switch (operator) {
                    case '*':
                    case '%':
                    case '/':
                        this.advance();
                        var right = this.parsePrefix();
                        result = new ast_1.Binary(this.span(result.span.start), operator, result, right);
                        continue;
                }
                break;
            }
            return result;
        };
        _ParseAST.prototype.parsePrefix = function () {
            if (this.next.type == lexer_1.TokenType.Operator) {
                var start = this.inputIndex;
                var operator = this.next.strValue;
                var result = void 0;
                switch (operator) {
                    case '+':
                        this.advance();
                        result = this.parsePrefix();
                        return new ast_1.Binary(this.span(start), '-', result, new ast_1.LiteralPrimitive(new ast_1.ParseSpan(start, start), 0));
                    case '-':
                        this.advance();
                        result = this.parsePrefix();
                        return new ast_1.Binary(this.span(start), operator, new ast_1.LiteralPrimitive(new ast_1.ParseSpan(start, start), 0), result);
                    case '!':
                        this.advance();
                        result = this.parsePrefix();
                        return new ast_1.PrefixNot(this.span(start), result);
                }
            }
            return this.parseCallChain();
        };
        _ParseAST.prototype.parseCallChain = function () {
            var result = this.parsePrimary();
            while (true) {
                if (this.optionalCharacter(chars.$PERIOD)) {
                    result = this.parseAccessMemberOrMethodCall(result, false);
                }
                else if (this.optionalOperator('?.')) {
                    result = this.parseAccessMemberOrMethodCall(result, true);
                }
                else if (this.optionalCharacter(chars.$LBRACKET)) {
                    this.rbracketsExpected++;
                    var key = this.parsePipe();
                    this.rbracketsExpected--;
                    this.expectCharacter(chars.$RBRACKET);
                    if (this.optionalOperator('=')) {
                        var value = this.parseConditional();
                        result = new ast_1.KeyedWrite(this.span(result.span.start), result, key, value);
                    }
                    else {
                        result = new ast_1.KeyedRead(this.span(result.span.start), result, key);
                    }
                }
                else if (this.optionalCharacter(chars.$LPAREN)) {
                    this.rparensExpected++;
                    var args = this.parseCallArguments();
                    this.rparensExpected--;
                    this.expectCharacter(chars.$RPAREN);
                    result = new ast_1.FunctionCall(this.span(result.span.start), result, args);
                }
                else if (this.optionalOperator('!')) {
                    result = new ast_1.NonNullAssert(this.span(result.span.start), result);
                }
                else {
                    return result;
                }
            }
        };
        _ParseAST.prototype.parsePrimary = function () {
            var start = this.inputIndex;
            if (this.optionalCharacter(chars.$LPAREN)) {
                this.rparensExpected++;
                var result = this.parsePipe();
                this.rparensExpected--;
                this.expectCharacter(chars.$RPAREN);
                return result;
            }
            else if (this.next.isKeywordNull()) {
                this.advance();
                return new ast_1.LiteralPrimitive(this.span(start), null);
            }
            else if (this.next.isKeywordUndefined()) {
                this.advance();
                return new ast_1.LiteralPrimitive(this.span(start), void 0);
            }
            else if (this.next.isKeywordTrue()) {
                this.advance();
                return new ast_1.LiteralPrimitive(this.span(start), true);
            }
            else if (this.next.isKeywordFalse()) {
                this.advance();
                return new ast_1.LiteralPrimitive(this.span(start), false);
            }
            else if (this.next.isKeywordThis()) {
                this.advance();
                return new ast_1.ImplicitReceiver(this.span(start));
            }
            else if (this.optionalCharacter(chars.$LBRACKET)) {
                this.rbracketsExpected++;
                var elements = this.parseExpressionList(chars.$RBRACKET);
                this.rbracketsExpected--;
                this.expectCharacter(chars.$RBRACKET);
                return new ast_1.LiteralArray(this.span(start), elements);
            }
            else if (this.next.isCharacter(chars.$LBRACE)) {
                return this.parseLiteralMap();
            }
            else if (this.next.isIdentifier()) {
                return this.parseAccessMemberOrMethodCall(new ast_1.ImplicitReceiver(this.span(start)), false);
            }
            else if (this.next.isNumber()) {
                var value = this.next.toNumber();
                this.advance();
                return new ast_1.LiteralPrimitive(this.span(start), value);
            }
            else if (this.next.isString()) {
                var literalValue = this.next.toString();
                this.advance();
                return new ast_1.LiteralPrimitive(this.span(start), literalValue);
            }
            else if (this.index >= this.tokens.length) {
                this.error("Unexpected end of expression: " + this.input);
                return new ast_1.EmptyExpr(this.span(start));
            }
            else {
                this.error("Unexpected token " + this.next);
                return new ast_1.EmptyExpr(this.span(start));
            }
        };
        _ParseAST.prototype.parseExpressionList = function (terminator) {
            var result = [];
            if (!this.next.isCharacter(terminator)) {
                do {
                    result.push(this.parsePipe());
                } while (this.optionalCharacter(chars.$COMMA));
            }
            return result;
        };
        _ParseAST.prototype.parseLiteralMap = function () {
            var keys = [];
            var values = [];
            var start = this.inputIndex;
            this.expectCharacter(chars.$LBRACE);
            if (!this.optionalCharacter(chars.$RBRACE)) {
                this.rbracesExpected++;
                do {
                    var quoted = this.next.isString();
                    var key = this.expectIdentifierOrKeywordOrString();
                    keys.push({ key: key, quoted: quoted });
                    this.expectCharacter(chars.$COLON);
                    values.push(this.parsePipe());
                } while (this.optionalCharacter(chars.$COMMA));
                this.rbracesExpected--;
                this.expectCharacter(chars.$RBRACE);
            }
            return new ast_1.LiteralMap(this.span(start), keys, values);
        };
        _ParseAST.prototype.parseAccessMemberOrMethodCall = function (receiver, isSafe) {
            if (isSafe === void 0) { isSafe = false; }
            var start = receiver.span.start;
            var id = this.expectIdentifierOrKeyword();
            if (this.optionalCharacter(chars.$LPAREN)) {
                this.rparensExpected++;
                var args = this.parseCallArguments();
                this.expectCharacter(chars.$RPAREN);
                this.rparensExpected--;
                var span = this.span(start);
                return isSafe ? new ast_1.SafeMethodCall(span, receiver, id, args) :
                    new ast_1.MethodCall(span, receiver, id, args);
            }
            else {
                if (isSafe) {
                    if (this.optionalOperator('=')) {
                        this.error('The \'?.\' operator cannot be used in the assignment');
                        return new ast_1.EmptyExpr(this.span(start));
                    }
                    else {
                        return new ast_1.SafePropertyRead(this.span(start), receiver, id);
                    }
                }
                else {
                    if (this.optionalOperator('=')) {
                        if (!this.parseAction) {
                            this.error('Bindings cannot contain assignments');
                            return new ast_1.EmptyExpr(this.span(start));
                        }
                        var value = this.parseConditional();
                        return new ast_1.PropertyWrite(this.span(start), receiver, id, value);
                    }
                    else {
                        return new ast_1.PropertyRead(this.span(start), receiver, id);
                    }
                }
            }
        };
        _ParseAST.prototype.parseCallArguments = function () {
            if (this.next.isCharacter(chars.$RPAREN))
                return [];
            var positionals = [];
            do {
                positionals.push(this.parsePipe());
            } while (this.optionalCharacter(chars.$COMMA));
            return positionals;
        };
        /**
         * An identifier, a keyword, a string with an optional `-` in between.
         */
        _ParseAST.prototype.expectTemplateBindingKey = function () {
            var result = '';
            var operatorFound = false;
            do {
                result += this.expectIdentifierOrKeywordOrString();
                operatorFound = this.optionalOperator('-');
                if (operatorFound) {
                    result += '-';
                }
            } while (operatorFound);
            return result.toString();
        };
        // Parses the AST for `<some-tag *tplKey=AST>`
        _ParseAST.prototype.parseTemplateBindings = function (tplKey) {
            var firstBinding = true;
            var bindings = [];
            var warnings = [];
            do {
                var start = this.inputIndex;
                var rawKey = void 0;
                var key = void 0;
                var isVar = false;
                if (firstBinding) {
                    rawKey = key = tplKey;
                    firstBinding = false;
                }
                else {
                    isVar = this.peekKeywordLet();
                    if (isVar)
                        this.advance();
                    rawKey = this.expectTemplateBindingKey();
                    key = isVar ? rawKey : tplKey + rawKey[0].toUpperCase() + rawKey.substring(1);
                    this.optionalCharacter(chars.$COLON);
                }
                var name_2 = null;
                var expression = null;
                if (isVar) {
                    if (this.optionalOperator('=')) {
                        name_2 = this.expectTemplateBindingKey();
                    }
                    else {
                        name_2 = '\$implicit';
                    }
                }
                else if (this.peekKeywordAs()) {
                    this.advance(); // consume `as`
                    name_2 = rawKey;
                    key = this.expectTemplateBindingKey(); // read local var name
                    isVar = true;
                }
                else if (this.next !== lexer_1.EOF && !this.peekKeywordLet()) {
                    var start_1 = this.inputIndex;
                    var ast = this.parsePipe();
                    var source = this.input.substring(start_1 - this.offset, this.inputIndex - this.offset);
                    expression = new ast_1.ASTWithSource(ast, source, this.location, this.errors);
                }
                bindings.push(new ast_1.TemplateBinding(this.span(start), key, isVar, name_2, expression));
                if (this.peekKeywordAs() && !isVar) {
                    var letStart = this.inputIndex;
                    this.advance(); // consume `as`
                    var letName = this.expectTemplateBindingKey(); // read local var name
                    bindings.push(new ast_1.TemplateBinding(this.span(letStart), letName, true, key, null));
                }
                if (!this.optionalCharacter(chars.$SEMICOLON)) {
                    this.optionalCharacter(chars.$COMMA);
                }
            } while (this.index < this.tokens.length);
            return new TemplateBindingParseResult(bindings, warnings, this.errors);
        };
        _ParseAST.prototype.error = function (message, index) {
            if (index === void 0) { index = null; }
            this.errors.push(new ast_1.ParserError(message, this.input, this.locationText(index), this.location));
            this.skip();
        };
        _ParseAST.prototype.locationText = function (index) {
            if (index === void 0) { index = null; }
            if (index == null)
                index = this.index;
            return (index < this.tokens.length) ? "at column " + (this.tokens[index].index + 1) + " in" :
                "at the end of the expression";
        };
        // Error recovery should skip tokens until it encounters a recovery point. skip() treats
        // the end of input and a ';' as unconditionally a recovery point. It also treats ')',
        // '}' and ']' as conditional recovery points if one of calling productions is expecting
        // one of these symbols. This allows skip() to recover from errors such as '(a.) + 1' allowing
        // more of the AST to be retained (it doesn't skip any tokens as the ')' is retained because
        // of the '(' begins an '(' <expr> ')' production). The recovery points of grouping symbols
        // must be conditional as they must be skipped if none of the calling productions are not
        // expecting the closing token else we will never make progress in the case of an
        // extraneous group closing symbol (such as a stray ')'). This is not the case for ';' because
        // parseChain() is always the root production and it expects a ';'.
        // If a production expects one of these token it increments the corresponding nesting count,
        // and then decrements it just prior to checking if the token is in the input.
        _ParseAST.prototype.skip = function () {
            var n = this.next;
            while (this.index < this.tokens.length && !n.isCharacter(chars.$SEMICOLON) &&
                (this.rparensExpected <= 0 || !n.isCharacter(chars.$RPAREN)) &&
                (this.rbracesExpected <= 0 || !n.isCharacter(chars.$RBRACE)) &&
                (this.rbracketsExpected <= 0 || !n.isCharacter(chars.$RBRACKET))) {
                if (this.next.isError()) {
                    this.errors.push(new ast_1.ParserError(this.next.toString(), this.input, this.locationText(), this.location));
                }
                this.advance();
                n = this.next;
            }
        };
        return _ParseAST;
    }());
    exports._ParseAST = _ParseAST;
    var SimpleExpressionChecker = /** @class */ (function () {
        function SimpleExpressionChecker() {
            this.errors = [];
        }
        SimpleExpressionChecker.check = function (ast) {
            var s = new SimpleExpressionChecker();
            ast.visit(s);
            return s.errors;
        };
        SimpleExpressionChecker.prototype.visitImplicitReceiver = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitInterpolation = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitLiteralPrimitive = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitPropertyRead = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitPropertyWrite = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitSafePropertyRead = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitMethodCall = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitSafeMethodCall = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitFunctionCall = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitLiteralArray = function (ast, context) { this.visitAll(ast.expressions); };
        SimpleExpressionChecker.prototype.visitLiteralMap = function (ast, context) { this.visitAll(ast.values); };
        SimpleExpressionChecker.prototype.visitBinary = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitPrefixNot = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitNonNullAssert = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitConditional = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitPipe = function (ast, context) { this.errors.push('pipes'); };
        SimpleExpressionChecker.prototype.visitKeyedRead = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitKeyedWrite = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitAll = function (asts) {
            var _this = this;
            return asts.map(function (node) { return node.visit(_this); });
        };
        SimpleExpressionChecker.prototype.visitChain = function (ast, context) { };
        SimpleExpressionChecker.prototype.visitQuote = function (ast, context) { };
        return SimpleExpressionChecker;
    }());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL2V4cHJlc3Npb25fcGFyc2VyL3BhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILG1EQUFrQztJQUNsQyw2RkFBb0c7SUFDcEcsbURBQXFDO0lBRXJDLG1FQUErWDtJQUMvWCx1RUFBNEU7SUFFNUU7UUFDRSw0QkFBbUIsT0FBaUIsRUFBUyxXQUFxQixFQUFTLE9BQWlCO1lBQXpFLFlBQU8sR0FBUCxPQUFPLENBQVU7WUFBUyxnQkFBVyxHQUFYLFdBQVcsQ0FBVTtZQUFTLFlBQU8sR0FBUCxPQUFPLENBQVU7UUFBRyxDQUFDO1FBQ2xHLHlCQUFDO0lBQUQsQ0FBQyxBQUZELElBRUM7SUFGWSxnREFBa0I7SUFJL0I7UUFDRSxvQ0FDVyxnQkFBbUMsRUFBUyxRQUFrQixFQUM5RCxNQUFxQjtZQURyQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQVMsYUFBUSxHQUFSLFFBQVEsQ0FBVTtZQUM5RCxXQUFNLEdBQU4sTUFBTSxDQUFlO1FBQUcsQ0FBQztRQUN0QyxpQ0FBQztJQUFELENBQUMsQUFKRCxJQUlDO0lBSlksZ0VBQTBCO0lBTXZDLFNBQVMsd0JBQXdCLENBQUMsTUFBMkI7UUFDM0QsSUFBTSxPQUFPLEdBQUcsbUJBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsY0FBYyxHQUFHLG1CQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZGLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRDtRQUdFLGdCQUFvQixNQUFhO1lBQWIsV0FBTSxHQUFOLE1BQU0sQ0FBTztZQUZ6QixXQUFNLEdBQWtCLEVBQUUsQ0FBQztRQUVDLENBQUM7UUFFckMsNEJBQVcsR0FBWCxVQUNJLEtBQWEsRUFBRSxRQUFhLEVBQzVCLG1CQUF1RTtZQUF2RSxvQ0FBQSxFQUFBLHNCQUEyQyxtREFBNEI7WUFDekUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUNqRSxJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9DLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNoRSxJQUFNLEdBQUcsR0FBRyxJQUFJLFNBQVMsQ0FDVCxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUM5RCxLQUFLLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7aUJBQ2pDLFVBQVUsRUFBRSxDQUFDO1lBQzlCLE9BQU8sSUFBSSxtQkFBYSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsNkJBQVksR0FBWixVQUNJLEtBQWEsRUFBRSxRQUFhLEVBQzVCLG1CQUF1RTtZQUF2RSxvQ0FBQSxFQUFBLHNCQUEyQyxtREFBNEI7WUFDekUsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUN4RSxPQUFPLElBQUksbUJBQWEsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVELG1DQUFrQixHQUFsQixVQUNJLEtBQWEsRUFBRSxRQUFnQixFQUMvQixtQkFBdUU7WUFBdkUsb0NBQUEsRUFBQSxzQkFBMkMsbURBQTRCO1lBQ3pFLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDeEUsSUFBTSxNQUFNLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xELElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ3JCLElBQUksQ0FBQyxZQUFZLENBQ2IsNENBQTBDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFHLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQ3BGO1lBQ0QsT0FBTyxJQUFJLG1CQUFhLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFTyw2QkFBWSxHQUFwQixVQUFxQixPQUFlLEVBQUUsS0FBYSxFQUFFLFdBQW1CLEVBQUUsV0FBaUI7WUFDekYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxpQkFBVyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVPLGlDQUFnQixHQUF4QixVQUNJLEtBQWEsRUFBRSxRQUFnQixFQUFFLG1CQUF3QztZQUMzRSw2RUFBNkU7WUFDN0Usb0VBQW9FO1lBQ3BFLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRWhELElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtnQkFDakIsT0FBTyxLQUFLLENBQUM7YUFDZDtZQUVELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDakUsSUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQyxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNqRCxPQUFPLElBQUksU0FBUyxDQUNULEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQy9ELEtBQUssQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQztpQkFDeEMsVUFBVSxFQUFFLENBQUM7UUFDcEIsQ0FBQztRQUVPLDRCQUFXLEdBQW5CLFVBQW9CLEtBQWtCLEVBQUUsUUFBYTtZQUNuRCxJQUFJLEtBQUssSUFBSSxJQUFJO2dCQUFFLE9BQU8sSUFBSSxDQUFDO1lBQy9CLElBQU0sb0JBQW9CLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoRCxJQUFJLG9CQUFvQixJQUFJLENBQUMsQ0FBQztnQkFBRSxPQUFPLElBQUksQ0FBQztZQUM1QyxJQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQy9ELElBQUksQ0FBQyxvQkFBWSxDQUFDLE1BQU0sQ0FBQztnQkFBRSxPQUFPLElBQUksQ0FBQztZQUN2QyxJQUFNLHVCQUF1QixHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDMUUsT0FBTyxJQUFJLFdBQUssQ0FBQyxJQUFJLGVBQVMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRSx1QkFBdUIsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM5RixDQUFDO1FBRUQsc0NBQXFCLEdBQXJCLFVBQXNCLE1BQWMsRUFBRSxRQUFnQixFQUFFLFFBQWE7WUFFbkUsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUMsT0FBTyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztpQkFDbkYscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELG1DQUFrQixHQUFsQixVQUNJLEtBQWEsRUFBRSxRQUFhLEVBQzVCLG1CQUF1RTtZQUF2RSxvQ0FBQSxFQUFBLHNCQUEyQyxtREFBNEI7WUFDekUsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUM1RSxJQUFJLEtBQUssSUFBSSxJQUFJO2dCQUFFLE9BQU8sSUFBSSxDQUFDO1lBRS9CLElBQU0sV0FBVyxHQUFVLEVBQUUsQ0FBQztZQUU5QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQ2pELElBQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLElBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ3hELElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNqRCxJQUFNLEdBQUcsR0FBRyxJQUFJLFNBQVMsQ0FDVCxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUMvRCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQy9ELFVBQVUsRUFBRSxDQUFDO2dCQUM5QixXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3ZCO1lBRUQsT0FBTyxJQUFJLG1CQUFhLENBQ3BCLElBQUksbUJBQWEsQ0FDYixJQUFJLGVBQVMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsRUFDbkYsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELG1DQUFrQixHQUFsQixVQUNJLEtBQWEsRUFBRSxRQUFnQixFQUMvQixtQkFBdUU7WUFBdkUsb0NBQUEsRUFBQSxzQkFBMkMsbURBQTRCO1lBRXpFLElBQU0sTUFBTSxHQUFHLHdCQUF3QixDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDN0QsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsQyxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO2dCQUNyQixPQUFPLElBQUksQ0FBQzthQUNiO1lBQ0QsSUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO1lBQzdCLElBQU0sV0FBVyxHQUFhLEVBQUUsQ0FBQztZQUNqQyxJQUFNLE9BQU8sR0FBYSxFQUFFLENBQUM7WUFDN0IsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3JDLElBQU0sSUFBSSxHQUFXLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDZixlQUFlO29CQUNmLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ25CLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO2lCQUN2QjtxQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUNqQyxNQUFNLElBQUksbUJBQW1CLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztvQkFDM0MsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDckIsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztpQkFDeEQ7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFlBQVksQ0FDYiwyREFBMkQsRUFBRSxLQUFLLEVBQ2xFLGVBQWEsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsbUJBQW1CLENBQUMsUUFBSyxFQUNuRixRQUFRLENBQUMsQ0FBQztvQkFDZCxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUM3QixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2lCQUN0QjthQUNGO1lBQ0QsT0FBTyxJQUFJLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUVELHFDQUFvQixHQUFwQixVQUFxQixLQUFrQixFQUFFLFFBQWE7WUFDcEQsT0FBTyxJQUFJLG1CQUFhLENBQ3BCLElBQUksc0JBQWdCLENBQUMsSUFBSSxlQUFTLENBQUMsQ0FBQyxFQUFFLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFDdEYsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBRU8sK0JBQWMsR0FBdEIsVUFBdUIsS0FBYTtZQUNsQyxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BDLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUMxRCxDQUFDO1FBRU8sOEJBQWEsR0FBckIsVUFBc0IsS0FBYTtZQUNqQyxJQUFJLFVBQVUsR0FBZ0IsSUFBSSxDQUFDO1lBQ25DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDekMsSUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakMsSUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBRXpDLElBQUksSUFBSSxLQUFLLEtBQUssQ0FBQyxNQUFNLElBQUksUUFBUSxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksVUFBVSxJQUFJLElBQUk7b0JBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRXRGLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtvQkFDdkIsVUFBVSxHQUFHLElBQUksQ0FBQztpQkFDbkI7cUJBQU0sSUFBSSxVQUFVLElBQUksSUFBSSxJQUFJLGVBQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDOUMsVUFBVSxHQUFHLElBQUksQ0FBQztpQkFDbkI7YUFDRjtZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVPLHNDQUFxQixHQUE3QixVQUNJLEtBQWEsRUFBRSxRQUFhLEVBQUUsbUJBQXdDO1lBQ3hFLElBQU0sTUFBTSxHQUFHLHdCQUF3QixDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDN0QsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNwQixJQUFJLENBQUMsWUFBWSxDQUNiLHdCQUFzQixtQkFBbUIsQ0FBQyxLQUFLLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxvQ0FBaUMsRUFDMUcsS0FBSyxFQUNMLGVBQWEsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsbUJBQW1CLENBQUMsUUFBSyxFQUNuRixRQUFRLENBQUMsQ0FBQzthQUNmO1FBQ0gsQ0FBQztRQUVPLDhDQUE2QixHQUFyQyxVQUNJLEtBQWUsRUFBRSxZQUFvQixFQUFFLG1CQUF3QztZQUNqRixJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDckIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDckMsV0FBVyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ3hCLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNWLEtBQUcsbUJBQW1CLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxtQkFBbUIsQ0FBQyxHQUFLLENBQUM7YUFDekU7WUFFRCxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUM7UUFDNUIsQ0FBQztRQUNILGFBQUM7SUFBRCxDQUFDLEFBOUxELElBOExDO0lBOUxZLHdCQUFNO0lBZ01uQjtRQU9FLG1CQUNXLEtBQWEsRUFBUyxRQUFhLEVBQVMsTUFBZSxFQUMzRCxXQUFtQixFQUFTLFdBQW9CLEVBQVUsTUFBcUIsRUFDOUUsTUFBYztZQUZmLFVBQUssR0FBTCxLQUFLLENBQVE7WUFBUyxhQUFRLEdBQVIsUUFBUSxDQUFLO1lBQVMsV0FBTSxHQUFOLE1BQU0sQ0FBUztZQUMzRCxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUFTLGdCQUFXLEdBQVgsV0FBVyxDQUFTO1lBQVUsV0FBTSxHQUFOLE1BQU0sQ0FBZTtZQUM5RSxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBVGxCLG9CQUFlLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLHNCQUFpQixHQUFHLENBQUMsQ0FBQztZQUN0QixvQkFBZSxHQUFHLENBQUMsQ0FBQztZQUU1QixVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBS1csQ0FBQztRQUU5Qix3QkFBSSxHQUFKLFVBQUssTUFBYztZQUNqQixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztZQUM5QixPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBRyxDQUFDO1FBQ3ZELENBQUM7UUFFRCxzQkFBSSwyQkFBSTtpQkFBUixjQUFvQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7V0FBQTtRQUUxQyxzQkFBSSxpQ0FBVTtpQkFBZDtnQkFDRSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQy9CLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUM1RSxDQUFDOzs7V0FBQTtRQUVELHdCQUFJLEdBQUosVUFBSyxLQUFhLElBQUksT0FBTyxJQUFJLGVBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVyRSwyQkFBTyxHQUFQLGNBQVksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztRQUUzQixxQ0FBaUIsR0FBakIsVUFBa0IsSUFBWTtZQUM1QixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUMvQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxJQUFJLENBQUM7YUFDYjtpQkFBTTtnQkFDTCxPQUFPLEtBQUssQ0FBQzthQUNkO1FBQ0gsQ0FBQztRQUVELGtDQUFjLEdBQWQsY0FBNEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5RCxpQ0FBYSxHQUFiLGNBQTJCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFNUQsbUNBQWUsR0FBZixVQUFnQixJQUFZO1lBQzFCLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQztnQkFBRSxPQUFPO1lBQ3pDLElBQUksQ0FBQyxLQUFLLENBQUMsc0JBQW9CLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFHLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsb0NBQWdCLEdBQWhCLFVBQWlCLEVBQVU7WUFDekIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDNUIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLE9BQU8sSUFBSSxDQUFDO2FBQ2I7aUJBQU07Z0JBQ0wsT0FBTyxLQUFLLENBQUM7YUFDZDtRQUNILENBQUM7UUFFRCxrQ0FBYyxHQUFkLFVBQWUsUUFBZ0I7WUFDN0IsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDO2dCQUFFLE9BQU87WUFDNUMsSUFBSSxDQUFDLEtBQUssQ0FBQywrQkFBNkIsUUFBVSxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVELDZDQUF5QixHQUF6QjtZQUNFLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDcEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxzQkFBb0IsQ0FBQyxxQ0FBa0MsQ0FBQyxDQUFDO2dCQUNwRSxPQUFPLEVBQUUsQ0FBQzthQUNYO1lBQ0QsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFZLENBQUM7UUFDaEMsQ0FBQztRQUVELHFEQUFpQyxHQUFqQztZQUNFLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDcEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDeEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxzQkFBb0IsQ0FBQyw4Q0FBMkMsQ0FBQyxDQUFDO2dCQUM3RSxPQUFPLEVBQUUsQ0FBQzthQUNYO1lBQ0QsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFZLENBQUM7UUFDaEMsQ0FBQztRQUVELDhCQUFVLEdBQVY7WUFDRSxJQUFNLEtBQUssR0FBVSxFQUFFLENBQUM7WUFDeEIsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUM5QixPQUFPLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Z0JBQ3RDLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDOUIsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFakIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFO29CQUM1QyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTt3QkFDckIsSUFBSSxDQUFDLEtBQUssQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO3FCQUNwRTtvQkFDRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUU7cUJBQ2hELENBQUUsc0JBQXNCO2lCQUMxQjtxQkFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7b0JBQzFDLElBQUksQ0FBQyxLQUFLLENBQUMsdUJBQXFCLElBQUksQ0FBQyxJQUFJLE1BQUcsQ0FBQyxDQUFDO2lCQUMvQzthQUNGO1lBQ0QsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQUUsT0FBTyxJQUFJLGVBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDOUQsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQUUsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkMsT0FBTyxJQUFJLFdBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCw2QkFBUyxHQUFUO1lBQ0UsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3BDLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUM5QixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7b0JBQ3BCLElBQUksQ0FBQyxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztpQkFDMUQ7Z0JBRUQsR0FBRztvQkFDRCxJQUFNLE1BQUksR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztvQkFDOUMsSUFBTSxJQUFJLEdBQVUsRUFBRSxDQUFDO29CQUN2QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUU7d0JBQzNDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7cUJBQ25DO29CQUNELE1BQU0sR0FBRyxJQUFJLGlCQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQzVFLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFFO2FBQ3RDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQztRQUVELG1DQUFlLEdBQWYsY0FBeUIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFMUQsb0NBQWdCLEdBQWhCO1lBQ0UsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUM5QixJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFFckMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQzlCLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxFQUFFLFNBQUssQ0FBQztnQkFDWixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDekMsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDNUIsSUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUNwRCxJQUFJLENBQUMsS0FBSyxDQUFDLDRCQUEwQixVQUFVLGdDQUE2QixDQUFDLENBQUM7b0JBQzlFLEVBQUUsR0FBRyxJQUFJLGVBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7aUJBQ3RDO3FCQUFNO29CQUNMLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7aUJBQ3ZCO2dCQUNELE9BQU8sSUFBSSxpQkFBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUMzRDtpQkFBTTtnQkFDTCxPQUFPLE1BQU0sQ0FBQzthQUNmO1FBQ0gsQ0FBQztRQUVELGtDQUFjLEdBQWQ7WUFDRSxPQUFPO1lBQ1AsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3BDLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNsQyxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3JDLE1BQU0sR0FBRyxJQUFJLFlBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQzthQUN4RTtZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxtQ0FBZSxHQUFmO1lBQ0UsT0FBTztZQUNQLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNsQyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDbEMsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNuQyxNQUFNLEdBQUcsSUFBSSxZQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDeEU7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDO1FBRUQsaUNBQWEsR0FBYjtZQUNFLHdCQUF3QjtZQUN4QixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDcEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxpQkFBUyxDQUFDLFFBQVEsRUFBRTtnQkFDM0MsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQ3BDLFFBQVEsUUFBUSxFQUFFO29CQUNoQixLQUFLLElBQUksQ0FBQztvQkFDVixLQUFLLEtBQUssQ0FBQztvQkFDWCxLQUFLLElBQUksQ0FBQztvQkFDVixLQUFLLEtBQUs7d0JBQ1IsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNmLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQzt3QkFDckMsTUFBTSxHQUFHLElBQUksWUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUMzRSxTQUFTO2lCQUNaO2dCQUNELE1BQU07YUFDUDtZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxtQ0FBZSxHQUFmO1lBQ0UsdUJBQXVCO1lBQ3ZCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNsQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLGlCQUFTLENBQUMsUUFBUSxFQUFFO2dCQUMzQyxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztnQkFDcEMsUUFBUSxRQUFRLEVBQUU7b0JBQ2hCLEtBQUssR0FBRyxDQUFDO29CQUNULEtBQUssR0FBRyxDQUFDO29CQUNULEtBQUssSUFBSSxDQUFDO29CQUNWLEtBQUssSUFBSTt3QkFDUCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2YsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO3dCQUNuQyxNQUFNLEdBQUcsSUFBSSxZQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQzNFLFNBQVM7aUJBQ1o7Z0JBQ0QsTUFBTTthQUNQO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQztRQUVELGlDQUFhLEdBQWI7WUFDRSxXQUFXO1lBQ1gsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDeEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxpQkFBUyxDQUFDLFFBQVEsRUFBRTtnQkFDM0MsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQ3BDLFFBQVEsUUFBUSxFQUFFO29CQUNoQixLQUFLLEdBQUcsQ0FBQztvQkFDVCxLQUFLLEdBQUc7d0JBQ04sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNmLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO3dCQUN2QyxNQUFNLEdBQUcsSUFBSSxZQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQzNFLFNBQVM7aUJBQ1o7Z0JBQ0QsTUFBTTthQUNQO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQztRQUVELHVDQUFtQixHQUFuQjtZQUNFLGdCQUFnQjtZQUNoQixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDaEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxpQkFBUyxDQUFDLFFBQVEsRUFBRTtnQkFDM0MsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQ3BDLFFBQVEsUUFBUSxFQUFFO29CQUNoQixLQUFLLEdBQUcsQ0FBQztvQkFDVCxLQUFLLEdBQUcsQ0FBQztvQkFDVCxLQUFLLEdBQUc7d0JBQ04sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNmLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDL0IsTUFBTSxHQUFHLElBQUksWUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUMzRSxTQUFTO2lCQUNaO2dCQUNELE1BQU07YUFDUDtZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7UUFFRCwrQkFBVyxHQUFYO1lBQ0UsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxpQkFBUyxDQUFDLFFBQVEsRUFBRTtnQkFDeEMsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztnQkFDOUIsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQ3BDLElBQUksTUFBTSxTQUFLLENBQUM7Z0JBQ2hCLFFBQVEsUUFBUSxFQUFFO29CQUNoQixLQUFLLEdBQUc7d0JBQ04sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNmLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7d0JBQzVCLE9BQU8sSUFBSSxZQUFNLENBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksc0JBQWdCLENBQUMsSUFBSSxlQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzNGLEtBQUssR0FBRzt3QkFDTixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2YsTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDNUIsT0FBTyxJQUFJLFlBQU0sQ0FDYixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLHNCQUFnQixDQUFDLElBQUksZUFBUyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDaEYsTUFBTSxDQUFDLENBQUM7b0JBQ2QsS0FBSyxHQUFHO3dCQUNOLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDZixNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUM1QixPQUFPLElBQUksZUFBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQ2xEO2FBQ0Y7WUFDRCxPQUFPLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBRUQsa0NBQWMsR0FBZDtZQUNFLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNqQyxPQUFPLElBQUksRUFBRTtnQkFDWCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ3pDLE1BQU0sR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUU1RDtxQkFBTSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdEMsTUFBTSxHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBRTNEO3FCQUFNLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRTtvQkFDbEQsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7b0JBQ3pCLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7b0JBQ3pCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUN0QyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDOUIsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7d0JBQ3RDLE1BQU0sR0FBRyxJQUFJLGdCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7cUJBQzNFO3lCQUFNO3dCQUNMLE1BQU0sR0FBRyxJQUFJLGVBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO3FCQUNuRTtpQkFFRjtxQkFBTSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ2hELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDdkIsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDdkIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3BDLE1BQU0sR0FBRyxJQUFJLGtCQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFFdkU7cUJBQU0sSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ3JDLE1BQU0sR0FBRyxJQUFJLG1CQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2lCQUVsRTtxQkFBTTtvQkFDTCxPQUFPLE1BQU0sQ0FBQztpQkFDZjthQUNGO1FBQ0gsQ0FBQztRQUVELGdDQUFZLEdBQVo7WUFDRSxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQzlCLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDekMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN2QixJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3BDLE9BQU8sTUFBTSxDQUFDO2FBRWY7aUJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFO2dCQUNwQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxJQUFJLHNCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFFckQ7aUJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEVBQUU7Z0JBQ3pDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZixPQUFPLElBQUksc0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBRXZEO2lCQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRTtnQkFDcEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLE9BQU8sSUFBSSxzQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2FBRXJEO2lCQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBRTtnQkFDckMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLE9BQU8sSUFBSSxzQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBRXREO2lCQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRTtnQkFDcEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLE9BQU8sSUFBSSxzQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFFL0M7aUJBQU0sSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUNsRCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDekIsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN0QyxPQUFPLElBQUksa0JBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBRXJEO2lCQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUMvQyxPQUFPLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQzthQUUvQjtpQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUU7Z0JBQ25DLE9BQU8sSUFBSSxDQUFDLDZCQUE2QixDQUFDLElBQUksc0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBRTFGO2lCQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDL0IsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLE9BQU8sSUFBSSxzQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBRXREO2lCQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDL0IsSUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLE9BQU8sSUFBSSxzQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBRTdEO2lCQUFNLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQ0FBaUMsSUFBSSxDQUFDLEtBQU8sQ0FBQyxDQUFDO2dCQUMxRCxPQUFPLElBQUksZUFBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzthQUN4QztpQkFBTTtnQkFDTCxJQUFJLENBQUMsS0FBSyxDQUFDLHNCQUFvQixJQUFJLENBQUMsSUFBTSxDQUFDLENBQUM7Z0JBQzVDLE9BQU8sSUFBSSxlQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQ3hDO1FBQ0gsQ0FBQztRQUVELHVDQUFtQixHQUFuQixVQUFvQixVQUFrQjtZQUNwQyxJQUFNLE1BQU0sR0FBVSxFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUN0QyxHQUFHO29CQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7aUJBQy9CLFFBQVEsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRTthQUNoRDtZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxtQ0FBZSxHQUFmO1lBQ0UsSUFBTSxJQUFJLEdBQW9CLEVBQUUsQ0FBQztZQUNqQyxJQUFNLE1BQU0sR0FBVSxFQUFFLENBQUM7WUFDekIsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUM5QixJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDMUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN2QixHQUFHO29CQUNELElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3BDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDO29CQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUMsR0FBRyxLQUFBLEVBQUUsTUFBTSxRQUFBLEVBQUMsQ0FBQyxDQUFDO29CQUN6QixJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDbkMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztpQkFDL0IsUUFBUSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUMvQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3JDO1lBQ0QsT0FBTyxJQUFJLGdCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVELGlEQUE2QixHQUE3QixVQUE4QixRQUFhLEVBQUUsTUFBdUI7WUFBdkIsdUJBQUEsRUFBQSxjQUF1QjtZQUNsRSxJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNsQyxJQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztZQUU1QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ3pDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdkIsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3ZCLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzlCLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLG9CQUFjLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDOUMsSUFBSSxnQkFBVSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2FBRTFEO2lCQUFNO2dCQUNMLElBQUksTUFBTSxFQUFFO29CQUNWLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFFO3dCQUM5QixJQUFJLENBQUMsS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7d0JBQ25FLE9BQU8sSUFBSSxlQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO3FCQUN4Qzt5QkFBTTt3QkFDTCxPQUFPLElBQUksc0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7cUJBQzdEO2lCQUNGO3FCQUFNO29CQUNMLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFFO3dCQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTs0QkFDckIsSUFBSSxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDOzRCQUNsRCxPQUFPLElBQUksZUFBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzt5QkFDeEM7d0JBRUQsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7d0JBQ3RDLE9BQU8sSUFBSSxtQkFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztxQkFDakU7eUJBQU07d0JBQ0wsT0FBTyxJQUFJLGtCQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7cUJBQ3pEO2lCQUNGO2FBQ0Y7UUFDSCxDQUFDO1FBRUQsc0NBQWtCLEdBQWxCO1lBQ0UsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO2dCQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ3BELElBQU0sV0FBVyxHQUFVLEVBQUUsQ0FBQztZQUM5QixHQUFHO2dCQUNELFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7YUFDcEMsUUFBUSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQy9DLE9BQU8sV0FBNEIsQ0FBQztRQUN0QyxDQUFDO1FBRUQ7O1dBRUc7UUFDSCw0Q0FBd0IsR0FBeEI7WUFDRSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDaEIsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDO1lBQzFCLEdBQUc7Z0JBQ0QsTUFBTSxJQUFJLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDO2dCQUNuRCxhQUFhLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQyxJQUFJLGFBQWEsRUFBRTtvQkFDakIsTUFBTSxJQUFJLEdBQUcsQ0FBQztpQkFDZjthQUNGLFFBQVEsYUFBYSxFQUFFO1lBRXhCLE9BQU8sTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCw4Q0FBOEM7UUFDOUMseUNBQXFCLEdBQXJCLFVBQXNCLE1BQWM7WUFDbEMsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLElBQU0sUUFBUSxHQUFzQixFQUFFLENBQUM7WUFDdkMsSUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1lBQzlCLEdBQUc7Z0JBQ0QsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztnQkFDOUIsSUFBSSxNQUFNLFNBQVEsQ0FBQztnQkFDbkIsSUFBSSxHQUFHLFNBQVEsQ0FBQztnQkFDaEIsSUFBSSxLQUFLLEdBQVksS0FBSyxDQUFDO2dCQUMzQixJQUFJLFlBQVksRUFBRTtvQkFDaEIsTUFBTSxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUM7b0JBQ3RCLFlBQVksR0FBRyxLQUFLLENBQUM7aUJBQ3RCO3FCQUFNO29CQUNMLEtBQUssR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQzlCLElBQUksS0FBSzt3QkFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzFCLE1BQU0sR0FBRyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztvQkFDekMsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzlFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQ3RDO2dCQUVELElBQUksTUFBSSxHQUFXLElBQU0sQ0FBQztnQkFDMUIsSUFBSSxVQUFVLEdBQXVCLElBQUksQ0FBQztnQkFDMUMsSUFBSSxLQUFLLEVBQUU7b0JBQ1QsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEVBQUU7d0JBQzlCLE1BQUksR0FBRyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztxQkFDeEM7eUJBQU07d0JBQ0wsTUFBSSxHQUFHLFlBQVksQ0FBQztxQkFDckI7aUJBQ0Y7cUJBQU0sSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUU7b0JBQy9CLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFFLGVBQWU7b0JBQ2hDLE1BQUksR0FBRyxNQUFNLENBQUM7b0JBQ2QsR0FBRyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUUsc0JBQXNCO29CQUM5RCxLQUFLLEdBQUcsSUFBSSxDQUFDO2lCQUNkO3FCQUFNLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxXQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLEVBQUU7b0JBQ3RELElBQU0sT0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7b0JBQzlCLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDN0IsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3hGLFVBQVUsR0FBRyxJQUFJLG1CQUFhLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDekU7Z0JBRUQsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLHFCQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNuRixJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRTtvQkFDbEMsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDakMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQW1DLGVBQWU7b0JBQ2pFLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUUsc0JBQXNCO29CQUN4RSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUkscUJBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQU0sQ0FBQyxDQUFDLENBQUM7aUJBQ3JGO2dCQUNELElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFO29CQUM3QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2lCQUN0QzthQUNGLFFBQVEsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtZQUUxQyxPQUFPLElBQUksMEJBQTBCLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUVELHlCQUFLLEdBQUwsVUFBTSxPQUFlLEVBQUUsS0FBeUI7WUFBekIsc0JBQUEsRUFBQSxZQUF5QjtZQUM5QyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLGlCQUFXLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNoRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDZCxDQUFDO1FBRU8sZ0NBQVksR0FBcEIsVUFBcUIsS0FBeUI7WUFBekIsc0JBQUEsRUFBQSxZQUF5QjtZQUM1QyxJQUFJLEtBQUssSUFBSSxJQUFJO2dCQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3RDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxTQUFLLENBQUMsQ0FBQztnQkFDaEQsOEJBQThCLENBQUM7UUFDdkUsQ0FBQztRQUVELHdGQUF3RjtRQUN4RixzRkFBc0Y7UUFDdEYsd0ZBQXdGO1FBQ3hGLDhGQUE4RjtRQUM5Riw0RkFBNEY7UUFDNUYsMkZBQTJGO1FBQzNGLHlGQUF5RjtRQUN6RixpRkFBaUY7UUFDakYsOEZBQThGO1FBQzlGLG1FQUFtRTtRQUVuRSw0RkFBNEY7UUFDNUYsOEVBQThFO1FBQ3RFLHdCQUFJLEdBQVo7WUFDRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztnQkFDbkUsQ0FBQyxJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM1RCxDQUFDLElBQUksQ0FBQyxlQUFlLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzVELENBQUMsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3ZFLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRTtvQkFDdkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxpQkFBVyxDQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2lCQUM5RTtnQkFDRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDZjtRQUNILENBQUM7UUFDSCxnQkFBQztJQUFELENBQUMsQUF4aUJELElBd2lCQztJQXhpQlksOEJBQVM7SUEwaUJ0QjtRQUFBO1lBT0UsV0FBTSxHQUFhLEVBQUUsQ0FBQztRQTJDeEIsQ0FBQztRQWpEUSw2QkFBSyxHQUFaLFVBQWEsR0FBUTtZQUNuQixJQUFNLENBQUMsR0FBRyxJQUFJLHVCQUF1QixFQUFFLENBQUM7WUFDeEMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNiLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNsQixDQUFDO1FBSUQsdURBQXFCLEdBQXJCLFVBQXNCLEdBQXFCLEVBQUUsT0FBWSxJQUFHLENBQUM7UUFFN0Qsb0RBQWtCLEdBQWxCLFVBQW1CLEdBQWtCLEVBQUUsT0FBWSxJQUFHLENBQUM7UUFFdkQsdURBQXFCLEdBQXJCLFVBQXNCLEdBQXFCLEVBQUUsT0FBWSxJQUFHLENBQUM7UUFFN0QsbURBQWlCLEdBQWpCLFVBQWtCLEdBQWlCLEVBQUUsT0FBWSxJQUFHLENBQUM7UUFFckQsb0RBQWtCLEdBQWxCLFVBQW1CLEdBQWtCLEVBQUUsT0FBWSxJQUFHLENBQUM7UUFFdkQsdURBQXFCLEdBQXJCLFVBQXNCLEdBQXFCLEVBQUUsT0FBWSxJQUFHLENBQUM7UUFFN0QsaURBQWUsR0FBZixVQUFnQixHQUFlLEVBQUUsT0FBWSxJQUFHLENBQUM7UUFFakQscURBQW1CLEdBQW5CLFVBQW9CLEdBQW1CLEVBQUUsT0FBWSxJQUFHLENBQUM7UUFFekQsbURBQWlCLEdBQWpCLFVBQWtCLEdBQWlCLEVBQUUsT0FBWSxJQUFHLENBQUM7UUFFckQsbURBQWlCLEdBQWpCLFVBQWtCLEdBQWlCLEVBQUUsT0FBWSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV0RixpREFBZSxHQUFmLFVBQWdCLEdBQWUsRUFBRSxPQUFZLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTdFLDZDQUFXLEdBQVgsVUFBWSxHQUFXLEVBQUUsT0FBWSxJQUFHLENBQUM7UUFFekMsZ0RBQWMsR0FBZCxVQUFlLEdBQWMsRUFBRSxPQUFZLElBQUcsQ0FBQztRQUUvQyxvREFBa0IsR0FBbEIsVUFBbUIsR0FBa0IsRUFBRSxPQUFZLElBQUcsQ0FBQztRQUV2RCxrREFBZ0IsR0FBaEIsVUFBaUIsR0FBZ0IsRUFBRSxPQUFZLElBQUcsQ0FBQztRQUVuRCwyQ0FBUyxHQUFULFVBQVUsR0FBZ0IsRUFBRSxPQUFZLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXhFLGdEQUFjLEdBQWQsVUFBZSxHQUFjLEVBQUUsT0FBWSxJQUFHLENBQUM7UUFFL0MsaURBQWUsR0FBZixVQUFnQixHQUFlLEVBQUUsT0FBWSxJQUFHLENBQUM7UUFFakQsMENBQVEsR0FBUixVQUFTLElBQVc7WUFBcEIsaUJBQTJFO1lBQTVDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFBLElBQUksSUFBSSxPQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSSxDQUFDLEVBQWhCLENBQWdCLENBQUMsQ0FBQztRQUFDLENBQUM7UUFFM0UsNENBQVUsR0FBVixVQUFXLEdBQVUsRUFBRSxPQUFZLElBQUcsQ0FBQztRQUV2Qyw0Q0FBVSxHQUFWLFVBQVcsR0FBVSxFQUFFLE9BQVksSUFBRyxDQUFDO1FBQ3pDLDhCQUFDO0lBQUQsQ0FBQyxBQWxERCxJQWtEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgY2hhcnMgZnJvbSAnLi4vY2hhcnMnO1xuaW1wb3J0IHtERUZBVUxUX0lOVEVSUE9MQVRJT05fQ09ORklHLCBJbnRlcnBvbGF0aW9uQ29uZmlnfSBmcm9tICcuLi9tbF9wYXJzZXIvaW50ZXJwb2xhdGlvbl9jb25maWcnO1xuaW1wb3J0IHtlc2NhcGVSZWdFeHB9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge0FTVCwgQVNUV2l0aFNvdXJjZSwgQXN0VmlzaXRvciwgQmluYXJ5LCBCaW5kaW5nUGlwZSwgQ2hhaW4sIENvbmRpdGlvbmFsLCBFbXB0eUV4cHIsIEZ1bmN0aW9uQ2FsbCwgSW1wbGljaXRSZWNlaXZlciwgSW50ZXJwb2xhdGlvbiwgS2V5ZWRSZWFkLCBLZXllZFdyaXRlLCBMaXRlcmFsQXJyYXksIExpdGVyYWxNYXAsIExpdGVyYWxNYXBLZXksIExpdGVyYWxQcmltaXRpdmUsIE1ldGhvZENhbGwsIE5vbk51bGxBc3NlcnQsIFBhcnNlU3BhbiwgUGFyc2VyRXJyb3IsIFByZWZpeE5vdCwgUHJvcGVydHlSZWFkLCBQcm9wZXJ0eVdyaXRlLCBRdW90ZSwgU2FmZU1ldGhvZENhbGwsIFNhZmVQcm9wZXJ0eVJlYWQsIFRlbXBsYXRlQmluZGluZ30gZnJvbSAnLi9hc3QnO1xuaW1wb3J0IHtFT0YsIExleGVyLCBUb2tlbiwgVG9rZW5UeXBlLCBpc0lkZW50aWZpZXIsIGlzUXVvdGV9IGZyb20gJy4vbGV4ZXInO1xuXG5leHBvcnQgY2xhc3MgU3BsaXRJbnRlcnBvbGF0aW9uIHtcbiAgY29uc3RydWN0b3IocHVibGljIHN0cmluZ3M6IHN0cmluZ1tdLCBwdWJsaWMgZXhwcmVzc2lvbnM6IHN0cmluZ1tdLCBwdWJsaWMgb2Zmc2V0czogbnVtYmVyW10pIHt9XG59XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZUJpbmRpbmdQYXJzZVJlc3VsdCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHRlbXBsYXRlQmluZGluZ3M6IFRlbXBsYXRlQmluZGluZ1tdLCBwdWJsaWMgd2FybmluZ3M6IHN0cmluZ1tdLFxuICAgICAgcHVibGljIGVycm9yczogUGFyc2VyRXJyb3JbXSkge31cbn1cblxuZnVuY3Rpb24gX2NyZWF0ZUludGVycG9sYXRlUmVnRXhwKGNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZyk6IFJlZ0V4cCB7XG4gIGNvbnN0IHBhdHRlcm4gPSBlc2NhcGVSZWdFeHAoY29uZmlnLnN0YXJ0KSArICcoW1xcXFxzXFxcXFNdKj8pJyArIGVzY2FwZVJlZ0V4cChjb25maWcuZW5kKTtcbiAgcmV0dXJuIG5ldyBSZWdFeHAocGF0dGVybiwgJ2cnKTtcbn1cblxuZXhwb3J0IGNsYXNzIFBhcnNlciB7XG4gIHByaXZhdGUgZXJyb3JzOiBQYXJzZXJFcnJvcltdID0gW107XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbGV4ZXI6IExleGVyKSB7fVxuXG4gIHBhcnNlQWN0aW9uKFxuICAgICAgaW5wdXQ6IHN0cmluZywgbG9jYXRpb246IGFueSxcbiAgICAgIGludGVycG9sYXRpb25Db25maWc6IEludGVycG9sYXRpb25Db25maWcgPSBERUZBVUxUX0lOVEVSUE9MQVRJT05fQ09ORklHKTogQVNUV2l0aFNvdXJjZSB7XG4gICAgdGhpcy5fY2hlY2tOb0ludGVycG9sYXRpb24oaW5wdXQsIGxvY2F0aW9uLCBpbnRlcnBvbGF0aW9uQ29uZmlnKTtcbiAgICBjb25zdCBzb3VyY2VUb0xleCA9IHRoaXMuX3N0cmlwQ29tbWVudHMoaW5wdXQpO1xuICAgIGNvbnN0IHRva2VucyA9IHRoaXMuX2xleGVyLnRva2VuaXplKHRoaXMuX3N0cmlwQ29tbWVudHMoaW5wdXQpKTtcbiAgICBjb25zdCBhc3QgPSBuZXcgX1BhcnNlQVNUKFxuICAgICAgICAgICAgICAgICAgICBpbnB1dCwgbG9jYXRpb24sIHRva2Vucywgc291cmNlVG9MZXgubGVuZ3RoLCB0cnVlLCB0aGlzLmVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQubGVuZ3RoIC0gc291cmNlVG9MZXgubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAucGFyc2VDaGFpbigpO1xuICAgIHJldHVybiBuZXcgQVNUV2l0aFNvdXJjZShhc3QsIGlucHV0LCBsb2NhdGlvbiwgdGhpcy5lcnJvcnMpO1xuICB9XG5cbiAgcGFyc2VCaW5kaW5nKFxuICAgICAgaW5wdXQ6IHN0cmluZywgbG9jYXRpb246IGFueSxcbiAgICAgIGludGVycG9sYXRpb25Db25maWc6IEludGVycG9sYXRpb25Db25maWcgPSBERUZBVUxUX0lOVEVSUE9MQVRJT05fQ09ORklHKTogQVNUV2l0aFNvdXJjZSB7XG4gICAgY29uc3QgYXN0ID0gdGhpcy5fcGFyc2VCaW5kaW5nQXN0KGlucHV0LCBsb2NhdGlvbiwgaW50ZXJwb2xhdGlvbkNvbmZpZyk7XG4gICAgcmV0dXJuIG5ldyBBU1RXaXRoU291cmNlKGFzdCwgaW5wdXQsIGxvY2F0aW9uLCB0aGlzLmVycm9ycyk7XG4gIH1cblxuICBwYXJzZVNpbXBsZUJpbmRpbmcoXG4gICAgICBpbnB1dDogc3RyaW5nLCBsb2NhdGlvbjogc3RyaW5nLFxuICAgICAgaW50ZXJwb2xhdGlvbkNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZyA9IERFRkFVTFRfSU5URVJQT0xBVElPTl9DT05GSUcpOiBBU1RXaXRoU291cmNlIHtcbiAgICBjb25zdCBhc3QgPSB0aGlzLl9wYXJzZUJpbmRpbmdBc3QoaW5wdXQsIGxvY2F0aW9uLCBpbnRlcnBvbGF0aW9uQ29uZmlnKTtcbiAgICBjb25zdCBlcnJvcnMgPSBTaW1wbGVFeHByZXNzaW9uQ2hlY2tlci5jaGVjayhhc3QpO1xuICAgIGlmIChlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoXG4gICAgICAgICAgYEhvc3QgYmluZGluZyBleHByZXNzaW9uIGNhbm5vdCBjb250YWluICR7ZXJyb3JzLmpvaW4oJyAnKX1gLCBpbnB1dCwgbG9jYXRpb24pO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEFTVFdpdGhTb3VyY2UoYXN0LCBpbnB1dCwgbG9jYXRpb24sIHRoaXMuZXJyb3JzKTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlcG9ydEVycm9yKG1lc3NhZ2U6IHN0cmluZywgaW5wdXQ6IHN0cmluZywgZXJyTG9jYXRpb246IHN0cmluZywgY3R4TG9jYXRpb24/OiBhbnkpIHtcbiAgICB0aGlzLmVycm9ycy5wdXNoKG5ldyBQYXJzZXJFcnJvcihtZXNzYWdlLCBpbnB1dCwgZXJyTG9jYXRpb24sIGN0eExvY2F0aW9uKSk7XG4gIH1cblxuICBwcml2YXRlIF9wYXJzZUJpbmRpbmdBc3QoXG4gICAgICBpbnB1dDogc3RyaW5nLCBsb2NhdGlvbjogc3RyaW5nLCBpbnRlcnBvbGF0aW9uQ29uZmlnOiBJbnRlcnBvbGF0aW9uQ29uZmlnKTogQVNUIHtcbiAgICAvLyBRdW90ZXMgZXhwcmVzc2lvbnMgdXNlIDNyZC1wYXJ0eSBleHByZXNzaW9uIGxhbmd1YWdlLiBXZSBkb24ndCB3YW50IHRvIHVzZVxuICAgIC8vIG91ciBsZXhlciBvciBwYXJzZXIgZm9yIHRoYXQsIHNvIHdlIGNoZWNrIGZvciB0aGF0IGFoZWFkIG9mIHRpbWUuXG4gICAgY29uc3QgcXVvdGUgPSB0aGlzLl9wYXJzZVF1b3RlKGlucHV0LCBsb2NhdGlvbik7XG5cbiAgICBpZiAocXVvdGUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHF1b3RlO1xuICAgIH1cblxuICAgIHRoaXMuX2NoZWNrTm9JbnRlcnBvbGF0aW9uKGlucHV0LCBsb2NhdGlvbiwgaW50ZXJwb2xhdGlvbkNvbmZpZyk7XG4gICAgY29uc3Qgc291cmNlVG9MZXggPSB0aGlzLl9zdHJpcENvbW1lbnRzKGlucHV0KTtcbiAgICBjb25zdCB0b2tlbnMgPSB0aGlzLl9sZXhlci50b2tlbml6ZShzb3VyY2VUb0xleCk7XG4gICAgcmV0dXJuIG5ldyBfUGFyc2VBU1QoXG4gICAgICAgICAgICAgICBpbnB1dCwgbG9jYXRpb24sIHRva2Vucywgc291cmNlVG9MZXgubGVuZ3RoLCBmYWxzZSwgdGhpcy5lcnJvcnMsXG4gICAgICAgICAgICAgICBpbnB1dC5sZW5ndGggLSBzb3VyY2VUb0xleC5sZW5ndGgpXG4gICAgICAgIC5wYXJzZUNoYWluKCk7XG4gIH1cblxuICBwcml2YXRlIF9wYXJzZVF1b3RlKGlucHV0OiBzdHJpbmd8bnVsbCwgbG9jYXRpb246IGFueSk6IEFTVHxudWxsIHtcbiAgICBpZiAoaW5wdXQgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgcHJlZml4U2VwYXJhdG9ySW5kZXggPSBpbnB1dC5pbmRleE9mKCc6Jyk7XG4gICAgaWYgKHByZWZpeFNlcGFyYXRvckluZGV4ID09IC0xKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBwcmVmaXggPSBpbnB1dC5zdWJzdHJpbmcoMCwgcHJlZml4U2VwYXJhdG9ySW5kZXgpLnRyaW0oKTtcbiAgICBpZiAoIWlzSWRlbnRpZmllcihwcmVmaXgpKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCB1bmludGVycHJldGVkRXhwcmVzc2lvbiA9IGlucHV0LnN1YnN0cmluZyhwcmVmaXhTZXBhcmF0b3JJbmRleCArIDEpO1xuICAgIHJldHVybiBuZXcgUXVvdGUobmV3IFBhcnNlU3BhbigwLCBpbnB1dC5sZW5ndGgpLCBwcmVmaXgsIHVuaW50ZXJwcmV0ZWRFeHByZXNzaW9uLCBsb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVRlbXBsYXRlQmluZGluZ3ModHBsS2V5OiBzdHJpbmcsIHRwbFZhbHVlOiBzdHJpbmcsIGxvY2F0aW9uOiBhbnkpOlxuICAgICAgVGVtcGxhdGVCaW5kaW5nUGFyc2VSZXN1bHQge1xuICAgIGNvbnN0IHRva2VucyA9IHRoaXMuX2xleGVyLnRva2VuaXplKHRwbFZhbHVlKTtcbiAgICByZXR1cm4gbmV3IF9QYXJzZUFTVCh0cGxWYWx1ZSwgbG9jYXRpb24sIHRva2VucywgdHBsVmFsdWUubGVuZ3RoLCBmYWxzZSwgdGhpcy5lcnJvcnMsIDApXG4gICAgICAgIC5wYXJzZVRlbXBsYXRlQmluZGluZ3ModHBsS2V5KTtcbiAgfVxuXG4gIHBhcnNlSW50ZXJwb2xhdGlvbihcbiAgICAgIGlucHV0OiBzdHJpbmcsIGxvY2F0aW9uOiBhbnksXG4gICAgICBpbnRlcnBvbGF0aW9uQ29uZmlnOiBJbnRlcnBvbGF0aW9uQ29uZmlnID0gREVGQVVMVF9JTlRFUlBPTEFUSU9OX0NPTkZJRyk6IEFTVFdpdGhTb3VyY2V8bnVsbCB7XG4gICAgY29uc3Qgc3BsaXQgPSB0aGlzLnNwbGl0SW50ZXJwb2xhdGlvbihpbnB1dCwgbG9jYXRpb24sIGludGVycG9sYXRpb25Db25maWcpO1xuICAgIGlmIChzcGxpdCA9PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IGV4cHJlc3Npb25zOiBBU1RbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcGxpdC5leHByZXNzaW9ucy5sZW5ndGg7ICsraSkge1xuICAgICAgY29uc3QgZXhwcmVzc2lvblRleHQgPSBzcGxpdC5leHByZXNzaW9uc1tpXTtcbiAgICAgIGNvbnN0IHNvdXJjZVRvTGV4ID0gdGhpcy5fc3RyaXBDb21tZW50cyhleHByZXNzaW9uVGV4dCk7XG4gICAgICBjb25zdCB0b2tlbnMgPSB0aGlzLl9sZXhlci50b2tlbml6ZShzb3VyY2VUb0xleCk7XG4gICAgICBjb25zdCBhc3QgPSBuZXcgX1BhcnNlQVNUKFxuICAgICAgICAgICAgICAgICAgICAgIGlucHV0LCBsb2NhdGlvbiwgdG9rZW5zLCBzb3VyY2VUb0xleC5sZW5ndGgsIGZhbHNlLCB0aGlzLmVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgICBzcGxpdC5vZmZzZXRzW2ldICsgKGV4cHJlc3Npb25UZXh0Lmxlbmd0aCAtIHNvdXJjZVRvTGV4Lmxlbmd0aCkpXG4gICAgICAgICAgICAgICAgICAgICAgLnBhcnNlQ2hhaW4oKTtcbiAgICAgIGV4cHJlc3Npb25zLnB1c2goYXN0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IEFTVFdpdGhTb3VyY2UoXG4gICAgICAgIG5ldyBJbnRlcnBvbGF0aW9uKFxuICAgICAgICAgICAgbmV3IFBhcnNlU3BhbigwLCBpbnB1dCA9PSBudWxsID8gMCA6IGlucHV0Lmxlbmd0aCksIHNwbGl0LnN0cmluZ3MsIGV4cHJlc3Npb25zKSxcbiAgICAgICAgaW5wdXQsIGxvY2F0aW9uLCB0aGlzLmVycm9ycyk7XG4gIH1cblxuICBzcGxpdEludGVycG9sYXRpb24oXG4gICAgICBpbnB1dDogc3RyaW5nLCBsb2NhdGlvbjogc3RyaW5nLFxuICAgICAgaW50ZXJwb2xhdGlvbkNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZyA9IERFRkFVTFRfSU5URVJQT0xBVElPTl9DT05GSUcpOiBTcGxpdEludGVycG9sYXRpb25cbiAgICAgIHxudWxsIHtcbiAgICBjb25zdCByZWdleHAgPSBfY3JlYXRlSW50ZXJwb2xhdGVSZWdFeHAoaW50ZXJwb2xhdGlvbkNvbmZpZyk7XG4gICAgY29uc3QgcGFydHMgPSBpbnB1dC5zcGxpdChyZWdleHApO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPD0gMSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHN0cmluZ3M6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgZXhwcmVzc2lvbnM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3Qgb2Zmc2V0czogbnVtYmVyW10gPSBbXTtcbiAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwYXJ0OiBzdHJpbmcgPSBwYXJ0c1tpXTtcbiAgICAgIGlmIChpICUgMiA9PT0gMCkge1xuICAgICAgICAvLyBmaXhlZCBzdHJpbmdcbiAgICAgICAgc3RyaW5ncy5wdXNoKHBhcnQpO1xuICAgICAgICBvZmZzZXQgKz0gcGFydC5sZW5ndGg7XG4gICAgICB9IGVsc2UgaWYgKHBhcnQudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgb2Zmc2V0ICs9IGludGVycG9sYXRpb25Db25maWcuc3RhcnQubGVuZ3RoO1xuICAgICAgICBleHByZXNzaW9ucy5wdXNoKHBhcnQpO1xuICAgICAgICBvZmZzZXRzLnB1c2gob2Zmc2V0KTtcbiAgICAgICAgb2Zmc2V0ICs9IHBhcnQubGVuZ3RoICsgaW50ZXJwb2xhdGlvbkNvbmZpZy5lbmQubGVuZ3RoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoXG4gICAgICAgICAgICAnQmxhbmsgZXhwcmVzc2lvbnMgYXJlIG5vdCBhbGxvd2VkIGluIGludGVycG9sYXRlZCBzdHJpbmdzJywgaW5wdXQsXG4gICAgICAgICAgICBgYXQgY29sdW1uICR7dGhpcy5fZmluZEludGVycG9sYXRpb25FcnJvckNvbHVtbihwYXJ0cywgaSwgaW50ZXJwb2xhdGlvbkNvbmZpZyl9IGluYCxcbiAgICAgICAgICAgIGxvY2F0aW9uKTtcbiAgICAgICAgZXhwcmVzc2lvbnMucHVzaCgnJGltcGxpY3QnKTtcbiAgICAgICAgb2Zmc2V0cy5wdXNoKG9mZnNldCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXcgU3BsaXRJbnRlcnBvbGF0aW9uKHN0cmluZ3MsIGV4cHJlc3Npb25zLCBvZmZzZXRzKTtcbiAgfVxuXG4gIHdyYXBMaXRlcmFsUHJpbWl0aXZlKGlucHV0OiBzdHJpbmd8bnVsbCwgbG9jYXRpb246IGFueSk6IEFTVFdpdGhTb3VyY2Uge1xuICAgIHJldHVybiBuZXcgQVNUV2l0aFNvdXJjZShcbiAgICAgICAgbmV3IExpdGVyYWxQcmltaXRpdmUobmV3IFBhcnNlU3BhbigwLCBpbnB1dCA9PSBudWxsID8gMCA6IGlucHV0Lmxlbmd0aCksIGlucHV0KSwgaW5wdXQsXG4gICAgICAgIGxvY2F0aW9uLCB0aGlzLmVycm9ycyk7XG4gIH1cblxuICBwcml2YXRlIF9zdHJpcENvbW1lbnRzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGkgPSB0aGlzLl9jb21tZW50U3RhcnQoaW5wdXQpO1xuICAgIHJldHVybiBpICE9IG51bGwgPyBpbnB1dC5zdWJzdHJpbmcoMCwgaSkudHJpbSgpIDogaW5wdXQ7XG4gIH1cblxuICBwcml2YXRlIF9jb21tZW50U3RhcnQoaW5wdXQ6IHN0cmluZyk6IG51bWJlcnxudWxsIHtcbiAgICBsZXQgb3V0ZXJRdW90ZTogbnVtYmVyfG51bGwgPSBudWxsO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXQubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICBjb25zdCBjaGFyID0gaW5wdXQuY2hhckNvZGVBdChpKTtcbiAgICAgIGNvbnN0IG5leHRDaGFyID0gaW5wdXQuY2hhckNvZGVBdChpICsgMSk7XG5cbiAgICAgIGlmIChjaGFyID09PSBjaGFycy4kU0xBU0ggJiYgbmV4dENoYXIgPT0gY2hhcnMuJFNMQVNIICYmIG91dGVyUXVvdGUgPT0gbnVsbCkgcmV0dXJuIGk7XG5cbiAgICAgIGlmIChvdXRlclF1b3RlID09PSBjaGFyKSB7XG4gICAgICAgIG91dGVyUXVvdGUgPSBudWxsO1xuICAgICAgfSBlbHNlIGlmIChvdXRlclF1b3RlID09IG51bGwgJiYgaXNRdW90ZShjaGFyKSkge1xuICAgICAgICBvdXRlclF1b3RlID0gY2hhcjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIF9jaGVja05vSW50ZXJwb2xhdGlvbihcbiAgICAgIGlucHV0OiBzdHJpbmcsIGxvY2F0aW9uOiBhbnksIGludGVycG9sYXRpb25Db25maWc6IEludGVycG9sYXRpb25Db25maWcpOiB2b2lkIHtcbiAgICBjb25zdCByZWdleHAgPSBfY3JlYXRlSW50ZXJwb2xhdGVSZWdFeHAoaW50ZXJwb2xhdGlvbkNvbmZpZyk7XG4gICAgY29uc3QgcGFydHMgPSBpbnB1dC5zcGxpdChyZWdleHApO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICBgR290IGludGVycG9sYXRpb24gKCR7aW50ZXJwb2xhdGlvbkNvbmZpZy5zdGFydH0ke2ludGVycG9sYXRpb25Db25maWcuZW5kfSkgd2hlcmUgZXhwcmVzc2lvbiB3YXMgZXhwZWN0ZWRgLFxuICAgICAgICAgIGlucHV0LFxuICAgICAgICAgIGBhdCBjb2x1bW4gJHt0aGlzLl9maW5kSW50ZXJwb2xhdGlvbkVycm9yQ29sdW1uKHBhcnRzLCAxLCBpbnRlcnBvbGF0aW9uQ29uZmlnKX0gaW5gLFxuICAgICAgICAgIGxvY2F0aW9uKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9maW5kSW50ZXJwb2xhdGlvbkVycm9yQ29sdW1uKFxuICAgICAgcGFydHM6IHN0cmluZ1tdLCBwYXJ0SW5FcnJJZHg6IG51bWJlciwgaW50ZXJwb2xhdGlvbkNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZyk6IG51bWJlciB7XG4gICAgbGV0IGVyckxvY2F0aW9uID0gJyc7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBwYXJ0SW5FcnJJZHg7IGorKykge1xuICAgICAgZXJyTG9jYXRpb24gKz0gaiAlIDIgPT09IDAgP1xuICAgICAgICAgIHBhcnRzW2pdIDpcbiAgICAgICAgICBgJHtpbnRlcnBvbGF0aW9uQ29uZmlnLnN0YXJ0fSR7cGFydHNbal19JHtpbnRlcnBvbGF0aW9uQ29uZmlnLmVuZH1gO1xuICAgIH1cblxuICAgIHJldHVybiBlcnJMb2NhdGlvbi5sZW5ndGg7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIF9QYXJzZUFTVCB7XG4gIHByaXZhdGUgcnBhcmVuc0V4cGVjdGVkID0gMDtcbiAgcHJpdmF0ZSByYnJhY2tldHNFeHBlY3RlZCA9IDA7XG4gIHByaXZhdGUgcmJyYWNlc0V4cGVjdGVkID0gMDtcblxuICBpbmRleDogbnVtYmVyID0gMDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBpbnB1dDogc3RyaW5nLCBwdWJsaWMgbG9jYXRpb246IGFueSwgcHVibGljIHRva2VuczogVG9rZW5bXSxcbiAgICAgIHB1YmxpYyBpbnB1dExlbmd0aDogbnVtYmVyLCBwdWJsaWMgcGFyc2VBY3Rpb246IGJvb2xlYW4sIHByaXZhdGUgZXJyb3JzOiBQYXJzZXJFcnJvcltdLFxuICAgICAgcHJpdmF0ZSBvZmZzZXQ6IG51bWJlcikge31cblxuICBwZWVrKG9mZnNldDogbnVtYmVyKTogVG9rZW4ge1xuICAgIGNvbnN0IGkgPSB0aGlzLmluZGV4ICsgb2Zmc2V0O1xuICAgIHJldHVybiBpIDwgdGhpcy50b2tlbnMubGVuZ3RoID8gdGhpcy50b2tlbnNbaV0gOiBFT0Y7XG4gIH1cblxuICBnZXQgbmV4dCgpOiBUb2tlbiB7IHJldHVybiB0aGlzLnBlZWsoMCk7IH1cblxuICBnZXQgaW5wdXRJbmRleCgpOiBudW1iZXIge1xuICAgIHJldHVybiAodGhpcy5pbmRleCA8IHRoaXMudG9rZW5zLmxlbmd0aCkgPyB0aGlzLm5leHQuaW5kZXggKyB0aGlzLm9mZnNldCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5wdXRMZW5ndGggKyB0aGlzLm9mZnNldDtcbiAgfVxuXG4gIHNwYW4oc3RhcnQ6IG51bWJlcikgeyByZXR1cm4gbmV3IFBhcnNlU3BhbihzdGFydCwgdGhpcy5pbnB1dEluZGV4KTsgfVxuXG4gIGFkdmFuY2UoKSB7IHRoaXMuaW5kZXgrKzsgfVxuXG4gIG9wdGlvbmFsQ2hhcmFjdGVyKGNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLm5leHQuaXNDaGFyYWN0ZXIoY29kZSkpIHtcbiAgICAgIHRoaXMuYWR2YW5jZSgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwZWVrS2V5d29yZExldCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMubmV4dC5pc0tleXdvcmRMZXQoKTsgfVxuICBwZWVrS2V5d29yZEFzKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5uZXh0LmlzS2V5d29yZEFzKCk7IH1cblxuICBleHBlY3RDaGFyYWN0ZXIoY29kZTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMub3B0aW9uYWxDaGFyYWN0ZXIoY29kZSkpIHJldHVybjtcbiAgICB0aGlzLmVycm9yKGBNaXNzaW5nIGV4cGVjdGVkICR7U3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKX1gKTtcbiAgfVxuXG4gIG9wdGlvbmFsT3BlcmF0b3Iob3A6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLm5leHQuaXNPcGVyYXRvcihvcCkpIHtcbiAgICAgIHRoaXMuYWR2YW5jZSgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBleHBlY3RPcGVyYXRvcihvcGVyYXRvcjogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMub3B0aW9uYWxPcGVyYXRvcihvcGVyYXRvcikpIHJldHVybjtcbiAgICB0aGlzLmVycm9yKGBNaXNzaW5nIGV4cGVjdGVkIG9wZXJhdG9yICR7b3BlcmF0b3J9YCk7XG4gIH1cblxuICBleHBlY3RJZGVudGlmaWVyT3JLZXl3b3JkKCk6IHN0cmluZyB7XG4gICAgY29uc3QgbiA9IHRoaXMubmV4dDtcbiAgICBpZiAoIW4uaXNJZGVudGlmaWVyKCkgJiYgIW4uaXNLZXl3b3JkKCkpIHtcbiAgICAgIHRoaXMuZXJyb3IoYFVuZXhwZWN0ZWQgdG9rZW4gJHtufSwgZXhwZWN0ZWQgaWRlbnRpZmllciBvciBrZXl3b3JkYCk7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHRoaXMuYWR2YW5jZSgpO1xuICAgIHJldHVybiBuLnRvU3RyaW5nKCkgYXMgc3RyaW5nO1xuICB9XG5cbiAgZXhwZWN0SWRlbnRpZmllck9yS2V5d29yZE9yU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgY29uc3QgbiA9IHRoaXMubmV4dDtcbiAgICBpZiAoIW4uaXNJZGVudGlmaWVyKCkgJiYgIW4uaXNLZXl3b3JkKCkgJiYgIW4uaXNTdHJpbmcoKSkge1xuICAgICAgdGhpcy5lcnJvcihgVW5leHBlY3RlZCB0b2tlbiAke259LCBleHBlY3RlZCBpZGVudGlmaWVyLCBrZXl3b3JkLCBvciBzdHJpbmdgKTtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgdGhpcy5hZHZhbmNlKCk7XG4gICAgcmV0dXJuIG4udG9TdHJpbmcoKSBhcyBzdHJpbmc7XG4gIH1cblxuICBwYXJzZUNoYWluKCk6IEFTVCB7XG4gICAgY29uc3QgZXhwcnM6IEFTVFtdID0gW107XG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLmlucHV0SW5kZXg7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnRva2Vucy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGV4cHIgPSB0aGlzLnBhcnNlUGlwZSgpO1xuICAgICAgZXhwcnMucHVzaChleHByKTtcblxuICAgICAgaWYgKHRoaXMub3B0aW9uYWxDaGFyYWN0ZXIoY2hhcnMuJFNFTUlDT0xPTikpIHtcbiAgICAgICAgaWYgKCF0aGlzLnBhcnNlQWN0aW9uKSB7XG4gICAgICAgICAgdGhpcy5lcnJvcignQmluZGluZyBleHByZXNzaW9uIGNhbm5vdCBjb250YWluIGNoYWluZWQgZXhwcmVzc2lvbicpO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICh0aGlzLm9wdGlvbmFsQ2hhcmFjdGVyKGNoYXJzLiRTRU1JQ09MT04pKSB7XG4gICAgICAgIH0gIC8vIHJlYWQgYWxsIHNlbWljb2xvbnNcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5pbmRleCA8IHRoaXMudG9rZW5zLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmVycm9yKGBVbmV4cGVjdGVkIHRva2VuICcke3RoaXMubmV4dH0nYCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChleHBycy5sZW5ndGggPT0gMCkgcmV0dXJuIG5ldyBFbXB0eUV4cHIodGhpcy5zcGFuKHN0YXJ0KSk7XG4gICAgaWYgKGV4cHJzLmxlbmd0aCA9PSAxKSByZXR1cm4gZXhwcnNbMF07XG4gICAgcmV0dXJuIG5ldyBDaGFpbih0aGlzLnNwYW4oc3RhcnQpLCBleHBycyk7XG4gIH1cblxuICBwYXJzZVBpcGUoKTogQVNUIHtcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICBpZiAodGhpcy5vcHRpb25hbE9wZXJhdG9yKCd8JykpIHtcbiAgICAgIGlmICh0aGlzLnBhcnNlQWN0aW9uKSB7XG4gICAgICAgIHRoaXMuZXJyb3IoJ0Nhbm5vdCBoYXZlIGEgcGlwZSBpbiBhbiBhY3Rpb24gZXhwcmVzc2lvbicpO1xuICAgICAgfVxuXG4gICAgICBkbyB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmV4cGVjdElkZW50aWZpZXJPcktleXdvcmQoKTtcbiAgICAgICAgY29uc3QgYXJnczogQVNUW10gPSBbXTtcbiAgICAgICAgd2hpbGUgKHRoaXMub3B0aW9uYWxDaGFyYWN0ZXIoY2hhcnMuJENPTE9OKSkge1xuICAgICAgICAgIGFyZ3MucHVzaCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpKTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBuZXcgQmluZGluZ1BpcGUodGhpcy5zcGFuKHJlc3VsdC5zcGFuLnN0YXJ0KSwgcmVzdWx0LCBuYW1lLCBhcmdzKTtcbiAgICAgIH0gd2hpbGUgKHRoaXMub3B0aW9uYWxPcGVyYXRvcignfCcpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VFeHByZXNzaW9uKCk6IEFTVCB7IHJldHVybiB0aGlzLnBhcnNlQ29uZGl0aW9uYWwoKTsgfVxuXG4gIHBhcnNlQ29uZGl0aW9uYWwoKTogQVNUIHtcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuaW5wdXRJbmRleDtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLnBhcnNlTG9naWNhbE9yKCk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25hbE9wZXJhdG9yKCc/JykpIHtcbiAgICAgIGNvbnN0IHllcyA9IHRoaXMucGFyc2VQaXBlKCk7XG4gICAgICBsZXQgbm86IEFTVDtcbiAgICAgIGlmICghdGhpcy5vcHRpb25hbENoYXJhY3RlcihjaGFycy4kQ09MT04pKSB7XG4gICAgICAgIGNvbnN0IGVuZCA9IHRoaXMuaW5wdXRJbmRleDtcbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IHRoaXMuaW5wdXQuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpO1xuICAgICAgICB0aGlzLmVycm9yKGBDb25kaXRpb25hbCBleHByZXNzaW9uICR7ZXhwcmVzc2lvbn0gcmVxdWlyZXMgYWxsIDMgZXhwcmVzc2lvbnNgKTtcbiAgICAgICAgbm8gPSBuZXcgRW1wdHlFeHByKHRoaXMuc3BhbihzdGFydCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm8gPSB0aGlzLnBhcnNlUGlwZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBDb25kaXRpb25hbCh0aGlzLnNwYW4oc3RhcnQpLCByZXN1bHQsIHllcywgbm8pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlTG9naWNhbE9yKCk6IEFTVCB7XG4gICAgLy8gJ3x8J1xuICAgIGxldCByZXN1bHQgPSB0aGlzLnBhcnNlTG9naWNhbEFuZCgpO1xuICAgIHdoaWxlICh0aGlzLm9wdGlvbmFsT3BlcmF0b3IoJ3x8JykpIHtcbiAgICAgIGNvbnN0IHJpZ2h0ID0gdGhpcy5wYXJzZUxvZ2ljYWxBbmQoKTtcbiAgICAgIHJlc3VsdCA9IG5ldyBCaW5hcnkodGhpcy5zcGFuKHJlc3VsdC5zcGFuLnN0YXJ0KSwgJ3x8JywgcmVzdWx0LCByaWdodCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZUxvZ2ljYWxBbmQoKTogQVNUIHtcbiAgICAvLyAnJiYnXG4gICAgbGV0IHJlc3VsdCA9IHRoaXMucGFyc2VFcXVhbGl0eSgpO1xuICAgIHdoaWxlICh0aGlzLm9wdGlvbmFsT3BlcmF0b3IoJyYmJykpIHtcbiAgICAgIGNvbnN0IHJpZ2h0ID0gdGhpcy5wYXJzZUVxdWFsaXR5KCk7XG4gICAgICByZXN1bHQgPSBuZXcgQmluYXJ5KHRoaXMuc3BhbihyZXN1bHQuc3Bhbi5zdGFydCksICcmJicsIHJlc3VsdCwgcmlnaHQpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VFcXVhbGl0eSgpOiBBU1Qge1xuICAgIC8vICc9PScsJyE9JywnPT09JywnIT09J1xuICAgIGxldCByZXN1bHQgPSB0aGlzLnBhcnNlUmVsYXRpb25hbCgpO1xuICAgIHdoaWxlICh0aGlzLm5leHQudHlwZSA9PSBUb2tlblR5cGUuT3BlcmF0b3IpIHtcbiAgICAgIGNvbnN0IG9wZXJhdG9yID0gdGhpcy5uZXh0LnN0clZhbHVlO1xuICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgICAgICBjYXNlICc9PSc6XG4gICAgICAgIGNhc2UgJz09PSc6XG4gICAgICAgIGNhc2UgJyE9JzpcbiAgICAgICAgY2FzZSAnIT09JzpcbiAgICAgICAgICB0aGlzLmFkdmFuY2UoKTtcbiAgICAgICAgICBjb25zdCByaWdodCA9IHRoaXMucGFyc2VSZWxhdGlvbmFsKCk7XG4gICAgICAgICAgcmVzdWx0ID0gbmV3IEJpbmFyeSh0aGlzLnNwYW4ocmVzdWx0LnNwYW4uc3RhcnQpLCBvcGVyYXRvciwgcmVzdWx0LCByaWdodCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlUmVsYXRpb25hbCgpOiBBU1Qge1xuICAgIC8vICc8JywgJz4nLCAnPD0nLCAnPj0nXG4gICAgbGV0IHJlc3VsdCA9IHRoaXMucGFyc2VBZGRpdGl2ZSgpO1xuICAgIHdoaWxlICh0aGlzLm5leHQudHlwZSA9PSBUb2tlblR5cGUuT3BlcmF0b3IpIHtcbiAgICAgIGNvbnN0IG9wZXJhdG9yID0gdGhpcy5uZXh0LnN0clZhbHVlO1xuICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgICAgICBjYXNlICc8JzpcbiAgICAgICAgY2FzZSAnPic6XG4gICAgICAgIGNhc2UgJzw9JzpcbiAgICAgICAgY2FzZSAnPj0nOlxuICAgICAgICAgIHRoaXMuYWR2YW5jZSgpO1xuICAgICAgICAgIGNvbnN0IHJpZ2h0ID0gdGhpcy5wYXJzZUFkZGl0aXZlKCk7XG4gICAgICAgICAgcmVzdWx0ID0gbmV3IEJpbmFyeSh0aGlzLnNwYW4ocmVzdWx0LnNwYW4uc3RhcnQpLCBvcGVyYXRvciwgcmVzdWx0LCByaWdodCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlQWRkaXRpdmUoKTogQVNUIHtcbiAgICAvLyAnKycsICctJ1xuICAgIGxldCByZXN1bHQgPSB0aGlzLnBhcnNlTXVsdGlwbGljYXRpdmUoKTtcbiAgICB3aGlsZSAodGhpcy5uZXh0LnR5cGUgPT0gVG9rZW5UeXBlLk9wZXJhdG9yKSB7XG4gICAgICBjb25zdCBvcGVyYXRvciA9IHRoaXMubmV4dC5zdHJWYWx1ZTtcbiAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbiAgICAgICAgY2FzZSAnKyc6XG4gICAgICAgIGNhc2UgJy0nOlxuICAgICAgICAgIHRoaXMuYWR2YW5jZSgpO1xuICAgICAgICAgIGxldCByaWdodCA9IHRoaXMucGFyc2VNdWx0aXBsaWNhdGl2ZSgpO1xuICAgICAgICAgIHJlc3VsdCA9IG5ldyBCaW5hcnkodGhpcy5zcGFuKHJlc3VsdC5zcGFuLnN0YXJ0KSwgb3BlcmF0b3IsIHJlc3VsdCwgcmlnaHQpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZU11bHRpcGxpY2F0aXZlKCk6IEFTVCB7XG4gICAgLy8gJyonLCAnJScsICcvJ1xuICAgIGxldCByZXN1bHQgPSB0aGlzLnBhcnNlUHJlZml4KCk7XG4gICAgd2hpbGUgKHRoaXMubmV4dC50eXBlID09IFRva2VuVHlwZS5PcGVyYXRvcikge1xuICAgICAgY29uc3Qgb3BlcmF0b3IgPSB0aGlzLm5leHQuc3RyVmFsdWU7XG4gICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgICAgIGNhc2UgJyonOlxuICAgICAgICBjYXNlICclJzpcbiAgICAgICAgY2FzZSAnLyc6XG4gICAgICAgICAgdGhpcy5hZHZhbmNlKCk7XG4gICAgICAgICAgbGV0IHJpZ2h0ID0gdGhpcy5wYXJzZVByZWZpeCgpO1xuICAgICAgICAgIHJlc3VsdCA9IG5ldyBCaW5hcnkodGhpcy5zcGFuKHJlc3VsdC5zcGFuLnN0YXJ0KSwgb3BlcmF0b3IsIHJlc3VsdCwgcmlnaHQpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZVByZWZpeCgpOiBBU1Qge1xuICAgIGlmICh0aGlzLm5leHQudHlwZSA9PSBUb2tlblR5cGUuT3BlcmF0b3IpIHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5pbnB1dEluZGV4O1xuICAgICAgY29uc3Qgb3BlcmF0b3IgPSB0aGlzLm5leHQuc3RyVmFsdWU7XG4gICAgICBsZXQgcmVzdWx0OiBBU1Q7XG4gICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgICAgIGNhc2UgJysnOlxuICAgICAgICAgIHRoaXMuYWR2YW5jZSgpO1xuICAgICAgICAgIHJlc3VsdCA9IHRoaXMucGFyc2VQcmVmaXgoKTtcbiAgICAgICAgICByZXR1cm4gbmV3IEJpbmFyeShcbiAgICAgICAgICAgICAgdGhpcy5zcGFuKHN0YXJ0KSwgJy0nLCByZXN1bHQsIG5ldyBMaXRlcmFsUHJpbWl0aXZlKG5ldyBQYXJzZVNwYW4oc3RhcnQsIHN0YXJ0KSwgMCkpO1xuICAgICAgICBjYXNlICctJzpcbiAgICAgICAgICB0aGlzLmFkdmFuY2UoKTtcbiAgICAgICAgICByZXN1bHQgPSB0aGlzLnBhcnNlUHJlZml4KCk7XG4gICAgICAgICAgcmV0dXJuIG5ldyBCaW5hcnkoXG4gICAgICAgICAgICAgIHRoaXMuc3BhbihzdGFydCksIG9wZXJhdG9yLCBuZXcgTGl0ZXJhbFByaW1pdGl2ZShuZXcgUGFyc2VTcGFuKHN0YXJ0LCBzdGFydCksIDApLFxuICAgICAgICAgICAgICByZXN1bHQpO1xuICAgICAgICBjYXNlICchJzpcbiAgICAgICAgICB0aGlzLmFkdmFuY2UoKTtcbiAgICAgICAgICByZXN1bHQgPSB0aGlzLnBhcnNlUHJlZml4KCk7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcmVmaXhOb3QodGhpcy5zcGFuKHN0YXJ0KSwgcmVzdWx0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucGFyc2VDYWxsQ2hhaW4oKTtcbiAgfVxuXG4gIHBhcnNlQ2FsbENoYWluKCk6IEFTVCB7XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMucGFyc2VQcmltYXJ5KCk7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbmFsQ2hhcmFjdGVyKGNoYXJzLiRQRVJJT0QpKSB7XG4gICAgICAgIHJlc3VsdCA9IHRoaXMucGFyc2VBY2Nlc3NNZW1iZXJPck1ldGhvZENhbGwocmVzdWx0LCBmYWxzZSk7XG5cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25hbE9wZXJhdG9yKCc/LicpKSB7XG4gICAgICAgIHJlc3VsdCA9IHRoaXMucGFyc2VBY2Nlc3NNZW1iZXJPck1ldGhvZENhbGwocmVzdWx0LCB0cnVlKTtcblxuICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbmFsQ2hhcmFjdGVyKGNoYXJzLiRMQlJBQ0tFVCkpIHtcbiAgICAgICAgdGhpcy5yYnJhY2tldHNFeHBlY3RlZCsrO1xuICAgICAgICBjb25zdCBrZXkgPSB0aGlzLnBhcnNlUGlwZSgpO1xuICAgICAgICB0aGlzLnJicmFja2V0c0V4cGVjdGVkLS07XG4gICAgICAgIHRoaXMuZXhwZWN0Q2hhcmFjdGVyKGNoYXJzLiRSQlJBQ0tFVCk7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbmFsT3BlcmF0b3IoJz0nKSkge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5wYXJzZUNvbmRpdGlvbmFsKCk7XG4gICAgICAgICAgcmVzdWx0ID0gbmV3IEtleWVkV3JpdGUodGhpcy5zcGFuKHJlc3VsdC5zcGFuLnN0YXJ0KSwgcmVzdWx0LCBrZXksIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgPSBuZXcgS2V5ZWRSZWFkKHRoaXMuc3BhbihyZXN1bHQuc3Bhbi5zdGFydCksIHJlc3VsdCwga2V5KTtcbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9uYWxDaGFyYWN0ZXIoY2hhcnMuJExQQVJFTikpIHtcbiAgICAgICAgdGhpcy5ycGFyZW5zRXhwZWN0ZWQrKztcbiAgICAgICAgY29uc3QgYXJncyA9IHRoaXMucGFyc2VDYWxsQXJndW1lbnRzKCk7XG4gICAgICAgIHRoaXMucnBhcmVuc0V4cGVjdGVkLS07XG4gICAgICAgIHRoaXMuZXhwZWN0Q2hhcmFjdGVyKGNoYXJzLiRSUEFSRU4pO1xuICAgICAgICByZXN1bHQgPSBuZXcgRnVuY3Rpb25DYWxsKHRoaXMuc3BhbihyZXN1bHQuc3Bhbi5zdGFydCksIHJlc3VsdCwgYXJncyk7XG5cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25hbE9wZXJhdG9yKCchJykpIHtcbiAgICAgICAgcmVzdWx0ID0gbmV3IE5vbk51bGxBc3NlcnQodGhpcy5zcGFuKHJlc3VsdC5zcGFuLnN0YXJ0KSwgcmVzdWx0KTtcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZVByaW1hcnkoKTogQVNUIHtcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuaW5wdXRJbmRleDtcbiAgICBpZiAodGhpcy5vcHRpb25hbENoYXJhY3RlcihjaGFycy4kTFBBUkVOKSkge1xuICAgICAgdGhpcy5ycGFyZW5zRXhwZWN0ZWQrKztcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucGFyc2VQaXBlKCk7XG4gICAgICB0aGlzLnJwYXJlbnNFeHBlY3RlZC0tO1xuICAgICAgdGhpcy5leHBlY3RDaGFyYWN0ZXIoY2hhcnMuJFJQQVJFTik7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgfSBlbHNlIGlmICh0aGlzLm5leHQuaXNLZXl3b3JkTnVsbCgpKSB7XG4gICAgICB0aGlzLmFkdmFuY2UoKTtcbiAgICAgIHJldHVybiBuZXcgTGl0ZXJhbFByaW1pdGl2ZSh0aGlzLnNwYW4oc3RhcnQpLCBudWxsKTtcblxuICAgIH0gZWxzZSBpZiAodGhpcy5uZXh0LmlzS2V5d29yZFVuZGVmaW5lZCgpKSB7XG4gICAgICB0aGlzLmFkdmFuY2UoKTtcbiAgICAgIHJldHVybiBuZXcgTGl0ZXJhbFByaW1pdGl2ZSh0aGlzLnNwYW4oc3RhcnQpLCB2b2lkIDApO1xuXG4gICAgfSBlbHNlIGlmICh0aGlzLm5leHQuaXNLZXl3b3JkVHJ1ZSgpKSB7XG4gICAgICB0aGlzLmFkdmFuY2UoKTtcbiAgICAgIHJldHVybiBuZXcgTGl0ZXJhbFByaW1pdGl2ZSh0aGlzLnNwYW4oc3RhcnQpLCB0cnVlKTtcblxuICAgIH0gZWxzZSBpZiAodGhpcy5uZXh0LmlzS2V5d29yZEZhbHNlKCkpIHtcbiAgICAgIHRoaXMuYWR2YW5jZSgpO1xuICAgICAgcmV0dXJuIG5ldyBMaXRlcmFsUHJpbWl0aXZlKHRoaXMuc3BhbihzdGFydCksIGZhbHNlKTtcblxuICAgIH0gZWxzZSBpZiAodGhpcy5uZXh0LmlzS2V5d29yZFRoaXMoKSkge1xuICAgICAgdGhpcy5hZHZhbmNlKCk7XG4gICAgICByZXR1cm4gbmV3IEltcGxpY2l0UmVjZWl2ZXIodGhpcy5zcGFuKHN0YXJ0KSk7XG5cbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9uYWxDaGFyYWN0ZXIoY2hhcnMuJExCUkFDS0VUKSkge1xuICAgICAgdGhpcy5yYnJhY2tldHNFeHBlY3RlZCsrO1xuICAgICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbkxpc3QoY2hhcnMuJFJCUkFDS0VUKTtcbiAgICAgIHRoaXMucmJyYWNrZXRzRXhwZWN0ZWQtLTtcbiAgICAgIHRoaXMuZXhwZWN0Q2hhcmFjdGVyKGNoYXJzLiRSQlJBQ0tFVCk7XG4gICAgICByZXR1cm4gbmV3IExpdGVyYWxBcnJheSh0aGlzLnNwYW4oc3RhcnQpLCBlbGVtZW50cyk7XG5cbiAgICB9IGVsc2UgaWYgKHRoaXMubmV4dC5pc0NoYXJhY3RlcihjaGFycy4kTEJSQUNFKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VMaXRlcmFsTWFwKCk7XG5cbiAgICB9IGVsc2UgaWYgKHRoaXMubmV4dC5pc0lkZW50aWZpZXIoKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VBY2Nlc3NNZW1iZXJPck1ldGhvZENhbGwobmV3IEltcGxpY2l0UmVjZWl2ZXIodGhpcy5zcGFuKHN0YXJ0KSksIGZhbHNlKTtcblxuICAgIH0gZWxzZSBpZiAodGhpcy5uZXh0LmlzTnVtYmVyKCkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5uZXh0LnRvTnVtYmVyKCk7XG4gICAgICB0aGlzLmFkdmFuY2UoKTtcbiAgICAgIHJldHVybiBuZXcgTGl0ZXJhbFByaW1pdGl2ZSh0aGlzLnNwYW4oc3RhcnQpLCB2YWx1ZSk7XG5cbiAgICB9IGVsc2UgaWYgKHRoaXMubmV4dC5pc1N0cmluZygpKSB7XG4gICAgICBjb25zdCBsaXRlcmFsVmFsdWUgPSB0aGlzLm5leHQudG9TdHJpbmcoKTtcbiAgICAgIHRoaXMuYWR2YW5jZSgpO1xuICAgICAgcmV0dXJuIG5ldyBMaXRlcmFsUHJpbWl0aXZlKHRoaXMuc3BhbihzdGFydCksIGxpdGVyYWxWYWx1ZSk7XG5cbiAgICB9IGVsc2UgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy50b2tlbnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLmVycm9yKGBVbmV4cGVjdGVkIGVuZCBvZiBleHByZXNzaW9uOiAke3RoaXMuaW5wdXR9YCk7XG4gICAgICByZXR1cm4gbmV3IEVtcHR5RXhwcih0aGlzLnNwYW4oc3RhcnQpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lcnJvcihgVW5leHBlY3RlZCB0b2tlbiAke3RoaXMubmV4dH1gKTtcbiAgICAgIHJldHVybiBuZXcgRW1wdHlFeHByKHRoaXMuc3BhbihzdGFydCkpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlRXhwcmVzc2lvbkxpc3QodGVybWluYXRvcjogbnVtYmVyKTogQVNUW10ge1xuICAgIGNvbnN0IHJlc3VsdDogQVNUW10gPSBbXTtcbiAgICBpZiAoIXRoaXMubmV4dC5pc0NoYXJhY3Rlcih0ZXJtaW5hdG9yKSkge1xuICAgICAgZG8ge1xuICAgICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlUGlwZSgpKTtcbiAgICAgIH0gd2hpbGUgKHRoaXMub3B0aW9uYWxDaGFyYWN0ZXIoY2hhcnMuJENPTU1BKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZUxpdGVyYWxNYXAoKTogTGl0ZXJhbE1hcCB7XG4gICAgY29uc3Qga2V5czogTGl0ZXJhbE1hcEtleVtdID0gW107XG4gICAgY29uc3QgdmFsdWVzOiBBU1RbXSA9IFtdO1xuICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5pbnB1dEluZGV4O1xuICAgIHRoaXMuZXhwZWN0Q2hhcmFjdGVyKGNoYXJzLiRMQlJBQ0UpO1xuICAgIGlmICghdGhpcy5vcHRpb25hbENoYXJhY3RlcihjaGFycy4kUkJSQUNFKSkge1xuICAgICAgdGhpcy5yYnJhY2VzRXhwZWN0ZWQrKztcbiAgICAgIGRvIHtcbiAgICAgICAgY29uc3QgcXVvdGVkID0gdGhpcy5uZXh0LmlzU3RyaW5nKCk7XG4gICAgICAgIGNvbnN0IGtleSA9IHRoaXMuZXhwZWN0SWRlbnRpZmllck9yS2V5d29yZE9yU3RyaW5nKCk7XG4gICAgICAgIGtleXMucHVzaCh7a2V5LCBxdW90ZWR9KTtcbiAgICAgICAgdGhpcy5leHBlY3RDaGFyYWN0ZXIoY2hhcnMuJENPTE9OKTtcbiAgICAgICAgdmFsdWVzLnB1c2godGhpcy5wYXJzZVBpcGUoKSk7XG4gICAgICB9IHdoaWxlICh0aGlzLm9wdGlvbmFsQ2hhcmFjdGVyKGNoYXJzLiRDT01NQSkpO1xuICAgICAgdGhpcy5yYnJhY2VzRXhwZWN0ZWQtLTtcbiAgICAgIHRoaXMuZXhwZWN0Q2hhcmFjdGVyKGNoYXJzLiRSQlJBQ0UpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IExpdGVyYWxNYXAodGhpcy5zcGFuKHN0YXJ0KSwga2V5cywgdmFsdWVzKTtcbiAgfVxuXG4gIHBhcnNlQWNjZXNzTWVtYmVyT3JNZXRob2RDYWxsKHJlY2VpdmVyOiBBU1QsIGlzU2FmZTogYm9vbGVhbiA9IGZhbHNlKTogQVNUIHtcbiAgICBjb25zdCBzdGFydCA9IHJlY2VpdmVyLnNwYW4uc3RhcnQ7XG4gICAgY29uc3QgaWQgPSB0aGlzLmV4cGVjdElkZW50aWZpZXJPcktleXdvcmQoKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbmFsQ2hhcmFjdGVyKGNoYXJzLiRMUEFSRU4pKSB7XG4gICAgICB0aGlzLnJwYXJlbnNFeHBlY3RlZCsrO1xuICAgICAgY29uc3QgYXJncyA9IHRoaXMucGFyc2VDYWxsQXJndW1lbnRzKCk7XG4gICAgICB0aGlzLmV4cGVjdENoYXJhY3RlcihjaGFycy4kUlBBUkVOKTtcbiAgICAgIHRoaXMucnBhcmVuc0V4cGVjdGVkLS07XG4gICAgICBjb25zdCBzcGFuID0gdGhpcy5zcGFuKHN0YXJ0KTtcbiAgICAgIHJldHVybiBpc1NhZmUgPyBuZXcgU2FmZU1ldGhvZENhbGwoc3BhbiwgcmVjZWl2ZXIsIGlkLCBhcmdzKSA6XG4gICAgICAgICAgICAgICAgICAgICAgbmV3IE1ldGhvZENhbGwoc3BhbiwgcmVjZWl2ZXIsIGlkLCBhcmdzKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaXNTYWZlKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbmFsT3BlcmF0b3IoJz0nKSkge1xuICAgICAgICAgIHRoaXMuZXJyb3IoJ1RoZSBcXCc/LlxcJyBvcGVyYXRvciBjYW5ub3QgYmUgdXNlZCBpbiB0aGUgYXNzaWdubWVudCcpO1xuICAgICAgICAgIHJldHVybiBuZXcgRW1wdHlFeHByKHRoaXMuc3BhbihzdGFydCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBuZXcgU2FmZVByb3BlcnR5UmVhZCh0aGlzLnNwYW4oc3RhcnQpLCByZWNlaXZlciwgaWQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25hbE9wZXJhdG9yKCc9JykpIHtcbiAgICAgICAgICBpZiAoIXRoaXMucGFyc2VBY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZXJyb3IoJ0JpbmRpbmdzIGNhbm5vdCBjb250YWluIGFzc2lnbm1lbnRzJyk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEVtcHR5RXhwcih0aGlzLnNwYW4oc3RhcnQpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHRoaXMucGFyc2VDb25kaXRpb25hbCgpO1xuICAgICAgICAgIHJldHVybiBuZXcgUHJvcGVydHlXcml0ZSh0aGlzLnNwYW4oc3RhcnQpLCByZWNlaXZlciwgaWQsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb3BlcnR5UmVhZCh0aGlzLnNwYW4oc3RhcnQpLCByZWNlaXZlciwgaWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VDYWxsQXJndW1lbnRzKCk6IEJpbmRpbmdQaXBlW10ge1xuICAgIGlmICh0aGlzLm5leHQuaXNDaGFyYWN0ZXIoY2hhcnMuJFJQQVJFTikpIHJldHVybiBbXTtcbiAgICBjb25zdCBwb3NpdGlvbmFsczogQVNUW10gPSBbXTtcbiAgICBkbyB7XG4gICAgICBwb3NpdGlvbmFscy5wdXNoKHRoaXMucGFyc2VQaXBlKCkpO1xuICAgIH0gd2hpbGUgKHRoaXMub3B0aW9uYWxDaGFyYWN0ZXIoY2hhcnMuJENPTU1BKSk7XG4gICAgcmV0dXJuIHBvc2l0aW9uYWxzIGFzIEJpbmRpbmdQaXBlW107XG4gIH1cblxuICAvKipcbiAgICogQW4gaWRlbnRpZmllciwgYSBrZXl3b3JkLCBhIHN0cmluZyB3aXRoIGFuIG9wdGlvbmFsIGAtYCBpbiBiZXR3ZWVuLlxuICAgKi9cbiAgZXhwZWN0VGVtcGxhdGVCaW5kaW5nS2V5KCk6IHN0cmluZyB7XG4gICAgbGV0IHJlc3VsdCA9ICcnO1xuICAgIGxldCBvcGVyYXRvckZvdW5kID0gZmFsc2U7XG4gICAgZG8ge1xuICAgICAgcmVzdWx0ICs9IHRoaXMuZXhwZWN0SWRlbnRpZmllck9yS2V5d29yZE9yU3RyaW5nKCk7XG4gICAgICBvcGVyYXRvckZvdW5kID0gdGhpcy5vcHRpb25hbE9wZXJhdG9yKCctJyk7XG4gICAgICBpZiAob3BlcmF0b3JGb3VuZCkge1xuICAgICAgICByZXN1bHQgKz0gJy0nO1xuICAgICAgfVxuICAgIH0gd2hpbGUgKG9wZXJhdG9yRm91bmQpO1xuXG4gICAgcmV0dXJuIHJlc3VsdC50b1N0cmluZygpO1xuICB9XG5cbiAgLy8gUGFyc2VzIHRoZSBBU1QgZm9yIGA8c29tZS10YWcgKnRwbEtleT1BU1Q+YFxuICBwYXJzZVRlbXBsYXRlQmluZGluZ3ModHBsS2V5OiBzdHJpbmcpOiBUZW1wbGF0ZUJpbmRpbmdQYXJzZVJlc3VsdCB7XG4gICAgbGV0IGZpcnN0QmluZGluZyA9IHRydWU7XG4gICAgY29uc3QgYmluZGluZ3M6IFRlbXBsYXRlQmluZGluZ1tdID0gW107XG4gICAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG4gICAgZG8ge1xuICAgICAgY29uc3Qgc3RhcnQgPSB0aGlzLmlucHV0SW5kZXg7XG4gICAgICBsZXQgcmF3S2V5OiBzdHJpbmc7XG4gICAgICBsZXQga2V5OiBzdHJpbmc7XG4gICAgICBsZXQgaXNWYXI6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAgIGlmIChmaXJzdEJpbmRpbmcpIHtcbiAgICAgICAgcmF3S2V5ID0ga2V5ID0gdHBsS2V5O1xuICAgICAgICBmaXJzdEJpbmRpbmcgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlzVmFyID0gdGhpcy5wZWVrS2V5d29yZExldCgpO1xuICAgICAgICBpZiAoaXNWYXIpIHRoaXMuYWR2YW5jZSgpO1xuICAgICAgICByYXdLZXkgPSB0aGlzLmV4cGVjdFRlbXBsYXRlQmluZGluZ0tleSgpO1xuICAgICAgICBrZXkgPSBpc1ZhciA/IHJhd0tleSA6IHRwbEtleSArIHJhd0tleVswXS50b1VwcGVyQ2FzZSgpICsgcmF3S2V5LnN1YnN0cmluZygxKTtcbiAgICAgICAgdGhpcy5vcHRpb25hbENoYXJhY3RlcihjaGFycy4kQ09MT04pO1xuICAgICAgfVxuXG4gICAgICBsZXQgbmFtZTogc3RyaW5nID0gbnVsbCAhO1xuICAgICAgbGV0IGV4cHJlc3Npb246IEFTVFdpdGhTb3VyY2V8bnVsbCA9IG51bGw7XG4gICAgICBpZiAoaXNWYXIpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9uYWxPcGVyYXRvcignPScpKSB7XG4gICAgICAgICAgbmFtZSA9IHRoaXMuZXhwZWN0VGVtcGxhdGVCaW5kaW5nS2V5KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmFtZSA9ICdcXCRpbXBsaWNpdCc7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5wZWVrS2V5d29yZEFzKCkpIHtcbiAgICAgICAgdGhpcy5hZHZhbmNlKCk7ICAvLyBjb25zdW1lIGBhc2BcbiAgICAgICAgbmFtZSA9IHJhd0tleTtcbiAgICAgICAga2V5ID0gdGhpcy5leHBlY3RUZW1wbGF0ZUJpbmRpbmdLZXkoKTsgIC8vIHJlYWQgbG9jYWwgdmFyIG5hbWVcbiAgICAgICAgaXNWYXIgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm5leHQgIT09IEVPRiAmJiAhdGhpcy5wZWVrS2V5d29yZExldCgpKSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5pbnB1dEluZGV4O1xuICAgICAgICBjb25zdCBhc3QgPSB0aGlzLnBhcnNlUGlwZSgpO1xuICAgICAgICBjb25zdCBzb3VyY2UgPSB0aGlzLmlucHV0LnN1YnN0cmluZyhzdGFydCAtIHRoaXMub2Zmc2V0LCB0aGlzLmlucHV0SW5kZXggLSB0aGlzLm9mZnNldCk7XG4gICAgICAgIGV4cHJlc3Npb24gPSBuZXcgQVNUV2l0aFNvdXJjZShhc3QsIHNvdXJjZSwgdGhpcy5sb2NhdGlvbiwgdGhpcy5lcnJvcnMpO1xuICAgICAgfVxuXG4gICAgICBiaW5kaW5ncy5wdXNoKG5ldyBUZW1wbGF0ZUJpbmRpbmcodGhpcy5zcGFuKHN0YXJ0KSwga2V5LCBpc1ZhciwgbmFtZSwgZXhwcmVzc2lvbikpO1xuICAgICAgaWYgKHRoaXMucGVla0tleXdvcmRBcygpICYmICFpc1Zhcikge1xuICAgICAgICBjb25zdCBsZXRTdGFydCA9IHRoaXMuaW5wdXRJbmRleDtcbiAgICAgICAgdGhpcy5hZHZhbmNlKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zdW1lIGBhc2BcbiAgICAgICAgY29uc3QgbGV0TmFtZSA9IHRoaXMuZXhwZWN0VGVtcGxhdGVCaW5kaW5nS2V5KCk7ICAvLyByZWFkIGxvY2FsIHZhciBuYW1lXG4gICAgICAgIGJpbmRpbmdzLnB1c2gobmV3IFRlbXBsYXRlQmluZGluZyh0aGlzLnNwYW4obGV0U3RhcnQpLCBsZXROYW1lLCB0cnVlLCBrZXksIG51bGwgISkpO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLm9wdGlvbmFsQ2hhcmFjdGVyKGNoYXJzLiRTRU1JQ09MT04pKSB7XG4gICAgICAgIHRoaXMub3B0aW9uYWxDaGFyYWN0ZXIoY2hhcnMuJENPTU1BKTtcbiAgICAgIH1cbiAgICB9IHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy50b2tlbnMubGVuZ3RoKTtcblxuICAgIHJldHVybiBuZXcgVGVtcGxhdGVCaW5kaW5nUGFyc2VSZXN1bHQoYmluZGluZ3MsIHdhcm5pbmdzLCB0aGlzLmVycm9ycyk7XG4gIH1cblxuICBlcnJvcihtZXNzYWdlOiBzdHJpbmcsIGluZGV4OiBudW1iZXJ8bnVsbCA9IG51bGwpIHtcbiAgICB0aGlzLmVycm9ycy5wdXNoKG5ldyBQYXJzZXJFcnJvcihtZXNzYWdlLCB0aGlzLmlucHV0LCB0aGlzLmxvY2F0aW9uVGV4dChpbmRleCksIHRoaXMubG9jYXRpb24pKTtcbiAgICB0aGlzLnNraXAoKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9jYXRpb25UZXh0KGluZGV4OiBudW1iZXJ8bnVsbCA9IG51bGwpIHtcbiAgICBpZiAoaW5kZXggPT0gbnVsbCkgaW5kZXggPSB0aGlzLmluZGV4O1xuICAgIHJldHVybiAoaW5kZXggPCB0aGlzLnRva2Vucy5sZW5ndGgpID8gYGF0IGNvbHVtbiAke3RoaXMudG9rZW5zW2luZGV4XS5pbmRleCArIDF9IGluYCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgYXQgdGhlIGVuZCBvZiB0aGUgZXhwcmVzc2lvbmA7XG4gIH1cblxuICAvLyBFcnJvciByZWNvdmVyeSBzaG91bGQgc2tpcCB0b2tlbnMgdW50aWwgaXQgZW5jb3VudGVycyBhIHJlY292ZXJ5IHBvaW50LiBza2lwKCkgdHJlYXRzXG4gIC8vIHRoZSBlbmQgb2YgaW5wdXQgYW5kIGEgJzsnIGFzIHVuY29uZGl0aW9uYWxseSBhIHJlY292ZXJ5IHBvaW50LiBJdCBhbHNvIHRyZWF0cyAnKScsXG4gIC8vICd9JyBhbmQgJ10nIGFzIGNvbmRpdGlvbmFsIHJlY292ZXJ5IHBvaW50cyBpZiBvbmUgb2YgY2FsbGluZyBwcm9kdWN0aW9ucyBpcyBleHBlY3RpbmdcbiAgLy8gb25lIG9mIHRoZXNlIHN5bWJvbHMuIFRoaXMgYWxsb3dzIHNraXAoKSB0byByZWNvdmVyIGZyb20gZXJyb3JzIHN1Y2ggYXMgJyhhLikgKyAxJyBhbGxvd2luZ1xuICAvLyBtb3JlIG9mIHRoZSBBU1QgdG8gYmUgcmV0YWluZWQgKGl0IGRvZXNuJ3Qgc2tpcCBhbnkgdG9rZW5zIGFzIHRoZSAnKScgaXMgcmV0YWluZWQgYmVjYXVzZVxuICAvLyBvZiB0aGUgJygnIGJlZ2lucyBhbiAnKCcgPGV4cHI+ICcpJyBwcm9kdWN0aW9uKS4gVGhlIHJlY292ZXJ5IHBvaW50cyBvZiBncm91cGluZyBzeW1ib2xzXG4gIC8vIG11c3QgYmUgY29uZGl0aW9uYWwgYXMgdGhleSBtdXN0IGJlIHNraXBwZWQgaWYgbm9uZSBvZiB0aGUgY2FsbGluZyBwcm9kdWN0aW9ucyBhcmUgbm90XG4gIC8vIGV4cGVjdGluZyB0aGUgY2xvc2luZyB0b2tlbiBlbHNlIHdlIHdpbGwgbmV2ZXIgbWFrZSBwcm9ncmVzcyBpbiB0aGUgY2FzZSBvZiBhblxuICAvLyBleHRyYW5lb3VzIGdyb3VwIGNsb3Npbmcgc3ltYm9sIChzdWNoIGFzIGEgc3RyYXkgJyknKS4gVGhpcyBpcyBub3QgdGhlIGNhc2UgZm9yICc7JyBiZWNhdXNlXG4gIC8vIHBhcnNlQ2hhaW4oKSBpcyBhbHdheXMgdGhlIHJvb3QgcHJvZHVjdGlvbiBhbmQgaXQgZXhwZWN0cyBhICc7Jy5cblxuICAvLyBJZiBhIHByb2R1Y3Rpb24gZXhwZWN0cyBvbmUgb2YgdGhlc2UgdG9rZW4gaXQgaW5jcmVtZW50cyB0aGUgY29ycmVzcG9uZGluZyBuZXN0aW5nIGNvdW50LFxuICAvLyBhbmQgdGhlbiBkZWNyZW1lbnRzIGl0IGp1c3QgcHJpb3IgdG8gY2hlY2tpbmcgaWYgdGhlIHRva2VuIGlzIGluIHRoZSBpbnB1dC5cbiAgcHJpdmF0ZSBza2lwKCkge1xuICAgIGxldCBuID0gdGhpcy5uZXh0O1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy50b2tlbnMubGVuZ3RoICYmICFuLmlzQ2hhcmFjdGVyKGNoYXJzLiRTRU1JQ09MT04pICYmXG4gICAgICAgICAgICh0aGlzLnJwYXJlbnNFeHBlY3RlZCA8PSAwIHx8ICFuLmlzQ2hhcmFjdGVyKGNoYXJzLiRSUEFSRU4pKSAmJlxuICAgICAgICAgICAodGhpcy5yYnJhY2VzRXhwZWN0ZWQgPD0gMCB8fCAhbi5pc0NoYXJhY3RlcihjaGFycy4kUkJSQUNFKSkgJiZcbiAgICAgICAgICAgKHRoaXMucmJyYWNrZXRzRXhwZWN0ZWQgPD0gMCB8fCAhbi5pc0NoYXJhY3RlcihjaGFycy4kUkJSQUNLRVQpKSkge1xuICAgICAgaWYgKHRoaXMubmV4dC5pc0Vycm9yKCkpIHtcbiAgICAgICAgdGhpcy5lcnJvcnMucHVzaChuZXcgUGFyc2VyRXJyb3IoXG4gICAgICAgICAgICB0aGlzLm5leHQudG9TdHJpbmcoKSAhLCB0aGlzLmlucHV0LCB0aGlzLmxvY2F0aW9uVGV4dCgpLCB0aGlzLmxvY2F0aW9uKSk7XG4gICAgICB9XG4gICAgICB0aGlzLmFkdmFuY2UoKTtcbiAgICAgIG4gPSB0aGlzLm5leHQ7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFNpbXBsZUV4cHJlc3Npb25DaGVja2VyIGltcGxlbWVudHMgQXN0VmlzaXRvciB7XG4gIHN0YXRpYyBjaGVjayhhc3Q6IEFTVCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBzID0gbmV3IFNpbXBsZUV4cHJlc3Npb25DaGVja2VyKCk7XG4gICAgYXN0LnZpc2l0KHMpO1xuICAgIHJldHVybiBzLmVycm9ycztcbiAgfVxuXG4gIGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICB2aXNpdEltcGxpY2l0UmVjZWl2ZXIoYXN0OiBJbXBsaWNpdFJlY2VpdmVyLCBjb250ZXh0OiBhbnkpIHt9XG5cbiAgdmlzaXRJbnRlcnBvbGF0aW9uKGFzdDogSW50ZXJwb2xhdGlvbiwgY29udGV4dDogYW55KSB7fVxuXG4gIHZpc2l0TGl0ZXJhbFByaW1pdGl2ZShhc3Q6IExpdGVyYWxQcmltaXRpdmUsIGNvbnRleHQ6IGFueSkge31cblxuICB2aXNpdFByb3BlcnR5UmVhZChhc3Q6IFByb3BlcnR5UmVhZCwgY29udGV4dDogYW55KSB7fVxuXG4gIHZpc2l0UHJvcGVydHlXcml0ZShhc3Q6IFByb3BlcnR5V3JpdGUsIGNvbnRleHQ6IGFueSkge31cblxuICB2aXNpdFNhZmVQcm9wZXJ0eVJlYWQoYXN0OiBTYWZlUHJvcGVydHlSZWFkLCBjb250ZXh0OiBhbnkpIHt9XG5cbiAgdmlzaXRNZXRob2RDYWxsKGFzdDogTWV0aG9kQ2FsbCwgY29udGV4dDogYW55KSB7fVxuXG4gIHZpc2l0U2FmZU1ldGhvZENhbGwoYXN0OiBTYWZlTWV0aG9kQ2FsbCwgY29udGV4dDogYW55KSB7fVxuXG4gIHZpc2l0RnVuY3Rpb25DYWxsKGFzdDogRnVuY3Rpb25DYWxsLCBjb250ZXh0OiBhbnkpIHt9XG5cbiAgdmlzaXRMaXRlcmFsQXJyYXkoYXN0OiBMaXRlcmFsQXJyYXksIGNvbnRleHQ6IGFueSkgeyB0aGlzLnZpc2l0QWxsKGFzdC5leHByZXNzaW9ucyk7IH1cblxuICB2aXNpdExpdGVyYWxNYXAoYXN0OiBMaXRlcmFsTWFwLCBjb250ZXh0OiBhbnkpIHsgdGhpcy52aXNpdEFsbChhc3QudmFsdWVzKTsgfVxuXG4gIHZpc2l0QmluYXJ5KGFzdDogQmluYXJ5LCBjb250ZXh0OiBhbnkpIHt9XG5cbiAgdmlzaXRQcmVmaXhOb3QoYXN0OiBQcmVmaXhOb3QsIGNvbnRleHQ6IGFueSkge31cblxuICB2aXNpdE5vbk51bGxBc3NlcnQoYXN0OiBOb25OdWxsQXNzZXJ0LCBjb250ZXh0OiBhbnkpIHt9XG5cbiAgdmlzaXRDb25kaXRpb25hbChhc3Q6IENvbmRpdGlvbmFsLCBjb250ZXh0OiBhbnkpIHt9XG5cbiAgdmlzaXRQaXBlKGFzdDogQmluZGluZ1BpcGUsIGNvbnRleHQ6IGFueSkgeyB0aGlzLmVycm9ycy5wdXNoKCdwaXBlcycpOyB9XG5cbiAgdmlzaXRLZXllZFJlYWQoYXN0OiBLZXllZFJlYWQsIGNvbnRleHQ6IGFueSkge31cblxuICB2aXNpdEtleWVkV3JpdGUoYXN0OiBLZXllZFdyaXRlLCBjb250ZXh0OiBhbnkpIHt9XG5cbiAgdmlzaXRBbGwoYXN0czogYW55W10pOiBhbnlbXSB7IHJldHVybiBhc3RzLm1hcChub2RlID0+IG5vZGUudmlzaXQodGhpcykpOyB9XG5cbiAgdmlzaXRDaGFpbihhc3Q6IENoYWluLCBjb250ZXh0OiBhbnkpIHt9XG5cbiAgdmlzaXRRdW90ZShhc3Q6IFF1b3RlLCBjb250ZXh0OiBhbnkpIHt9XG59XG4iXX0=