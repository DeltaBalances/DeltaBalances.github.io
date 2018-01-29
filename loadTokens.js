// try to get updated token list from EtherDelta, otherwise use own backup
		
var etherDeltaConfig = offlineTokens;
try {
		$.getJSON('https://etherdelta.github.io/config/main.json', function(jsonData) {
			if(jsonData && jsonData.tokens) {
				etherDeltaConfig = jsonData;
			}
		});
	} catch (err){}
var stagingTokens = offlineStagingTokens;
try {
		$.getJSON('https://etherdelta.github.io/config/staging.json', function(jsonData) {
			if(jsonData && jsonData.tokens) {
				stagingTokens = jsonData;
			}
		});
	} catch (err) {}
var forkDeltaConfig = forkOfflineTokens;
try {
		$.getJSON('https://forkdelta.github.io/config/main.json', function(jsonData) {
			if(jsonData && jsonData.tokens) {
				forkDeltaConfig = jsonData;
			}
		});
	} catch (err){}