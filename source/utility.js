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
