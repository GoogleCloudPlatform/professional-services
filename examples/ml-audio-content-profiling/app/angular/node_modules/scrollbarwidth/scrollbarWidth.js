/*! scrollbarWidth.js v0.1.3 | felixexter | MIT | https://github.com/felixexter/scrollbarWidth */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		(root.jQuery || root).scrollbarWidth = factory();
	}
}(this, function () {
	'use strict';

	function scrollbarWidth() {
		if (typeof document === 'undefined') {
			return 0
		}

		var
			body = document.body,
			box = document.createElement('div'),
			boxStyle = box.style,
			width;

		boxStyle.position = 'absolute';
		boxStyle.top = boxStyle.left = '-9999px';
		boxStyle.width = boxStyle.height = '100px';
		boxStyle.overflow = 'scroll';

		body.appendChild(box);

		width = box.offsetWidth - box.clientWidth;

		body.removeChild(box);

		return width;
	}

	return scrollbarWidth;
}));
