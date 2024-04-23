// flat version 6.0.0 shipped as an ESModule, we need babel to help transpile to common.js
module.exports = {
    presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
  };