import Node from '../Node.js';
import CompileError from '../../utils/CompileError.js';

export default class ObjectExpression extends Node {
	transpile(code, transforms) {
		super.transpile(code, transforms);

		let firstPropertyStart = this.start + 1;
		let regularPropertyCount = 0;
		let spreadPropertyCount = 0;
		let computedPropertyCount = 0;
		let firstSpreadProperty = null;
		let firstComputedProperty = null;

		for (let i = 0; i < this.properties.length; ++i) {
			const prop = this.properties[i];
			if (prop.type === 'SpreadElement') {
				spreadPropertyCount += 1;
				if (firstSpreadProperty === null) firstSpreadProperty = i;
			} else if (prop.computed) {
				computedPropertyCount += 1;
				if (firstComputedProperty === null) firstComputedProperty = i;
			} else if (prop.type === 'Property') {
				regularPropertyCount += 1;
			}
		}

		if (spreadPropertyCount) {
			if (!this.program.options.objectAssign) {
				throw new CompileError(
					"Object spread operator requires specified objectAssign option with 'Object.assign' or polyfill helper.",
					this
				);
			}
			// enclose run of non-spread properties in curlies
			let i = this.properties.length;
			if (regularPropertyCount && !computedPropertyCount) {
				while (i--) {
					const prop = this.properties[i];

					if (prop.type === 'Property' && !prop.computed) {
						const lastProp = this.properties[i - 1];
						const nextProp = this.properties[i + 1];

						if (
							!lastProp ||
							lastProp.type !== 'Property' ||
							lastProp.computed
						) {
							code.prependRight(prop.start, '{');
						}

						if (
							!nextProp ||
							nextProp.type !== 'Property' ||
							nextProp.computed
						) {
							code.appendLeft(prop.end, '}');
						}
					}
				}
			}

			// wrap the whole thing in Object.assign
			firstPropertyStart = this.properties[0].start;
			if (!computedPropertyCount) {
				code.overwrite(
					this.start,
					firstPropertyStart,
					`${this.program.options.objectAssign}({}, `
				);
				code.overwrite(
					this.properties[this.properties.length - 1].end,
					this.end,
					')'
				);
			} else if (this.properties[0].type === 'SpreadElement') {
				code.overwrite(
					this.start,
					firstPropertyStart,
					`${this.program.options.objectAssign}({}, `
				);
				code.remove(this.end - 1, this.end);
				code.appendRight(this.end, ')');
			} else {
				code.prependLeft(this.start, `${this.program.options.objectAssign}(`);
				code.appendRight(this.end, ')');
			}
		}

		if (computedPropertyCount && transforms.computedProperty) {
			const i0 = this.getIndentation();

			let isSimpleAssignment;
			let name;

			if (
				this.parent.type === 'VariableDeclarator' &&
				this.parent.parent.declarations.length === 1 &&
				this.parent.id.type === 'Identifier'
			) {
				isSimpleAssignment = true;
				name = this.parent.id.alias || this.parent.id.name; // TODO is this right?
			} else if (
				this.parent.type === 'AssignmentExpression' &&
				this.parent.parent.type === 'ExpressionStatement' &&
				this.parent.left.type === 'Identifier'
			) {
				isSimpleAssignment = true;
				name = this.parent.left.alias || this.parent.left.name; // TODO is this right?
			} else if (
				this.parent.type === 'AssignmentPattern' &&
				this.parent.left.type === 'Identifier'
			) {
				isSimpleAssignment = true;
				name = this.parent.left.alias || this.parent.left.name; // TODO is this right?
			}

			if (spreadPropertyCount) isSimpleAssignment = false;

			// handle block scoping
			const declaration = this.findScope(false).findDeclaration(name);
			if (declaration) name = declaration.name;

			const start = firstPropertyStart;
			const end = this.end;

			if (isSimpleAssignment) {
				// ???
			} else {
				if (
					firstSpreadProperty === null ||
					firstComputedProperty < firstSpreadProperty
				) {
					name = this.findLexicalBoundary().declareIdentifier('obj');

					code.prependRight(this.start, `( ${name} = `);
				} else name = null; // We don't actually need this variable
			}

			const len = this.properties.length;
			let lastComputedProp;
			let sawNonComputedProperty = false;
			let isFirst = true;

			for (let i = 0; i < len; i += 1) {
				const prop = this.properties[i];
				let moveStart = i > 0 ? this.properties[i - 1].end : start;

				if (
					prop.type === 'Property' &&
					(prop.computed || (lastComputedProp && !spreadPropertyCount))
				) {
					if (i === 0) moveStart = this.start + 1; // Trim leading whitespace
					lastComputedProp = prop;

					if (!name) {
						name = this.findLexicalBoundary().declareIdentifier('obj');

						const propId = name + (prop.computed ? '' : '.');
						code.appendRight(prop.start, `( ${name} = {}, ${propId}`);
					} else {
						const propId =
							(isSimpleAssignment ? `;\n${i0}${name}` : `, ${name}`) +
							(prop.computed ? '' : '.');

						if (moveStart < prop.start) {
							code.overwrite(moveStart, prop.start, propId);
						} else {
							code.prependRight(prop.start, propId);
						}
					}

					let c = prop.key.end;
					if (prop.computed) {
						while (code.original[c] !== ']') c += 1;
						c += 1;
					}
					if (prop.shorthand) {
						code.overwrite(
							prop.start,
							prop.key.end,
							code.slice(prop.start, prop.key.end).replace(/:/, ' =')
						);
					} else {
						if (prop.value.start > c) code.remove(c, prop.value.start);
						code.appendLeft(c, ' = ');
					}

					if (prop.method && transforms.conciseMethodProperty) {
						code.prependRight(prop.value.start, 'function ');
					}
				} else if (prop.type === 'SpreadElement') {
					if (name && i > 0) {
						if (!lastComputedProp) {
							lastComputedProp = this.properties[i - 1];
						}
						code.appendLeft(lastComputedProp.end, `, ${name} )`);

						lastComputedProp = null;
						name = null;
					}
				} else {
					if (!isFirst && spreadPropertyCount) {
						// We are in an Object.assign context, so we need to wrap regular properties
						code.prependRight(prop.start, '{');
						code.appendLeft(prop.end, '}');
					}
					sawNonComputedProperty = true;
				}
				if (isFirst && (prop.type === 'SpreadElement' || prop.computed)) {
					let beginEnd = sawNonComputedProperty
						? this.properties[this.properties.length - 1].end
						: this.end - 1;
					// Trim trailing comma because it can easily become a leading comma which is illegal
					if (code.original[beginEnd] == ',') ++beginEnd;
					const closing = code.slice(beginEnd, end);
					code.prependLeft(moveStart, closing);
					code.remove(beginEnd, end);
					isFirst = false;
				}

				// Clean up some extranous whitespace
				let c = prop.end;
				if (i < len - 1 && !sawNonComputedProperty) {
					while (code.original[c] !== ',') c += 1;
				} else if (i == len - 1) c = this.end;
				code.remove(prop.end, c);
			}

			// special case
			if (computedPropertyCount === len) {
				code.remove(this.properties[len - 1].end, this.end - 1);
			}

			if (!isSimpleAssignment && name) {
				code.appendLeft(lastComputedProp.end, `, ${name} )`);
			}
		}
	}
}
