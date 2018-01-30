import EthAbi from "./ethabi-js";
import Constructor from './ethabi-js/spec/constructor';
import Decoder from './ethabi-js/decoder';
import Token from './ethabi-js/token';

const executeFunctionByName = function(functionName, context /*, args */) {
  var args = [].slice.call(arguments).splice(2);
  var namespaces = functionName.split(".");
  var func = namespaces.pop();
  for(var i = 0; i < namespaces.length; i++) {
    context = context[namespaces[i]];
  }
  return context[func].apply(context, args);
};

Template.quickAbiForm.onRendered(function () {
  var context = Template.instance().data;
  var adjustedData = AutoForm.parseData(context);
  var simpleSchema = adjustedData._resolvedSchema;
  var resultCallback = !_.isUndefined(context.resultCallback) ? context.resultCallback : function(error, result) {console.log(error, result)};
  var parents = _.filter(Object.keys(simpleSchema._schema),
                          function(item) {
                            return !_.isUndefined(simpleSchema._schema[item].abiInterface) &&
                                   simpleSchema._schema[item].abiInterface._inputs.length == 0 &&
                                   simpleSchema._schema[item].abiInterface._constant
                                   item.indexOf('.') == -1 ;
                          }
                        );
  var sourceId = !_.isUndefined(context.id) ? context.id : "commonAbiJson";
  var address = context.address;
  const updateSC = function () {
    _.map(parents, function(id) {
      var localSourceId = sourceId + "" + id;
      var abiInterface = simpleSchema._schema[id].abiInterface;
      var cr = new Constructor(abiInterface);

      let outParams = [];
      let outParamsName = [];

      _.map(abiInterface._outputs, function(data, i) {
        outParamsName.push(abiInterface._outputs[i].name);
        outParams.push(abiInterface._outputs[i]._kind);
      });

      const encodedData = "0x" + abiInterface._signature;
      try {
        web3.eth.call({
          to: address,
          data: encodedData
        }, function(error, result) {
          if(error) {
            console.log(error);
            return false;
          } else {
            const outDecoded = Decoder.decode(outParams, result);
            let namedOut = [];
            namedOut = _.map(outParamsName, function(name, i) {
              return {"name": name, "value": outDecoded[i].value, "type": outDecoded[i].type};
            });
            namedOut = executeFunctionByName(resultCallback, window, null, namedOut, id, context);

            let finishOut = [];
            finishOut = _.map(namedOut, function(item) {
              if(_.isArray(item.value)) {
                return _.map(item.value, function(item2) {
                  return item2.name ? item2.name + ": " + item2.value: item2.value;
                }).join(', ');
              } else {
                return item.name ? item.name + ": " + item.value: item.value;
              }
            });

            $('#' + localSourceId + ' input[data-schema-key="' + id + '"]').val(finishOut.join(', '));
          }
        });
      } catch(e) {
        executeFunctionByName(resultCallback, window, e);
      }
    });
  };

  setTimeout(function() {
    updateSC();
  }, 3000);

  this.updateInterval = setInterval(function() {
    updateSC();
  }, 30000);

});

Template.quickAbiForm.onDestroyed(function () {
  Meteor.clearInterval(this.updateInterval);
});

Template.quickAbiForm.helpers({
  schema: function() {
    var context = _.clone(this);
    var adjustedData = AutoForm.parseData(_.clone(this));
    var simpleSchema = adjustedData._resolvedSchema;
    var resultCallback = !_.isUndefined(context.resultCallback) ? context.resultCallback : function(error, result) {console.log(error, result)};
    var parents = _.filter(Object.keys(simpleSchema._schema), function(item) {return item.indexOf('.') == -1;});
    var ids = {};
    var sourceId = !_.isUndefined(context.id) ? context.id : "commonAbiJson";
    var address = context.address;
    _.map(parents, function(id) {
        var localSourceId = sourceId + "" + id;
        ids[localSourceId] = {
          onSubmit: function(insertDoc, updateDoc, currentDoc) {
            var interContext = this;
            var fieldName = interContext.ss._firstLevelSchemaKeys[0];
            var abiInterface = interContext.ss._schema[fieldName].abiInterface;
            var cr = new Constructor(abiInterface);
            var params= [];
            let index = 0;
            _.map(insertDoc[fieldName], function(data) {
              params.push(new Token(abiInterface._inputs[index]._kind._type, data));
              index++;
            });
            var outParams= [];
            var outParamsName = [];

            _.map(abiInterface._outputs, function(data, i) {
              outParamsName.push(abiInterface._outputs[i].name);
              outParams.push(abiInterface._outputs[i]._kind);
            });

            const encodedData = "0x" + abiInterface._signature + cr.encodeCall(params);
            if(abiInterface._constant) {
              try {
                web3.eth.call({
                  to: address,
                  data: encodedData
                }, function(error, result) {
                  if(error) {
                    try {
                      executeFunctionByName(resultCallback, window, error);
                    } catch(e) {
                      console.log(e);
                    }
                    return interContext.done(error);
                  } else {
                    let outDecoded = Decoder.decode(outParams, result);
                    let index = 0;
                    let namedOut = [];
                    namedOut = _.map(outParamsName, function(name, i) {
                      return {"name": name, "value": outDecoded[i].value, "type": outDecoded[i].type};
                    });
                    try {
                      namedOut = executeFunctionByName(resultCallback, window, null, namedOut, fieldName, context);
                    } catch(e) {
                      console.log(e);
                    }
                    return interContext.done(null, namedOut);
                  }
                });
              } catch(e) {
                executeFunctionByName(resultCallback, window, e);
                return interContext.done(e);
              }
            } else {
              try {
                web3.eth.sendTransaction({
                  to: address,
                  data: encodedData
                }, function(error, result) {
                  if(error) {
                    try {
                      executeFunctionByName(resultCallback, window, error);
                    } catch(e) {
                      console.log(e);
                    }
                    return interContext.done(error);
                  } else {
                    var outDecoded = Decoder.decode(outParams, result);
                    var namedOut = [];
                    namedOut = _.map(outParamsName, function(name, i) {
                      return {"name": name, "value": outDecoded[i].value, "type": outDecoded[i].type};
                    });
                    try {
                      namedOut = executeFunctionByName(resultCallback, window, null, namedOut, fieldName, context);
                    } catch(e) {
                      console.log(e);
                    }
                    return interContext.done(null, namedOut);
                  }
                });
              } catch(e) {
                executeFunctionByName(resultCallback, window, e);
                console.log(address, encodedData);
                return interContext.done(e);
              }
            }
            return false;
          },
          onError: function (formType, error) {
            try {
              executeFunctionByName(resultCallback, window, error);
            } catch(e) {
              console.log(e);
            }
          }
        }
    });

    AutoForm.hooks(ids);

    return parents;
  },
  innerContext: function() {
    var context = _.clone(Template.parentData(1));
    var sourceField = Template.currentData();
    context.id = !_.isUndefined(context.id) ? context.id : "commonAbiJson";
    context.id = context.id + "" + sourceField;
    context.buttonContent = !_.isUndefined(context.buttonContent) ? context.buttonContent : "Send";
    var keys = Object.keys(context.schema._schema);
    if(!_.isUndefined(context.schema._schema[sourceField].abiInterface) &&
       _.isEmpty(context.schema._schema[sourceField].abiInterface._inputs) &&
       context.schema._schema[sourceField].abiInterface.constant
      ) {
      context.buttonContent = false;
    }

    if(!_.isUndefined(context.schema._schema[sourceField].abiInterface) &&
       context.schema._schema[sourceField].abiInterface.payable
      ) {
      context.class = "abiPayable";
    }

    var fields = [sourceField];
    var additionalFields = _.filter(keys, function(field) {
      return field.indexOf(sourceField + ".") != -1;
    });
    fields = _.union(fields, additionalFields);
    context.schema = context.schema.pick(fields);
    return context;
  }
});
