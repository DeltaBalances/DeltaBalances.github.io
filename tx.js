{

	// shorthands
	var _delta = bundle.EtherDelta;
	var	_util = bundle.utility;
	
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
	
	var uniqueTokens = {};
	var unknownToken = false;
		

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
			
			tokenBlacklist = []; //blacklist only for balances
			
			// note all listed tokens
			for(var i = 0; i < _delta.config.tokens.length; i++)
			{
				var token = _delta.config.tokens[i];
				if(token)
				{
					token.name = escapeHtml(token.name); // escape nasty stuff in token symbol/name
					token.addr = token.addr.toLowerCase();
					token.unlisted = false;
					_delta.config.tokens[i] = token;
					if(!tokenBlacklist[token.addr] && !uniqueTokens[token.addr]) 
					{	
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
			_delta.config.customTokens = offlineCustomTokens.filter((x) => {return !(uniqueTokens[x.addr])});
			// note custom tokens
			for(var i = 0; i < _delta.config.customTokens.length; i++)
			{
				var token = _delta.config.customTokens[i];
				if(token && !tokenBlacklist[token.addr] && !uniqueTokens[token.addr]) {
					uniqueTokens[token.addr] = token;
				}
			}
			
			// treat tokens listed as staging as unlisted custom tokens
			if(stagingTokens && stagingTokens.tokens)
			{
				//filter tokens that we already know
				var stageTokens = stagingTokens.tokens.filter((x) => {return !(uniqueTokens[x.addr])});
				for(var i = 0; i < stageTokens.length; i++)
				{
					var token = stageTokens[i];
					if(token)
					{
						token.name = escapeHtml(token.name); // escape nasty stuff in token symbol/name
						token.addr = token.addr.toLowerCase();
						token.unlisted = true;
						if(!tokenBlacklist[token.addr] && !uniqueTokens[token.addr]) 
						{	
							uniqueTokens[token.addr] = token;
							_delta.config.customTokens.push(token);
						}
					}
				}
			}
			
			if(allShitCoins)
			{
				//filter tokens that we already know
				var shitCoins = allShitCoins.filter((x) => {return !(uniqueTokens[x.addr]) && true;});
				for(var i = 0; i < shitCoins.length; i++)
				{
					var token = shitCoins[i];
					if(token)
					{
						token.name = escapeHtml(token.name); // escape nasty stuff in token symbol/name
						token.addr = token.addr.toLowerCase();
						token.unlisted = true;
						if(!tokenBlacklist[token.addr] && !uniqueTokens[token.addr]) 
						{	
							uniqueTokens[token.addr] = token;
							_delta.config.customTokens.push(token);
						}
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
		hideLoading();
		// detect enter & keypresses in input
        $('#address').keypress(function(e) 
		{
            if (e.keyCode == 13) {
                $('#refreshButton').click();
                return false;
            } else {
				hideError();
				showError('<strong>WARNING</strong> The EtherDelta website is compromised. DO NOT USE IT.  <a href="https://twitter.com/etherdelta">Twitter for updates</a>');
				return true;
			}
        });

		
		$(window).resize(function () { 
			$("table").trigger("applyWidgets"); 
		});
		
		checkStorage();
		
		// url parameter ?addr=0x... /#0x..
		var trans = getParameterByName('trans');
		if(! trans)
		{
			var hash = window.location.hash;  // url parameter /#0x...
			if(hash)
				trans = hash.slice(1);
		}
		if(trans)
		{
			trans = getAddress(trans);
			if(trans)
			{
				transactionHash = trans;
				window.location.hash = transactionHash;
				autoStart = true;
				// auto start loading
				myClick();
			}
		} 
		if(!trans)
		{
			$('#address').focus();
		}
		showError('<strong>WARNING</strong> The EtherDelta website is compromised. DO NOT USE IT.  <a href="https://twitter.com/etherdelta">Twitter for updates</a>');
	}
		
	
	function disableInput(disable)
	{
		$('#refreshButton').prop('disabled', disable);
        $("#address").prop("disabled", disable);
		if(disable)
			$('#loading').addClass('dim');
		else
			$('#loading').removeClass('dim');
		$("#loading").prop("disabled", disable);
	}
	
	function showLoading(balance, trans)
	{
		
		$('#loading').addClass('fa-spin');
		$('#loading').addClass('dim');
		$('#loading').prop('disabled', true);
		$('#loading').show();
		$('#refreshButtonLoading').show();
		$('#refreshButtonSearch').hide();
		
	}
	
	function buttonLoading()
	{
		if(!transactionHash)
		{			
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

	function hideLoading()
	{
		$('#loading').hide();
		$('#refreshButtonLoading').hide();
		$('#refreshButtonSearch').show();
	}
	
	function setToken(address)
	{
		if(uniqueTokens[address])
			return uniqueTokens[address];
		else
		{
			unknownToken = true;
			return {addr: address, name: '???', decimals:18};					
		}
	}
	
	function myClick()
	{
		if(running)
			return;
		if(!initiated)
		{
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
		if(!autoStart)
			transactionHash = getAddress();
		
		autoStart = false;
		if(transactionHash)
		{
			window.location.hash = transactionHash;
			getAll();

		}
		else
		{
			console.log('invalid input');
            disableInput(false);
			hideLoading();
		}
	}
	
	function getAll(autoload)
	{
		if(running)
			return;
		
		running = true;
		
        lastResult = undefined;
		lastResult2 = undefined;
		
        if (transactionHash) 
		{	
			window.location.hash = transactionHash;
			getTransactions();
        } else {
			running = false;
			disableInput(false);
			hideLoading();
        }
	}

	// check if input address is valid
    function getAddress(addr) 
	{
        var address = '';
        address = addr ? addr : document.getElementById('address').value;
        address = address.trim();
		
		{
			//check if url ending in address
			if(address.indexOf('/0x') !== -1)
			{
				var parts = address.split('/');
				var lastSegment = parts.pop() || parts.pop();  // handle potential trailing slash
				if(lastSegment)
					address = lastSegment;
			}
		
			if (address.length == 66 && address.slice(0, 2) === '0x') 
			{
				// address is ok
			} 
			else if (address.length == 64 && address.slice(0, 2) !== '0x') 
			{
				address =  '0x'+ address;
			} 
			else if(address.length == 42 && address.slice(0, 2) === '0x')  //wallet addr, not transaction hash
			{
				window.location = window.location.origin + window.location.pathname + '/../#' + address;
				return;
			}
			else 
			{
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
	

	function getTransactions()
	{
		
		var transResult = undefined;
		var logResult = undefined;
		var statusResult = undefined;
		
		var transLoaded = 0;
		
		// status https://api.etherscan.io/api?module=transaction&action=getstatus&txhash=0x15f8e5ea1079d9a0bb04a4c58ae5fe7654b5b2b4463375ff7ffb490aa0032f3a&apikey=YourApiKeyToken
		// https://api.etherscan.io/api?module=proxy&action=eth_GetTransactionReceipt&txhash='+ transactionHash;
		// https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash='+ transactionHash;
		
		$.getJSON('https://api.etherscan.io/api?module=transaction&action=getstatus&txhash=' + transactionHash + '&apikey=' + _delta.config.etherscanAPIKey, (result) => {
			if(result && result.status === '1')
				statusResult = result.result;
			transLoaded++;
			if(transLoaded == 4)
				processTransactions(transResult, statusResult, logResult);
		});
		
		$.getJSON('https://api.etherscan.io/api?module=proxy&action=eth_GetTransactionReceipt&txhash=' + transactionHash + '&apikey=' + _delta.config.etherscanAPIKey, (result) => {
			if(result )
				logResult = result.result;
			transLoaded++;
			if(transLoaded == 4)
				processTransactions(transResult, statusResult, logResult);
		});
		
		$.getJSON('https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=' + transactionHash + '&apikey=' + _delta.config.etherscanAPIKey, (result) => {
			if(result )
			{
				transResult = result.result;
				if(transResult.blockNumber)
				{
					$.getJSON( 'https://api.etherscan.io/api?module=block&action=getblockreward&blockno=' + _util.hexToDec(transResult.blockNumber) + '&apikey='+_delta.config.etherscanAPIKey, ( res ) => {
						if(res && res.status == "1" && res.result)
						{
							var unixtime = res.result.timeStamp;
							if(unixtime)
								txDate = toDateTime(unixtime);
						}
							transLoaded++;
							if(transLoaded == 4)
								processTransactions(transResult, statusResult, logResult);
					});
				} else 
				{
					transLoaded++; // no time call
				}
			}
			transLoaded++;
			if(transLoaded == 4)
				processTransactions(transResult, statusResult, logResult);
		});
		

		
		
		
		function processTransactions(tx, txStatus, txLog)
		{
			if(!tx)
			{
				console.log('error');
				showError('failed to load transaction from <a href="https://etherscan.io/tx/' + transactionHash + '" + target="_blank"> Etherscan </a>');
				disableInput(false);
				hideLoading();
				running = false;
				return;
			}
			console.log('completed requests');
			var pending = false;
			if(!tx.blockHash ||!tx.blockNumber || !tx.transactionIndex)
			{
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
			
			if(!pending)
			{
				if(txStatus.isError === '0') {
					transaction.status = 'Completed';
					transaction.gasUsed = Number(txLog.gasUsed),
					transaction.gasEth = Number(txLog.gasUsed) * _util.weiToEth(Number(tx.gasPrice));
					transaction.blockNumber = tx.blockNumber;
					transaction.blockHash = tx.blockHash;
					transaction.rawoutput =  null;
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
			
			function parseOutput(tx, outputLogs)
			{
				console.log('parsing input');
				var outputs = [];
				for(i = 0; i < outputLogs.length; i++)
				{
					var unpacked = _util.processOutputMethod (_delta.web3, tx.to, outputLogs[i]);
					
					if(!unpacked)
					{
						outputs.push({'error': 'unknown output'});
						continue;
					}
					
					if(unpacked.name == 'Trade')
					{ 
						var tradeType = 'Sell';
						var token = undefined;
						var base = undefined;
						var maker = unpacked.params[4].value;
						var taker = unpacked.params[5].value;
						
						if(unpacked.params[0].value === _delta.config.tokens[0].addr) // send get eth  -> buy form sell order
						{
							tradeType = 'Buy';
							token = setToken(unpacked.params[2].value);				
							base = uniqueTokens[unpacked.params[0].value];
						}
						else // taker sell
						{
							token = setToken(unpacked.params[0].value);	
							base = uniqueTokens[unpacked.params[2].value];
						}
						
						if(token && base && token.addr && base.addr)
						{
							var amount = 0;
							var oppositeAmount = 0;
							var buyUser = '';
							var sellUser = '';
							if(tradeType === 'Sell')
							{
								amount = unpacked.params[1].value;
								oppositeAmount = unpacked.params[3].value;
								sellUser = unpacked.params[5].value;
								buyUser = unpacked.params[4].value;
							} else
							{
								oppositeAmount = unpacked.params[1].value;
								amount = unpacked.params[3].value;
								sellUser = unpacked.params[4].value;
								buyUser = unpacked.params[5].value;
							}
							
							var unlisted = token.unlisted;
							var dvsr = divisorFromDecimals(token.decimals)
							var dvsr2 = divisorFromDecimals(base.decimals)
							var val = _util.weiToEth(amount, dvsr);
							var val2 = _util.weiToEth(oppositeAmount, dvsr2);
							
							var price = 0;
							if(val !== 0)
							{
								price = val2 / val;
							}
							
							
							var obj = {
								'type': 'Taker '+ tradeType, 
								'note': addressLink(tx.from, true, true) + ' selected ' + addressLink(maker, true, true) +'\'s order in the orderbook to trade.',
								'token': token,
								'amount': val,
								'price': price,
								'ETH': val2,
								'unlisted': unlisted,
								'buyer': buyUser,
								'seller': sellUser,
							};
							outputs.push(obj);
						}
						
					}
					else if(unpacked.name == 'Deposit' || unpacked.name == 'Withdraw')
					{
						var type = unpacked.name;
						var token = setToken(unpacked.params[0].value);	
						var user = unpacked.params[1].value;
						var rawAmount = unpacked.params[2].value;
						var rawBalance = unpacked.params[3].value;
						
						if(token && token.addr)
						{
							var unlisted = token.unlisted;
							var dvsr = divisorFromDecimals(token.decimals)
							var val = _util.weiToEth(rawAmount, dvsr);
							var balance = _util.weiToEth(rawBalance, dvsr);
							if(unpacked.name === 'Withdraw')
							{
								note = 'Withdrawn from EtherDelta';
							}
							else
							{
								note = 'Deposited into EtherDelta';
							}	
							
							if(token.addr !== '0x0000000000000000000000000000000000000000')
								type = 'Token ' + type;
							var obj = {
								'type': type,
								'note': note,
								'token':token,
								'amount':val,
								'balance': balance,
								'unlisted':unlisted,
							};
							outputs.push(obj);
						}	
					}
					else if(unpacked.name == 'Cancel')
					{
						var cancelType = 'sell';
						var token = undefined;
						var token2 = undefined;
						if(unpacked.params[0].value === _delta.config.tokens[0].addr) // get eth  -> sell
						{
							cancelType = 'buy';
							token = setToken(unpacked.params[2].value);	
							token2 = setToken(unpacked.params[0].value);
						}
						else // buy
						{
							token = setToken(unpacked.params[0].value);	
							token2 = setToken(unpacked.params[2].value);
						}
						
						if(token && token2 && token.addr && token2.addr)
						{
							var amount = 0;
							var oppositeAmount = 0;
							if(cancelType === 'sell')
							{
								amount = unpacked.params[1].value;
								oppositeAmount = unpacked.params[3].value;
							} else
							{
								oppositeAmount = unpacked.params[1].value;
								amount = unpacked.params[3].value;
							}
							
							var unlisted = token.unlisted;
							var dvsr = divisorFromDecimals(token.decimals)
							var dvsr2 = divisorFromDecimals(token2.decimals)
							var val = _util.weiToEth(amount, dvsr);
							var val2 = _util.weiToEth(oppositeAmount, dvsr2);
							var price = 0;
							//if(cancelType === 'sell')
							{
								price = val2 / val;
							}
							var obj = {
								'type': 'Cancel '+ cancelType,
								'note': 'Cancelled an open order on EtherDelta',
								'token':token,
								'amount':val,
								'price': price,
								'unlisted':unlisted,
							};	
							outputs.push(obj);						
						}	
						
					}
					else if(unpacked.name == 'Transfer')
					{
						var from = outputLogs[i].topics[1];
						from = '0x' + from.slice(from.length -40);
						var to = outputLogs[i].topics[2];
						to = '0x' + to.slice(to.length -40);
						var rawAmount = unpacked.params[0].value;
						var token = setToken(outputLogs[i].address);	
						
						var dvsr = divisorFromDecimals(token.decimals)
						var val = _util.weiToEth(rawAmount, dvsr);
						var unlisted = token.unlisted;
						
						var obj = {
								'type': 'Transfer',
								'note': 'Tokens transferred',
								'token': token,
								'to': to,
								'amount': val,
								'unlisted': unlisted,
						};
						outputs.push(obj);
					}
					else if(unpacked.name == 'Approval')
					{
						var sender = outputLogs[i].topics[1];
						sender = '0x' + sender.slice(sender.length -40);
						var to = outputLogs[i].topics[2];
						to = '0x' + to.slice(to.length -40);
						var rawAmount = unpacked.params[0].value;
						var token = setToken(outputLogs[i].address);
						var dvsr = divisorFromDecimals(token.decimals)
						var val = _util.weiToEth(rawAmount, dvsr);
						var unlisted = token.unlisted;
						
						var obj = {
								'type': 'Approve',
								'note': 'Now allows tokens to be transferred by deposit transaction (2/2)',
								'sender':sender,
								'token': token,
								'to': to,
								'amount': val,
								'unlisted': unlisted,
						};
						outputs.push(obj);
					}
					// Order
				}
				return outputs;
			}
			
			function parseInput(tx, input)
			{
				console.log('parsing input');
				// transfer 0xa9059cbb adress to, uint value
				
				var method = input.slice(0, 10);
				
				if(method === '0xa9059cbb') // token transfer
				{
					var unpacked = _util.processInputMethod (_delta.web3, tx.to, input);
					if(unpacked && unpacked.name === 'transfer')
					{
						var to = unpacked.params[0].value;
						var rawAmount = unpacked.params[1].value;
						var amount = 0;
						var token = setToken(tx.to);
						var unlisted = true; 
						if(token && token.addr)
						{
							var dvsr = divisorFromDecimals(token.decimals);
							amount = _util.weiToEth(rawAmount, dvsr);
							unlisted = token.unlisted;
						}
						var obj = 
							{
								'type': 'Transfer',
								'note': 'Give the token contract the order to transfer your tokens',
								'token': token,
								'to': to,
								'amount': amount,
								'unlisted': unlisted,
							};
						return obj;
					}
				}
				else if(method === '0x095ea7b3') // approve 
				{
					//sender, //amount  /to is contractAddr
					var unpacked = _util.processInputMethod (_delta.web3, tx.to, input); // contractEtherDelta contractToken
					if(unpacked && unpacked.name === 'approve')
					{
						var sender = unpacked.params[0].value;
						var rawAmount = unpacked.params[1].value;
						var amount = 0;
						var token = setToken(tx.to);
						var unlisted = true; 
						if(token && token.addr)
						{
							var dvsr = divisorFromDecimals(token.decimals);
							amount = _util.weiToEth(rawAmount, dvsr);
							unlisted = token.unlisted;
						}
						var obj =
							{
								'type': 'Approve',
								'note': 'Transaction (1/2) of a deposit. Approve EtherDelta to move tokens for you.',
								'token':token,
								'sender':sender,
								'amount':amount,
								'unlisted': unlisted,
							};
						return obj;
					}
					
				}
				else if(method === '0xd0e30db0' || method === '0x2e1a7d4d' ) // deposit /withdraw ETH
				{
					var unpacked = _util.processInputMethod (_delta.web3, _delta.contractEtherDelta, input);
					if(unpacked && (unpacked.name === 'deposit' || unpacked.name === 'withdraw'))
					{
						var type = '';
						var note = '';
						var rawVal = 0;
						if(unpacked.name === 'deposit') {
							rawVal = tx.value;
							type = 'Deposit';
							note = 'Deposit ETH into EtherDelta contract';
						} else {
							rawVal = unpacked.params[0].value;
							type = 'Withdraw';
							note = 'Request EtherDelta to withdraw ETH';
						}
						var val = _util.weiToEth(rawVal);	
						
						var obj = {
							'type': type,
							'note': note,
							'amount':val,
						};
						return obj;
					}
				}
				
				//deposit 0xd0e30db0
				//withdraw 0x2e1a7d4d
				//approve 0x095ea7b3
				
				
				else if(method === '0x9e281a98' || method === '0x338b5dea') //methodIDs depositToken & wihdrawToken
				{
					var unpacked = _util.processInputMethod (_delta.web3, _delta.contractEtherDelta, input);
					if(unpacked && (unpacked.name === 'depositToken' || unpacked.name === 'withdrawToken'))
					{
						var token = setToken(unpacked.params[0].value);
						if(token && token.addr)
						{
							var unlisted = token.unlisted;
							var dvsr = divisorFromDecimals(token.decimals)
							var val = _util.weiToEth(unpacked.params[1].value, dvsr);
							var type = '';
							var note = '';
							if(unpacked.name === 'withdrawToken')
							{
								type = 'Withdraw';
								note = 'Request EtherDelta to withdraw tokens';
							}
							else
							{
								type = 'Deposit';
								note = 'Transaction (2/2) of a deposit, request EtherDelta to deposit tokens';
							}	
							
							var obj = {
								'type': 'Token ' + type,
								'note': note,
								'token':token,
								'amount':val,
								'unlisted':unlisted,
							};
							return obj;
						}	
					}
				}  else if(method === '0x278b8c0e') // cancel
				{
					//Function: cancelOrder(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, uint8 v, bytes32 r, bytes32 s)
					//MethodID: 0x278b8c0e
			
					var unpacked = _util.processInputMethod(_delta.web3, _delta.contractEtherDelta, input);
					if(unpacked && (unpacked.name === 'cancelOrder'))
					{
						var cancelType = 'sell';
						var token = undefined;
						var token2 = undefined;
						if(unpacked.params[0].value === _delta.config.tokens[0].addr) // get eth  -> sell
						{
							cancelType = 'buy';
							token = setToken(unpacked.params[2].value);
							token2 = setToken(unpacked.params[0].value);
						}
						else // buy
						{
							token = setToken(unpacked.params[0].value);
							token2 = setToken(unpacked.params[2].value);
						}
						
						if(token && token2 && token.addr && token2.addr)
						{
							var amount = 0;
							var oppositeAmount = 0;
							if(cancelType === 'sell')
							{
								amount = unpacked.params[1].value;
								oppositeAmount = unpacked.params[3].value;
							} else
							{
								oppositeAmount = unpacked.params[1].value;
								amount = unpacked.params[3].value;
							}
							
							var unlisted = token.unlisted;
							var dvsr = divisorFromDecimals(token.decimals)
							var dvsr2 = divisorFromDecimals(token2.decimals)
							var val = _util.weiToEth(amount, dvsr);
							var val2 = _util.weiToEth(oppositeAmount, dvsr2);
							var price = 0;
							//if(cancelType === 'sell')
							{
								price = val2 / val;
							}
							var obj = {
								'type': 'Cancel '+ cancelType,
								'note': 'Cancel an open order on EtherDelta',
								'token':token,
								'amount':val,
								'price': price,
								'unlisted':unlisted,
							};	
							return obj;							
						}	
					}
				} else if(method === '0x0a19b14a') // trade
				{

					//Function: trade(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, address user, uint8 v, bytes32 r, bytes32 s, uint256 amount)
					//MethodID: 0x0a19b14a
					
					var unpacked = _util.processInputMethod(_delta.web3, _delta.contractEtherDelta, input);
					if(unpacked && (unpacked.name === 'trade'))
					{
						var tradeType = 'Sell';
						var token = undefined;
						var token2 = undefined;
						if(unpacked.params[0].value === _delta.config.tokens[0].addr) // get eth  -> sell
						{
							tradeType = 'Buy';
							token = setToken(unpacked.params[2].value);
							token2 = setToken(unpacked.params[0].value);
						}
						else // buy
						{
							token = setToken(unpacked.params[0].value);
							token2 = setToken(unpacked.params[2].value);
						}
						
						if(token && token2 && token.addr && token2.addr)
						{
							var amount = 0;
							var oppositeAmount = 0;
							var chosenAmount = Number(unpacked.params[10].value);
							if(tradeType === 'Sell')
							{
								amount = Number(unpacked.params[1].value);
								oppositeAmount = Number(unpacked.params[3].value);
								
								
							} else
							{
								oppositeAmount = Number(unpacked.params[1].value);
								amount = Number(unpacked.params[3].value);
							}
							
							var unlisted = token.unlisted;
							var dvsr = divisorFromDecimals(token.decimals)
							var dvsr2 = divisorFromDecimals(token2.decimals)
							var val = _util.weiToEth(amount, dvsr);
							var val2 = _util.weiToEth(oppositeAmount, dvsr2);
							
							var orderSize = 0;
							
							var price = 0;
						//	if(tradeType === 'sell')
							{
								price = val2 / val;
							}	
							
							
							if(tradeType === 'Buy')
							{
								orderSize = val;
								if(oppositeAmount > chosenAmount)
								{
									val2 = _util.weiToEth(chosenAmount, dvsr2);
									amount = (chosenAmount / ( oppositeAmount / amount));
									val =_util.weiToEth(amount, dvsr);
								}
								
								
							} else
							{
								orderSize = val;
								if(amount > chosenAmount)
								{
									val = _util.weiToEth(chosenAmount, dvsr);
									oppositeAmount = (chosenAmount * oppositeAmount) / amount;
									val2 = _util.weiToEth(oppositeAmount, dvsr2);
								}
							}
							
							
							
							var obj = {
								'type': 'Taker '+ tradeType,
								'note': addressLink(tx.from, true, true) + ' selected ' + addressLink(unpacked.params[6].value, true, true) +'\'s order in the orderbook to trade.',
								'token':token,
								'amount':val,
								'order size':orderSize,
								'price': price,
								'ETH': val2,
								'unlisted':unlisted,
							};
							return obj;
						}	
					}
					
				}
			} 


		}
	}
	

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
    function finish(transaction)
	{	
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
		if(transaction.status === 'Completed') {
			sum += 'Status: Completed<br>';
		}
		else if(transaction.status === 'Pending') {
			sum += 'Status: Transaction is pending, try again later. For a faster transaction raise your gas price next time.<br> Pending for a really long time? Try to <a href="https://www.reddit.com/r/EtherDelta/comments/72tctz/guide_how_to_cancel_a_pending_transaction/" target="_blank">cancel or replace</a> it. <br>';
		}
		else if(transaction.status === 'Error: Bad jump destination' ) {
			if (transaction.input.type === 'Taker Sell' || transaction.input.type === 'Taker Buy') {
				sum += 'Status: Bad jump destination, someone filled this order before you. (Sent earlier or with a higher gas price).<br>';
			}
			else if ( transaction.input.type === 'Token Deposit' || transaction.input.type === 'Token Withdraw') {
				sum += 'Status: Bad jump destination, token deposit/withdraw failed. You might not have had the right account balance left. Otherwise check if the token is not locked. (Still in ICO, rewards period, disabled etc.)<br>';
			}
		} else {
			sum += 'Status: Transaction failed.<br>';
		}
		
		if(unknownToken)
		{
			sum += "<strong>This token is still unknown to DeltaBalances </strong>, amount and price might be wrong if the token has less than 18 decimals <br> "
			
		}
		if(transaction.input && transaction.input.note)
		{
			sum += 'Transaction type: ' + transaction.input.note +'<br>';
		} else if(transaction.output && transaction.output.length > 0)
		{
			sum += 'Transaction type: '+ transaction.output[0].note +'<br>';
		}
		if(transaction.input && transaction.input.type === 'Transfer' )
		{
			if(uniqueTokens[transaction.input.to]) 
			{
				sum += 'Warning, you sent tokens to a token contract, this is usually a mistake. <br>';
			}
			else if(transaction.input.to === _delta.config.contractEtherDeltaAddr)
			{
				sum += 'Warning, you sent tokens to the EtherDelta contract without a deposit, you can no longer access these tokens. <br>';
			}
		}
		if(!transaction.input && (!transaction.output || transaction.output.length == 0))
		{
			sum += 'This does not seem to be an EtherDelta transaction <br>'; 
		}
		if(checkOldED(transaction.to)) {
			sum += 'This transaction is to an outdated EtherDelta contract, only use these to withdraw old funds.<br>';
		}
		
		var tradeCount = 0;
		var zeroDecWarning = '';
		if(transaction.output)
		{
			// output price can get wrong decimals if trading like 15e-10, so get price from input if possible. 
			if(transaction.input && transaction.output.length == 1 && transaction.output[0].price >= 0)
			{
				transaction.output[0].price = transaction.input.price;
				if(transaction.output[0].amount < transaction.input['order size'])
				{
					sum += "Partial fill, ";
				}
			}
			
			var spent = 0;
			var received = 0;
			
			for(var i = 0; i < transaction.output.length; i++)
			{
				if(transaction.output[i].type == 'Taker Buy')
				{
					if(transaction.output[i].token.decimals == 0 && !zeroDecWarning)
					{
						zeroDecWarning = "<strong>Note: </strong> " + transaction.output[i].token.name + " has 0 decimals precision. Numbers might be lower than expected due to rounding. <br>";
					}
					tradeCount++;
					sum += "Bought " + transaction.output[i].amount + " " + transaction.output[i].token.name + " for " + transaction.output[i].price + " ETH each, " + transaction.output[i].ETH + " ETH in total. <br>";
					spent += transaction.output[i].ETH;
				}
				else if(transaction.output[i].type == 'Taker Sell')
				{
					if(transaction.output[i].token.decimals == 0 && !zeroDecWarning)
					{
						zeroDecWarning = "<strong>Note: </strong> " + transaction.output[i].token.name + " has 0 decimals precision. Numbers might be lower than expected due to rounding. <br>"
					}
					tradeCount++;
					sum += "Sold " + transaction.output[i].amount + " " + transaction.output[i].token.name + " for " + transaction.output[i].price + " ETH each, " + transaction.output[i].ETH + " ETH in total. <br>";
					received += transaction.output[i].ETH;
				} 
				else if(transaction.output[i].type == "Deposit" || transaction.output[i].type == "Token Deposit")
				{
					sum += "Deposited " +  transaction.output[i].amount + " " + transaction.output[i].token.name + ", new balance: " + transaction.output[i].balance + " " + transaction.output[i].token.name + '<br>';
				}
				else if(transaction.output[i].type == "Withdraw" || transaction.output[i].type == "Token Withdraw")
				{
					sum += "Withdrew " +  transaction.output[i].amount + " " + transaction.output[i].token.name + ", new balance: " + transaction.output[i].balance + " " + transaction.output[i].token.name + '<br>';
				}
			}
			
			if(tradeCount > 1 && transaction.to !== _delta.config.contractEtherDeltaAddr)
			{
				sum += 'This transaction was made by a contract that has made multiple trades in a single transaction. <br>';
				// sum up what a custom cotract did in multiple trades
				sum += "ETH gain over these trades: " + (received - spent - Number(transaction.gasEth)) + " (incl. gas cost). <br>";
			}
			else if (tradeCount > 0 && transaction.to !== _delta.config.contractEtherDeltaAddr)
			{
				sum += 'This transaction was made by a contract instead of a user. <br>';
			}
			
			if(zeroDecWarning)
				sum += zeroDecWarning;
		}
		
		
		$('#summary').html(sum);
	
		$('#hash').html(hashLink(transaction.hash, true));
		$('#from').html(addressLink(transaction.from, true, false));
		$('#to').html(addressLink(transaction.to, true, false));
		$('#cost').html('??');
		$('#gasgwei').html(transaction.gasGwei + ' Gwei (' + transaction.gasPrice.toFixed(10) + ' ETH)');
		if(!transaction.gasUsed)
			transaction.gasUsed = '???';
		$('#gasusedlimit').html(transaction.gasUsed + " / " + transaction.gasLimit);
		if(transaction.status === 'Completed') {
			$('#gascost').html(Number(transaction.gasEth).toFixed(5) + ' ETH');
		} else if(transaction.status === 'Pending') {
			$('#gascost').html('Pending');
		} else {
			$('#gascost').html(Number(transaction.gasEth).toFixed(5) + ' ETH');
		}
		$('#nonce').html(transaction.nonce);
		if(transaction.status === 'Completed')
		{
			$('#status').html('<i style="color:green;" class="fa fa-check"></i>' + ' ' + transaction.status);
			$('#time').html(txDate);
		}
		else if(transaction.status === 'Pending')
		{
			$('#status').html('<i class="fa fa-cog fa-fw"></i>' + ' ' + transaction.status);
			$('#time').html('Pending');
		}
		else
		{
			$('#status').html('<i style="color:red;" class="fa fa-exclamation-circle"></i>' + ' ' + transaction.status);
			$('#time').html('txDate');
		}
		$('#ethval').html(transaction.value);
		$('#inputdata').html('');
		if(transaction.input && transaction.input.type)
		{
			$('#inputtype').html(transaction.input.type);
		} else
		{
			if(tradeCount == 0)
				$('#inputtype').html('');
			else 
				$('#inputtype').html('Trade');	
		}
		displayParse(transaction.input, "#inputdata");
		$('#outputdata').html('');
		if(transaction.output ) {
			
			for(var i = 0; i < transaction.output.length; i++)
			{
				displayParse(transaction.output[i], "#outputdata");
			}
		}
		else if(transaction.status === 'Pending')
			$('#outputdata').html('Transaction is pending, no output available yet.');
		else
			$('#outputdata').html('');
		

        
	    running = false;
		buttonLoading();
		disableInput(false);
		console.log('done');
	}

	function clearOverview()
	{
		
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
	
	function displayParse(parsedInput, id)
	{
		if(!parsedInput) {
			$(id).html('No familiair EtherDelta input recognized');
			console.log('fuck');
			return;
		}
		//let html = $(id).html();
		//$(id).html(html + div);
		buildHtmlTable(id, parsedInput); 
		
		
		$("table").tablesorter({
			headers: { 0: {sorter:false}, 1: {sorter:false}, 2: {sorter:false}, 3: {sorter:false}, 4: {sorter:false}, 5: {sorter:false},6: {sorter:false}, 7: {sorter:false}},
			widgets: [ 'scroller' ],
			widgetOptions : {
				scroller_barWidth : 18,
			},
			sortList: [[0,0]]
        });
		$("table thead th").data("sorter", false);
		
		$("table thead th").removeClass("tablesorter-headerUnSorted");
		$("table thead th").removeClass("tablesorter-headerDesc");
		$("table thead th").removeClass("tablesorter-headerAsc");
	}
	
	function hideInput()
	{
		$('#inputType').hide();
		$('#inputNote').hide();
		$('#inputPrice').hide();
		$('#inputAmount').hide();
		$('#inputToken').hide();
		$('#inputSender').hide();
		$('#inputTo').hide();
	}
	
	function hashLink(hash, html) {
		var url = 'https://etherscan.io/tx/' + hash;
		if(!html)
			return url
		return '<a target = "_blank" href="' + url + '">'+hash +' </a>';
	}
	
	function addressLink(addr, html, short) {
		var url = 'https://etherscan.io/address/' + addr;
		if(!html)
			return url
		var displayText = addr;
		if(short)
			displayText = displayText.slice(0,6) + '..';
		else {
			displayText = addressName(addr);
		}
		return '<a target="_blank" href="' + url + '">'+ displayText +' </a>';
	}
	
	function addressName(addr) {
		var lcAddr = addr.toLowerCase();
		if(uniqueTokens[addr])
		{
			return uniqueTokens[addr].name + " Contract";
		} 
		else if(uniqueTokens[lcAddr])
		{
			return uniqueTokens[lcAddr].name + " Contract";
		}
		
		for(var i = 0; i < _delta.config.contractEtherDeltaAddrs.length ; i++)
		{
			if(lcAddr == _delta.config.contractEtherDeltaAddrs[i].addr)
			{
				var resp = 'EtherDelta Contract ' + addr.slice(0,4) + '..';
				if(i > 0)
					resp = 'Outdated ' + resp;
				return resp;
			}
		}
		return addr;
	}
	
	function checkOldED(addr)
	{
		var lcAddr = addr.toLowerCase();
		for(var i = 0; i < _delta.config.contractEtherDeltaAddrs.length ; i++)
		{
			if(lcAddr == _delta.config.contractEtherDeltaAddrs[i].addr)
			{
				return i > 0;
			}
		}
		return false;
	}
	

	function toDateTime(secs)
	{
		var utcSeconds = secs;
		var d = new Date(0);
		d.setUTCSeconds(utcSeconds);
		return formatDate(d);
	}

	function formatDate(d)
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

		return [year, month, day].join('-') + ' '+ [hour,min].join(':');
	}

	function divisorFromDecimals(decimals)
	{
		var result = 1000000000000000000;
		if (decimals !== undefined) 
		{
			result = Math.pow(10, decimals);
		}
		return new BigNumber(result);
	}
	
	// Builds the HTML Table out of myList.
	function buildHtmlTable(selector, myObj) 
	{
		var myList = Object.values(myObj);
		var keys = Object.keys(myObj);
		var table$ = $('<table class="table table-sm parsed" cellspacing="0" cellpadding="0" />');
		
        var columns = addAllColumnHeaders(keys, table$);
        var tbody$ = $('<tbody class/>');
		var row$ = $('<tr/>');
        for (var i = 0; i < myList.length; i++) 
		{
            
			if(columns[keys[i]])
			{
					
				var cellValue = myList[i];
				if(keys[i] == 'token')
				{
					var name = myList[i].name;
					if( !myList[i].unlisted && !unknownToken)
						cellValue = '<a  target="_blank" class="label label-primary" href="https://etherdelta.com/#' + name + '-ETH">' + name + '</a>';
					else
						cellValue = '<a target="_blank" class="label label-warning" href="https://etherdelta.com/#' + myList[i].addr + '-ETH">' + name + '</a>';
				}
				else if(keys[i] == 'price')
				{
					cellValue = Number(cellValue).toFixed(5);
				}
				else if(keys[i] == 'order size' || keys[i] == 'amount' || keys[i] == 'ETH')
				{
					cellValue = Number(cellValue).toFixed(3);
				}
				else if(keys[i] == 'seller' || keys[i] == 'buyer' || keys[i] == 'to' || keys[i] == 'sender')
				{
					cellValue = addressLink(cellValue, true, true);
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
		
    }

    // Adds a header row to the table and returns the set of columns.
    // Need to do union of keys from all records as some records may not contain
    // all records.
    function addAllColumnHeaders(myList, table) 
	{
        var columnSet = {};
		
        var header1 = $('<thead />');
        var headerTr$ = $('<tr/>');
		
        for (var i = 0; i < myList.length; i++) 
		{
            var key = myList[i];
            //for (var key in rowHash) 
			{
				if( !columnSet[key] && key !== 'unlisted' && key !=='note') 
				{
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
	
	function checkStorage() 
	{
        if (typeof(Storage) !== "undefined") 
		{
			var addr = localStorage.getItem("address");
			if(addr)
			{
				$('#overviewNav').attr("href", "index.html#" + addr);
				$('#historyNav').attr("href", "history.html#" + addr);
			}
        } 
    }

}