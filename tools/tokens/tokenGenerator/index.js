"use strict"

const request = require('request');
const fs = require('fs');
const dbTokens = require('../../../backupTokens.js');
const exchangeTokens = require('./exchangeTokens.js');


const loadTopTokens = true;
const zeroAddr = "0x0000000000000000000000000000000000000000";

//object that will contain all tokens { address : {address, symbol,decimals,name}}
let allTokens = {};
let badTokens = {};
let alerts = {};

const key = /*'freeKey'*/ 'enrrf9840PPmQ31';

const minHolders = 10; // ignore tokens with less holders
const requiredHolders = 150; // mark tokens with less than this with '.blocked:1'

// (exchange) addresses that hold a high variety of tokens
const addresses = [
    //some dex contracts with deposits
    "0x8d12a197cb00d4747a1fe03395095ce2a5cc6819", // EtherDelta
    "0x1ce7ae555139c5ef5a57cc8d814a867ee6ee33d8", // TokenStore
    "0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208", // IDEX
    "0x7600977eb9effa627d6bd0da2e5be35e11566341", // Dex.top
    "0x13f64609bf1ef46f6515f8cd3115433a93a00dc6", // Saturn (for erc223?)
    "0xba3ed686cc32ffa8664628b1e96d8022e40543de", // switcheo

    "0x61b9898c9b60a159fc91ae8026563cd226b7a0c1", // Ethfinex admin
    "0x71c7656ec7ab88b098defb751b7401b5f6d8976f", // Etherscan donate
    "0xdecaf9cd2367cdbb726e904cd6397edfcae6068d", // MEW donate
    "0x4bbeeb066ed09b7aed07bf39eee0460dfa261520", // MyCrypto donate

    "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be", // Binance1
    "0xd551234ae421e3bcba99a0da6d736074f22192ff", // Binance2
    "0x2b5634c42055806a59e9107ed44d43c426e58258", // Kucoin1
    "0x689c56aef474df92d44a1b70850f808488f9769c", // Kucoin2
];


init();

async function init() {
    addDbTokens();

    let initCount = Object.keys(allTokens).length;
    console.log('starting with ' + initCount + ' known tokens');

    let lastCount = initCount;
    let criteria = ['trade', 'cap', 'count'];

    if (loadTopTokens) {
        console.log('loading top Ethplorer tokens');
        for (let i = 0; i < criteria.length; ++i) {
            let res = await addEthplorerTokensTop(criteria[i]);
            if (!res) {
                console.log('failed to load top - ' + criteria[i] + ' tokens');
            } else {
                let count = Object.keys(allTokens).length;
                if (count > lastCount) {
                    console.log('Added ' + (count - initCount) + ' tokens by ' + criteria[i]);
                } else {
                    console.log('Added 0 tokens by ' + criteria[i]);
                }
                lastCount = count;
            }
            await wait(500); // wait 500ms to no stress API
        }
    }

    console.log('loading tokens by address...');

    for (let i = 0; i < addresses.length; ++i) {
        let res = await addEthplorerTokens(addresses[i]);
        if (!res) {
            console.log('failed to load ' + addresses[i] + ' tokens');
        } else {
            let count = Object.keys(allTokens).length;
            if (count > lastCount) {
                console.log('Added ' + (count - initCount) + ' tokens by ' + addresses[i]);
            } else {
                console.log('Added 0 tokens by ' + addresses[i]);
            }
            lastCount = count;
        }
        await wait(500); // wait 500ms to no stress API
    }

    let endCount = Object.keys(allTokens).length;
    console.log('finished Ethplorer tokens, ' + endCount);

    console.log('loading DEX listed tokens');
    await loadListedTokens();
    addFixedListedTokens();

    endCount = Object.keys(allTokens).length;
    console.log('finished DEX tokens, ' + endCount);

    let badCount = Object.keys(badTokens).length;

    let tokenList = Object.values(allTokens);
    tokenList.map(x => {
        if (x.symbol === x.name) {
            delete x.name;
        }
        return x;
    });
    tokenList = tokenList.sort(function (a, b) {
        return (a.symbol + a.address).localeCompare(b.symbol + b.address);
    });
    let badTokenList = Object.values(badTokens);
    badTokenList = badTokenList.sort(function (a, b) {
        return (a.symbol + a.address).localeCompare(b.symbol + b.address);
    });

    writeJsonToFile('tokens.txt', tokenList);
    writeJsonToFile('badtokens.txt', badTokenList);
    writeJsonToFile('alerts.txt', alerts);

    await wait(1000);
}

function addDbTokens() {
    let tokens = dbTokens.offlineCustomTokens;
    for (let i = 0; i < tokens.length; i++) {
        let tok = tokens[i];
        if (tok) {
            let token = parseKnownToken(tok);
            if (!allTokens[token.address]) {
                allTokens[token.address] = token;
            }
        }
    }
}

// parse tokens already in the correct format
function parseKnownToken(tok) {
    let token = {
        symbol: escapeHtml(tok.symbol),
        address: tok.address.toLowerCase(),
        decimal: Number(tok.decimal),
        name: undefined,
    };
    if (tok.name) {
        token.name = tok.name;//escapeHtml(tok.name);
    } else {
        delete token.name;
    }
    if (tok.locked) {
        token.locked = true;
    }
    if (tok.old) {
        token.old = true;
    }
    if (tok.killed) {
        token.killed = true;
    }
    if (tok.blocked) {
        token.blocked = Number(tok.blocked);
    }
    if (tok.spam) {
        token.spam = true;
    }
    if (tok.blockFork) {
        token.blockFork = true;
    }
    if (tok.Binance) {
        token.Binance = tok.Binance;
    }
    return token;
}

// add listed attributes for exchanges that have a fixed list
function addFixedListedTokens() {
    let exTokensObj = exchangeTokens.listedTokens;
    let exchanges = Object.keys(exTokensObj);
    //loop over exchanges
    for (let i = 0; i < exchanges.length; ++i) {
        let ex = exchanges[i];
        let tokens = exTokensObj[ex];
        //loop over token for that exchange
        for (let j = 0; j < tokens.length; j++) {
            let token = tokens[j];
            token.address = token.address.toLowerCase();
            token.symbol = escapeHtml(token.symbol);
            if (allTokens[token.address]) {
                allTokens[token.address][ex] = token.symbol;
            }
        }
    }
}

async function loadListedTokens() {

    await getTokens('https://forkdelta.app/config/main.json', 'ForkDelta', function (json) {
        let tokens = [];
        if (json && json.tokens) {
            json.tokens.forEach(x => {
                let token = {
                    symbol: x.name,
                    address: x.addr,
                    decimal: x.decimals,
                    name: x.fullName
                };
                tokens.push(token);
            });
        }
        return tokens;
    }, 'blockFork');


    await getTokens("https://api.idex.market/returnCurrencies", 'IDEX', function (data) {
        let tokens = [];
        if (data) {
            Object.keys(data).forEach(function (key) {
                let token = data[key];
                tokens.push({ symbol: key, decimal: token.decimals, address: token.address, name: token.name });
            });
        }
        return tokens;
    }, 'blockIDEX');

    await getTokens('https://api.ddex.io/v3/tokens', 'DDEX', function (jsonData) {
        let tokens = [];
        if (jsonData && jsonData.data && jsonData.data.tokens) {
            jsonData.data.tokens.forEach((x) => {
                let token = {
                    symbol: x.symbol,
                    address: x.address,
                    decimal: x.decimals,
                    name: x.name
                };
                tokens.push(token);
            });
        }
        return tokens;
    });

    await getTokens('https://api.radarrelay.com/v2/tokens', 'Radar', function (jsonData) {
        let tokens = [];
        if (jsonData && jsonData.length > 0) {
            jsonData = jsonData.filter((x) => { return x.active; });
            tokens = jsonData.map((x) => { return { symbol: x.symbol, address: x.address, decimal: x.decimals, name: x.name } });
        }
        return tokens;
    });

    await getTokens('https://api.kyber.network/currencies', 'Kyber', function (jsonData) {
        let tokens = [];
        if (jsonData && !jsonData.error && jsonData.data && jsonData.data.length > 0) {
            tokens = jsonData.data.filter((x) => { return x.address !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' });
            tokens = tokens.map((x) => { return { symbol: x.symbol, address: x.address, decimal: x.decimals, name: x.name } });
        }
        return tokens;
    });

    await getTokens('https://v1-1.api.token.store/ticker', 'TokenStore', function (jsonData) {
        let tokens = [];
        if (jsonData) {
            tokens = Object.values(jsonData).map(tok => { return { symbol: tok.symbol, address: tok.tokenAddr, decimal: -1 } });
        }
        return tokens;
    });

    async function getTokens(url, exchange, parseFunc, ignoreKey = undefined) {
        let data = await getJson(url);
        if (data) {
            let tokens = undefined;
            if (parseFunc) {
                tokens = parseFunc(data);
            } else {
                tokens = data;
            }
            if (tokens && tokens.length > 0) {
                //cleanup and format tokens
                tokens = tokens.forEach(token => {
                    token.symbol = escapeHtml(token.symbol);
                    token.address = token.address.toLowerCase();
                    token.decimal = Number(token.decimal);
                    if (token.name) {
                        token.name = escapeHtml(token.name);
                    }

                    let ignoreListing = false;
                    if (exchange) {
                        if ((ignoreKey && allTokens[token.address] && allTokens[token.address][ignoreKey])) {
                            ignoreListing = true;
                        } else {
                            token[exchange] = token.symbol;
                        }
                    }

                    if (!allTokens[token.address]) {
                        if (token.decimal >= 0) {
                            allTokens[token.address] = token;
                        } else {
                            badTokens[token.address] = token;
                        }
                    } else if (allTokens[token.address]) {
                        if (!ignoreListing) {
                            allTokens[token.address][exchange] = token.symbol;
                        }
                        if (!allTokens[token.address].name && token.name) {
                            allTokens[token.address].name = token.name;
                        }
                    }
                });
                console.log('loaded ' + exchange + ' tokens');
            } else {
                console.log('empty token list ' + exchange);
            }
        } else {
            console.log('failed to load ' + exchange + ' tokens');
        }
    }
}

function writeJsonToFile(filename, json) {
    let str = JSON.stringify(json);
    //fix formatting in file
    str = str.replace(/},/g, '},\n  ');
    str = str.replace('[{', '[\n  {');
    str = str.replace('}]', '},\n]');

    // remove some "
    str = str.replace(/"address"/g, 'address');
    str = str.replace(/"symbol"/g, 'symbol');
    str = str.replace(/"decimal"/g, 'decimal');
    str = str.replace(/"name"/g, 'name');
    str = str.replace(/"locked"/g, 'locked');
    str = str.replace(/"blocked"/g, 'blocked');
    str = str.replace(/"killed"/g, 'killed');
    str = str.replace(/"old"/g, 'old');
    str = str.replace(/"spam"/g, 'spam');
    str = str.replace(/"blockIDEX"/g, 'blockIDEX');
    str = str.replace(/"blockFork"/g, 'blockFork');
    str = str.replace(/"Binance"/g, 'Binance');
    str = str.replace(/"EtherDelta"/g, 'EtherDelta');
    str = str.replace(/"ForkDelta"/g, 'ForkDelta');
    str = str.replace(/"IDEX"/g, 'IDEX');
    str = str.replace(/"DDEX"/g, 'DDEX');
    str = str.replace(/"Radar"/g, 'Radar');
    str = str.replace(/"Kyber"/g, 'Kyber');
    str = str.replace(/"TokenStore"/g, 'TokenStore');
    str = str.replace(/{ /g, '{');
    str = str.replace(/ }/g, '}');
    str = str.replace(/, /g, ',');
    str = str.replace(/: /g, ':');

    str = str.replace(/name:Kyber/g, 'name:"Kyber"');
    str = str.replace(/name:IDEX/g, 'name:"IDEX"');
    str = str.replace(/symbol:IDEX/g, 'symbol:"IDEX"');

    fs.writeFile(filename, str, function (err) {
        if (err) {
            console.log('failed to save ' + filename);
        } else {
            console.log('saved ' + filename);
        }
    });
}

async function addEthplorerTokens(address) {
    if (address) {
        let response = await getJson('https://api.ethplorer.io/getAddressInfo/' + address + '?apiKey=' + key);
        if (response) {
            return addEthplorerTokensInternal(response);
        }
    }
    return false;
}

// 'trade', 'cap', 'count'
async function addEthplorerTokensTop(sort = 'trade') {
    if (sort) {
        let response = await getJson('http://api.ethplorer.io/getTop?criteria=' + sort + '&apiKey=' + key);
        if (response) {
            return addEthplorerTokensInternal(response);
        }
    }
    return false;
}


// get all token for 'address' and add them to 'allTokens'/'badTokens'
async function addEthplorerTokensInternal(response) {

    if (response && response.tokens) {

        for (let i = 0; i < response.tokens.length; ++i) {
            let tokenResponse = response.tokens[i];
            let tok = undefined;
            if (tokenResponse.address && tokenResponse.symbol) {
                tok = tokenResponse;
            } else if (tokenResponse.tokenInfo) {
                tok = response.tokens[i].tokenInfo;
            } else {
                console.log('bad ethplorer return format');
                break;
            }

            let addr = tok.address.toLowerCase();
            if (addr == zeroAddr) {
                continue;
            }

            let tokenObj = { symbol: escapeHtml(tok.symbol), address: addr, decimal: Number(tok.decimals) };
            if (tok.name) {
                tokenObj.name = escapeHtml(tok.name);
            }
            // do we know this token?
            if (!allTokens[addr]) {
                if (tok.alert) {
                    alerts[addr] = tok.alert;
                }
                // any real token has balance > 10 and less than totalsupply in 1 contract
                if (tok.symbol && (!tokenResponse.tokenInfo ||
                    (tokenResponse.balance > 10 && tokenResponse.balance < (Number(tok.totalSupply) / 2))
                )) {

                    // tokens with known holders count are interesting
                    if (tok.holdersCount) {
                        if (tok.holdersCount > minHolders) {
                            if (tok.holdersCount <= requiredHolders) {
                                tokenObj.blocked = 1; // block for balance loading below 'requiredHolders' users
                            }
                            addToken(tokenObj, allTokens);
                        } else {
                            addToken(tokenObj, badTokens);
                        }
                    } else if (tok.price) {
                        //tokens with a known price trade somewhere, add those too
                        addToken(tokenObj, allTokens);
                    } else if (!badTokens[addr]) { // no price or holders, mark as bad
                        addToken(tokenObj, badTokens);
                    }
                } else {
                    addToken(tokenObj, badTokens);
                }
            } else {
                //alert that isn't known yet
                if (tok.alert && !allTokens[addr].old && !allTokens[addr].locked) {
                    alerts[addr] = tok.alert;
                }
                if (tok && tok.holdersCount) {
                    if (Number(tok.holdersCount) < requiredHolders) {
                        tokenObj.blocked = 1;
                        addToken(tokenObj, allTokens); // update blocked status
                    }
                }
            }
            return true;
        }
    } else {
        return false;
    }

    function addToken(tokenObj, collection) {
        if (tokenObj && collection) {
            let addr = tokenObj.address;
            if (!collection[addr]) {
                collection[addr] = tokenObj;
            } else {
                // we already know the token, see if we can update any data
                let knownToken = collection[addr];
                //bad symbol
                if (knownToken.symbol !== tokenObj.symbol) {
                    knownToken.symbol = tokenObj.symbol;
                }
                // add name
                if (!knownToken.name && tokenObj.name && tokenObj.symbol !== tok.name) {
                    knownToken.name = tokenObj.name;
                }
                //fix incorrect decimals
                if (knownToken.decimal !== tokenObj.decimal) {
                    if (addr !== "0xecf8f87f810ecf450940c9f60066b4a7a501d6a7") // old MKR WETH reports bad decimals
                        knownToken.decimal = tokenObj.decimal;
                }
                if (knownToken.blocked === 1 && !tokenObj.blocked) {
                    delete knownToken.blocked;
                } else if (tokenObj.blocked && !knownToken.blocked) {
                    knownToken.blocked = tokenObj.blocked;
                }

                collection[addr] = knownToken;
            }
        }
    }
}

async function getJson(url) {
    let options = {
        headers: {
            'Content-Type': 'application/json'
        },
        uri: url,
        method: 'GET',
        json: true,
    };

    return new Promise(resolve => {
        request(options, function (error, response, body) {
            if (typeof body === 'object') {
                resolve(body);
                return;
            }
            resolve(undefined);
            return;
        });
    });
}


function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}


function escapeHtml(text) {
    var map = {
        //'&': '&amp;',
        '<': '',
        '>': '',
        '"': '',
        "'": '',
        "{": '',
        "}": '',
    };

    return text.replace(/[&<>"']/g, function (m) { return map[m]; }).trim();
}

//parse html codes .replace(/&#(\d{0,4});/g, function(fullStr, str) { return String.fromCharCode(str); });