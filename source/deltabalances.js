let config = require('./config.js');
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
BigNumber.config({ ERRORS: false });

const deltaBalances = new DeltaBalances();
const utility = require('./utility.js')(deltaBalances);



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
    loadCachedTokens('Radar');
    loadCachedTokens('Kyber');

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

    //load this last as it doesn't include decimals, we might get them from another source
    loadCachedTokens('TokenStore');

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
                let amount = new BigNumber(0);
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
                        amount = new BigNumber(1);
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
                var amount = new BigNumber(0);
                var token = this.setToken(tx.to);

                if (token && token.addr) {
                    if (!token.erc721) {
                        amount = utility.weiToToken(rawAmount, token);
                    } else {
                        amount = new BigNumber(1);
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
            // exchange deposit/withdraw ETH (etherdelta, idex deposit, tokenstore, ethen, switcheo deopsit) 
            // wrap  0x ETH->WETH, wrap ethfinex lockTokens. (un)wrapping
            else if (unpacked.name === 'deposit' || (unpacked.name === 'withdraw' && unpacked.params[0].name !== 'token' && unpacked.params.length < 9)
                || unpacked.name === 'withdrawEther' || unpacked.name === 'depositEther') {
                var type = '';
                var note = '';
                var rawVal = new BigNumber(0);
                var token = undefined;
                var base = undefined;
                var exchange = '';

                //deposit / wrapping
                if (unpacked.name === 'deposit' || unpacked.name === 'depositEther') {

                    // Wrap ETH to WETH or ETH-W
                    if (utility.isWrappedETH(tx.to)) {
                        rawVal = new BigNumber(tx.value);
                        type = 'Wrap ETH';
                        note = 'Wrap ETH to WETH';
                        token = this.setToken(this.config.ethAddr);
                        base = this.setToken(tx.to);
                    }
                    // Wrap erc20 token into lockable ethfinex token
                    else if (unpacked.params.length == 2 && unpacked.params[1].name == '_forTime') {
                        rawVal = new BigNumber(unpacked.params[0].value);
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
                        rawVal = new BigNumber(tx.value);
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
                        rawVal = new BigNumber(unpacked.params[0].value);
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
            // exchange erc20 deposit / withdraw
            else if (unpacked.name === 'depositToken' || unpacked.name === 'withdrawToken' || /* enclaves */ unpacked.name === 'withdrawBoth' || unpacked.name === 'depositBoth'
                || (unpacked.name === 'withdraw' && unpacked.params.length == 2 && unpacked.params[0].name === 'token')
            ) {
                var token = this.setToken(unpacked.params[0].value);
                if (token && token.addr) {
                    var amount = utility.weiToToken(unpacked.params[1].value, token);
                    var type = '';
                    var note = '';
                    let exchange = this.getExchangeName(txTo, '');

                    if (unpacked.name === 'withdrawToken' || unpacked.name === 'withdrawBoth' || unpacked.name === 'withdraw') {
                        type = 'Withdraw';
                        if (exchange) {
                            note = 'Request ' + exchange + 'contract to withdraw ' + token.name;
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
            // Switcheo admin withdraw
            else if (unpacked.name === 'withdraw' && unpacked.params.length == 9) {
                var token = this.setToken(unpacked.params[1].value);
                var feeToken = this.setToken(unpacked.params[3].value);
                if (token && feeToken && token.addr && feeToken.addr) {
                    var rawAmount = new BigNumber(unpacked.params[2].value);
                    var rawFee = new BigNumber(unpacked.params[4].value);

                    var amount = utility.weiToToken(rawAmount, token);

                    var type = '';
                    var note = '';

                    var feeVal = utility.weiToToken(rawFee, feeToken);

                    let exchange = this.getExchangeName(txTo, '');

                    if (token.addr !== this.config.ethAddr) {
                        type = 'Token Withdraw';
                        note = utility.addressLink(unpacked.params[2].value, true, true) + ' requested Switcheo to withdraw tokens';
                    } else {
                        type = 'Withdraw';
                        note = utility.addressLink(unpacked.params[2].value, true, true) + ' requested Switc to withdraw ETH';
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
                        note = 'Request the ' + exchange + 'contract to deposit ' + token.name;
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

                let rawBaseAmount = new BigNumber(unpacked.params[0].value[5].value);
                let rawTokenAmount = new BigNumber(unpacked.params[0].value[4].value);

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

                let price = new BigNumber(0);
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
                    let cancelTakerTokenAmount1 = new BigNumber(unpacked.params[2].value);

                    return unpack0xCancelInput(orderAddresses1, orderValues1, cancelTakerTokenAmount1);
                } else if (unpacked.name === 'batchCancelOrders') {
                    let orderAddresses2 = unpacked.params[0].value;
                    let orderValues2 = unpacked.params[1].value;
                    let cancelTakerTokenAmounts2 = unpacked.params[2].value.map(x => new BigNumber(x));

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

                    let makerAmount = new BigNumber(orderValues[0]);
                    let takerAmount = new BigNumber(orderValues[1]);

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

                        // single units if erc721
                        if (token.erc721) {
                            amount = new BigNumber(1);
                            baseAmount = amount.times(price);
                        }
                        if (base.erc721) {
                            baseAmount = new BigNumber(1);
                        }
                        if (token.erc721 && base.erc721) {
                            price = new BigNumber(1);
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

                let exchange = this.getExchangeName(txTo, '');

                return {
                    'type': 'Cancel offer',
                    'exchange': exchange,
                    'orderID': new BigNumber(unpacked.params[0].value),
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
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);

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


                    orderSize = amount;
                    // selected amount, aailable in trades, not available in 'order'
                    if (unpacked.params.length >= 11) {
                        var chosenAmount = new BigNumber(unpacked.params[10].value);

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
            else if ((unpacked.name === 'trade' && unpacked.params.length == 7) || unpacked.name == 'tradeWithHint') {
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

                let maker = '';
                let iOffset = 0;
                if (unpacked.params[0].name == 'trader') {
                    iOffset = 1;
                }

                let taker = txFrom;
                let takerToken = this.setToken(unpacked.params[0 + iOffset].value);
                let makerToken = this.setToken(unpacked.params[2 + iOffset].value);

                let takerAmount = new BigNumber(unpacked.params[1 + iOffset].value);
                let makerAmount = new BigNumber(unpacked.params[4 + iOffset].value); //max amount

                let rate = new BigNumber(unpacked.params[5 + iOffset].value);

                let minPrice = new BigNumber(0);
                let maxPrice = new BigNumber(0);

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
                    takerAmount = new BigNumber(unpacked.params[1].value);
                    rate = new BigNumber(unpacked.params[2].value);
                } else if (unpacked.name == 'swapEtherToToken') {
                    takerToken = this.setToken(this.config.ethAddr);
                    makerToken = this.setToken(unpacked.params[0].value);
                    takerAmount = new BigNumber(tx.value);
                    rate = new BigNumber(unpacked.params[1].value);
                } else {
                    takerToken = this.setToken(unpacked.params[0].value);
                    makerToken = this.setToken(unpacked.params[2].value);
                    takerAmount = new BigNumber(unpacked.params[1].value);
                    rate = new BigNumber(unpacked.params[3].value);
                }

                let taker = txFrom;

                let minPrice = new BigNumber(0);
                let maxPrice = new BigNumber(0);

                var tradeType = 'Sell';
                var token = undefined;
                var base = undefined;

                let exchange = this.getExchangeName(txTo, '');

                let amount = new BigNumber(0);
                let baseAmount = new BigNumber(0);

                if (this.isBaseToken(takerToken, makerToken)) {
                    tradeType = 'Buy';
                    token = makerToken;
                    base = takerToken;

                    baseAmount = utility.weiToToken(takerAmount, base)
                    inverseMax = utility.weiToToken(rate, base);
                    maxPrice = new BigNumber(1).div(inverseMax);
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

                    let rawBaseAmount = new BigNumber(orderStructArray[2].value);
                    let rawTokenAmount = new BigNumber(orderStructArray[1].value);

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

                    let price = new BigNumber(0);
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
                    let fillTakerTokenAmount1 = new BigNumber(unpacked.params[2].value);

                    if (oldName) {
                        unpacked.name = oldName;
                    }
                    return unpack0xOrderInput(orderAddresses1, orderValues1, fillTakerTokenAmount1);
                } else if (unpacked.name === 'batchFillOrders' || unpacked.name == 'batchFillOrKillOrders') {
                    let orderAddresses2 = unpacked.params[0].value;
                    let orderValues2 = unpacked.params[1].value;
                    let fillTakerTokenAmounts2 = unpacked.params[2].value.map(x => new BigNumber(x));

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
                    let fillTakerTokenAmounts2 = unpacked.params[2].value.map(x => new BigNumber(x));

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
                    let fillTokenAmount3 = new BigNumber(unpacked.params[2].value);
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
                        amount = new BigNumber(1);
                    }
                    if (objs[0].base.erc721) {
                        baseAmount = new BigNumber(1);
                    }
                    if (objs[0].token.erc721 && objs[0].base.erc721) {
                        minPrice = new BigNumber(1);
                        maxPrice = new BigNumber(1);
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

                    let makerAmount = new BigNumber(orderValues[0]);
                    let takerAmount = new BigNumber(orderValues[1]);

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
                        var rawAmount = new BigNumber(0);
                        var rawBaseAmount = new BigNumber(0);
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

                        var orderSize = new BigNumber(0);
                        var price = new BigNumber(0);
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
                            amount = new BigNumber(1);
                            baseAmount = amount.times(price);
                        }
                        if (base.erc721) {
                            baseAmount = new BigNumber(1);
                        }
                        if (token.erc721 && base.erc721) {
                            price = new BigNumber(1);
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
                //oasisdex buy with ID
            } else if ((unpacked.name == 'buy' || unpacked.name == 'take') && unpacked.params.length == 2) {
                //take(bytes32 id, uint128 maxTakeAmount)
                //buy(uint id, uint amount)

                let exchange = this.getExchangeName(txTo, '');

                // Function: buy(uint256 id, uint256 amount)
                return {
                    'type': 'Fill offer',
                    'exchange': exchange,
                    'orderID': new BigNumber(unpacked.params[0].value),
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
                    tokenGetAmount = new BigNumber(unpacked.params[4].value);
                    tokenGiveAmount = new BigNumber(unpacked.params[2].value);
                }
                else if (unpacked.name == 'buyAllAmountPayEth') {
                    tokenGet = this.setToken(unpacked.params[3].value);
                    tokenGive = this.setToken(unpacked.params[1].value);
                    tokenGetAmount = new BigNumber(tx.value);
                    tokenGiveAmount = new BigNumber(unpacked.params[2].value);
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

                    var orderSize = new BigNumber(0);
                    var price = new BigNumber(0);
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
                    tokenGetAmount = new BigNumber(unpacked.params[2].value);
                    tokenGiveAmount = new BigNumber(unpacked.params[4].value);
                }
                else if (unpacked.name == 'sellAllAmountPayEth') {
                    tokenGet = this.setToken(unpacked.params[1].value);
                    tokenGive = this.setToken(unpacked.params[2].value);
                    tokenGetAmount = new BigNumber(tx.value);
                    tokenGiveAmount = new BigNumber(unpacked.params[3].value);
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

                    var orderSize = new BigNumber(0);
                    var price = new BigNumber(0);
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

                // TODO recheck this one
                let amount = utility.weiToEth(tx.value);
                let token = this.setToken(txTo);
                let ethToken = this.setToken(config.ethAddr);
                if (utility.isWrappedETH(firstToken.addr)) {

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
                    let rawAmount = new BigNumber(0);
                    let rawBaseAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
                        rawAmount = new BigNumber(unpacked.params[1].value);
                        rawBaseAmount = new BigNumber(unpacked.params[2].value);
                    } else {
                        rawBaseAmount = new BigNumber(unpacked.params[1].value);
                        rawAmount = new BigNumber(unpacked.params[2].value);
                    }


                    let amount = utility.weiToToken(rawAmount, token);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);

                    let price = new BigNumber(0);
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
                        let chain = this.web3.toUtf8(unpacked.params[3].value);
                        let obj2 = {
                            'type': 'Trade (cross-chain)',
                            'exchange': 'BancorX',
                            'note': 'A cross-chain trade to the ' + chain + ' blockchain',
                            'token': tokenGet,
                            'amount': token === tokenGet ? amount : baseAmount,
                            'blockchain': chain,
                            'chainDestination': this.web3.toUtf8(unpacked.params[4].value),
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
                let rawAmount = new BigNumber(unpacked.params[1].value);
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
                let chain = this.web3.toUtf8(unpacked.params[0].value);
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

                let exchange = this.getExchangeName(txTo, '');

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
                    rawTokenAmount = new BigNumber(unpacked.params[0].value);
                    rawBaseAmount = new BigNumber(tx.value);
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
                        rawTokenAmount = new BigNumber(unpacked.params[0].value);
                        rawBaseAmount = new BigNumber(unpacked.params[1].value);
                    } else {
                        rawTokenAmount = new BigNumber(unpacked.params[1].value);
                        rawBaseAmount = new BigNumber(unpacked.params[0].value);
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
                        rawTokenAmount = new BigNumber(unpacked.params[0].value);
                        rawBaseAmount = new BigNumber(unpacked.params[1].value);
                    } else {
                        rawTokenAmount = new BigNumber(unpacked.params[1].value);
                        rawBaseAmount = new BigNumber(unpacked.params[0].value);
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

                    let price = new BigNumber(0);
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
                    let rawVal = new BigNumber(tx.value);
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
                let rawVal = new BigNumber(unpacked.params[0].value);
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

    let baseAmount = new BigNumber(obj.total);
    let amount = new BigNumber(obj.amount);
    let price = new BigNumber(obj.price);

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
                    if (isMyAddress(buyUser))
                        tradeType = "Buy";
                    else if (isMyAddress(sellUser))
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
                    var rawAmount = new BigNumber(0);
                    var rawBaseAmount = new BigNumber(0);
                    if (tradeType === 'Sell') {
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
                var rawAmount = new BigNumber(0);
                var rawBaseAmount = new BigNumber(0);

                if (this.isBaseToken(tokenGet, tokenGive)) // get eth  -> sell
                {
                    tradeType = 'Sell';
                    token = tokenGive;
                    base = tokenGet;
                    rawAmount = new BigNumber(unpacked.events[0].value);
                    rawBaseAmount = new BigNumber(unpacked.events[2].value);
                }
                else //if (this.isBaseToken(tokenGive, tokenGet)) // buy
                {
                    token = tokenGet;
                    base = tokenGive;
                    rawBaseAmount = new BigNumber(unpacked.events[2].value);
                    rawAmount = new BigNumber(unpacked.events[0].value);
                }

                let exchange = this.getExchangeName(unpacked.address, '');

                if (token && base && token.addr && base.addr) {

                    var amount = utility.weiToToken(rawAmount, token);
                    var baseAmount = utility.weiToToken(rawBaseAmount, base);
                    var price = new BigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    let fee = new BigNumber(0);
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

                let rawAmount = new BigNumber(unpacked.events[3].value);
                let price = new BigNumber(unpacked.events[2].value);

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

                let rawBaseAmount = new BigNumber(unpacked.events[1].value[9]);
                let rawTokenAmount = new BigNumber(unpacked.events[1].value[8]);

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
                    let price = new BigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    let feeToken = base;
                    let fee = new BigNumber(0);
                    if (transType === 'Maker') {
                        let makerFeeAmount = new BigNumber(unpacked.events[1].value[3]);
                        let makerGasAmount = new BigNumber(unpacked.events[1].value[6]);
                        let makerRebateAmount = new BigNumber(unpacked.events[1].value[4]);

                        fee = utility.weiToToken(makerFeeAmount, base);
                        fee = fee.plus(utility.weiToToken(makerGasAmount, base));
                        fee = fee.minus(utility.weiToToken(makerRebateAmount, base));
                    } else {
                        let takerFeeAmount = new BigNumber(unpacked.events[1].value[5]);
                        let takerGasAmount = new BigNumber(unpacked.events[1].value[7]);
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

                let rawBaseAmount = new BigNumber(unpacked.events[6].value);
                let rawTokenAmount = new BigNumber(unpacked.events[5].value);

                let transType = 'Taker';
                if (isMyAddress(maker)) {
                    transType = 'Maker';
                }

                let exchange = utility.relayName(relayer, 'DDEX');

                if (token && base && token.addr && base.addr) {
                    let amount = utility.weiToToken(rawTokenAmount, token);
                    let baseAmount = utility.weiToToken(rawBaseAmount, base);
                    let price = new BigNumber(0);
                    if (amount.greaterThan(0)) {
                        price = baseAmount.div(amount);
                    }

                    let feeToken = base;
                    let fee = new BigNumber(0);
                    if (transType === 'Maker') {
                        let makerFeeAmount = new BigNumber(unpacked.events[7].value);
                        let makerGasAmount = new BigNumber(unpacked.events[9].value);
                        let makerRebateAmount = new BigNumber(unpacked.events[10].value);

                        fee = utility.weiToToken(makerFeeAmount, base);
                        fee = fee.plus(utility.weiToToken(makerGasAmount, base));
                        fee = fee.minus(utility.weiToToken(makerRebateAmount, base));
                    } else {
                        let takerFeeAmount = new BigNumber(unpacked.events[8].value);
                        let takerGasAmount = new BigNumber(unpacked.events[11].value);
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

                let makerAmount = new BigNumber(unpacked.events[1].value);
                let takerAmount = new BigNumber(unpacked.events[4].value);

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

                    makerAmount = new BigNumber(unpacked.events[5].value);
                    takerAmount = new BigNumber(unpacked.events[6].value);

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

                        makerAmount = new BigNumber(unpacked.events[4].value);
                        takerAmount = new BigNumber(unpacked.events[5].value);
                        makerFeeAmount = new BigNumber(unpacked.events[6].value);
                        takerFeeAmount = new BigNumber(unpacked.events[7].value);
                        // utility.weiToToken(unpacked.events[7].value, feeCurrency);

                    } else if (unpacked.events.length == 14) { //0x v3
                        taker = unpacked.events[7].value.toLowerCase();
                        sender = unpacked.events[8].value.toLowerCase();
                        makerTokenAddr = this.addressFromAssetData(unpacked.events[2].value, true);
                        takerTokenAddr = this.addressFromAssetData(unpacked.events[3].value, true);
                        makerFeeAddr = this.addressFromAssetData(unpacked.events[4].value, true);
                        takerFeeAddr = this.addressFromAssetData(unpacked.events[5].value, true);

                        makerAmount = new BigNumber(unpacked.events[9].value);
                        takerAmount = new BigNumber(unpacked.events[10].value);
                        makerFeeAmount = new BigNumber(unpacked.events[11].value);
                        takerFeeAmount = new BigNumber(unpacked.events[12].value);
                        protocolFeeAmount = new BigNumber(unpacked.events[13].value);
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
                        makerFee = new BigNumber(0);
                    }
                    if (takerFeeAddr) {
                        takerFeeToken = this.setToken(takerFeeAddr);
                        takerFee = utility.weiToToken(takerFeeAmount, takerFeeToken);
                    } else {
                        takerFee = new BigNumber(0);
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
                    let rawAmount = new BigNumber(0);
                    let rawBaseAmount = new BigNumber(0);
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
                    let price = new BigNumber(0);
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
                        amount = new BigNumber(1);
                        baseAmount = amount.times(price);
                    }
                    if (base.erc721) {
                        baseAmount = new BigNumber(1);
                        if (token.erc721) {
                            price = new BigNumber(1);
                        }
                    }

                    let protocolFeeToken = this.setToken(this.config.ethAddr); //v3 only
                    let protocolFee = new BigNumber(0);
                    if (protocolFeeAmount) {
                        protocolFee = utility.weiToToken(protocolFeeAmount, protocolFeeToken);
                    }

                    let fee = new BigNumber(0);
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

                let makerAmount = new BigNumber(unpacked.events[4].value);
                let takerAmount = new BigNumber(unpacked.events[3].value);



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

                    let fee = '';
                    let feeCurrency = '';

                    //variant that includes fee
                    if (!isV4 && (unpacked.events.length == 8 || unpacked.events.length == 6)) {
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
                let chain = this.web3.toUtf8(unpacked.events[1].value);
                let chainAddr = this.web3.toUtf8(unpacked.events[2].value);
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
                let chain = this.web3.toUtf8(unpacked.events[1].value);
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
            //ETH deposit/withdraw  etherdelta/decentrex, idex, enclaves 
            else if (unpacked.events.length >= 4 && (unpacked.name == 'Deposit' || unpacked.name == 'Withdraw')) {

                var type = unpacked.name;
                var token = this.setToken(unpacked.events[0].value);
                var user = unpacked.events[1].value;
                var rawAmount = unpacked.events[2].value;
                var rawBalance = unpacked.events[3].value;
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
            // token burn, mint  (also used for WETH)
            else if (unpacked.name == 'Destruction' || unpacked.name == 'Issuance') {
                let token = this.setToken(unpacked.address);
                let amount = '';
                if (token) {
                    amount = utility.weiToEth(new BigNumber(unpacked.events[0].value));
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

                let makerAmount = new BigNumber(unpacked.events[4].value);
                let takerAmount = new BigNumber(unpacked.events[5].value);

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
                    amount = new BigNumber(1);
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
                    amount = new BigNumber(1);
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
                let exchange = this.getExchangeName(unpacked.address, '');

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
                let exchange = this.getExchangeName(unpacked.address, '');

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

                    let price = new BigNumber(0);
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
                            + '</td></tr><tr><td>' + utility.tokenStoreURL(token, true)
                            + '</td><td>' + utility.ddexURL(token, true)
                            + '</td></tr><tr><td>' + utility.radarURL(token, true)
                            + '</td><td>' + utility.kyberURL(token, true)
                            + '</td></tr><tr><td>' + utility.etherDeltaURL(token, true)
                            + '</td><td></td></tr></table>';
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
