import Node from '../Node.js';
import reserved from '../../utils/reserved.js';

export default class Property extends Node {
	transpile ( code, transforms ) {
		if ( transforms.conciseMethodProperty && !this.computed && this.parent.type !== 'ObjectPattern' ) {
			if ( this.shorthand ) {
				code.insertRight( this.start, `${this.key.name}: ` );
			} else if ( this.method ) {
				let name = '';
				if ( this.program.options.namedFunctionExpressions !== false ) {
					if ( this.key.type === 'Literal' && typeof this.key.value === 'number' ) {
						name = "";
					} else if ( this.key.type === 'Identifier' ) {
						if ( reserved[ this.key.name ] ||
							 ! /^[a-z_$][a-z0-9_$]*$/i.test( this.key.name ) ||
						     this.value.body.scope.references[this.key.name] ) {
							name = this.findScope( true ).createIdentifier( this.key.name );
						} else {
							name = this.key.name;
						}
					} else {
						name = this.findScope( true ).createIdentifier( this.key.value );
					}
					name = ' ' + name;
				}

				if ( this.value.generator ) code.remove( this.start, this.key.start );
				code.insertLeft( this.key.end, `: function${this.value.generator ? '*' : ''}${name}` );
			}
		}

		if ( transforms.reservedProperties && reserved[ this.key.name ] ) {
			code.insertRight( this.key.start, `'` );
			code.insertLeft( this.key.end, `'` );
		}

		super.transpile( code, transforms );
	}
}
