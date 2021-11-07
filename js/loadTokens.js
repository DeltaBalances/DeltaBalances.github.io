/* Load lists of (erc20) tokens from exchanges and cache, to update and append the list of known tokens in backupTokens.js 
   Globals are used in deltabalances.js initTokens()
*/

// List of tokens per exchange
var exchangeTokens = {
    //forkdelta: [],  // new domain CORS protection
    idex: [],
    ddex: [],
    kyber: [],
    oneinch: [],
};

// unknown tokens found in a previous session
var unknownTokenCache = [];

//limit scope
{

    // set unknownTokenCache from localStorage, ensures we load cached tokens from old sessions.
    try {
        let tokenData = localStorage.getItem('unknownTokens1');
        if (tokenData !== null && tokenData) {
            let parsed = JSON.parse(tokenData);
            if (parsed && parsed.length > 0) {
                unknownTokenCache = parsed;
            }
        }
    } catch (err) {
        console.log('unknown tokens loading error ' + err);
    }


    // last update time for exchange token lists, default to the past
    let exchangeUpdates = {
        // forkdelta: 0,
        idex: 0,
        ddex: 0,
        kyber: 0,
        oneinch: 0,
    };


    // load known tokens for filtering exchange tokens below
    let backupTokens = {};
    if (offlineCustomTokens) { //hardcoded list of known tokens from backuptokens.js
        try {
            for (let i = 0; i < offlineCustomTokens.length; i++) {
                backupTokens[offlineCustomTokens[i].a.toLowerCase()] = offlineCustomTokens[i];
            }
        } catch (e) { }
    }

    loadExchangeCache();




    /* async API calls from here, the site won't stall with loading for these (slow requests) to finish.
       Tokens loaded too late are added to the cache and used on a next page load.
    */


    // CORS issue on new domain
    /* getTokens('https://cors.io/?https://forkdelta.app/config/main.json', 'ForkDelta', function (json) {
         if (json && json.tokens) {
             let tokens = json.tokens;
             tokens.map(x => { x.address = x.addr.toLowerCase() });
             return tokens;
         } else {
             return [];
         }
     });
     */


    getTokens("https://api.idex.io/v1/assets", 'IDEX', function (data) {
        if (data && Array.isArray(data)) {
            let tokens = [];
            data.forEach(function (token) {
                tokens.push({ symbol: token.symbol, decimals: token.assetDecimals, address: token.contractAddress.trim().toLowerCase(), name: token.name });
            });
            return tokens;
        } else {
            return [];
        }
    });

    // legacy.ddex.io , TOOD fix for new ddex https://api.ddex.io/v4/markets
    getTokens('https://api.ddex.io/v3/tokens', 'DDEX', function (jsonData) {
        if (jsonData && jsonData.data && jsonData.data.tokens) {
            let tokens = jsonData.data.tokens;
            tokens.map((x) => { delete x.id; x.address = x.address.toLowerCase() });
            return tokens;
        } else {
            return [];
        }
    });

    getTokens('https://api.kyber.network/currencies', 'Kyber', function (jsonData) {
        if (jsonData && !jsonData.error && jsonData.data && jsonData.data.length > 0) {
            let tokens = jsonData.data.filter((x) => { return x.address !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' });
            return tokens.map((x) => { return { symbol: x.symbol, address: x.address.toLowerCase(), decimals: x.decimals, name: x.name } });
        } else {
            return [];
        }
    });

    getTokens('https://api.1inch.exchange/v3.0/1/tokens', "OneInch", function (jsonData) {
        let tokens = [];
        if (jsonData && jsonData.tokens) {
            tokens = Object.values(jsonData.tokens);
            tokens = tokens.map(tok => { return { symbol: tok.symbol, address: tok.address.toLowerCase(), decimals: Number(tok.decimals), name: tok.name }; });
        }
        return tokens;
    });

    /*
    getTokens('https://api-v2.dex.ag/token-list-full', "DEX.AG", function (jsonData) {
        let tokens = [];
        if (jsonData) {
            tokens = Object.values(jsonData);
            tokens = tokens.map(tok => {
                let duplicate = " (" + tok.symbol + ")";
                tok.name = tok.name.replace(duplicate, "");
                return { symbol: tok.symbol, address: tok.address.toLowerCase(), decimal: Number(tok.decimals), name: tok.name };
            });
        }
        return tokens;
    }); */





    //load saved exchange tokens from local storage
    function loadExchangeCache() {
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
        //load last update times from localstorage
        let dates = localStorage.getItem('exchangeUpdates');
        if (dates && dates.length > 0) {
            try {
                let temp = JSON.parse(dates);
                if (temp && temp.idex) {
                    exchangeUpdates = temp;
                }
            } catch (e) {
                console.log('could not load update times from localstorage');
            }
        }
    }

    // function to handle loading lists of tokens from various exchange APIs
    function getTokens(url, name, parseResponseFunc) {
        try {

            let lcName = name.toLowerCase();
            // if we updated this list in the last 6 hours, skip the check
            if (exchangeUpdates[lcName] && (Number(exchangeUpdates[lcName]) > Date.now() - 21600000)) { // 6*60*60*1000 milliseconds
                // don't load new tokens
            } else {

                //save update time, even if request fails.
                exchangeUpdates[lcName] = Date.now();
                localStorage.setItem('exchangeUpdates', JSON.stringify(exchangeUpdates));

                // update session data for the next time, but don't wait for this to be loaded
                $.getJSON(url, function (jsonData) {
                    //parse token data for this response
                    if (parseResponseFunc) {
                        jsonData = parseResponseFunc(jsonData);
                    }
                    if (jsonData && jsonData.length > 0) {
                        //filter out tokens that are already hardcoded
                        jsonData = jsonData.filter((x) => { return !(backupTokens[x.address] && backupTokens[x.address][name]) });
                        exchangeTokens[lcName] = jsonData;
                        let string = JSON.stringify(exchangeTokens);
                        localStorage.setItem('exchangeTokens', string);
                        console.log('updated ' + name + ' token listings.');
                    }
                });
            }
        } catch (err) {
            console.log(name + ' loading error ' + err);
        }
    }

}