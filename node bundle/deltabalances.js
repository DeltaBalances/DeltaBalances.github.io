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


DeltaBalances.prototype.divisorFromDecimals = function (decimals) {
    var result = 1000000000000000000;
    if (decimals !== undefined) {
        result = Math.pow(10, decimals);
    }
    return new BigNumber(result);
}

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


DeltaBalances.prototype.initContracts = function initContracts(callback) {
    let _delta = this;
    /*
    this.web3.version.getNetwork((error, version) => {
        if (!error && version && Number(version) !== 1) {
            _delta.dialogError('You are connected to the Ethereum testnet. Please connect to the Ethereum mainnet.');
        }
    }); */

    this.config = config;

    // load contract
    utility.loadContract(
        _delta.web3,
        _delta.config.ABIs.DeltaBalances,
        _delta.config.DeltaBalanceAddr,
        (err, contractDeltaBalance) => {
            _delta.contractDeltaBalance = contractDeltaBalance;
            callback();
        }
    );
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

    let _delta = this;
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
            if (x.blocked) {
                token.blocked = x.blocked;
            }
            if (x.killed) {
                token.killed = true;
            }
            if (x.spam) {
                token.spam = true;
            }
            if (x.blockIDEX) {
                token.blockIDEX = true;
            }

            for (let i = 0; i < _delta.config.listedExchanges.length; i++) {
                let exchange = _delta.config.listedExchanges[i];
                if (x.blockIDEX && exchange == 'IDEX') {
                    continue;
                } else if (x[exchange]) {
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

            if (this.uniqueTokens[token.addr] && this.uniqueTokens[token.addr].blockIDEX) {
                continue;
            } else {
                if (!token.blockIDEX) {
                    token.IDEX = token.name;
                    token.unlisted = false;
                }
                if (this.uniqueTokens[token.addr]) {
                    if (!token.blockIDEX) {
                        this.uniqueTokens[token.addr].IDEX = token.name;
                        this.uniqueTokens[token.addr].unlisted = false;
                    }
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
        console.log('failed to parse IDEX token list');
    }

    try {
        //radar listed tokens
        let radarTokens = [];
        if (radarConfig && radarConfig.length > 0) {
            radarTokens = radarConfig;
        }
        for (var i = 0; i < radarTokens.length; i++) {
            var tok = radarTokens[i];
            if (tok) {
                let token = {};
                token.addr = tok.address.toLowerCase();
                token.name = utility.escapeHtml(tok.symbol); // escape nasty stuff in token symbol/name
                token.decimals = Number(tok.decimals);
                token.unlisted = false;
                token.Radar = token.name.toUpperCase();
                if (this.uniqueTokens[token.addr]) {
                    this.uniqueTokens[token.addr].Radar = token.Radar;
                    this.uniqueTokens[token.addr].unlisted = false;
                }
                else {
                    this.uniqueTokens[token.addr] = token;
                }
            }
        }
    } catch (e) {
        console.log('failed to parse Radar token list');
    }

    try {
        //kyber listed tokens
        let kyberTokens = [];
        if (kyberConfig && kyberConfig.length > 0) {
            kyberTokens = kyberConfig;
        }
        for (var i = 0; i < kyberTokens.length; i++) {
            var tok = kyberTokens[i];
            if (tok) {
                let token = {};
                token.addr = tok.address.toLowerCase();
                token.name = utility.escapeHtml(tok.symbol); // escape nasty stuff in token symbol/name
                token.decimals = Number(tok.decimals);
                token.unlisted = false;
                token.Kyber = token.name.toUpperCase();
                if (this.uniqueTokens[token.addr]) {
                    this.uniqueTokens[token.addr].Kyber = token.Kyber;
                    this.uniqueTokens[token.addr].unlisted = false;
                }
                else {
                    this.uniqueTokens[token.addr] = token;
                }
            }
        }
    } catch (e) {
        console.log('failed to parse Kyber token list');
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
    this.config.customTokens = Object.values(_delta.uniqueTokens).filter((x) => { return !tokenBlacklist[x.addr] && (!x.unlisted || !x.blocked) && !x.killed; });
    let listedTokens = Object.values(_delta.uniqueTokens).filter((x) => { return (!x.unlisted && !x.killed && !tokenBlacklist[x.addr] && x.addr !== ethAddr); });
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
        var txFrom = tx.from.toLowerCase();
        var txTo = tx.to.toLowerCase();

        if (unpacked && unpacked.name) {
            // erc20 token transfer
            if (unpacked.name === 'transfer') {
                var to = unpacked.params[0].value.toLowerCase();
                var rawAmount = unpacked.params[1].value;
                var amount = new BigNumber(0);
                var token = badFromTo ? this.setToken(tx.contractAddress) : this.setToken(tx.to);

                if (token && token.addr) {
                    amount = utility.weiToToken(rawAmount, token);
                }

                return {
                    'type': 'Transfer',
                    'note': 'Give the token contract the order to transfer your tokens',
                    'token': token,
                    'amount': amount,
                    'from': txFrom,
                    'to': to,
                    'unlisted': token.unlisted,
                };
            }
            // erc20 token approve
            else if (!badFromTo && unpacked.name === 'approve') {
                var sender = unpacked.params[0].value;
                var rawAmount = unpacked.params[1].value;
                var amount = new BigNumber(0);
                var token = this.setToken(tx.to);

                if (token && token.addr) {
                    amount = utility.weiToToken(rawAmount, token);
                }

                var exchange = 'unknown ';
                let addrName = this.addressName(sender);
                if (addrName !== sender.toLowerCase()) {
                    exchange = addrName;
                }

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
            // exchange deposit/withdraw and 0x WETH (un)wrapping
            else if (unpacked.name === 'deposit' || (unpacked.name === 'withdraw' && unpacked.address !== this.config.exchangeContracts.Idex.addr)
                || unpacked.name === 'withdrawEther' || unpacked.name === 'depositEther') {
                var type = '';
                var note = '';
                var rawVal = new BigNumber(0);
                var token = this.setToken(this.config.ethAddr);
                var base = undefined;
                var exchange = '';

                if (unpacked.name === 'deposit' || unpacked.name === 'depositEther') {
                    rawVal = new BigNumber(tx.value);
                    if (!utility.isWrappedETH(tx.to) && !badFromTo) {
                        type = 'Deposit';
                        let addrName = this.addressName(txTo);
                        if (addrName.indexOf('0x') === -1) {
                            exchange = addrName;
                            note = 'Deposit ETH into the ' + exchange;
                        } else {
                            note = 'Deposit ETH into the exchange contract';
                        }
                    } else {
                        type = 'Wrap ETH';
                        note = 'Wrap ETH to WETH';
                        token = this.setToken(this.config.ethAddr);
                        base = badFromTo ? this.setToken(tx.contractAddress) : this.setToken(tx.to);
                    }
                } else {
                    rawVal = unpacked.params[0].value;
                    if (!utility.isWrappedETH(tx.to) && !badFromTo) {
                        type = 'Withdraw';

                        let addrName = this.addressName(txTo);
                        if (addrName.indexOf('0x') === -1) {
                            exchange = addrName;
                            note = 'Request the ' + exchange + ' to withdraw ETH';
                        } else {
                            note = 'Request the exchange contract to withdraw ETH';
                        }
                    } else {
                        type = 'Unwrap ETH';
                        note = 'Unwrap WETH to ETH';
                        token = badFromTo ? this.setToken(tx.contractAddress) : this.setToken(tx.to);
                        base = this.setToken(this.config.ethAddr);
                    }
                }

                var amount = utility.weiToEth(rawVal);

                if (type.indexOf('rap') === -1) {
                    return {
                        'type': type,
                        'exchange': exchange,
                        'token': token,
                        'note': note,
                        'amount': amount,
                    };
                } else {
                    return {
                        'type': type,
                        'token In': token,
                        'token Out': base,
                        'note': note,
                        'amount': amount,
                    };
                }
            }
            // exhcnage erc20 deposit / withdraw
            else if (unpacked.name === 'depositToken' || unpacked.name === 'withdrawToken' || /* enclaves */ unpacked.name === 'withdrawBoth' || unpacked.name === 'depositBoth'
                || (unpacked.name === 'withdraw' && unpacked.address === this.config.exchangeContracts.Idex.addr)
            ) {
                var token = this.setToken(unpacked.params[0].value);
                if (token && token.addr) {
                    var amount = utility.weiToToken(unpacked.params[1].value, token);
                    var type = '';
                    var note = '';
                    var exchange = '';

                    let addrName = this.addressName(txTo);
                    if (badFromTo && unpacked.name === 'withdrawToken') {
                        addrName = this.addressName(txFrom);
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
                        'amount': amount,
                        'unlisted': token.unlisted,
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
                var base = undefined;

                let tokenGet = this.setToken(unpacked.params[0].value);
                let tokenGive = this.setToken(unpacked.params[2].value);

                var exchange = '';
                let addrName = this.addressName(txTo);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (utility.isWrappedETH(tokenGet.addr) || (!utility.isWrappedETH(tokenGive.addr) && utility.isNonEthBase(tokenGive.addr))) // get eth  -> sell
                {
                    cancelType = 'buy';
                    token = tokenGive;
                    base = tokenGet;
                }
                else if (utility.isWrappedETH(tokenGive.addr) || (!utility.isWrappedETH(tokenGet.addr) && utility.isNonEthBase(tokenGet.addr))) // buy
                {
                    token = tokenGet;
                    base = tokenGive;
                }
                else {
                    console.log('unknown base token');
                    return undefined;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
                    if (cancelType === 'sell') {
                        rawAmount = new BigNumber(unpacked.params[1].value);
                        rawBaseAmount = new BigNumber(unpacked.params[3].value);
                    } else {
                        rawBaseAmount = new BigNumber(unpacked.params[1].value);
                        rawAmount = new BigNumber(unpacked.params[3].value);
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var price = new BigNumber(0);
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
                    let taker = txFrom;
                    let makerToken = _delta.setToken(orderAddresses[2]);
                    let takerToken = _delta.setToken(orderAddresses[3]);

                    let makerAmount = new BigNumber(orderValues[0]);
                    let takerAmount = new BigNumber(orderValues[1]);

                    // fee is ZRX
                    let feeCurrency = _delta.setToken('0xe41d2489571d322189246dafa5ebde1f4699f498');
                    let makerFee = utility.weiToToken(orderValues[2], feeCurrency);
                    let takerFee = utility.weiToToken(orderValues[3], feeCurrency);
                    let relayer = orderAddresses[4].toLowerCase();

                    exchange = utility.relayName(relayer);
                    // orderValues[4] is expiry

                    var tradeType = 'Sell';
                    var token = undefined;
                    var base = undefined;

                    var nonETH = false;

                    if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                    {
                        tradeType = 'Buy';
                        token = makerToken;
                        base = takerToken;
                    }
                    else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                    {
                        token = takerToken;
                        base = makerToken;
                    }
                    else {
                        console.log('unknown base token');
                        return undefined;
                    }

                    if (token && base && token.addr && base.addr) {
                        var rawAmount = new BigNumber(0);
                        var rawBaseAmount = new BigNumber(0);
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

                        var orderSize = new BigNumber(0);
                        var price = new BigNumber(0);
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
                let addrName = this.addressName(txTo);
                if (badFromTo) {
                    addrName = this.config.exchangeContracts.AirSwap.name;
                }
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }


                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var nonETH = false;

                if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                {
                    token = takerToken;
                    base = makerToken;
                }
                else {
                    console.log('unknown base token');
                    return undefined;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;
                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = new BigNumber(0);
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

                var exchange = '';
                let addrName = this.addressName(txTo);
                if (badFromTo && addrName.indexOf('0x') >= 0) {
                    addrName = this.addressName(txFrom);
                }
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                return {
                    'type': 'Cancel offer',
                    'exchange': exchange,
                    'orderID': new BigNumber(unpacked.params[0].value),
                    'note': 'Cancel an open order',
                };
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
                var base = undefined;
                let tokenGet = this.setToken(unpacked.params[0].value);
                let tokenGive = this.setToken(unpacked.params[2].value);

                var exchange = '';
                let addrName = this.addressName(txTo);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

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
                    console.log('unknown base token');
                    return undefined;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
                    var chosenAmount = new BigNumber(unpacked.params[10].value);
                    if (tradeType === 'Sell') {
                        rawAmount = new BigNumber(unpacked.params[1].value);
                        rawBaseAmount = new BigNumber(unpacked.params[3].value);
                    } else {
                        rawBaseAmount = new BigNumber(unpacked.params[1].value);
                        rawAmount = new BigNumber(unpacked.params[3].value);
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var orderSize = new BigNumber(0);
                    var price = new BigNumber(0);
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

                    let takerAddr = idex ? unpacked.params[11].value : txFrom;
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
                }
            }
            // exchange trade with args in arrays (ethen.market)
            else if (!badFromTo && unpacked.name === 'trade' && unpacked.params.length == 3) {

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

                function unpackOrderInput(isBuy, rawAmount, price, inputToken, maker) {
                    var tradeType = 'Sell';
                    if (isBuy) {
                        tradeType = 'Buy';
                    }
                    var token = _delta.setToken(inputToken);
                    var base = _delta.setToken(_delta.config.ethAddr);

                    var exchange = '';
                    let addrName = _delta.addressName(txTo);
                    if (addrName.indexOf('0x') === -1) {
                        exchange = addrName;
                    }

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
                let taker = txFrom;
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
                var base = undefined;

                var nonETH = false;

                var exchange = '';
                let addrName = this.addressName(txTo);

                if (badFromTo && addrName === txTo) {
                    addrName = this.addressName(txFrom);
                }
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                }
                else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                {
                    token = takerToken;
                    base = makerToken;
                }
                else {
                    console.log('unknown base token');
                    return undefined;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
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

                        let one = new BigNumber(1000000000000000000);
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
                    let base = undefined;
                    if (objs[0].type.indexOf('Sell') !== -1) {
                        tok = this.setToken(orderAddresses3[0][3]);
                        tok2 = this.setToken(orderAddresses3[0][2]);
                        takeAmount = utility.weiToToken(takeAmount, tok);
                        isAmount = true;
                    } else {
                        tok = this.setToken(orderAddresses3[0][2]);
                        tok2 = this.setToken(orderAddresses3[0][3]);
                        takeAmount = utility.weiToToken(takeAmount, tok2);
                        isAmount = false;
                    }



                    let relayer3 = orderAddresses3[0][4].toLowerCase();
                    exchange = utility.relayName(relayer3);
                    let taker3 = badFromTo ? '' : txFrom;

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
                    let taker = badFromTo ? '' : txFrom;//if tx has contractAddress field, is etherscan token transfer event, from/to incorrect for trade tx
                    let makerToken = _delta.setToken(orderAddresses[2]);
                    let takerToken = _delta.setToken(orderAddresses[3]);

                    let makerAmount = new BigNumber(orderValues[0]);
                    let takerAmount = new BigNumber(orderValues[1]);

                    // fee is ZRX
                    let feeCurrency = _delta.setToken('0xe41d2489571d322189246dafa5ebde1f4699f498');
                    let makerFee = utility.weiToToken(orderValues[2], feeCurrency);
                    let takerFee = utility.weiToToken(orderValues[3], feeCurrency);
                    let relayer = orderAddresses[4].toLowerCase();

                    exchange = utility.relayName(relayer);
                    // orderValues[4] is expiry

                    var tradeType = 'Sell';
                    var token = undefined;
                    var base = undefined;

                    if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && utility.isNonEthBase(makerToken.addr))) // get eth  -> sell
                    {
                        tradeType = 'Buy';
                        token = makerToken;
                        base = takerToken;
                    }
                    else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && utility.isNonEthBase(takerToken.addr))) // buy
                    {
                        token = takerToken;
                        base = makerToken;
                    }
                    else {
                        console.log('unknown base token');
                        return undefined;
                    }


                    if (token && base && token.addr && base.addr) {
                        var rawAmount = new BigNumber(0);
                        var rawBaseAmount = new BigNumber(0);
                        var chosenAmount = fillTakerTokenAmount;
                        if (tradeType === 'Sell') {
                            rawAmount = takerAmount;
                            rawBaseAmount = makerAmount;
                        } else {
                            rawBaseAmount = takerAmount;
                            rawAmount = makerAmount;
                        }

                        var amount = utility.weiToToken(rawAmount, token);
                        var baseAmount = utility.weiToToken(rawBaseAmount, base);

                        var orderSize = new BigNumber(0);
                        var price = new BigNumber(0);
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
            //oasisdex offer
            else if (unpacked.name == 'offer') {
                //Function: offer(uint256 pay_amt, address pay_gem, uint256 buy_amt, address buy_gem, uint256 pos)
                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;
                let tokenGet = this.setToken(unpacked.params[1].value);
                let tokenGive = this.setToken(unpacked.params[3].value);

                var exchange = '';
                let addrName = this.addressName(txTo);
                if (badFromTo && addrName.indexOf('0x') >= 0) {
                    addrName = this.addressName(txFrom);
                }
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

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
                    console.log('unknown base token');
                    return undefined;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = new BigNumber(unpacked.params[0].value);
                        rawBaseAmount = new BigNumber(unpacked.params[2].value);
                    } else {
                        rawBaseAmount = new BigNumber(unpacked.params[0].value);
                        rawAmount = new BigNumber(unpacked.params[2].value);
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var orderSize = new BigNumber(0);
                    var price = new BigNumber(0);
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
                //oasisdex buy
            } else if (unpacked.name == 'buy' && unpacked.params.length == 2) {

                var exchange = '';
                let addrName = this.addressName(txTo);
                if (badFromTo && addrName.indexOf('0x') >= 0) {
                    addrName = this.addressName(txFrom);
                }
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                // Function: buy(uint256 id, uint256 amount)
                return {
                    'type': 'Fill offer',
                    'exchange': exchange,
                    'orderID': new BigNumber(unpacked.params[0].value),
                    'note': ' Fill a trade order',
                };
            }
            //Bancor token conversions 
            else if (unpacked.name === 'quickConvert' || unpacked.name === 'quickConvertPrioritized' || (unpacked.name === 'convert' && unpacked.params.length == 4)
                || unpacked.name == 'convertFor' || unpacked.name == 'convertForPrioritized2' || unpacked.name == 'convertForPrioritized2'
                || unpacked.name == 'claimAndConvert' || unpacked.name == 'claimAndConvertFor'
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

                    function convertForPrioritized(
                        IERC20Token[] _path,
                        uint256 _amount,
                        uint256 _minReturn,
                        address _for,
                        uint256 _block,
                        uint256 _nonce,
                        uint8 _v,
                        bytes32 _r,
                        bytes32 _s)
                        public payable returns (uint256);
                */

                // everything else has (path[], amount, minRate), so convert this one to that format
                if (unpacked.name === 'convert' && unpacked.params[0].name == '_fromToken') {
                    let params2 = [];
                    params2[0] = { value: [unpacked.params[0].value, unpacked.params[1].value] };
                    params2[1] = { value: unpacked.params[2].value };
                    params2[2] = { value: unpacked.params[3].value };
                    unpacked.params = params2;
                }

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;
                let tokenPath = unpacked.params[0].value;
                let tokenGive = this.setToken(tokenPath[tokenPath.length - 1]);
                let tokenGet = this.setToken(tokenPath[0]);

                var exchange = 'Bancor';

                if (utility.isWrappedETH(tokenGet.addr) || (!utility.isWrappedETH(tokenGive.addr) && utility.isNonEthBase(tokenGive.addr)) || (!utility.isWrappedETH(tokenGive.addr) && tokenGet.name == "BNT")) // get eth  -> sell
                {
                    tradeType = 'Buy';
                    token = tokenGive;
                    base = tokenGet;
                }
                else if (utility.isWrappedETH(tokenGive.addr) || (!utility.isWrappedETH(tokenGet.addr) && utility.isNonEthBase(tokenGet.addr)) || (!utility.isWrappedETH(tokenGet.addr) && tokenGive.name == "BNT")) // buy
                {
                    tradeType = 'Sell';
                    token = tokenGet;
                    base = tokenGive;
                }
                else {
                    console.log('unknown base token');
                    return undefined;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = new BigNumber(unpacked.params[1].value);
                        rawBaseAmount = new BigNumber(unpacked.params[2].value);
                    } else {
                        rawBaseAmount = new BigNumber(unpacked.params[1].value);
                        rawAmount = new BigNumber(unpacked.params[2].value);
                    }


                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var orderSize = new BigNumber(0);
                    var price = new BigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    // let makerAddr = tx.from.toLowerCase();

                    if (tradeType === 'Sell') {
                        return {
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
                        return {
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
                }
            }
            //idex adminWithdraw(address token, uint256 amount, address user, uint256 nonce, uint8 v, bytes32 r, bytes32 s, uint256 feeWithdrawal)
            else if (unpacked.name === 'adminWithdraw') {
                var token = this.setToken(unpacked.params[0].value);
                if (token && token.addr) {
                    var rawAmount = new BigNumber(unpacked.params[1].value);
                    var fee = new BigNumber(unpacked.params[7].value);

                    var amount = utility.weiToToken(rawAmount, token);

                    var type = '';
                    var note = '';

                    const ether1 = new BigNumber(1000000000000000000);
                    var feeVal = utility.weiToToken((fee.times(rawAmount)).div(ether1), token);

                    if (token.addr !== this.config.ethAddr) {
                        type = 'Token Withdraw';
                        note = utility.addressLink(unpacked.params[2].value, true, true) + ' requested IDEX to withdraw tokens';
                    } else {
                        type = 'Withdraw';
                        note = utility.addressLink(unpacked.params[2].value, true, true) + ' requested IDEX to withdraw ETH';
                    }

                    var exchange = '';
                    let addrName = this.addressName(txTo);
                    // etherscan token transfer log (to, from are bad)
                    if (badFromTo) {
                        addrName = this.addressName(txFrom);
                    }
                    if (addrName.indexOf('0x') === -1) {
                        exchange = addrName;
                    }

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
            //ethex.market taker trade
            else if (unpacked.name == 'takeBuyOrder' || unpacked.name == 'takeSellOrder') {
                let maker = unpacked.params[unpacked.params.length - 1].value.toLowerCase();
                let taker = ''
                if (badFromTo && unpacked.name == 'takeSellOrder') {
                    taker = txTo;
                } else {
                    taker = txFrom;
                }

                let base = this.setToken(this.config.ethAddr);
                let token = this.setToken(unpacked.params[0].value);
                let tradeType = '';
                if (unpacked.name == 'takeSellOrder') {
                    tradeType = 'Buy';
                } else {
                    tradeType = 'Sell';
                }

                let exchange = '';
                let addrName = !badFromTo ? this.addressName(txTo) : this.config.exchangeContracts.Ethex.name; //assume ethex, no address in etherscan token event
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (token && base) {
                    let tokenAmount = utility.weiToToken(unpacked.params[1].value, token);
                    let baseAmount = utility.weiToToken(unpacked.params[2].value, base);

                    var price = new BigNumber(0);
                    if (tokenAmount.greaterThan(0)) {
                        price = baseAmount.div(tokenAmount);
                    }

                    var orderSize = tokenAmount;

                    // less than full base amount
                    if (unpacked.name == 'takeSellOrder' && new BigNumber(unpacked.params[2].value) !== new BigNumber(tx.value)) {
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
                    rawETH = new BigNumber(unpacked.params[2].value);
                    tradeType = 'Sell';
                } else {
                    if (unpacked.name.slice(0, 6) == 'cancel') {
                        rawETH = new BigNumber(unpacked.params[2].value);
                    } else {
                        rawETH = new BigNumber(tx.value);
                    }
                    tradeType = 'Buy';
                }

                let exchange = '';
                let addrName = this.addressName(txTo);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (base && token) {

                    let tokenAmount = utility.weiToToken(unpacked.params[1].value, token);
                    let baseAmount = utility.weiToEth(rawETH);

                    var price = new BigNumber(0);
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
                    rawETH = new BigNumber(unpacked.params[2].value);
                    tradeType = 'Sell';
                } else {
                    rawETH = new BigNumber(tx.value);
                    tradeType = 'Buy';
                }

                let exchange = '';
                let addrName = this.addressName(txTo);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (base && token) {

                    let tokenAmount = utility.weiToToken(unpacked.params[1].value, token);
                    let baseAmount = utility.weiToEth(rawETH);

                    return {
                        'type': tradeType + ' up to',
                        'exchange': exchange,
                        'note': utility.addressLink(txFrom, true, true) + ' iniated a trade thorugh an exchange aggregator.',
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

    let name = '';

    if (this.uniqueTokens[addr]) {
        name = this.uniqueTokens[addr].name + " Contract ";
    }
    else if (this.uniqueTokens[lcAddr]) {
        name = this.uniqueTokens[lcAddr].name + " Contract ";
    }
    else if (this.config.zrxRelayers[lcAddr]) {
        name = this.config.zrxRelayers[lcAddr] + ' Admin ';
    } else if (this.config.admins[lcAddr]) {
        name = this.config.admins[lcAddr] + ' ';
    } else if (this.config.exchangeWallets[lcAddr]) {
        name = this.config.exchangeWallets[lcAddr] + ' ';
    } else if (this.config.bancorConverters.indexOf(lcAddr) !== -1) {
        name = "Bancor ";
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
        return name + (showAddr ? lcAddr : '');
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

DeltaBalances.prototype.isExchangeAddress = function (addr) {
    let lcAddr = addr.toLowerCase();

    let exchanges = Object.values(this.config.exchangeContracts);
    for (let i = 0; i < exchanges.length; i++) {
        if (exchanges[i].addr === lcAddr && exchanges[i].supportedDex) {
            return true;
        }
    }
    for (let j = 0; j < this.config.bancorConverters.length; j++) {
        if (lcAddr === this.config.bancorConverters[j])
            return true;
    }

    return false;
};

DeltaBalances.prototype.processUnpackedEvent = function (unpacked, myAddr) {
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
                if (maker === myAddr) {
                    transType = 'Maker';
                }

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
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
                    var buyUser = '';
                    var sellUser = '';
                    if (tradeType === 'Sell') {
                        rawAmount = new BigNumber(unpacked.events[1].value);
                        rawBaseAmount = new BigNumber(unpacked.events[3].value);
                        sellUser = taker;
                        buyUser = maker;
                    } else {
                        rawBaseAmount = new BigNumber(unpacked.events[1].value);
                        rawAmount = new BigNumber(unpacked.events[3].value);
                        sellUser = maker;
                        buyUser = taker;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = new BigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    // history only??
                    if (buyUser === myAddr)
                        tradeType = "Buy";
                    else if (sellUser === myAddr)
                        tradeType = "Sell";


                    let takerFee = new BigNumber(0);
                    let makerFee = new BigNumber(0);
                    const ether1 = new BigNumber(1000000000000000000); // 1 ether in wei

                    let contractList = this.config.exchangeContracts;
                    if (exchange == contractList.EtherDelta.name || exchange == contractList.Decentrex.name || exchange == contractList.TokenStore.name
                        || exchange == contractList.Singularx.name || exchange == contractList.EtherC.name
                    ) {
                        takerFee = new BigNumber(3000000000000000); //0.3% fee in wei
                    } else if (exchange == contractList.Enclaves.name) {
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
                        // myAddr works in tx.js , history doesn't show note anyway
                        'note': utility.addressLink(myAddr, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
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
            //ethen.market event 1/2 of a trade. (combined in unpacking, added .combinedEvents)
            else if (unpacked.name == 'Order' && unpacked.events.length == 8 && unpacked.address == this.config.exchangeContracts.Ethen.addr && unpacked.combinedEvents) {
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
                if (maker === myAddr) {
                    transType = 'Maker';
                }


                var exchange = '';
                let addrName = this.addressName(unpacked.address);

                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }


                let rawAmount = new BigNumber(unpacked.events[3].value);
                let price = new BigNumber(unpacked.events[2].value);

                var amount = utility.weiToToken(rawAmount, token);

                // price in 1e18
                price = utility.weiToToken(price, base);
                let dvsr3 = _delta.divisorFromDecimals(base.decimals - token.decimals)
                price = utility.weiToEth(price, dvsr3);

                baseAmount = amount.times(price);

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
                        fee = utility.weiToToken(fee, token);
                    }
                    else if (tradeType === 'Buy') {
                        fee = utility.weiToToken(fee, base);
                    }
                } else if (transType === 'Maker') {
                    fee = new BigNumber(0);
                }

                return {
                    'type': transType + ' ' + tradeType,
                    'exchange': exchange,
                    // myAddr works in tx.js , history doesn't show note anyway
                    'note': utility.addressLink(myAddr, true, true) + ' selected an order in the orderbook to trade.',
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

                let makerAmount = new BigNumber(unpacked.events[1].value);
                let takerAmount = new BigNumber(unpacked.events[4].value);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = 'Taker';
                if (maker === myAddr) {
                    transType = 'Maker';
                }


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
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
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
                    var price = new BigNumber(0);
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
                            'fee': new BigNumber(0),
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

                let takerAmount = new BigNumber(unpacked.events[3].value);
                let makerAmount = new BigNumber(unpacked.events[4].value);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = 'Taker';
                if (maker === myAddr) {
                    transType = 'Maker';
                }


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
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
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
                    var price = new BigNumber(0);
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
                        'fee': new BigNumber(0),
                        'feeCurrency': undefined,
                        'transType': transType,
                        'tradeType': tradeType,
                    };
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
                let makerFee = utility.weiToToken(unpacked.events[7].value, feeCurrency);
                let takerFee = utility.weiToToken(unpacked.events[8].value, feeCurrency);

                let relayer = unpacked.events[2].value.toLowerCase();

                var exchange = utility.relayName(relayer);

                // 9 xor tokenpair
                // 10 orderhash

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = 'Taker';
                if (maker === myAddr) {
                    transType = 'Maker';
                }


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
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
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
                    var price = new BigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    let fee = new BigNumber(0);
                    if (transType === 'Maker') {
                        fee = makerFee;
                    } else {
                        fee = takerFee;
                    }

                    return {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        // myAddr works in tx.js , history doesn't show note anyway
                        'note': utility.addressLink(myAddr, true, true) + ' selected ' + utility.addressLink(maker, true, true) + '\'s order in the orderbook to trade.',
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
                        'relayer': relayer
                    };
                }
            }
            //Bancor trade
            else if (unpacked.name == 'Conversion') {
                //3 variants
                //Conversion (index_topic_1 address _fromToken, index_topic_2 address _toToken, index_topic_3 address _trader, uint256 _amount, uint256 _return, uint256 _currentPriceN, uint256 _currentPriceD)
                //Conversion (index_topic_1 address _fromToken, index_topic_2 address _toToken, index_topic_3 address _trader, uint256 _amount, uint256 _return, int256 _conversionFee, uint256 _currentPriceN, uint256 _currentPriceD)
                //Conversion (index_topic_1 address _fromToken, index_topic_2 address _toToken, index_topic_3 address _trader, uint256 _amount, uint256 _return, int256 _conversionFee)


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

                if (utility.isWrappedETH(takerToken.addr) || (!utility.isWrappedETH(makerToken.addr) && takerToken.name === "BNT") || (smartRelays[takerToken.addr] || takerToken.name === "??? RelayBNT")) { // get eth  -> sell
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;
                } else if (utility.isWrappedETH(makerToken.addr) || (!utility.isWrappedETH(takerToken.addr) && makerToken.name === "BNT") || (smartRelays[makerToken.addr] || makerToken.name === "??? RelayBNT")) { // buy
                    tradeType = 'Sell';
                    token = takerToken;
                    base = makerToken;
                } else {
                    return { 'error': 'unknown token in trade event' };
                    //  console.log('unknown base token');
                    // return undefined;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
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
                    var price = new BigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    let fee = new BigNumber(0);
                    let feeCurrency = '';

                    //variant that includes fee
                    if (unpacked.events.length == 8 || unpacked.events.length == 6) {
                        feeCurrency = makerToken;
                        let rawFee = new BigNumber(unpacked.events[5].value);
                        if (token == makerToken) {
                            fee = utility.weiToToken(rawFee, token);
                        } else {
                            fee = utility.weiToToken(rawFee, base);
                        }
                    }

                    return {
                        'type': transType + ' ' + tradeType,
                        'exchange': exchange,
                        // myAddr works in tx.js , history doesn't show note anyway
                        'note': utility.addressLink(myAddr, true, true) + ' made a Bancor conversion.',
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
            //ETH deposit/withdraw  etherdelta/decentrex, idex, enclaves 
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

                var exchange = '';
                let addrName = this.addressName(unpacked.address);

                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

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
            // Order cancel etherdelta, decentrex, kyber, enclaves
            else if (unpacked.name == 'Cancel') {
                var cancelType = 'sell';
                var token = undefined;
                var base = undefined;


                let tokenGet = this.setToken(unpacked.events[0].value);
                let tokenGive = this.setToken(unpacked.events[2].value);

                if (utility.isWrappedETH(tokenGet.addr) || (!utility.isWrappedETH(tokenGive.addr) && utility.isNonEthBase(tokenGive.addr))) // get eth  -> sell
                {
                    cancelType = 'buy';
                    token = tokenGive;
                    base = tokenGet;
                }
                else if (utility.isWrappedETH(tokenGive.addr) || (!utility.isWrappedETH(tokenGet.addr) && utility.isNonEthBase(tokenGet.addr))) // buy
                {
                    token = tokenGet;
                    base = tokenGive;
                }
                else {
                    return { error: 'unknown base token' };
                }

                var exchange = '';
                let addrName = this.addressName(unpacked.address);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (token && base && token.addr && base.addr) {
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
                    if (cancelType === 'sell') {
                        rawAmount = new BigNumber(unpacked.events[1].value);
                        rawBaseAmount = new BigNumber(unpacked.events[3].value);
                    } else {
                        rawBaseAmount = new BigNumber(unpacked.events[1].value);
                        rawAmount = new BigNumber(unpacked.events[3].value);
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = new BigNumber(0);
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
                        'unlisted': token.unlisted,
                    };
                }
            }
            //0x cancel
            else if (unpacked.name == 'LogCancel') {
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
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;

                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = new BigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    return {
                        'type': 'Cancel' + ' ' + tradeType,
                        'exchange': exchange,
                        // myAddr works in tx.js , history doesn't show note anyway
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
            // oasis maker
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
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = takerAmount;
                        rawBaseAmount = makerAmount;

                    } else {
                        rawBaseAmount = takerAmount;
                        rawAmount = makerAmount;
                    }

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = new BigNumber(0);
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
                let makerAmount = new BigNumber(unpacked.events[6].value);
                let takerAmount = new BigNumber(unpacked.events[7].value);

                let feeCurrency = '';
                let fee = new BigNumber(0);

                var exchange = '';
                exchange = this.addressName(unpacked.address);
                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                var transType = 'Taker';
                if (maker === myAddr) {
                    transType = 'Maker';
                }


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
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
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
                    var price = new BigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
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
            //erc 20 transfer
            else if (unpacked.name == 'Transfer') {

                var from = unpacked.events[0].value.toLowerCase();
                var to = unpacked.events[1].value.toLowerCase();
                var rawAmount = unpacked.events[2].value;
                var token = this.setToken(unpacked.address);

                var amount = utility.weiToToken(rawAmount, token);
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
            // erc20 approve
            else if (unpacked.name == 'Approval') {
                var sender = unpacked.events[0].value.toLowerCase();
                var to = unpacked.events[1].value.toLowerCase();
                var rawAmount = unpacked.events[2].value;
                var token = this.setToken(unpacked.address);

                var amount = utility.weiToToken(rawAmount, token);

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

                    if (maker == myAddr) {
                        tradeType = 'Sell';
                        transType = 'Maker';
                    }
                } else {
                    tradeType = 'Sell';
                    maker = unpacked.events[5].value.toLowerCase();
                    taker = unpacked.events[6].value.toLowerCase();
                    seller = taker;
                    buyer = maker;

                    if (maker == myAddr) {
                        tradeType = 'Buy';
                        transType = 'Maker';
                    }
                }

                let base = this.setToken(this.config.ethAddr);
                let token = this.setToken(unpacked.events[1].value);

                let exchange = '';
                let addrName = this.addressName(unpacked.address);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }


                if (token && base) {
                    let tokenAmount = utility.weiToToken(unpacked.events[2].value, token);
                    let rawBaseAmount = new BigNumber(unpacked.events[3].value);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var price = new BigNumber(0);
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


                    let fee = new BigNumber(0);
                    if (Number(unpacked.blockNumber) > 10000000) { // free fee period
                        const takeFee = new BigNumber(2500000000000000);
                        const makeFee = new BigNumber(0);
                        const ether1 = new BigNumber(1000000000000000000);
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

                let exchange = '';
                let addrName = this.addressName(unpacked.address);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }

                if (base && token) {
                    let tokenAmount = utility.weiToToken(unpacked.events[2].value, token);
                    let baseAmount = utility.weiToToken(unpacked.events[3].value, base);
                    var price = new BigNumber(0);
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

                let exchange = '';
                let addrName = this.addressName(unpacked.address);
                if (addrName.indexOf('0x') === -1) {
                    exchange = addrName;
                }


                if (token && base) {
                    let tokenAmount = utility.weiToToken(unpacked.events[4 + offset].value, token);
                    let rawBaseAmount = new BigNumber(unpacked.events[5 + offset].value);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);

                    var price = new BigNumber(0);
                    if (tokenAmount.greaterThan(0)) {
                        price = baseAmount.div(tokenAmount);
                    }

                    let fee = new BigNumber(0);

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

            // ED onchain-Order ?
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
                        contents = 'Contract: ' + utility.tokenLink(token.addr, true, true) + '<br> Decimals: ' + token.decimals;
                    }
                    if (token.locked || token.killed) {
                        contents += '<br> <i class="text-red fa fa-lock" aria-hidden="true"></i> Token Locked or Paused.';
                    }
                    contents += '<br><br> Trade centralized: <br><table class="popoverTable"><tr><td>' + utility.binanceURL(token, true) + '</td></tr></table>';

                    contents += 'Trade decentralized: <br><table class="popoverTable"><tr><td>' + utility.etherDeltaURL(token, true)
                        + '</td><td>' + utility.idexURL(token, true)
                        + '</td></tr><tr><td>' + utility.forkDeltaURL(token, true)
                        + '</td><td>' + utility.ddexURL(token, true)
                        + '</td></tr><tr><td>' + utility.tokenStoreURL(token, true)
                        + '</td><td>' + utility.radarURL(token, true)
                        + '</td></tr><tr><td>' + utility.kyberURL(token, true)
                        + '</td><td></td></tr></table>';


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
