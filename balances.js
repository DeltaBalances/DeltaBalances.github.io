{
	// Parameters
	// ##########################################################################################################################################
	
	// shorthands
	let _util = bundle.utility;
	let _delta = bundle.EtherDelta;
	
	// initiation
	let initiated = false;
	let autoStart = false;
	
	
	// loading states
    let table1Loaded = false;
	let table2Loaded = false;
	let loadedED = 0;
    let loadedW = 0;
	let trigger_1 = false;
	let trigger_2 = false;
	let running = false;
	
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
	let blocknum = -1;
	let startblock = 0;
	let endblock = 99999999	
	let transactionDays = 3;
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
        },
    };
	
	// placeholder
	let transactionsPlaceholder = [
		{
			Type: 'Deposit',
			Name: 'ETH',
			Value: 0,
			Hash: '',
			Date: toDateTimeNow(),
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
				_util.blockNumber(_delta.web3, (err, num) => 
				{
					if(!err && num)
					{
						blocknum = num;
						startblock = getStartBlock(blocknum, transactionDays);
					}
				});
			}
			//import of (updated?) etherdelta config
			if(module.exports)
			{
				_delta.config.tokens = module.exports.tokens;
				_delta.config.pairs = module.exports.pairs;
			}
			
			_delta.config.customTokens = offlineCustomTokens;
			
			for(let i = 0; i < _delta.config.tokens.length; i++)
			{
				let token = _delta.config.tokens[i];
				if(!uniqueTokens[token.addr])
					uniqueTokens[token.addr] = token;
			}
			for(let i = 0; i < _delta.config.customTokens.length; i++)
			{
				let token = _delta.config.customTokens[i];
				if(!uniqueTokens[token.addr])
					uniqueTokens[token.addr] = token;
			}
			
			initiated = true;
			if(autoStart)
				myClick();
		});
	}
	
	function readyInit()
	{
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
		
		// contract change
		$('#contractSelect').change(e => {
			_delta.changeContract(e.target.selectedIndex, () => {});
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
			if(lastResult)
			{
				if(lastResult3)
				{
					makeTable(lastResult, hideZero);
				}
				else
					getBalances();
			}
			if(lastResult2)
				makeTable2(lastResult2);
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
        $("#address").prop("disabled", disable);
		$("#loadingBalances").prop("disabled", disable);
		$('#loadingBalances').addClass('dim');
		$('#loadingTransactions').addClass('dim');
		$("#loadingTransactions").prop("disabled", disable);
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
		}
	}

	function hideLoading(balance, trans)
	{
		if(balance)
			$('#loadingBalances').hide();
		if(trans)
			$('#loadingTransactions').hide();
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
		
		// validate address
		if(!autoStart)
			publicAddr = getAddress();
		
		if(publicAddr)
		{
			getAll();
		}
		else
		{
			//placeholder();
			console.log('invalid input');
            disableInput(false);
			hideLoading(true,true);
		}
	}
	
	function getAll(autoload)
	{
		if(running)
			return;
		
		running = true;
		
		trigger_1 = true;
		trigger_2 = true;
		
        lastResult = undefined;
		lastResult2 = undefined;
		lastResult3 = undefined;
		
        if (publicAddr) 
		{	
			setStorage();
		
			getTrans();
			getBalances();

        } else {
			running = false;
        }
	}
	
	function getBalances()
	{
		if(!trigger_1)
			return;
		
		
		if(showBalances)
		{
			balances = {};
			
			trigger_1 = false;
			disableInput(true);
			loadedW = 0; // wallet async load progress
			loadedED = 0; // etherdelta async load progress
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
					Unlisted: custom,
					Address: token.addr,
                };

                if (token.name === 'ETH') {
                    getEthBalanceW(publicAddr);
                    getTokenBalanceED(token, publicAddr);
                } else {
                    getTokenBalanceW(token, publicAddr);
                    getTokenBalanceED(token, publicAddr);
                }
            }
		}
	}	
	
	function getTrans()
	{
		if(!trigger_2)
			return;
		
		
		if(showTransactions)
		{
			trigger_2 = false;
			disableInput(true);
			
			showLoading(false, true);
				
			$('#transactionsTable tbody').empty();
			if(blocknum >= 0) // blocknum also retrieved on page load, reuse it
			{
				console.log('blocknum re-used');
				endblock = 99999999;
				startblock = getStartBlock(blocknum, transactionDays);
				getTransactions();
			}
			else 
			{
				console.log("try blocknum v2");
				_util.blockNumber(_delta.web3, (err, num) => 
				{
					if(num)
					{
						endblock = num;
						blocknum = num;
						startblock = getStartBlock(blocknum, transactionDays);
					}
					getTransactions();
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
				// possible private key, show warning
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
		startblock = blcknm - ((days * 24 * 60 * 60) / blocktime);
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
	
	function getCustomTokens()
	{
		
		$.getJSON('https://api.ethplorer.io/getAddressInfo/'+ _delta.config.contractAddr + '?apiKey=freekey', (result) => 
		{
			let customTokens = [];
			if(result && result.tokens.length > 0)
			{	
				for(var i = 0; i < result.tokens.length; i++)
				{
					let tk = result.tokens[i];
					
					if(tk.tokenInfo !== undefined)
					{
						let tokenName = tk.tokenInfo.symbol;
						let addr = tk.tokenInfo.address;
						if(!uniqueTokens[addr])
						{
							let token = {
								addr: tk.tokenInfo.address,
								name: tokenName,  // nearly always symbol is the name on etherdelta (not: sonm,dice )
								longname: tk.tokenInfo.name,
								decimals: tk.tokenInfo.decimals,
							};
							uniqueTokens[addr] = token;
							customTokens.push(token);						
						}
					}
				}
			}
			console.log('retrieved custom tokens ethplorer');
			_delta.config.customTokens = customTokens;
		});
	} 
	
	function getEthBalance(address, callback)
	{
        let url = `https://api.etherscan.io/api?module=account&action=balance&address=${  address   }&tag=latest`;

        $.getJSON(url, function(body) {
            const result = body; // {	status:1 , message: ok, result: }
            if (result && result.status === '1') 
			{
                const balance = new BigNumber(result.result);
                callback(false, balance);
            } 
			else {
                callback(true, undefined);
            }
        });

    }

    function getTokenBalance(token, address, callback)
	{
        let url = `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${ token.addr }&address=${ address }&tag=latest`;

        $.getJSON(url, function(body) {
            const result = body; // {	status:1 , message: ok, result: }
            if (result && result.status == "1")
			{
                const balance = new BigNumber(result.result);
                callback(false, balance);
            } 
			else {
                callback(true, undefined);
            }
        });
    }
	
	  // get wallet balance ETH
    function getEthBalanceW(address)
	{
        getEthBalance(address, (errBalance, resultBalance) => 
		{
            if (!errBalance) 
			{
                balances.ETH.Wallet = _util.weiToEth(resultBalance);
				if(balances.ETH.Wallet < walletWarningBalance)
				{
					showHint('Your ETH balance in wallet is low, EtherDelta deposit/withdraw might fail due to gas costs');
				}
            }
            loadedW++;
            finished();
        });
    }


	
	// get wallet balance tokens
    function getTokenBalanceW(token, address)
	{
        getTokenBalance(token, address, (errBalance, resultBalance) => 
		{
            if (!errBalance) 
			{
                balances[token.name].Wallet = _util.weiToEth(resultBalance, divisorFromDecimals(token.decimals));
            }
            loadedW++;
            finished();
        });
    }

    // eth & tokens in etherdelta
    function getTokenBalanceED(token, address)
	{

        _util.call(_delta.web3, _delta.contractEtherDelta,_delta.config.contractEtherDeltaAddr, 'balanceOf', [token.addr, address], (err, result) => 
			{
                if (!err) {
                    let availableBalance = _util.weiToEth(result, divisorFromDecimals(token.decimals));
                    if (availableBalance) {
                        balances[token.name].EtherDelta = availableBalance;
                    }
                }
                loadedED++;
                finished();
            });
    }
	
	function getTransactions()
	{
		let transLoaded = 0;
		let transResult = [];
		let inTransResult = [];
		

		$.getJSON('https://api.etherscan.io/api?module=account&action=txlist&address=' + publicAddr + '&startblock=' + startblock + '&endblock=' + endblock + '&sort=desc', (result) => {
			if(result && result.status === '1')
				transResult = result.result;
			transLoaded++;
			if(transLoaded == 2)
				processTransactions();
		});
		
		// internal ether transactions (withdraw)
		$.getJSON('https://api.etherscan.io/api?module=account&action=txlistinternal&address=' + publicAddr + '&startblock=' + startblock + '&endblock=' + endblock + '&sort=desc', (result2) => {
			if(result2 && result2.status === '1')
				inTransResult = result2.result;
			transLoaded++;
			if(transLoaded == 2)
				processTransactions();
		});
		
		
		function processTransactions()
		{
			let myAddr = publicAddr.toLowerCase();
			let contractAddr =_delta.config.contractEtherDeltaAddr.toLowerCase();
		
			let txs = transResult;
			let outputTransactions = [];
			
			let itxs = inTransResult; //withdraws
			let withdrawHashes = {};
			
			let gasCosts = [];
			
			// internal tx, withdraws
			for(var i = 0; i < itxs.length; i++)
			{
				let tx = itxs[i];
				if(tx.from.toLowerCase() === contractAddr)
				{	
					let val = _util.weiToEth(Number(tx.value));
					let trans = createOutputTransaction('Withdraw', 'ETH', val, tx.hash, tx.timeStamp, false, '');
					outputTransactions.push(trans);
					withdrawHashes[tx.hash.toLowerCase()] = true;
				}
			}
			let tokens = [];
			
			// normal tx, deposit, token, trade
			for(var i =0; i < txs.length; i++)
			{
				let tx = txs[i];
				if(tx.isError === '0')
				{
					let val = Number(tx.value);
					let txto = tx.to.toLowerCase();
					if(val > 0 && txto === contractAddr) // eth deposit
					{
						let val2 = _util.weiToEth(val);
						let trans = createOutputTransaction('Deposit', 'ETH', val2, tx.hash, tx.timeStamp, false, '');
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
							let unlisted = token.longname && true;
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
							let trans = createOutputTransaction(type, token.name, val, tokens[l].hash, tokens[l].timeStamp, unlisted,token.addr);		
							outputTransactions.push(trans);
						}	
					}
				} else if(method === '0x278b8c0e') // cancel
				{
					
			
					//Function: cancelOrder(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, uint8 v, bytes32 r, bytes32 s)
					//MethodID: 0x278b8c0e
			
					
			
				} else
				{
					gasCosts.push(tokens[l].gasUsed);
					//Function: trade(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, address user, uint8 v, bytes32 r, bytes32 s, uint256 amount)
					//MethodID: 0x0a19b14a
					
				}
			} 
			
			let min = 999999999;
			let max = 0;
			let avg = 0;
			let sum = 0;
			for(var i = 0; i < gasCosts.length; i++)
			{
				let cost = Number(gasCosts[i]);
				sum += cost;
				
				if(cost < min )
					min = cost;
				if(cost > max)
					max= cost;
			}
			avg = sum / gasCosts.length;
			var b = 100;
			// sort by timestamp descending
			//outputTransactions.sort((a,b) => {b.val - a.val;});
			done();
						
			function createOutputTransaction(type, name, val, hash, timeStamp, unlisted, tokenaddr)
			{
				return {
					Type: type,
					Name: name,
					Value: val,
					Hash: hash,
					Date: toDateTime(timeStamp),
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
	/*tokenCount = _delta.config.tokens.length;
			let count1 = tokenCount;
			if(showCustomTokens && _delta.config.customTokens)
				tokenCount += _delta.config.customTokens.length;*/
	
		//check if all requests are complete
        if (loadedED < tokenCount || loadedW < tokenCount) {
            return;
        }
		
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
			//if(bal)
			{
				bal.Total = Number(bal.Wallet) + Number(bal.EtherDelta);
				balances[token.name] = bal;
			}
        }

        let result = Object.values(balances);
        lastResult = result;
		if(showCustomTokens)
			lastResult3 = result;

		makeTable(result, hideZero);
    }

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
        
		buildHtmlTable('#resultTable', filtered, loaded, 'balances');
        trigger();
	}

	function makeTable2(result)
	{
		$('#transactionsTable tbody').empty();
		let loaded = table2Loaded;
		if(changedDecimals)
			loaded = false;
        buildHtmlTable('#transactionsTable', result, loaded, 'transactions');
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
		
		
        if(trigger_1 && (trigger_2 || !showTransactions))
		{
			disableInput(false);
			hideLoading(true,true);
			running = false;
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
					scroller_jumpToHeader: true,
				},
                sortList: [[4, 1]]
            });

            table2Loaded = true;
        }
		trigger_2 = true;
	
		if(trigger_1 && (trigger_2 || !showBalances))
		{
			disableInput(false);
			hideLoading(true,true);
			running = false;
			buttonLoading(true, true);
		}
		else
		{
			hideLoading(false,true);
		}
        table2Loaded = true;
    }


    // Builds the HTML Table out of myList.
	function buildHtmlTable(selector, myList, loaded, type) 
	{
        let body = $(selector +' tbody');
        let columns = addAllColumnHeaders(myList, selector, loaded, type);
        
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
					
					if(head == 'Value')
					{
						let num = Number(cellValue).toFixed(fixedDecimals);
						row$.append($('<td/>').html(num));
					}
					else if(head == 'Name')
					{
						if( !myList[i].Unlisted)
							row$.append($('<td/>').html('<a target="_blank" class="label label-primary" href="https://etherdelta.github.io/#' + cellValue + '-ETH">' + cellValue + '</a>'));
						else
							row$.append($('<td/>').html('<a target="_blank" class="label label-warning" href="https://etherdelta.github.io/#' + myList[i].TokenAddr + '-ETH">' + cellValue + '</a>'));
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
					} 
					else if( head == 'Hash')
					{
						row$.append($('<td/>').html('<a target="_blank" href="https://etherscan.io/tx/' + cellValue + '">'+ cellValue.substring(0,8)  + '...</a>'));
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
					
					if(head == 'Total' || head == 'EtherDelta' || head == 'Wallet' )
					{
						let num = Number(cellValue).toFixed(fixedDecimals);
						row$.append($('<td/>').html(num));
					}
					else if(head == 'Name')
					{
						if(! balances[cellValue].Unlisted)
							row$.append($('<td/>').html('<a target="_blank" class="label label-primary" href="https://etherdelta.github.io/#' + cellValue + '-ETH">' + cellValue + '</a>'));
						else
							row$.append($('<td/>').html('<a target="_blank" class="label label-warning" href="https://etherdelta.github.io/#' + myList[i].Address + '-ETH">' + cellValue + '</a>'));
					}
                }
            }
			body.append(row$);
        }
    }

	
	let normalHeaders = {'Name': 1, 'Wallet':1, 'EtherDelta':1, 'Total':1, 'Value':1,'Type':1, 'Hash':1, 'Date':1};
    // Adds a header row to the table and returns the set of columns.
    // Need to do union of keys from all records as some records may not contain
    // all records.
    function addAllColumnHeaders(myList, selector, loaded, type) 
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
				if( !columnSet[key] && normalHeaders[key] ) 
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
	
	function toDateTimeNow()
	{
		var t = new Date();
		return formatDate(t);
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
}