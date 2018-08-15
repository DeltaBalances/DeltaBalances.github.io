const Web3 = require('web3');
const SolidityFunction = require('web3/lib/web3/function.js');
const Decoder = require('./abi-decoder.js');
const BigNumber = require('bignumber.js');
BigNumber.config({ ERRORS: false });

module.exports = (config) => {
  const utility = {};

  //give readable value, given a divisor (or eth divisor=undefined)
  utility.weiToEth = function weiToEth(wei, divisorIn) {
    const divisor = !divisorIn ? 1000000000000000000 : divisorIn;
    return (new BigNumber(wei).div(divisor));
  };

  //give readable value given a wei amount and a token object
  utility.weiToToken = function weiToToken(wei, token) {
    let divisor = new BigNumber(1000000000000000000);
    if (token && token.decimals !== undefined) {
      divisor = new BigNumber(Math.pow(10, token.decimals));
    }
    return new BigNumber(wei).div(divisor);
  }

  // token is ether or wrapped ether
  utility.isWrappedETH = function (address) {
    if (address) {
      address = address.toLowerCase();
      return bundle.DeltaBalances.config.wrappedETH[address] === 1;
    }
    return false;
  };

  // token is base currency 
  utility.isNonEthBase = function (address) {
    if (address) {
      address = address.toLowerCase();
      return bundle.DeltaBalances.config.baseToken[address] === 1;
    }
    return false;
  };

  //name for a 0x relayer based on feerecipient address
  utility.relayName = function (address) {
    let name = '';
    if (address) {
      name = bundle.DeltaBalances.config.zrxRelayers[address];
      if (!name) {
        name = 'Unknown 0x';
      }
    }
    return name;
  };

  //remove exponential notation 1e-8  etc.
  utility.exportNotation = function (num) {
    //.replace(/\.?0+$/,""); // rounded to 20 decimals, no trailing 0 //https://stackoverflow.com/questions/3612744/remove-insignificant-trailing-zeros-from-a-number
    num = new BigNumber(num).toFixed(20);
    return num.replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1');
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
        utility.getURL(`${config.homeURL}/${filename}`, (err, body) => {
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
    if (!bundle.DeltaBalances.config.methodIDS) {
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

          if (log.address !== _delta.config.exchangeContracts.Ethen.addr) {
            combinedLogs.push(log);
          } else {
            if (log.name === 'Order' && log.events.length == 8) {

              let j = i + 1;
              //given the 'order' event, look in the same tx for 'trade' events to match the data
              while (j < decodedLogs.length && decodedLogs[j].hash === decodedLogs[i].hash) {
                let log2 = decodedLogs[j];
                if (log2 && log2.address === _delta.config.exchangeContracts.Ethen.addr && log2.name === 'Trade') {
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
    if (!bundle.DeltaBalances.config.methodIDS) {
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
    let abis = Object.values(bundle.DeltaBalances.config.ABIs);

    for (let i = 0; i < abis.length; i++) {
      Decoder.addABI(abis[i]);
    }
    // etherdelta last to fix overloading
    Decoder.addABI(bundle.DeltaBalances.config.ABIs.EtherDelta);
    bundle.DeltaBalances.config.methodIDS = true;
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
      url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank">EtherDelta <i class="fa fa-external-link" aria-hidden="true"></i></a>';
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
      url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank">ForkDelta <i class="fa fa-external-link" aria-hidden="true"></i></a>';
    }
    return url;
  }

  utility.tokenStoreURL = function (tokenObj, html) {
    var url = "https://token.store/trade/";
    var labelClass = "label-warning";
    if (tokenObj) {
      url += tokenObj.addr;
    } else {
      url = '';
    }

    if (html) {
      url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank">Token store <i class="fa fa-external-link" aria-hidden="true"></i></a>';
    }
    return url;
  }

  utility.idexURL = function (tokenObj, html) {
    var url = "https://idex.market/eth/"
    var labelClass = "label-primary";
    if (tokenObj && tokenObj.IDEX) {
      url += tokenObj.IDEX;
    } else {
      url = '';
      labelClass = 'label-default';
    }

    if (html) {
      if (url == '') {
        url = '<span class="label ' + labelClass + '">IDEX</span>';
      } else {
        url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank">IDEX <i class="fa fa-external-link" aria-hidden="true"></i></a>';
      }
    }
    return url;
  }

  utility.ddexURL = function (tokenObj, html) {
    var url = "https://ddex.io/trade/";
    var labelClass = "label-primary";
    if (tokenObj && tokenObj.DDEX) {
      url += tokenObj.DDEX + '-ETH';
    } else {
      labelClass = 'label-default';
      url = '';
    }

    if (html) {
      if (url == '') {
        url = '<span class="label ' + labelClass + '">DDEX</span>';
      } else {
        url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank">DDEX <i class="fa fa-external-link" aria-hidden="true"></i></a>';
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
    } else {
      labelClass = 'label-default';
      url = '';
    }

    if (html) {
      if (url == '') {
        url = '<span class="label ' + labelClass + '">Binance</span>';
      } else {
        url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank">Binance <i class="fa fa-external-link" aria-hidden="true"></i></a>';
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
        url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank">RadarRelay <i class="fa fa-external-link" aria-hidden="true"></i></a>';
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
        url = '<a class="label ' + labelClass + '" href="' + url + '" target="_blank">Kyber <i class="fa fa-external-link" aria-hidden="true"></i></a>';
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

  utility.addressLink = function (addr, html, short) {
    var url = 'https://etherscan.io/address/' + addr;
    if (!html)
      return url
    var displayText = addr;
    if (short)
      displayText = displayText.slice(0, 6) + '..';
    else {
      displayText = bundle.DeltaBalances.addressName(addr, !short);
    }
    return '<a target="_blank" href="' + url + '">' + displayText + ' </a>';
  };

  utility.tokenLink = function (addr, html, short) {
    var url = 'https://etherscan.io/token/' + addr;
    if (!html)
      return url
    var displayText = addr;
    if (short)
      displayText = displayText.slice(0, 6) + '..';
    else {
      displayText = bundle.DeltaBalances.addressName(addr, !short);
    }
    return '<a target="_blank" href="' + url + '">' + displayText + ' </a>';
  };

  utility.call = function call(web3In, contract, address, functionName, args, callback) {
    function proxy(retries) {
      const web3 = new Web3();
      const data = contract[functionName].getData.apply(null, args);
      let url = `https://api.etherscan.io/api`;
      let postContents = {
        module: 'proxy',
        action: 'eth_Call',
        to: address,
        data: data,
      }
      if (config.etherscanAPIKey) { postContents.apiKey = config.etherscanAPIKey };
      utility.postURL(url, postContents, (err, body) => {
        if (!err && body) {
          try {
            const result = body;//JSON.parse(body);
            const functionAbi = contract.abi.find(element => element.name === functionName);
            const solidityFunction = new SolidityFunction(web3.Eth, functionAbi, address);
            const resultUnpacked = solidityFunction.unpackOutput(result.result);
            callback(undefined, resultUnpacked);
          } catch (errJson) {
            if (retries > 0) {
              setTimeout(() => {
                proxy(retries - 1);
              }, 5000);
            } else {
              callback(err, undefined);
            }
          }
        } else {
          callback(err, undefined);
        }
      });
    }

    if (web3In && web3In.currentProvider) {
      try {
        const data = contract[functionName].getData.apply(null, args);
        web3In.eth.call({ to: address, data }, (err, result) => {
          if (!err) {
            const functionAbi = contract.abi.find(element => element.name === functionName);
            const solidityFunction = new SolidityFunction(web3In.Eth, functionAbi, address);
            try {
              const resultUnpacked = solidityFunction.unpackOutput(result);
              callback(undefined, resultUnpacked);
            } catch (errJson) {
              proxy(0);
            }
          } else {
            proxy(1);
          }
        });
      } catch (err) {
        proxy(1);
      }
    } else {
      proxy(0);
    }
  };

  //get etherdelta history logs from INFURA
  //inclusive for start and end
  // can handle ranges of 5k-10k blocks
  utility.getTradeLogs = function getTradeLogs(web3In, contractAddress, topics, startblock, endblock, rpcID, callback) {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }

    const filterObj = JSON.stringify([{
      fromBlock: '0x' + utility.decToHex(startblock),
      toBlock: '0x' + utility.decToHex(endblock),
      address: contractAddress,
      topics: topics,
    }]);

    let retries = 0;
    retry();

    function retry() {
      jQuery.ajax({
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        },
        type: "POST",
        async: true,
        'url': bundle.DeltaBalances.config.infuraURL,
        'data': '{"jsonrpc":"2.0","method":"eth_getLogs","params":' + filterObj + ' ,"id":' + rpcID + '}',
        'dataType': 'json',
      }).done((result) => {
        if (result.result && result.result.length > 0) {
          callback(result.result, (endblock - startblock) + 1);
        } else {
          callback([], (endblock - startblock) + 1);
        }
      }).fail((result) => {
        if (retries < 1) {
          retries++;
          retry();
          return;
        }
        else {
          callback(undefined, 0);
        }
      });
    }
  };

  utility.txReceipt = function txReceipt(web3In, txHash, callback, index) {
    if (web3In && web3In.currentProvider) {
      web3In.eth.getTransactionReceipt(txHash, (err, result) => {
        if (!err && result && result.blockNumber) {
          callback(undefined, result, index);
        } else {
          proxy();
        }
      });
    } else {
      proxy();
    }

    function proxy() {
      let url = `https://api.etherscan.io/api?module=proxy&action=eth_GetTransactionReceipt&txhash=${txHash}`;
      if (config.etherscanAPIKey) url += `&apikey=${config.etherscanAPIKey}`;
      utility.getURL(url, (err, body) => {
        if (!err && body) {
          const result = body;//JSON.parse(body);
          callback(undefined, result.result, index);
        } else {
          callback(err, undefined, index);
        }
      });
    }
  };

  utility.loadContract = function loadContract(web3In, abi, address, callback) {
    if (abi && abi.length > 0) {
      let contract = web3In.eth.contract(abi);
      contract = contract.at(address);
      callback(undefined, contract);
    } else {
      callback('no abi ', undefined);
    }
  };


  utility.getBlockDate = function getBlockDate(web3In, decBlocknr, callback) {
    if (web3In && web3In.currentProvider) {
      web3In.eth.getBlock(decBlocknr, (err, result) => {
        if (!err && result && result.timestamp) {
          callback(undefined, result.timestamp, decBlocknr);
        } else {
          proxy();
        }
      });
    } else {
      proxy();
    }

    function proxy() {
      var url = 'https://api.etherscan.io/api?module=block&action=getblockreward&blockno=' + decBlocknr + '&apikey=' + _delta.config.etherscanAPIKey;
      utility.getURL(url, (err, res) => {
        if (!err && res && res.status == "1" && res.result && res.result.timeStamp) {
          callback(undefined, res.result.timeStamp, res.result.blockNumber);
        } else {
          callback('failed to get date', undefined, decBlocknr);
        }
      });
    }
  };

  utility.blockNumber = function blockNumber(web3In, callback) {
    if (web3In && web3In.currentProvider) {
      web3In.eth.getBlockNumber((err, result) => {
        if (!err) {
          callback(undefined, Number(result));
        } else {
          proxy();
        }
      });
    } else {
      proxy();
    }

    function proxy() {
      let url = `https://api.etherscan.io/api?module=proxy&action=eth_BlockNumber`;
      if (config.etherscanAPIKey) url += `&apikey=${config.etherscanAPIKey}`;
      utility.getURL(url, (err, body) => {
        if (!err && body) {
          const result = body;//JSON.parse(body);
          callback(undefined, Number(utility.hexToDec(result.result)));
        } else {
          callback(err, undefined);
        }
      });
    }
  };

  utility.decToHex = function decToHex(dec, lengthIn) {
    let length = lengthIn;
    if (!length) length = 32;
    if (dec < 0) {
      // return convertBase((Math.pow(2, length) + decStr).toString(), 10, 16);
      return (new BigNumber(2)).pow(length).add(new BigNumber(dec)).toString(16);
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
    return (new BigNumber(dec)).toString(16);
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
  }


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

  utility.getMetamaskAddress = function () {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      // Use the browser's ethereum provider
      var provider = web3.currentProvider;
      var localWeb3 = new Web3(web3.currentProvider);
      if (localWeb3.eth.accounts.length > 0) {
        return localWeb3.eth.accounts[0].toLowerCase();
      }
    }
    return '';
  };
  return utility;
};
