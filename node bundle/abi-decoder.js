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
        const signature = new Web3().sha3(_getSignature(abi));
        if (abi.type == "event") {
          state.methodIDs[signature.slice(2)] = abi;
        } else {
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

// get an unhashed function signature 'function(address,uin256)'
function _getSignature(abiItem) {
  if (abiItem.name) {
    return abiItem.name + '(' + _concatInput(abiItem.inputs, false) + ')';
  } else {
    throw new Error("Expected a function or event name");
  }
}

// get a string of types in a function/event definition
// The 'tuple' word for structs is omitted in function signatures, but used in decoding
function _concatInput(inputArray, addTupleKeyword) {

  inputArray = inputArray.map(function (input) {
    //check for structs (tuple in abi)
    if (input.type.indexOf('tuple') === -1) {
      return input.type;
    } else {
      let type = '(' + _concatInput(input.components, addTupleKeyword) + ')';
      if (addTupleKeyword) {
        type = 'tuple' + type;
      }
      //adjust for tuple arrays  "tuple[]", "tuple[][]"
      let length = input.type.length - 5;
      while (length >= 2) {
        type += "[]";
        length -= 2;
      }
      return type;
    }
  });
  return inputArray.join(',');
}


// get array of abi input types, with tuples as string 'tuple(uint256,address)'
function _getInputTypes(inputArray) {

  return inputArray.map(function (input) {
    if (input.type.indexOf('tuple') === -1) {
      return input.type;
    } else {
      return _concatInput([input], true);
    }
  });
}

function _removeABI(abiArray) {
  if (Array.isArray(abiArray)) {

    // Iterate new abi to generate method id's
    abiArray.map(function (abi) {
      if (abi.name) {
        const signature = new Web3().sha3(_getSignature(abi));
        if (abi.type == "event") {
          if (state.methodIDs[signature.slice(2)]) {
            delete state.methodIDs[signature.slice(2)];
          }
        } else {
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
    const params = _getInputTypes(abiItem.inputs);
    let decoded = Interface.decodeParams(params, '0x' + data.slice(10));

    return {
      name: abiItem.name,
      params: decoded.map(function (param, index) {
        let parsedParam = param;
        let paramType = abiItem.inputs[index].type;
        const isUint = paramType.indexOf("uint") == 0;
        const isInt = paramType.indexOf("int") == 0;
        const isTuple = paramType.indexOf("tuple") == 0;

        if (isUint || isInt) {
          parsedParam = parseArrayNumber(param);
        } else if (isTuple) {
          let depth = (paramType.match(/]/g) || []).length;
          parsedParam = parseTuple(parsedParam, depth);
        }

        function parseTuple(param2, arrayDepth) {
          if (arrayDepth > 0) {
            return param2.map((x) => {
              return parseTuple(x, arrayDepth - 1);
            });
          } else {
            return param2.map((val, index2) => {
              let type = abiItem.inputs[index].components[index2].type;
              if (type.indexOf("uint") == 0 || type.indexOf("int") == 0) {
                val = parseArrayNumber(val);
              } else if(type.indexOf('tuple') !== -1) {
                  //recursive on nested tuples
                val = parseTuple(val, ((type.match(/]/g) || []).length));
              }
              return {
                name: abiItem.inputs[index].components[index2].name,
                value: val,
                type: abiItem.inputs[index].components[index2].type,
              };
            });
          }
        }

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

      /* Quick code to handle event overloading (indexed vs non-indexed) 
        EtherDelta & EnclavesDex have similar events with the same signature, but a difference in indexed variables.
        If both ABIs are loaded, one of the 2 will fail to decode.
      */

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
            let type = _getInputTypes([input])[0];
            dataTypes.push(type);
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

      /* Restore overloading indexed 'hack' */
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
