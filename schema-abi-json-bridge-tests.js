// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by schema-abi-json-bridge.js.
import { name as packageName } from "meteor/etherui:schema-abi-json-bridge";

// Write your tests here!
// Here is an example.
Tinytest.add('schema-abi-json-bridge - example', function (test) {
  test.equal(packageName, "schema-abi-json-bridge");
});
