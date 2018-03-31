{

	// shorthands
	var _delta = bundle.EtherDelta;
	var _util = bundle.utility;

	// initiation
	var initiated = false;
	var autoStart = false;


	// loading states

	var running = false;

	var etherscanFallback = false;

	// settings
	var decimals = false;
	var fixedDecimals = 3;



	// user input & data
	var transactionHash = '';
	var lastTxData = undefined;
	var lastTxLog = undefined;
	var txDate = "??";

	var unknownToken = false;


	init();

	$(document).ready(function () {
		readyInit();
	});

	function init() {
		// borrow some ED code for compatibility
		_delta.startEtherDelta(() => {

			_delta.initTokens(false);

			initiated = true;
			if (autoStart)
				myClick();
		});
	}

	function readyInit() {
		hideLoading();
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
			$("table").trigger("applyWidgets");

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

		checkStorage();

		// url parameter ?addr=0x... /#0x..
		var trans = getParameterByName('trans');
		if (!trans) {
			var hash = window.location.hash;  // url parameter /#0x...
			if (hash)
				trans = hash.slice(1);
		}
		if (trans) {
			trans = getAddress(trans);
			if (trans) {
				transactionHash = trans;
				window.location.hash = transactionHash;
				autoStart = true;
				// auto start loading
				myClick();
			}
		}
		if (!trans) {
			$('#address').focus();
		}
	}


	function disableInput(disable) {
		$('#refreshButton').prop('disabled', disable);
		$("#address").prop("disabled", disable);
		if (disable)
			$('#loading').addClass('dim');
		else
			$('#loading').removeClass('dim');
		$("#loading").prop("disabled", disable);
	}

	function showLoading(balance, trans) {

		$('#loading').addClass('fa-spin');
		$('#loading').addClass('dim');
		$('#loading').prop('disabled', true);
		$('#loading').show();
		$('#refreshButtonLoading').show();
		$('#refreshButtonSearch').hide();

	}

	function buttonLoading() {
		if (!transactionHash) {
			hideLoading();
			return;
		}
		$('#loading').removeClass('fa-spin');
		$('#loading').removeClass('dim');
		$('#loading').prop('disabled', false);
		$('#loading').show();
		$('#refreshButtonLoading').hide();
		$('#refreshButtonSearch').show();
	}

	function hideLoading() {
		$('#loading').hide();
		$('#refreshButtonLoading').hide();
		$('#refreshButtonSearch').show();
	}



	function myClick() {
		if (running)
			return;
		if (!initiated) {
			autoStart = true;
			return;
		}

		unknownToken = false;
		hideError();
		hideHint();
		//	disableInput(true);
		showLoading();
		clearOverview();

		// validate address
		if (!autoStart)
			transactionHash = getAddress();

		autoStart = false;
		if (transactionHash) {
			window.location.hash = transactionHash;
			getAll();

		}
		else {
			console.log('invalid input');
			disableInput(false);
			hideLoading();
		}
	}

	function getAll(autoload) {
		if (running)
			return;

		running = true;

		lastResult = undefined;
		lastResult2 = undefined;

		if (transactionHash) {
			window.location.hash = transactionHash;
			getTransactions();
		} else {
			running = false;
			disableInput(false);
			hideLoading();
		}
	}

	// check if input address is valid
	function getAddress(addr) {
		var address = '';
		address = addr ? addr : document.getElementById('address').value;
		address = address.trim();

		{
			//check if url ending in address
			if (address.indexOf('/0x') !== -1) {
				var parts = address.split('/');
				var lastSegment = parts.pop() || parts.pop();  // handle potential trailing slash
				if (lastSegment)
					address = lastSegment;
			}

			if (address.length == 66 && address.slice(0, 2) === '0x') {
				// address is ok
			}
			else if (address.length == 64 && address.slice(0, 2) !== '0x') {
				address = '0x' + address;
			}
			else if (address.length == 42 && address.slice(0, 2) === '0x')  //wallet addr, not transaction hash
			{
				window.location = window.location.origin + window.location.pathname + '/../#' + address;
				return;
			}
			else {
				if (!addr) // ignore if in url arguments
				{
					showError("Invalid transaction hash, try again");
				}
				return undefined;
			}
		}

		document.getElementById('address').value = address;
		return address;
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


	function getTransactions() {

		var transResult = undefined;
		var logResult = undefined;
		var statusResult = undefined;

		var transLoaded = 0;

		// status https://api.etherscan.io/api?module=transaction&action=getstatus&txhash=0x15f8e5ea1079d9a0bb04a4c58ae5fe7654b5b2b4463375ff7ffb490aa0032f3a&apikey=YourApiKeyToken
		// https://api.etherscan.io/api?module=proxy&action=eth_GetTransactionReceipt&txhash='+ transactionHash;
		// https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash='+ transactionHash;

		$.getJSON('https://api.etherscan.io/api?module=transaction&action=getstatus&txhash=' + transactionHash + '&apikey=' + _delta.config.etherscanAPIKey, (result) => {
			if (result && result.status === '1')
				statusResult = result.result;
			transLoaded++;
			if (transLoaded == 4)
				processTransactions(transResult, statusResult, logResult);
		});

		$.getJSON('https://api.etherscan.io/api?module=proxy&action=eth_GetTransactionReceipt&txhash=' + transactionHash + '&apikey=' + _delta.config.etherscanAPIKey, (result) => {
			if (result)
				logResult = result.result;
			transLoaded++;
			if (transLoaded == 4)
				processTransactions(transResult, statusResult, logResult);
		});

		$.getJSON('https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=' + transactionHash + '&apikey=' + _delta.config.etherscanAPIKey, (result) => {
			if (result) {

				if (result.result && result.result.blockNumber) {
					transResult = result.result;
					$.getJSON('https://api.etherscan.io/api?module=block&action=getblockreward&blockno=' + _util.hexToDec(transResult.blockNumber) + '&apikey=' + _delta.config.etherscanAPIKey, (res) => {
						if (res && res.status == "1" && res.result) {
							var unixtime = res.result.timeStamp;
							if (unixtime)
								txDate = toDateTime(unixtime);
						}
						transLoaded++;
						if (transLoaded == 4)
							processTransactions(transResult, statusResult, logResult);
					});
				} else {
					transLoaded++; // no time call
				}
			}
			transLoaded++;
			if (transLoaded == 4)
				processTransactions(transResult, statusResult, logResult);
		});





		function processTransactions(tx, txStatus, txLog) {
			if (!tx) {
				console.log('error');
				showError('failed to load transaction from <a href="https://etherscan.io/tx/' + transactionHash + '" + target="_blank"> Etherscan </a>');
				disableInput(false);
				hideLoading();
				running = false;
				return;
			}
			console.log('completed requests');
			var pending = false;
			if (!tx.blockHash || !tx.blockNumber || !tx.transactionIndex) {
				pending = true;
			}

			var transaction = {
				hash: tx.hash,
				from: tx.from,
				to: tx.to,
				rawinput: tx.input,
				nonce: Number(tx.nonce),
				value: _util.weiToEth(Number(tx.value)),
				gasPrice: _util.weiToEth(Number(tx.gasPrice)),
				gasGwei: (Number(tx.gasPrice) / 1000000000),
				gasLimit: Number(tx.gas),
				status: 'Pending',
				input: parseInput(tx, tx.input),
			}

			if (!pending) {
				if (txStatus.isError === '0') {
					transaction.status = 'Completed';
					transaction.gasUsed = Number(txLog.gasUsed),
						transaction.gasEth = Number(txLog.gasUsed) * _util.weiToEth(Number(tx.gasPrice));
					transaction.blockNumber = tx.blockNumber;
					transaction.blockHash = tx.blockHash;
					transaction.rawoutput = null;
					transaction.output = parseOutput(tx, txLog.logs);
				}
				else {
					transaction.status = 'Error: ' + txStatus.errDescription;
					transaction.gasEth = transaction.gasLimit * transaction.gasPrice;
				}
			}


			finish(transaction);

			//to ed, val >0  deposit
			// internal from >0 withdraw

			function parseOutput(tx, outputLogs) {
				var outputs = [];

				var unpackedLogs = _util.processLogs(outputLogs);

				for (i = 0; i < unpackedLogs.length; i++) {

					let unpacked = unpackedLogs[i];

					if (!unpacked) {
						outputs.push({ 'error': 'unknown output' });
						continue;
					} else {

						let myAddr = tx.from;
						if (tx.to.toLowerCase() !== unpacked.address.toLowerCase() && unpacked.name !== 'Transfer' && unpacked.name !== 'Approve')
							myAddr = tx.to.toLowerCase();
						let obj = _delta.processUnpackedEvent(unpacked, myAddr);
						if (obj) {
							if (obj && obj.token && obj.token.name === "???" && obj.token.unknown)
								unknownToken = true;
							if (unpacked.name === 'Trade') {
								delete obj.fee;
								delete obj.feeCurrency;
								delete obj.transType;
								delete obj.tradeType;
							}
							outputs.push(obj);
						} else {
							outputs.push({ 'error': 'unknown output' });
						}
					}
				}
				return outputs;
			}

			function parseInput(tx, input) {

				var unpacked = _util.processInput(input);
				if (!unpacked)
					return undefined;

				let obj = _delta.processUnpackedInput(tx, unpacked);
				if (obj && obj.token && obj.token.name === "???" && obj.token.unknown)
					unknownToken = true;
				return obj;

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

	// callback when balance request completes
	function finish(transaction) {
		console.log('outputting data');
		/*
		
		var transaction = {
			hash: ,
			from: ,
			to: ,
			input: ,
			nonce: ,
			value: ,
			gasPrice: ,
			gas: ,
			gasUsed: ,
			error: ,
			errorText: ,  
			input: ,
			output: '',
		}
		*/

		var sum = '';
		if (transaction.status === 'Completed') {
			sum += 'Status: Completed<br>';
		}
		else if (transaction.status === 'Pending') {
			sum += 'Status: Transaction is pending, try again later. For a faster transaction raise your gas price next time.<br> Pending for a really long time? Try to <a href="https://www.reddit.com/r/EtherDelta/comments/72tctz/guide_how_to_cancel_a_pending_transaction/" target="_blank">cancel or replace</a> it. <br>';
		}
		else if (transaction.status === 'Error: Bad jump destination') {
			if (transaction.input.type === 'Taker Sell' || transaction.input.type === 'Taker Buy') {
				sum += 'Status: Bad jump destination, someone filled this order before you. (Sent earlier or with a higher gas price).<br>';
			}
			else if (transaction.input.type === 'Token Deposit' || transaction.input.type === 'Token Withdraw') {
				sum += 'Status: Bad jump destination, token deposit/withdraw failed. You might not have had the right account balance left. Otherwise check if the token is not locked. (Still in ICO, rewards period, disabled etc.)<br>';
			}
		} else {
			sum += 'Status: Transaction failed.<br>';
		}

		if (unknownToken) {
			sum += "<strong>This token is still unknown to DeltaBalances </strong>, amount and price might be wrong if the token has less than 18 decimals <br> "

		}
		if (transaction.input && transaction.input.note) {
			sum += 'Transaction type: ' + transaction.input.note + '<br>';
		} else if (transaction.output && transaction.output.length > 0) {
			sum += 'Transaction type: ' + transaction.output[0].note + '<br>';
		}
		if (transaction.input && transaction.input.type === 'Transfer') {
			if (_delta.uniqueTokens[transaction.input.to]) {
				sum += '<strong>Warning</strong>, you sent tokens to a token contract. These tokens are most likely lost forever. <br>';
			}
			else if (transaction.input.to === _delta.config.contractEtherDeltaAddr) {
				sum += '<strong>Warning</strong>, you sent tokens to the EtherDelta contract without a deposit. Nobody can access these tokens anymore, they are most likely lost forever. <br>';
			}
		}
		if (!transaction.input && (!transaction.output || transaction.output.length == 0)) {
			sum += 'This does not seem to be an EtherDelta transaction <br>';
		}
		if (checkOldED(transaction.to)) {
			sum += 'This transaction is to an outdated EtherDelta contract, only use these to withdraw old funds.<br>';
		}

		var tradeCount = 0;
		var zeroDecWarning = '';
		if (transaction.output) {
			// output price can get wrong decimals if trading like 15e-10, so get price from input if possible. 
			if (transaction.input && transaction.output.length == 1 && transaction.output[0].price >= 0) {
				transaction.output[0].price = transaction.input.price;
				if (transaction.output[0].amount < transaction.input['order size']) {
					sum += "Partial fill, ";
				}
			}

			var spent = 0;
			var received = 0;

			for (var i = 0; i < transaction.output.length; i++) {
				if (transaction.output[i].type == 'Taker Buy') {
					if (transaction.output[i].token.decimals == 0 && !zeroDecWarning) {
						zeroDecWarning = "<strong>Note: </strong> " + transaction.output[i].token.name + " has 0 decimals precision. Numbers might be lower than expected due to rounding. <br>";
					}
					tradeCount++;
					sum += "Bought " + transaction.output[i].amount + " " + transaction.output[i].token.name + " for " + transaction.output[i].price + " ETH each, " + transaction.output[i].ETH + " ETH in total. <br>";
					spent += transaction.output[i].ETH;
				}
				else if (transaction.output[i].type == 'Taker Sell') {
					if (transaction.output[i].token.decimals == 0 && !zeroDecWarning) {
						zeroDecWarning = "<strong>Note: </strong> " + transaction.output[i].token.name + " has 0 decimals precision. Numbers might be lower than expected due to rounding. <br>"
					}
					tradeCount++;
					sum += "Sold " + transaction.output[i].amount + " " + transaction.output[i].token.name + " for " + transaction.output[i].price + " ETH each, " + transaction.output[i].ETH + " ETH in total. <br>";
					received += transaction.output[i].ETH;
				}
				else if (transaction.output[i].type == "Deposit" || transaction.output[i].type == "Token Deposit") {
					sum += "Deposited " + transaction.output[i].amount + " " + transaction.output[i].token.name + ", new balance: " + transaction.output[i].balance + " " + transaction.output[i].token.name + '<br>';
				}
				else if (transaction.output[i].type == "Withdraw" || transaction.output[i].type == "Token Withdraw") {
					sum += "Withdrew " + transaction.output[i].amount + " " + transaction.output[i].token.name + ", new balance: " + transaction.output[i].balance + " " + transaction.output[i].token.name + '<br>';
				}
			}

			if (tradeCount > 1 && transaction.to !== _delta.config.contractEtherDeltaAddr) {
				sum += 'This transaction was made by a contract that has made multiple trades in a single transaction. <br>';
				// sum up what a custom cotract did in multiple trades
				sum += "ETH gain over these trades: " + (received - spent - Number(transaction.gasEth)) + " (incl. gas cost). <br>";
			}
			else if (tradeCount > 0 && transaction.to !== _delta.config.contractEtherDeltaAddr) {
				sum += 'This transaction was made by a contract instead of a user. <br>';
			}

			if (zeroDecWarning)
				sum += zeroDecWarning;
		}


		$('#summary').html(sum);

		$('#hash').html(_util.hashLink(transaction.hash, true));
		$('#from').html(_util.addressLink(transaction.from, true, false));
		$('#to').html(_util.addressLink(transaction.to, true, false));
		$('#cost').html('??');
		$('#gasgwei').html(transaction.gasGwei + ' Gwei (' + transaction.gasPrice.toFixed(10) + ' ETH)');
		if (!transaction.gasUsed)
			transaction.gasUsed = '???';
		$('#gasusedlimit').html(transaction.gasUsed + " / " + transaction.gasLimit);
		if (transaction.status === 'Completed') {
			$('#gascost').html(Number(transaction.gasEth).toFixed(5) + ' ETH');
		} else if (transaction.status === 'Pending') {
			$('#gascost').html('Pending');
		} else {
			$('#gascost').html(Number(transaction.gasEth).toFixed(5) + ' ETH');
		}
		$('#nonce').html(transaction.nonce);
		if (transaction.status === 'Completed') {
			$('#status').html('<i style="color:green;" class="fa fa-check"></i>' + ' ' + transaction.status);
			$('#time').html(txDate);
		}
		else if (transaction.status === 'Pending') {
			$('#status').html('<i class="fa fa-cog fa-fw"></i>' + ' ' + transaction.status);
			$('#time').html('Pending');
		}
		else {
			$('#status').html('<i style="color:red;" class="fa fa-exclamation-circle"></i>' + ' ' + transaction.status);
			$('#time').html('txDate');
		}
		$('#ethval').html(transaction.value);
		$('#inputdata').html('');
		if (transaction.input && transaction.input.type) {
			$('#inputtype').html(transaction.input.type);
		} else {
			if (tradeCount == 0)
				$('#inputtype').html('');
			else
				$('#inputtype').html('Trade');
		}
		displayParse(transaction.input, "#inputdata");
		$('#outputdata').html('');
		if (transaction.output) {

			for (var i = 0; i < transaction.output.length; i++) {
				displayParse(transaction.output[i], "#outputdata");
			}
		}
		else if (transaction.status === 'Pending')
			$('#outputdata').html('Transaction is pending, no output available yet.');
		else
			$('#outputdata').html('');



		running = false;
		buttonLoading();
		disableInput(false);
		console.log('done');
	}

	function clearOverview() {

		$('#summary').html('');

		$('#hash').html('');
		$('#from').html('');
		$('#to').html('');
		$('#cost').html('');
		$('#gasprice').html('');
		$('#gasgwei').html('');
		$('#gascost').html('');
		$('#gaslimit').html('');
		$('#nonce').html('');
		$('#status').html('');
		$('#time').html('');
		$('#ethval').html('');
		$('#inputdata').html('');
		$('#inputtype').html('');
		$('#inputtype').html('');
		$('#outputdata').html('');
	}

	function displayParse(parsedInput, id) {
		if (!parsedInput) {
			$(id).html('No familiair EtherDelta input recognized');
			console.log('fuck');
			return;
		}
		//let html = $(id).html();
		//$(id).html(html + div);
		buildHtmlTable(id, parsedInput);


		$("table").tablesorter({
			headers: { 0: { sorter: false }, 1: { sorter: false }, 2: { sorter: false }, 3: { sorter: false }, 4: { sorter: false }, 5: { sorter: false }, 6: { sorter: false }, 7: { sorter: false } },
			widgets: ['scroller'],
			widgetOptions: {
				scroller_barWidth: 18,
			},
			sortList: [[0, 0]]
		});
		$("table thead th").data("sorter", false);

		$("table thead th").removeClass("tablesorter-headerUnSorted");
		$("table thead th").removeClass("tablesorter-headerDesc");
		$("table thead th").removeClass("tablesorter-headerAsc");
	}

	function hideInput() {
		$('#inputType').hide();
		$('#inputNote').hide();
		$('#inputPrice').hide();
		$('#inputAmount').hide();
		$('#inputToken').hide();
		$('#inputSender').hide();
		$('#inputTo').hide();
	}

	function checkOldED(addr) {
		var lcAddr = addr.toLowerCase();
		for (var i = 0; i < _delta.config.contractEtherDeltaAddrs.length; i++) {
			if (lcAddr == _delta.config.contractEtherDeltaAddrs[i].addr) {
				return i > 0;
			}
		}
		return false;
	}


	function toDateTime(secs) {
		var utcSeconds = secs;
		var d = new Date(0);
		d.setUTCSeconds(utcSeconds);
		return formatDate(d);
	}

	function formatDate(d) {
		var month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear(),
			hour = d.getHours(),
			min = d.getMinutes();


		if (month.length < 2) month = '0' + month;
		if (day.length < 2) day = '0' + day;
		if (hour < 10) hour = '0' + hour;
		if (min < 10) min = '0' + min;

		return [year, month, day].join('-') + ' ' + [hour, min].join(':');
	}

	// Builds the HTML Table out of myList.
	function buildHtmlTable(selector, myObj) {
		var myList = Object.values(myObj);
		var keys = Object.keys(myObj);
		var table$ = $('<table class="table table-sm parsed" cellspacing="0" cellpadding="0" />');

		var columns = addAllColumnHeaders(keys, table$);
		var tbody$ = $('<tbody class/>');
		var row$ = $('<tr/>');
		for (var i = 0; i < myList.length; i++) {

			if (columns[keys[i]]) {

				var cellValue = myList[i];
				if (keys[i] == 'token') {

					let token = myList[i];
					let popoverContents = "Placeholder";
					if (token && token.name !== 'ETH' && _delta.uniqueTokens[token.addr]) {
						popoverContents = 'Contract: ' + _util.addressLink(token.addr, true, true) + '<br> Decimals: ' + token.decimals + '<br> Trade on ' + _util.etherDeltaURL(token, true) + '<br> Trade on ' + _util.forkDeltaURL(token, true);
					} else {
						if (! _delta.uniqueTokens[token.addr])
							popoverContents = "Token unknown to deltabalances <br> Contract: " + _util.addressLink(token.addr, true, true);
						else
							popoverContents = "Ether (not a token)<br> Decimals: 18";
					}
					let labelClass = 'label-warning';
					if (!token.unlisted && !token.unknown)
						labelClass = 'label-primary';

					cellValue = '<a tabindex="0" class="label ' + labelClass + '" role="button" data-html="true" data-toggle="popover" data-placement="auto right"  title="' + token.name + '" data-container="body" data-content=\'' + popoverContents + '\'>' + token.name + ' <i class="fa fa-external-link"></i></a>';
				}
				else if (keys[i] == 'price') {
					cellValue = Number(cellValue).toFixed(5);
				}
				else if (keys[i] == 'order size' || keys[i] == 'amount' || keys[i] == 'ETH') {
					cellValue = Number(cellValue).toFixed(3);
				}
				else if (keys[i] == 'seller' || keys[i] == 'buyer' || keys[i] == 'to' || keys[i] == 'sender') {
					cellValue = _util.addressLink(cellValue, true, true);
				}

				if (cellValue == null) cellValue = "";
				//let head = columns[colIndex];

				{
					row$.append($('<td/>').html(cellValue));
				}
			}
		}

		tbody$.append(row$);
		table$.append(tbody$);
		$(selector).append(table$);
		$("[data-toggle=popover]").popover();
	}

	// Adds a header row to the table and returns the set of columns.
	// Need to do union of keys from all records as some records may not contain
	// all records.
	function addAllColumnHeaders(myList, table) {
		var columnSet = {};

		var header1 = $('<thead />');
		var headerTr$ = $('<tr/>');

		for (var i = 0; i < myList.length; i++) {
			var key = myList[i];
			//for (var key in rowHash) 
			{
				if (!columnSet[key] && key !== 'unlisted' && key !== 'note') {
					columnSet[key] = 1;
					headerTr$.append($('<th/>').html(capitalizeFirstLetter(key)));
				}
			}
		}

		header1.append(headerTr$);
		table.append(header1);

		return columnSet;
	}

	function capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	function checkStorage() {
		if (typeof (Storage) !== "undefined") {
			var addr = localStorage.getItem("address");
			if (addr) {
				$('#overviewNav').attr("href", "index.html#" + addr);
				$('#historyNav').attr("href", "history.html#" + addr);
			}
		}
	}

}