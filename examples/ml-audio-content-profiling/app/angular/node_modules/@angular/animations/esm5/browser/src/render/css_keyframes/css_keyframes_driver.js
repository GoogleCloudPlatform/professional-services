import { allowPreviousPlayerStylesMerge, balancePreviousStylesIntoKeyframes } from '../../util';
import { containsElement, hypenatePropsObject, invokeQuery, matchesElement, validateStyleProperty } from '../shared';
import { CssKeyframesPlayer } from './css_keyframes_player';
import { DirectStylePlayer } from './direct_style_player';
var KEYFRAMES_NAME_PREFIX = 'gen_css_kf_';
var TAB_SPACE = ' ';
var CssKeyframesDriver = /** @class */ (function () {
    function CssKeyframesDriver() {
        this._count = 0;
        this._head = document.querySelector('head');
        this._warningIssued = false;
    }
    CssKeyframesDriver.prototype.validateStyleProperty = function (prop) { return validateStyleProperty(prop); };
    CssKeyframesDriver.prototype.matchesElement = function (element, selector) {
        return matchesElement(element, selector);
    };
    CssKeyframesDriver.prototype.containsElement = function (elm1, elm2) { return containsElement(elm1, elm2); };
    CssKeyframesDriver.prototype.query = function (element, selector, multi) {
        return invokeQuery(element, selector, multi);
    };
    CssKeyframesDriver.prototype.computeStyle = function (element, prop, defaultValue) {
        return window.getComputedStyle(element)[prop];
    };
    CssKeyframesDriver.prototype.buildKeyframeElement = function (element, name, keyframes) {
        keyframes = keyframes.map(function (kf) { return hypenatePropsObject(kf); });
        var keyframeStr = "@keyframes " + name + " {\n";
        var tab = '';
        keyframes.forEach(function (kf) {
            tab = TAB_SPACE;
            var offset = parseFloat(kf.offset);
            keyframeStr += "" + tab + offset * 100 + "% {\n";
            tab += TAB_SPACE;
            Object.keys(kf).forEach(function (prop) {
                var value = kf[prop];
                switch (prop) {
                    case 'offset':
                        return;
                    case 'easing':
                        if (value) {
                            keyframeStr += tab + "animation-timing-function: " + value + ";\n";
                        }
                        return;
                    default:
                        keyframeStr += "" + tab + prop + ": " + value + ";\n";
                        return;
                }
            });
            keyframeStr += tab + "}\n";
        });
        keyframeStr += "}\n";
        var kfElm = document.createElement('style');
        kfElm.innerHTML = keyframeStr;
        return kfElm;
    };
    CssKeyframesDriver.prototype.animate = function (element, keyframes, duration, delay, easing, previousPlayers, scrubberAccessRequested) {
        if (previousPlayers === void 0) { previousPlayers = []; }
        if (scrubberAccessRequested) {
            this._notifyFaultyScrubber();
        }
        var previousCssKeyframePlayers = previousPlayers.filter(function (player) { return player instanceof CssKeyframesPlayer; });
        var previousStyles = {};
        if (allowPreviousPlayerStylesMerge(duration, delay)) {
            previousCssKeyframePlayers.forEach(function (player) {
                var styles = player.currentSnapshot;
                Object.keys(styles).forEach(function (prop) { return previousStyles[prop] = styles[prop]; });
            });
        }
        keyframes = balancePreviousStylesIntoKeyframes(element, keyframes, previousStyles);
        var finalStyles = flattenKeyframesIntoStyles(keyframes);
        // if there is no animation then there is no point in applying
        // styles and waiting for an event to get fired. This causes lag.
        // It's better to just directly apply the styles to the element
        // via the direct styling animation player.
        if (duration == 0) {
            return new DirectStylePlayer(element, finalStyles);
        }
        var animationName = "" + KEYFRAMES_NAME_PREFIX + this._count++;
        var kfElm = this.buildKeyframeElement(element, animationName, keyframes);
        document.querySelector('head').appendChild(kfElm);
        var player = new CssKeyframesPlayer(element, keyframes, animationName, duration, delay, easing, finalStyles);
        player.onDestroy(function () { return removeElement(kfElm); });
        return player;
    };
    CssKeyframesDriver.prototype._notifyFaultyScrubber = function () {
        if (!this._warningIssued) {
            console.warn('@angular/animations: please load the web-animations.js polyfill to allow programmatic access...\n', '  visit http://bit.ly/IWukam to learn more about using the web-animation-js polyfill.');
            this._warningIssued = true;
        }
    };
    return CssKeyframesDriver;
}());
export { CssKeyframesDriver };
function flattenKeyframesIntoStyles(keyframes) {
    var flatKeyframes = {};
    if (keyframes) {
        var kfs = Array.isArray(keyframes) ? keyframes : [keyframes];
        kfs.forEach(function (kf) {
            Object.keys(kf).forEach(function (prop) {
                if (prop == 'offset' || prop == 'easing')
                    return;
                flatKeyframes[prop] = kf[prop];
            });
        });
    }
    return flatKeyframes;
}
function removeElement(node) {
    node.parentNode.removeChild(node);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzX2tleWZyYW1lc19kcml2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmltYXRpb25zL2Jyb3dzZXIvc3JjL3JlbmRlci9jc3Nfa2V5ZnJhbWVzL2Nzc19rZXlmcmFtZXNfZHJpdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNBLE9BQU8sRUFBQyw4QkFBOEIsRUFBRSxrQ0FBa0MsRUFBZSxNQUFNLFlBQVksQ0FBQztBQUU1RyxPQUFPLEVBQUMsZUFBZSxFQUFFLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFbkgsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFeEQsSUFBTSxxQkFBcUIsR0FBRyxhQUFhLENBQUM7QUFDNUMsSUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDO0FBRXRCO0lBQUE7UUFDVSxXQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ0YsVUFBSyxHQUFRLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckQsbUJBQWMsR0FBRyxLQUFLLENBQUM7SUFvR2pDLENBQUM7SUFsR0Msa0RBQXFCLEdBQXJCLFVBQXNCLElBQVksSUFBYSxPQUFPLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVwRiwyQ0FBYyxHQUFkLFVBQWUsT0FBWSxFQUFFLFFBQWdCO1FBQzNDLE9BQU8sY0FBYyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsNENBQWUsR0FBZixVQUFnQixJQUFTLEVBQUUsSUFBUyxJQUFhLE9BQU8sZUFBZSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFF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UywwQkFBMEIsQ0FDL0IsU0FBK0Q7SUFDakUsSUFBSSxhQUFhLEdBQXlCLEVBQUUsQ0FBQztJQUM3QyxJQUFJLFNBQVMsRUFBRTtRQUNiLElBQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvRCxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQUEsRUFBRTtZQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSTtnQkFDMUIsSUFBSSxJQUFJLElBQUksUUFBUSxJQUFJLElBQUksSUFBSSxRQUFRO29CQUFFLE9BQU87Z0JBQ2pELGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztLQUNKO0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLElBQVM7SUFDOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7QW5pbWF0aW9uUGxheWVyLCDJtVN0eWxlRGF0YX0gZnJvbSAnQGFuZ3VsYXIvYW5pbWF0aW9ucyc7XG5cbmltcG9ydCB7YWxsb3dQcmV2aW91c1BsYXllclN0eWxlc01lcmdlLCBiYWxhbmNlUHJldmlvdXNTdHlsZXNJbnRvS2V5ZnJhbWVzLCBjb21wdXRlU3R5bGV9IGZyb20gJy4uLy4uL3V0aWwnO1xuaW1wb3J0IHtBbmltYXRpb25Ecml2ZXJ9IGZyb20gJy4uL2FuaW1hdGlvbl9kcml2ZXInO1xuaW1wb3J0IHtjb250YWluc0VsZW1lbnQsIGh5cGVuYXRlUHJvcHNPYmplY3QsIGludm9rZVF1ZXJ5LCBtYXRjaGVzRWxlbWVudCwgdmFsaWRhdGVTdHlsZVByb3BlcnR5fSBmcm9tICcuLi9zaGFyZWQnO1xuXG5pbXBvcnQge0Nzc0tleWZyYW1lc1BsYXllcn0gZnJvbSAnLi9jc3Nfa2V5ZnJhbWVzX3BsYXllcic7XG5pbXBvcnQge0RpcmVjdFN0eWxlUGxheWVyfSBmcm9tICcuL2RpcmVjdF9zdHlsZV9wbGF5ZXInO1xuXG5jb25zdCBLRVlGUkFNRVNfTkFNRV9QUkVGSVggPSAnZ2VuX2Nzc19rZl8nO1xuY29uc3QgVEFCX1NQQUNFID0gJyAnO1xuXG5leHBvcnQgY2xhc3MgQ3NzS2V5ZnJhbWVzRHJpdmVyIGltcGxlbWVudHMgQW5pbWF0aW9uRHJpdmVyIHtcbiAgcHJpdmF0ZSBfY291bnQgPSAwO1xuICBwcml2YXRlIHJlYWRvbmx5IF9oZWFkOiBhbnkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdoZWFkJyk7XG4gIHByaXZhdGUgX3dhcm5pbmdJc3N1ZWQgPSBmYWxzZTtcblxuICB2YWxpZGF0ZVN0eWxlUHJvcGVydHkocHJvcDogc3RyaW5nKTogYm9vbGVhbiB7IHJldHVybiB2YWxpZGF0ZVN0eWxlUHJvcGVydHkocHJvcCk7IH1cblxuICBtYXRjaGVzRWxlbWVudChlbGVtZW50OiBhbnksIHNlbGVjdG9yOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gbWF0Y2hlc0VsZW1lbnQoZWxlbWVudCwgc2VsZWN0b3IpO1xuICB9XG5cbiAgY29udGFpbnNFbGVtZW50KGVsbTE6IGFueSwgZWxtMjogYW55KTogYm9vbGVhbiB7IHJldHVybiBjb250YWluc0VsZW1lbnQoZWxtMSwgZWxtMik7IH1cblxuICBxdWVyeShlbGVtZW50OiBhbnksIHNlbGVjdG9yOiBzdHJpbmcsIG11bHRpOiBib29sZWFuKTogYW55W10ge1xuICAgIHJldHVybiBpbnZva2VRdWVyeShlbGVtZW50LCBzZWxlY3RvciwgbXVsdGkpO1xuICB9XG5cbiAgY29tcHV0ZVN0eWxlKGVsZW1lbnQ6IGFueSwgcHJvcDogc3RyaW5nLCBkZWZhdWx0VmFsdWU/OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiAod2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkgYXMgYW55KVtwcm9wXSBhcyBzdHJpbmc7XG4gIH1cblxuICBidWlsZEtleWZyYW1lRWxlbWVudChlbGVtZW50OiBhbnksIG5hbWU6IHN0cmluZywga2V5ZnJhbWVzOiB7W2tleTogc3RyaW5nXTogYW55fVtdKTogYW55IHtcbiAgICBrZXlmcmFtZXMgPSBrZXlmcmFtZXMubWFwKGtmID0+IGh5cGVuYXRlUHJvcHNPYmplY3Qoa2YpKTtcbiAgICBsZXQga2V5ZnJhbWVTdHIgPSBgQGtleWZyYW1lcyAke25hbWV9IHtcXG5gO1xuICAgIGxldCB0YWIgPSAnJztcbiAgICBrZXlmcmFtZXMuZm9yRWFjaChrZiA9PiB7XG4gICAgICB0YWIgPSBUQUJfU1BBQ0U7XG4gICAgICBjb25zdCBvZmZzZXQgPSBwYXJzZUZsb2F0KGtmLm9mZnNldCk7XG4gICAgICBrZXlmcmFtZVN0ciArPSBgJHt0YWJ9JHtvZmZzZXQgKiAxMDB9JSB7XFxuYDtcbiAgICAgIHRhYiArPSBUQUJfU1BBQ0U7XG4gICAgICBPYmplY3Qua2V5cyhrZikuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBrZltwcm9wXTtcbiAgICAgICAgc3dpdGNoIChwcm9wKSB7XG4gICAgICAgICAgY2FzZSAnb2Zmc2V0JzpcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICBjYXNlICdlYXNpbmcnOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgIGtleWZyYW1lU3RyICs9IGAke3RhYn1hbmltYXRpb24tdGltaW5nLWZ1bmN0aW9uOiAke3ZhbHVlfTtcXG5gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBrZXlmcmFtZVN0ciArPSBgJHt0YWJ9JHtwcm9wfTogJHt2YWx1ZX07XFxuYDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBrZXlmcmFtZVN0ciArPSBgJHt0YWJ9fVxcbmA7XG4gICAgfSk7XG4gICAga2V5ZnJhbWVTdHIgKz0gYH1cXG5gO1xuXG4gICAgY29uc3Qga2ZFbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIGtmRWxtLmlubmVySFRNTCA9IGtleWZyYW1lU3RyO1xuICAgIHJldHVybiBrZkVsbTtcbiAgfVxuXG4gIGFuaW1hdGUoXG4gICAgICBlbGVtZW50OiBhbnksIGtleWZyYW1lczogybVTdHlsZURhdGFbXSwgZHVyYXRpb246IG51bWJlciwgZGVsYXk6IG51bWJlciwgZWFzaW5nOiBzdHJpbmcsXG4gICAgICBwcmV2aW91c1BsYXllcnM6IEFuaW1hdGlvblBsYXllcltdID0gW10sIHNjcnViYmVyQWNjZXNzUmVxdWVzdGVkPzogYm9vbGVhbik6IEFuaW1hdGlvblBsYXllciB7XG4gICAgaWYgKHNjcnViYmVyQWNjZXNzUmVxdWVzdGVkKSB7XG4gICAgICB0aGlzLl9ub3RpZnlGYXVsdHlTY3J1YmJlcigpO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZpb3VzQ3NzS2V5ZnJhbWVQbGF5ZXJzID0gPENzc0tleWZyYW1lc1BsYXllcltdPnByZXZpb3VzUGxheWVycy5maWx0ZXIoXG4gICAgICAgIHBsYXllciA9PiBwbGF5ZXIgaW5zdGFuY2VvZiBDc3NLZXlmcmFtZXNQbGF5ZXIpO1xuXG4gICAgY29uc3QgcHJldmlvdXNTdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG5cbiAgICBpZiAoYWxsb3dQcmV2aW91c1BsYXllclN0eWxlc01lcmdlKGR1cmF0aW9uLCBkZWxheSkpIHtcbiAgICAgIHByZXZpb3VzQ3NzS2V5ZnJhbWVQbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgbGV0IHN0eWxlcyA9IHBsYXllci5jdXJyZW50U25hcHNob3Q7XG4gICAgICAgIE9iamVjdC5rZXlzKHN0eWxlcykuZm9yRWFjaChwcm9wID0+IHByZXZpb3VzU3R5bGVzW3Byb3BdID0gc3R5bGVzW3Byb3BdKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGtleWZyYW1lcyA9IGJhbGFuY2VQcmV2aW91c1N0eWxlc0ludG9LZXlmcmFtZXMoZWxlbWVudCwga2V5ZnJhbWVzLCBwcmV2aW91c1N0eWxlcyk7XG4gICAgY29uc3QgZmluYWxTdHlsZXMgPSBmbGF0dGVuS2V5ZnJhbWVzSW50b1N0eWxlcyhrZXlmcmFtZXMpO1xuXG4gICAgLy8gaWYgdGhlcmUgaXMgbm8gYW5pbWF0aW9uIHRoZW4gdGhlcmUgaXMgbm8gcG9pbnQgaW4gYXBwbHlpbmdcbiAgICAvLyBzdHlsZXMgYW5kIHdhaXRpbmcgZm9yIGFuIGV2ZW50IHRvIGdldCBmaXJlZC4gVGhpcyBjYXVzZXMgbGFnLlxuICAgIC8vIEl0J3MgYmV0dGVyIHRvIGp1c3QgZGlyZWN0bHkgYXBwbHkgdGhlIHN0eWxlcyB0byB0aGUgZWxlbWVudFxuICAgIC8vIHZpYSB0aGUgZGlyZWN0IHN0eWxpbmcgYW5pbWF0aW9uIHBsYXllci5cbiAgICBpZiAoZHVyYXRpb24gPT0gMCkge1xuICAgICAgcmV0dXJuIG5ldyBEaXJlY3RTdHlsZVBsYXllcihlbGVtZW50LCBmaW5hbFN0eWxlcyk7XG4gICAgfVxuXG4gICAgY29uc3QgYW5pbWF0aW9uTmFtZSA9IGAke0tFWUZSQU1FU19OQU1FX1BSRUZJWH0ke3RoaXMuX2NvdW50Kyt9YDtcbiAgICBjb25zdCBrZkVsbSA9IHRoaXMuYnVpbGRLZXlmcmFtZUVsZW1lbnQoZWxlbWVudCwgYW5pbWF0aW9uTmFtZSwga2V5ZnJhbWVzKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdoZWFkJykgIS5hcHBlbmRDaGlsZChrZkVsbSk7XG5cbiAgICBjb25zdCBwbGF5ZXIgPSBuZXcgQ3NzS2V5ZnJhbWVzUGxheWVyKFxuICAgICAgICBlbGVtZW50LCBrZXlmcmFtZXMsIGFuaW1hdGlvbk5hbWUsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBmaW5hbFN0eWxlcyk7XG5cbiAgICBwbGF5ZXIub25EZXN0cm95KCgpID0+IHJlbW92ZUVsZW1lbnQoa2ZFbG0pKTtcbiAgICByZXR1cm4gcGxheWVyO1xuICB9XG5cbiAgcHJpdmF0ZSBfbm90aWZ5RmF1bHR5U2NydWJiZXIoKSB7XG4gICAgaWYgKCF0aGlzLl93YXJuaW5nSXNzdWVkKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgJ0Bhbmd1bGFyL2FuaW1hdGlvbnM6IHBsZWFzZSBsb2FkIHRoZSB3ZWItYW5pbWF0aW9ucy5qcyBwb2x5ZmlsbCB0byBhbGxvdyBwcm9ncmFtbWF0aWMgYWNjZXNzLi4uXFxuJyxcbiAgICAgICAgICAnICB2aXNpdCBodHRwOi8vYml0Lmx5L0lXdWthbSB0byBsZWFybiBtb3JlIGFib3V0IHVzaW5nIHRoZSB3ZWItYW5pbWF0aW9uLWpzIHBvbHlmaWxsLicpO1xuICAgICAgdGhpcy5fd2FybmluZ0lzc3VlZCA9IHRydWU7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW5LZXlmcmFtZXNJbnRvU3R5bGVzKFxuICAgIGtleWZyYW1lczogbnVsbCB8IHtba2V5OiBzdHJpbmddOiBhbnl9IHwge1trZXk6IHN0cmluZ106IGFueX1bXSk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgbGV0IGZsYXRLZXlmcmFtZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIGlmIChrZXlmcmFtZXMpIHtcbiAgICBjb25zdCBrZnMgPSBBcnJheS5pc0FycmF5KGtleWZyYW1lcykgPyBrZXlmcmFtZXMgOiBba2V5ZnJhbWVzXTtcbiAgICBrZnMuZm9yRWFjaChrZiA9PiB7XG4gICAgICBPYmplY3Qua2V5cyhrZikuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgICAgaWYgKHByb3AgPT0gJ29mZnNldCcgfHwgcHJvcCA9PSAnZWFzaW5nJykgcmV0dXJuO1xuICAgICAgICBmbGF0S2V5ZnJhbWVzW3Byb3BdID0ga2ZbcHJvcF07XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gZmxhdEtleWZyYW1lcztcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRWxlbWVudChub2RlOiBhbnkpIHtcbiAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xufVxuIl19