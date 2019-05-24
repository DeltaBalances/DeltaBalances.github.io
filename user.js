//handle address parsing/ saving /loading for multiple html pages


// user addresses
var publicAddr = '';
var savedAddr = '';
var metamaskAddr = '';

//secondary addresses in search input
var extraAddresses = [];

// check if input address is valid
function getAddress(paramAddr) {

    let address = '';
    let txHash = '';

    let secondaryAddresses = [];
    if (paramAddr) { //possibly multiple addresses in url  #0x....-0x....
        paramAddr = paramAddr.replace(/-/g, ",");
    }

    //get address from input or else from html input
    var inputAddress = paramAddr ? paramAddr : document.getElementById('address').value;
    if (inputAddress) {

        // if address read from html input, check for multiple
        let inputAddresses = inputAddress.split(',');

        for (let i = 0; i < inputAddresses.length; i++) {
            let addr = _util.addressFromString(inputAddresses[i]);
            if (!address) {
                if (addr) {
                    address = addr;
                } else {
                    // maybe a transaction hash
                    let hash = _util.hashFromString(inputAddresses[i]);
                    if (hash) {
                        txHash = hash;
                    }
                }
            } else { // we already have a primary addr
                if (secondaryAddresses.length < 6 && addr !== address && secondaryAddresses.indexOf(addr) == -1) {
                    secondaryAddresses.push(addr);
                }
            }
        }

    }

    // we only detected a tx hash, redirect to tx info
    if (txHash && !address && !paramAddr) {
        window.location = window.location.origin + window.location.pathname + '/../tx.html#' + txHash;
        return;
    }

    //address either vald or ''
  //  if (!publicAddr || publicAddr !== address || secondaryAddresses.length > 0 || secondaryAddresses.length < extraAddresses.length) {
        setAddressUI(address, secondaryAddresses);
    //}
    extraAddresses = secondaryAddresses;

    if (!address)
        address = undefined;

    return address;
}

function setAddressUI(address, secondaryAddresses) {
    if (!address) {
        address = '';
    }

    let supportsSecondary = (document.getElementById('extraAddresses') !== null);

    //image icons
    setAddrImage(address);
    $('.mini-metamask').addClass('hidden');
    if (isAddressPage) {
        //big address link at the top
        document.getElementById('addr').innerHTML = address ? _util.addressLink(address, true, false) : '';
    }
    // sidebar etherscan link
    $('#etherscan').attr("href", address ? _util.addressLink(address, false, false) : '');

    //sidebar UI
    if (!savedAddr || address && (address.toLowerCase() !== savedAddr.toLowerCase())) { // valid address, nothing saved
        $('#save').removeClass('hidden');
        $('#forget').addClass('hidden');
        document.getElementById('currentAddrDescr').innerHTML = 'Input address';
        if (savedAddr) {
            $('#savedSection').removeClass('hidden');
        }
    } else if (savedAddr) {

        if (address.toLowerCase() === savedAddr.toLowerCase()) { // valid address, same as saved
            $('#save').addClass('hidden');
            $('#forget').removeClass('hidden');
            $('#savedSection').addClass('hidden');
            if (savedAddr === metamaskAddr) {
                document.getElementById('currentAddrDescr').innerHTML = 'Web3 address (Saved)';
            } else {
                document.getElementById('currentAddrDescr').innerHTML = 'Saved address';
            }
        } else {
            $('#savedSection').removeClass('hidden');
        }
    }
    //detected address section of sidebar
    if (metamaskAddr) {
        if (address.toLowerCase() === metamaskAddr.toLowerCase()) {
            if (metamaskAddr !== savedAddr) {
                document.getElementById('currentAddrDescr').innerHTML = 'Web3 address';
            } else {
                document.getElementById('currentAddrDescr').innerHTML = 'Web3 address (Saved)';
            }
            $('#metamaskSection').addClass('hidden');
            $('.metamask-import').addClass('hidden');
            $('#web3button').addClass('hidden');

            $('.mini-metamask').removeClass('hidden');
        } else {
            $('#metamaskSection').removeClass('hidden');
            $('#metamask-inactive').removeClass('hidden');
            $('.metamask-import').addClass('hidden');
            $('#web3button').removeClass('hidden');
        }
    } else {
        $('#metamaskSection').removeClass('hidden');
        $('.metamask-import').removeClass('hidden');
        $('#metamask-inactive').addClass('hidden');
    }

    if (address) {
        if (isAddressPage) {

            if (!supportsSecondary || secondaryAddresses.length == 0) {
                //input text box
                document.getElementById('address').value = address;
                window.location.hash = address;
            } else {
                document.getElementById('address').value = address + ', ' + secondaryAddresses.join(', ');
                window.location.hash = address + '-' + secondaryAddresses.join('-');
            }
        }

        //handle user wallet right-sidebar
        $('#userToggle').removeClass('hidden');
        document.getElementById('currentAddr').innerHTML = address.slice(0, 16); // side menu
        document.getElementById('currentAddr2').innerHTML = address.slice(0, 8); //top bar

        $('#walletInfo').removeClass('hidden');

    } else {

        document.getElementById('currentAddr').innerHTML = '0x......' // side menu
        document.getElementById('currentAddr2').innerHTML = '0x......'; //top bar
        document.getElementById('currentAddrDescr').innerHTML = 'Input address';

        $('#walletInfo').addClass('hidden');
    }

    // if page support extra address display (trade history only for now)
    if (supportsSecondary) {
        let htmlText = '';
        if (secondaryAddresses.length > 0) {
            for (let i = 0; i < secondaryAddresses.length; i++) {
                htmlText += '<li> <i class="fa fa-plus dim" aria-hidden="true"></i> ' + _util.addressLink(secondaryAddresses[i], true, false) + '</li>';
            }
        }
        document.getElementById('extraAddresses').innerHTML = htmlText;
    }
}

//forget the current address saved in cache
function forget() {
    if (publicAddr) {
        if (publicAddr.toLowerCase() === savedAddr.toLowerCase()) {
            savedAddr = '';
            setAddressUI(publicAddr, extraAddresses);
            $('#savedSection').addClass('hidden');
            $('#save').removeClass('hidden');
            $('#forget').addClass('hidden');
        }
    }
    //$('#address').val('');
    //publicAddr = getAddress('');

    setStorage();
    if (!publicAddr && !savedAddr && !metamaskAddr) {
        $('#userToggle').click();
        $('#userToggle').addClass('hidden');
    }

    if (isAddressPage) {
        window.location.hash = "";
        // myClick();
    }

    return false;
}

//save current selected address in cache
function save() {
    savedAddr = publicAddr;
    publicAddr = getAddress(savedAddr);

    $('#savedAddress').html(savedAddr.slice(0, 16));
    $('#savedSection').addClass('hidden');
    $('#save').addClass('hidden');
    $('#forget').removeClass('hidden');
    setSavedImage(savedAddr);
    setStorage();

    return false;
}

//use address saved in cache as input
function loadSaved() {
    if (savedAddr) {
        //publicAddr = savedAddr;
        publicAddr = getAddress(savedAddr);
        $('#forget').removeClass('hidden');
        setStorage();
        if (isAddressPage) {
            myClick();
        }
    }
    return false;
}

function requestMetamask(popup = false) {
    _util.getWeb3Address(popup, (response, changed) => {
        if (response) {
            metamaskAddr = response;
            setMetamaskImage(metamaskAddr);
            $('#metamaskAddress').html(metamaskAddr.slice(0, 16));
            if (popup || changed) {
                loadMetamask();
            } else {
                let addr = publicAddr;
                if (!addr) {
                    addr = metamaskAddr;
                }
                setAddressUI(addr, extraAddresses);
            }
        }
    });
}

//use address detected from Metamask as input
function loadMetamask() {
    if (metamaskAddr) {
        //publicAddr = metamaskAddr;
        publicAddr = getAddress(metamaskAddr);

        $('#metamaskSection').addClass('hidden');
        $('.metamask-import').addClass('hidden');
        $('#web3button').addClass('hidden');
        setStorage();
        if (isAddressPage && pageType !== 'history') {
            myClick();
        }
    } else {
        $('#metamaskSection').removeClass('hidden');
        $('.metamask-import').removeClass('hidden');
        $('#web3button').removeClass('hidden');
        $('#metamask-inactive').addClass('hidden');
    }
    return false;
}

function setAddrImage(addr) {
    var icon = document.getElementById('addrIcon');
    var icon2 = document.getElementById('currentAddrImg');
    var icon3 = document.getElementById('userImage');

    if (addr) {
        if (isAddressPage) {
            icon.style.backgroundImage = 'url(' + blockies.create({ seed: addr.toLowerCase(), size: 8, scale: 16 }).toDataURL() + ')';
        }
        var smallImg = 'url(' + blockies.create({ seed: addr.toLowerCase(), size: 8, scale: 4 }).toDataURL() + ')';
        icon2.style.backgroundImage = smallImg;
        icon3.style.backgroundImage = smallImg;
    } else {
        if (isAddressPage) {
            icon.style.backgroundImage = '';
        }
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
