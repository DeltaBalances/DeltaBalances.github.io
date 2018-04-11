// try to get updated token list from EtherDelta, ForkDelta and IDEX otherwise use own backup

var etherDeltaConfig = offlineTokens;
var stagingTokens = offlineStagingTokens;

// dont get live etherdelta tokens, as they haven't been changed in >3 months
/*
try {
		$.getJSON('https://etherdelta.github.io/config/main.json', function(jsonData) {
			if(jsonData && jsonData.tokens) {
				etherDeltaConfig = jsonData;
			}
		});
	} catch (err){} 
try {
		$.getJSON('https://etherdelta.github.io/config/staging.json', function(jsonData) {
			if(jsonData && jsonData.tokens) {
				stagingTokens = jsonData;
			}
		});
	} catch (err) {} 
*/


var forkDeltaConfig = forkOfflineTokens;
try {

    let forkData = sessionStorage.getItem('forkTokens1');
    // only get live tokens if we haven't saved them this session already
    if (forkData !== null && forkData) {
        let parsed = JSON.parse(forkData);
        if (parsed && parsed.length > 0) {
            forkDeltaConfig.tokens = parsed;
        }
    } else {

        // if we have saved data from a previous session, pre-load it
        let forkData2 = localStorage.getItem('forkTokens2');
        if (forkData2 !== null && forkData2) {
            let parsed = JSON.parse(forkData2);
            if (parsed && parsed.length > forkDeltaConfig.length) {
                forkDeltaConfig.tokens = parsed;
            }
        }

        $.getJSON('https://forkdelta.github.io/config/main.json', function (jsonData) {
            if (jsonData && jsonData.tokens && jsonData.tokens.length > 0) {
                forkDeltaConfig = jsonData;
                sessionStorage.setItem('forkTokens1', JSON.stringify(forkDeltaConfig.tokens));
                localStorage.setItem('forkTokens2', JSON.stringify(forkDeltaConfig.tokens));
            }
        });
    }
} catch (err) {
    console.log('forkdelta live tokens loading error ' + err);
}


var idexConfig = idexOfflineTokens;
try {
    let idexData = sessionStorage.getItem('idexTokens1');
    // only get live tokens if we haven't saved them this session already
    if (idexData !== null && idexData) {
        let parsed = JSON.parse(idexData);
        if (parsed && parsed.length > 0) {
            idexConfig = parsed;
        }
    } else {

        // if we have saved data from a previous session, pre-load it
        let idexData2 = localStorage.getItem('idexTokens2');
        if (idexData2 !== null && idexData2) {
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
                    tokens.push({ name: key, decimals: token.decimals, addr: token.address.trim() });
                });
                if (tokens && tokens.length > 0) {
                    idexConfig = tokens;
                    sessionStorage.setItem('idexTokens1', JSON.stringify(idexConfig));
                    localStorage.setItem('idexTokens2', JSON.stringify(idexConfig));
                }
            }
        });
    }
} catch (err) {
    console.log('IDEX live tokens loading error ' + err);
}