pragma solidity ^0.5.0;

// erc20 implementations for testing
// needs some SafeMath for actual usage

// deliberately missing allowance() and balanceOf()
contract IncompleteERC20 {
    uint256 constant internal MAX_UINT256 = 2**256 - 1;
    mapping (address => uint256) public balances;
    mapping (address => mapping (address => uint256)) public allowed;
   
    uint256 public totalSupply;
   
    string public name;      
    uint8 public decimals;  
    string public symbol;

	event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
	
    constructor (
        uint256 _initialAmount,
        string memory _tokenName,
        uint8 _decimalUnits,
        string memory _tokenSymbol
    ) public {
        balances[msg.sender] = _initialAmount;
        totalSupply = _initialAmount;
        name = _tokenName;
        decimals = _decimalUnits;
        symbol = _tokenSymbol;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value);
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        uint256 allowance = allowed[_from][msg.sender];
        require(balances[_from] >= _value && allowance >= _value);
        balances[_to] += _value;
        balances[_from] -= _value;
        if (allowance < MAX_UINT256) {
            allowed[_from][msg.sender] -= _value;
        }
        emit Transfer(_from, _to, _value);
        return true;
    }

    /*
    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }
    */

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value); //solhint-disable-line indent, no-unused-vars
        return true;
    }

    /* 
    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    } 
    */
}

//make it a valid ERC20
contract ERC20 is IncompleteERC20 {

    constructor (
        uint256 _initialAmount,
        string memory _tokenName,
        uint8 _decimalUnits,
        string memory _tokenSymbol
    )  IncompleteERC20(_initialAmount, _tokenName, _decimalUnits, _tokenSymbol) 
    public { }
    
    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }
    
    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }
}

// ERC20 with failing functions
contract BadERC20 is IncompleteERC20 {
    
    constructor (
        uint256 _initialAmount,
        string memory _tokenName,
        uint8 _decimalUnits,
        string memory _tokenSymbol
    )  IncompleteERC20(_initialAmount, _tokenName, _decimalUnits, _tokenSymbol) 
    public { }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        require(false);
        return 0;
    }
    
    function balanceOf(address _owner) public view returns (uint256 balance) {
        require(false);
        return 0;
    }
}

//erc20 contract that can selfdestruct
contract KillERC20 is ERC20 {
    
    constructor (
        uint256 _initialAmount,
        string memory _tokenName,
        uint8 _decimalUnits,
        string memory _tokenSymbol
    )  ERC20(_initialAmount, _tokenName, _decimalUnits, _tokenSymbol) 
    public { }

    function kill() external {
		selfdestruct(msg.sender);
	}
}

// ERC20 with public variables instead of normal functions
contract AltERC20 is IncompleteERC20 {

    mapping (address => uint256) public balanceOf;
    mapping (address => mapping (address => uint256)) public allowance;

    constructor (
        uint256 _initialAmount,
        string memory _tokenName,
        uint8 _decimalUnits,
        string memory _tokenSymbol
    )  IncompleteERC20(_initialAmount, _tokenName, _decimalUnits, _tokenSymbol) 
    public { }
    
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value);
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        uint256 allowance2 = allowance[_from][msg.sender];
        require(balances[_from] >= _value && allowance2 >= _value);
        balances[_to] += _value;
        balances[_from] -= _value;
        if (allowance2 < MAX_UINT256) {
            allowance[_from][msg.sender] -= _value;
        }
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
}