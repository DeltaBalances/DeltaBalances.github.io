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
	
		// register enter press 
        $('#address').keypress(function(e) {
            if (e.keyCode == 13) {
                $('#refreshButton').click();
                return false;
            } else {
				document.getElementById('errortext').innerHTML = "";
				return true;
			}
        });
		
		$('#loadingIndicator').hide();
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
						startblock = num - 16000; // roughly 3 days back;
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
        document.getElementById('errortext').innerHTML = "";

        getStorage();
		createSelect();
		
		$('#contractSelect').change(e => {
			bundle.EtherDelta.changeContract(e.target.selectedIndex, () => {});
		});
        placeholderTable();
        document.getElementById('addr').innerHTML = 'Start by entering your public address';
		
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

	function placeholderTable()
	{
        let result = Object.values(balances);
		makeTable(result, false);
		let result2 = transactionsPlaceholder;
		makeTable2(result2);
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
	
	// hide zero blance checkbox
    function checkZero() {
        hideZero = $('#zero').prop('checked');
        if (lastResult) {
            $('#resultTable tbody').empty();
            finished();
        } 
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
           makeTable(lastResult, hideZero);
		   makeTable2(lastResult2.slice(0,maxtransoutput));
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
		$('#loadingIndicator').show();
		
		running = true;
        document.getElementById('errortext').innerHTML = "";

        $('#refreshButton').prop('disabled', true);
        $("#address").prop("disabled", true);
		
        console.log('start check');
        loadedW = 0; // wallet async load progress
        loadedED = 0; // etherdelta async load progress
		
		// validate address
        publicAddr = getAddress();
		
        if (publicAddr) 
		{	
			if(showTransactions)
			{
				document.getElementById('loadingTx').innerHTML = "Retrieving transactions ..";
				$('#transactionsTable tbody').empty();
				if(blocknum >= 0)
				{
					console.log('blocknum re-used');
					endblock = 99999999;
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
							startblock = num - 16000; // roughly 3 days back;
						}
						getTransactions();
					});
				}
			}
			
			
			let directUrl = 'https://DeltaBalances.github.io/#' + publicAddr;
			$('#direct').html('Direct link: <a href="'  + directUrl + '">' + directUrl + '</a>');
			
			$('#resultTable tbody').empty();
			
            setStorage();
            document.getElementById('addr').innerHTML = '<a target="_blank" href="' + bundle.EtherDelta.addressLink(publicAddr) + '">' + publicAddr + '</a>';
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
			$('#loadingIndicator').hide();
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
                    document.getElementById('errortext').innerHTML = "You likely entered your private key, NEVER do that again";
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
                    document.getElementById('errortext').innerHTML = "This address is invalid, try again";
                return undefined;
            }
            address = bundle.utility.toChecksumAddress(address);
            if (bundle.EtherDelta.web3.isAddress(address)) {
                return address;
            }

        } else {
            if (!addr)
                document.getElementById('errortext').innerHTML = "This address is invalid, try again";
        }
        return undefined;
    }

	// callback when balance request completes
    function finished() {
		
		//check if all requests are complete
        let count = config.tokens.length;
      
		// show progress
        if (loadedED < count || loadedW < count) {
            //document.getElementById('loading').innerHTML = "Retrieving balances: Wallet (" + loadedW + '/' + count + ')  EtherDelta (' + loadedED + '/' + count + ')';
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
            $("#resultTable").trigger("updateAll", [true, () => {}]);
			$("#resultTable thead th").data("sorter", true);
			//$("table").trigger("sorton", [[0,0]]);
            
        } else 
		{
            $("#resultTable thead th").data("sorter", true);
            $("#resultTable").tablesorter({
                sortList: [[0, 0]]
            });

            table1Loaded = true;
        }
		trigger_1 = true;
		
        if(trigger_1 && trigger_2)
		{
			$("#address").prop("disabled", false);
			$('#refreshButton').prop('disabled', false);
			$('#loadingIndicator').hide();
			running = false;
		}
        table1Loaded = true;
    }

    // final callback to sort table
    function trigger2() 
	{
        if (table2Loaded) // reload existing table
        {
            $("#transactionsTable").trigger("updateAll", [true, () => {}]);
			$("#transactionsTable thead th").data("sorter", true);
			//$("table").trigger("sorton", [[0,0]]);
            
        } else 
		{
            $("#transactionsTable thead th").data("sorter", true);
            $("#transactionsTable").tablesorter({
                sortList: [[4, 1]]
            });

            table2Loaded = true;
        }
		trigger_2 = true;
		if(trigger_1 && trigger_2)
		{
			$("#address").prop("disabled", false);
			$('#refreshButton').prop('disabled', false);
			$('#loadingIndicator').hide();
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

	let normalHeaders = ['Name', 'Wallet', 'EtherDelta', 'Total', 'Value','Type', 'Hash', 'Date'];
	let decimalHeaders = ['Name', 'Wallet(8)', 'EtherDelta(8)', 'Total(8)', 'Value(8)' ,'Type', 'Hash', 'Date'];
    // Adds a header row to the table and returns the set of columns.
    // Need to do union of keys from all records as some records may not contain
    // all records.
    function addAllColumnHeaders(myList, selector, loaded, type) 
	{
        let columnSet = [];
		
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
					if($.inArray(key, columnSet) == -1 && ( (decimals && $.inArray(key, decimalHeaders) >= 0 ) || (!decimals && $.inArray(key, normalHeaders) >= 0 ) )) 
					{
						columnSet.push(key);
						headerTr$.append($('<th/>').html(key));
					}
                }else if(type === 'transactions')
				{
					if($.inArray(key, columnSet) == -1 && ( (decimals && $.inArray(key, decimalHeaders) >= 0 ) || (!decimals && $.inArray(key, normalHeaders) >= 0 ) )) 
					{
						columnSet.push(key);
						headerTr$.append($('<th/>').html(key));
					}
				}					
				else if($.inArray(key, columnSet) == -1)
				{
					columnSet.push(key);
                    headerTr$.append($('<th/>').html(key));
				}
            }
        }
		if(!loaded)
		{
			header1.append(headerTr$);
			$(selector).append(header1);
		}
        return columnSet;
    }
	
	
	// contract selector
	function createSelect()
	{
		var div = document.getElementById("selectDiv");

		//Create array of options to be added
		var array = config.contractEtherDeltaAddrs.map(x => { return x.addr + " " + x.info;});

		//Create and append select list
		var selectList = document.createElement("select");
		selectList.id = "contractSelect";

		//Create and append the options
		for (var i = 0; i < array.length; i++) {
			var option = document.createElement("option");
			option.value = i;
			option.text = array[i];
			selectList.appendChild(option);
		}
		div.appendChild(selectList);
		selectList.selectedIndex = 0;
		
	}
	
	

	
	
	
function getTransactions()
{
	
	let transLoaded = 0;
	let transResult = undefined;
	let inTransResult = undefined;
	
	document.getElementById('loadingTx').innerHTML = "Retrieving transactions (0/2)";
	$.getJSON('http://api.etherscan.io/api?module=account&action=txlist&address=' + publicAddr + '&startblock=' + startblock + '&endblock=' + endblock + '&sort=desc', (result) => {
		if(result && result.status === '1')
			transResult = result.result;
		transLoaded++;
		if(transLoaded == 2)
			processTransactions();
		else
			document.getElementById('loadingTx').innerHTML = "Retrieving transactions (1/2)";
	});
	
	// internal ether transactions (withdraw)
	$.getJSON('http://api.etherscan.io/api?module=account&action=txlistinternal&address=' + publicAddr + '&startblock=' + startblock + '&endblock=' + endblock + '&sort=desc', (result2) => {
		if(result2 && result2.status === '1')
			inTransResult = result2.result;
		transLoaded++;
		if(transLoaded == 2)
			processTransactions();
		else
			document.getElementById('loadingTx').innerHTML = "Retrieving transactions (1/2)";
	});
	
	
	function processTransactions()
	{
		document.getElementById('loadingTx').innerHTML = "Processing transactions ..";
	
		let myAddr = publicAddr.toLowerCase();
		let contractAddr = config.contractEtherDeltaAddr.toLowerCase();
	
		let txs = transResult;
		
		let itxs = inTransResult; //withdraws
		let withdrawHashes = itxs.map((itx) => { return itx.hash.toLowerCase();});
		
		let tokens = [];
		let outputTransactions = [];
		
		for(var i =0; i < txs.length; i++)
		{
			let tx = txs[i];
			if(tx.isError === '0')
			{
				let val = Number(tx.value);
				let txto = tx.to.toLowerCase();
				if(val > 0 )
				{
					if(txto === contractAddr) // deposit eth
					{
						let val2 = bundle.utility.weiToEth(val);
						let trans = createOutputTransaction('Deposit', 'ETH', val2, tx.hash, tx.timeStamp);
						outputTransactions.push(trans);
					}
				}
				else if(val == 0) 
				{
					if($.inArray(tx.hash, withdrawHashes) < 0) // exclude withdraws
					{
						tokens.push(tx); //withdraw, deposit & trade, & cancel
					}
				}
			}
		}
		
		//withdraws
		for(var i = 0; i < itxs.length; i++)
		{
			let tx = itxs[i];
			let val = bundle.utility.weiToEth(Number(tx.value));
			let trans = createOutputTransaction('Withdraw', 'ETH', val, tx.hash, tx.timeStamp);
			outputTransactions.push(trans);
		}
		
		for(var l = 0; l < tokens.length; l++)
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
					if(unpacked.name === 'depositToken')
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
		} 
		
		for(var k = 0; k < outputTransactions.length; k++)
		{
			let tx = outputTransactions[k];
			tx.Hash = '<a href="https://etherscan.io/tx/' + tx.Hash + '">'+ tx.Hash.substring(0,8)  + '...</a><br>';
		}
		
		// sort by timestamp descending
		outputTransactions.sort((a,b) => {Number(b.val) - Number(a.val);});
		done();
					
		
		function createOutputTransaction(type, name, val, hash, timeStamp)
		{
			return {
				'Type': type,
				'Name': name,
				'Value': val.toFixed(3),
				'Value(8)': val.toFixed(8),
				'Hash': hash,
				'Date': toDateTime(timeStamp),
				'TimeStamp': timeStamp,
			};
		}
		
		function done()
		{
			document.getElementById('loadingTx').innerHTML = "Transactions retrieved";
			let txs = Object.values(outputTransactions);
			lastResult2 = txs;
			
			makeTable2(txs.slice(0,maxtransoutput));
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