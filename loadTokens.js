// try to get updated token list from ForkDelta, IDEX, DDEX and Radar Relay, otherwise use own backup
// EtherDelta disabled due to token update inactivity

var etherDeltaConfig = { tokens: [] };

//output retrieved tokens in the console
var logTokens = false;

// dont get live etherdelta tokens, as they haven't been changed in >3 months
/*
try {
		$.getJSON('https://etherdelta.github.io/config/main.json', function(jsonData) {
			if(jsonData && jsonData.tokens) {
				etherDeltaConfig = jsonData;
			}
		});
	} catch (err){} 
*/

var forkDeltaConfig = { tokens: [] };
try {

    let forkData = sessionStorage.getItem('forkTokens1');
    // only get live tokens if we haven't saved them this session already
    if (forkData !== undefined && forkData) {
        let parsed = JSON.parse(forkData);
        if (parsed && parsed.length > 0) {
            forkDeltaConfig.tokens = parsed;
        }
    } else {

        // if we have saved data from a previous session, pre-load it
        let forkData2 = localStorage.getItem('forkTokens2');
        if (forkData2 !== undefined && forkData2) {
            let parsed = JSON.parse(forkData2);
            if (parsed && parsed.length > forkDeltaConfig.length) {
                forkDeltaConfig.tokens = parsed;
            }
        }

        $.getJSON('https://forkdelta.github.io/config/main.json', function (jsonData) {
            if (jsonData && jsonData.tokens && jsonData.tokens.length > 0) {
                forkDeltaConfig = jsonData;
                let string = JSON.stringify(forkDeltaConfig.tokens);
                sessionStorage.setItem('forkTokens1', string);
                localStorage.setItem('forkTokens2', string);
                if(logTokens) {
                    console.log('fork');
                    console.log(string);
                }
            }
        });
    }
} catch (err) {
    console.log('forkdelta live tokens loading error ' + err);
}

var idexConfig = [];
try {
    let idexData = sessionStorage.getItem('idexTokens1');
    // only get live tokens if we haven't saved them this session already
    if (idexData !== undefined && idexData) {
        let parsed = JSON.parse(idexData);
        if (parsed && parsed.length > 0) {
            idexConfig = parsed;
        }
    } else {

        // if we have saved data from a previous session, pre-load it
        let idexData2 = localStorage.getItem('idexTokens2');
        if (idexData2 !== undefined && idexData2) {
            let parsed = JSON.parse(idexData2);
            if (parsed && parsed.length > idexConfig.length) {
                idexConfig = parsed;
            }
        }

        $.post("https://api.idex.market/returnCurrencies", function (data) {
            if (data) {
                let tokens = [];
                Object.keys(data).forEach(function (key) {
                    var token = data[key];
                    tokens.push({ name: key, decimals: token.decimals, addr: token.address.trim(), name2: token.name });
                });
                if (tokens && tokens.length > 0) {
                    idexConfig = tokens;
                    let string = JSON.stringify(idexConfig)
                    sessionStorage.setItem('idexTokens1', string);
                    localStorage.setItem('idexTokens2', string);
                    if(logTokens) {
                        console.log('idex');
                        console.log(string);
                    }
                }
            }
        });
    }
} catch (err) {
    console.log('IDEX live tokens loading error ' + err);
}

var ddexConfig = [];
try {

    let ddexData = sessionStorage.getItem('ddexTokens1');
    // only get live tokens if we haven't saved them this session already
    if (ddexData !== undefined && ddexData) {
        let parsed = JSON.parse(ddexData);
        if (parsed && parsed.length > 0) {
            ddexConfig.tokens = parsed;
        }
    } else {

        // if we have saved data from a previous session, pre-load it
        let ddexData2 = localStorage.getItem('ddexTokens2');
        if (ddexData2 !== undefined && ddexData2) {
            let parsed = JSON.parse(ddexData2);
            if (parsed && parsed.length > ddexConfig.length) {
                ddexConfig.tokens = parsed;
            }
        }

        $.getJSON('https://api.ddex.io/v2/tokens', function (jsonData) {
            if (jsonData && jsonData.data && jsonData.data.tokens && jsonData.data.tokens.length > 0) {
                ddexConfig = jsonData.data;
                ddexConfig.tokens.map((x) => { delete x.id; delete x.name; });
                let string = JSON.stringify(ddexConfig.tokens);
                sessionStorage.setItem('ddexTokens1', string);
                localStorage.setItem('ddexTokens2', string);
                if(logTokens) {
                    console.log('ddex');
                    console.log(string);
                }
            }
        });
    }
} catch (err) {
    console.log('ddex live tokens loading error ' + err);
}

var radarConfig = [];
try {

    let radarData = sessionStorage.getItem('radarTokens1');
    // only get live tokens if we haven't saved them this session already
    if (radarData !== undefined && radarData) {
        let parsed = JSON.parse(radarData);
        if (parsed && parsed.length > 0) {
            radarConfig = parsed;
        }
    } else {

        // if we have saved data from a previous session, pre-load it
        let radarData2 = localStorage.getItem('radarTokens2');
        if (radarData2 !== undefined && radarData2) {
            let parsed = JSON.parse(radarData2);
            if (parsed && parsed.length > radarConfig.length) {
                radarData2 = parsed;
            }
        }

        $.getJSON('https://api.radarrelay.com/v0/tokens', function (jsonData) {
            if (jsonData && jsonData.length > 0) {
                jsonData = jsonData.filter((x) => { return x.active; });
                radarConfig = jsonData.map((x) => { return { symbol: x.symbol, address: x.address, decimals: x.decimals, name: x.name } });
                let string = JSON.stringify(radarConfig);
                sessionStorage.setItem('radarTokens1', string);
                localStorage.setItem('radarTokens2', string);
                if(logTokens) {
                    console.log('radar');
                    console.log(string);
                }
            }
        });
    }
} catch (err) {
    console.log('radar relay live tokens loading error ' + err);
}


var kyberConfig = [];
try {

    let kyberData = sessionStorage.getItem('kyberTokens1');
    // only get live tokens if we haven't saved them this session already
    if (kyberData !== undefined && kyberData) {
        let parsed = JSON.parse(kyberData);
        if (parsed && parsed.length > 0) {
            kyberConfig = parsed;
        }
    } else {

        // if we have saved data from a previous session, pre-load it
        let kyberData2 = localStorage.getItem('kyberTokens2');
        if (kyberData2 !== undefined && kyberData2) {
            let parsed = JSON.parse(kyberData2);
            if (parsed && parsed.length > kyberConfig.length) {
                kyberData2 = parsed;
            }
        }

        $.getJSON('https://tracker.kyber.network/api/tokens/supported', function (jsonData) {
            if (jsonData && jsonData.length > 0) {
                jsonData = jsonData.filter((x) => { return x.contractAddress !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'});
                kyberConfig = jsonData.map((x) => { return { symbol: x.symbol, address: x.contractAddress, decimals: x.decimals, name: x.name } });
                let string = JSON.stringify(kyberConfig);
                sessionStorage.setItem('kyberTokens1', string);
                localStorage.setItem('kyberTokens2', string);
                if(logTokens) {
                    console.log('kyber');
                    console.log(string);
                }
            }
        });
    }
} catch (err) {
    console.log('kyber tokens loading error ' + err);
}



var unknownTokenCache = [];
try {
    let tokenData = localStorage.getItem('unknownTokens1');
    if (tokenData !== null && tokenData) {
        let parsed = JSON.parse(tokenData);
        if (parsed && parsed.length > 0) {
            unknownTokenCache = parsed;
            if(logTokens) {
                let string = JSON.stringify(unknownTokenCache);
                console.log('unknown cache');
                console.log(string);
            }
        }
    }
} catch (err) {
    console.log('unknown tokens loading error ' + err);
}