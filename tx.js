{
	// shorthands
	var _delta = bundle.DeltaBalances;
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


	var blockDates = {};

	// user input & data
	var transactionHash = '';
	var lastTxData = undefined;
	var lastTxLog = undefined;
	var txDate = "??";

	var blocknum = -1;

	var publicAddr = '';
	var savedAddr = '';
	var metamaskAddr = '';

	var unknownToken = false;

	var wideOutput = false;


	init();

	$(document).ready(function () {
		readyInit();
	});

	function init() {

		getBlockStorage();
		// borrow some ED code for compatibility
		_delta.startDeltaBalances(false, () => {

			_delta.initTokens(false);

			initiated = true;
			if (autoStart)
				myClick();
		});
	}

	function readyInit() {
		hideLoading();

		//get metamask address as possbile input (if available)
		metamaskAddr = _util.getMetamaskAddress();
		if (metamaskAddr) {
			setMetamaskImage(metamaskAddr);
			$('#metamaskAddress').html(metamaskAddr.slice(0, 16));
		}


		checkStorage();

		if (!publicAddr && !savedAddr && !metamaskAddr) {
			document.getElementById('currentAddr').innerHTML = '0x......'; // side menu
			document.getElementById('currentAddr2').innerHTML = '0x......'; //top bar
			document.getElementById('currentAddrDescr').innerHTML = 'Input address';
			setAddrImage('');
			$('#userToggle').addClass('hidden');
		} else if (publicAddr) {
			document.getElementById('currentAddr').innerHTML = publicAddr.slice(0, 16); // side menu
			document.getElementById('currentAddr2').innerHTML = publicAddr.slice(0, 8); //top bar
			if (publicAddr !== metamaskAddr && publicAddr !== savedAddr) {
				document.getElementById('currentAddrDescr').innerHTML = 'Input address';
			} else if (publicAddr === savedAddr) {

				if (savedAddr === metamaskAddr)
					document.getElementById('currentAddrDescr').innerHTML = 'Metamask address (Saved)';
				else
					document.getElementById('currentAddrDescr').innerHTML = 'Saved address';

			} else {
				document.getElementById('currentAddrDescr').innerHTML = 'Metamask address';
			}
			setAddrImage(publicAddr);
			$('#etherscan').attr("href", _util.addressLink(publicAddr, false, false));
			$('#walletInfo').removeClass('hidden');

			if (savedAddr === publicAddr) {
				$('#save').addClass('hidden');
				$('#forget').removeClass('hidden');
				$('#savedSection').addClass('hidden');
			} else {
				$('#forget').addClass('hidden');
				$('#save').removeClass('hidden');
				if (savedAddr)
					$('#savedSection').removeClass('hidden');
			}

			if (metamaskAddr && metamaskAddr !== publicAddr) {
				$('#metamaskSection').removeClass('hidden');
			} else {
				$('#metamaskSection').addClass('hidden');
			}
			$('#userToggle').removeClass('hidden');
		} else if (savedAddr) {
			document.getElementById('currentAddr').innerHTML = savedAddr.slice(0, 16); // side menu
			document.getElementById('currentAddr2').innerHTML = savedAddr.slice(0, 8); //top bar

			$('#walletInfo').removeClass('hidden');
			$('#save').addClass('hidden');
			$('#savedSection').addClass('hidden');
			if (savedAddr === metamaskAddr) {
				document.getElementById('currentAddrDescr').innerHTML = 'Metamask address (Saved)';
			} else {
				document.getElementById('currentAddrDescr').innerHTML = 'Saved address';
			}

			$('#etherscan').attr("href", _util.addressLink(savedAddr, false, false));
			setAddrImage(savedAddr);
			if (metamaskAddr) {
				$('#metamaskSection').removeClass('hidden');
			}
			$('#userToggle').removeClass('hidden');
		} else if (metamaskAddr) {
			document.getElementById('currentAddr').innerHTML = metamaskAddr.slice(0, 16); // side menu
			document.getElementById('currentAddr2').innerHTML = metamaskAddr.slice(0, 8); //top bar

			$('#walletInfo').removeClass('hidden');
			$('#metamaskSection').addClass('hidden');
			document.getElementById('currentAddrDescr').innerHTML = 'Metamask address';

			$('#etherscan').attr("href", _util.addressLink(metamaskAddr, false, false));
			setAddrImage(metamaskAddr);
			$('#userToggle').removeClass('hidden');
		}





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

		$('body').on('expanded.pushMenu collapsed.pushMenu', function () {
			// Add delay to trigger code only after the pushMenu animation completes
			setTimeout(function () {
				$("table").trigger("update", [true, () => { }]);
				$("table").trigger("applyWidgets");
			}, 300);
		});

		$(window).resize(function () {
			$("table").trigger("applyWidgets");
			hidePopovers();
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


		// url hash #0x..
		var trans = '';
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

		hidePopovers();
		wideOutput = false;
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
			$('#emptyMsg').hide();
			$('.txOverviewTable').removeClass('hidden');
			$('#hash').html(_util.hashLink(transactionHash, true));
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
				window.location = window.location.origin + window.location.pathname + '/../index.html#' + address;
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

	function getTransactions() {

		var transResult = undefined;
		var logResult = undefined;
		var statusResult = undefined;
		var internalResult = undefined;

		var gotBlockNum = false;

		var transLoaded = 0;
		const transNumber = 5;

		getTransactionData();

		function getTransactionData() {
			var finished = false;

			// get tx data & input from etherscan
			_util.getURL('https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=' + transactionHash + '&apikey=' + _delta.config.etherscanAPIKey, (err, result) => {

				if (!err && result) {
					if (finished)
						return;
					if (result && result.result) {
						finished = true;
						handleTransData(result.result);
					} else {
						web3GetTransaction();
					}
				} else {
					web3GetTransaction();
				}
			});

			function web3GetTransaction() {
				//etherscan failed, try web3
				if (!finished) {
					_delta.web3s[0].eth.getTransaction(transactionHash, (err, result) => {
						if (!err && result) {
							finished = true;
							handleTransData(result);
						} else {
							handleTransData(undefined);
						}
					});
				}
			}

			// if etherscan takes >3 sec, try web3
			setTimeout(function () {
				web3GetTransaction();
			}, 3000);

			function handleTransData(res) {
				if (res) {
					transResult = res;
					transLoaded++;

					if (res.blockNumber) {
						getBlockTime(Number(res.blockNumber));
						getTransactionReceipt();
						getInternal();
					} else {
						// tx is pending, no need to wait for tx status or logs
						transLoaded = transNumber;
						processTransactions(transResult, undefined, undefined, undefined);
						return;
					}
				} else {
					processTransactions(undefined, undefined, undefined, undefined);
					return;
				}
			}
		}

		//get tx output logs from etherscan
		function getTransactionReceipt() {

			_util.txReceipt(_delta.web3s[0], transactionHash, (err, result, _) => {
				if (!err && result) {
					logResult = result;
					if (result.blockNumber) {
						if (Number(logResult.status) !== 1) {
							getTxStatus(); // get error msg
						} else {
							transLoaded++;
						}
					}
				}
				transLoaded++;
				if (transLoaded >= transNumber)
					processTransactions(transResult, statusResult, logResult, internalResult);
			});
		}

		function getBlockTime(num) {
			num = Number(num);
			if (gotBlockNum)
				return;
			else
				gotBlockNum = true;

			if (!blockDates[num]) {
				_util.getBlockDate(_delta.web3s[0], num, (err, res, _) => {
					if (!err && res) {

						var unixtime = res;
						if (unixtime) {
							txDate = _util.toDateTime(unixtime);
							blockDates[num] = txDate;
							setBlockStorage();
						}
					}
					transLoaded++;
					if (transLoaded >= transNumber)
						processTransactions(transResult, statusResult, logResult, internalResult);
				});
			} else {
				txDate = blockDates[num];
				transLoaded++;
				if (transLoaded >= transNumber)
					processTransactions(transResult, statusResult, logResult, internalResult);
			}
		}

		function getTxStatus() {
			_util.getURL('https://api.etherscan.io/api?module=transaction&action=getstatus&txhash=' + transactionHash + '&apikey=' + _delta.config.etherscanAPIKey, (err, result) => {

				if (!err && result) {
					if (result && result.status === '1')
						statusResult = result.result;
				}
				transLoaded++;
				if (transLoaded >= transNumber)
					processTransactions(transResult, statusResult, logResult, internalResult);
			});

		}

		function getInternal() {
			_util.getURL('https://api.etherscan.io/api?module=account&action=txlistinternal&txhash=' + transactionHash + '&apikey=' + _delta.config.etherscanAPIKey, (err, result) => {

				if (!err && result) {
					if (result && result.status === '1')
						internalResult = result.result;
				}
				transLoaded++;
				if (transLoaded >= transNumber)
					processTransactions(transResult, statusResult, logResult, internalResult);
			});

		}

		function processTransactions(tx, txStatus, txLog, txInternal) {
			if (!tx) {
				console.log('error');
				showError('failed to load transaction from <a href="https://etherscan.io/tx/' + transactionHash + '" + target="_blank"> Etherscan </a>');
				disableInput(false);
				hideLoading();
				buttonLoading();
				running = false;
				return;
			}
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
				value: _util.weiToEth(tx.value),
				gasPrice: _util.weiToEth(tx.gasPrice),
				gasGwei: (Number(tx.gasPrice) / 1000000000),
				gasLimit: Number(tx.gas),
				status: 'Pending',
				input: parseInput(tx, tx.input),
				rawInput: tx.input,
			}

			transaction.internal = [];

			function addTransfer(from, to, val, isInput) {
				let eth = _delta.setToken(_delta.config.ethAddr);
				let obj = {
					'type': 'Transfer',
					'note': 'Transferred ETH',
					'token': eth,
					'amount': val,
					'from': from.toLowerCase(),
					'to': to.toLowerCase(),
					'unlisted': false,
				};
				if (isInput) {
					transaction.input.push(obj);
				} else {
					transaction.internal.push(obj);
				}
			}

			if (pending) {
				if (transaction.value.greaterThan(0)) {
					addTransfer(transaction.from, transaction.to, transaction.value, true);
				}
			}
			else if (!pending) {
				transaction.gasUsed = Number(txLog.gasUsed);
				transaction.gasEth = _util.weiToEth(tx.gasPrice).times(txLog.gasUsed);


				if (Number(txLog.status) === 1) {

					if (transaction.value.greaterThan(0)) {
						addTransfer(transaction.from, transaction.to, transaction.value, false);
					}

					if (txInternal && txInternal.length > 0) {
						for (let i = 0; i < txInternal.length; i++) {
							let itx = txInternal[i];
							let val = _util.weiToEth(itx.value);
							addTransfer(itx.from, itx.to, val, false);
						}
					}


					transaction.status = 'Completed';
					transaction.blockNumber = tx.blockNumber;
					transaction.blockHash = tx.blockHash;
					transaction.rawoutput = null;
					var parsedOutput = parseOutput(tx, txLog.logs);
					transaction.output = parsedOutput.output;
					transaction.outputErrors = parsedOutput.errors;

					if (parsedOutput.output && parsedOutput.output[0]) {
						if (!parsedOutput.output[0].error && (parsedOutput.output[0].type == '0x Error' || parsedOutput.output[0].type == 'AirSwap Error')) {
							transaction.status = 'Failed';
						}
					}
				}
				else {
					transaction.status = 'Error';
					if (txStatus && txStatus.errDescription)
						transaction.status += ': ' + txStatus.errDescription;

					transaction.gasEth = transaction.gasLimit * transaction.gasPrice;
				}
			}


			finish(transaction);

			//to ed, val >0  deposit
			// internal from >0 withdraw

			function parseOutput(tx, outputLogs) {
				var outputs = [];
				var unknownEvents = 0;
				var unpackedLogs = _util.processLogs(outputLogs);
				if (unpackedLogs) {
					for (let i = 0; i < unpackedLogs.length; i++) {

						let unpacked = unpackedLogs[i];

						if (!unpacked) {
							unknownEvents++;
							continue;
						} else {

							let myAddr = tx.from;
							if (tx.to.toLowerCase() !== unpacked.address.toLowerCase() && unpacked.name !== 'Transfer' && unpacked.name !== 'Approve')
								myAddr = tx.to.toLowerCase();
							let obj = _delta.processUnpackedEvent(unpacked, myAddr);
							if (obj && !obj.error) {
								if (obj && obj.token && obj.token.name === "???" && obj.token.unknown)
									unknownToken = true;
								if (unpacked.name === 'Trade' || unpacked.name == 'Filled' || unpacked.name === 'ExecuteTrade' || unpacked.name == 'LogTake' || unpacked.name == 'Conversion' || unpacked.name == 'Order' || unpacked.name == 'TakeBuyOrder' || unpacked.name == 'TakeSellOrder') {
									obj.feeToken = obj.feeCurrency;
									delete obj.feeCurrency;
									delete obj.transType;
									delete obj.tradeType;
								} else if (unpacked.name === 'LogFill') {
									delete obj.transType;
									delete obj.tradeType;
									delete obj.relayer;
									obj.feeToken = obj.feeCurrency;
									delete obj.feeCurrency;
								} else if (unpacked.name === 'LogCancel') {
									delete obj.relayer;
								}
								outputs.push(obj);
							} else {
								unknownEvents++;
								continue;
							}
						}
					}
				}
				return { output: outputs, errors: unknownEvents };
			}

			function parseInput(tx, input) {
				var unpacked = _util.processInput(input);
				if (!unpacked)
					return undefined;

				let obj = _delta.processUnpackedInput(tx, unpacked);
				if (obj) {
					if (!Array.isArray(obj))
						obj = [obj];
					for (let i = 0; i < obj.length; i++) {
						if (obj[i] && obj[i].token && obj[i].token.name === "???" && obj[i].token.unknown)
							unknownToken = true;
						if (obj[i].relayer)
							delete obj[i].relayer;
						if (obj[i].feeCurrency) {
							obj[i].feeToken = obj[i].feeCurrency;
							delete obj[i].feeCurrency;
						}
					}
				}
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

		if (transaction.internal) {
			if (transaction.output) {
				transaction.output = transaction.output.concat(transaction.internal);
			} else {
				transaction.output = transaction.internal;
			}
		}

		//generate messages based on tx 
		var sum = '';
		if (transaction.status === 'Completed') {
			sum += 'Status: Completed<br>';
		}
		else if (transaction.status === 'Pending') {
			sum += 'Status: Transaction is pending, try again later. For a faster transaction raise your gas price next time.<br> Pending for a really long time? Try to <a href="https://www.reddit.com/r/EtherDelta/comments/72tctz/guide_how_to_cancel_a_pending_transaction/" target="_blank">cancel or replace</a> it. <br>';
		}
		else if (transaction.status === 'Error: Bad jump destination' || transaction.status === 'Error: Reverted') {
			if (transaction.input[0].type === 'Taker Sell' || transaction.input[0].type === 'Taker Buy') {
				sum += 'Status: transaction failed, order already filled or cancelled.<br>';
			}
			else if (transaction.input[0].type === 'Token Deposit' || transaction.input[0].type === 'Token Withdraw') {
				sum += 'Status: transaction failed, you might not have had the right account balance left. Otherwise check if the token is not locked. (Still in ICO, rewards period, disabled etc.)<br><br>';
			} else if (transaction.input[0].type === 'Deposit' || transaction.input[0].type === 'Withdraw') {
				sum += 'Status: transaction failed, you might not have had the right account balance left.<br>';
			}
			else {
				sum += 'Status: transaction failed.<br>';
			}
		} else if (transaction.status === 'Failed') {
			sum += 'Status: Exchange operation failed.<br>';
		} else {
			sum += 'Status: Transaction failed.<br>';
		}

		if (unknownToken) {
			sum += "<strong>This token is still unknown to DeltaBalances </strong>, amount and price might be wrong if the token has less than 18 decimals <br> "

		}
		let operations = {};
		if (transaction.input && transaction.input.length > 0) {
			for (let i = 0; i < transaction.input.length; i++) {
				if (transaction.input[i].note) {
					let operation = 'Operation: ' + transaction.input[i].note + '<br>';
					//avoid double messages
					if (!operations[operation]) {
						sum += operation;
						operations[operation] = true;
					}
				}
			}
			if (transaction.input[0].type.indexOf('aker') !== -1 && transaction.input[0].exchange == _delta.config.exchangeContracts.Idex.name) {
				sum += '<br>Note: IDEX uses no transaction output events.';
			}

		} else if (!transaction.input && (!transaction.output || transaction.output.length == 0) && transaction.rawInput == '0x') {
			//regular ETH transfer, no funciton calls
			let operation = 'Operation: Transferred ' + transaction.value.toString() + ' ETH from ' + _util.addressLink(transaction.from, true, true) + ' to ' + _util.addressLink(transaction.to, true, true) + '<br>';
			sum += operation;
		}
		else if (transaction.output && transaction.output.length > 0) {

			if (transaction.rawInput == '0x') {
				let operation = 'Operation: Transferred ' + transaction.value.toString() + ' ETH from ' + _util.addressLink(transaction.from, true, true) + ' to ' + _util.addressLink(transaction.to, true, true) + '<br>';
				sum += operation;
			}

			for (let i = 0; i < transaction.output.length; i++) {
				if (transaction.output[i].note) {
					let operation = 'Operation: ' + transaction.output[i].note + '<br>';
					//avoid double messages
					if (!operations[operation]) {
						sum += operation;
						operations[operation] = true;
					}
				}
			}
		}

		if (Object.keys(operations).length > 0)
			sum += '<br>';

		if (transaction.input && transaction.input[0].type === 'Transfer') {
			if (_delta.uniqueTokens[transaction.input[0].to]) {
				sum += '<strong>Warning</strong>, you sent tokens to a token contract. These tokens are most likely lost forever. <br>';
			}
			else if (_delta.isExchangeAddress(transaction.input[0].to)) {
				sum += '<strong>Warning</strong>, you sent tokens to the Exchange contract without a deposit. Nobody can access these tokens anymore, they are most likely lost forever. <br>';
			}
		}
		else if (!transaction.input && transaction.rawInput !== '0x' && (!transaction.output || transaction.output.length == 0)) {
			sum += 'This does not seem to be a transaction with a supported decentralized exchange. <br>';
		}
		if (checkOldED(transaction.to)) {
			sum += 'This transaction is to an outdated EtherDelta contract, only use these to withdraw old funds.<br>';
		}


		//handle tx output logs
		var tradeCount = 0;
		var zeroDecWarning = '';
		if (transaction.output) {
			if (transaction.input && transaction.output.length == 1 && transaction.output.price) {
				//transaction.output[0].price = transaction.input[0].price;
				if (transaction.input[0]['order size'].greaterThan(transaction.output[0].amount)) {
					sum += "Partial fill, ";
				}
			}

			//var spent = _delta.web3.toBigNumber(0);
			//var received = _delta.web3.toBigNumber(0);

			for (var i = 0; i < transaction.output.length; i++) {
				if (transaction.output[i].type == 'Taker Buy' || transaction.output[i].type == 'Taker Sell') {
					if (transaction.output[i].token.decimals == 0 && !zeroDecWarning) {
						zeroDecWarning = "<strong>Note: </strong> " + transaction.output[i].token.name + " has 0 decimals precision. Numbers might be lower than expected due to rounding. <br>";
					}
					tradeCount++;
					let typeWord = "Bought ";
					if (transaction.output[i].type == 'Taker Sell') {
						typeWord = "Sold ";
					}

					// add description bought/sold  if not internal enclaves order
					if (transaction.output[i].buyer !== _delta.config.exchangeContracts.Enclaves.addr && transaction.output[i].seller !== _delta.config.exchangeContracts.Enclaves.addr) {
						sum += typeWord + transaction.output[i].amount + " " + transaction.output[i].token.name + " for " + transaction.output[i].price + " " + transaction.output[i].base.name + " each, " + transaction.output[i].baseAmount + " " + transaction.output[i].base.name + " in total. <br>";
					}
					//spent = transaction.output[i].ETH.plus(spent);
				}
				else if (transaction.output[i].type == "Deposit" || transaction.output[i].type == "Token Deposit") {
					sum += "Deposited " + transaction.output[i].amount + " " + transaction.output[i].token.name + ", new exchange balance: " + transaction.output[i].balance + " " + transaction.output[i].token.name + '<br>';
				}
				else if (transaction.output[i].type == "Withdraw" || transaction.output[i].type == "Token Withdraw") {
					sum += "Withdrew " + transaction.output[i].amount + " " + transaction.output[i].token.name + ", new exchange balance: " + transaction.output[i].balance + " " + transaction.output[i].token.name + '<br>';
				}
			}

			if (tradeCount > 1 && !_delta.isExchangeAddress(transaction.to)) {
				sum += '<br>This transaction was made by a contract that has made multiple trades in a single transaction. <br>';
				// sum up what a custom cotract did in multiple trades
				//	sum += "ETH gain over these trades: " + (received.minus(spent).minus(transaction.gasEth)) + " (incl. gas cost). <br>";
			}
			else if (tradeCount > 0 && !_delta.isExchangeAddress(transaction.to)) {
				sum += '<br>This transaction was made by a contract instead of a user. <br>';
			}

			if (zeroDecWarning)
				sum += zeroDecWarning;
		}


		$('#summary').html(sum);


		// handle generic tx data

		$('#hash').html(_util.hashLink(transaction.hash, true));
		$('#from').html(_util.addressLink(transaction.from, true, false));
		$('#to').html(_util.addressLink(transaction.to, true, false));
		$('#cost').html('??');
		$('#gasgwei').html(transaction.gasGwei + ' Gwei (' + '<span data-toggle="tooltip" title="' + _util.exportNotation(transaction.gasPrice) + '">' + transaction.gasPrice.toFixed(10) + ' ETH)</span>');
		if (!transaction.gasUsed)
			transaction.gasUsed = '???';
		$('#gasusedlimit').html(transaction.gasUsed + " / " + transaction.gasLimit);
		if (transaction.status === 'Completed') {
			$('#gascost').html('<span data-toggle="tooltip" title="' + _util.exportNotation(transaction.gasEth) + '">' + Number(transaction.gasEth).toFixed(5) + ' ETH</span>');
		} else if (transaction.status === 'Pending') {
			$('#gascost').html('Pending');
		} else {
			$('#gascost').html('<span data-toggle="tooltip" title="' + _util.exportNotation(transaction.gasEth) + '">' + transaction.gasEth.toFixed(5) + ' ETH</span>');
		}
		$('#nonce').html(transaction.nonce);
		if (transaction.status === 'Completed') {
			$('#status').html('<i style="color:green;" class="fa fa-check"></i>' + ' ' + transaction.status);
			$('#time').html(txDate !== "??" ? _util.formatDate(txDate) : txDate);
		}
		else if (transaction.status === 'Pending') {
			$('#status').html('<i class="fa fa-cog fa-fw"></i>' + ' ' + transaction.status);
			$('#time').html('Pending');
		}
		else {
			$('#status').html('<i style="color:red;" class="fa fa-exclamation-circle"></i>' + ' ' + transaction.status);
			$('#time').html(txDate !== "??" ? _util.formatDate(txDate) : txDate);
		}

		$('#ethval').html('<span data-toggle="tooltip" title="' + _util.exportNotation(transaction.value) + '">' + transaction.value.toString() + '</span>');
		$('#inputdata').html('');
		if (transaction.input && transaction.input[0].type) {
			$('#inputtype').html(transaction.input[0].type);
		} else {
			if (tradeCount == 0)
				$('#inputtype').html('');
			else
				$('#inputtype').html('Trade');
		}
		if (transaction.input) {
			displayParse(transaction.input, "#inputdata");
		}

		$('#outputdata').html('');
		if (transaction.output) {
			displayParse(transaction.output, "#outputdata");
			if (transaction.outputErrors) {
				$('#outputdata').append('<br> + ' + transaction.outputErrors + ' unrecognized events emitted');
			}
		}
		else if (transaction.status === 'Pending')
			$('#outputdata').html('Transaction is pending, no output available yet.');
		else
			$('#outputdata').html('');




		running = false;
		buttonLoading();
		disableInput(false);
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
		$('#gasusedlimit').html('');
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
			$(id).html('No familiar Exchange data recognized');

			return;
		}

		// group similar typed events into the same table
		let types = {};
		for (var i = 0; i < parsedInput.length; i++) {
			let uniqueType = parsedInput[i].type.toLowerCase();
			if (uniqueType.indexOf('taker') !== -1 || uniqueType.indexOf('maker') !== -1) {
				uniqueType = 'trade';
				wideOutput = true;
			}
			else if (uniqueType.indexOf('cancel') !== -1) {
				uniqueType = 'cancel';
				wideOutput = true;
			} else if (uniqueType === 'deposit' || uniqueType === 'token deposit' || uniqueType === 'withdraw' || uniqueType === 'token withdraw') {
				uniqueType = 'depositWithdraw';
			}
			else if (uniqueType.indexOf(' up to') !== -1 || uniqueType.indexOf('offer') !== -1) {
				wideOutput = true;
			}
			if (!types[uniqueType])
				types[uniqueType] = [];

			types[uniqueType].push(parsedInput[i]);
		}

		if (wideOutput) {
			$('#inputdiv').removeClass('col-lg-6')
			$('#outputdiv').removeClass('col-lg-6');
		} else {
			$('#inputdiv').addClass('col-lg-6')
			$('#outputdiv').addClass('col-lg-6');
		}


		let batchedInput = Object.values(types);
		for (var i = 0; i < batchedInput.length; i++) {
			buildHtmlTable(id, batchedInput[i]);
		}


		$("table").tablesorter({
			widgets: ['scroller'],
			widgetOptions: {
				scroller_barWidth: 18,
			},
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
		let contracts = Object.values(_delta.config.exchangeContracts);
		for (var i = 0; i < contracts.length; i++) {
			if (lcAddr == contracts[i].addr && contracts[i].name == 'EtherDelta-OLD') {
				return i > 0;
			}
		}
		return false;
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

	// Builds the HTML Table out of myList.
	function buildHtmlTable(selector, myObj) {

		if (!myObj)
			return;
		if (!Array.isArray(myObj))
			myObj = [myObj];

		var keys = Object.keys(myObj[0]);


		var table$ = $('<table class="table table-sm parsed" cellspacing="0" cellpadding="0" />');

		var columns = addAllColumnHeaders(keys, table$);
		var tbody$ = $('<tbody class/>');

		for (let j = 0; j < myObj.length; j++) {
			let myList = Object.values(myObj[j]);
			var row$ = $('<tr/>');

			for (var i = 0; i < myList.length; i++) {

				if (columns[keys[i]]) {

					var cellValue = myList[i];
					if (keys[i] == 'token' || keys[i] == 'base' || keys[i] == 'feeToken' || keys[i] == 'FeeToken ' || keys[i] == 'FeeToken' || keys[i] == 'token In' || keys[i] == 'token Out') {

						let token = cellValue;
						if (token) {
							let popover = _delta.makeTokenPopover(token);
							cellValue = popover;
						} else {
							cellValue = "";
						}
					}
					else if (keys[i] == 'price' || keys[i] == 'minPrice' || keys[i] == 'maxPrice' || keys[i] == 'fee' || keys[i] == 'takerFee' || keys[i] == 'makerFee') {
						if (cellValue !== "")
							cellValue = '<span data-toggle="tooltip" title="' + _util.exportNotation(cellValue) + '">' + cellValue.toFixed(5) + '</span>';
					}
					else if (keys[i] == 'order size' || keys[i] == 'amount' || keys[i] == 'estAmount' || keys[i] == 'baseAmount' || keys[i] == 'estBaseAmount' || keys[i] == 'balance') {
						cellValue = '<span data-toggle="tooltip" title="' + _util.exportNotation(cellValue) + '">' + cellValue.toFixed(3) + '</span>';
					}
					else if (keys[i] == 'seller' || keys[i] == 'buyer' || keys[i] == 'to' || keys[i] == 'sender' || keys[i] == 'from' || keys[i] == 'maker' || keys[i] == 'taker' || keys[i] == 'wallet') {
						if (cellValue)
							cellValue = _util.addressLink(cellValue, true, true);
					}

					if (cellValue == null) cellValue = "";
					//let head = columns[colIndex];

					{
						row$.append($('<td/>').html(cellValue.toString()));
					}
				}
			}

			tbody$.append(row$);
		}

		table$.append(tbody$);
		$(selector).append(table$);
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
					if (key === 'baseAmount')
						key = 'Total';
					else if (key === 'estBaseAmount')
						key = 'Est. Total';
					else if (key === 'estAmount')
						key = 'Est. Amount';
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
			if (localStorage.getItem("address") !== null) {
				var addr = localStorage.getItem("address");
				if (addr && addr.length == 42) {
					savedAddr = addr;
					setSavedImage(savedAddr);
					$('#savedAddress').html(addr.slice(0, 16));
				} else {
					localStorage.removeItem("address");
				}
			}
		}
		if (sessionStorage.getItem("address") !== null) {
			var addr = sessionStorage.getItem("address");
			if (addr && addr.length == 42) {
				publicAddr = addr;
			} else {
				sessionStorage.removeItem("address");
			}
		}
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


	function setAddrImage(addr) {

		var icon2 = document.getElementById('currentAddrImg');
		var icon3 = document.getElementById('userImage');

		if (addr) {
			var smallImg = 'url(' + blockies.create({ seed: addr.toLowerCase(), size: 8, scale: 4 }).toDataURL() + ')';
			icon2.style.backgroundImage = smallImg;
			icon3.style.backgroundImage = smallImg;
		} else {
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

	function forget() {
		if (publicAddr) {
			if (publicAddr.toLowerCase() === savedAddr.toLowerCase()) {
				savedAddr = '';
				$('#savedSection').addClass('hidden');
			}
		}
		publicAddr = '';
		setAddrImage('');
		document.getElementById('currentAddr').innerHTML = '0x......'; // side menu
		document.getElementById('currentAddr2').innerHTML = '0x......'; //top bar
		setStorage();
		window.location.hash = "";
		$('#walletInfo').addClass('hidden');
		if (!publicAddr && !savedAddr && !metamaskAddr) {
			$('#userToggle').click();
			$('#userToggle').addClass('hidden');
		}
		//myClick();

		return false;
	}

	function save() {
		savedAddr = publicAddr;

		$('#savedAddress').html(savedAddr.slice(0, 16));
		$('#savedSection').addClass('hidden');
		$('#save').addClass('hidden');
		setSavedImage(savedAddr);
		setStorage();

		return false;
	}

	//called from html onclick
	function loadSaved() {
		if (savedAddr) {

			publicAddr = savedAddr;
			document.getElementById('currentAddr').innerHTML = savedAddr.slice(0, 16); // side menu
			document.getElementById('currentAddr2').innerHTML = savedAddr.slice(0, 8); //top bar

			$('#walletInfo').removeClass('hidden');
			$('#save').addClass('hidden');
			$('#forget').removeClass('hidden');
			$('#savedSection').addClass('hidden');
			document.getElementById('currentAddrDescr').innerHTML = 'Saved address';

			$('#etherscan').attr("href", _util.addressLink(savedAddr, false, false));
			if (metamaskAddr && metamaskAddr !== savedAddr) {
				$('#savedsection').removeClass('hidden');
			}
			setAddrImage(savedAddr);
			setStorage();
		}
		return false;
	}

	//called from html onclick
	function loadMetamask() {
		if (metamaskAddr) {

			publicAddr = metamaskAddr;
			document.getElementById('currentAddr').innerHTML = metamaskAddr.slice(0, 16); // side menu
			document.getElementById('currentAddr2').innerHTML = metamaskAddr.slice(0, 8); //top bar

			$('#walletInfo').removeClass('hidden');
			$('#metamaskSection').addClass('hidden');
			document.getElementById('currentAddrDescr').innerHTML = 'Metamask address';

			$('#etherscan').attr("href", _util.addressLink(metamaskAddr, false, false));
			setAddrImage(metamaskAddr);
			if (savedAddr && savedAddr !== metamaskAddr) {
				$('#savedsection').removeClass('hidden');
			}
			setStorage();
		}
		return false;
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

}