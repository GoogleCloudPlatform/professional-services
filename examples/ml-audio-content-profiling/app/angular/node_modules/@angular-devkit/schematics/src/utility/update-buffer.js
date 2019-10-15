"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const linked_list_1 = require("./linked-list");
class IndexOutOfBoundException extends core_1.BaseException {
    constructor(index, min, max = Infinity) {
        super(`Index ${index} outside of range [${min}, ${max}].`);
    }
}
exports.IndexOutOfBoundException = IndexOutOfBoundException;
class ContentCannotBeRemovedException extends core_1.BaseException {
    constructor() {
        super(`User tried to remove content that was marked essential.`);
    }
}
exports.ContentCannotBeRemovedException = ContentCannotBeRemovedException;
/**
 * A Chunk description, including left/right content that has been inserted.
 * If _left/_right is null, this means that content was deleted. If the _content is null,
 * it means the content itself was deleted.
 *
 * @see UpdateBuffer
 */
class Chunk {
    constructor(start, end, originalContent) {
        this.start = start;
        this.end = end;
        this.originalContent = originalContent;
        this._left = Buffer.alloc(0);
        this._right = Buffer.alloc(0);
        this._assertLeft = false;
        this._assertRight = false;
        this.next = null;
        this._content = originalContent.slice(start, end);
    }
    get length() {
        return (this._left ? this._left.length : 0)
            + (this._content ? this._content.length : 0)
            + (this._right ? this._right.length : 0);
    }
    toString(encoding = 'utf-8') {
        return (this._left ? this._left.toString(encoding) : '')
            + (this._content ? this._content.toString(encoding) : '')
            + (this._right ? this._right.toString(encoding) : '');
    }
    slice(start) {
        if (start < this.start || start > this.end) {
            throw new IndexOutOfBoundException(start, this.start, this.end);
        }
        // Update _content to the new indices.
        const newChunk = new Chunk(start, this.end, this.originalContent);
        // If this chunk has _content, reslice the original _content. We move the _right so we are not
        // losing any data here. If this chunk has been deleted, the next chunk should also be deleted.
        if (this._content) {
            this._content = this.originalContent.slice(this.start, start);
        }
        else {
            newChunk._content = this._content;
            if (this._right === null) {
                newChunk._left = null;
            }
        }
        this.end = start;
        // Move _right to the new chunk.
        newChunk._right = this._right;
        this._right = this._right && Buffer.alloc(0);
        // Update essentials.
        if (this._assertRight) {
            newChunk._assertRight = true;
            this._assertRight = false;
        }
        // Update the linked list.
        newChunk.next = this.next;
        this.next = newChunk;
        return newChunk;
    }
    append(buffer, essential) {
        if (!this._right) {
            if (essential) {
                throw new ContentCannotBeRemovedException();
            }
            return;
        }
        const outro = this._right;
        this._right = Buffer.alloc(outro.length + buffer.length);
        outro.copy(this._right, 0);
        buffer.copy(this._right, outro.length);
        if (essential) {
            this._assertRight = true;
        }
    }
    prepend(buffer, essential) {
        if (!this._left) {
            if (essential) {
                throw new ContentCannotBeRemovedException();
            }
            return;
        }
        const intro = this._left;
        this._left = Buffer.alloc(intro.length + buffer.length);
        intro.copy(this._left, 0);
        buffer.copy(this._left, intro.length);
        if (essential) {
            this._assertLeft = true;
        }
    }
    assert(left, _content, right) {
        if (left) {
            if (this._assertLeft) {
                throw new ContentCannotBeRemovedException();
            }
        }
        if (right) {
            if (this._assertRight) {
                throw new ContentCannotBeRemovedException();
            }
        }
    }
    remove(left, content, right) {
        if (left) {
            if (this._assertLeft) {
                throw new ContentCannotBeRemovedException();
            }
            this._left = null;
        }
        if (content) {
            this._content = null;
        }
        if (right) {
            if (this._assertRight) {
                throw new ContentCannotBeRemovedException();
            }
            this._right = null;
        }
    }
    copy(target, start) {
        if (this._left) {
            this._left.copy(target, start);
            start += this._left.length;
        }
        if (this._content) {
            this._content.copy(target, start);
            start += this._content.length;
        }
        if (this._right) {
            this._right.copy(target, start);
            start += this._right.length;
        }
        return start;
    }
}
exports.Chunk = Chunk;
/**
 * An utility class that allows buffers to be inserted to the _right or _left, or deleted, while
 * keeping indices to the original buffer.
 *
 * The constructor takes an original buffer, and keeps it into a linked list of chunks, smaller
 * buffers that keep track of _content inserted to the _right or _left of it.
 *
 * Since the Node Buffer structure is non-destructive when slicing, we try to use slicing to create
 * new chunks, and always keep chunks pointing to the original content.
 */
class UpdateBuffer {
    constructor(_originalContent) {
        this._originalContent = _originalContent;
        this._linkedList = new linked_list_1.LinkedList(new Chunk(0, _originalContent.length, _originalContent));
    }
    _assertIndex(index) {
        if (index < 0 || index > this._originalContent.length) {
            throw new IndexOutOfBoundException(index, 0, this._originalContent.length);
        }
    }
    _slice(start) {
        // If start is longer than the content, use start, otherwise determine exact position in string.
        const index = start >= this._originalContent.length ? start : this._getTextPosition(start);
        this._assertIndex(index);
        // Find the chunk by going through the list.
        const h = this._linkedList.find(chunk => index <= chunk.end);
        if (!h) {
            throw Error('Chunk cannot be found.');
        }
        if (index == h.end && h.next !== null) {
            return [h, h.next];
        }
        return [h, h.slice(index)];
    }
    /**
     * Gets the position in the content based on the position in the string.
     * Some characters might be wider than one byte, thus we have to determine the position using
     * string functions.
     */
    _getTextPosition(index) {
        return Buffer.from(this._originalContent.toString().substring(0, index)).length;
    }
    get length() {
        return this._linkedList.reduce((acc, chunk) => acc + chunk.length, 0);
    }
    get original() {
        return this._originalContent;
    }
    toString(encoding = 'utf-8') {
        return this._linkedList.reduce((acc, chunk) => acc + chunk.toString(encoding), '');
    }
    generate() {
        const result = Buffer.allocUnsafe(this.length);
        let i = 0;
        this._linkedList.forEach(chunk => {
            chunk.copy(result, i);
            i += chunk.length;
        });
        return result;
    }
    insertLeft(index, content, assert = false) {
        this._slice(index)[0].append(content, assert);
    }
    insertRight(index, content, assert = false) {
        this._slice(index)[1].prepend(content, assert);
    }
    remove(index, length) {
        const end = index + length;
        const first = this._slice(index)[1];
        const last = this._slice(end)[1];
        let curr;
        for (curr = first; curr && curr !== last; curr = curr.next) {
            curr.assert(curr !== first, curr !== last, curr === first);
        }
        for (curr = first; curr && curr !== last; curr = curr.next) {
            curr.remove(curr !== first, curr !== last, curr === first);
        }
        if (curr) {
            curr.remove(true, false, false);
        }
    }
}
exports.UpdateBuffer = UpdateBuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLWJ1ZmZlci5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvdXRpbGl0eS91cGRhdGUtYnVmZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQXFEO0FBQ3JELCtDQUEyQztBQUczQyxNQUFhLHdCQUF5QixTQUFRLG9CQUFhO0lBQ3pELFlBQVksS0FBYSxFQUFFLEdBQVcsRUFBRSxHQUFHLEdBQUcsUUFBUTtRQUNwRCxLQUFLLENBQUMsU0FBUyxLQUFLLHNCQUFzQixHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM3RCxDQUFDO0NBQ0Y7QUFKRCw0REFJQztBQUNELE1BQWEsK0JBQWdDLFNBQVEsb0JBQWE7SUFDaEU7UUFDRSxLQUFLLENBQUMseURBQXlELENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0Y7QUFKRCwwRUFJQztBQUdEOzs7Ozs7R0FNRztBQUNILE1BQWEsS0FBSztJQVVoQixZQUFtQixLQUFhLEVBQVMsR0FBVyxFQUFTLGVBQXVCO1FBQWpFLFVBQUssR0FBTCxLQUFLLENBQVE7UUFBUyxRQUFHLEdBQUgsR0FBRyxDQUFRO1FBQVMsb0JBQWUsR0FBZixlQUFlLENBQVE7UUFSNUUsVUFBSyxHQUFrQixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLFdBQU0sR0FBa0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV4QyxnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUNwQixpQkFBWSxHQUFHLEtBQUssQ0FBQztRQUU3QixTQUFJLEdBQWlCLElBQUksQ0FBQztRQUd4QixJQUFJLENBQUMsUUFBUSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRCxJQUFJLE1BQU07UUFDUixPQUFPLENBQUMs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QUcsS0FBSyxFQUFFLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQzFELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEtBQUssRUFBRSxJQUFJLEtBQUssSUFBSSxFQUFFLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQztTQUM1RDtRQUVELElBQUksSUFBSSxFQUFFO1lBQ1IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ2pDO0lBQ0gsQ0FBQztDQUNGO0FBdkZELG9DQXVGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24gfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBMaW5rZWRMaXN0IH0gZnJvbSAnLi9saW5rZWQtbGlzdCc7XG5cblxuZXhwb3J0IGNsYXNzIEluZGV4T3V0T2ZCb3VuZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihpbmRleDogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4ID0gSW5maW5pdHkpIHtcbiAgICBzdXBlcihgSW5kZXggJHtpbmRleH0gb3V0c2lkZSBvZiByYW5nZSBbJHttaW59LCAke21heH1dLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgQ29udGVudENhbm5vdEJlUmVtb3ZlZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihgVXNlciB0cmllZCB0byByZW1vdmUgY29udGVudCB0aGF0IHdhcyBtYXJrZWQgZXNzZW50aWFsLmApO1xuICB9XG59XG5cblxuLyoqXG4gKiBBIENodW5rIGRlc2NyaXB0aW9uLCBpbmNsdWRpbmcgbGVmdC9yaWdodCBjb250ZW50IHRoYXQgaGFzIGJlZW4gaW5zZXJ0ZWQuXG4gKiBJZiBfbGVmdC9fcmlnaHQgaXMgbnVsbCwgdGhpcyBtZWFucyB0aGF0IGNvbnRlbnQgd2FzIGRlbGV0ZWQuIElmIHRoZSBfY29udGVudCBpcyBudWxsLFxuICogaXQgbWVhbnMgdGhlIGNvbnRlbnQgaXRzZWxmIHdhcyBkZWxldGVkLlxuICpcbiAqIEBzZWUgVXBkYXRlQnVmZmVyXG4gKi9cbmV4cG9ydCBjbGFzcyBDaHVuayB7XG4gIHByaXZhdGUgX2NvbnRlbnQ6IEJ1ZmZlciB8IG51bGw7XG4gIHByaXZhdGUgX2xlZnQ6IEJ1ZmZlciB8IG51bGwgPSBCdWZmZXIuYWxsb2MoMCk7XG4gIHByaXZhdGUgX3JpZ2h0OiBCdWZmZXIgfCBudWxsID0gQnVmZmVyLmFsbG9jKDApO1xuXG4gIHByaXZhdGUgX2Fzc2VydExlZnQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfYXNzZXJ0UmlnaHQgPSBmYWxzZTtcblxuICBuZXh0OiBDaHVuayB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBzdGFydDogbnVtYmVyLCBwdWJsaWMgZW5kOiBudW1iZXIsIHB1YmxpYyBvcmlnaW5hbENvbnRlbnQ6IEJ1ZmZlcikge1xuICAgIHRoaXMuX2NvbnRlbnQgPSBvcmlnaW5hbENvbnRlbnQuc2xpY2Uoc3RhcnQsIGVuZCk7XG4gIH1cblxuICBnZXQgbGVuZ3RoKCkge1xuICAgIHJldHVybiAodGhpcy5fbGVmdCA/IHRoaXMuX2xlZnQubGVuZ3RoIDogMClcbiAgICAgICAgICsgKHRoaXMuX2NvbnRlbnQgPyB0aGlzLl9jb250ZW50Lmxlbmd0aCA6IDApXG4gICAgICAgICArICh0aGlzLl9yaWdodCA/IHRoaXMuX3JpZ2h0Lmxlbmd0aCA6IDApO1xuICB9XG4gIHRvU3RyaW5nKGVuY29kaW5nID0gJ3V0Zi04Jykge1xuICAgIHJldHVybiAodGhpcy5fbGVmdCA/IHRoaXMuX2xlZnQudG9TdHJpbmcoZW5jb2RpbmcpIDogJycpXG4gICAgICAgICArICh0aGlzLl9jb250ZW50ID8gdGhpcy5fY29udGVudC50b1N0cmluZyhlbmNvZGluZykgOiAnJylcbiAgICAgICAgICsgKHRoaXMuX3JpZ2h0ID8gdGhpcy5fcmlnaHQudG9TdHJpbmcoZW5jb2RpbmcpIDogJycpO1xuICB9XG5cbiAgc2xpY2Uoc3RhcnQ6IG51bWJlcikge1xuICAgIGlmIChzdGFydCA8IHRoaXMuc3RhcnQgfHwgc3RhcnQgPiB0aGlzLmVuZCkge1xuICAgICAgdGhyb3cgbmV3IEluZGV4T3V0T2ZCb3VuZEV4Y2VwdGlvbihzdGFydCwgdGhpcy5zdGFydCwgdGhpcy5lbmQpO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBfY29udGVudCB0byB0aGUgbmV3IGluZGljZXMuXG4gICAgY29uc3QgbmV3Q2h1bmsgPSBuZXcgQ2h1bmsoc3RhcnQsIHRoaXMuZW5kLCB0aGlzLm9yaWdpbmFsQ29udGVudCk7XG5cbiAgICAvLyBJZiB0aGlzIGNodW5rIGhhcyBfY29udGVudCwgcmVzbGljZSB0aGUgb3JpZ2luYWwgX2NvbnRlbnQuIFdlIG1vdmUgdGhlIF9yaWdodCBzbyB3ZSBhcmUgbm90XG4gICAgLy8gbG9zaW5nIGFueSBkYXRhIGhlcmUuIElmIHRoaXMgY2h1bmsgaGFzIGJlZW4gZGVsZXRlZCwgdGhlIG5leHQgY2h1bmsgc2hvdWxkIGFsc28gYmUgZGVsZXRlZC5cbiAgICBpZiAodGhpcy5fY29udGVudCkge1xuICAgICAgdGhpcy5fY29udGVudCA9IHRoaXMub3JpZ2luYWxDb250ZW50LnNsaWNlKHRoaXMuc3RhcnQsIHN0YXJ0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3Q2h1bmsuX2NvbnRlbnQgPSB0aGlzLl9jb250ZW50O1xuICAgICAgaWYgKHRoaXMuX3JpZ2h0ID09PSBudWxsKSB7XG4gICAgICAgIG5ld0NodW5rLl9sZWZ0ID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5lbmQgPSBzdGFydDtcblxuICAgIC8vIE1vdmUgX3JpZ2h0IHRvIHRoZSBuZXcgY2h1bmsuXG4gICAgbmV3Q2h1bmsuX3JpZ2h0ID0gdGhpcy5fcmlnaHQ7XG4gICAgdGhpcy5fcmlnaHQgPSB0aGlzLl9yaWdodCAmJiBCdWZmZXIuYWxsb2MoMCk7XG5cbiAgICAvLyBVcGRhdGUgZXNzZW50aWFscy5cbiAgICBpZiAodGhpcy5fYXNzZXJ0UmlnaHQpIHtcbiAgICAgIG5ld0NodW5rLl9hc3NlcnRSaWdodCA9IHRydWU7XG4gICAgICB0aGlzLl9hc3NlcnRSaWdodCA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSB0aGUgbGlua2VkIGxpc3QuXG4gICAgbmV3Q2h1bmsubmV4dCA9IHRoaXMubmV4dDtcbiAgICB0aGlzLm5leHQgPSBuZXdDaHVuaztcblxuICAgIHJldHVybiBuZXdDaHVuaztcbiAgfVxuXG4gIGFwcGVuZChidWZmZXI6IEJ1ZmZlciwgZXNzZW50aWFsOiBib29sZWFuKSB7XG4gICAgaWYgKCF0aGlzLl9yaWdodCkge1xuICAgICAgaWYgKGVzc2VudGlhbCkge1xuICAgICAgICB0aHJvdyBuZXcgQ29udGVudENhbm5vdEJlUmVtb3ZlZEV4Y2VwdGlvbigpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgb3V0cm8gPSB0aGlzLl9yaWdodDtcbiAgICB0aGlzLl9yaWdodCA9IEJ1ZmZlci5hbGxvYyhvdXRyby5sZW5ndGggKyBidWZmZXIubGVuZ3RoKTtcbiAgICBvdXRyby5jb3B5KHRoaXMuX3JpZ2h0LCAwKTtcbiAgICBidWZmZXIuY29weSh0aGlzLl9yaWdodCwgb3V0cm8ubGVuZ3RoKTtcblxuICAgIGlmIChlc3NlbnRpYWwpIHtcbiAgICAgIHRoaXMuX2Fzc2VydFJpZ2h0ID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcHJlcGVuZChidWZmZXI6IEJ1ZmZlciwgZXNzZW50aWFsOiBib29sZWFuKSB7XG4gICAgaWYgKCF0aGlzLl9sZWZ0KSB7XG4gICAgICBpZiAoZXNzZW50aWFsKSB7XG4gICAgICAgIHRocm93IG5ldyBDb250ZW50Q2Fubm90QmVSZW1vdmVkRXhjZXB0aW9uKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpbnRybyA9IHRoaXMuX2xlZnQ7XG4gICAgdGhpcy5fbGVmdCA9IEJ1ZmZlci5hbGxvYyhpbnRyby5sZW5ndGggKyBidWZmZXIubGVuZ3RoKTtcbiAgICBpbnRyby5jb3B5KHRoaXMuX2xlZnQsIDApO1xuICAgIGJ1ZmZlci5jb3B5KHRoaXMuX2xlZnQsIGludHJvLmxlbmd0aCk7XG5cbiAgICBpZiAoZXNzZW50aWFsKSB7XG4gICAgICB0aGlzLl9hc3NlcnRMZWZ0ID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBhc3NlcnQobGVmdDogYm9vbGVhbiwgX2NvbnRlbnQ6IGJvb2xlYW4sIHJpZ2h0OiBib29sZWFuKSB7XG4gICAgaWYgKGxlZnQpIHtcbiAgICAgIGlmICh0aGlzLl9hc3NlcnRMZWZ0KSB7XG4gICAgICAgIHRocm93IG5ldyBDb250ZW50Q2Fubm90QmVSZW1vdmVkRXhjZXB0aW9uKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyaWdodCkge1xuICAgICAgaWYgKHRoaXMuX2Fzc2VydFJpZ2h0KSB7XG4gICAgICAgIHRocm93IG5ldyBDb250ZW50Q2Fubm90QmVSZW1vdmVkRXhjZXB0aW9uKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKGxlZnQ6IGJvb2xlYW4sIGNvbnRlbnQ6IGJvb2xlYW4sIHJpZ2h0OiBib29sZWFuKSB7XG4gICAgaWYgKGxlZnQpIHtcbiAgICAgIGlmICh0aGlzLl9hc3NlcnRMZWZ0KSB7XG4gICAgICAgIHRocm93IG5ldyBDb250ZW50Q2Fubm90QmVSZW1vdmVkRXhjZXB0aW9uKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9sZWZ0ID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgIHRoaXMuX2NvbnRlbnQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAocmlnaHQpIHtcbiAgICAgIGlmICh0aGlzLl9hc3NlcnRSaWdodCkge1xuICAgICAgICB0aHJvdyBuZXcgQ29udGVudENhbm5vdEJlUmVtb3ZlZEV4Y2VwdGlvbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5fcmlnaHQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGNvcHkodGFyZ2V0OiBCdWZmZXIsIHN0YXJ0OiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5fbGVmdCkge1xuICAgICAgdGhpcy5fbGVmdC5jb3B5KHRhcmdldCwgc3RhcnQpO1xuICAgICAgc3RhcnQgKz0gdGhpcy5fbGVmdC5sZW5ndGg7XG4gICAgfVxuICAgIGlmICh0aGlzLl9jb250ZW50KSB7XG4gICAgICB0aGlzLl9jb250ZW50LmNvcHkodGFyZ2V0LCBzdGFydCk7XG4gICAgICBzdGFydCArPSB0aGlzLl9jb250ZW50Lmxlbmd0aDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3JpZ2h0KSB7XG4gICAgICB0aGlzLl9yaWdodC5jb3B5KHRhcmdldCwgc3RhcnQpO1xuICAgICAgc3RhcnQgKz0gdGhpcy5fcmlnaHQubGVuZ3RoO1xuICAgIH1cblxuICAgIHJldHVybiBzdGFydDtcbiAgfVxufVxuXG5cbi8qKlxuICogQW4gdXRpbGl0eSBjbGFzcyB0aGF0IGFsbG93cyBidWZmZXJzIHRvIGJlIGluc2VydGVkIHRvIHRoZSBfcmlnaHQgb3IgX2xlZnQsIG9yIGRlbGV0ZWQsIHdoaWxlXG4gKiBrZWVwaW5nIGluZGljZXMgdG8gdGhlIG9yaWdpbmFsIGJ1ZmZlci5cbiAqXG4gKiBUaGUgY29uc3RydWN0b3IgdGFrZXMgYW4gb3JpZ2luYWwgYnVmZmVyLCBhbmQga2VlcHMgaXQgaW50byBhIGxpbmtlZCBsaXN0IG9mIGNodW5rcywgc21hbGxlclxuICogYnVmZmVycyB0aGF0IGtlZXAgdHJhY2sgb2YgX2NvbnRlbnQgaW5zZXJ0ZWQgdG8gdGhlIF9yaWdodCBvciBfbGVmdCBvZiBpdC5cbiAqXG4gKiBTaW5jZSB0aGUgTm9kZSBCdWZmZXIgc3RydWN0dXJlIGlzIG5vbi1kZXN0cnVjdGl2ZSB3aGVuIHNsaWNpbmcsIHdlIHRyeSB0byB1c2Ugc2xpY2luZyB0byBjcmVhdGVcbiAqIG5ldyBjaHVua3MsIGFuZCBhbHdheXMga2VlcCBjaHVua3MgcG9pbnRpbmcgdG8gdGhlIG9yaWdpbmFsIGNvbnRlbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBVcGRhdGVCdWZmZXIge1xuICBwcm90ZWN0ZWQgX2xpbmtlZExpc3Q6IExpbmtlZExpc3Q8Q2h1bms+O1xuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBfb3JpZ2luYWxDb250ZW50OiBCdWZmZXIpIHtcbiAgICB0aGlzLl9saW5rZWRMaXN0ID0gbmV3IExpbmtlZExpc3QobmV3IENodW5rKDAsIF9vcmlnaW5hbENvbnRlbnQubGVuZ3RoLCBfb3JpZ2luYWxDb250ZW50KSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX2Fzc2VydEluZGV4KGluZGV4OiBudW1iZXIpIHtcbiAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID4gdGhpcy5fb3JpZ2luYWxDb250ZW50Lmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEluZGV4T3V0T2ZCb3VuZEV4Y2VwdGlvbihpbmRleCwgMCwgdGhpcy5fb3JpZ2luYWxDb250ZW50Lmxlbmd0aCk7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIF9zbGljZShzdGFydDogbnVtYmVyKTogW0NodW5rLCBDaHVua10ge1xuICAgIC8vIElmIHN0YXJ0IGlzIGxvbmdlciB0aGFuIHRoZSBjb250ZW50LCB1c2Ugc3RhcnQsIG90aGVyd2lzZSBkZXRlcm1pbmUgZXhhY3QgcG9zaXRpb24gaW4gc3RyaW5nLlxuICAgIGNvbnN0IGluZGV4ID0gc3RhcnQgPj0gdGhpcy5fb3JpZ2luYWxDb250ZW50Lmxlbmd0aCA/IHN0YXJ0IDogdGhpcy5fZ2V0VGV4dFBvc2l0aW9uKHN0YXJ0KTtcblxuICAgIHRoaXMuX2Fzc2VydEluZGV4KGluZGV4KTtcblxuICAgIC8vIEZpbmQgdGhlIGNodW5rIGJ5IGdvaW5nIHRocm91Z2ggdGhlIGxpc3QuXG4gICAgY29uc3QgaCA9IHRoaXMuX2xpbmtlZExpc3QuZmluZChjaHVuayA9PiBpbmRleCA8PSBjaHVuay5lbmQpO1xuICAgIGlmICghaCkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0NodW5rIGNhbm5vdCBiZSBmb3VuZC4nKTtcbiAgICB9XG5cbiAgICBpZiAoaW5kZXggPT0gaC5lbmQgJiYgaC5uZXh0ICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gW2gsIGgubmV4dF07XG4gICAgfVxuXG4gICAgcmV0dXJuIFtoLCBoLnNsaWNlKGluZGV4KV07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcG9zaXRpb24gaW4gdGhlIGNvbnRlbnQgYmFzZWQgb24gdGhlIHBvc2l0aW9uIGluIHRoZSBzdHJpbmcuXG4gICAqIFNvbWUgY2hhcmFjdGVycyBtaWdodCBiZSB3aWRlciB0aGFuIG9uZSBieXRlLCB0aHVzIHdlIGhhdmUgdG8gZGV0ZXJtaW5lIHRoZSBwb3NpdGlvbiB1c2luZ1xuICAgKiBzdHJpbmcgZnVuY3Rpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9nZXRUZXh0UG9zaXRpb24oaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHRoaXMuX29yaWdpbmFsQ29udGVudC50b1N0cmluZygpLnN1YnN0cmluZygwLCBpbmRleCkpLmxlbmd0aDtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fbGlua2VkTGlzdC5yZWR1Y2UoKGFjYywgY2h1bmspID0+IGFjYyArIGNodW5rLmxlbmd0aCwgMCk7XG4gIH1cbiAgZ2V0IG9yaWdpbmFsKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuX29yaWdpbmFsQ29udGVudDtcbiAgfVxuXG4gIHRvU3RyaW5nKGVuY29kaW5nID0gJ3V0Zi04Jyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX2xpbmtlZExpc3QucmVkdWNlKChhY2MsIGNodW5rKSA9PiBhY2MgKyBjaHVuay50b1N0cmluZyhlbmNvZGluZyksICcnKTtcbiAgfVxuICBnZW5lcmF0ZSgpOiBCdWZmZXIge1xuICAgIGNvbnN0IHJlc3VsdCA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSh0aGlzLmxlbmd0aCk7XG4gICAgbGV0IGkgPSAwO1xuICAgIHRoaXMuX2xpbmtlZExpc3QuZm9yRWFjaChjaHVuayA9PiB7XG4gICAgICBjaHVuay5jb3B5KHJlc3VsdCwgaSk7XG4gICAgICBpICs9IGNodW5rLmxlbmd0aDtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpbnNlcnRMZWZ0KGluZGV4OiBudW1iZXIsIGNvbnRlbnQ6IEJ1ZmZlciwgYXNzZXJ0ID0gZmFsc2UpIHtcbiAgICB0aGlzLl9zbGljZShpbmRleClbMF0uYXBwZW5kKGNvbnRlbnQsIGFzc2VydCk7XG4gIH1cbiAgaW5zZXJ0UmlnaHQoaW5kZXg6IG51bWJlciwgY29udGVudDogQnVmZmVyLCBhc3NlcnQgPSBmYWxzZSkge1xuICAgIHRoaXMuX3NsaWNlKGluZGV4KVsxXS5wcmVwZW5kKGNvbnRlbnQsIGFzc2VydCk7XG4gIH1cblxuICByZW1vdmUoaW5kZXg6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpIHtcbiAgICBjb25zdCBlbmQgPSBpbmRleCArIGxlbmd0aDtcblxuICAgIGNvbnN0IGZpcnN0ID0gdGhpcy5fc2xpY2UoaW5kZXgpWzFdO1xuICAgIGNvbnN0IGxhc3QgPSB0aGlzLl9zbGljZShlbmQpWzFdO1xuXG4gICAgbGV0IGN1cnI6IENodW5rIHwgbnVsbDtcbiAgICBmb3IgKGN1cnIgPSBmaXJzdDsgY3VyciAmJiBjdXJyICE9PSBsYXN0OyBjdXJyID0gY3Vyci5uZXh0KSB7XG4gICAgICBjdXJyLmFzc2VydChjdXJyICE9PSBmaXJzdCwgY3VyciAhPT0gbGFzdCwgY3VyciA9PT0gZmlyc3QpO1xuICAgIH1cbiAgICBmb3IgKGN1cnIgPSBmaXJzdDsgY3VyciAmJiBjdXJyICE9PSBsYXN0OyBjdXJyID0gY3Vyci5uZXh0KSB7XG4gICAgICBjdXJyLnJlbW92ZShjdXJyICE9PSBmaXJzdCwgY3VyciAhPT0gbGFzdCwgY3VyciA9PT0gZmlyc3QpO1xuICAgIH1cblxuICAgIGlmIChjdXJyKSB7XG4gICAgICBjdXJyLnJlbW92ZSh0cnVlLCBmYWxzZSwgZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuIl19