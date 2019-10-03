import { findIndex } from './array.js';

const handlers = {
	Identifier: destructureIdentifier,
	AssignmentPattern: destructureAssignmentPattern,
	ArrayPattern: destructureArrayPattern,
	ObjectPattern: destructureObjectPattern
};

export default function destructure ( code, scope, node, ref, inline, statementGenerators ) {
	handlers[ node.type ]( code, scope, node, ref, inline, statementGenerators );
}

function destructureIdentifier ( code, scope, node, ref, inline, statementGenerators ) {
	statementGenerators.push( ( start, prefix, suffix ) => {
		code.insertRight( node.start, inline ? prefix : `${prefix}var ` );
		code.insertLeft( node.end, ` = ${ref}${suffix}` );
		code.move( node.start, node.end, start );
	});
}

function destructureAssignmentPattern ( code, scope, node, ref, inline, statementGenerators ) {
	const isIdentifier = node.left.type === 'Identifier';
	const name = isIdentifier ? node.left.name : ref;

	if ( !inline ) {
		statementGenerators.push( ( start, prefix, suffix ) => {
			code.insertRight( node.left.end, `${prefix}if ( ${name} === void 0 ) ${name}` );
			code.move( node.left.end, node.right.end, start );
			code.insertLeft( node.right.end, suffix );
		});
	}

	if ( !isIdentifier ) {
		destructure( code, scope, node.left, ref, inline, statementGenerators );
	}
}

function destructureArrayPattern ( code, scope, node, ref, inline, statementGenerators ) {
	let c = node.start;

	node.elements.forEach( ( element, i ) => {
		if ( !element ) return;

		if ( element.type === 'RestElement' ) {
			handleProperty( code, scope, c, element.argument, `${ref}.slice(${i})`, inline, statementGenerators );
		} else {
			handleProperty( code, scope, c, element, `${ref}[${i}]`, inline, statementGenerators );
		}
		c = element.end;
	});

	code.remove( c, node.end );
}

function destructureObjectPattern ( code, scope, node, ref, inline, statementGenerators ) {
	let c = node.start;

	node.properties.forEach( prop => {
		let value = prop.computed || prop.key.type !== 'Identifier' ? `${ref}[${code.slice(prop.key.start, prop.key.end)}]` : `${ref}.${prop.key.name}`;
		handleProperty( code, scope, c, prop.value, value, inline, statementGenerators );
		c = prop.end;
	});

	code.remove( c, node.end );
}

function handleProperty ( code, scope, c, node, value, inline, statementGenerators ) {
	switch ( node.type ) {
		case 'Identifier': {
			code.remove( c, node.start );
			destructureIdentifier( code, scope, node, value, inline, statementGenerators );
			break;
		}

		case 'AssignmentPattern': {
			let name;

			const isIdentifier = node.left.type === 'Identifier';

			if ( isIdentifier ) {
				name = node.left.name;
				const declaration = scope.findDeclaration( name );
				if ( declaration ) name = declaration.name;
			} else {
				name = scope.createIdentifier( value );
			}

			statementGenerators.push( ( start, prefix, suffix ) => {
				if ( inline ) {
					code.insertRight( node.right.start, `${name} = ${value} === undefined ? ` );
					code.insertLeft( node.right.end, ` : ${value}` );
				} else {
					code.insertRight( node.right.start, `${prefix}var ${name} = ${value}; if ( ${name} === void 0 ) ${name} = ` );
					code.insertLeft( node.right.end, suffix );
				}

				code.move( node.right.start, node.right.end, start );
			});

			if ( isIdentifier ) {
				code.remove( c, node.right.start );
			} else {
				code.remove( c, node.left.start );
				code.remove( node.left.end, node.right.start );
				handleProperty( code, scope, c, node.left, name, inline, statementGenerators );
			}

			break;
		}

		case 'ObjectPattern': {
			code.remove( c, c = node.start );

			if ( node.properties.length > 1 ) {
				const ref = scope.createIdentifier( value );

				statementGenerators.push( ( start, prefix, suffix ) => {
					// this feels a tiny bit hacky, but we can't do a
					// straightforward insertLeft and keep correct order...
					code.insertRight( node.start, `${prefix}var ${ref} = ` );
					code.overwrite( node.start, c = node.start + 1, value );
					code.insertLeft( c, suffix );

					code.move( node.start, c, start );
				});

				node.properties.forEach( prop => {
					const value = prop.computed || prop.key.type !== 'Identifier' ? `${ref}[${code.slice(prop.key.start, prop.key.end)}]` : `${ref}.${prop.key.name}`;
					handleProperty( code, scope, c, prop.value, value, inline, statementGenerators );
					c = prop.end;
				});
			} else {
				const prop = node.properties[0];
				const value_suffix = prop.computed || prop.key.type !== 'Identifier' ? `[${code.slice(prop.key.start, prop.key.end)}]` : `.${prop.key.name}`;
				handleProperty( code, scope, c, prop.value, `${value}${value_suffix}`, inline, statementGenerators );
				c = prop.end;
			}

			code.remove( c, node.end );
			break;
		}

		case 'ArrayPattern': {
			code.remove( c, c = node.start );

			if ( node.elements.filter( Boolean ).length > 1 ) {
				const ref = scope.createIdentifier( value );

				statementGenerators.push( ( start, prefix, suffix ) => {
					code.insertRight( node.start, `${prefix}var ${ref} = ` );
					code.overwrite( node.start, c = node.start + 1, value );
					code.insertLeft( c, suffix );

					code.move( node.start, c, start );
				});

				node.elements.forEach( ( element, i ) => {
					if ( !element ) return;

					if ( element.type === 'RestElement' ) {
						handleProperty( code, scope, c, element.argument, `${ref}.slice(${i})`, inline, statementGenerators );
					} else {
						handleProperty( code, scope, c, element, `${ref}[${i}]`, inline, statementGenerators );
					}
					c = element.end;
				});
			} else {
				const index = findIndex( node.elements, Boolean );
				const element = node.elements[ index ];
				if ( element.type === 'RestElement' ) {
					handleProperty( code, scope, c, element.argument, `${value}.slice(${index})`, inline, statementGenerators );
				} else {
					handleProperty( code, scope, c, element, `${value}[${index}]`, inline, statementGenerators );
				}
				c = element.end;
			}

			code.remove( c, node.end );
			break;
		}

		default: {
			throw new Error( `Unexpected node type in destructuring (${node.type})` );
		}
	}
}
