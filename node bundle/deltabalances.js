let config = require('./config.js');
const Web3 = require('web3');
const utility = require('./utility.js')(config);
const BigNumber = require('bignumber.js');
BigNumber.config({ ERRORS: false });

function DeltaBalances() {
    this.uniqueTokens = {};
    this.connection = undefined;
    this.secondsPerBlock = 14;
    this.web3 = undefined;
    this.web3s = [];
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

DeltaBalances.prototype.getDivisor = function getDivisor(tokenOrAddress) {
    let result = 1000000000000000000;
    const token = this.getToken(tokenOrAddress);
    if (token && token.decimals !== undefined) {
        result = Math.pow(10, token.decimals);
    }
    return new BigNumber(result);
};

DeltaBalances.prototype.divisorFromDecimals = function (decimals) {
    var result = 1000000000000000000;
    if (decimals !== undefined) {
        result = Math.pow(10, decimals);
    }
    return new BigNumber(result);
}

DeltaBalances.prototype.getToken = function getToken(addrOrToken, name, decimals) {
    let result;
    const lowerAddrOrToken = typeof addrOrToken === 'string' ? addrOrToken.toLowerCase() : addrOrToken;
    const matchingTokens = this.config.tokens.filter(
        x => x.addr.toLowerCase() === lowerAddrOrToken ||
            x.name === addrOrToken);
    const expectedKeys = JSON.stringify([
        'addr',
        'decimals',
        'name',
    ]);
    if (matchingTokens.length > 0) {
        result = matchingTokens[0];
    } else if (addrOrToken && addrOrToken.addr &&
        JSON.stringify(Object.keys(addrOrToken).sort()) === expectedKeys) {
        result = addrOrToken;
    } else if (typeof addrOrToken === 'string' && addrOrToken.slice(0, 2) === '0x' && name && decimals >= 0) {
        result = JSON.parse(JSON.stringify(this.config.tokens[0]));
        result.addr = lowerAddrOrToken;
        result.name = name;
        result.decimals = decimals;
    }
    return result;
};


DeltaBalances.prototype.loadWeb3 = function loadWeb3(wait, callback) {
    this.config = config;
    let delta = this;

    let names = Object.keys(this.config.web3URLs);
    let urls = Object.values(this.config.web3URLs);

    let detected = 0;
    let calledBack = false;

    //etherscan fallback web3
    this.web3 = new Web3();
    this.web3.setProvider(undefined);

    //backup blocknumber from etherscan, to check if web3 is up-to-date
    utility.blockNumber(undefined, function (error, result) {
        if (!error && result) {
            const block = Number(result);
            if (block > blocknum) {
                blocknum = block;
                console.log(`etherscan block: ${block}`);
            }
        }
    });

    let timedOut = false;
    setTimeout(function () {
        if (detected >= 1 && !calledBack) {
            console.log('web3 search timed out');
            calledBack = true;
            callback();
        }
    }, 2000);

    for (let i = 0; i < urls.length; i++) {
        let provider = urls[i];

        let localWeb3 = new Web3(new Web3.providers.HttpProvider(provider));
        localWeb3.eth.getBlockNumber(function (error, result) {
            if (!error && result) {
                const block = Number(result);
                if (block > blocknum) {
                    blocknum = block;
                    console.log(names[i] + ` block: ${block}`);
                    delta.web3s.push(localWeb3);
                } else if (block >= (blocknum - 5)) {
                    console.log(names[i] + ` block: ${block}`);
                    delta.web3s.push(localWeb3);
                }
            } else {
                console.log(names[i] + 'web3 connection failed');
            }
            detected++;
            if (!wait || detected >= urls.length) {
                if (!calledBack) {
                    calledBack = true;
                    callback();
                }
            }
        });
    }
};

DeltaBalances.prototype.changeContract = function changeContract(index) {

    if (index < 0 || index > this.config.contractEtherDeltaAddrs.length)
        index = 0;

    this.config.contractEtherDeltaAddr = this.config.contractEtherDeltaAddrs[index].addr;
}

DeltaBalances.prototype.initContracts = function initContracts(callback) {
    let _delta = this;
    /*
    this.web3.version.getNetwork((error, version) => {
        if (!error && version && Number(version) !== 1) {
            _delta.dialogError('You are connected to the Ethereum testnet. Please connect to the Ethereum mainnet.');
        }
    }); */

    this.config = config;
    this.config.contractEtherDeltaAddr = this.config.contractEtherDeltaAddrs[0].addr;

    if (Array.isArray(this.config.apiServers)) {
        this.config.apiServer = this.config.apiServers[
            Math.floor(Math.random() * this.config.apiServers.length)];
        console.log('Selected API', this.config.apiServer);
    }

    // load contract
    utility.loadContract(
        _delta.web3,
        _delta.config.deltaBalancesAbi,
        _delta.config.contractDeltaBalanceAddr,
        (err, contractDeltaBalance) => {
            _delta.contractDeltaBalance = contractDeltaBalance;
            callback();
        });
};

DeltaBalances.prototype.initTokens = function (useBlacklist) {

    let smartKeys = Object.keys(smartRelays);
    let smartrelays = Object.values(smartRelays);

    for (var i = 0; i < smartrelays.length; i++) {
        tokenBlacklist[smartKeys[i]] = smartrelays[i];
        if (!this.uniqueTokens[smartKeys[i]]) {
            let token = { addr: smartKeys[i], name: smartrelays[i], decimals: 18, unlisted: true };
            this.uniqueTokens[token.addr] = token;
        }
    }


    //format list of all tokens like ED tokens
    offlineCustomTokens = offlineCustomTokens.map((x) => {

        let unlisted = true;
        if (x.address && x.symbol) {
            let addr = x.address.toLowerCase();
            //make sure WETH appears listed 
            if (utility.isWrappedETH(addr) || utility.isNonEthBase(addr)) {
                unlisted = false;
            }
            var token = {
                "name": utility.escapeHtml(x.symbol),
                "addr": addr,
                "unlisted": unlisted,
                "decimals": x.decimal,
            };
            if (x.name) {
                token.name2 = utility.escapeHtml(x.name);
            }
            if (x.locked) {
                token.locked = true;
            }

            let listedExchanges = ['EtherDelta', 'ForkDelta', 'IDEX', 'DDEX', 'Binance'];
            for (let i = 0; i < listedExchanges.length; i++) {
                let exchange = listedExchanges[i];
                if (x[exchange]) {
                    token[exchange] = x[exchange];
                    token.unlisted = false;
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

    //check listed tokens with updated/cached exchange listings  (not in backupTokens.js)

    try {
        // check for listed tokens at forkdelta
        let forkTokens = [];
        if (forkDeltaConfig && forkDeltaConfig.tokens) {
            forkTokens = forkDeltaConfig.tokens;
        }
        //forkTokens = forkTokens.filter((x) => { return !(this.uniqueTokens[x.addr]) });
        for (var i = 0; i < forkTokens.length; i++) {
            var token = forkTokens[i];
            if (token) {
                token.name = utility.escapeHtml(token.name); // escape nasty stuff in token symbol/name
                token.addr = token.addr.toLowerCase();
                token.unlisted = false;
                token.ForkDelta = token.name;

                if (token.fullName && token.fullName !== "") {
                    token.name2 = token.fullName;
                }

                if (this.uniqueTokens[token.addr]) {
                    this.uniqueTokens[token.addr].ForkDelta = token.name;
                    this.uniqueTokens[token.addr].unlisted = false;

                    if (token.name2 && !this.uniqueTokens[token.addr].name2) {
                        this.uniqueTokens[token.addr].name2 = token.name2;
                    }
                }
                else {
                    this.uniqueTokens[token.addr] = token;
                }
            }
        }
    } catch (e) {
        console.log('failed to parse ForkDelta token list');
    }

    try {
        //ddex listed tokens
        let ddexTokens = [];
        if (ddexConfig && ddexConfig.tokens) {
            ddexTokens = ddexConfig.tokens;
        }
        for (var i = 0; i < ddexTokens.length; i++) {
            var tok = ddexTokens[i];
            if (tok) {
                let token = {};
                token.addr = tok.address.toLowerCase();
                token.name = utility.escapeHtml(tok.symbol); // escape nasty stuff in token symbol/name

                token.decimals = tok.decimals;
                token.unlisted = false;
                token.DDEX = token.name;
                if (this.uniqueTokens[token.addr]) {
                    this.uniqueTokens[token.addr].DDEX = token.name;
                    this.uniqueTokens[token.addr].unlisted = false;
                }
                else {
                    this.uniqueTokens[token.addr] = token;
                }
            }
        }
    } catch (e) {
        console.log('failed to parse DDEX token list');
    }

    try {
        //check listing for idex
        for (var i = 0; i < idexConfig.length; i++) {
            var token = idexConfig[i];
            token.addr = token.addr.toLowerCase();
            token.IDEX = token.name;
            token.unlisted = false;
            if (this.uniqueTokens[token.addr]) {
                this.uniqueTokens[token.addr].IDEX = token.name;
                this.uniqueTokens[token.addr].unlisted = false;

                if (token.name2 && !this.uniqueTokens[token.addr].name2) {
                    this.uniqueTokens[token.addr].name2 = token.name2;
                }
            }
            else {
                this.uniqueTokens[token.addr] = token;
            }
        }
    } catch (e) {
        console.log('failed to parse IDEX token list');
    }



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

                    if (token.name2 && !this.uniqueTokens[token.addr].name2) {
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

    let ethAddr = this.config.ethAddr;
    this.config.customTokens = Object.values(_delta.uniqueTokens).filter((x) => { return !tokenBlacklist[x.addr]; });
    let listedTokens = Object.values(_delta.uniqueTokens).filter((x) => { return (!x.unlisted && !tokenBlacklist[x.addr] && x.addr !== ethAddr); });
    this.config.tokens = [this.uniqueTokens[ethAddr]].concat(listedTokens);
}

DeltaBalances.prototype.setToken = function (address) {
    address = address.toLowerCase();
    if (address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') //kyber uses eeeee for ETH
        address = this.config.ethAddr;
    if (this.uniqueTokens[address]) {
        return this.uniqueTokens[address];
    } else {
        //unknownToken = true;
        //TODO get decimals get symbol
        return { addr: address, name: '???', unknown: true, decimals: 18, unlisted: true };
    }
};

DeltaBalances.prototype.processUnpackedInput = function (tx, unpacked) {

    // if contractAddress, input from etherscan token transfer log. To & from aren't original but for token transfer itself
    var badFromTo = false;
    if (tx.contractAddress)
        badFromTo = true;

    try {
        if (unpacked && unpacked.name) {
            if (unpacked.name === 'transfer') {
                var to = unpacked.params[0].value.toLowerCase();
                var rawAmount = unpacked.params[1].value;
                var amount = new BigNumber(0);
                var token = badFromTo ? this.setToken(tx.contractAddress) : this.setToken(tx.to);
                var unlisted = true;
                if (token && token.addr) {
                    var dvsr = this.divisorFromDecimals(token.decimals);
                    amount = utility.weiToEth(rawAmount, dvsr);
                    unlisted = token.unlisted;
                }
                var obj =
                    {
                        'type': 'Transfer',
                        'note': 'Give the token contract the order to transfer your tokens',
                        'token': token,
                        'amount': amount,
                        'from': tx.from.toLowerCase(),
                        'to': to,
                        'unlisted': unlisted,
                    };
                return obj;
            }
            //sender, //amount  /to is contractAddr
            else if (!badFromTo && unpacked.name === 'approve') {
                var sender = unpacked.params[0].value;
                var rawAmount = unpacked.params[1].value;
                var from = tx.from;
                var amount = new BigNumber(0);
                var token = this.setToken(tx.to);
                var unlisted = true;
                if (token && token.addr) {
                    var dvsr = this.divisorFromDecimals(token.decimals);
                    amount = utility.weiToEth(rawAmount, dvsr);
                    unlisted = token.unlisted;
                }

                var exchange = 'unknown ';
                let addrName = this.addressName(sender);
                if (addrName !== sender.toLowerCase()) {
                    exchange = addrName;
                }

                var obj =
                    {
                        'type': 'Approve',
                        'exchange': exchange,
                        'note': 'Approve ' + exchange + 'to move tokens for you.',
                        'token': token,
                        'amount': amount,
                        'from': from,
                        'to': sender,
                        'unlisted': unlisted,
                    };
                return obj;
            }
            // exchange deposit/withdraw and 0x WETH (un)wrapping
            else if (unpacked.name === 'deposit' || unpacked.name === 'withdraw' || unpacked.name === 'withdrawEther' || unpacked.name === 'depositEther') {
                var type = '';
                var note = '';
                var rawVal = new BigNumber(0);
                var token = this.setToken(this.config.ethAddr);
                var token2 = undefined;
                var exchange = '';

                if (unpacked.name === 'deposit' || unpacked.name === 'depositEther') {
                    rawVal = new BigNumber(tx.value);
                    if (!utility.isWrappedETH(tx.to) && !badFromTo) {
                        type = 'Deposit';
                        let addrName = this.addressName(tx.to);
                        if (addrName.indexOf('0x') === -1) {
                            exchange = addrName;
                            note = 'Deposit ETH into the ' + exchange + 'contract';
                        } else {
                            note = 'Deposit ETH into the exchange contract';
                        }
                    } else {
                        type = 'Wrap ETH';
                        note = 'Wrap ETH to WETH';
                        token = this.setToken(this.config.ethAddr);
                        token2 = badFromTo ? this.setToken(tx.contractAddress) : this.setToken(tx.to);
                    }
                } else {
                    rawVal = unpacked.params[0].value;
                    if (!utility.isWrappedETH(tx.to) && !badFromTo) {
                        type = 'Withdraw';

                        let addrName = this.addressName(tx.to);
                        if (addrName.indexOf('0x') === -1) {
                            exchange = addrName;
                            note = 'Request the ' + exchange + 'contract to withdraw ETH';
                        } else {
                            note = 'Request the exchange contract to withdraw ETH';
                        }
                    } else {
                        type = 'Unwrap ETH';
                        note = 'Unwrap WETH to ETH';
                        token = badFromTo ? this.setToken(tx.contractAddress) : this.setToken(tx.to);
                        token2 = this.setToken(this.config.ethAddr);
                    }
                }

                var val = utility.weiToEth(rawVal);

                if (type.indexOf('rap') === -1) {
                    var obj = {
                        'type': type,
                        'exchange': exchange,
                        'token': token,
                        'note': note,
                        'amount': val,
                    };
                    return obj;
                } else {
                    var obj = {
                        'type': type,
                        'token In': token,
                        'token Out': token2,
                        'note': note,
                        'amount': val,
                    };
                    return obj;
                }
            }
            else if (unpacked.name === 'depositToken' || unpacked.name === 'withdrawToken' || /* enclaves */ unpacked.name === 'withdrawBoth' || unpacked.name === 'depositBoth') {
                var token = this.setToken(unpacked.params[0].value);
                if (token && token.addr) {
                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var val = utility.weiToEth(unpacked.params[1].value, dvsr);
                    var type = '';
                    var note = '';
                    var exchange = '';

                    let addrName = this.addressName(tx.to);
                    if (badFromTo && unpacked.name === 'withdrawToken') {
                        addrName = this.addressName(tx.from);
                    }

                    if (addrName.indexOf('0x') === -1) {
                        exchange = addrName;
                    }

                    if (unpacked.name === 'withdrawToken' || unpacked.name === 'withdrawBoth') {
                        type = 'Withdraw';
                        if (exchange) {
                            note = 'Request the ' + exchange + 'contracy to withdraw ' + token.name;
                        } else {
                            note = 'Request the exchange to withdraw ' + token.name;
                        }
                    }
                    else {
                        type = 'Deposit';
                        if (exchange) {
                            note = 'Request the ' + exchange + 'contract to deposit ' + token.name;
                        } else {
                            note = 'Request the exchange contract to deposit ' + token.name;
                        }
                    }

                    var obj = {
                        'type': 'Token ' + type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': val,
                        'unlisted': unlisted,
                    };

                    //enclaves dex , move tokens and ETH
                    if (unpacked.name === 'withdrawBoth' || unpacked.name === 'depositBoth') {
                        obj.type = 'Token & ETH ' + type;
                        obj.base = this.setToken(this.config.ethAddr);


                        let rawEthVal = new BigNumber(0);
                        if (unpacked.name === 'withdrawBoth') {
                            rawEthVal = new BigNumber(unpacked.params[2].value);
                        } else {
                            rawEthVal = new BigNumber(tx.value);
                        }
                        let ethVal = utility.weiToEth(rawEthVal);
                        obj.baseAmount = ethVal;
                    }

                    return obj;
                }
            }
            // cancel EtherDelta, decentrex, tokenstore
            else if (!badFromTo && unpacked.name === 'cancelOrder' && unpacked.params.length > 3) {
                var cancelType = 'sell';
                var token = undefined;
                var token2 = undefined;

                let tokenGet = this.setToken(unpacked.params[0].value);
                let tokenGive = this.setToken(unpacked.params[2].value);

                var exchange = '';
                let addrName = this.addressName(tx.to);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (utility.isWrappedETH(tokenGet.addr) || (!utility.isWrappedETH(tokenGive.addr) && utility.isNonEthBase(tokenGive.addr))) // get eth  -> sell
                {
                    cancelType = 'buy';
                    token = tokenGive;
                    token2 = tokenGet;
                }
                else if (utility.isWrappedETH(tokenGive.addr) || (!utility.isWrappedETH(tokenGet.addr) && utility.isNonEthBase(tokenGet.addr))) // buy
                {
                    token = tokenGet;
                    token2 = tokenGive;
                }
                else {
                    console.log('unknown base token');
                    return undefined;
                }

                if (token && token2 && token.addr && token2.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    if (cancelType === 'sell') {
                        amount = new BigNumber(unpacked.params[1].value);
                        oppositeAmount = new BigNumber(unpacked.params[3].value);
                    } else {
                        oppositeAmount = new BigNumber(unpacked.params[1].value);
                        amount = new BigNumber(unpacked.params[3].value);
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(token2.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }

                    var obj = {
                        'type': 'Cancel ' + cancelType,
                        'exchange': exchange,
                        'note': 'Cancel an open order',
                        'token': token,
                        'amount': val,
                        'price': price,
                        'base': token2,
                        'baseAmount': val2,
                        'unlisted': unlisted,
                    };
                    return obj;
                }
            }
            // 0x cancel input
            else if (!badFromTo && (unpacked.name === 'cancelOrder' || unpacked.name === 'batchCancelOrders')) {

                var _delta = this;

                var exchange = '';

                if (unpacked.name === 'cancelOrder') {
                    let orderAddresses1 = unpacked.params[0].value;
                    let orderValues1 = unpacked.params[1].value;
                    let cancelTakerTokenAmount1 = new BigNumber(unpacked.params[2].value);

                    return unpackCancelInput(orderAddresses1, orderValues1, cancelTakerTokenAmount1);
                } else if (unpacked.name === 'batchCancelOrders') {
                    let orderAddresses2 = unpacked.params[0].value;
                    let orderValues2 = unpacked.params[1].value;
                    let cancelTakerTokenAmounts2 = unpacked.params[2].value.map(x => new BigNumber(x));

                    var objs = [];
                    for (let i = 0; i < orderAddresses2.length; i++) {
                        var obj = unpackCancelInput(orderAddresses2[i], orderValues2[i], cancelTakerTokenAmounts2[i]);
                        if (obj)
                            objs.push(obj);
                    }
                    return objs;
                }


                function unpackCancelInput(orderAddresses, orderValues, cancelTakerTokenAmount) {
                    let maker = orderAddresses[0].toLowerCase();
                    let taker = tx.from.toLowerCase();// orderAddresses[1].toLowerCase();
                    let makerToken = _delta.setToken(orderAddresses[2]);
                    let takerToken = _delta.setToken(orderAddresses[3]);

                    let makerAmount = new BigNumber(orderValues[0]);
                    let takerAmount = new BigNumber(orderValues[1]);

                    // fee is ZRX
                    let feeCurrency = _delta.setToken('0xe41d2489571d322189246dafa5ebde1f4699f498');
                    let feeDivisor = _delta.divisorFromDecimals(feeCurrency.decimals)
                    let makerFee = utility.weiToEth(orderValues[2], feeDivisor);
                    let takerFee = utility.weiToEth(orderValues[3], feeDivisor);
                    let relayer = orderAddresses[4].toLowerCase();

                    exchange = utility.relayName(relayer);
                    // orderValues[4] is expiry

                    var tradeType = 'Sell';
                    var token = undefined;
                    var token2 = undefined;

                    var nonETH = false;

                    if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                    {
                        tradeType = 'Buy';
                        token = makerToken;
                        token2 = takerToken;
                    }
                    else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                    {
                        token = takerToken;
                        token2 = makerToken;
                    }
                    else {
                        console.log('unknown base token');
                        return undefined;
                    }

                    if (token && token2 && token.addr && token2.addr) {
                        var amount = new BigNumber(0);
                        var oppositeAmount = new BigNumber(0);
                        var chosenAmount = cancelTakerTokenAmount;
                        if (tradeType === 'Sell') {
                            amount = takerAmount;
                            oppositeAmount = makerAmount;
                        } else {
                            oppositeAmount = takerAmount;
                            amount = makerAmount;
                        }

                        var unlisted = token.unlisted;
                        var dvsr = _delta.divisorFromDecimals(token.decimals)
                        var dvsr2 = _delta.divisorFromDecimals(token2.decimals)
                        var val = utility.weiToEth(amount, dvsr);
                        var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                        var orderSize = new BigNumber(0);
                        var price = new BigNumber(0);
                        if (val.greaterThan(0)) {
                            price = val2.div(val);
                        }

                        if (tradeType === 'Buy') {
                            orderSize = val;
                            if (oppositeAmount.greaterThan(chosenAmount)) {
                                val2 = utility.weiToEth(chosenAmount, dvsr2);
                                amount = chosenAmount.div((oppositeAmount.div(amount)));
                                val = utility.weiToEth(amount, dvsr);
                            }
                        } else {
                            orderSize = val;
                            if (amount.greaterThan(chosenAmount)) {
                                val = utility.weiToEth(chosenAmount, dvsr);
                                oppositeAmount = (chosenAmount.times(oppositeAmount)).div(amount);
                                val2 = utility.weiToEth(oppositeAmount, dvsr2);
                            }
                        }

                        var obj = {
                            'type': 'Cancel ' + tradeType.toLowerCase(),
                            'exchange': exchange,
                            'note': utility.addressLink(maker, true, true) + 'Cancels an open order in the orderbook.',
                            'token': token,
                            'amount': val,
                            'price': price,
                            'base': token2,
                            'baseAmount': val2,
                            'order size': orderSize,
                            'unlisted': unlisted,
                            'relayer': relayer
                        };

                        return obj;
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

                let makerAmount = new BigNumber(unpacked.params[1].value);
                let takerAmount = new BigNumber(unpacked.params[4].value);

                var exchange = '';
                let addrName = this.addressName(tx.to);
                if (badFromTo) {
                    addrName = this.addressName(this.config.contractAirSwapAddr);
                }
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }


                var tradeType = 'Sell';
                var token = undefined;
                var token2 = undefined;

                var nonETH = false;

                if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    token2 = takerToken;
                }
                else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                {
                    token = takerToken;
                    token2 = makerToken;
                }
                else {
                    console.log('unknown base token');
                    return undefined;
                }

                if (token && token2 && token.addr && token2.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
                        amount = takerAmount;
                        oppositeAmount = makerAmount;
                    } else {
                        oppositeAmount = takerAmount;
                        amount = makerAmount;
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(token2.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }

                    if (unpacked.name === 'cancel') {
                        var obj = {
                            'type': 'Cancel ' + tradeType.toLowerCase(),
                            'exchange': exchange,
                            'note': utility.addressLink(maker, true, true) + 'Cancels an open order.',
                            'token': token,
                            'amount': val,
                            'price': price,
                            'base': token2,
                            'baseAmount': val2,
                            'order size': val2,
                            'unlisted': unlisted,
                        };

                        return obj;
                    } else { //fill
                        var obj = {
                            'type': 'Taker ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order.',
                            'token': token,
                            'amount': val,
                            'price': price,
                            'base': token2,
                            'baseAmount': val2,
                            'order size': val2,
                            'unlisted': unlisted,
                            'taker': taker,
                            'maker': maker,
                        };
                        return obj;
                    }
                }
            }
            //oasisdex cancel/kill
            else if ((unpacked.name === 'cancel' || unpacked.name == 'kill') && unpacked.params.length == 1) {

                var exchange = '';
                let addrName = this.addressName(tx.to);
                if (badFromTo && addrName.indexOf('0x') >= 0) {
                    addrName = this.addressName(tx.from);
                }
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                var obj = {
                    'type': 'Cancel offer',
                    'exchange': exchange,
                    'orderID': new BigNumber(unpacked.params[0].value),
                    'note': 'Cancel an open order',
                };
                return obj;
            }
            // etherdelta/decentrex/tokenstore use 11, idex has 4, enclaves has 12
            else if (!badFromTo && (unpacked.name === 'trade' && (unpacked.params.length == 11 || unpacked.params.length == 12 || unpacked.params.length == 4) || unpacked.name === 'tradeEtherDelta')) {

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
                var token2 = undefined;
                let tokenGet = this.setToken(unpacked.params[0].value);
                let tokenGive = this.setToken(unpacked.params[2].value);

                var exchange = '';
                let addrName = this.addressName(tx.to);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (utility.isWrappedETH(tokenGet.addr) || (!utility.isWrappedETH(tokenGive.addr) && utility.isNonEthBase(tokenGive.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = tokenGive;
                    token2 = tokenGet;
                }
                else if (utility.isWrappedETH(tokenGive.addr) || (!utility.isWrappedETH(tokenGet.addr) && utility.isNonEthBase(tokenGet.addr))) // buy
                {
                    token = tokenGet;
                    token2 = tokenGive;
                }
                else {
                    console.log('unknown base token');
                    return undefined;
                }

                if (token && token2 && token.addr && token2.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    var chosenAmount = new BigNumber(unpacked.params[10].value);
                    if (tradeType === 'Sell') {
                        amount = new BigNumber(unpacked.params[1].value);
                        oppositeAmount = new BigNumber(unpacked.params[3].value);
                    } else {
                        oppositeAmount = new BigNumber(unpacked.params[1].value);
                        amount = new BigNumber(unpacked.params[3].value);
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(token2.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var orderSize = new BigNumber(0);
                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }

                    if (tradeType === 'Buy') {
                        orderSize = val;
                        if (oppositeAmount.greaterThan(chosenAmount)) {
                            val2 = utility.weiToEth(chosenAmount, dvsr2);
                            amount = chosenAmount.div((oppositeAmount.div(amount)));
                            val = utility.weiToEth(amount, dvsr);
                        }
                    } else {
                        orderSize = val;
                        if (amount.greaterThan(chosenAmount)) {
                            val = utility.weiToEth(chosenAmount, dvsr);
                            oppositeAmount = (chosenAmount.times(oppositeAmount)).div(amount);
                            val2 = utility.weiToEth(oppositeAmount, dvsr2);
                        }
                    }

                    let takerAddr = idex ? unpacked.params[11].value : tx.from;
                    let makerAddr = unpacked.params[6].value.toLowerCase();

                    let takeFee = new BigNumber(0);
                    let makeFee = new BigNumber(0);
                    let takeFeeCurrency = '';
                    let makeFeeCurrency = '';

                    if (idex) {
                        const ether1 = new BigNumber(1000000000000000000);
                        let takerFee = new BigNumber(2000000000000000); //0.2% fee in wei
                        let makerFee = new BigNumber(1000000000000000); //0.1% fee in wei

                        //assume take trade

                        if (tradeType === 'Sell') {
                            if (takerFee.greaterThan(0)) {
                                takeFee = utility.weiToEth((new BigNumber(amount).times(takerFee)).div(ether1), dvsr);
                                takeFeeCurrency = token;
                            }
                            if (makerFee.greaterThan(0)) {
                                makeFee = utility.weiToEth((new BigNumber(oppositeAmount).times(makerFee)).div(ether1), dvsr2);
                                makeFeeCurrency = token2;
                            }
                        }
                        else if (tradeType === 'Buy') {
                            if (takerFee.greaterThan(0)) {
                                takeFee = utility.weiToEth((new BigNumber(oppositeAmount).times(takerFee)).div(ether1), dvsr2);
                                takeFeeCurrency = token2;
                            } if (makerFee.greaterThan(0)) {
                                makeFee = utility.weiToEth((new BigNumber(amount).times(makerFee)).div(ether1), dvsr);
                                makeFeeCurrency = token2;
                            }
                        }
                    }


                    var obj = {
                        'type': 'Taker ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(takerAddr, true, true) + ' selected ' + utility.addressLink(makerAddr, true, true) + '\'s order in the orderbook to trade.',
                        'token': token,
                        'amount': val,
                        'price': price,
                        'base': token2,
                        'baseAmount': val2,
                        'order size': orderSize,
                        'unlisted': unlisted,
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
                }
            } else if (!badFromTo && unpacked.name === 'trade' && unpacked.params.length == 3) {

                let _delta = this;
                let numberOfTrades = unpacked.params[1].value.length - 1;
                var objs = [];
                for (let i = 0; i < numberOfTrades; i++) {

                    let offset = i * 10;

                    var obj = unpackOrderInput(
                        Number(unpacked.params[0].value[0 + offset]) > 0,
                        new BigNumber(unpacked.params[0].value[6 + offset]),
                        new BigNumber(unpacked.params[0].value[5 + offset]),
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

                function unpackOrderInput(isBuy, amount, price, inputToken, maker) {
                    var tradeType = 'Sell';
                    if (isBuy) {
                        tradeType = 'Buy';
                    }
                    var token = _delta.setToken(inputToken);
                    var base = _delta.setToken(_delta.config.ethAddr);

                    var exchange = '';
                    let addrName = _delta.addressName(tx.to);
                    if (addrName.indexOf('0x') === -1) {
                        exchange = addrName;
                    }

                    if (token && base && token.addr && base.addr) {

                        var unlisted = token.unlisted;
                        var dvsr = _delta.divisorFromDecimals(token.decimals)
                        var dvsr2 = _delta.divisorFromDecimals(base.decimals)
                        var val = utility.weiToEth(amount, dvsr);

                        // price in 1e18
                        price = utility.weiToEth(price, dvsr2);
                        let dvsr3 = _delta.divisorFromDecimals(base.decimals - token.decimals)
                        price = utility.weiToEth(price, dvsr3);

                        var val2 = val.times(price);


                        let takerAddr = tx.from.toLowerCase();
                        let makerAddr = maker.toLowerCase();

                        var obj = {
                            'type': 'Taker ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(takerAddr, true, true) + ' selected ' + utility.addressLink(makerAddr, true, true) + '\'s order in the orderbook to trade.',
                            'token': token,
                            'amount': val,
                            'price': price,
                            'base': base,
                            'baseAmount': val2,
                            //   'order size': orderSize,
                            'unlisted': unlisted,
                            'taker': takerAddr,
                            'maker': makerAddr,
                        };
                        return obj;
                    }
                    return undefined;
                }
            }
            //kyber trade input
            else if (unpacked.name === 'trade' && unpacked.params.length == 7) {
                /* trade(
                     ERC20 src,
                     uint srcAmount,
                     ERC20 dest,
                     address destAddress,
                     uint maxDestAmount,
                     uint minConversionRate,
                     address walletId
                 ) */
                let maker = '';
                let taker = tx.from.toLowerCase();
                let takerToken = this.setToken(unpacked.params[0].value);
                let makerToken = this.setToken(unpacked.params[2].value);

                let takerAmount = new BigNumber(unpacked.params[1].value);
                let makerAmount = new BigNumber(unpacked.params[4].value);

                let maxAmount = new BigNumber(unpacked.params[4].value);
                let rate = new BigNumber(unpacked.params[5].value);

                let minPrice = new BigNumber(0);
                let maxPrice = new BigNumber(0);

                var tradeType = 'Sell';
                var token = undefined;
                var token2 = undefined;

                var nonETH = false;

                var exchange = '';
                let addrName = this.addressName(tx.to);

                if (badFromTo && addrName === tx.to.toLowerCase()) {
                    addrName = this.addressName(tx.from);
                }
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    token2 = takerToken;
                }
                else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                {
                    token = takerToken;
                    token2 = makerToken;
                }
                else {
                    console.log('unknown base token');
                    return undefined;
                }

                if (token && token2 && token.addr && token2.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
                        amount = takerAmount;
                        oppositeAmount = makerAmount;
                    } else {
                        oppositeAmount = takerAmount;
                        amount = makerAmount;
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(token2.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    /*     var price = new BigNumber(0);
                         if (val.greaterThan(0)) {
                             price = val2.div(val);
                         } */

                    var obj;

                    if (tradeType === 'Sell') {
                        val2 = rate.times(val);
                        val2 = utility.weiToEth(val2, dvsr2);
                        minPrice = utility.weiToEth(rate, dvsr2);
                        // maxAmount = utility.weiToEth(maxAmount, dvsr2);

                        obj = {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': utility.addressLink(taker, true, true) + 'made a trade.',
                            'token': token,
                            'amount': val,
                            'minPrice': minPrice,
                            'base': token2,
                            'estBaseAmount': val2,
                            'unlisted': unlisted,
                            'taker': taker,
                            // 'maker': maker,
                        };
                        return obj;
                    } else {

                        let one = new BigNumber(1000000000000000000);
                        maxPrice = one.div(rate);

                        //estimated amount by max price
                        val = val2.div(maxPrice);

                        var obj = {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': utility.addressLink(taker, true, true) + 'made a trade.',
                            'token': token,
                            'estAmount': val,
                            'maxPrice': maxPrice,
                            'base': token2,
                            'baseAmount': val2,
                            'unlisted': unlisted,
                            'taker': taker,
                            // 'maker': maker,
                        };
                        return obj;
                    }


                }
            }
            // 0x trade input
            else if (unpacked.name === 'fillOrder'
                || unpacked.name === 'fillOrKillOrder'
                || unpacked.name === 'batchFillOrders'
                || unpacked.name === 'batchFillOrKillOrders'
                || unpacked.name === 'fillOrdersUpTo'
            ) {

                var _delta = this;
                var exchange = '';

                if (unpacked.name === 'fillOrder' || unpacked.name == 'fillOrKillOrder') {
                    let orderAddresses1 = unpacked.params[0].value;
                    let orderValues1 = unpacked.params[1].value;
                    let fillTakerTokenAmount1 = new BigNumber(unpacked.params[2].value);

                    return unpackOrderInput(orderAddresses1, orderValues1, fillTakerTokenAmount1);
                } else if (unpacked.name === 'batchFillOrders' || unpacked.name == 'batchFillOrKillOrders') {
                    let orderAddresses2 = unpacked.params[0].value;
                    let orderValues2 = unpacked.params[1].value;
                    let fillTakerTokenAmounts2 = unpacked.params[2].value.map(x => new BigNumber(x));

                    var objs = [];
                    for (let i = 0; i < orderAddresses2.length; i++) {
                        var obj = unpackOrderInput(orderAddresses2[i], orderValues2[i], fillTakerTokenAmounts2[i]);
                        if (obj)
                            objs.push(obj);
                    }
                    return objs;
                } else if (unpacked.name === 'fillOrdersUpTo') {
                    let orderAddresses3 = unpacked.params[0].value;
                    let orderValues3 = unpacked.params[1].value;
                    let fillTakerTokenAmount3 = new BigNumber(unpacked.params[2].value);

                    var objs = [];
                    for (let i = 0; i < orderAddresses3.length; i++) {
                        var obj = unpackOrderInput(orderAddresses3[i], orderValues3[i], fillTakerTokenAmount3);
                        if (obj)
                            objs.push(obj);
                    }

                    if (objs.length <= 1)
                        return objs;

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

                    let takeAmount = fillTakerTokenAmount3;
                    let isAmount = false;
                    let tok = undefined;
                    let tok2 = undefined;
                    if (objs[0].type.indexOf('Sell') !== -1) {
                        tok = this.setToken(orderAddresses3[0][3]);
                        tok2 = this.setToken(orderAddresses3[0][2]);
                        takeAmount = utility.weiToEth(takeAmount, this.divisorFromDecimals(tok.decimals));
                        isAmount = true;
                    } else {
                        tok = this.setToken(orderAddresses3[0][2]);
                        tok2 = this.setToken(orderAddresses3[0][3]);
                        takeAmount = utility.weiToEth(takeAmount, this.divisorFromDecimals(tok2.decimals));
                        isAmount = false;
                    }



                    let relayer3 = orderAddresses3[0][4].toLowerCase();
                    exchange = utility.relayName(relayer3);
                    let taker3 = badFromTo ? '' : tx.from.toLowerCase();

                    let initObj = {
                        'type': objs[0].type.slice(6) + ' up to',
                        'exchange': exchange,
                        'note': utility.addressLink(taker3, true, true) + 'selects 1 or more orders to fill an amount',
                        'token': objs[0].token,
                        'amount': takeAmount,
                        'minPrice': minPrice,
                        'maxPrice': maxPrice,
                        'unlisted': objs[0].unlisted,
                        'base': tok2,
                        'baseAmount': takeAmount,
                        'relayer': relayer3,
                    };

                    if (isAmount) {
                        delete initObj.baseAmount;
                    } else {
                        delete initObj.amount;
                    }

                    for (let i = 0; i < objs.length; i++) {
                        delete objs[i].amount;
                        delete objs[i].baseAmount;
                    }

                    return [initObj].concat(objs);
                }


                function unpackOrderInput(orderAddresses, orderValues, fillTakerTokenAmount) {

                    let maker = orderAddresses[0].toLowerCase();
                    let taker = badFromTo ? '' : tx.from.toLowerCase();//if tx has contractAddress field, is etherscan token transfer event, from/to incorrect for trade tx
                    let makerToken = _delta.setToken(orderAddresses[2]);
                    let takerToken = _delta.setToken(orderAddresses[3]);

                    let makerAmount = new BigNumber(orderValues[0]);
                    let takerAmount = new BigNumber(orderValues[1]);

                    // fee is ZRX
                    let feeCurrency = _delta.setToken('0xe41d2489571d322189246dafa5ebde1f4699f498');
                    let feeDivisor = _delta.divisorFromDecimals(feeCurrency.decimals)
                    let makerFee = utility.weiToEth(orderValues[2], feeDivisor);
                    let takerFee = utility.weiToEth(orderValues[3], feeDivisor);
                    let relayer = orderAddresses[4].toLowerCase();

                    exchange = utility.relayName(relayer);
                    // orderValues[4] is expiry

                    var tradeType = 'Sell';
                    var token = undefined;
                    var token2 = undefined;

                    if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                    {
                        tradeType = 'Buy';
                        token = makerToken;
                        token2 = takerToken;
                    }
                    else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                    {
                        token = takerToken;
                        token2 = makerToken;
                    }
                    else {
                        console.log('unknown base token');
                        return undefined;
                    }


                    if (token && token2 && token.addr && token2.addr) {
                        var amount = new BigNumber(0);
                        var oppositeAmount = new BigNumber(0);
                        var chosenAmount = fillTakerTokenAmount;
                        if (tradeType === 'Sell') {
                            amount = takerAmount;
                            oppositeAmount = makerAmount;
                        } else {
                            oppositeAmount = takerAmount;
                            amount = makerAmount;
                        }

                        var unlisted = token.unlisted;
                        var dvsr = _delta.divisorFromDecimals(token.decimals)
                        var dvsr2 = _delta.divisorFromDecimals(token2.decimals)
                        var val = utility.weiToEth(amount, dvsr);
                        var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                        var orderSize = new BigNumber(0);
                        var price = new BigNumber(0);
                        if (val.greaterThan(0)) {
                            price = val2.div(val);
                        }

                        if (tradeType === 'Buy') {
                            orderSize = val;
                            if (oppositeAmount.greaterThan(chosenAmount)) {
                                val2 = utility.weiToEth(chosenAmount, dvsr2);
                                amount = chosenAmount.div((oppositeAmount.div(amount)));
                                val = utility.weiToEth(amount, dvsr);
                            }
                        } else {
                            orderSize = val;
                            if (amount.greaterThan(chosenAmount)) {
                                val = utility.weiToEth(chosenAmount, dvsr);
                                oppositeAmount = (chosenAmount.times(oppositeAmount)).div(amount);
                                val2 = utility.weiToEth(oppositeAmount, dvsr2);
                            }
                        }

                        var obj = {
                            'type': 'Taker ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
                            'token': token,
                            'amount': val,
                            'price': price,
                            'base': token2,
                            'baseAmount': val2,
                            'order size': orderSize,
                            'unlisted': unlisted,
                            'relayer': relayer,
                            'maker': maker,
                            'taker': taker,
                        };

                        return obj;
                    }
                }
            }
            //oasisdex offer
            else if (unpacked.name == 'offer') {
                //Function: offer(uint256 pay_amt, address pay_gem, uint256 buy_amt, address buy_gem, uint256 pos)
                var tradeType = 'Sell';
                var token = undefined;
                var token2 = undefined;
                let tokenGet = this.setToken(unpacked.params[1].value);
                let tokenGive = this.setToken(unpacked.params[3].value);

                var exchange = '';
                let addrName = this.addressName(tx.to);
                if (badFromTo && addrName.indexOf('0x') >= 0) {
                    addrName = this.addressName(tx.from);
                }
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (utility.isWrappedETH(tokenGet.addr) || (!utility.isWrappedETH(tokenGive.addr) && utility.isNonEthBase(tokenGive.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = tokenGive;
                    token2 = tokenGet;
                }
                else if (utility.isWrappedETH(tokenGive.addr) || (!utility.isWrappedETH(tokenGet.addr) && utility.isNonEthBase(tokenGet.addr))) // buy
                {
                    token = tokenGet;
                    token2 = tokenGive;
                }
                else {
                    console.log('unknown base token');
                    return undefined;
                }

                if (token && token2 && token.addr && token2.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
                        amount = new BigNumber(unpacked.params[0].value);
                        oppositeAmount = new BigNumber(unpacked.params[2].value);
                    } else {
                        oppositeAmount = new BigNumber(unpacked.params[0].value);
                        amount = new BigNumber(unpacked.params[2].value);
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(token2.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var orderSize = new BigNumber(0);
                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }



                    let makerAddr = tx.from.toLowerCase();

                    var obj = {
                        'type': tradeType + ' offer',
                        'exchange': exchange,
                        'note': utility.addressLink(makerAddr, true, true) + ' created a trade offer',
                        'token': token,
                        'amount': val,
                        'price': price,
                        'base': token2,
                        'baseAmount': val2,
                        'unlisted': unlisted,
                        'maker': makerAddr,
                    };
                    return obj;
                }
                //oasisdex buy
            } else if (unpacked.name == 'buy' && unpacked.params.length == 2) {

                var exchange = '';
                let addrName = this.addressName(tx.to);
                if (badFromTo && addrName.indexOf('0x') >= 0) {
                    addrName = this.addressName(tx.from);
                }
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                // Function: buy(uint256 id, uint256 amount)
                var obj = {
                    'type': 'Fill offer',
                    'exchange': exchange,
                    'orderID': new BigNumber(unpacked.params[0].value),
                    'note': ' Fill a trade order',
                };
                return obj;
            } else if (unpacked.name === 'quickConvert' || unpacked.name === 'quickConvertPrioritized' || (unpacked.name === 'convert' && unpacked.params.length == 4)) {
                //  function quickConvert(IERC20Token[] _path, uint256 _amount, uint256 _minReturn)
                // function quickConvertPrioritized(IERC20Token[] _path, uint256 _amount, uint256 _minReturn, uint256 _block, uint256 _nonce, uint8 _v, bytes32 _r, bytes32 _s)

                //convert(IERC20Token _fromToken, IERC20Token _toToken, uint256 _amount, uint256 _minReturn)

                if (unpacked.name === 'convert') {
                    let params2 = [];
                    params2[0] = { value: [unpacked.params[0].value, unpacked.params[1].value] };
                    params2[1] = { value: unpacked.params[2].value };
                    params2[2] = { value: unpacked.params[3].value };
                    unpacked.params = params2;
                }


                var tradeType = 'Sell';
                var token = undefined;
                var token2 = undefined;

                let tokenPath = unpacked.params[0].value;

                let tokenGive = this.setToken(tokenPath[tokenPath.length - 1]);
                let tokenGet = this.setToken(tokenPath[0]);

                var exchange = 'Bancor';

                if (utility.isWrappedETH(tokenGet.addr) || (!utility.isWrappedETH(tokenGive.addr) && utility.isNonEthBase(tokenGive.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = tokenGive;
                    token2 = tokenGet;
                }
                else if (utility.isWrappedETH(tokenGive.addr) || (!utility.isWrappedETH(tokenGet.addr) && utility.isNonEthBase(tokenGet.addr))) // buy
                {
                    tradeType = 'Sell';
                    token = tokenGet;
                    token2 = tokenGive;
                }
                else {
                    console.log('unknown base token');
                    return undefined;
                }

                if (token && token2 && token.addr && token2.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
                        amount = new BigNumber(unpacked.params[1].value);
                        oppositeAmount = new BigNumber(unpacked.params[2].value);
                    } else {
                        oppositeAmount = new BigNumber(unpacked.params[1].value);
                        amount = new BigNumber(unpacked.params[2].value);
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(token2.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var orderSize = new BigNumber(0);
                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }

                    // let makerAddr = tx.from.toLowerCase();

                    var obj = undefined;
                    if (tradeType === 'Sell') {
                        obj = {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': 'bancor token conversion',
                            'token': token,
                            'amount': val,
                            'minPrice': price,
                            'base': token2,
                            'estBaseAmount': val2,
                            'unlisted': unlisted,
                        };
                    } else {
                        obj = {
                            'type': tradeType + ' up to',
                            'exchange': exchange,
                            'note': 'bancor token conversion',
                            'token': token,
                            'estAmount': val,
                            'maxPrice': price,
                            'base': token2,
                            'baseAmount': val2,
                            'unlisted': unlisted,
                        };
                    }
                    return obj;
                }
            }
            //idex adminWithdraw(address token, uint256 amount, address user, uint256 nonce, uint8 v, bytes32 r, bytes32 s, uint256 feeWithdrawal)
            else if (unpacked.name === 'adminWithdraw') {
                var token = this.setToken(unpacked.params[0].value);
                if (token && token.addr) {
                    var unlisted = token.unlisted;
                    var amount = new BigNumber(unpacked.params[1].value);
                    var fee = new BigNumber(unpacked.params[7].value);

                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var val = utility.weiToEth(amount, dvsr);

                    var type = '';
                    var note = '';

                    const ether1 = new BigNumber(1000000000000000000);
                    var feeVal = utility.weiToEth((fee.times(amount)).div(ether1), dvsr);

                    if (token.addr !== this.config.ethAddr) {
                        type = 'Token Withdraw';
                        note = utility.addressLink(unpacked.params[2].value, true, true) + ' requested IDEX to withdraw tokens';
                    } else {
                        type = 'Withdraw';
                        note = utility.addressLink(unpacked.params[2].value, true, true) + ' requested IDEX to withdraw ETH';
                    }

                    var exchange = '';
                    let addrName = this.addressName(tx.to);
                    // etherscan token transfer log (to, from are bad)
                    if (badFromTo) {
                        addrName = this.addressName(tx.from);
                    }
                    if (addrName.indexOf('0x') === -1) {
                        exchange = addrName;
                    }

                    var obj = {
                        'type': type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': val,
                        'to': unpacked.params[2].value,
                        'unlisted': unlisted,
                        'fee': feeVal,
                        'feeToken': token,
                    };
                    return obj;
                }
            }
        } else {
            return undefined;
        }
        return undefined;
    } catch (error) {
        console.log('unpacked input parsing exception ' + error);
        return undefined;
    }
};

DeltaBalances.prototype.addressName = function (addr, showAddr) {
    var lcAddr = addr.toLowerCase();

    if (this.uniqueTokens[addr]) {
        return this.uniqueTokens[addr].name + " Contract " + (showAddr ? lcAddr : '');
    }
    else if (this.uniqueTokens[lcAddr]) {
        return this.uniqueTokens[lcAddr].name + " Contract " + (showAddr ? lcAddr : '');
    }
    else if (lcAddr === this.config.contractTokenStoreAddr) {
        return 'Token store ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr === this.config.contractIdexAddr) {
        return 'IDEX ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr === this.config.contractAirSwapAddr) {
        return 'AirSwap ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr === this.config.contractKyberAddr) {
        return 'Kyber ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr === this.config.kyberReserve) {
        return 'Kyber Reserve ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr === this.config.contract0xAddr) {
        return '0x Exchange ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr === this.config.contract0xProxy) {
        return '0x Proxy ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr === this.config.contractOasisDexAddr) {
        return 'OasisDex ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr === this.config.contractOasisDirectAddr) {
        return 'OasisDirect ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr === this.config.contractBancorQuickAddr || lcAddr === this.config.contractBancorQuick2Addr) {
        return 'BancorQuick ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr === this.config.contractEnclavesAddr || lcAddr === this.config.contractEnclaves2Addr) {
        return 'Enclaves ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr === this.config.contractDexyAddr || lcAddr === this.config.contractDexy2Addr) {
        return 'DEXY ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr == this.config.contractEthenAddr) {
        return 'ETHEN ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr == this.config.contractDecentrexAddr) {
        return 'Decentrex ' + (showAddr ? lcAddr : '');
    } else if (lcAddr == this.config.idexAdminAddr) {
        return 'IDEX admin ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr == this.config.ddexAdminAddr) {
        return 'DDEX admin ' + (showAddr ? lcAddr : '');
    }
    else if (lcAddr == this.config.paradexAdminAddr) {
        return 'Paradex admin ' + (showAddr ? lcAddr : '');
    }
    else if (this.config.contract0xRelayers[lcAddr]) {
        return this.config.contract0xRelayers[lcAddr] + ' fee addr';
    }
    else {
        for (var i = 0; i < this.config.contractEtherDeltaAddrs.length; i++) {
            if (lcAddr == this.config.contractEtherDeltaAddrs[i].addr) {
                var resp = 'EtherDelta ' + (showAddr ? lcAddr : '');
                if (i > 0)
                    resp = 'Outdated ' + resp;
                return resp;

            }
        }
    }
    // no known alias, return address
    return lcAddr;
};

DeltaBalances.prototype.isTokenAddress = function (addr) {
    var lcAddr = addr.toLowerCase();
    if (this.uniqueTokens[lcAddr] || this.uniqueTokens[addr]) {
        return true
    }
    return false;
};

DeltaBalances.prototype.isExchangeAddress = function (addr) {
    var lcAddr = addr.toLowerCase();

    if (lcAddr === this.config.contractEtherDeltaAddr
        || lcAddr === this.config.contractTokenStoreAddr
        || lcAddr === this.config.contractIdexAddr
        || lcAddr === this.config.contractDecentrexAddr
        || lcAddr === this.config.contract0xAddr
        || lcAddr === this.config.contract0xProxy
        || lcAddr === this.config.contractAirSwapAddr
        || lcAddr === this.config.contractKyberAddr
        || lcAddr === this.config.contractOasisDexAddr
        || lcAddr === this.config.contractEnclavesAddr
        //    || lcAddr === this.config.contractEnclaves2Addr
        //    || lcAddr === this.config.contractDexyAddr
        //    || lcAddr === this.config.contractDexy2Addr
        || lcAddr === this.config.contractEthenAddr
    ) {
        return true;
    } else {
        for (var i = 0; i < this.config.contractEtherDeltaAddrs.length; i++) {
            if (lcAddr == this.config.contractEtherDeltaAddrs[i].addr) {
                return true;
            }
        }
    }
    return false;
};

DeltaBalances.prototype.processUnpackedEvent = function (unpacked, myAddr) {
    try {
        if (unpacked && unpacked.events) {

            // etherdelta, decentrex, tokenstore, enclaves
            if (unpacked.name == 'Trade' && (unpacked.events.length == 6 || unpacked.events.length == 7) && unpacked.address !== this.config.contractEthenAddr) {
                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;
                var maker = unpacked.events[4].value.toLowerCase();
                var taker = unpacked.events[5].value.toLowerCase();

                var transType = '';

                if (taker === myAddr)
                    transType = 'Taker';
                else if (maker === myAddr)
                    transType = 'Maker';

                let tokenGet = this.setToken(unpacked.events[0].value);
                let tokenGive = this.setToken(unpacked.events[2].value);

                if (utility.isWrappedETH(tokenGet.addr) || (!utility.isWrappedETH(tokenGive.addr) && utility.isNonEthBase(tokenGive.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = tokenGive;
                    base = tokenGet;
                }
                else if (utility.isWrappedETH(tokenGive.addr) || (!utility.isWrappedETH(tokenGet.addr) && utility.isNonEthBase(tokenGet.addr))) // buy
                {
                    token = tokenGet;
                    base = tokenGive;
                }
                else {
                    return { 'error': 'unknown token in trade event' };
                    //  console.log('unknown base token');
                    // return undefined;
                }

                var exchange = '';
                let addrName = this.addressName(unpacked.address);

                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (token && base && token.addr && base.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    var buyUser = '';
                    var sellUser = '';
                    if (tradeType === 'Sell') {
                        amount = new BigNumber(unpacked.events[1].value);
                        oppositeAmount = new BigNumber(unpacked.events[3].value);
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        oppositeAmount = new BigNumber(unpacked.events[1].value);
                        amount = new BigNumber(unpacked.events[3].value);
                        sellUser = maker;
                        buyUser = taker;
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(base.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }

                    // history only??
                    if (buyUser === myAddr)
                        tradeType = "Buy";
                    else if (sellUser === myAddr)
                        tradeType = "Sell";


                    let takerFee = new BigNumber(0);
                    let makerFee = new BigNumber(0);
                    const ether1 = new BigNumber(1000000000000000000); // 1 ether in wei

                    if (exchange == 'EtherDelta ' || exchange == 'Decentrex ' || exchange == 'Token store ') {
                        takerFee = new BigNumber(3000000000000000); //0.3% fee in wei
                    } else if (exchange == 'Enclaves ') {
                        let exchangeNum = Number(unpacked.events[6].value);

                        //etherdelta proxy
                        if (exchangeNum == 1) {
                            takerFee = new BigNumber(3000000000000000); //0.3% fee in wei
                        } else if (exchangeNum == 0) {
                            //enclaves itself
                            takerFee = new BigNumber(2000000000000000); //0.2% fee in wei
                        }
                    }

                    let fee = new BigNumber(0);
                    let feeCurrency = '';
                    if (transType === 'Taker') {

                        if (tradeType === 'Sell') {
                            if (takerFee.greaterThan(0)) {
                                fee = utility.weiToEth((new BigNumber(amount).times(takerFee)).div(ether1), dvsr);
                            }
                            feeCurrency = token;
                        }
                        else if (tradeType === 'Buy') {
                            if (takerFee.greaterThan(0)) {
                                fee = utility.weiToEth((new BigNumber(oppositeAmount).times(takerFee)).div(ether1), dvsr2);
                            }
                            feeCurrency = base;
                        }
                    } else if (transType === 'Maker') {
                        if (tradeType === 'Sell') {
                            if (makerFee.greaterThan(0)) {
                                fee = utility.weiToEth((new BigNumber(amount).times(makerFee)).div(ether1), dvsr);
                            }
                            feeCurrency = token;
                        }
                        else if (tradeType === 'Buy') {
                            if (makerFee.greaterThan(0)) {
                                fee = utility.weiToEth((new BigNumber(oppositeAmount).times(makerFee)).div(ether1), dvsr2);
                            }
                            feeCurrency = base;
                        }
                    }

                    var obj = {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        // myAddr works in tx.js , history doesn't show note anyway
                        'note': utility.addressLink(myAddr, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
                        'token': token,
                        'amount': val,
                        'price': price,
                        'base': base,
                        'baseAmount': val2,
                        'unlisted': unlisted,
                        'buyer': buyUser,
                        'seller': sellUser,
                        'fee': fee,
                        'feeCurrency': feeCurrency,
                        'transType': transType,
                        'tradeType': tradeType,
                    };
                    return obj;
                }
            }
            //ethen.market
            else if (unpacked.name == 'Order' && unpacked.events.length == 8 && unpacked.address == this.config.contractEthenAddr && unpacked.combinedEvents) {
                var tradeType = 'Sell';
                var token = this.setToken(unpacked.combinedEvents[2].value);
                var base = this.setToken(this.config.ethAddr);
                var maker = unpacked.events[0].value.toLowerCase();
                var taker = unpacked.combinedEvents[0].value.toLowerCase();

                // TODO unknown tokens

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
                if (taker === myAddr)
                    transType = 'Taker';
                else if (maker === myAddr)
                    transType = 'Maker';


                var exchange = '';
                let addrName = this.addressName(unpacked.address);

                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }


                let amount = new BigNumber(unpacked.events[3].value);
                let price = new BigNumber(unpacked.events[2].value);

                var unlisted = token.unlisted;
                var dvsr = this.divisorFromDecimals(token.decimals)
                var dvsr2 = this.divisorFromDecimals(base.decimals)
                var val = utility.weiToEth(amount, dvsr);

                // price in 1e18
                price = utility.weiToEth(price, dvsr2);
                let dvsr3 = _delta.divisorFromDecimals(base.decimals - token.decimals)
                price = utility.weiToEth(price, dvsr3);

                val2 = val.times(price);

                // history only??
                if (buyUser === myAddr)
                    tradeType = "Buy";
                else if (sellUser === myAddr)
                    tradeType = "Sell";


                let takerFee = new BigNumber(1000000 * 2500);
                let makerFee = new BigNumber(0);
                const ether1 = new BigNumber(1000000000000000000); // 1 ether in wei


                let fee = new BigNumber(unpacked.events[7].value);
                let feeCurrency = base; //only ETH fees?

                if (transType === 'Taker') {
                    if (tradeType === 'Sell') {
                        fee = utility.weiToEth(fee, dvsr);
                    }
                    else if (tradeType === 'Buy') {
                        fee = utility.weiToEth(fee, dvsr2);
                    }
                } else if (transType === 'Maker') {
                    fee = new BigNumber(0);
                }

                var obj = {
                    'type': transType + ' ' + tradeType,
                    'exchange': exchange,
                    // myAddr works in tx.js , history doesn't show note anyway
                    'note': utility.addressLink(myAddr, true, true) + ' selected an order in the orderbook to trade.',
                    'token': token,
                    'amount': val,
                    'price': price,
                    'base': base,
                    'baseAmount': val2,
                    'unlisted': unlisted,
                    'buyer': buyUser,
                    'seller': sellUser,
                    'fee': fee,
                    'feeCurrency': feeCurrency,
                    'transType': transType,
                    'tradeType': tradeType,
                };
                return obj;
            }
            //0x error
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
                    var obj = {
                        'type': '0x Error',
                        'description': error,
                    };
                    return obj;
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
                    var obj = {
                        'type': 'AirSwap Error',
                        'description': error,
                    };
                    return obj;
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

                let makerAmount = new BigNumber(unpacked.events[1].value);
                let takerAmount = new BigNumber(unpacked.events[4].value);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = '';

                if (taker === myAddr)
                    transType = 'Taker';
                else if (maker === myAddr)
                    transType = 'Maker';


                if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }
                else {
                    return { 'error': 'unknown token in airswap event' };
                    //  console.log('unknown base token');
                    // return undefined;
                }

                var exchange = '';
                let addrName = this.addressName(unpacked.address);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (token && base && token.addr && base.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    var buyUser = '';
                    var sellUser = '';
                    if (tradeType === 'Sell') {
                        amount = takerAmount;
                        oppositeAmount = makerAmount;
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        oppositeAmount = takerAmount;
                        amount = makerAmount;
                        sellUser = maker;
                        buyUser = taker;
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(base.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }

                    if (unpacked.name === 'Filled') {
                        var obj = {
                            'type': transType + ' ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order.',
                            'token': token,
                            'amount': val,
                            'price': price,
                            'base': base,
                            'baseAmount': val2,
                            'unlisted': unlisted,
                            'buyer': buyUser,
                            'seller': sellUser,
                            'fee': new BigNumber(0),
                            'feeCurrency': undefined,
                            'transType': transType,
                            'tradeType': tradeType,
                        };
                        return obj;
                    } else {
                        var obj = {
                            'type': 'Cancel ' + tradeType,
                            'exchange': exchange,
                            'note': 'Cancelled an open order',
                            'token': token,
                            'amount': val,
                            'price': price,
                            'base': base,
                            'baseAmount': val2,
                            'unlisted': unlisted,
                        };
                        return obj;
                    }

                }
            }
            //kyber trade
            else if (unpacked.name === 'ExecuteTrade') {

                //  event ExecuteTrade(address indexed sender, ERC20 src, ERC20 dest, uint actualSrcAmount, uint actualDestAmount);

                let taker = unpacked.events[0].value.toLowerCase();
                let maker = '';
                let makerToken = this.setToken(unpacked.events[2].value);
                let takerToken = this.setToken(unpacked.events[1].value);

                let takerAmount = new BigNumber(unpacked.events[3].value);
                let makerAmount = new BigNumber(unpacked.events[4].value);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = '';

                if (taker === myAddr)
                    transType = 'Taker';
                else if (maker === myAddr)
                    transType = 'Maker';


                if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }
                else {
                    return { 'error': 'unknown token in kyber event' };
                    //  console.log('unknown base token');
                    // return undefined;
                }


                var exchange = '';
                let addrName = this.addressName(unpacked.address);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (token && base && token.addr && base.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    var buyUser = '';
                    var sellUser = '';
                    if (tradeType === 'Sell') {
                        amount = takerAmount;
                        oppositeAmount = makerAmount;
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        oppositeAmount = takerAmount;
                        amount = makerAmount;
                        sellUser = maker;
                        buyUser = taker;
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(base.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }


                    var obj = {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + 'performed a trade.',
                        'token': token,
                        'amount': val,
                        'price': price,
                        'base': base,
                        'baseAmount': val2,
                        'unlisted': unlisted,
                        'buyer': buyUser,
                        'seller': sellUser,
                        'fee': new BigNumber(0),
                        'feeCurrency': undefined,
                        'transType': transType,
                        'tradeType': tradeType,
                    };
                    return obj;
                }
            }
            // 0x trade output event
            else if (unpacked.name == "LogFill") {
                // LogFill (index_topic_1 address maker, address taker, index_topic_2 address feeRecipient, address makerToken, address takerToken, uint256 filledMakerTokenAmount, uint256 filledTakerTokenAmount, uint256 paidMakerFee, uint256 paidTakerFee, index_topic_3 bytes32 tokens, bytes32 orderHash)

                let maker = unpacked.events[0].value.toLowerCase();
                let taker = unpacked.events[1].value.toLowerCase();
                let makerToken = this.setToken(unpacked.events[3].value);
                let takerToken = this.setToken(unpacked.events[4].value);

                let makerAmount = new BigNumber(unpacked.events[5].value);
                let takerAmount = new BigNumber(unpacked.events[6].value);

                // fee is ZRX
                let feeCurrency = this.setToken('0xe41d2489571d322189246dafa5ebde1f4699f498');
                let feeDivisor = this.divisorFromDecimals(feeCurrency.decimals)
                let makerFee = utility.weiToEth(unpacked.events[7].value, feeDivisor);
                let takerFee = utility.weiToEth(unpacked.events[8].value, feeDivisor);

                let relayer = unpacked.events[2].value.toLowerCase();

                var exchange = utility.relayName(relayer);

                // 9 xor tokenpair
                // 10 orderhash

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = '';

                if (taker === myAddr)
                    transType = 'Taker';
                else if (maker === myAddr)
                    transType = 'Maker';


                if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }
                else {
                    return { 'error': 'unknown token in trade event' };
                    //  console.log('unknown base token');
                    // return undefined;
                }

                if (token && base && token.addr && base.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    var buyUser = '';
                    var sellUser = '';
                    if (tradeType === 'Sell') {
                        amount = takerAmount;
                        oppositeAmount = makerAmount;
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        oppositeAmount = takerAmount;
                        amount = makerAmount;
                        sellUser = maker;
                        buyUser = taker;
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(base.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }

                    let fee = new BigNumber(0);
                    if (transType === 'Taker') {
                        fee = takerFee;
                    } else if (transType === 'Maker') {
                        fee = makerFee;
                    }

                    var obj = {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        // myAddr works in tx.js , history doesn't show note anyway
                        'note': utility.addressLink(myAddr, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
                        'token': token,
                        'amount': val,
                        'price': price,
                        'base': base,
                        'baseAmount': val2,
                        'unlisted': unlisted,
                        'buyer': buyUser,
                        'seller': sellUser,
                        'fee': fee,
                        'feeCurrency': feeCurrency,
                        'transType': transType,
                        'tradeType': tradeType,
                        'relayer': relayer
                    };
                    return obj;
                }
            }
            //Bancor trade
            else if (unpacked.name == 'Conversion') {
                //2 variants
                //Conversion (index_topic_1 address _fromToken, index_topic_2 address _toToken, index_topic_3 address _trader, uint256 _amount, uint256 _return, uint256 _currentPriceN, uint256 _currentPriceD)
                //Conversion (index_topic_1 address _fromToken, index_topic_2 address _toToken, index_topic_3 address _trader, uint256 _amount, uint256 _return, int256 _conversionFee, uint256 _currentPriceN, uint256 _currentPriceD)



                //  let maker = unpacked.events[0].value.toLowerCase();
                let taker = unpacked.events[2].value.toLowerCase();
                let makerToken = this.setToken(unpacked.events[1].value);
                let takerToken = this.setToken(unpacked.events[0].value);

                let makerAmount = new BigNumber(unpacked.events[4].value);
                let takerAmount = new BigNumber(unpacked.events[3].value);


                var exchange = 'Bancor ';

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = 'Taker';

                if (makerToken.name === "???" && takerToken.name !== "???") {
                    makerToken.name = "??? RelayBNT";
                } else if (takerToken.name === "???" && makerToken.name !== "???") {
                    takerToken.name = "??? RelayBNT";
                }

                if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && makerToken.name === "BNT") || (smartRelays[takerToken.addr] || takerToken.name === "??? RelayBNT")) { // get eth  -> sell
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                } else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && takerToken.name === "BNT") || (smartRelays[makerToken.addr] || makerToken.name === "??? RelayBNT")) { // buy
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                } else {
                    return { 'error': 'unknown token in trade event' };
                    //  console.log('unknown base token');
                    // return undefined;
                }

                if (token && base && token.addr && base.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    var buyUser = '';
                    var sellUser = '';
                    if (tradeType === 'Sell') {
                        amount = takerAmount;
                        oppositeAmount = makerAmount;
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        oppositeAmount = takerAmount;
                        amount = makerAmount;
                        sellUser = maker;
                        buyUser = taker;
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(base.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }

                    let fee = new BigNumber(0);
                    let feeCurrency = '';

                    //variant that includes fee
                    if (unpacked.events.length == 8) {
                        feeCurrency = makerToken;
                        let rawFee = new BigNumber(unpacked.events[5].value);
                        if (token == makerToken) {
                            fee = utility.weiToEth(rawFee, dvsr);
                        } else {
                            fee = utility.weiToEth(rawFee, dvsr2);
                        }
                    }

                    var obj = {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        // myAddr works in tx.js , history doesn't show note anyway
                        'note': utility.addressLink(myAddr, true, true) + ' made a Bancor conversion.',
                        'token': token,
                        'amount': val,
                        'price': price,
                        'base': base,
                        'baseAmount': val2,
                        'unlisted': unlisted,
                        'buyer': buyUser,
                        'seller': sellUser,
                        'fee': fee,
                        'feeCurrency': feeCurrency,
                        'transType': transType,
                        'tradeType': tradeType,
                    };
                    return obj;
                }
            }
            //etherdelta/decentrex, idex, enclaves 
            else if (unpacked.events.length >= 4 && (unpacked.name == 'Deposit' || unpacked.name == 'Withdraw')) {

                var type = unpacked.name;
                var token = this.setToken(unpacked.events[0].value);
                var user = unpacked.events[1].value;
                var rawAmount = unpacked.events[2].value;
                var rawBalance = unpacked.events[3].value;
                var exchange = '';
                let addrName = this.addressName(unpacked.address);

                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (token && token.addr) {
                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var val = utility.weiToEth(rawAmount, dvsr);
                    var balance = utility.weiToEth(rawBalance, dvsr);
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
                    var obj = {
                        'type': type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': val,
                        'balance': balance,
                        'unlisted': unlisted,
                    };
                    return obj;
                }
            }
            // ethen.market
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

                var exchange = '';
                let addrName = this.addressName(unpacked.address);

                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (token && token.addr) {
                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var val = utility.weiToEth(rawAmount, dvsr);
                    var balance = utility.weiToEth(rawBalance, dvsr);
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
                    var obj = {
                        'type': type,
                        'exchange': exchange,
                        'note': note,
                        'token': token,
                        'amount': val,
                        'balance': balance,
                        'unlisted': unlisted,
                    };
                    return obj;
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
                var rawAmount = new BigNumber(0);
                if (unpacked.events.length == 2) {
                    user = unpacked.events[0].value;
                    rawAmount = new BigNumber(unpacked.events[1].value);
                } else {
                    rawAmount = new BigNumber(unpacked.events[0].value);
                }

                if (token && token.addr) {
                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var val = utility.weiToEth(rawAmount, dvsr);
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

                    var obj = {
                        'type': type,
                        'note': note,
                        'token In': fromToken,
                        'token Out': toToken,
                        'amount': val,
                        'unlisted': unlisted,
                        'wallet': user
                    };

                    return obj;
                }
            }
            // etherdelta, decentrex, kyber, enclaves   cancel
            else if (unpacked.name == 'Cancel') {
                var cancelType = 'sell';
                var token = undefined;
                var token2 = undefined;


                let tokenGet = this.setToken(unpacked.events[0].value);
                let tokenGive = this.setToken(unpacked.events[2].value);

                if (utility.isWrappedETH(tokenGet.addr) || (!utility.isWrappedETH(tokenGive.addr) && utility.isNonEthBase(tokenGive.addr))) // get eth  -> sell
                {
                    cancelType = 'buy';
                    token = tokenGive;
                    token2 = tokenGet;
                }
                else if (utility.isWrappedETH(tokenGive.addr) || (!utility.isWrappedETH(tokenGet.addr) && utility.isNonEthBase(tokenGet.addr))) // buy
                {
                    token = tokenGet;
                    token2 = tokenGive;
                }
                else {
                    return { error: 'unknown base token' };
                }

                var exchange = '';
                let addrName = this.addressName(unpacked.address);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (token && token2 && token.addr && token2.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    if (cancelType === 'sell') {
                        amount = new BigNumber(unpacked.events[1].value);
                        oppositeAmount = new BigNumber(unpacked.events[3].value);
                    } else {
                        oppositeAmount = new BigNumber(unpacked.events[1].value);
                        amount = new BigNumber(unpacked.events[3].value);
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(token2.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }
                    var obj = {
                        'type': 'Cancel ' + cancelType,
                        'exchange': exchange,
                        'note': 'Cancelled an open order',
                        'token': token,
                        'amount': val,
                        'price': price,
                        'base': token2,
                        'baseAmount': val2,
                        'unlisted': unlisted,
                    };
                    return obj;
                }

            } else if (unpacked.name == 'LogCancel') {
                let maker = unpacked.events[0].value.toLowerCase();
                let relayer = unpacked.events[1].value.toLowerCase();
                let makerToken = this.setToken(unpacked.events[2].value);
                let takerToken = this.setToken(unpacked.events[3].value);

                let makerAmount = new BigNumber(unpacked.events[4].value);
                let takerAmount = new BigNumber(unpacked.events[5].value);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var exchange = '';
                exchange = utility.relayName(relayer);

                if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }
                else {
                    return { 'error': 'unknown token in trade event' };
                    //  console.log('unknown base token');
                    // return undefined;
                }

                if (token && base && token.addr && base.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
                        amount = takerAmount;
                        oppositeAmount = makerAmount;

                    } else {
                        oppositeAmount = takerAmount;
                        amount = makerAmount;
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(base.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }


                    var obj = {
                        'type': 'Cancel' + ' ' + tradeType,
                        'exchange': exchange,
                        // myAddr works in tx.js , history doesn't show note anyway
                        'note': utility.addressLink(maker, true, true) + 'Cancelled an open order in the orderbook.',
                        'token': token,
                        'amount': val,
                        'price': price,
                        'base': base,
                        'baseAmount': val2,
                        'unlisted': unlisted,
                        'relayer': relayer
                    };
                    return obj;
                }
            }
            else if (unpacked.name == 'LogKill' || unpacked.name == 'LogMake') {
                //	LogKill (index_topic_1 bytes32 id, index_topic_2 bytes32 pair, index_topic_3 address maker, address pay_gem, address buy_gem, uint128 pay_amt, uint128 buy_amt, uint64 timestamp)
                // 	LogMake (index_topic_1 bytes32 id, index_topic_2 bytes32 pair, index_topic_3 address maker, address pay_gem, address buy_gem, uint128 pay_amt, uint128 buy_amt, uint64 timestamp)
                let maker = unpacked.events[2].value.toLowerCase();

                let makerToken = this.setToken(unpacked.events[4].value);
                let takerToken = this.setToken(unpacked.events[3].value);

                let makerAmount = new BigNumber(unpacked.events[6].value);
                let takerAmount = new BigNumber(unpacked.events[5].value);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var exchange = '';
                exchange = this.addressName(unpacked.address);

                if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }
                else {
                    return { 'error': 'unknown token in trade event' };
                    //  console.log('unknown base token');
                    // return undefined;
                }

                if (token && base && token.addr && base.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
                        amount = takerAmount;
                        oppositeAmount = makerAmount;

                    } else {
                        oppositeAmount = takerAmount;
                        amount = makerAmount;
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(base.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }

                    var obj = undefined;

                    if (unpacked.name == 'LogKill') {
                        obj = {
                            'type': 'Cancel' + ' ' + tradeType,
                            'exchange': exchange,
                            'note': utility.addressLink(maker, true, true) + 'Cancelled an open order in the orderbook.',
                            'token': token,
                            'amount': val,
                            'price': price,
                            'base': base,
                            'baseAmount': val2,
                            'unlisted': unlisted,
                        };
                    } else { //logMake
                        obj = {
                            'type': tradeType + ' offer',
                            'exchange': exchange,
                            'note': utility.addressLink(maker, true, true) + 'Placed an order in the orderbook.',
                            'token': token,
                            'amount': val,
                            'price': price,
                            'base': base,
                            'baseAmount': val2,
                            'unlisted': unlisted,
                        };
                    }
                    return obj;
                }
            }
            else if (unpacked.name == 'LogTake') {
                // LogTake (bytes32 id, index_topic_1 bytes32 pair, index_topic_2 address maker, address pay_gem, address buy_gem, index_topic_3 address taker, uint128 take_amt, uint128 give_amt, uint64 timestamp)
                let maker = unpacked.events[2].value.toLowerCase();

                let makerToken = this.setToken(unpacked.events[3].value);
                let takerToken = this.setToken(unpacked.events[4].value);

                let taker = unpacked.events[5].value.toLowerCase();
                let makerAmount = new BigNumber(unpacked.events[6].value);
                let takerAmount = new BigNumber(unpacked.events[7].value);

                let feeCurrency = '';
                let fee = new BigNumber(0);

                var exchange = '';
                exchange = this.addressName(unpacked.address);
                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = '';

                if (taker === myAddr)
                    transType = 'Taker';
                else if (maker === myAddr)
                    transType = 'Maker';


                if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                {
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                }
                else {
                    return { 'error': 'unknown token in trade event' };
                    //  console.log('unknown base token');
                    // return undefined;
                }

                if (token && base && token.addr && base.addr) {
                    var amount = new BigNumber(0);
                    var oppositeAmount = new BigNumber(0);
                    var buyUser = '';
                    var sellUser = '';
                    if (tradeType === 'Sell') {
                        amount = takerAmount;
                        oppositeAmount = makerAmount;
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        oppositeAmount = takerAmount;
                        amount = makerAmount;
                        sellUser = maker;
                        buyUser = taker;
                    }

                    var unlisted = token.unlisted;
                    var dvsr = this.divisorFromDecimals(token.decimals)
                    var dvsr2 = this.divisorFromDecimals(base.decimals)
                    var val = utility.weiToEth(amount, dvsr);
                    var val2 = utility.weiToEth(oppositeAmount, dvsr2);

                    var price = new BigNumber(0);
                    if (val.greaterThan(0)) {
                        price = val2.div(val);
                    }

                    var obj = {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        'note': utility.addressLink(taker, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
                        'token': token,
                        'amount': val,
                        'price': price,
                        'base': base,
                        'baseAmount': val2,
                        'unlisted': unlisted,
                        'buyer': buyUser,
                        'seller': sellUser,
                        'fee': fee,
                        'feeCurrency': feeCurrency,
                        'transType': transType,
                        'tradeType': tradeType,
                    };
                    return obj;
                }
            }
            else if (unpacked.name == 'Transfer') {

                var from = unpacked.events[0].value.toLowerCase();
                var to = unpacked.events[1].value.toLowerCase();
                var rawAmount = unpacked.events[2].value;
                var token = this.setToken(unpacked.address);

                var dvsr = this.divisorFromDecimals(token.decimals)
                var val = utility.weiToEth(rawAmount, dvsr);
                var unlisted = token.unlisted;

                var note = 'Transferred ' + val.toString() + ' ' + token.name;

                var obj = {
                    'type': 'Transfer',
                    'note': note,
                    'token': token,
                    'amount': val,
                    'from': from,
                    'to': to,
                    'unlisted': unlisted,
                };
                return obj;
            }
            else if (unpacked.name == 'Approval') {
                var sender = unpacked.events[0].value.toLowerCase();
                var to = unpacked.events[1].value.toLowerCase();
                var rawAmount = unpacked.events[2].value;
                var token = this.setToken(unpacked.address);

                var dvsr = this.divisorFromDecimals(token.decimals)
                var val = utility.weiToEth(rawAmount, dvsr);
                var unlisted = token.unlisted;

                var exchange = 'unknown ';
                let addrName = this.addressName(to);
                if (addrName !== to) {
                    exchange = addrName;
                } else {
                    // bancor quick convert, sending out approves?
                    addrName = this.addressName(sender);
                    if (addrName !== sender) {
                        exchange = addrName;
                    }
                }

                var obj = {
                    'type': 'Approve',
                    'exchange': exchange,
                    'note': 'Now allows tokens to be transferred by ' + exchange,
                    'token': token,
                    'amount': val,
                    'from': sender,
                    'to': to,
                    'unlisted': unlisted,
                };
                return obj;
            }
            // Order ?
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

        let contents = 'PlaceHolder';
        try {
            if (token && token.addr) {
                if (!utility.isWrappedETH(token.addr)) {
                    if (!this.uniqueTokens[token.addr]) {
                        contents = "Token unknown to DeltaBalances <br> Contract: " + utility.addressLink(token.addr, true, true);
                    } else {
                        contents = 'Contract: ' + utility.addressLink(token.addr, true, true) + '<br> Decimals: ' + token.decimals;
                    }
                    if (token.locked) {
                        contents += '<br> <i class="text-red fa fa-lock" aria-hidden="true"></i> Token Locked or Paused.';
                    }
                    contents += '<br> Trade on: <ul style="list-style-type: none;"><li>'
                        + utility.binanceURL(token, true)
                        + '</li><li>' + utility.etherDeltaURL(token, true)
                        + '</li><li>' + utility.forkDeltaURL(token, true)
                        + '</li><li>' + utility.tokenStoreURL(token, true)
                        + '</li><li>' + utility.idexURL(token, true)
                        + '</li><li>' + utility.ddexURL(token, true)
                        + '</li></ul>';


                } else if (token.addr == this.config.ethAddr) {
                    contents = "Ether (not a token)<br> Decimals: 18";
                } else {
                    contents = 'Contract: ' + utility.addressLink(token.addr, true, true) + '<br> Decimals: ' + token.decimals + "<br>Wrapped Ether";
                }
            }
        } catch (e) {
            console.log('error making popover ' + e);
        }

        let name = token.name;
        if (token.locked) {
            name += ' <i class="fa fa-lock" aria-hidden="true"></i>';
        }
        let popover = '<a tabindex="0" class="label ' + labelClass + '" role="button" data-html="true" data-toggle="popover" data-placement="auto right"  title="' + title + '" data-container="body" data-content=\'' + contents + '\'>' + name + '</a>';

        return popover;
    } else {
        console.log('undefined token in popover');
        return "";
    }

};

const deltaBalances = new DeltaBalances();
module.exports = { DeltaBalances: deltaBalances, utility };
