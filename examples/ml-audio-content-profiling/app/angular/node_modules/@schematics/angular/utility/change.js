"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * An operation that does nothing.
 */
class NoopChange {
    constructor() {
        this.description = 'No operation.';
        this.order = Infinity;
        this.path = null;
    }
    apply() { return Promise.resolve(); }
}
exports.NoopChange = NoopChange;
/**
 * Will add text to the source code.
 */
class InsertChange {
    constructor(path, pos, toAdd) {
        this.path = path;
        this.pos = pos;
        this.toAdd = toAdd;
        if (pos < 0) {
            throw new Error('Negative positions are invalid');
        }
        this.description = `Inserted ${toAdd} into position ${pos} of ${path}`;
        this.order = pos;
    }
    /**
     * This method does not insert spaces if there is none in the original string.
     */
    apply(host) {
        return host.read(this.path).then(content => {
            const prefix = content.substring(0, this.pos);
            const suffix = content.substring(this.pos);
            return host.write(this.path, `${prefix}${this.toAdd}${suffix}`);
        });
    }
}
exports.InsertChange = InsertChange;
/**
 * Will remove text from the source code.
 */
class RemoveChange {
    constructor(path, pos, toRemove) {
        this.path = path;
        this.pos = pos;
        this.toRemove = toRemove;
        if (pos < 0) {
            throw new Error('Negative positions are invalid');
        }
        this.description = `Removed ${toRemove} into position ${pos} of ${path}`;
        this.order = pos;
    }
    apply(host) {
        return host.read(this.path).then(content => {
            const prefix = content.substring(0, this.pos);
            const suffix = content.substring(this.pos + this.toRemove.length);
            // TODO: throw error if toRemove doesn't match removed string.
            return host.write(this.path, `${prefix}${suffix}`);
        });
    }
}
exports.RemoveChange = RemoveChange;
/**
 * Will replace text from the source code.
 */
class ReplaceChange {
    constructor(path, pos, oldText, newText) {
        this.path = path;
        this.pos = pos;
        this.oldText = oldText;
        this.newText = newText;
        if (pos < 0) {
            throw new Error('Negative positions are invalid');
        }
        this.description = `Replaced ${oldText} into position ${pos} of ${path} with ${newText}`;
        this.order = pos;
    }
    apply(host) {
        return host.read(this.path).then(content => {
            const prefix = content.substring(0, this.pos);
            const suffix = content.substring(this.pos + this.oldText.length);
            const text = content.substring(this.pos, this.pos + this.oldText.length);
            if (text !== this.oldText) {
                return Promise.reject(new Error(`Invalid replace: "${text}" != "${this.oldText}".`));
            }
            // TODO: throw error if oldText doesn't match removed string.
            return host.write(this.path, `${prefix}${this.newText}${suffix}`);
        });
    }
}
exports.ReplaceChange = ReplaceChange;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvdXRpbGl0eS9jaGFuZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUE2QkE7O0dBRUc7QUFDSCxNQUFhLFVBQVU7SUFBdkI7UUFDRSxnQkFBVyxHQUFHLGVBQWUsQ0FBQztRQUM5QixVQUFLLEdBQUcsUUFBUSxDQUFDO1FBQ2pCLFNBQUksR0FBRyxJQUFJLENBQUM7SUFFZCxDQUFDO0lBREMsS0FBSyxLQUFLLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztDQUN0QztBQUxELGdDQUtDO0FBR0Q7O0dBRUc7QUFDSCxNQUFhLFlBQVk7SUFLdkIsWUFBbUIsSUFBWSxFQUFTLEdBQVcsRUFBUyxLQUFhO1FBQXRELFNBQUksR0FBSixJQUFJLENBQVE7UUFBUyxRQUFHLEdBQUgsR0FBRyxDQUFRO1FBQVMsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUN2RSxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUU7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7U0FDbkQ7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLFlBQVksS0FBSyxrQkFBa0IsR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO1FBQ3ZFLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxJQUFVO1FBQ2QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDekMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRTNDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNsRSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXhCRCxvQ0F3QkM7QUFFRDs7R0FFRztBQUNILE1BQWEsWUFBWTtJQUt2QixZQUFtQixJQUFZLEVBQVUsR0FBVyxFQUFVLFFBQWdCO1FBQTNELFNBQUksR0FBSixJQUFJLENBQVE7UUFBVSxRQUFHLEdBQUgsR0FBRyxDQUFRO1FBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBUTtRQUM1RSxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUU7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7U0FDbkQ7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsUUFBUSxrQkFBa0IsR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO1FBQ3pFLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO0lBQ25CLENBQUM7SUFFRCxLQUFLLENBQUMsSUFBVTtRQUNkLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3pDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5QyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVsRSw4REFBOEQ7WUFDOUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxNQUFNLEdBQUcsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXRCRCxvQ0FzQkM7QUFFRDs7R0FFRztBQUNILE1BQWEsYUFBYTtJQUl4QixZQUFtQixJQUFZLEVBQVUsR0FBVyxFQUFVLE9BQWUsRUFDekQsT0FBZTtRQURoQixTQUFJLEdBQUosSUFBSSxDQUFRO1FBQVUsUUFBRyxHQUFILEdBQUcsQ0FBUTtRQUFVLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDekQsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNqQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUU7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7U0FDbkQ7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLFlBQVksT0FBTyxrQkFBa0IsR0FBRyxPQUFPLElBQUksU0FBUyxPQUFPLEVBQUUsQ0FBQztRQUN6RixJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQVU7UUFDZCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUN6QyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDOUMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakUsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUV6RSxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUN6QixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMscUJBQXFCLElBQUksU0FBUyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ3RGO1lBRUQsNkRBQTZEO1lBQzdELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNwRSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTNCRCxzQ0EyQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEhvc3Qge1xuICB3cml0ZShwYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG4gIHJlYWQocGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+O1xufVxuXG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhbmdlIHtcbiAgYXBwbHkoaG9zdDogSG9zdCk6IFByb21pc2U8dm9pZD47XG5cbiAgLy8gVGhlIGZpbGUgdGhpcyBjaGFuZ2Ugc2hvdWxkIGJlIGFwcGxpZWQgdG8uIFNvbWUgY2hhbmdlcyBtaWdodCBub3QgYXBwbHkgdG9cbiAgLy8gYSBmaWxlIChtYXliZSB0aGUgY29uZmlnKS5cbiAgcmVhZG9ubHkgcGF0aDogc3RyaW5nIHwgbnVsbDtcblxuICAvLyBUaGUgb3JkZXIgdGhpcyBjaGFuZ2Ugc2hvdWxkIGJlIGFwcGxpZWQuIE5vcm1hbGx5IHRoZSBwb3NpdGlvbiBpbnNpZGUgdGhlIGZpbGUuXG4gIC8vIENoYW5nZXMgYXJlIGFwcGxpZWQgZnJvbSB0aGUgYm90dG9tIG9mIGEgZmlsZSB0byB0aGUgdG9wLlxuICByZWFkb25seSBvcmRlcjogbnVtYmVyO1xuXG4gIC8vIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGlzIGNoYW5nZS4gVGhpcyB3aWxsIGJlIG91dHB1dHRlZCBpbiBhIGRyeSBvciB2ZXJib3NlIHJ1bi5cbiAgcmVhZG9ubHkgZGVzY3JpcHRpb246IHN0cmluZztcbn1cblxuXG4vKipcbiAqIEFuIG9wZXJhdGlvbiB0aGF0IGRvZXMgbm90aGluZy5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vb3BDaGFuZ2UgaW1wbGVtZW50cyBDaGFuZ2Uge1xuICBkZXNjcmlwdGlvbiA9ICdObyBvcGVyYXRpb24uJztcbiAgb3JkZXIgPSBJbmZpbml0eTtcbiAgcGF0aCA9IG51bGw7XG4gIGFwcGx5KCkgeyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7IH1cbn1cblxuXG4vKipcbiAqIFdpbGwgYWRkIHRleHQgdG8gdGhlIHNvdXJjZSBjb2RlLlxuICovXG5leHBvcnQgY2xhc3MgSW5zZXJ0Q2hhbmdlIGltcGxlbWVudHMgQ2hhbmdlIHtcblxuICBvcmRlcjogbnVtYmVyO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXRoOiBzdHJpbmcsIHB1YmxpYyBwb3M6IG51bWJlciwgcHVibGljIHRvQWRkOiBzdHJpbmcpIHtcbiAgICBpZiAocG9zIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOZWdhdGl2ZSBwb3NpdGlvbnMgYXJlIGludmFsaWQnKTtcbiAgICB9XG4gICAgdGhpcy5kZXNjcmlwdGlvbiA9IGBJbnNlcnRlZCAke3RvQWRkfSBpbnRvIHBvc2l0aW9uICR7cG9zfSBvZiAke3BhdGh9YDtcbiAgICB0aGlzLm9yZGVyID0gcG9zO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGRvZXMgbm90IGluc2VydCBzcGFjZXMgaWYgdGhlcmUgaXMgbm9uZSBpbiB0aGUgb3JpZ2luYWwgc3RyaW5nLlxuICAgKi9cbiAgYXBwbHkoaG9zdDogSG9zdCkge1xuICAgIHJldHVybiBob3N0LnJlYWQodGhpcy5wYXRoKS50aGVuKGNvbnRlbnQgPT4ge1xuICAgICAgY29uc3QgcHJlZml4ID0gY29udGVudC5zdWJzdHJpbmcoMCwgdGhpcy5wb3MpO1xuICAgICAgY29uc3Qgc3VmZml4ID0gY29udGVudC5zdWJzdHJpbmcodGhpcy5wb3MpO1xuXG4gICAgICByZXR1cm4gaG9zdC53cml0ZSh0aGlzLnBhdGgsIGAke3ByZWZpeH0ke3RoaXMudG9BZGR9JHtzdWZmaXh9YCk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBXaWxsIHJlbW92ZSB0ZXh0IGZyb20gdGhlIHNvdXJjZSBjb2RlLlxuICovXG5leHBvcnQgY2xhc3MgUmVtb3ZlQ2hhbmdlIGltcGxlbWVudHMgQ2hhbmdlIHtcblxuICBvcmRlcjogbnVtYmVyO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXRoOiBzdHJpbmcsIHByaXZhdGUgcG9zOiBudW1iZXIsIHByaXZhdGUgdG9SZW1vdmU6IHN0cmluZykge1xuICAgIGlmIChwb3MgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05lZ2F0aXZlIHBvc2l0aW9ucyBhcmUgaW52YWxpZCcpO1xuICAgIH1cbiAgICB0aGlzLmRlc2NyaXB0aW9uID0gYFJlbW92ZWQgJHt0b1JlbW92ZX0gaW50byBwb3NpdGlvbiAke3Bvc30gb2YgJHtwYXRofWA7XG4gICAgdGhpcy5vcmRlciA9IHBvcztcbiAgfVxuXG4gIGFwcGx5KGhvc3Q6IEhvc3QpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gaG9zdC5yZWFkKHRoaXMucGF0aCkudGhlbihjb250ZW50ID0+IHtcbiAgICAgIGNvbnN0IHByZWZpeCA9IGNvbnRlbnQuc3Vic3RyaW5nKDAsIHRoaXMucG9zKTtcbiAgICAgIGNvbnN0IHN1ZmZpeCA9IGNvbnRlbnQuc3Vic3RyaW5nKHRoaXMucG9zICsgdGhpcy50b1JlbW92ZS5sZW5ndGgpO1xuXG4gICAgICAvLyBUT0RPOiB0aHJvdyBlcnJvciBpZiB0b1JlbW92ZSBkb2Vzbid0IG1hdGNoIHJlbW92ZWQgc3RyaW5nLlxuICAgICAgcmV0dXJuIGhvc3Qud3JpdGUodGhpcy5wYXRoLCBgJHtwcmVmaXh9JHtzdWZmaXh9YCk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBXaWxsIHJlcGxhY2UgdGV4dCBmcm9tIHRoZSBzb3VyY2UgY29kZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlcGxhY2VDaGFuZ2UgaW1wbGVtZW50cyBDaGFuZ2Uge1xuICBvcmRlcjogbnVtYmVyO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXRoOiBzdHJpbmcsIHByaXZhdGUgcG9zOiBudW1iZXIsIHByaXZhdGUgb2xkVGV4dDogc3RyaW5nLFxuICAgICAgICAgICAgICBwcml2YXRlIG5ld1RleHQ6IHN0cmluZykge1xuICAgIGlmIChwb3MgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05lZ2F0aXZlIHBvc2l0aW9ucyBhcmUgaW52YWxpZCcpO1xuICAgIH1cbiAgICB0aGlzLmRlc2NyaXB0aW9uID0gYFJlcGxhY2VkICR7b2xkVGV4dH0gaW50byBwb3NpdGlvbiAke3Bvc30gb2YgJHtwYXRofSB3aXRoICR7bmV3VGV4dH1gO1xuICAgIHRoaXMub3JkZXIgPSBwb3M7XG4gIH1cblxuICBhcHBseShob3N0OiBIb3N0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGhvc3QucmVhZCh0aGlzLnBhdGgpLnRoZW4oY29udGVudCA9PiB7XG4gICAgICBjb25zdCBwcmVmaXggPSBjb250ZW50LnN1YnN0cmluZygwLCB0aGlzLnBvcyk7XG4gICAgICBjb25zdCBzdWZmaXggPSBjb250ZW50LnN1YnN0cmluZyh0aGlzLnBvcyArIHRoaXMub2xkVGV4dC5sZW5ndGgpO1xuICAgICAgY29uc3QgdGV4dCA9IGNvbnRlbnQuc3Vic3RyaW5nKHRoaXMucG9zLCB0aGlzLnBvcyArIHRoaXMub2xkVGV4dC5sZW5ndGgpO1xuXG4gICAgICBpZiAodGV4dCAhPT0gdGhpcy5vbGRUZXh0KSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYEludmFsaWQgcmVwbGFjZTogXCIke3RleHR9XCIgIT0gXCIke3RoaXMub2xkVGV4dH1cIi5gKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IHRocm93IGVycm9yIGlmIG9sZFRleHQgZG9lc24ndCBtYXRjaCByZW1vdmVkIHN0cmluZy5cbiAgICAgIHJldHVybiBob3N0LndyaXRlKHRoaXMucGF0aCwgYCR7cHJlZml4fSR7dGhpcy5uZXdUZXh0fSR7c3VmZml4fWApO1xuICAgIH0pO1xuICB9XG59XG4iXX0=