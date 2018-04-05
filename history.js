{
	//set var historyConfig in html

	// shorthands
	var _delta = bundle.DeltaBalances;
	var _util = bundle.utility;

	// initiation
	var initiated = false;
	var autoStart = false;

	var requestID = 0;

	// loading states
	var tableLoaded = false;
	var loadedLogs = 0;
	var displayedLogs = false;

	var trigger1 = false;
	var running = false;

	var typeMode = 0;  // 0 trades, 1, deposit/withdraw, 2 all

	// settings
	var decimals = false;
	var fixedDecimals = 3;

	var showTransactions = true;
	var showBalances = true;
	var showCustomTokens = true;


	// user input & data
	var publicAddr = '';
	var savedAddr = '';
	var lastResult = undefined;

	var blockReqs = 0;
	var blockLoaded = 0;

	// config
	var blocktime = 14;
	var blocknum = -1;
	var startblock = 0;
	var endblock = 0;
	var transactionDays = 1;
	var useDaySelector = true;
	var minBlock = historyConfig.minBlock;

	//3154197; //https://etherscan.io/block/3154196  etherdelta_2 creation
	//const minBlock tokenstore 4097028
	//minblock decentrex 3767901 

	var uniqueBlocks = {}; //date for each block
	var blockDates = {};

	// placeholder
	var transactionsPlaceholder = [
		{
			Type: 'Taker',
			Trade: 'Sell',
			Token: { "name": "Token", "addr": "0x00" },
			Amount: 0,
			Price: 0,
			ETH: 0,
			Hash: '0xH4SH1',
			Date: toDateTimeNow(),
			Block: '',
			Buyer: '',
			Seller: '',
			Fee: 0,
			FeeToken: { "name": "Token", "addr": "0x00" },
			'Fee in': { "name": "Token", "addr": "0x00" }, //shorter name feetoken
			Details: window.location.origin + window.location.pathname + '/../tx.html',
			Unlisted: true,
		},
		/*{
			Type: 'Deposit',
			Trade: '',
			Token: { "name": "Token", "addr": "0x00" },
			Amount: 0,
			Price: '',
			ETH: '',
			Hash: '0xH4SH2',
			Date: toDateTimeNow(),
			Block: '',
			Buyer: '',
			Seller: '',
			Fee: '',
			FeeToken: '',
			'Fee in': '', //shorter name feetoken
			Details: window.location.origin + window.location.pathname + '/../tx.html',
			Unlisted: true,
		}*/
	];


	init();

	$(document).ready(function () {
		readyInit();
	});

	function init() {

		getBlockStorage(); // get cached block dates

		// borrow some ED code for compatibility
		_delta.startDeltaBalances(() => {
			//if(!autoStart)
			{
				if (blocknum > -1) {
					startblock = getStartBlock();
				}
				else {
					_util.blockNumber(_delta.web3, (err, num) => {
						if (!err && num) {
							blocknum = num;
							startblock = getStartBlock();
						}
					});
				}
			}

			_delta.initTokens(false);


			initiated = true;
			//if(autoStart)
			//	myClick();
		});
	}

	function readyInit() {


		$('#minBlockLink').html('<a href="https://etherscan.io/tx/' + historyConfig.createTx + '" target="_blank">' + minBlock + '</a>');

		fillMonthSelect();
		let daysDisabled = $('#days').prop('disabled');
		if (!daysDisabled)
			setDaySelector();
		else
			setMonthSelector();

		setBlockProgress(0, 0, 0, 0, 0);

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
			$("#transactionsTable").trigger("applyWidgets");

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

		getStorage();

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
				$("#findTransactions").show();
				$('#loadingTransactions').show();
				//autoStart = true;
				// auto start loading
				//myClick();
			}
		}
		else if (publicAddr) {
			//autoStart = true;
			//myClick();
			$('#loadingTransactions').show();
			$("#findTransactions").show();
		} else if (savedAddr) {//autoload when remember is active
			publicAddr = savedAddr;
			$("#findTransactions").show();
			//autoStart = true;
			// auto start loading
			loadSaved();
		}
		else if (!addr && !publicAddr) {
			$('#address').focus();
		}
	}

	function disableInput(disable) {
		$('#refreshButton').prop('disabled', disable);
		// $("#address").prop("disabled", disable);
		$('#loadingTransactions').addClass('dim');
		$("#loadingTransactions").prop("disabled", disable);
		$("#findTransactions").prop("disabled", disable);
	}

	function showLoading(trans) {
		if (trans) {
			$('#loadingTransactions').addClass('fa-spin');
			$('#loadingTransactions').addClass('dim');
			$('#loadingTransactions').prop('disabled', true);
			$('#loadingTransactions').show();
			$('#refreshButtonLoading').show();
			$('#refreshButtonSearch').hide();
			$("#findTransactions").hide();
		}
	}

	function buttonLoading(trans) {
		if (!publicAddr) {
			hideLoading(trans);
			return;
		}
		if (trans) {
			$('#loadingTransactions').removeClass('fa-spin');
			$('#loadingTransactions').removeClass('dim');
			$('#loadingTransactions').prop('disabled', false);
			if (publicAddr) {
				$("#findTransactions").show();
			}
			$('#loadingTransactions').show();
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
		}
	}

	function hideLoading(trans) {
		if (!publicAddr) {
			trans = true;
		}

		if (trans) {
			$('#loadingTransactions').hide();
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
			if (publicAddr) {
				$("#findTransactions").show();
			}
		}
	}

	function myClick() {
		if (running)
			requestID++;
		if (!initiated) {
			//autoStart = true;
			return;
		}

		hideError();
		hideHint();
		//disableInput(true);
		clearDownloads();

		// validate address
		if (!autoStart)
			publicAddr = getAddress();

		autoStart = false;
		if (publicAddr) {
			window.location.hash = publicAddr;
			getAll(false, requestID);
		}
		else {
			console.log('invalid input');
			disableInput(false);
			hideLoading(true);
		}
	}

	function getAll(autoload, rqid) {
		running = true;

		trigger1 = true;

		lastResult = undefined;

		if (publicAddr) {
			setStorage();
			window.location.hash = publicAddr;
			getTrans(rqid);
		} else {
			running = false;
		}
	}


	function getTrans(rqid) {


		if (!trigger1) {
			myClick(requestID);
			return;
		}

		trigger1 = false;
		loadedLogs = 0;
		displayedLogs = false;
		disableInput(true);
		blockReqs = 0;
		blockLoaded = 0;

		showLoading(true);

		$('#transactionsTable tbody').empty();
		if (blocknum > 0) // blocknum also retrieved on page load, reuse it
		{
			console.log('blocknum re-used');
			startblock = getStartBlock();
			getTransactions(rqid);
		}
		else {
			console.log("try blocknum v2");
			_util.blockNumber(_delta.web3, (err, num) => {
				if (num) {
					blocknum = num;
					startblock = getStartBlock();
				}
				getTransactions(rqid);
			});
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


	function changeTypes() {
		var mode = $('#typeSelect').val();
		mode = Number(mode);

		if (mode >= 0 && mode < 3)
			typeMode = mode;
		else
			mode = 0;
	}


	function setDaySelector() {
		useDaySelector = true;
		validateDays();
		$('#days').prop('disabled', false);
		$('#blockSelect1').prop('disabled', true);
		$('#blockSelect2').prop('disabled', true);
		$('#monthSelect').prop('disabled', true);

	}

	function setMonthSelector() {
		useDaySelector = false;
		checkMonthInput();
		$('#monthSelect').prop('disabled', false);
		$('#days').prop('disabled', true);
		$('#blockSelect1').prop('disabled', true);
		$('#blockSelect2').prop('disabled', true);
	}

	function setBlockSelector() {
		useDaySelector = false;
		$('#days').prop('disabled', true);
		$('#blockSelect1').prop('disabled', false);
		$('#blockSelect2').prop('disabled', false);
		$('#monthSelect').prop('disabled', true);

		$(".blockInput").attr({
			"max": blocknum,
			"min": minBlock,
			"step": 1,
		});

		if (!$('#blockSelect1').val())
			$('#blockSelect1').val(startblock);
		if (!$('#blockSelect2').val())
			$('#blockSelect2').val(blocknum);

		checkBlockInput();
	}


	function checkMonthInput() {
		let val = Number($('#monthSelect').val());

		if (val < 0) val = 0;
		if (val > _delta.config.blockMonths.length - 1) val = _delta.blockMonths.length - 1;

		startblock = _delta.config.blockMonths[val].blockFrom;
		endblock = _delta.config.blockMonths[val].blockTo;

		getStartBlock();
	}

	function checkBlockInput() {
		let block1 = Math.floor($('#blockSelect1').val());
		let block2 = Math.floor($('#blockSelect2').val());

		if (block1 > block2) // swap if values are wrong
		{
			block1 = Math.floor($('#blockSelect2').val());
			block2 = Math.floor($('#blockSelect1').val());
		}

		startblock = Math.max(minBlock, block1);
		endblock = Math.min(block2, blocknum);

		getStartBlock();
	}

	function getStartBlock() {
		if (useDaySelector) {
			startblock = Math.floor(blocknum - ((transactionDays * 24 * 60 * 60) / blocktime));
			startblock = Math.max(startblock, minBlock);
			endblock = blocknum;

		}

		$('#blockSelect1').val(startblock);
		$('#blockSelect2').val(endblock);

		$('#selectedBlocks').html('Selected block range: <a href="https://etherscan.io/block/' + startblock + '" target="_blank">' + startblock + '</a> - <a href="https://etherscan.io/block/' + endblock + '" target="_blank">' + endblock + '</a>');
		return startblock;
	}

	function validateDays() {
		let input = $('#days').val();
		input = parseFloat(input);
		var days = 1;
		if (input < 0.25)
			days = 0.25;
		else if (input > 50)
			days = 50;
		else
			days = input;

		transactionDays = days;
		getStartBlock();
		$('#days').val(days);
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


	function setBlockProgress(loaded, max, trades, start, end) {
		let progressString = 'Loaded ' + loaded + '/' + max + ' blocks, found ' + trades + ' relevant transactions';
		$('#blockProgress').html(progressString);
	}


	function getTransactions(rqid) {

		var topics = [];
		if (typeMode == 0)
			topics = [historyConfig.tradeTopic];
		else if (typeMode == 1)
			topics = [[historyConfig.depositTopic, historyConfig.withdrawTopic]];
		else
			topics = [[historyConfig.tradeTopic, historyConfig.depositTopic, historyConfig.withdrawTopic]];

		var start = startblock;
		var end = endblock;
		const max = 5000;

		let totalBlocks = end - start + 1; //block 5-10 (inclusive) gives you 6 blocks

		loadedLogs = 0;
		let downloadedBlocks = 0;
		setBlockProgress(downloadedBlocks, totalBlocks, 0);

		var tradeLogResult = [];
		const contractAddr = _delta.config[historyConfig.exchangeAddr]; //_delta.config.contractEtherDeltaAddr.toLowerCase();

		var reqAmount = 0;
		for (var i = start; i <= end; i += (max + 1)) {
			reqAmount++;
		}
		var rpcId = 6;

		var activeRequests = 0;
		const maxRequests = 12;
		var activeStart = start;

		// repeat func until it returns false
		for (var i = 0; i < maxRequests; i++) {
			getBatchedLogs();
		}

		function getBatchedLogs() {
			if (activeRequests < maxRequests && activeStart <= end) {
				activeRequests++;
				let tempStart = activeStart;
				activeStart = tempStart + max + 1;
				getLogsInRange(tempStart, Math.min(tempStart + max, end), rpcId);
				rpcId++;
				return true;
			} else {
				return false;
			}

			function getLogsInRange(startNum, endNum, rpcID) {
				_util.getTradeLogs(_delta.web3, contractAddr, topics, startNum, endNum, rpcID, receiveLogs);
			}
		}

		/*	for (var i = start; i <= end; i += (max + 1)) {
				getLogsInRange(i, Math.min(i + max, end), rpcId);
				rpcId++;
			}
	
			function getLogsInRange(startNum, endNum, rpcID) {
				_util.getTradeLogs(_delta.web3, contractAddr, startNum, endNum, rpcID, receiveLogs);
			}
			*/

		function receiveLogs(logs, blockCount) {

			activeRequests--;
			getBatchedLogs();


			if (rqid <= requestID) {
				downloadedBlocks += blockCount;
				if (logs) {

					loadedLogs++;
					if (logs.length > 0) {
						var tradesInResult = parseOutput(logs);

						//get tx times

						var doneBlocks = {};
						for (var i = 0; i < tradesInResult.length; i++) {
							if (!blockDates[tradesInResult[i].Block] && !doneBlocks[tradesInResult[i].Block]) {
								uniqueBlocks[tradesInResult[i].Block] = 1;
								doneBlocks[tradesInResult[i].Block] = true;
								blockReqs++;

								_util.getBlockDate(_delta.web3, tradesInResult[i].Block, (err, unixtimestamp, nr) => {
									if (!err && unixtimestamp) {
										blockDates[nr] = toDateTime(unixtimestamp);
									}

									blockLoaded++;
									if (blockLoaded >= blockReqs) {
										setBlockStorage(); // update cached block dates
										if (!running)
											done();
									}

								});

							}
						}
						tradeLogResult = tradeLogResult.concat(tradesInResult);
					}
					done();
				} else {
					console.log('failed');
				}
			}
		}

		function done() {
			setBlockProgress(downloadedBlocks, totalBlocks, tradeLogResult.length);
			if (loadedLogs < reqAmount) {
				makeTable(tradeLogResult);
				return;
			}

			lastResult = tradeLogResult;
			displayedLogs = true;
			makeTable(lastResult);
		}

		function parseOutput(outputLogs) {
			var outputs = [];
			var myAddr = publicAddr.toLowerCase();
			var addrrr = myAddr.slice(2);

			let filteredLogs = outputLogs.filter((log) => {
				return log.data.indexOf(addrrr) !== -1;
			});

			//if from etherscan, timestamp is included
			// from web3/infura, no timestamp
			if (filteredLogs.length > 0 && filteredLogs[0].timeStamp && filteredLogs[0].blockNumber) {
				for (let i = 0; i < filteredLogs.length; i++) {
					let num = Number(filteredLogs[i].blockNumber);
					if (!blockDates[num]) {
						blockDates[num] = toDateTime(filteredLogs[0].timeStamp);
					}
				}
			}

			let unpackedLogs = _util.processLogs(filteredLogs);

			for (let i = 0; i < unpackedLogs.length; i++) {

				let unpacked = unpackedLogs[i];
				if (!unpacked || unpacked.events.length < 4 || (unpacked.name != 'Trade' && unpacked.name != 'Deposit' && unpacked.name != 'Withdraw')) {
					continue;
				}

				let obj = _delta.processUnpackedEvent(unpacked, myAddr);
				if (obj && !obj.error) {

					var obj2 = {};
					if (unpacked.name == 'Trade') {
						obj2 = {
							Type: obj.transType,
							Trade: obj.tradeType,
							Token: obj.token,
							Amount: obj.amount,
							Price: obj.price,
							ETH: obj.ETH,
							Hash: filteredLogs[i].transactionHash,
							Date: '??', // retrieved by later etherscan call
							Block: _util.hexToDec(filteredLogs[i].blockNumber),
							Buyer: obj.buyer,
							Seller: obj.seller,
							Fee: obj.fee,
							FeeToken: obj.feeCurrency,
							'Fee in': obj.feeCurrency,
							Details: window.location.origin + window.location.pathname + '/../tx.html#' + filteredLogs[i].transactionHash,
							Unlisted: obj.unlisted,
						}
					} else {
						obj2 = {
							Type: obj.type.replace('Token ', ''),
							Trade: '',
							Token: obj.token,
							Amount: obj.amount,
							Price: '',
							ETH: '',
							Hash: filteredLogs[i].transactionHash,
							Date: '??', // retrieved by later etherscan call
							Block: _util.hexToDec(filteredLogs[i].blockNumber),
							Buyer: '',
							Seller: '',
							Fee: '',
							FeeToken: '',
							'Fee in': '',
							Details: window.location.origin + window.location.pathname + '/../tx.html#' + filteredLogs[i].transactionHash,
							Unlisted: obj.unlisted,
						}
					}
					outputs.push(obj2);
				}
			} // for
			return outputs;
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


	function checkBlockDates(trades) {
		for (var i = 0; i < trades.length; i++) {
			if (blockDates[trades[i].Block]) {
				trades[i].Date = blockDates[trades[i].Block];
			}
		}
	}

	//balances table
	function makeTable(result) {
		checkBlockDates(result);
		$('#transactionsTable tbody').empty();
		var filtered = result;
		var loaded = tableLoaded;

		buildHtmlTable('#transactionsTable', filtered, loaded, tradeHeaders);
		trigger();
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

		}
	}

	function getStorage() {
		if (typeof (Storage) !== "undefined") {

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



	function getBlockStorage() {
		if (typeof (Storage) !== "undefined") {
			let dates = localStorage.getItem("blockdates");
			if (dates) {
				dates = JSON.parse(dates);
				if (dates) {
					// map date strings to objects & get count
					let dateCount = Object.keys(dates).map(x => blockDates[x] = new Date(dates[x])).length;
					console.log('retrieved ' + dateCount + ' block dates from cache');
				}

			}
		}
	}

	function setBlockStorage() {
		if (typeof (Storage) !== "undefined") {
			if (blockDates) {
				let dateCount = Object.keys(blockDates).length;
				if (dateCount > 0) {
					console.log('saved ' + dateCount + ' block dates in cache');
					localStorage.setItem("blockdates", JSON.stringify(blockDates));
				}
			}
		}
	}

	// final callback to sort table
	function trigger() {
		if (tableLoaded) // reload existing table
		{
			$("#transactionsTable").trigger("update", [true, () => { }]);
			$("#transactionsTable thead th").data("sorter", true);
			//$("table").trigger("sorton", [[0,0]]);

		} else {
			$("#transactionsTable thead th").data("sorter", true);
			$("#transactionsTable").tablesorter({
				textExtraction: {
					2: function (node, table, cellIndex) { return $(node).find("a").text(); },
				},
				widgets: ['scroller'],
				widgetOptions: {
					scroller_height: 500,
				},
				sortList: [[7, "d"]]
			});

			tableLoaded = true;
		}
		if (displayedLogs)
			trigger1 = true;


		if (trigger1) {
			disableInput(false);
			hideLoading(true);
			running = false;
			requestID++;
			buttonLoading(true);
			downloadAllTrades();
		}
		else {
			hideLoading(trigger1);
		}
		tableLoaded = true;
	}


	// Builds the HTML Table out of myList.
	function buildHtmlTable(selector, myList, loaded, headers) {
		var body = $(selector + ' tbody');
		var columns = addAllColumnHeaders(myList, selector, loaded, headers);

		for (var i = 0; i < myList.length; i++) {
			if (!showCustomTokens && myList[i].Unlisted)
				continue;
			var row$ = $('<tr/>');


			{
				for (var colIndex = 0; colIndex < columns.length; colIndex++) {
					var head = columns[colIndex];
					var cellValue = myList[i][head];

					if (cellValue === null) cellValue = "";


					if (head == 'Amount' || head == 'Price' || head == 'Fee' || head == 'ETH') {
						if (head == 'Fee' && myList[i][columns[0]] != 'Taker') {
							cellValue = '';
						}

						if (cellValue !== "" && cellValue !== undefined) {
							var dec = fixedDecimals;
							if (head == 'Price')
								dec += 6;
							else if (head == 'Fee')
								dec += 2;
							var num = Number(cellValue).toFixed(dec);
							row$.append($('<td/>').html(num));
						}
						else {
							row$.append($('<td/>').html(cellValue));
						}
					}
					else if (head == 'Token' || head == 'Fee in') {
						if ((head == 'Fee in') && myList[i][columns[0]] != 'Taker') {
							cellValue = '';
						}

						if (cellValue !== "" && cellValue !== undefined) {

							let token = cellValue;
							let popoverContents = "Placeholder";
							if (cellValue) {
								if (cellValue.name != 'Token') {
									if (cellValue.name !== 'ETH') {
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
								}
								let labelClass = 'label-warning';
								if (!token.unlisted)
									labelClass = 'label-primary';

								row$.append($('<td/>').html('<a tabindex="0" class="label ' + labelClass + '" role="button" data-html="true" data-toggle="popover" data-placement="auto right"  title="' + token.name + '" data-container="body" data-content=\'' + popoverContents + '\'>' + token.name + ' <i class="fa fa-external-link"></i></a>'));
							}
						}
						else {
							row$.append($('<td/>').html(cellValue));
						}

					}
					else if (head == 'Type') {
						if (cellValue == 'Taker' || cellValue == 'Maker') {
							let contents = ''
							if (cellValue == 'Taker') {
								contents = '<span class="label label-info" >' + cellValue + '</span>';
							}
							else if (cellValue == 'Maker') {
								contents = '<span class="label label-default" >' + cellValue + '</span>';
							}

							if (myList[i].Trade == 'Buy') {
								contents += '<span class="label label-success" >' + myList[i].Trade + '</span>';
							}
							else if (myList[i].Trade == 'Sell') {
								contents += '<span class="label label-danger" >' + myList[i].Trade + '</span>';
							}
							row$.append($('<td/>').html(contents));

						} else if (cellValue == 'Deposit') {
							row$.append($('<td/>').html('<span class="label label-success" >' + cellValue + '</span>'));
						}
						else if (cellValue == 'Withdraw') {
							row$.append($('<td/>').html('<span class="label label-danger" >' + cellValue + '</span>'));
						} else {
							row$.append($('<td/>').html('<span>' + cellValue + '</span>'));
						}


					}
					else if (head == 'Hash') {
						row$.append($('<td/>').html(_util.hashLink(cellValue, true, true)));
					}
					else if (head == 'Block') {
						row$.append($('<td/>').html('<a target="_blank" href="https://etherscan.io/block/' + cellValue + '">' + cellValue + '</a>'));
					}
					else if (head == 'Buyer' || head == 'Seller') {
						let url = '';
						if (cellValue !== '')
							url = _util.addressLink(cellValue, true, true);
						row$.append($('<td/>').html(url));
					}
					else if (head == 'Date') {
						if (cellValue !== '??')
							cellValue = formatDate(cellValue, false, true);
						row$.append($('<td/>').html(cellValue));
					}
					else if (head == 'Details') {

						row$.append($('<td/>').html('<a href="' + cellValue + '" target="_blank">details</a>'));
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

	var tradeHeaders = { 'Type': 1, 'Token': 1, 'Amount': 1, 'Price': 1, 'ETH': 1, 'Hash': 1, 'Date': 1, 'Buyer': 1, 'Seller': 1, 'Fee': 1, 'Fee in': 1, 'Block': 1, 'Details': 1 };
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


	function fillMonthSelect() {
		var select = document.getElementById("monthSelect");

		//Create array of options to be added
		var array = _delta.config.blockMonths;

		var count = 0;
		//Create and append the options
		for (var i = 0; i < array.length; i++) {
			if (array[i].blockTo >= minBlock && (!historyConfig.maxBlock || array[i].blockFrom <= historyConfig.maxBlock)) {
				count++;
				var option = document.createElement("option");
				option.value = i;
				option.text = array[i].m;
				select.appendChild(option);
			}
		}
		select.selectedIndex = count - 1;
	}



	function toDateTime(secs) {
		var utcSeconds = secs;
		var d = new Date(0);
		d.setUTCSeconds(utcSeconds);
		return d; // formatDate(d);
	}

	function toDateTimeNow(short) {
		var t = new Date();
		return t;
		//return formatDate(t, short);
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
		if (d == "??")
			return "??";

		if (short)
			return formatDate(d, short);
		else
			return formatDateT(d, short) + createUTCOffset(d);
	}

	function formatDate(d, short, removeSeconds) {
		if (d == "??")
			return "??";

		var month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear(),
			hour = d.getHours(),
			min = d.getMinutes(),
			sec = d.getSeconds();


		if (month.length < 2) month = '0' + month;
		if (day.length < 2) day = '0' + day;
		if (hour < 10) hour = '0' + hour;
		if (min < 10) min = '0' + min;
		if (sec < 10) sec = '0' + sec;

		if (!short)
			if (!removeSeconds)
				return [year, month, day].join('-') + ' ' + [hour, min, sec].join(':');
			else
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
			min = d.getMinutes(),
			sec = d.getSeconds();


		if (month.length < 2) month = '0' + month;
		if (day.length < 2) day = '0' + day;
		if (hour < 10) hour = '0' + hour;
		if (min < 10) min = '0' + min;
		if (sec < 10) sec = '0' + sec;

		if (!short)
			return [year, month, day].join('-') + 'T' + [hour, min, sec].join(':');
		else
			return [year, month, day].join('');
	}

	function clearDownloads() {
		$('#downloadTrades').html('');
		$('#downloadBitcoinTaxTrades').html('');
		$('#downloadCointrackingTrades').html('');
		$('#downloadCointracking2Trades').html('');

		$('#downloadFunds').html('');
	//	$('#downloadBitcoinTaxFunds').html('');
		$('#downloadCointrackingFunds').html('');
	//	$('#downloadCointracking2Funds').html('');
	}


	function downloadAllTrades() {
		if (lastResult) {
			checkBlockDates(lastResult);

			if (typeMode != 1) {
				downloadTrades();
				downloadBitcoinTaxTrades();
				downloadCointrackingTrades();
				downloadCointracking2Trades();
			}
			if (typeMode > 0) {
				downloadFunds();
                downloadCointrackingFunds();
			}
		}




		function downloadTrades() {
			//if(lastResult)
			{
				var allTrades = lastResult.filter((x) => { return (x.Type == 'Maker' || x.Type == 'Taker'); });

				var A = [['Type', 'Trade', 'Token', 'Amount', 'Price (ETH)', 'Total ETH', 'Date', 'Block', 'Transaction Hash', 'Buyer', 'Seller', 'Fee', 'FeeToken', 'Token Contract', 'Exchange']];
				// initialize array of rows with header row as 1st item
				for (var i = 0; i < allTrades.length; ++i) {
					var arr = [allTrades[i]['Type'], allTrades[i]['Trade'], allTrades[i]['Token'].name, allTrades[i]['Amount'], allTrades[i]['Price'],
					allTrades[i]['ETH'], formatDateOffset(allTrades[i]['Date']), allTrades[i]['Block'], allTrades[i]['Hash'], allTrades[i]['Buyer'], allTrades[i]['Seller'],
					allTrades[i]['Fee'], allTrades[i]['FeeToken'].name, allTrades[i]['Token'].addr, historyConfig.exchange];


					for (let j = 0; j < arr.length; j++) {
						//remove exponential notation
						if (A[0][j] == 'Amount' || A[0][j] == 'Price (ETH)' || A[0][j] == 'Total ETH' || A[0][j] == 'Fee') {
							arr[j] = exportNotation(arr[j]);
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
				sp.innerHTML = " ";
				var a = document.createElement('a');
				a.innerHTML = '<i class="fa fa-download" aria-hidden="true"></i>';
				a.href = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
				a.target = '_blank';
				a.download = historyConfig.exchange + "_Trades_" + formatDate(toDateTimeNow(true), true) + '_' + publicAddr + ".csv";
				sp.appendChild(a);

				$('#downloadTrades').html('');
				var parent = document.getElementById('downloadTrades');
				parent.appendChild(sp);
				//parent.appendCild(a);

			}
		}

		function downloadFunds() {
			//if(lastResult)
			{
				var allTrades = lastResult.filter((x) => { return (x.Type == 'Deposit' || x.Type == 'Withdraw'); });

				var A = [['Type', 'Token', 'Amount', 'Date', 'Block', 'Transaction Hash', 'Token Contract', 'Exchange']];
				// initialize array of rows with header row as 1st item
				for (var i = 0; i < allTrades.length; ++i) {
					var arr = [allTrades[i]['Type'], allTrades[i]['Token'].name, allTrades[i]['Amount'], formatDateOffset(allTrades[i]['Date']),
					allTrades[i]['Block'], allTrades[i]['Hash'], allTrades[i]['Token'].addr, historyConfig.exchange];

					for (let j = 0; j < arr.length; j++) {
						//remove exponential notation
						if (A[0][j] == 'Amount') {
							arr[j] = exportNotation(arr[j]);
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
				sp.innerHTML = " ";
				var a = document.createElement('a');
				a.innerHTML = '<i class="fa fa-download" aria-hidden="true"></i>';
				a.href = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
				a.target = '_blank';
				a.download = historyConfig.exchange + "_Funds_" + formatDate(toDateTimeNow(true), true) + '_' + publicAddr + ".csv";
				sp.appendChild(a);

				$('#downloadFunds').html('');
				var parent = document.getElementById('downloadFunds');
				parent.appendChild(sp);
				//parent.appendCild(a);

			}
		}

		function downloadBitcoinTaxTrades() {
			//if(lastResult)
			{
				//checkBlockDates(lastResult);
				var allTrades = lastResult.filter((x) => { return (x.Type == 'Maker' || x.Type == 'Taker'); });

				var A = [['Date', 'Action', 'Source', 'Volume', 'Symbol', 'Price', 'Currency', 'Fee', 'FeeCurrency', 'Memo']];

				// initialize array of rows with header row as 1st item
				for (var i = 0; i < allTrades.length; ++i) {
					var arr = undefined;
					var memoString = '"Transaction Hash ' + allTrades[i]['Hash'] + " -- " + allTrades[i]['Token'].name + " token contract " + allTrades[i]['Token'].addr + '"';

					//if (allTrades[i]['Trade'] === 'Buy') {
					arr = [formatDateOffset(allTrades[i]['Date']), allTrades[i]['Trade'].toUpperCase(), historyConfig.exchange, allTrades[i]['Amount'], allTrades[i]['Token'].name, allTrades[i]['Price'], 'ETH',
					allTrades[i]['Fee'], allTrades[i]['FeeToken'].name, memoString];
					//	}
					// add token fee to total for correct balance in bitcoin tax
					//	else {
					//		arr = [formatDateOffset(allTrades[i]['Date']), allTrades[i]['Trade'].toUpperCase(), historyConfig.exchange, allTrades[i]['Amount'] + allTrades[i]['Fee'], allTrades[i]['Token'].name, allTrades[i]['Price'], 'ETH',
					//		allTrades[i]['Fee'], allTrades[i]['FeeToken'].name, memoString];
					//	}

					for (let j = 0; j < arr.length; j++) {
						//remove exponential notation
						if (A[0][j] == 'Volume' || A[0][j] == 'Price' || A[0][j] == 'Fee' || A[0][j] == 'Total') {
							arr[j] = exportNotation(arr[j]);
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
				sp.innerHTML = " ";
				var a = document.createElement('a');
				a.innerHTML = '<i class="fa fa-download" aria-hidden="true"></i>';
				a.href = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
				a.target = '_blank';
				a.download = 'BitcoinTax_' + historyConfig.exchange + '_' + formatDate(toDateTimeNow(true), true) + '_' + publicAddr + ".csv";
				sp.appendChild(a);

				$('#downloadBitcoinTaxTrades').html('');
				var parent = document.getElementById('downloadBitcoinTaxTrades');
				parent.appendChild(sp);
				//parent.appendCild(a);

			}

		}

		//csv columns
		function downloadCointrackingTrades() {
			//if(lastResult)
			{
				//checkBlockDates(lastResult);
				var allTrades = lastResult.filter((x) => { return (x.Type == 'Maker' || x.Type == 'Taker'); });

				var A = [['\"Type\"', '\"Buy\"', '\"Cur.\"', '\"Sell\"', '\"Cur.\"', '\"Fee\"', '\"Cur.\"', '\"Exchange\"', '\"Group\"', '\"Comment\"', '\"Trade ID\"', '\"Date\"']];
				// initialize array of rows with header row as 1st item
				for (var i = 0; i < allTrades.length; ++i) {
					var arr = [];
					if (allTrades[i]['Trade'] === 'Buy') { //buy add fee to eth total
						arr = ['Trade', allTrades[i]['Amount'], allTrades[i]['Token'].name, allTrades[i]['ETH'] + allTrades[i]['Fee'], 'ETH', allTrades[i]['Fee'], allTrades[i]['FeeToken'].name,
							historyConfig.exchange, '', 'Hash: ' + allTrades[i]['Hash'] + " -- " + allTrades[i]['Token'].name + " token contract " + allTrades[i]['Token'].addr, allTrades[i]['Hash'], formatDateOffset(allTrades[i]['Date'])];

					}
					else {  //sell add fee to token total
						arr = ['Trade', allTrades[i]['ETH'], 'ETH', allTrades[i]['Amount'] + allTrades[i]['Fee'], allTrades[i]['Token'].name, allTrades[i]['Fee'], allTrades[i]['FeeToken'].name,
							historyConfig.exchange, '', 'Hash: ' + allTrades[i]['Hash'] + " -- " + allTrades[i]['Token'].name + " token contract " + allTrades[i]['Token'].addr, allTrades[i]['Hash'], formatDateOffset(allTrades[i]['Date'])];
					}

					for (let j = 0; j < arr.length; j++) {
						//remove exponential notation
						if (A[0][j] == '\"Buy\"' || A[0][j] == '\"Sell\"' || A[0][j] == '\"Fee\"') {
							arr[j] = exportNotation(arr[j]);
						}

						// add quotes
						arr[j] = `\"${arr[j]}\"`;
					}

					A.push(arr);
				}
				var csvRows = [];
				for (var i = 0, l = A.length; i < l; ++i) {
					csvRows.push(A[i].join(','));   // unquoted CSV row
				}
				var csvString = csvRows.join("\r\n");

				var sp = document.createElement('span');
				sp.innerHTML = " ";
				var a = document.createElement('a');
				a.innerHTML = '<i class="fa fa-download" aria-hidden="true"></i>';
				a.href = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
				a.target = '_blank';
				a.download = 'Cointracking_CSV_' + historyConfig.exchange + '_' + formatDate(toDateTimeNow(true), true) + '_' + publicAddr + ".csv";
				sp.appendChild(a);

				$('#downloadCointrackingTrades').html('');
				var parent = document.getElementById('downloadCointrackingTrades');
				parent.appendChild(sp);
				//parent.appendCild(a);
			}
		}
        
        //csv columns
		function downloadCointrackingFunds() {
			//if(lastResult)
			{
				//checkBlockDates(lastResult);
				var allTrades = lastResult.filter((x) => { return (x.Type == 'Deposit' || x.Type == 'Withdraw'); });

				var A = [['\"Type\"', '\"Buy\"', '\"Cur.\"', '\"Sell\"', '\"Cur.\"', '\"Fee\"', '\"Cur.\"', '\"Exchange\"', '\"Group\"', '\"Comment\"', '\"Trade ID\"', '\"Date\"']];
				// initialize array of rows with header row as 1st item
				for (var i = 0; i < allTrades.length; ++i) {
					var arr = [];
					if (allTrades[i]['Type'] === 'Deposit') { // deposit is 'buy'
						arr = ['Deposit', allTrades[i]['Amount'], allTrades[i]['Token'].name, "", "", "", "",
							historyConfig.exchange, '', 'Hash: ' + allTrades[i]['Hash'] + " -- " + allTrades[i]['Token'].name + " token contract " + allTrades[i]['Token'].addr, 
                            allTrades[i]['Hash'], formatDateOffset(allTrades[i]['Date'])];
					}
					else {  //withdraw is 'sell'
						arr = ['Withdrawal', "","", allTrades[i]['Amount'], allTrades[i]['Token'].name, "", "",
							historyConfig.exchange, '', 'Hash: ' + allTrades[i]['Hash'] + " -- " + allTrades[i]['Token'].name + " token contract " + allTrades[i]['Token'].addr, 
                            allTrades[i]['Hash'], formatDateOffset(allTrades[i]['Date'])];
					}

					for (let j = 0; j < arr.length; j++) {
						//remove exponential notation
						if (A[0][j] == '\"Buy\"' || A[0][j] == '\"Sell\"') {
							arr[j] = exportNotation(arr[j]);
						}

						// add quotes
						arr[j] = `\"${arr[j]}\"`;
					}

					A.push(arr);
				}
				var csvRows = [];
				for (var i = 0, l = A.length; i < l; ++i) {
					csvRows.push(A[i].join(','));   // unquoted CSV row
				}
				var csvString = csvRows.join("\r\n");

				var sp = document.createElement('span');
				sp.innerHTML = " ";
				var a = document.createElement('a');
				a.innerHTML = '<i class="fa fa-download" aria-hidden="true"></i>';
				a.href = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
				a.target = '_blank';
				a.download = 'CointrackingFunds_CSV_' + historyConfig.exchange + '_' + formatDate(toDateTimeNow(true), true) + '_' + publicAddr + ".csv";
				sp.appendChild(a);

				$('#downloadCointrackingFunds').html('');
				var parent = document.getElementById('downloadCointrackingFunds');
				parent.appendChild(sp);
				//parent.appendCild(a);
			}
		}

		//custom exchange columns
		function downloadCointracking2Trades() {
			//if(lastResult)
			{
				//checkBlockDates(lastResult);
				var allTrades = lastResult.filter((x) => { return (x.Type == 'Maker' || x.Type == 'Taker'); });

				var A = [['\"Date\"', '\"Buy\"', '\"Cur.\"', '\"Sell\"', '\"Cur.\"', '\"Fee\"', '\"Cur.\"', '\"Trade ID\"', '\"Comment\"', '\"Exchange\"', '\"Type\"']];

				// initialize array of rows with header row as 1st item
				for (var i = 0; i < allTrades.length; ++i) {
					var arr = [];
					if (allTrades[i]['Trade'] === 'Buy') { //buy add fee to eth total
						arr = [formatDateOffset(allTrades[i]['Date']), allTrades[i]['Amount'], allTrades[i]['Token'].name, allTrades[i]['ETH'] + allTrades[i]['Fee'], 'ETH', allTrades[i]['Fee'], allTrades[i]['FeeToken'].name,
						allTrades[i]['Hash'], 'Hash: ' + allTrades[i]['Hash'] + " -- " + allTrades[i]['Token'].name + " token contract " + allTrades[i]['Token'].addr, historyConfig.exchange, 'Trade'];

					}
					else { //sell add fee to token total
						arr = [formatDateOffset(allTrades[i]['Date']), allTrades[i]['ETH'], 'ETH', allTrades[i]['Amount'] + allTrades[i]['Fee'], allTrades[i]['Token'].name, allTrades[i]['Fee'], allTrades[i]['FeeToken'].name,
						allTrades[i]['Hash'], 'Hash: ' + allTrades[i]['Hash'] + " -- " + allTrades[i]['Token'].name + " token contract " + allTrades[i]['Token'].addr, historyConfig.exchange, 'Trade'];
					}

					for (let j = 0; j < arr.length; j++) {
						//remove exponential notation
						if (A[0][j] == '\"Buy\"' || A[0][j] == '\"Sell\"' || A[0][j] == '\"Fee\"') {
							arr[j] = exportNotation(arr[j]);
						}

						// add quotes
						arr[j] = `\"${arr[j]}\"`;
					}
					A.push(arr);
				}
				var csvRows = [];
				for (var i = 0, l = A.length; i < l; ++i) {
					csvRows.push(A[i].join(','));   // unquoted CSV row
				}
				var csvString = csvRows.join("\r\n");

				var sp = document.createElement('span');
				sp.innerHTML = " ";
				var a = document.createElement('a');
				a.innerHTML = '<i class="fa fa-download" aria-hidden="true"></i>';
				a.href = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
				a.target = '_blank';
				a.download = 'Cointracking_CustomExchange_' + historyConfig.exchange + '_' + formatDate(toDateTimeNow(true), true) + '_' + publicAddr + ".csv";
				sp.appendChild(a);

				$('#downloadCointracking2Trades').html('');
				var parent = document.getElementById('downloadCointracking2Trades');
				parent.appendChild(sp);
				//parent.appendCild(a);

			}

		}
	}

	//remove exponential notation 1e-8  etc.
	function exportNotation(num) {
		//return Number(num).toFixed(20).replace(/\.?0+$/,""); // rounded to 20 decimals, no trailing 0
		//https://stackoverflow.com/questions/3612744/remove-insignificant-trailing-zeros-from-a-number
		return Number(num).toFixed(20).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1')
	}

	function placeholderTable() {
		var result = transactionsPlaceholder;
		makeTable(result);
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
		//myClick();

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
			//myClick();
		}
		return false;
	}

}