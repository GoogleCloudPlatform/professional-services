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
        define("@angular/compiler/src/i18n/i18n_ast", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Message = /** @class */ (function () {
        /**
         * @param nodes message AST
         * @param placeholders maps placeholder names to static content
         * @param placeholderToMessage maps placeholder names to messages (used for nested ICU messages)
         * @param meaning
         * @param description
         * @param id
         */
        function Message(nodes, placeholders, placeholderToMessage, meaning, description, id) {
            this.nodes = nodes;
            this.placeholders = placeholders;
            this.placeholderToMessage = placeholderToMessage;
            this.meaning = meaning;
            this.description = description;
            this.id = id;
            if (nodes.length) {
                this.sources = [{
                        filePath: nodes[0].sourceSpan.start.file.url,
                        startLine: nodes[0].sourceSpan.start.line + 1,
                        startCol: nodes[0].sourceSpan.start.col + 1,
                        endLine: nodes[nodes.length - 1].sourceSpan.end.line + 1,
                        endCol: nodes[0].sourceSpan.start.col + 1
                    }];
            }
            else {
                this.sources = [];
            }
        }
        return Message;
    }());
    exports.Message = Message;
    var Text = /** @class */ (function () {
        function Text(value, sourceSpan) {
            this.value = value;
            this.sourceSpan = sourceSpan;
        }
        Text.prototype.visit = function (visitor, context) { return visitor.visitText(this, context); };
        return Text;
    }());
    exports.Text = Text;
    // TODO(vicb): do we really need this node (vs an array) ?
    var Container = /** @class */ (function () {
        function Container(children, sourceSpan) {
            this.children = children;
            this.sourceSpan = sourceSpan;
        }
        Container.prototype.visit = function (visitor, context) { return visitor.visitContainer(this, context); };
        return Container;
    }());
    exports.Container = Container;
    var Icu = /** @class */ (function () {
        function Icu(expression, type, cases, sourceSpan) {
            this.expression = expression;
            this.type = type;
            this.cases = cases;
            this.sourceSpan = sourceSpan;
        }
        Icu.prototype.visit = function (visitor, context) { return visitor.visitIcu(this, context); };
        return Icu;
    }());
    exports.Icu = Icu;
    var TagPlaceholder = /** @class */ (function () {
        function TagPlaceholder(tag, attrs, startName, closeName, children, isVoid, sourceSpan) {
            this.tag = tag;
            this.attrs = attrs;
            this.startName = startName;
            this.closeName = closeName;
            this.children = children;
            this.isVoid = isVoid;
            this.sourceSpan = sourceSpan;
        }
        TagPlaceholder.prototype.visit = function (visitor, context) { return visitor.visitTagPlaceholder(this, context); };
        return TagPlaceholder;
    }());
    exports.TagPlaceholder = TagPlaceholder;
    var Placeholder = /** @class */ (function () {
        function Placeholder(value, name, sourceSpan) {
            this.value = value;
            this.name = name;
            this.sourceSpan = sourceSpan;
        }
        Placeholder.prototype.visit = function (visitor, context) { return visitor.visitPlaceholder(this, context); };
        return Placeholder;
    }());
    exports.Placeholder = Placeholder;
    var IcuPlaceholder = /** @class */ (function () {
        function IcuPlaceholder(value, name, sourceSpan) {
            this.value = value;
            this.name = name;
            this.sourceSpan = sourceSpan;
        }
        IcuPlaceholder.prototype.visit = function (visitor, context) { return visitor.visitIcuPlaceholder(this, context); };
        return IcuPlaceholder;
    }());
    exports.IcuPlaceholder = IcuPlaceholder;
    // Clone the AST
    var CloneVisitor = /** @class */ (function () {
        function CloneVisitor() {
        }
        CloneVisitor.prototype.visitText = function (text, context) { return new Text(text.value, text.sourceSpan); };
        CloneVisitor.prototype.visitContainer = function (container, context) {
            var _this = this;
            var children = container.children.map(function (n) { return n.visit(_this, context); });
            return new Container(children, container.sourceSpan);
        };
        CloneVisitor.prototype.visitIcu = function (icu, context) {
            var _this = this;
            var cases = {};
            Object.keys(icu.cases).forEach(function (key) { return cases[key] = icu.cases[key].visit(_this, context); });
            var msg = new Icu(icu.expression, icu.type, cases, icu.sourceSpan);
            msg.expressionPlaceholder = icu.expressionPlaceholder;
            return msg;
        };
        CloneVisitor.prototype.visitTagPlaceholder = function (ph, context) {
            var _this = this;
            var children = ph.children.map(function (n) { return n.visit(_this, context); });
            return new TagPlaceholder(ph.tag, ph.attrs, ph.startName, ph.closeName, children, ph.isVoid, ph.sourceSpan);
        };
        CloneVisitor.prototype.visitPlaceholder = function (ph, context) {
            return new Placeholder(ph.value, ph.name, ph.sourceSpan);
        };
        CloneVisitor.prototype.visitIcuPlaceholder = function (ph, context) {
            return new IcuPlaceholder(ph.value, ph.name, ph.sourceSpan);
        };
        return CloneVisitor;
    }());
    exports.CloneVisitor = CloneVisitor;
    // Visit all the nodes recursively
    var RecurseVisitor = /** @class */ (function () {
        function RecurseVisitor() {
        }
        RecurseVisitor.prototype.visitText = function (text, context) { };
        RecurseVisitor.prototype.visitContainer = function (container, context) {
            var _this = this;
            container.children.forEach(function (child) { return child.visit(_this); });
        };
        RecurseVisitor.prototype.visitIcu = function (icu, context) {
            var _this = this;
            Object.keys(icu.cases).forEach(function (k) { icu.cases[k].visit(_this); });
        };
        RecurseVisitor.prototype.visitTagPlaceholder = function (ph, context) {
            var _this = this;
            ph.children.forEach(function (child) { return child.visit(_this); });
        };
        RecurseVisitor.prototype.visitPlaceholder = function (ph, context) { };
        RecurseVisitor.prototype.visitIcuPlaceholder = function (ph, context) { };
        return RecurseVisitor;
    }());
    exports.RecurseVisitor = RecurseVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9hc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvaTE4bi9pMThuX2FzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUlIO1FBR0U7Ozs7Ozs7V0FPRztRQUNILGlCQUNXLEtBQWEsRUFBUyxZQUF3QyxFQUM5RCxvQkFBaUQsRUFBUyxPQUFlLEVBQ3pFLFdBQW1CLEVBQVMsRUFBVTtZQUZ0QyxVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQVMsaUJBQVksR0FBWixZQUFZLENBQTRCO1lBQzlELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBNkI7WUFBUyxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQ3pFLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQVMsT0FBRSxHQUFGLEVBQUUsQ0FBUTtZQUMvQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQzt3QkFDZCxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUc7d0JBQzVDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQzt3QkFDN0MsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDO3dCQUMzQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQzt3QkFDeEQsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDO3FCQUMx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RUM7WUFEQyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFBLEtBQUssSUFBSSxPQUFBLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSSxDQUFDLEVBQWpCLENBQWlCLENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBRUQsaUNBQVEsR0FBUixVQUFTLEdBQVEsRUFBRSxPQUFhO1lBQWhDLGlCQUVDO1lBREMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQyxJQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVELDRDQUFtQixHQUFuQixVQUFvQixFQUFrQixFQUFFLE9BQWE7WUFBckQsaUJBRUM7WUFEQyxFQUFFLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFBLEtBQUssSUFBSSxPQUFBLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSSxDQUFDLEVBQWpCLENBQWlCLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRUQseUNBQWdCLEdBQWhCLFVBQWlCLEVBQWUsRUFBRSxPQUFhLElBQVEsQ0FBQztRQUV4RCw0Q0FBbUIsR0FBbkIsVUFBb0IsRUFBa0IsRUFBRSxPQUFhLElBQVEsQ0FBQztRQUNoRSxxQkFBQztJQUFELENBQUMsQUFsQkQsSUFrQkM7SUFsQlksd0NBQWMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGFyc2VTb3VyY2VTcGFufSBmcm9tICcuLi9wYXJzZV91dGlsJztcblxuZXhwb3J0IGNsYXNzIE1lc3NhZ2Uge1xuICBzb3VyY2VzOiBNZXNzYWdlU3BhbltdO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gbm9kZXMgbWVzc2FnZSBBU1RcbiAgICogQHBhcmFtIHBsYWNlaG9sZGVycyBtYXBzIHBsYWNlaG9sZGVyIG5hbWVzIHRvIHN0YXRpYyBjb250ZW50XG4gICAqIEBwYXJhbSBwbGFjZWhvbGRlclRvTWVzc2FnZSBtYXBzIHBsYWNlaG9sZGVyIG5hbWVzIHRvIG1lc3NhZ2VzICh1c2VkIGZvciBuZXN0ZWQgSUNVIG1lc3NhZ2VzKVxuICAgKiBAcGFyYW0gbWVhbmluZ1xuICAgKiBAcGFyYW0gZGVzY3JpcHRpb25cbiAgICogQHBhcmFtIGlkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBub2RlczogTm9kZVtdLCBwdWJsaWMgcGxhY2Vob2xkZXJzOiB7W3BoTmFtZTogc3RyaW5nXTogc3RyaW5nfSxcbiAgICAgIHB1YmxpYyBwbGFjZWhvbGRlclRvTWVzc2FnZToge1twaE5hbWU6IHN0cmluZ106IE1lc3NhZ2V9LCBwdWJsaWMgbWVhbmluZzogc3RyaW5nLFxuICAgICAgcHVibGljIGRlc2NyaXB0aW9uOiBzdHJpbmcsIHB1YmxpYyBpZDogc3RyaW5nKSB7XG4gICAgaWYgKG5vZGVzLmxlbmd0aCkge1xuICAgICAgdGhpcy5zb3VyY2VzID0gW3tcbiAgICAgICAgZmlsZVBhdGg6IG5vZGVzWzBdLnNvdXJjZVNwYW4uc3RhcnQuZmlsZS51cmwsXG4gICAgICAgIHN0YXJ0TGluZTogbm9kZXNbMF0uc291cmNlU3Bhbi5zdGFydC5saW5lICsgMSxcbiAgICAgICAgc3RhcnRDb2w6IG5vZGVzWzBdLnNvdXJjZVNwYW4uc3RhcnQuY29sICsgMSxcbiAgICAgICAgZW5kTGluZTogbm9kZXNbbm9kZXMubGVuZ3RoIC0gMV0uc291cmNlU3Bhbi5lbmQubGluZSArIDEsXG4gICAgICAgIGVuZENvbDogbm9kZXNbMF0uc291cmNlU3Bhbi5zdGFydC5jb2wgKyAxXG4gICAgICB9XTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zb3VyY2VzID0gW107XG4gICAgfVxuICB9XG59XG5cbi8vIGxpbmUgYW5kIGNvbHVtbnMgaW5kZXhlcyBhcmUgMSBiYXNlZFxuZXhwb3J0IGludGVyZmFjZSBNZXNzYWdlU3BhbiB7XG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIHN0YXJ0TGluZTogbnVtYmVyO1xuICBzdGFydENvbDogbnVtYmVyO1xuICBlbmRMaW5lOiBudW1iZXI7XG4gIGVuZENvbDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5vZGUge1xuICBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW47XG4gIHZpc2l0KHZpc2l0b3I6IFZpc2l0b3IsIGNvbnRleHQ/OiBhbnkpOiBhbnk7XG59XG5cbmV4cG9ydCBjbGFzcyBUZXh0IGltcGxlbWVudHMgTm9kZSB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB2YWx1ZTogc3RyaW5nLCBwdWJsaWMgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuKSB7fVxuXG4gIHZpc2l0KHZpc2l0b3I6IFZpc2l0b3IsIGNvbnRleHQ/OiBhbnkpOiBhbnkgeyByZXR1cm4gdmlzaXRvci52aXNpdFRleHQodGhpcywgY29udGV4dCk7IH1cbn1cblxuLy8gVE9ETyh2aWNiKTogZG8gd2UgcmVhbGx5IG5lZWQgdGhpcyBub2RlICh2cyBhbiBhcnJheSkgP1xuZXhwb3J0IGNsYXNzIENvbnRhaW5lciBpbXBsZW1lbnRzIE5vZGUge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgY2hpbGRyZW46IE5vZGVbXSwgcHVibGljIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbikge31cblxuICB2aXNpdCh2aXNpdG9yOiBWaXNpdG9yLCBjb250ZXh0PzogYW55KTogYW55IHsgcmV0dXJuIHZpc2l0b3IudmlzaXRDb250YWluZXIodGhpcywgY29udGV4dCk7IH1cbn1cblxuZXhwb3J0IGNsYXNzIEljdSBpbXBsZW1lbnRzIE5vZGUge1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHVibGljIGV4cHJlc3Npb25QbGFjZWhvbGRlciAhOiBzdHJpbmc7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGV4cHJlc3Npb246IHN0cmluZywgcHVibGljIHR5cGU6IHN0cmluZywgcHVibGljIGNhc2VzOiB7W2s6IHN0cmluZ106IE5vZGV9LFxuICAgICAgcHVibGljIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbikge31cblxuICB2aXNpdCh2aXNpdG9yOiBWaXNpdG9yLCBjb250ZXh0PzogYW55KTogYW55IHsgcmV0dXJuIHZpc2l0b3IudmlzaXRJY3UodGhpcywgY29udGV4dCk7IH1cbn1cblxuZXhwb3J0IGNsYXNzIFRhZ1BsYWNlaG9sZGVyIGltcGxlbWVudHMgTm9kZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHRhZzogc3RyaW5nLCBwdWJsaWMgYXR0cnM6IHtbazogc3RyaW5nXTogc3RyaW5nfSwgcHVibGljIHN0YXJ0TmFtZTogc3RyaW5nLFxuICAgICAgcHVibGljIGNsb3NlTmFtZTogc3RyaW5nLCBwdWJsaWMgY2hpbGRyZW46IE5vZGVbXSwgcHVibGljIGlzVm9pZDogYm9vbGVhbixcbiAgICAgIHB1YmxpYyBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4pIHt9XG5cbiAgdmlzaXQodmlzaXRvcjogVmlzaXRvciwgY29udGV4dD86IGFueSk6IGFueSB7IHJldHVybiB2aXNpdG9yLnZpc2l0VGFnUGxhY2Vob2xkZXIodGhpcywgY29udGV4dCk7IH1cbn1cblxuZXhwb3J0IGNsYXNzIFBsYWNlaG9sZGVyIGltcGxlbWVudHMgTm9kZSB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB2YWx1ZTogc3RyaW5nLCBwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuKSB7fVxuXG4gIHZpc2l0KHZpc2l0b3I6IFZpc2l0b3IsIGNvbnRleHQ/OiBhbnkpOiBhbnkgeyByZXR1cm4gdmlzaXRvci52aXNpdFBsYWNlaG9sZGVyKHRoaXMsIGNvbnRleHQpOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBJY3VQbGFjZWhvbGRlciBpbXBsZW1lbnRzIE5vZGUge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdmFsdWU6IEljdSwgcHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbikge31cblxuICB2aXNpdCh2aXNpdG9yOiBWaXNpdG9yLCBjb250ZXh0PzogYW55KTogYW55IHsgcmV0dXJuIHZpc2l0b3IudmlzaXRJY3VQbGFjZWhvbGRlcih0aGlzLCBjb250ZXh0KTsgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZpc2l0b3Ige1xuICB2aXNpdFRleHQodGV4dDogVGV4dCwgY29udGV4dD86IGFueSk6IGFueTtcbiAgdmlzaXRDb250YWluZXIoY29udGFpbmVyOiBDb250YWluZXIsIGNvbnRleHQ/OiBhbnkpOiBhbnk7XG4gIHZpc2l0SWN1KGljdTogSWN1LCBjb250ZXh0PzogYW55KTogYW55O1xuICB2aXNpdFRhZ1BsYWNlaG9sZGVyKHBoOiBUYWdQbGFjZWhvbGRlciwgY29udGV4dD86IGFueSk6IGFueTtcbiAgdmlzaXRQbGFjZWhvbGRlcihwaDogUGxhY2Vob2xkZXIsIGNvbnRleHQ/OiBhbnkpOiBhbnk7XG4gIHZpc2l0SWN1UGxhY2Vob2xkZXIocGg6IEljdVBsYWNlaG9sZGVyLCBjb250ZXh0PzogYW55KTogYW55O1xufVxuXG4vLyBDbG9uZSB0aGUgQVNUXG5leHBvcnQgY2xhc3MgQ2xvbmVWaXNpdG9yIGltcGxlbWVudHMgVmlzaXRvciB7XG4gIHZpc2l0VGV4dCh0ZXh0OiBUZXh0LCBjb250ZXh0PzogYW55KTogVGV4dCB7IHJldHVybiBuZXcgVGV4dCh0ZXh0LnZhbHVlLCB0ZXh0LnNvdXJjZVNwYW4pOyB9XG5cbiAgdmlzaXRDb250YWluZXIoY29udGFpbmVyOiBDb250YWluZXIsIGNvbnRleHQ/OiBhbnkpOiBDb250YWluZXIge1xuICAgIGNvbnN0IGNoaWxkcmVuID0gY29udGFpbmVyLmNoaWxkcmVuLm1hcChuID0+IG4udmlzaXQodGhpcywgY29udGV4dCkpO1xuICAgIHJldHVybiBuZXcgQ29udGFpbmVyKGNoaWxkcmVuLCBjb250YWluZXIuc291cmNlU3Bhbik7XG4gIH1cblxuICB2aXNpdEljdShpY3U6IEljdSwgY29udGV4dD86IGFueSk6IEljdSB7XG4gICAgY29uc3QgY2FzZXM6IHtbazogc3RyaW5nXTogTm9kZX0gPSB7fTtcbiAgICBPYmplY3Qua2V5cyhpY3UuY2FzZXMpLmZvckVhY2goa2V5ID0+IGNhc2VzW2tleV0gPSBpY3UuY2FzZXNba2V5XS52aXNpdCh0aGlzLCBjb250ZXh0KSk7XG4gICAgY29uc3QgbXNnID0gbmV3IEljdShpY3UuZXhwcmVzc2lvbiwgaWN1LnR5cGUsIGNhc2VzLCBpY3Uuc291cmNlU3Bhbik7XG4gICAgbXNnLmV4cHJlc3Npb25QbGFjZWhvbGRlciA9IGljdS5leHByZXNzaW9uUGxhY2Vob2xkZXI7XG4gICAgcmV0dXJuIG1zZztcbiAgfVxuXG4gIHZpc2l0VGFnUGxhY2Vob2xkZXIocGg6IFRhZ1BsYWNlaG9sZGVyLCBjb250ZXh0PzogYW55KTogVGFnUGxhY2Vob2xkZXIge1xuICAgIGNvbnN0IGNoaWxkcmVuID0gcGguY2hpbGRyZW4ubWFwKG4gPT4gbi52aXNpdCh0aGlzLCBjb250ZXh0KSk7XG4gICAgcmV0dXJuIG5ldyBUYWdQbGFjZWhvbGRlcihcbiAgICAgICAgcGgudGFnLCBwaC5hdHRycywgcGguc3RhcnROYW1lLCBwaC5jbG9zZU5hbWUsIGNoaWxkcmVuLCBwaC5pc1ZvaWQsIHBoLnNvdXJjZVNwYW4pO1xuICB9XG5cbiAgdmlzaXRQbGFjZWhvbGRlcihwaDogUGxhY2Vob2xkZXIsIGNvbnRleHQ/OiBhbnkpOiBQbGFjZWhvbGRlciB7XG4gICAgcmV0dXJuIG5ldyBQbGFjZWhvbGRlcihwaC52YWx1ZSwgcGgubmFtZSwgcGguc291cmNlU3Bhbik7XG4gIH1cblxuICB2aXNpdEljdVBsYWNlaG9sZGVyKHBoOiBJY3VQbGFjZWhvbGRlciwgY29udGV4dD86IGFueSk6IEljdVBsYWNlaG9sZGVyIHtcbiAgICByZXR1cm4gbmV3IEljdVBsYWNlaG9sZGVyKHBoLnZhbHVlLCBwaC5uYW1lLCBwaC5zb3VyY2VTcGFuKTtcbiAgfVxufVxuXG4vLyBWaXNpdCBhbGwgdGhlIG5vZGVzIHJlY3Vyc2l2ZWx5XG5leHBvcnQgY2xhc3MgUmVjdXJzZVZpc2l0b3IgaW1wbGVtZW50cyBWaXNpdG9yIHtcbiAgdmlzaXRUZXh0KHRleHQ6IFRleHQsIGNvbnRleHQ/OiBhbnkpOiBhbnkge31cblxuICB2aXNpdENvbnRhaW5lcihjb250YWluZXI6IENvbnRhaW5lciwgY29udGV4dD86IGFueSk6IGFueSB7XG4gICAgY29udGFpbmVyLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4gY2hpbGQudmlzaXQodGhpcykpO1xuICB9XG5cbiAgdmlzaXRJY3UoaWN1OiBJY3UsIGNvbnRleHQ/OiBhbnkpOiBhbnkge1xuICAgIE9iamVjdC5rZXlzKGljdS5jYXNlcykuZm9yRWFjaChrID0+IHsgaWN1LmNhc2VzW2tdLnZpc2l0KHRoaXMpOyB9KTtcbiAgfVxuXG4gIHZpc2l0VGFnUGxhY2Vob2xkZXIocGg6IFRhZ1BsYWNlaG9sZGVyLCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICBwaC5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IGNoaWxkLnZpc2l0KHRoaXMpKTtcbiAgfVxuXG4gIHZpc2l0UGxhY2Vob2xkZXIocGg6IFBsYWNlaG9sZGVyLCBjb250ZXh0PzogYW55KTogYW55IHt9XG5cbiAgdmlzaXRJY3VQbGFjZWhvbGRlcihwaDogSWN1UGxhY2Vob2xkZXIsIGNvbnRleHQ/OiBhbnkpOiBhbnkge31cbn1cbiJdfQ==