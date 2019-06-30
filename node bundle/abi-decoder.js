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

        function parseTuple(param2, arrayDepth, parent = undefined) {
          if (arrayDepth > 0) {
            return param2.map((x) => {
              return parseTuple(x, arrayDepth - 1);
            });
          } else {

            return param2.map(function (val, index2) {
              let currentContext = undefined;
              if (!parent) {
                currentContext = abiItem.inputs[index].components[index2];
              } else {
                currentContext = parent.components[index2];
              }

              let type = currentContext.type;
              if (type.indexOf("uint") == 0 || type.indexOf("int") == 0) {
                val = parseArrayNumber(val);
              } else if (type.indexOf('tuple') == 0) {
                //recursive on nested tuples
                val = parseTuple(val, ((type.match(/]/g) || []).length), currentContext);
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
  return logs.filter(log => log.topics.length > 0).map((logItem) => {
    const methodID = logItem.topics[0].slice(2);
    let method = state.methodIDs[methodID];
    if (method) {

      ///////////////////////////

      /* Quick code to handle event overloading (indexed vs non-indexed) 
        (ERC20 vs ERC721)  and (EtherDelta vs EnclavesDex) have events with the same signature, but a difference in indexed variables.
        If both ABIs are loaded, one of the 2 will fail to decode.
      */

      //check if we have indexed topics, but ABI doesn't have indexed
      const indexedTopicAmount = logItem.topics.length - 1; //topic[0] is standard, do - 1
      const indexedMethodAmount = method.inputs.reduce((acc, inp) => { return (acc + (inp.indexed ? 1 : 0)); }, 0);
      const changedIndexedArguments = [];
      let tokenIdIndex = -1;

      // more indexed values detected than known in ABI
      if (indexedTopicAmount > indexedMethodAmount) {
        let diff = indexedTopicAmount - indexedMethodAmount;
        for (let i = 0; i < method.inputs.length; i++) {
          //find param that isn't indexed and temporarily make it indexed
          if (!method.inputs[i].indexed) {
            let name = method.inputs[i].name;
            //filter on param names of known cases (EtherDelta vs EnclavesDex, Erc20 vs Erc721)
            if (name == 'token' || name == 'user' || name == 'tokenGet' || name == 'tokenGive' || name == 'get' || name == 'give'
              || name == 'src' || name == 'dst' || name == 'wad' || name == 'guy'
            ) {
              changedIndexedArguments.push(i);
              method.inputs[i].indexed = true;
              diff--;
            }
          }
          // 3 times indexed on transfer/approval is erc721 standard, erc20 uses 2 times
          if ((method.name == 'Transfer' || method.name == 'Approval') && method.inputs[i].name == 'wad' && indexedTopicAmount == 3 && indexedMethodAmount == 2) {
            //rename variable to detect this case in event handling
            method.inputs[i].name = 'tokenId';
            tokenIdIndex = i;
          }
          // stop if we changed enough indexed vars
          if (diff <= 0) {
            break;
          }
        }
      }
      // less indexed values detected than known in ABI
      else if (indexedMethodAmount > indexedTopicAmount) {
        let diff = indexedMethodAmount - indexedTopicAmount;
        for (let i = method.inputs.length - 1; i >= 0; i--) {
          //find param that is indexed and temporarily make it not indexed
          if (method.inputs[i].indexed) {
            let name = method.inputs[i].name;
            //filter on param names of known cases (EtherDelta vs EnclavesDex, Erc20 vs Erc721)
            if (name == 'token' || name == 'user' || name == 'tokenGet' || name == 'tokenGive' || name == 'get' || name == 'give'
              || name == 'src' || name == 'dst' || name == 'wad' || name == 'guy'
            ) {
              changedIndexedArguments.push(i);
              method.inputs[i].indexed = false;
              diff--;
            }
          }
          // 0 times indexed on transfer/approval is pre-erc721 standard like cryptokitties, erc20 uses 2 times indexed
          if ((method.name == 'Transfer' || method.name == 'Approval') && method.inputs[i].name == 'wad' && indexedTopicAmount == 0 && indexedMethodAmount == 2) {
            //rename variable to detect this case in event handling
            method.inputs[i].name = 'tokenId';
            tokenIdIndex = i;
          }
          // stop if we changed enough indexed vars
          if (diff <= 0) {
            break;
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
      if (changedIndexedArguments.length > 0) {
        for (let i = 0; i < changedIndexedArguments.length; i++) {
          let index = changedIndexedArguments[i];
          //restore indexed boolean to the 'before' value
          method.inputs[index].indexed = !method.inputs[index].indexed;
        }
      }
      if (tokenIdIndex !== -1) {
        //revert name change on abi itself
        if (method.inputs[tokenIdIndex].name == 'tokenId') {
          method.inputs[tokenIdIndex].name = 'wad';
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
