//handle address parsing/ saving /loading for multiple html pages


// user addresses
var publicAddr = '';
var savedAddr = '';
var metamaskAddr = '';

// check if input address is valid
function getAddress(addr) {

    let address = '';
    //get address from input or else from html input
    var inputAddress = addr ? addr : document.getElementById('address').value;
    if (inputAddress) {
        address = _util.addressFromString(inputAddress);
        if (!address) {
            //transaction hash, redirect to tx info
            let hash = _util.hashFromString(inputAddress);
            if (hash) {
                window.location = window.location.origin + window.location.pathname + '/../tx.html#' + hash;
                return;
            }
        }
    }
    //address either vald or ''
    if (!publicAddr || publicAddr !== address) {
        setAddressUI(address);
    }

    if (!address)
        address = undefined;

    return address;
}

function setAddressUI(address) {
    if (!address) {
        address = '';
    }

    //image icons
    setAddrImage(address);
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
        if (savedAddr) {
            $('#savedSection').removeClass('hidden');
        }
    } else if (savedAddr) {

        if (address.toLowerCase() === savedAddr.toLowerCase()) { // valid address, same as saved
            $('#save').addClass('hidden');
            $('#forget').removeClass('hidden');
            $('#savedSection').addClass('hidden');
            if (savedAddr === metamaskAddr) {
                document.getElementById('currentAddrDescr').innerHTML = 'Metamask address (Saved)';
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
            if (metamaskAddr !== savedAddr)
                document.getElementById('currentAddrDescr').innerHTML = 'Metamask address';
            $('#metamaskSection').addClass('hidden');
        } else {
            $('#metamaskSection').removeClass('hidden');
        }
    }

    if (address) {
        if (isAddressPage) {
            //input text box
            document.getElementById('address').value = address;
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
}

//forget the current address saved in cache
function forget() {
    if (publicAddr) {
        if (publicAddr.toLowerCase() === savedAddr.toLowerCase()) {
            savedAddr = '';
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
            window.location.hash = savedAddr;
            myClick();
        }

    }
    return false;
}

//use address detected from Metamask as input
function loadMetamask() {
    if (metamaskAddr) {
        //publicAddr = metamaskAddr;
        publicAddr = getAddress(metamaskAddr);

        $('#metamaskSection').addClass('hidden');
        setStorage();
        if (isAddressPage) {
            window.location.hash = metamaskAddr;
            myClick();
        }
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
