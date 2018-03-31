// try to get updated token list from EtherDelta, otherwise use own backup

var etherDeltaConfig = offlineTokens;

// dont get up to date etherdelta tokens, as they haven't been changed in 3 months
/*
try {
		$.getJSON('https://etherdelta.github.io/config/main.json', function(jsonData) {
			if(jsonData && jsonData.tokens) {
				etherDeltaConfig = jsonData;
			}
		});
	} catch (err){}
	*/
var stagingTokens = offlineStagingTokens;
/*
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
	$.getJSON('https://forkdelta.github.io/config/main.json', function (jsonData) {
		if (jsonData && jsonData.tokens) {
			forkDeltaConfig = jsonData;
		}
	});
} catch (err) { }

var idexConfig = idexOfflineTokens;
try {
	$.post("https://api.idex.market/returnCurrencies", function (data) {

		if (data) {
			let tokens = [];
			Object.keys(data).forEach(function (key) {
				var token = data[key];
				tokens.push({ name: key, decimals: token.decimals, addr: token.address.trim() });
			});
			idexConfig = tokens;
		}
	});

} catch (err) { }