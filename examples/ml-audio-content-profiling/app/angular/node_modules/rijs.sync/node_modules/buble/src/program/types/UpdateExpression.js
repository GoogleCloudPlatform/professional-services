import Node from '../Node.js';
import CompileError from '../../utils/CompileError.js';

export default class UpdateExpression extends Node {
	initialise(transforms) {
		if (this.argument.type === 'Identifier') {
			const declaration = this.findScope(false).findDeclaration(
				this.argument.name
			);
			if (declaration && declaration.kind === 'const') {
				throw new CompileError(`${this.argument.name} is read-only`, this);
			}

			// special case – https://gitlab.com/Rich-Harris/buble/issues/150
			const statement = declaration && declaration.node.ancestor(3);
			if (
				statement &&
				statement.type === 'ForStatement' &&
				statement.body.contains(this)
			) {
				statement.reassigned[this.argument.name] = true;
			}
		}

		super.initialise(transforms);
	}
}
