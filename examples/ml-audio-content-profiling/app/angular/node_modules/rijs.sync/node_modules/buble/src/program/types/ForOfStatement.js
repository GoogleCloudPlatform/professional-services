import LoopStatement from './shared/LoopStatement.js';
import CompileError from '../../utils/CompileError.js';
import destructure from '../../utils/destructure.js';

export default class ForOfStatement extends LoopStatement {
	initialise(transforms) {
		if (transforms.forOf && !transforms.dangerousForOf)
			throw new CompileError(
				"for...of statements are not supported. Use `transforms: { forOf: false }` to skip transformation and disable this error, or `transforms: { dangerousForOf: true }` if you know what you're doing",
				this
			);
		super.initialise(transforms);
	}

	transpile(code, transforms) {
		super.transpile(code, transforms);
		if (!transforms.dangerousForOf) return;

		// edge case (#80)
		if (!this.body.body[0]) {
			if (
				this.left.type === 'VariableDeclaration' &&
				this.left.kind === 'var'
			) {
				code.remove(this.start, this.left.start);
				code.appendLeft(this.left.end, ';');
				code.remove(this.left.end, this.end);
			} else {
				code.remove(this.start, this.end);
			}

			return;
		}

		const scope = this.findScope(true);
		const i0 = this.getIndentation();
		const i1 = i0 + code.getIndentString();

		const key = scope.createIdentifier('i');
		const list = scope.createIdentifier('list');

		if (this.body.synthetic) {
			code.prependRight(this.left.start, `{\n${i1}`);
			code.appendLeft(this.body.body[0].end, `\n${i0}}`);
		}

		const bodyStart = this.body.body[0].start;

		code.remove(this.left.end, this.right.start);
		code.move(this.left.start, this.left.end, bodyStart);

		code.prependRight(this.right.start, `var ${key} = 0, ${list} = `);
		code.appendLeft(this.right.end, `; ${key} < ${list}.length; ${key} += 1`);

		// destructuring. TODO non declaration destructuring
		const declarator =
			this.left.type === 'VariableDeclaration' && this.left.declarations[0];
		if (declarator && declarator.id.type !== 'Identifier') {
			let statementGenerators = [];
			const ref = scope.createIdentifier('ref');
			destructure(code, scope, declarator.id, ref, false, statementGenerators);

			let suffix = `;\n${i1}`;
			statementGenerators.forEach((fn, i) => {
				if (i === statementGenerators.length - 1) {
					suffix = `;\n\n${i1}`;
				}

				fn(bodyStart, '', suffix);
			});

			code.appendLeft(this.left.start + this.left.kind.length + 1, ref);
			code.appendLeft(this.left.end, ` = ${list}[${key}];\n${i1}`);
		} else {
			code.appendLeft(this.left.end, ` = ${list}[${key}];\n\n${i1}`);
		}
	}
}
