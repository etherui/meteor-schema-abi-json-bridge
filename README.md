# ABI/JSON Ethereum Schema - Simple Schema Bridge

Change only your ABI/JSON Ethereum smart contract and simple schema, autoform and web3 interaction functions will update automatically.

Define your ABI/JSON Ethereum contract for your aim and let `schema-abi-json-bridge` do the tedious work of defining the interaction schema and forms for you.

## How to use

`meteor add etherui:schema-abi-json-bridge`

## For event

```
  import AbiJsonBribge from 'meteor/etherui:schema-abi-json-bridge';

  //const address =  "Smart contract address";
  //const abiInterface = "Smart contract abi interface";

  let abiEvents = AbiJsonBribge.events(EJSON.parse(abiInterface));

  _.map(abiEvents, function(item) {
    const filter = web3.eth.filter({
      fromBlock: 0,
      toBlock: 'latest',
      address: address,
      topics: ["0x" + item._signature]
    });

    filter.get((error, result) => {
      if(!error) {
        let decodedLogs = _.map(result, function(event) {
          let log = item.decodeLog(event.topics, event.data);
          let params = [];
          if(log) {
            if(log._params) {
              params = _.map(log._params, function(row) {
                return {"name": row._name, "value": row._token._value};
              });

              return {"id": item._id,
                      "transactionHash": event.transactionHash,
                      "blockNumber": event.blockNumber,
                      "params": params
                     };
            }

            return {"id": item._id,
                    "transactionHash": event.transactionHash,
                    "blockNumber": event.blockNumber
                    };
          }
          return null;
        });

        console.log(decodedLogs);
      }
    });
  });
```

## For static helper
```
  import AbiJsonBribge from 'meteor/etherui:schema-abi-json-bridge';

  Template.smartContractStatic.helpers({
    getId () {
      return this._id;
    },
    getSchema () {
      let abiSchema = AbiJsonBribge.schema(EJSON.parse(this.abiInterface), this.name, {constant: 1, func: 1});
      return abiSchema;
    },
    getAddress () {
      return this.address;
    }
  });
```

## For static template
```
<template name="smartContractStatic">
  {{> quickAbiForm id=getId schema=getSchema buttonContent='Send' filter=false address=getAddress resultCallback='Template.smartContractStatic.transform'}}
</template>
```

## For static callback
```
  import AbiJsonBribge from 'meteor/etherui:schema-abi-json-bridge';
  import('buffer').then(({Buffer}) => {
    global.Buffer = Buffer;
  });
  import {BigNumber} from 'bignumber.js';
  BigNumber.config({ ERRORS: false });

  Template.smartContractStatic.transform = function(error, result, id, context) {

    //Execute static with some result
    if(!_.isUndefined(context.schema) &&
       !_.isUndefined(context.schema._schema[id]) &&
       !_.isUndefined(context.schema._schema[id].abiInterface) &&
       context.schema._schema[id].abiInterface._inputs.length != 0 &&
       context.schema._schema[id].abiInterface._outputs.length != 0) {
         let finishOut = [];
         finishOut = _.map(result, function(item) {
           if(item.type == "bytes" || item.type == "fixedBytes") {
             item.value = new Buffer(item.value).toString('hex');
           }
           if(item.type == "uint") {
             item.value = item.value.toFixed();
           }
           return item.name ? item.name + ": " + item.value : item.value;
         });

         yourModal("Result", finishOut.join('<br/>'));
    }

    //Transform static before showing
    if(!_.isUndefined(context.schema) &&
       !_.isUndefined(context.schema._schema[id]) &&
       !_.isUndefined(context.schema._schema[id].abiInterface) &&
       context.schema._schema[id].abiInterface._inputs.length == 0 &&
       context.schema._schema[id].abiInterface._outputs.length != 0) {
         let finishOut = [];
         finishOut = _.map(result, function(item) {
           if(item.type == "bytes" || item.type == "fixedBytes") {
             item.value = new Buffer(item.value).toString('hex');
           }
           if(item.type == "uint") {
             item.value = item.value.toFixed();
           }
           return item;
         });

         result = finishOut;
    }

    return result;
  };
```

## For executing helper
```
Template.smartContractExecute.helpers({
  getId () {
    return this._id;
  },
  getSchema () {
    let abiSchema = AbiJsonBribge.schema(EJSON.parse(this.abiInterface), this.name, {constant: -1, func: 1});
    return abiSchema;
  },
  getAddress () {
    return this.address;
  }
});
```

## For executing template
```
<template name="smartContractExecute">
  {{> quickAbiForm id=getId schema=getSchema buttonContent='Send' filter=false address=getAddress resultCallback='Template.smartContractExecute.showPopup'}}
</template>
```

## For executing callback
```
Template.smartContractExecute.showPopup = function(error, result, id, context) {
  if(error) {
    if(!_.isUndefined(error.reason)) {
      yourModal("Oops, something happened", error.reason);
    } else {
      yourModal("Oops, something happened", error);
    }
    return false;
  }
  if(!_.isEmpty(context._schema[id].abiInterface._outputs)) {
    yourModal("Result", result);
  }
  return result;
};
```

## Check if smart contract is payable
```
  AbiJsonBribge.payable(EJSON.parse(abiInterface), smartContractName); //true or false
```

# Common description
For each template with abi simple schema, you will have auto-updating for a static field without input.
To provide a more flexible solution for a governing you can use web3 providers.
```
  import('ethereumjs-wallet').then((wallet) => {
    global.ETHWallet = wallet.default;
  });
  import('web3-provider-engine').then((engine) => {
    global.ProviderEngine = engine.default;
  });
  import('web3-provider-engine/subproviders/web3').then((subweb3) => {
    global.Web3Subprovider = subweb3.default;
  });
  import('web3-provider-engine/subproviders/hooked-wallet').then((hookedWallet) => {
    global.HookedWalletSubprovider = hookedWallet.default;
  });
  import('ethereumjs-tx').then((tx) => {
    global.Transaction = tx.default;
  });

  let personal_wallet = ETHWallet.generate(); //create new or unlock previous
  global.web3Engine = new ProviderEngine();

  web3Engine.addProvider(new HookedWalletSubprovider({
    getAccounts: function (callback) {
      callback(null, [ personal_wallet.getAddressString() ])
    },
    getPrivateKey: function (address, callback) {
      if (address !== personal_wallet.getAddressString()) {
        return callback('Account not found')
      }
      callback(null, personal_wallet.getPrivateKey())
    },
    signTransaction: function (txParams, callback) {
      if (txParams.from !== personal_wallet.getAddressString()) {
        return callback('Account not found');
      }
      var tx = new Transaction(txParams);
      tx.sign(personal_wallet.getPrivateKey());
      var rawTx = '0x'+tx.serialize().toString('hex');
      callback(null, rawTx);
    },
    approveTransaction: function(txParams, callback) {
      txParams.gasPrice = web3.toHex(new Number($('.gas-range-value').val()).valueOf());
      try{
        web3.eth.estimateGas(txParams, function(error, result) {
          if(error) {
            callback(error);
            return false;
          }
          txParams.gas = web3.toHex(new Number(result).valueOf());
          console.log(txParams);
          yourModalApproveTransaction(JSON.stringify(txParams), callback);
        });
      } catch(e) {
        callback(e);
      }
    }
  }));

  let providerUrl = 'http://localhost:8545'; // Any RPC/JSON provider

  // data source
  web3Engine.addProvider(
    new Web3Subprovider(new Web3.providers.HttpProvider(providerUrl))
  );
  web3Engine.start();

  web3 = new Web3(web3Engine);
```
With the code above you can send a transaction with approving from own wallet for Smart Contract autoform.

# Payable function mark
For each payable function will be added "abiPayable" class. You can use css3 for a styling.

# Demo

https://etherui.net

![Alt Text](https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif)
