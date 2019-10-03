import Node from '../Node.js';

export default class IfStatement extends Node {
	initialise ( transforms ) {
		super.initialise( transforms );
	}

	transpile ( code, transforms ) {
		if ( this.consequent.type !== 'BlockStatement'
				|| this.consequent.type === 'BlockStatement' && this.consequent.synthetic ) {
			code.insertLeft( this.consequent.start, '{ ' );
			code.insertRight( this.consequent.end, ' }' );
		}

		if ( this.alternate && this.alternate.type !== 'IfStatement' && (
				this.alternate.type !== 'BlockStatement'
				|| this.alternate.type === 'BlockStatement' && this.alternate.synthetic ) ) {
			code.insertLeft( this.alternate.start, '{ ' );
			code.insertRight( this.alternate.end, ' }' );
		}

		super.transpile( code, transforms );
	}
}
