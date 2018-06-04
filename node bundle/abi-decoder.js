//const SolidityCoder = require("web3/lib/solidity/coder.js"); //replaced by Interface to correctly parse ABIv2
const Web3 = require('web3');
const Interface = require('ethers-contracts/interface.js');

const state = {
  savedABIs: [],
  methodIDs: {}
}

function _getABIs() {
  return state.savedABIs;
}

function _addABI(abiArray) {
  if (Array.isArray(abiArray)) {

    // Iterate new abi to generate method id's
    abiArray.map(function (abi) {
      if (abi.name) {
        const signature = new Web3().sha3(abi.name + "(" + abi.inputs.map(function (input) { return input.type; }).join(",") + ")");
        if (abi.type == "event") {
          state.methodIDs[signature.slice(2)] = abi;
        }
        else {
          state.methodIDs[signature.slice(2, 10)] = abi;
        }
      }
    });

    state.savedABIs = state.savedABIs.concat(abiArray);
  }
  else {
    throw new Error("Expected ABI array, got " + typeof abiArray);
  }
}

function _removeABI(abiArray) {
  if (Array.isArray(abiArray)) {

    // Iterate new abi to generate method id's
    abiArray.map(function (abi) {
      if (abi.name) {
        const signature = new Web3().sha3(abi.name + "(" + abi.inputs.map(function (input) { return input.type; }).join(",") + ")");
        if (abi.type == "event") {
          if (state.methodIDs[signature.slice(2)]) {
            delete state.methodIDs[signature.slice(2)];
          }
        }
        else {
          if (state.methodIDs[signature.slice(2, 10)]) {
            delete state.methodIDs[signature.slice(2, 10)];
          }
        }
      }
    });
  }
  else {
    throw new Error("Expected ABI array, got " + typeof abiArray);
  }
}

function _getMethodIDs() {
  return state.methodIDs;
}

function _decodeMethod(data) {
  const methodID = data.slice(2, 10);
  const abiItem = state.methodIDs[methodID];
  if (abiItem) {
    const params = abiItem.inputs.map(function (item) { return item.type; });
    // let decoded = SolidityCoder.decodeParams(params, data.slice(10));
    let decoded = Interface.decodeParams(params, '0x' + data.slice(10));
    return {
      name: abiItem.name,
      params: decoded.map(function (param, index) {
        let parsedParam = param;
        const isUint = abiItem.inputs[index].type.indexOf("uint") == 0;
        const isInt = abiItem.inputs[index].type.indexOf("int") == 0;

        if (isUint || isInt) {
          parsedParam = parseArrayNumber(param);

          function parseArrayNumber(param2) {
            let parsedParam2 = param2;
            const isArray = Array.isArray(param2);

            if (isArray) {
              parsedParam2 = param2.map(val => parseArrayNumber(val));
            } else {
              parsedParam2 = new Web3().toBigNumber(param2).toString();
            }
            return parsedParam2;
          }

        }
        return {
          name: abiItem.inputs[index].name,
          value: parsedParam,
          type: abiItem.inputs[index].type
        };
      })
    }
  }
}

function padZeros(address) {
  var formatted = address;
  if (address.indexOf('0x') != -1) {
    formatted = address.slice(2);
  }

  if (formatted.length < 40) {
    while (formatted.length < 40) formatted = "0" + formatted;
  }

  return "0x" + formatted;
};

function _decodeLogs(logs) {
  return logs.map(function (logItem) {
    const methodID = logItem.topics[0].slice(2);
    let method = state.methodIDs[methodID];
    if (method) {

      ///////////////////////////

      /* overload hack (indexed vs non-indexed), just assume first topic.length args are indexed */

      //check if we have indexd topics, but ABI doesn't have indexed
      const isIndexed = logItem.topics && logItem.topics.length > 1 && !method.inputs.reduce((acc, inp) => { return (acc || inp.indexed); }, false);
      if (isIndexed) {
        for (let i = 0; i < method.inputs.length; i++) {
          let name = method.inputs[i].name;
          if (name == 'token' || name == 'user' || name == 'tokenGet' || name == 'tokenGive' || name == 'get' || name == 'give') {
            method.inputs[i].indexed = true;
          }
        }
      }

      ///////////////////////////


      const logData = logItem.data;
      let decodedParams = [];
      let dataIndex = 0;
      let topicsIndex = 1;

      let dataTypes = [];
      method.inputs.map(
        function (input) {
          if (!input.indexed) {
            dataTypes.push(input.type);
          }
        }
      );
      //const decodedData = SolidityCoder.decodeParams(dataTypes, logData.slice(2));
      const decodedData = Interface.decodeParams(dataTypes, logData);
      // Loop topic and data to get the params
      method.inputs.map(function (param) {
        var decodedP = {
          name: param.name,
          type: param.type
        };

        if (param.indexed) {
          decodedP.value = logItem.topics[topicsIndex];
          topicsIndex++;
        }
        else {
          decodedP.value = decodedData[dataIndex];
          dataIndex++;
        }

        if (param.type == "address") {
          decodedP.value = padZeros(new Web3().toBigNumber(decodedP.value).toString(16));
        }
        else if (param.type == "uint256" || param.type == "uint8" || param.type == "int") {
          decodedP.value = new Web3().toBigNumber(decodedP.value).toString(10);
        }

        decodedParams.push(decodedP);
      });

      ///////////////////////////

      /* restore hack above */
      if (isIndexed) {
        for (let i = 0; i < method.inputs.length; i++) {
          method.inputs[i].indexed = false;
        }
      }

      ///////////////////////////

      return {
        name: method.name,
        events: decodedParams,
        address: logItem.address,
        blockNumber: logItem.blockNumber,
        hash: logItem.transactionHash,
      };
    }
  });
}

module.exports = {
  getABIs: _getABIs,
  addABI: _addABI,
  getMethodIDs: _getMethodIDs,
  decodeMethod: _decodeMethod,
  decodeLogs: _decodeLogs,
  removeABI: _removeABI
};
