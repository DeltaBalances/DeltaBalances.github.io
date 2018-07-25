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
	var progressTableLoaded = false;
	var balanceTable = undefined;
	var progressTable = undefined;
	var tableHeaders = [];

	var exchanges =
	{
		'Wallet': {
			enabled: true,
			loaded: 0, //async loading progress, number of tokens
			displayed: 0, //async loading progress, number of tokens
			contract: undefined
		},
		'EtherDelta': {
			enabled: false,
			loaded: 0,
			displayed: 0,
			contract: _delta.config.exchangeContracts.EtherDelta.addr
		},
		'IDEX': {
			enabled: false,
			loaded: 0,
			displayed: 0,
			contract: _delta.config.exchangeContracts.Idex.addr
		},
		'Token store': {
			enabled: false,
			loaded: 0,
			displayed: 0,
			contract: _delta.config.exchangeContracts.TokenStore.addr
		},
		'Enclaves': {
			enabled: false,
			loaded: 0,
			displayed: 0,
			contract: _delta.config.exchangeContracts.Enclaves.addr
		},
		'SingularX': {
			enabled: false,
			loaded: 0,
			displayed: 0,
			contract: _delta.config.exchangeContracts.Singularx.addr
		},
		'EtherC': {
			enabled: false,
			loaded: 0,
			displayed: 0,
			contract: _delta.config.exchangeContracts.EtherC.addr
		},
		'Decentrex': {
			enabled: false,
			loaded: 0,
			displayed: 0,
			contract: _delta.config.exchangeContracts.Decentrex.addr
		},
		'Ethen': {
			enabled: false,
			loaded: 0,
			displayed: 0,
			contract: _delta.config.exchangeContracts.Ethen.addr
		},
		'DEXY': {
			enabled: false,
			loaded: 0,
			displayed: 0,
			contract: _delta.config.exchangeContracts.Dexy.addr
		},
	};

	var loadedBid = 0;
	var failedBid = 0;
	var displayedBid = 0;

	var trigger_1 = false;
	var running = false;
	var runningCustom = false;
	var runningListed = false;

	// settings
	var hideZero = true;
	var decimals = false;
	var fixedDecimals = 3;
	var useAsk = false;

	var showCustomTokens = false;
	var showListed = true;
	var showSpam = false;
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
			SingularX: 0,
			EtherC: 0,
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

	//initialize independent of html dom
	function init() {
		_delta.initTokens(true);
		tokenCount = getTokenCount();

		_delta.startDeltaBalances(true, () => {
			_delta.initTokens(true); // do it again in case a token listed loaded very quickly (don't wait for them)
			tokenCount = getTokenCount();
			initiated = true;
			if (autoStart)
				myClick();
		});
	}

	// initialize on page ready
	function readyInit() {


		checkCollapseSettings(true);

		//get metamask address as possbile input (if available)
		metamaskAddr = _util.getMetamaskAddress();
		if (metamaskAddr) {
			setMetamaskImage(metamaskAddr);
			$('#metamaskAddress').html(metamaskAddr.slice(0, 16));
		}
		getStorage();

		$('#zero').prop('checked', hideZero);
		$('#decimals').prop('checked', decimals);
		$('#fiatSelect').val(Number(showFiat));

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
			hidePopovers();
			checkCollapseSettings();
		});


		//dismiss popovers on click outside
		$('body').on('click', function (e) {
			$('[data-toggle="popover"]').each(function () {
				//the 'is' for buttons that trigger popups
				//the 'has' for icons within a button that triggers a popup
				if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
					hidePopover(this);
				}
			});
			if (!$('#refreshButtonSearch').is(e.target)) {
				hideError();
			}
		});

		$('#exchangeDropdown').on('hidden.bs.select', function (e) {
			var selected = []
			selected = $('#exchangeDropdown').val()

			// array of exchange names
			setTimeout(function () {
				checkExchange(selected);
			}, 150);

		});

		//set exchange dropdown
		let dropdownVal = [];
		Object.keys(exchanges).forEach(function (key) {
			if (exchanges[key].enabled) {
				dropdownVal.push(key);
			}
		});
		$('#exchangeDropdown').selectpicker('val', dropdownVal);


		resetExLoadingState();
		Object.keys(exchanges).forEach(function (key) {
			initExchangeBox(key);
		});

		placeholderTable();
		setBalanceProgress();

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
		if (autoStart && !initiated) {
			showLoading(true);
			if (table1Loaded && balanceTable) {
				balanceTable.clear().draw();
			}
		}
	}

	function hidePopovers() {
		$('[data-toggle="popover"]').each(function () {
			hidePopover(this);
		});
	}

	function hidePopover(element) {
		try {
			$(element).popover('hide');
			$(element).data("bs.popover").inState = { click: false, hover: false, focus: false };
		} catch (e) { }
	}

	function checkCollapseSettings(init) {
		//check bootstrap classes for visibility
		var envs = ['xs', 'sm', 'md', 'lg'];
		var env = '';
		var $el = $('<div>');
		$el.appendTo($('body'));

		for (var i = envs.length - 1; i >= 0; i--) {
			env = envs[i];

			$el.addClass('hidden-' + env);
			if ($el.is(':hidden')) {
				$el.remove();
				break;
			}
		}

		if (env == 'xs' || env == 'sm') {
			if ($('#setting-body').is(":visible")) {
				$('#collapseSettings').click();
			}
			if (init) {
				$('#settingbox').addClass('collapsed-box');
				$('#settingToggleIcon').removeClass('fa-minus');
				$('#settingToggleIcon').addClass('fa-plus');
			}
		} else {
			if (!$('#setting-body').is(":visible")) {
				$('#collapseSettings').click();
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

	function checkExchange(selected) {
		let changed = false;
		let requiresLoading = false;

		let keys = Object.keys(exchanges);
		for (let i = 0; i < keys.length; i++) {
			let name = keys[i];
			if (name == 'Wallet')
				continue;

			let enabled = false;
			if (selected.length > 0 && selected.indexOf(name) !== -1) {
				enabled = true;
			}

			if (exchanges[name].enabled !== enabled) {
				changed = true;

				if (lastResult) {

					if (enabled && exchanges[name].loaded < tokenCount) {
						requiresLoading = true;
					}
				}
			}
			exchanges[name].enabled = enabled;
			balanceHeaders[name] = exchanges[name].enabled;
		}

		if (changed) {
			setBalanceProgress(true);
			setStorage();
		}

		if (!changed && !lastResult) {
			remakeEmpty();
		}
		else if (lastResult && changed) {
			if (!requiresLoading) {
				finishedBalanceRequest();
			} else {
				getBalances(true, false);
			}
		}

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
			finishedBalanceRequest();
		}
		changeZero = false;
		setStorage();
	}

	function selectPrice() {
		let val = $('#priceSelect').val();
		useAsk = Number(val) > 0;

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
		if (lastResult) {
			finishedBalanceRequest();
		} else {
			placeholderTable();
		}
		changedDecimals = false;
		setStorage();
	}


	function checkSpam() {
		let newSpam = $('#showSpam').prop('checked');
		if (newSpam !== showSpam) {
			showSpam = newSpam;
			if (showCustomTokens) {
				if (lastResult) {
					finishedBalanceRequest();
				} else if (!running) {
					placeholderTable();
				}
			}
		}
	}

	function checkListing() {
		let showCustomTokens2 = $('#showUnlisted').prop('checked');
		if (showCustomTokens && !showCustomTokens2) { // turn unlisted off
			if (table1Loaded) {
				$('#showSpam').bootstrapToggle('destroy');
			}
		} else if (!showCustomTokens && showCustomTokens2) { //turn unlisted on
			if (table1Loaded) {
				$('#showSpam').bootstrapToggle();
			}
		}
		showCustomTokens = showCustomTokens2;
		showListed = $('#showListed').prop('checked');
		if (!running) {
			tokenCount = getTokenCount();
			setBalanceProgress();
		}

		setStorage();

		let loadedCustom = true;
		let loadedListed = true;
		Object.keys(exchanges).forEach(function (name) {
			if (exchanges[name].enabled) {
				if (!exchanges[name].completedUnlisted)
					loadedCustom = false;
				if (!exchanges[name].completedListed)
					loadedListed = false;
			}
		});

		//slightly delay to allow toggle to animate
		setTimeout(function () {
			if (lastResult && !running) {
				if (loadedCustom && loadedListed) { // we already have all data
					finishedBalanceRequest();
				} else if (loadedListed && !showCustomTokens) { // we already have all (non unlisted) data
					finishedBalanceRequest();
				} else if (showCustomTokens && !loadedCustom && (!showListed || loadedListed)) {
					getBalances(false, true); // load only unlisted tokens
				} else {  // just load everything
					getBalances(false, false);
				}
			} else if (running) {
				//clicked when never finished loading yet, and settings are different, just reload everything
				if ((!runningCustom && showCustomTokens) || (!runningListed && showListed)) {
					getBalances(false, false);
				}
			}
		}, 110);
		return;
	}

	function getTokenCount() {
		let listed = _delta.config.tokens.length;
		let unlisted = _delta.config.customTokens.length - listed;
		let currentcount = 0;
		if (showCustomTokens) {
			currentcount += unlisted;
		}
		if (showListed) {
			currentcount += listed;
		}
		if (currentcount == 0) {
			currentcount = 1; //load only ETH
		}
		//$('#tokencount').html(" " + currentcount + "/" + maxcount);
		return currentcount;
	}

	function disableInput(disable) {
		$('#refreshButton').prop('disabled', disable);
		// $("#address").prop("disabled", disable);
		$("#loadingBalances").prop("disabled", disable);
		$("#tablesearcher").prop("disabled", disable);
		$("#showListed").prop("disabled", disable);
		$("#showUnlisted").prop("disabled", disable);
		$("#showSpam").prop("disabled", disable);

		if (disable)
			$('#loadingBalances').addClass('dim');
		else
			$('#loadingBalances').removeClass('dim');
	}

	function showLoading(balance) {
		if (balance) {
			$('#loadingBalances').addClass('fa-spin');
			$('#loadingBalances').addClass('dim');
			$('#loadingBalances').prop('disabled', true);
			$('#loadingBalances').show();
			$('#refreshButtonLoading').show();
			$('#refreshButtonSearch').hide();
			$('#overviewOverlay').removeClass('hidden-xs');
			$('#overviewOverlay').removeClass('hidden-sm');
		}
		$("#tablesearcher").prop("disabled", balance);

		/*if (!balance) {
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
		} */
	}

	function buttonLoading(balance) {
		if (!publicAddr) {
			hideLoading(balance);
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

	function hideLoading(balance) {
		if (!publicAddr) {
			balance = true;
		}
		$("#tablesearcher").prop("disabled", !balance);
		if (balance) {
			$('#loadingBalances').removeClass('fa-spin');
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
			$('#overviewOverlay').addClass('hidden-xs');
			$('#overviewOverlay').addClass('hidden-sm');
		}
	}

	function myClick() {

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
			hideLoading(true);
		}
	}

	function getAll(autoload) {
		trigger_1 = true;

		lastResult = undefined;

		if (publicAddr) {
			setStorage();
			window.location.hash = publicAddr;
			getBalances(false, false);
		} else {
			running = false;
		}
	}

	function resetExLoadingState() {

		function setLoad(name) {
			exchanges[name].loaded = exchanges[name].enabled ? 0 : -1;
			exchanges[name].displayed = !exchanges[name].enabled;
			balanceHeaders[name] = exchanges[name].enabled;
			exchanges[name].loadedUnlisted = 0;
			exchanges[name].completedUnlisted = false;
			exchanges[name].loadedListed = 0;
			exchanges[name].completedListed = false;
		}

		Object.keys(exchanges).forEach(function (key) {
			setLoad(key);
		});
	}

	function appendExLoadingState() {

		function setLoad(name) {
			if (exchanges[name].enabled) {
				exchanges[name].loaded = 0;
				if (showCustomTokens)
					exchanges[name].loaded += exchanges[name].loadedUnlisted;
				if (showListed || (!showListed && !showCustomTokens))
					exchanges[name].loaded += exchanges[name].loadedListed;
			} else {
				exchanges[name].loaded = -1;
			}
			exchanges[name].displayed = !exchanges[name].enabled;
			//	if(!addCustom) {

			//	} else {

			//	}
			//	if (exchanges[name].enabled && ((addCustom && exchanges[name].loaded >= _delta.config.tokens.length) || (!addCustom && exchanges[name].loaded >= tokenCount))) {
			//		exchanges[name].displayed = false;
			//	} else {
			//		exchanges[name].loaded = exchanges[name].enabled ? 0 : -1;

			//	}
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

	function getBalances(appendExchange, appendCustom) {
		if (!publicAddr)
			return;

		hidePopovers();

		requestID++;
		running = true;
		runningListed = showListed;
		runningCustom = showCustomTokens;

		let rqid = requestID;

		//		if (!trigger_1)
		//			return;

		let loadedCustom = true;
		let loadedListed = true;
		Object.keys(exchanges).forEach(function (name) {
			if (exchanges[name].enabled) {
				if (!exchanges[name].completedUnlisted)
					loadedCustom = false;
				if (!exchanges[name].completedListed)
					loadedListed = false;
			}
		});

		if (!appendExchange && !appendCustom && !(lastResult && showListed && !loadedListed)) {
			balances = {};
		}

		clearOverviewHtml(false);

		$('#downloadBalances').html('');

		trigger_1 = false;
		//disableInput(true);

		loadedBid = 0;
		failedBid = 0;

		showLoading(true);

		if (!appendExchange && !appendCustom)
			resetExLoadingState();
		else
			appendExLoadingState();

		tokenCount = getTokenCount();

		let logcount = tokenCount;
		if (appendCustom)
			logcount -= _delta.config.tokens.length;
		console.log('preparing to retrieve balances for ' + logcount + ' tokens');



		setBalanceProgress();
		if (table1Loaded) {
			balanceTable.clear();
			for (let i = 0; i < tableHeaders.length; i++) {
				let enabled = balanceHeaders[tableHeaders[i].title];
				let column = balanceTable.column(i).visible(enabled);
			}
			//balanceTable.columns.adjust().fixedColumns().relayout().draw();
			balanceTable.draw();
		}


		if (!appendExchange && !appendCustom) {
			for (let i = 0; i < _delta.config.customTokens.length; i++) {
				let token = _delta.config.customTokens[i];
				if (token && !balances[token.addr])
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
				SingularX: 0,
				EtherC: 0,
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

		//prices from IDEX https endpoint
		function retryURL1() {

			$.ajax({
				dataType: "json",
				url: 'https://api.idex.market/returnTicker',
				data: "",
				success: (result) => {
					if (requestID <= rqid) {
						if (result) {
							parsePrices(result, 'ID');
						} else if (loadedBid < 2 && url1Retries < numRetries) {
							url1Retries++;
							retryURL1();
						} else if (url1Retries >= numRetries) {
							showError("Failed to retrieve IDEX Prices after 3 tries. Prices may be less accurate.");
							loadedBid++;
							finishedBalanceRequest();
						}
					}
				},
				timeout: 2500
			}).fail((result) => {
				if (requestID <= rqid) {
					if (loadedBid < 2 && url1Retries < numRetries) {
						url1Retries++;
						retryURL1();
					}
					else if (url1Retries >= numRetries) {
						loadedBid++;
						failedBid++;
						finishedBalanceRequest();
					}
				}
			});
		}

		function parsePrices(result, source) {
			let results = Object.values(result);
			let keys = Object.keys(result);
			if (source == 'ID') {
				//map idex token names to addresses
				keys = keys.map((key) => {
					let name = key.replace('ETH_', '');
					const matchingTokens = _delta.config.customTokens.filter(
						x => x.IDEX && x.IDEX === name);

					if (matchingTokens.length > 0) {
						return matchingTokens[0].addr;
					} else {
						return key;
					}
				})
			}

			for (let i = 0; i < results.length; i++) {

				if (source == 'ED' || source == 'FD') {
					let token = _delta.uniqueTokens[results[i].tokenAddr];
					if (token && balances[token.addr]) {
						balances[token.addr][source + 'Bid'] = Number(results[i].bid);
						balances[token.addr][source + 'Ask'] = Number(results[i].ask);
					}
				} else if (source == 'ID') {
					let token = _delta.uniqueTokens[keys[i]];
					if (token && balances[token.addr]) {
						balances[token.addr][source + 'Bid'] = Number(results[i].highestBid);
						balances[token.addr][source + 'Ask'] = Number(results[i].lowestAsk);
					}
				}
				else if (source == 'BIN') {

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
		var tokens2 = _delta.config.customTokens;
		if (addCustom && showCustomTokens) {
			tokens2 = tokens2.filter((x) => { return x.unlisted; }); // only custom tokens
		} else if (!showCustomTokens && showListed) {
			tokens2 = tokens2.filter((x) => { return !x.unlisted; }); // only listed tokens
		} else if (!showCustomTokens && !showListed) {
			tokens2 = [_delta.config.tokens[0]]; // only ETH
		}

		tokens2 = tokens2.map((x) => { return x.addr; });

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

			//get balances from 2 web3 sources at once, use the fastest response
			// web3 provider (infura, myetherapi, mycryptoapi) or etherscan
			makeCall(mode, functionName, arguments, 0);
			makeCall(mode, functionName, arguments, 0);

			function makeCall(exName, funcName, args, retried) {

				if (web3Index < _delta.web3s.length) {
					web3Provider = _delta.web3s[web3Index];
					web3Index++;
				} else {
					web3Provider = undefined;
					web3Index = 0;
				}
				if (completed || requestID > rqid)
					return;


				_util.call(
					web3Provider,
					_delta.contractDeltaBalance,
					_delta.config.DeltaBalanceAddr,
					funcName,
					args,
					(err, result) => {
						if (success || requestID > rqid)
							return;
						completed++;

						const returnedBalances = result;

						if (!err && returnedBalances && returnedBalances.length == tokens.length) {

							if (!success) {
								success = true;
							}
							if (funcName == 'walletBalances' || funcName == 'deltaBalances') {
								if (exchanges[exName].enabled) {

									for (let i = 0; i < tokens.length; i++) {
										let token = _delta.uniqueTokens[tokens[i]];

										if (token && balances[token.addr]) {
											balances[token.addr][exName] = _util.weiToToken(returnedBalances[i], token);
											exchanges[exName].loaded++;
											if (token.unlisted) {
												exchanges[exName].loadedUnlisted++;
											} else {
												exchanges[exName].loadedListed++;
											}

										} else {
											console.log('received unrequested token balance');
										}
									}
									if (exchanges[exName].loaded >= tokenCount)
										finishedBalanceRequest();
								}
							} else {
								console.log('unexpected funcName');
							}
						}
						else if (!success && completed >= 2) // both requests returned with bad response
						{
							const retryAmount = 2;
							if (totalTries >= retryAmount * 2) { //if we retried too much, show an error
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
							else if (retried < retryAmount) //retry up to 3 times per request
							{
								totalTries++;
								makeCall(exName, funcName, args, retried + 1);
								return;
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

	function setBalanceProgress(changeHeaders) {

		let loadingState = {
		}

		let keys = Object.keys(exchanges);
		for (let i = 0; i < keys.length; i++) {
			if (exchanges[keys[i]].enabled) {
				var numLoaded = exchanges[keys[i]].loaded;
				let progressString = '<span style="white-space:normal">' + keys[i] + " ";

				if (numLoaded >= tokenCount || (!lastResult && !running)) {
					progressString += '<span class="text-green">';
				} else {
					progressString += '<span class="text-red">';
				}
				progressString += Math.min(exchanges[keys[i]].loaded, tokenCount) + '/' + tokenCount + '</span></span> ';
				loadingState[keys[i]] = progressString;
			} else {
				loadingState[keys[i]] = '';
			}
		}

		//prices
		{
			let progressString2 = '<span style="white-space:normal">Prices <span style="white-space:nowrap"class="text-';
			if (loadedBid < 2) {
				if (running) {
					progressString2 += 'red"> Loading..';
				} else {
					progressString2 += 'green"> No';
				}
			} else if (failedBid == 0) {
				progressString2 += 'green"> Yes';
			} else if (failedBid == 1) {
				progressString2 += 'green"> 1/2 Failed';
			} else {
				progressString2 += 'red"> Failed';
			}
			progressString2 += '</span></span>';
			loadingState['Prices'] = progressString2;
		}



		if (!progressTableLoaded) {

			var body = $('#balanceProgress tbody');
			var header = $('#balanceProgress thead');
			var headerTr$ = $('<tr/>');
			var tbody$ = $('<tbody/>');
			var row$ = $('<tr/>');
			let values = Object.values(loadingState);
			for (let i = 0; i < values.length; i++) {
				headerTr$.append($('<th/>'));
				row$.append($('<td/>'));
			}

			header.append(headerTr$);
			$('#balanceProgress').append(header);
			tbody$.append(row$);
			body.append(tbody$[0].innerHTML);

			progressTable = $('#balanceProgress').DataTable({
				"paging": false,
				"ordering": false,
				"searching": false,
				"scrollX": true,
				"info": false,
				"orderClasses": false,
			});
			progressTableLoaded = true;
			changeHeaders = true;
		}

		if (changeHeaders) {
			let keys2 = Object.keys(loadingState);
			for (let i = 0; i < keys2.length; i++) { //enable, disable exchanges (prices always enabled)
				if (keys2[i] !== 'Prices') {
					progressTable.column(i).visible(exchanges[keys2[i]].enabled);
				}
			}
		}

		let row2 = Object.values(loadingState);
		progressTable.row(0).data(row2).invalidate();
	}


	// callback when balance request completes
	function finishedBalanceRequest() {

		let keys = Object.keys(exchanges);

		//check if all requests are complete
		let noneDone = true;
		let allDone = true;
		for (let i = 0; i < keys.length; i++) {
			if (exchanges[keys[i]].loaded >= tokenCount || exchanges[keys[i]].loaded == -1) {
				if (exchanges[keys[i]].enabled)
					noneDone = false;
			} else if (exchanges[keys[i]].enabled) {
				allDone = false;
			}
		}

		clearOverviewHtml(false);
		setBalanceProgress();

		if (noneDone) {
			return;
		}

		let sumETH = _delta.web3.toBigNumber(0);
		let sumWETH = _delta.web3.toBigNumber(0);
		let sumToken = _delta.web3.toBigNumber(0);

		for (let i = 0; i < keys.length; i++) {
			if (exchanges[keys[i]].enabled)
				exchanges[keys[i]].displayed = exchanges[keys[i]].loaded >= tokenCount || exchanges[keys[i]].loaded == -1;
		}

		displayedBid = loadedBid >= 2;

		let allTokens = _delta.config.customTokens.filter((t) => { return (showListed && !t.unlisted) || (showCustomTokens && t.unlisted) });
		if (allTokens.length == 0) {
			allTokens = [_delta.config.tokens[0]];
		}
		let allCount = allTokens.length;

		// get totals
		for (let i = 0; i < allCount; i++) {
			let token = allTokens[i];
			let bal = balances[token.addr];

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
				else if ((bal.EDBid || bal.EDAsk || bal.FDBid || bal.FDAsk || bal.IDBid || bal.IDAsk) && bal.Total) {

					//cascade price sources in volume, Binance most accurate price
					if (bal.EDBid)
						bal.Bid = bal.EDBid;
					if (bal.FDBid && (!bal.EDBid || bal.FDBid > bal.EDBid))
						bal.Bid = bal.FDBid;
					if (bal.IDBid)
						bal.Bid = bal.IDBid;
					if (bal.BINBid)
						bal.Bid = bal.BINBid;

					if (bal.EDAsk)
						bal.Ask = bal.EDAsk;
					if (bal.FDAsk && (!bal.EDAsk || bal.FDAsk < bal.EDAsk))
						bal.Ask = bal.FDAsk;
					if (bal.IDAsk)
						bal.Ask = bal.IDAsk;
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

		let result = allTokens.map((t) => { return balances[t.addr]; }).filter((t) => { return t });
		lastResult = result;

		if (allDone) {

			Object.keys(exchanges).forEach(function (name) {
				if (exchanges[name].enabled) {
					if (showCustomTokens)
						exchanges[name].completedUnlisted = true;
					if (showListed)
						exchanges[name].completedListed = true;
				}
			});

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

			$('#ethbalance').html('<span data-toggle="tooltip" title="' + _util.exportNotation(sumETH) + '">' + sumETH.toFixed(fixedDecimals) + ' ETH</span>');
			$('#wethbalance').html('<span data-toggle="tooltip" title="' + _util.exportNotation(sumWETH) + '">' + sumWETH.toFixed(fixedDecimals) + ' ETH</span>');
			$('#tokenbalance').html('<span data-toggle="tooltip" title="' + _util.exportNotation(sumToken) + '">' + sumToken.toFixed(fixedDecimals) + ' ETH</span>');
			let totalSumETH = sumETH.plus(sumToken).plus(sumWETH);
			$('#totalbalance').html('<span data-toggle="tooltip" title="' + _util.exportNotation(totalSumETH) + '">' + totalSumETH.toFixed(fixedDecimals) + ' ETH</span>');

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
		hidePopovers();

		var loaded = table1Loaded;
		var filtered = result;

		if (hideZeros) {
			filtered = filtered.filter(x => {
				return (
					(!hideZeros || (Number(x.Total) > 0 || x.Address === _delta.config.ethAddr))
					&& (showSpam || !_delta.uniqueTokens[x.Address].spam)
				);
			});
		}

		balanceHeaders['Ask'] = useAsk;
		balanceHeaders['Bid'] = !useAsk;

		balanceHeaders['USD'] = showFiat == 1;
		balanceHeaders['EUR'] = showFiat == 2;

		//count number off active exchanges
		let numColumns = Object.values(exchanges).reduce((sum, ex) => { if (ex.enabled) return sum + 1; else return sum; }, 0);
		balanceHeaders['Total'] = numColumns > 1;

		if (!table1Loaded) {
			tableHeaders = getColumnHeaders(filtered, balanceHeaders);
			makeInitTable('#resultTable', tableHeaders, balancesPlaceholder);
		}
		let tableData = buildTableRows(filtered, tableHeaders);
		trigger(tableData, tableHeaders);
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
			localStorage.setItem("listedTokens", showListed);
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
				let custom = localStorage.getItem('customTokens');
				showCustomTokens = custom === "true";
			}

			if (localStorage.getItem("listedTokens") === null) {
				showListed = true;
			} else {
				let listed = localStorage.getItem('listedTokens');
				showListed = listed === "true";
			}

			if (localStorage.getItem("hideZero") === null) {
				hideZero = true;
			} else {
				let zero = localStorage.getItem('hideZero');
				hideZero = zero === "true";
			}

			if (localStorage.getItem("decimals") === null) {
				decimals = false;
			} else {
				let dec = localStorage.getItem('decimals');
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
				let addr = localStorage.getItem("address");
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
				let addr = sessionStorage.getItem("address");
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
	function trigger(dataSet, tableHeaders) {

		let keys = Object.keys(exchanges);
		let totalIndex = 4;
		for (let i = 0; i < keys.length; i++) {
			if (!exchanges[keys[i]].enabled) {
				totalIndex++;
			}
		}

		if (!table1Loaded) {
			balanceTable = $('#resultTable').DataTable({
				"paging": false,
				"ordering": true,
				//"info": true,
				"scrollY": "60vh",
				"scrollX": true,
				"scrollCollapse": true,
				"orderClasses": false,
				"deferRender": true,
				fixedColumns: {
					leftColumns: 1
				},
				aoColumnDefs: [
					{ bSearchable: true, aTargets: [0] },
					{ asSorting: ["asc", "desc"], aTargets: [0] },
					{ bSearchable: false, aTargets: ['_all'] },
					{ asSorting: ["desc", "asc"], aTargets: ['_all'] },
					//	{ sClass: "dt-body-left", aTargets: [0]},
					//	{ sClass: "dt-body-right", aTargets: ['_all'] },
				],
				"dom": '<"toolbar">frtip',
				"language": {
					"search": '<i class="dim fa fa-search"></i>',
					"searchPlaceholder": " Token Symbol / Name",
					"zeroRecords": "No balances loaded",
					"info": "Showing _TOTAL_ balances",
					"infoEmpty": "No balances found",
					"infoFiltered": "(filtered from _MAX_ )"
				},
				"drawCallback": function (settings) {
					setTimeout(function () {
						$("[data-toggle=popover]").popover();
					}, 300);
				}
			});
			updateToggleToolbar();
			table1Loaded = true;
		}

		balanceTable.clear();
		if (dataSet.length > 0) {
			for (let i = 0; i < dataSet.length; i++) {
				balanceTable.rows.add(dataSet[i]);
			}
		}

		for (let i = 0; i < tableHeaders.length; i++) {
			let enabled = balanceHeaders[tableHeaders[i].title];
			let column = balanceTable.column(i).visible(enabled);
		}

		//	balanceTable.columns.adjust().fixedColumns().relayout().draw();
		balanceTable.draw();

		$("[data-toggle=popover]").popover();

		$('[data-toggle=tooltip]').unbind();
		$('[data-toggle=tooltip]').tooltip({
			'placement': 'top',
			'container': 'body',
			'trigger': 'manual'
		}).on("mouseenter", function () {
			let _this = this;
			$('[data-toggle=tooltip]').each(function () {
				if (this !== _this) {
					$(this).tooltip('hide');
				}
			});
			$(_this).tooltip("show");
			$(".tooltip").on("mouseleave", function () {
				$(_this).tooltip('hide');
			});
		}).on("mouseleave", function () {
			let _this = this;
			setTimeout(function () {
				if (!$(".tooltip:hover").length) {
					$(_this).tooltip("hide");
				}
			}, 300);
		});

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
			hideLoading(true);
			running = false;
			requestID++;
			buttonLoading(true);
		}
	}

	function updateToggleToolbar() {

		let numberListed = _delta.config.customTokens.filter((x) => { return !x.unlisted }).length;
		let numberUnlisted = _delta.config.customTokens.filter((x) => { return x.unlisted }).length;

		$("div.toolbar").html(`<label  class="togglebox togglebox1 checkbox-inline"> <input type="checkbox" id="showListed" checked data-toggle="toggle" data-style="fast" data-width="100" data-on="Listed (` + numberListed + `)" data-off="Listed <strike>(` + numberListed + `)</strike>"
			data-onstyle="primary" data-offstyle="default" data-size="mini"> </label>
			<label class="togglebox checkbox-inline"> <input type="checkbox" id="showUnlisted" data-toggle="toggle" data-style="fast" data-width="100" data-on="Unlisted (`+ numberUnlisted + `)" data-off="Unlisted <strike>(` + numberUnlisted + `)</strike>"
			data-onstyle="warning" data-offstyle="default" data-size="mini"> </label>
			<label class="togglebox checkbox-inline"> <input type="checkbox" id="showSpam" data-toggle="toggle" data-style="fast" data-width="100" data-on="Unlisted spam" data-off="Unlisted spam"
			data-onstyle="warning" data-offstyle="default" data-size="mini"> </label>`
		);

		$('#showUnlisted').prop('checked', showCustomTokens);
		$('#showListed').prop('checked', showListed);
		$('#showSpam').prop('checked', showSpam);
		$('[data-toggle=toggle]').bootstrapToggle();

		$('#showListed').change(checkListing);
		$('#showUnlisted').change(checkListing);
		$('#showSpam').change(checkSpam);

		if (!showCustomTokens) {
			$('#showSpam').bootstrapToggle('destroy');
		}
	}

	// Builds the HTML Table out of myList.
	function buildTableRows(myList, headers) {
		let resultTable = [];

		for (var i = 0; i < myList.length; i++) {

			if (!showCustomTokens && myList[i].Unlisted)
				continue;
			var row$ = $('<tr/>');

			for (var colIndex = 0; colIndex < headers.length; colIndex++) {
				var cellValue = myList[i][headers[colIndex].title];
				if (cellValue == null) cellValue = "";
				var head = headers[colIndex].title;


				if (head == 'Total' || head == 'EtherDelta' || head == 'Decentrex' || head == 'Token store' || head == 'IDEX' || head == 'Enclaves' || head == 'DEXY' || head == 'SingularX' || head == 'EtherC' || head == 'Ethen' || head == 'Wallet' || head == 'Bid' || head == 'Ask' || head == 'Est. ETH') {
					if (cellValue !== "" && cellValue !== undefined) {
						var dec = fixedDecimals;
						if (head == 'Bid' || head == 'Ask') {
							dec += 2;
						}
						var num = '<span data-toggle="tooltip" title="' + _util.exportNotation(cellValue) + '">' + cellValue.toFixed(dec) + '</span>';
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
					if (token) {
						let popover = _delta.makeTokenPopover(token);
						let search = token.name;
						if (token.name2) {
							search += ' ' + token.name2;
						}
						row$.append($('<td data-sort="' + token.name + '" data-search="' + search + '"/>').html(popover));
					} else {
						row$.append($('<td/>').html(""));
					}
				}
				else {
					row$.append($('<td/>').html(cellValue));
				}
			}
			resultTable.push(row$);
		}
		return resultTable;
	}

	var balanceHeaders = { 'Name': 1, 'Wallet': 1, 'EtherDelta': 1, 'IDEX': 1, 'Token store': 1, 'Enclaves': 1, 'Decentrex': 1, 'SingularX': 1, 'EtherC': 1, 'DEXY': 0, 'Ethen': 0, 'Total': 1, 'Value': 1, 'Bid': 1, 'Ask': 0, 'Est. ETH': 1, 'USD': 0, 'EUR': 0 };

	// Adds a header row to the table and returns the set of columns.
	// Need to do union of keys from all records as some records may not contain
	// all records.
	function getColumnHeaders(myList, headers) {
		var columnSet = {};
		var columns = [];

		// ensure header is a digit 1, 0
		Object.keys(headers).map((k) => { headers[k] = Number(headers[k]); });

		if (myList.length == 0) {
			myList = balancesPlaceholder;
		}
		for (var i = 0; i < myList.length; i++) {
			var rowHash = myList[i];
			for (var key in rowHash) {
				if (!columnSet[key] && headers[key] >= 0) {
					columnSet[key] = 1;
					columns.push({ title: key });
				}
			}
		}
		return columns;
	}

	function makeInitTable(selector, headers, placeholderData) {

		if (!table1Loaded) {
			var header1 = $(selector + ' thead');
			var headerTr$ = $('<tr/>');

			for (let i = 0; i < headers.length; i++) {
				let head = headers[i].title;
				headerTr$.append($('<th/>').html(head));
			}

			header1.append(headerTr$);
			$(selector).append(header1);

			var body = $(selector + ' tbody');
			var tbody$ = $('<tbody/>');
			var row$ = $('<tr/>');
			for (var colIndex = 0; colIndex < headers.length; colIndex++) {
				var cellValue = placeholderData[headers[colIndex].title];
				var head = headers[colIndex].title;

				if (head == 'Name') {
					row$.append($('<td data-sort="" data-search=""/>'));
				} else {
					row$.append($('<td/>'));
				}
			}
			tbody$.append(row$);
			body.append(tbody$[0].innerHTML);
		}
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