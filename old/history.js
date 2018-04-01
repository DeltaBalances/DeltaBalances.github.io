{

	// shorthands
	var _delta = bundle.EtherDelta;
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


	// settings
	var decimals = false;
	var fixedDecimals = 3;

	var showTransactions = true;
	var showBalances = true;
	var showCustomTokens = true;


	// user input & data
	var publicAddr = '';
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
	var minBlock = 3154197; //https://etherscan.io/block/3154196  etherdelta_2 creation

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
			Hash: '0xH4SH',
			Date: toDateTimeNow(),
			Block: '',
			Buyer: '',
			Seller: '',
			Fee: 0,
			FeeToken: { "name": "Token", "addr": "0x00" },
			'Fee in': { "name": "Token", "addr": "0x00" }, //shorter name feetoken
			Details: window.location.origin + window.location.pathname + '/../tx.html',
			Unlisted: true,
		}
	];


	init();

	$(document).ready(function () {
		readyInit();
	});

	function init() {

		getBlockStorage(); // get cached block dates

		// borrow some ED code for compatibility
		_delta.startEtherDelta(() => {
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
		setAddrImage('0x0000000000000000000000000000000000000000');

		fillMonthSelect();
		setDaySelector();

		setBlockProgress(0, 0, 0, 0, 0);

		// detect enter & keypresses in input
		$('#address').keypress(function (e) {
			if (e.keyCode == 13) {
				$('#refreshButton').click();
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
				$('#loadingTransactions').show();
				//autoStart = true;
				// auto start loading
				//myClick();
			}
		}
		else if (publicAddr) //autoload when remember is active
		{
			$('#loadingTransactions').show();
			//autoStart = true;
			// auto start loading
			//myClick();

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
	}

	function showLoading(trans) {
		if (trans) {
			$('#loadingTransactions').addClass('fa-spin');
			$('#loadingTransactions').addClass('dim');
			$('#loadingTransactions').prop('disabled', true);
			$('#loadingTransactions').show();
			$('#refreshButtonLoading').show();
			$('#refreshButtonSearch').hide();
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
		document.getElementById('addr').innerHTML = 'Address: ' + _util.addressLink(address, true, false);
		$('#overviewNav').attr("href", "index.html#" + address);
		setAddrImage(address);
		return address;
	}

	function setAddrImage(addr) {
		var icon = document.getElementById('addrIcon');
		icon.style.backgroundImage = 'url(' + blockies.create({ seed: addr.toLowerCase(), size: 8, scale: 16 }).toDataURL() + ')';
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
			"step": 100,
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
		let progressString = 'Loaded ' + loaded + '/' + max + ' blocks, found ' + trades + ' trade';
		if (trades < 1 || trades > 1) progressString += 's';
		$('#blockProgress').html(progressString);
	}


	function getTransactions(rqid) {

		var start = startblock;
		var end = endblock;
		const max = 5000;

		let totalBlocks = end - start + 1; //block 5-10 (inclusive) gives you 6 blocks

		loadedLogs = 0;
		let downloadedBlocks = 0;
		setBlockProgress(downloadedBlocks, totalBlocks, 0);

		var tradeLogResult = [];
		const contractAddr = _delta.config.contractEtherDeltaAddr.toLowerCase();

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
				_util.getTradeLogs(_delta.web3, contractAddr, startNum, endNum, rpcID, receiveLogs);
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
				for (i = 0; i < filteredLogs.length; i++) {
					let num = Number(filteredLogs[i].blockNumber);
					if (!blockDates[num]) {
						blockDates[num] = toDateTime(filteredLogs[0].timeStamp);
					}
				}
			}

			let unpackedLogs = _util.processLogs(filteredLogs);

			for (i = 0; i < unpackedLogs.length; i++) {

				let unpacked = unpackedLogs[i];
				if (!unpacked || unpacked.events.length < 6 || unpacked.name != 'Trade') {
					continue;
				}

				let obj = _delta.processUnpackedEvent(unpacked, myAddr);
				if (obj && !obj.error) {
					var obj2 = {
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
			if (remember) {
				localStorage.setItem("member", 'true');
				if (publicAddr)
					localStorage.setItem("address", publicAddr);
			} else {
				localStorage.removeItem('member');
				localStorage.removeItem('address');
			}
		}
	}

	function getStorage() {
		if (typeof (Storage) !== "undefined") {
			remember = localStorage.getItem('member') && true;
			if (remember) {
				var addr = localStorage.getItem("address");
				if (addr) {
					addr = getAddress(addr);
					if (addr) {
						publicAddr = addr;
						document.getElementById('address').value = addr;
					}
				}
				//$('#remember').prop('checked', true);
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
				sortList: [[8, "d"]]
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
						if (head == 'Fee' && myList[i][columns[0]] == 'Maker') {
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
						if ((head == 'Fee in') && myList[i][columns[0]] == 'Maker') {
							cellValue = '';
						}

						if (cellValue !== "" && cellValue !== undefined) {

							let token = cellValue;
							let popoverContents = "Placeholder";
							if (cellValue) {
								if (cellValue.name != 'Token') {
									if (cellValue.name !== 'ETH') {
										popoverContents = 'Contract: ' + _util.addressLink(token.addr, true, true) + '<br> Decimals: ' + token.decimals + '<br> Trade on ' + _util.etherDeltaURL(token, true) + '<br> Trade on ' + _util.forkDeltaURL(token, true);
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
						if (cellValue == 'Taker') {
							row$.append($('<td/>').html('<span class="label label-info" >' + cellValue + '</span>'));
						}
						else if (cellValue == 'Maker') {
							row$.append($('<td/>').html('<span class="label label-default" >' + cellValue + '</span>'));
						}
						else {
							row$.append($('<td/>').html('<span class="" >' + cellValue + '</span>'));
						}
					}
					else if (head == 'Trade') {
						if (cellValue == 'Buy') {
							row$.append($('<td/>').html('<span class="label label-success" >' + cellValue + '</span>'));
						}
						else if (cellValue == 'Sell') {
							row$.append($('<td/>').html('<span class="label label-danger" >' + cellValue + '</span>'));
						}
						else {
							row$.append($('<td/>').html('<span class="" >' + cellValue + '</span>'));
						}
					}
					else if (head == 'Hash') {
						row$.append($('<td/>').html(_util.hashLink(cellValue, true, true)));
					}
					else if (head == 'Block') {
						row$.append($('<td/>').html('<a target="_blank" href="https://etherscan.io/block/' + cellValue + '">' + cellValue + '</a>'));
					}
					else if (head == 'Buyer' || head == 'Seller') {
						row$.append($('<td/>').html(_util.addressLink(cellValue, true, true)));
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

	var tradeHeaders = { 'Type': 1, 'Trade': 1, 'Token': 1, 'Amount': 1, 'Price': 1, 'ETH': 1, 'Hash': 1, 'Date': 1, 'Buyer': 1, 'Seller': 1, 'Fee': 1, 'Fee in': 1, 'Block': 1, 'Details': 1 };
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


		//Create and append the options
		for (var i = 0; i < array.length; i++) {
			var option = document.createElement("option");
			option.value = i;
			option.text = array[i].m;
			select.appendChild(option);
		}
		select.selectedIndex = array.length - 1;
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
	}


	function downloadAllTrades() {
		if (lastResult) {
			checkBlockDates(lastResult);

			downloadTrades();
			downloadBitcoinTaxTrades();
			downloadCointrackingTrades();
			downloadCointracking2Trades();
		}




		function downloadTrades() {
			//if(lastResult)
			{
				//	checkBlockDates(lastResult);
				var allTrades = lastResult;

				var A = [['Type', 'Trade', 'Token', 'Amount', 'Price (ETH)', 'Total ETH', 'Date', 'Block', 'Transaction Hash', 'Buyer', 'Seller', 'Fee', 'FeeToken', 'Token Contract']];
				// initialize array of rows with header row as 1st item
				for (var i = 0; i < allTrades.length; ++i) {
					var arr = [allTrades[i]['Type'], allTrades[i]['Trade'], allTrades[i]['Token'].name, allTrades[i]['Amount'], allTrades[i]['Price'],
					allTrades[i]['ETH'], formatDateOffset(allTrades[i]['Date']), allTrades[i]['Block'], allTrades[i]['Hash'], allTrades[i]['Buyer'], allTrades[i]['Seller'],
					allTrades[i]['Fee'], allTrades[i]['FeeToken'].name, allTrades[i]['Token'].addr];


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
				a.download = "TradeHistory_" + formatDate(toDateTimeNow(true), true) + '_' + publicAddr + ".csv";
				sp.appendChild(a);

				$('#downloadTrades').html('');
				var parent = document.getElementById('downloadTrades');
				parent.appendChild(sp);
				//parent.appendCild(a);

			}
		}

		function downloadBitcoinTaxTrades() {
			//if(lastResult)
			{
				//checkBlockDates(lastResult);
				var allTrades = lastResult;

				var A = [['Date', 'Action', 'Source', 'Volume', 'Symbol', 'Price', 'Currency', 'Fee', 'FeeCurrency', 'Memo']];

				// initialize array of rows with header row as 1st item
				for (var i = 0; i < allTrades.length; ++i) {
					var arr = undefined;
					var memoString = '"Transaction Hash ' + allTrades[i]['Hash'] + " -- " + allTrades[i]['Token'].name + " token contract " + allTrades[i]['Token'].addr + '"';

					//if (allTrades[i]['Trade'] === 'Buy') {
					arr = [formatDateOffset(allTrades[i]['Date']), allTrades[i]['Trade'].toUpperCase(), 'EtherDelta', allTrades[i]['Amount'], allTrades[i]['Token'].name, allTrades[i]['Price'], 'ETH',
					allTrades[i]['Fee'], allTrades[i]['FeeToken'].name, memoString];
					//	}
					// add token fee to total for correct balance in bitcoin tax
					//	else {
					//		arr = [formatDateOffset(allTrades[i]['Date']), allTrades[i]['Trade'].toUpperCase(), 'EtherDelta', allTrades[i]['Amount'] + allTrades[i]['Fee'], allTrades[i]['Token'].name, allTrades[i]['Price'], 'ETH',
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
				a.download = 'BitcoinTax_' + formatDate(toDateTimeNow(true), true) + '_' + publicAddr + ".csv";
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
				var allTrades = lastResult;

				var A = [['\"Type\"', '\"Buy\"', '\"Cur.\"', '\"Sell\"', '\"Cur.\"', '\"Fee\"', '\"Cur.\"', '\"Exchange\"', '\"Group\"', '\"Comment\"', '\"Trade ID\"', '\"Date\"']];
				// initialize array of rows with header row as 1st item
				for (var i = 0; i < allTrades.length; ++i) {
					var arr = [];
					if (allTrades[i]['Trade'] === 'Buy') { //buy add fee to eth total
						arr = ['Trade', allTrades[i]['Amount'], allTrades[i]['Token'].name, allTrades[i]['ETH'] + allTrades[i]['Fee'], 'ETH', allTrades[i]['Fee'], allTrades[i]['FeeToken'].name,
							'EtherDelta', '', 'Hash: ' + allTrades[i]['Hash'] + " -- " + allTrades[i]['Token'].name + " token contract " + allTrades[i]['Token'].addr, allTrades[i]['Hash'], formatDateOffset(allTrades[i]['Date'])];

					}
					else {  //sell add fee to token total
						arr = ['Trade', allTrades[i]['ETH'], 'ETH', allTrades[i]['Amount'] + allTrades[i]['Fee'], allTrades[i]['Token'].name, allTrades[i]['Fee'], allTrades[i]['FeeToken'].name,
							'EtherDelta', '', 'Hash: ' + allTrades[i]['Hash'] + " -- " + allTrades[i]['Token'].name + " token contract " + allTrades[i]['Token'].addr, allTrades[i]['Hash'], formatDateOffset(allTrades[i]['Date'])];
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
				a.download = 'Cointracking_CSV_' + formatDate(toDateTimeNow(true), true) + '_' + publicAddr + ".csv";
				sp.appendChild(a);

				$('#downloadCointrackingTrades').html('');
				var parent = document.getElementById('downloadCointrackingTrades');
				parent.appendChild(sp);
				//parent.appendCild(a);

			}

		}

		//custom exchange columns
		function downloadCointracking2Trades() {
			//if(lastResult)
			{
				//checkBlockDates(lastResult);
				var allTrades = lastResult;

				var A = [['\"Date\"', '\"Buy\"', '\"Cur.\"', '\"Sell\"', '\"Cur.\"', '\"Fee\"', '\"Cur.\"', '\"Trade ID\"', '\"Comment\"', '\"Exchange\"', '\"Type\"']];

				// initialize array of rows with header row as 1st item
				for (var i = 0; i < allTrades.length; ++i) {
					var arr = [];
					if (allTrades[i]['Trade'] === 'Buy') { //buy add fee to eth total
						arr = [formatDateOffset(allTrades[i]['Date']), allTrades[i]['Amount'], allTrades[i]['Token'].name, allTrades[i]['ETH'] + allTrades[i]['Fee'], 'ETH', allTrades[i]['Fee'], allTrades[i]['FeeToken'].name,
						allTrades[i]['Hash'], 'Hash: ' + allTrades[i]['Hash'] + " -- " + allTrades[i]['Token'].name + " token contract " + allTrades[i]['Token'].addr, 'EtherDelta', 'Trade'];

					}
					else { //sell add fee to token total
						arr = [formatDateOffset(allTrades[i]['Date']), allTrades[i]['ETH'], 'ETH', allTrades[i]['Amount'] + allTrades[i]['Fee'], allTrades[i]['Token'].name, allTrades[i]['Fee'], allTrades[i]['FeeToken'].name,
						allTrades[i]['Hash'], 'Hash: ' + allTrades[i]['Hash'] + " -- " + allTrades[i]['Token'].name + " token contract " + allTrades[i]['Token'].addr, 'EtherDelta', 'Trade'];
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
				a.download = 'Cointracking_CustomExchange_' + formatDate(toDateTimeNow(true), true) + '_' + publicAddr + ".csv";
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

}