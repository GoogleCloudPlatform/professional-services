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
        define("@angular/compiler/src/ml_parser/lexer", ["require", "exports", "tslib", "@angular/compiler/src/chars", "@angular/compiler/src/parse_util", "@angular/compiler/src/ml_parser/interpolation_config", "@angular/compiler/src/ml_parser/tags"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var chars = require("@angular/compiler/src/chars");
    var parse_util_1 = require("@angular/compiler/src/parse_util");
    var interpolation_config_1 = require("@angular/compiler/src/ml_parser/interpolation_config");
    var tags_1 = require("@angular/compiler/src/ml_parser/tags");
    var TokenType;
    (function (TokenType) {
        TokenType[TokenType["TAG_OPEN_START"] = 0] = "TAG_OPEN_START";
        TokenType[TokenType["TAG_OPEN_END"] = 1] = "TAG_OPEN_END";
        TokenType[TokenType["TAG_OPEN_END_VOID"] = 2] = "TAG_OPEN_END_VOID";
        TokenType[TokenType["TAG_CLOSE"] = 3] = "TAG_CLOSE";
        TokenType[TokenType["TEXT"] = 4] = "TEXT";
        TokenType[TokenType["ESCAPABLE_RAW_TEXT"] = 5] = "ESCAPABLE_RAW_TEXT";
        TokenType[TokenType["RAW_TEXT"] = 6] = "RAW_TEXT";
        TokenType[TokenType["COMMENT_START"] = 7] = "COMMENT_START";
        TokenType[TokenType["COMMENT_END"] = 8] = "COMMENT_END";
        TokenType[TokenType["CDATA_START"] = 9] = "CDATA_START";
        TokenType[TokenType["CDATA_END"] = 10] = "CDATA_END";
        TokenType[TokenType["ATTR_NAME"] = 11] = "ATTR_NAME";
        TokenType[TokenType["ATTR_VALUE"] = 12] = "ATTR_VALUE";
        TokenType[TokenType["DOC_TYPE"] = 13] = "DOC_TYPE";
        TokenType[TokenType["EXPANSION_FORM_START"] = 14] = "EXPANSION_FORM_START";
        TokenType[TokenType["EXPANSION_CASE_VALUE"] = 15] = "EXPANSION_CASE_VALUE";
        TokenType[TokenType["EXPANSION_CASE_EXP_START"] = 16] = "EXPANSION_CASE_EXP_START";
        TokenType[TokenType["EXPANSION_CASE_EXP_END"] = 17] = "EXPANSION_CASE_EXP_END";
        TokenType[TokenType["EXPANSION_FORM_END"] = 18] = "EXPANSION_FORM_END";
        TokenType[TokenType["EOF"] = 19] = "EOF";
    })(TokenType = exports.TokenType || (exports.TokenType = {}));
    var Token = /** @class */ (function () {
        function Token(type, parts, sourceSpan) {
            this.type = type;
            this.parts = parts;
            this.sourceSpan = sourceSpan;
        }
        return Token;
    }());
    exports.Token = Token;
    var TokenError = /** @class */ (function (_super) {
        tslib_1.__extends(TokenError, _super);
        function TokenError(errorMsg, tokenType, span) {
            var _this = _super.call(this, span, errorMsg) || this;
            _this.tokenType = tokenType;
            return _this;
        }
        return TokenError;
    }(parse_util_1.ParseError));
    exports.TokenError = TokenError;
    var TokenizeResult = /** @class */ (function () {
        function TokenizeResult(tokens, errors) {
            this.tokens = tokens;
            this.errors = errors;
        }
        return TokenizeResult;
    }());
    exports.TokenizeResult = TokenizeResult;
    function tokenize(source, url, getTagDefinition, tokenizeExpansionForms, interpolationConfig) {
        if (tokenizeExpansionForms === void 0) { tokenizeExpansionForms = false; }
        if (interpolationConfig === void 0) { interpolationConfig = interpolation_config_1.DEFAULT_INTERPOLATION_CONFIG; }
        return new _Tokenizer(new parse_util_1.ParseSourceFile(source, url), getTagDefinition, tokenizeExpansionForms, interpolationConfig)
            .tokenize();
    }
    exports.tokenize = tokenize;
    var _CR_OR_CRLF_REGEXP = /\r\n?/g;
    function _unexpectedCharacterErrorMsg(charCode) {
        var char = charCode === chars.$EOF ? 'EOF' : String.fromCharCode(charCode);
        return "Unexpected character \"" + char + "\"";
    }
    function _unknownEntityErrorMsg(entitySrc) {
        return "Unknown entity \"" + entitySrc + "\" - use the \"&#<decimal>;\" or  \"&#x<hex>;\" syntax";
    }
    var _ControlFlowError = /** @class */ (function () {
        function _ControlFlowError(error) {
            this.error = error;
        }
        return _ControlFlowError;
    }());
    // See http://www.w3.org/TR/html51/syntax.html#writing
    var _Tokenizer = /** @class */ (function () {
        /**
         * @param _file The html source
         * @param _getTagDefinition
         * @param _tokenizeIcu Whether to tokenize ICU messages (considered as text nodes when false)
         * @param _interpolationConfig
         */
        function _Tokenizer(_file, _getTagDefinition, _tokenizeIcu, _interpolationConfig) {
            if (_interpolationConfig === void 0) { _interpolationConfig = interpolation_config_1.DEFAULT_INTERPOLATION_CONFIG; }
            this._file = _file;
            this._getTagDefinition = _getTagDefinition;
            this._tokenizeIcu = _tokenizeIcu;
            this._interpolationConfig = _interpolationConfig;
            // Note: this is always lowercase!
            this._peek = -1;
            this._nextPeek = -1;
            this._index = -1;
            this._line = 0;
            this._column = -1;
            this._expansionCaseStack = [];
            this._inInterpolation = false;
            this.tokens = [];
            this.errors = [];
            this._input = _file.content;
            this._length = _file.content.length;
            this._advance();
        }
        _Tokenizer.prototype._processCarriageReturns = function (content) {
            // http://www.w3.org/TR/html5/syntax.html#preprocessing-the-input-stream
            // In order to keep the original position in the source, we can not
            // pre-process it.
            // Instead CRs are processed right before instantiating the tokens.
            return content.replace(_CR_OR_CRLF_REGEXP, '\n');
        };
        _Tokenizer.prototype.tokenize = function () {
            while (this._peek !== chars.$EOF) {
                var start = this._getLocation();
                try {
                    if (this._attemptCharCode(chars.$LT)) {
                        if (this._attemptCharCode(chars.$BANG)) {
                            if (this._attemptCharCode(chars.$LBRACKET)) {
                                this._consumeCdata(start);
                            }
                            else if (this._attemptCharCode(chars.$MINUS)) {
                                this._consumeComment(start);
                            }
                            else {
                                this._consumeDocType(start);
                            }
                        }
                        else if (this._attemptCharCode(chars.$SLASH)) {
                            this._consumeTagClose(start);
                        }
                        else {
                            this._consumeTagOpen(start);
                        }
                    }
                    else if (!(this._tokenizeIcu && this._tokenizeExpansionForm())) {
                        this._consumeText();
                    }
                }
                catch (e) {
                    if (e instanceof _ControlFlowError) {
                        this.errors.push(e.error);
                    }
                    else {
                        throw e;
                    }
                }
            }
            this._beginToken(TokenType.EOF);
            this._endToken([]);
            return new TokenizeResult(mergeTextTokens(this.tokens), this.errors);
        };
        /**
         * @returns whether an ICU token has been created
         * @internal
         */
        _Tokenizer.prototype._tokenizeExpansionForm = function () {
            if (isExpansionFormStart(this._input, this._index, this._interpolationConfig)) {
                this._consumeExpansionFormStart();
                return true;
            }
            if (isExpansionCaseStart(this._peek) && this._isInExpansionForm()) {
                this._consumeExpansionCaseStart();
                return true;
            }
            if (this._peek === chars.$RBRACE) {
                if (this._isInExpansionCase()) {
                    this._consumeExpansionCaseEnd();
                    return true;
                }
                if (this._isInExpansionForm()) {
                    this._consumeExpansionFormEnd();
                    return true;
                }
            }
            return false;
        };
        _Tokenizer.prototype._getLocation = function () {
            return new parse_util_1.ParseLocation(this._file, this._index, this._line, this._column);
        };
        _Tokenizer.prototype._getSpan = function (start, end) {
            if (start === void 0) { start = this._getLocation(); }
            if (end === void 0) { end = this._getLocation(); }
            return new parse_util_1.ParseSourceSpan(start, end);
        };
        _Tokenizer.prototype._beginToken = function (type, start) {
            if (start === void 0) { start = this._getLocation(); }
            this._currentTokenStart = start;
            this._currentTokenType = type;
        };
        _Tokenizer.prototype._endToken = function (parts, end) {
            if (end === void 0) { end = this._getLocation(); }
            var token = new Token(this._currentTokenType, parts, new parse_util_1.ParseSourceSpan(this._currentTokenStart, end));
            this.tokens.push(token);
            this._currentTokenStart = null;
            this._currentTokenType = null;
            return token;
        };
        _Tokenizer.prototype._createError = function (msg, span) {
            if (this._isInExpansionForm()) {
                msg += " (Do you have an unescaped \"{\" in your template? Use \"{{ '{' }}\") to escape it.)";
            }
            var error = new TokenError(msg, this._currentTokenType, span);
            this._currentTokenStart = null;
            this._currentTokenType = null;
            return new _ControlFlowError(error);
        };
        _Tokenizer.prototype._advance = function () {
            if (this._index >= this._length) {
                throw this._createError(_unexpectedCharacterErrorMsg(chars.$EOF), this._getSpan());
            }
            if (this._peek === chars.$LF) {
                this._line++;
                this._column = 0;
            }
            else if (this._peek !== chars.$LF && this._peek !== chars.$CR) {
                this._column++;
            }
            this._index++;
            this._peek = this._index >= this._length ? chars.$EOF : this._input.charCodeAt(this._index);
            this._nextPeek =
                this._index + 1 >= this._length ? chars.$EOF : this._input.charCodeAt(this._index + 1);
        };
        _Tokenizer.prototype._attemptCharCode = function (charCode) {
            if (this._peek === charCode) {
                this._advance();
                return true;
            }
            return false;
        };
        _Tokenizer.prototype._attemptCharCodeCaseInsensitive = function (charCode) {
            if (compareCharCodeCaseInsensitive(this._peek, charCode)) {
                this._advance();
                return true;
            }
            return false;
        };
        _Tokenizer.prototype._requireCharCode = function (charCode) {
            var location = this._getLocation();
            if (!this._attemptCharCode(charCode)) {
                throw this._createError(_unexpectedCharacterErrorMsg(this._peek), this._getSpan(location, location));
            }
        };
        _Tokenizer.prototype._attemptStr = function (chars) {
            var len = chars.length;
            if (this._index + len > this._length) {
                return false;
            }
            var initialPosition = this._savePosition();
            for (var i = 0; i < len; i++) {
                if (!this._attemptCharCode(chars.charCodeAt(i))) {
                    // If attempting to parse the string fails, we want to reset the parser
                    // to where it was before the attempt
                    this._restorePosition(initialPosition);
                    return false;
                }
            }
            return true;
        };
        _Tokenizer.prototype._attemptStrCaseInsensitive = function (chars) {
            for (var i = 0; i < chars.length; i++) {
                if (!this._attemptCharCodeCaseInsensitive(chars.charCodeAt(i))) {
                    return false;
                }
            }
            return true;
        };
        _Tokenizer.prototype._requireStr = function (chars) {
            var location = this._getLocation();
            if (!this._attemptStr(chars)) {
                throw this._createError(_unexpectedCharacterErrorMsg(this._peek), this._getSpan(location));
            }
        };
        _Tokenizer.prototype._attemptCharCodeUntilFn = function (predicate) {
            while (!predicate(this._peek)) {
                this._advance();
            }
        };
        _Tokenizer.prototype._requireCharCodeUntilFn = function (predicate, len) {
            var start = this._getLocation();
            this._attemptCharCodeUntilFn(predicate);
            if (this._index - start.offset < len) {
                throw this._createError(_unexpectedCharacterErrorMsg(this._peek), this._getSpan(start, start));
            }
        };
        _Tokenizer.prototype._attemptUntilChar = function (char) {
            while (this._peek !== char) {
                this._advance();
            }
        };
        _Tokenizer.prototype._readChar = function (decodeEntities) {
            if (decodeEntities && this._peek === chars.$AMPERSAND) {
                return this._decodeEntity();
            }
            else {
                var index = this._index;
                this._advance();
                return this._input[index];
            }
        };
        _Tokenizer.prototype._decodeEntity = function () {
            var start = this._getLocation();
            this._advance();
            if (this._attemptCharCode(chars.$HASH)) {
                var isHex = this._attemptCharCode(chars.$x) || this._attemptCharCode(chars.$X);
                var numberStart = this._getLocation().offset;
                this._attemptCharCodeUntilFn(isDigitEntityEnd);
                if (this._peek != chars.$SEMICOLON) {
                    throw this._createError(_unexpectedCharacterErrorMsg(this._peek), this._getSpan());
                }
                this._advance();
                var strNum = this._input.substring(numberStart, this._index - 1);
                try {
                    var charCode = parseInt(strNum, isHex ? 16 : 10);
                    return String.fromCharCode(charCode);
                }
                catch (e) {
                    var entity = this._input.substring(start.offset + 1, this._index - 1);
                    throw this._createError(_unknownEntityErrorMsg(entity), this._getSpan(start));
                }
            }
            else {
                var startPosition = this._savePosition();
                this._attemptCharCodeUntilFn(isNamedEntityEnd);
                if (this._peek != chars.$SEMICOLON) {
                    this._restorePosition(startPosition);
                    return '&';
                }
                this._advance();
                var name_1 = this._input.substring(start.offset + 1, this._index - 1);
                var char = tags_1.NAMED_ENTITIES[name_1];
                if (!char) {
                    throw this._createError(_unknownEntityErrorMsg(name_1), this._getSpan(start));
                }
                return char;
            }
        };
        _Tokenizer.prototype._consumeRawText = function (decodeEntities, firstCharOfEnd, attemptEndRest) {
            var tagCloseStart;
            var textStart = this._getLocation();
            this._beginToken(decodeEntities ? TokenType.ESCAPABLE_RAW_TEXT : TokenType.RAW_TEXT, textStart);
            var parts = [];
            while (true) {
                tagCloseStart = this._getLocation();
                if (this._attemptCharCode(firstCharOfEnd) && attemptEndRest()) {
                    break;
                }
                if (this._index > tagCloseStart.offset) {
                    // add the characters consumed by the previous if statement to the output
                    parts.push(this._input.substring(tagCloseStart.offset, this._index));
                }
                while (this._peek !== firstCharOfEnd) {
                    parts.push(this._readChar(decodeEntities));
                }
            }
            return this._endToken([this._processCarriageReturns(parts.join(''))], tagCloseStart);
        };
        _Tokenizer.prototype._consumeComment = function (start) {
            var _this = this;
            this._beginToken(TokenType.COMMENT_START, start);
            this._requireCharCode(chars.$MINUS);
            this._endToken([]);
            var textToken = this._consumeRawText(false, chars.$MINUS, function () { return _this._attemptStr('->'); });
            this._beginToken(TokenType.COMMENT_END, textToken.sourceSpan.end);
            this._endToken([]);
        };
        _Tokenizer.prototype._consumeCdata = function (start) {
            var _this = this;
            this._beginToken(TokenType.CDATA_START, start);
            this._requireStr('CDATA[');
            this._endToken([]);
            var textToken = this._consumeRawText(false, chars.$RBRACKET, function () { return _this._attemptStr(']>'); });
            this._beginToken(TokenType.CDATA_END, textToken.sourceSpan.end);
            this._endToken([]);
        };
        _Tokenizer.prototype._consumeDocType = function (start) {
            this._beginToken(TokenType.DOC_TYPE, start);
            this._attemptUntilChar(chars.$GT);
            this._advance();
            this._endToken([this._input.substring(start.offset + 2, this._index - 1)]);
        };
        _Tokenizer.prototype._consumePrefixAndName = function () {
            var nameOrPrefixStart = this._index;
            var prefix = null;
            while (this._peek !== chars.$COLON && !isPrefixEnd(this._peek)) {
                this._advance();
            }
            var nameStart;
            if (this._peek === chars.$COLON) {
                this._advance();
                prefix = this._input.substring(nameOrPrefixStart, this._index - 1);
                nameStart = this._index;
            }
            else {
                nameStart = nameOrPrefixStart;
            }
            this._requireCharCodeUntilFn(isNameEnd, this._index === nameStart ? 1 : 0);
            var name = this._input.substring(nameStart, this._index);
            return [prefix, name];
        };
        _Tokenizer.prototype._consumeTagOpen = function (start) {
            var savedPos = this._savePosition();
            var tagName;
            var lowercaseTagName;
            try {
                if (!chars.isAsciiLetter(this._peek)) {
                    throw this._createError(_unexpectedCharacterErrorMsg(this._peek), this._getSpan());
                }
                var nameStart = this._index;
                this._consumeTagOpenStart(start);
                tagName = this._input.substring(nameStart, this._index);
                lowercaseTagName = tagName.toLowerCase();
                this._attemptCharCodeUntilFn(isNotWhitespace);
                while (this._peek !== chars.$SLASH && this._peek !== chars.$GT) {
                    this._consumeAttributeName();
                    this._attemptCharCodeUntilFn(isNotWhitespace);
                    if (this._attemptCharCode(chars.$EQ)) {
                        this._attemptCharCodeUntilFn(isNotWhitespace);
                        this._consumeAttributeValue();
                    }
                    this._attemptCharCodeUntilFn(isNotWhitespace);
                }
                this._consumeTagOpenEnd();
            }
            catch (e) {
                if (e instanceof _ControlFlowError) {
                    // When the start tag is invalid, assume we want a "<"
                    this._restorePosition(savedPos);
                    // Back to back text tokens are merged at the end
                    this._beginToken(TokenType.TEXT, start);
                    this._endToken(['<']);
                    return;
                }
                throw e;
            }
            var contentTokenType = this._getTagDefinition(tagName).contentType;
            if (contentTokenType === tags_1.TagContentType.RAW_TEXT) {
                this._consumeRawTextWithTagClose(lowercaseTagName, false);
            }
            else if (contentTokenType === tags_1.TagContentType.ESCAPABLE_RAW_TEXT) {
                this._consumeRawTextWithTagClose(lowercaseTagName, true);
            }
        };
        _Tokenizer.prototype._consumeRawTextWithTagClose = function (lowercaseTagName, decodeEntities) {
            var _this = this;
            var textToken = this._consumeRawText(decodeEntities, chars.$LT, function () {
                if (!_this._attemptCharCode(chars.$SLASH))
                    return false;
                _this._attemptCharCodeUntilFn(isNotWhitespace);
                if (!_this._attemptStrCaseInsensitive(lowercaseTagName))
                    return false;
                _this._attemptCharCodeUntilFn(isNotWhitespace);
                return _this._attemptCharCode(chars.$GT);
            });
            this._beginToken(TokenType.TAG_CLOSE, textToken.sourceSpan.end);
            this._endToken([null, lowercaseTagName]);
        };
        _Tokenizer.prototype._consumeTagOpenStart = function (start) {
            this._beginToken(TokenType.TAG_OPEN_START, start);
            var parts = this._consumePrefixAndName();
            this._endToken(parts);
        };
        _Tokenizer.prototype._consumeAttributeName = function () {
            this._beginToken(TokenType.ATTR_NAME);
            var prefixAndName = this._consumePrefixAndName();
            this._endToken(prefixAndName);
        };
        _Tokenizer.prototype._consumeAttributeValue = function () {
            this._beginToken(TokenType.ATTR_VALUE);
            var value;
            if (this._peek === chars.$SQ || this._peek === chars.$DQ) {
                var quoteChar = this._peek;
                this._advance();
                var parts = [];
                while (this._peek !== quoteChar) {
                    parts.push(this._readChar(true));
                }
                value = parts.join('');
                this._advance();
            }
            else {
                var valueStart = this._index;
                this._requireCharCodeUntilFn(isNameEnd, 1);
                value = this._input.substring(valueStart, this._index);
            }
            this._endToken([this._processCarriageReturns(value)]);
        };
        _Tokenizer.prototype._consumeTagOpenEnd = function () {
            var tokenType = this._attemptCharCode(chars.$SLASH) ? TokenType.TAG_OPEN_END_VOID : TokenType.TAG_OPEN_END;
            this._beginToken(tokenType);
            this._requireCharCode(chars.$GT);
            this._endToken([]);
        };
        _Tokenizer.prototype._consumeTagClose = function (start) {
            this._beginToken(TokenType.TAG_CLOSE, start);
            this._attemptCharCodeUntilFn(isNotWhitespace);
            var prefixAndName = this._consumePrefixAndName();
            this._attemptCharCodeUntilFn(isNotWhitespace);
            this._requireCharCode(chars.$GT);
            this._endToken(prefixAndName);
        };
        _Tokenizer.prototype._consumeExpansionFormStart = function () {
            this._beginToken(TokenType.EXPANSION_FORM_START, this._getLocation());
            this._requireCharCode(chars.$LBRACE);
            this._endToken([]);
            this._expansionCaseStack.push(TokenType.EXPANSION_FORM_START);
            this._beginToken(TokenType.RAW_TEXT, this._getLocation());
            var condition = this._readUntil(chars.$COMMA);
            this._endToken([condition], this._getLocation());
            this._requireCharCode(chars.$COMMA);
            this._attemptCharCodeUntilFn(isNotWhitespace);
            this._beginToken(TokenType.RAW_TEXT, this._getLocation());
            var type = this._readUntil(chars.$COMMA);
            this._endToken([type], this._getLocation());
            this._requireCharCode(chars.$COMMA);
            this._attemptCharCodeUntilFn(isNotWhitespace);
        };
        _Tokenizer.prototype._consumeExpansionCaseStart = function () {
            this._beginToken(TokenType.EXPANSION_CASE_VALUE, this._getLocation());
            var value = this._readUntil(chars.$LBRACE).trim();
            this._endToken([value], this._getLocation());
            this._attemptCharCodeUntilFn(isNotWhitespace);
            this._beginToken(TokenType.EXPANSION_CASE_EXP_START, this._getLocation());
            this._requireCharCode(chars.$LBRACE);
            this._endToken([], this._getLocation());
            this._attemptCharCodeUntilFn(isNotWhitespace);
            this._expansionCaseStack.push(TokenType.EXPANSION_CASE_EXP_START);
        };
        _Tokenizer.prototype._consumeExpansionCaseEnd = function () {
            this._beginToken(TokenType.EXPANSION_CASE_EXP_END, this._getLocation());
            this._requireCharCode(chars.$RBRACE);
            this._endToken([], this._getLocation());
            this._attemptCharCodeUntilFn(isNotWhitespace);
            this._expansionCaseStack.pop();
        };
        _Tokenizer.prototype._consumeExpansionFormEnd = function () {
            this._beginToken(TokenType.EXPANSION_FORM_END, this._getLocation());
            this._requireCharCode(chars.$RBRACE);
            this._endToken([]);
            this._expansionCaseStack.pop();
        };
        _Tokenizer.prototype._consumeText = function () {
            var start = this._getLocation();
            this._beginToken(TokenType.TEXT, start);
            var parts = [];
            do {
                if (this._interpolationConfig && this._attemptStr(this._interpolationConfig.start)) {
                    parts.push(this._interpolationConfig.start);
                    this._inInterpolation = true;
                }
                else if (this._interpolationConfig && this._inInterpolation &&
                    this._attemptStr(this._interpolationConfig.end)) {
                    parts.push(this._interpolationConfig.end);
                    this._inInterpolation = false;
                }
                else {
                    parts.push(this._readChar(true));
                }
            } while (!this._isTextEnd());
            this._endToken([this._processCarriageReturns(parts.join(''))]);
        };
        _Tokenizer.prototype._isTextEnd = function () {
            if (this._peek === chars.$LT || this._peek === chars.$EOF) {
                return true;
            }
            if (this._tokenizeIcu && !this._inInterpolation) {
                if (isExpansionFormStart(this._input, this._index, this._interpolationConfig)) {
                    // start of an expansion form
                    return true;
                }
                if (this._peek === chars.$RBRACE && this._isInExpansionCase()) {
                    // end of and expansion case
                    return true;
                }
            }
            return false;
        };
        _Tokenizer.prototype._savePosition = function () {
            return [this._peek, this._index, this._column, this._line, this.tokens.length];
        };
        _Tokenizer.prototype._readUntil = function (char) {
            var start = this._index;
            this._attemptUntilChar(char);
            return this._input.substring(start, this._index);
        };
        _Tokenizer.prototype._restorePosition = function (position) {
            this._peek = position[0];
            this._index = position[1];
            this._column = position[2];
            this._line = position[3];
            var nbTokens = position[4];
            if (nbTokens < this.tokens.length) {
                // remove any extra tokens
                this.tokens = this.tokens.slice(0, nbTokens);
            }
        };
        _Tokenizer.prototype._isInExpansionCase = function () {
            return this._expansionCaseStack.length > 0 &&
                this._expansionCaseStack[this._expansionCaseStack.length - 1] ===
                    TokenType.EXPANSION_CASE_EXP_START;
        };
        _Tokenizer.prototype._isInExpansionForm = function () {
            return this._expansionCaseStack.length > 0 &&
                this._expansionCaseStack[this._expansionCaseStack.length - 1] ===
                    TokenType.EXPANSION_FORM_START;
        };
        return _Tokenizer;
    }());
    function isNotWhitespace(code) {
        return !chars.isWhitespace(code) || code === chars.$EOF;
    }
    function isNameEnd(code) {
        return chars.isWhitespace(code) || code === chars.$GT || code === chars.$SLASH ||
            code === chars.$SQ || code === chars.$DQ || code === chars.$EQ;
    }
    function isPrefixEnd(code) {
        return (code < chars.$a || chars.$z < code) && (code < chars.$A || chars.$Z < code) &&
            (code < chars.$0 || code > chars.$9);
    }
    function isDigitEntityEnd(code) {
        return code == chars.$SEMICOLON || code == chars.$EOF || !chars.isAsciiHexDigit(code);
    }
    function isNamedEntityEnd(code) {
        return code == chars.$SEMICOLON || code == chars.$EOF || !chars.isAsciiLetter(code);
    }
    function isExpansionFormStart(input, offset, interpolationConfig) {
        var isInterpolationStart = interpolationConfig ? input.indexOf(interpolationConfig.start, offset) == offset : false;
        return input.charCodeAt(offset) == chars.$LBRACE && !isInterpolationStart;
    }
    function isExpansionCaseStart(peek) {
        return peek === chars.$EQ || chars.isAsciiLetter(peek) || chars.isDigit(peek);
    }
    function compareCharCodeCaseInsensitive(code1, code2) {
        return toUpperCaseCharCode(code1) == toUpperCaseCharCode(code2);
    }
    function toUpperCaseCharCode(code) {
        return code >= chars.$a && code <= chars.$z ? code - chars.$a + chars.$A : code;
    }
    function mergeTextTokens(srcTokens) {
        var dstTokens = [];
        var lastDstToken = undefined;
        for (var i = 0; i < srcTokens.length; i++) {
            var token = srcTokens[i];
            if (lastDstToken && lastDstToken.type == TokenType.TEXT && token.type == TokenType.TEXT) {
                lastDstToken.parts[0] += token.parts[0];
                lastDstToken.sourceSpan.end = token.sourceSpan.end;
            }
            else {
                lastDstToken = token;
                dstTokens.push(lastDstToken);
            }
        }
        return dstTokens;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvbWxfcGFyc2VyL2xleGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILG1EQUFrQztJQUNsQywrREFBMEY7SUFFMUYsNkZBQXlGO0lBQ3pGLDZEQUFxRTtJQUVyRSxJQUFZLFNBcUJYO0lBckJELFdBQVksU0FBUztRQUNuQiw2REFBYyxDQUFBO1FBQ2QseURBQVksQ0FBQTtRQUNaLG1FQUFpQixDQUFBO1FBQ2pCLG1EQUFTLENBQUE7UUFDVCx5Q0FBSSxDQUFBO1FBQ0oscUVBQWtCLENBQUE7UUFDbEIsaURBQVEsQ0FBQTtRQUNSLDJEQUFhLENBQUE7UUFDYix1REFBVyxDQUFBO1FBQ1gsdURBQVcsQ0FBQTtRQUNYLG9EQUFTLENBQUE7UUFDVCxvREFBUyxDQUFBO1FBQ1Qsc0RBQVUsQ0FBQTtRQUNWLGtEQUFRLENBQUE7UUFDUiwwRUFBb0IsQ0FBQTtRQUNwQiwwRUFBb0IsQ0FBQTtRQUNwQixrRkFBd0IsQ0FBQTtRQUN4Qiw4RUFBc0IsQ0FBQTtRQUN0QixzRUFBa0IsQ0FBQTtRQUNsQix3Q0FBRyxDQUFBO0lBQ0wsQ0FBQyxFQXJCVyxTQUFTLEdBQVQsaUJBQVMsS0FBVCxpQkFBUyxRQXFCcEI7SUFFRDtRQUNFLGVBQW1CLElBQWUsRUFBUyxLQUFlLEVBQVMsVUFBMkI7WUFBM0UsU0FBSSxHQUFKLElBQUksQ0FBVztZQUFTLFVBQUssR0FBTCxLQUFLLENBQVU7WUFBUyxlQUFVLEdBQVYsVUFBVSxDQUFpQjtRQUFHLENBQUM7UUFDcEcsWUFBQztJQUFELENBQUMsQUFGRCxJQUVDO0lBRlksc0JBQUs7SUFJbEI7UUFBZ0Msc0NBQVU7UUFDeEMsb0JBQVksUUFBZ0IsRUFBUyxTQUFvQixFQUFFLElBQXFCO1lBQWhGLFlBQ0Usa0JBQU0sSUFBSSxFQUFFLFFBQVEsQ0FBQyxTQUN0QjtZQUZvQyxlQUFTLEdBQVQsU0FBUyxDQUFXOztRQUV6RCxDQUFDO1FBQ0gsaUJBQUM7SUFBRCxDQUFDLEFBSkQsQ0FBZ0MsdUJBQVUsR0FJekM7SUFKWSxnQ0FBVTtJQU12QjtRQUNFLHdCQUFtQixNQUFlLEVBQVMsTUFBb0I7WUFBNUMsV0FBTSxHQUFOLE1BQU0sQ0FBUztZQUFTLFdBQU0sR0FBTixNQUFNLENBQWM7UUFBRyxDQUFDO1FBQ3JFLHFCQUFDO0lBQUQsQ0FBQyxBQUZELElBRUM7SUFGWSx3Q0FBYztJQUkzQixTQUFnQixRQUFRLENBQ3BCLE1BQWMsRUFBRSxHQUFXLEVBQUUsZ0JBQW9ELEVBQ2pGLHNCQUF1QyxFQUN2QyxtQkFBdUU7UUFEdkUsdUNBQUEsRUFBQSw4QkFBdUM7UUFDdkMsb0NBQUEsRUFBQSxzQkFBMkMsbURBQTRCO1FBQ3pFLE9BQU8sSUFBSSxVQUFVLENBQ1YsSUFBSSw0QkFBZSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxzQkFBc0IsRUFDMUUsbUJBQW1CLENBQUM7YUFDMUIsUUFBUSxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQVJELDRCQVFDO0lBRUQsSUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUM7SUFFcEMsU0FBUyw0QkFBNEIsQ0FBQyxRQUFnQjtRQUNwRCxJQUFNLElBQUksR0FBRyxRQUFRLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdFLE9BQU8sNEJBQXlCLElBQUksT0FBRyxDQUFDO0lBQzFDLENBQUM7SUFFRCxTQUFTLHNCQUFzQixDQUFDLFNBQWlCO1FBQy9DLE9BQU8sc0JBQW1CLFNBQVMsMkRBQW1ELENBQUM7SUFDekYsQ0FBQztJQUVEO1FBQ0UsMkJBQW1CLEtBQWlCO1lBQWpCLFVBQUssR0FBTCxLQUFLLENBQVk7UUFBRyxDQUFDO1FBQzFDLHdCQUFDO0lBQUQsQ0FBQyxBQUZELElBRUM7SUFFRCxzREFBc0Q7SUFDdEQ7UUFtQkU7Ozs7O1dBS0c7UUFDSCxvQkFDWSxLQUFzQixFQUFVLGlCQUFxRCxFQUNyRixZQUFxQixFQUNyQixvQkFBd0U7WUFBeEUscUNBQUEsRUFBQSx1QkFBNEMsbURBQTRCO1lBRnhFLFVBQUssR0FBTCxLQUFLLENBQWlCO1lBQVUsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQztZQUNyRixpQkFBWSxHQUFaLFlBQVksQ0FBUztZQUNyQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQW9EO1lBekJwRixrQ0FBa0M7WUFDMUIsVUFBSyxHQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ25CLGNBQVMsR0FBVyxDQUFDLENBQUMsQ0FBQztZQUN2QixXQUFNLEdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDcEIsVUFBSyxHQUFXLENBQUMsQ0FBQztZQUNsQixZQUFPLEdBQVcsQ0FBQyxDQUFDLENBQUM7WUFLckIsd0JBQW1CLEdBQWdCLEVBQUUsQ0FBQztZQUN0QyxxQkFBZ0IsR0FBWSxLQUFLLENBQUM7WUFFMUMsV0FBTSxHQUFZLEVBQUUsQ0FBQztZQUNyQixXQUFNLEdBQWlCLEVBQUUsQ0FBQztZQVl4QixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7WUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNwQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbEIsQ0FBQztRQUVPLDRDQUF1QixHQUEvQixVQUFnQyxPQUFlO1lBQzdDLHdFQUF3RTtZQUN4RSxtRUFBbUU7WUFDbkUsa0JBQWtCO1lBQ2xCLG1FQUFtRTtZQUNuRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELDZCQUFRLEdBQVI7WUFDRSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLElBQUksRUFBRTtnQkFDaEMsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNsQyxJQUFJO29CQUNGLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDcEMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFOzRCQUN0QyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0NBQzFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7NkJBQzNCO2lDQUFNLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRTtnQ0FDOUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQzs2QkFDN0I7aUNBQU07Z0NBQ0wsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQzs2QkFDN0I7eUJBQ0Y7NkJBQU0sSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFOzRCQUM5QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQzlCOzZCQUFNOzRCQUNMLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQzdCO3FCQUNGO3lCQUFNLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUMsRUFBRTt3QkFDaEUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO3FCQUNyQjtpQkFDRjtnQkFBQyxPQUFPLENBQUMsRUFBRTtvQkFDVixJQUFJLENBQUMsWUFBWSxpQkFBaUIsRUFBRTt3QkFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO3FCQUMzQjt5QkFBTTt3QkFDTCxNQUFNLENBQUMsQ0FBQztxQkFDVDtpQkFDRjthQUNGO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNuQixPQUFPLElBQUksY0FBYyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRDs7O1dBR0c7UUFDSywyQ0FBc0IsR0FBOUI7WUFDRSxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsRUFBRTtnQkFDN0UsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7Z0JBQ2xDLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsRUFBRTtnQkFDakUsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7Z0JBQ2xDLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLE9BQU8sRUFBRTtnQkFDaEMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsRUFBRTtvQkFDN0IsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7b0JBQ2hDLE9BQU8sSUFBSSxDQUFDO2lCQUNiO2dCQUVELElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFLEVBQUU7b0JBQzdCLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO29CQUNoQyxPQUFPLElBQUksQ0FBQztpQkFDYjthQUNGO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO1FBRU8saUNBQVksR0FBcEI7WUFDRSxPQUFPLElBQUksMEJBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVPLDZCQUFRLEdBQWhCLFVBQ0ksS0FBMEMsRUFDMUMsR0FBd0M7WUFEeEMsc0JBQUEsRUFBQSxRQUF1QixJQUFJLENBQUMsWUFBWSxFQUFFO1lBQzFDLG9CQUFBLEVBQUEsTUFBcUIsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUMxQyxPQUFPLElBQUksNEJBQWUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVPLGdDQUFXLEdBQW5CLFVBQW9CLElBQWUsRUFBRSxLQUEwQztZQUExQyxzQkFBQSxFQUFBLFFBQXVCLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDN0UsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztZQUNoQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBQ2hDLENBQUM7UUFFTyw4QkFBUyxHQUFqQixVQUFrQixLQUFlLEVBQUUsR0FBd0M7WUFBeEMsb0JBQUEsRUFBQSxNQUFxQixJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ3pFLElBQU0sS0FBSyxHQUNQLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsSUFBSSw0QkFBZSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFNLENBQUM7WUFDakMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQU0sQ0FBQztZQUNoQyxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7UUFFTyxpQ0FBWSxHQUFwQixVQUFxQixHQUFXLEVBQUUsSUFBcUI7WUFDckQsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsRUFBRTtnQkFDN0IsR0FBRyxJQUFJLHNGQUFrRixDQUFDO2FBQzNGO1lBQ0QsSUFBTSxLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBTSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFNLENBQUM7WUFDaEMsT0FBTyxJQUFJLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFTyw2QkFBUSxHQUFoQjtZQUNFLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUMvQixNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsNEJBQTRCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2FBQ3BGO1lBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxHQUFHLEVBQUU7Z0JBQzVCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDYixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQzthQUNsQjtpQkFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxHQUFHLEVBQUU7Z0JBQy9ELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUNoQjtZQUNELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNkLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUYsSUFBSSxDQUFDLFNBQVM7Z0JBQ1YsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM3RixDQUFDO1FBRU8scUNBQWdCLEdBQXhCLFVBQXlCLFFBQWdCO1lBQ3ZDLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUU7Z0JBQzNCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztRQUVPLG9EQUErQixHQUF2QyxVQUF3QyxRQUFnQjtZQUN0RCxJQUFJLDhCQUE4QixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQ3hELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztRQUVPLHFDQUFnQixHQUF4QixVQUF5QixRQUFnQjtZQUN2QyxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDcEMsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUNuQiw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQzthQUNsRjtRQUNILENBQUM7UUFFTyxnQ0FBVyxHQUFuQixVQUFvQixLQUFhO1lBQy9CLElBQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDekIsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNwQyxPQUFPLEtBQUssQ0FBQzthQUNkO1lBQ0QsSUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzdDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUMvQyx1RUFBdUU7b0JBQ3ZFLHFDQUFxQztvQkFDckMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUN2QyxPQUFPLEtBQUssQ0FBQztpQkFDZDthQUNGO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRU8sK0NBQTBCLEdBQWxDLFVBQW1DLEtBQWE7WUFDOUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsK0JBQStCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUM5RCxPQUFPLEtBQUssQ0FBQztpQkFDZDthQUNGO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRU8sZ0NBQVcsR0FBbkIsVUFBb0IsS0FBYTtZQUMvQixJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzVCLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2FBQzVGO1FBQ0gsQ0FBQztRQUVPLDRDQUF1QixHQUEvQixVQUFnQyxTQUFvQztZQUNsRSxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDN0IsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2FBQ2pCO1FBQ0gsQ0FBQztRQUVPLDRDQUF1QixHQUEvQixVQUFnQyxTQUFvQyxFQUFFLEdBQVc7WUFDL0UsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN4QyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLEVBQUU7Z0JBQ3BDLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FDbkIsNEJBQTRCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFDNUU7UUFDSCxDQUFDO1FBRU8sc0NBQWlCLEdBQXpCLFVBQTBCLElBQVk7WUFDcEMsT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksRUFBRTtnQkFDMUIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2FBQ2pCO1FBQ0gsQ0FBQztRQUVPLDhCQUFTLEdBQWpCLFVBQWtCLGNBQXVCO1lBQ3ZDLElBQUksY0FBYyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLFVBQVUsRUFBRTtnQkFDckQsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDN0I7aUJBQU07Z0JBQ0wsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFDMUIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNoQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDM0I7UUFDSCxDQUFDO1FBRU8sa0NBQWEsR0FBckI7WUFDRSxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hCLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDdEMsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRixJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsTUFBTSxDQUFDO2dCQUMvQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7b0JBQ2xDLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7aUJBQ3BGO2dCQUNELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDaEIsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLElBQUk7b0JBQ0YsSUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ25ELE9BQU8sTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDdEM7Z0JBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ1YsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDeEUsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDL0U7YUFDRjtpQkFBTTtnQkFDTCxJQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzNDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtvQkFDbEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDO29CQUNyQyxPQUFPLEdBQUcsQ0FBQztpQkFDWjtnQkFDRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2hCLElBQU0sTUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RFLElBQU0sSUFBSSxHQUFHLHFCQUFjLENBQUMsTUFBSSxDQUFDLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxJQUFJLEVBQUU7b0JBQ1QsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLHNCQUFzQixDQUFDLE1BQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDN0U7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7YUFDYjtRQUNILENBQUM7UUFFTyxvQ0FBZSxHQUF2QixVQUNJLGNBQXVCLEVBQUUsY0FBc0IsRUFBRSxjQUE2QjtZQUNoRixJQUFJLGFBQTRCLENBQUM7WUFDakMsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDaEcsSUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO1lBQzNCLE9BQU8sSUFBSSxFQUFFO2dCQUNYLGFBQWEsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3BDLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxJQUFJLGNBQWMsRUFBRSxFQUFFO29CQUM3RCxNQUFNO2lCQUNQO2dCQUNELElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUN0Qyx5RUFBeUU7b0JBQ3pFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztpQkFDdEU7Z0JBQ0QsT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLGNBQWMsRUFBRTtvQkFDcEMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7aUJBQzVDO2FBQ0Y7WUFDRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDdkYsQ0FBQztRQUVPLG9DQUFlLEdBQXZCLFVBQXdCLEtBQW9CO1lBQTVDLGlCQU9DO1lBTkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNuQixJQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUF0QixDQUFzQixDQUFDLENBQUM7WUFDMUYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNyQixDQUFDO1FBRU8sa0NBQWEsR0FBckIsVUFBc0IsS0FBb0I7WUFBMUMsaUJBT0M7WUFOQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25CLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsY0FBTSxPQUFBLEtBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQXRCLENBQXNCLENBQUMsQ0FBQztZQUM3RixJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3JCLENBQUM7UUFFTyxvQ0FBZSxHQUF2QixVQUF3QixLQUFvQjtZQUMxQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFFTywwQ0FBcUIsR0FBN0I7WUFDRSxJQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDdEMsSUFBSSxNQUFNLEdBQVcsSUFBTSxDQUFDO1lBQzVCLE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDOUQsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2FBQ2pCO1lBQ0QsSUFBSSxTQUFpQixDQUFDO1lBQ3RCLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsTUFBTSxFQUFFO2dCQUMvQixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQzthQUN6QjtpQkFBTTtnQkFDTCxTQUFTLEdBQUcsaUJBQWlCLENBQUM7YUFDL0I7WUFDRCxJQUFJLENBQUMsdUJBQXVCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNFLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0QsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4QixDQUFDO1FBRU8sb0NBQWUsR0FBdkIsVUFBd0IsS0FBb0I7WUFDMUMsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3RDLElBQUksT0FBZSxDQUFDO1lBQ3BCLElBQUksZ0JBQXdCLENBQUM7WUFDN0IsSUFBSTtnQkFDRixJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQ3BDLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7aUJBQ3BGO2dCQUNELElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDakMsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3hELGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUM5QyxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxHQUFHLEVBQUU7b0JBQzlELElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUM3QixJQUFJLENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQzlDLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDcEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxDQUFDO3dCQUM5QyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztxQkFDL0I7b0JBQ0QsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxDQUFDO2lCQUMvQztnQkFDRCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQzthQUMzQjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNWLElBQUksQ0FBQyxZQUFZLGlCQUFpQixFQUFFO29CQUNsQyxzREFBc0Q7b0JBQ3RELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDaEMsaURBQWlEO29CQUNqRCxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ3hDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN0QixPQUFPO2lCQUNSO2dCQUVELE1BQU0sQ0FBQyxDQUFDO2FBQ1Q7WUFFRCxJQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUM7WUFFckUsSUFBSSxnQkFBZ0IsS0FBSyxxQkFBYyxDQUFDLFFBQVEsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQzNEO2lCQUFNLElBQUksZ0JBQWdCLEtBQUsscUJBQWMsQ0FBQyxrQkFBa0IsRUFBRTtnQkFDakUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDO2FBQzFEO1FBQ0gsQ0FBQztRQUVPLGdEQUEyQixHQUFuQyxVQUFvQyxnQkFBd0IsRUFBRSxjQUF1QjtZQUFyRixpQkFVQztZQVRDLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUU7Z0JBQ2hFLElBQUksQ0FBQyxLQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztvQkFBRSxPQUFPLEtBQUssQ0FBQztnQkFDdkQsS0FBSSxDQUFDLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLENBQUMsS0FBSSxDQUFDLDBCQUEwQixDQUFDLGdCQUFnQixDQUFDO29CQUFFLE9BQU8sS0FBSyxDQUFDO2dCQUNyRSxLQUFJLENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQzlDLE9BQU8sS0FBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQyxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFNLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFTyx5Q0FBb0IsR0FBNUIsVUFBNkIsS0FBb0I7WUFDL0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xELElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQzNDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUVPLDBDQUFxQixHQUE3QjtZQUNFLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3RDLElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ25ELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUVPLDJDQUFzQixHQUE5QjtZQUNFLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksS0FBYSxDQUFDO1lBQ2xCLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDeEQsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNoQixJQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7Z0JBQzNCLE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUU7b0JBQy9CLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUNsQztnQkFDRCxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2FBQ2pCO2lCQUFNO2dCQUNMLElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQy9CLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3hEO1lBQ0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVPLHVDQUFrQixHQUExQjtZQUNFLElBQU0sU0FBUyxHQUNYLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztZQUMvRixJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNyQixDQUFDO1FBRU8scUNBQWdCLEdBQXhCLFVBQXlCLEtBQW9CO1lBQzNDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDOUMsSUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDbkQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRU8sK0NBQTBCLEdBQWxDO1lBQ0UsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRW5CLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFFOUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQzFELElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUU5QyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDMUQsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFTywrQ0FBMEIsR0FBbEM7WUFDRSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUN0RSxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNwRCxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRTlDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLHdCQUF3QixFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRTlDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUVPLDZDQUF3QixHQUFoQztZQUNFLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRTlDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBRU8sNkNBQXdCLEdBQWhDO1lBQ0UsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRW5CLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBRU8saUNBQVksR0FBcEI7WUFDRSxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hDLElBQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztZQUUzQixHQUFHO2dCQUNELElBQUksSUFBSSxDQUFDLG9CQUFvQixJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUNsRixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDNUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztpQkFDOUI7cUJBQU0sSUFDSCxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxDQUFDLGdCQUFnQjtvQkFDbEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ25ELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUMxQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO2lCQUMvQjtxQkFBTTtvQkFDTCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztpQkFDbEM7YUFDRixRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFO1lBRTdCLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRSxDQUFDO1FBRU8sK0JBQVUsR0FBbEI7WUFDRSxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxJQUFJLEVBQUU7Z0JBQ3pELE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQy9DLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFO29CQUM3RSw2QkFBNkI7b0JBQzdCLE9BQU8sSUFBSSxDQUFDO2lCQUNiO2dCQUVELElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxFQUFFO29CQUM3RCw0QkFBNEI7b0JBQzVCLE9BQU8sSUFBSSxDQUFDO2lCQUNiO2FBQ0Y7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7UUFFTyxrQ0FBYSxHQUFyQjtZQUNFLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakYsQ0FBQztRQUVPLCtCQUFVLEdBQWxCLFVBQW1CLElBQVk7WUFDN0IsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUMxQixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFTyxxQ0FBZ0IsR0FBeEIsVUFBeUIsUUFBa0Q7WUFDekUsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsSUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUNqQywwQkFBMEI7Z0JBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQzlDO1FBQ0gsQ0FBQztRQUVPLHVDQUFrQixHQUExQjtZQUNFLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxDQUFDO2dCQUN0QyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7b0JBQzdELFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQztRQUN6QyxDQUFDO1FBRU8sdUNBQWtCLEdBQTFCO1lBQ0UsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxHQUFHLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztvQkFDN0QsU0FBUyxDQUFDLG9CQUFvQixDQUFDO1FBQ3JDLENBQUM7UUFDSCxpQkFBQztJQUFELENBQUMsQUFsa0JELElBa2tCQztJQUVELFNBQVMsZUFBZSxDQUFDLElBQVk7UUFDbkMsT0FBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDMUQsQ0FBQztJQUVELFNBQVMsU0FBUyxDQUFDLElBQVk7UUFDN0IsT0FBTyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxLQUFLLENBQUMsR0FBRyxJQUFJLElBQUksS0FBSyxLQUFLLENBQUMsTUFBTTtZQUMxRSxJQUFJLEtBQUssS0FBSyxDQUFDLEdBQUcsSUFBSSxJQUFJLEtBQUssS0FBSyxDQUFDLEdBQUcsSUFBSSxJQUFJLEtBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQztJQUNyRSxDQUFDO0lBRUQsU0FBUyxXQUFXLENBQUMsSUFBWTtRQUMvQixPQUFPLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxJQUFJLEtBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO1lBQy9FLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxJQUFZO1FBQ3BDLE9BQU8sSUFBSSxJQUFJLEtBQUssQ0FBQyxVQUFVLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hGLENBQUM7SUFFRCxTQUFTLGdCQUFnQixDQUFDLElBQVk7UUFDcEMsT0FBTyxJQUFJLElBQUksS0FBSyxDQUFDLFVBQVUsSUFBSSxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEYsQ0FBQztJQUVELFNBQVMsb0JBQW9CLENBQ3pCLEtBQWEsRUFBRSxNQUFjLEVBQUUsbUJBQXdDO1FBQ3pFLElBQU0sb0JBQW9CLEdBQ3RCLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUU3RixPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDO0lBQzVFLENBQUM7SUFFRCxTQUFTLG9CQUFvQixDQUFDLElBQVk7UUFDeEMsT0FBTyxJQUFJLEtBQUssS0FBSyxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEYsQ0FBQztJQUVELFNBQVMsOEJBQThCLENBQUMsS0FBYSxFQUFFLEtBQWE7UUFDbEUsT0FBTyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQsU0FBUyxtQkFBbUIsQ0FBQyxJQUFZO1FBQ3ZDLE9BQU8sSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNsRixDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUMsU0FBa0I7UUFDekMsSUFBTSxTQUFTLEdBQVksRUFBRSxDQUFDO1FBQzlCLElBQUksWUFBWSxHQUFvQixTQUFTLENBQUM7UUFDOUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDekMsSUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNCLElBQUksWUFBWSxJQUFJLFlBQVksQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUU7Z0JBQ3ZGLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7YUFDcEQ7aUJBQU07Z0JBQ0wsWUFBWSxHQUFHLEtBQUssQ0FBQztnQkFDckIsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUM5QjtTQUNGO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgY2hhcnMgZnJvbSAnLi4vY2hhcnMnO1xuaW1wb3J0IHtQYXJzZUVycm9yLCBQYXJzZUxvY2F0aW9uLCBQYXJzZVNvdXJjZUZpbGUsIFBhcnNlU291cmNlU3Bhbn0gZnJvbSAnLi4vcGFyc2VfdXRpbCc7XG5cbmltcG9ydCB7REVGQVVMVF9JTlRFUlBPTEFUSU9OX0NPTkZJRywgSW50ZXJwb2xhdGlvbkNvbmZpZ30gZnJvbSAnLi9pbnRlcnBvbGF0aW9uX2NvbmZpZyc7XG5pbXBvcnQge05BTUVEX0VOVElUSUVTLCBUYWdDb250ZW50VHlwZSwgVGFnRGVmaW5pdGlvbn0gZnJvbSAnLi90YWdzJztcblxuZXhwb3J0IGVudW0gVG9rZW5UeXBlIHtcbiAgVEFHX09QRU5fU1RBUlQsXG4gIFRBR19PUEVOX0VORCxcbiAgVEFHX09QRU5fRU5EX1ZPSUQsXG4gIFRBR19DTE9TRSxcbiAgVEVYVCxcbiAgRVNDQVBBQkxFX1JBV19URVhULFxuICBSQVdfVEVYVCxcbiAgQ09NTUVOVF9TVEFSVCxcbiAgQ09NTUVOVF9FTkQsXG4gIENEQVRBX1NUQVJULFxuICBDREFUQV9FTkQsXG4gIEFUVFJfTkFNRSxcbiAgQVRUUl9WQUxVRSxcbiAgRE9DX1RZUEUsXG4gIEVYUEFOU0lPTl9GT1JNX1NUQVJULFxuICBFWFBBTlNJT05fQ0FTRV9WQUxVRSxcbiAgRVhQQU5TSU9OX0NBU0VfRVhQX1NUQVJULFxuICBFWFBBTlNJT05fQ0FTRV9FWFBfRU5ELFxuICBFWFBBTlNJT05fRk9STV9FTkQsXG4gIEVPRlxufVxuXG5leHBvcnQgY2xhc3MgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdHlwZTogVG9rZW5UeXBlLCBwdWJsaWMgcGFydHM6IHN0cmluZ1tdLCBwdWJsaWMgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuKSB7fVxufVxuXG5leHBvcnQgY2xhc3MgVG9rZW5FcnJvciBleHRlbmRzIFBhcnNlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihlcnJvck1zZzogc3RyaW5nLCBwdWJsaWMgdG9rZW5UeXBlOiBUb2tlblR5cGUsIHNwYW46IFBhcnNlU291cmNlU3Bhbikge1xuICAgIHN1cGVyKHNwYW4sIGVycm9yTXNnKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVG9rZW5pemVSZXN1bHQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdG9rZW5zOiBUb2tlbltdLCBwdWJsaWMgZXJyb3JzOiBUb2tlbkVycm9yW10pIHt9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b2tlbml6ZShcbiAgICBzb3VyY2U6IHN0cmluZywgdXJsOiBzdHJpbmcsIGdldFRhZ0RlZmluaXRpb246ICh0YWdOYW1lOiBzdHJpbmcpID0+IFRhZ0RlZmluaXRpb24sXG4gICAgdG9rZW5pemVFeHBhbnNpb25Gb3JtczogYm9vbGVhbiA9IGZhbHNlLFxuICAgIGludGVycG9sYXRpb25Db25maWc6IEludGVycG9sYXRpb25Db25maWcgPSBERUZBVUxUX0lOVEVSUE9MQVRJT05fQ09ORklHKTogVG9rZW5pemVSZXN1bHQge1xuICByZXR1cm4gbmV3IF9Ub2tlbml6ZXIoXG4gICAgICAgICAgICAgbmV3IFBhcnNlU291cmNlRmlsZShzb3VyY2UsIHVybCksIGdldFRhZ0RlZmluaXRpb24sIHRva2VuaXplRXhwYW5zaW9uRm9ybXMsXG4gICAgICAgICAgICAgaW50ZXJwb2xhdGlvbkNvbmZpZylcbiAgICAgIC50b2tlbml6ZSgpO1xufVxuXG5jb25zdCBfQ1JfT1JfQ1JMRl9SRUdFWFAgPSAvXFxyXFxuPy9nO1xuXG5mdW5jdGlvbiBfdW5leHBlY3RlZENoYXJhY3RlckVycm9yTXNnKGNoYXJDb2RlOiBudW1iZXIpOiBzdHJpbmcge1xuICBjb25zdCBjaGFyID0gY2hhckNvZGUgPT09IGNoYXJzLiRFT0YgPyAnRU9GJyA6IFN0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGUpO1xuICByZXR1cm4gYFVuZXhwZWN0ZWQgY2hhcmFjdGVyIFwiJHtjaGFyfVwiYDtcbn1cblxuZnVuY3Rpb24gX3Vua25vd25FbnRpdHlFcnJvck1zZyhlbnRpdHlTcmM6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgVW5rbm93biBlbnRpdHkgXCIke2VudGl0eVNyY31cIiAtIHVzZSB0aGUgXCImIzxkZWNpbWFsPjtcIiBvciAgXCImI3g8aGV4PjtcIiBzeW50YXhgO1xufVxuXG5jbGFzcyBfQ29udHJvbEZsb3dFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBlcnJvcjogVG9rZW5FcnJvcikge31cbn1cblxuLy8gU2VlIGh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWw1MS9zeW50YXguaHRtbCN3cml0aW5nXG5jbGFzcyBfVG9rZW5pemVyIHtcbiAgcHJpdmF0ZSBfaW5wdXQ6IHN0cmluZztcbiAgcHJpdmF0ZSBfbGVuZ3RoOiBudW1iZXI7XG4gIC8vIE5vdGU6IHRoaXMgaXMgYWx3YXlzIGxvd2VyY2FzZSFcbiAgcHJpdmF0ZSBfcGVlazogbnVtYmVyID0gLTE7XG4gIHByaXZhdGUgX25leHRQZWVrOiBudW1iZXIgPSAtMTtcbiAgcHJpdmF0ZSBfaW5kZXg6IG51bWJlciA9IC0xO1xuICBwcml2YXRlIF9saW5lOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIF9jb2x1bW46IG51bWJlciA9IC0xO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBfY3VycmVudFRva2VuU3RhcnQgITogUGFyc2VMb2NhdGlvbjtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgX2N1cnJlbnRUb2tlblR5cGUgITogVG9rZW5UeXBlO1xuICBwcml2YXRlIF9leHBhbnNpb25DYXNlU3RhY2s6IFRva2VuVHlwZVtdID0gW107XG4gIHByaXZhdGUgX2luSW50ZXJwb2xhdGlvbjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHRva2VuczogVG9rZW5bXSA9IFtdO1xuICBlcnJvcnM6IFRva2VuRXJyb3JbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gX2ZpbGUgVGhlIGh0bWwgc291cmNlXG4gICAqIEBwYXJhbSBfZ2V0VGFnRGVmaW5pdGlvblxuICAgKiBAcGFyYW0gX3Rva2VuaXplSWN1IFdoZXRoZXIgdG8gdG9rZW5pemUgSUNVIG1lc3NhZ2VzIChjb25zaWRlcmVkIGFzIHRleHQgbm9kZXMgd2hlbiBmYWxzZSlcbiAgICogQHBhcmFtIF9pbnRlcnBvbGF0aW9uQ29uZmlnXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2ZpbGU6IFBhcnNlU291cmNlRmlsZSwgcHJpdmF0ZSBfZ2V0VGFnRGVmaW5pdGlvbjogKHRhZ05hbWU6IHN0cmluZykgPT4gVGFnRGVmaW5pdGlvbixcbiAgICAgIHByaXZhdGUgX3Rva2VuaXplSWN1OiBib29sZWFuLFxuICAgICAgcHJpdmF0ZSBfaW50ZXJwb2xhdGlvbkNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZyA9IERFRkFVTFRfSU5URVJQT0xBVElPTl9DT05GSUcpIHtcbiAgICB0aGlzLl9pbnB1dCA9IF9maWxlLmNvbnRlbnQ7XG4gICAgdGhpcy5fbGVuZ3RoID0gX2ZpbGUuY29udGVudC5sZW5ndGg7XG4gICAgdGhpcy5fYWR2YW5jZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcHJvY2Vzc0NhcnJpYWdlUmV0dXJucyhjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWw1L3N5bnRheC5odG1sI3ByZXByb2Nlc3NpbmctdGhlLWlucHV0LXN0cmVhbVxuICAgIC8vIEluIG9yZGVyIHRvIGtlZXAgdGhlIG9yaWdpbmFsIHBvc2l0aW9uIGluIHRoZSBzb3VyY2UsIHdlIGNhbiBub3RcbiAgICAvLyBwcmUtcHJvY2VzcyBpdC5cbiAgICAvLyBJbnN0ZWFkIENScyBhcmUgcHJvY2Vzc2VkIHJpZ2h0IGJlZm9yZSBpbnN0YW50aWF0aW5nIHRoZSB0b2tlbnMuXG4gICAgcmV0dXJuIGNvbnRlbnQucmVwbGFjZShfQ1JfT1JfQ1JMRl9SRUdFWFAsICdcXG4nKTtcbiAgfVxuXG4gIHRva2VuaXplKCk6IFRva2VuaXplUmVzdWx0IHtcbiAgICB3aGlsZSAodGhpcy5fcGVlayAhPT0gY2hhcnMuJEVPRikge1xuICAgICAgY29uc3Qgc3RhcnQgPSB0aGlzLl9nZXRMb2NhdGlvbigpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRoaXMuX2F0dGVtcHRDaGFyQ29kZShjaGFycy4kTFQpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX2F0dGVtcHRDaGFyQ29kZShjaGFycy4kQkFORykpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9hdHRlbXB0Q2hhckNvZGUoY2hhcnMuJExCUkFDS0VUKSkge1xuICAgICAgICAgICAgICB0aGlzLl9jb25zdW1lQ2RhdGEoc3RhcnQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9hdHRlbXB0Q2hhckNvZGUoY2hhcnMuJE1JTlVTKSkge1xuICAgICAgICAgICAgICB0aGlzLl9jb25zdW1lQ29tbWVudChzdGFydCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLl9jb25zdW1lRG9jVHlwZShzdGFydCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9hdHRlbXB0Q2hhckNvZGUoY2hhcnMuJFNMQVNIKSkge1xuICAgICAgICAgICAgdGhpcy5fY29uc3VtZVRhZ0Nsb3NlKHN0YXJ0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fY29uc3VtZVRhZ09wZW4oc3RhcnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghKHRoaXMuX3Rva2VuaXplSWN1ICYmIHRoaXMuX3Rva2VuaXplRXhwYW5zaW9uRm9ybSgpKSkge1xuICAgICAgICAgIHRoaXMuX2NvbnN1bWVUZXh0KCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBfQ29udHJvbEZsb3dFcnJvcikge1xuICAgICAgICAgIHRoaXMuZXJyb3JzLnB1c2goZS5lcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5FT0YpO1xuICAgIHRoaXMuX2VuZFRva2VuKFtdKTtcbiAgICByZXR1cm4gbmV3IFRva2VuaXplUmVzdWx0KG1lcmdlVGV4dFRva2Vucyh0aGlzLnRva2VucyksIHRoaXMuZXJyb3JzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyB3aGV0aGVyIGFuIElDVSB0b2tlbiBoYXMgYmVlbiBjcmVhdGVkXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBfdG9rZW5pemVFeHBhbnNpb25Gb3JtKCk6IGJvb2xlYW4ge1xuICAgIGlmIChpc0V4cGFuc2lvbkZvcm1TdGFydCh0aGlzLl9pbnB1dCwgdGhpcy5faW5kZXgsIHRoaXMuX2ludGVycG9sYXRpb25Db25maWcpKSB7XG4gICAgICB0aGlzLl9jb25zdW1lRXhwYW5zaW9uRm9ybVN0YXJ0KCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoaXNFeHBhbnNpb25DYXNlU3RhcnQodGhpcy5fcGVlaykgJiYgdGhpcy5faXNJbkV4cGFuc2lvbkZvcm0oKSkge1xuICAgICAgdGhpcy5fY29uc3VtZUV4cGFuc2lvbkNhc2VTdGFydCgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3BlZWsgPT09IGNoYXJzLiRSQlJBQ0UpIHtcbiAgICAgIGlmICh0aGlzLl9pc0luRXhwYW5zaW9uQ2FzZSgpKSB7XG4gICAgICAgIHRoaXMuX2NvbnN1bWVFeHBhbnNpb25DYXNlRW5kKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5faXNJbkV4cGFuc2lvbkZvcm0oKSkge1xuICAgICAgICB0aGlzLl9jb25zdW1lRXhwYW5zaW9uRm9ybUVuZCgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9nZXRMb2NhdGlvbigpOiBQYXJzZUxvY2F0aW9uIHtcbiAgICByZXR1cm4gbmV3IFBhcnNlTG9jYXRpb24odGhpcy5fZmlsZSwgdGhpcy5faW5kZXgsIHRoaXMuX2xpbmUsIHRoaXMuX2NvbHVtbik7XG4gIH1cblxuICBwcml2YXRlIF9nZXRTcGFuKFxuICAgICAgc3RhcnQ6IFBhcnNlTG9jYXRpb24gPSB0aGlzLl9nZXRMb2NhdGlvbigpLFxuICAgICAgZW5kOiBQYXJzZUxvY2F0aW9uID0gdGhpcy5fZ2V0TG9jYXRpb24oKSk6IFBhcnNlU291cmNlU3BhbiB7XG4gICAgcmV0dXJuIG5ldyBQYXJzZVNvdXJjZVNwYW4oc3RhcnQsIGVuZCk7XG4gIH1cblxuICBwcml2YXRlIF9iZWdpblRva2VuKHR5cGU6IFRva2VuVHlwZSwgc3RhcnQ6IFBhcnNlTG9jYXRpb24gPSB0aGlzLl9nZXRMb2NhdGlvbigpKSB7XG4gICAgdGhpcy5fY3VycmVudFRva2VuU3RhcnQgPSBzdGFydDtcbiAgICB0aGlzLl9jdXJyZW50VG9rZW5UeXBlID0gdHlwZTtcbiAgfVxuXG4gIHByaXZhdGUgX2VuZFRva2VuKHBhcnRzOiBzdHJpbmdbXSwgZW5kOiBQYXJzZUxvY2F0aW9uID0gdGhpcy5fZ2V0TG9jYXRpb24oKSk6IFRva2VuIHtcbiAgICBjb25zdCB0b2tlbiA9XG4gICAgICAgIG5ldyBUb2tlbih0aGlzLl9jdXJyZW50VG9rZW5UeXBlLCBwYXJ0cywgbmV3IFBhcnNlU291cmNlU3Bhbih0aGlzLl9jdXJyZW50VG9rZW5TdGFydCwgZW5kKSk7XG4gICAgdGhpcy50b2tlbnMucHVzaCh0b2tlbik7XG4gICAgdGhpcy5fY3VycmVudFRva2VuU3RhcnQgPSBudWxsICE7XG4gICAgdGhpcy5fY3VycmVudFRva2VuVHlwZSA9IG51bGwgITtcbiAgICByZXR1cm4gdG9rZW47XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVFcnJvcihtc2c6IHN0cmluZywgc3BhbjogUGFyc2VTb3VyY2VTcGFuKTogX0NvbnRyb2xGbG93RXJyb3Ige1xuICAgIGlmICh0aGlzLl9pc0luRXhwYW5zaW9uRm9ybSgpKSB7XG4gICAgICBtc2cgKz0gYCAoRG8geW91IGhhdmUgYW4gdW5lc2NhcGVkIFwie1wiIGluIHlvdXIgdGVtcGxhdGU/IFVzZSBcInt7ICd7JyB9fVwiKSB0byBlc2NhcGUgaXQuKWA7XG4gICAgfVxuICAgIGNvbnN0IGVycm9yID0gbmV3IFRva2VuRXJyb3IobXNnLCB0aGlzLl9jdXJyZW50VG9rZW5UeXBlLCBzcGFuKTtcbiAgICB0aGlzLl9jdXJyZW50VG9rZW5TdGFydCA9IG51bGwgITtcbiAgICB0aGlzLl9jdXJyZW50VG9rZW5UeXBlID0gbnVsbCAhO1xuICAgIHJldHVybiBuZXcgX0NvbnRyb2xGbG93RXJyb3IoZXJyb3IpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWR2YW5jZSgpIHtcbiAgICBpZiAodGhpcy5faW5kZXggPj0gdGhpcy5fbGVuZ3RoKSB7XG4gICAgICB0aHJvdyB0aGlzLl9jcmVhdGVFcnJvcihfdW5leHBlY3RlZENoYXJhY3RlckVycm9yTXNnKGNoYXJzLiRFT0YpLCB0aGlzLl9nZXRTcGFuKCkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fcGVlayA9PT0gY2hhcnMuJExGKSB7XG4gICAgICB0aGlzLl9saW5lKys7XG4gICAgICB0aGlzLl9jb2x1bW4gPSAwO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fcGVlayAhPT0gY2hhcnMuJExGICYmIHRoaXMuX3BlZWsgIT09IGNoYXJzLiRDUikge1xuICAgICAgdGhpcy5fY29sdW1uKys7XG4gICAgfVxuICAgIHRoaXMuX2luZGV4Kys7XG4gICAgdGhpcy5fcGVlayA9IHRoaXMuX2luZGV4ID49IHRoaXMuX2xlbmd0aCA/IGNoYXJzLiRFT0YgOiB0aGlzLl9pbnB1dC5jaGFyQ29kZUF0KHRoaXMuX2luZGV4KTtcbiAgICB0aGlzLl9uZXh0UGVlayA9XG4gICAgICAgIHRoaXMuX2luZGV4ICsgMSA+PSB0aGlzLl9sZW5ndGggPyBjaGFycy4kRU9GIDogdGhpcy5faW5wdXQuY2hhckNvZGVBdCh0aGlzLl9pbmRleCArIDEpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYXR0ZW1wdENoYXJDb2RlKGNoYXJDb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fcGVlayA9PT0gY2hhckNvZGUpIHtcbiAgICAgIHRoaXMuX2FkdmFuY2UoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9hdHRlbXB0Q2hhckNvZGVDYXNlSW5zZW5zaXRpdmUoY2hhckNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmIChjb21wYXJlQ2hhckNvZGVDYXNlSW5zZW5zaXRpdmUodGhpcy5fcGVlaywgY2hhckNvZGUpKSB7XG4gICAgICB0aGlzLl9hZHZhbmNlKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVxdWlyZUNoYXJDb2RlKGNoYXJDb2RlOiBudW1iZXIpIHtcbiAgICBjb25zdCBsb2NhdGlvbiA9IHRoaXMuX2dldExvY2F0aW9uKCk7XG4gICAgaWYgKCF0aGlzLl9hdHRlbXB0Q2hhckNvZGUoY2hhckNvZGUpKSB7XG4gICAgICB0aHJvdyB0aGlzLl9jcmVhdGVFcnJvcihcbiAgICAgICAgICBfdW5leHBlY3RlZENoYXJhY3RlckVycm9yTXNnKHRoaXMuX3BlZWspLCB0aGlzLl9nZXRTcGFuKGxvY2F0aW9uLCBsb2NhdGlvbikpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2F0dGVtcHRTdHIoY2hhcnM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGxlbiA9IGNoYXJzLmxlbmd0aDtcbiAgICBpZiAodGhpcy5faW5kZXggKyBsZW4gPiB0aGlzLl9sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgaW5pdGlhbFBvc2l0aW9uID0gdGhpcy5fc2F2ZVBvc2l0aW9uKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgaWYgKCF0aGlzLl9hdHRlbXB0Q2hhckNvZGUoY2hhcnMuY2hhckNvZGVBdChpKSkpIHtcbiAgICAgICAgLy8gSWYgYXR0ZW1wdGluZyB0byBwYXJzZSB0aGUgc3RyaW5nIGZhaWxzLCB3ZSB3YW50IHRvIHJlc2V0IHRoZSBwYXJzZXJcbiAgICAgICAgLy8gdG8gd2hlcmUgaXQgd2FzIGJlZm9yZSB0aGUgYXR0ZW1wdFxuICAgICAgICB0aGlzLl9yZXN0b3JlUG9zaXRpb24oaW5pdGlhbFBvc2l0aW9uKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX2F0dGVtcHRTdHJDYXNlSW5zZW5zaXRpdmUoY2hhcnM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghdGhpcy5fYXR0ZW1wdENoYXJDb2RlQ2FzZUluc2Vuc2l0aXZlKGNoYXJzLmNoYXJDb2RlQXQoaSkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9yZXF1aXJlU3RyKGNoYXJzOiBzdHJpbmcpIHtcbiAgICBjb25zdCBsb2NhdGlvbiA9IHRoaXMuX2dldExvY2F0aW9uKCk7XG4gICAgaWYgKCF0aGlzLl9hdHRlbXB0U3RyKGNoYXJzKSkge1xuICAgICAgdGhyb3cgdGhpcy5fY3JlYXRlRXJyb3IoX3VuZXhwZWN0ZWRDaGFyYWN0ZXJFcnJvck1zZyh0aGlzLl9wZWVrKSwgdGhpcy5fZ2V0U3Bhbihsb2NhdGlvbikpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2F0dGVtcHRDaGFyQ29kZVVudGlsRm4ocHJlZGljYXRlOiAoY29kZTogbnVtYmVyKSA9PiBib29sZWFuKSB7XG4gICAgd2hpbGUgKCFwcmVkaWNhdGUodGhpcy5fcGVlaykpIHtcbiAgICAgIHRoaXMuX2FkdmFuY2UoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9yZXF1aXJlQ2hhckNvZGVVbnRpbEZuKHByZWRpY2F0ZTogKGNvZGU6IG51bWJlcikgPT4gYm9vbGVhbiwgbGVuOiBudW1iZXIpIHtcbiAgICBjb25zdCBzdGFydCA9IHRoaXMuX2dldExvY2F0aW9uKCk7XG4gICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihwcmVkaWNhdGUpO1xuICAgIGlmICh0aGlzLl9pbmRleCAtIHN0YXJ0Lm9mZnNldCA8IGxlbikge1xuICAgICAgdGhyb3cgdGhpcy5fY3JlYXRlRXJyb3IoXG4gICAgICAgICAgX3VuZXhwZWN0ZWRDaGFyYWN0ZXJFcnJvck1zZyh0aGlzLl9wZWVrKSwgdGhpcy5fZ2V0U3BhbihzdGFydCwgc3RhcnQpKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hdHRlbXB0VW50aWxDaGFyKGNoYXI6IG51bWJlcikge1xuICAgIHdoaWxlICh0aGlzLl9wZWVrICE9PSBjaGFyKSB7XG4gICAgICB0aGlzLl9hZHZhbmNlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfcmVhZENoYXIoZGVjb2RlRW50aXRpZXM6IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgIGlmIChkZWNvZGVFbnRpdGllcyAmJiB0aGlzLl9wZWVrID09PSBjaGFycy4kQU1QRVJTQU5EKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGVjb2RlRW50aXR5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5faW5kZXg7XG4gICAgICB0aGlzLl9hZHZhbmNlKCk7XG4gICAgICByZXR1cm4gdGhpcy5faW5wdXRbaW5kZXhdO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2RlY29kZUVudGl0eSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5fZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLl9hZHZhbmNlKCk7XG4gICAgaWYgKHRoaXMuX2F0dGVtcHRDaGFyQ29kZShjaGFycy4kSEFTSCkpIHtcbiAgICAgIGNvbnN0IGlzSGV4ID0gdGhpcy5fYXR0ZW1wdENoYXJDb2RlKGNoYXJzLiR4KSB8fCB0aGlzLl9hdHRlbXB0Q2hhckNvZGUoY2hhcnMuJFgpO1xuICAgICAgY29uc3QgbnVtYmVyU3RhcnQgPSB0aGlzLl9nZXRMb2NhdGlvbigpLm9mZnNldDtcbiAgICAgIHRoaXMuX2F0dGVtcHRDaGFyQ29kZVVudGlsRm4oaXNEaWdpdEVudGl0eUVuZCk7XG4gICAgICBpZiAodGhpcy5fcGVlayAhPSBjaGFycy4kU0VNSUNPTE9OKSB7XG4gICAgICAgIHRocm93IHRoaXMuX2NyZWF0ZUVycm9yKF91bmV4cGVjdGVkQ2hhcmFjdGVyRXJyb3JNc2codGhpcy5fcGVlayksIHRoaXMuX2dldFNwYW4oKSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9hZHZhbmNlKCk7XG4gICAgICBjb25zdCBzdHJOdW0gPSB0aGlzLl9pbnB1dC5zdWJzdHJpbmcobnVtYmVyU3RhcnQsIHRoaXMuX2luZGV4IC0gMSk7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjaGFyQ29kZSA9IHBhcnNlSW50KHN0ck51bSwgaXNIZXggPyAxNiA6IDEwKTtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGUpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zdCBlbnRpdHkgPSB0aGlzLl9pbnB1dC5zdWJzdHJpbmcoc3RhcnQub2Zmc2V0ICsgMSwgdGhpcy5faW5kZXggLSAxKTtcbiAgICAgICAgdGhyb3cgdGhpcy5fY3JlYXRlRXJyb3IoX3Vua25vd25FbnRpdHlFcnJvck1zZyhlbnRpdHkpLCB0aGlzLl9nZXRTcGFuKHN0YXJ0KSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0YXJ0UG9zaXRpb24gPSB0aGlzLl9zYXZlUG9zaXRpb24oKTtcbiAgICAgIHRoaXMuX2F0dGVtcHRDaGFyQ29kZVVudGlsRm4oaXNOYW1lZEVudGl0eUVuZCk7XG4gICAgICBpZiAodGhpcy5fcGVlayAhPSBjaGFycy4kU0VNSUNPTE9OKSB7XG4gICAgICAgIHRoaXMuX3Jlc3RvcmVQb3NpdGlvbihzdGFydFBvc2l0aW9uKTtcbiAgICAgICAgcmV0dXJuICcmJztcbiAgICAgIH1cbiAgICAgIHRoaXMuX2FkdmFuY2UoKTtcbiAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLl9pbnB1dC5zdWJzdHJpbmcoc3RhcnQub2Zmc2V0ICsgMSwgdGhpcy5faW5kZXggLSAxKTtcbiAgICAgIGNvbnN0IGNoYXIgPSBOQU1FRF9FTlRJVElFU1tuYW1lXTtcbiAgICAgIGlmICghY2hhcikge1xuICAgICAgICB0aHJvdyB0aGlzLl9jcmVhdGVFcnJvcihfdW5rbm93bkVudGl0eUVycm9yTXNnKG5hbWUpLCB0aGlzLl9nZXRTcGFuKHN0YXJ0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hhcjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9jb25zdW1lUmF3VGV4dChcbiAgICAgIGRlY29kZUVudGl0aWVzOiBib29sZWFuLCBmaXJzdENoYXJPZkVuZDogbnVtYmVyLCBhdHRlbXB0RW5kUmVzdDogKCkgPT4gYm9vbGVhbik6IFRva2VuIHtcbiAgICBsZXQgdGFnQ2xvc2VTdGFydDogUGFyc2VMb2NhdGlvbjtcbiAgICBjb25zdCB0ZXh0U3RhcnQgPSB0aGlzLl9nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuX2JlZ2luVG9rZW4oZGVjb2RlRW50aXRpZXMgPyBUb2tlblR5cGUuRVNDQVBBQkxFX1JBV19URVhUIDogVG9rZW5UeXBlLlJBV19URVhULCB0ZXh0U3RhcnQpO1xuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICB0YWdDbG9zZVN0YXJ0ID0gdGhpcy5fZ2V0TG9jYXRpb24oKTtcbiAgICAgIGlmICh0aGlzLl9hdHRlbXB0Q2hhckNvZGUoZmlyc3RDaGFyT2ZFbmQpICYmIGF0dGVtcHRFbmRSZXN0KCkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5faW5kZXggPiB0YWdDbG9zZVN0YXJ0Lm9mZnNldCkge1xuICAgICAgICAvLyBhZGQgdGhlIGNoYXJhY3RlcnMgY29uc3VtZWQgYnkgdGhlIHByZXZpb3VzIGlmIHN0YXRlbWVudCB0byB0aGUgb3V0cHV0XG4gICAgICAgIHBhcnRzLnB1c2godGhpcy5faW5wdXQuc3Vic3RyaW5nKHRhZ0Nsb3NlU3RhcnQub2Zmc2V0LCB0aGlzLl9pbmRleCkpO1xuICAgICAgfVxuICAgICAgd2hpbGUgKHRoaXMuX3BlZWsgIT09IGZpcnN0Q2hhck9mRW5kKSB7XG4gICAgICAgIHBhcnRzLnB1c2godGhpcy5fcmVhZENoYXIoZGVjb2RlRW50aXRpZXMpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2VuZFRva2VuKFt0aGlzLl9wcm9jZXNzQ2FycmlhZ2VSZXR1cm5zKHBhcnRzLmpvaW4oJycpKV0sIHRhZ0Nsb3NlU3RhcnQpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZUNvbW1lbnQoc3RhcnQ6IFBhcnNlTG9jYXRpb24pIHtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5DT01NRU5UX1NUQVJULCBzdGFydCk7XG4gICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlKGNoYXJzLiRNSU5VUyk7XG4gICAgdGhpcy5fZW5kVG9rZW4oW10pO1xuICAgIGNvbnN0IHRleHRUb2tlbiA9IHRoaXMuX2NvbnN1bWVSYXdUZXh0KGZhbHNlLCBjaGFycy4kTUlOVVMsICgpID0+IHRoaXMuX2F0dGVtcHRTdHIoJy0+JykpO1xuICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLkNPTU1FTlRfRU5ELCB0ZXh0VG9rZW4uc291cmNlU3Bhbi5lbmQpO1xuICAgIHRoaXMuX2VuZFRva2VuKFtdKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVDZGF0YShzdGFydDogUGFyc2VMb2NhdGlvbikge1xuICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLkNEQVRBX1NUQVJULCBzdGFydCk7XG4gICAgdGhpcy5fcmVxdWlyZVN0cignQ0RBVEFbJyk7XG4gICAgdGhpcy5fZW5kVG9rZW4oW10pO1xuICAgIGNvbnN0IHRleHRUb2tlbiA9IHRoaXMuX2NvbnN1bWVSYXdUZXh0KGZhbHNlLCBjaGFycy4kUkJSQUNLRVQsICgpID0+IHRoaXMuX2F0dGVtcHRTdHIoJ10+JykpO1xuICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLkNEQVRBX0VORCwgdGV4dFRva2VuLnNvdXJjZVNwYW4uZW5kKTtcbiAgICB0aGlzLl9lbmRUb2tlbihbXSk7XG4gIH1cblxuICBwcml2YXRlIF9jb25zdW1lRG9jVHlwZShzdGFydDogUGFyc2VMb2NhdGlvbikge1xuICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLkRPQ19UWVBFLCBzdGFydCk7XG4gICAgdGhpcy5fYXR0ZW1wdFVudGlsQ2hhcihjaGFycy4kR1QpO1xuICAgIHRoaXMuX2FkdmFuY2UoKTtcbiAgICB0aGlzLl9lbmRUb2tlbihbdGhpcy5faW5wdXQuc3Vic3RyaW5nKHN0YXJ0Lm9mZnNldCArIDIsIHRoaXMuX2luZGV4IC0gMSldKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVQcmVmaXhBbmROYW1lKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBuYW1lT3JQcmVmaXhTdGFydCA9IHRoaXMuX2luZGV4O1xuICAgIGxldCBwcmVmaXg6IHN0cmluZyA9IG51bGwgITtcbiAgICB3aGlsZSAodGhpcy5fcGVlayAhPT0gY2hhcnMuJENPTE9OICYmICFpc1ByZWZpeEVuZCh0aGlzLl9wZWVrKSkge1xuICAgICAgdGhpcy5fYWR2YW5jZSgpO1xuICAgIH1cbiAgICBsZXQgbmFtZVN0YXJ0OiBudW1iZXI7XG4gICAgaWYgKHRoaXMuX3BlZWsgPT09IGNoYXJzLiRDT0xPTikge1xuICAgICAgdGhpcy5fYWR2YW5jZSgpO1xuICAgICAgcHJlZml4ID0gdGhpcy5faW5wdXQuc3Vic3RyaW5nKG5hbWVPclByZWZpeFN0YXJ0LCB0aGlzLl9pbmRleCAtIDEpO1xuICAgICAgbmFtZVN0YXJ0ID0gdGhpcy5faW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWVTdGFydCA9IG5hbWVPclByZWZpeFN0YXJ0O1xuICAgIH1cbiAgICB0aGlzLl9yZXF1aXJlQ2hhckNvZGVVbnRpbEZuKGlzTmFtZUVuZCwgdGhpcy5faW5kZXggPT09IG5hbWVTdGFydCA/IDEgOiAwKTtcbiAgICBjb25zdCBuYW1lID0gdGhpcy5faW5wdXQuc3Vic3RyaW5nKG5hbWVTdGFydCwgdGhpcy5faW5kZXgpO1xuICAgIHJldHVybiBbcHJlZml4LCBuYW1lXTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVUYWdPcGVuKHN0YXJ0OiBQYXJzZUxvY2F0aW9uKSB7XG4gICAgY29uc3Qgc2F2ZWRQb3MgPSB0aGlzLl9zYXZlUG9zaXRpb24oKTtcbiAgICBsZXQgdGFnTmFtZTogc3RyaW5nO1xuICAgIGxldCBsb3dlcmNhc2VUYWdOYW1lOiBzdHJpbmc7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghY2hhcnMuaXNBc2NpaUxldHRlcih0aGlzLl9wZWVrKSkge1xuICAgICAgICB0aHJvdyB0aGlzLl9jcmVhdGVFcnJvcihfdW5leHBlY3RlZENoYXJhY3RlckVycm9yTXNnKHRoaXMuX3BlZWspLCB0aGlzLl9nZXRTcGFuKCkpO1xuICAgICAgfVxuICAgICAgY29uc3QgbmFtZVN0YXJ0ID0gdGhpcy5faW5kZXg7XG4gICAgICB0aGlzLl9jb25zdW1lVGFnT3BlblN0YXJ0KHN0YXJ0KTtcbiAgICAgIHRhZ05hbWUgPSB0aGlzLl9pbnB1dC5zdWJzdHJpbmcobmFtZVN0YXJ0LCB0aGlzLl9pbmRleCk7XG4gICAgICBsb3dlcmNhc2VUYWdOYW1lID0gdGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihpc05vdFdoaXRlc3BhY2UpO1xuICAgICAgd2hpbGUgKHRoaXMuX3BlZWsgIT09IGNoYXJzLiRTTEFTSCAmJiB0aGlzLl9wZWVrICE9PSBjaGFycy4kR1QpIHtcbiAgICAgICAgdGhpcy5fY29uc3VtZUF0dHJpYnV0ZU5hbWUoKTtcbiAgICAgICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihpc05vdFdoaXRlc3BhY2UpO1xuICAgICAgICBpZiAodGhpcy5fYXR0ZW1wdENoYXJDb2RlKGNoYXJzLiRFUSkpIHtcbiAgICAgICAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGlzTm90V2hpdGVzcGFjZSk7XG4gICAgICAgICAgdGhpcy5fY29uc3VtZUF0dHJpYnV0ZVZhbHVlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihpc05vdFdoaXRlc3BhY2UpO1xuICAgICAgfVxuICAgICAgdGhpcy5fY29uc3VtZVRhZ09wZW5FbmQoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIF9Db250cm9sRmxvd0Vycm9yKSB7XG4gICAgICAgIC8vIFdoZW4gdGhlIHN0YXJ0IHRhZyBpcyBpbnZhbGlkLCBhc3N1bWUgd2Ugd2FudCBhIFwiPFwiXG4gICAgICAgIHRoaXMuX3Jlc3RvcmVQb3NpdGlvbihzYXZlZFBvcyk7XG4gICAgICAgIC8vIEJhY2sgdG8gYmFjayB0ZXh0IHRva2VucyBhcmUgbWVyZ2VkIGF0IHRoZSBlbmRcbiAgICAgICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuVEVYVCwgc3RhcnQpO1xuICAgICAgICB0aGlzLl9lbmRUb2tlbihbJzwnXSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZW50VG9rZW5UeXBlID0gdGhpcy5fZ2V0VGFnRGVmaW5pdGlvbih0YWdOYW1lKS5jb250ZW50VHlwZTtcblxuICAgIGlmIChjb250ZW50VG9rZW5UeXBlID09PSBUYWdDb250ZW50VHlwZS5SQVdfVEVYVCkge1xuICAgICAgdGhpcy5fY29uc3VtZVJhd1RleHRXaXRoVGFnQ2xvc2UobG93ZXJjYXNlVGFnTmFtZSwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoY29udGVudFRva2VuVHlwZSA9PT0gVGFnQ29udGVudFR5cGUuRVNDQVBBQkxFX1JBV19URVhUKSB7XG4gICAgICB0aGlzLl9jb25zdW1lUmF3VGV4dFdpdGhUYWdDbG9zZShsb3dlcmNhc2VUYWdOYW1lLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9jb25zdW1lUmF3VGV4dFdpdGhUYWdDbG9zZShsb3dlcmNhc2VUYWdOYW1lOiBzdHJpbmcsIGRlY29kZUVudGl0aWVzOiBib29sZWFuKSB7XG4gICAgY29uc3QgdGV4dFRva2VuID0gdGhpcy5fY29uc3VtZVJhd1RleHQoZGVjb2RlRW50aXRpZXMsIGNoYXJzLiRMVCwgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLl9hdHRlbXB0Q2hhckNvZGUoY2hhcnMuJFNMQVNIKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihpc05vdFdoaXRlc3BhY2UpO1xuICAgICAgaWYgKCF0aGlzLl9hdHRlbXB0U3RyQ2FzZUluc2Vuc2l0aXZlKGxvd2VyY2FzZVRhZ05hbWUpKSByZXR1cm4gZmFsc2U7XG4gICAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGlzTm90V2hpdGVzcGFjZSk7XG4gICAgICByZXR1cm4gdGhpcy5fYXR0ZW1wdENoYXJDb2RlKGNoYXJzLiRHVCk7XG4gICAgfSk7XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuVEFHX0NMT1NFLCB0ZXh0VG9rZW4uc291cmNlU3Bhbi5lbmQpO1xuICAgIHRoaXMuX2VuZFRva2VuKFtudWxsICEsIGxvd2VyY2FzZVRhZ05hbWVdKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVUYWdPcGVuU3RhcnQoc3RhcnQ6IFBhcnNlTG9jYXRpb24pIHtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5UQUdfT1BFTl9TVEFSVCwgc3RhcnQpO1xuICAgIGNvbnN0IHBhcnRzID0gdGhpcy5fY29uc3VtZVByZWZpeEFuZE5hbWUoKTtcbiAgICB0aGlzLl9lbmRUb2tlbihwYXJ0cyk7XG4gIH1cblxuICBwcml2YXRlIF9jb25zdW1lQXR0cmlidXRlTmFtZSgpIHtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5BVFRSX05BTUUpO1xuICAgIGNvbnN0IHByZWZpeEFuZE5hbWUgPSB0aGlzLl9jb25zdW1lUHJlZml4QW5kTmFtZSgpO1xuICAgIHRoaXMuX2VuZFRva2VuKHByZWZpeEFuZE5hbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZUF0dHJpYnV0ZVZhbHVlKCkge1xuICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLkFUVFJfVkFMVUUpO1xuICAgIGxldCB2YWx1ZTogc3RyaW5nO1xuICAgIGlmICh0aGlzLl9wZWVrID09PSBjaGFycy4kU1EgfHwgdGhpcy5fcGVlayA9PT0gY2hhcnMuJERRKSB7XG4gICAgICBjb25zdCBxdW90ZUNoYXIgPSB0aGlzLl9wZWVrO1xuICAgICAgdGhpcy5fYWR2YW5jZSgpO1xuICAgICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgICB3aGlsZSAodGhpcy5fcGVlayAhPT0gcXVvdGVDaGFyKSB7XG4gICAgICAgIHBhcnRzLnB1c2godGhpcy5fcmVhZENoYXIodHJ1ZSkpO1xuICAgICAgfVxuICAgICAgdmFsdWUgPSBwYXJ0cy5qb2luKCcnKTtcbiAgICAgIHRoaXMuX2FkdmFuY2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgdmFsdWVTdGFydCA9IHRoaXMuX2luZGV4O1xuICAgICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlVW50aWxGbihpc05hbWVFbmQsIDEpO1xuICAgICAgdmFsdWUgPSB0aGlzLl9pbnB1dC5zdWJzdHJpbmcodmFsdWVTdGFydCwgdGhpcy5faW5kZXgpO1xuICAgIH1cbiAgICB0aGlzLl9lbmRUb2tlbihbdGhpcy5fcHJvY2Vzc0NhcnJpYWdlUmV0dXJucyh2YWx1ZSldKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVUYWdPcGVuRW5kKCkge1xuICAgIGNvbnN0IHRva2VuVHlwZSA9XG4gICAgICAgIHRoaXMuX2F0dGVtcHRDaGFyQ29kZShjaGFycy4kU0xBU0gpID8gVG9rZW5UeXBlLlRBR19PUEVOX0VORF9WT0lEIDogVG9rZW5UeXBlLlRBR19PUEVOX0VORDtcbiAgICB0aGlzLl9iZWdpblRva2VuKHRva2VuVHlwZSk7XG4gICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlKGNoYXJzLiRHVCk7XG4gICAgdGhpcy5fZW5kVG9rZW4oW10pO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZVRhZ0Nsb3NlKHN0YXJ0OiBQYXJzZUxvY2F0aW9uKSB7XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuVEFHX0NMT1NFLCBzdGFydCk7XG4gICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihpc05vdFdoaXRlc3BhY2UpO1xuICAgIGNvbnN0IHByZWZpeEFuZE5hbWUgPSB0aGlzLl9jb25zdW1lUHJlZml4QW5kTmFtZSgpO1xuICAgIHRoaXMuX2F0dGVtcHRDaGFyQ29kZVVudGlsRm4oaXNOb3RXaGl0ZXNwYWNlKTtcbiAgICB0aGlzLl9yZXF1aXJlQ2hhckNvZGUoY2hhcnMuJEdUKTtcbiAgICB0aGlzLl9lbmRUb2tlbihwcmVmaXhBbmROYW1lKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVFeHBhbnNpb25Gb3JtU3RhcnQoKSB7XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuRVhQQU5TSU9OX0ZPUk1fU1RBUlQsIHRoaXMuX2dldExvY2F0aW9uKCkpO1xuICAgIHRoaXMuX3JlcXVpcmVDaGFyQ29kZShjaGFycy4kTEJSQUNFKTtcbiAgICB0aGlzLl9lbmRUb2tlbihbXSk7XG5cbiAgICB0aGlzLl9leHBhbnNpb25DYXNlU3RhY2sucHVzaChUb2tlblR5cGUuRVhQQU5TSU9OX0ZPUk1fU1RBUlQpO1xuXG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuUkFXX1RFWFQsIHRoaXMuX2dldExvY2F0aW9uKCkpO1xuICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuX3JlYWRVbnRpbChjaGFycy4kQ09NTUEpO1xuICAgIHRoaXMuX2VuZFRva2VuKFtjb25kaXRpb25dLCB0aGlzLl9nZXRMb2NhdGlvbigpKTtcbiAgICB0aGlzLl9yZXF1aXJlQ2hhckNvZGUoY2hhcnMuJENPTU1BKTtcbiAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGlzTm90V2hpdGVzcGFjZSk7XG5cbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5SQVdfVEVYVCwgdGhpcy5fZ2V0TG9jYXRpb24oKSk7XG4gICAgY29uc3QgdHlwZSA9IHRoaXMuX3JlYWRVbnRpbChjaGFycy4kQ09NTUEpO1xuICAgIHRoaXMuX2VuZFRva2VuKFt0eXBlXSwgdGhpcy5fZ2V0TG9jYXRpb24oKSk7XG4gICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlKGNoYXJzLiRDT01NQSk7XG4gICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihpc05vdFdoaXRlc3BhY2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZUV4cGFuc2lvbkNhc2VTdGFydCgpIHtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5FWFBBTlNJT05fQ0FTRV9WQUxVRSwgdGhpcy5fZ2V0TG9jYXRpb24oKSk7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLl9yZWFkVW50aWwoY2hhcnMuJExCUkFDRSkudHJpbSgpO1xuICAgIHRoaXMuX2VuZFRva2VuKFt2YWx1ZV0sIHRoaXMuX2dldExvY2F0aW9uKCkpO1xuICAgIHRoaXMuX2F0dGVtcHRDaGFyQ29kZVVudGlsRm4oaXNOb3RXaGl0ZXNwYWNlKTtcblxuICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLkVYUEFOU0lPTl9DQVNFX0VYUF9TVEFSVCwgdGhpcy5fZ2V0TG9jYXRpb24oKSk7XG4gICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlKGNoYXJzLiRMQlJBQ0UpO1xuICAgIHRoaXMuX2VuZFRva2VuKFtdLCB0aGlzLl9nZXRMb2NhdGlvbigpKTtcbiAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGlzTm90V2hpdGVzcGFjZSk7XG5cbiAgICB0aGlzLl9leHBhbnNpb25DYXNlU3RhY2sucHVzaChUb2tlblR5cGUuRVhQQU5TSU9OX0NBU0VfRVhQX1NUQVJUKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVFeHBhbnNpb25DYXNlRW5kKCkge1xuICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLkVYUEFOU0lPTl9DQVNFX0VYUF9FTkQsIHRoaXMuX2dldExvY2F0aW9uKCkpO1xuICAgIHRoaXMuX3JlcXVpcmVDaGFyQ29kZShjaGFycy4kUkJSQUNFKTtcbiAgICB0aGlzLl9lbmRUb2tlbihbXSwgdGhpcy5fZ2V0TG9jYXRpb24oKSk7XG4gICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihpc05vdFdoaXRlc3BhY2UpO1xuXG4gICAgdGhpcy5fZXhwYW5zaW9uQ2FzZVN0YWNrLnBvcCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZUV4cGFuc2lvbkZvcm1FbmQoKSB7XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuRVhQQU5TSU9OX0ZPUk1fRU5ELCB0aGlzLl9nZXRMb2NhdGlvbigpKTtcbiAgICB0aGlzLl9yZXF1aXJlQ2hhckNvZGUoY2hhcnMuJFJCUkFDRSk7XG4gICAgdGhpcy5fZW5kVG9rZW4oW10pO1xuXG4gICAgdGhpcy5fZXhwYW5zaW9uQ2FzZVN0YWNrLnBvcCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZVRleHQoKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLl9nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLlRFWFQsIHN0YXJ0KTtcbiAgICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcblxuICAgIGRvIHtcbiAgICAgIGlmICh0aGlzLl9pbnRlcnBvbGF0aW9uQ29uZmlnICYmIHRoaXMuX2F0dGVtcHRTdHIodGhpcy5faW50ZXJwb2xhdGlvbkNvbmZpZy5zdGFydCkpIHtcbiAgICAgICAgcGFydHMucHVzaCh0aGlzLl9pbnRlcnBvbGF0aW9uQ29uZmlnLnN0YXJ0KTtcbiAgICAgICAgdGhpcy5faW5JbnRlcnBvbGF0aW9uID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgdGhpcy5faW50ZXJwb2xhdGlvbkNvbmZpZyAmJiB0aGlzLl9pbkludGVycG9sYXRpb24gJiZcbiAgICAgICAgICB0aGlzLl9hdHRlbXB0U3RyKHRoaXMuX2ludGVycG9sYXRpb25Db25maWcuZW5kKSkge1xuICAgICAgICBwYXJ0cy5wdXNoKHRoaXMuX2ludGVycG9sYXRpb25Db25maWcuZW5kKTtcbiAgICAgICAgdGhpcy5faW5JbnRlcnBvbGF0aW9uID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJ0cy5wdXNoKHRoaXMuX3JlYWRDaGFyKHRydWUpKTtcbiAgICAgIH1cbiAgICB9IHdoaWxlICghdGhpcy5faXNUZXh0RW5kKCkpO1xuXG4gICAgdGhpcy5fZW5kVG9rZW4oW3RoaXMuX3Byb2Nlc3NDYXJyaWFnZVJldHVybnMocGFydHMuam9pbignJykpXSk7XG4gIH1cblxuICBwcml2YXRlIF9pc1RleHRFbmQoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3BlZWsgPT09IGNoYXJzLiRMVCB8fCB0aGlzLl9wZWVrID09PSBjaGFycy4kRU9GKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fdG9rZW5pemVJY3UgJiYgIXRoaXMuX2luSW50ZXJwb2xhdGlvbikge1xuICAgICAgaWYgKGlzRXhwYW5zaW9uRm9ybVN0YXJ0KHRoaXMuX2lucHV0LCB0aGlzLl9pbmRleCwgdGhpcy5faW50ZXJwb2xhdGlvbkNvbmZpZykpIHtcbiAgICAgICAgLy8gc3RhcnQgb2YgYW4gZXhwYW5zaW9uIGZvcm1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9wZWVrID09PSBjaGFycy4kUkJSQUNFICYmIHRoaXMuX2lzSW5FeHBhbnNpb25DYXNlKCkpIHtcbiAgICAgICAgLy8gZW5kIG9mIGFuZCBleHBhbnNpb24gY2FzZVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9zYXZlUG9zaXRpb24oKTogW251bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyXSB7XG4gICAgcmV0dXJuIFt0aGlzLl9wZWVrLCB0aGlzLl9pbmRleCwgdGhpcy5fY29sdW1uLCB0aGlzLl9saW5lLCB0aGlzLnRva2Vucy5sZW5ndGhdO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVhZFVudGlsKGNoYXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLl9pbmRleDtcbiAgICB0aGlzLl9hdHRlbXB0VW50aWxDaGFyKGNoYXIpO1xuICAgIHJldHVybiB0aGlzLl9pbnB1dC5zdWJzdHJpbmcoc3RhcnQsIHRoaXMuX2luZGV4KTtcbiAgfVxuXG4gIHByaXZhdGUgX3Jlc3RvcmVQb3NpdGlvbihwb3NpdGlvbjogW251bWJlciwgbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyXSk6IHZvaWQge1xuICAgIHRoaXMuX3BlZWsgPSBwb3NpdGlvblswXTtcbiAgICB0aGlzLl9pbmRleCA9IHBvc2l0aW9uWzFdO1xuICAgIHRoaXMuX2NvbHVtbiA9IHBvc2l0aW9uWzJdO1xuICAgIHRoaXMuX2xpbmUgPSBwb3NpdGlvblszXTtcbiAgICBjb25zdCBuYlRva2VucyA9IHBvc2l0aW9uWzRdO1xuICAgIGlmIChuYlRva2VucyA8IHRoaXMudG9rZW5zLmxlbmd0aCkge1xuICAgICAgLy8gcmVtb3ZlIGFueSBleHRyYSB0b2tlbnNcbiAgICAgIHRoaXMudG9rZW5zID0gdGhpcy50b2tlbnMuc2xpY2UoMCwgbmJUb2tlbnMpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2lzSW5FeHBhbnNpb25DYXNlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9leHBhbnNpb25DYXNlU3RhY2subGVuZ3RoID4gMCAmJlxuICAgICAgICB0aGlzLl9leHBhbnNpb25DYXNlU3RhY2tbdGhpcy5fZXhwYW5zaW9uQ2FzZVN0YWNrLmxlbmd0aCAtIDFdID09PVxuICAgICAgICBUb2tlblR5cGUuRVhQQU5TSU9OX0NBU0VfRVhQX1NUQVJUO1xuICB9XG5cbiAgcHJpdmF0ZSBfaXNJbkV4cGFuc2lvbkZvcm0oKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2V4cGFuc2lvbkNhc2VTdGFjay5sZW5ndGggPiAwICYmXG4gICAgICAgIHRoaXMuX2V4cGFuc2lvbkNhc2VTdGFja1t0aGlzLl9leHBhbnNpb25DYXNlU3RhY2subGVuZ3RoIC0gMV0gPT09XG4gICAgICAgIFRva2VuVHlwZS5FWFBBTlNJT05fRk9STV9TVEFSVDtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc05vdFdoaXRlc3BhY2UoY29kZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAhY2hhcnMuaXNXaGl0ZXNwYWNlKGNvZGUpIHx8IGNvZGUgPT09IGNoYXJzLiRFT0Y7XG59XG5cbmZ1bmN0aW9uIGlzTmFtZUVuZChjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGNoYXJzLmlzV2hpdGVzcGFjZShjb2RlKSB8fCBjb2RlID09PSBjaGFycy4kR1QgfHwgY29kZSA9PT0gY2hhcnMuJFNMQVNIIHx8XG4gICAgICBjb2RlID09PSBjaGFycy4kU1EgfHwgY29kZSA9PT0gY2hhcnMuJERRIHx8IGNvZGUgPT09IGNoYXJzLiRFUTtcbn1cblxuZnVuY3Rpb24gaXNQcmVmaXhFbmQoY29kZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAoY29kZSA8IGNoYXJzLiRhIHx8IGNoYXJzLiR6IDwgY29kZSkgJiYgKGNvZGUgPCBjaGFycy4kQSB8fCBjaGFycy4kWiA8IGNvZGUpICYmXG4gICAgICAoY29kZSA8IGNoYXJzLiQwIHx8IGNvZGUgPiBjaGFycy4kOSk7XG59XG5cbmZ1bmN0aW9uIGlzRGlnaXRFbnRpdHlFbmQoY29kZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb2RlID09IGNoYXJzLiRTRU1JQ09MT04gfHwgY29kZSA9PSBjaGFycy4kRU9GIHx8ICFjaGFycy5pc0FzY2lpSGV4RGlnaXQoY29kZSk7XG59XG5cbmZ1bmN0aW9uIGlzTmFtZWRFbnRpdHlFbmQoY29kZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb2RlID09IGNoYXJzLiRTRU1JQ09MT04gfHwgY29kZSA9PSBjaGFycy4kRU9GIHx8ICFjaGFycy5pc0FzY2lpTGV0dGVyKGNvZGUpO1xufVxuXG5mdW5jdGlvbiBpc0V4cGFuc2lvbkZvcm1TdGFydChcbiAgICBpbnB1dDogc3RyaW5nLCBvZmZzZXQ6IG51bWJlciwgaW50ZXJwb2xhdGlvbkNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZyk6IGJvb2xlYW4ge1xuICBjb25zdCBpc0ludGVycG9sYXRpb25TdGFydCA9XG4gICAgICBpbnRlcnBvbGF0aW9uQ29uZmlnID8gaW5wdXQuaW5kZXhPZihpbnRlcnBvbGF0aW9uQ29uZmlnLnN0YXJ0LCBvZmZzZXQpID09IG9mZnNldCA6IGZhbHNlO1xuXG4gIHJldHVybiBpbnB1dC5jaGFyQ29kZUF0KG9mZnNldCkgPT0gY2hhcnMuJExCUkFDRSAmJiAhaXNJbnRlcnBvbGF0aW9uU3RhcnQ7XG59XG5cbmZ1bmN0aW9uIGlzRXhwYW5zaW9uQ2FzZVN0YXJ0KHBlZWs6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gcGVlayA9PT0gY2hhcnMuJEVRIHx8IGNoYXJzLmlzQXNjaWlMZXR0ZXIocGVlaykgfHwgY2hhcnMuaXNEaWdpdChwZWVrKTtcbn1cblxuZnVuY3Rpb24gY29tcGFyZUNoYXJDb2RlQ2FzZUluc2Vuc2l0aXZlKGNvZGUxOiBudW1iZXIsIGNvZGUyOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIHRvVXBwZXJDYXNlQ2hhckNvZGUoY29kZTEpID09IHRvVXBwZXJDYXNlQ2hhckNvZGUoY29kZTIpO1xufVxuXG5mdW5jdGlvbiB0b1VwcGVyQ2FzZUNoYXJDb2RlKGNvZGU6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiBjb2RlID49IGNoYXJzLiRhICYmIGNvZGUgPD0gY2hhcnMuJHogPyBjb2RlIC0gY2hhcnMuJGEgKyBjaGFycy4kQSA6IGNvZGU7XG59XG5cbmZ1bmN0aW9uIG1lcmdlVGV4dFRva2VucyhzcmNUb2tlbnM6IFRva2VuW10pOiBUb2tlbltdIHtcbiAgY29uc3QgZHN0VG9rZW5zOiBUb2tlbltdID0gW107XG4gIGxldCBsYXN0RHN0VG9rZW46IFRva2VufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcmNUb2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB0b2tlbiA9IHNyY1Rva2Vuc1tpXTtcbiAgICBpZiAobGFzdERzdFRva2VuICYmIGxhc3REc3RUb2tlbi50eXBlID09IFRva2VuVHlwZS5URVhUICYmIHRva2VuLnR5cGUgPT0gVG9rZW5UeXBlLlRFWFQpIHtcbiAgICAgIGxhc3REc3RUb2tlbi5wYXJ0c1swXSArPSB0b2tlbi5wYXJ0c1swXTtcbiAgICAgIGxhc3REc3RUb2tlbi5zb3VyY2VTcGFuLmVuZCA9IHRva2VuLnNvdXJjZVNwYW4uZW5kO1xuICAgIH0gZWxzZSB7XG4gICAgICBsYXN0RHN0VG9rZW4gPSB0b2tlbjtcbiAgICAgIGRzdFRva2Vucy5wdXNoKGxhc3REc3RUb2tlbik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRzdFRva2Vucztcbn1cbiJdfQ==