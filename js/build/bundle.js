(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.bundle = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const BigNumber = require('bignumber.js'); //keep classic bigNumber for legacy reasons instead of ether BN.js

//use @ethersproject to reduce the amount of npm packages included
const abiCoder = require("./ethersWrapper.js").utils.defaultAbiCoder;
const Fragment = require("./ethersWrapper.js").utils.Fragment;
const sha3 = require("./ethersWrapper.js").utils.id;
const abiCoder2 = require("./ethersWrapper.js").legacy.utils.defaultAbiCoder;

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

      //if we get a 'human-readable-abi' signature, convert it to a classic ABI object
      if (typeof abi === 'string') {
        try {
          let abiString = Fragment.fromString(abi).format('json');
          abi = JSON.parse(abiString);
        } catch (e) {
          abi = {};
        }
      }

      if (abi.name) {
        const signature = sha3(_getSignature(abi));
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
        const signature = sha3(_getSignature(abi));
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
    let decoded = undefined;

    try {
      decoded = abiCoder.decode(params, '0x' + data.slice(10), true); //true for loose decoding
      //turn ethers arrayish object into array
      {
        delete decoded['__length__'];
        decoded = Object.values(decoded);
      }
    } catch (e) {
      // try a legacy ethers v4 decoder for badly formatted data that fails in v5 but not v4
      decoded = abiCoder2.decode(params, '0x' + data.slice(10));
    }

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
            parsedParam2 = new BigNumber(param2).toString();
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
      let decodedData = undefined;
      try {
        decodedData = abiCoder.decode(dataTypes, logData, true);  //true for loose decoding
      } catch (e) {
        // backup attempt with legacy ethers v4 decoder, parses some data that v5 errors on.
        decodedData = abiCoder2.decode(dataTypes, logData);
      }
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
          decodedP.value = padZeros(new BigNumber(decodedP.value).toString(16));
        }
        else if (param.type == "uint256" || param.type == "uint8" || param.type == "int") {
          decodedP.value = new BigNumber(decodedP.value).toString(10);
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

},{"./ethersWrapper.js":"/ethersWrapper.js","bignumber.js":"bignumber.js"}],2:[function(require,module,exports){
let config = require('./config.js');

//const Ethers = require('ethers');
const Ethers = require('./ethersWrapper.js');

const BigNumber = require('bignumber.js');
BigNumber.config({ ERRORS: false });

const deltaBalances = new DeltaBalances();
const utility = require('./utility.js')(deltaBalances);



function DeltaBalances() {
    this.uniqueTokens = {};
    this.connection = undefined;
    this.secondsPerBlock = 14;

    // create the providers used in the ethers.js defaultProvider
    let providers = [
        new Ethers.providers.EtherscanProvider("homestead", config.etherscanAPIKey),
        new Ethers.providers.InfuraProvider("homestead", config.infuraKey),
        new Ethers.providers.AlchemyProvider("homestead", config.alchemyKey),
        new Ethers.providers.CloudflareProvider(),
    ];

    // possibly create some more providers based on public urls
    try {
        config.jsonRpcUrls.forEach(url => {
            let prov = new Ethers.providers.StaticJsonRpcProvider(url, "homestead");
            if (prov) {
                providers.push(prov);
            }
        });
    } catch (_) { }

    //filter out any undefined providers and turn them into providerConfig
    providers = providers.filter(p => p && Ethers.providers.Provider.isProvider(p));
    let providerConfigs = providers.map(p => {
        return { provider: p, weight: 1, stallTimeout: config.providerTimeout, priority: 1 };
    });

    //create a fallbackprovider using the above providers
    this.provider = new Ethers.providers.FallbackProvider(providerConfigs, 1);

    this.contractDeltaBalance = undefined;
    this.socket = null;
    this.socketConnected = false;
    this.config = config;
    this.binanceMap = {};
}

DeltaBalances.prototype.socketTicker = function socketTicker(callback, rqid) {
    let _delta = this;

    if (!_delta.socketConnected) {
        _delta.connectSocket(() => {
            getMarket();
        });
    }
    else {
        getMarket();
    }

    function getMarket() {
        _delta.socket.emit('getMarket', {});
        _delta.socket.once('market', (market) => {
            callback(null, market.returnTicker, rqid);
        });
    }
};

DeltaBalances.prototype.connectSocket = function connectSocket(callbackConnect, callBackNotifications) {
    let _delta = this;
    let socketURL = this.config.socketURL;
    this.socket = io.connect(socketURL, {
        transports: ['websocket'],
        'reconnection': true,
        'reconnectionDelay': 250,
        'reconnectionAttempts': 5
    });

    this.socket.on('connect', () => {
        console.log('socket connected');
        _delta.socketConnected = true;
        if (callbackConnect) {
            callbackConnect();
        }
    });

    this.socket.on('disconnect', () => {
        _delta.socketConnected = false;
        console.log('socket disconnected');
    });

    if (callBackNotifications) {
        this.socket.on('orders', (orders) => {
            callBackNotifications('orders', orders);
        });
        this.socket.on('funds', (funds) => {
            callBackNotifications('funds', funds);
        });
        this.socket.on('trades', (trades) => {
            callBackNotifications('trades', trades);
        });
    }

	/*	setTimeout(() => {
			if(!this.socketConnected)
				this.connectSocket(callbackConnect);
	}, 7000);	
	*/
}

DeltaBalances.prototype.dialogInfo = function dialogInfo(message) {
    console.log(message);
};

DeltaBalances.prototype.dialogError = function dialogError(message) {
    console.log(message);
};

DeltaBalances.prototype.alertSuccess = function alertSuccess(message) {
    console.log(message);
};

DeltaBalances.prototype.addressLink = function addressLink(address) {
    return utility.addressLink(address, false, false);
};


DeltaBalances.prototype.divisorFromDecimals = function (decimals) {
    var result = 1000000000000000000;
    if (decimals !== undefined) {
        result = Math.pow(10, decimals);
    }
    return utility.toBigNumber(result);
}

DeltaBalances.prototype.loadWeb3 = function loadWeb3(wait, callback) {
    this.config = config;
    let completed = false;

    //check current blockNumber
    utility.blockNumber((error, result) => {
        if (!error && result) {
            const block = Number(result);
            if (block > blocknum) {
                blocknum = block;
                console.log(`block: ${block}`);
            }
            if (!completed) {
                completed = true;
                callback();
            }
        }
    });

    setTimeout(function () {
        if (!completed) {
            console.log('Web3 timed out');
            completed = true;
            callback();
        }
    }, 2000);
};


DeltaBalances.prototype.initContracts = function initContracts(callback) {
    let _delta = this;
    this.config = config;

    // load contract
    utility.loadContract(
        _delta.config.ABIs.DeltaBalances,
        _delta.config.DeltaBalanceAddr,
        (err, contractDeltaBalance) => {
            _delta.contractDeltaBalance = contractDeltaBalance;
            callback();
        }
    );
};

DeltaBalances.prototype.initTokens = function () {

    //init known bancor smartRelay tokens (smartRelays 'addr': name)
    let smartKeys = Object.keys(smartRelays).map(x => x.toLowerCase());
    let smartrelays = Object.values(smartRelays);

    for (var i = 0; i < smartrelays.length; i++) {
        if (!this.uniqueTokens[smartKeys[i]]) {
            let token = { addr: smartKeys[i], name: smartrelays[i], decimals: 18, unlisted: true, blocked: 2 };
            this.uniqueTokens[token.addr] = token;
        }
    }

    let _delta = this;
    //format list of all tokens like ED tokens
    offlineCustomTokens = offlineCustomTokens.map((x) => {
        let unlisted = true;
        if (x.a && x.s) {
            let addr = x.a.toLowerCase();
            //make sure WETH appears listed 
            if (utility.isWrappedETH(addr) /*|| utility.isNonEthBase(addr)*/) {
                unlisted = false;
            }
            var token = {
                "name": utility.escapeHtml(x.s), /*x.symbol */
                "addr": addr,
                "unlisted": unlisted,
                "decimals": x.d,
            };
            if (x.n) {
                token.name2 = utility.escapeHtml(x.n);
            }
            if (x.lock) {
                token.locked = true;
            }
            if (x.block) {
                token.blocked = x.block;
            }
            if (x.old) {
                token.old = true;
            }
            if (x.warn) {
                token.warning = true;
            }
            if (x.kill) {
                token.killed = true;
            }
            if (x.inactive) {
                token.inactive = true;
            }
            if (x.spam) {
                token.spam = true;
            }
            if (x.blockIDEX) {
                token.blockIDEX = true;
            }
            if (x.blockFork) {
                token.blockFork = true;
            }

            for (let i = 0; i < _delta.config.listedExchanges.length; i++) {
                let exchange = _delta.config.listedExchanges[i];
                if (x[exchange]) {
                    token[exchange] = x[exchange];
                    if (!(x.blockIDEX && exchange == 'IDEX') || !(x.blockFork && exchange == 'ForkDelta')) {
                        token.unlisted = false;
                    }
                }
            }
            return token;
        } else {
            return undefined;
        }
    });

    // register all tokens (nearly all unlisted)
    for (var i = 0; i < offlineCustomTokens.length; i++) {
        var token = offlineCustomTokens[i];
        if (token) {
            if (token.Binance) {
                //mapping for Binance API and urls
                this.binanceMap[token.Binance] = token.addr;
            }
            if (this.uniqueTokens[token.addr]) {
                if (!token.unlisted) {
                    this.uniqueTokens[token.addr].unlisted = false;
                }
            }
            else {
                this.uniqueTokens[token.addr] = token;
            }
        }
    }

    loadCachedTokens('ForkDelta');
    loadCachedTokens('DDEX');
    loadCachedTokens('IDEX');
    loadCachedTokens('Kyber');
    loadCachedTokens('OneInch');

    try {
        //unknown tokens saved from etherscan responses
        for (var i = 0; i < unknownTokenCache.length; i++) {
            var token = unknownTokenCache[i];
            if (token.name && token.name !== "") {
                token.addr = token.addr.toLowerCase();
                token.name = utility.escapeHtml(token.name);
                token.decimals = Number(token.decimals);
                if (token.name2) {
                    token.name2 = utility.escapeHtml(token.name2);
                }
                token.unlisted = true;
                if (this.uniqueTokens[token.addr]) {
                    if (token.name2 && token.name !== token.name2 && !this.uniqueTokens[token.addr].name2) {
                        this.uniqueTokens[token.addr].name2 = token.name2;
                    }
                }
                else {
                    this.uniqueTokens[token.addr] = token;
                }
            }
        }
    } catch (e) {
        console.log('failed to parse unknown token list');
    }


    {  //init internal uniswap tokens
        let uniKeys = Object.keys(this.config.uniswapContracts).map(x => x.toLowerCase());
        let uniTokens = Object.values(this.config.uniswapContracts).map(x => x.toLowerCase()); //tokens traded on the contracts
        for (let i = 0; i < uniKeys.length; i++) {
            if (!this.uniqueTokens[uniKeys[i]]) {
                let name = 'UNI-V1';
                if (this.uniqueTokens[uniTokens[i]]) {
                    name += ' (' + this.uniqueTokens[uniTokens[i]].name + ')';
                }
                let token = { addr: uniKeys[i], name: name, decimals: 18, unlisted: true, blocked: 1 };
                this.uniqueTokens[token.addr] = token;
            }
        }
    }

    //erc721 tokens
    if (offlineCollectibleTokens) {
        try {
            let erc721Tokens = offlineCollectibleTokens.map(t => {
                let tok = {
                    addr: t.a.toLowerCase(),
                    name: utility.escapeHtml(t.s),
                    decimals: 0,
                    unlisted: true,
                    erc721: true
                };
                if (t.n) {
                    tok.name2 = utility.escapeHtml(t.n);
                }
                return tok;
            });
            for (let i = 0; i < erc721Tokens.length; i++) {
                let token = erc721Tokens[i];
                this.uniqueTokens[token.addr] = token;
            }
        } catch (e) {
            console.log('error loading erc721 tokens: ' + e);
        }
    }


    let ethAddr = this.config.ethAddr;

    //legacy token lists, still used in allowances.js, TODO get rid of them
    this.config.customTokens = Object.values(_delta.uniqueTokens).filter((x) => { return ((!x.unlisted || !x.blocked) && !x.killed && !x.erc721); });
    let listedTokens = Object.values(_delta.uniqueTokens).filter((x) => { return (!x.unlisted && !x.killed && x.addr !== ethAddr && !x.erc721); });
    this.config.tokens = [this.uniqueTokens[ethAddr]].concat(listedTokens);

    // token list used in balances.js
    this.config.balanceTokens = Object.values(_delta.uniqueTokens).filter((x) => { return (!x.killed && !x.erc721 && (!x.blocked || x.blocked < 2)) });

    function loadCachedTokens(exchangeName) {
        if (exchangeTokens && exchangeName) {
            try {
                let lowercase = exchangeName.toLowerCase();
                let exTokens = exchangeTokens[lowercase];
                if (exTokens && exTokens.length > 0) {
                    for (let i = 0; i < exTokens.length; i++) {
                        let tok = exTokens[i];
                        if (tok) {
                            // these 2 use { addr: , name:, decimals}
                            if (lowercase == 'etherdelta' || lowercase == 'forkdelta') {
                                tok.symbol = tok.name;
                                tok.address = tok.addr;
                                delete tok.name;
                                if (tok.fullName && tok.fullName !== "") { //forkdelta uses fullName
                                    tok.name = tok.fullName;
                                }
                            }

                            //legacy format, symbol is called 'name',  name is called 'name2'
                            let token = {};
                            token.addr = utility.escapeHtml(tok.address.toLowerCase());
                            token.name = utility.escapeHtml(tok.symbol); // escape nasty stuff in token symbol/name
                            if (tok.name) {
                                token.name2 = utility.escapeHtml(tok.name);
                            }

                            token.decimals = Number(tok.decimals);
                            token[exchangeName] = token.name.toUpperCase();

                            //do we already know this token?
                            if (_delta.uniqueTokens[token.addr]) {
                                _delta.uniqueTokens[token.addr][exchangeName] = token.name;
                                // make the token listed, except for a special case for idex
                                if (!(_delta.uniqueTokens[token.addr].blockIDEX && exchangeName == 'IDEX')
                                    && !(_delta.uniqueTokens[token.addr].blockFork && exchangeName == 'ForkDelta')) {
                                    _delta.uniqueTokens[token.addr].unlisted = false;
                                }

                                // we found a new name ('name2') for this token
                                if (token.name2 && token.name !== token.name2 && !_delta.uniqueTokens[token.addr].name2) {
                                    _delta.uniqueTokens[token.addr].name2 = token.name2;
                                }

                            }
                            //we don't know this token
                            else if (exchangeName !== 'TokenStore') { //avoid TS as they don't include decimals

                                // special case for idex tokens that are no longer listed but returned by API
                                if (exchangeName == 'IDEX' && tok.blockIDEX) {
                                    token.unlisted = true;
                                } else {
                                    token.unlisted = false;
                                }
                                _delta.uniqueTokens[token.addr] = token;
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('failed to parse ' + exchangeName + ' token list');
            }
        }
    }
}

//return a erc20 / erc721 token for a token address, even if we don't know that token
DeltaBalances.prototype.setToken = function (address) {
    address = address.toLowerCase();
    if (address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') //kyber uses eeeee for ETH
        address = this.config.ethAddr;
    //do we know the token?    
    if (this.uniqueTokens[address]) {
        return this.uniqueTokens[address];
    } else {
        //regular address without apended '-'?
        if (address.indexOf('-') == -1) {
            //return a placeholder erc20 token

            //TODO get decimals get symbol
            return { addr: address, name: '???', unknown: true, decimals: 18, unlisted: true };

        } else {
            //it is an erc721 token with appended id

            let split = address.split('-');
            address = split[0];
            let id = split[1];
            let idAddress = address + '-' + id;

            if (this.uniqueTokens[idAddress]) {
                return this.uniqueTokens[idAddress];
            } else {
                let baseToken = undefined;
                if (this.uniqueTokens[address]) {
                    baseToken = this.uniqueTokens[address];
                    baseToken.unknown = false;
                } else {
                    baseToken = {
                        unknown: true,
                        unlisted: true,
                        name: '???',
                    };
                }
                return {
                    addr: address,
                    name: baseToken.name,
                    name2: baseToken.name2 ? baseToken.name2 : undefined,
                    unknown: baseToken.unknown,
                    decimals: 0,
                    unlisted: baseToken.unlisted,
                    erc721: true,
                    erc721Id: id
                };
            }
        }
    }
};

DeltaBalances.prototype.processUnpackedInput = function (tx, unpacked) {
    if (tx.data && !tx.input) {
        tx.input = tx.data;
    }
    if (!tx || !tx.input) {
        return undefined;
    }

    if (tx.input && tx.input === 'depracated') {
        //etherscan token transfer, no input available
        return undefined;
    }
    if (tx.contractAddress) {
        console.log('unexpected tx input from transfer logs.')
        return undefined;
    }

    var _delta = this;

    try {
        var txFrom = tx.from.toLowerCase();
        var txTo = tx.to.toLowerCase();

        if (unpacked && unpacked.name) {


            // erc20 token transfer
            // erc721 token transfer, transferFrom
            // erc721 transferFrom(from, to tokenId) safeTranferFrom
            if (unpacked.name === 'transfer' || unpacked.name === 'transferFrom' || unpacked.name === 'safeTransferFrom') {
                let to = undefined;
                let from = undefined;
                let rawAmount = undefined;
                let amount = utility.toBigNumber(0);
                let token = this.setToken(tx.to);

                if (unpacked.name === 'transfer') {
                    to = unpacked.params[0].value.toLowerCase();
                    rawAmount = unpacked.params[1].value;
                    from = txFrom;
                } else { // (safe)transferFrom
                    to = unpacked.params[1].value.toLowerCase();
                    rawAmount = unpacked.params[2].value;
                    from = unpacked.params[0].value.toLowerCase();
                }
                if (token && token.addr) {
                    //erc20 token transfer. valid erc721 has no 'transfer', but some like cryptokitties do
                    // transferFrom is not commonly used in erc20 directly from a wallet
                    if ((unpacked.name === 'transferFrom' && !token.unknown && !token.erc721) ||
                        (unpacked.name === 'transfer' && !token.erc721)) {
                        amount = utility.weiToToken(rawAmount, token);
                    }
                    //erc721 token 
                    else { // transfer erc721, safeTransferFrom, transferFrom unknown token
                        amount = utility.toBigNumber(1);
                        // set token to unique erc721 token ID, id field matches amount in erc20
                        token = this.setToken(token.addr + '-' + rawAmount);
                    }
                }

                return {
                    'type': 'Transfer',
                    'note': 'Give the token contract the order to transfer your tokens',
                    'token': token,
                    'amount': amount,
                    'from': from,
                    'to': to,
                    'unlisted': token.unlisted,
                };
            }
            // erc20 token approve
            // erc721 token approve
            else if (unpacked.name === 'approve') {
                var sender = unpacked.params[0].value;
                var rawAmount = unpacked.params[1].value;
                var amount = utility.toBigNumber(0);
                var token = this.setToken(tx.to);

                if (token && token.addr) {
                    if (!token.erc721) {
                        amount = utility.weiToToken(rawAmount, token);
                    } else {
                        amount = utility.toBigNumber(1);
                        // set token to unique erc721 token ID, id field matches amount in erc20
                        token = this.setToken(token.addr + '-' + rawAmount);
                    }
                }

                let exchange = this.getExchangeName(sender, 'unknown ');

                return {
                    'type': 'Approve',
                    'exchange': exchange,
                    'note': 'Approve ' + exchange + 'to move tokens for you.',
                    'token': token,
                    'amount': amount,
                    'from': txFrom,
                    'to': sender,
                    'unlisted': token.unlisted,
                };
            }
            //ERC721 enable approve
            else if (unpacked.name === 'setApprovalForAll') {
                var sender = unpacked.params[0].value;
                var all = unpacked.params[1].value;
                var token = this.setToken(tx.to);
                if (!token.erc721) {
                    token.erc721 = true;
                    token.decimals = 0;
                    this.uniqueTokens[token.addr] = token;
                }

                let exchange = this.getExchangeName(sender, 'unknown ');

                return {
                    'type': 'Approve',
                    'exchange': exchange,
                    'note': 'Approve ' + exchange + 'to move any tokenIDs for you.',
                    'token': token,
                    'amount': all ? 'All' : 0,
                    'from': txFrom,
                    'to': sender,
                    'unlisted': token.unlisted,
                };
            }
            // exchange deposit/withdraw ETH (etherdelta, idex deposit, tokenstore, ethen, switcheo deposit) 
            // wrap  0x ETH->WETH, wrap ethfinex lockTokens. (un)wrapping
            else if ((unpacked.name === 'deposit' && (unpacked.params.length == 0 || unpacked.params[0].name !== 'token'))
                || (unpacked.name === 'withdraw' && unpacked.params[0].name !== 'token' && unpacked.params.length < 9 && unpacked.params[0].name !== 'withdrawal')
                || unpacked.name === 'withdrawEther' || unpacked.name === 'depositEther') {
                var type = '';
                var note = '';
                var rawVal = utility.toBigNumber(0);
                var token = undefined;
                var base = undefined;
                var exchange = '';

                //deposit / wrapping
                if (unpacked.name === 'deposit' || unpacked.name === 'depositEther') {

                    // Wrap ETH to WETH or ETH-W
                    if (utility.isWrappedETH(tx.to)) {
                        rawVal = utility.toBigNumber(tx.value);
                        type = 'Wrap ETH';
                        note = 'Wrap ETH to WETH';
                        token = this.setToken(this.config.ethAddr);
                        base = this.setToken(tx.to);
                    }
                    // Wrap erc20 token into lockable ethfinex token
                    else if (unpacked.params.length == 2 && unpacked.params[1].name == '_forTime') {
                        rawVal = utility.toBigNumber(unpacked.params[0].value);
                        base = this.setToken(tx.to);
                        // TODO find token in recent tx?

                        let wrapName = base.name;
                        if (wrapName.indexOf('-W') > 0) {
                            wrapName = wrapName.slice(0, wrapName.length - 2);
                        } else {
                            wrapName = wrapName.slice(0, wrapName.length - 1);
                        }
                        type = 'Wrap ' + wrapName;
                        note = 'Wrap a token to  lockable token for Ethfinex';
                    }
                    // ETH deposit into exchange (etherdelta, idex, tokenstore & more)
                    else {
                        type = 'Deposit';
                        token = this.setToken(this.config.ethAddr);
                        rawVal = utility.toBigNumber(tx.value);
                        exchange = this.getExchangeName(txTo, 'unknown');
                        if (exchange === 'unknown') {
                            note = 'Deposit ETH into ' + exchange;
                        } else {
                            note = 'Deposit ETH into the exchange contract';
                        }
                    }
                }
                //withdraw / unwrapping
                else {
                    rawVal = unpacked.params[0].value;
                    // unwrap WETH or ETHW
                    if (utility.isWrappedETH(tx.to)) {
                        type = 'Unwrap ETH';
                        note = 'Unwrap WETH to ETH';
                        token = this.setToken(tx.to);
                        base = this.setToken(this.config.ethAddr);
                    }
                    //unwrap ethfinex wrapped token
                    else if (unpacked.params.length == 5 && unpacked.params[4].name == "signatureValidUntilBlock") {
                        rawVal = utility.toBigNumber(unpacked.params[0].value);
                        token = this.setToken(txTo);
                        // TODO find base token?

                        let wrapName = token.name;
                        if (wrapName.indexOf('-W') > 0) {
                            wrapName = wrapName.slice(0, wrapName.length - 2);
                        } else {
                            wrapName = wrapName.slice(0, wrapName.length - 1);
                        }
                        type = 'Unwrap ' + wrapName;
                        note = 'Unwrap a lockable Ethfinex token';
                    }
                    //withdraw from exchange
                    else {
                        type = 'Withdraw';
                        token = this.setToken(this.config.ethAddr);
                        exchange = this.getExchangeName(txTo, 'unknown');
                        if (exchange === 'unknown') {
                            note = 'Request ' + exchange + ' to withdraw ETH';
                        } else {
                            note = 'Request the exchange contract to withdraw ETH';
                        }
                    }
                }

                var amount = undefined;
                if (token) {
                    amount = utility.weiToToken(rawVal, token);
                } else if (base) {
                    amount = utility.weiToToken(rawVal, base);
                }

                if (type.indexOf('rap') === -1) {
                    //deposit / withdraw
                    return {
                        'type': type,
                        'exchange': exchange,
                        'token': token,
                        'note': note,
                        'amount': amount,
                    };
                } else {
                    //wrap / unwrap
                    return {
                        'type': type,
                        'token In': token,
                        'token Out': base,
                        'note': note,
                        'amount': amount,
                    };
                }
            }
            // exchange erc20 deposit / withdraw
            else if (unpacked.name === 'depositToken' || unpacked.name === 'withdrawToken' || unpacked.name === 'directWithdrawal' || unpacked.name === 'depositWrappedEther'
                || /* enclaves */ unpacked.name === 'withdrawBoth' || unpacked.name === 'depositBoth'
                || (unpacked.name === 'withdraw' && unpacked.params.length == 2 && unpacked.params[0].name === 'token')
                || (unpacked.name === 'deposit' && unpacked.params.length == 2 && unpacked.params[0].name === 'token')
                || unpacked.name == 'multiSigWithdrawal'
                || unpacked.name == 'depositTokenByAddress'
            ) {
                let token = undefined;
                let valueIndex = 1;
                if (unpacked.name === 'depositWrappedEther') {
                    token = this.setToken('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'); //WETH
                    valueIndex = 0;
                } else {
                    token = this.setToken(unpacked.params[0].value);
                }

                if (token && token.addr) {
                    var amount = utility.weiToToken(unpacked.params[valueIndex].value, token);
                    var type = '';
                    var note = '';
                    let exchange = this.getExchangeName(txTo, '');

                    if (unpacked.name === 'withdrawToken' || unpacked.name === 'withdrawBoth' || unpacked.name === 'withdraw' || unpacked.name === 'directWithdrawal' || unpacked.name == 'multiSigWithdrawal') {
                        type = 'Withdraw';
                        if (exchange) {
                            note = 'Request ' + exchange + ' contract to withdraw ' + token.name;
                        } else {
                            note = 'Request the exchange to withdraw ' + token.name;
                        }
                    }
                    else {
                        type = 'Deposit';
                        if (exchange) {
                            note = 'Request the ' + exchange + ' contract to deposit ' + token.name;
                        } else {
                            note = 'Request the exchange contract to deposit ' + token.name;
                        }
                    }

                    if (token.addr !== this.config.ethAddr) {
                        type = 'Token ' + type;
                    }
                    var obj = {
                        'type': type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': amount,
                        'unlisted': token.unlisted,
                    };

                    //enclaves dex , move tokens and ETH
                    if (unpacked.name === 'withdrawBoth' || unpacked.name === 'depositBoth') {
                        obj.type = 'Token & ETH ' + type;
                        obj.base = this.setToken(this.config.ethAddr);


                        let rawEthVal = utility.toBigNumber(0);
                        if (unpacked.name === 'withdrawBoth') {
                            rawEthVal = utility.toBigNumber(unpacked.params[2].value);
                        } else {
                            rawEthVal = utility.toBigNumber(tx.value);
                        }
                        let ethVal = utility.weiToEth(rawEthVal);
                        obj.baseAmount = ethVal;
                    }
                    return obj;
                }
            }
            //dex.blue signature withdraw
            else if (unpacked.name == 'userSigWithdrawal') {
                // amount is in packedData1, token id is in packedData2 
                let numData = unpacked.params[0].value.slice(0, 34); //0x + 32
                let amount = utility.hexToDec(numData);
                // 
                let tokenID = unpacked.params[1].value.slice(0, 6); //0x + 4

                //todo dex.blue token id to erc20 address

                let exchange = this.getExchangeName(txTo, '');
                return {
                    'type': "Withdraw",
                    'exchange': exchange,
                    'note': "Tokens withdrawn by admin",
                    'token': "",
                    'amount': "",
                    'unlisted': true,
                };
            }
            // Switcheo admin withdraw
            else if ((unpacked.name === 'withdraw' && unpacked.params.length == 9) || unpacked.name == 'emergencyWithdraw') {
                var token = this.setToken(unpacked.params[1].value);
                var feeToken = '';
                if (unpacked.name === 'withdraw') {
                    feeToken = this.setToken(unpacked.params[3].value);
                }
                if (token && token.addr) {
                    var rawAmount = utility.toBigNumber(unpacked.params[2].value);
                    var amount = utility.weiToToken(rawAmount, token);

                    var type = '';
                    var note = '';

                    var feeVal = utility.toBigNumber(0);

                    let exchange = this.getExchangeName(txTo, '');

                    if (feeToken && feeToken.addr) {
                        var rawFee = utility.toBigNumber(unpacked.params[4].value);
                        feeVal = utility.weiToToken(rawFee, feeToken);
                    }

                    if (token.addr !== this.config.ethAddr) {
                        type = 'Token Withdraw';
                        note = utility.addressLink(unpacked.params[2].value, true, true) + ' requested Switcheo to withdraw tokens';
                    } else {
                        type = 'Withdraw';
                        note = utility.addressLink(unpacked.params[2].value, true, true) + ' requested Switcheo to withdraw ETH';
                    }

                    return {
                        'type': type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': amount,
                        'to': unpacked.params[0].value.toLowerCase(),
                        'unlisted': token.unlisted,
                        'fee': feeVal,
                        'feeToken': feeToken,
                    };
                }
            }
            //Switcheo token deposit
            else if (unpacked.name == 'depositERC20') {
                var token = this.setToken(unpacked.params[1].value);
                if (token && token.addr) {
                    var amount = utility.weiToToken(unpacked.params[2].value, token);
                    var type = 'Deposit';

                    let exchange = this.getExchangeName(txTo, '');
                    var note = '';
                    if (exchange) {
                        note = 'Request the ' + exchange + ' contract to deposit ' + token.name;
                    } else {
                        note = 'Request the exchange contract to deposit ' + token.name;
                    }

                    var obj = {
                        'type': 'Token ' + type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': amount,
                        'unlisted': token.unlisted,
                    };
                    return obj;
                }
            }
            // cancel EtherDelta, decentrex, tokenstore
            else if (unpacked.name === 'cancelOrder' && unpacked.params.length > 3) {
                var cancelType = 'sell';
                var token = undefined;
                var base = undefined;

                let tokenGet = this.setToken(unpacked.params[0].value);
                let tokenGive = this.setToken(unpacked.params[2].value);

                let exchange = this.getExchangeName(txTo, '');

                if (this.isBaseToken(tokenGet, tokenGive)) {
                    cancelType = 'buy';
                    token = tokenGive;
                    base = tokenGet;
                }
                else //if (this.isBaseToken(tokenGive, tokenGet)) // buy
                {
                    token = tokenGet;
                    base = tokenGive;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);
                    if (cancelType === 'sell') {
                        rawAmount = utility.toBigNumber(unpacked.params[1].value);
                        rawBaseAmount = utility.toBigNumber(unpacked.params[3].value);
                    } else {
                        rawBaseAmount = utility.toBigNumber(unpacked.params[1].value);
                        rawAmount = utility.toBigNumber(unpacked.params[3].value);
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    return {
                        'type': 'Cancel ' + cancelType,
                        'exchange': exchange,
                        'note': 'Cancel an open order',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                    };
                }
            }
            //DDEX hydro (1.0, 1.1) cancel input  (untested, no actual cancel tx found)
            else if (unpacked.name === 'cancelOrder' && unpacked.params.length == 1 && unpacked.params[0].name == 'order' && unpacked.params[0].value.length == 8) {
                //cancelOrder(Order memory order)
                //Order(address trader, address relayer, address baseToken, address quoteToken, uint256 baseTokenAmount, uint256 quoteTokenAmount, uint256 gasTokenAmount, bytes32 data);
                /**
                * Data contains the following values packed into 32 bytes
                * ╔════════════════════╤═══════════════════════════════════════════════════════════╗
                * ║                    │ length(bytes)   desc                                      ║
                * ╟────────────────────┼───────────────────────────────────────────────────────────╢
                * ║ version            │ 1               order version                             ║
                * ║ side               │ 1               0: buy, 1: sell                           ║
                * ║ isMarketOrder      │ 1               0: limitOrder, 1: marketOrder             ║
                * ║ expiredAt          │ 5               order expiration time in seconds          ║
                * ║ asMakerFeeRate     │ 2               maker fee rate (base 100,000)             ║
                * ║ asTakerFeeRate     │ 2               taker fee rate (base 100,000)             ║
                * ║ makerRebateRate    │ 2               rebate rate for maker (base 100,000)      ║
                * ║ salt               │ 8               salt                                      ║
                * ║                    │ 10              reserved                                  ║
                * ╚════════════════════╧═══════════════════════════════════════════════════════════╝
                */

                let maker = unpacked.params[0].value[0].value.toLowerCase();
                let relayer = unpacked.params[0].value[1].value.toLowerCase();
                let base = _delta.setToken(unpacked.params[0].value[3].value);
                let token = _delta.setToken(unpacked.params[0].value[2].value);

                let rawBaseAmount = utility.toBigNumber(unpacked.params[0].value[5].value);
                let rawTokenAmount = utility.toBigNumber(unpacked.params[0].value[4].value);

                let rawData = unpacked.params[0].value[1].value.toLowerCase();
                let cancelType = rawData.slice(4, 6); // 0-1 is 0x,  2-3 is version, 4-5 side
                if (cancelType == '00') {
                    cancelType = 'buy';
                } else {
                    cancelType = 'sell';
                }

                let exchange = this.getExchangeName(relayer, 'Unknown DDEX');

                let amount = utility.weiToToken(rawTokenAmount, token);
                let baseAmount = utility.weiToToken(rawBaseAmount, base);

                let price = utility.toBigNumber(0);
                if (amount.greaterThan(0)) {
                    price = baseAmount.div(amount);
                }

                return {
                    'type': 'Cancel ' + cancelType,
                    'exchange': exchange,
                    'note': 'Cancel an open order',
                    'token': token,
                    'amount': amount,
                    'price': price,
                    'base': base,
                    'baseAmount': baseAmount,
                    'unlisted': token.unlisted,
                    'maker': maker,
                };
            }
            // 0x v1 v2 v3 cancel input
            else if (unpacked.name === 'cancelOrder' || unpacked.name === 'batchCancelOrders') {

                //check if this is the 0x v2 variant with structs
                let isV2 = unpacked.params[0].name == 'order' || unpacked.params[0].name == 'orders';
                // Convert v2 orders to matching v1 orders to re-use the old trade parsing
                if (isV2) {

                    if (unpacked.name == 'cancelOrder') {
                        let order = convert0xOrder(unpacked.params[0].value);
                        if (!order) {
                            return undefined;
                        }
                        unpacked.params[0].value = order.orderAddresses;
                        unpacked.params.push({ type: "uint256[]", value: order.orderValues });
                        unpacked.params.push({ type: "uint256", value: order.orderValues[1] });
                    } else if (unpacked.name == 'batchCancelOrders') {
                        let orders = unpacked.params[0].value;
                        let allOrderAdresses = [];
                        let allOrderValues = [];

                        let makerAsset = orders[0][10];
                        let takerAsset = orders[0][11];

                        for (let i = 0; i < orders.length; i++) {
                            // if orders past the 1st have no asset data, assume identical to the 1st
                            if (i > 0) {
                                if (orders[i][10] == '0x') {
                                    orders[i][10] = makerAsset;
                                }
                                if (orders[i][11] == '0x') {
                                    orders[i][11] = takerAsset;
                                }
                            }
                            let order = convert0xOrder(orders[i]);
                            if (order) {
                                allOrderAdresses.push(order.orderAddresses);
                                allOrderValues.push(order.orderValues);
                            }
                        }

                        if (allOrderAdresses.length == 0) {
                            return undefined;
                        }

                        let allTakeValues = allOrderValues.map((x) => {
                            return x[1];
                        });

                        unpacked.params[0].value = allOrderAdresses;
                        unpacked.params.push({ type: "uint256[][]", value: allOrderValues });
                        unpacked.params.push({ type: "uint256[]", value: allTakeValues });
                    }


                }// end if(isV2)



                var exchange = '';

                if (unpacked.name === 'cancelOrder') {
                    let orderAddresses1 = unpacked.params[0].value;
                    let orderValues1 = unpacked.params[1].value;
                    let cancelTakerTokenAmount1 = utility.toBigNumber(unpacked.params[2].value);

                    return unpack0xCancelInput(orderAddresses1, orderValues1, cancelTakerTokenAmount1);
                } else if (unpacked.name === 'batchCancelOrders') {
                    let orderAddresses2 = unpacked.params[0].value;
                    let orderValues2 = unpacked.params[1].value;
                    let cancelTakerTokenAmounts2 = unpacked.params[2].value.map(x => utility.toBigNumber(x));

                    var objs = [];
                    for (let i = 0; i < orderAddresses2.length; i++) {
                        var obj = unpack0xCancelInput(orderAddresses2[i], orderValues2[i], cancelTakerTokenAmounts2[i]);
                        if (obj)
                            objs.push(obj);
                    }
                    return objs;
                }


                function unpack0xCancelInput(orderAddresses, orderValues, cancelTakerTokenAmount) {
                    let maker = orderAddresses[0].toLowerCase();
                    let taker = orderAddresses[1].toLowerCase();  // taker defined in order, not tx sender
                    let makerToken = _delta.setToken(orderAddresses[2]);
                    let takerToken = _delta.setToken(orderAddresses[3]);

                    let makerAmount = utility.toBigNumber(orderValues[0]);
                    let takerAmount = utility.toBigNumber(orderValues[1]);

                    // fee is ZRX
                    //let feeCurrency = _delta.setToken('0xe41d2489571d322189246dafa5ebde1f4699f498');
                    //let makerFee = utility.weiToToken(orderValues[2], feeCurrency);
                    //let takerFee = utility.weiToToken(orderValues[3], feeCurrency);

                    let relayer = orderAddresses[4].toLowerCase();

                    //Check for empty relayer 0x000000 and try taker or sender (possible admin)
                    if (relayer === _delta.config.ethAddr) {
                        relayer = taker;
                        // use sender if 0xV2
                        if (orderAddresses.length >= 6) {
                            let sender = orderAddresses[5].toLowerCase();
                            if (sender !== maker && sender !== _delta.config.ethAddr) {
                                relayer = sender;
                            }
                        }
                    }

                    exchange = utility.relayName(relayer);
                    // orderValues[4] is expiry

                    var tradeType = 'Sell';
                    var token = undefined;
                    var base = undefined;

                    var nonETH = false;

                    if (_delta.isBaseToken(takerToken, makerToken)) // get eth  -> sell
                    {
                        tradeType = 'Buy';
                        token = makerToken;
                        base = takerToken;
                    }
                    else //if (_delta.isBaseToken(makerToken, takerToken)) // buy
                    {
                        token = takerToken;
                        base = makerToken;
                    }

                    if (token && base && token.addr && base.addr) {
                        var rawAmount = utility.toBigNumber(0);
                        var rawBaseAmount = utility.toBigNumber(0);
                        var chosenAmount = cancelTakerTokenAmount;
                        if (tradeType === 'Sell') {
                            rawAmount = takerAmount;
                            rawBaseAmount = makerAmount;
                        } else {
                            rawBaseAmount = takerAmount;
                            rawAmount = makerAmount;
                        }

                        var amount = utility.weiToToken(rawAmount, token);
                        var baseAmount = utility.weiToToken(rawBaseAmount, base);

                        var orderSize = utility.toBigNumber(0);
                        var price = utility.toBigNumber(0);
                        if (amount.greaterThan(0)) {
                            price = baseAmount.div(amount);
                        }

                        if (tradeType === 'Buy') {
                            orderSize = amount;
                            if (rawBaseAmount.greaterThan(chosenAmount)) {
                                baseAmount = utility.weiToToken(chosenAmount, base);
                                rawAmount = chosenAmount.div((rawBaseAmount.div(rawAmount)));
                                amount = utility.weiToToken(rawAmount, token);
                            }
                        } else {
                            orderSize = amount;
                            if (rawAmount.greaterThan(chosenAmount)) {
                                amount = utility.weiToToken(chosenAmount, token);
                                rawBaseAmount = (chosenAmount.times(rawBaseAmount)).div(rawAmount);
                                baseAmount = utility.weiToToken(rawBaseAmount, base);
                            }
                        }

                        // single units if erc721
                        if (token.erc721) {
                            amount = utility.toBigNumber(1);
                            baseAmount = amount.times(price);
                        }
                        if (base.erc721) {
                            baseAmount = utility.toBigNumber(1);
                        }
                        if (token.erc721 && base.erc721) {
                            price = utility.toBigNumber(1);
                        }

                        return {
                            'type': 'Cancel ' + tradeType.toLowerCase(),
                            'exchange': exchange,
                            'note': utility.addressLink(maker, true, true) + 'Cancels an open order in the orderbook.',
                            'token': token,
                            'amount': amount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'order size': orderSize,
                            'unlisted': token.unlisted,
                            'relayer': relayer
                        };

                    }
                }
            }
            //0x v2,v3 function called with signed data, from sender != signer
            else if (unpacked.name == 'executeTransaction') {

                let signer = undefined;
                let txData = undefined;
                //v2 (salt, signer, data, signature)    
                //v3( transaction[salt, expire, gas, signer, data], signature)
                //v3 coordinator executeTransaction(transaction, txOrigin,transactionSignature,approvalSignatures)
                if (unpacked.params[0].name == 'transaction') {
                    signer = unpacked.params[0].value[3].value.toLowerCase();
                    txData = unpacked.params[0].value[4].value;
                } else {
                    signer = unpacked.params[1].value.toLowerCase();
                    txData = unpacked.params[2].value;
                }

                let exchange = utility.relayName(txFrom, '0x Exchange');
                let returns = [
                    //signed execution
                    {
                        'type': 'Signed execution',
                        'exchange': exchange,
                        'note': 'a 0x trade/cancel executed through a third party for a signer address',
                        'sender': tx.from,
                        'signer': signer,
                    }
                ];

                //try to add parsed subcall
                try {
                    const data = txData;
                    let unpacked2 = utility.processInput(data);
                    if (unpacked2) {
                        let newTx = tx;
                        if (newTx.to !== signer) {
                            newTx.from = signer;
                        }

                        let subCall = this.processUnpackedInput(newTx, unpacked2);
                        if (subCall) {
                            if (Array.isArray(subCall)) {
                                returns = returns.concat(subCall);
                            } else {
                                returns.push(subCall);
                            }
                        } else {
                            console.log('unable to process subcall');
                        }
                    } else {
                        console.log('unable to parse executeTransaction subcall');
                    }
                } catch (e) { }


                if (returns.length > 1 && returns[0].exchange !== returns[1].exchange) {
                    returns[0].exchange = returns[1].exchange;
                }

                return returns;
            }
            //0x v2 v3 cancel up to
            else if (unpacked.name === 'cancelOrdersUpTo') {
                let exchange = this.getExchangeName(txTo, '0x Exchange');
                return {
                    'type': 'Cancel up to',
                    'exchange': exchange,
                    'note': 'Cancels all open 0x orders up to a certain date',
                    'tokens': 'All',
                    'maker': tx.from,
                    'orderEpoch': unpacked.params[0].value,
                };
            }

            //0x v3 exchange proxy: matcha
            else if (unpacked.name === 'transformERC20') {

                let taker = txFrom;

                let takerToken = this.setToken(unpacked.params[0].value);
                let makerToken = this.setToken(unpacked.params[1].value);

                let takerAmount = utility.toBigNumber(unpacked.params[2].value);
                let makerAmount = utility.toBigNumber(unpacked.params[3].value); //min amount

                let tradeType = 'Sell';
                let token = undefined;
                let base = undefined;

                let exchange = this.getExchangeName(txTo, '');

                if (this.isBaseToken(takerToken, makerToken)) {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                } else {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }

                if (token && base && token.addr && base.addr) {
                    let rawAmount = utility.toBigNumber(0);
                    let rawBaseAmount = utility.toBigNumber(0);

                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;
                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                    }

                    let amount = utility.weiToToken(rawAmount, token);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);
                    let price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    if (tradeType === 'Sell') {
                        return {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': utility.addressLink(taker, true, true) + 'made a trade on ' + exchange,
                            'token': token,
                            'amount': amount,
                            'minPrice': price,
                            'base': base,
                            'estBaseAmount': baseAmount,
                            'unlisted': token.unlisted,
                            'taker': taker,
                        };

                    } else {

                        return {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': utility.addressLink(taker, true, true) + 'made a trade on ' + exchange,
                            'token': token,
                            'estAmount': amount,
                            'maxPrice': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                            'taker': taker,
                        };
                    }
                }
            }

            // airswap cancel && fill
            else if ((unpacked.name === 'cancel' || unpacked.name === 'fill') && unpacked.params.length > 10) {

                /*cancel    fill(address makerAddress, uint makerAmount, address makerToken,
                    address takerAddress, uint takerAmount, address takerToken,
                    uint256 expiration, uint256 nonce, uint8 v, bytes32 r, bytes32 s) */
                let maker = unpacked.params[0].value.toLowerCase();
                let taker = unpacked.params[3].value.toLowerCase();// orderAddresses[1].toLowerCase();
                let makerToken = this.setToken(unpacked.params[2].value);
                let takerToken = this.setToken(unpacked.params[5].value);

                let makerAmount = utility.toBigNumber(unpacked.params[1].value);
                let takerAmount = utility.toBigNumber(unpacked.params[4].value);

                let exchange = this.getExchangeName(txTo, '');

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var nonETH = false;

                if (this.isBaseToken(takerToken, makerToken)) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else //if (this.isBaseToken(makerToken, takerToken)) // buy
                {
                    token = takerToken;
                    base = makerToken;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;
                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    if (unpacked.name === 'cancel') {
                        return {
                            'type': 'Cancel ' + tradeType.toLowerCase(),
                            'exchange': exchange,
                            'note': utility.addressLink(maker, true, true) + 'Cancels an open order.',
                            'token': token,
                            'amount': amount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'order size': baseAmount,
                            'unlisted': token.unlisted,
                        };
                    } else { //fill
                        return {
                            'type': 'Taker ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order.',
                            'token': token,
                            'amount': amount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'order size': baseAmount,
                            'unlisted': token.unlisted,
                            'taker': taker,
                            'maker': maker,
                        };
                    }
                }
            }
            //oasisdex cancel/kill
            else if ((unpacked.name === 'cancel' || unpacked.name == 'kill') && unpacked.params.length == 1) {

                let exchange = this.getExchangeName(txTo, '');

                return {
                    'type': 'Cancel offer',
                    'exchange': exchange,
                    'orderID': utility.toBigNumber(unpacked.params[0].value),
                    'note': 'Cancel an open order',
                };
            }
            // default 'trade' function for EtherDelta style exchanges (EtherDelta, IDEX, Token store, Enclaves, etc..)
            // modified to accept the 'order' function as well (on-chain order creation)
            else if ( // etherdelta/decentrex/tokenstore use 11 params, idex has 4, enclaves has 12
                unpacked.name === 'trade' && (unpacked.params.length == 11 || unpacked.params.length == 12 || unpacked.params.length == 4)
                || unpacked.name === 'tradeEtherDelta' || unpacked.name === 'instantTrade'
                || unpacked.name === 'order' //on-chain order
            ) {

                let idex = false;
                //make idex trades fit the old etherdelta format
                if (unpacked.params.length == 4) {
                    idex = true;
                    let params2 = [];
                    params2[0] = { value: unpacked.params[1].value[0] };
                    params2[1] = { value: unpacked.params[0].value[0] };
                    params2[2] = { value: unpacked.params[1].value[1] };
                    params2[3] = { value: unpacked.params[0].value[1] };
                    params2[4] = { value: unpacked.params[0].value[2] };
                    params2[5] = { value: unpacked.params[0].value[5] };
                    // [0][6] feemake
                    // [0][7] feetake
                    params2[6] = { value: unpacked.params[1].value[2] }; //maker
                    params2[7] = { value: unpacked.params[2].value[0] };
                    params2[8] = { value: unpacked.params[3].value[0] };
                    params2[9] = { value: unpacked.params[3].value[1] };
                    params2[10] = { value: unpacked.params[0].value[4] };
                    params2[11] = { value: unpacked.params[1].value[3] }; // taker
                    unpacked.params = params2;
                }

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;
                let tokenGet = this.setToken(unpacked.params[0].value);
                let tokenGive = this.setToken(unpacked.params[2].value);

                let exchange = this.getExchangeName(txTo, '');

                if (this.isBaseToken(tokenGet, tokenGive)) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = tokenGive;
                    base = tokenGet;
                }
                else //if (this.isBaseToken(tokenGive, tokenGet)) // buy
                {
                    token = tokenGet;
                    base = tokenGive;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);

                    if (tradeType === 'Sell') {
                        rawAmount = utility.toBigNumber(unpacked.params[1].value);
                        rawBaseAmount = utility.toBigNumber(unpacked.params[3].value);
                    } else {
                        rawBaseAmount = utility.toBigNumber(unpacked.params[1].value);
                        rawAmount = utility.toBigNumber(unpacked.params[3].value);
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var orderSize = utility.toBigNumber(0);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }


                    orderSize = amount;
                    // selected amount, aailable in trades, not available in 'order'
                    if (unpacked.params.length >= 11) {
                        var chosenAmount = utility.toBigNumber(unpacked.params[10].value);

                        if (tradeType === 'Buy') {
                            if (rawBaseAmount.greaterThan(chosenAmount)) {
                                baseAmount = utility.weiToToken(chosenAmount, base);
                                rawAmount = chosenAmount.div((rawBaseAmount.div(rawAmount)));
                                amount = utility.weiToToken(rawAmount, token);
                            }
                        } else {
                            if (rawAmount.greaterThan(chosenAmount)) {
                                amount = utility.weiToToken(chosenAmount, token);
                                rawBaseAmount = (chosenAmount.times(rawBaseAmount)).div(rawAmount);
                                baseAmount = utility.weiToToken(rawBaseAmount, base);
                            }
                        }
                    }

                    let takerAddr = idex ? unpacked.params[11].value : txFrom;
                    let makerAddr = unpacked.name !== 'order' ? unpacked.params[6].value.toLowerCase() : txFrom;

                    let takeFee = utility.toBigNumber(0);
                    let makeFee = utility.toBigNumber(0);
                    let takeFeeCurrency = '';
                    let makeFeeCurrency = '';

                    if (idex) {
                        const ether1 = utility.toBigNumber(1000000000000000000);
                        let takerFee = utility.toBigNumber(2000000000000000); //0.2% fee in wei
                        let makerFee = utility.toBigNumber(1000000000000000); //0.1% fee in wei

                        //assume take trade

                        if (tradeType === 'Sell') {
                            if (takerFee.greaterThan(0)) {
                                takeFee = utility.weiToToken((rawAmount.times(takerFee)).div(ether1), token);
                                takeFeeCurrency = token;
                            }
                            if (makerFee.greaterThan(0)) {
                                makeFee = utility.weiToToken((rawBaseAmount.times(makerFee)).div(ether1), base);
                                makeFeeCurrency = base;
                            }
                        }
                        else if (tradeType === 'Buy') {
                            if (takerFee.greaterThan(0)) {
                                takeFee = utility.weiToToken((rawBaseAmount.times(takerFee)).div(ether1), base);
                                takeFeeCurrency = base;
                            } if (makerFee.greaterThan(0)) {
                                makeFee = utility.weiToToken((rawAmount.times(makerFee)).div(ether1), token);
                                makeFeeCurrency = base;
                            }
                        }
                    }

                    if (unpacked.name !== 'order') { // trade 
                        var obj = {
                            'type': 'Taker ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(takerAddr, true, true) + ' selected ' + utility.addressLink(makerAddr, true, true) + '\'s order in the orderbook to trade.',
                            'token': token,
                            'amount': amount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'order size': orderSize,
                            'unlisted': token.unlisted,
                            'taker': takerAddr,
                            'maker': makerAddr,
                        };

                        if (idex) {
                            obj['takerFee'] = takeFee;
                            obj['FeeToken'] = takeFeeCurrency;
                            obj['makerFee'] = makeFee;
                            obj['FeeToken '] = makeFeeCurrency;
                        }
                        return obj;
                    } else { // 'order'
                        // make on-chain order EtherDelta style
                        var obj = {
                            'type': tradeType + ' offer',
                            'exchange': exchange,
                            'note': utility.addressLink(makerAddr, true, true) + ' placed an on-chain order.',
                            'token': token,
                            'amount': amount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                            'maker': makerAddr,
                        };
                        return obj;
                    }
                }
            }
            // exchange trade with args in arrays (ethen.market)
            else if (unpacked.name === 'trade' && unpacked.params.length == 3) {

                let numberOfTrades = unpacked.params[1].value.length - 1;
                var objs = [];
                for (let i = 0; i < numberOfTrades; i++) {

                    let offset = i * 10;

                    var obj = unpackEthenOrderInput(
                        Number(unpacked.params[0].value[0 + offset]) > 0,
                        utility.toBigNumber(unpacked.params[0].value[6 + offset]),
                        utility.toBigNumber(unpacked.params[0].value[5 + offset]),
                        unpacked.params[1].value[0].toLowerCase(),
                        unpacked.params[1].value[i + 1]
                    );

                    if (obj)
                        objs.push(obj);
                }
                if (objs && objs.length > 0) {
                    return objs;
                } else {
                    return undefined;
                }

                function unpackEthenOrderInput(isBuy, rawAmount, price, inputToken, maker) {
                    var tradeType = 'Sell';
                    if (isBuy) {
                        tradeType = 'Buy';
                    }
                    var token = _delta.setToken(inputToken);
                    var base = _delta.setToken(_delta.config.ethAddr);

                    let exchange = this.getExchangeName(txTo, '');

                    if (token && base && token.addr && base.addr) {

                        var amount = utility.weiToToken(rawAmount, token);
                        // price in 1e18
                        price = utility.weiToToken(price, base);
                        let dvsr3 = _delta.divisorFromDecimals(base.decimals - token.decimals)
                        price = utility.weiToEth(price, dvsr3);

                        var baseAmount = amount.times(price);


                        let takerAddr = txFrom;
                        let makerAddr = maker.toLowerCase();

                        return {
                            'type': 'Taker ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(takerAddr, true, true) + ' selected ' + utility.addressLink(makerAddr, true, true) + '\'s order in the orderbook to trade.',
                            'token': token,
                            'amount': amount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            //   'order size': orderSize,
                            'unlisted': token.unlisted,
                            'taker': takerAddr,
                            'maker': makerAddr,
                        };
                    }
                }
            }
            //kyber trade input
            else if ((unpacked.name === 'trade' && unpacked.params.length == 7) || unpacked.name == 'tradeWithHint' || unpacked.name == 'tradeWithHintAndFee') {
                /* trade(
                     ERC20 src,
                     uint srcAmount,
                     ERC20 dest,
                     address destAddress,
                     uint maxDestAmount,
                     uint minConversionRate,
                     address walletId
                 ) */
                //tradeWithHint(address src,uint256 srcAmount,address dest,address destAddress,uint256 maxDestAmount,uint256 minConversionRate,address walletId,bytes hint )
                //tradeWithHint(address trader,address src,uint256 srcAmount,address dest,address destAddress,uint256 maxDestAmount,uint256 minConversionRate,address walletId,bytes hint )
                // tradeWithHintAndFee(address trader, address src, uint256 srcAmount, address dest, address destAddress, uint256 maxDestAmount, uint256 minConversionRate, address platformWallet, uint256 platformFeeBps, bytes hint)"

                let maker = '';
                let iOffset = 0;
                if (unpacked.params[0].name == 'trader') {
                    iOffset = 1;
                }

                let taker = txFrom;
                let takerToken = this.setToken(unpacked.params[0 + iOffset].value);
                let makerToken = this.setToken(unpacked.params[2 + iOffset].value);

                let takerAmount = utility.toBigNumber(unpacked.params[1 + iOffset].value);
                let makerAmount = utility.toBigNumber(unpacked.params[4 + iOffset].value); //max amount

                let rate = utility.toBigNumber(unpacked.params[5 + iOffset].value);

                let minPrice = utility.toBigNumber(0);
                let maxPrice = utility.toBigNumber(0);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                let exchange = this.getExchangeName(txTo, '');

                if (this.isBaseToken(takerToken, makerToken)) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else //if (this.isBaseToken(makerToken, takerToken)) // buy
                {
                    token = takerToken;
                    base = makerToken;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;
                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);

                    if (tradeType === 'Sell') {
                        baseAmount = rate.times(amount);
                        baseAmount = utility.weiToToken(baseAmount, base);
                        minPrice = utility.weiToToken(rate, base);
                        // maxAmount = utility.weiToToken(maxAmount, base);

                        return {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': utility.addressLink(taker, true, true) + 'made a trade.',
                            'token': token,
                            'amount': amount,
                            'minPrice': minPrice,
                            'base': base,
                            'estBaseAmount': baseAmount,
                            'unlisted': token.unlisted,
                            'taker': taker,
                            // 'maker': maker,
                        };
                    } else {

                        let one = utility.toBigNumber(1000000000000000000);
                        maxPrice = one.div(rate);
                        //estimated amount by max price
                        amount = baseAmount.div(maxPrice);

                        return {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': utility.addressLink(taker, true, true) + 'made a trade.',
                            'token': token,
                            'estAmount': amount,
                            'maxPrice': maxPrice,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                            'taker': taker,
                            // 'maker': maker,
                        };
                    }
                }
            }
            //kyber proxy trade input
            else if (unpacked.name === 'swapTokenToToken' || unpacked.name === 'swapTokenToEther' || unpacked.name == 'swapEtherToToken') {
                //swapTokenToToken(address src,uint256 srcAmount,address dest,uint256 minConversionRate )
                //swapTokenToEther(address token,uint256 srcAmount,uint256 minConversionRate )
                //swapEtherToToken(address token,uint256 minConversionRate )

                let rate = undefined;
                let takerToken = undefined;
                let makerToken = undefined;
                let takerAmount = undefined;
                if (unpacked.name == 'swapTokenToEther') {
                    takerToken = this.setToken(unpacked.params[0].value);
                    makerToken = this.setToken(this.config.ethAddr);
                    takerAmount = utility.toBigNumber(unpacked.params[1].value);
                    rate = utility.toBigNumber(unpacked.params[2].value);
                } else if (unpacked.name == 'swapEtherToToken') {
                    takerToken = this.setToken(this.config.ethAddr);
                    makerToken = this.setToken(unpacked.params[0].value);
                    takerAmount = utility.toBigNumber(tx.value);
                    rate = utility.toBigNumber(unpacked.params[1].value);
                } else {
                    takerToken = this.setToken(unpacked.params[0].value);
                    makerToken = this.setToken(unpacked.params[2].value);
                    takerAmount = utility.toBigNumber(unpacked.params[1].value);
                    rate = utility.toBigNumber(unpacked.params[3].value);
                }

                let taker = txFrom;

                let minPrice = utility.toBigNumber(0);
                let maxPrice = utility.toBigNumber(0);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                let exchange = this.getExchangeName(txTo, '');

                let amount = utility.toBigNumber(0);
                let baseAmount = utility.toBigNumber(0);

                if (this.isBaseToken(takerToken, makerToken)) {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;

                    baseAmount = utility.weiToToken(takerAmount, base)
                    inverseMax = utility.weiToToken(rate, base);
                    maxPrice = utility.toBigNumber(1).div(inverseMax);
                    amount = baseAmount.div(maxPrice);
                }
                else {
                    token = takerToken;
                    base = makerToken;

                    amount = utility.weiToToken(takerAmount, token);
                    if (base.decimals > token.decimals) {
                        minPrice = utility.weiToToken(rate, base);
                    } else {
                        minPrice = utility.weiToToken(rate, token);
                    }
                    baseAmount = amount.times(minPrice);//takerAmount.times(utility.weiToToken(rate, token));
                }


                if (tradeType === 'Sell') {
                    return {
                        'type': tradeType + ' up to',
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + 'made a trade.',
                        'token': token,
                        'amount': amount,
                        'minPrice': minPrice,
                        'base': base,
                        'estBaseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'taker': taker,
                        // 'maker': maker,
                    };
                } else {

                    return {
                        'type': tradeType + ' up to',
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + 'made a trade.',
                        'token': token,
                        'estAmount': amount,
                        'maxPrice': maxPrice,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'taker': taker,
                        // 'maker': maker,
                    };
                }
            }

            // ddex hydro trade input v1.0 & v1.1
            else if (unpacked.name == 'matchOrders' && (unpacked.params.length > 0 && unpacked.params[0].name === 'takerOrderParam')) {
                // 1.0: function matchOrders(OrderParam memory takerOrderParam,OrderParam[] memory makerOrderParams,OrderAddressSet memory orderAddressSet)
                // 1.1: function matchOrders(OrderParam memory takerOrderParam,OrderParam[] memory makerOrderParams,uint256[] memory baseTokenFilledAmounts,OrderAddressSet memory orderAddressSet)

                //struct OrderParam {address trader, uint256 baseTokenAmount, uint256 quoteTokenAmount, uint256 gasTokenAmount, bytes32 data, OrderSignature signature}
                //struct OrderAddressSet { address baseToken, address quoteToken, address relayer }

                let is1_0 = unpacked.params.length == 3;

                let orderAddressStructArray = undefined;
                //init undefined takeAmount for each maker order
                let takerFillAmounts = Array(unpacked.params[1].length).fill(undefined);

                if (is1_0) {
                    orderAddressStructArray = unpacked.params[2].value;
                } else {
                    orderAddressStructArray = unpacked.params[3].value;
                    takerFillAmounts = unpacked.params[2].value;
                }


                let takeOrder = unpackDdexOrderInput(unpacked.params[0].value, undefined);
                takeOrder.type = takeOrder.type.replace('Maker ', '');
                takeOrder.type += ' up to';
                let makeOrders = unpacked.params[1].value.map((x, i) => unpackDdexOrderInput(x, takerFillAmounts[i]));
                /* makeOrders = makeOrders.map(x => {
                    if(x.type.indexOf('Sell') !== -1) {
                        x.type = x.type.replace('Sell', 'Buy');
                    } else {
                        x.type = x.type.replace('Buy', 'Sell');
                    }
                    return x; 
                }) */

                return [takeOrder].concat(makeOrders);

                function unpackDdexOrderInput(orderStructArray, fillTokenAmount) {
                    let maker = orderStructArray[0].value.toLowerCase();
                    let base = _delta.setToken(orderAddressStructArray[1].value);
                    let token = _delta.setToken(orderAddressStructArray[0].value);
                    let relayer = orderAddressStructArray[2].value.toLowerCase();

                    let rawBaseAmount = utility.toBigNumber(orderStructArray[2].value);
                    let rawTokenAmount = utility.toBigNumber(orderStructArray[1].value);

                    let rawData = orderStructArray[4].value.toLowerCase();
                    let tradeType = rawData.slice(4, 6); // 0-1 is 0x,  2-3 is version, 4-5 side
                    if (tradeType == '00') {
                        tradeType = 'Buy';
                    } else {
                        tradeType = 'Sell';
                    }

                    let exchange = utility.relayName(relayer, 'DDEX');

                    let amount = utility.weiToToken(rawTokenAmount, token);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);

                    let price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }
                    //v1.1 get fill amount instead of order size
                    if (fillTokenAmount) {
                        amount = utility.weiToToken(fillTokenAmount, token);
                        baseAmount = amount.times(price);
                    }

                    return {
                        'type': 'Maker ' + tradeType,
                        'exchange': exchange,
                        'note': 'Matching buy and sell orders in the orderbook',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'relayer': relayer,
                        'maker': maker,
                    };
                }

            }
            // 0x v1 trade input, ethfinex v1 input
            // 0x v2 trade input
            // 0x v2 Forwarder input
            else if (unpacked.name === 'fillOrder' // 0xv1 0xv2 0xv3
                || unpacked.name === 'fillOrKillOrder' //0xv1 0xv2 0xv3
                || unpacked.name === 'fillOrdersUpTo' //0xv1
                || unpacked.name === 'fillOrderNoThrow' //0xv2
                || unpacked.name === 'batchFillOrders' //0xv1 0xv2 0xv3
                || unpacked.name === 'batchFillOrKillOrders' //0xv1 0xv2 0xv3
                || unpacked.name === 'batchFillOrdersNoThrow' //0xv2 0xv3 
                || unpacked.name === 'marketSellOrders' //0xv2
                || unpacked.name === 'marketSellOrdersNoThrow' //0xv2 0xv3
                || unpacked.name == 'marketSellOrdersFillOrKill' //0xv3
                || unpacked.name === 'marketBuyOrders' //0xv2
                || unpacked.name === 'marketBuyOrdersNoThrow' //0xv2 0xv3
                || unpacked.name == 'marketBuyOrdersFillOrKill' //0xv3
                || unpacked.name === 'matchOrders' //0xv2
                || unpacked.name == 'marketBuyOrdersWithEth' //0xv2 0xv3 Forwarder
                || unpacked.name == 'marketSellOrdersWithEth' //0xv2 0xv3 Forwarder
                || unpacked.name == 'marketSellAmountWithEth' //0xv3 new Forwarder
            ) {
                /* //0x v2 &v3 order
                    struct Order array 
                        0:{name: "makerAddress", type: "address"}
                        1: {name: "takerAddress", type: "address"}
                        2: {name: "feeRecipientAddress", type: "address"}
                        3: {name: "senderAddress", type: "address"}
                        4: {name: "makerAssetAmount", type: "uint256"}
                        5: {name: "takerAssetAmount", type: "uint256"}
                        6: {name: "makerFee", type: "uint256"}
                        7: {name: "takerFee", type: "uint256"}
                        8: {name: "expirationTimeSeconds", type: "uint256"}
                        9: {name: "salt", type: "uint256"}
                        10: {name: "makerAssetData", type: "bytes"}
                        11: {name: "takerAssetData", type: "bytes"}
                    V3  12: {name: "makerFeeAssetData", type: "bytes"}      
                    V3  13: {name: "takerFeeAssetData", type: "bytes"}

                   // 0x v1 order
                    Order memory order = Order({
                        maker: orderAddresses[0],
                        taker: orderAddresses[1],
                        makerToken: orderAddresses[2],
                        takerToken: orderAddresses[3],
                        feeRecipient: orderAddresses[4],
                        makerTokenAmount: orderValues[0],
                        takerTokenAmount: orderValues[1],
                        makerFee: orderValues[2],
                        takerFee: orderValues[3],
                        expirationTimestampInSec: orderValues[4],
                        orderHash: getOrderHash(orderAddresses, orderValues)
                    });
               */

                let isV2 = unpacked.params.find((x) => { return x.type && x.type.indexOf('tuple') !== -1; });
                let oldName = '';
                // Convert v2 orders to matching v1 orders to re-use the old v1 trade parsing
                if (isV2) {
                    if (unpacked.name == 'fillOrder' || unpacked.name == 'fillOrKillOrder' || unpacked.name == 'fillOrderNoThrow') {
                        let order = convert0xOrder(unpacked.params[0].value);
                        if (!order) {
                            return undefined;
                        }
                        let takeAmount = unpacked.params[1].value;

                        //make compatible with a v1 style 'fillOrder'
                        oldName = unpacked.name;
                        unpacked.name = 'fillOrder';
                        unpacked.params[0].value = order.orderAddresses;
                        unpacked.params[1].value = order.orderValues;
                        unpacked.params[2].value = takeAmount;

                    } else if (unpacked.name == 'matchOrders') {
                        let order1 = convert0xOrder(unpacked.params[0].value);
                        // assets for 2nd order might be omitted to save on gas, inverse assets of the 1st order
                        if (unpacked.params[1].value[10].value == '0x' || unpacked.params[1].value[11] == '0x') {
                            unpacked.params[1].value[10] = unpacked.params[0].value[11];
                            unpacked.params[1].value[11] = unpacked.params[0].value[10];
                        }
                        let order2 = convert0xOrder(unpacked.params[1].value);

                        if (!order1 && order2) {
                            return undefined;
                        }

                        //TODO takeAmount not defined in input, calc by matching
                        let takeAmount1 = unpacked.params[0].value[5].value;
                        let takeAmount2 = unpacked.params[1].value[5].value;

                        //make compatible with a v1 style 'batchFillorder', but don't change name
                        unpacked.params[0].value = [order1.orderAddresses, order2.orderAddresses];
                        unpacked.params[1].value = [order1.orderValues, order2.orderValues];
                        unpacked.params[2].value = [takeAmount1, takeAmount2];

                    } else if (unpacked.name == 'batchFillOrders' || unpacked.name == 'batchFillOrKillOrders' || unpacked.name == 'batchFillOrdersNoThrow') {

                        let orders = unpacked.params[0].value;
                        let allOrderAdresses = [];
                        let allOrderValues = [];
                        let allTakeAmounts = [];

                        let makerAsset = orders[0][10].value;
                        let takerAsset = orders[0][11].value;

                        for (let i = 0; i < orders.length; i++) {
                            //if orders 2+ omit assetData, use data from the first
                            if (i > 0) {
                                if (orders[i][10].value == '0x') {
                                    orders[i][10].value = makerAsset;
                                }
                                if (orders[i][11].value == '0x') {
                                    orders[i][11].value = takerAsset;
                                }
                            }
                            let order = convert0xOrder(orders[i]);
                            if (order) {

                                let takeAmount = unpacked.params[1].value[i];

                                allOrderAdresses.push(order.orderAddresses);
                                allOrderValues.push(order.orderValues);
                                allTakeAmounts.push(takeAmount);
                            }
                        }
                        if (allOrderAdresses.length == 0) {
                            return undefined;
                        }

                        //make compatible with a v1 style 'batchFillOrders'
                        oldName = unpacked.name;
                        unpacked.name = 'batchFillOrders';
                        unpacked.params[0].value = allOrderAdresses;
                        unpacked.params[1].value = allOrderValues;
                        unpacked.params[2].value = allTakeAmounts;

                    } else if (unpacked.name == 'marketSellOrders' || unpacked.name == 'marketSellOrdersNoThrow' || unpacked.name == 'marketSellOrdersFillOrKill'
                        || unpacked.name == 'marketBuyOrders' || unpacked.name == 'marketBuyOrdersNoThrow' || unpacked.name == 'marketBuyOrdersFillOrKill'
                        || unpacked.name == 'marketBuyOrdersWithEth' || unpacked.name == 'marketSellOrdersWithEth' // WithEth is 0x Forwarder2
                        || unpacked.name == 'marketSellAmountWithEth'
                    ) {

                        let orders = unpacked.params[0].value;
                        let allOrderAdresses = [];
                        let allOrderValues = [];
                        let takeAmount = undefined;
                        if (unpacked.name == "marketSellOrdersWithEth") {
                            takeAmount = tx.value;
                        } else {
                            takeAmount = unpacked.params[1].value;
                        }

                        let makerAsset = orders[0][10].value;
                        let takerAsset = orders[0][11].value;

                        if (unpacked.name.indexOf('WithEth') !== -1) {
                            //set assetData for WETH
                            let fakeAsset = "0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
                            // forwarder leaves asset blank for ETH
                            if (takerAsset == '0x') {
                                takerAsset = fakeAsset
                            } else if (makerAsset == '0x') {
                                makerAsset = fakeAsset;
                            }
                        }

                        for (let i = 0; i < orders.length; i++) {
                            // if orders past the 1st have no asset data, assume identical to the 1st
                            if (i > 0 || unpacked.name.indexOf('WithEth') !== -1) {
                                if (orders[i][10].value == '0x') {
                                    orders[i][10].value = makerAsset;
                                }
                                if (orders[i][11].value == '0x') {
                                    orders[i][11].value = takerAsset;
                                }
                            }
                            let order = convert0xOrder(orders[i]);
                            if (order) {
                                allOrderAdresses.push(order.orderAddresses);
                                allOrderValues.push(order.orderValues);
                            }
                        }
                        if (allOrderAdresses.length == 0) {
                            return undefined;
                        }

                        oldName = unpacked.name;
                        unpacked.name = 'fillOrdersUpTo';
                        unpacked.params[0].value = allOrderAdresses;
                        unpacked.params[1].value = allOrderValues;
                        unpacked.params[2].value = takeAmount;
                    }



                }// end if(isV2)

                var exchange = '';

                if (unpacked.name === 'fillOrder' || unpacked.name == 'fillOrKillOrder') {
                    let orderAddresses1 = unpacked.params[0].value;
                    let orderValues1 = unpacked.params[1].value;
                    let fillTakerTokenAmount1 = utility.toBigNumber(unpacked.params[2].value);

                    if (oldName) {
                        unpacked.name = oldName;
                    }
                    return unpack0xOrderInput(orderAddresses1, orderValues1, fillTakerTokenAmount1);
                } else if (unpacked.name === 'batchFillOrders' || unpacked.name == 'batchFillOrKillOrders') {
                    let orderAddresses2 = unpacked.params[0].value;
                    let orderValues2 = unpacked.params[1].value;
                    let fillTakerTokenAmounts2 = unpacked.params[2].value.map(x => utility.toBigNumber(x));

                    var objs = [];
                    for (let i = 0; i < orderAddresses2.length; i++) {
                        var obj = unpack0xOrderInput(orderAddresses2[i], orderValues2[i], fillTakerTokenAmounts2[i]);
                        if (obj)
                            objs.push(obj);
                    }

                    if (oldName) {
                        unpacked.name = oldName;
                    }
                    return objs;
                } else if (unpacked.name === 'matchOrders') {
                    //0x V2 only
                    // always matches 2 orders
                    let orderAddresses2 = unpacked.params[0].value;
                    let orderValues2 = unpacked.params[1].value;
                    let fillTakerTokenAmounts2 = unpacked.params[2].value.map(x => utility.toBigNumber(x));

                    var objs = [];
                    for (let i = 0; i < orderAddresses2.length; i++) {
                        var obj = unpack0xOrderInput(orderAddresses2[i], orderValues2[i], fillTakerTokenAmounts2[i]);
                        if (obj)
                            objs.push(obj);
                    }

                    // order 1 amount/total is based on order2
                    objs[0].baseAmount = objs[1].baseAmount;
                    objs[0].amount = objs[0].baseAmount.div(objs[0].price);
                    if (oldName) {
                        unpacked.name = oldName;
                    }

                    return objs;
                }
                else if (unpacked.name === 'fillOrdersUpTo') { //marketBuy, marketSell use this one too
                    let orderAddresses3 = unpacked.params[0].value;
                    let orderValues3 = unpacked.params[1].value;
                    let fillTokenAmount3 = utility.toBigNumber(unpacked.params[2].value);
                    let fillToken = this.setToken(orderAddresses3[0][3]);
                    let fillIsMaker = false;

                    //marketBuy in v2 and v3 use makerToken instead of takerToken for fillAmount
                    if (oldName && oldName.indexOf('arketBuy') >= 0) {
                        fillIsMaker = true;
                    }

                    // The set of maker orders to match the single taker market order with
                    let objs = [];
                    for (let i = 0; i < orderAddresses3.length; i++) {
                        let obj = unpack0xOrderInput(orderAddresses3[i], orderValues3[i], fillTokenAmount3, fillIsMaker);
                        if (obj)
                            objs.push(obj);
                    }

                    if (objs.length == 0) {
                        return undefined;
                    }

                    //define a buy up to, sell up to , taker order that precedes the makers
                    let minPrice = objs[0].price;
                    let maxPrice = minPrice;
                    for (let i = 1; i < objs.length; i++) {
                        let price = objs[i].price;
                        if (price.greaterThan(maxPrice)) {
                            maxPrice = price;
                        } else if (minPrice.greaterThan(price)) {
                            minPrice = price;
                        }
                    }


                    let isAmount = (fillToken.addr == objs[0].token.addr);  //is fill the amount or baseAmount in the output
                    if (fillIsMaker) {
                        isAmount = !isAmount;
                        fillToken = this.setToken(orderAddresses3[0][2]);
                    }
                    let fillAmount = utility.weiToToken(fillTokenAmount3, fillToken);

                    // single units if erc721
                    if (objs[0].token.erc721) {
                        amount = utility.toBigNumber(1);
                    }
                    if (objs[0].base.erc721) {
                        baseAmount = utility.toBigNumber(1);
                    }
                    if (objs[0].token.erc721 && objs[0].base.erc721) {
                        minPrice = utility.toBigNumber(1);
                        maxPrice = utility.toBigNumber(1);
                    }

                    let relayer3 = objs[0].relayer;
                    exchange = objs[0].exchange;
                    let taker3 = txFrom;

                    let initObj = {
                        'type': objs[0].type.slice(6) + ' up to', //remove maker/taker
                        'exchange': exchange,
                        'note': utility.addressLink(taker3, true, true) + 'selects 1 or more orders to fill an amount',
                        'token': objs[0].token,
                        'amount': fillAmount,
                        'minPrice': minPrice,
                        'maxPrice': maxPrice,
                        //'price': maxPrice, // delete if min != max
                        'unlisted': objs[0].unlisted,
                        'base': objs[0].base,
                        'baseAmount': fillAmount,
                        'estBaseAmount': undefined,
                        'relayer': relayer3,
                        'taker': taker3,
                    };

                    if (oldName) {
                        unpacked.name = oldName;
                    }

                    /* if (minPrice === maxPrice) {
                         delete initObj.minPrice;
                         delete initObj.maxPrice;
                     } else {
                         delete initObj.price;
                     }*/

                    if (oldName.indexOf('WithEth') !== -1) {
                        initObj.exchange = '0x Instant ';
                        if (oldName === "marketBuyOrdersWithEth" && isAmount && utility.isWrappedETH(initObj.base.addr)) {
                            initObj.estBaseAmount = utility.weiToEth(tx.value);
                        } else {
                            delete initObj.estBaseAmount;
                        }
                    } else {
                        delete initObj.estBaseAmount;
                    }

                    // buy up to// sell up to  has either an amount or baseAmount
                    if (isAmount) {
                        delete initObj.baseAmount;
                    } else {
                        delete initObj.amount;
                    }


                    //these are the maker orders filled by the taker, switch them around (buy->sell, sell->buy)
                    objs = objs.map(obj => {
                        if (obj.type.indexOf('Buy') >= 0) {
                            obj.type = obj.type.replace('Buy', 'Sell');
                        } else {
                            obj.type = obj.type.replace('Sell', 'Buy');
                        }

                        //rename to 'orders' instead of trade, as these are orders we match with
                        obj.type = obj.type.replace('Taker ', '');
                        obj.type = obj.type.replace('Maker', '');
                        obj.type += ' Order';
                        return obj;
                    });

                    return [initObj].concat(objs);
                }


                function unpack0xOrderInput(orderAddresses, orderValues, fillTokenAmount, fillMaker = false) {

                    let maker = orderAddresses[0].toLowerCase();
                    let taker = txFrom;
                    let orderTaker = orderAddresses[1].toLowerCase(); // taker defined in order
                    let makerToken = _delta.setToken(orderAddresses[2]);
                    let takerToken = _delta.setToken(orderAddresses[3]);

                    let makerAmount = utility.toBigNumber(orderValues[0]);
                    let takerAmount = utility.toBigNumber(orderValues[1]);

                    //TODO add fee in input display?

                    let relayer = orderAddresses[4].toLowerCase();
                    //Check for empty relayer 0x000000 and try taker or sender (possible admin)
                    if (relayer === _delta.config.ethAddr) {
                        relayer = orderTaker;
                        // use sender if 0xV2
                        if (orderAddresses.length >= 6) {
                            let sender = orderAddresses[5].toLowerCase();
                            if (sender !== maker && sender !== _delta.config.ethAddr) {
                                relayer = sender;
                            }
                        }
                    }

                    exchange = utility.relayName(relayer);
                    // orderValues[4] is expiry

                    var tradeType = 'Sell';
                    var token = undefined;
                    var base = undefined;

                    if (_delta.isBaseToken(takerToken, makerToken)) {
                        tradeType = 'Buy';
                        token = makerToken;
                        base = takerToken;
                    }
                    else {
                        token = takerToken;
                        base = makerToken;
                    }


                    if (token && base && token.addr && base.addr) {
                        var rawAmount = utility.toBigNumber(0);
                        var rawBaseAmount = utility.toBigNumber(0);
                        var chosenAmount = fillTokenAmount;
                        if (tradeType === 'Sell') {
                            rawAmount = takerAmount;
                            rawBaseAmount = makerAmount;
                        } else {
                            rawBaseAmount = takerAmount;
                            rawAmount = makerAmount;
                        }

                        var amount = utility.weiToToken(rawAmount, token);
                        var baseAmount = utility.weiToToken(rawBaseAmount, base);

                        var orderSize = utility.toBigNumber(0);
                        var price = utility.toBigNumber(0);
                        if (amount.greaterThan(0)) {
                            price = baseAmount.div(amount);
                        }

                        if ((tradeType === 'Buy' && !fillMaker) || (tradeType === 'Sell' && fillMaker)) {
                            orderSize = amount;
                            if (rawBaseAmount.greaterThan(chosenAmount)) {
                                baseAmount = utility.weiToToken(chosenAmount, base);
                                rawAmount = chosenAmount.div((rawBaseAmount.div(rawAmount)));
                                amount = utility.weiToToken(rawAmount, token);
                            }
                        } else {
                            orderSize = amount;
                            if (rawAmount.greaterThan(chosenAmount)) {
                                amount = utility.weiToToken(chosenAmount, token);
                                rawBaseAmount = (chosenAmount.times(rawBaseAmount)).div(rawAmount);
                                baseAmount = utility.weiToToken(rawBaseAmount, base);
                            }
                        }

                        // single units if erc721
                        if (token.erc721) {
                            amount = utility.toBigNumber(1);
                            baseAmount = amount.times(price);
                        }
                        if (base.erc721) {
                            baseAmount = utility.toBigNumber(1);
                        }
                        if (token.erc721 && base.erc721) {
                            price = utility.toBigNumber(1);
                        }

                        return {
                            'type': 'Taker ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
                            'token': token,
                            'amount': amount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'order size': orderSize,
                            'unlisted': token.unlisted,
                            'relayer': relayer,
                            'maker': maker,
                            'taker': taker,
                        };
                    }
                }
            }
            //dex.blue trades called by admin
            else if (unpacked.name == 'settleTrade' || unpacked.name == 'batchSettleTrades' || unpacked.name == 'settleReserveTrade') {
                //todo
            }
            //oasisdex placing new offer
            else if (unpacked.name == 'offer' || unpacked.name == 'make') {
                //Function: offer(uint256 pay_amt, address pay_gem, uint256 buy_amt, address buy_gem, uint256 pos)
                // function make(ERC20 pay_gem, ERC20 buy_gem, uint128  pay_amt, uint128  buy_amt)

                if (unpacked.name == 'make') {
                    //transfor input to offer format

                    let newParams = [
                        unpacked.params[2],
                        unpacked.params[0],
                        unpacked.params[3],
                        unpacked.params[1],
                    ];
                    unpacked.params = newParams;
                }

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;
                let tokenGet = this.setToken(unpacked.params[1].value);
                let tokenGive = this.setToken(unpacked.params[3].value);

                let exchange = this.getExchangeName(txTo, '');

                if (this.isBaseToken(tokenGet, tokenGive)) { // get eth  -> sell
                    tradeType = 'Buy';
                    token = tokenGive;
                    base = tokenGet;
                } else { // buy
                    token = tokenGet;
                    base = tokenGive;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = utility.toBigNumber(unpacked.params[0].value);
                        rawBaseAmount = utility.toBigNumber(unpacked.params[2].value);
                    } else {
                        rawBaseAmount = utility.toBigNumber(unpacked.params[0].value);
                        rawAmount = utility.toBigNumber(unpacked.params[2].value);
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var orderSize = utility.toBigNumber(0);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    return {
                        'type': tradeType + ' offer',
                        'exchange': exchange,
                        'note': utility.addressLink(txFrom, true, true) + ' created a trade offer',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'maker': txFrom,
                    };
                }
                //oasisdex buy with ID
            } else if ((unpacked.name == 'buy' || unpacked.name == 'take') && unpacked.params.length == 2) {
                //take(bytes32 id, uint128 maxTakeAmount)
                //buy(uint id, uint amount)

                let exchange = this.getExchangeName(txTo, '');

                // Function: buy(uint256 id, uint256 amount)
                return {
                    'type': 'Fill offer',
                    'exchange': exchange,
                    'orderID': utility.toBigNumber(unpacked.params[0].value),
                    'note': ' Fill a trade order',
                };
            }

            // OasisDex buy all, OasisDirect  (Oasis proxy, oasisProxy factory)
            else if ((unpacked.name == 'buyAllAmount'
                || unpacked.name == 'buyAllAmountPayEth'
                || unpacked.name == 'buyAllAmountBuyEth'
                || unpacked.name == 'createAndBuyAllAmount'
                || unpacked.name == 'createAndBuyAllAmountPayEth'
                || unpacked.name == 'createAndBuyAllAmountBuyEth')
                && (unpacked.params[0].name == 'otc' || unpacked.params[0].name == 'factory')
            ) {
                /*
                buyAllAmount(OtcInterface otc, TokenInterface buyToken, uint buyAmt, TokenInterface payToken, uint maxPayAmt)
                createAndBuyAllAmount(DSProxyFactory factory, OtcInterface otc, TokenInterface buyToken, uint buyAmt, TokenInterface payToken, uint maxPayAmt)
                
                buyAllAmountBuyEth(OtcInterface otc, TokenInterface wethToken, uint wethAmt, TokenInterface payToken, uint maxPayAmt)
                createAndBuyAllAmountBuyEth(DSProxyFactory factory, OtcInterface otc, uint wethAmt, TokenInterface payToken, uint maxPayAmt)  
               
                buyAllAmountPayEth(OtcInterface otc, TokenInterface buyToken, uint buyAmt, TokenInterface wethToken)
                createAndBuyAllAmountPayEth(DSProxyFactory factory, OtcInterface otc, TokenInterface buyToken, uint buyAmt)
                  
                */

                let WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
                // format createAnd input to similar one
                if (unpacked.name == 'createAndBuyAllAmount') {
                    unpacked.name = 'buyAllAmount'
                    unpacked.params = unpacked.params.slice(1);
                } else if (unpacked.name == 'createAndBuyAllAmountBuyEth') {
                    unpacked.name = 'buyAllAmountBuyEth';
                    unpacked.params = [unpacked.params[1], { value: WETH }, unpacked.params[2], unpacked.params[3], unpacked.params[4]];
                } else if (unpacked.name == 'createAndBuyAllAmountPayEth') {
                    unpacked.name = 'buyAllAmountPayEth';
                    unpacked.params = unpacked.params.slice(1);
                    unpacked.params.push({ value: WETH });
                }

                var tradeType = 'Buy';
                var token = undefined;
                var base = undefined;
                let tokenGet; //= this.setToken(unpacked.params[1].value);
                let tokenGive;// = this.setToken(unpacked.params[3].value);
                let tokenGetAmount;
                let tokenGiveAmount;
                if (unpacked.name == 'buyAllAmount' || unpacked.name == 'buyAllAmountBuyEth') {
                    tokenGet = this.setToken(unpacked.params[3].value);
                    tokenGive = this.setToken(unpacked.params[1].value);
                    tokenGetAmount = utility.toBigNumber(unpacked.params[4].value);
                    tokenGiveAmount = utility.toBigNumber(unpacked.params[2].value);
                }
                else if (unpacked.name == 'buyAllAmountPayEth') {
                    tokenGet = this.setToken(unpacked.params[3].value);
                    tokenGive = this.setToken(unpacked.params[1].value);
                    tokenGetAmount = utility.toBigNumber(tx.value);
                    tokenGiveAmount = utility.toBigNumber(unpacked.params[2].value);
                }

                let exchange = this.getExchangeName(txTo, 'OasisDirect');

                let rawAmount;
                let rawBaseAmount;
                if (this.isBaseToken(tokenGet, tokenGive)) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = tokenGive;
                    rawAmount = tokenGiveAmount;
                    base = tokenGet;
                    rawBaseAmount = tokenGetAmount;
                }
                else //if (this.isBaseToken(tokenGive, tokenGet)) // buy
                {
                    tradeType = 'Sell';
                    token = tokenGet;
                    rawAmount = tokenGetAmount;
                    base = tokenGive;
                    rawBaseAmount = tokenGiveAmount
                }

                if (token && base && token.addr && base.addr) {

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var orderSize = utility.toBigNumber(0);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    if (tradeType === 'Sell') {
                        return {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': 'Trade on OasisDex',
                            'token': token,
                            'estAmount': amount,
                            'minPrice': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                        };
                    } else {
                        return {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': 'Trade on OasisDex',
                            'token': token,
                            'amount': amount,
                            'maxPrice': price,
                            'base': base,
                            'estBaseAmount': baseAmount,
                            'unlisted': token.unlisted,
                        };
                    }
                }
            }
            // OasisDex sell all, OasisDirect  (Oasis proxy, oasisProxy factory)
            else if ((unpacked.name == 'sellAllAmount'
                || unpacked.name == 'sellAllAmountPayEth'
                || unpacked.name == 'sellAllAmountBuyEth'
                || unpacked.name == 'createAndSellAllAmount'
                || unpacked.name == 'createAndSellAllAmountPayEth'
                || unpacked.name == 'createAndSellAllAmountBuyEth')
                && (unpacked.params[0].name == 'otc' || unpacked.params[0].name == 'factory')
            ) {
                /*
                sellAllAmount(OtcInterface otc, TokenInterface payToken, uint payAmt, TokenInterface buyToken, uint minBuyAmt)
                createAndSellAllAmount(DSProxyFactory factory, OtcInterface otc, TokenInterface payToken, uint payAmt, TokenInterface buyToken, uint minBuyAmt)
                
                sellAllAmountPayEth(OtcInterface otc, TokenInterface wethToken, TokenInterface buyToken, uint minBuyAmt) 
                createAndSellAllAmountPayEth(DSProxyFactory factory, OtcInterface otc, TokenInterface buyToken, uint minBuyAmt)
                
                sellAllAmountBuyEth(OtcInterface otc, TokenInterface payToken, uint payAmt, TokenInterface wethToken, uint minBuyAmt)
                createAndSellAllAmountBuyEth(DSProxyFactory factory, OtcInterface otc, TokenInterface payToken, uint payAmt, uint minBuyAmt)
                  
                */

                let WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
                // format createAnd input to similar one
                if (unpacked.name == 'createAndSellAllAmount') {
                    unpacked.name = 'sellAllAmount'
                    unpacked.params = unpacked.params.slice(1);
                } else if (unpacked.name == 'createAndSellAllAmountBuyEth') {
                    unpacked.name = 'sellAllAmountBuyEth';
                    unpacked.params = [unpacked.params[1], unpacked.params[2], unpacked.params[3], { value: WETH }, unpacked.params[4]];
                } else if (unpacked.name == 'createAndSellAllAmountPayEth') {
                    unpacked.name = 'sellAllAmountPayEth';
                    unpacked.params = [unpacked.params[1], { value: WETH }, unpacked.params[2], unpacked.params[3]];
                }

                var tradeType = 'Buy';
                var token = undefined;
                var base = undefined;
                let tokenGet; //= this.setToken(unpacked.params[1].value);
                let tokenGive;// = this.setToken(unpacked.params[3].value);
                let tokenGetAmount;
                let tokenGiveAmount;
                if (unpacked.name == 'sellAllAmount' || unpacked.name == 'sellAllAmountBuyEth') {
                    tokenGet = this.setToken(unpacked.params[1].value);
                    tokenGive = this.setToken(unpacked.params[3].value);
                    tokenGetAmount = utility.toBigNumber(unpacked.params[2].value);
                    tokenGiveAmount = utility.toBigNumber(unpacked.params[4].value);
                }
                else if (unpacked.name == 'sellAllAmountPayEth') {
                    tokenGet = this.setToken(unpacked.params[1].value);
                    tokenGive = this.setToken(unpacked.params[2].value);
                    tokenGetAmount = utility.toBigNumber(tx.value);
                    tokenGiveAmount = utility.toBigNumber(unpacked.params[3].value);
                }

                let exchange = this.getExchangeName(txTo, 'OasisDirect');

                let rawAmount;
                let rawBaseAmount;
                if (this.isBaseToken(tokenGet, tokenGive)) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = tokenGive;
                    rawAmount = tokenGiveAmount;
                    base = tokenGet;
                    rawBaseAmount = tokenGetAmount;
                }
                else //if (this.isBaseToken(tokenGive, tokenGet)) // buy
                {
                    tradeType = 'Sell';
                    token = tokenGet;
                    rawAmount = tokenGetAmount;
                    base = tokenGive;
                    rawBaseAmount = tokenGiveAmount
                }

                if (token && base && token.addr && base.addr) {

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var orderSize = utility.toBigNumber(0);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    if (tradeType === 'Sell') {
                        return {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': 'Trade on OasisDex',
                            'token': token,
                            'amount': amount,
                            'minPrice': price,
                            'base': base,
                            'estBaseAmount': baseAmount,
                            'unlisted': token.unlisted,
                        };
                    } else {
                        return {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': 'Trade on OasisDex',
                            'token': token,
                            'estAmount': amount,
                            'maxPrice': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                        };
                    }
                }
            }

            //OasisDex using proxy execute()
            if (unpacked.name == 'execute') {

                let exchange = 'OasisDirect ';
                let returns = [
                    //signed execution
                    {
                        'type': 'Indirect execution',
                        'Exchange': exchange,
                        'note': 'Call OasisDirect through a proxy',
                        'sender': tx.from,
                    }
                ];

                //try to add parsed subcall
                try {
                    const data = unpacked.params[1].value;
                    let unpacked2 = utility.processInput(data);
                    if (unpacked2) {
                        let newTx = tx;

                        let subCall = this.processUnpackedInput(newTx, unpacked2);
                        if (subCall) {
                            if (Array.isArray(subCall)) {
                                returns = returns.concat(subCall);
                            } else {
                                returns.push(subCall);
                            }
                        } else {
                            if (unpacked2.name.indexOf('pay') && newTx.contractAddress) {
                                // ignore as tx value will be wrong
                            } else {
                                console.log('unable to process subcall');
                            }
                        }
                    } else {
                        console.log('unable to parse execute subcall');
                    }
                } catch (e) { }

                return returns;

            }
            // bancor conversions like below, but only wrapping. trading eth -> ether token
            else if (utility.isWrappedETH(txTo) && (unpacked.name == 'change' || unpacked.name == 'quickChange')) {

                // everything else has (path[], amount, minRate), so convert this one to that format
                if ((unpacked.name === 'convert' || unpacked.name == 'change') && unpacked.params[0].name == '_fromToken') {
                    let params2 = [];
                    params2[0] = { value: [unpacked.params[0].value, unpacked.params[1].value] };
                    params2[1] = { value: unpacked.params[2].value };
                    params2[2] = { value: unpacked.params[3].value };
                    unpacked.params = params2;
                }

                let tokenPath = unpacked.params[0].value;
                let firstToken = this.setToken(tokenPath[0]);
                let lastToken = this.setToken(tokenPath[tokenPath.length - 1]);

                // TODO recheck this one
                let amount = utility.weiToEth(tx.value);
                let token = this.setToken(txTo);
                let ethToken = this.setToken(config.ethAddr);
                if (utility.isWrappedETH(lastToken.addr) && firstToken.addr === "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c") { //BNT to WETH

                    return {
                        'type': 'Wrap ETH',
                        'token In': ethToken,
                        'token Out': token,
                        'note': 'Wrap ETH to a token',
                        'amount': amount,
                    };

                }
            }
            //Bancor token conversions 
            else if (
                unpacked.name === 'quickConvert' || unpacked.name === 'quickConvert2'
                || unpacked.name === 'quickConvertPrioritized' || unpacked.name === 'quickConvertPrioritized2'
                || unpacked.name === 'convert' || unpacked.name === 'convert2'
                || unpacked.name == 'convertFor' || unpacked.name == 'convertFor2'
                || unpacked.name == 'convertForPrioritized' || unpacked.name == 'convertForPrioritized2' || unpacked.name == 'convertForPrioritized3' || unpacked.name == 'convertForPrioritized4'
                || unpacked.name == 'claimAndConvert' || unpacked.name == 'claimAndConvert2'
                || unpacked.name == 'claimAndConvertFor' || unpacked.name == 'claimAndConvertFor2'
                // legacy bancorchanger
                || unpacked.name == 'change' || unpacked.name == 'quickChange'
                // BancorX crosschain (eos)
                || unpacked.name === 'xConvert' || unpacked.name === 'xConvert2'
                || unpacked.name === 'xConvertPrioritized' || unpacked.name === 'xConvertPrioritized2' || unpacked.name === 'xConvertPrioritized3'
            ) {
                /* basic bancor converter
                    function quickConvert(IERC20Token[] _path, uint256 _amount, uint256 _minReturn)
                    function quickConvertPrioritized(IERC20Token[] _path, uint256 _amount, uint256 _minReturn, uint256 _block, uint256 _nonce, uint8 _v, bytes32 _r, bytes32 _s)
                    function convert(IERC20Token _fromToken, IERC20Token _toToken, uint256 _amount, uint256 _minReturn)
                */

                /* bancor quick convertor/ bancor network
                    function convert(IERC20Token[] _path, uint256 _amount, uint256 _minReturn) public payable returns (uint256);
                    function convertFor(IERC20Token[] _path, uint256 _amount, uint256 _minReturn, address _for) public payable returns (uint256);
                    function convertForPrioritized2(
                        IERC20Token[] _path,
                        uint256 _amount,
                        uint256 _minReturn,
                        address _for,
                        uint256 _block,
                        uint8 _v,
                        bytes32 _r,
                        bytes32 _s)
                        public payable returns (uint256);
                */

                // everything else has (path[], amount, minRate), so convert this one to that format
                if ((unpacked.name === 'convert' || unpacked.name == 'change') && unpacked.params[0].name == '_fromToken') {
                    let params2 = [];
                    params2[0] = { value: [unpacked.params[0].value, unpacked.params[1].value] };
                    params2[1] = { value: unpacked.params[2].value };
                    params2[2] = { value: unpacked.params[3].value };
                    unpacked.params = params2;
                }

                let tradeType = 'Sell';
                let token = undefined;
                let base = undefined;
                let tokenPath = unpacked.params[0].value;
                let tokenGive = this.setToken(tokenPath[tokenPath.length - 1]);
                let tokenGet = this.setToken(tokenPath[0]);

                let exchange = 'Bancor';

                if (this.isBaseToken(tokenGet, tokenGive)) {
                    tradeType = 'Buy';
                    token = tokenGive;
                    base = tokenGet;
                } else {
                    tradeType = 'Sell';
                    token = tokenGet;
                    base = tokenGive;
                }

                if (token && base && token.addr && base.addr) {
                    let rawAmount = utility.toBigNumber(0);
                    let rawBaseAmount = utility.toBigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = utility.toBigNumber(unpacked.params[1].value);
                        rawBaseAmount = utility.toBigNumber(unpacked.params[2].value);
                    } else {
                        rawBaseAmount = utility.toBigNumber(unpacked.params[1].value);
                        rawAmount = utility.toBigNumber(unpacked.params[2].value);
                    }


                    let amount = utility.weiToToken(rawAmount, token);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);

                    let price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    let obj = undefined;

                    if (tradeType === 'Sell') {
                        obj = {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': 'bancor token conversion',
                            'token': token,
                            'amount': amount,
                            'minPrice': price,
                            'base': base,
                            'estBaseAmount': baseAmount,
                            'unlisted': token.unlisted,
                        };
                    } else {
                        obj = {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': 'bancor token conversion',
                            'token': token,
                            'estAmount': amount,
                            'maxPrice': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                        };
                    }
                    //crosschain
                    if (unpacked.name.indexOf('x') === 0) {
                        let chain = Ethers.utils.parseBytes32String(unpacked.params[3].value).trim();
                        let obj2 = {
                            'type': 'Trade (cross-chain)',
                            'exchange': 'BancorX',
                            'note': 'A cross-chain trade to the ' + chain + ' blockchain',
                            'token': tokenGet,
                            'amount': token === tokenGet ? amount : baseAmount,
                            'blockchain': chain,
                            'chainDestination': Ethers.utils.parseBytes32String(unpacked.params[4].value).trim(),
                            'unlisted': tokenGive.unlisted,
                        }
                        return [obj2, obj];
                    } else {
                        return obj;
                    }
                }
            }
            //bancor weird partial input?
            else if (unpacked.name == 'completeXConversion' || unpacked.name == 'completeXConversion2') {
                //completeXConversion(address[] _path,uint256 _minReturn,..... )
                //completeXCOnverions2

                let tradeType = 'Sell';
                let token = undefined;
                let base = undefined;
                let tokenPath = unpacked.params[0].value;
                let tokenGive = this.setToken(tokenPath[tokenPath.length - 1]);
                let tokenGet = this.setToken(tokenPath[0]);

                let exchange = 'Bancor';
                let rawAmount = utility.toBigNumber(unpacked.params[1].value);
                amount = utility.weiToToken(rawAmount, tokenGet);

                if (this.isBaseToken(tokenGet, tokenGive)) {
                    tradeType = 'Buy';
                    token = tokenGive;
                    base = tokenGet;
                } else {
                    tradeType = 'Sell';
                    token = tokenGet;
                    base = tokenGive;
                }

                let obj = undefined;

                if (tradeType === 'Sell') {
                    obj = {
                        'type': tradeType + ' up to',
                        'exchange': exchange,
                        'note': 'bancor token conversion',
                        'token': token,
                        'price': "",
                        'base': base,
                        'estBaseAmount': amount,
                        'unlisted': token.unlisted,
                    };
                } else {
                    obj = {
                        'type': tradeType + ' up to',
                        'exchange': exchange,
                        'note': 'bancor token conversion',
                        'token': token,
                        'estAmount': amount,
                        'price': "",
                        'base': base,
                        'unlisted': token.unlisted,
                    };
                }
                return obj;
            }
            // BancorX incoming cross-chain transfer
            else if (unpacked.name === 'reportTx') {
                //reportTx(bytes32 _fromBlockchain, uint256 _txId, address _to, uint256 _amount, uint256 _xTransferId)
                let to = unpacked.params[2].value.toLowerCase();
                let rawAmount = unpacked.params[3].value;
                let token = this.setToken('0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c'); // BNT hardcoded
                let chain = Ethers.utils.parseBytes32String(unpacked.params[0].value).trim();
                let amount = utility.weiToToken(rawAmount, token);

                let note = 'Cross-chain token transfer of BNT from ' + chain;

                return {
                    'type': 'Transfer (cross-chain)',
                    'exchange': 'BancorX',
                    'note': note,
                    'token': token,
                    'amount': amount,
                    'blockchain': chain,
                    'to': to,
                    'unlisted': token.unlisted,
                };
            }
            //idex adminWithdraw(address token, uint256 amount, address user, uint256 nonce, uint8 v, bytes32 r, bytes32 s, uint256 feeWithdrawal)
            else if (unpacked.name === 'adminWithdraw') {
                var token = this.setToken(unpacked.params[0].value);
                if (token && token.addr) {
                    var rawAmount = utility.toBigNumber(unpacked.params[1].value);
                    var fee = utility.toBigNumber(unpacked.params[7].value);

                    var amount = utility.weiToToken(rawAmount, token);

                    var type = '';
                    var note = '';

                    const ether1 = utility.toBigNumber(1000000000000000000);
                    var feeVal = utility.weiToToken((fee.times(rawAmount)).div(ether1), token);

                    if (token.addr !== this.config.ethAddr) {
                        type = 'Token Withdraw';
                        note = utility.addressLink(unpacked.params[2].value, true, true) + ' requested IDEX to withdraw tokens';
                    } else {
                        type = 'Withdraw';
                        note = utility.addressLink(unpacked.params[2].value, true, true) + ' requested IDEX to withdraw ETH';
                    }

                    let exchange = this.getExchangeName(txTo, '');

                    return {
                        'type': type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': amount,
                        'to': unpacked.params[2].value.toLowerCase(),
                        'unlisted': token.unlisted,
                        'fee': feeVal,
                        'feeToken': token,
                    };
                }
            }
            //idex 2.0 adminWithdraw
            else if (unpacked.name === 'withdraw' && unpacked.params[0].name == 'withdrawal') {
                // [0][2] wallet
                //[0][4] tokenaddress
                //[0][5] amountPip
                //[0][6] feePip
                let token = this.setToken(unpacked.params[0].value[4].value);
                if (token && token.addr) {
                    let rawAmountPip = unpacked.params[0].value[5].value;
                    let feePip = unpacked.params[0].value[6].value;

                    let amount = utility.idexPipToToken(rawAmountPip, token);
                    let fee = utility.idexPipToToken(feePip, token);

                    let type = '';
                    let note = '';

                    if (token.addr !== this.config.ethAddr) {
                        type = 'Token Withdraw';
                        note = utility.addressLink(unpacked.params[0].value[2].value, true, true) + ' requested IDEX to withdraw tokens';
                    } else {
                        type = 'Withdraw';
                        note = utility.addressLink(unpacked.params[0].value[2].value, true, true) + ' requested IDEX to withdraw ETH';
                    }

                    let exchange = this.getExchangeName(txTo, '');

                    return {
                        'type': type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': amount,
                        'to': unpacked.params[0].value[2].value.toLowerCase(),
                        'unlisted': token.unlisted,
                        'fee': fee,
                        'feeToken': token,
                    };
                }
            }
            // IDEX 2.0 cancel
            else if (unpacked.name == "invalidateOrderNonce") {
                let exchange = this.getExchangeName(txTo, '');
                return {
                    'type': 'Cancel up to',
                    'exchange': exchange,
                    'note': 'Cancels all open IDEX orders up to a certain date',
                    'tokens': 'All',
                    'maker': tx.from,
                    'orderNonce': unpacked.params[0].value,
                };
            }
            //ethex.market taker trade
            else if (unpacked.name == 'takeBuyOrder' || unpacked.name == 'takeSellOrder') {
                let maker = unpacked.params[unpacked.params.length - 1].value.toLowerCase();
                let taker = txFrom;

                let base = this.setToken(this.config.ethAddr);
                let token = this.setToken(unpacked.params[0].value);
                let tradeType = '';
                if (unpacked.name == 'takeSellOrder') {
                    tradeType = 'Buy';
                } else {
                    tradeType = 'Sell';
                }

                let exchange = this.getExchangeName(txTo, '');

                if (token && base) {
                    let tokenAmount = utility.weiToToken(unpacked.params[1].value, token);
                    let baseAmount = utility.weiToToken(unpacked.params[2].value, base);

                    var price = utility.toBigNumber(0);
                    if (tokenAmount.greaterThan(0)) {
                        price = baseAmount.div(tokenAmount);
                    }

                    var orderSize = tokenAmount;

                    // less than full base amount
                    if (unpacked.name == 'takeSellOrder' && utility.toBigNumber(unpacked.params[2].value) !== utility.toBigNumber(tx.value)) {
                        baseAmount = utility.weiToToken(unpacked.params[2].value, base);
                        tokenAmount = baseAmount.div(price);
                    }
                    //less than full token amount
                    else if (unpacked.name == 'takeBuyOrder' && unpacked.params[1].value !== unpacked.params[3].value) {
                        tokenAmount = utility.weiToToken(unpacked.params[3].value, token);
                        baseAmount = tokenAmount.times(price);
                    }

                    return {
                        'type': 'Taker ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
                        'token': token,
                        'amount': tokenAmount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'order size': orderSize,
                        'unlisted': token.unlisted,
                        'maker': maker,
                        'taker': taker,
                    };
                }
            }
            //ethex maker  trade offer
            else if (unpacked.name == 'makeSellOrder' || unpacked.name == 'makeBuyOrder' || unpacked.name == 'cancelAllSellOrders' || unpacked.name == 'cancelAllBuyOrders') {

                let base = this.setToken(this.config.ethAddr);
                let token = this.setToken(unpacked.params[0].value);
                let tradeType = '';

                let rawETH = undefined;
                if (unpacked.name.indexOf('Sell') !== -1) {
                    rawETH = utility.toBigNumber(unpacked.params[2].value);
                    tradeType = 'Sell';
                } else {
                    if (unpacked.name.slice(0, 6) == 'cancel') {
                        rawETH = utility.toBigNumber(unpacked.params[2].value);
                    } else {
                        rawETH = utility.toBigNumber(tx.value);
                    }
                    tradeType = 'Buy';
                }

                let exchange = this.getExchangeName(txTo, '');

                if (base && token) {

                    let tokenAmount = utility.weiToToken(unpacked.params[1].value, token);
                    let baseAmount = utility.weiToEth(rawETH);

                    var price = utility.toBigNumber(0);
                    if (tokenAmount.greaterThan(0)) {
                        price = baseAmount.div(tokenAmount);
                    }

                    if (unpacked.name.slice(0, 6) !== 'cancel') {
                        return {
                            'type': tradeType + ' offer',
                            'exchange': exchange,
                            'note': utility.addressLink(txFrom, true, true) + ' created a trade offer',
                            'token': token,
                            'amount': tokenAmount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                            'maker': txFrom,
                        };
                    } else {
                        return {
                            'type': 'Cancel ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(txFrom, true, true) + ' cancelled a trade offer',
                            'token': token,
                            'amount': tokenAmount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                            'maker': txFrom,
                        };
                    }
                }
            }
            // EasyTrade v1 & v2
            else if (unpacked.name == 'createBuyOrder' || unpacked.name == 'createSellOrder' || unpacked.name == 'sell' || unpacked.name == 'buy') {
                //createBuyOrder(address token, uint256 tokensTotal, uint8[] exchanges, address[5][] orderAddresses, uint256[6][] orderValues, uint256[] exchangeFees, uint8[] v, bytes32[] r, bytes32[] s)
                //createSellOrder(address token, uint256 tokensTotal, uint256 ethersTotal, uint8[] exchanges, address[5][] orderAddresses, uint256[6][] orderValues, uint256[] exchangeFees, uint8[] v, bytes32[] r, bytes32[] s)

                //sell(address tradeable, uint256 volume, uint256 volumeEth, bytes ordersData, address destinationAddr, address affiliate)
                //buy(address tradeable, uint256 volume, bytes ordersData, address destinationAddr, address affiliate)

                let base = this.setToken(this.config.ethAddr);
                let token = this.setToken(unpacked.params[0].value);
                let tradeType = '';

                let rawETH = undefined;
                if (unpacked.name == 'sell' || unpacked.name == 'createSellOrder') {
                    rawETH = utility.toBigNumber(unpacked.params[2].value);
                    tradeType = 'Sell';
                } else {
                    rawETH = utility.toBigNumber(tx.value);
                    tradeType = 'Buy';
                }

                let exchange = this.getExchangeName(txTo, '');

                if (base && token) {

                    let tokenAmount = utility.weiToToken(unpacked.params[1].value, token);
                    let baseAmount = utility.weiToEth(rawETH);

                    return {
                        'type': tradeType + ' up to',
                        'exchange': exchange,
                        'note': utility.addressLink(txFrom, true, true) + ' iniated a trade through an exchange aggregator.',
                        'token': token,
                        'amount': tokenAmount,
                        'price': '',
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'taker': txFrom,
                    };
                }
            }
            //uniswap trades
            else if (
                (
                    (unpacked.name.indexOf('ethToToken') !== -1) ||
                    (unpacked.name.indexOf('tokenToEth') !== -1) ||
                    (unpacked.name.indexOf('tokenToToken') !== -1) ||
                    (unpacked.name.indexOf('tokenToExchange') !== -1)
                ) &&
                (
                    (unpacked.name.indexOf('Transfer') !== -1) ||
                    (unpacked.name.indexOf('Swap') !== -1)
                )
            ) {
                /*
                function ethToTokenSwapInput(uint256 min_tokens, uint256 deadline) 
                function ethToTokenTransferInput(uint256 min_tokens, uint256 deadline, address recipient)
                function ethToTokenSwapOutput(uint256 tokens_bought, uint256 deadline) 
                function ethToTokenTransferOutput(uint256 tokens_bought, uint256 deadline, address recipient)
                
                function tokenToEthSwapInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline)
                function tokenToEthTransferInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline, address recipient) 
                function tokenToEthSwapOutput(uint256 eth_bought, uint256 max_tokens, uint256 deadline)
                function tokenToEthTransferOutput(uint256 eth_bought, uint256 max_tokens, uint256 deadline, address recipient)
                
                function tokenToTokenSwapInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address token_addr)
                function tokenToTokenTransferInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address recipient, address token_addr)
                function tokenToTokenSwapOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address token_addr)
                function tokenToTokenTransferOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address recipient, address token_addr)
                
                function tokenToExchangeSwapInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address exchange_addr)
                function tokenToExchangeTransferInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address recipient, address exchange_addr)
                function tokenToExchangeSwapOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address exchange_addr)
                function tokenToExchangeTransferOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address recipient, address exchange_addr)
                */

                let swapContract = txTo;

                if (!this.config.uniswapContracts[txTo]) {
                    console.log('input for unknown uniswap contract ' + swapContract);
                    return undefined;
                    // TODO fetch this contract?
                }

                let token = undefined;
                let base = undefined;
                let deadline = undefined;
                let rawTokenAmount = undefined;
                let rawBaseAmount = undefined;
                let tradeType = '';
                let fixedBaseAmount = false;
                let recipientIndex = -1;

                if (unpacked.name.indexOf('ethToToken') !== -1) {
                    token = this.setToken(this.config.uniswapContracts[swapContract]);
                    base = this.setToken(this.config.ethAddr);
                    deadline = Number(unpacked.params[1].value);
                    rawTokenAmount = utility.toBigNumber(unpacked.params[0].value);
                    rawBaseAmount = utility.toBigNumber(tx.value);
                    tradeType = 'Buy';
                    if (unpacked.name.indexOf('Input') !== -1) {
                        fixedBaseAmount = true;
                    }
                    recipientIndex = 2;
                } else if (unpacked.name.indexOf('tokenToEth') !== -1) {
                    token = this.setToken(this.config.uniswapContracts[swapContract]);
                    base = this.setToken(this.config.ethAddr);
                    deadline = Number(unpacked.params[2].value);
                    if (unpacked.name.indexOf('Output') == -1) {
                        rawTokenAmount = utility.toBigNumber(unpacked.params[0].value);
                        rawBaseAmount = utility.toBigNumber(unpacked.params[1].value);
                    } else {
                        rawTokenAmount = utility.toBigNumber(unpacked.params[1].value);
                        rawBaseAmount = utility.toBigNumber(unpacked.params[0].value);
                        fixedBaseAmount = true;
                    }
                    tradeType = 'Sell';
                    recipientIndex = 3;
                } else if (unpacked.name.indexOf('tokenToToken') !== -1 || unpacked.name.indexOf('tokenToExchange') !== -1) {
                    let tokenIndex = 4;
                    if (unpacked.name.indexOf('Swap') == -1) {
                        tokenIndex = 5;
                    }
                    tradeType = 'Sell';
                    token = this.setToken(this.config.uniswapContracts[swapContract]);

                    if (unpacked.name.indexOf('tokenToToken') !== -1) {
                        base = this.setToken(unpacked.params[tokenIndex].value);
                    } else {
                        let uniContract = unpacked.params[tokenIndex].value.toLowerCase();
                        base = this.setToken(this.config.uniswapContracts[uniContract]);
                    }

                    deadline = Number(unpacked.params[3].value);
                    if (unpacked.name.indexOf('Output') == -1) {
                        rawTokenAmount = utility.toBigNumber(unpacked.params[0].value);
                        rawBaseAmount = utility.toBigNumber(unpacked.params[1].value);
                    } else {
                        rawTokenAmount = utility.toBigNumber(unpacked.params[1].value);
                        rawBaseAmount = utility.toBigNumber(unpacked.params[0].value);
                        fixedBaseAmount = true;
                    }

                    recipientIndex = 4;
                } else {
                    return undefined;
                }
                if (token && base) {
                    deadline = utility.formatDate(utility.toDateTime(deadline), false, false);

                    let tokenAmount = utility.weiToToken(rawTokenAmount, token);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);

                    let taker = txFrom;
                    let recipient = undefined;
                    if (recipientIndex >= 0 && unpacked.name.indexOf('Transfer') !== -1) {
                        recipient = unpacked.params[recipientIndex].value.toLowerCase();
                    }

                    let price = utility.toBigNumber(0);
                    if (tokenAmount.greaterThan(0)) {
                        price = baseAmount.div(tokenAmount);
                    }

                    let exchange = 'Uniswap';
                    let result = {
                        'type': tradeType + ' up to',
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + ' traded with Uniswap',
                        'token': token,
                        'amount': tokenAmount,
                        'estAmount': tokenAmount,
                        'maxPrice': price,
                        'minPrice': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'estBaseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'taker': taker,
                        // 'maker': maker,
                    };
                    if (recipient && recipient !== taker) {
                        result.to = recipient;
                        result.note += " and transferred the funds to " + utility.addressLink(recipient, true, true);
                    }
                    if (fixedBaseAmount) { //min tokens amount)
                        delete result.estBaseAmount;
                        delete result.amount;
                    } else {
                        delete result.baseAmount;
                        delete result.estAmount;
                    }

                    if (tradeType == 'Buy') {
                        delete result.minPrice;
                    } else {
                        delete result.maxPrice;
                    }
                    return result;
                }
            }
            //uniswap liquidity
            else if (unpacked.name == 'addLiquidity') {
                let liquidityToken = this.uniqueTokens[txTo];
                let token = this.uniqueTokens[this.config.uniswapContracts[txTo]];
                let ethToken = this.uniqueTokens[_delta.config.ethAddr];
                if (liquidityToken && token) {
                    let minLiq = utility.weiToToken(unpacked.params[0].value, liquidityToken);
                    let maxTokens = utility.weiToToken(unpacked.params[1].value, token);
                    let value = utility.weiToEth(tx.value);

                    let deadline = Number(unpacked.params[2].value);

                    deadline = utility.formatDate(utility.toDateTime(deadline), false, false);

                    return {
                        type: 'Add Liquidity',
                        'exchange': 'Uniswap',
                        'minimum': minLiq,
                        'liqToken': liquidityToken,
                        'amount': value,
                        'token': ethToken,
                        'maximum': maxTokens,
                        'token ': token,
                        'deadline': deadline,
                    };
                }
                /*
                 function addLiquidity(uint256 min_liquidity, uint256 max_tokens, uint256 deadline) external payable returns (uint256);
                */
            }
            //uniswap liquidity
            else if (unpacked.name == 'removeLiquidity') {
                let liquidityToken = this.uniqueTokens[txTo];
                let token = this.uniqueTokens[this.config.uniswapContracts[txTo]];
                let ethToken = this.uniqueTokens[this.config.ethAddr];
                if (liquidityToken && token) {
                    let liqTokens = utility.weiToToken(unpacked.params[0].value, liquidityToken);
                    let minEth = utility.weiToToken(unpacked.params[1].value, token);
                    let minTokens = utility.weiToToken(unpacked.params[2].value, token);
                    let deadline = Number(unpacked.params[3].value);
                    deadline = utility.formatDate(utility.toDateTime(deadline), false, false);

                    return {
                        type: 'Remove Liquidity',
                        'exchange': 'Uniswap',
                        'amount': liqTokens,
                        'liqToken': liquidityToken,
                        'minimum': minEth,
                        'token': ethToken,
                        'minimum ': minTokens,
                        'token ': token,
                        'deadline': deadline,
                    };
                }
                /*
                  function removeLiquidity(uint256 amount, uint256 min_eth, uint256 min_tokens, uint256 deadline) external returns (uint256, uint256);
                */
            }
            // Veil ETH token wrapping
            else if (unpacked.name === 'depositAndApprove') {
                let results = [];
                let base = this.setToken(tx.to);
                { //wrap veil ETH
                    let rawVal = utility.toBigNumber(tx.value);
                    let token = this.setToken(this.config.ethAddr);
                    let amount = utility.weiToEth(rawVal);
                    results.push({
                        'type': 'Wrap ETH',
                        'token In': token,
                        'token Out': base,
                        'note': 'Wrap ETH to a token',
                        'amount': amount,
                    });
                }
                { //approve token
                    let spender = unpacked.params[0].value;
                    let allowance = unpacked.params[1].value;
                    let exchange = 'unknown ';
                    let addrName = this.addressName(spender);
                    if (addrName !== spender) {
                        exchange = addrName;
                    }
                    let amount = utility.weiToToken(allowance, base);

                    let sender = txFrom;

                    results.push({
                        'type': 'Approve',
                        'exchange': exchange,
                        'note': 'Now allows tokens to be transferred by ' + exchange,
                        'token': base,
                        'amount': amount,
                        'from': sender,
                        'to': spender,
                        'unlisted': base.unlisted,
                    });
                }
                return results;
            }
            // Veil ETH unwrapping
            else if (unpacked.name == 'withdrawAndTransfer') {
                //withdrawAndTransfer(uint256 _amount, address _target)
                let results = [];
                let token = this.setToken(tx.to);
                let base = this.setToken(this.config.ethAddr);
                let rawVal = utility.toBigNumber(unpacked.params[0].value);
                let amount = utility.weiToToken(rawVal, token);
                { //unwrap veil ETH
                    results.push({
                        'type': 'Unwrap ETH',
                        'token In': token,
                        'token Out': base,
                        'note': 'Unwrap a token back to ETH',
                        'amount': amount,
                    });
                }
                {  //transfer token
                    let dest = unpacked.params[1].toLowerCase();
                    let origin = txFrom;
                    results.push({
                        'type': 'Transfer',
                        'note': 'Transfer ETH',
                        'token': base,
                        'amount': amount,
                        'from': origin,
                        'to': dest,
                        'unlisted': base.unlisted,
                    });
                }
                return results;
            }
        } else {
            return undefined;
        }
        return undefined;
    } catch (error) {
        console.log('unpacked input parsing exception ' + error);
        return undefined;
    }

    // convert 0x protocol v2/v3 order (structs) to  0x protocol v1 order (arrays) to keep compatibility with existing V1 code
    function convert0xOrder(orderStructArray) {
        let makerTokenData = orderStructArray[10].value;
        let takerTokenData = orderStructArray[11].value;

        let makerTokenAddr = _delta.addressFromAssetData(makerTokenData, true);
        let takerTokenAddr = _delta.addressFromAssetData(takerTokenData, true);
        if (makerTokenAddr && takerTokenAddr) {

            let newOrder = {
                orderAddresses: [
                    orderStructArray[0].value.toLowerCase(), //maker
                    orderStructArray[1].value.toLowerCase(), //taker
                    makerTokenAddr,
                    takerTokenAddr,
                    orderStructArray[2].value.toLowerCase(), //feeRecipient
                    orderStructArray[3].value.toLowerCase(), //sender (extra compared to v1)
                ],
                orderValues: [
                    orderStructArray[4].value, //makerAmount
                    orderStructArray[5].value, //takerAmount
                    orderStructArray[6].value, //makerFee
                    orderStructArray[7].value, //takerFee
                    orderStructArray[8].value //expiry
                ]
            };

            // 0xv3 tokens for maker & taker fees
            if (orderStructArray.length >= 14) {
                let makerFeeAddr = _delta.addressFromAssetData(orderStructArray[12].value, true);
                let takerFeeAddr = _delta.addressFromAssetData(orderStructArray[13].value, true);
                if (makerFeeAddr && takerFeeAddr) {
                    newOrder.orderAddresses.push(makerFeeAddr);
                    newOrder.orderAddresses.push(takerFeeAddr);
                }
            }

            return newOrder;
        } else {
            if (makerTokenData == '0x' || takerTokenData == '0x') {
                console.log('empty asset data found');
            } else {

                if ((!makerTokenAddr && makerTokenData.indexOf('0x94cfcdd7') !== -1) ||
                    (!takerTokenAddr && takerTokenData.indexOf('0x94cfcdd7') !== -1)) {
                    console.log('Unsupported ZEIP23 token bundle in assetdata ' + unpacked.name);
                } else {
                    console.log('unsupported token found in assetdata ' + unpacked.name + ' - ' + makerTokenData + ' - ' + takerTokenData);
                }
            }
            return undefined;
        }
    }
};

//get token address from 0x (v2) assetdata bytes
DeltaBalances.prototype.addressFromAssetData = function addressFromAssetData(data, appendId = false) {
    if (data && data !== "0x" && (data.replace(/0/g, "") !== "x")) {
        let unpacked = utility.processInput(data);
        if (unpacked) {

            if (unpacked.name == "ERC20Token" || unpacked.name == "ERC20Bridge") {
                return unpacked.params[0].value.toLowerCase();
            }
            else if (unpacked.name == "ERC721Token") {
                let addr = unpacked.params[0].value.toLowerCase();
                let id = unpacked.params[1].value;

                //erc721 address with id appended
                let idAddr = addr + '-' + id;

                // add unique token to tokenset in memory
                if (!this.uniqueTokens[idAddr]) {
                    let tok = this.setToken(idAddr);
                    this.uniqueTokens[idAddr] = tok;
                    if (!this.uniqueTokens[addr]) {
                        this.uniqueTokens[addr] = {
                            addr: tok.addr,
                            name: tok.name,
                            decimals: tok.decimals,
                            unlisted: tok.unlisted,
                            unknown: tok.unknown,
                            erc721: true,
                        };
                    }
                }
                if (appendId) {
                    return idAddr;
                } else {
                    return addr;
                }
            }
            else if (unpacked.name == "MultiAsset") {
                //([amounts],[tokens])
                let assets = unpacked.params[1].value;
                let addresses = [];
                for (let i = 0; i < assets.length; i++) {
                    addresses[i] = this.addressFromAssetData(assets[i], appendId);
                }
                let multiAddress = addresses.join('#');

                this.uniqueTokens[multiAddress] = {
                    addr: multiAddress,
                    name: 'Multiple(' + assets.length + ')',
                    decimals: 0,
                    unlisted: true,
                    unknown: false,
                    erc721: false,
                    multi: true,
                };

                return multiAddress;
            } else if (unpacked.name == "ERC1155Assets") {
                console.log('unsupported ERC1155 in assetData');
            } else if (unpacked.name == "StaticCall") {
                console.log('unsupported StaticCall in assetData');
            } else {
                console.log('unsupported assetData ' + unpacked.name);
            }
        } else if (data.slice(0, 2) == "0x" && data.length == 42) { //bad format, actual address in here?
            return data.toLowerCase();
        } else {
            console.log('could not decode assetdata');
        }
    }
    return undefined;
}

//trade from IDEX api for in recent trades page
// TODO fix for IDEX 2.0 API
DeltaBalances.prototype.parseRecentIdexTrade = function (key, obj, userAddress) {

    /*
    let delta = this;
    let keys = key.split('_');
    let baseToken = matchToken(keys[0]);
    let token = matchToken(keys[1]);
    
    function matchToken(symbol) {
        if (symbol === 'ETH')
            return delta.uniqueTokens[delta.config.ethAddr];
 
        let tokens = Object.values(delta.uniqueTokens);
        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            if (token.IDEX && token.IDEX == symbol)
                return token;
        }
        return undefined;
    } */

    let baseToken = undefined
    let token = undefined;
    let buyToken = this.setToken(obj.tokenBuy);
    let sellToken = this.setToken(obj.tokenSell);

    // match idex token
    if (obj.type == 'sell') {
        if (obj.taker == userAddress.toLowerCase()) {
            token = buyToken;
            baseToken = sellToken;
        } else {
            token = sellToken;
            baseToken = buyToken;
        }

    } else { ///buy
        if (obj.taker == userAddress.toLowerCase()) {
            token = sellToken;
            baseToken = buyToken;
        } else {
            token = buyToken;
            baseToken = sellToken;
        }
    }

    let baseAmount = utility.toBigNumber(obj.total);
    let amount = utility.toBigNumber(obj.amount);
    let price = utility.toBigNumber(obj.price);

    let hash = obj.transactionHash;
    let tradeType = obj.type;
    // capitalize first letter
    tradeType = tradeType.charAt(0).toUpperCase() + tradeType.slice(1);

    if (userAddress)
        userAddress = userAddress.toLowerCase();

    // continue if known tokens and address matches trade
    if (token && baseToken && (userAddress == obj.maker || userAddress == obj.taker)) {
        let type = 'Taker ';
        if (userAddress == obj.maker)
            type = 'Maker ';

        let dateString = obj.date;
        dateString = dateString.replace(' ', 'T');
        dateString += 'Z';
        let date = new Date(dateString);

        var returnObj = {
            Status: true,
            Type: type + tradeType,
            Exchange: 'IDEX ',
            Token: token,
            Amount: amount,
            Price: price,
            Base: baseToken,
            Total: baseAmount,
            Hash: hash,
            Date: date,
            Info: window.location.origin + window.location.pathname + '/../tx.html#' + hash,
        };
        return returnObj;
    } else {
        return undefined;
    }
};

//is this token the base token of the 2 tokens in a trade
DeltaBalances.prototype.isBaseToken = function (probableBaseToken, otherToken) {
    if (utility.isWrappedETH(probableBaseToken.addr)) {
        return true; //is ETH, see as base
    } else if (utility.isWrappedETH(otherToken.addr)) {
        return false; // other is ETH
    } else if (utility.isNonEthBase(probableBaseToken.addr)) {
        // other allowed base pair

        if (!utility.isNonEthBase(otherToken.addr)) {
            return true;
        } else {
            //both a base pair, take number
            return utility.isNonEthBase(probableBaseToken.addr) > utility.isNonEthBase(otherToken.addr)
        }
    } else if (utility.isNonEthBase(otherToken.addr)) {
        return false;
    } else if (probableBaseToken.multi && !otherToken.multi) {
        return false;
    } else if (probableBaseToken.erc721 && !otherToken.erc721) {
        return false;
    } else if (!probableBaseToken.erc721 && otherToken.erc721) {
        return true;
    }
    else {
        return true;
    }
};

DeltaBalances.prototype.getExchangeName = function (addr, defaultName = '') {
    let exchangeName = defaultName;
    let addrName = this.addressName(addr, false);

    // if addressName does not return 
    if (addrName && addrName !== addr.toLowerCase()) {
        exchangeName = addrName;
    }
    return exchangeName;
}

DeltaBalances.prototype.addressName = function (addr, showAddr) {
    var lcAddr = addr.toLowerCase();

    let name = '';

    if (this.uniqueTokens[lcAddr]) {
        name = this.uniqueTokens[lcAddr].name + " Contract";
        //override tokens, as uniswap contracts are themself tokens
        if (this.config.uniswapContracts[lcAddr]) {
            let tokenAddr = this.config.uniswapContracts[lcAddr];
            if (this.uniqueTokens[tokenAddr]) {
                name = 'Uniswap (' + this.uniqueTokens[tokenAddr].name + ')';
            } else {
                name = 'Uniswap (???)';
            }
        }
    }
    else if (this.config.zrxRelayers[lcAddr]) {
        name = this.config.zrxRelayers[lcAddr];
    } else if (this.config.zrxTakers[lcAddr]) {
        name = this.config.zrxTakers[lcAddr] + ' Admin';
    }
    else if (this.config.admins[lcAddr]) {
        name = this.config.admins[lcAddr];
    } else if (this.config.exchangeWallets[lcAddr]) {
        name = this.config.exchangeWallets[lcAddr];
    } else if (this.config.bancorConverters.indexOf(lcAddr) !== -1) {
        name = "Bancor";
    } else {
        let exchanges = Object.values(this.config.exchangeContracts);
        for (let i = 0; i < exchanges.length; i++) {
            let ex = exchanges[i];
            if (ex.addr === lcAddr) {
                name = ex.name;
                break;
            }
        }
    }

    if (name !== '') {
        return name + (showAddr ? (' ' + lcAddr) : '');
    } else {
        // no known alias, return address
        return lcAddr;
    }
};

DeltaBalances.prototype.isTokenAddress = function (addr) {
    var lcAddr = addr.toLowerCase();
    if (this.uniqueTokens[lcAddr] || this.uniqueTokens[addr]) {
        return true
    }
    return false;
};

DeltaBalances.prototype.isExchangeAddress = function (addr, allowNonSupported) {
    let lcAddr = addr.toLowerCase();

    let exchanges = Object.values(this.config.exchangeContracts);
    for (let i = 0; i < exchanges.length; i++) {
        if (exchanges[i].addr === lcAddr && (exchanges[i].supportedDex || allowNonSupported)) {
            return true;
        }
    }
    for (let j = 0; j < this.config.bancorConverters.length; j++) {
        if (lcAddr === this.config.bancorConverters[j])
            return true;
    }
    let uniKeys = Object.keys(this.config.uniswapContracts);
    for (let k = 0; k < uniKeys.length; k++) {
        if (lcAddr === uniKeys[k].toLowerCase())
            return true;
    }

    return false;
};

DeltaBalances.prototype.processUnpackedEvent = function (unpacked, myAddresses, txSender = undefined) {
    //sender is only available on tx info page, not in history (events only)

    if (!myAddresses) {
        myAddresses = [];
    } else if (typeof myAddresses === 'string') {
        myAddresses = [myAddresses];
    }

    function isMyAddress(addr) {
        for (let i = 0; i < myAddresses.length; i++) {
            if (myAddresses[i].toLowerCase() === addr.toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    try {
        if (unpacked && unpacked.events) {

            // trade event etherdelta, decentrex, tokenstore, enclaves
            if (unpacked.name == 'Trade' && (unpacked.events.length == 6 || unpacked.events.length == 7) && unpacked.address !== this.config.exchangeContracts.Ethen.addr) {
                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;
                var maker = unpacked.events[4].value.toLowerCase();
                var taker = unpacked.events[5].value.toLowerCase();

                var transType = 'Taker';
                if (isMyAddress(maker)) {
                    transType = 'Maker';
                }

                let tokenGet = this.setToken(unpacked.events[0].value);
                let tokenGive = this.setToken(unpacked.events[2].value);

                if (this.isBaseToken(tokenGet, tokenGive)) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = tokenGive;
                    base = tokenGet;
                }
                else //if (this.isBaseToken(tokenGive, tokenGet)) // buy
                {
                    token = tokenGet;
                    base = tokenGive;
                }

                let exchange = this.getExchangeName(unpacked.address, '');

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);
                    var buyUser = '';
                    var sellUser = '';
                    if (tradeType === 'Sell') {
                        rawAmount = utility.toBigNumber(unpacked.events[1].value);
                        rawBaseAmount = utility.toBigNumber(unpacked.events[3].value);
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        rawBaseAmount = utility.toBigNumber(unpacked.events[1].value);
                        rawAmount = utility.toBigNumber(unpacked.events[3].value);
                        sellUser = maker;
                        buyUser = taker;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    // history only??
                    if (isMyAddress(buyUser))
                        tradeType = "Buy";
                    else if (isMyAddress(sellUser))
                        tradeType = "Sell";


                    let takerFee = utility.toBigNumber(0);
                    let makerFee = utility.toBigNumber(0);
                    const ether1 = utility.toBigNumber(1000000000000000000); // 1 ether in wei

                    let contractList = this.config.exchangeContracts;
                    if (exchange == contractList.EtherDelta.name || exchange == contractList.Decentrex.name || exchange == contractList.TokenStore.name
                        || exchange == contractList.Singularx.name || exchange == contractList.EtherC.name
                    ) {
                        takerFee = utility.toBigNumber(3000000000000000); //0.3% fee in wei
                    } else if (exchange == contractList.Enclaves.name) {
                        let exchangeNum = Number(unpacked.events[6].value);

                        //etherdelta proxy
                        if (exchangeNum == 1) {
                            takerFee = utility.toBigNumber(3000000000000000); //0.3% fee in wei
                        } else if (exchangeNum == 0) {
                            //enclaves itself
                            takerFee = utility.toBigNumber(2000000000000000); //0.2% fee in wei
                        }
                    }

                    let fee = utility.toBigNumber(0);
                    let feeCurrency = '';
                    if (transType === 'Taker') {

                        if (tradeType === 'Sell') {
                            if (takerFee.greaterThan(0)) {
                                fee = utility.weiToToken((rawAmount.times(takerFee)).div(ether1), token);
                            }
                            feeCurrency = token;
                        }
                        else if (tradeType === 'Buy') {
                            if (takerFee.greaterThan(0)) {
                                fee = utility.weiToToken((rawBaseAmount.times(takerFee)).div(ether1), base);
                            }
                            feeCurrency = base;
                        }
                    } else if (transType === 'Maker') {
                        if (tradeType === 'Sell') {
                            if (makerFee.greaterThan(0)) {
                                fee = utility.weiToToken((rawAmount.times(makerFee)).div(ether1), token);
                            }
                            feeCurrency = token;
                        }
                        else if (tradeType === 'Buy') {
                            if (makerFee.greaterThan(0)) {
                                fee = utility.weiToToken((rawBaseAmount.times(makerFee)).div(ether1), base);
                            }
                            feeCurrency = base;
                        }
                    }

                    return {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'buyer': buyUser,
                        'seller': sellUser,
                        'fee': fee,
                        'feeCurrency': feeCurrency,
                        'transType': transType,
                        'tradeType': tradeType,
                    };
                }
            }
            // EtherDelta style on-chain order creation
            else if (unpacked.name == 'Order' && unpacked.events.length == 7) {
                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;
                var maker = unpacked.events[6].value.toLowerCase();

                let tokenGet = this.setToken(unpacked.events[0].value);
                let tokenGive = this.setToken(unpacked.events[2].value);

                if (this.isBaseToken(tokenGet, tokenGive)) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = tokenGive;
                    base = tokenGet;
                }
                else //if (this.isBaseToken(tokenGive, tokenGet)) // buy
                {
                    token = tokenGet;
                    base = tokenGive;
                }

                let exchange = this.getExchangeName(unpacked.address, '');

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = utility.toBigNumber(unpacked.events[1].value);
                        rawBaseAmount = utility.toBigNumber(unpacked.events[3].value);
                    } else {
                        rawBaseAmount = utility.toBigNumber(unpacked.events[1].value);
                        rawAmount = utility.toBigNumber(unpacked.events[3].value);
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    return {
                        'type': tradeType + ' offer',
                        'exchange': exchange,
                        'note': utility.addressLink(maker, true, true) + 'placed an on-chain order.',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'maker': maker,
                    };
                }
            }
            // ancient Oasisdex trade event (contract jan 2017)
            //	Trade (uint256 sell_how_much, index_topic_1 address sell_which_token, uint256 buy_how_much, index_topic_2 address buy_which_token)
            else if (unpacked.name == 'Trade' && unpacked.address == '0xa1b5eedc73a978d181d1ea322ba20f0474bb2a25') {
                var tradeType = 'Buy';
                var token = undefined;
                var base = undefined;

                var transType = 'Taker';
                let tokenGet = this.setToken(unpacked.events[1].value);
                let tokenGive = this.setToken(unpacked.events[3].value);
                var rawAmount = utility.toBigNumber(0);
                var rawBaseAmount = utility.toBigNumber(0);

                if (this.isBaseToken(tokenGet, tokenGive)) // get eth  -> sell
                {
                    tradeType = 'Sell';
                    token = tokenGive;
                    base = tokenGet;
                    rawAmount = utility.toBigNumber(unpacked.events[0].value);
                    rawBaseAmount = utility.toBigNumber(unpacked.events[2].value);
                }
                else //if (this.isBaseToken(tokenGive, tokenGet)) // buy
                {
                    token = tokenGet;
                    base = tokenGive;
                    rawBaseAmount = utility.toBigNumber(unpacked.events[2].value);
                    rawAmount = utility.toBigNumber(unpacked.events[0].value);
                }

                let exchange = this.getExchangeName(unpacked.address, '');

                if (token && base && token.addr && base.addr) {

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    let fee = utility.toBigNumber(0);
                    let feeCurrency = '';

                    return {
                        'type': 'Taker' + ' ' + tradeType,
                        'exchange': exchange,
                        'note': 'OasisDex expiringMarket trade',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        //'buyer': buyUser,
                        //'seller': sellUser,
                        'fee': fee,
                        'feeCurrency': feeCurrency,
                        'transType': transType,
                        'tradeType': tradeType,
                    };
                }
            }
            //ethen.market event 1/2 of a trade. (combined in unpacking, added .combinedEvents)
            else if (unpacked.name == 'Order' && unpacked.events.length == 8 && unpacked.address == this.config.exchangeContracts.Ethen.addr && unpacked.combinedEvents) {
                var tradeType = 'Sell';
                var token = this.setToken(unpacked.combinedEvents[2].value);
                var base = this.setToken(this.config.ethAddr);
                var maker = unpacked.events[0].value.toLowerCase();
                var taker = unpacked.combinedEvents[0].value.toLowerCase();

                var buyUser = '';
                var sellUser = '';

                let tradeNum = Number(unpacked.combinedEvents[1].value);
                if (tradeNum > 0) {
                    tradeType = 'Buy';
                    buyUser = taker;
                    sellUser = maker;
                } else {
                    sellUser = taker;
                    buyUser = maker;
                }

                var transType = 'Taker';
                if (isMyAddress(maker)) {
                    transType = 'Maker';
                }

                let exchange = this.getExchangeName(unpacked.address, '');

                let rawAmount = utility.toBigNumber(unpacked.events[3].value);
                let price = utility.toBigNumber(unpacked.events[2].value);

                var amount = utility.weiToToken(rawAmount, token);

                // price in 1e18
                price = utility.weiToToken(price, base);
                let dvsr3 = _delta.divisorFromDecimals(base.decimals - token.decimals)
                price = utility.weiToEth(price, dvsr3);

                baseAmount = amount.times(price);

                // history only??
                if (isMyAddress(buyUser))
                    tradeType = "Buy";
                else if (isMyAddress(sellUser))
                    tradeType = "Sell";


                let takerFee = utility.toBigNumber(1000000 * 2500);
                let makerFee = utility.toBigNumber(0);
                const ether1 = utility.toBigNumber(1000000000000000000); // 1 ether in wei


                let fee = utility.toBigNumber(unpacked.events[7].value);
                let feeCurrency = base; //only ETH fees?

                if (transType === 'Taker') {
                    if (tradeType === 'Sell') {
                        fee = utility.weiToToken(fee, token);
                    }
                    else if (tradeType === 'Buy') {
                        fee = utility.weiToToken(fee, base);
                    }
                } else if (transType === 'Maker') {
                    fee = utility.toBigNumber(0);
                }

                return {
                    'type': transType + ' ' + tradeType,
                    'exchange': exchange,
                    'note': utility.addressLink(taker, true, true) + ' selected an order in the orderbook to trade.',
                    'token': token,
                    'amount': amount,
                    'price': price,
                    'base': base,
                    'baseAmount': baseAmount,
                    'unlisted': token.unlisted,
                    'buyer': buyUser,
                    'seller': sellUser,
                    'fee': fee,
                    'feeCurrency': feeCurrency,
                    'transType': transType,
                    'tradeType': tradeType,
                };
            }
            // DDEX hydro  trade event 1.1 
            else if (unpacked.name == 'Match' && unpacked.events.length === 2) {
                /*  1.1: event Match(OrderAddressSet addressSet, MatchResult result);    
                        struct OrderAddressSet {address baseToken, address quoteToken, address relayer}
                        struct MatchResult {address maker;address taker;address buyer;uint256 makerFee;uint256 makerRebate;uint256 takerFee;uint256 makerGasFee;uint256 takerGasFee;uint256 baseTokenFilledAmount;uint256 quoteTokenFilledAmount;}
                */
                let tradeType = 'Sell';
                let maker = unpacked.events[1].value[0].toLowerCase();
                let taker = unpacked.events[1].value[1].toLowerCase();

                let buyer = unpacked.events[1].value[2].toLowerCase();
                let seller = undefined;
                if (buyer === maker) {
                    seller = taker;
                } else {
                    tradeType = 'Buy'; //taker buys
                    seller = maker;
                }

                let relayer = unpacked.events[0].value[2].toLowerCase();

                let base = this.setToken(unpacked.events[0].value[1]);
                let token = this.setToken(unpacked.events[0].value[0]);

                let rawBaseAmount = utility.toBigNumber(unpacked.events[1].value[9]);
                let rawTokenAmount = utility.toBigNumber(unpacked.events[1].value[8]);

                let transType = 'Taker';
                if (isMyAddress(maker)) {
                    transType = 'Maker';
                    if (buyer === maker) {
                        tradeType = 'Buy';
                    } else {
                        tradeType = 'Sell';
                    }
                }

                let exchange = utility.relayName(relayer, 'DDEX');

                if (token && base && token.addr && base.addr) {
                    let amount = utility.weiToToken(rawTokenAmount, token);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);
                    let price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    let feeToken = base;
                    let fee = utility.toBigNumber(0);
                    if (transType === 'Maker') {
                        let makerFeeAmount = utility.toBigNumber(unpacked.events[1].value[3]);
                        let makerGasAmount = utility.toBigNumber(unpacked.events[1].value[6]);
                        let makerRebateAmount = utility.toBigNumber(unpacked.events[1].value[4]);

                        fee = utility.weiToToken(makerFeeAmount, base);
                        fee = fee.plus(utility.weiToToken(makerGasAmount, base));
                        fee = fee.minus(utility.weiToToken(makerRebateAmount, base));
                    } else {
                        let takerFeeAmount = utility.toBigNumber(unpacked.events[1].value[5]);
                        let takerGasAmount = utility.toBigNumber(unpacked.events[1].value[7]);
                        fee = utility.weiToToken(takerFeeAmount, base)
                        fee = fee.plus(utility.weiToToken(takerGasAmount, base));
                    }

                    return {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'buyer': buyer,
                        'seller': seller,
                        'fee': fee,
                        'feeCurrency': feeToken,
                        'transType': transType,
                        'tradeType': tradeType,
                        'relayer': relayer
                    };
                }
            }
            // DDEX hydro  trade event 1.0 ,  TODO v1.0 does not define whether it is buy or sell in event
            else if (unpacked.name == 'Match') {
                /* 1.0: event Match( address baseToken, address quoteToken, address relayer, address maker, address taker, uint256 baseTokenAmount, uint256 quoteTokenAmount, 
                        uint256 makerFee, uint256 takerFee, uint256 makerGasFee, uint256 makerRebate, uint256 takerGasFee ); 
                */

                //  let tradeType = 'Sell';
                let maker = unpacked.events[3].value.toLowerCase();
                let taker = unpacked.events[4].value.toLowerCase();
                let relayer = unpacked.events[2].value.toLowerCase();

                let base = this.setToken(unpacked.events[1].value);
                let token = this.setToken(unpacked.events[0].value);

                let rawBaseAmount = utility.toBigNumber(unpacked.events[6].value);
                let rawTokenAmount = utility.toBigNumber(unpacked.events[5].value);

                let transType = 'Taker';
                if (isMyAddress(maker)) {
                    transType = 'Maker';
                }

                let exchange = utility.relayName(relayer, 'DDEX');

                if (token && base && token.addr && base.addr) {
                    let amount = utility.weiToToken(rawTokenAmount, token);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);
                    let price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    let feeToken = base;
                    let fee = utility.toBigNumber(0);
                    if (transType === 'Maker') {
                        let makerFeeAmount = utility.toBigNumber(unpacked.events[7].value);
                        let makerGasAmount = utility.toBigNumber(unpacked.events[9].value);
                        let makerRebateAmount = utility.toBigNumber(unpacked.events[10].value);

                        fee = utility.weiToToken(makerFeeAmount, base);
                        fee = fee.plus(utility.weiToToken(makerGasAmount, base));
                        fee = fee.minus(utility.weiToToken(makerRebateAmount, base));
                    } else {
                        let takerFeeAmount = utility.toBigNumber(unpacked.events[8].value);
                        let takerGasAmount = utility.toBigNumber(unpacked.events[11].value);
                        fee = utility.weiToToken(takerFeeAmount, base);
                        fee = fee.plus(utility.weiToToken(takerGasAmount, base));
                    }

                    /*if (isMyAddress(buyUser))
                        tradeType = "Buy";
                    else if (isMyAddress(sellUser))
                        tradeType = "Sell";
                    */
                    return {
                        'type': transType + ' ' + 'Trade',
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'maker': maker,
                        'taker': taker,
                        'fee': fee,
                        'feeCurrency': feeToken,
                        'transType': transType,
                        'tradeType': tradeType,
                        'relayer': relayer
                    };
                }
            }
            //0x v1 error
            else if (unpacked.name == 'LogError' && unpacked.events && unpacked.events.length == 2) {

                const errortext = [
                    'ORDER_EXPIRED',                    // Order has already expired
                    'ORDER_FULLY_FILLED_OR_CANCELLED',  // Order has already been fully filled or cancelled
                    'ROUNDING_ERROR_TOO_LARGE',         // Rounding error too large
                    'INSUFFICIENT_BALANCE_OR_ALLOWANCE' // Insufficient balance or allowance for token transfer
                ];

                let errorid = Number(unpacked.events[0].value);
                if (errorid < errortext.length) {

                    let error = errortext[errorid];
                    return {
                        'type': '0x Error',
                        'description': error,
                    };
                }
            }
            // AirSwap error
            else if (unpacked.name == 'Failed') {

                // TODO, include trade data from event?

                //Event thrown when a trade fails
                const errortext = [
                    '', // 0 empty
                    'The makeAddress and takerAddress must be different',
                    'The order has expired',
                    'This order has already been filled',
                    'The ether sent with this transaction does not match takerAmount',
                    'No ether is required for a trade between tokens',
                    'The sender of this transaction must match the takerAddress',
                    'Order has already been cancelled or filled'
                ];

                let errorid = Number(unpacked.events[0].value);
                if (errorid < errortext.length) {

                    let error = errortext[errorid];
                    return {
                        'type': 'AirSwap Error',
                        'description': error,
                    };
                }
            }
            // AirSwap cancel/fill
            else if (unpacked.name === 'Canceled' || unpacked.name === 'Filled') {

                // event Filled(address indexed makerAddress, uint makerAmount, address indexed makerToken, address takerAddress, uint takerAmount, address indexed takerToken, uint256 expiration, uint256 nonce);
                // event Canceled(address indexed makerAddress, uint makerAmount, address indexed makerToken, address takerAddress, uint takerAmount, address indexed takerToken, uint256 expiration, uint256 nonce);
                let maker = unpacked.events[0].value.toLowerCase();
                let taker = unpacked.events[3].value.toLowerCase();
                let makerToken = this.setToken(unpacked.events[2].value);
                let takerToken = this.setToken(unpacked.events[5].value);

                let makerAmount = utility.toBigNumber(unpacked.events[1].value);
                let takerAmount = utility.toBigNumber(unpacked.events[4].value);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = 'Taker';
                if (isMyAddress(maker)) {
                    transType = 'Maker';
                }


                if (this.isBaseToken(takerToken, makerToken)) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else //if (this.isBaseToken(makerToken, takerToken)) // buy
                {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }

                let exchange = this.getExchangeName(unpacked.address, '');

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);
                    var buyUser = '';
                    var sellUser = '';
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                        sellUser = maker;
                        buyUser = taker;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    if (unpacked.name === 'Filled') {
                        return {
                            'type': transType + ' ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order.',
                            'token': token,
                            'amount': amount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                            'buyer': buyUser,
                            'seller': sellUser,
                            'fee': utility.toBigNumber(0),
                            'feeCurrency': undefined,
                            'transType': transType,
                            'tradeType': tradeType,
                        };
                    } else {
                        return {
                            'type': 'Cancel ' + tradeType,
                            'exchange': exchange,
                            'note': 'Cancelled an open order',
                            'token': token,
                            'amount': amount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                        };
                    }
                }
            }
            //kyber v1 trade
            else if (unpacked.name === 'ExecuteTrade') {

                //  event ExecuteTrade(address indexed sender, ERC20 src, ERC20 dest, uint actualSrcAmount, uint actualDestAmount);

                let taker = unpacked.events[0].value.toLowerCase();
                let maker = '';
                let makerToken = this.setToken(unpacked.events[2].value);
                let takerToken = this.setToken(unpacked.events[1].value);

                let takerAmount = utility.toBigNumber(unpacked.events[3].value);
                let makerAmount = utility.toBigNumber(unpacked.events[4].value);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = 'Taker';
                if (isMyAddress(maker)) {
                    transType = 'Maker';
                }


                if (this.isBaseToken(takerToken, makerToken)) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else //if (this.isBaseToken(makerToken, takerToken)) // buy
                {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }

                let exchange = this.getExchangeName(unpacked.address, '');

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);
                    var buyUser = '';
                    var sellUser = '';
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                        sellUser = maker;
                        buyUser = taker;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    return {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + 'performed a trade.',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'buyer': buyUser,
                        'seller': sellUser,
                        'fee': utility.toBigNumber(0),
                        'feeCurrency': undefined,
                        'transType': transType,
                        'tradeType': tradeType,
                    };
                }
            }
            // 0x v1 & v2 trade output event, (ethfinex)
            else if (unpacked.name == "LogFill" || unpacked.name == "Fill") {
                //ethfinex uses a forked 0x v1 contract
                const isEthfinexV1 = (unpacked.address.toLowerCase() == '0xdcdb42c9a256690bd153a7b409751adfc8dd5851');

                //0x v1: LogFill (index_topic_1 address maker, address taker, index_topic_2 address feeRecipient, address makerToken, address takerToken, uint256 filledMakerTokenAmount, uint256 filledTakerTokenAmount, uint256 paidMakerFee, uint256 paidTakerFee, index_topic_3 bytes32 tokens, bytes32 orderHash)
                /* v2:  event Fill(
                            address indexed makerAddress,         // Address that created the order.      
                            address indexed feeRecipientAddress,  // Address that received fees.
                            address takerAddress,                 // Address that filled the order.
                            address senderAddress,                // Address that called the Exchange contract (msg.sender).
                            uint256 makerAssetFilledAmount,       // Amount of makerAsset sold by maker and bought by taker. 
                            uint256 takerAssetFilledAmount,       // Amount of takerAsset sold by taker and bought by maker.
                            uint256 makerFeePaid,                 // Amount of ZRX paid to feeRecipient by maker.
                            uint256 takerFeePaid,                 // Amount of ZRX paid to feeRecipient by taker.
                            bytes32 indexed orderHash,            // EIP712 hash of order (see LibOrder.getOrderHash).
                            bytes makerAssetData,                 // Encoded data specific to makerAsset. 
                            bytes takerAssetData                  // Encoded data specific to takerAsset.
                        ); */
                /*
                v3  Fill (
                        index address makerAddress, 
                        index address feeRecipientAddress, 
                        bytes makerAssetData, 
                        bytes takerAssetData, 
                        bytes makerFeeAssetData, 
                        bytes takerFeeAssetData, 
                        index bytes32 orderHash, 
                        address takerAddress, 
                        address senderAddress, 
                        uint256 makerAssetFilledAmount, 
                        uint256 takerAssetFilledAmount, 
                        uint256 makerFeePaid, 
                        uint256 takerFeePaid, 
                        uint256 protocolFeePaid
                    )
                */

                let maker, taker, makerToken, takerToken, makerAmount, takerAmount,
                    makerFee, takerFee, relayer, sender, ethfinexFee, makerFeeToken, takerFeeToken, protocolFeeAmount;

                //zrx fee as default, (can change for v3)
                makerFeeToken = this.setToken('0xe41d2489571d322189246dafa5ebde1f4699f498');
                takerFeeToken = makerFeeToken;

                //0x v1
                if (unpacked.name == 'LogFill') {
                    maker = unpacked.events[0].value.toLowerCase();
                    taker = unpacked.events[1].value.toLowerCase();
                    sender = undefined;
                    makerToken = this.setToken(unpacked.events[3].value);
                    takerToken = this.setToken(unpacked.events[4].value);

                    makerAmount = utility.toBigNumber(unpacked.events[5].value);
                    takerAmount = utility.toBigNumber(unpacked.events[6].value);

                    makerFee = utility.weiToToken(unpacked.events[7].value, makerFeeToken);
                    takerFee = utility.weiToToken(unpacked.events[8].value, takerFeeToken);

                    relayer = unpacked.events[2].value.toLowerCase();

                    if (isEthfinexV1) { //ethfinex v1 is a 0xv1 fork with custom fee calculations
                        makerFeeToken = takerToken;
                        takerFeeToken = takerToken;
                        ethfinexFee = takerAmount.div(400);
                        makerFee = utility.weiToToken(ethfinexFee, makerFeeToken);
                    }
                }
                //0x v2&v3
                else {

                    // 'bytes' of proxy identifier + token address
                    let makerTokenAddr, takerTokenAddr, makerFeeAddr, takerFeeAddr, makerFeeAmount, takerFeeAmount;
                    maker = unpacked.events[0].value.toLowerCase();
                    relayer = unpacked.events[1].value.toLowerCase();

                    if (unpacked.events.length == 11) { //0x v2

                        taker = unpacked.events[2].value.toLowerCase();
                        sender = unpacked.events[3].value.toLowerCase();
                        makerTokenAddr = this.addressFromAssetData(unpacked.events[9].value, true);
                        takerTokenAddr = this.addressFromAssetData(unpacked.events[10].value, true);
                        makerFeeAddr = "0xe41d2489571d322189246dafa5ebde1f4699f498";
                        takerFeeAddr = "0xe41d2489571d322189246dafa5ebde1f4699f498";

                        makerAmount = utility.toBigNumber(unpacked.events[4].value);
                        takerAmount = utility.toBigNumber(unpacked.events[5].value);
                        makerFeeAmount = utility.toBigNumber(unpacked.events[6].value);
                        takerFeeAmount = utility.toBigNumber(unpacked.events[7].value);
                        // utility.weiToToken(unpacked.events[7].value, feeCurrency);

                    } else if (unpacked.events.length == 14) { //0x v3
                        taker = unpacked.events[7].value.toLowerCase();
                        sender = unpacked.events[8].value.toLowerCase();
                        makerTokenAddr = this.addressFromAssetData(unpacked.events[2].value, true);
                        takerTokenAddr = this.addressFromAssetData(unpacked.events[3].value, true);
                        makerFeeAddr = this.addressFromAssetData(unpacked.events[4].value, true);
                        takerFeeAddr = this.addressFromAssetData(unpacked.events[5].value, true);

                        makerAmount = utility.toBigNumber(unpacked.events[9].value);
                        takerAmount = utility.toBigNumber(unpacked.events[10].value);
                        makerFeeAmount = utility.toBigNumber(unpacked.events[11].value);
                        takerFeeAmount = utility.toBigNumber(unpacked.events[12].value);
                        protocolFeeAmount = utility.toBigNumber(unpacked.events[13].value);
                    } else {
                        return { 'error': 'unsupported amount of Fill params' };
                    }

                    //can be null for unrecognized asset proxy types (not erc20, erc721 or MAP)
                    if (!makerTokenAddr || !takerTokenAddr) {
                        return { 'error': 'unsupported AssetData token in trade' };
                    }

                    makerToken = this.setToken(makerTokenAddr);
                    takerToken = this.setToken(takerTokenAddr);

                    if (makerFeeAddr) {
                        makerFeeToken = this.setToken(makerFeeAddr);
                        makerFee = utility.weiToToken(makerFeeAmount, makerFeeToken);
                    } else {
                        makerFee = utility.toBigNumber(0);
                    }
                    if (takerFeeAddr) {
                        takerFeeToken = this.setToken(takerFeeAddr);
                        takerFee = utility.weiToToken(takerFeeAmount, takerFeeToken);
                    } else {
                        takerFee = utility.toBigNumber(0);
                    }
                }
                //from here on mixed 0x v1 v2 v3 output

                //if relay is 0x0000000.. , assume the taker might be the relayer
                if (taker && relayer === this.config.ethAddr) {
                    relayer = taker;
                    if (sender && sender !== this.config.ethAddr) {
                        relayer = sender;
                    }
                }
                let exchange = utility.relayName(relayer);
                let tradeType = 'Sell';
                let token = undefined;
                let base = undefined;
                let transType = 'Taker';

                if (isMyAddress(maker)) {
                    transType = 'Maker';
                }

                if (this.isBaseToken(takerToken, makerToken)) {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                } else {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }

                if (token && base && token.addr && base.addr) {
                    let rawAmount = utility.toBigNumber(0);
                    let rawBaseAmount = utility.toBigNumber(0);
                    let buyUser = '';
                    let sellUser = '';
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                        sellUser = maker;
                        buyUser = taker;
                    }

                    let amount = utility.weiToToken(rawAmount, token);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);
                    let price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    if (isEthfinexV1) {
                        if (tradeType === 'Sell') {
                            rawAmount = takerAmount.minus(ethfinexFee);
                            amount = utility.weiToToken(rawAmount, token);
                        } else {
                            rawBaseAmount = takerAmount.minus(ethfinexFee);
                            baseAmount = utility.weiToToken(rawBaseAmount, base);
                        }
                    }

                    // single units if erc721
                    if (token.erc721) {
                        amount = utility.toBigNumber(1);
                        baseAmount = amount.times(price);
                    }
                    if (base.erc721) {
                        baseAmount = utility.toBigNumber(1);
                        if (token.erc721) {
                            price = utility.toBigNumber(1);
                        }
                    }

                    let protocolFeeToken = this.setToken(this.config.ethAddr); //v3 only
                    let protocolFee = utility.toBigNumber(0);
                    if (protocolFeeAmount) {
                        protocolFee = utility.weiToToken(protocolFeeAmount, protocolFeeToken);
                    }

                    let fee = utility.toBigNumber(0);
                    let feeCurrency = undefined;
                    if (transType === 'Maker') {
                        fee = makerFee;
                        feeCurrency = makerFeeToken;
                    } else {
                        fee = takerFee;
                        feeCurrency = takerFeeToken;

                        //it is v3 if protocol fee for taker
                        if (protocolFeeAmount) {
                            if (!takerFee || Number(takerFee) == 0) { // no taker fee, set protocl fee as taker fee
                                fee = protocolFee;
                                feeCurrency = protocolFeeToken;
                            }
                            else if (takerFee && utility.isWrappedETH(takerFeeToken.addr)) { //taker fee in (W)ETH, add protocol fee
                                fee = protocolFee.plus(takerFee);
                                feeCurrency = protocolFeeToken;
                            }
                            //else TODO handle taker fee & protocol fee in different tokens
                        }
                    }
                    if (isEthfinexV1) {
                        feeCurrency = takerToken;
                    }


                    if (isMyAddress(buyUser)) {
                        tradeType = "Buy";
                    } else if (isMyAddress(sellUser)) {
                        tradeType = "Sell";
                    }

                    let obj = {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'buyer': buyUser,
                        'seller': sellUser,
                        'fee': fee,
                        'makerFee': makerFee, //ethfinex v1
                        'feeCurrency': feeCurrency,
                        'transType': transType,
                        'tradeType': tradeType,
                        'relayer': relayer
                    };

                    if (!isEthfinexV1) {
                        delete obj.makerFee;
                    }

                    return obj;
                }
            }
            //Bancor trade
            else if (unpacked.name == 'Conversion' || unpacked.name == 'Change') {
                // Change (index_topic_1 address _fromToken, index_topic_2 address _toToken, index_topic_3 address _trader, uint256 _amount, uint256 _return, uint256 _currentPriceN, uint256 _currentPriceD)
                //4 conversion variants
                //Conversion (index_topic_1 address _fromToken, index_topic_2 address _toToken, index_topic_3 address _trader, uint256 _amount, uint256 _return, uint256 _currentPriceN, uint256 _currentPriceD)
                //Conversion (index_topic_1 address _fromToken, index_topic_2 address _toToken, index_topic_3 address _trader, uint256 _amount, uint256 _return, int256 _conversionFee, uint256 _currentPriceN, uint256 _currentPriceD)
                //Conversion (index_topic_1 address _fromToken, index_topic_2 address _toToken, index_topic_3 address _trader, uint256 _amount, uint256 _return, int256 _conversionFee)
                //Conversion (index_topic_1 address _smartToken, index_topic_2 address _fromToken, index_topic_3 address _toToken, uint256 _fromAmount, uint256 _toAmount, address _trader)

                let isV4 = false;
                let taker, makerToken, takerToken;
                if (unpacked.events[0].name == '_fromToken') {
                    taker = unpacked.events[2].value.toLowerCase();
                    makerToken = this.setToken(unpacked.events[1].value);
                    takerToken = this.setToken(unpacked.events[0].value);
                    // Change can call itself the taker in the trade
                    if (unpacked.name == 'Change' && txSender && taker == unpacked.address.toLowerCase()) {
                        taker = txSender;
                    }

                } else {
                    taker = unpacked.events[5].value.toLowerCase();
                    makerToken = this.setToken(unpacked.events[2].value);
                    takerToken = this.setToken(unpacked.events[1].value);
                    isV4 = true;
                }

                let makerAmount = utility.toBigNumber(unpacked.events[4].value);
                let takerAmount = utility.toBigNumber(unpacked.events[3].value);



                var exchange = 'Bancor ';

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = 'Taker';
                if (!isV4) {
                    if (makerToken.name === "???" && takerToken.name !== "???") {
                        makerToken.name = "??? RelayBNT";
                    } else if (takerToken.name === "???" && makerToken.name !== "???") {
                        takerToken.name = "??? RelayBNT";
                    }
                }

                if (this.isBaseToken(takerToken, makerToken) || (makerToken.name !== "BNT" && (smartRelays[takerToken.addr] || takerToken.name === "??? RelayBNT"))) { // get eth  -> sell
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                } else {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);
                    var buyUser = '';
                    var sellUser = '';
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                        sellUser = maker;
                        buyUser = taker;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    let fee = '';
                    let feeCurrency = '';

                    //variant that includes fee
                    if (!isV4 && (unpacked.events.length == 8 || unpacked.events.length == 6)) {
                        feeCurrency = makerToken;
                        let rawFee = utility.toBigNumber(unpacked.events[5].value);
                        if (token == makerToken) {
                            fee = utility.weiToToken(rawFee, token);
                        } else {
                            fee = utility.weiToToken(rawFee, base);
                        }
                    }

                    return {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + ' made a Bancor conversion.',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'buyer': buyUser,
                        'seller': sellUser,
                        'fee': fee,
                        'feeCurrency': feeCurrency,
                        'transType': transType,
                        'tradeType': tradeType,
                    };
                }
            }
            // bancor cross-chain transfer (out to other blockchain)
            else if (unpacked.name == 'XTransfer') {
                //XTransfer (index_topic_1 address _from, bytes32 _toBlockchain, index_topic_2 bytes32 _to, uint256 _amount, uint256 _id)
                let from = unpacked.events[0].value.toLowerCase();
                let rawAmount = unpacked.events[3].value;
                let token = this.setToken('0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c'); // BNT hardcoded
                let chain = Ethers.utils.parseBytes32String(unpacked.events[1].value).trim();
                let chainAddr = Ethers.utils.parseBytes32String(unpacked.events[2].value).trim();
                let amount = utility.weiToToken(rawAmount, token);

                let note = 'Cross-chain token transfer of BNT to ' + chain;

                return {
                    'type': 'Transfer (cross-chain)',
                    'exchange': 'BancorX',
                    'note': note,
                    'token': token,
                    'amount': amount,
                    'from': from,
                    'blockchain': chain,
                    'chainDestination': chainAddr,
                    'unlisted': token.unlisted,
                };
            }
            // bancorX cross chain transfer (in from other blockchain)
            else if (unpacked.name == 'TxReport') {
                //TxReport (index_topic_1 address _reporter, bytes32 _fromBlockchain, uint256 _txId, address _to, uint256 _amount, uint256 _xTransferId)
                let to = unpacked.events[3].value.toLowerCase();
                let rawAmount = unpacked.events[4].value;
                let token = this.setToken('0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c'); // BNT hardcoded
                let chain = Ethers.utils.parseBytes32String(unpacked.events[1].value).trim();
                let amount = utility.weiToToken(rawAmount, token);

                let note = 'Cross-chain token transfer of BNT from ' + chain;

                return {
                    'type': 'Transfer (cross-chain)',
                    'exchange': 'BancorX',
                    'note': note,
                    'token': token,
                    'amount': amount,
                    'blockchain': chain,
                    'to': to,
                    'unlisted': token.unlisted,
                };
            }
            // ETH/erc20 deposit/withdraw  etherdelta/decentrex, idex, enclaves 
            else if (unpacked.events.length >= 4 && (unpacked.name == 'Deposit' || unpacked.name == 'Withdraw')) {

                let type = unpacked.name;
                let token = this.setToken(unpacked.events[0].value);
                let user = unpacked.events[1].value;
                let rawAmount = unpacked.events[2].value;
                let rawBalance = unpacked.events[3].value;
                let exchange = this.getExchangeName(unpacked.address, '');
                let note = '';

                if (token && token.addr) {
                    let amount = utility.weiToToken(rawAmount, token);
                    let balance = utility.weiToToken(rawBalance, token);
                    if (unpacked.name === 'Withdraw') {
                        note = 'Withdrawn from the ';
                    }
                    else {
                        note = 'Deposited into the ';
                    }
                    if (exchange) {
                        note += exchange + 'contract';
                    } else {
                        note += 'exchange contract';
                    }

                    if (token.addr !== this.config.ethAddr)
                        type = 'Token ' + type;
                    return {
                        'type': type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': amount,
                        'balance': balance,
                        'unlisted': token.unlisted,
                    };
                }
            }
            // ETH/erc20 deposit/withdraw  IDEX2.0
            else if (unpacked.name == 'Deposited' || unpacked.name == 'Withdrawn' || unpacked.name == 'WalletExitWithdrawn') {

                let type = "Deposit";
                let exchange = this.getExchangeName(unpacked.address, '');
                let rawAmountPip = undefined; //idex rounded to 8 decimal pip units
                let rawBalance = undefined;
                let token = undefined;
                let note = '';
                if (unpacked.name.indexOf("With") >= 0) {
                    type = "Withdraw";
                    rawAmountPip = unpacked.events[3].value;
                    rawBalance = unpacked.events[5].value;
                    token = this.setToken(unpacked.events[1].value);
                    note = 'Withdrawn from the ';
                } else {
                    rawAmountPip = unpacked.events[5].value;
                    rawBalance = unpacked.events[7].value;
                    token = this.setToken(unpacked.events[2].value);
                    note = 'Deposited into the ';
                }

                if (token && token.addr) {
                    let amount = utility.idexPipToToken(rawAmountPip, token);
                    let balance = utility.weiToToken(rawBalance, token);

                    if (exchange) {
                        note += exchange + 'contract';
                    } else {
                        note += 'exchange contract';
                    }

                    if (token.addr !== this.config.ethAddr)
                        type = 'Token ' + type;
                    return {
                        'type': type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': amount,
                        'balance': balance,
                        'unlisted': token.unlisted,
                    };
                }
            }
            //dex.blue deposit, withdraw events
            else if (unpacked.name == 'LogDeposit' || unpacked.name == 'LogWithdrawal'
                || unpacked.name == 'LogDirectWithdrawal' || unpacked.name == 'LogSingleSigWithdrawal') {
                let type = unpacked.name;
                type = type.replace('Log', '');
                type = type.replace('Direct', '');
                type = type.replace('SingleSig', '');
                type = type.replace('wal', 'w');

                let token = this.setToken(unpacked.events[1].value);
                let user = unpacked.events[0].value;
                let rawAmount = unpacked.events[2].value;
                let exchange = this.getExchangeName(unpacked.address, '');

                if (token && token.addr) {
                    let amount = utility.weiToToken(rawAmount, token);
                    if (type === 'Withdraw') {
                        note = 'Withdrawn from ';
                    }
                    else {
                        note = 'Deposited into ';
                    }
                    if (exchange) {
                        note += exchange;
                    } else {
                        note += 'the exchange contract';
                    }

                    if (token.addr !== this.config.ethAddr)
                        type = 'Token ' + type;
                    return {
                        'type': type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': amount,
                        'balance': "",
                        'unlisted': token.unlisted,
                    };
                }
            }
            // ethen.market deposit/withdraw
            else if (unpacked.name == 'DepositEther' || unpacked.name == 'WithdrawEther' || unpacked.name == 'WithdrawToken' || unpacked.name == 'DepositToken') {

                var user = unpacked.events[0].value.toLowerCase();

                var rawAmount = undefined;
                var rawBalance = undefined;
                var token = undefined;

                var type = unpacked.name;

                if (unpacked.name.indexOf('Ether') !== -1) {
                    token = this.setToken(this.config.ethAddr);
                    rawAmount = unpacked.events[1].value;
                    rawBalance = unpacked.events[2].value;
                    type = type.replace('Ether', '');
                } else {
                    token = this.setToken(unpacked.events[1].value);
                    rawAmount = unpacked.events[2].value;
                    rawBalance = unpacked.events[3].value;
                    type = type.replace('Token', '');
                }

                let exchange = this.getExchangeName(unpacked.address, '');

                if (token && token.addr) {
                    var amount = utility.weiToToken(rawAmount, token);
                    var balance = utility.weiToToken(rawBalance, token);
                    if (unpacked.name === 'Withdraw') {
                        note = 'Withdrawn from the ';
                    }
                    else {
                        note = 'Deposited into the ';
                    }
                    if (exchange) {
                        note += exchange + 'contract';
                    } else {
                        note += 'exchange contract';
                    }

                    if (token.addr !== this.config.ethAddr)
                        type = 'Token ' + type;
                    return {
                        'type': type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': amount,
                        'balance': balance,
                        'unlisted': token.unlisted,
                    };
                }
            }
            //Switcheo balance change event, deposit/withdraw, trade, cancel
            else if (unpacked.name == 'BalanceIncrease' || unpacked.name == 'BalanceDecrease') {
                //BalanceIncrease (index_topic_1 address user, index_topic_2 address token, uint256 amount, index_topic_3 uint8 reason)
                const reasons = {
                    1: 'Deposit',
                    2: 'Maker Trade',
                    3: 'Taker Trade',
                    4: 'Fee',
                    5: 'Taker Trade',
                    6: 'Maker Trade',
                    7: 'Fee',
                    8: 'Cancel',
                    9: 'Withdraw',
                    16: 'Fee', //0x10
                    17: 'Fee', //0x11
                    18: 'Fee',
                    19: 'Fee',
                    20: 'Fee',
                    21: 'Fee',
                }
                let user = unpacked.events[0].value.toLowerCase();
                let token = this.setToken(unpacked.events[1].value);
                let exchange = this.getExchangeName(unpacked.address, '');

                if (token && token.addr) {
                    let rawAmount = unpacked.events[2].value;
                    let amount = utility.weiToToken(rawAmount, token);

                    let dir = '';
                    if (unpacked.name == 'BalanceIncrease') {
                        dir = '+';
                    } else {
                        dir = '-';
                    }
                    let reason = Number(unpacked.events[3].value);
                    if (reasons[reason]) {
                        reason = reasons[reason];
                    } else {
                        reason = '';
                    }

                    return {
                        'type': reason,
                        'change': dir,
                        'exchange': exchange,
                        'note': 'Updated the exchange balance',
                        'token': token,
                        'amount': amount,
                        'wallet': user,
                        'unlisted': token.unlisted,
                    };
                }
            }
            // ETH wrapping
            else if (
                utility.isWrappedETH(unpacked.address.toLowerCase()) &&
                (unpacked.events.length == 1 && (unpacked.name == 'Destruction' || unpacked.name == 'Issuance'))
                || (unpacked.events.length == 2 && (unpacked.name == 'Deposit' || unpacked.name == 'Withdrawal'))
            ) {
                var type = '';
                var token = this.setToken(unpacked.address);
                var tokenETH = this.setToken(this.config.ethAddr);
                var user = '';
                var rawAmount = utility.toBigNumber(0);
                if (unpacked.events.length == 2) {
                    user = unpacked.events[0].value;
                    rawAmount = utility.toBigNumber(unpacked.events[1].value);
                } else {
                    rawAmount = utility.toBigNumber(unpacked.events[0].value);
                }

                if (token && token.addr) {
                    var amount = utility.weiToEth(rawAmount);
                    var fromToken = undefined;
                    var toToken = undefined;
                    if (unpacked.name === 'Withdrawal' || unpacked.name === 'Destruction') {
                        type = 'Unwrap ETH';
                        note = 'Unwrap WETH back to ETH';
                        fromToken = token;
                        toToken = tokenETH;
                    }
                    else {
                        type = 'Wrap ETH';
                        note = 'Wrap ETH to WETH';
                        fromToken = tokenETH;
                        toToken = token;
                    }

                    return {
                        'type': type,
                        'note': note,
                        'token In': fromToken,
                        'token Out': toToken,
                        'amount': amount,
                        'unlisted': token.unlisted,
                        'wallet': user
                    };
                }
            }
            // token burn, mint  (also used for WETH)
            else if (unpacked.name == 'Destruction' || unpacked.name == 'Issuance') {
                let token = this.setToken(unpacked.address);
                let amount = '';
                if (token) {
                    amount = utility.weiToEth(utility.toBigNumber(unpacked.events[0].value));
                }

                let type = (unpacked.name == 'Destruction' ? 'Burn tokens' : 'Mint tokens')
                /* return {
                     'type': type,
                     'token': token,
                     'amount': amount,
                 }; */
                return undefined;
            }
            // DDEX hydro (1.0, 1.1) cancel event  (TODO, get order from hash?)
            else if (unpacked.name == 'Cancel' && unpacked.events.length == 1 && unpacked.events[0].name == 'orderHash') {
                let exchange = this.getExchangeName(unpacked.address, '');

                return {
                    'type': 'Cancel order',
                    'exchange': exchange,
                    'orderHash': unpacked.events[0].value,
                };
            }
            // Order cancel etherdelta, decentrex, token store, enclaves 
            //  0x v2  v3
            else if (unpacked.name == 'Cancel') {
                //everything besides 0x v2 cancel
                if (unpacked.events[0].name !== 'makerAddress') {
                    var cancelType = 'sell';
                    var token = undefined;
                    var base = undefined;


                    let tokenGet = this.setToken(unpacked.events[0].value);
                    let tokenGive = this.setToken(unpacked.events[2].value);

                    if (this.isBaseToken(tokenGet, tokenGive)) // get eth  -> sell
                    {
                        cancelType = 'buy';
                        token = tokenGive;
                        base = tokenGet;
                    }
                    else //if (this.isBaseToken(tokenGive, tokenGet)) // buy
                    {
                        token = tokenGet;
                        base = tokenGive;
                    }

                    let exchange = this.getExchangeName(unpacked.address, '');

                    /*   let maker = '';
                       if (unpacked.events.length >= 7 && unpacked.events[6].name == 'user') {
                           maker = unpacked.events[6].value.toLowerCase();
                       } */

                    if (token && base && token.addr && base.addr) {
                        var rawAmount = utility.toBigNumber(0);
                        var rawBaseAmount = utility.toBigNumber(0);
                        if (cancelType === 'sell') {
                            rawAmount = utility.toBigNumber(unpacked.events[1].value);
                            rawBaseAmount = utility.toBigNumber(unpacked.events[3].value);
                        } else {
                            rawBaseAmount = utility.toBigNumber(unpacked.events[1].value);
                            rawAmount = utility.toBigNumber(unpacked.events[3].value);
                        }

                        var amount = utility.weiToToken(rawAmount, token);
                        var baseAmount = utility.weiToToken(rawBaseAmount, base);
                        var price = utility.toBigNumber(0);
                        if (amount.greaterThan(0)) {
                            price = baseAmount.div(amount);
                        }
                        return {
                            'type': 'Cancel ' + cancelType,
                            'exchange': exchange,
                            'note': 'Cancelled an open order',
                            'token': token,
                            'amount': amount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            //   'maker': maker,
                            'unlisted': token.unlisted,
                        };
                    }
                } else { //0x v2 v3 'Cancel' event

                    //param order for 0xv2
                    let makerAssetIndex = 4;
                    let takerAssetIndex = 5;
                    let senderIndex = 2;

                    //switched param order for 0xv3
                    if (unpacked.events[2].name == 'makerAssetData') {
                        makerAssetIndex = 2;
                        takerAssetIndex = 3;
                        senderIndex = 4;
                    }


                    let makerTokenData = unpacked.events[makerAssetIndex].value;
                    let takerTokenData = unpacked.events[takerAssetIndex].value;

                    let makerTokenAddr = this.addressFromAssetData(makerTokenData, true);
                    let takerTokenAddr = this.addressFromAssetData(takerTokenData, true);

                    if (makerTokenAddr && takerTokenAddr) {

                        let maker = unpacked.events[0].value.toLowerCase();
                        let sender = unpacked.events[senderIndex].value.toLowerCase();

                        let makerToken = this.setToken(makerTokenAddr);
                        let takerToken = this.setToken(takerTokenAddr);

                        let base = makerToken;
                        let token = takerToken;
                        if (this.isBaseToken(takerToken, makerToken)) {
                            base = takerToken;
                            token = makerToken;
                        }

                        let relayer = unpacked.events[1].value.toLowerCase();

                        //if relay is 0x0000000.. , assume the sender might be the relayer
                        if (sender && relayer === this.config.ethAddr) {
                            relayer = sender;
                        }
                        let exchange = utility.relayName(relayer);

                        //TODO retrieve order by orderHash and get price & amount?

                        return {
                            'type': 'Cancel',
                            'exchange': exchange,
                            'note': 'Cancelled an open order',
                            'token': token,
                            //   'amount': "",
                            //    'price': "",
                            'base': base,
                            //   'baseAmount': "",
                            'maker': maker,
                            'unlisted': token.unlisted,
                        };
                    } else {
                        return { 'error': 'unsupported ERC721 trade' };
                    }
                }
            }
            // 0x v2 v3 cancelUpTo
            else if (unpacked.name == "CancelUpTo") {
                //let maker = unpacked.events[0].value.toLowerCase();
                let upTo = Number(unpacked.events[2].value);
                let exchange = this.getExchangeName(unpacked.address, '0x Exchange');
                return {
                    'type': 'Cancel up to',
                    'exchange': exchange,
                    'tokens': 'All',
                    'note': 'Cancelled all 0x orders placed up to a certain moment',
                    'orderEpoch': upTo
                };
            }
            //0x v1 cancel
            else if (unpacked.name == 'LogCancel') {
                let maker = unpacked.events[0].value.toLowerCase();
                let relayer = unpacked.events[1].value.toLowerCase();
                let makerToken = this.setToken(unpacked.events[2].value);
                let takerToken = this.setToken(unpacked.events[3].value);

                let makerAmount = utility.toBigNumber(unpacked.events[4].value);
                let takerAmount = utility.toBigNumber(unpacked.events[5].value);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var exchange = '';
                exchange = utility.relayName(relayer); //relayers with only a fixed taker and no feeRecipients remain unidentified here

                if (this.isBaseToken(takerToken, makerToken)) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else //if (this.isBaseToken(makerToken, takerToken)) // buy
                {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;

                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    return {
                        'type': 'Cancel' + ' ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(maker, true, true) + 'Cancelled an open order in the orderbook.',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'relayer': relayer
                    };
                }
            }
            // IDEX 2.0 cancel event
            else if (unpacked.name == "OrderNonceInvalidated") {
                //(address indexed wallet, uint128 nonce, uint128 timestampInMs, uint256 effectiveBlockNumber)
                let maker = unpacked.events[0].value.toLowerCase();
                let upTo = utility.formatDate(new Date(unpacked.events[2].value), false, true);
                let exchange = this.getExchangeName(unpacked.address, '');

                return {
                    'type': 'Cancel up to',
                    'exchange': exchange,
                    'tokens': 'All',
                    'note': 'Cancelled all IDEX orders placed up to a certain moment',
                    'date': upTo,
                    'blockNumber': unpacked.events[3].value
                };
            }
            // oasis maker
            else if (unpacked.name == 'LogKill' || unpacked.name == 'LogMake') {
                //	LogKill (index_topic_1 bytes32 id, index_topic_2 bytes32 pair, index_topic_3 address maker, address pay_gem, address buy_gem, uint128 pay_amt, uint128 buy_amt, uint64 timestamp)
                // 	LogMake (index_topic_1 bytes32 id, index_topic_2 bytes32 pair, index_topic_3 address maker, address pay_gem, address buy_gem, uint128 pay_amt, uint128 buy_amt, uint64 timestamp)
                let maker = unpacked.events[2].value.toLowerCase();

                let makerToken = this.setToken(unpacked.events[4].value);
                let takerToken = this.setToken(unpacked.events[3].value);

                let makerAmount = utility.toBigNumber(unpacked.events[6].value);
                let takerAmount = utility.toBigNumber(unpacked.events[5].value);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                let exchange = this.getExchangeName(unpacked.address, '');

                if (this.isBaseToken(takerToken, makerToken)) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else //if (this.isBaseToken(makerToken, takerToken)) // buy
                {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;

                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    if (unpacked.name == 'LogKill') {
                        return {
                            'type': 'Cancel' + ' ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(maker, true, true) + 'Cancelled an open order in the orderbook.',
                            'token': token,
                            'amount': amount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                        };
                    } else { //logMake
                        return {
                            'type': tradeType + ' offer',
                            'exchange': exchange,
                            'note': utility.addressLink(maker, true, true) + 'Placed an order in the orderbook.',
                            'token': token,
                            'amount': amount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                        };
                    }
                }
            }
            //oasis taker
            else if (unpacked.name == 'LogTake') {
                // LogTake (bytes32 id, index_topic_1 bytes32 pair, index_topic_2 address maker, address pay_gem, address buy_gem, index_topic_3 address taker, uint128 take_amt, uint128 give_amt, uint64 timestamp)
                let maker = unpacked.events[2].value.toLowerCase();

                let makerToken = this.setToken(unpacked.events[3].value);
                let takerToken = this.setToken(unpacked.events[4].value);

                let taker = unpacked.events[5].value.toLowerCase();
                let makerAmount = utility.toBigNumber(unpacked.events[6].value);
                let takerAmount = utility.toBigNumber(unpacked.events[7].value);

                let feeCurrency = '';
                let fee = utility.toBigNumber(0);

                let exchange = this.getExchangeName(unpacked.address, '');
                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = 'Taker';
                if (isMyAddress(maker)) {
                    transType = 'Maker';
                }


                if (this.isBaseToken(takerToken, makerToken)) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else //if (this.isBaseToken(makerToken, takerToken)) // buy
                {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = utility.toBigNumber(0);
                    var rawBaseAmount = utility.toBigNumber(0);
                    var buyUser = '';
                    var sellUser = '';
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                        sellUser = maker;
                        buyUser = taker;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    if (isMyAddress(buyUser))
                        tradeType = "Buy";
                    else if (isMyAddress(sellUser))
                        tradeType = "Sell";

                    return {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'buyer': buyUser,
                        'seller': sellUser,
                        'fee': fee,
                        'feeCurrency': feeCurrency,
                        'transType': transType,
                        'tradeType': tradeType,
                    };
                }
            }
            // trade event for 0x v3 exchange proxy: Matcha.xyz
            else if (unpacked.name == 'TransformedERC20') {
                //"event TransformedERC20(address indexed taker, address inputToken, address outputToken, address inputTokenAmount, address outputTokenAmount)"

                //TODO event doesn't include fees included in regualr 0x fills

                let taker = unpacked.events[0].value.toLowerCase();
                let takerToken = this.setToken(unpacked.events[1].value);
                let makerToken = this.setToken(unpacked.events[2].value);

                let makerAmount = utility.toBigNumber(unpacked.events[4].value);
                let takerAmount = utility.toBigNumber(unpacked.events[3].value);

                let feeCurrency = '';
                let fee = utility.toBigNumber(0);
                let transType = 'Taker';

                let exchange = this.getExchangeName(unpacked.address, '');
                let tradeType = 'Sell';
                let token = undefined;
                let base = undefined;


                if (this.isBaseToken(takerToken, makerToken)) {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }

                if (token && base && token.addr && base.addr) {
                    let rawAmount = utility.toBigNumber(0);
                    let rawBaseAmount = utility.toBigNumber(0);

                    let buyUser = '';
                    let sellUser = '';
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;
                        sellUser = taker;
                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                        buyUser = taker;
                    }

                    let amount = utility.weiToToken(rawAmount, token);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);
                    let price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }


                    return {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + ' traded with the ' + exchange + ' DEX aggregator',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'buyer': buyUser,
                        'seller': sellUser,
                        'fee': fee,
                        'feeCurrency': feeCurrency,
                        'transType': transType,
                        'tradeType': tradeType,
                    };
                }
            }

            // erc 20 transfer event
            // erc 721 transfer event
            else if (unpacked.name == 'Transfer') {

                var from = unpacked.events[0].value.toLowerCase();
                var to = unpacked.events[1].value.toLowerCase();
                var rawAmount = unpacked.events[2].value;
                var token = this.setToken(unpacked.address);

                var amount = undefined;
                if (!token.erc721 && !(token.unknown && unpacked.events[2].name == 'tokenId')) { //tokenId renamed on erc721 based on abi overload
                    amount = utility.weiToToken(rawAmount, token);
                } else {
                    amount = utility.toBigNumber(1);
                    // set token to unique erc721 token ID, id field matches amount in erc20
                    token = this.setToken(token.addr + '-' + rawAmount);
                }
                var note = 'Transferred ' + amount.toString() + ' ' + token.name;

                return {
                    'type': 'Transfer',
                    'note': note,
                    'token': token,
                    'amount': amount,
                    'from': from,
                    'to': to,
                    'unlisted': token.unlisted,
                };
            }
            // erc20 approval event  (exlcude weird contract in ancient OasisDex trade)
            // erc721 approval event
            else if (unpacked.name == 'Approval' && unpacked.address !== '0x96477a1c968a0e64e53b7ed01d0d6e4a311945c2') {

                var sender = unpacked.events[0].value.toLowerCase();
                var to = unpacked.events[1].value.toLowerCase();
                var rawAmount = unpacked.events[2].value;
                var token = this.setToken(unpacked.address);

                var amount = undefined;
                if (!token.erc721 && !(token.unknown && unpacked.events[2].name == 'tokenId')) { //tokenId renamed on erc721 based on abi overload
                    amount = utility.weiToToken(rawAmount, token);
                } else {
                    amount = utility.toBigNumber(1);
                    // set token to unique erc721 token ID, id field matches amount in erc20
                    token = this.setToken(token.addr + '-' + rawAmount);
                }

                let exchange = this.getExchangeName(to, 'unknown ');
                if (exchange === 'unknown ') {
                    // bancor quick convert, sending out approves?
                    this.getExchangeName(sender, 'unknown ');
                }

                return {
                    'type': 'Approve',
                    'exchange': exchange,
                    'note': 'Now allows tokens to be transferred by ' + exchange,
                    'token': token,
                    'amount': amount,
                    'from': sender,
                    'to': to,
                    'unlisted': token.unlisted,
                };
            }
            // ERC721 enable approve
            else if (unpacked.name == 'ApprovalForAll') {

                var sender = unpacked.events[0].value.toLowerCase();
                var to = unpacked.events[1].value.toLowerCase();
                var all = unpacked.events[2].value;
                var token = this.setToken(unpacked.address);
                if (!token.erc721) {
                    token.erc721 = true;
                    token.decimals = 0;
                    this.uniqueTokens[token.addr] = token;
                }

                let exchange = this.getExchangeName(to, 'unknown ');
                if (exchange === 'unknown ') {
                    // bancor quick convert, sending out approves?
                    this.getExchangeName(sender, 'unknown ');
                }
                return {
                    'type': 'Approve',
                    'exchange': exchange,
                    'note': 'Approve all erc721 tokenIDs to be moved by ' + exchange,
                    'token': token,
                    'amount': all ? 'All' : 0,
                    'from': sender,
                    'to': to,
                    'unlisted': token.unlisted,
                };
            }
            //ethex taker trade 
            else if (unpacked.name == 'TakeBuyOrder' || unpacked.name == 'TakeSellOrder') {
                let maker = '';
                let taker = '';
                let buyer = '';
                let seller = '';
                let tradeType = '';
                let transType = 'Taker'

                if (unpacked.name == 'TakeSellOrder') {
                    tradeType = 'Buy';
                    maker = unpacked.events[6].value.toLowerCase();
                    taker = unpacked.events[5].value.toLowerCase();
                    buyer = taker;
                    seller = maker;

                    if (isMyAddress(maker)) {
                        tradeType = 'Sell';
                        transType = 'Maker';
                    }
                } else {
                    tradeType = 'Sell';
                    maker = unpacked.events[5].value.toLowerCase();
                    taker = unpacked.events[6].value.toLowerCase();
                    seller = taker;
                    buyer = maker;

                    if (isMyAddress(maker)) {
                        tradeType = 'Buy';
                        transType = 'Maker';
                    }
                }

                let base = this.setToken(this.config.ethAddr);
                let token = this.setToken(unpacked.events[1].value);

                let exchange = this.getExchangeName(unpacked.address, '');

                if (token && base) {
                    let tokenAmount = utility.weiToToken(unpacked.events[2].value, token);
                    let rawBaseAmount = utility.toBigNumber(unpacked.events[3].value);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var price = utility.toBigNumber(0);
                    if (tokenAmount.greaterThan(0)) {
                        price = baseAmount.div(tokenAmount);
                    }

                    // less than full base amount
                    if (unpacked.name == 'TakeSellOrder' && unpacked.events[3].value !== unpacked.events[4].value) {
                        baseAmount = utility.weiToToken(unpacked.events[4].value, base);
                        tokenAmount = baseAmount.div(price);
                    }
                    //less than full token amount
                    else if (unpacked.name == 'TakeBuyOrder' && unpacked.events[2].value !== unpacked.events[4].value) {
                        tokenAmount = utility.weiToToken(unpacked.events[4].value, token);
                        baseAmount = tokenAmount.times(price);
                    }


                    let fee = utility.toBigNumber(0);
                    if (Number(unpacked.blockNumber) > 10000000) { // free fee period
                        const takeFee = utility.toBigNumber(2500000000000000);
                        const makeFee = utility.toBigNumber(0);
                        const ether1 = utility.toBigNumber(1000000000000000000);
                        let currentFee = fee;
                        if (transType == 'Maker') {
                            currentFee = makeFee;
                        } else {
                            currentFee = takeFee;
                        }
                        if (currentFee.greaterThan(0)) {
                            fee = utility.weiToToken((rawBaseAmount.times(currentFee)).div(ether1), base);
                        }
                    }

                    return {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
                        'token': token,
                        'amount': tokenAmount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        //  'maker': maker,
                        //  'taker': taker,
                        'buyer': buyer,
                        'seller': seller,
                        'feeCurrency': base,
                        'fee': fee,
                        'transType': transType,
                        'tradeType': tradeType,

                    };
                }
            }
            //ethex maker  trade offer
            else if (unpacked.name == 'MakeSellOrder' || unpacked.name == 'MakeBuyOrder' || unpacked.name == 'CancelSellOrder' || unpacked.name == 'CancelBuyOrder') {

                let base = this.setToken(this.config.ethAddr);
                let token = this.setToken(unpacked.events[1].value);
                let tradeType = '';

                if (unpacked.name.indexOf('Sell') !== -1) {
                    tradeType = 'Sell';
                } else {
                    tradeType = 'Buy';
                }

                let maker = unpacked.events[4].value.toLowerCase();
                let exchange = this.getExchangeName(unpacked.address, '');

                if (base && token) {
                    let tokenAmount = utility.weiToToken(unpacked.events[2].value, token);
                    let baseAmount = utility.weiToToken(unpacked.events[3].value, base);
                    var price = utility.toBigNumber(0);
                    if (tokenAmount.greaterThan(0)) {
                        price = baseAmount.div(tokenAmount);
                    }

                    if (unpacked.name.indexOf('Cancel') == -1) {
                        return {
                            'type': tradeType + ' offer',
                            'exchange': exchange,
                            'note': utility.addressLink(maker, true, true) + ' created a trade offer',
                            'token': token,
                            'amount': tokenAmount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                            'maker': maker,
                            'transType': 'Maker',
                            'tradeType': tradeType,
                        };
                    } else {
                        return {
                            'type': 'Cancel ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(maker, true, true) + ' cancelled a trade offer',
                            'token': token,
                            'amount': tokenAmount,
                            'price': price,
                            'base': base,
                            'baseAmount': baseAmount,
                            'unlisted': token.unlisted,
                            'maker': maker,
                        };
                    }
                }
            }
            // EasyTrade v1 & v2
            else if ((unpacked.name == 'Buy' || unpacked.name == 'Sell' || unpacked.name == 'FillBuyOrder' || unpacked.name == 'FillSellOrder') && unpacked.events.length == 7) {
                // 	FillBuyOrder FillSellOrder (address account, address token, uint256 tokens, uint256 ethers, uint256 tokensObtained, uint256 ethersSpent, uint256 ethersRefunded)       
                //	Buy Sell (address account, address destinationAddr, address traedeable, uint256 volume, uint256 volumeEth, uint256 volumeEffective, uint256 volumeEthEffective)

                let offset = 0;
                if (unpacked.name.indexOf('Fill') == -1) {
                    offset = 1;
                }

                let taker = unpacked.events[0].value.toLowerCase();
                let maker = unpacked.address.toLowerCase();
                let buyer = '';
                let seller = '';
                let tradeType = '';
                let transType = 'Taker'

                if (unpacked.name == 'Buy' || unpacked.name == 'FillBuyOrder') {
                    tradeType = 'Buy';
                    buyer = taker;
                    seller = maker;
                } else {
                    tradeType = 'Sell';
                    seller = taker;
                    buyer = maker;
                }

                let base = this.setToken(this.config.ethAddr);
                let token = this.setToken(unpacked.events[1 + offset].value);
                let exchange = this.getExchangeName(unpacked.address, '');

                if (token && base) {
                    let tokenAmount = utility.weiToToken(unpacked.events[4 + offset].value, token);
                    let rawBaseAmount = utility.toBigNumber(unpacked.events[5 + offset].value);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var price = utility.toBigNumber(0);
                    if (tokenAmount.greaterThan(0)) {
                        price = baseAmount.div(tokenAmount);
                    }

                    let fee = utility.toBigNumber(0);

                    return {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + 'traded through an exchange aggregator',
                        'token': token,
                        'amount': tokenAmount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        //  'maker': maker,
                        //  'taker': taker,
                        'buyer': buyer,
                        'seller': seller,
                        'feeCurrency': '',
                        'fee': '',
                        'transType': transType,
                        'tradeType': tradeType,
                    };
                }
            }
            else if (unpacked.name == 'TokenPurchase' || unpacked.name == 'EthPurchase') {

                //event TokenPurchase(address indexed buyer, uint256 indexed eth_sold, uint256 indexed tokens_bought);
                // event EthPurchase(address indexed buyer, uint256 indexed tokens_sold, uint256 indexed eth_bought);
                let addr = unpacked.address.toLowerCase();
                if (this.config.uniswapContracts[addr]) {
                    let ethToken = this.uniqueTokens[this.config.ethAddr];
                    let token = this.uniqueTokens[this.config.uniswapContracts[addr]];
                    let taker = unpacked.events[0].value.toLowerCase();
                    let ethAmount = undefined;
                    let tokenAmount = undefined;

                    let tradeType = 'Sell';
                    let buyUser = '';
                    let sellUser = '';

                    if (unpacked.name == 'TokenPurchase') {
                        tradeType = 'Buy';
                        ethAmount = utility.weiToToken(unpacked.events[1].value, ethToken);
                        tokenAmount = utility.weiToToken(unpacked.events[2].value, token);
                        buyUser = taker;
                    } else {
                        ethAmount = utility.weiToToken(unpacked.events[2].value, ethToken);
                        tokenAmount = utility.weiToToken(unpacked.events[1].value, token);
                        sellUser = taker;
                    }

                    let exchange = 'Uniswap';

                    let price = utility.toBigNumber(0);
                    if (tokenAmount.greaterThan(0)) {
                        price = ethAmount.div(tokenAmount);
                    }

                    return {
                        'type': 'Taker ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + 'traded with Uniswap',
                        'token': token,
                        'amount': tokenAmount,
                        'price': price,
                        'base': ethToken,
                        'baseAmount': ethAmount,
                        'unlisted': token.unlisted,
                        //  'maker': maker,
                        //  'taker': taker,
                        'buyer': buyUser,
                        'seller': sellUser,
                        'feeCurrency': '',
                        'fee': '',
                        'transType': 'Taker',
                        'tradeType': tradeType,
                    };
                } else {
                    //todo, fetch unknown contract?
                    console.log('trade event for unknown uniswap contract');
                }
            }
            // dex.blue trade events
            else if (unpacked.name == 'LogTrade' || unpacked.name == 'LogSwap') {
                //LogTrade(address makerAsset, uint256 makerAmount, address takerAsset, uint256 takerAmount);
                //LogSwap(address soldAsset, uint256 soldAmount, address boughtAsset, uint256 boughtAmount);
                let makerToken = this.setToken(unpacked.events[0].value);
                let makerAmount = utility.toBigNumber(unpacked.events[1].value);
                let takerToken = this.setToken(unpacked.events[2].value);
                let takerAmount = utility.toBigNumber(unpacked.events[3].value);

                let exchange = this.getExchangeName(unpacked.address, '');

                let tradeType = 'Sell';
                let token = undefined;
                let base = undefined;

                if (_delta.isBaseToken(takerToken, makerToken)) {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                } else {
                    token = takerToken;
                    base = makerToken;
                }

                if (token && base && token.addr && base.addr) {
                    let rawAmount = utility.toBigNumber(0);
                    let rawBaseAmount = utility.toBigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;
                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                    }

                    let amount = utility.weiToToken(rawAmount, token);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);
                    let price = utility.toBigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    let transType = 'Maker'; // unknown for dex.blue
                    return {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        'note': 'Matched 2 orders for a trade',
                        'token': token,
                        'amount': amount,
                        'price': price,
                        'base': base,
                        'baseAmount': baseAmount,
                        'unlisted': token.unlisted,
                        'buyer': '',
                        'seller': '',
                        'feeCurrency': '',
                        'fee': '',
                        'transType': transType,
                        'tradeType': tradeType,
                    };
                }
            }
            //dex.blue failed trade event
            else if (unpacked.name == 'LogTradeFailed') {
                let exchange = this.getExchangeName(unpacked.address, 'unknown');
                return {
                    'type': 'Trade error',
                    'exchange': exchange,
                    'description': "Trade failed.",
                };
            }
            //uniswap liquidity
            else if (unpacked.name == 'AddLiquidity' || unpacked.name == 'RemoveLiquidity') {

                //AddLiquidity: event({provider: indexed(address), eth_amount: indexed(uint256(wei)), token_amount: indexed(uint256)})
                // RemoveLiquidity: event({provider: indexed(address), eth_amount: indexed(uint256(wei)), token_amount: indexed(uint256)})
                let addr = unpacked.address.toLowerCase();
                if (this.config.uniswapContracts[addr]) {
                    let ethToken = this.uniqueTokens[this.config.ethAddr];
                    let token = this.uniqueTokens[this.config.uniswapContracts[addr]];

                    let wallet = unpacked.events[0].value.toLowerCase();
                    let ethAmount = utility.weiToToken(unpacked.events[1].value, ethToken);
                    let tokenAmount = utility.weiToToken(unpacked.events[2].value, token);
                    let deadline = Number(unpacked.events[2].value);
                    deadline = utility.formatDate(utility.toDateTime(deadline), false, false);

                    let type = unpacked.name.replace('Liq', ' Liq');
                    return {
                        type: type,
                        'amount': ethAmount,
                        'token': ethToken,
                        'amount ': tokenAmount,
                        'token ': token,
                        'wallet': wallet,
                    };
                } else {
                    //todo, fetch unknown contract?
                    console.log('liquidity event for unknown uniswap contract');
                }
            }
            //uniswap factory creating a new swap contract
            else if (unpacked.name == 'NewExchange') {
                let exchange = unpacked.events[1].value.toLowerCase();
                let token = unpacked.events[0].value.toLowerCase();

                return {
                    'type': 'Uniswap creation',
                    'contract': exchange,
                    'tokenAddress': token
                };

            }

        } else {
            return { 'error': 'unknown event output' };
        }
        return { 'error': 'unknown event output' };
    } catch (error) {
        console.log('unpacked event parsing exception ' + error);
        return { 'error': 'unknown event output' };
    }
};

DeltaBalances.prototype.startDeltaBalances = function startDeltaBalances(wait, callback) {
    let _delta = this;
    this.loadWeb3(wait, () => {
        _delta.initContracts(() => {
            callback();
        });
    });
};

DeltaBalances.prototype.makeTokenPopover = function (token) {
    if (token) {
        let title = token.name;
        if (token.name2) {
            title += ' - ' + token.name2;
        }

        let labelClass = 'label-warning';
        if (!token.unlisted)
            labelClass = 'label-primary';

        if (token.erc721 || token.multi) {
            labelClass = 'label-default';
        }

        let contents = 'PlaceHolder';
        try {
            if (token && token.addr) {
                if (!utility.isWrappedETH(token.addr)) {
                    if (token.multi) {
                        title = 'Multiple Assets';
                        contents = 'This is a bundle of multiple tokens <br>';
                        let multiTokens = token.addr.split('#');
                        for (let i = 0; i < multiTokens.length; i++) {
                            let tok = this.setToken(multiTokens[i]);
                            let linkName = tok.name;
                            if (tok.erc721 && tok.erc721Id) {
                                linkName += '-' + tok.erc721Id;
                            }
                            contents += linkName + ": " + utility.tokenLink(tok.addr, true, true, tok.erc721Id) + '<br>';
                        }
                    }
                    else if (token.erc721) {
                        contents = '';
                        if (!this.uniqueTokens[token.addr] || token.unknown) {
                            contents += "Token unknown to DeltaBalances. <br>"
                        }
                        if (token.erc721Id) {
                            contents += 'ERC721 Non-fungible token. <br> Unique Token ID: ' + token.erc721Id;
                            contents += "<br>Contract: " + utility.tokenLink(token.addr, true, true, token.erc721Id);
                        } else {
                            contents += "ERC721 Non-fungible token. <br> Contract: " + utility.addressLink(token.addr, true, true);
                        }
                    }
                    else if (!this.uniqueTokens[token.addr]) {
                        contents = "Token unknown to DeltaBalances <br> Contract: " + utility.addressLink(token.addr, true, true);
                    } else {
                        contents = 'Contract: ' + utility.tokenLink(token.addr, true, true) + '<br> Decimals: ' + token.decimals;
                    }
                    if (token.old) {
                        contents += '<br> <i class="text-red fa fa-exclamation-triangle" aria-hidden="true"></i> Token contract is deprecated.';
                    } else if (token.warning) {
                        contents += '<br> <i class="fa fa-exclamation-triangle" aria-hidden="true"></i> Token contract will soon be deprecated.';
                    }
                    if (token.locked || token.killed) {
                        contents += '<br> <i class="text-red fa fa-lock" aria-hidden="true"></i> Token Locked or Paused.';
                    }
                    if (!token.erc721 && !token.multi) {
                        contents += '<br><br> Trade centralized: <br><table class="popoverTable"><tr><td>' + utility.binanceURL(token, true) + '</td></tr></table>';

                        contents += 'Trade decentralized: <br><table class="popoverTable"><tr><td>' + utility.forkDeltaURL(token, true)
                            + '</td><td>' + utility.idexURL(token, true)
                            + '</td></tr><tr><td>' + utility.oneInchUrl(token, true)
                            + '</td><td>' + utility.ddexURL(token, true)
                            + '</td></tr><tr><td>' + utility.kyberURL(token, true)
                            + '</td></tr></table>';

                        contents += 'Legacy decentralized: <br><table class="popoverTable"><tr><td>'
                            + utility.etherDeltaURL(token, true)
                            + '</td><td>' + utility.tokenStoreURL(token, true) + '</td></tr>';
                    }
                } else if (token.addr == this.config.ethAddr) {
                    contents = "Ether (not a token)<br> Decimals: 18";
                } else {
                    contents = 'Contract: ' + utility.addressLink(token.addr, true, true) + '<br> Decimals: ' + token.decimals + "<br>Wrapped Ether";
                    if (token.old) {
                        contents += '<br> <i class="text-red fa fa-exclamation-triangle" aria-hidden="true"></i> Token contract is deprecated.';
                    } else if (token.warning) {
                        contents += '<br> <i class="text-red fa fa-exclamation-triangle" aria-hidden="true"></i> Token contract will soon be deprecated.';
                    }
                    if (token.locked || token.killed) {
                        contents += '<br> <i class="text-red fa fa-lock" aria-hidden="true"></i> Token Locked or Paused.';
                    }
                }
            }
        } catch (e) {
            console.log('error making popover ' + e);
        }

        let name = token.name;
        if (token.erc721Id) {
            let id721 = token.erc721Id.toString();
            //trim token id if it is too long (ENS names are like 30digits)
            if (id721.length > 10) {
                id721 = id721.slice(0, 8) + "...";
            }
            name += ' - ' + id721;
        } else if (token.erc721) {
            name = '<span class="text75">[ERC721]</span> ' + name;
        }

        if (token.locked) {
            name += ' <i class="fa fa-lock" aria-hidden="true"></i>';
        } else if (token.old) {
            name += ' <i class="fa fa-exclamation-triangle" aria-hidden="true"></i>';
        } else if (token.warning) {
            name += ' <i class="fa fa-exclamation-triangle" aria-hidden="true"></i>';
        }

        let popover = '<a tabindex="0" class="label ' + labelClass + '" role="button" data-html="true" data-toggle="popover" data-placement="auto right"  title="' + title + '" data-container="body" data-content=\'' + contents + '\'>' + name + '</a>';

        return popover;
    } else {
        console.log('undefined token in popover');
        return "";
    }
};

module.exports = { DeltaBalances: deltaBalances, utility };

},{"./config.js":"/config.js","./ethersWrapper.js":"/ethersWrapper.js","./utility.js":3,"bignumber.js":"bignumber.js"}],3:[function(require,module,exports){
//const Ethers = require('ethers');
const Ethers = require('./ethersWrapper.js');

const Decoder = require('./abi-decoder.js');
const BigNumber = require('bignumber.js');
BigNumber.config({ ERRORS: false });

module.exports = (db) => {
    const utility = {};

    utility.toBigNumber = function (number) {
        const num = String(number);
        return new BigNumber(num);
    }

    //give readable value, given a divisor (or eth divisor=undefined)
    utility.weiToEth = function weiToEth(wei, divisorIn) {
        const divisor = !divisorIn ? 1000000000000000000 : divisorIn;
        return (this.toBigNumber(wei).div(divisor));
    };

    //give readable value given a wei amount and a token object
    utility.weiToToken = function weiToToken(wei, token) {
        let divisor = this.toBigNumber(1000000000000000000);
        if (token && token.decimals !== undefined) {
            divisor = this.toBigNumber(Math.pow(10, token.decimals));
        }
        return this.toBigNumber(wei).div(divisor);
    }

    // IDEX pip (rounded to 8 decimals) to token decimals
    utility.idexPipToToken = function (pip, token) {
        if (token.decimals <= 8) {
            return this.weiToToken(pip, { decimals: 8 });
        } else {
            let factor = Math.pow(10, token.decimals - 8);
            return this.weiToToken(new BigNumber(pip).times(factor), token);
        }
    }

    utility.isAddress = function (addr) {
        if (addr && addr.length == 42) {
            try {
                let _ = Ethers.utils.getAddress(addr); // exception on invalid address
                return true;
            } catch (e) { }
        }
        return false;
    }

    // check if an input address or url (including address) is a valid address
    // return empty string if invalid
    utility.addressFromString = function (inputString) {

        if (!inputString) {
            return '';
        }

        //trim whitespace, make lowercase, remove dots
        inputString = inputString.toLowerCase().trim();
        inputString = inputString.replace(/\./g, ' ');

        // check if we already have an address
        if (this.isAddress(inputString)) {
            return inputString;
        }
        // maybe address without 0x
        else if (inputString.length == 40 && inputString.slice(0, 2) !== '0x') {
            let possibleAddress = '0x' + inputString;
            if (this.isAddress(possibleAddress)) {
                return possibleAddress;
            }
        }

        //check if url with address
        if (inputString.indexOf('0x') !== -1 && inputString.indexOf('/tx') === -1) {

            let urlPrefixes = ['/0x', '=0x', '#0x'];
            let index = -1;
            let prefix = '';

            for (let i = 0; i < urlPrefixes.length; i++) {
                index = inputString.indexOf(urlPrefixes[i]);
                if (index != -1) {
                    prefix = urlPrefixes[i];
                    break;
                }
            }

            if (prefix) {
                let endSlice = Math.min(42, inputString.length - index);
                let possibleAddress = inputString.slice(index + 1, index + 1 + endSlice);
                if (this.isAddress(possibleAddress)) {
                    return possibleAddress;
                }
            }
        }

        return '';
    }

    // check if an input hash or url (including hash) is valid
    // return empty string if invalid
    utility.hashFromString = function (inputString) {

        if (!inputString) {
            return '';
        }

        //trim whitespace, make lowercase, remove dots
        inputString = inputString.toLowerCase().trim();
        inputString = inputString.replace(/\./g, ' ');

        // check if we already have a hash
        if (inputString.length == 66 && inputString.slice(0, 2) === '0x') {
            return inputString;
        }
        // maybe hash without 0x
        else if (inputString.length == 64 && inputString.slice(0, 2) !== '0x') {
            return '0x' + inputString;
        }

        //check if url with hash
        if (inputString.indexOf('0x') !== -1) {

            let urlPrefixes = ['/0x', '=0x', '#0x'];
            let index = -1;
            let prefix = '';

            for (let i = 0; i < urlPrefixes.length; i++) {
                index = inputString.indexOf(urlPrefixes[i]);
                if (index != -1) {
                    prefix = urlPrefixes[i];
                    break;
                }
            }

            if (prefix) {
                let endSlice = Math.min(66, inputString.length - index);
                let possibleHash = inputString.slice(index + 1, index + 1 + endSlice);
                if (possibleHash.length == 66 && possibleHash.slice(0, 2) === '0x') {
                    return possibleHash;
                }
            }
        }

        return '';
    }

    // token is ether or wrapped ether
    utility.isWrappedETH = function (address) {
        if (address) {
            address = address.toLowerCase();
            return db.config.wrappedETH[address] === 1;
        }
        return false;
    };

    // token is base currency 
    utility.isNonEthBase = function (address) {
        if (address) {
            address = address.toLowerCase();
            if (db.config.baseToken[address]) {
                return db.config.baseToken[address];
            }
        }
        return false;
    };

    //name for a 0x relayer based on feerecipient address
    utility.relayName = function (address, relayType = '0x') {
        let name = '';
        if (address) {
            address = address.toLowerCase();
            name = db.config.zrxRelayers[address];
            if (!name) {
                name = db.config.zrxTakers[address];
            }
            if (!name) {
                name = db.config.admins[address];
            }
            if (!name) {
                name = 'Unknown ' + relayType;
            }
        }
        if (name && name.indexOf(' Admin') !== -1) {
            name = name.replace(' Admin', '');
        }
        return name;
    };

    //check if an exchange is known for withdrawals that are sent by an external (admin) wallet
    // users signs for the tx, but it is executed by a different address
    utility.hasAdminWithdraw = function (exchangeAddress) {
        if (exchangeAddress) {
            let addr = exchangeAddress.toLowerCase();

            return (addr == db.config.exchangeContracts.Idex.addr)
                || (addr == db.config.exchangeContracts.Idex2.addr)
                || (addr == db.config.exchangeContracts.Switcheo.addr)
                || (addr == db.config.exchangeContracts.Switcheo2.addr)
                || (addr == db.config.exchangeContracts.Joyso.addr)
                || (addr == db.config.exchangeContracts.DexBlue2.addr);
        }
        return false;
    }

    // dex allows ETH deposit without a function, just a send into a fallback
    utility.hasDepositFallback = function (exchangeAddress) {
        if (exchangeAddress) {
            let addr = exchangeAddress.toLowerCase();

            return (addr == db.config.exchangeContracts.DexBlue.addr)
                || (addr == db.config.exchangeContracts.DexBlue2.addr);
        }
        return false;
    }

    //remove exponential notation 1e-8  etc.
    utility.exportNotation = function (num) {
        //.replace(/\.?0+$/,""); // rounded to 20 decimals, no trailing 0 //https://stackoverflow.com/questions/3612744/remove-insignificant-trailing-zeros-from-a-number
        num = this.toBigNumber(num).toFixed(20);
        return num.replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1');
    };

    utility.displayNotation = function (num, fixed) {
        num = this.toBigNumber(num);
        if (num.greaterThan(1000000000)) {
            num = num.toExponential(fixed);
        } else {
            num = num.toFixed(fixed, 1);
        }
        return this.commaNotation(num);
    };

    // add comma separators to high numbers: 100,000,000.346583746853
    utility.commaNotation = function (num) {
        var n = num.toString();
        var p = n.indexOf('.');
        return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function ($0, i) {
            return p < 0 || i < p ? ($0 + ',') : $0;
        });
    };

    utility.getURL = function getURL(url, callback) {
        jQuery.get(url).done((result) => {
            if (result)
                callback(undefined, result);
            else
                callback('error retrieving url', undefined);
        }).fail((xhr, status, error) => {
            callback(error, undefined);
        });
    };

    utility.postURL = function postURL(url, contents, callback) {
        jQuery.post(url, contents).done((result) => {
            if (result)
                callback(undefined, result);
            else
                callback('error post url', undefined);
        }).fail((xhr, status, error) => {
            callback(error, undefined);
        });
    };

    utility.escapeHtml = function (text) {
        if (!text) {
            return '';
        }
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function (m) { return map[m]; });
    }

    utility.readFile = function readFile(filename, callback) {
        if (callback) {
            try {
                utility.getURL(`${db.config.homeURL}/${filename}`, (err, body) => {
                    if (err) {
                        callback(err, undefined);
                    } else {
                        callback(undefined, body);
                    }
                });
            } catch (err) {
                callback(err, undefined);
            }
        } else {
            return undefined;
        }
    };

    //decode tx receipt logs
    utility.processLogs = function (data) {
        if (!db.config.methodIDS) {
            this.initABIs();
        }

        if (data) {
            if (data.constructor !== Array) {
                data = [data];

                try {
                    let result = Decoder.decodeLogs(data);
                    return combineEvents(result);
                } catch (error) {
                    console.log('error in decodeLogs ' + error);
                    return undefined;
                }
            } else {
                try {
                    let result = Decoder.decodeLogs(data);
                    return combineEvents(result);
                } catch (error) {
                    console.log('error in decodeLogs ' + error);
                    return undefined;
                }
            }
        } else {
            return undefined;
        }

        //combine 2 trade events for Ethen.market trades
        function combineEvents(decodedLogs) {
            let combinedLogs = [];

            for (let i = 0; i < decodedLogs.length; i++) {
                let log = decodedLogs[i];
                if (log) {

                    if (log.address !== db.config.exchangeContracts.Ethen.addr) {
                        combinedLogs.push(log);
                    } else {
                        if (log.name === 'Order' && log.events.length == 8) {

                            let j = i + 1;
                            //given the 'order' event, look in the same tx for 'trade' events to match the data
                            while (j < decodedLogs.length && decodedLogs[j].hash === decodedLogs[i].hash) {
                                let log2 = decodedLogs[j];
                                if (log2 && log2.address === db.config.exchangeContracts.Ethen.addr && log2.name === 'Trade') {
                                    log.combinedEvents = [log2.events[0], log2.events[2], log2.events[3]];
                                    break;
                                } else {
                                    j++;
                                }
                            }
                            if (log.combinedEvents) {
                                combinedLogs.push(log);
                            }
                        } else {
                            combinedLogs.push(log);
                        }
                    }
                }
            }
            return combinedLogs;
        }
    };

    //decode tx input data
    utility.processInput = function (data) {
        if (!db.config.methodIDS) {
            this.initABIs();
        }

        if (data) {
            try {
                let result = Decoder.decodeMethod(data);
                return result;
            } catch (error) {
                console.log('error in decodeMethod ' + error);
                return undefined;
            }
        } else {
            return undefined;
        }
    };

    // configure whiche ABIs are used to decode input
    utility.initABIs = function () {
        let abis = Object.values(db.config.ABIs);

        for (let i = 0; i < abis.length; i++) {
            Decoder.addABI(abis[i]);
        }
        db.config.methodIDS = true;
    }


    utility.etherDeltaURL = function (tokenObj, html) {
        if (tokenObj) {
            var url = "https://etherdelta.com/#";
            var labelClass = "label-warning";
            if (!tokenObj.EtherDelta) {
                url += tokenObj.addr + "-ETH";
            } else {
                url += tokenObj.EtherDelta + "-ETH";
                labelClass = 'label-primary';
            }
        } else {
            url = '';
        }

        if (html) {
            url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank" rel="noopener noreferrer">EtherDelta <i class="fa fa-external-link" aria-hidden="true"></i></a>';
        }
        return url;
    }

    utility.forkDeltaURL = function (tokenObj, html) {
        var url = "https://forkdelta.app/#!/trade/";
        var labelClass = "label-warning";
        if (tokenObj) {
            if (!tokenObj.ForkDelta) {
                url += tokenObj.addr + "-ETH";
            } else {
                url += tokenObj.ForkDelta + "-ETH";
                labelClass = 'label-primary';
            }
        } else {
            url = '';
        }

        if (html) {
            url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank" rel="noopener noreferrer">ForkDelta <i class="fa fa-external-link" aria-hidden="true"></i></a>';
        }
        return url;
    }

    utility.tokenStoreURL = function (tokenObj, html) {
        var url = "https://token.store/trade/";
        var labelClass = "label-warning";
        if (tokenObj) {
            if (tokenObj.TokenStore) {
                labelClass = 'label-primary';
            }
            url += tokenObj.addr;
        } else {
            url = '';
        }

        if (html) {
            url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank" rel="noopener noreferrer">Token store <i class="fa fa-external-link" aria-hidden="true"></i></a>';
        }
        return url;
    }

    utility.oneInchUrl = function (tokenObj, html) {
        let url = '';

        if (tokenObj && tokenObj.OneInch) {
            url = "https://1inch.exchange/#/r/0xf6E914D07d12636759868a61E52973d17ED7111B";
        }
        let labelClass = 'label-primary';

        if (html) {
            if (url == '') {
                url = '<span class="label label-default' + '">1inch</span>';
            } else {
                url = '<a class="label label-primary" href="' + url + '" target="_blank" rel="noopener noreferrer">1inch <i class="fa fa-external-link" aria-hidden="true"></i></a>';
            }
        }
        return url;
    }

    utility.idexURL = function (tokenObj, html) {
        var url = "https://idex.market/eth/"
        var labelClass = "label-primary";
        if (tokenObj && tokenObj.IDEX && !tokenObj.blockIDEX) {
            url += tokenObj.IDEX;
        } else {
            url = '';
            labelClass = 'label-default';
        }

        if (html) {
            if (url == '') {
                url = '<span class="label ' + labelClass + '">IDEX</span>';
            } else {
                url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank" rel="noopener noreferrer">IDEX <i class="fa fa-external-link" aria-hidden="true"></i></a>';
            }
        }
        return url;
    }

    utility.ddexURL = function (tokenObj, html) {
        let url = "https://";
        let urlAddition = '';
        let labelClass = "label-primary";
        if (tokenObj && (tokenObj.DDEX || tokenObj.DDEX2)) {
            //fallback to legacy ddex website
            if (tokenObj.DDEX2) {
                url += "ddex.io/spot/" + tokenObj.DDEX2;
            } else {
                url += "legacy.ddex.io/trade/" + tokenObj.DDEX + '-ETH';
                urlAddition = ' legacy';
            }
        } else {
            labelClass = 'label-default';
            url = '';
        }

        if (html) {
            if (url == '') {
                url = '<span class="label ' + labelClass + '">DDEX</span>';
            } else {
                url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank" rel="noopener noreferrer">DDEX' + urlAddition + '<i class="fa fa-external-link" aria-hidden="true"></i></a>';
            }
        }
        return url;
    }

    utility.binanceURL = function (tokenObj, html) {
        var url = "https://www.binance.com/trade.html?ref=10985752&symbol=";
        var labelClass = "label-primary";
        if (tokenObj && tokenObj.Binance && tokenObj.Binance.indexOf('ETH') !== -1) {
            let name = tokenObj.Binance.replace("ETH", "_ETH");
            url += name;
        } else if (tokenObj && tokenObj.Binance && tokenObj.Binance.indexOf('BTC') !== -1) {
            let name = tokenObj.Binance.replace("BTC", "_BTC");
            url += name;
        } else {
            labelClass = 'label-default';
            url = '';
        }

        if (html) {
            if (url == '') {
                url = '<span class="label ' + labelClass + '">Binance</span>';
            } else {
                url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank" rel="noopener noreferrer">Binance <i class="fa fa-external-link" aria-hidden="true"></i></a>';
            }
        }
        return url;
    }

    utility.radarURL = function (tokenObj, html) {
        var url = "https://app.radarrelay.com/";
        var labelClass = "label-primary";

        if (tokenObj && tokenObj.Radar) {
            url += tokenObj.Radar + '/WETH';
        } else {
            labelClass = 'label-default';
            url = '';
        }

        if (html) {
            if (url == '') {
                url = '<span class="label ' + labelClass + '">RadarRelay</span>';
            } else {
                url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank" rel="noopener noreferrer">RadarRelay <i class="fa fa-external-link" aria-hidden="true"></i></a>';
            }
        }
        return url;
    }

    utility.kyberURL = function (tokenObj, html) {
        var url = "https://kyber.network/swap/eth_";
        var labelClass = "label-primary";

        if (tokenObj && tokenObj.Kyber) {
            url += tokenObj.Kyber.toLowerCase();
        } else {
            labelClass = 'label-default';
            url = '';
        }

        if (html) {
            if (url == '') {
                url = '<span class="label ' + labelClass + '">Kyber</span>';
            } else {
                url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank" rel="noopener noreferrer">Kyber <i class="fa fa-external-link" aria-hidden="true"></i></a>';
            }
        }
        return url;
    }

    utility.hashLink = function (hash, html, short) {
        var url = 'https://etherscan.io/tx/' + hash;
        if (!html)
            return url

        let displayHash = hash;
        if (short)
            displayHash = displayHash.slice(0, 8) + '..';
        return '<a target = "_blank" href="' + url + '">' + displayHash + ' </a>';
    };

    // Make an etherscan link for an address (address, output as html anchor, shorten the address with ...)
    utility.addressLink = function (addr, html, short, name = undefined) {
        let url = 'https://etherscan.io/address/' + addr;
        if (!html)
            return url
        let displayText = addr;
        if (short)
            displayText = displayText.slice(0, 6) + '..';
        else {
            if (!name) {
                displayText = db.addressName(addr, !short);
            } else {
                displayText = name;
                if (!short && addr) {
                    displayText = displayText + ' ' + addr.toLowerCase();
                }
            }

            //show addres after name 'Contract A 0xab12cd34..' in a smaller size
            if (html && !short && displayText && displayText !== addr) {
                let split = displayText.split(' ');
                let changed = false;
                for (let i = 0; i < split.length; i++) {
                    //found the address in the name, wrap it in a span
                    if (split[i].length == 42 && split[i].slice(0, 2) == '0x') {
                        split[i] = '<span class="dim">' + split[i] + '</span>';
                        changed = true;
                    }
                }
                if (changed) {
                    displayText = split.join(' ');
                }
            }
        }
        return '<a target="_blank" rel="noopener noreferrer" href="' + url + '">' + displayText + ' </a>';
    };

    utility.tokenLink = function (addr, html, short, erc721Id = undefined) {
        var url = 'https://etherscan.io/token/' + addr;
        if (erc721Id) {
            url += '?a=' + erc721Id;
        }
        if (!html)
            return url
        var displayText = addr;
        if (short)
            displayText = displayText.slice(0, 6) + '..';
        else {
            displayText = db.addressName(addr, !short);
        }
        return '<a target="_blank" rel="noopener noreferrer" href="' + url + '">' + displayText + ' </a>';
    };

    utility.getBatchedBalances = function (contract, functionName, args, callback) {

        try {
            contract.functions[functionName](...args).then(result => {
                let numberArray = result[0];
                numberArray = numberArray.map(x => utility.toBigNumber(x));
                callback(undefined, numberArray);
            }, e => {
                // request returned successfully, but response was "0x". Might not occur if provider quorum > 1
                if (e && e.code && e.code == "CALL_EXCEPTION") {
                    callback(undefined, []);
                } else {
                    callback(e, undefined);
                }
            });
        } catch (e) {
            callback(e, undefined);
        }
    };

    //get etherdelta history logs from INFURA
    //inclusive for start and end
    // can handle ranges of 5k-10k blocks

    //https://infura.io/docs/ethereum/json-rpc/eth-getLogs
    // max 10000 results
    // max 10 sec load
    utility.getTradeLogs = function getTradeLogs(historyUrl, contractAddress, topics, startblock, endblock, rpcID, callback, retryCount = 0) {
        if (!Array.isArray(topics)) {
            topics = [topics];
        }

        const filterObj = JSON.stringify([{
            fromBlock: '0x' + utility.decToHex(startblock),
            toBlock: '0x' + utility.decToHex(endblock),
            address: contractAddress,
            topics: topics,
        }]);


        let range = {
            start: startblock,
            end: endblock,
            count: (endblock - startblock) + 1,
            retries: retryCount,
            error: false
        };

        makeRequest();

        function makeRequest() {
            jQuery.ajax({
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json'
                },
                type: "POST",
                async: true,
                url: historyUrl,
                data: '{"jsonrpc":"2.0","method":"eth_getLogs","params":' + filterObj + ' ,"id":' + rpcID + '}',
                dataType: 'json',
                timeout: 12000, // 12 sec timeout
            }).done((result) => {
                if (result && result.jsonrpc) {
                    // success {"jsonrpc":"2.0","id":7,"result":[]}
                    // fail {"jsonrpc":"2.0","id":92,"error":{"code":-32005,"message":"query returned more than 1000 results"}}
                    //"error": {"code": -32005,"message": "query timeout exceeded"}

                    if (result.result && Array.isArray(result.result)) {
                        callback(result.result, range);
                    } else if (result.error && result.error.code) {
                        console.log(result.error);
                        returnError(result.error.code);
                    } else {
                        //response but not an array as expected?
                        returnError();
                    }
                } else {
                    //empty positive response?
                    returnError();
                }
            }).fail((result, status, error) => {
                returnError(error);
            });
        }

        function returnError(code = undefined) {
            range.error = true;
            range.splitRetry = false;
            range.abort = false;

            if (code == -32005) {  //error for more than 1000 results?
                range.splitRetry = true;
            } else if (code < -32600) { //standard jsonrpc error codes
                range.abort = true;
            }
            callback(undefined, range);
        }
    };


    utility.txReceipt = function txReceipt(txHash, callback) {
        db.provider.getTransactionReceipt(txHash).then(result => {
            if (result && result.blockNumber) {
                result.cumulativeGasUsed = utility.toBigNumber(result.cumulativeGasUsed);
                result.gasUsed = utility.toBigNumber(result.gasUsed);
                callback(undefined, result);
            } else {
                // tx is not mined yet, or has been dropped
                callback("empty receipt", undefined);
            }
        }, e => {
            callback(e, undefined);
        });
    };

    utility.getTransaction = function (txHash, callback) {
        db.provider.getTransaction(txHash).then(result => {
            if (result) {
                result.gasPrice = utility.toBigNumber(result.gasPrice);
                result.gasLimit = utility.toBigNumber(result.gasLimit);
                result.value = utility.toBigNumber(result.value);
                if (result.data) {
                    result.input = result.data;
                } else if (result.input) {
                    result.data = result.input;
                }

                callback(undefined, result);
            } else {
                //not mined & not pending??
                callback("tx not found", undefined);
            }
        }, e => {
            callback(e, undefined);
        });
    }

    utility.loadContract = function loadContract(abi, address, callback) {
        if (abi && abi.length > 0) {
            let contract = undefined;
            try {
                contract = new Ethers.Contract(address, abi, db.provider);
                if (!contract) {
                    throw "fail";
                }
            } catch (e) {
                callback('Ethers failed to load contract ', undefined);
            }
            callback(undefined, contract);
        } else {
            callback('no abi ', undefined);
        }
    };


    utility.getBlockDate = function getBlockDate(decBlocknr, callback) {
        let num = Number(decBlocknr);
        db.provider.getBlock(num).then(block => {
            let time = block.timestamp || block.timeStamp;
            callback(undefined, time, decBlocknr);
        }, e => {
            callback('failed to get date', undefined, decBlocknr);
        });
    };

    utility.blockNumber = function blockNumber(callback) {
        db.provider.getBlockNumber().then(number => {
            callback(undefined, number);
        }, e => {
            callback(e, undefined);
        });
    };

    utility.decToHex = function decToHex(dec, lengthIn) {
        let length = lengthIn;
        if (!length) length = 32;
        if (dec < 0) {
            // return convertBase((Math.pow(2, length) + decStr).toString(), 10, 16);
            return (this.toBigNumber(2)).pow(length).add(this.toBigNumber(dec)).toString(16);
        }
        let result = null;
        try {
            result = utility.convertBase(dec.toString(), 10, 16);
        } catch (err) {
            result = null;
        }
        if (result) {
            return result;
        }
        return (this.toBigNumber(dec)).toString(16);
    };

    utility.hexToDec = function hexToDec(hexStrIn, length) {
        // length implies this is a two's complement number
        let hexStr = hexStrIn;
        if (hexStr.substring(0, 2) === '0x') hexStr = hexStr.substring(2);
        hexStr = hexStr.toLowerCase();
        if (!length) {
            return utility.convertBase(hexStr, 16, 10);
        }
        const max = Math.pow(2, length); // eslint-disable-line no-restricted-properties
        const answer = utility.convertBase(hexStr, 16, 10);
        return answer > max / 2 ? max : answer;
    };

    utility.convertBase = function convertBase(str, fromBase, toBase) {
        const digits = utility.parseToDigitsArray(str, fromBase);
        if (digits === null) return null;
        let outArray = [];
        let power = [1];
        for (let i = 0; i < digits.length; i += 1) {
            if (digits[i]) {
                outArray = utility.add(outArray,
                    utility.multiplyByNumber(digits[i], power, toBase), toBase);
            }
            power = utility.multiplyByNumber(fromBase, power, toBase);
        }
        let out = '';
        for (let i = outArray.length - 1; i >= 0; i -= 1) {
            out += outArray[i].toString(toBase);
        }
        if (out === '') out = 0;
        return out;
    };

    utility.parseToDigitsArray = function parseToDigitsArray(str, base) {
        const digits = str.split('');
        const ary = [];
        for (let i = digits.length - 1; i >= 0; i -= 1) {
            const n = parseInt(digits[i], base);
            if (isNaN(n)) return null;
            ary.push(n);
        }
        return ary;
    };

    utility.add = function add(x, y, base) {
        const z = [];
        const n = Math.max(x.length, y.length);
        let carry = 0;
        let i = 0;
        while (i < n || carry) {
            const xi = i < x.length ? x[i] : 0;
            const yi = i < y.length ? y[i] : 0;
            const zi = carry + xi + yi;
            z.push(zi % base);
            carry = Math.floor(zi / base);
            i += 1;
        }
        return z;
    };

    utility.multiplyByNumber = function multiplyByNumber(numIn, x, base) {
        let num = numIn;
        if (num < 0) return null;
        if (num === 0) return [];
        let result = [];
        let power = x;
        while (true) {
            if (num & 1) {
                result = utility.add(result, power, base);
            }
            num = num >> 1;
            if (num === 0) break;
            power = utility.add(power, power, base);
        }
        return result;
    };

    // unix seconds to date object
    utility.toDateTime = function (secs) {
        var utcSeconds = secs;
        var d = new Date(0);
        d.setUTCSeconds(utcSeconds);
        return d;
    };

    utility.toDateTimeNow = function (short) {
        var t = new Date();
        return t;
        //return formatDate(t, short);
    };

    utility.createUTCOffset = function (date) {
        if (!date)
            return "";

        function pad(value) {
            return value < 10 ? '0' + value : value;
        }

        var sign = (date.getTimezoneOffset() > 0) ? "-" : "+";
        var offset = Math.abs(date.getTimezoneOffset());
        var hours = pad(Math.floor(offset / 60));
        var minutes = pad(offset % 60);
        return sign + hours + ":" + minutes;
    }

    utility.formatDateOffset = function (d, short) {
        if (d == "??")
            return "??";

        if (short)
            return utility.formatDate(d, short);
        else
            return utility.formatDateT(d, short) + utility.createUTCOffset(d);
    };

    utility.formatDate = function (d, short, removeSeconds) {
        if (d == "??")
            return "??";

        try {
            var month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear(),
                hour = d.getHours(),
                min = d.getMinutes(),
                sec = d.getSeconds();

            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;
            if (hour < 10) hour = '0' + hour;
            if (min < 10) min = '0' + min;
            if (sec < 10) sec = '0' + sec;

            if (!short)
                if (!removeSeconds)
                    return [year, month, day].join('-') + ' ' + [hour, min, sec].join(':');
                else
                    return [year, month, day].join('-') + ' ' + [hour, min].join(':');
            else
                return [year, month, day].join('');
        } catch (e) {
            return d;
        }
    };


    utility.formatDateT = function (d, short) {
        if (d == "??")
            return "??";

        try {
            var month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear(),
                hour = d.getHours(),
                min = d.getMinutes(),
                sec = d.getSeconds();

            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;
            if (hour < 10) hour = '0' + hour;
            if (min < 10) min = '0' + min;
            if (sec < 10) sec = '0' + sec;

            if (!short)
                return [year, month, day].join('-') + 'T' + [hour, min, sec].join(':');
            else
                return [year, month, day].join('');
        } catch (e) {
            return d;
        }
    };

    // Check for an address from a web3 browser/addon like Metamask
    utility.getWeb3Address = function (allowPopup, callback) {

        if (location.protocol !== "https:" && location.protocol !== "http:") {
            console.log('Metamask needs page to be hosted.');
            return;
        }
        //modern web3 wallet, window.ethereum, requiring user unlock
        if (typeof window.ethereum !== "undefined") {
            window.ethereum.on('accountsChanged', onAccountChange);

            // adress is already exposed, soon deprecated?
            if (window.ethereum.selectedAddress && utility.isAddress(window.ethereum.selectedAddress)) {
                callback(window.ethereum.selectedAddress.toLowerCase());
                return;
            }
            else if (allowPopup) {
                // request permission to access wallet
                ethereum.enable()
                    .then(function (accounts) {
                        if (accounts && typeof accounts !== "undefined" && accounts.length > 0) {
                            callback(accounts[0], toLowerCase());
                        } else {
                            callback('');
                        }
                    }, function (error) {
                        if (error && ((error.code == 4001) ||
                            (typeof error == "string" && error.indexOf("denied") >= 0) ||
                            (error.message && error.message.indexOf("denied") >= 0))
                        ) {
                            console.log('rejected ethereum connection');
                        } else {
                            console.log('ethereum connection failed');
                        }
                        callback('');
                    });
            } else {
                callback('');
            }
        } else if (window && typeof window.web3 !== 'undefined') { //legacy metamask style with no privacy (window.web3, no window.ethereum)
            try {
                let web3Provider = new Ethers.providers.Web3Provider(window.web3.currentProvider);
                web3Provider.getSigner().getAddress().then(addr => {
                    callback(addr.toLowerCase());
                }, _ => {
                    throw "web3 detect failed";
                });
            } catch (e) {
                console.log('web3 wallet detect exception');
                callback('');
            }
        } else {
            callback('');
        }

        function onAccountChange(accounts) {
            if (accounts && accounts.length > 0) {
                let addr = accounts[0].toLowerCase();
                if (metamaskAddr && addr !== metamaskAddr) { // metamaskaddr defined in html
                    callback(addr, true);
                }
            }
        }
    };

    return utility;
};

},{"./abi-decoder.js":1,"./ethersWrapper.js":"/ethersWrapper.js","bignumber.js":"bignumber.js"}]},{},[2])(2)
});
