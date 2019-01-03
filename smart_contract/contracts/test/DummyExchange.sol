pragma solidity ^0.5.0;

// a dummy exchange implementation to test deposited balances


contract SafeMath {
  function safeAdd(uint256 a, uint256 b) internal pure returns (uint256 c) {
    c = a + b;
    require(c >= a);
    return c;
  }
}

contract Token {
  function balanceOf(address _owner) external view returns (uint256 balance);
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool success);
}

contract DummyExchange is SafeMath{
    
    mapping (address => mapping (address => uint256)) public balances;
    
    constructor() public {}
      
    function deposit() external payable {
      balances[address(0x0)][msg.sender] = safeAdd(balances[address(0x0)][msg.sender], msg.value);
    }

    // requires token.approve
    function depositToken(address token, uint amount) external {
      require(token != address(0x0));

      require(Token(token).transferFrom(msg.sender, address(this), amount));
      balances[token][msg.sender] = safeAdd(balances[token][msg.sender], amount);
    }
    
	/* Different balance functions to emulate different exchanges */
	
    function balanceOf(address token, address user) external view returns (uint) {
      return balances[token][user];
    }
	
	function getBalance(address token, address user) external view returns (uint) {
      return balances[token][user];
    }
	
	function tokens(address user, address token) external view returns (uint) {
      return balances[token][user];
    }
}

