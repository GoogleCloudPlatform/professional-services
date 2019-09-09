import Node from '../Node.js';
import CompileError from '../../utils/CompileError.js';

export default class ObjectExpression extends Node {
	transpile ( code, transforms ) {
		super.transpile( code, transforms );

		let firstPropertyStart = this.start + 1;
		let regularPropertyCount = 0;
		let spreadPropertyCount = 0;
		let computedPropertyCount = 0;

		for ( let prop of this.properties ) {
			if ( prop.type === 'SpreadProperty' ) {
				spreadPropertyCount += 1;
			} else if ( prop.computed ) {
				computedPropertyCount += 1;
			} else if ( prop.type === 'Property' ) {
				regularPropertyCount += 1;
			}
		}

		if ( spreadPropertyCount ) {
			if ( !this.program.options.objectAssign ) {
				throw new CompileError( this, 'Object spread operator requires specified objectAssign option with \'Object.assign\' or polyfill helper.' );
			}
			// enclose run of non-spread properties in curlies
			let i = this.properties.length;
			if ( regularPropertyCount ) {
				while ( i-- ) {
					const prop = this.properties[i];

					if ( prop.type === 'Property' && !prop.computed ) {
						const lastProp = this.properties[ i - 1 ];
						const nextProp = this.properties[ i + 1 ];

						if ( !lastProp || lastProp.type !== 'Property' || lastProp.computed ) {
							code.insertRight( prop.start, '{' );
						}

						if ( !nextProp || nextProp.type !== 'Property' || nextProp.computed ) {
							code.insertLeft( prop.end, '}' );
						}
					}
				}
			}

			// wrap the whole thing in Object.assign
			firstPropertyStart = this.properties[0].start;
			code.overwrite( this.start, firstPropertyStart, `${this.program.options.objectAssign}({}, `);
			code.overwrite( this.properties[ this.properties.length - 1 ].end, this.end, ')' );
		}

		if ( computedPropertyCount && transforms.computedProperty ) {
			const i0 = this.getIndentation();

			let isSimpleAssignment;
			let name;

			if ( this.parent.type === 'VariableDeclarator' && this.parent.parent.declarations.length === 1 ) {
				isSimpleAssignment = true;
				name = this.parent.id.alias || this.parent.id.name; // TODO is this right?
			} else if ( this.parent.type === 'AssignmentExpression' && this.parent.parent.type === 'ExpressionStatement' && this.parent.left.type === 'Identifier' ) {
				isSimpleAssignment = true;
				name = this.parent.left.alias || this.parent.left.name; // TODO is this right?
			} else if ( this.parent.type === 'AssignmentPattern' && this.parent.left.type === 'Identifier' ) {
				isSimpleAssignment = true;
				name = this.parent.left.alias || this.parent.left.name; // TODO is this right?
			}

			// handle block scoping
			const declaration = this.findScope( false ).findDeclaration( name );
			if ( declaration ) name = declaration.name;

			const start = firstPropertyStart;
			const end = this.end;

			if ( isSimpleAssignment ) {
				// ???
			} else {
				name = this.findScope( true ).createIdentifier( 'obj' );

				const statement = this.findNearest( /(?:Statement|Declaration)$/ );
				code.insertLeft( statement.end, `\n${i0}var ${name};` );

				code.insertRight( this.start, `( ${name} = ` );
			}

			const len = this.properties.length;
			let lastComputedProp;
			let sawNonComputedProperty = false;

			for ( let i = 0; i < len; i += 1 ) {
				const prop = this.properties[i];

				if ( prop.computed ) {
					lastComputedProp = prop;
					let moveStart = i > 0 ? this.properties[ i - 1 ].end : start;

					const propId = isSimpleAssignment ? `;\n${i0}${name}` : `, ${name}`;

					if (moveStart < prop.start) {
						code.overwrite( moveStart, prop.start, propId );
					} else {
						code.insertRight( prop.start, propId );
					}

					let c = prop.key.end;
					while ( code.original[c] !== ']' ) c += 1;
					c += 1;

					if ( prop.value.start > c ) code.remove( c, prop.value.start );
					code.insertLeft( c, ' = ' );
					code.move( moveStart, prop.end, end );

					if ( i < len - 1 && ! sawNonComputedProperty ) {
						// remove trailing comma
						c = prop.end;
						while ( code.original[c] !== ',' ) c += 1;

						code.remove( prop.end, c + 1 );
					}

					if ( prop.method && transforms.conciseMethodProperty ) {
						code.insertRight( prop.value.start, 'function ' );
					}
				} else {
					sawNonComputedProperty = true;
				}
			}

			// special case
			if ( computedPropertyCount === len ) {
				code.remove( this.properties[ len - 1 ].end, this.end - 1 );
			}

			if ( !isSimpleAssignment ) {
				code.insertLeft( lastComputedProp.end, `, ${name} )` );
			}
		}
	}
}
