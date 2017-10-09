{
	'use strict';
	// Parameters
	// ##########################################################################################################################################
	
	/*
	let etherScanSocket = undefined;
	let pingID = -1;
	*/
	
	// shorthands
	let _util = bundle.utility;
	let _delta = bundle.EtherDelta;
	
	// initiation
	let initiated = false;
	let autoStart = false;
	
	let requestID = 0;
	
	// loading states
    let table1Loaded = false;
	let table2Loaded = false;
	let loadedED = 0;
    let loadedW = 0;
	let loadedBid = 0;
	let loadedCustom = false;
	let trigger_1 = false;
	let trigger_2 = false;
	let running = false;
	
	var etherscanFallback = false;
	
	// settings
	let hideZero = true;
    let decimals = false;
	let fixedDecimals = 3; 
    let remember = false;
	
	let showTransactions = true;
    let showBalances = true;	
	let showCustomTokens = false;
	

    // user input & data
	let publicAddr = '';
    let lastResult = undefined;
	let lastResult2 = undefined;
	let lastResult3 = undefined;
	
	// config
	let tokenCount = 0; //auto loaded
	let blocktime = 17;
	var blocknum = -1;
	let startblock = 0;
	let endblock = 'latest';	
	let transactionDays = 1;
	let walletWarningBalance = 0.003;
	
	let uniqueTokens = {};
	let balances= {};
	

	
	// placeholder
    let balancesPlaceholder = { 
        ETH: {
            Name: 'ETH',
            Wallet: 0,
            EtherDelta: 0,
            Total: 0,
			Unlisted: false,
			Address:'',
			Bid: '',
			'Est. ETH': '',
        },
    };
	
	// placeholder
	let transactionsPlaceholder = [
		{
			Status:true,
			Type: 'Deposit',
			Name: 'ETH',
			Value: 0,
			Price: 0,
			Hash: '',
			Date: toDateTimeNow(),
			Details: window.location.origin + window.location.pathname + 'tx.html',
			Unlisted: false,
		}
	];
		
		
		
	// Functions - initialisation
	// ##########################################################################################################################################
		
	init();
	
    $(document).ready(function() 
	{	
		readyInit();  
    });
	
	function init()
	{	
		// borrow some ED code for compatibility
        _delta.startEtherDelta(() => 
		{	
			if(!autoStart)
			{
				if(blocknum > -1)
				{
					startblock = getStartBlock(blocknum, transactionDays);
				}
				else {
					_util.blockNumber(_delta.web3, (err, num) => 
					{
						if(!err && num)
						{
							blocknum = num;
							startblock = getStartBlock(blocknum, transactionDays);
						}
					});
				}
			}
			//import of etherdelta config
			if(etherDeltaConfig && etherDeltaConfig.tokens)
			{
				_delta.config.tokens = etherDeltaConfig.tokens;
			}
			else 
			{
				showError('failed to load token data');
				return;
			}
			
			// note all listed tokens
			for(let i = 0; i < _delta.config.tokens.length; i++)
			{
				let token = _delta.config.tokens[i];
				if(token) {
					token.name = escapeHtml(token.name); // escape nasty stuff in token symbol/name
					token.addr = token.addr.toLowerCase();
					token.unlisted = false;
					_delta.config.tokens[i] = token;
					if(!uniqueTokens[token.addr]) {
						uniqueTokens[token.addr] = token;
					}
				}	
			}
			
			//format MEW tokens like ED tokens
			offlineCustomTokens = offlineCustomTokens.map((x) => { return {"name": escapeHtml(x.symbol),
																		   "addr": x.address.toLowerCase(),
																		   "unlisted": true,
																		   "decimals":x.decimal,
																		  };
																 });
			//filter out custom tokens that have been listed by now
			_delta.config.customTokens = offlineCustomTokens.filter((x) => {return !(uniqueTokens[x.addr]) && true;});
			// note custom tokens
			for(let i = 0; i < _delta.config.customTokens.length; i++)
			{
				let token = _delta.config.customTokens[i];
				if(token && !uniqueTokens[token.addr]) {
					uniqueTokens[token.addr] = token;
				}
			}
			
			// treat tokens listed as staging as unlisted custom tokens
			if(stagingTokens && stagingTokens.tokens)
			{
				//filter tokens that we already know
				let stageTokens = stagingTokens.tokens.filter((x) => {return !(uniqueTokens[x.addr]) && true;});
				for(let i = 0; i < stageTokens.length; i++)
				{
					let token = stageTokens[i];
					if(token && !uniqueTokens[token.addr])
					{
						token.name = escapeHtml(token.name); // escape nasty stuff in token symbol/name
						token.unlisted = true;
						uniqueTokens[token.addr] = token;
						_delta.config.customTokens.push(token);
					}
				}
			}
			
			
			initiated = true;
			if(autoStart)
				myClick();
		});
	}
	
	function readyInit()
	{
		/*if (!Notification) {
			alert('Desktop notifications not available in your browser. Try Chromium.'); 
			return;
		}

		if (Notification.permission !== "granted")
			Notification.requestPermission(); */
		
		setAddrImage('0x0000000000000000000000000000000000000000');
		createSelect();
		//hideError();
		//hideHint();
		//$('#loadingBalances').hide();
		//$('#loadingTransactions').hide();
		
		$('#zero').prop('checked', hideZero);
        $('#decimals').prop('checked', decimals);
		$('#custom').prop('checked', showCustomTokens);
		
		// detect enter & keypresses in input
        $('#address').keypress(function(e) 
		{
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
			$("#transactionsTable2").trigger("applyWidgets"); 
			$("#resultTable").trigger("applyWidgets"); 
		});
		
				// tab change
		$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
			// fix scroller on tab change
			$("#transactionsTable").trigger("applyWidgets"); 
			$("#transactionsTable2").trigger("applyWidgets"); 
			$("#resultTable").trigger("applyWidgets"); 
			
		});
		
		// contract change
		$('#contractSelect').change(e => {
			_delta.changeContract(e.target.selectedIndex);
		});
		
		getStorage();

        placeholderTable();
		
		// url parameter ?addr=0x... /#0x..
		let addr = getParameterByName('addr');
		if(! addr)
		{
			let hash = window.location.hash;  // url parameter /#0x...
			if(hash)
				addr = hash.slice(1);
		}
		if(addr)
		{
			addr = getAddress(addr);
			if(addr)
			{
				publicAddr = addr;
				autoStart = true;
				// auto start loading
				myClick();
			}
		} 
		else if(publicAddr) //autoload when remember is active
		{
			autoStart = true;
			// auto start loading
			myClick();
		}
	}
		

	// Functions - input
	// ##########################################################################################################################################
	
	// zero balances checkbox
	let changeZero = false;
    function checkZero() 
	{
		changeZero = true;
        hideZero = $('#zero').prop('checked');
        if (lastResult) {
            $('#resultTable tbody').empty();
            makeTable(lastResult, hideZero);
        } 
		changeZero = false;
    }

	// remember me checkbox
    function checkRemember()
	{
        remember = $('#remember').prop('checked');
        setStorage();
    }

	// more decimals checbox
	let changedDecimals = false;
    function checkDecimal() 
	{
		changedDecimals = true;
        decimals = $('#decimals').prop('checked');
		
		fixedDecimals = decimals ? 8 : 3;
		
		$('#resultTable tbody').empty();
        $('#resultTable thead').empty();
		
		$('#transactionsTable tbody').empty();
        $('#transactionsTable thead').empty();
		
		$('#transactionsTable2 tbody').empty();
        $('#transactionsTable2 thead').empty();
        
        if (lastResult) {
			//table1Loaded = false;
		//	table2Loaded = false;
           makeTable(lastResult, hideZero);
		   makeTable2(lastResult2);
        } else {
			placeholderTable();
		}
		changedDecimals = false;
    }

	function checkCustom()
	{
		showCustomTokens = $('#custom').prop('checked');
		if(showCustomTokens) 
		{
			if(lastResult && lastResult2 && loadedCustom)
			{

				makeTable(lastResult, hideZero);
				makeTable2(lastResult2);

			}
			else if(publicAddr) {
				myClick();
			}
				
		}
		else
		{
			if(lastResult)
				makeTable(lastResult, hideZero);
			if(lastResult2)
				makeTable2(lastResult2);
		}
	}
	
	
	function disableInput(disable)
	{
		$('#refreshButton').prop('disabled', disable);
       // $("#address").prop("disabled", disable);
		$("#loadingBalances").prop("disabled", disable);
		$('#loadingBalances').addClass('dim');
		$('#loadingTransactions').addClass('dim');
		$("#loadingTransactions").prop("disabled", disable);
		$('#loadingTransactions2').addClass('dim');
		$("#loadingTransactions2").prop("disabled", disable);
	}
	
	function showLoading(balance, trans)
	{
		if(balance)
		{
			$('#loadingBalances').addClass('fa-spin');
			$('#loadingBalances').addClass('dim');
			$('#loadingBalances').prop('disabled', true);
			$('#loadingBalances').show();
		}
		if(trans)
		{
			$('#loadingTransactions').addClass('fa-spin');
			$('#loadingTransactions').addClass('dim');
			$('#loadingTransactions').prop('disabled', true);
			$('#loadingTransactions').show();
			$('#loadingTransactions2').addClass('fa-spin');
			$('#loadingTransactions2').addClass('dim');
			$('#loadingTransactions2').prop('disabled', true);
			$('#loadingTransactions2').show();
		}
	}
	
	function buttonLoading(balance, trans)
	{
		if(!publicAddr)
		{			
			hideLoading(balance,trans);
			return;
		}
		if(balance)
		{
			$('#loadingBalances').removeClass('fa-spin');
			$('#loadingBalances').removeClass('dim');
			$('#loadingBalances').prop('disabled', false);
			$('#loadingBalances').show();
		}
		if(trans)
		{
			$('#loadingTransactions').removeClass('fa-spin');
			$('#loadingTransactions').removeClass('dim');
			$('#loadingTransactions').prop('disabled', false);
			$('#loadingTransactions').show();
			$('#loadingTransactions2').removeClass('fa-spin');
			$('#loadingTransactions2').removeClass('dim');
			$('#loadingTransactions2').prop('disabled', false);
			$('#loadingTransactions2').show();
		}
	}

	function hideLoading(balance, trans)
	{
		if(balance)
			$('#loadingBalances').hide();
		if(trans) {
			$('#loadingTransactions').hide();
			$('#loadingTransactions2').hide();
		}
	}
	
	function myClick()
	{
		if(running)
			requestID++;
		if(!initiated)
		{
			autoStart = true;
			return;
		}
		
		hideError();
		hideHint();
		disableInput(true);
		$('#downloadBalances').html('');
		// validate address
		if(!autoStart)
			publicAddr = getAddress();
		
		autoStart = false;
		if(publicAddr)
		{
			$('#direct').html('<a target="_blank" href="https://deltaBalances.github.io/#' + publicAddr + '"> Direct Link </a> to this page');
			/*if(etherScanSocket !== undefined)
			{
				console.log('socket closed');
				socketPing(false);
				etherScanSocket.close();
				etherScanSocket = undefined;
			}*/
			getAll(false, requestID);

		}
		else
		{
			//placeholder();
			console.log('invalid input');
            disableInput(false);
			hideLoading(true,true);
		}
	}
	
	function getAll(autoload, rqid)
	{
		//if(running)
		//	return;
		
		running = true;
		
		trigger_1 = true;
		trigger_2 = true;
		
        lastResult = undefined;
		lastResult2 = undefined;
		lastResult3 = undefined;
		
        if (publicAddr) 
		{	
			setStorage();
			$('#direct').html('<a target="_blank" href="https://deltaBalances.github.io/#' + publicAddr + '"> Direct Link </a> to this page');
			getTrans(rqid);
			getBalances(rqid);
			/*etherScanSocket = new WebSocket("wss://socket.etherscan.io/wshandler");
			console.log('creating socket');
			let openmsg = {"event": "txlist", "address": publicAddr};
			etherScanSocket.onmessage = function(evt) { socketResponse(evt); };
			etherScanSocket.onopen = function (event) {
				console.log('socket opened');
				etherScanSocket.send(JSON.stringify(openmsg));
				socketPing(true);
			};*/
        } else {
			running = false;
        }
	}
	
	function getBalances(rqid)
	{
		if(!rqid)
			rqid = requestID;
		if(!trigger_1)
			return;
		
		
		if(showBalances)
		{
			balances = {};

			
			trigger_1 = false;
			disableInput(true);
			loadedW = 0; // wallet async load progress
			loadedED = 0; // etherdelta async load progress
			loadedBid = 0;
			loadedCustom = false;
			$('#resultTable tbody').empty();
			showLoading(true,false);
			 
			tokenCount = _delta.config.tokens.length;
			let count1 = tokenCount;
			if(showCustomTokens && _delta.config.customTokens)
				tokenCount += _delta.config.customTokens.length;
			
			// init listed tokens at 0
			for (let i = 0; i < tokenCount; i++) 
			{
				let token = undefined;
				let custom = false;
				if(i < count1)
				{
					token = _delta.config.tokens[i];
				}
				else
				{
					token = _delta.config.customTokens[i - count1];
					custom = true;
				}
             
                balances[token.name] = {
                    Name: token.name,
                    Wallet: 0,
                    EtherDelta: 0,
					Total: 0,
					Bid: '',
					'Est. ETH': '',
					Unlisted: custom,
					Address: token.addr,
                };
            }
				getPrices(rqid);
				getAllBalances(rqid);
				//getDeltaBalances();
				//getWalletBalances();
		}
	}	
	
	function getTrans(rqid)
	{
		if(!trigger_2)
			return;
		
		if(showTransactions)
		{
			trigger_2 = false;
			disableInput(true);
			
			showLoading(false, true);
				
			$('#transactionsTable tbody').empty();
			$('#transactionsTable2 tbody').empty();
			if(blocknum > 0) // blocknum also retrieved on page load, reuse it
			{
				console.log('blocknum re-used');
				startblock = getStartBlock(blocknum, transactionDays);
				getTransactions(rqid);
			}
			else 
			{
				console.log("try blocknum v2");
				_util.blockNumber(_delta.web3, (err, num) => 
				{
					if(num)
					{
						blocknum = num;
						startblock = getStartBlock(blocknum, transactionDays);
					}
					getTransactions(rqid);
				});
			}
		}
	}

	
	// Functions - validation
	// ##########################################################################################################################################
	// check if input address is valid
    function getAddress(addr) 
	{
        let address = '';
        address = addr ? addr : document.getElementById('address').value;
        address = address.trim();
		
		if ( ! _delta.web3.isAddress(address))
		{
			//check if url ending in address
			if(address.indexOf('/0x') !== -1)
			{
				let parts = address.split('/');
				let lastSegment = parts.pop() || parts.pop();  // handle potential trailing slash
				if(lastSegment)
					address = lastSegment;
			}
			
			if(! _delta.web3.isAddress(address)) 
			{
				if (address.length == 66 && address.slice(0, 2) === '0x') 
				{
					// transaction hash, go to transaction details
					window.location = window.location.origin + window.location.pathname + 'tx.html#' + address;
					return;
				} 

				// possible private key, show warning   (private key, or tx without 0x)
				if (address.length == 64 && address.slice(0, 2) !== '0x') 
				{
					if (!addr) // ignore if in url arguments
					{
						showError("You likely entered your private key, NEVER do that again");
						// be nice and try generate the address
						address = _util.generateAddress(address);
					}
				} 
				else if (address.length == 40 && address.slice(0, 2) !== '0x') 
				{
					address = `0x${addr}`;
					
				} 
				else 
				{
					if (!addr) // ignore if in url arguments
					{
					   showError("Invalid address, try again");
					}
					return undefined;
				}
				if(! _delta.web3.isAddress(address))
				{
					if (!addr) // ignore if in url arguments
					{
					   showError("Invalid address, try again");
					}
					return undefined;
				}
			}
		}
		
		document.getElementById('address').value = address;
		document.getElementById('addr').innerHTML = 'Address: <a target="_blank" href="' + _delta.addressLink(address) + '">' + address + '</a>';
		setAddrImage(address);
		return address;
    }
	
	function setAddrImage(addr)
	{
		let icon = document.getElementById('addrIcon');
		icon.style.backgroundImage = 'url(' + blockies.create({ seed:addr.toLowerCase() ,size: 8,scale: 16}).toDataURL()+')';
	}
	
	
	function getStartBlock(blcknm, days)
	{
		startblock = Math.floor(blcknm - ((days * 24 * 60 * 60) / blocktime));
		return startblock;
	}
	
	function validateDays(input)
	{ 
		input = parseInt(input);
		let days = 1;
		if(input < 1)
			days = 1;
		else if(input > 999)
			days = 999;
		else
			days = input;
		
		transactionDays = days;
		if(blocknum > 0)
		{
			getStartBlock(blocknum, transactionDays);
		}
	}
	
	// get parameter from url
	function getParameterByName(name, url) 
	{
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}
	
	// Functions - requests
	// ##########################################################################################################################################
	
	function getPrices(rqid)
	{
		$.getJSON(_delta.config.apiServer +'/nonce/'+ Date.now() + '/returnTicker/', (result) => {
			if(requestID <= rqid)
			{
				if(result)
				{
					let results = Object.values(result);
					for(let i = 0; i < results.length; i++)
					{
						let token = uniqueTokens[results[i].tokenAddr];
						
						if(token && balances[token.name])
						{
							balances[token.name].Bid = Number(results[i].bid);
						}
					}
				}
			}
			
			loadedBid++;
			finished();
		});
		
	}
	
	let maxPerRequest = 120;

	function getAllBalances(rqid)
	{
		let tokens2 = Object.keys(uniqueTokens);	
		tokens2 = tokens2.filter((x) => {return !uniqueTokens[x].unlisted || showCustomTokens});
		tokenCount = tokens2.length;
		
		let max = maxPerRequest
		if(!etherscanFallback) //etherscan request can't hold too much data
				max = max * 10;
		
		for(let i = 0; i < tokens2.length; i+= max)
		{
			allBalances(i, i+max, tokens2);
		}
		
		function allBalances(startIndex, endIndex, tokens2)
		{
			let tokens = tokens2.slice(startIndex, endIndex);
			//walletBalances(address user,  address[] tokens) constant returns (uint[]) {
			 _util.call(
			  _delta.web3,
			  _delta.contractDeltaBalance,
			  _delta.config.contractDeltaBalanceAddr,
			  'allBalances',
			  [_delta.config.contractEtherDeltaAddr, publicAddr, tokens],
			  (err, result) =>
			  {
				 if(requestID > rqid)
					return;
				const returnedBalances = result;
				if(returnedBalances && returnedBalances.length > 0)
				{	
					loadedCustom = showCustomTokens;
					for(let i = 0; i< tokens.length; i++)
					{
						let j = i * 2;
						let token = uniqueTokens[tokens[i]];
						let div = divisorFromDecimals(token.decimals);
						balances[token.name].EtherDelta = _util.weiToEth(returnedBalances[j], div );
						balances[token.name].Wallet = _util.weiToEth(returnedBalances[j +1], div);
						loadedW++;
						loadedED++;
						finished();
					}
				}
				else 
				{
					showError('Failed to load balances, try again');
					loadedW = tokenCount;
					loadedED = tokenCount;
					finished();
				}
			  });
		}
	}

	
	
	
	function getTransactions(rqid)
	{
		let transLoaded = 0;
		let transResult = [];
		let inTransResult = [];
		let tradeLogResult = [];
		let contractAddr =_delta.config.contractEtherDeltaAddr.toLowerCase();
		

		$.getJSON('https://api.etherscan.io/api?module=account&action=txlist&address=' + publicAddr + '&startblock=' + startblock + '&endblock=' + endblock + '&sort=desc&apikey=' + _delta.config.etherscanAPIKey, (result) => {
			if(requestID > rqid)
					return;
			if(result && result.status === '1')
				transResult = result.result;
			transLoaded++;
			if(transLoaded == 2)
				processTransactions();
		});
		
		// internal ether transactions (withdraw)
		$.getJSON('https://api.etherscan.io/api?module=account&action=txlistinternal&address=' + publicAddr + '&startblock=' + startblock + '&endblock=' + endblock + '&sort=desc&apikey=' + _delta.config.etherscanAPIKey, (result2) => {
			if(requestID > rqid)
					return;
			if(result2 && result2.status === '1')
				inTransResult = result2.result;
			transLoaded++;
			if(transLoaded == 2)
				processTransactions();
		});
		
		/*
		//trade logs
		// topic[0] 0x6effdda786735d5033bfad5f53e5131abcced9e52be6c507b62d639685fbed6d   
		$.getJSON('https://api.etherscan.io/api?module=logs&action=getLogs&address=' + contractAddr + '&fromBlock=' + startblock + '&toBlock=' + endblock + '&topic0=0x6effdda786735d5033bfad5f53e5131abcced9e52be6c507b62d639685fbed6d&apikey=' + _delta.config.etherscanAPIKey, (result3) => {
			if(result3 && result3.status === '1')
				tradeLogResult = result3.result;
			transLoaded++;
			if(transLoaded == 3)
				processTransactions();
		}); */
		
		
		function processTransactions()
		{
			let myAddr = publicAddr.toLowerCase();
			
		
			let txs = transResult;
			let outputTransactions = [];
			
			let itxs = inTransResult; //withdraws
			let withdrawHashes = {};
			let logs = tradeLogResult;

			
			// internal tx, withdraws
			for(var i = 0; i < itxs.length; i++)
			{
				let tx = itxs[i];
				if(tx.from.toLowerCase() === contractAddr)
				{	
					let val = _util.weiToEth(Number(tx.value));
					let trans = createOutputTransaction('Withdraw', 'ETH', val, tx.hash, tx.timeStamp, false, 0, '', tx.isError === '0');
					outputTransactions.push(trans);
					withdrawHashes[tx.hash.toLowerCase()] = true;
				}
			}                 
			let tokens = [];
			
			// normal tx, deposit, token, trade
			for(var i =0; i < txs.length; i++)
			{
				let tx = txs[i];
				//if(tx.isError === '0')
				{
					let val = Number(tx.value);
					let txto = tx.to.toLowerCase();
					if(val > 0 && txto === contractAddr) // eth deposit
					{
						let val2 = _util.weiToEth(val);
						let trans = createOutputTransaction('Deposit', 'ETH', val2, tx.hash, tx.timeStamp, false, 0, '', tx.isError === '0');
						outputTransactions.push(trans);
					}
					else if(val == 0 && txto == contractAddr) 
					{
						if(! withdrawHashes[tx.hash]) // exclude withdraws
						{
							tokens.push(tx); //withdraw, deposit & trade, & cancel
						}
					}
				}
			}
			
			
			for(var l = 0; l < tokens.length; l++)
			{
				let method = tokens[l].input.slice(0, 10);
				if(method === '0x9e281a98' || method === '0x338b5dea') //methodids depositToken & wihdrawToken
				{
				
					let unpacked = _util.processInputMethod (_delta.web3, _delta.contractEtherDelta, tokens[l].input);
					if(unpacked && (unpacked.name === 'depositToken' || unpacked.name === 'withdrawToken'))
					{
						let token = uniqueTokens[unpacked.params[0].value];
						if(token && token.addr)
						{
							let unlisted = token.unlisted;
							let dvsr = divisorFromDecimals(token.decimals)
							let val = _util.weiToEth(unpacked.params[1].value, dvsr);
							let type = '';
							if(unpacked.name === 'withdrawToken')
							{
								type = 'Withdraw';
							}
							else
							{
								type = 'Deposit';
							}
							let trans = createOutputTransaction(type, token.name, val, tokens[l].hash, tokens[l].timeStamp, unlisted,token.addr, '', tokens[l].isError === '0');		
							outputTransactions.push(trans);
						}	
					}
				}  else if(method === '0x278b8c0e') // cancel
				{
					//Function: cancelOrder(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, uint8 v, bytes32 r, bytes32 s)
					//MethodID: 0x278b8c0e
			
					let unpacked = _util.processInputMethod(_delta.web3, _delta.contractEtherDelta, tokens[l].input);
					if(unpacked && (unpacked.name === 'cancelOrder'))
					{
						let cancelType = 'sell';
						let token = undefined;
						let token2 = undefined;
						if(unpacked.params[0].value === _delta.config.tokens[0].addr) // get eth  -> sell
						{
							cancelType = 'buy';
							token = uniqueTokens[unpacked.params[2].value];
							token2 = uniqueTokens[unpacked.params[0].value];
						}
						else // buy
						{
							token = uniqueTokens[unpacked.params[0].value];
							token2 = uniqueTokens[unpacked.params[2].value];
						}
						
						if(token && token2 && token.addr && token2.addr)
						{
							let amount = 0;
							let oppositeAmount = 0;
							if(cancelType === 'sell')
							{
								amount = unpacked.params[1].value;
								oppositeAmount = unpacked.params[3].value;
							} else
							{
								oppositeAmount = unpacked.params[1].value;
								amount = unpacked.params[3].value;
							}
							
							let unlisted = token.unlisted;
							let dvsr = divisorFromDecimals(token.decimals)
							let dvsr2 = divisorFromDecimals(token2.decimals)
							let val = _util.weiToEth(amount, dvsr);
							let val2 = _util.weiToEth(oppositeAmount, dvsr2);
							let price = 0;
							//if(cancelType === 'sell')
							{
								price = val2 / val;
							}
	
							let trans = createOutputTransaction('Cancel ' + cancelType , token.name, val, tokens[l].hash, tokens[l].timeStamp, unlisted,token.addr, price, tokens[l].isError === '0');		
							outputTransactions.push(trans);
						}	
					}
					
			
				} else if(method === '0x0a19b14a') // trade
				{

					//Function: trade(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, address user, uint8 v, bytes32 r, bytes32 s, uint256 amount)
					//MethodID: 0x0a19b14a
					
					let unpacked = _util.processInputMethod(_delta.web3, _delta.contractEtherDelta, tokens[l].input);
					if(unpacked && (unpacked.name === 'trade'))
					{
						let tradeType = 'Sell';
						let token = undefined;
						let token2 = undefined;
						if(unpacked.params[0].value === _delta.config.tokens[0].addr) // get eth  -> sell
						{
							tradeType = 'Buy';
							token = uniqueTokens[unpacked.params[2].value];
							token2 = uniqueTokens[unpacked.params[0].value];
						}
						else // buy
						{
							token = uniqueTokens[unpacked.params[0].value];
							token2 = uniqueTokens[unpacked.params[2].value];
						}
						
						if(token && token2 && token.addr && token2.addr)
						{
							let amount = 0;
							let oppositeAmount = 0;
							if(tradeType === 'Sell')
							{
								amount = unpacked.params[1].value;
								oppositeAmount = unpacked.params[3].value;
							} else
							{
								oppositeAmount = unpacked.params[1].value;
								amount = unpacked.params[3].value;
							}
							
							let unlisted = token.unlisted;
							let dvsr = divisorFromDecimals(token.decimals)
							let dvsr2 = divisorFromDecimals(token2.decimals)
							let val = _util.weiToEth(amount, dvsr);
							let val2 = _util.weiToEth(oppositeAmount, dvsr2);
							
							let price = 0;
						//	if(tradeType === 'sell')
							{
								price = val2 / val;
							}
							
	
							let trans = createOutputTransaction(tradeType , token.name, val, tokens[l].hash, tokens[l].timeStamp, unlisted,token.addr, price,  tokens[l].isError === '0');		
							outputTransactions.push(trans);
						}	
					}
					
				}
			} 

			done();
						
			function createOutputTransaction(type, name, val, hash, timeStamp, unlisted, tokenaddr, price, status)
			{
				if(status === undefined)
					status = true;
				return {
					Status: status,
					Type: type,
					Name: name,
					Value: val,
					Price: price,
					Hash: hash,
					Date: toDateTime(timeStamp),
					Details: window.location.origin + window.location.pathname + 'tx.html#' + hash,
					Unlisted: unlisted,
					TokenAddr: tokenaddr,
				};
			}
			
			function done()
			{
				let txs = Object.values(outputTransactions);
				lastResult2 = txs;
				makeTable2(txs);
			}
		}
	}
	
	// Functions - output
	// ##########################################################################################################################################
	
	function showHint(text)
	{
		$('#hinttext').html(text);
		$('#hint').show();
	}
	
	function hideHint()
	{
		$('#hint').hide();
	}
	
	function showError(text)
	{
		$('#errortext').html(text);
		$('#error').show();
	}
	
	function hideError()
	{
		$('#error').hide();
	}
	
	// callback when balance request completes
    function finished()
	{	
		//check if all requests are complete
        if (loadedED < tokenCount || loadedW < tokenCount /*|| loadedBid < 1*/) {
            return;
        }
		
		let sumETH = 0;
		let sumToken = 0;
		
		// get totals
        for (var i = 0; i < tokenCount; i++) 
		{

			let token = undefined;
			if(i < _delta.config.tokens.length)
			{
				token = _delta.config.tokens[i];
			}
			else
			{
				token = _delta.config.customTokens[i - _delta.config.tokens.length];
			}
            let bal = balances[token.name];
			if(bal)
			{
				bal.Total = Number(bal.Wallet) + Number(bal.EtherDelta);
				bal['Est. ETH'] = '';
				if(bal.Bid && bal.Total)
				{
					if(token.name !== 'ETH')
					{
						let val = Number(bal.Bid) * Number(bal.Total);
						bal['Est. ETH'] = val;
						sumToken += val;
					}
				} else {
					bal.bid = '';
					bal['Est. ETH'] = '';
				}
				if(token.name === 'ETH')
				{
					balances.ETH.Bid = '';
					balances.ETH['Est. ETH'] = bal.Total;
					sumETH = balances.ETH.Total;
				}
				balances[token.name] = bal;
				
			}
        }
		$('#ethbalance').html(sumETH.toFixed(fixedDecimals) + ' ETH');
		$('#tokenbalance').html(sumToken.toFixed(fixedDecimals) + ' ETH');
		$('#totalbalance').html((sumETH + sumToken).toFixed(fixedDecimals) + ' ETH');
		
		
        let result = Object.values(balances);
        lastResult = result;
		downloadBalances();
		if(showCustomTokens)
			lastResult3 = result;

		makeTable(result, hideZero);
    }

	//balances table
	function makeTable(result, hideZeros)
	{
		
		$('#resultTable tbody').empty();
		let filtered = result;
		let loaded = table1Loaded;
		if(changedDecimals)
			loaded = false;

        if (hideZeros) 
		{
            filtered = result.filter(x => {
				return (Number(x.Total).toFixed(fixedDecimals) !== Number(0).toFixed(fixedDecimals) || x.Name === 'ETH');
            });
		}
		/*
		if(!showCustomTokens)
		{
			filtered = result.filter(x => {
				return !(x.Unlisted);
            });
		} */
        
		buildHtmlTable('#resultTable', filtered, loaded, 'balances', balanceHeaders);
        trigger();
	}

	//transactions table
	function makeTable2(result)
	{
		let result2 = result.filter((x) => { return  x.Status && (x.Type === 'Deposit' || x.Type === 'Withdraw')});
		$('#transactionsTable tbody').empty();
		$('#transactionsTable2 tbody').empty();
		let loaded = table2Loaded;
		if(changedDecimals)
			loaded = false;
        buildHtmlTable('#transactionsTable', result2, loaded, 'transactions', depositHeaders);
		buildHtmlTable('#transactionsTable2', result, loaded, 'transactions', transactionHeaders);
        trigger2();
	}
	
	function placeholderTable()
	{
		balances = balancesPlaceholder;
        let result = Object.values(balancesPlaceholder);
		makeTable(result, false);
		let result2 = transactionsPlaceholder;
		makeTable2(result2);
	}


	// save address for next time
    function setStorage() 
	{
        if (typeof(Storage) !== "undefined")
		{
            if (remember)
			{
                localStorage.setItem("member", 'true');
                if (publicAddr)
                    localStorage.setItem("address", publicAddr);
            } else
			{
                localStorage.removeItem('member');
                localStorage.removeItem('address');
            }
        } 
    }

    function getStorage() 
	{
        if (typeof(Storage) !== "undefined") 
		{
            remember = localStorage.getItem('member') && true;
            if (remember) 
			{
                let addr = localStorage.getItem("address");
				if(addr)
				{
					addr = getAddress(addr);
					if (addr) 
					{
						publicAddr = addr;
						document.getElementById('address').value = addr;
					}
				}
				$('#remember').prop('checked', true);
            }
        } 
    }



    // final callback to sort table
    function trigger() 
	{
        if (table1Loaded) // reload existing table
        {
            $("#resultTable").trigger("update", [true, () => {}]);
			$("#resultTable thead th").data("sorter", true);
			//$("table").trigger("sorton", [[0,0]]);
            
        } else 
		{
            $("#resultTable thead th").data("sorter", true);
            $("#resultTable").tablesorter({
				widgets: [ 'scroller' ],
				widgetOptions : {
				  scroller_height : 500,
				},
                sortList: [[0, 0]]
            });

            table1Loaded = true;
        }
		trigger_1 = true;
		
		
        if(trigger_1 && (trigger_2 || !showTransactions) && loadedBid >= 1)
		{
			disableInput(false);
			hideLoading(true,true);
			running = false;
			requestID++;
			buttonLoading(true, true);
		}
		else
		{
			hideLoading(false,true);
		}
        table1Loaded = true;
    }

    // final callback to sort table
    function trigger2() 
	{
        if (table2Loaded) // reload existing table
        {
            $("#transactionsTable").trigger("update", [true, () => {}]);
			$("#transactionsTable thead th").data("sorter", true);
			
			 $("#transactionsTable2").trigger("update", [true, () => {}]);
			$("#transactionsTable2 thead th").data("sorter", true);
			//$("table").trigger("sorton", [[0,0]]);
            
        } else 
		{
            $("#transactionsTable thead th").data("sorter", true);
            $("#transactionsTable").tablesorter({
				widgets: [ 'scroller' ],
				widgetOptions : {
				  scroller_height : 500,
					scroller_barWidth : 18,
					scroller_upAfterSort: true,
				},
                sortList: [[4, 1]]
            });
			
			$("#transactionsTable2 thead th").data("sorter", true);
            $("#transactionsTable2").tablesorter({
				widgets: [ 'scroller' ],
				widgetOptions : {
				  scroller_height : 500,
					scroller_barWidth : 18,
					scroller_upAfterSort: true,
				},
                sortList: [[6, 1]]
            });

            table2Loaded = true;
        }
		trigger_2 = true;
	
		if(trigger_1 && (trigger_2 || !showBalances))
		{
			disableInput(false);
			hideLoading(true,true);
			running = false;
			requestID++;
			buttonLoading(true, true);
		}
		else
		{
			hideLoading(false,true);
		}
        table2Loaded = true;
    }


 // Builds the HTML Table out of myList.
	function buildHtmlTable(selector, myList, loaded, type, headers) 
	{
        let body = $(selector +' tbody');
        let columns = addAllColumnHeaders(myList, selector, loaded, type, headers);
        
        for (var i = 0; i < myList.length; i++) 
		{
			if(!showCustomTokens && myList[i].Unlisted)
					continue;
            let row$ = $('<tr/>');

            if(type === 'transactions')
            {
                for (var colIndex = 0; colIndex < columns.length; colIndex++) 
				{
                    let cellValue = myList[i][columns[colIndex]];
                    if (cellValue == null) cellValue = "";
					let head = columns[colIndex];
					
					if(head == 'Value' || head == 'Price')
					{
						if(cellValue !== "" && cellValue !== undefined)
						{
							let dec = fixedDecimals;
							if(head == 'Price')
								dec += 2;
							let num = Number(cellValue).toFixed(dec);
							row$.append($('<td/>').html(num));
						}
						else
						{
							row$.append($('<td/>').html(cellValue));
						}
					}
					else if(head == 'Name')
					{
						// name  in <!-- --> for sorting
						if( !myList[i].Unlisted)
							row$.append($('<td/>').html('<!--' + cellValue + ' --><a  target="_blank" class="label label-primary" href="https://etherdelta.com/#' + cellValue + '-ETH">' + cellValue + '</a>'));
						else
							row$.append($('<td/>').html('<!--' + cellValue + ' --><a target="_blank" class="label label-warning" href="https://etherdelta.com/#' + myList[i].TokenAddr + '-ETH">' + cellValue + '</a>'));
					}
					else if(head == 'Type')
					{
						if(cellValue == 'Deposit')
						{
							row$.append($('<td/>').html('<span class="label label-success" >' + cellValue + '</span>'));
						}
						else if(cellValue == 'Withdraw')
						{
							row$.append($('<td/>').html('<span class="label label-danger" >' + cellValue + '</span>'));
						}
						else if(cellValue == 'Cancel sell' || cellValue == 'Cancel buy')
						{
							row$.append($('<td/>').html('<span class="label label-default" >' + cellValue + '</span>'));
						}
						else if(cellValue == 'Buy')
						{
							row$.append($('<td/>').html('<span class="label label-info" >Trade</span><span class="label label-success" >' + cellValue + '</span>'));
						}
						else
						{
							row$.append($('<td/>').html('<span class="label label-info" >Trade</span><span class="label label-danger" >' + cellValue + '</span>'));
						}
					} 
					else if( head == 'Hash')
					{
						row$.append($('<td/>').html('<a target="_blank" href="https://etherscan.io/tx/' + cellValue + '">'+ cellValue.substring(0,8)  + '...</a>'));
					}
					else if(head == 'Status')
					{
						if(cellValue)
						    row$.append($('<td align="center"/>').html('<i style="color:green;" class="fa fa-check"></i>'));
						else
							row$.append($('<td align="center"/>').html('<i style="color:red;" class="fa fa-exclamation-circle"></i>'));
					}
					else if(head == 'Details')
					{
						
						row$.append($('<td/>').html('<a href="'+cellValue+'" target="_blank"> See details</a>'));
					}
					else
					{
						row$.append($('<td/>').html(cellValue));
					}
                }
            }
			else if(type === 'balances')
            {
				//if(!balances[myList[i].Name])
					//continue;
                for (var colIndex = 0; colIndex < columns.length; colIndex++) 
				{
                    let cellValue = myList[i][columns[colIndex]];
                    if (cellValue == null) cellValue = "";
					let head = columns[colIndex];
					
					if(head == 'Total' || head == 'EtherDelta' || head == 'Wallet' || head == 'Bid' || head == 'Est. ETH')
					{
						if(cellValue !== "" && cellValue !== undefined)
						{
							let dec = fixedDecimals;
							if(head == 'Bid' )
							{
								dec +=2;
							}
							let num = Number(cellValue).toFixed(dec);
							row$.append($('<td/>').html(num));
						} else
						{
							row$.append($('<td/>').html(cellValue));
						}
						
					}
					else if(head == 'Name')
					{
						// name  in <!-- --> for sorting
						if(! balances[cellValue].Unlisted)
							row$.append($('<td/>').html('<!--' + cellValue + ' --><a target="_blank" class="label label-primary" href="https://etherdelta.com/#' + cellValue + '-ETH">' + cellValue + '</a>'));
						else
							row$.append($('<td/>').html('<!--' + cellValue + ' --><a target="_blank" class="label label-warning" href="https://etherdelta.com/#' + myList[i].Address + '-ETH">' + cellValue + '</a>'));
					} else
					{
						row$.append($('<td/>').html(cellValue));
					}
                }
            }
			body.append(row$);
        }
    }

	let balanceHeaders = {'Name': 1, 'Wallet':1, 'EtherDelta':1, 'Total':1, 'Value':1,'Bid':1, 'Est. ETH':1};
	let depositHeaders = {'Name': 1,'Value':1,'Type':1, 'Hash':1, 'Date':1};
	let transactionHeaders = {'Name': 1,'Value':1,'Type':1, 'Hash':1, 'Date':1, 'Price':1, 'Status':1, 'Details':1};
    // Adds a header row to the table and returns the set of columns.
    // Need to do union of keys from all records as some records may not contain
    // all records.
    function addAllColumnHeaders(myList, selector, loaded, type, headers) 
	{
        let columnSet = {};
		
		if(!loaded)
			$(selector + ' thead').empty();
		
        let header1 = $(selector + ' thead');
        let headerTr$ = $('<tr/>');

		if(!loaded)
		{
			header1.empty();
		}
		
        for (var i = 0; i < myList.length; i++) 
		{
            let rowHash = myList[i];
            for (var key in rowHash) 
			{
				if( !columnSet[key] && headers[key] ) 
				{
					columnSet[key] = 1;
					headerTr$.append($('<th/>').html(key));
				}
            }
        }
		if(!loaded)
		{
			header1.append(headerTr$);
			$(selector).append(header1);
		}
		columnSet = Object.keys(columnSet);
        return columnSet;
    }
	
	
	// contract selector
	function createSelect()
	{
		var div = document.getElementById("selectDiv");
		
		//Create array of options to be added
		var array =_delta.config.contractEtherDeltaAddrs.map(x => { return x.addr;});

		//Create and append select list
		var selectList = document.createElement("select");
		selectList.id = "contractSelect";
		var liveGroup = document.createElement("optgroup");
		liveGroup.label = "Active";
		var oldGroup = document.createElement("optgroup");
		oldGroup.label = "Outdated - withdraw funds";
		
		//Create and append the options
		for (var i = 0; i < array.length; i++) 
		{
			var option = document.createElement("option");
			option.value = i;
			option.text = array[i];
			if(i == 0)
			{
				liveGroup.appendChild(option);
			}
			else 
			{
				oldGroup.appendChild(option);
			}
		}
		selectList.appendChild(liveGroup);
		selectList.appendChild(oldGroup);
		div.appendChild(selectList);
		selectList.selectedIndex = 0;
	}
	
	
	function toDateTime(secs)
	{
		var utcSeconds = secs;
		var d = new Date(0);
		d.setUTCSeconds(utcSeconds);
		return formatDate(d);
	}
	
	function toDateTimeNow(short)
	{
		var t = new Date();
		return formatDate(t, short);
	}

	function formatDate(d, short)
	{
		var month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear(),
			hour = d.getHours(),
			min = d.getMinutes();
			

		if (month.length < 2) month = '0' + month;
		if (day.length < 2) day = '0' + day;
		if (hour < 10) hour = '0' + hour;
		if (min < 10) min = '0' + min;

		if(!short)
			return [year, month, day].join('-') + ' '+ [hour,min].join(':');
		else
			return [year, month, day].join('');
	}

	function divisorFromDecimals(decimals)
	{
		let result = 1000000000000000000;
		if (decimals !== undefined) 
		{
			result = Math.pow(10, decimals);
		}
		return new BigNumber(result);
	}
	
	function downloadBalances()
	{
		if(lastResult)
		{
			let allBal = lastResult;
			allBal = allBal.filter((x) => {return x.Total > 0;});
			
			
			var A = [ ['Token name', 'Wallet', 'EtherDelta', 'Total'] ];  
			// initialize array of rows with header row as 1st item
			for(var i=0;i< allBal.length;++i)
			{ 
				let arr = [ allBal[i].Name, allBal[i].Wallet, allBal[i].EtherDelta, allBal[i].Total];
				A.push(arr); 
			}
			var csvRows = [];
			for(var i=0,l=A.length; i<l; ++i){
				csvRows.push(A[i].join(','));   // unquoted CSV row
			}
			var csvString = csvRows.join("\r\n");

			var sp = document.createElement('span');
			sp.innerHTML = "Export balances as CSV ";
			var a = document.createElement('a');
			a.innerHTML = '<i class="fa fa-download" aria-hidden="true"></i>';
			a.href     = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
			a.target   = '_blank';
			a.download = toDateTimeNow(true) + '-' + publicAddr + '.csv';
			sp.appendChild(a);
			
			$('#downloadBalances').html('');
			var parent = document.getElementById('downloadBalances');
			parent.appendChild(sp);
			//parent.appendCild(a);
		}
		
	}
	
	
	function escapeHtml(text) {
	  var map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	  };

		return text.replace(/[&<>"']/g, function(m) { return map[m]; });
	}
	
/*	function socketResponse(event) {
		console.log('received socket msg');
		if(event)
		{
			let resp = JSON.parse(event.data);
			console.log(resp.event);
			sendNotification(resp.event);
			if(resp.event == "welcome")
			{
				console.log('rec welcome');
			}
			else if(resp.event == "pong")
			{
				console.log('rec pong');
			}
			else if(resp.event == "subscribe-txlist")
			{
				if( resp.status == 1)
				{
					console.log('ok');
				} else 
				{
					console.log('notok');
				}
			}
		} else {
			console.log('empty msg');
		}

	}
	
	
	function socketPing(active) {
		if(active)
		{
			pingID  = setInterval(function() 
			{
				console.log('send ping');
				let pingmsg = {"event": "ping"};
				etherScanSocket.send(JSON.stringify(pingmsg));
			}, 18000);
			
		} else {
			if(pingID > -1)
				clearInterval(pingID);
			pingID = -1;
		}
	}
	
	function sendNotification(text){
		if (Notification.permission !== "granted")
			Notification.requestPermission();
		else {
			var notification = new Notification('Notification title', {
			icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
			body: text,
			});
		}
		//notification.onclick = function () {
		//	window.open("http://stackoverflow.com/a/13328397/1269037");      
		//};
	} */
}