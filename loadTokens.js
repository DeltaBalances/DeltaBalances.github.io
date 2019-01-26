// Updated lists of tokens listed on exchanges, overrides tokens in backupTokens.js
var exchangeTokens = {
    // etherdelta:[],  // not updated in a year
    forkdelta: [],  // new domain CORS protection
    idex: [],
    ddex: [],
    radar: [],
    kyber: [],
    tokenstore: [],
};

// unknown tokens found in a previous session
var unknownTokenCache = [];

//limit scope
{
    //output retrieved tokens in the console
    let logTokens = false;
    let loadCounter = 0;

    loadCache();
    function loadCache() {
        let cached = localStorage.getItem('exchangeTokens');
        if (cached && cached.length > 0) {
            try {
                let temp = JSON.parse(cached);
                if (temp && temp.idex) {
                    exchangeTokens = temp;
                }
            } catch (e) {
                console.log('could not load tokens from localstorage');
            }
        }
    }

    /* //not updated for a year
    getTokens('https://etherdelta.github.io/site/config/main.json', 'etherdelta', function(json) {
        if(json) {
            return json.tokens;
        } else {
            return [];
        }
    });
    */

    /* // CORS issue on new domain
    getTokens('https://forkdelta.app/config/main.json', 'forkdelta', function(json) {
        if(json) {
            return json.tokens;
        } else {
            return [];
        }
    });
    */

    getTokens("https://api.idex.market/returnCurrencies", 'idex', function (data) {
        if (data) {
            let tokens = [];
            Object.keys(data).forEach(function (key) {
                let token = data[key];
                tokens.push({ symbol: key, decimals: token.decimals, address: token.address.trim(), name: token.name });
            });
            return tokens;
        } else {
            return [];
        }
    });

    getTokens('https://api.ddex.io/v3/tokens', 'ddex', function (jsonData) {
        if (jsonData && jsonData.data && jsonData.data.tokens) {
            let tokens = jsonData.data.tokens;
            tokens.map((x) => { delete x.id; });
            return tokens;
        } else {
            return [];
        }
    });

    getTokens('https://api.radarrelay.com/v2/tokens', 'radar', function (jsonData) {
        if (jsonData && jsonData.length > 0) {
            jsonData = jsonData.filter((x) => { return x.active; });
            return jsonData.map((x) => { return { symbol: x.symbol, address: x.address, decimals: x.decimals, name: x.name } });
        } else {
            return [];
        }
    });

    getTokens('https://tracker.kyber.network/api/tokens/supported', 'kyber', function (jsonData) {
        if (jsonData && jsonData.length > 0) {
            jsonData = jsonData.filter((x) => { return x.contractAddress !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' });
            return jsonData.map((x) => { return { symbol: x.symbol, address: x.contractAddress, decimals: x.decimals, name: x.name } });
        } else {
            return [];
        }
    });

    function getTokens(url, name, parseResponseFunc) {
        try {
            // only get live tokens if we haven't saved them this session already

            // try session storage first
            let sessionData = sessionStorage.getItem('exchangeTokensLoaded');
            if (!logTokens && sessionData !== undefined && sessionData && Number(sessionData) >= 4) {
                // don't load tokens, we known them from this session
            } else {

                // update session data for the next time, but don't wait for this to be loaded
                $.getJSON(url, function (jsonData) {
                    loadCounter++;
                    sessionStorage.setItem('exchangeTokensLoaded', loadCounter);
                    if (parseResponseFunc) {
                        jsonData = parseResponseFunc(jsonData);
                    }
                    if (jsonData && jsonData.length > 0) {
                        //filter out ETH, wasted space
                        jsonData = jsonData.filter((x) => { return x.contractAddress !== '0x0000000000000000000000000000000000000000' });
                        exchangeTokens[name] = jsonData;
                        let string = JSON.stringify(exchangeTokens);
                        localStorage.setItem('exchangeTokens', string);

                        //output to console
                        if (logTokens) {
                            console.log(name);
                            let string2 = JSON.stringify(exchangeTokens[name]);
                            console.log(string2);
                        }
                        console.log('updated ' + name + ' token listings.');
                    }
                });
            }
        } catch (err) {
            console.log(name + ' loading error ' + err);
        }
    }

    //get unknown token cache from previous session
    try {
        let tokenData = localStorage.getItem('unknownTokens1');
        if (tokenData !== null && tokenData) {
            let parsed = JSON.parse(tokenData);
            if (parsed && parsed.length > 0) {
                unknownTokenCache = parsed;
                if (logTokens) {
                    let string = JSON.stringify(unknownTokenCache);
                    console.log('unknown cache');
                    console.log(string);
                }
            }
        }
    } catch (err) {
        console.log('unknown tokens loading error ' + err);
    }

    //delete data from old cache format
    deleteLegacy('forkTokens');
    deleteLegacy('idexTokens');
    deleteLegacy('ddexTokens');
    deleteLegacy('radarTokens');
    deleteLegacy('kyberTokens');

    //remove old format of token cache
    function deleteLegacy(name) {
        try {
            localStorage.removeItem(name + '2');
            sessionStorage.removeItem(name + '1');
        } catch (e) { }
    }

}