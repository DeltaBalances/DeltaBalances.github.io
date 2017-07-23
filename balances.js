{
    let tableLoaded = false;
    let columns;

    let loadedED = 0;
    let loadedW = 0;
    let publicAddr = '';
    let config = undefined;

    let hideZero = true;
    let decimals = false;
    let remember = false;
    let lastResult = undefined;

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
		



		// borrow some ED code for compatibility
        bundle.EtherDelta.startEtherDelta(0);
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
		
		// url parameter ?addr=
		let addr = getParameterByName('addr');
		if(addr)
		{
			addr = getAddress(addr);
			if(addr)
			{
				$('#address').val(addr);
			}
		}

    });

	function placeholderTable()
	{
        let result = Object.values(balances);
		makeTable(result, false);
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
        hideZero = $('#zero').prop('checked')
        if (lastResult) {
            $('#resultTable tbody').empty();
            finished();
        } 
    }

	// remember me checkbox
    function checkRemember() {
        remember = $('#remember').prop('checked')
        setStorage();
    }

	// more decimals checbox
    function checkDecimal() {
        decimals = $('#decimals').prop('checked')
		$('#resultTable tbody').empty();
        $('#resultTable thead').empty();
        tableLoaded = false;
        if (lastResult) {
           makeTable(lastResult, hideZero, true);
        } else {
			placeholderTable();
		}
    }

    // get balances button
    function myClick() {
		
        document.getElementById('errortext').innerHTML = "";

        $('#refreshButton').prop('disabled', true);
        $("#address").prop("disabled", true);
		
        console.log('start check');
        loadedW = 0; // wallet async load progress
        loadedED = 0; // etherdelta async load progress
		
		// validate address
        publicAddr = getAddress();
		
        if (publicAddr) {

			
			
			$('#resultTable tbody').empty();
			
            setStorage();
            document.getElementById('addr').innerHTML = '<a target="_blank" href="' + bundle.EtherDelta.addressLink(publicAddr) + '">' + publicAddr + '</a>';
            console.log('getting wallet balances');

			// request all balances
            document.getElementById('loading').innerHTML = "Retrieving balances...";
			
            for (let i = 0; i < config.tokens.length; i++) {
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
        }
    }

	// check if input address is valid
    function getAddress(addr) {
        let address = '';
        if (addr)
            address = addr;
        else
            address = document.getElementById('address').value;

        address = address.trim();
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
            document.getElementById('loading').innerHTML = "Retrieving balances: Wallet (" + loadedW + '/' + count + ')  EtherDelta (' + loadedED + '/' + count + ')';
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

	function makeTable(result, hideZeros, loaded)
	{
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
            buildHtmlTable('#resultTable', filtered);
        } else {
            buildHtmlTable('#resultTable', result);
        }
		if(loaded)
			tableLoaded = true;
		// final callback to sort table
        trigger();
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
                addr = getAddress(addr);
                if (addr) {
                    publicAddr = addr;
                    document.getElementById('address').value = addr;
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
    function trigger() {
        var maxCol = $('table thead th').length - 1;

        if (tableLoaded) // reload existing table
        {

            $("table").trigger("updateAll", [true, () => {}]);
			$("table thead th").data("sorter", true);
			//$("table").trigger("sorton", [[0,0]]);
            
        } else {
			
            $("table thead th").data("sorter", true);

            $("table").tablesorter({
                sortList: [[0, 0]]
            });

            tableLoaded = true;
        }
        $("#address").prop("disabled", false);
        $('#refreshButton').prop('disabled', false);
        tableLoaded = true;
    }




    // Builds the HTML Table out of myList.
    function buildHtmlTable(selector, myList) {
        let body = $('table tbody');
        if (!tableLoaded) {
            columns = addAllColumnHeaders(myList, selector);
        }

        for (var i = 0; i < myList.length; i++) {

            let row$ = $('<tr/>');


            //if($.inArray(name, deltaNames) >= 0)
            {
                for (var colIndex = 0; colIndex < columns.length; colIndex++) {
                    let cellValue = myList[i][columns[colIndex]];
                    if (cellValue == null) cellValue = "";
                    row$.append($('<td/>').html(cellValue));
                }
                body.append(row$);
            }
        }
    }

	let normalHeaders = ['Name', 'Wallet', 'EtherDelta', 'Total'];
	let decimalHeaders = ['Name', 'Wallet(8)', 'EtherDelta(8)', 'Total(8)'];
    // Adds a header row to the table and returns the set of columns.
    // Need to do union of keys from all records as some records may not contain
    // all records.
    function addAllColumnHeaders(myList, selector) {
        let columnSet = [];
        let header1 = $('table thead');
        let headerTr$ = $('<tr/>');

        for (var i = 0; i < myList.length; i++) {
            let rowHash = myList[i];
            for (var key in rowHash) {
                if ($.inArray(key, columnSet) == -1 && ( (decimals && $.inArray(key, decimalHeaders) >= 0 ) || (!decimals && $.inArray(key, normalHeaders) >= 0 ) )) {
                    columnSet.push(key);
                    headerTr$.append($('<th/>').html(key));
                }
            }
        }
        header1.append(headerTr$);
        $(selector).append(header1);
        return columnSet;
    }
	
	function createSelect()
	{
		var div = document.getElementById("selectDiv");

		//Create array of options to be added
		var array = config.contractEtherDeltaAddrs.map(x => { return x.addr + " " + x.info;});

		//Create and append select list
		var selectList = document.createElement("select");
		selectList.id = "contractSelect";
		div.appendChild(selectList);

		//Create and append the options
		for (var i = 0; i < array.length; i++) {
			var option = document.createElement("option");
			option.value = i;
			option.text = array[i];
			selectList.appendChild(option);
		}
		selectList.selectedIndex = 0;
		
	}
}