import Node from '../Node.js';
import CompileError from '../../utils/CompileError.js';

export default class JSXOpeningElement extends Node {
	transpile ( code, transforms ) {
		code.overwrite( this.start, this.name.start, `${this.program.jsx}( ` );

		const html = this.name.type === 'JSXIdentifier' && this.name.name[0] === this.name.name[0].toLowerCase();
		if ( html ) code.insertRight( this.name.start, `'` );

		const len = this.attributes.length;
		let c = this.name.end;

		if ( len ) {
			let i;

			let hasSpread = false;
			for ( i = 0; i < len; i += 1 ) {
				if ( this.attributes[i].type === 'JSXSpreadAttribute' ) {
					hasSpread = true;
					break;
				}
			}

			c = this.attributes[0].end;

			for ( i = 0; i < len; i += 1 ) {
				const attr = this.attributes[i];

				if ( i > 0 ) {
					if ( attr.start === c )
						code.insertRight( c, ', ' );
					else
						code.overwrite( c, attr.start, ', ' );
				}

				if ( hasSpread && attr.type !== 'JSXSpreadAttribute' ) {
					const lastAttr = this.attributes[ i - 1 ];
					const nextAttr = this.attributes[ i + 1 ];

					if ( !lastAttr || lastAttr.type === 'JSXSpreadAttribute' ) {
						code.insertRight( attr.start, '{ ' );
					}

					if ( !nextAttr || nextAttr.type === 'JSXSpreadAttribute' ) {
						code.insertLeft( attr.end, ' }' );
					}
				}

				c = attr.end;
			}

			let after;
			let before;
			if ( hasSpread ) {
				if ( len === 1 ) {
					before = html ? `',` : ',';
				} else {
					if (!this.program.options.objectAssign) {
						throw new CompileError( this, 'Mixed JSX attributes ending in spread requires specified objectAssign option with \'Object.assign\' or polyfill helper.' );
					}
					before = html ? `', ${this.program.options.objectAssign}({},` : `, ${this.program.options.objectAssign}({},`;
					after = ')';
				}
			} else {
				before = html ? `', {` : ', {';
				after = ' }';
			}

			code.insertRight( this.name.end, before );

			if ( after ) {
				code.insertLeft( this.attributes[ len - 1 ].end, after );
			}
		} else {
			code.insertLeft( this.name.end, html ? `', null` : `, null` );
			c = this.name.end;
		}

		super.transpile( code, transforms );

		if ( this.selfClosing ) {
			code.overwrite( c, this.end, this.attributes.length ? `)` : ` )` );
		} else {
			code.remove( c, this.end );
		}
	}
}
