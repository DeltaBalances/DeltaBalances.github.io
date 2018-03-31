{
	// shorthands
	var _delta = bundle.DeltaBalances;
	var _util = bundle.utility;

	// initiation
	var initiated = false;
	var autoStart = false;

	var requestID = 0;

	// loading states
	var table2Loaded = false;


	var loadedCustom = false;
	var trigger_1 = false;
	var trigger_2 = false;
	var running = false;

	var etherscanFallback = false;

	// settings
	var decimals = false;
	var fixedDecimals = 3;
	var remember = false;

	var showTransactions = true;



	// user input & data
	var publicAddr = '';
	var savedAddr = '';
	var lastResult2 = undefined;
	var lastResult3 = undefined;

	// config
	var tokenCount = 0; //auto loaded
	var blocktime = 14;
	var blocknum = -1;
	var startblock = 0;
	var endblock = 'latest';
	var transactionDays = 3;

	// placeholder
	var transactionsPlaceholder = [
		{
			Status: true,
			Exchange: 'EtherDelta',
			Type: 'Deposit',
			Name: 'ETH',
			Value: 0,
			Price: '',
			'ETH': 0,
			Hash: '',
			Date: toDateTimeNow(),
			Details: window.location.origin + window.location.pathname + '/../tx.html#',
			Unlisted: false,
			TokenAddr: ''
		}
	];


	init();

	$(document).ready(function () {
		readyInit();
	});

	function init() {


		// borrow some ED code for compatibility
		_delta.startDeltaBalances(() => {
			if (!autoStart) {
				if (blocknum > -1) {
					startblock = getStartBlock(blocknum, transactionDays);
				}
				else {
					_util.blockNumber(_delta.web3, (err, num) => {
						if (!err && num) {
							blocknum = num;
							startblock = getStartBlock(blocknum, transactionDays);
						}
					});
				}
			}

			_delta.initTokens(true);

			initiated = true;
			if (autoStart)
				myClick();
		});
	}

	function readyInit() {
		getStorage();

		$('#decimals').prop('checked', decimals);
		checkDecimal();

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
			$("#transactionsTable2").trigger("applyWidgets");

			//hide popovers
			$('[data-toggle="popover"]').each(function () {
				$(this).popover('hide');
				$(this).data("bs.popover").inState = { click: false, hover: false, focus: false };
			});
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



		placeholderTable();

		// url parameter ?addr=0x... /#0x..
		var addr = getParameterByName('addr');
		if (!addr) {
			var hash = window.location.hash;  // url parameter /#0x...
			if (hash)
				addr = hash.slice(1);
		}
		if (addr) {
			addr = getAddress(addr);
			if (addr) {
				publicAddr = addr;
				autoStart = true;
				// auto start loading
				myClick();
			}
		}
		else if (publicAddr) {
			autoStart = true;
			myClick();
		} else if (savedAddr) {//autoload when remember is active
			publicAddr = savedAddr;
			autoStart = true;
			// auto start loading
			loadSaved();
		}
		else if (!addr && !publicAddr) {
			$('#address').focus();
		}
	}

	// more decimals checbox
	var changedDecimals = false;
	function checkDecimal() {
		changedDecimals = true;
		decimals = $('#decimals').prop('checked');
		setStorage();
		fixedDecimals = decimals ? 8 : 3;


		$('#transactionsTable2 tbody').empty();
		$('#transactionsTable2 thead').empty();

		if (lastResult2) {


			makeTable2(lastResult2);
		} else {
			placeholderTable();
		}
		changedDecimals = false;
	}





	function disableInput(disable) {
		$('#refreshButton').prop('disabled', disable);
		// $("#address").prop("disabled", disable);
		$('#loadingTransactions2').addClass('dim');
		$("#loadingTransactions2").prop("disabled", disable);

	}

	function showLoading(balance, trans) {
		if (trans) {
			$('#loadingTransactions2').addClass('fa-spin');
			$('#loadingTransactions2').addClass('dim');
			$('#loadingTransactions2').prop('disabled', true);
			$('#loadingTransactions2').show();
			$('#refreshButtonLoading').show();
			$('#refreshButtonSearch').hide();
		}
		else if (!trans) {
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
		}
	}

	function buttonLoading(balance, trans) {
		if (!publicAddr) {
			hideLoading(balance, trans);
			return;
		}
		if (trans) {
			$('#loadingTransactions2').removeClass('fa-spin');
			$('#loadingTransactions2').removeClass('dim');
			$('#loadingTransactions2').prop('disabled', false);
			$('#loadingTransactions2').show();
			$('#refreshButtonLoading').show();
			$('#refreshButtonSearch').hide();
		}
		if (trans) {
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
		}
	}

	function hideLoading(balance, trans) {
		if (!publicAddr) {
			trans = true;
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
		}

		if (trans) {
			$('#loadingTransactions2').removeClass('fa-spin');
			$('#loadingTransactions2').removeClass('dim');
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
		//if(running)
		//	return;

		running = true;

		trigger_2 = true;

		lastResult2 = undefined;
		lastResult3 = undefined;

		if (publicAddr) {
			setStorage();
			window.location.hash = publicAddr;
			getTrans(rqid);

		} else {
			running = false;
		}
	}


	function getTrans(rqid) {
		if (!trigger_2)
			return;

		if (showTransactions) {

			trigger_2 = false;
			//disableInput(true);

			showLoading(false, true);

			$('#transactionsTable2 tbody').empty();

			if (blocknum > 0) // blocknum also retrieved on page load, reuse it
			{
				console.log('blocknum re-used');
				startblock = getStartBlock(blocknum, transactionDays);
				getTransactions(rqid);
			}
			else {
				console.log("try blocknum v2");
				_util.blockNumber(_delta.web3, (err, num) => {
					if (num) {
						blocknum = num;
						startblock = getStartBlock(blocknum, transactionDays);
					}
					getTransactions(rqid);
				});
			}
		}
	}


	// check if input address is valid
	function getAddress(addr) {

		setAddrImage('');
		document.getElementById('currentAddr').innerHTML = '0x......'; // side menu
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

		document.getElementById('address').value = address;
		document.getElementById('currentAddr').innerHTML = address.slice(0, 16); // side menu
		document.getElementById('currentAddr2').innerHTML = address.slice(0, 8); //top bar
		$('#walletInfo').removeClass('hidden');
		if (!savedAddr || address.toLowerCase() !== savedAddr.toLowerCase()) {
			$('#save').removeClass('hidden');
			if (savedAddr) {
				$('#savedSection').removeClass('hidden');
			}
		} else if (savedAddr && address.toLowerCase() === savedAddr.toLowerCase()) {
			$('#save').addClass('hidden');
			$('#savedSection').addClass('hidden');
			document.getElementById('currentAddrDescr').innerHTML = 'Saved address';
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


	function getStartBlock(blcknm, days) {
		startblock = Math.floor(blcknm - ((days * 24 * 60 * 60) / blocktime));
		return startblock;
	}

	function validateDays(input) {
		input = parseInt(input);
		var days = 1;
		if (input < 1)
			days = 1;
		else if (input > 999)
			days = 999;
		else
			days = input;

		transactionDays = days;
		if (blocknum > 0) {
			getStartBlock(blocknum, transactionDays);
		}
	}

	// get parameter from url
	function getParameterByName(name, url) {
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}



	function getTransactions(rqid) {
		var transLoaded = 0;
		var transResult = [];
		var inTransResult = [];
		var tradeLogResult = [];


		let normalRetries = 0;
		let internalRetries = 0;

		normalTransactions();
		internalTransactions();

		function normalTransactions() {
			$.getJSON('https://api.etherscan.io/api?module=account&action=txlist&address=' + publicAddr + '&startblock=' + startblock + '&endblock=' + endblock + '&sort=desc&apikey=' + _delta.config.etherscanAPIKey).done((result) => {
				if (requestID > rqid)
					return;
				if (result && result.status === '1')
					transResult = result.result;
				transLoaded++;
				if (transLoaded == 2)
					processTransactions();
			}).fail((result) => {
				if (requestID > rqid)
					return;
				if (normalRetries < 2) {
					normalRetries++;
					normalTransactions();
					return;
				} else {
					showError('Failed to load recent transactions (deposit, trade & cancel) after 3 tries, try again later.');
					transLoaded++;
					if (transLoaded == 2)
						processTransactions();
				}
			});
		}

		function internalTransactions() {
			// internal ether transactions (withdraw)
			$.getJSON('https://api.etherscan.io/api?module=account&action=txlistinternal&address=' + publicAddr + '&startblock=' + startblock + '&endblock=' + endblock + '&sort=desc&apikey=' + _delta.config.etherscanAPIKey).done((result2) => {
				if (requestID > rqid)
					return;
				if (result2 && result2.status === '1')
					inTransResult = result2.result;
				transLoaded++;
				if (transLoaded == 2)
					processTransactions();
			}).fail((result) => {
				if (requestID > rqid)
					return;
				if (internalRetries < 2) {
					internalRetries++;
					internalTransactions();
					return;
				} else {
					showError('Failed to load recent transactions (withdraws) after 3 tries, try again later.');
					transLoaded++;
					if (transLoaded == 2)
						processTransactions();
				}
			});
		}


		function processTransactions() {
			var myAddr = publicAddr.toLowerCase();


			var txs = transResult;
			var outputTransactions = [];

			var itxs = inTransResult; //withdraws
			var withdrawHashes = {};
			var logs = tradeLogResult;



			// internal tx, withdraws
			for (var i = 0; i < itxs.length; i++) {
				var tx = itxs[i];
				if (_delta.isExchangeAddress(tx.from.toLowerCase())) {
					var val = _util.weiToEth(Number(tx.value));
					var trans = createOutputTransaction('Withdraw', 'ETH', val, '', tx.hash, tx.timeStamp, false, 0, '', tx.isError === '0', _delta.addressName(tx.from, false));
					outputTransactions.push(trans);
					withdrawHashes[tx.hash.toLowerCase()] = true;
				}
			}
			var tokens = [];

			// normal tx, deposit, token, trade
			for (var i = 0; i < txs.length; i++) {
				var tx = txs[i];
				//if(tx.isError === '0')
				{
					var val = Number(tx.value);
					var txto = tx.to.toLowerCase();
					if (val > 0 && _delta.isExchangeAddress(txto)) // eth deposit
					{
						var val2 = _util.weiToEth(val);
						var trans = createOutputTransaction('Deposit', 'ETH', val2, '', tx.hash, tx.timeStamp, false, 0, '', tx.isError === '0', _delta.addressName(txto, false));
						outputTransactions.push(trans);
					}
					else if (val == 0 && _delta.isExchangeAddress(txto)) {
						if (!withdrawHashes[tx.hash]) // exclude withdraws
						{
							tokens.push(tx); //withdraw, deposit & trade, & cancel
						}
					}
				}
			}


			for (var l = 0; l < tokens.length; l++) {
				var unpacked = _util.processInput(tokens[l].input);
				if (unpacked && unpacked.name) {
					let obj = _delta.processUnpackedInput(tokens[l], unpacked);
					if (obj) {
						let trans = undefined;
						let exchange = _delta.addressName(tokens[l].to.toLowerCase(), false);
						if (unpacked.name === 'depositToken' || unpacked.name === 'withdrawToken') {
							obj.type = obj.type.replace('Token ', '');
							trans = createOutputTransaction(obj.type, obj.token.name, obj.amount, '', tokens[l].hash, tokens[l].timeStamp, obj.unlisted, obj.token.addr, '', tokens[l].isError === '0', exchange);
						}
						else if (unpacked.name === 'cancelOrder') {
							trans = createOutputTransaction(obj.type, obj.token.name, obj.amount, '', tokens[l].hash, tokens[l].timeStamp, obj.unlisted, obj.token.addr, obj.price, tokens[l].isError === '0', exchange);
						}
						else if (unpacked.name === 'trade') {
							trans = createOutputTransaction(obj.type, obj.token.name, obj.amount, obj.ETH, tokens[l].hash, tokens[l].timeStamp, obj.unlisted, obj.token.addr, obj.price, tokens[l].isError === '0', exchange);
						}

						if (trans)
							outputTransactions.push(trans);
					}
				}
			}

			done();

			function createOutputTransaction(type, name, val, total, hash, timeStamp, unlisted, tokenaddr, price, status, exchange) {
				if (status === undefined)
					status = true;
				return {
					Status: status,
					Exchange: exchange,
					Type: type,
					Name: name,
					Value: val,
					Price: price,
					'ETH': total,
					Hash: hash,
					Date: toDateTime(timeStamp),
					Details: window.location.origin + window.location.pathname + '/../tx.html#' + hash,
					Unlisted: unlisted,
					TokenAddr: tokenaddr,
				};
			}

			function done() {
				var txs = Object.values(outputTransactions);
				lastResult2 = txs;
				makeTable2(txs);
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



	//transactions table
	function makeTable2(result) {
		var result2 = result.filter((x) => { return x.Status && (x.Type === 'Deposit' || x.Type === 'Withdraw') });
		$('#transactionsTable2 tbody').empty();
		var loaded = table2Loaded;
		if (changedDecimals)
			loaded = false;
		buildHtmlTable('#transactionsTable2', result, loaded, 'transactions', transactionHeaders);
		trigger2();

	}

	function placeholderTable() {
		var result2 = transactionsPlaceholder;
		makeTable2(result2);
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

			localStorage.setItem("decimals", decimals);

		}
	}

	function getStorage() {
		if (typeof (Storage) !== "undefined") {

			if (localStorage.getItem("usd") === null) {
				showDollars = true;
			} else {
				showDollars = localStorage.getItem('usd');
				if (showDollars === "false")
					showDollars = false;
			}

			if (localStorage.getItem("decimals") === null) {
				decimals = false;
			} else {
				var dec = localStorage.getItem('decimals');
				decimals = dec === "true";
			}

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
	function trigger2() {
		if (table2Loaded) // reload existing table
		{


			$("#transactionsTable2").trigger("update", [true, () => { }]);
			$("#transactionsTable2 thead th").data("sorter", true);
			//$("table").trigger("sorton", [[0,0]]);

		} else {


			$("#transactionsTable2 thead th").data("sorter", true);
			$("#transactionsTable2").tablesorter({
				widgets: ['scroller'],
				widgetOptions: {
					scroller_height: 1000,
					scroller_barWidth: 18,
					scroller_upAfterSort: true,
				},
				sortList: [[7, 1]]
			});

			table2Loaded = true;
		}
		trigger_2 = true;

		if (trigger_2) {
			disableInput(false);
			hideLoading(true, true);
			running = false;
			requestID++;
			buttonLoading(true, true);
		}
		else {
			hideLoading(trigger_2, trigger_2);
		}
		table2Loaded = true;
	}


	// Builds the HTML Table out of myList.
	function buildHtmlTable(selector, myList, loaded, type, headers) {
		var body = $(selector + ' tbody');
		var columns = addAllColumnHeaders(myList, selector, loaded, type, headers);

		for (var i = 0; i < myList.length; i++) {

			var row$ = $('<tr/>');

			if (type === 'transactions') {
				for (var colIndex = 0; colIndex < columns.length; colIndex++) {
					var cellValue = myList[i][columns[colIndex]];
					if (cellValue == null) cellValue = "";
					var head = columns[colIndex];

					if (head == 'Value' || head == 'Price' || head == "ETH") {
						if (cellValue !== "" && cellValue !== undefined) {
							var dec = fixedDecimals;
							if (head == 'Price')
								dec += 2;
							var num = Number(cellValue).toFixed(dec);
							row$.append($('<td/>').html(num));
						}
						else {
							row$.append($('<td/>').html(cellValue));
						}
					}
					else if (head == 'Name') {

						let token = _delta.uniqueTokens[myList[i].TokenAddr];
						let popoverContents = "Placeholder";
						if (cellValue !== 'ETH') {
							if (token) {
								popoverContents = 'Contract: ' + _util.addressLink(token.addr, true, true) + '<br> Decimals: ' + token.decimals
									+ '<br> Trade on: <ul><li>' + _util.etherDeltaURL(token, true)
									+ '</li><li>' + _util.forkDeltaURL(token, true)
									+ '</li><li>' + _util.tokenStoreURL(token, true) + '</li>';
								if (token.IDEX) {
									popoverContents += '<li>' + _util.idexURL(token, true) + '</li>';
								}
								popoverContents += '</ul>';
							}
						} else {
							popoverContents = "Ether (not a token)<br> Decimals: 18";
						}
						let labelClass = 'label-warning';
						if (!myList[i].Unlisted)
							labelClass = 'label-primary';

						row$.append($('<td/>').html('<a tabindex="0" class="label ' + labelClass + '" role="button" data-html="true" data-toggle="popover" data-placement="auto right"  title="' + cellValue + '" data-container="body" data-content=\'' + popoverContents + '\'>' + cellValue + ' <i class="fa fa-external-link"></i></a>'));

					}
					else if (head == 'Type') {
						if (cellValue == 'Deposit') {
							row$.append($('<td/>').html('<span class="label label-success" >' + cellValue + '</span>'));
						}
						else if (cellValue == 'Withdraw') {
							row$.append($('<td/>').html('<span class="label label-danger" >' + cellValue + '</span>'));
						}
						else if (cellValue == 'Cancel sell' || cellValue == 'Cancel buy') {
							row$.append($('<td/>').html('<span class="label label-default" >' + cellValue + '</span>'));
						}
						else if (cellValue == 'Taker Buy') {
							row$.append($('<td/>').html('<span class="label label-info" >' + cellValue + '</span>'));
						}
						else {
							row$.append($('<td/>').html('<span class="label label-info" >' + cellValue + '</span>'));
						}
					}
					else if (head == 'Hash') {
						row$.append($('<td/>').html(_util.hashLink(cellValue, true, true)));
					}
					else if (head == 'Status') {
						if (cellValue)
							row$.append($('<td align="center"/>').html('<i style="color:green;" class="fa fa-check"></i>'));
						else
							row$.append($('<td align="center"/>').html('<i style="color:red;" class="fa fa-exclamation-circle"></i>'));
					}
					else if (head == 'Details') {

						row$.append($('<td/>').html('<a href="' + cellValue + '" target="_blank">details</a>'));
					}
					else if (head == 'Date') {
						row$.append($('<td/>').html(formatDate(cellValue, false)));
					}
					else {
						row$.append($('<td/>').html(cellValue));
					}
				}
			}

			body.append(row$);
			$("[data-toggle=popover]").popover();
		}
	}


	var transactionHeaders = { 'Name': 1, 'Value': 1, 'Type': 1, 'Hash': 1, 'Date': 1, 'Price': 1, 'ETH': 1, 'Status': 1, 'Details': 1, 'Exchange': 1 };
	// Adds a header row to the table and returns the set of columns.
	// Need to do union of keys from all records as some records may not contain
	// all records.
	function addAllColumnHeaders(myList, selector, loaded, type, headers) {
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

	function toDateTime(secs) {
		var utcSeconds = secs;
		var d = new Date(0);
		d.setUTCSeconds(utcSeconds);
		return d;
		//return formatDate(d);
	}

	function toDateTimeNow(short) {
		var t = new Date();
		return t; //formatDate(t, short);
	}

	function createUTCOffset(date) {

		function pad(value) {
			return value < 10 ? '0' + value : value;
		}

		var sign = (date.getTimezoneOffset() > 0) ? "-" : "+";
		var offset = Math.abs(date.getTimezoneOffset());
		var hours = pad(Math.floor(offset / 60));
		var minutes = pad(offset % 60);
		return sign + hours + ":" + minutes;
	}

	function formatDateOffset(d, short) {
		if (short)
			return formatDate(d, short);
		else
			return formatDateT(d, short) + createUTCOffset(d);
	}

	function formatDate(d, short) {
		var month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear(),
			hour = d.getHours(),
			min = d.getMinutes();


		if (month.length < 2) month = '0' + month;
		if (day.length < 2) day = '0' + day;
		if (hour < 10) hour = '0' + hour;
		if (min < 10) min = '0' + min;

		if (!short)
			return [year, month, day].join('-') + ' ' + [hour, min].join(':');
		else
			return [year, month, day].join('');
	}

	function formatDateT(d, short) {
		if (d == "??")
			return "??";

		var month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear(),
			hour = d.getHours(),
			min = d.getMinutes();


		if (month.length < 2) month = '0' + month;
		if (day.length < 2) day = '0' + day;
		if (hour < 10) hour = '0' + hour;
		if (min < 10) min = '0' + min;

		if (!short)
			return [year, month, day].join('-') + 'T' + [hour, min].join(':');
		else
			return [year, month, day].join('');
	}



	//remove exponential notation 1e-8  etc.
	function exportNotation(num) {
		return Number(num).toFixed(20).replace(/\.?0+$/, ""); // rounded to 25 decimals, no trailing 0
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
			//$('#save').addClass('hidden');
			//$('#savedSection').addClass('hidden');
			myClick();
		}
		return false;
	}
}