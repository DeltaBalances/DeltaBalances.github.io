{
	var initiated = false;
	var autoStart = false;
	
    let table1Loaded = false;
	let table2Loaded = false;
    let columns;
	
	let blocktime = 17;

    let loadedED = 0;
    let loadedW = 0;
    let publicAddr = '';
    let config = undefined;

    let hideZero = true;
    let decimals = false;
    let remember = false;
    let lastResult = undefined;
	let lastResult2 = undefined;
	
	let trigger_1 = false;
	let trigger_2 = false;
	let running = false;

	let blocknum = -1;
	let startblock = 0;
	let endblock = 99999999
	let showTransactions = true;
	let maxtransoutput = 15;
	
	let transactionDays = 3;
	let walletWarningBalance = 0.005;
	
	
	let customTokens = [
		 { addr: '0x949bed886c739f1a3273629b3320db0c5024c719', name: 'AMIS', decimals: 9 },
	];
	
	let customPairs = [
		{ token: 'AMIS', base: 'ETH' },
	];
	
	
    let balances = { // init with placeholder data
        ETH: {
            'Name': 'ETH',
            'Wallet(8)': '0.00000000',
            'Wallet': '0.000',
            'EtherDelta(8)': '0.00000000',
            'EtherDelta': '0.000',
            'Total(8)': '0.00000000',
            'Total': '0.000'
        },
    }
	
	let transactionsPlaceholder = [
		{
			'Type': 'Placeholder',
			'Name': 'ETH',
			'Value': '0.000',
			'Value(8)': '0.00000000',
			'Hash': '0x00..',
			'Date': toDateTimeNow(),
			'TimeStamp': 0,
		}
	];
		

    $(document).ready(function() {	
		$('#error').hide();
		$('#hint').hide();
	
		//getEthPlorerTokens();
		
		// register enter press 
        $('#address').keypress(function(e) {
            if (e.keyCode == 13) {
                $('#refreshButton').click();
                return false;
            } else {
				$('#error').hide();
				return true;
			}
        });
		
		$('#loadingBalances').hide();
		$('#loadingTransactions').hide();
		// borrow some ED code for compatibility
        bundle.EtherDelta.startEtherDelta(() => 
		{	
			if(!autoStart)
			{
				bundle.utility.blockNumber(bundle.EtherDelta.web3, (err, num) => 
				{
					if(num)
					{
						blocknum = num;
						startblock = getStartBlock(blocknum, transactionDays);
					}
				});
			}
			//hacky import of etherdelta config
			if(module.exports)
			{
				bundle.EtherDelta.config.tokens = module.exports.tokens;
				bundle.EtherDelta.config.pairs = module.exports.pairs;
			}
			
			initiated = true;
			if(autoStart)
				myClick();
		});
        config = bundle.EtherDelta.config;
		
		
        hideZero = $('#zero').prop('checked');
        decimals = $('#decimals').prop('checked');
		document.getElementById('loading').innerHTML = "";

        getStorage();
		createSelect();
		
		$('#contractSelect').change(e => {
			bundle.EtherDelta.changeContract(e.target.selectedIndex, () => {});
		});
        placeholderTable();
        document.getElementById('addr').innerHTML = 'Enter your address to get started';
		
		// url parameter ?addr=0x...
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
				$('#address').val(addr);
				autoStart = true;
				// auto start loading
				myClick();
			}
		}

    });

	
/*	function getEthPlorerTokens()
	{
		console.log('start plorer');
		$.getJSON('https://api.ethplorer.io/getAddressInfo/0x8d12A197cB00D4747a1fe03395095ce2A5CC6819?apiKey=freekey', (result) => 
		{
			
			console.log('end plorer');
			if(result)
			{
				let ethbal = result.ETH.balance;
				let customTokens = [];
				for(var i = 0; i < result.tokens.length; i++)
				{
					let token = {
						addr: result.tokens[i].tokeninfo.address,
						name: result.tokens[i].tokeninfo.symbol,
						decimals: result.tokens[i].tokeninfo.decimals,
					}
					customTokens.push(token);
				}
			}
			
			console.log('parsed tokens');
			//.ETH.balance 
			//.tokens[]
					//.tokeninfo.address  .symbol .decimals
				//	.balance
		
		});
		
	} */
	
	function getStartBlock(blcknm, days)
	{
		startblock = blcknm - ((days * 24 * 60 * 60) / blocktime);
		return startblock;
	}
	
	function placeholderTable()
	{
        let result = Object.values(balances);
		makeTable(result, false);
		let result2 = transactionsPlaceholder;
		makeTable2(result2);
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
	
	let changeZero = false;
	// hide zero blance checkbox
    function checkZero() {
		changeZero = true;
        hideZero = $('#zero').prop('checked');
        if (lastResult) {
			//table1Loaded =  false;
            $('#resultTable tbody').empty();
            makeTable(lastResult, hideZero);
        } 
		changeZero = false;
    }

	// remember me checkbox
    function checkRemember() {
        remember = $('#remember').prop('checked');
        setStorage();
    }

	let changedDecimals = false;
	// more decimals checbox
    function checkDecimal() {
		changedDecimals = true;
        decimals = $('#decimals').prop('checked');
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

    // get balances button
    function myClick() {
		if(!initiated)
		{
			autoStart = true;
			return;
		}
		if(running)
			return;
		
		trigger_1 = false;
		trigger_2 = false;
		
		running = true;
        $('#errortext').html("");
		$('#error').hide();
		$('#hint').hide();

        $('#refreshButton').prop('disabled', true);
        $("#address").prop("disabled", true);
		
        console.log('start check');
        loadedW = 0; // wallet async load progress
        loadedED = 0; // etherdelta async load progress
		
		// validate address
        publicAddr = getAddress();
		
        if (publicAddr) 
		{	
			$('#loadingBalances').show();
			
			if(showTransactions)
			{
				$('#loadingTransactions').show();
				
				document.getElementById('loadingTx').innerHTML = "Retrieving transactions ..";
				$('#transactionsTable tbody').empty();
				if(blocknum >= 0)
				{
					console.log('blocknum re-used');
					endblock = 99999999;
					startblock = getStartBlock(blocknum, transactionDays);
					getTransactions();
				}
				else 
				{
					console.log("try blocknum v2");
					bundle.utility.blockNumber(bundle.EtherDelta.web3, (err, num) => 
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
			
			
			let directUrl = 'https://DeltaBalances.github.io/#' + publicAddr;
			$('#direct').html('Direct link: <a href="'  + directUrl + '">' + directUrl + '</a>');
			
			$('#resultTable tbody').empty();
			
            setStorage();
			
			
            document.getElementById('addr').innerHTML = 'Address: <a target="_blank" href="' + bundle.EtherDelta.addressLink(publicAddr) + '">' + publicAddr + '</a>';
			var icon = document.getElementById('addrIcon');
			icon.style.backgroundImage = 'url(' + blockies.create({ seed:publicAddr.toLowerCase() ,size: 8,scale: 16}).toDataURL()+')';
			
		
		  console.log('getting wallet balances');

			// request all balances
            document.getElementById('loading').innerHTML = "Retrieving balances...";
			
			document.getElementById('loading').innerHTML = "Retrieving Wallet & EtherDelta balances..";
            for (let i = 0; i < config.tokens.length; i++) 
			{
                let token = bundle.EtherDelta.config.tokens[i];
                balances[token.name] = {
                    Name: '<a target="_blank" href="https://etherdelta.github.io/#' + token.name + '-ETH">' + token.name + '</a>',
                    'Wallet(8)': Number(0).toFixed(8),
                    'Wallet': Number(0).toFixed(3),
                    'EtherDelta(8)': Number(0).toFixed(8),
                    'EtherDelta': Number(0).toFixed(3),
                };
				
                if (token.name === 'ETH') {
                    getEthBalanceW(publicAddr);
                    getTokenBalanceED(token, publicAddr);
                } else {
                    getTokenBalanceW(token, publicAddr);
                    getTokenBalanceED(token, publicAddr);
                }
            }
        } else {
            console.log('invalid input');
            $('#refreshButton').prop('disabled', false);
            $("#address").prop("disabled", false);
			$('#loadingBalances').hide();
			$('#loadingTransactions').hide();
			running = false;
        }
    }

	// check if input address is valid
    function getAddress(addr) 
	{
        let address = '';
        if (addr)
            address = addr;
        else
            address = document.getElementById('address').value;

        address = address.trim();
		
		//check if etherscan url
		if(address.indexOf('etherscan.io/address/') !== -1)
		{
			let parts = address.split('/');
			let lastSegment = parts.pop() || parts.pop();  // handle potential trailing slash
			if(lastSegment)
				address = lastSegment;
		}
		
        address = address.replace(/[^0-9a-z]/gi, '');
        if (address) {
            console.log('checking addr ' + address);
            address = address.toLowerCase();
            if (address.length == 64 && address.slice(0, 2) !== '0x') {
                if (!addr) // might be pkey
                {
                    $('#errortext').html("You likely entered your private key, NEVER do that again");
					$('#error').show();
                    // be nice and try generate the address
                    address = bundle.utility.generateAddress(address);
                    document.getElementById('address').value = address;
                }
            }

            if (address.slice(0, 2) !== '0x') {
                address = `0x${addr}`;
            }
            if (address.length !== 42) {
                if (!addr)
				{
                    $('#errortext').html("Invalid address, try again");
					$('#error').show();
				}
                return undefined;
            }
            address = bundle.utility.toChecksumAddress(address);
            if (bundle.EtherDelta.web3.isAddress(address)) {
                return address;
            }

        } else {
            if (!addr)
			{
                $('#errortext').html("Invalid address, try again");
				$('#error').show();
			}
        }
        return undefined;
    }

	// callback when balance request completes
    function finished() {
		
		//check if all requests are complete
        let count = config.tokens.length;
      
		// show progress
        if (loadedED < count || loadedW < count) {
          //  document.getElementById('loadingBalances').innerHTML = "Retrieving balances: Wallet (" + loadedW + '/' + count + ')  EtherDelta (' + loadedED + '/' + count + ')';
            return;
        }
        document.getElementById('loading').innerHTML = "";

		// get totals
        for (var i = 0; i < config.tokens.length; i++) {
            let token = config.tokens[i];
            let bal = balances[token.name];
            bal['Total(8)'] = (Number(bal['Wallet(8)']) + Number(bal['EtherDelta(8)'])).toFixed(8);
            bal['Total'] = Number(bal['Total(8)']).toFixed(3);
            balances[token.name] = bal;
        }

        let result = Object.values(balances);
        lastResult = result;
        setStorage();

		makeTable(result, hideZero);
		document.getElementById('contract').innerHTML ='The above data was retrieved from contract: <a target="_blank" href="'+ bundle.EtherDelta.addressLink(config.contractEtherDeltaAddr) + '">' + config.contractEtherDeltaAddr + '</a>';
		document.getElementById('loading').innerHTML = "Successfully retrieved all balances";
		
    }

	function makeTable(result, hideZeros)
	{
		let loaded = table1Loaded;
		if(changedDecimals)
			loaded = false;
		// optionally filter zero balances
        if (hideZeros) {

            let filtered = result.filter(x => {
                if (decimals) {
                    const filt = "0.00000000";
                    return x['Total(8)'] !== filt;
                } else {
                    const filt = "0.000";
                    return x['Total'] !== filt;
                }
            });
            buildHtmlTable('#resultTable', filtered, loaded, 'balances');
        } else {
            buildHtmlTable('#resultTable', result, loaded, 'balances');
        }
        trigger();
	}

	function makeTable2(result)
	{
		let loaded = table2Loaded;
		if(changedDecimals)
			loaded = false;
        buildHtmlTable('#transactionsTable', result, loaded, 'transactions');
        
        trigger2();
	}
	
	
    function getEthBalance(address, callback) {
        let url = `https://api.etherscan.io/api?module=account&action=balance&address=${  address   }&tag=latest`;

        $.getJSON(url, function(body) {
            const result = body; // {	status:1 , message: ok, result: }
            if (result) {
                const balance = new BigNumber(result.result);
                callback(false, balance);
            } else {
                callback(true, undefined);
            }
        });

    }

    function getTokenBalance(token, address, callback) {
        let url = `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${ token.addr }&address=${ address }&tag=latest`;

        $.getJSON(url, function(body) {
            const result = body; // {	status:1 , message: ok, result: }
            if (result) {
                const balance = new BigNumber(result.result);
                callback(false, balance);
            } else {
                callback(true, undefined);
            }
        });
    }

	// save address for next time
    function setStorage() {
        if (typeof(Storage) !== "undefined") {
            if (remember) {
                localStorage.setItem("member", 'true');
                if (publicAddr)
                    localStorage.setItem("address", publicAddr);
            } else if (!remember) {
                localStorage.removeItem('member');
                localStorage.removeItem('address');
            }

        } else {

        }
    }

    function getStorage() {
        if (typeof(Storage) !== "undefined") {

            remember = localStorage.getItem('member') && true;
            if (remember) {
                let addr = localStorage.getItem("address");
				if(addr)
				{
					addr = getAddress(addr);
					if (addr) {
						publicAddr = addr;
						document.getElementById('address').value = addr;
					}
				}
				$('#remember').prop('checked', true);
            }

        } else {
        }
    }



    // get wallet balance ETH
    function getEthBalanceW(address) {
        getEthBalance(address, (errBalance, resultBalance) => {
            if (!errBalance) {
                const balance = bundle.utility.weiToEth(resultBalance);
				if(balance < walletWarningBalance)
				{
					$('#hinttext').html('Your ETH balance in wallet is low, EtherDelta deposit/withdraw might fail due to gas costs');
					$('#hint').show();
				}
                balances['ETH']['Wallet(8)'] = Number(balance).toFixed(8);
                balances['ETH']['Wallet'] = Number(balance).toFixed(3);
            }
            loadedW++;
            finished();
        });
    }

	// get wallet balance tokens
    function getTokenBalanceW(token, address) {
        getTokenBalance(token, address, (errBalance, resultBalance) => {
            if (!errBalance) {
                const balance = bundle.utility.weiToEth(resultBalance, bundle.EtherDelta.getDivisor(token));
                //console.log("balance wallet eth " + balance);
                balances[token.name]['Wallet(8)'] = Number(balance).toFixed(8);
                balances[token.name]['Wallet'] = Number(balance).toFixed(3);
            }
            loadedW++;
            finished();
        });
    }

    // eth & tokens in etherdelta
    function getTokenBalanceED(token, address) {

        bundle.utility.call(bundle.EtherDelta.web3, bundle.EtherDelta.contractEtherDelta, config.contractEtherDeltaAddr, 'balanceOf', [token.addr, address],
            (err, result) => {
                if (!err) {
                    let availableBalance = bundle.utility.weiToEth(result, bundle.EtherDelta.getDivisor(token));
                    if (availableBalance) {
                        balances[token.name]['EtherDelta(8)'] = Number(availableBalance).toFixed(8);
                        balances[token.name]['EtherDelta'] = Number(availableBalance).toFixed(3);
                    }
                }
                loadedED++;
                finished();
            });
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
		$('#loadingBalances').hide();
		
        if(trigger_1 && (trigger_2 || !showTransactions))
		{
			$("#address").prop("disabled", false);
			$('#refreshButton').prop('disabled', false);
			
			running = false;
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
		$('#loadingTransactions').hide();
		
		if(trigger_1 && trigger_2)
		{
			$("#address").prop("disabled", false);
			$('#refreshButton').prop('disabled', false);
			running = false;
		}
        table2Loaded = true;
    }


    // Builds the HTML Table out of myList.
	function buildHtmlTable(selector, myList, loaded, type) {
        let body = $(selector +' tbody');
        columns = addAllColumnHeaders(myList, selector, loaded, type);
        
        for (var i = 0; i < myList.length; i++) 
		{
            let row$ = $('<tr/>');

            //if($.inArray(name, deltaNames) >= 0)
            {
                for (var colIndex = 0; colIndex < columns.length; colIndex++) {
                    let cellValue = myList[i][columns[colIndex]];
                    if (cellValue == null) cellValue = "";
                    row$.append($('<td/>').html(cellValue));
                }
            }
			body.append(row$);
        }
    }

	let normalHeaders = {'Name': 1, 'Wallet':1, 'EtherDelta':1, 'Total':1, 'Value':1,'Type':1, 'Hash':1, 'Date':1};
	let decimalHeaders = {'Name':1, 'Wallet(8)':1, 'EtherDelta(8)':1, 'Total(8)':1, 'Value(8)':1 ,'Type':1, 'Hash':1, 'Date':1};
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
                if (type === 'balances') 
				{
					if(!columnSet[key] && ( (decimals && decimalHeaders[key] ) || (!decimals && normalHeaders[key] ) )) 
					{
						columnSet[key] = 1;
						headerTr$.append($('<th/>').html(key));
					}
                }else if(type === 'transactions')
				{
					if(!columnSet[key]  && ( (decimals && decimalHeaders[key] ) || (!decimals && normalHeaders[key] ) )) 
					{
						columnSet[key] = 1;
						headerTr$.append($('<th/>').html(key));
					}
				}					
				else if(!columnSet[key] )
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
		var array = config.contractEtherDeltaAddrs.map(x => { return x.addr;});

		//Create and append select list
		var selectList = document.createElement("select");
		selectList.id = "contractSelect";
		var liveGroup = document.createElement("optgroup");
		liveGroup.label = "Active";
		var oldGroup = document.createElement("optgroup");
		oldGroup.label = "Outdated - withdraw funds";
		
		//Create and append the options
		for (var i = 0; i < array.length; i++) {
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
	
	

	
	
	
function getTransactions()
{
	let transLoaded = 0;
	let transResult = undefined;
	let inTransResult = undefined;
	
	//document.getElementById('loadingTx').innerHTML = "Retrieving transactions (0/2)";
	$.getJSON('https://api.etherscan.io/api?module=account&action=txlist&address=' + publicAddr + '&startblock=' + startblock + '&endblock=' + endblock + '&sort=desc', (result) => {
		if(result && result.status === '1')
			transResult = result.result;
		else //0 no trans found
			transResult = [];
		transLoaded++;
		if(transLoaded == 2)
			processTransactions();
		else
		{}//document.getElementById('loadingTx').innerHTML = "Retrieving transactions (1/2)";
	});
	
	// internal ether transactions (withdraw)
	$.getJSON('https://api.etherscan.io/api?module=account&action=txlistinternal&address=' + publicAddr + '&startblock=' + startblock + '&endblock=' + endblock + '&sort=desc', (result2) => {
		if(result2 && result2.status === '1')
			inTransResult = result2.result;
		else
			inTransResult = [];
		transLoaded++;
		if(transLoaded == 2)
			processTransactions();
		else
		{}//document.getElementById('loadingTx').innerHTML = "Retrieving transactions (1/2)";
	});
	
	
	function processTransactions()
	{
		//document.getElementById('loadingTx').innerHTML = "Processing transactions ..";
		
		let myAddr = publicAddr.toLowerCase();
		let contractAddr = config.contractEtherDeltaAddr.toLowerCase();
	
		let txs = transResult;
		let outputTransactions = [];
		
		let itxs = inTransResult; //withdraws
		let withdrawHashes = {};
		
		// internal tx, withdraws
		for(var i = 0; i < itxs.length; i++)
		{
			let tx = itxs[i];
			if(tx.from.toLowerCase() === contractAddr)
			{	
				let val = bundle.utility.weiToEth(Number(tx.value));
				let trans = createOutputTransaction('Withdraw', 'ETH', val, tx.hash, tx.timeStamp);
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
				if(val > 0 && txto === contractAddr)
				{
					let val2 = bundle.utility.weiToEth(val);
					let trans = createOutputTransaction('Deposit', 'ETH', val2, tx.hash, tx.timeStamp);
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
			
				let unpacked = bundle.utility.processInputMethod (bundle.EtherDelta.web3, bundle.EtherDelta.contractEtherDelta, tokens[l].input);
				if(unpacked && (unpacked.name === 'depositToken' || unpacked.name === 'withdrawToken'))
				{
					let token = bundle.EtherDelta.getToken(unpacked.params[0].value);
					if(token && token.addr)
					{
						let dvsr = bundle.EtherDelta.getDivisor(token.addr);
						let val = bundle.utility.weiToEth(unpacked.params[1].value, dvsr);
						let type = '';
						if(unpacked.name === 'withdrawToken')
						{
							type = 'Withdraw';
						}
						else
						{
							type = 'Deposit';
						}
						let trans = createOutputTransaction(type, token.name, val, tokens[l].hash, tokens[l].timeStamp);		
						outputTransactions.push(trans);
					}	
				}
			} else if(method === '0x278b8c0e') // cancel
			{
				/*
		
				Function: cancelOrder(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, uint8 v, bytes32 r, bytes32 s)
				MethodID: 0x278b8c0e
		
				*/
		
			} else
			{
				/*
				Function: trade(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, address user, uint8 v, bytes32 r, bytes32 s, uint256 amount)
				MethodID: 0x0a19b14a
				*/
			}
		} 
		
		// sort by timestamp descending
		outputTransactions.sort((a,b) => {b.val - a.val;});
		done();
					
		
		function createOutputTransaction(type, name, val, hash, timeStamp)
		{
			let t = type;
			let label = ''
			if(type === 'Deposit')
			{
				label = '<span class="label label-success">Deposit</span>';
			}
			else if(type === 'Withdraw')
			{
				label = '<span class="label label-danger">Withdraw</span>';
			}
			else {
				label = type;
			}
		
			return {
				'Type': label,
				'Name': '<a target="_blank" href="https://etherdelta.github.io/#' + name + '-ETH">' + name + '</a>',
				'Value': val.toFixed(3),
				'Value(8)': val.toFixed(8),
				'Hash': '<a target="_blank" href="https://etherscan.io/tx/' + hash + '">'+ hash.substring(0,8)  + '...</a><br>',
				'Date': toDateTime(timeStamp),
				'TimeStamp': timeStamp,
			};
		}
		
		function done()
		{
			
			document.getElementById('loadingTx').innerHTML = "Transactions retrieved";
			let txs = Object.values(outputTransactions);
			lastResult2 = txs;
			
			makeTable2(txs);
		}
	}
}


	
	function toDateTime(secs)
	{
		var utcSeconds = secs;
		var d = new Date(0);
		d.setUTCSeconds(utcSeconds);
		return d.toLocaleString('en-En',{month: "long", day: "numeric", hour: 'numeric', minute: 'numeric'});
	}
	
	function toDateTimeNow()
	{
		var t = new Date();
		return t.toLocaleString('en-En',{month: "long", day: "numeric", hour: 'numeric', minute: 'numeric'});
	}

	
}