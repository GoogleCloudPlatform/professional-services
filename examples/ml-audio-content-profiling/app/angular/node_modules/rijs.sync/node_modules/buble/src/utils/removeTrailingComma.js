export default function removeTrailingComma(code, c) {
	while (code.original[c] !== ')') {
		if (code.original[c] === ',') {
			code.remove(c, c + 1);
			return;
		}

		c += 1;
	}
}