/**
 * Copyright (c) 2015-present, Waysact Pty Ltd
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var Template = require('webpack/lib/Template');
var util = require('./util');

function WebIntegrityJsonpMainTemplatePlugin(sriPlugin, compilation) {
  this.sriPlugin = sriPlugin;
  this.compilation = compilation;
}

function addSriHashes(plugin, chunk, source) {
  var allChunks = util.findChunks(chunk);

  if (allChunks.size > 0) {
    return (Template.asString || plugin.asString)([
      source,
      'var sriHashes = ' +
        JSON.stringify(
          Array.from(allChunks).reduce(function chunkIdReducer(
            sriHashes,
            depChunk
          ) {
            if (chunk !== depChunk) {
              // eslint-disable-next-line no-param-reassign
              sriHashes[depChunk.id] = util.makePlaceholder(depChunk.id);
            }
            return sriHashes;
          },
          {})
        ) +
        ';'
    ]);
  }

  return source;
}

WebIntegrityJsonpMainTemplatePlugin.prototype.apply = function apply(
  mainTemplate
) {
  var self = this;

  /*
   *  Patch jsonp-script code to add the integrity attribute.
   */
  function jsonpScriptPlugin(source) {
    if (!mainTemplate.outputOptions.crossOriginLoading) {
      self.sriPlugin.error(
        self.compilation,
        'webpack option output.crossOriginLoading not set, code splitting will not work!'
      );
    }
    return (Template.asString || this.asString)([
      source,
      'script.integrity = sriHashes[chunkId];',
      'script.crossOrigin = ' + JSON.stringify(mainTemplate.outputOptions.crossOriginLoading) + ';',
    ]);
  }

  /*
   *  Patch local-vars code to add a mapping from chunk ID to SRIs.
   *  Since SRIs haven't been computed at this point, we're using
   *  magic placeholders for SRI values and going to replace them
   *  later.
   */
  function localVarsPlugin(source, chunk) {
    return addSriHashes(this, chunk, source);
  }

  if (mainTemplate.hooks) {
    mainTemplate.hooks.jsonpScript.tap('SriPlugin', jsonpScriptPlugin);
    mainTemplate.hooks.localVars.tap('SriPlugin', localVarsPlugin);
  } else {
    mainTemplate.plugin('jsonp-script', jsonpScriptPlugin);
    mainTemplate.plugin('local-vars', localVarsPlugin);
  }
};

module.exports = WebIntegrityJsonpMainTemplatePlugin;
