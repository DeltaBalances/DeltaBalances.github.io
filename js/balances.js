
var isAddressPage = true;
var pageType = 'balance';
{
    // shorthands
    var _delta = bundle.DeltaBalances;
    var _util = bundle.utility;

    // initiation
    var initiated = false;
    var autoStart = false;

    var requestID = 0;

    // loading states
    var table1Loaded = false;
    var progressTableLoaded = false;

    //data to display
    var balanceTable = undefined;
    var progressTable = undefined;
    var tableHeaders = [];

    var activePopover = undefined;

    var activeTokens = []; // all tokens for which the balance will be loaded
    var activeTokensChanged = false;

    var exchanges =
    {
        'Wallet': {
            enabled: true,
            loaded: 0, // integer loading progress, number of tokens
            failed: 0,
            loadedTokens: {}, // addr -> bool, all tokens that are loaded for this exchange
            displayed: false, // has the result been output to a table
            contract: undefined,
            selector: undefined, // undefined: use contract.balanceOf(token, address), defined: uses a custom solidity function
            userFirst: false, // Given a selector, use (address, token) or (token, address)
        },
    };

    function addExchange(name, contract, selector = undefined, userFirst = false) {
        exchanges[name] = {
            enabled: false,
            loaded: 0,
            loadedTokens: {},
            displayed: false,
            contract: contract,
            selector: selector,
            userFirst: userFirst,
        };
    }

    addExchange('EtherDelta', _delta.config.exchangeContracts.EtherDelta.addr);
    addExchange('IDEX', _delta.config.exchangeContracts.Idex.addr);
    addExchange('Token store', _delta.config.exchangeContracts.TokenStore.addr);
    addExchange('Switcheo', _delta.config.exchangeContracts.Switcheo.addr, "0xc23f001f", true);
    addExchange('Switcheo v2', _delta.config.exchangeContracts.Switcheo2.addr, "0xc23f001f", true);
    addExchange('Joyso', _delta.config.exchangeContracts.Joyso.addr, "0xd4fac45d", false);
    addExchange('dex.blue', _delta.config.exchangeContracts.DexBlue2.addr, "0xd4fac45d", false); // "getBalance(address,address)"
    addExchange('Enclaves', _delta.config.exchangeContracts.Enclaves.addr);
    addExchange('SingularX', _delta.config.exchangeContracts.Singularx.addr);
    addExchange('EtherC', _delta.config.exchangeContracts.EtherC.addr);
    addExchange('SwitchDex', _delta.config.exchangeContracts.SwitchDex.addr);
    addExchange('Decentrex', _delta.config.exchangeContracts.Decentrex.addr);
    addExchange('ETHEN', "0x442fe55412a5459de5e51cb220d395aaa8960825"); //Ethen balanceOf proxy
    addExchange('Bitcratic', _delta.config.exchangeContracts.Bitcratic2.addr);
    addExchange('DEXY', _delta.config.exchangeContracts.Dexy.addr);
    addExchange('EtherDelta-old', _delta.config.exchangeContracts.EtherDelta2.addr);
    addExchange('EtherDelta-old2', _delta.config.exchangeContracts.EtherDelta3.addr);
    addExchange('EtherDelta-old3', _delta.config.exchangeContracts.EtherDelta4.addr);
    addExchange('EtherDelta-old4', _delta.config.exchangeContracts.EtherDelta5.addr);


    var exchangePrices = {
        complete: false,
        successRequests: 0,
        completeRequests: 0,
        totalRequests: 0,
        lastUpdated: 0,
        prices: {},
        displayedAll: false,
    };

    // settings for which tokens should be loaded
    var tokenSelection = {
        listed: { // listed on a DEX (ForkDelta, IDEX, Kyber, etc.), see config.js listedExchanges
            show: true,
        },
        unlisted: { // other known tokens, that are not listed
            show: false,
        },
        old: { // replaced, locked or broken tokens
            show: false,
        },
        inactive: { // tokens with no or very little activity in the last year
            show: false,
        },
        spam: { // tokens marked as spam
            show: false,
        },
        blocked: { // tokens with: 10 < holders < 150 (on the last check)
            show: false,
        },
    };

    var trigger_1 = false;
    var running = false;

    // settings
    var decimals = false;
    var fixedDecimals = 3;
    var useAsk = false;

    var showFiat = 'USD';


    // user input & data
    /* publicAddr, savedAddr, metamaskAddr  moved to user.js */
    var lastResult = undefined;

    // config
    var tokenCount = 0; //auto loaded
    var blocknum = -1;
    var walletWarningBalance = 0.003;

    var balances = {};
    var etherPriceUSD = 0;
    var etherPriceEUR = 0;
    var etherPriceUpdated = 0; //last updated


    initBalance({ "name": 'ETH', "addr": "0x0000000000000000000000000000000000000000", "unlisted": false });
    // placeholder
    var balancesPlaceholder = balances;

    init();

    $(document).ready(function () {
        readyInit();
    });

    //initialize independent of html dom
    function init() {
        _delta.initTokens(true);
        updateActiveTokens();

        _delta.startDeltaBalances(true, () => {
            _delta.initTokens(true); // do it again in case a token listed loaded very quickly (don't wait for them)
            updateActiveTokens();
            initiated = true;
            if (autoStart)
                myClick();
        });
    }

    // initialize on page ready
    function readyInit() {

        getEtherPrice();
        checkCollapseSettings(true);

        //get metamask address as possbile input (if available)
        requestMetamask(false);

        getStorage();

        $('#decimals').prop('checked', decimals);
        $('#fiatSelect').val(Number(showFiat));

        $('#showUnlisted').bootstrapToggle(tokenSelection.unlisted.show ? 'on' : 'off');
        $('#showListed').bootstrapToggle(tokenSelection.listed.show ? 'on' : 'off');
        $('#showSpam').bootstrapToggle(tokenSelection.spam.show ? 'on' : 'off');
        $('#showOld').bootstrapToggle(tokenSelection.old.show ? 'on' : 'off');
        $('#showInactive').bootstrapToggle(tokenSelection.inactive.show ? 'on' : 'off');
        $('#showBlocked').bootstrapToggle(tokenSelection.blocked.show ? 'on' : 'off');

        $('#showListed').change(checkListing);
        $('#showUnlisted').change(checkListing);
        $('#showSpam').change(checkListing);
        $('#showOld').change(checkListing);
        $('#showInactive').change(checkListing);
        $('#showBlocked').change(checkListing);


        accordionClick('#collapseSettings', '#settingToggleIcon', '#tokensettingToggleIcon');
        accordionClick('#collapseTokenSettings', '#tokensettingToggleIcon', '#settingToggleIcon');
        function accordionClick(parentid, iconid, othericon) {
            $(parentid).click(function () {
                if ($(iconid).hasClass('fa-minus')) {
                    $(iconid).removeClass('fa-minus');
                    $(iconid).addClass('fa-plus');
                } else {
                    $(iconid).removeClass('fa-plus');
                    $(iconid).addClass('fa-minus');
                    $(othericon).removeClass('fa-minus');
                    $(othericon).addClass('fa-plus');
                }
            });
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

        $(window).resize(function () {
            hidePopovers();
            checkCollapseSettings();
        });


        //dismiss popovers on click outside
        $('body').on('click', function (e) {
            if (activePopover) {
                hidePopovers(false);
            }
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

        updateActiveTokens();
        resetExLoadingState();

        placeholderTable();
        setBalanceProgress();

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
            if (table1Loaded && balanceTable) {
                balanceTable.clear().draw();
            }
        }
    }

    function hidePopovers(unbind) {
        $('[data-toggle="popover"]').each(function () {
            hidePopover(this);
        });
        if (unbind) {
            $('[data-toggle="popover"]').unbind();
        }
        $('.popover').unbind();
        $('.popover').hide();
        activePopover = undefined;
    }

    function hidePopover(element) {
        try {
            $(element).popover('hide');
            $(element).data("bs.popover").inState = { click: false, hover: false, focus: false };
            $(element).data("bs.popover").isVisible = false; //custom attribute
        } catch (e) { }
    }


    function checkCollapseSettings(init) {
        //check bootstrap classes for visibility
        var envs = ['xs', 'sm', 'md', 'lg'];
        var env = '';
        var $el = $('<div>');
        $el.appendTo($('body'));

        for (var i = envs.length - 1; i >= 0; i--) {
            env = envs[i];

            $el.addClass('hidden-' + env);
            if ($el.is(':hidden')) {
                $el.remove();
                break;
            }
        }

        if (env == 'xs' || env == 'sm') {
            /* if ($('#tokensetting-body').is(":visible")) {
                 $('#collapseTokenSettings').click();
             } else if ($('#setting-body').is(":visible")) {
                 $('#collapseSettings').click();
             } */
        } else {
            if (!$('#tokensetting-body').is(":visible")) {
                $('#collapseTokenSettings').click();
            }
        }
    }

    function checkExchange(selected) {
        let changed = false;
        let requiresLoading = false;

        let keys = Object.keys(exchanges);
        for (let i = 0; i < keys.length; i++) {
            let name = keys[i];
            if (name == 'Wallet')
                continue;

            let enabled = false;
            if (selected.length > 0 && selected.indexOf(name) !== -1) {
                enabled = true;
            }

            if (exchanges[name].enabled !== enabled) {
                changed = true;

                if (lastResult) {
                    // TODO handle changes during loading? .loaded is updated with appendLoadingState
                    if (enabled && exchanges[name].loaded < tokenCount) {
                        requiresLoading = true;
                    }
                }
            }
            exchanges[name].enabled = enabled;
            balanceHeaders[name] = exchanges[name].enabled;
        }

        if (changed) {
            setBalanceProgress(true);
            setStorage();
        }

        if (!changed && !lastResult) {
            remakeEmpty();
        }
        else if (lastResult && changed) {
            if (!requiresLoading) {
                finishedBalanceRequest();
            } else {
                getBalances(true, false);
            }
        }

        function remakeEmpty() {

            resetExLoadingState();
            placeholderTable();
            setBalanceProgress();
        }
    }

    function selectPrice() {
        let val = $('#priceSelect').val();
        useAsk = Number(val) > 0;

        if (lastResult) {
            finishedBalanceRequest();
        } else {
            placeholderTable();
        }

        setStorage();
    }

    function selectFiat() {
        let val = $('#fiatSelect').val();
        showFiat = Number(val);

        if (showFiat == 1 && etherPriceUSD > 0) {
            $('#fiatPrice').html("$" + etherPriceUSD + "/ETH");
        } else if (showFiat == 2 && etherPriceEUR > 0) {
            $('#fiatPrice').html("€" + etherPriceEUR + "/ETH");
        } else {
            $('#fiatPrice').html();
        }
        clearOverviewHtml(true);

        if (lastResult) {
            finishedBalanceRequest();
        } else {
            placeholderTable();
        }
        setStorage();
    }

    // more decimals checbox
    var changedDecimals = false;
    function checkDecimal() {
        changedDecimals = true;
        decimals = $('#decimals').prop('checked');

        fixedDecimals = decimals ? 8 : 3;
        if (lastResult) {
            finishedBalanceRequest();
        } else {
            placeholderTable();
        }
        changedDecimals = false;
        setStorage();
    }


    var listingChangeTimeout = undefined;

    function checkListing() {
        let addedTokens = false;
        let removedTokens = false;

        let showUnlisted = $('#showUnlisted').prop('checked');
        let showListed = $('#showListed').prop('checked');
        let showOld = $('#showOld').prop('checked');
        let showInactive = $('#showInactive').prop('checked');
        let showBlocked = $('#showBlocked').prop('checked');
        let showSpam = $('#showSpam').prop('checked');


        function handleChange(boolean, name) {
            if (tokenSelection[name]) {
                if (boolean !== tokenSelection[name].show) {
                    activeTokensChanged = true;
                    tokenSelection[name].show = boolean;
                    if (boolean) {
                        addedTokens = true;
                    } else {
                        removedTokens = true;
                    }
                }
            }
        }
        handleChange(showListed, 'listed');
        handleChange(showUnlisted, 'unlisted');
        handleChange(showOld, 'old');
        handleChange(showInactive, 'inactive');
        handleChange(showBlocked, 'blocked');
        handleChange(showSpam, 'spam');


        if (!running) {
            updateActiveTokens();
            setBalanceProgress();
        }

        setStorage();


        if (listingChangeTimeout) {
            clearTimeout(listingChangeTimeout);
        }

        if (!lastResult || (removedTokens && !addedTokens)) {
            //change on small delay for slider animation
            listingChangeTimeout = setTimeout(function () {
                if (lastResult) {
                    getBalances(false, true);
                } else {
                    placeholderTable();
                }
            }, 100);
        } else if (addedTokens || removedTokens) {
            // update balances on a timeout, to allow you to select multiple options
            listingChangeTimeout = setTimeout(function () {
                getBalances(false, true);
            }, 1000);
        }
        return;
    }


    //update the active token list basd on the current token settings
    function updateActiveTokens() {
        let all = _delta.config.balanceTokens;

        let total = all.length;

        if (!tokenSelection.listed.show) {
            all = all.filter(t => t.unlisted || t.addr == _delta.config.ethAddr);
        }
        if (!tokenSelection.unlisted.show) {
            all = all.filter(t => !t.unlisted);
        }
        if (!tokenSelection.old.show) {
            all = all.filter(t => !t.old && !t.locked);
        }
        if (!tokenSelection.spam.show) {
            all = all.filter(t => !t.spam);
        }
        if (!tokenSelection.inactive.show) {
            all = all.filter(t => !t.inactive);
        }
        if (!tokenSelection.blocked.show) {
            all = all.filter(t => !t.blocked);
        }

        activeTokens = all;
        tokenCount = activeTokens.length;

        $('#tokencount').html(tokenCount + '/' + total);
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

    function showLoading(balance) {
        if (balance) {
            $('#loadingBalances').addClass('fa-spin');
            $('#loadingBalances').addClass('dim');
            $('#loadingBalances').prop('disabled', true);
            $('#loadingBalances').show();
            $('#refreshButtonLoading').show();
            $('#refreshButtonSearch').hide();
            $('#overviewOverlay').removeClass('hidden-xs');
            $('#overviewOverlay').removeClass('hidden-sm');
        }
        $("#tablesearcher").prop("disabled", balance);

        /*if (!balance) {
            $('#refreshButtonLoading').hide();
            $('#refreshButtonSearch').show();
        } */
    }

    function buttonLoading(balance) {
        if (!publicAddr) {
            hideLoading(balance);
            return;
        }
        if (balance) {
            $('#loadingBalances').removeClass('fa-spin');
            $('#loadingBalances').removeClass('dim');
            $('#loadingBalances').prop('disabled', false);
            $('#loadingBalances').show();
            $('#refreshButtonLoading').hide();
            $('#refreshButtonSearch').show();
        }
    }

    function hideLoading(balance) {
        if (!publicAddr) {
            balance = true;
        }
        $("#tablesearcher").prop("disabled", !balance);
        if (balance) {
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
        clearOverviewHtml(false);
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
            getBalances(false, false);
        } else {
            running = false;
        }
    }

    function resetExLoadingState() {

        function setLoad(name) {
            exchanges[name].loaded = exchanges[name].enabled ? 0 : -1;
            exchanges[name].failed = 0;
            exchanges[name].displayed = !exchanges[name].enabled;
            exchanges[name].loadedTokens = {};
            balanceHeaders[name] = exchanges[name].enabled;
        }

        Object.keys(exchanges).forEach(function (key) {
            setLoad(key);
        });
    }

    function appendExLoadingState() {

        function setLoad(name) {
            if (exchanges[name].enabled) {
                let loadedBalances = exchanges[name].loadedTokens;
                let loaded = activeTokens.filter(t => loadedBalances[t.addr]).length;
                exchanges[name].loaded = loaded;
            } else {
                exchanges[name].loaded = -1;
            }
            exchanges[name].displayed = !exchanges[name].enabled;
            balanceHeaders[name] = exchanges[name].enabled;
        }

        Object.keys(exchanges).forEach(function (key) {
            setLoad(key);
        });
    }

    function clearOverviewHtml(dollarOnly) {

        if (!dollarOnly) {
            $('#ethbalance').html('');
            $('#wethbalance').html('');
            $('#tokenbalance').html('');
            $('#totalbalance').html('');
        }

        $('#ethbalancePrice').html('');
        $('#wethbalancePrice').html('');
        $('#tokenbalancePrice').html('');
        $('#totalbalancePrice').html('');
    }

    function getBalances(appendExchange, updateTokens) {
        if (!publicAddr)
            return;

        hidePopovers(true);
        $('#refreshText').hide();

        requestID++;
        running = true;

        Object.keys(tokenSelection).forEach(key => {
            tokenSelection[key].last = tokenSelection[key].show;
        });

        let rqid = requestID;

        clearOverviewHtml(false);

        $('#downloadBalances').html('');

        trigger_1 = false;
        //disableInput(true);

        showLoading(true);

        updateActiveTokens();
        tokenCount = activeTokens.length;
        activeTokensChanged = false;

        if (!appendExchange && !updateTokens) {
            balances = {};
            resetExLoadingState();
            _delta.config.balanceTokens.forEach(token => {
                if (token)
                    initBalance(token);
            });
        } else {
            appendExLoadingState();

            let allDone = true;
            Object.keys(exchanges).forEach(function (key) {
                if (exchanges[key].enabled && exchanges[key].loaded + exchanges[key].failed < tokenCount) {
                    allDone = false;
                }
            });
            if (allDone) {
                finishedBalanceRequest();
                return;
            }
        }



        console.log('preparing to retrieve balances for ' + tokenCount + ' tokens');

        getPrices(rqid);
        getEtherPrice();

        //clear tables in the html
        setBalanceProgress();
        if (table1Loaded) {
            balanceTable.clear();
            for (let i = 0; i < tableHeaders.length; i++) {
                let enabled = balanceHeaders[tableHeaders[i].title];
                let column = balanceTable.column(i).visible(enabled);
            }
            //balanceTable.columns.adjust().fixedColumns().relayout().draw();
            balanceTable.draw();
        }

        Object.keys(exchanges).forEach(function (key) {
            if (exchanges[key].enabled && exchanges[key].loaded < tokenCount) {
                getAllBalances(rqid, key, updateTokens);
                madeRequests = true;
            }
        });
    }


    function initBalance(tokenObj) {
        let obj = {
            Name: tokenObj.name,
        };

        let exs = Object.keys(exchanges);
        for (let i = 0; i < exs.length; i++) {
            obj[exs[i]] = 0;
        }

        let obj1 = {
            Total: 0,
            Bid: '',
            Ask: '',
            'Est. ETH': 0,
            Unlisted: tokenObj.unlisted,
            Address: tokenObj.addr,
            EUR: 0,
            USD: 0,
        };

        balances[tokenObj.addr] = Object.assign({}, obj, obj1);
    }


    //get USD, EUR price for ETH
    function getEtherPrice() {
        // don't repeat update within 5 seconds
        if (Date.now() - etherPriceUpdated > 5000) {
            $.getJSON("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd%2Ceur&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false", result => {
                if (result.ethereum && result.ethereum.usd && result.ethereum.eur) {
                    etherPriceUpdated = Date.now();
                    etherPriceUSD = result.ethereum.usd;
                    etherPriceEUR = result.ethereum.eur;

                    if (showFiat == 1) {
                        $('#fiatPrice').html("$" + etherPriceUSD + "/ETH");
                    } else if (showFiat == 2) {
                        $('#fiatPrice').html("€" + etherPriceEUR + "/ETH");
                    }
                }
            }).fail(() => {
                console.log('CoinGecko ETH price failed.');
            });
        }
    }

    function getPrices(rqid) {

        // don't load prices if they all succeeded and are still recent (15sec)
        if (exchangePrices.successRequests == exchangePrices.totalRequests && (Date.now() - exchangePrices.lastUpdated) < 15000) {
            return;
        }

        let requestLog = {
            ForkDelta: { attempts: 0, done: false, failed: false, prices: [] },
            IDEX: { attempts: 0, done: false, failed: false, prices: [] },
            Kyber: { attempts: 0, done: false, failed: false, prices: [] },
            Radar: { attempts: 0, done: false, failed: false, prices: [] },
        };

        exchangePrices.complete = false;
        exchangePrices.successRequests = 0;
        exchangePrices.completeRequests = 0;
        exchangePrices.lastUpdated = Date.now();
        exchangePrices.totalRequests = Object.keys(requestLog).length;
        exchangePrices.prices = {};

        priceRequest('IDEX', 'https://api.idex.market/returnTicker', (result) => {
            let keys = Object.keys(result);
            keys.map((key) => {
                if (key.indexOf('ETH_') == 0) {
                    let name = key.replace('ETH_', '');
                    const matchingTokens = _delta.config.balanceTokens.filter(
                        x => x.IDEX && x.IDEX === name && !x.blockIDEX);
                    if (matchingTokens.length > 0) {
                        result[key].tokenAddr = matchingTokens[0].addr.toLowerCase();
                    }
                }
            });
            let prices = {};
            Object.values(result).map((x) => {
                if (x.tokenAddr) {
                    let tok = {
                        addr: x.tokenAddr,
                        bid: undefined,
                        ask: undefined,
                        volumeETH: 0,
                        //change24h: x.percentChange,
                    };
                    if (x.highestBid !== "N/A") {
                        tok.bid = Number(x.highestBid);
                    }
                    if (x.lowestAsk !== "N/A") {
                        tok.ask = Number(x.lowestAsk);
                    }
                    if (x.baseVolume !== "N/A") {
                        tok.volumeETH = Number(x.baseVolume)
                    }

                    //2.5 is 2.5% not fractional like 0.025
                    /* if (x.percentChange !== "N/A") {
                         tok.change24h = Number(x.percentChange);
                     }*/
                    prices[tok.addr] = tok;
                }
            });
            return prices;
        });

        priceRequest('Radar', 'https://api.radarrelay.com/v3/markets?include=base,ticker,stats', (result) => {
            let prices = {};
            result.map((pair) => {
                if (pair && pair.ticker && pair.stats) {
                    let tokenPrice = undefined;
                    if (_util.isWrappedETH(pair.quoteTokenAddress)) { // zrx/WETH
                        tokenPrice = {
                            addr: pair.baseTokenAddress.toLowerCase(),
                            bid: Number(pair.ticker.bestBid),
                            ask: Number(pair.ticker.bestAsk),
                            volumeETH: Number(pair.stats.volume24Hour),
                        };
                    } else if (_util.isWrappedETH(pair.baseTokenAddress)) { // WETH / DAI
                        // not a standard ETH pair like DAI or WBTC
                        tokenPrice = {
                            addr: pair.quoteTokenAddress.toLowerCase(),
                            bid: 1 / Number(pair.ticker.bestBid),
                            ask: 1 / Number(pair.ticker.bestAsk),
                            volumeETH: Number(pair.stats.volume24Hour) * (1 / Number(pair.ticker.bestBid)),
                        };
                    }
                    if (tokenPrice) {
                        prices[tokenPrice.addr] = tokenPrice;
                    }
                }
            });
            return prices;
        });

        priceRequest('Kyber', 'https://api.kyber.network/market', (result) => {
            if (result.error || !result.data) {
                return;
            }
            result = result.data;
            result = result.map(x => {
                if (x.base_symbol === 'ETH') {
                    let name = x.quote_symbol;
                    const matchingTokens = _delta.config.balanceTokens.filter(
                        x => x.Kyber && x.Kyber === name);
                    if (matchingTokens.length > 0) {
                        x.tokenAddr = matchingTokens[0].addr.toLowerCase();
                    }
                }
                return x;
            });
            result = result.filter(x => x.tokenAddr);
            let prices = {};
            result.map((tok) => {
                if (tok.tokenAddr) {

                    let tokenPrice = {
                        addr: tok.tokenAddr,
                        bid: tok.current_bid,
                        ask: tok.current_ask,
                        volumeETH: tok.eth_24h_volume,
                        //change24h: tok.change_eth_24h,
                    };
                    prices[tokenPrice.addr] = tokenPrice;
                }
            });
            return prices;
        });

        socketRequest('ForkDelta', (result) => {
            let keys = Object.keys(result);
            let prices = {};
            keys.map((key) => {
                if (key.indexOf('ETH_') == 0) {
                    let tok = result[key];
                    let tokenPrice = {
                        addr: tok.tokenAddr.toLowerCase(),
                        bid: Number(tok.bid),
                        ask: Number(tok.ask),
                        volumeETH: Number(tok.baseVolume),
                    };
                    prices[tokenPrice.addr] = tokenPrice;
                }
            });
            return prices;
        });

        //prices from forkdelta socket
        function socketRequest(priceID, callback) {
            if (!requestLog[priceID]) {
                return;
            }
            requestLog[priceID].attempts = requestLog[priceID].attempts + 1;

            _delta.socketTicker((err, result, rid) => {
                if (requestID <= rqid) {
                    if (!err && result) {
                        try {
                            requestLog[priceID].prices = callback(result);
                        } catch (e) {
                            console.log('failed to parse ' + priceID + ' ticker');
                            requestLog[priceID].failed = true;
                            requestLog[priceID].prices = {};
                        }
                        requestLog[priceID].done = true;
                        finishPrices(true);
                    } else if (requestLog[priceID].attempts < 2) {
                        socketRequest(priceID);
                    } else {
                        requestLog[priceID].done = true;
                        requestLog[priceID].failed = true;
                        finishPrices(false);
                    }
                }
            }, rqid);
        }

        function priceRequest(priceID, url, callback) {
            if (!requestLog[priceID]) {
                return;
            }
            requestLog[priceID].attempts = requestLog[priceID].attempts + 1;

            $.ajax({
                dataType: "json",
                url: url,
                data: "",
                success: (result) => {
                    if (requestID <= rqid) {
                        if (result && !result.error) {
                            try {
                                requestLog[priceID].prices = callback(result);
                            } catch (e) {
                                console.log('failed to parse ' + priceID + ' ticker');
                                requestLog[priceID].failed = true;
                                requestLog[priceID].prices = {};
                            }
                            requestLog[priceID].done = true;
                            finishPrices(true);
                        } else if (requestLog[priceID].attempts < 2) {
                            priceRequest(priceID, url, callback);
                        } else {
                            requestLog[priceID].done = true;
                            requestLog[priceID].failed = true;
                            finishPrices(false);
                        }
                    }
                },
                timeout: 1500
            }).fail((result) => {
                if (requestID <= rqid) {
                    if (requestLog[priceID].attempts < 2) {
                        priceRequest(priceID, url, callback);
                    } else {
                        requestLog[priceID].done = true;
                        requestLog[priceID].failed = true;
                        finishPrices(false);
                    }
                }
            });
        }


        function finishPrices(dataChanged) {
            let pricesDone = true;
            let pricesSuccess = 0;
            let pricesCompleted = 0;
            let keys = Object.keys(requestLog);
            for (let i = 0; i < keys.length; i++) {
                let req = requestLog[keys[i]];
                pricesDone = pricesDone && req.done;
                if (req.done) {
                    pricesCompleted++;
                    if (!req.failed) {
                        pricesSuccess++;
                    }
                }
                if (req.prices) {
                    let addrs = Object.keys(req.prices);
                    for (let j = 0; j < addrs.length; j++) {
                        let addr = addrs[j];
                        let priceObj = req.prices[addr];
                        if (priceObj && (priceObj.ask || priceObj.bid)) {
                            if (!exchangePrices.prices[addr]) {
                                exchangePrices.prices[addr] = {};
                            }
                            // prices[addr][exchange] = {bid: , ask:}
                            exchangePrices.prices[addrs[j]][keys[i]] = priceObj;
                        }
                    }
                }
            }


            exchangePrices.complete = pricesDone;
            exchangePrices.successRequests = pricesSuccess;
            exchangePrices.completeRequests = pricesCompleted;
            exchangePrices.totalRequests = keys.length;

            if (running) {
                if (dataChanged || pricesDone) {
                    finishedBalanceRequest();
                } else {
                    setBalanceProgress();
                }
            }
            return;
        }
    }


    var maxPerRequest = 500;   // don't make the web3 requests too large

    function getAllBalances(rqid, exchangeKey, updateBalances) {

        // select which tokens to be requested
        var tokens2 = activeTokens;

        if (updateBalances) { //avoid loading things we already know
            let alreadyLoaded = exchanges[exchangeKey].loadedTokens;
            tokens2 = tokens2.filter(t => !alreadyLoaded[t.addr]);
        }

        tokens2 = tokens2.map((x) => { return x.addr; });

        //split in separate requests to match maxPerRequest
        for (let i = 0; i < tokens2.length; i += maxPerRequest) {
            allBalances(i, i + maxPerRequest, tokens2);
        }

        // make the call to get balances for a (sub)section of tokens
        function allBalances(startIndex, endIndex, tokens3, splits = 0) {

            var tokens = tokens3.slice(startIndex, endIndex);

            var functionName = 'depositedBalances';
            var arguments = [exchanges[exchangeKey].contract, publicAddr, tokens];
            if (exchangeKey == 'Wallet') {
                functionName = 'tokenBalances';
                arguments = [publicAddr, tokens];
            }
            // exchanges using a different function
            else if (exchanges[exchangeKey].selector) {
                functionName = 'depositedBalancesGeneric';
                arguments = [exchanges[exchangeKey].contract, exchanges[exchangeKey].selector, publicAddr, tokens, exchanges[exchangeKey].userFirst];
            }

            var completed = 0;
            var success = false;
            var totalTries = 0;

            // web3 provider (infura, myetherapi, mycryptoapi) or etherscan
            makeCall(exchangeKey, functionName, arguments, 0);

            function makeCall(exName, funcName, args, retried) {
                if (success || requestID > rqid)
                    return;


                _util.getBatchedBalances(
                    _delta.contractDeltaBalance,
                    funcName,
                    args,
                    (err, result) => {
                        if (success || requestID > rqid)
                            return;
                        completed++;

                        const returnedBalances = result;

                        if (!err && returnedBalances && returnedBalances.length == tokens.length) {

                            if (!success) {
                                success = true;
                            }
                            if (funcName == 'tokenBalances' || funcName.indexOf('depositedBalances') > -1) {
                                if (exchanges[exName].enabled) {

                                    for (let i = 0; i < tokens.length; i++) {
                                        let token = _delta.uniqueTokens[tokens[i]];

                                        if (token && balances[token.addr]) {
                                            balances[token.addr][exName] = _util.weiToToken(returnedBalances[i], token);
                                            exchanges[exName].loaded++;
                                            exchanges[exName].loadedTokens[token.addr] = true;
                                        } else {
                                            console.log('received unrequested token balance');
                                        }
                                    }
                                    // if (exchanges[exName].loaded + exchanges[exName].failed >= tokenCount)
                                    finishedBalanceRequest();
                                }
                            } else {
                                console.log('unexpected funcName');
                            }
                        }
                        else if (!success && completed >= 2) // both requests returned with bad response
                        {
                            const retryAmount = 2;
                            if (totalTries >= retryAmount) { //if we retried too much, show an error
                                if (funcName == 'tokenBalances') {
                                    showError('Failed to load all Wallet balances after 3 tries, try again later');
                                    exchanges[exName].failed += tokens.length;
                                    finishedBalanceRequest();
                                }
                                else if (funcName == 'depositedBalances') {
                                    showError('Failed to load all ' + exName + ' balances after 3 tries, try again later');
                                    exchanges[exName].failed += tokens.length;
                                    finishedBalanceRequest();
                                }
                                console.log("Aborting retries, Balance request failed");
                            }
                            else if (retried < retryAmount) //retry up to 3 times per request
                            {

                                if (!err && result.length == 0 && tokens.length >= 2 && splits < 10) {
                                    // we got a response of length 0, possible revert from ethereum call
                                    // split tokens and try those again
                                    let splits2 = splits++;
                                    allBalances(0, (tokens.length / 2), tokens, splits2);
                                    allBalances((tokens.length / 2), tokens.length, tokens, splits2);
                                    console.log("Split balance request of " + tokens.length + " tokens");
                                } else {
                                    //request failure, try it again
                                    totalTries++;
                                    makeCall(exName, funcName, args, retried + 1);
                                    console.log("Balance request failed, retry");
                                }
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

    function setBalanceProgress(changeHeaders) {

        let loadingState = {};

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

        //prices
        {
            let progressString2 = '<span style="white-space:normal">Prices <span style="white-space:nowrap"class="text-';
            if (!exchangePrices.complete) {
                if (running) {
                    progressString2 += 'red"> Loading ' + exchangePrices.completeRequests + "/" + exchangePrices.totalRequests;
                } else {
                    progressString2 += 'green"> No';
                }
            } else {
                progressString2 += 'green"> ' + exchangePrices.successRequests + "/" + exchangePrices.totalRequests + " sources";
            }
            progressString2 += '</span></span>';
            loadingState['Prices'] = progressString2;
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
            for (let i = 0; i < keys2.length; i++) { //enable, disable exchanges (prices always enabled)
                if (keys2[i] !== 'Prices') {
                    progressTable.column(i).visible(exchanges[keys2[i]].enabled);
                }
            }
        }

        let row2 = Object.values(loadingState);
        progressTable.row(0).data(row2).invalidate();
        progressTable.columns.adjust();
    }


    // callback when balance request completes
    function finishedBalanceRequest() {

        let keys = Object.keys(exchanges);

        //check if all requests are complete
        let noneDone = true;
        let allDone = true;
        for (let i = 0; i < keys.length; i++) {
            if ((exchanges[keys[i]].loaded + exchanges[keys[i]].failed) >= tokenCount || exchanges[keys[i]].loaded == -1) {
                if (exchanges[keys[i]].enabled)
                    noneDone = false;
            } else if (exchanges[keys[i]].enabled) {
                allDone = false;
            }
        }

        clearOverviewHtml(false);
        setBalanceProgress();

        if (noneDone) {
            return;
        }

        let sumETH = _util.toBigNumber(0);
        let sumWETH = _util.toBigNumber(0);
        let sumToken = _util.toBigNumber(0);

        for (let i = 0; i < keys.length; i++) {
            if (exchanges[keys[i]].enabled)
                exchanges[keys[i]].displayed = (exchanges[keys[i]].loaded + exchanges[keys[i]].failed) >= tokenCount || exchanges[keys[i]].loaded == -1;
        }

        exchangePrices.displayedAll = exchangePrices.complete;

        let allTokens = activeTokens;
        if (allTokens.length == 0) {
            allTokens = [_delta.uniqueTokens[_delta.config.ethAddr]];
        }
        let allCount = allTokens.length;

        // get totals
        for (let i = 0; i < allCount; i++) {
            let token = allTokens[i];
            let bal = balances[token.addr];

            if (bal) {
                bal['Est. ETH'] = _util.toBigNumber(0);
                bal['USD'] = '';
                bal['EUR'] = '';
                bal.Total = _util.toBigNumber(0);
                for (let i = 0; i < keys.length; i++) {
                    if (exchanges[keys[i]].enabled && (exchanges[keys[i]].loaded + exchanges[keys[i]].failed >= tokenCount)) {
                        if (bal[keys[i]])
                            bal.Total = bal.Total.plus(bal[keys[i]]);
                    }
                }

                // ETH and  wrapped eth fixed at value of 1 ETH
                if (_util.isWrappedETH(token.addr)) {
                    bal['Est. ETH'] = bal.Total;

                    if (token.addr === "0x0000000000000000000000000000000000000000") {
                        sumETH = bal.Total;
                    } else if (_util.isWrappedETH(token.addr)) {
                        sumWETH = sumWETH.plus(bal.Total);
                    } else {
                        sumToken = sumToken.plus(bal.Total);
                    }
                }
                else {
                    //get bid/ask prices for this token

                    // set prices in this order, later in the list is assumed to be more accurate 
                    let keyOrder = ['ForkDelta', 'Radar', 'IDEX', 'Kyber'];
                    //price obj for this token {forkdelta: {bid, ask}, idex:{bid,ask}}
                    let tokenPrices = exchangePrices.prices[token.addr];

                    if (tokenPrices) {
                        let usedVolume = 0; //volume on the exchange that we used for the price
                        for (let i = 0; i < keyOrder.length; i++) {
                            //does exchange have this price pair
                            if (tokenPrices[keyOrder[i]]) {
                                let price = tokenPrices[keyOrder[i]];
                                if (useAsk && price && price.ask) {
                                    if (price.volumeETH >= usedVolume) {
                                        bal.Ask = price.ask;
                                        usedVolume = price.volumeETH;
                                    }
                                } else if (!useAsk && price && price.bid) {
                                    if (price.volumeETH >= usedVolume) {
                                        bal.Bid = price.bid;
                                        usedVolume = price.volumeETH;
                                    }
                                }
                            }
                        }
                    }

                    if (bal.Total) {
                        // calculate estimate if not (wrapped) ETH
                        var val = _util.toBigNumber(0);

                        if (useAsk) {
                            if (bal.Ask) {
                                val = bal.Total.times(bal.Ask);
                            }
                        } else {
                            if (bal.Bid) {
                                val = bal.Total.times(bal.Bid);
                            }
                        }
                        bal['Est. ETH'] = val;
                        sumToken = sumToken.plus(val);
                    }
                    if (!bal.Bid) {
                        bal.Bid = '';
                    }
                    if (!bal.Ask) {
                        bal.Ask = '';
                    }
                }
                balances[token.addr] = bal;
            }
        }

        let result = allTokens.map((t) => { return balances[t.addr]; }).filter((t) => { return t });
        lastResult = result;

        if (allDone) {


            // set ETH values for the totals overview, including tooltips with unrounded values.
            $('#ethbalance').html('<span data-toggle="tooltip" title="' + _util.exportNotation(sumETH) + '">' + sumETH.toFixed(fixedDecimals, 1) + ' ETH</span>');
            $('#wethbalance').html('<span data-toggle="tooltip" title="' + _util.exportNotation(sumWETH) + '">' + sumWETH.toFixed(fixedDecimals, 1) + ' ETH</span>');
            $('#tokenbalance').html('<span data-toggle="tooltip" title="' + _util.exportNotation(sumToken) + '">' + sumToken.toFixed(fixedDecimals, 1) + ' ETH</span>');
            let totalSumETH = sumETH.plus(sumToken).plus(sumWETH);
            $('#totalbalance').html('<span data-toggle="tooltip" title="' + _util.exportNotation(totalSumETH) + '">' + totalSumETH.toFixed(fixedDecimals, 1) + ' ETH</span>');


            let fiatSymbol = " $";
            let fiatPrice = 0;
            let fiatIndex = 'USD'
            if (showFiat == 1) {
                fiatPrice = etherPriceUSD;
            } else if (showFiat == 2) {
                fiatPrice = etherPriceEUR;
                fiatSymbol = " €";
                fiatIndex = 'EUR';
            }

            // calculate and add USD / EUR prices, if required
            if (showFiat > 0) {

                for (let i = 0; i < result.length; i++) {
                    if (result[i]['Est. ETH'] !== '') {
                        result[i][fiatIndex] = _util.commaNotation(result[i]['Est. ETH'].times(fiatPrice).toFixed(2, 1));
                    }
                }

                // set fiat prices in totals overview
                $('#ethbalancePrice').html(fiatSymbol + _util.commaNotation((sumETH.times(fiatPrice)).toFixed(2, 1)));
                $('#wethbalancePrice').html(fiatSymbol + _util.commaNotation((sumWETH.times(fiatPrice)).toFixed(2, 1)));
                $('#tokenbalancePrice').html(fiatSymbol + _util.commaNotation((sumToken.times(fiatPrice)).toFixed(2, 1)));
                $('#totalbalancePrice').html(fiatSymbol + _util.commaNotation((totalSumETH.times(fiatPrice)).toFixed(2, 1)));
            }

            lastResult = result;

            $('#downloadBalances').html('');
            downloadBalances();
        } else {
            clearOverviewHtml(false);
            $('#downloadBalances').html('');
        }
        makeTable(result); //calls trigger
    }



    //balances table
    function makeTable(result) {
        hidePopovers(true);

        var loaded = table1Loaded;
        var filtered = result;

        // remove balances of 0
        filtered = filtered.filter(x => {
            return (Number(x.Total) > 0 || x.Address === _delta.config.ethAddr);
        });


        balanceHeaders['Ask'] = useAsk;
        balanceHeaders['Bid'] = !useAsk;

        balanceHeaders['USD'] = showFiat == 1;
        balanceHeaders['EUR'] = showFiat == 2;

        //count number off active exchanges
        let numColumns = Object.values(exchanges).reduce((sum, ex) => { if (ex.enabled) return sum + 1; else return sum; }, 0);
        balanceHeaders['Total'] = numColumns > 1;

        if (!table1Loaded) {
            tableHeaders = getColumnHeaders(filtered, balanceHeaders);
            makeInitTable('#resultTable', tableHeaders, balancesPlaceholder);
        }
        let tableData = buildTableRows(filtered, tableHeaders);
        trigger(tableData, tableHeaders);
    }


    function placeholderTable() {
        balances = balancesPlaceholder;
        var result = Object.values(balancesPlaceholder);
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

            let tokSel = tokenSelection;
            Object.keys(tokSel).forEach(key => {
                delete tokSel[key].last;
            });
            localStorage.setItem("tokenSelection", JSON.stringify(tokenSelection));
            localStorage.setItem("decimals", decimals);
            localStorage.setItem('fiat', showFiat);

            //remove legacy data
            /*
            localStorage.removeItem("listedTokens");
            localStorage.removeItem("customTokens");
            */

            let enabledExchanges = {};
            Object.keys(exchanges).forEach(function (key) {
                enabledExchanges[key] = exchanges[key].enabled;

                // remove legacy data
                localStorage.removeItem(key);
            });
            localStorage.setItem('enabledExchanges-Balance', JSON.stringify(enabledExchanges));
        }
    }

    function getStorage() {
        if (typeof (Storage) !== "undefined") {

            if (localStorage.getItem("fiat") === null) {
                showFiat = '1';
            } else {
                showFiat = localStorage.getItem('fiat');
                if (!(showFiat == '1' || showFiat == '2'))
                    showFiat = '0';
            }

            let tokSelec = localStorage.getItem("tokenSelection")
            if (tokSelec !== null && tokSelec.length > 10) {
                try {
                    tokSelect = JSON.parse(tokSelec);
                    if (tokSelect.listed && tokSelect.unlisted && tokSelect.inactive && tokSelect.spam && tokSelect.blocked && tokSelect.old) {
                        tokenSelection = tokSelect;
                    }
                } catch (e) { }
            }


            if (localStorage.getItem("decimals") === null) {
                decimals = false;
            } else {
                let dec = localStorage.getItem('decimals');
                decimals = dec === "true";
            }


            let enabledExchanges = localStorage.getItem('enabledExchanges-Balance');
            if (enabledExchanges !== null && enabledExchanges.length > 0) {
                try {
                    enabledExchanges = JSON.parse(enabledExchanges);
                    Object.keys(exchanges).forEach(function (key) {
                        exchanges[key].enabled = enabledExchanges[key];
                    });
                } catch (e) { }
            }
            exchanges['Wallet'].enabled = true;


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

            let sortColumn = 'Est. ETH';
            let sortIndex = Math.max(0, tableHeaders.findIndex((x) => x.title == sortColumn));

            // determine which exchange columns need to be hidden
            let hiddenList = tableHeaders.map(x => x.title).filter(x => !balanceHeaders[x]);
            hiddenList = hiddenList.map(head => tableHeaders.findIndex((x) => x.title == head));

            let numberList = tableHeaders.map(x => x.title).filter(x => exchanges[x] || x == "Total" || x == "Est. ETH");
            numberList = numberList.map(head => tableHeaders.findIndex((x) => x.title == head));

            let priceIndices = ["Bid", "Ask"].map(head => tableHeaders.findIndex((x) => x.title == head));

            balanceTable = $('#resultTable').DataTable({
                "paging": false,
                "order": [[sortIndex, "desc"]],
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
                    {
                        aTargets: numberList, "mRender": function (data, type, full) {
                            if (type == 'display' && data && data != "-") {
                                return '<span data-toggle="tooltip" title="' + data + '">' + _util.displayNotation(data, fixedDecimals) + '</span>';
                            }
                            return data;
                        }
                    },
                    {
                        aTargets: priceIndices, "mRender": function (data, type, row) {
                            if (type == 'display' && data && data != "-") {
                                return '<span data-toggle="tooltip" title="' + data + '">' + _util.displayNotation(data, fixedDecimals + 2) + '</span>';
                            }
                            return data;
                        }

                    }
                    //    { sClass: "dt-body-left", aTargets: [0]},
                    //    { sClass: "dt-body-right", aTargets: ['_all'] },
                ],
                "dom": 'frtip',
                "language": {
                    "search": '<i class="dim fa fa-search"></i>',
                    "searchPlaceholder": " Token Symbol / Name",
                    "zeroRecords": "No balances loaded",
                    "info": "Showing _TOTAL_ balances",
                    "infoEmpty": "No balances found",
                    "infoFiltered": "(filtered from _MAX_ )"
                },
                "drawCallback": function (settings) {
                    hidePopovers(true);

                    // Token name popovers
                    $("[data-toggle=popover]").popover({
                        html: true,
                        trigger: 'manual'
                    }).on('click', function (e) {

                        let hideThis = false;
                        if ($(this).data("bs.popover")) {
                            if ($(this).data("bs.popover").isVisible) {
                                hideThis = true;
                            }
                        }

                        if (activePopover) {
                            hidePopover(activePopover);
                            activePopover = undefined;
                        }
                        if (!hideThis) {
                            $(this).popover('show');
                            if ($(this).data("bs.popover")) {
                                $(this).data("bs.popover").isVisible = true; //custom attribute
                            }
                            activePopover = this;
                        }
                        // handle clicking on the popover itself
                        $('.popover').off('click').on('click', function (e) {
                            e.stopPropagation(); // prevent event for bubbling up => will not get caught with document.onclick
                        });
                        e.stopPropagation();
                    });

                    // Number raw value tooltip
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
                }
            });
            table1Loaded = true;
        } else {
            // update which columns are hidden
            for (let i = 0; i < tableHeaders.length; i++) {
                let enabled = balanceHeaders[tableHeaders[i].title];
                balanceTable.column(i).visible(enabled);
            }
        }

        balanceTable.clear();
        if (dataSet.length > 0) {
            for (let i = 0; i < dataSet.length; i++) {
                balanceTable.rows.add(dataSet[i]);
            }
        }
        //    balanceTable.columns.adjust().fixedColumns().relayout().draw();
        balanceTable.draw();


        var allDisplayed = true;
        for (let i = 0; i < keys.length; i++) {
            if (!exchanges[keys[i]].displayed) {
                allDisplayed = false;
            }
        }
        allDisplayed = allDisplayed && exchangePrices.displayedAll;
        trigger_1 = allDisplayed;

        if (trigger_1) {
            disableInput(false);
            hideLoading(true);
            running = false;
            requestID++;
            buttonLoading(true);
        }
    }


    // Builds the HTML Table out of myList.
    function buildTableRows(myList, headers) {
        let resultTable = [];

        for (let i = 0; i < myList.length; i++) {

            if (!tokenSelection.unlisted.show && myList[i].Unlisted)
                continue;
            let row$ = $('<tr/>');

            for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                let cellValue = myList[i][headers[colIndex].title];
                if (!cellValue && cellValue !== 0) cellValue = "";
                let head = headers[colIndex].title;

                if (head == 'Total' || exchanges[head] || head == 'Bid' || head == 'Ask' || head == 'Est. ETH') {
                    if (cellValue || cellValue === 0) {
                        // use full number string without exponential values
                        let num = _util.exportNotation(cellValue);
                        row$.append($('<td/>').html(num));
                    } else {
                        if (cellValue === "" && (head == 'Bid' || head == 'Ask')) {
                            cellValue = '-';
                        }
                        row$.append($('<td data-sort="-1"/>').html(cellValue));
                    }
                }
                else if (head == 'USD' || head == 'EUR') {
                    let prefix = '$';
                    if (head == 'EUR') {
                        prefix = '€';
                    }
                    let num = '<span style="color:gray">' + prefix + cellValue + '</span>';
                    row$.append($('<td/>').html(num));
                }
                else if (head == 'Name') {
                    //token.name -> symbol
                    //token.name2 -> name
                    let token = _delta.uniqueTokens[myList[i].Address];
                    if (token) {
                        let popover = _delta.makeTokenPopover(token);
                        let search = token.name;
                        if (token.name2) {
                            search += ' ' + token.name2;
                        }
                        let name = "";
                        if (token.name) {
                            name = token.name.toLowerCase();
                        }
                        //sort a token by symbol, allow search to see the full name
                        row$.append($('<td data-sort="' + name + '" data-search="' + search + '"/>').html(popover));
                    } else {
                        row$.append($('<td data-sort=" "/>').html(""));
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

    var balanceHeaders = { 'Name': 1, 'Wallet': 1, 'Total': 1, 'Value': 1, 'Bid': 1, 'Ask': 0, 'Est. ETH': 1, 'USD': 0, 'EUR': 0 };

    // Adds a header row to the table and returns the set of columns.
    // Need to do union of keys from all records as some records may not contain
    // all records.
    function getColumnHeaders(myList, headers) {
        var columnSet = {};
        var columns = [];

        // ensure header is a digit 1, 0
        Object.keys(headers).map((k) => { headers[k] = Number(headers[k]); });

        if (myList.length == 0) {
            myList = balancesPlaceholder;
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

    function downloadBalances() {
        if (lastResult) {
            var allBal = lastResult;
            allBal = allBal.filter((x) => { return x.Total > 0; });

            let bidText = 'Bid (ETH)';
            if (useAsk)
                bidText = 'Ask (ETH)';

            var AA = ['Token'];
            Object.keys(exchanges).forEach(function (key) {
                if (exchanges[key].enabled) {
                    AA.push(key);
                }
            });

            AA = AA.concat(['Total', bidText, 'Estimated value (ETH)', 'Token contract address']);

            const A = [AA];
            // initialize array of rows with header row as 1st item
            for (var i = 0; i < allBal.length; ++i) {
                let bid = allBal[i].Bid;
                if (useAsk)
                    bid = allBal[i].Ask;
                let estimate = '';
                if (bid)
                    estimate = bid * allBal[i].Total

                var arr = [allBal[i].Name];
                Object.keys(exchanges).forEach(function (key) {
                    if (exchanges[key].enabled) {
                        arr.push(allBal[i][key]);
                    }
                });

                let contrAddr = allBal[i].Address;
                if (arr[0] === 'ETH')
                    contrAddr = 'Not a token';

                arr = arr.concat([allBal[i].Total, bid, estimate, contrAddr]);

                for (let j = 0; j < arr.length; j++) {
                    //remove exponential notation
                    if (A[0][j] == 'Wallet' || exchanges[A[0][j]] || A[0][j] == 'Total' || A[0][j] == 'Estimated value (ETH)' || A[0][j] == 'Bid (ETH)' || A[0][j] == 'Ask (ETH)') {
                        if (arr[j] != '' && arr[j] != ' ')
                            arr[j] = _util.exportNotation(arr[j]);
                    }

                    // add quotes
                    //arr[j] = `\"${arr[j]}\"`;
                }

                A.push(arr);
            }
            var csvRows = [];
            for (var i = 0, l = A.length; i < l; ++i) {
                csvRows.push(A[i].join(','));   // unquoted CSV row
            }
            var csvString = csvRows.join("\r\n");

            var sp = document.createElement('span');
            sp.innerHTML = "Export balances as CSV ";
            var a = document.createElement('a');
            a.innerHTML = '<i class="fa fa-download" aria-hidden="true"></i>';
            a.href = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
            a.target = '_blank';
            a.download = _util.formatDate(_util.toDateTimeNow(true), true) + '-' + publicAddr + '.csv';
            sp.appendChild(a);

            $('#downloadBalances').html('');
            var parent = document.getElementById('downloadBalances');
            parent.appendChild(sp);
            //parent.appendCild(a);
        }

    }

}