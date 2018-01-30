import Func from './ethabi-js/spec/function';
import EthAbi from "./ethabi-js";

export default AbiJsonBribge = {
  schema: (abi, name, { fields, except, custom, constant = 0, func = 0}={}) => {
    let keys, conten;
    const abiParsed = new EthAbi(abi);

    // Get field definitions for the all types
    keys = getFields({abiParsed, fields, except, constant, func});

    content = keys.map(item => {
      if(item.name == "constructor" && _.isEmpty(item.inputs)) {
         return null;
      }
      return getFieldSchema(item, custom);
    });

    return new SimpleSchema(content);
  },
  events: (abi) => {
    const abiParsed = new EthAbi(abi);
    return abiParsed.events;
  },
  payable: (abi, name) => {
    let keys;
    const abiParsed = new EthAbi(abi);
    let payable = false;

    // Get field definitions for the all types
    keys = getFields({abiParsed});

    keys.map(item => {
      if(item.name == "constructor" && _.isEmpty(item.inputs)) {
         payable = true;
      }
    });

    return payable;
  },
};

// Get field key definition
const getFieldSchema = (item, custom = {}) => {
  let value = {};

  if(custom[item.name]) {
    value = custom[item.name];
    value.abiInterface = item.abi;
    return value;
  }

  if(!_.isEmpty(item.inputs)) {
    _.map(item.inputs, function(param) {
      const format = getFieldFormat(param.name, param._kind, item.name);
      value[item.name + "." + param.name] = format;
    })
  }

  if(_.isEmpty(value)) {
    const attrClass = item.constant ? "": "hidden";
    value[item.name] = {"type": String,
                        "label": item.name,
                        "autoform": {
                          "group": item.name,
                          "afFieldInput": {
                            "readonly": true,
                            "class": attrClass
                          },
                        },
                        "optional": true,
                        "abiInterface": item.abi
                       }
    return value;
  }

  let out = {};
  out[item.name] = {"type": Object,
                    "label": item.name,
                    "autoform": {
                      "group": item.name
                    },
                    "optional": true,
                    "abiInterface": item.abi
                    };
  return _.extend(out, value);
};

const getFieldFormat = (name, kind, parent) => {
  let value = '';
  switch(kind._type) {
    case 'address':
      value = {type: String,
               label: name + " (" + kind._type + ")",
               optional: true,
               autoform: {
                 group: parent
               }
              };
    break;
    case 'bytes':
      value = {type: String,
               label: name + " (" + kind._type + ")",
               optional: true,
               autoform: {
                 afFieldInput: {
                   type: "textarea",
                   rows: 5
                 },
                 group: parent
               }
              };
    break;
    case 'int':
    case 'uint':
      value = {type: String,
               label: name + " (" + kind._type + ")",
               optional: true,
               autoform: {
                 group: parent,
                 placeholder: kind._type
               }
              };
    break;
    case 'bool':
      value = {type: Boolean,
               label: name + " (" + kind._type + ")",
               optional: true,
               autoform: {
                 group: parent
               }
              };
    break;
    case 'string':
      value = {type: String,
               label: name + " (" + kind._type + ")",
               optional: true,
               autoform: {
                 group: parent,
               }
              };
    break;
    case 'array':
      value = '';
    break;
    case 'fixedBytes':
      value = '';
    break;
    case 'fixedArray':
      value = '';
    break;
  }
  return value;
};

const getFields = ({abiParsed, fields, except=[], constant = 0, func = 0}) => {
  let keys, objectKeys;

  if(fields && !fields.length) {
    fields = null;
  }

  if(except && !except.length) {
    except = null;
  }

  // Get firstLevelKeys
  preparedFields = abiParsed._interface.filter(k => {
    if(fields) {
      return fields.indexOf(k._name) > -1;
    }
    if(except) {
      return except.indexOf(k._name) == -1;
    }

    let result_func = true;
    if(func == -1) {
      result_func = !(k instanceof Func);
    }
    if(func == 1) {
      result_func = k instanceof Func;
    }

    let result_constant = true;
    if(constant == -1) {
      result_constant = new Boolean(k._constant) == false;
    }
    if(constant == 1) {
      result_constant = new Boolean(k._constant) == true;
    }

    return result_func && result_constant;
  }).map(k => {
    k._name = _.isUndefined(k._name) ? 'constructor': k._name;
    k._name = k._name == 'undefined' ? 'fallback': k._name;
    return {"name": k._name, "inputs": k._inputs, "abi": k}
  });

  return preparedFields;
};
