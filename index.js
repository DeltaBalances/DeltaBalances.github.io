{
	// shorthands
	var _delta = bundle.DeltaBalances;
	var _util = bundle.utility;

	// initiation
	var initiated = false;
	var autoStart = false;

	var web3Index = 0;  //last used web3 instance

	var requestID = 0;

	// loading states
	var table1Loaded = false;

	var exchanges =
		{
			'Wallet': {
				enabled: true,
				loaded: 0, //async loading progress, number of tokens
				displayed: 0, //async loading progress, number of tokens
				contract: undefined
			},
			'EtherDelta': {
				enabled: true,
				loaded: 0,
				displayed: 0,
				contract: _delta.config.contractEtherDeltaAddrs[0].addr
			},
			'IDEX': {
				enabled: false,
				loaded: 0,
				displayed: 0,
				contract: _delta.config.contractIdexAddr
			},
			'Token store': {
				enabled: false,
				loaded: 0,
				displayed: 0,
				contract: _delta.config.contractTokenStoreAddr
			},
			'Enclaves': {
				enabled: false,
				loaded: 0,
				displayed: 0,
				contract: _delta.config.contractEnclavesAddr
			},
			'Decentrex': {
				enabled: false,
				loaded: 0,
				displayed: 0,
				contract: _delta.config.contractDecentrexAddr
			},
			'Ethen': {
				enabled: false,
				loaded: 0,
				displayed: 0,
				contract: _delta.config.contractEthenAddr
			},
			'DEXY': {
				enabled: false,
				loaded: 0,
				displayed: 0,
				contract: _delta.config.contractDexyAddr
			},
		};


	var loadedBid = 0;
	var failedBid = 0;

	var loadedCustom = false;
	var trigger_1 = false;
	var running = false;

	// settings
	var hideZero = true;
	var decimals = false;
	var fixedDecimals = 3;
	var useAsk = false;

	var showCustomTokens = false;
	var showFiat = 'USD';


	// user input & data
	var publicAddr = '';
	var savedAddr = '';
	var metamaskAddr = '';
	var lastResult = undefined;

	// config
	var tokenCount = 0; //auto loaded
	var blocktime = 14;
	var blocknum = -1;
	var startblock = 0;
	var endblock = 'latest';
	var walletWarningBalance = 0.003;

	var balances = {};
	var etherPriceUSD = 0;
	var etherPriceEUR = 0;

	// placeholder
	var balancesPlaceholder = {
		"0x0000000000000000000000000000000000000000":
			{
				Name: 'ETH',
				Wallet: 0,
				EtherDelta: 0,
				IDEX: 0,
				'Token store': 0,
				Enclaves: 0,
				Decentrex: 0,
				Ethen: 0,
				DEXY: 0,
				Total: 0,
				Unlisted: false,
				Address: '0x0000000000000000000000000000000000000000',
				Bid: '',
				Ask: '',
				'Est. ETH': '',
				'USD': '',
				'EUR': '',
			},
	};


	init();

	$(document).ready(function () {
		readyInit();
	});

	function init() {
		_delta.startDeltaBalances(true, () => {
			_delta.initTokens(true);

			showTokenCount();//checkCustom();
			initiated = true;
			if (autoStart)
				myClick();
		});
	}

	function readyInit() {

		//get metamask address as possbile input (if available)
		metamaskAddr = _util.getMetamaskAddress();
		if (metamaskAddr) {
			setMetamaskImage(metamaskAddr);
			$('#metamaskAddress').html(metamaskAddr.slice(0, 16));
		}
		getStorage();

		showTokenCount();
		$('#zero').prop('checked', hideZero);
		$('#decimals').prop('checked', decimals);
		$('#custom').prop('checked', showCustomTokens);
		$('#fiatSelect').val(Number(showFiat));


		$('body').on('expanded.pushMenu collapsed.pushMenu', function () {
			// Add delay to trigger code only after the pushMenu animation completes
			setTimeout(function () {
				$("#resultTable").trigger("update", [true, () => { }]);
				$("#resultTable").trigger("applyWidgets");
			}, 300);
		});



		// detect enter & keypresses in input
		$('#address').keypress(function (e) {
			if (e.keyCode == 13) {
				myClick();
				return false;
			} else {
				hideError();
				return true;
			}
		});

		$(window).resize(function () {
			$("#resultTable").trigger("applyWidgets");

			//hide popovers
			$('[data-toggle="popover"]').each(function () {
				$(this).popover('hide');
				$(this).data("bs.popover").inState = { click: false, hover: false, focus: false };
			});

			checkCollapseSettings();
		});

		//dismiss popovers on click outside
		$('body').on('click', function (e) {
			$('[data-toggle="popover"]').each(function () {
				//the 'is' for buttons that trigger popups
				//the 'has' for icons within a button that triggers a popup
				if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
					$(this).popover('hide');
					$(this).data("bs.popover").inState = { click: false, hover: false, focus: false };
				}
			});
			if (!$('#refreshButtonSearch').is(e.target)) {
				hideError();
			}
		});


		// contract change
		$('#contractSelect').change(e => {
			_delta.changeContract(e.target.selectedIndex);
			if (document.getElementById('address').value !== '')
				myClick();
		});

		resetExLoadingState();
		Object.keys(exchanges).forEach(function (key) {
			initExchangeBox(key);
		});
		setBalanceProgress();
		placeholderTable();

		checkCollapseSettings();

		// url parameter ?addr=0x... /#0x..
		var addr = ''
		if (!addr) {
			var hash = window.location.hash;  // url parameter /#0x...
			if (hash)
				addr = hash.slice(1);
		}
		if (addr) {
			addr = getAddress(addr);
			if (addr) {
				publicAddr = addr;
			}
		}
		if (publicAddr) {
			autoStart = true;
			if (publicAddr !== savedAddr) {
				$('#forget').addClass('hidden');
			}
			myClick();
		} else if (savedAddr) {//autoload when remember is active
			autoStart = true;
			// auto start loading
			loadSaved();
		} else if (metamaskAddr) {
			autoStart = true;
			loadMetamask();
		}
		else {
			_delta.connectSocket();
			$('#userToggle').addClass('hidden');
			$('#address').focus();
		}
	}

	function checkCollapseSettings() {
		let width = $(window).width();
		if (width < 991) {
			if ($('#setting-body').is(":visible")) {
				$("[data-widget='collapse']").click();
			}
		} else {
			if (!$('#setting-body').is(":visible")) {
				$("[data-widget='collapse']").click();
			}
		}
	}

	function initExchangeBox(name) {

		let name2 = name;
		if (name2 == 'Token store')
			name2 = 'store';
		let id = '#' + name2;
		let boxId = id + 'Box';

		let enabled = $(id).prop('checked');
		if (enabled != exchanges[name].enabled) {
			$(id).prop("checked", exchanges[name].enabled);
			$(boxId).removeClass('box-success');
			$(boxId).removeClass('box-warning');

			if (exchanges[name].enabled) {
				$(boxId).addClass('box-success');
			} else {
				$(boxId).addClass('box-warning');
			}
		}

	}

	function checkExchange(name) {
		let id = '#' + name;
		let boxId = id + 'Box';

		if (name == 'store')
			name = 'Token store';
		let enabled = $(id).prop('checked');


		$(boxId).removeClass('box-success');
		$(boxId).removeClass('box-warning');
		if (enabled) {
			$(boxId).addClass('box-success');
		} else {
			$(boxId).addClass('box-warning');
		}
		$("#resultTable").trigger("destroy");
		$('#resultTable tbody').html('');
		$('#resultTable thead').html('');
		table1Loaded = false;

		if (exchanges[name].enabled != enabled) {
			exchanges[name].enabled = enabled;
			if (lastResult) {
				if (!enabled) {
					//hide loaded exchange, don't reload
					balanceHeaders[name] = exchanges[name].enabled;
					finishedBalanceRequest();
				} else {
					if (exchanges[name].loaded >= tokenCount) {
						//show hidden exchange result
						balanceHeaders[name] = exchanges[name].enabled;
						finishedBalanceRequest();
					} else {

						// load new exchange only, keep old
						getBalances(requestID, true, false);
					}
				}
			} else {
				remakeEmpty();
			}
		} else {
			exchanges[name].enabled = enabled;
			remakeEmpty();
		}

		setStorage();

		function remakeEmpty() {

			resetExLoadingState();
			placeholderTable();
			setBalanceProgress();
		}
	}

	// zero balances checkbox
	var changeZero = false;
	function checkZero() {
		changeZero = true;
		hideZero = $('#zero').prop('checked');
		if (lastResult) {
			$('#resultTable tbody').empty();
			makeTable(lastResult, hideZero);
		}
		changeZero = false;
		setStorage();
	}

	function selectPrice() {
		let val = $('#priceSelect').val();
		useAsk = Number(val) > 0;

		$("#resultTable").trigger("destroy");
		$('#resultTable tbody').html('');
		$('#resultTable thead').html('');
		table1Loaded = false;

		if (lastResult) {
			finishedBalanceRequest();
		} else {
			placeholderTable();
		}

		setStorage();
	}

	function selectFiat() {
		let val = $('#fiatSelect').val();
		showFiat = Number(val);

		clearOverviewHtml(true);
		$("#resultTable").trigger("destroy");
		$('#resultTable tbody').html('');
		$('#resultTable thead').html('');
		table1Loaded = false;

		if (lastResult) {
			finishedBalanceRequest();
		} else {
			placeholderTable();
		}
		setStorage();
	}

	// more decimals checbox
	var changedDecimals = false;
	function checkDecimal() {
		changedDecimals = true;
		decimals = $('#decimals').prop('checked');

		fixedDecimals = decimals ? 8 : 3;

		$('#resultTable tbody').empty();
		$('#resultTable thead').empty();


		if (lastResult) {
			//table1Loaded = false;
			//	table2Loaded = false;
			finishedBalanceRequest();
		} else {
			placeholderTable();
		}
		changedDecimals = false;
		setStorage();
	}

	function checkCustom() {
		showCustomTokens = $('#custom').prop('checked');
		$('#customMessage').prop('hidden', showCustomTokens);
		setStorage();
		let maxcount = _delta.config.customTokens.length;
		if (showCustomTokens) {
			tokenCount = maxcount;
			if (lastResult && loadedCustom) {
				finishedBalanceRequest();
			}
			else if (publicAddr) {
				// load only added custom tokens if listed already loaded
				getBalances(requestID, false, true);
			}

		}
		else {
			tokenCount = _delta.config.tokens.length;

			if (lastResult) {
				finishedBalanceRequest();
			}
		}
		showTokenCount();
	}

	function showTokenCount() {
		let maxcount = _delta.config.customTokens.length;
		let currentcount = maxcount;
		if (showCustomTokens) {
			currentcount = maxcount;
		} else {
			currentcount = _delta.config.tokens.length;
		}
		$('#tokencount').html(" " + currentcount + "/" + maxcount);
	}

	function disableInput(disable) {
		$('#refreshButton').prop('disabled', disable);
		// $("#address").prop("disabled", disable);
		$("#loadingBalances").prop("disabled", disable);
		$("#tablesearcher").prop("disabled", disable);
		if (disable)
			$('#loadingBalances').addClass('dim');
		else
			$('#loadingBalances').removeClass('dim');
	}

	function showLoading(balance, trans) {
		if (balance) {
			$('#loadingBalances').addClass('fa-spin');
			$('#loadingBalances').addClass('dim');
			$('#loadingBalances').prop('disabled', true);
			$('#loadingBalances').show();
			$('#refreshButtonLoading').show();
			$('#refreshButtonSearch').hide();
		}
		$("#tablesearcher").prop("disabled", balance);

		/*if (!balance) {
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
		} */
	}

	function buttonLoading(balance, trans) {
		if (!publicAddr) {
			hideLoading(balance, trans);
			return;
		}
		if (balance) {
			$('#loadingBalances').removeClass('fa-spin');
			$('#loadingBalances').removeClass('dim');
			$('#loadingBalances').prop('disabled', false);
			$('#loadingBalances').show();
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
		}
	}

	function hideLoading(balance, trans) {
		if (!publicAddr) {
			balance = true;
			trans = true;
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
		}
		if (balance) {
			if (!trans)
				$('#loadingBalances').removeClass('fa-spin');
			else
				$('#loadingBalances').hide();
		}

		$("#tablesearcher").prop("disabled", !balance);
		if (balance) {
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();

		}
	}

	function myClick() {
		if (running)
			requestID++;
		if (!initiated) {
			autoStart = true;
			return;
		}

		hideError();
		hideHint();
		//disableInput(true);
		clearOverviewHtml(false);
		$('#downloadBalances').html('');

		// validate address
		if (!autoStart)
			publicAddr = getAddress();

		autoStart = false;
		if (publicAddr) {
			window.location.hash = publicAddr;
			getAll(false, requestID);

		}
		else {
			//placeholder();
			console.log('invalid input');
			disableInput(false);
			hideLoading(true, true);
		}
	}

	function getAll(autoload, rqid) {
		running = true;

		trigger_1 = true;

		lastResult = undefined;

		if (publicAddr) {
			setStorage();
			window.location.hash = publicAddr;
			getBalances(rqid, false, false);

		} else {
			running = false;
		}
	}

	function resetExLoadingState() {

		function setLoad(name) {
			exchanges[name].loaded = exchanges[name].enabled ? 0 : -1;
			exchanges[name].displayed = !exchanges[name].enabled;
			balanceHeaders[name] = exchanges[name].enabled;
		}

		Object.keys(exchanges).forEach(function (key) {
			setLoad(key);
		});
	}

	function appendExLoadingState(addCustom) {

		function setLoad(name) {
			if (exchanges[name].enabled && ((addCustom && exchanges[name].loaded >= _delta.config.tokens.length) || (!addCustom && exchanges[name].loaded >= tokenCount))) {
				exchanges[name].displayed = false;
			} else {
				exchanges[name].loaded = exchanges[name].enabled ? 0 : -1;
				exchanges[name].displayed = !exchanges[name].enabled;
			}
			balanceHeaders[name] = exchanges[name].enabled;
		}

		Object.keys(exchanges).forEach(function (key) {
			setLoad(key);
		});
	}

	function clearOverviewHtml(dollarOnly) {

		if (!dollarOnly) {
			$('#ethbalance').html('');
			$('#wethbalance').html('');
			$('#tokenbalance').html('');
			$('#totalbalance').html('');
		}

		$('#ethbalancePrice').html('');
		$('#wethbalancePrice').html('');
		$('#tokenbalancePrice').html('');
		$('#totalbalancePrice').html('');
	}

	function getBalances(rqid, appendExchange, appendCustom) {
		if (!rqid)
			rqid = requestID;
		if (!trigger_1)
			return;

		if (!appendExchange && !appendCustom)
			balances = {};

		clearOverviewHtml(false);

		$('#downloadBalances').html('');

		trigger_1 = false;
		//disableInput(true);

		loadedBid = 0;
		failedBid = 0;

		loadedCustom = false;
		$('#resultTable tbody').empty();
		showLoading(true, false);


		var allTokens = _delta.config.customTokens;
		var allCount = allTokens.length;
		if (!showCustomTokens) {
			tokenCount = _delta.config.tokens.length;
		} else {
			tokenCount = allCount;
		}

		if (!appendExchange && !appendCustom)
			resetExLoadingState();
		else
			appendExLoadingState(appendCustom);

		setBalanceProgress();

		if (!appendExchange && !appendCustom) {
			for (var i = 0; i < allCount; i++) {
				var token = allTokens[i];
				if (token)
					initBalance(token);
			}
		}

		//getAllBalances(rqid, 'All');
		Object.keys(exchanges).forEach(function (key) {
			if (exchanges[key].enabled && exchanges[key].loaded < tokenCount) {
				getAllBalances(rqid, key, appendCustom);
			}
		});

		getPrices(rqid);
		getEtherPrice();

		function initBalance(tokenObj, customToken) {
			balances[tokenObj.addr] = {
				Name: tokenObj.name,
				Wallet: '',
				EtherDelta: '',
				IDEX: 0,
				'Token store': 0,
				Enclaves: 0,
				Decentrex: 0,
				Ethen: 0,
				DEXY: 0,
				Total: 0,
				Bid: '',
				Ask: '',
				'Est. ETH': '',
				Unlisted: tokenObj.unlisted,
				Address: tokenObj.addr,
			};
		}

	}

	function getEtherPrice() {
		$.getJSON('https://api.coinmarketcap.com/v2/ticker/1027/?convert=EUR', result => {

			if (result && result.data.quotes) {
				etherPriceUSD = result.data.quotes.USD.price;
				etherPriceEUR = result.data.quotes.EUR.price;
			}
		});

	}


	// check if input address is valid
	function getAddress(addr) {

		setAddrImage('');
		document.getElementById('currentAddr').innerHTML = '0x......' // side menu
		document.getElementById('currentAddr2').innerHTML = '0x......'; //top bar
		document.getElementById('currentAddrDescr').innerHTML = 'Input address';

		var address = '';
		address = addr ? addr : document.getElementById('address').value;
		address = address.trim();

		if (!_delta.web3.isAddress(address)) {
			//check if url ending in address
			if (address.indexOf('/0x') !== -1) {
				var parts = address.split('/');
				var lastSegment = parts.pop() || parts.pop();  // handle potential trailing slash
				if (lastSegment)
					address = lastSegment;
			}

			if (!_delta.web3.isAddress(address)) {
				if (address.length == 66 && address.slice(0, 2) === '0x') {
					// transaction hash, go to transaction details
					window.location = window.location.origin + window.location.pathname + '/../tx.html#' + address;
					return;
				}

				// possible private key, show warning   (private key, or tx without 0x)
				if (address.length == 64 && address.slice(0, 2) !== '0x') {
					if (!addr) // ignore if in url arguments
					{
						showError("You likely entered your private key, NEVER do that again");
					}
				}
				else if (address.length == 40 && address.slice(0, 2) !== '0x') {
					address = `0x${addr}`;

				}
				else {
					if (!addr) // ignore if in url arguments
					{
						showError("Invalid address, try again");
					}
					return undefined;
				}
				if (!_delta.web3.isAddress(address)) {
					if (!addr) // ignore if in url arguments
					{
						showError("Invalid address, try again");
					}
					return undefined;
				}
			}
		}

		$('#userToggle').removeClass('hidden');
		document.getElementById('address').value = address;
		document.getElementById('currentAddr').innerHTML = address.slice(0, 16); // side menu
		document.getElementById('currentAddr2').innerHTML = address.slice(0, 8); //top bar
		$('#walletInfo').removeClass('hidden');
		if (!savedAddr || address.toLowerCase() !== savedAddr.toLowerCase()) {
			$('#save').removeClass('hidden');
			$('#forget').addClass('hidden');
			if (savedAddr) {
				$('#savedSection').removeClass('hidden');
			}
		} else if (savedAddr && address.toLowerCase() === savedAddr.toLowerCase()) {
			$('#save').addClass('hidden');
			$('#forget').removeClass('hidden');
			$('#savedSection').addClass('hidden');
			if (savedAddr === metamaskAddr) {
				document.getElementById('currentAddrDescr').innerHTML = 'Metamask address (Saved)';
			} else {
				document.getElementById('currentAddrDescr').innerHTML = 'Saved address';
			}
		}
		if (metamaskAddr) {
			if (address.toLowerCase() === metamaskAddr.toLowerCase()) {
				if (metamaskAddr !== savedAddr)
					document.getElementById('currentAddrDescr').innerHTML = 'Metamask address';
				$('#metamaskSection').addClass('hidden');
			} else {
				$('#metamaskSection').removeClass('hidden');
			}
		}

		$('#etherscan').attr("href", _util.addressLink(address, false, false))
		document.getElementById('addr').innerHTML = _util.addressLink(address, true, false);
		setAddrImage(address);

		return address;
	}

	function setAddrImage(addr) {

		var icon = document.getElementById('addrIcon');
		var icon2 = document.getElementById('currentAddrImg');
		var icon3 = document.getElementById('userImage');

		if (addr) {
			icon.style.backgroundImage = 'url(' + blockies.create({ seed: addr.toLowerCase(), size: 8, scale: 16 }).toDataURL() + ')';
			var smallImg = 'url(' + blockies.create({ seed: addr.toLowerCase(), size: 8, scale: 4 }).toDataURL() + ')';
			icon2.style.backgroundImage = smallImg;
			icon3.style.backgroundImage = smallImg;
		} else {
			icon.style.backgroundImage = '';
			icon2.style.backgroundImage = '';
			icon3.style.backgroundImage = '';
		}
	}

	function setSavedImage(addr) {
		var icon = document.getElementById('savedImage');
		if (addr)
			icon.style.backgroundImage = 'url(' + blockies.create({ seed: addr.toLowerCase(), size: 8, scale: 4 }).toDataURL() + ')';
		else
			icon.style.backgroundImage = '';
	}

	function setMetamaskImage(addr) {
		var icon = document.getElementById('metamaskImage');
		if (addr)
			icon.style.backgroundImage = 'url(' + blockies.create({ seed: addr.toLowerCase(), size: 8, scale: 4 }).toDataURL() + ')';
		else
			icon.style.backgroundImage = '';
	}

	function getPrices(rqid) {
		var socketRetries = 0;
		const numRetries = 2;
		var url1Retries = 0;
		var pricesLoaded = false;

		retrySocket();
		retryURL1();

		//prices from forkdelta socket
		function retrySocket() {
			_delta.socketTicker((err, result, rid) => {
				if (requestID <= rqid) {
					if (!err && result) {
						parsePrices(result, 'FD');
					} else if (loadedBid < 2 && socketRetries < numRetries) {
						socketRetries++;
						retrySocket();
					} else if (socketRetries >= numRetries) {
						showError("Failed to retrieve ForkDelta Prices after 3 tries. Prices may be less accurate.");
						loadedBid++;
						failedBid++;
						finishedBalanceRequest();
					}
				}
			}, rqid);
		}

		//prices from etherdelta https endpoint (includes more unlisted tokens)
		function retryURL1() {
			$.getJSON(_delta.config.apiServer + '/returnTicker').done((result) => {
				if (requestID <= rqid) {
					if (result) {
						parsePrices(result, 'ED');
					} else if (loadedBid < 2 && url1Retries < numRetries) {
						url1Retries++;
						retryURL1();
					} else if (url1Retries >= numRetries) {
						showError("Failed to retrieve EtherDelta Prices after 3 tries. Prices may be less accurate.");
						loadedBid++;
						finishedBalanceRequest();
					}
				}
			}).fail((result) => {
				if (requestID <= rqid) {
					if (loadedBid < 2 && url1Retries < numRetries) {
						url1Retries++;
						retryURL1();
					}
					else if (url1Retries >= numRetries) {
						showError("Failed to retrieve EtherDelta Prices after 3 tries. Try again (later)");
						loadedBid++;
						failedBid++;
						finishedBalanceRequest();
					}
				}
			});
		}

		function parsePrices(result, source) {
			var results = Object.values(result);
			for (var i = 0; i < results.length; i++) {

				if (source == 'ED' || source == 'FD') {
					var token = _delta.uniqueTokens[results[i].tokenAddr];
					if (token && balances[token.addr]) {
						balances[token.addr][source + 'Bid'] = Number(results[i].bid);
						balances[token.addr][source + 'Ask'] = Number(results[i].ask);
					}
				} else if (source == 'BIN') {

					let priceAddr = _delta.binanceMap[results[i].symbol];
					if (priceAddr) {
						var token = _delta.uniqueTokens[priceAddr];
						if (token && balances[token.addr]) {
							balances[token.addr][source + 'Bid'] = Number(results[i].bidPrice);
							balances[token.addr][source + 'Ask'] = Number(results[i].askPrice);
						}
					}
				}
			}
			loadedBid++;
			finishedBalanceRequest();
			return;
		}
	}


	var maxPerRequest = 500;   // don't make the web3 requests too large
	// mode = 'All' or ''  is all balances in 1 request
	// 'Wallet' is only wallet balances
	// 'EtherDelta' is only Etherdelta balances
	function getAllBalances(rqid, mode, addCustom) {

		// select which tokens to be requested
		var tokens2 = _delta.config.customTokens.map((x) => { return x.addr; });
		if (addCustom && showCustomTokens) {
			tokens2 = tokens2.filter((x) => { return _delta.uniqueTokens[x].unlisted; });
		} else if (!showCustomTokens) {
			tokens2 = tokens2.filter((x) => { return !_delta.uniqueTokens[x].unlisted; });
		}

		//split in separate requests to match maxPerRequest
		for (var i = 0; i < tokens2.length; i += maxPerRequest) {
			allBalances(i, i + maxPerRequest, tokens2, i);
		}

		// make the call to get balances for a (sub)section of tokens
		function allBalances(startIndex, endIndex, tokens3, balanceRequestIndex) {

			var tokens = tokens3.slice(startIndex, endIndex);

			var functionName = 'deltaBalances';
			var arguments = [exchanges[mode].contract, publicAddr, tokens];
			if (mode == 'Wallet') {
				functionName = 'walletBalances';
				arguments = [publicAddr, tokens];
			}

			var completed = 0;
			var success = false;
			var totalTries = 0;

			if (web3Index >= _delta.web3s.length) {
				web3Index = 0;
			}

			//get balances from 2 web3 sources at once, use the fastest response
			// web3 provider (infura, myetherapi, mycryptoapi) or etherscan
			makeCall(_delta.web3s[web3Index], mode, functionName, arguments, 0);
			makeCall(web3Index >= _delta.web3s.length ? undefined : _delta.web3s[web3Index], mode, functionName, arguments, 0);


			function makeCall(web3Provider, exName, funcName, args, retried) {

				if (completed || requestID > rqid)
					return;
				if (web3Provider)
					web3Index++;

				_util.call(
					web3Provider,
					_delta.contractDeltaBalance,
					_delta.config.contractDeltaBalanceAddr,
					funcName,
					args,
					(err, result) => {
						if (success || requestID > rqid)
							return;

						completed++;

						const returnedBalances = result;

						if (!err && returnedBalances && returnedBalances.length > 0) {
							loadedCustom = showCustomTokens;
							for (var i = 0; i < tokens.length; i++) {
								var token = _delta.uniqueTokens[tokens[i]];
								var div = _delta.divisorFromDecimals(token.decimals);

								if (funcName == 'walletBalances' || funcName == 'deltaBalances') {
									balances[token.addr][exName] = _util.weiToEth(returnedBalances[i], div);
									if (exchanges[exName].loaded >= 0)
										exchanges[exName].loaded++;
									if (exchanges[exName].loaded >= tokenCount)
										finishedBalanceRequest();

									success = true;
								}/* else { //both wallet & etherdelta
									var j = i * 2;
									balances[token.addr].EtherDelta = _util.weiToEth(returnedBalances[j], div);
									balances[token.addr].Wallet = _util.weiToEth(returnedBalances[j + 1], div);
									loadedW++;
									loadedED++;
									if (loadedED >= tokenCount && loadedW >= tokenCount)
										finishedBalanceRequest();
								} */
							}
						}
						else if (completed >= 2) // both requests returned
						{
							const retryAmount = 2;
							if (retried < retryAmount) //retry both etherscan and infura 3 times
							{
								totalTries++;
								console.log('retrying request');
								if (web3Index >= _delta.web3s.length) {
									web3Index = 0;
								}

								makeCall(_delta.web3s[web3Index], exName, funcName, args, retried + 1);
								makeCall(web3Index >= _delta.web3s.length ? undefined : _delta.web3s[web3Index], exName, funcName, args, retried + 1);
								return;
							}
							else if (totalTries >= retryAmount * 2) {

								if (funcName == 'walletBalances') {
									showError('Failed to load all Wallet balances after 3 tries, try again later');
									exchanges[exName].loaded = -1;
									finishedBalanceRequest();
								}
								else if (funcName == 'deltaBalances') {
									showError('Failed to load all ' + exName + ' balances after 3 tries, try again later');
									exchanges[exName].loaded = -1;
									finishedBalanceRequest();
								}
							}
						}
					}
				);
			}
		}
	}



	function showHint(text) {
		$('#hinttext').html(text);
		$('#hint').show();
	}

	function hideHint() {
		$('#hint').hide();
	}

	function showError(text) {
		$('#errortext').html(text);
		$('#error').show();
	}

	function hideError() {
		$('#error').hide();
	}

	function setBalanceProgress() {
		let progressString = '<span style="padding-left:10px;padding-right:30px">Loaded: </span>';
		let changed = false;
		let keys = Object.keys(exchanges);
		for (let i = 0; i < keys.length; i++) {

			if (exchanges[keys[i]].enabled) {
				if (changed)
					progressString +=
						changed = true;
				var numLoaded = exchanges[keys[i]].loaded;
				progressString += '<span>' + keys[i] + ":";

				if (numLoaded >= tokenCount) {
					progressString += '<span style="padding-left:3px;padding-right:30px" class="text-green">';
				} else {
					progressString += '<span style="padding-left:3px;padding-right:30px" class="text-red">';
				}
				progressString += Math.min(exchanges[keys[i]].loaded, tokenCount) + '/' + tokenCount + '</span></span> ';
			}
		}

		//prices
		{
			progressString += '<span>Token prices:<span style="padding-left:3px;padding-right:30px" class="text-';
			if (loadedBid < 2) {
				if (running) {
					progressString += 'red"> Loading..';
				} else {
					progressString += 'green"> No';
				}
			} else if (failedBid == 0) {
				progressString += 'green"> Yes';
			} else if (failedBid == 1) {
				progressString += 'green"> 1/2 Failed';
			} else {
				progressString += 'red"> Failed';
			}
			progressString += '</span></span>';
		}

		$('#balanceProgress').html(progressString);
	}


	// callback when balance request completes
	function finishedBalanceRequest() {
		//check if all requests are complete
		let keys = Object.keys(exchanges);

		var noneDone = true;
		var allDone = true;
		for (let i = 0; i < keys.length; i++) {
			if (exchanges[keys[i]].loaded >= tokenCount || exchanges[keys[i]].loaded == -1) {
				if (exchanges[keys[i]].enabled)
					noneDone = false;
			} else if (exchanges[keys[i]].enabled) {
				allDone = false;
			}
		}

		setBalanceProgress();
		clearOverviewHtml(false);

		if (noneDone)
			return;


		var sumETH = _delta.web3.toBigNumber(0);
		var sumWETH = _delta.web3.toBigNumber(0);
		var sumToken = _delta.web3.toBigNumber(0);

		for (let i = 0; i < keys.length; i++) {
			exchanges[keys[i]].displayed = exchanges[keys[i]].loaded >= tokenCount || exchanges[keys[i]].loaded == -1;
		}

		displayedBid = loadedBid >= 2;

		var allTokens = _delta.config.customTokens;
		var allCount = allTokens.length;

		// get totals
		for (var i = 0; i < allCount; i++) {
			var token = allTokens[i];
			var bal = balances[token.addr];
			if (bal) {

				bal.Total = _delta.web3.toBigNumber(0);
				for (let i = 0; i < keys.length; i++) {
					if (exchanges[keys[i]].enabled && exchanges[keys[i]].loaded >= tokenCount) {
						if (bal[keys[i]])
							bal.Total = bal.Total.plus(bal[keys[i]]);
					}
				}

				bal['Est. ETH'] = '';
				bal['USD'] = '';
				bal['EUR'] = '';

				// ETH and  wrapped eth fixed at value of 1 ETH
				if (_util.isWrappedETH(token.addr)) {
					bal.Bid = '';
					bal.Ask = '';
					bal['Est. ETH'] = bal.Total;

					if (token.addr === "0x0000000000000000000000000000000000000000") {
						sumETH = bal.Total;
					} else if (_util.isWrappedETH(token.addr)) {
						sumWETH = sumWETH.plus(bal.Total);
					} else {
						sumToken = sumToken.plus(bal.Total);
					}
				}
				else if ((bal.EDBid || bal.EDAsk || bal.FDBid || bal.FDAsk) && bal.Total) {

					//case cade price sources in volume, Binance most accurate price
					if (bal.EDBid)
						bal.Bid = bal.EDBid;
					if (bal.FDBid && (!bal.EDBid || bal.FDBid > bal.EDBid))
						bal.Bid = bal.FDBid;
					if (bal.BINBid)
						bal.Bid = bal.BINBid;

					if (bal.EDAsk)
						bal.Ask = bal.EDAsk;
					if (bal.FDAsk && (!bal.EDAsk || bal.FDAsk < bal.EDAsk))
						bal.Ask = bal.FDAsk;
					if (bal.BINAsk)
						bal.Ask = bal.BINAsk;

					// calculate estimate if not (wrapped) ETH
					var val = _delta.web3.toBigNumber(0);

					if (useAsk) {
						if (bal.Ask) {
							val = bal.Total.times(bal.Ask);
						}
					} else {
						if (bal.Bid) {
							val = bal.Total.times(bal.Bid);
						}
					}

					bal['Est. ETH'] = val;
					sumToken = sumToken.plus(val);
				}

				if (!bal.Bid) {
					bal.Bid = '';
				}
				if (!bal.Ask) {
					bal.Ask = '';
				}

				balances[token.addr] = bal;
			}
		}

		var result = Object.values(balances);
		lastResult = result;

		if (allDone) {

			for (let i = 0; i < result.length; i++) {
				if (result[i]['Est. ETH'] !== '') {
					if (showFiat == 1) {
						result[i]['USD'] = '$' + _util.commaNotation(result[i]['Est. ETH'].times(etherPriceUSD).toFixed(2));
					} else if (showFiat == 2) {
						result[i]['EUR'] = '€' + _util.commaNotation(result[i]['Est. ETH'].times(etherPriceEUR).toFixed(2));
					}
				}
			}
			lastResult = result;

			$('#ethbalance').html('<span data-toggle="tooltip" title="' + sumETH.toString() + '">' + sumETH.toFixed(fixedDecimals) + ' ETH</span>');
			$('#wethbalance').html('<span data-toggle="tooltip" title="' + sumWETH.toString() + '">' + sumWETH.toFixed(fixedDecimals) + ' ETH</span>');
			$('#tokenbalance').html('<span data-toggle="tooltip" title="' + sumToken.toString() + '">' + sumToken.toFixed(fixedDecimals) + ' ETH</span>');
			let totalSumETH = sumETH.plus(sumToken).plus(sumWETH);
			$('#totalbalance').html('<span data-toggle="tooltip" title="' + totalSumETH.toString() + '">' + totalSumETH.toFixed(fixedDecimals) + ' ETH</span>');

			$('[data-toggle=tooltip]').tooltip({
				'placement': 'top',
				'container': 'body'
			});

			if (showFiat == 1) {
				$('#ethbalancePrice').html(" $" + _util.commaNotation((sumETH.times(etherPriceUSD)).toFixed(2)));
				$('#wethbalancePrice').html(" $" + _util.commaNotation((sumWETH.times(etherPriceUSD)).toFixed(2)));
				$('#tokenbalancePrice').html(" $" + _util.commaNotation((sumToken.times(etherPriceUSD)).toFixed(2)));
				$('#totalbalancePrice').html(" $" + _util.commaNotation((totalSumETH.times(etherPriceUSD)).toFixed(2)));
			} else if (showFiat == 2) {
				$('#ethbalancePrice').html(" €" + _util.commaNotation((sumETH.times(etherPriceEUR)).toFixed(2)));
				$('#wethbalancePrice').html(" €" + _util.commaNotation((sumWETH.times(etherPriceEUR)).toFixed(2)));
				$('#tokenbalancePrice').html(" €" + _util.commaNotation((sumToken.times(etherPriceEUR)).toFixed(2)));
				$('#totalbalancePrice').html(" €" + _util.commaNotation((totalSumETH.times(etherPriceEUR)).toFixed(2)));
			}


			$('#downloadBalances').html('');
			downloadBalances();

		} else {

			clearOverviewHtml(false);
			$('#downloadBalances').html('');
		}

		makeTable(result, hideZero); //calls trigger
	}



	//balances table
	function makeTable(result, hideZeros) {

		$('#resultTable tbody').empty();
		var filtered = result;
		var loaded = table1Loaded;
		if (changedDecimals)
			loaded = false;

		if (hideZeros) {
			filtered = result.filter(x => {
				return (Number(x.Total) > 0 || x.Name === 'ETH');
			});
		}
		/*
		if(!showCustomTokens)
		{
			filtered = result.filter(x => {
				return !(x.Unlisted);
            });
		} */

		balanceHeaders['Ask'] = useAsk;
		balanceHeaders['Bid'] = !useAsk;

		balanceHeaders['USD'] = showFiat == 1;
		balanceHeaders['EUR'] = showFiat == 2;

		//count number off active exchanges
		let numColumns = Object.values(exchanges).reduce((sum, ex) => { if (ex.enabled) return sum + 1; else return sum; }, 0);
		balanceHeaders['Total'] = numColumns > 1;

		buildHtmlTable('#resultTable', filtered, loaded, balanceHeaders);

		trigger();
	}


	function placeholderTable() {
		balances = balancesPlaceholder;
		var result = Object.values(balancesPlaceholder);
		makeTable(result, false);
	}


	// save address for next time
	function setStorage() {
		if (typeof (Storage) !== "undefined") {

			if (publicAddr) {
				sessionStorage.setItem('address', publicAddr);
			} else {
				sessionStorage.removeItem('address');
			}
			if (savedAddr) {
				localStorage.setItem("address", savedAddr);
			} else {
				localStorage.removeItem('address');
			}

			localStorage.setItem("customTokens", showCustomTokens);
			localStorage.setItem("decimals", decimals);
			localStorage.setItem("hideZero", hideZero);
			localStorage.setItem('fiat', showFiat);

			Object.keys(exchanges).forEach(function (key) {
				localStorage.setItem(key, exchanges[key].enabled);
			});
		}
	}

	function getStorage() {
		if (typeof (Storage) !== "undefined") {

			if (localStorage.getItem("fiat") === null) {
				showFiat = '1';
			} else {
				showFiat = localStorage.getItem('fiat');
				if (!(showFiat == '1' || showFiat == '2'))
					showFiat = '0';
			}

			if (localStorage.getItem("customTokens") === null) {
				showCustomTokens = false;
			} else {
				var custom = localStorage.getItem('customTokens');
				showCustomTokens = custom === "true";
			}

			if (localStorage.getItem("hideZero") === null) {
				hideZero = true;
			} else {
				var zero = localStorage.getItem('hideZero');
				hideZero = zero === "true";
			}

			if (localStorage.getItem("decimals") === null) {
				decimals = false;
			} else {
				var dec = localStorage.getItem('decimals');
				decimals = dec === "true";
			}

			Object.keys(exchanges).forEach(function (key) {
				let enabled = localStorage.getItem(key);
				if (enabled !== null) {
					enabled = (enabled === "true");
					exchanges[key].enabled = enabled;
				}
				exchanges['Wallet'].enabled = true;
			});


			// check for saved address
			if (localStorage.getItem("address") !== null) {
				var addr = localStorage.getItem("address");
				if (addr && addr.length == 42) {
					savedAddr = addr;
					addr = getAddress(addr);
					if (addr) {
						savedAddr = addr;
						setSavedImage(savedAddr);
						$('#savedAddress').html(addr.slice(0, 16));
					}
				} else {
					localStorage.removeItem("address");
				}
			}

			// check for session address between pages
			if (sessionStorage.getItem("address") !== null) {
				var addr = sessionStorage.getItem("address");
				if (addr && addr.length == 42) {
					addr = getAddress(addr);
					if (addr) {
						publicAddr = addr;
					}
				} else {
					sessionStorage.removeItem("address");
				}
			}
		}
	}



	// final callback to sort table
	function trigger() {

		let keys = Object.keys(exchanges);
		let totalIndex = 4;
		for (let i = 0; i < keys.length; i++) {
			if (!exchanges[keys[i]].enabled) {
				totalIndex++;
			}
		}

		if (table1Loaded) // reload existing table
		{
			$("#resultTable").trigger("update", [true, () => { }]);
			$("#resultTable thead th").data("sorter", true);
			//$("#resultTable").trigger("sorton", [[totalIndex, 1]]);

		} else {


			$("#resultTable thead th").data("sorter", true);
			$("#resultTable").tablesorter({
				widgets: ['scroller', 'filter'],
				widgetOptions: {
					filter_external: '.search',
					filter_defaultFilter: { 0: '~{query}' },
					filter_columnFilters: false,
					filter_placeholder: { search: 'Search...' },
					scroller_height: 500,
				},
				sortList: [[0, 0]]
			});

			table1Loaded = true;
		}

		var allDisplayed = true;
		for (let i = 0; i < keys.length; i++) {
			if (!exchanges[keys[i]].displayed) {
				allDisplayed = false;
			}
		}
		allDisplayed = allDisplayed && displayedBid;
		trigger_1 = allDisplayed;


		if (trigger_1) {
			disableInput(false);
			hideLoading(true, true);
			running = false;
			requestID++;
			buttonLoading(true, true);
		}

		table1Loaded = true;
	}


	// Builds the HTML Table out of myList.
	function buildHtmlTable(selector, myList, loaded, headers) {
		var body = $(selector + ' tbody');
		var columns = addAllColumnHeaders(myList, selector, loaded, headers);

		var tbody$ = $('<tbody/>');

		for (var i = 0; i < myList.length; i++) {

			if (!showCustomTokens && myList[i].Unlisted)
				continue;
			var row$ = $('<tr/>');


			for (var colIndex = 0; colIndex < columns.length; colIndex++) {
				var cellValue = myList[i][columns[colIndex]];
				if (cellValue == null) cellValue = "";
				var head = columns[colIndex];

				if (head == 'Total' || head == 'EtherDelta' || head == 'Decentrex' || head == 'Token store' || head == 'IDEX' || head == 'Enclaves' || head == 'DEXY' || head == 'Ethen' || head == 'Wallet' || head == 'Bid' || head == 'Ask' || head == 'Est. ETH') {
					if (cellValue !== "" && cellValue !== undefined) {
						var dec = fixedDecimals;
						if (head == 'Bid' || head == 'Ask') {
							dec += 2;
						}
						var num = '<span data-toggle="tooltip" title="' + cellValue.toString() + '">' + cellValue.toFixed(dec) + '</span>';
						num = _util.commaNotation(num);
						row$.append($('<td/>').html(num));
					} else {
						row$.append($('<td/>').html(cellValue));
					}
				}
				else if (head == 'USD' || head == 'EUR') {
					var num = '<span style="color:gray">' + cellValue + '</span>';
					row$.append($('<td/>').html(num));
				}
				else if (head == 'Name') {
					let token = _delta.uniqueTokens[myList[i].Address];
					if(token) {
						let popover = _delta.makeTokenPopover(token);
						row$.append($('<td/>').html(popover));
					} else {
						row$.append($('<td/>').html(""));
					}
				}
				else {
					row$.append($('<td/>').html(cellValue));
				}
			}
			tbody$.append(row$);
		}
		body.append(tbody$[0].innerHTML);
		$("[data-toggle=popover]").popover();
		$('[data-toggle=tooltip]').tooltip({
			'placement': 'top',
			'container': 'body'
		});
	}

	var balanceHeaders = { 'Name': 1, 'Wallet': 1, 'EtherDelta': 1, 'IDEX': 1, 'Token store': 1, 'Enclaves': 1, 'Decentrex': 1, 'DEXY': 1, 'Ethen': 1, 'Total': 1, 'Value': 1, 'Bid': 1, 'Ask': 0, 'Est. ETH': 1, 'USD': 0, 'EUR': 0 };

	// Adds a header row to the table and returns the set of columns.
	// Need to do union of keys from all records as some records may not contain
	// all records.
	function addAllColumnHeaders(myList, selector, loaded, headers) {
		var columnSet = {};

		if (!loaded)
			$(selector + ' thead').empty();

		var header1 = $(selector + ' thead');
		var headerTr$ = $('<tr/>');

		if (!loaded) {
			header1.empty();
		}

		for (var i = 0; i < myList.length; i++) {
			var rowHash = myList[i];
			for (var key in rowHash) {
				if (!columnSet[key] && headers[key]) {
					columnSet[key] = 1;
					headerTr$.append($('<th/>').html(key));
				}
			}
		}
		if (!loaded) {
			header1.append(headerTr$);
			$(selector).append(header1);
		}
		columnSet = Object.keys(columnSet);
		return columnSet;
	}


	// contract selector
	function createSelect() {
		var div = document.getElementById("selectDiv");

		//Create array of options to be added
		var array = _delta.config.contractEtherDeltaAddrs.map(x => { return x.addr; });

		//Create and append select list
		var selectList = document.createElement("select");
		selectList.id = "contractSelect";
		var liveGroup = document.createElement("optgroup");
		liveGroup.label = "EtherDelta - Active";
		var oldGroup = document.createElement("optgroup");
		oldGroup.label = "EtherDelta - Outdated - withdraw funds";



		//Create and append the options
		for (var i = 0; i < array.length; i++) {
			var option = document.createElement("option");
			option.value = i;
			option.text = array[i];
			if (i == 0) {
				liveGroup.appendChild(option);
			} else {
				oldGroup.appendChild(option);
			}
		}


		selectList.appendChild(liveGroup);
		selectList.appendChild(oldGroup);
		div.appendChild(selectList);
		selectList.selectedIndex = 0;
	}

	function downloadBalances() {
		if (lastResult) {
			var allBal = lastResult;
			allBal = allBal.filter((x) => { return x.Total > 0; });

			let bidText = 'Bid (ETH)';
			if (useAsk)
				bidText = 'Ask (ETH)';

			var AA = ['Token'];
			Object.keys(exchanges).forEach(function (key) {
				if (exchanges[key].enabled) {
					AA.push(key);
				}
			});

			AA = AA.concat(['Total', bidText, 'Estimated value (ETH)', 'Token contract address']);

			const A = [AA];
			// initialize array of rows with header row as 1st item
			for (var i = 0; i < allBal.length; ++i) {
				let bid = allBal[i].Bid;
				if (useAsk)
					bid = allBal[i].Ask;
				let estimate = '';
				if (bid)
					estimate = bid * allBal[i].Total

				var arr = [allBal[i].Name];
				Object.keys(exchanges).forEach(function (key) {
					if (exchanges[key].enabled) {
						arr.push(allBal[i][key]);
					}
				});

				let contrAddr = allBal[i].Address;
				if (arr[0] === 'ETH')
					contrAddr = 'Not a token';

				arr = arr.concat([allBal[i].Total, bid, estimate, contrAddr]);

				for (let j = 0; j < arr.length; j++) {
					//remove exponential notation
					if (A[0][j] == 'Wallet' || A[0][j] == 'EtherDelta' || A[0][j] == 'IDEX' || A[0][j] == 'Token store' || A[0][j] == 'Enclaves' || A[0][j] == 'Decentrex' || A[0][j] == 'DEXY' || A[0][j] == 'Ethen' || A[0][j] == 'Total' || A[0][j] == 'Estimated value (ETH)' || A[0][j] == 'Bid (ETH)' || A[0][j] == 'Ask (ETH)') {
						if (arr[j] != '' && arr[j] != ' ')
							arr[j] = _util.exportNotation(arr[j]);
					}

					// add quotes
					//arr[j] = `\"${arr[j]}\"`;
				}

				A.push(arr);
			}
			var csvRows = [];
			for (var i = 0, l = A.length; i < l; ++i) {
				csvRows.push(A[i].join(','));   // unquoted CSV row
			}
			var csvString = csvRows.join("\r\n");

			var sp = document.createElement('span');
			sp.innerHTML = "Export balances as CSV ";
			var a = document.createElement('a');
			a.innerHTML = '<i class="fa fa-download" aria-hidden="true"></i>';
			a.href = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
			a.target = '_blank';
			a.download = _util.formatDate(_util.toDateTimeNow(true), true) + '-' + publicAddr + '.csv';
			sp.appendChild(a);

			$('#downloadBalances').html('');
			var parent = document.getElementById('downloadBalances');
			parent.appendChild(sp);
			//parent.appendCild(a);
		}

	}

	function forget() {
		if (publicAddr) {
			if (publicAddr.toLowerCase() === savedAddr.toLowerCase()) {
				savedAddr = '';
				$('#savedSection').addClass('hidden');
			}
		}
		$('#address').val('');
		publicAddr = getAddress('');
		setStorage();
		window.location.hash = "";
		$('#walletInfo').addClass('hidden');
		if (!publicAddr && !savedAddr && !metamaskAddr) {
			$('#userToggle').click();
			$('#userToggle').addClass('hidden');
		}

		myClick();

		return false;
	}

	function save() {
		savedAddr = publicAddr;
		publicAddr = getAddress(savedAddr);

		$('#savedAddress').html(savedAddr.slice(0, 16));
		$('#savedSection').addClass('hidden');
		$('#save').addClass('hidden');
		setSavedImage(savedAddr);
		setStorage();

		return false;
	}

	function loadSaved() {
		if (savedAddr) {

			publicAddr = savedAddr;
			publicAddr = getAddress(savedAddr);
			$('#forget').removeClass('hidden');
			setStorage();
			myClick();
		}
		return false;
	}

	function loadMetamask() {
		if (metamaskAddr) {
			publicAddr = metamaskAddr;
			publicAddr = getAddress(metamaskAddr);
			$('#metamaskSection').addClass('hidden');
			setStorage();
			myClick();
		}
		return false;
	}


}