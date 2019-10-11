import MagicString from 'magic-string';
import BlockStatement from './BlockStatement.js';
import wrap from './wrap.js';

export default function Program ( source, ast, transforms, options ) {
	this.type = 'Root';

	// options
	this.jsx = options.jsx || 'React.createElement';
	this.options = options;

	this.source = source;
	this.magicString = new MagicString( source );

	this.ast = ast;
	this.depth = 0;

	wrap( this.body = ast, this );
	this.body.__proto__ = BlockStatement.prototype;

	this.indentExclusionElements = [];
	this.body.initialise( transforms );

	this.indentExclusions = Object.create( null );
	for ( const node of this.indentExclusionElements ) {
		for ( let i = node.start; i < node.end; i += 1 ) {
			this.indentExclusions[ i ] = true;
		}
	}

	this.body.transpile( this.magicString, transforms );
}

Program.prototype = {
	export ( options = {} ) {
		return {
			code: this.magicString.toString(),
			map: this.magicString.generateMap({
				file: options.file,
				source: options.source,
				includeContent: options.includeContent !== false
			})
		};
	},

	findNearest () {
		return null;
	},

	findScope () {
		return null;
	}
};
