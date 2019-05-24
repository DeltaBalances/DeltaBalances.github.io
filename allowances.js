// made by butchering balances.js, TODO remove duplicate code

var isAddressPage = true;
var pageType = 'allowance';
{
    // shorthands
    var _delta = bundle.DeltaBalances;
    var _util = bundle.utility;

    // initiation
    var initiated = false;
    var autoStart = false;

    var web3Index = 0;  //last used web3 instance

    var requestID = 0;

    // loading states
    var table1Loaded = false;
    var progressTableLoaded = false;
    var allowanceTable = undefined;
    var progressTable = undefined;
    var tableHeaders = [];

    var exchanges =
    {
        '0x Protocol v1': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts['0xProxy'].addr
        },
        '0x Protocol v2': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts['0xProxy2'].addr
        },
        'AirSwap': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.AirSwap.addr
        },
        'ETHEX': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.Ethex.addr
        },
        'Ethfinex': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.EthfinexProxy.addr
        },
		/*
		'OasisDex': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.OasisDex.addr
        },*/
        'EtherDelta': {
            enabled: false,
            loaded: 0, //async loading progress, number of tokens
            displayed: 0, //async loading progress, number of tokens
            contract: _delta.config.exchangeContracts.EtherDelta.addr
        },
        'IDEX': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.Idex.addr
        },
        'Token store': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.TokenStore.addr
        },
        'DDEX': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.DDEXproxy.addr
        },
        'Switcheo': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.Switcheo.addr
        },
        'Enclaves': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.Enclaves.addr
        },
        'SingularX': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.Singularx.addr
        },
        'EtherC': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.EtherC.addr
        },
        'Decentrex': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.Decentrex.addr
        },
        'Ethen': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.Ethen.addr
        },
        'DEXY': {
            enabled: false,
            loaded: 0,
            displayed: 0,
            contract: _delta.config.exchangeContracts.Dexy.addr
        },
    };

    var trigger_1 = false;
    var running = false;
    var runningCustom = false;
    var runningListed = false;

    // settings
    var hideZero = true;
    var decimals = false;
    var fixedDecimals = 3;

    var showCustomTokens = false;
    var showListed = true;
    var showSpam = false;


    // user input & data
    /* publicAddr, savedAddr, metamaskAddr  moved to user.js */
    var lastResult = undefined;

    // config
    var tokenCount = 0; //auto loaded
    var blocknum = -1;

    var allowances = {};

    initAllowance({ "name": 'ETH', "addr": "0x0000000000000000000000000000000000000000", "unlisted": false });
    // placeholder
    var allowancesPlaceholder = allowances;

    init();

    $(document).ready(function () {
        readyInit();
    });

    //initialize independent of html dom
    function init() {
        _delta.initTokens(true);
        tokenCount = getTokenCount();

        _delta.startDeltaBalances(true, () => {
            _delta.initTokens(true); // do it again in case a token listed loaded very quickly (don't wait for them)
            tokenCount = getTokenCount();
            initiated = true;
            if (autoStart)
                myClick();
        });
    }

    // initialize on page ready
    function readyInit() {

        //get metamask address as possbile input (if available)
        requestMetamask(false);
        getStorage();

        $('#decimals').prop('checked', decimals);

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

        $('#exchangeDropdown').on('hidden.bs.select', function (e) {
            var selected = []
            selected = $('#exchangeDropdown').val()

            // array of exchange names
            setTimeout(function () {
                checkExchange(selected);
            }, 150);

        });

        //set exchange dropdown
        let dropdownVal = [];
        Object.keys(exchanges).forEach(function (key) {
            if (exchanges[key].enabled) {
                dropdownVal.push(key);
            }
        });
        $('#exchangeDropdown').selectpicker('val', dropdownVal);


        resetExLoadingState();
		/*Object.keys(exchanges).forEach(function (key) {
			initExchangeBox(key);
		}); */

        placeholderTable();
        setAllowanceProgress();

        // url parameter ?addr=0x... /#0x..
        var addr = ''
        if (!addr) {
            var hash = window.location.hash;  // url parameter /#0x...
            if (hash)
                addr = hash.slice(1);
        }
        if (addr) {
            addr = getAddress(addr);
            if (addr) {
                publicAddr = addr;
            }
        }
        if (publicAddr) {
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
        else {
            _delta.connectSocket();
            $('#userToggle').addClass('hidden');
            $('#address').focus();
        }
        if (autoStart && !initiated) {
            showLoading(true);
            if (table1Loaded && allowanceTable) {
                allowanceTable.clear().draw();
            }
        }
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

	/*function initExchangeBox(name) {

		let name2 = name;
		if (name2 == 'Token store')
			name2 = 'store';
		let id = '#' + name2;
		let boxId = id + 'Box';

		let enabled = $(id).prop('checked');
		if (enabled != exchanges[name].enabled) {
			$(id).prop("checked", exchanges[name].enabled);
		}
		
     } */

    function checkExchange(selected) {
        let changed = false;
        let requiresLoading = false;

        let keys = Object.keys(exchanges);
        let numEnabled = 0;

        for (let i = 0; i < keys.length; i++) {
            let name = keys[i];

            let enabled = false;
            if (selected.length > 0 && selected.indexOf(name) !== -1) {
                enabled = true;
                numEnabled++;
            }

            if (exchanges[name].enabled !== enabled) {
                changed = true;

                if (lastResult) {

                    if (enabled && exchanges[name].loaded < tokenCount) {
                        requiresLoading = true;
                    }
                } else if (enabled) {
                    requiresLoading = true;
                }
            }
            exchanges[name].enabled = enabled;
            allowanceHeaders[name] = exchanges[name].enabled;
        }

        if (changed) {
            setAllowanceProgress(true);
            setStorage();
        }

        if ((!changed && !lastResult)) {
            remakeEmpty();
        }
        else if (changed) {
            if (!requiresLoading) {
                finishedAllowanceRequest();
            } else if (lastResult) {
                getAllowances(true, false);
            } else if (!lastResult && numEnabled > 0) {
                getAllowances(false, false);
            }
        }

        function remakeEmpty() {

            resetExLoadingState();
            placeholderTable();
            setAllowanceProgress();
        }
    }

    // zero allowances checkbox
    var changeZero = false;
    function checkZero() {
        changeZero = true;
        hideZero = $('#zero').prop('checked');
        if (lastResult) {
            finishedAllowanceRequest();
        }
        changeZero = false;
        setStorage();
    }

    // more decimals checbox
    var changedDecimals = false;
    function checkDecimal() {
        changedDecimals = true;
        decimals = $('#decimals').prop('checked');

        fixedDecimals = decimals ? 8 : 3;
        if (lastResult) {
            finishedAllowanceRequest();
        } else {
            placeholderTable();
        }
        changedDecimals = false;
        setStorage();
    }


    function checkSpam() {
        let newSpam = $('#showSpam').prop('checked');
        if (newSpam !== showSpam) {
            showSpam = newSpam;
            if (showCustomTokens) {
                if (lastResult) {
                    finishedAllowanceRequest();
                } else if (!running) {
                    placeholderTable();
                }
            }
        }
    }

    function checkListing() {
        let showCustomTokens2 = $('#showUnlisted').prop('checked');
        if (showCustomTokens && !showCustomTokens2) { // turn unlisted off
            if (table1Loaded) {
                $('#showSpam').bootstrapToggle('destroy');
            }
        } else if (!showCustomTokens && showCustomTokens2) { //turn unlisted on
            if (table1Loaded) {
                $('#showSpam').bootstrapToggle();
            }
        }
        showCustomTokens = showCustomTokens2;
        showListed = $('#showListed').prop('checked');
        if (!running) {
            tokenCount = getTokenCount();
            setAllowanceProgress();
        }

        setStorage();

        let loadedCustom = true;
        let loadedListed = true;
        Object.keys(exchanges).forEach(function (name) {
            if (exchanges[name].enabled) {
                if (!exchanges[name].completedUnlisted)
                    loadedCustom = false;
                if (!exchanges[name].completedListed)
                    loadedListed = false;
            }
        });

        //slightly delay to allow toggle to animate
        setTimeout(function () {
            if (lastResult && !running) {
                if (loadedCustom && loadedListed) { // we already have all data
                    finishedAllowanceRequest();
                } else if (loadedListed && !showCustomTokens) { // we already have all (non unlisted) data
                    finishedAllowanceRequest();
                } else if (showCustomTokens && !loadedCustom && (!showListed || loadedListed)) {
                    getAllowances(false, true); // load only unlisted tokens
                } else {  // just load everything
                    getAllowances(false, false);
                }
            } else if (running) {
                //clicked when never finished loading yet, and settings are different, just reload everything
                if ((!runningCustom && showCustomTokens) || (!runningListed && showListed)) {
                    getAllowances(false, false);
                }
            }
        }, 110);
        return;
    }

    function getTokenCount() {
        let listed = _delta.config.tokens.length;
        let unlisted = _delta.config.customTokens.length - listed;
        let currentcount = 0;
        if (showCustomTokens) {
            currentcount += unlisted;
        }
        if (showListed) {
            currentcount += listed;
        }
        if (currentcount == 0) {
            currentcount = 1; //load only ETH
        }
        //$('#tokencount').html(" " + currentcount + "/" + maxcount);
        return currentcount;
    }

    function disableInput(disable) {
        $('#refreshButton').prop('disabled', disable);
        // $("#address").prop("disabled", disable);
        $("#loadingBalances").prop("disabled", disable);
        $("#tablesearcher").prop("disabled", disable);
        $("#showListed").prop("disabled", disable);
        $("#showUnlisted").prop("disabled", disable);
        $("#showSpam").prop("disabled", disable);

        if (disable)
            $('#loadingBalances').addClass('dim');
        else
            $('#loadingBalances').removeClass('dim');
    }

    function showLoading(allowance) {
        if (allowance) {
            $('#loadingBalances').addClass('fa-spin');
            $('#loadingBalances').addClass('dim');
            $('#loadingBalances').prop('disabled', true);
            $('#loadingBalances').show();
            $('#refreshButtonLoading').show();
            $('#refreshButtonSearch').hide();
            $('#overviewOverlay').removeClass('hidden-xs');
            $('#overviewOverlay').removeClass('hidden-sm');
        }
        $("#tablesearcher").prop("disabled", allowance);

		/*if (!allowance) {
			$('#refreshButtonLoading').hide();
			$('#refreshButtonSearch').show();
		} */
    }

    function buttonLoading(allowance) {
        if (!publicAddr) {
            hideLoading(allowance);
            return;
        }
        if (allowance) {
            $('#loadingBalances').removeClass('fa-spin');
            $('#loadingBalances').removeClass('dim');
            $('#loadingBalances').prop('disabled', false);
            $('#loadingBalances').show();
            $('#refreshButtonLoading').hide();
            $('#refreshButtonSearch').show();
        }
    }

    function hideLoading(allowance) {
        if (!publicAddr) {
            allowance = true;
        }
        $("#tablesearcher").prop("disabled", !allowance);
        if (allowance) {
            $('#loadingBalances').removeClass('fa-spin');
            $('#refreshButtonLoading').hide();
            $('#refreshButtonSearch').show();
            $('#overviewOverlay').addClass('hidden-xs');
            $('#overviewOverlay').addClass('hidden-sm');
        }
    }

    function myClick() {

        if (!initiated) {
            autoStart = true;
            return;
        }

        hideError();
        hideHint();
        //disableInput(true);
        $('#downloadBalances').html('');

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

    function getAll(autoload) {
        trigger_1 = true;

        lastResult = undefined;

        if (publicAddr) {
            setStorage();
            window.location.hash = publicAddr;
            getAllowances(false, false);
        } else {
            running = false;
        }
    }

    function resetExLoadingState() {

        function setLoad(name) {
            exchanges[name].loaded = exchanges[name].enabled ? 0 : -1;
            exchanges[name].displayed = !exchanges[name].enabled;
            allowanceHeaders[name] = exchanges[name].enabled;
            exchanges[name].loadedUnlisted = 0;
            exchanges[name].completedUnlisted = false;
            exchanges[name].loadedListed = 0;
            exchanges[name].completedListed = false;
        }

        Object.keys(exchanges).forEach(function (key) {
            setLoad(key);
        });
    }

    function appendExLoadingState() {

        function setLoad(name) {
            if (exchanges[name].enabled) {
                exchanges[name].loaded = 0;
                if (showCustomTokens)
                    exchanges[name].loaded += exchanges[name].loadedUnlisted;
                if (showListed || (!showListed && !showCustomTokens))
                    exchanges[name].loaded += exchanges[name].loadedListed;
            } else {
                exchanges[name].loaded = -1;
            }
            exchanges[name].displayed = !exchanges[name].enabled;
            //	if(!addCustom) {

            //	} else {

            //	}
            //	if (exchanges[name].enabled && ((addCustom && exchanges[name].loaded >= _delta.config.tokens.length) || (!addCustom && exchanges[name].loaded >= tokenCount))) {
            //		exchanges[name].displayed = false;
            //	} else {
            //		exchanges[name].loaded = exchanges[name].enabled ? 0 : -1;

            //	}
            allowanceHeaders[name] = exchanges[name].enabled;
        }

        Object.keys(exchanges).forEach(function (key) {
            setLoad(key);
        });
    }

    function getAllowances(appendExchange, appendCustom) {
        if (!publicAddr)
            return;

        let numEnabled = 0;
        Object.values(exchanges).map((x) => {
            if (x.enabled) {
                numEnabled++;
            }
        });
        if (numEnabled == 0) {
            disableInput(false);
            hideLoading(true);
            running = false;
            buttonLoading(true);
            return;
        }

        hidePopovers();


        requestID++;
        running = true;
        runningListed = showListed;
        runningCustom = showCustomTokens;

        let rqid = requestID;

        //		if (!trigger_1)
        //			return;

        let loadedCustom = true;
        let loadedListed = true;
        Object.keys(exchanges).forEach(function (name) {
            if (exchanges[name].enabled) {
                if (!exchanges[name].completedUnlisted)
                    loadedCustom = false;
                if (!exchanges[name].completedListed)
                    loadedListed = false;
            }
        });

        if (!appendExchange && !appendCustom && !(lastResult && showListed && !loadedListed)) {
            allowances = {};
        }


        $('#downloadBalances').html('');

        trigger_1 = false;
        //disableInput(true);

        showLoading(true);

        if (!appendExchange && !appendCustom)
            resetExLoadingState();
        else
            appendExLoadingState();

        tokenCount = getTokenCount();

        let logcount = tokenCount;
        if (appendCustom)
            logcount -= _delta.config.tokens.length;
        console.log('preparing to retrieve allowances for ' + logcount + ' tokens');



        setAllowanceProgress();
        if (table1Loaded) {
            allowanceTable.clear();
            for (let i = 0; i < tableHeaders.length; i++) {
                let enabled = allowanceHeaders[tableHeaders[i].title];
                let column = allowanceTable.column(i).visible(enabled);
            }
            //allowanceTable.columns.adjust().relayout().draw();
            allowanceTable.draw();
        }


        if (!appendExchange && !appendCustom) {
            for (let i = 0; i < _delta.config.customTokens.length; i++) {
                let token = _delta.config.customTokens[i];
                if (token && !allowances[token.addr])
                    initAllowance(token);
            }
        }

        //getAllAllowances(rqid, 'All');
        Object.keys(exchanges).forEach(function (key) {
            if (exchanges[key].enabled && exchanges[key].loaded < tokenCount) {
                getAllAllowances(rqid, key, appendCustom);
            }
        });
    }

    function initAllowance(tokenObj) {
        let obj = {
            Name: tokenObj.name,
        };

        let exs = Object.keys(exchanges);
        for (let i = 0; i < exs.length; i++) {
            obj[exs[i]] = 0;
        }

        let obj1 = {
            Total: 0,
            Unlisted: tokenObj.unlisted,
            Address: tokenObj.addr,
        };

        allowances[tokenObj.addr] = Object.assign({}, obj, obj1);
    }

    var maxPerRequest = 500;   // don't make the web3 requests too large
    function getAllAllowances(rqid, mode, addCustom) {

        // select which tokens to be requested
        var tokens2 = _delta.config.customTokens;
        if (addCustom && showCustomTokens) {
            tokens2 = tokens2.filter((x) => { return x.unlisted; }); // only custom tokens
        } else if (!showCustomTokens && showListed) {
            tokens2 = tokens2.filter((x) => { return !x.unlisted; }); // only listed tokens
        } else if (!showCustomTokens && !showListed) {
            tokens2 = [_delta.config.tokens[0]]; // only ETH
        }

        tokens2 = tokens2.map((x) => { return x.addr; });

        //split in separate requests to match maxPerRequest
        for (var i = 0; i < tokens2.length; i += maxPerRequest) {
            allAllowances(i, i + maxPerRequest, tokens2, i);
        }

        // make the call to get allowances for a (sub)section of tokens
        function allAllowances(startIndex, endIndex, tokens3, allowanceRequestIndex) {

            var tokens = tokens3.slice(startIndex, endIndex);

            var functionName = 'tokenAllowances';
            var arguments = [exchanges[mode].contract, publicAddr, tokens];

            var completed = 0;
            var success = false;
            var totalTries = 0;

            //get allowances from 2 web3 sources at once, use the fastest response
            // web3 provider (infura, myetherapi, mycryptoapi) or etherscan
            makeCall(mode, functionName, arguments, 0);
            makeCall(mode, functionName, arguments, 0);

            function makeCall(exName, funcName, args, retried) {

                if (web3Index < _delta.web3s.length) {
                    web3Provider = _delta.web3s[web3Index];
                    web3Index++;
                } else {
                    web3Provider = undefined;
                    web3Index = 0;
                }
                if (completed || requestID > rqid)
                    return;


                _util.call(
                    web3Provider,
                    _delta.contractDeltaBalance,
                    _delta.config.DeltaBalanceAddr,
                    funcName,
                    args,
                    (err, result) => {
                        if (success || requestID > rqid)
                            return;
                        completed++;

                        const returnedAllowances = result;

                        if (!err && returnedAllowances && returnedAllowances.length == tokens.length) {

                            if (!success) {
                                success = true;
                            }
                            if (funcName == 'tokenAllowances') {
                                if (exchanges[exName].enabled) {

                                    for (let i = 0; i < tokens.length; i++) {
                                        let token = _delta.uniqueTokens[tokens[i]];

                                        if (token && allowances[token.addr]) {
                                            allowances[token.addr][exName] = _util.weiToToken(returnedAllowances[i], token);
                                            exchanges[exName].loaded++;
                                            if (token.unlisted) {
                                                exchanges[exName].loadedUnlisted++;
                                            } else {
                                                exchanges[exName].loadedListed++;
                                            }

                                        } else {
                                            console.log('received unrequested token allowance');
                                        }
                                    }
                                    if (exchanges[exName].loaded >= tokenCount)
                                        finishedAllowanceRequest();
                                }
                            } else {
                                console.log('unexpected funcName');
                            }
                        }
                        else if (!success && completed >= 2) // both requests returned with bad response
                        {
                            const retryAmount = 2;
                            if (totalTries >= retryAmount * 2) { //if we retried too much, show an error
                                if (funcName == 'tokenAllowances') {
                                    showError('Failed to load all ' + exName + ' allowances after 3 tries, try again later');
                                    exchanges[exName].loaded = -1;
                                    finishedAllowanceRequest();
                                }
                            }
                            else if (retried < retryAmount) //retry up to 3 times per request
                            {
                                totalTries++;
                                makeCall(exName, funcName, args, retried + 1);
                                return;
                            }
                        }
                    }
                );
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

    function setAllowanceProgress(changeHeaders) {

        let loadingState = {
        }

        let keys = Object.keys(exchanges);
        for (let i = 0; i < keys.length; i++) {
            if (exchanges[keys[i]].enabled) {
                var numLoaded = exchanges[keys[i]].loaded;
                let progressString = '<span style="white-space:normal">' + keys[i] + " ";

                if (numLoaded >= tokenCount || (!lastResult && !running)) {
                    progressString += '<span class="text-green">';
                } else {
                    progressString += '<span class="text-red">';
                }
                progressString += Math.min(exchanges[keys[i]].loaded, tokenCount) + '/' + tokenCount + '</span></span> ';
                loadingState[keys[i]] = progressString;
            } else {
                loadingState[keys[i]] = '';
            }
        }

        if (!progressTableLoaded) {

            var body = $('#balanceProgress tbody');
            var header = $('#balanceProgress thead');
            var headerTr$ = $('<tr/>');
            var tbody$ = $('<tbody/>');
            var row$ = $('<tr/>');
            let values = Object.values(loadingState);
            for (let i = 0; i < values.length; i++) {
                headerTr$.append($('<th/>'));
                row$.append($('<td/>'));
            }

            header.append(headerTr$);
            $('#balanceProgress').append(header);
            tbody$.append(row$);
            body.append(tbody$[0].innerHTML);

            progressTable = $('#balanceProgress').DataTable({
                "paging": false,
                "ordering": false,
                "searching": false,
                "scrollX": true,
                "info": false,
                "orderClasses": false,
            });
            progressTableLoaded = true;
            changeHeaders = true;
        }

        if (changeHeaders) {
            let keys2 = Object.keys(loadingState);
            for (let i = 0; i < keys2.length; i++) { //enable, disable exchanges
                progressTable.column(i).visible(exchanges[keys2[i]].enabled);
            }
        }

        let row2 = Object.values(loadingState);
        progressTable.row(0).data(row2).invalidate();
        progressTable.columns.adjust();
    }


    // callback when allowance request completes
    function finishedAllowanceRequest() {

        let keys = Object.keys(exchanges);

        //check if all requests are complete
        let noneDone = true;
        let allDone = true;
        for (let i = 0; i < keys.length; i++) {
            if (exchanges[keys[i]].loaded >= tokenCount || exchanges[keys[i]].loaded == -1) {
                if (exchanges[keys[i]].enabled)
                    noneDone = false;
            } else if (exchanges[keys[i]].enabled) {
                allDone = false;
            }
        }

        setAllowanceProgress();

        if (noneDone) {
            return;
        }


        for (let i = 0; i < keys.length; i++) {
            if (exchanges[keys[i]].enabled)
                exchanges[keys[i]].displayed = exchanges[keys[i]].loaded >= tokenCount || exchanges[keys[i]].loaded == -1;
        }

        let allTokens = _delta.config.customTokens.filter((t) => { return (showListed && !t.unlisted) || (showCustomTokens && t.unlisted) });
        if (allTokens.length == 0) {
            allTokens = [_delta.config.tokens[0]];
        }
        let allCount = allTokens.length;

        // get totals
        for (let i = 0; i < allCount; i++) {
            let token = allTokens[i];
            let bal = allowances[token.addr];

            if (bal) {
                bal.Total = _delta.web3.toBigNumber(0);
                for (let i = 0; i < keys.length; i++) {
                    if (exchanges[keys[i]].enabled && exchanges[keys[i]].loaded >= tokenCount) {
                        if (bal[keys[i]])
                            bal.Total = bal.Total.plus(bal[keys[i]]);
                    }
                }
                allowances[token.addr] = bal;
            }
        }

        let result = allTokens.map((t) => { return allowances[t.addr]; }).filter((t) => { return t });
        lastResult = result;

        if (allDone) {

            Object.keys(exchanges).forEach(function (name) {
                if (exchanges[name].enabled) {
                    if (showCustomTokens)
                        exchanges[name].completedUnlisted = true;
                    if (showListed)
                        exchanges[name].completedListed = true;
                }
            });
            lastResult = result;
        }
        makeTable(result, hideZero); //calls trigger
    }



    //allowances table
    function makeTable(result, hideZeros) {
        hidePopovers();

        var loaded = table1Loaded;
        var filtered = result;

        if (hideZeros) {
            filtered = filtered.filter(x => {
                return (
                    (!hideZeros || Number(x.Total) > 0)
                    && (showSpam || !_delta.uniqueTokens[x.Address].spam)
                );
            });
        }

        if (!table1Loaded) {
            tableHeaders = getColumnHeaders(filtered, allowanceHeaders);
            makeInitTable('#resultTable', tableHeaders, allowancesPlaceholder);
        }
        let tableData = buildTableRows(filtered, tableHeaders);
        trigger(tableData, tableHeaders);
    }


    function placeholderTable() {
        allowances = allowancesPlaceholder;
        var result = Object.values(allowancesPlaceholder);
        makeTable(result, false);
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

            localStorage.setItem("customTokens", showCustomTokens);
            localStorage.setItem("listedTokens", showListed);
            localStorage.setItem("decimals", decimals);

            let enabledExchanges = {};
            Object.keys(exchanges).forEach(function (key) {
                enabledExchanges[key] = exchanges[key].enabled;

                // remove legacy data
                localStorage.removeItem('allow:' + key);
            });
            localStorage.setItem('enabledExchanges-Allowance', JSON.stringify(enabledExchanges));
        }
    }

    function getStorage() {
        if (typeof (Storage) !== "undefined") {
            if (localStorage.getItem("customTokens") === null) {
                showCustomTokens = false;
            } else {
                let custom = localStorage.getItem('customTokens');
                showCustomTokens = custom === "true";
            }

            if (localStorage.getItem("listedTokens") === null) {
                showListed = true;
            } else {
                let listed = localStorage.getItem('listedTokens');
                showListed = listed === "true";
            }

            if (localStorage.getItem("hideZero") === null) {
                hideZero = true;
            } else {
                let zero = localStorage.getItem('hideZero');
                hideZero = zero === "true";
            }

            if (localStorage.getItem("decimals") === null) {
                decimals = false;
            } else {
                let dec = localStorage.getItem('decimals');
                decimals = dec === "true";
            }

            let enabledExchanges = localStorage.getItem('enabledExchanges-Allowance');
            if (enabledExchanges !== null && enabledExchanges.length > 0) {
                try {
                    enabledExchanges = JSON.parse(enabledExchanges);
                    Object.keys(exchanges).forEach(function (key) {
                        exchanges[key].enabled = enabledExchanges[key];
                    });
                } catch (e) { }
            }

            // check for saved address
            if (localStorage.getItem("address") !== null) {
                let addr = localStorage.getItem("address");
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
                let addr = sessionStorage.getItem("address");
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
    function trigger(dataSet, tableHeaders) {

        let keys = Object.keys(exchanges);

        if (!table1Loaded) {
            let hiddenList = tableHeaders.map(x => x.title).filter(x => !allowanceHeaders[x]);
            hiddenList = hiddenList.map(head => tableHeaders.findIndex((x) => x.title == head));

            allowanceTable = $('#resultTable').DataTable({
                "paging": false,
                "ordering": true,
                //"info": true,
                "scrollY": "60vh",
                "scrollX": true,
                "scrollCollapse": true,
                "orderClasses": false,
                "deferRender": true,
                fixedColumns: {
                    leftColumns: 1
                },
                aoColumnDefs: [
                    //allow searching only on column 0 (token names)
                    { bSearchable: true, aTargets: [0] },
                    { bSearchable: false, aTargets: ['_all'] },
                    // hide these columns
                    { bVisible: false, aTargets: hiddenList },
                    // column 0 default sort (when selected) ascending, others default descending
                    { asSorting: ["asc", "desc"], aTargets: [0] },
                    { asSorting: ["desc", "asc"], aTargets: ['_all'] },
                    //	{ sClass: "dt-body-left", aTargets: [0]},
                    //	{ sClass: "dt-body-right", aTargets: ['_all'] },
                ],
                "dom": '<"toolbar">frtip',
                "language": {
                    "search": '<i class="dim fa fa-search"></i>',
                    "searchPlaceholder": " Token Symbol / Name",
                    "zeroRecords": "No allowances loaded",
                    "info": "Showing _TOTAL_ allowances",
                    "infoEmpty": "No allowances found",
                    "infoFiltered": "(filtered from _MAX_ )"
                },
                "drawCallback": function (settings) {
                    setTimeout(function () {
                        $("[data-toggle=popover]").popover();
                    }, 300);
                }
            });
            updateToggleToolbar();
            table1Loaded = true;
        } else {
            // update which columns are hidden
            for (let i = 0; i < tableHeaders.length; i++) {
                let enabled = allowanceHeaders[tableHeaders[i].title];
                allowanceTable.column(i).visible(enabled);
            }
        }
        allowanceTable.clear();
        if (dataSet.length > 0) {
            for (let i = 0; i < dataSet.length; i++) {
                allowanceTable.rows.add(dataSet[i]);
            }
        }
        //	allowanceTable.columns.adjust().fixedColumns().relayout().draw();
        allowanceTable.draw();

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

        var allDisplayed = true;
        for (let i = 0; i < keys.length; i++) {
            if (!exchanges[keys[i]].displayed) {
                allDisplayed = false;
            }
        }
        trigger_1 = allDisplayed;

        if (trigger_1) {
            disableInput(false);
            hideLoading(true);
            running = false;
            requestID++;
            buttonLoading(true);
        }
    }

    function updateToggleToolbar() {

        let numberListed = _delta.config.customTokens.filter((x) => { return !x.unlisted }).length;
        let numberUnlisted = _delta.config.customTokens.filter((x) => { return x.unlisted }).length;

        $("div.toolbar").html(`<label  class="togglebox togglebox1 checkbox-inline"> <input type="checkbox" id="showListed" checked data-toggle="toggle" data-style="fast" data-width="100" data-on="Listed (` + numberListed + `)" data-off="Listed <strike>(` + numberListed + `)</strike>"
			data-onstyle="primary" data-offstyle="default" data-size="mini"> </label>
			<label class="togglebox checkbox-inline"> <input type="checkbox" id="showUnlisted" data-toggle="toggle" data-style="fast" data-width="100" data-on="Unlisted (`+ numberUnlisted + `)" data-off="Unlisted <strike>(` + numberUnlisted + `)</strike>"
			data-onstyle="warning" data-offstyle="default" data-size="mini"> </label>
			<label class="togglebox checkbox-inline"> <input type="checkbox" id="showSpam" data-toggle="toggle" data-style="fast" data-width="100" data-on="Unlisted spam" data-off="Unlisted spam"
			data-onstyle="warning" data-offstyle="default" data-size="mini"> </label>`
        );

        $('#showUnlisted').prop('checked', showCustomTokens);
        $('#showListed').prop('checked', showListed);
        $('#showSpam').prop('checked', showSpam);
        $('[data-toggle=toggle]').bootstrapToggle();

        $('#showListed').change(checkListing);
        $('#showUnlisted').change(checkListing);
        $('#showSpam').change(checkSpam);

        if (!showCustomTokens) {
            $('#showSpam').bootstrapToggle('destroy');
        }
    }

    // Builds the HTML Table out of myList.
    function buildTableRows(myList, headers) {
        let resultTable = [];

        for (var i = 0; i < myList.length; i++) {

            if (!showCustomTokens && myList[i].Unlisted)
                continue;
            var row$ = $('<tr/>');

            for (var colIndex = 0; colIndex < headers.length; colIndex++) {
                var cellValue = myList[i][headers[colIndex].title];
                if (!cellValue && cellValue !== 0) cellValue = "";
                var head = headers[colIndex].title;


                if (exchanges[head]) {
                    if (cellValue !== "" && cellValue !== undefined) {
                        var dec = fixedDecimals;
                        var num = '<span data-toggle="tooltip" title="' + _util.exportNotation(cellValue) + '">' + _util.displayNotation(cellValue, dec) + '</span>';
                        num = _util.commaNotation(num);
                        row$.append($('<td/>').html(num));
                    } else {
                        row$.append($('<td/>').html(cellValue));
                    }
                }
                else if (head == 'Name') {
                    let token = _delta.uniqueTokens[myList[i].Address];
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
                else {
                    row$.append($('<td/>').html(cellValue));
                }
            }
            resultTable.push(row$);
        }
        return resultTable;
    }

    var allowanceHeaders = { 'Name': 1, 'Total': 0 };

    // Adds a header row to the table and returns the set of columns.
    // Need to do union of keys from all records as some records may not contain
    // all records.
    function getColumnHeaders(myList, headers) {
        var columnSet = {};
        var columns = [];

        // ensure header is a digit 1, 0
        Object.keys(headers).map((k) => { headers[k] = Number(headers[k]); });

        if (myList.length == 0) {
            myList = allowancesPlaceholder;
        }
        for (var i = 0; i < myList.length; i++) {
            var rowHash = myList[i];
            for (var key in rowHash) {
                if (!columnSet[key] && headers[key] >= 0) {
                    columnSet[key] = 1;
                    columns.push({ title: key });
                }
            }
        }
        return columns;
    }

    function makeInitTable(selector, headers, placeholderData) {

        if (!table1Loaded) {
            var header1 = $(selector + ' thead');
            var headerTr$ = $('<tr/>');

            for (let i = 0; i < headers.length; i++) {
                let head = headers[i].title;
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

                if (head == 'Name') {
                    row$.append($('<td data-sort="" data-search=""/>'));
                } else {
                    row$.append($('<td/>'));
                }
            }
            tbody$.append(row$);
            body.append(tbody$[0].innerHTML);
        }
    }
}