import CompileError from '../utils/CompileError.js';
import { findIndex } from './array.js';

const handlers = {
	Identifier: destructureIdentifier,
	AssignmentPattern: destructureAssignmentPattern,
	ArrayPattern: destructureArrayPattern,
	ObjectPattern: destructureObjectPattern
};

export default function destructure(
	code,
	scope,
	node,
	ref,
	inline,
	statementGenerators
) {
	handlers[node.type](code, scope, node, ref, inline, statementGenerators);
}

function destructureIdentifier(
	code,
	scope,
	node,
	ref,
	inline,
	statementGenerators
) {
	statementGenerators.push((start, prefix, suffix) => {
		code.prependRight(node.start, inline ? prefix : `${prefix}var `);
		code.appendLeft(node.end, ` = ${ref}${suffix}`);
		code.move(node.start, node.end, start);
	});
}

function destructureAssignmentPattern(
	code,
	scope,
	node,
	ref,
	inline,
	statementGenerators
) {
	const isIdentifier = node.left.type === 'Identifier';
	const name = isIdentifier ? node.left.name : ref;

	if (!inline) {
		statementGenerators.push((start, prefix, suffix) => {
			code.prependRight(
				node.left.end,
				`${prefix}if ( ${name} === void 0 ) ${name}`
			);
			code.move(node.left.end, node.right.end, start);
			code.appendLeft(node.right.end, suffix);
		});
	}

	if (!isIdentifier) {
		destructure(code, scope, node.left, ref, inline, statementGenerators);
	}
}

function destructureArrayPattern(
	code,
	scope,
	node,
	ref,
	inline,
	statementGenerators
) {
	let c = node.start;

	node.elements.forEach((element, i) => {
		if (!element) return;

		if (element.type === 'RestElement') {
			handleProperty(
				code,
				scope,
				c,
				element.argument,
				`${ref}.slice(${i})`,
				inline,
				statementGenerators
			);
		} else {
			handleProperty(
				code,
				scope,
				c,
				element,
				`${ref}[${i}]`,
				inline,
				statementGenerators
			);
		}
		c = element.end;
	});

	code.remove(c, node.end);
}

function destructureObjectPattern(
	code,
	scope,
	node,
	ref,
	inline,
	statementGenerators
) {
	let c = node.start;

	const nonRestKeys = [];
	node.properties.forEach(prop => {
		let value;
		let content;
		if (prop.type === 'Property') {
			const isComputedKey = prop.computed || prop.key.type !== 'Identifier';
			const key = isComputedKey
				? code.slice(prop.key.start, prop.key.end)
				: prop.key.name;
			value = isComputedKey ? `${ref}[${key}]` : `${ref}.${key}`;
			content = prop.value;
			nonRestKeys.push(isComputedKey ? key : '"' + key + '"');
		} else if (prop.type === 'RestElement') {
			content = prop.argument;
			value = scope.createIdentifier('rest');
			const n = scope.createIdentifier('n');
			statementGenerators.push((start, prefix, suffix) => {
				code.overwrite(
					prop.start,
					(c = prop.argument.start),
					`${prefix}var ${value} = {}; for (var ${n} in ${ref}) if([${nonRestKeys.join(
						', '
					)}].indexOf(${n}) === -1) ${value}[${n}] = ${ref}[${n}]${suffix}`
				);
				code.move(prop.start, c, start);
			});
		} else {
			throw new CompileError(
				this,
				`Unexpected node of type ${prop.type} in object pattern`
			);
		}
		handleProperty(code, scope, c, content, value, inline, statementGenerators);
		c = prop.end;
	});

	code.remove(c, node.end);
}

function handleProperty(
	code,
	scope,
	c,
	node,
	value,
	inline,
	statementGenerators
) {
	switch (node.type) {
		case 'Identifier': {
			code.remove(c, node.start);
			destructureIdentifier(
				code,
				scope,
				node,
				value,
				inline,
				statementGenerators
			);
			break;
		}

		case 'AssignmentPattern': {
			let name;

			const isIdentifier = node.left.type === 'Identifier';

			if (isIdentifier) {
				name = node.left.name;
				const declaration = scope.findDeclaration(name);
				if (declaration) name = declaration.name;
			} else {
				name = scope.createIdentifier(value);
			}

			statementGenerators.push((start, prefix, suffix) => {
				if (inline) {
					code.prependRight(
						node.right.start,
						`${name} = ${value} === undefined ? `
					);
					code.appendLeft(node.right.end, ` : ${value}`);
				} else {
					code.prependRight(
						node.right.start,
						`${prefix}var ${name} = ${value}; if ( ${name} === void 0 ) ${name} = `
					);
					code.appendLeft(node.right.end, suffix);
				}

				code.move(node.right.start, node.right.end, start);
			});

			if (isIdentifier) {
				code.remove(c, node.right.start);
			} else {
				code.remove(c, node.left.start);
				code.remove(node.left.end, node.right.start);
				handleProperty(
					code,
					scope,
					c,
					node.left,
					name,
					inline,
					statementGenerators
				);
			}

			break;
		}

		case 'ObjectPattern': {
			code.remove(c, (c = node.start));

			let ref = value;
			if (node.properties.length > 1) {
				ref = scope.createIdentifier(value);

				statementGenerators.push((start, prefix, suffix) => {
					// this feels a tiny bit hacky, but we can't do a
					// straightforward appendLeft and keep correct order...
					code.prependRight(node.start, `${prefix}var ${ref} = `);
					code.overwrite(node.start, (c = node.start + 1), value);
					code.appendLeft(c, suffix);

					code.overwrite(
						node.start,
						(c = node.start + 1),
						`${prefix}var ${ref} = ${value}${suffix}`
					);
					code.move(node.start, c, start);
				});
			}

			destructureObjectPattern(
				code,
				scope,
				node,
				ref,
				inline,
				statementGenerators
			);

			break;
		}

		case 'ArrayPattern': {
			code.remove(c, (c = node.start));

			if (node.elements.filter(Boolean).length > 1) {
				const ref = scope.createIdentifier(value);

				statementGenerators.push((start, prefix, suffix) => {
					code.prependRight(node.start, `${prefix}var ${ref} = `);
					code.overwrite(node.start, (c = node.start + 1), value, {
						contentOnly: true
					});
					code.appendLeft(c, suffix);

					code.move(node.start, c, start);
				});

				node.elements.forEach((element, i) => {
					if (!element) return;

					if (element.type === 'RestElement') {
						handleProperty(
							code,
							scope,
							c,
							element.argument,
							`${ref}.slice(${i})`,
							inline,
							statementGenerators
						);
					} else {
						handleProperty(
							code,
							scope,
							c,
							element,
							`${ref}[${i}]`,
							inline,
							statementGenerators
						);
					}
					c = element.end;
				});
			} else {
				const index = findIndex(node.elements, Boolean);
				const element = node.elements[index];
				if (element.type === 'RestElement') {
					handleProperty(
						code,
						scope,
						c,
						element.argument,
						`${value}.slice(${index})`,
						inline,
						statementGenerators
					);
				} else {
					handleProperty(
						code,
						scope,
						c,
						element,
						`${value}[${index}]`,
						inline,
						statementGenerators
					);
				}
				c = element.end;
			}

			code.remove(c, node.end);
			break;
		}

		default: {
			throw new Error(`Unexpected node type in destructuring (${node.type})`);
		}
	}
}
