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
	var recentTable = undefined;


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

	var blockDates = {};

	var transLoaded = 0;

	// user input & data
	var publicAddr = '';
	var savedAddr = '';
	var metamaskAddr = '';
	var lastResult2 = undefined;

	// config
	var tokenCount = 0; //auto loaded
	var blocktime = 14;
	var blocknum = -1;
	var startblock = 0;
	var endblock = 'latest';
	var transactionDays = 5;


	var displayFilter = {
		'Maker trade': 1,
		'Taker trade': 1,
		Deposit: 1,
		Withdraw: 1,
		Cancel: 0,
		'Wrap ETH': 1,
		'Unwrap ETH': 1,
		Approve: 0,
		Transfer: 1
	}

	// placeholder
	var transactionsPlaceholder = [
		{
			Status: true,
			Type: 'Deposit',
			Exchange: 'Placeholder',
			Token: _delta.config.tokens[0],
			Amount: 0,
			Price: '',
			Base: _delta.config.tokens[0],
			Total: 0,
			Hash: '0xH4SH',
			Date: _util.toDateTimeNow(),
			Info: window.location.origin + window.location.pathname + '/../tx.html#',
		}
	];


	init();

	$(document).ready(function () {
		readyInit();
	});

	function init() {

		getBlockStorage();

		// borrow some ED code for compatibility
		_delta.startDeltaBalances(false, () => {
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

		//get metamask address as possbile input (if available)
		metamaskAddr = _util.getMetamaskAddress();
		if (metamaskAddr) {
			setMetamaskImage(metamaskAddr);
			$('#metamaskAddress').html(metamaskAddr.slice(0, 16));
		}

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

		$('#typesDropdown').on('changed.bs.select', function (e) {
			//  $('#typesDropdown').on('hidden.bs.select', function (e) {
			var selected = []
			selected = $('#typesDropdown').val()

			// array of exchange names
			setTimeout(function () {
				toggleFilter(selected);
			}, 100);

		});

		//set types dropdown
		let dropdownVal = [];
		let displFilt = Object.keys(displayFilter);
		for (let i = 0; i < displFilt.length; i++) {
			let displ = displayFilter[displFilt[i]];
			if (displ) {
				dropdownVal.push(displFilt[i]);
			}
		}
		$('#typesDropdown').selectpicker('val', dropdownVal);

		placeholderTable();

		// url hash #0x..
		var addr = '';
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
			if (publicAddr !== savedAddr) {
				$('#forget').addClass('hidden');
			}
			autoStart = true;
			myClick();
		} else if (savedAddr) {//autoload when remember is active
			autoStart = true;
			// auto start loading
			loadSaved();
		} else if (metamaskAddr) {
			autoStart = true;
			loadMetamask();
		}
		else if (!addr && !publicAddr) {
			$('#userToggle').addClass('hidden');
			$('#address').focus();
		}
		if (autoStart && !initiated) {
			showLoading(true);
			if (table2Loaded && recentTable) {
				recentTable.clear().draw();
			}
		}
	}

	// more decimals checbox
	var changedDecimals = false;
	function checkDecimal() {
		changedDecimals = true;
		decimals = $('#decimals').prop('checked');
		setStorage();
		fixedDecimals = decimals ? 8 : 3;

		if (lastResult2) {
			makeTable2(lastResult2);
		} else {
			placeholderTable();
		}
		changedDecimals = false;
	}



	function toggleFilter(selected) {

		let changed = false;
		let displFilt = Object.keys(displayFilter);
		for (let i = 0; i < displFilt.length; i++) {

			let enabled = 0;
			if (selected.length > 0 && selected.indexOf(displFilt[i]) !== -1) {
				enabled = 1;
			}
			if (displayFilter[displFilt[i]] !== enabled) {
				displayFilter[displFilt[i]] = enabled;
				changed = true;
			}
		}

		if (changed) {
			if (lastResult2) {
				makeTable2(lastResult2);
			} else {
				placeholderTable();
			}
		}
	}

	function checkFilter(transType) {
		if (transType) {
			if (transType.indexOf('Maker') !== -1 || transType == 'Buy offer' || transType == 'Sell offer') {
				return displayFilter['Maker trade'];
			} else if (transType.indexOf('Taker') !== -1 || transType.indexOf('up to') !== -1 || transType == 'Trade') {
				return displayFilter['Taker trade'];
			}
			else if (transType === 'Deposit') {
				return displayFilter.Deposit;
			}
			else if (transType === 'Withdraw') {
				return displayFilter.Withdraw;
			}
			else if (transType.indexOf('Cancel') !== -1) {
				return displayFilter.Cancel;
			}
			else if (transType.indexOf('Wrap ') !== -1) {
				return displayFilter['Wrap ETH'];
			}
			else if (transType.indexOf('Unwrap ') !== -1) {
				return displayFilter['Unwrap ETH'];
			}
			else if (transType === 'Approve') {
				return displayFilter.Approve;
			}
			else if (transType === 'In' || transType === 'Out' || transType.indexOf('Transfer') !== -1) {
				return displayFilter.Transfer;
			}
			else {
				return true;
			}
		} else {
			return false;
		}
	}

	function disableInput(disable) {
		$('#refreshButton').prop('disabled', disable);
		// $("#address").prop("disabled", disable);
		$('#loadingTransactions2').addClass('dim');
		$("#loadingTransactions2").prop("disabled", disable);

	}

	function showLoading(trans) {
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

	function buttonLoading(trans) {
		if (!publicAddr) {
			hideLoading(trans);
			return;
		}
		if (trans) {
			$('#loadingTransactions2').removeClass('fa-spin');
			$('#loadingTransactions2').removeClass('dim');
			$('#loadingTransactions2').prop('disabled', false);
			$('#loadingTransactions2').show();
			//	$('#refreshButtonLoading').show();
			//	$('#refreshButtonSearch').hide();
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
		}
	}

	function hideLoading(trans) {
		if (!publicAddr) {
			trans = true;
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
			hideLoading(true);
		}
	}

	function getAll(autoload, rqid) {
		//if(running)
		//	return;

		running = true;

		trigger_2 = true;

		lastResult2 = undefined;

		if (publicAddr) {
			setStorage();
			window.location.hash = publicAddr;
			if (table2Loaded) {
				recentTable.clear().draw();
			}
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

			showLoading(true);

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

	function getTransactions(rqid) {
		outputHashes = {};

		transLoaded = 0;
		var transResult = [];
		var inTransResult = [];
		var tokenTxResult = [];


		let normalRetries = 0;
		let internalRetries = 0;
		let tokenRetries = 0;

		normalTransactions();
		internalTransactions();
		tokenTransactions();

		function normalTransactions() {
			$.getJSON('https://api.etherscan.io/api?module=account&action=txlist&address=' + publicAddr + '&startblock=' + startblock + '&endblock=' + endblock + '&sort=desc&apikey=' + _delta.config.etherscanAPIKey).done((result) => {
				if (requestID > rqid)
					return;
				if (result && result.status === '1')
					transResult = result.result;
				transLoaded++;
				processTransactions(transResult);
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
					processTransactions(transResult);
				}
			});
		}


		function tokenTransactions() {
			$.getJSON('https://api.etherscan.io/api?module=account&action=tokentx&address=' + publicAddr + '&startblock=' + startblock + '&endblock=' + endblock + '&sort=desc&apikey=' + _delta.config.etherscanAPIKey).done((result) => {
				if (requestID > rqid)
					return;
				if (result && result.status === '1')
					tokenTxResult = result.result;
				transLoaded++;
				processTransactions(tokenTxResult);
			}).fail((result) => {
				if (requestID > rqid)
					return;
				if (tokenRetries < 2) {
					tokenRetries++;
					tokenTransactions();
					return;
				} else {
					showError('Failed to load recent transactions (token transfers) after 3 tries, try again later.');
					transLoaded++;
					processTransactions(tokenTxResult);
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
				processTransactions(inTransResult);
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
					processTransactions(inTransResult);
				}
			});
		}




		var outputHashes = {};

		function processTransactions(resultArray) {
			var myAddr = publicAddr.toLowerCase();
			var inputTransactions = [];

			addTransactions(resultArray);
			var setNewDates = false;

			if (setNewDates)
				setBlockStorage();

			function addTransactions(array) {
				for (let i = 0; i < array.length; i++) {
					let tx = array[i];
					// only parse tx if..
					if (
						!outputHashes[tx.hash] ||  // we don't know it yet
						outputHashes[tx.hash].Incomplete ||
						outputHashes[tx.hash].exchange == "" || // we parsed it with no detected exchange, different source might help
						(tx.contractAddress && //token transfer event
							(outputHashes[tx.hash].Token.unknown ||  //parsed it but didn't know token, we get new token data from etherscan transfer events
								outputHashes[tx.hash].Token.addr === _delta.config.ethAddr // we parsed ETH, now we see a token transfer
							)
						) ||
						(tx.type == "call") //internal eth transfer
					) {

						let from = tx.from.toLowerCase();
						let to = tx.to.toLowerCase();
						let myAddr = publicAddr.toLowerCase();
						let contract = tx.contractAddress;
						if (contract)
							contract = contract.toLowerCase();

						//save etherscan block dates in cache for tx details & history
						if (tx.blockNumber) {

							let block = tx.blockNumber;
							if (!blockDates[block]) {
								blockDates[block] = _util.toDateTime(tx.timeStamp);
								setNewDates = true;
							}

							if (Number(block) >= startblock) { // etherscan token events seem to return before startblock

								// if we know a name for this address (token, exhcange, exchangeadmin), it is useful
								if (_delta.addressName(from) !== from || _delta.addressName(to) !== to || to == myAddr || from == myAddr || (contract && _delta.addressName(contract) !== contract)) {
									inputTransactions.push(tx);
								}
							}
						}
					}
				}
			}


			let newTokens = [];

			// process all recent tx from etherscan
			for (var i = 0; i < inputTransactions.length; i++) {
				var tx = inputTransactions[i];
				var from = tx.from.toLowerCase();
				var to = tx.to.toLowerCase();
				var val = _delta.web3.toBigNumber(tx.value);
				var myAddr = publicAddr.toLowerCase();

				//only on token transfer events
				var contract = tx.contractAddress;
				var internal = tx.type == "call" || tx.gasUsed == "0"; //from internal tx request

				if (contract) {
					tx.isError = '0';  // token events have no error param
					contract = contract.toLowerCase();
					try {
						if (!_delta.uniqueTokens[contract]) {

							if (tx.tokenSymbol !== "" && tx.tokenDecimal !== "") {
								let newToken = {
									addr: contract,
									name: _util.escapeHtml(tx.tokenSymbol),
									name2: _util.escapeHtml(tx.tokenName),
									decimals: Number(tx.tokenDecimal),
									unlisted: true,
								};
								_delta.uniqueTokens[contract] = newToken;
								newTokens.push(newToken);
							}
						}
					} catch (e) { }
				}

				// internal tx (withdraw or unwrap ETH)
				if (to === myAddr && !contract && internal && from !== _delta.config.exchangeContracts.Kyber.addr) {
					var trans = undefined;

					if (_util.isWrappedETH(from)) {
						var val = _util.weiToEth(tx.value);
						trans = createOutputTransaction('Unwrap ETH', _delta.setToken(tx.from), val, _delta.config.tokens[0], val, tx.hash, tx.timeStamp, true, '', tx.isError === '0', '');
						trans.Incomplete = true;
					}
					else if (_delta.isExchangeAddress(from)) {
						// IDEX withdraw, only found in internal tx
						if (_delta.config.exchangeContracts.Idex.addr == from) {
							var val = _util.weiToEth(tx.value);
							trans = createOutputTransaction('Withdraw', _delta.config.tokens[0], val, '', '', tx.hash, tx.timeStamp, false, '', tx.isError === '0', _delta.addressName(tx.from, false));
						}
						// used to detect airswap fails that send back the same ETH amount
						else if (_delta.config.exchangeContracts.AirSwap.addr == from && val.greaterThan(0)) {
							var val = _util.weiToEth(tx.value);
							trans = createOutputTransaction('In', _delta.config.tokens[0], val, '', '', tx.hash, tx.timeStamp, true, '', tx.isError === '0', _delta.config.exchangeContracts.AirSwap.name);
							trans.Incomplete = true; //should be a tx with acutal input

						}
					} else if (val.greaterThan(0)) {
						let amount = _util.weiToEth(val, undefined);

						let exchange = '';
						//Ether transfer
						if (tx.input !== '0x') {
							exchange = 'unknown ';
						}
						// do we know an alias, but not a token
						if (_delta.addressName(to) !== to && !_delta.uniqueTokens[to]) {
							exchange = _delta.addressName(to);
						} else if (_delta.addressName(from) !== from && !_delta.uniqueTokens[from]) {
							exchange = _delta.addressName(from);
						}

						if (to === myAddr) {
							trans = createOutputTransaction('In', _delta.config.tokens[0], amount, '', '', tx.hash, tx.timeStamp, true, '', tx.isError === '0', exchange);
							trans.Incomplete = true;
						} else if (from === myAddr) {
							trans = createOutputTransaction('Out', _delta.config.tokens[0], amount, '', '', tx.hash, tx.timeStamp, true, '', tx.isError === '0', exchange);
							trans.Incomplete = true;
						}
					}
					if (trans) {
						addTransaction(trans);
					}
				}
				// token deposit/withdraw, trades, cancels
				else {
					var unpacked = _util.processInput(tx.input);
					if (unpacked && unpacked.name) {
						let objs = _delta.processUnpackedInput(tx, unpacked);

						if (objs) {
							if (!Array.isArray(objs)) {
								objs = [objs];
							}

							for (let i = 0; i < objs.length; i++) {
								let obj = objs[i];

								let trans = undefined;
								let exchange = obj.exchange;
								let exName = ''
								if (!exchange) {
									exName = _delta.addressName(to, false);
									if (contract && exName.slice(0, 2) == '0x')
										exName = _delta.addressName(from, false);
									if (exName.slice(0, 2) !== '0x')
										exchange = exName;
								}


								if (unpacked.name === 'deposit') {
									if (obj.type === 'Wrap ETH') {
										trans = createOutputTransaction(obj.type, obj['token In'], obj.amount, obj['token Out'], obj.amount, tx.hash, tx.timeStamp, true, '', tx.isError === '0', '');
									} else {
										trans = createOutputTransaction(obj.type, obj.token, obj.amount, '', '', tx.hash, tx.timeStamp, false, '', tx.isError === '0', _delta.addressName(to, false));
									}
								}
								else if (unpacked.name === 'withdraw') {

									if (obj.type === 'Unwrap ETH') {
										trans = createOutputTransaction(obj.type, obj['token In'], obj.amount, obj['token Out'], obj.amount, tx.hash, tx.timeStamp, true, '', tx.isError === '0', '');
									} else {
										trans = createOutputTransaction(obj.type, obj.token, obj.amount, '', '', tx.hash, tx.timeStamp, false, '', tx.isError === '0', _delta.addressName(to, false));
									}
								}
								else if (unpacked.name === 'depositToken' || unpacked.name === 'withdrawToken' || unpacked.name === 'depositBoth') {
									obj.type = obj.type.replace('Token ', '');
									if (unpacked.name !== 'depositBoth') {
										trans = createOutputTransaction(obj.type, obj.token, obj.amount, '', '', tx.hash, tx.timeStamp, obj.unlisted, '', tx.isError === '0', exchange);
									} else {
										trans = createOutputTransaction(obj.type, obj.token, obj.amount, obj.base, obj.baseAmount, tx.hash, tx.timeStamp, obj.unlisted, '', tx.isError === '0', exchange);
									}
								} else if (unpacked.name === 'adminWithdraw') {

									//this is only in etherscan tx events
									exchange = _delta.addressName(from, false);
									obj.type = obj.type.replace('Token ', '');
									trans = createOutputTransaction(obj.type, obj.token, obj.amount, '', '', tx.hash, tx.timeStamp, obj.unlisted, '', tx.isError === '0', exchange);
								}
								else if ((unpacked.name == 'kill' || unpacked.name == 'cancel') && unpacked.params.length == 1) {
									trans = createOutputTransaction(obj.type, undefined, undefined, undefined, undefined, tx.hash, tx.timeStamp, undefined, undefined, tx.isError === '0', exchange);
								} else if (unpacked.name == 'buy' && unpacked.params.length == 2) {
									trans = createOutputTransaction(obj.type, undefined, undefined, undefined, undefined, tx.hash, tx.timeStamp, undefined, undefined, tx.isError === '0', exchange);
								}
								else if (unpacked.name === 'cancelOrder' || unpacked.name === 'batchCancelOrders' || unpacked.name === 'cancel' || unpacked.name == 'cancelAllSellOrders' || unpacked.name == 'cancelAllBuyOrders') {
									let cancelAmount = '';
									if (obj.baseAmount)
										cancelAmount = obj.baseAmount;
									if (obj.relayer) {
										let relay = _util.relayName(obj.relayer);
										if (relay) {
											exchange = relay;
										}
									}
									trans = createOutputTransaction(obj.type, obj.token, obj.amount, obj.base, cancelAmount, tx.hash, tx.timeStamp, obj.unlisted, obj.price, tx.isError === '0', exchange);
								}
								else if (unpacked.name === 'trade' || unpacked.name === 'fill' || unpacked.name === 'tradeEtherDelta') {

									if (unpacked.name === 'trade' && unpacked.params.length === 7) {
										//kyber only
										if (obj.type == 'Buy up to') {
											trans = createOutputTransaction(obj.type, obj.token, undefined, obj.base, obj.baseAmount, tx.hash, tx.timeStamp, obj.unlisted, obj.maxPrice, tx.isError === '0', exchange);
										} else {
											trans = createOutputTransaction(obj.type, obj.token, obj.amount, obj.base, undefined, tx.hash, tx.timeStamp, obj.unlisted, obj.minPrice, tx.isError === '0', exchange);
										}
									} else {
										// other trade
										trans = createOutputTransaction(obj.type, obj.token, obj.amount, obj.base, obj.baseAmount, tx.hash, tx.timeStamp, obj.unlisted, obj.price, tx.isError === '0', exchange);
									}
								} else if (unpacked.name == 'takeSellOrder' || unpacked.name == 'takeBuyOrder' || unpacked.name == 'makeSellOrder' || unpacked.name == 'makeBuyOrder') {

									if (obj.maker == myAddr) {// maker trade from etherscan token event
										if (obj.type == 'Taker Buy') {
											obj.type = 'Maker Sell';
										} else if (obj.type == 'Taker Sell') {
											obj.type = 'Maker Buy';
										}
									}
									trans = createOutputTransaction(obj.type, obj.token, obj.amount, obj.base, obj.baseAmount, tx.hash, tx.timeStamp, obj.unlisted, obj.price, tx.isError === '0', exchange);
								}
								else if( unpacked.name === 'buy' || unpacked.name == 'sell' || unpacked.name == 'createSellOrder' || unpacked.name == 'createBuyOrder') {
									trans = createOutputTransaction(obj.type, obj.token, obj.amount, obj.base, obj.baseAmount, tx.hash, tx.timeStamp, obj.unlisted, '', tx.isError === '0', exchange);
								}
								else if (unpacked.name === 'convert' || unpacked.name === 'quickConvert' || unpacked.name === 'quickConvertPrioritized'
									|| unpacked.name === 'convertFor' || unpacked.name == 'convertForPrioritized' || unpacked.name === 'convertForPrioritized2') {

									if (obj.type == 'Buy up to') {
										// did send ETH along with tx and base is wrapped ether
										if (obj.base && _util.isWrappedETH(obj.base.addr) && val.greaterThan(0)) {
											let ethval = _util.weiToEth(val);
											if (String(ethval) == String(obj.baseAmount)) {
												obj.base = _delta.setToken(_delta.config.ethAddr);
											}
										}
										trans = createOutputTransaction(obj.type, obj.token, undefined, obj.base, obj.baseAmount, tx.hash, tx.timeStamp, obj.unlisted, obj.maxPrice, tx.isError === '0', exchange);
									} else {
										trans = createOutputTransaction(obj.type, obj.token, obj.amount, obj.base, undefined, tx.hash, tx.timeStamp, obj.unlisted, obj.minPrice, tx.isError === '0', exchange);
										//internal tx to unwrap eth token
										trans.Incomplete = true;
									}
								}
								else if (unpacked.name === 'approve') {
									if (!exchange) {
										if (_delta.isExchangeAddress(obj.to)) {
											exchange = _delta.addressName(obj.to.toLowerCase(), false);
										} else {
											exchange = '';
										}
									}
									if (obj.amount.greaterThan(999999999999999))
										obj.amount = '';
									trans = createOutputTransaction(obj.type, obj.token, obj.amount, '', '', tx.hash, tx.timeStamp, obj.unlisted, '', tx.isError === '0', exchange);
								}
								else if (unpacked.name === 'fillOrder'
									|| unpacked.name === 'fillOrKillOrder'
									|| unpacked.name === 'batchFillOrders'
									|| unpacked.name === 'batchFillOrKillOrders'
									|| unpacked.name === 'fillOrdersUpTo'
								) {
									if ((!contract && (obj.maker == myAddr || obj.taker == myAddr))
										|| (contract && (to == myAddr || from == myAddr))) {

										if (obj.maker === myAddr) {
											if (obj.type == 'Taker Buy') {
												obj.type = 'Maker Sell';
											} else if (obj.type == 'Taker Sell') {
												obj.type = 'Maker Buy';
											}
										}
										let price = obj.price;
										if (unpacked.name === 'fillOrdersUpTo') {
											if (i == 0) {
												price = obj.maxPrice;
											}
											else {
												continue;
											}
										}
										if (obj.relayer) {
											let relay = _util.relayName(obj.relayer);
											if (relay) {
												exchange = relay;
											}
										}
										trans = createOutputTransaction(obj.type, obj.token, obj.amount, obj.base, obj.baseAmount, tx.hash, tx.timeStamp, obj.unlisted, price, tx.isError === '0', exchange);
									}
								} else if (unpacked.name === 'offer') {
									let type = obj.type;
									if (contract && to == myAddr) {
										if (type === 'Buy offer')
											type = 'Maker Sell';
										else if (type === 'Sell offer') {
											type = 'Maker Buy'
										}
										if (exchange == "") {
											exchange = 'OasisDex ';
										}
									}
									trans = createOutputTransaction(type, obj.token, obj.amount, obj.base, obj.baseAmount, tx.hash, tx.timeStamp, obj.unlisted, obj.price, tx.isError === '0', exchange);
								} else if (unpacked.name === 'transfer') {
									let newType = '';
									if (obj.from == myAddr) {
										newType = 'Out';
									} else if (obj.to.toLowerCase() == myAddr) {
										newType = 'In';
									}
									let exch = '';
									if (_delta.config.exchangeWallets[from]) {
										exch = _delta.config.exchangeWallets[from];
									} else if (_delta.config.exchangeWallets[to]) {
										exch = _delta.config.exchangeWallets[to];
									}

									trans = createOutputTransaction(newType, obj.token, obj.amount, '', '', tx.hash, tx.timeStamp, obj.unlisted, '', tx.isError === '0', exch);
								}

								addTransaction(trans);
							}
						}
					}
					// not a recognized function call, but ETH or tokens still moved
					else {
						let trans2 = undefined;
						let exchange = '';


						//Ether transferred or unknown func accepting ETH
						if (!contract && val.greaterThan(0)) {

							let amount = _util.weiToEth(val, undefined);

							// Ether token wrapping that uses fallback
							if (_util.isWrappedETH(to)) {
								trans2 = createOutputTransaction("Wrap ETH", _delta.config.tokens[0], amount, _delta.uniqueTokens[to], amount, tx.hash, tx.timeStamp, true, '', tx.isError === '0', exchange);
							} else {
								//Ether transfer
								if (tx.input !== '0x') {
									exchange = 'unknown ';
								}

								// do we know an alias, but not a token
								if (_delta.addressName(to) !== to && !_delta.uniqueTokens[to]) {
									exchange = _delta.addressName(to);
								} else if (_delta.addressName(from) !== from && !_delta.uniqueTokens[from]) {
									exchange = _delta.addressName(from);
								}

								if (to === myAddr) {
									trans2 = createOutputTransaction('In', _delta.config.tokens[0], amount, '', '', tx.hash, tx.timeStamp, true, '', tx.isError === '0', exchange);
									trans2.Incomplete = true;
								} else if (from === myAddr) {
									trans2 = createOutputTransaction('Out', _delta.config.tokens[0], amount, '', '', tx.hash, tx.timeStamp, true, '', tx.isError === '0', exchange);
									trans2.Incomplete = true;
								}

							}
						}
						//unknown source of token transfer
						else if (contract) {
							let newType = '';
							if (from == myAddr) {
								newType = 'Out';
							} else if (to == myAddr) {
								newType = 'In';
							}

							exchange = 'unknown ';
							// do we know an alias, but not a token
							if (_delta.addressName(to) !== to && !_delta.uniqueTokens[to]) {
								exchange = _delta.addressName(to);
							} else if (_delta.addressName(from) !== from && !_delta.uniqueTokens[from]) {
								exchange = _delta.addressName(from);
							}

							let token = _delta.setToken(contract);
							if (token) {
								let dvsr = _delta.divisorFromDecimals(token.decimals);
								let amount = _util.weiToEth(val, dvsr);
								trans2 = createOutputTransaction(newType, token, amount, '', '', tx.hash, tx.timeStamp, token.unlisted, '', tx.isError === '0', exchange);
								trans2.Incomplete = true;
							}
						}

						addTransaction(trans2);
					}
				}
			}
			try {
				if (unknownTokenCache && unknownTokenCache.length >= 0) {
					unknownTokenCache = unknownTokenCache.concat(newTokens);
					setStorage();
				}
			} catch (e) { console.log('failed to set token cache'); }
			done();

			function addTransaction(transs) {
				if (transs && transs.Hash) {
					// don't know it, or know it without knowing the token
					if (!outputHashes[transs.Hash] || (transs.Type === outputHashes[transs.Hash].Type && outputHashes[transs.Hash].Token.unknown)) {
						outputHashes[transs.Hash] = transs;
					}
					// we parsed a different token the second time   (etherscan regular tx input vs erc20 event )
					else if (outputHashes[transs.Hash].Token.addr !== transs.Token.addr || transs.Type !== outputHashes[transs.Hash].Type) {

						let exchange = 'unknown ';
						if (_delta.addressName(to) !== to && !_delta.uniqueTokens[to]) {
							exchange = _delta.addressName(to);
						} else if (_delta.addressName(from) !== from && !_delta.uniqueTokens[from]) {
							exchange = _delta.addressName(from);
						}
						// detect where one token goes in and another goes out in same tx
						if (transs.Type == 'In' && outputHashes[transs.Hash].Type == 'Out') {
							let newTrans = createOutputTransaction('Trade', transs.Token, transs.Amount, outputHashes[transs.Hash].Token, outputHashes[transs.Hash].Amount, tx.hash, tx.timeStamp, transs.Token.unlisted, '', tx.isError === '0', exchange);
							outputHashes[transs.Hash] = newTrans;
						} else if (transs.Type == 'Out' && outputHashes[transs.Hash].Type == 'In') {
							let newTrans = createOutputTransaction('Trade', outputHashes[transs.Hash].Token, outputHashes[transs.Hash].Amount, transs.Token, transs.Amount, tx.hash, tx.timeStamp, outputHashes[transs.Hash].Token.unlisted, '', tx.isError === '0', exchange);
							outputHashes[transs.Hash] = newTrans;
						}
						// detect AirSwap sending back the same amount
						else if (outputHashes[transs.Hash].Exchange == _delta.config.exchangeContracts.AirSwap.name && transs.Type == 'In' && outputHashes[transs.Hash].Type == 'Taker Buy' && String(transs.Amount) == String(outputHashes[transs.Hash].Total)) {
							outputHashes[transs.Hash].Status = false;
						} else if (transs.Exchange == _delta.config.exchangeContracts.AirSwap.name && transs.Type == 'Taker Buy' && outputHashes[transs.Hash].Type == 'In' && String(transs.Total) == String(outputHashes[transs.Hash].Amount)) {
							transs.Status = false;
							outputHashes[transs.Hash] = transs;
						}
						// bancor sell for ETH token & unwrap ETH token, make sell for ETH
						else if (outputHashes[transs.Hash].Type == 'Unwrap ETH' && transs.Type === 'Sell up to' && transs.Exchange.indexOf('Bancor') !== -1) {
							transs.Base = outputHashes[transs.Hash].Base;
							outputHashes[transs.Hash] = transs;
						} else if (outputHashes[transs.Hash].Type == 'Sell up to' && transs.Type === 'Unwrap ETH' && outputHashes[transs.Hash].Exchange.indexOf('Bancor') !== -1) {
							outputHashes[transs.Hash].Base = transs.Base;
						}
						// (trade?) returning ETH, seen as unwrap ETH by internal transaction result (generiv version of bancor above)
						else if (outputHashes[transs.Hash].Type == 'Unwrap ETH' && transs.Type !== 'Unwrap ETH' && transs.Exchange) {
							outputHashes[transs.Hash] = transs;
						}
						else { // more than 1 in, 1 out, just display tx multiple times
							let newHash = transs.Hash;
							while (outputHashes[newHash]) {
								newHash += ' ';
							}
							outputHashes[newHash] = transs;
						}
					}
				}
			}

			function createOutputTransaction(type, token, val, base, total, hash, timeStamp, unlisted, price, status, exchange) {

				if (status === undefined)
					status = true;
				if (token) {

					return {
						Status: status,
						Type: type,
						Exchange: exchange,
						Token: token,
						Amount: val,
						Price: price,
						Base: base,
						Total: total,
						Hash: hash,
						Date: _util.toDateTime(timeStamp),
						Info: window.location.origin + window.location.pathname + '/../tx.html#' + hash,
					};
				} else if (exchange === 'OasisDex ') {
					return {
						Status: status,
						Type: type,
						Exchange: exchange,
						Token: '',
						Amount: '',
						Price: '',
						Base: '',
						Total: '',
						Hash: hash,
						Date: _util.toDateTime(timeStamp),
						Info: window.location.origin + window.location.pathname + '/../tx.html#' + hash,
					};
				} else {
					return undefined;
				}
			}

			function done() {
				var txs = Object.values(outputHashes);
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


	//transactions table
	function makeTable2(result) {

		hidePopovers();

		let filtered = result.filter((res) => { return checkFilter(res.Type); });

		var loaded = table2Loaded;
		if (changedDecimals)
			loaded = false;

		let headers = getColumnHeaders(filtered, transactionHeaders);
		if (!table2Loaded) {
			makeInitTable('#transactionsTable2', headers, transactionsPlaceholder);
		}
		let tableData = buildTableRows(filtered, headers);
		trigger2(tableData);
	}

	function placeholderTable() {
		makeTable2(transactionsPlaceholder);
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

			try {
				// new tokens found in etherscan token transfer responses
				if (unknownTokenCache && unknownTokenCache.length > 0) {
					localStorage.getItem('unknownTokens1');
					let string = JSON.stringify(unknownTokenCache);
					localStorage.setItem('unknownTokens1', string);
				}
			} catch (e) {
				console.log('failed token cache');
			}
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
	function trigger2(dataSet) {

		if (!table2Loaded) {

			recentTable = $('#transactionsTable2').DataTable({
				"paging": false,
				"ordering": true,
				//"info": true,
				"scrollY": "80vh",
				"scrollX": true,
				"scrollCollapse": true,
				"order": [[9, "desc"]],
				"dom": '<"toolbar">frtip',
				"orderClasses": false,
				fixedColumns: {
					leftColumns: 2
				},
				aoColumnDefs: [
					{ bSearchable: true, aTargets: [1] },
					{ bSearchable: true, aTargets: [2] },
					{ bSearchable: true, aTargets: [3] },
					{ bSearchable: true, aTargets: [6] },
					{ bSearchable: true, aTargets: [8] },
					{ bSearchable: false, aTargets: ['_all'] },
					{ bSortable: false, aTargets: [0, 10] },
					{ asSorting: ["desc", "asc"], aTargets: [4, 5, 7, 9] },
					{ sClass: "dt-body-right", aTargets: [4, 5, 7] },
					{ sClass: "dt-body-center", aTargets: [0, 10] },
				],
				"language": {
					"search": '<i class="dim fa fa-search"></i>',
					"searchPlaceholder": "Type, Exchange, Token, Hash",
					"zeroRecords": "No transactions found",
					"info": "Showing _TOTAL_ transactions",
					"infoEmpty": "No transactions found",
					"infoFiltered": "(filtered from _MAX_ )"
				},
			});
			table2Loaded = true;
		}

		recentTable.clear();
		if (dataSet.length > 0) {
			for (let i = 0; i < dataSet.length; i++) {
				recentTable.rows.add(dataSet[i]);
			}
			recentTable.columns.adjust().fixedColumns().relayout().draw();
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
		} else {
			recentTable.columns.adjust().fixedColumns().relayout().draw();
		}

		trigger_2 = transLoaded >= 3;

		if (trigger_2) {
			disableInput(false);
			hideLoading(true);
			running = false;
			requestID++;
			buttonLoading(true);
		}
		else {
			hideLoading(trigger_2);
		}
	}

	// Builds the HTML Table out of myList.
	function buildTableRows(myList, columns) {

		let resultTable = [];

		for (var i = 0; i < myList.length; i++) {

			var row$ = $('<tr/>');

			for (var colIndex = 0; colIndex < columns.length; colIndex++) {
				var cellValue = myList[i][columns[colIndex].title];
				if (cellValue == null) cellValue = "";
				var head = columns[colIndex].title;

				if (head == 'Amount' || head == 'Price' || head == "Total") {
					if (cellValue !== "" && cellValue !== undefined) {
						var dec = fixedDecimals;
						if (head == 'Price')
							dec += 2;
						var num = '<span data-toggle="tooltip" title="' + _util.exportNotation(cellValue) + '">' + cellValue.toFixed(dec) + '</span>';
						row$.append($('<td/>').html(num));
					}
					else {
						cellValue = "";
						row$.append($('<td/>').html(cellValue));
					}
				}
				else if (head == 'Token' || head == 'Base') {

					let token = cellValue;
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
				else if (head == 'Type') {
					if (cellValue == 'Deposit' || cellValue == 'Approve' || cellValue == 'Wrap ETH' || cellValue == 'In') {
						row$.append($('<td/>').html('<span class="label label-success" >' + cellValue + '</span>'));
					}
					else if (cellValue == 'Withdraw' || cellValue == 'Unwrap ETH' || cellValue == 'Out') {
						row$.append($('<td/>').html('<span class="label label-danger" >' + cellValue + '</span>'));
					}
					else if (cellValue == 'Cancel sell' || cellValue == 'Cancel buy' || cellValue == 'Cancel offer' || cellValue == 'Sell offer' || cellValue == 'Buy offer' || cellValue == 'Cancel Sell' || cellValue == 'Cancel Buy') {
						row$.append($('<td/>').html('<span class="label label-default" >' + cellValue + '</span>'));
					}
					else if (cellValue == 'Taker Buy' || cellValue == 'Buy up to' || cellValue == 'Maker Buy' || cellValue == 'Fill offer' || cellValue == 'Trade') {
						row$.append($('<td/>').html('<span class="label label-info" >' + cellValue + '</span>'));
					}
					else if (cellValue == 'Taker Sell' || cellValue == 'Sell up to' || cellValue == 'Maker Sell') {
						row$.append($('<td/>').html('<span class="label label-info" >' + cellValue + '</span>'));
					}
					else {
						row$.append($('<td/>').html('<span>' + cellValue + '</span>'));
					}
				}
				else if (head == 'Hash') {
					row$.append($('<td/>').html(_util.hashLink(cellValue, true, true)));
				}
				else if (head == 'Status') {
					if (cellValue)
						row$.append($('<td align="center"/>').html('<i title="success" style="color:green;" class="fa fa-check"></i>'));
					else
						row$.append($('<td align="center"/>').html('<i title="failed" style="color:red;" class="fa fa-exclamation-circle"></i>'));
				}
				else if (head == 'Info') {

					row$.append($('<td/>').html('<a href="' + cellValue + '" target="_blank"><i class="fa fa-ellipsis-h"></i></a>'));
				}
				else if (head == 'Date') {
					row$.append($('<td/>').html(_util.formatDate(cellValue, false, true)));
				}
				else {
					row$.append($('<td/>').html(cellValue));
				}
			}
			resultTable.push(row$);
		}
		return resultTable;
	}


	var transactionHeaders = { 'Token': 1, 'Amount': 1, 'Type': 1, 'Hash': 1, 'Date': 1, 'Price': 1, 'Base': 1, 'Total': 1, 'Status': 1, 'Info': 1, 'Exchange': 1 };
	// Adds a header row to the table and returns the set of columns.
	// Need to do union of keys from all records as some records may not contain
	// all records.
	function getColumnHeaders(myList, headers) {
		var columnSet = {};
		var columns = [];

		if (myList.length == 0) {
			myList = transactionsPlaceholder;
		}
		for (var i = 0; i < myList.length; i++) {
			var rowHash = myList[i];
			for (var key in rowHash) {
				if (!columnSet[key] && headers[key]) {
					columnSet[key] = 1;
					columns.push({ title: key });
				}
			}
		}
		return columns;
	}

	function makeInitTable(selector, headers, placeholderData) {

		if (!table2Loaded) {
			var header1 = $(selector + ' thead');
			var headerTr$ = $('<tr/>');

			for (let i = 0; i < headers.length; i++) {
				let head = headers[i].title;
				if (head == 'Status') {
					head = '<i title="Transaction status" class="fa fa-check"></i>';
				}
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

				if (head == 'Token') {
					row$.append($('<td data-sort="" data-search=""/>'));
				} else {
					row$.append($('<td/>'));
				}
			}
			tbody$.append(row$);
			body.append(tbody$[0].innerHTML);
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