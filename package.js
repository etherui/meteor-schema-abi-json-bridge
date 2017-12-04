Package.describe({
  name: 'etherui:schema-abi-json-bridge',
  version: '1.0.2',
  // Brief, one-line summary of the package.
  summary: 'Simple Schema - ABI/JSON Ethereum Schema Bridge',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/etherui/meteor-schema-abi-json-bridge.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  // Dependencies
  api.versionsFrom(['METEOR@0.9.3', 'METEOR@0.9.4', 'METEOR@1.0']);

  // common
  api.use('aldeed:simple-schema@1.5.3');
  api.use('check');
  api.use('ecmascript@0.8.3');
  api.use('ethereum:web3@0.20.2');
  api.use('ethereum:accounts@0.4.0');
  api.use('ethereum:tools@0.7.0');

  //client
  api.use(['livedata', 'underscore', 'deps', 'templating', 'ui', 'blaze', 'ejson', 'reactive-var', 'reactive-dict', 'random', 'jquery'], 'client');
  api.addFiles(['schema-abi-json-bridge-common.js']);
  api.addFiles(['quickAbiForm.html',
                'quickAbiForm.js'],
                ['client']);

  api.mainModule('schema-abi-json-bridge.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('etherui:schema-abi-json-bridge');
  api.mainModule('schema-abi-json-bridge-tests.js');
});

Npm.depends({
  "bignumber.js": "4.1.0",
  "js-sha3": "0.5.2",
  "utf8": "2.1.1"
});
