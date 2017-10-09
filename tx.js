{
	'use strict';
	// Parameters
	// ##########################################################################################################################################
	
	// shorthands
	let _util = bundle.utility;
	let _delta = bundle.EtherDelta;
	
	// initiation
	let initiated = false;
	let autoStart = false;
	
	
	// loading states

	let running = false;
	
	var etherscanFallback = false;
	
	// settings
    let decimals = false;
	let fixedDecimals = 3; 
	
	

    // user input & data
	let transactionHash = '';
    let lastTxData = undefined;
	let lastTxLog = undefined;
	
	
	let uniqueTokens = {};
		
		
		
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
		hideLoading();
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

		
		// url parameter ?addr=0x... /#0x..
		let trans = getParameterByName('trans');
		if(! trans)
		{
			let hash = window.location.hash;  // url parameter /#0x...
			if(hash)
				trans = hash.slice(1);
		}
		if(trans)
		{
			trans = getAddress(trans);
			if(trans)
			{
				transactionHash = trans;
				autoStart = true;
				// auto start loading
				myClick();
			}
		} 
	}
		

	// Functions - input
	// ##########################################################################################################################################
	

	
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
	}

	function hideLoading()
	{
		$('#loading').hide();
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
		
		hideError();
		hideHint();
		disableInput(true);
		showLoading();
		clearOverview();
		
		// validate address
		if(!autoStart)
			transactionHash = getAddress();
		
		autoStart = false;
		if(transactionHash)
		{
			$('#direct').html('<a target="_blank" href="https://deltaBalances.github.io/transaction.html#' + transactionHash + '"> Direct Link </a> to this page');
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
			//$('#direct').html('<a target="_blank" href="https://deltaBalances.github.io/transaction.html#' + transactionHash + '"> Direct Link </a> to this page');
			getTransactions();
        } else {
			running = false;
			disableInput(false);
			hideLoading();
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
		
		{
			//check if url ending in address
			if(address.indexOf('/0x') !== -1)
			{
				let parts = address.split('/');
				let lastSegment = parts.pop() || parts.pop();  // handle potential trailing slash
				if(lastSegment)
					address = lastSegment;
			}
			
			
			{
				
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
	
	// Functions - requests
	// ##########################################################################################################################################
	
	

	function getTransactions()
	{
		
		let transResult = undefined;
		let logResult = undefined;
		let statusResult = undefined;
		
		let transLoaded = 0;
		
		// status https://api.etherscan.io/api?module=transaction&action=getstatus&txhash=0x15f8e5ea1079d9a0bb04a4c58ae5fe7654b5b2b4463375ff7ffb490aa0032f3a&apikey=YourApiKeyToken
		// https://api.etherscan.io/api?module=proxy&action=eth_GetTransactionReceipt&txhash='+ transactionHash;
		// https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash='+ transactionHash;
		
		$.getJSON('https://api.etherscan.io/api?module=transaction&action=getstatus&txhash=' + transactionHash + '&apikey=' + _delta.config.etherscanAPIKey, (result) => {
			if(result && result.status === '1')
				statusResult = result.result;
			transLoaded++;
			if(transLoaded == 3)
				processTransactions(transResult, statusResult, logResult);
		});
		
		$.getJSON('https://api.etherscan.io/api?module=proxy&action=eth_GetTransactionReceipt&txhash=' + transactionHash + '&apikey=' + _delta.config.etherscanAPIKey, (result) => {
			if(result )
				logResult = result.result;
			transLoaded++;
			if(transLoaded == 3)
				processTransactions(transResult, statusResult, logResult);
		});
		
		$.getJSON('https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=' + transactionHash + '&apikey=' + _delta.config.etherscanAPIKey, (result) => {
			if(result )
				transResult = result.result;
			transLoaded++;
			if(transLoaded == 3)
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
			let pending = false;
			if(!tx.blockHash ||!tx.blockNumber || !tx.transactionIndex)
			{
				pending = true;
			}
			
			let transaction = {
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
				}
			}
			
			
			finish(transaction);
			
			//to ed, val >0  deposit
			// internal from >0 withdraw
			
			function parseOutput(tx, outputLogs)
			{
				console.log('parsing input');
				let outputs = [];
				for(i = 0; i < outputLogs.length; i++)
				{
					let unpacked = _util.processOutputMethod (_delta.web3, tx.to, outputLogs[i]);
					
					if(!unpacked)
					{
						outputs.push({'error': 'unknown output'});
						continue;
					}
					
					if(unpacked.name == 'Trade')
					{ 
						let tradeType = 'Sell';
						let token = undefined;
						let base = undefined;
						let maker = unpacked.params[4].value;
						let taker = unpacked.params[5].value;
						
						if(unpacked.params[0].value === _delta.config.tokens[0].addr) // send get eth  -> buy form sell order
						{
							tradeType = 'Buy';
							token = uniqueTokens[unpacked.params[2].value];
							base = uniqueTokens[unpacked.params[0].value];
						}
						else // taker sell
						{
							token = uniqueTokens[unpacked.params[0].value];
							base = uniqueTokens[unpacked.params[2].value];
						}
						
						if(token && base && token.addr && base.addr)
						{
							let amount = 0;
							let oppositeAmount = 0;
							let buyUser = '';
							let sellUser = '';
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
							
							let unlisted = token.unlisted;
							let dvsr = divisorFromDecimals(token.decimals)
							let dvsr2 = divisorFromDecimals(base.decimals)
							let val = _util.weiToEth(amount, dvsr);
							let val2 = _util.weiToEth(oppositeAmount, dvsr2);
							
							let price = 0;
						//	if(tradeType === 'sell')
							{
								price = val2 / val;
							}
							
							let obj = {
								'type': 'Taker '+ tradeType, 
								'note': 'Clicked an order in the orderbook to trade.',
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
						let type = unpacked.name;
						let token = uniqueTokens[unpacked.params[0].value];
						let user = unpacked.params[1].value;
						let rawAmount = unpacked.params[2].value;
						let rawBalance = unpacked.params[3].value;
						
						if(token && token.addr)
						{
							let unlisted = token.unlisted;
							let dvsr = divisorFromDecimals(token.decimals)
							let val = _util.weiToEth(rawAmount, dvsr);
							let balance = _util.weiToEth(rawBalance, dvsr);
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
							let obj = {
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
							let obj = {
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
						let from = outputLogs[i].topics[1];
						from = '0x' + from.slice(from.length -40);
						let to = outputLogs[i].topics[2];
						to = '0x' + to.slice(to.length -40);
						let rawAmount = unpacked.params[0].value;
						let token = uniqueTokens[outputLogs[i].address];
						let dvsr = divisorFromDecimals(token.decimals)
						let val = _util.weiToEth(rawAmount, dvsr);
						let unlisted = token.unlisted;
						
						let obj = {
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
						let sender = outputLogs[i].topics[1];
						sender = '0x' + sender.slice(sender.length -40);
						let to = outputLogs[i].topics[2];
						to = '0x' + to.slice(to.length -40);
						let rawAmount = unpacked.params[0].value;
						let token = uniqueTokens[outputLogs[i].address];
						let dvsr = divisorFromDecimals(token.decimals)
						let val = _util.weiToEth(rawAmount, dvsr);
						let unlisted = token.unlisted;
						
						let obj = {
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
				console.log('parsing output');
				// transfer 0xa9059cbb adress to, uint value
				
				let method = input.slice(0, 10);
				
				if(method === '0xa9059cbb') // token transfer
				{
					let unpacked = _util.processInputMethod (_delta.web3, tx.to, input);
					if(unpacked && unpacked.name === 'transfer')
					{
						let to = unpacked.params[0].value;
						let rawAmount = unpacked.params[1].value;
						let amount = 0;
						let token = uniqueTokens[tx.to];
						let unlisted = true; 
						if(token && token.addr)
						{
							let dvsr = divisorFromDecimals(token.decimals);
							amount = _util.weiToEth(rawAmount, dvsr);
							unlisted = token.unlisted;
						}
						let obj = 
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
					let unpacked = _util.processInputMethod (_delta.web3, tx.to, input); // contractEtherDelta contractToken
					if(unpacked && unpacked.name === 'approve')
					{
						let sender = unpacked.params[0].value;
						let rawAmount = unpacked.params[1].value;
						let amount = 0;
						let token = uniqueTokens[tx.to];
						let unlisted = true; 
						if(token && token.addr)
						{
							let dvsr = divisorFromDecimals(token.decimals);
							amount = _util.weiToEth(rawAmount, dvsr);
							unlisted = token.unlisted;
						}
						let obj =
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
					let unpacked = _util.processInputMethod (_delta.web3, _delta.contractEtherDelta, input);
					if(unpacked && (unpacked.name === 'deposit' || unpacked.name === 'withdraw'))
					{
						let type = '';
						let note = '';
						let rawVal = 0;
						if(unpacked.name === 'deposit') {
							rawVal = tx.value;
							type = 'Deposit';
							note = 'Deposit ETH into EtherDelta contract';
						} else {
							rawVal = unpacked.params[0].value;
							type = 'Withdraw';
							note = 'Request EtherDelta to withdraw ETH';
						}
						let val = _util.weiToEth(rawVal);	
						
						let obj = {
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
					let unpacked = _util.processInputMethod (_delta.web3, _delta.contractEtherDelta, input);
					if(unpacked && (unpacked.name === 'depositToken' || unpacked.name === 'withdrawToken'))
					{
						let token = uniqueTokens[unpacked.params[0].value];
						if(token && token.addr)
						{
							let unlisted = token.unlisted;
							let dvsr = divisorFromDecimals(token.decimals)
							let val = _util.weiToEth(unpacked.params[1].value, dvsr);
							let type = '';
							let note = '';
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
							
							let obj = {
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
			
					let unpacked = _util.processInputMethod(_delta.web3, _delta.contractEtherDelta, input);
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
							let obj = {
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
					
					let unpacked = _util.processInputMethod(_delta.web3, _delta.contractEtherDelta, input);
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
							
							let obj = {
								'type': 'Taker '+ tradeType,
								'note': 'Clicked an order in the orderbook to trade.',
								'token':token,
								'amount':val,
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
    function finish(transaction)
	{	
		console.log('outputting data');
			/*
			
			let transaction = {
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
	
		let sum = '';
		if(transaction.status === 'Completed') {
			sum += 'Success!<br>';
		}
		else if(transaction.status === 'Pending') {
			sum += 'Transaction is pending, try again later. For a faster transaction raise your gas price next time.<br> Pending for a really long time? Try to <a href="https://www.reddit.com/r/EtherDelta/comments/72tctz/guide_how_to_cancel_a_pending_transaction/" target="_blank">cancel or replace</a> it. <br>';
		}
		else if(transaction.status === 'Error: Bad jump destination' ) {
			if (transaction.input.type === 'Taker Sell' || transaction.input.type === 'Taker Buy') {
				sum += 'Bad jump destination, someone filled this order before you. (Sent earlier or with a higher gas price).<br>';
			}
			else if ( transaction.input.type === 'Token Deposit' || transaction.input.type === 'Token Withdraw') {
				sum += 'Bad jump destination, token deposit/withdraw failed. You might not have had the right account balance left. Otherwise check if the token is not locked. (Still in ICO, rewards period, disabled etc.)<br>';
			}
		} else {
			sum += 'Transaction failed.<br>';
		}
		
		if(transaction.input && transaction.input.note)
		{
			sum += transaction.input.note +'<br>';
		} else if(transaction.output && transaction.output.length > 0)
		{
			sum += transaction.output[0].note +'<br>';
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
		
		let tradeCount = 0;
		if(transaction.output)
		{
			// output price can get wrong decimals if trading like 15e-10, so get price from input if possible. 
			if(transaction.input && transaction.output.length == 1 && transaction.output[0].price)
			{
				transaction.output[0].price = transaction.input.price;
				if(transaction.output[0].amount < transaction.input.amount)
				{
					sum += "Partial fill, ";
				}
			}
			
			let spent = 0;
			let received = 0;
			
			for(let i = 0; i < transaction.output.length; i++)
			{
				if(transaction.output[i].type == 'Taker Buy')
				{
					tradeCount++;
					sum += "Bought " + transaction.output[i].amount + " " + transaction.output[i].token.name + " for " + transaction.output[i].price + " ETH each, " + transaction.output[i].ETH + " ETH in total. <br>";
					spent += transaction.output[i].ETH;
				}
				else if(transaction.output[i].type == 'Taker Sell')
				{
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
		}
		
		
		$('#summary').html(sum);
	
		$('#hash').html(hashLink(transaction.hash, true));
		$('#from').html(addressLink(transaction.from, true, false));
		$('#to').html(addressLink(transaction.to, true, false));
		$('#cost').html('??');
		$('#gasprice').html();
		$('#gasgwei').html(transaction.gasGwei + ' Gwei (' + transaction.gasPrice.toFixed(10) + ' ETH)');
		if(transaction.status === 'Completed') {
			$('#gascost').html(Number(transaction.gasEth).toFixed(5) + ' ETH');
		} else if(transaction.status === 'Pending') {
			$('#gascost').html('Pending');
		} else {
			$('#gascost').html('Failed');
		}
		$('#gaslimit').html(transaction.gasLimit);
		$('#nonce').html(transaction.nonce);
		if(transaction.status === 'Completed')
			$('#status').html('<i style="color:green;" class="fa fa-check"></i>' + ' ' + transaction.status);
		else if(transaction.status === 'Pending')
			$('#status').html('<i class="fa fa-cog fa-fw"></i>' + ' ' + transaction.status);
		else
			$('#status').html('<i style="color:red;" class="fa fa-exclamation-circle"></i>' + ' ' + transaction.status);
		$('#time').html('??');
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
			
			for(let i = 0; i < transaction.output.length; i++)
			{
				displayParse(transaction.output[i], "#outputdata");
			}
		}
		else if(transaction.status === 'Pending')
			$('#outputdata').html('Transaction is pending,no output available yet.');
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
			$(id).html('No familair EtherDelta input recognized');
			console.log('fuck');
			return;
		}
		//let html = $(id).html();
		//$(id).html(html + div);
		buildHtmlTable(id, parsedInput); 
		
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
		let url = 'https://etherscan.io/tx/' + hash;
		if(!html)
			return url
		return '<a target = "_blank" href="' + url + '">'+hash +' </a>';
	}
	
	function addressLink(addr, html, short) {
		let url = 'https://etherscan.io/address/' + addr;
		if(!html)
			return url
		let displayText = addressName(addr);
		if(short)
			displayText = displayText.slice(0,6) + '..';
		return '<a target="_blank" href="' + url + '">'+ displayText +' </a>';
	}
	
	function addressName(addr) {
		let lcAddr = addr.toLowerCase();
		if(uniqueTokens[addr])
		{
			return uniqueTokens[addr].name + " Contract";
		} 
		else if(uniqueTokens[lcAddr])
		{
			return uniqueTokens[lcAddr].name + " Contract";
		}
		
		for(let i = 0; i < _delta.config.contractEtherDeltaAddrs.length ; i++)
		{
			if(lcAddr == _delta.config.contractEtherDeltaAddrs[i].addr)
			{
				let resp = 'EtherDelta Contract ' + addr.slice(0,4) + '..';
				if(i > 0)
					resp = 'Outdated ' + resp;
				return resp;
			}
		}
		return addr;
	}
	
	function checkOldED(addr)
	{
		let lcAddr = addr.toLowerCase();
		for(let i = 0; i < _delta.config.contractEtherDeltaAddrs.length ; i++)
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
		let result = 1000000000000000000;
		if (decimals !== undefined) 
		{
			result = Math.pow(10, decimals);
		}
		return new BigNumber(result);
	}
	
	// Builds the HTML Table out of myList.
	function buildHtmlTable(selector, myObj) 
	{
		let myList = Object.values(myObj);
		let keys = Object.keys(myObj);
		let table$ = $('<table class="table table-sm parsed" cellspacing="0" cellpadding="0" />');
		
        let columns = addAllColumnHeaders(keys, table$);
        let tbody$ = $('<tbody class/>');
		let row$ = $('<tr/>');
        for (var i = 0; i < myList.length; i++) 
		{
            
			if(columns[keys[i]])
			{
					
				let cellValue = myList[i];
				if(keys[i] == 'token')
					cellValue = myList[i].name;
				else if(keys[i] == 'price')
					cellValue = Number(cellValue).toFixed(5);
				else if(keys[i] == 'seller' || keys[i] == 'buyer')
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
        let columnSet = {};
		
        let header1 = $('<thead/>');
        let headerTr$ = $('<tr/>');
		
        for (var i = 0; i < myList.length; i++) 
		{
            let key = myList[i];
            //for (var key in rowHash) 
			{
				if( !columnSet[key] && key !== 'unlisted' && key !=='note' ) 
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
}