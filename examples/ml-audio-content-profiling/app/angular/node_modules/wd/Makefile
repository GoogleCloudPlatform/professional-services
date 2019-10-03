
DEFAULT:
	@echo
	@echo '  mapping -> build the mapping (implemented only).'
	@echo '  full_mapping -> build the mapping (full).'
	@echo '  unsupported_mapping -> build the mapping (unsupported).'
	@echo

_dox:
	@mkdir -p tmp
	@./node_modules/.bin/dox -r < lib/webdriver.js > tmp/webdriver-dox.json
	@./node_modules/.bin/dox -r < lib/element.js > tmp/element-dox.json
	@./node_modules/.bin/dox -r < lib/commands.js > tmp/commands-dox.json
	@./node_modules/.bin/dox -r < lib/element-commands.js > tmp/element-commands-dox.json
	@./node_modules/.bin/dox -r < lib/main.js > tmp/main-dox.json
	@./node_modules/.bin/dox -r < lib/asserters.js > tmp/asserters-dox.json

# build the mapping (implemented only)
mapping: _dox
	@node doc/mapping-builder.js

# build the mapping (full)
full_mapping: _dox
	@node doc/mapping-builder.js full

# build the mapping (unsupported)
unsupported_mapping: _dox
	@node doc/mapping-builder.js unsupported

.PHONY: \
	DEFAULT \
	mapping \
	full_mapping \
	unsupported_mapping \
	_dox
