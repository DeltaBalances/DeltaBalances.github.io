//exchange & token contract ABIs
module.exports = {
  DeltaBalances: [
    "function depositedBalances(address exchange, address user, address[] tokens) view returns (uint256[] balances)",
    "function depositedBalancesGeneric(address exchange, bytes4 selector, address user, address[] tokens, bool userFirst) view returns (uint256[] balances)",
    "function depositedEtherGeneric(address exchange, bytes4 selector, address user) view returns (uint256)",
    "function getFunctionSelector(string functionSignature) pure returns (bytes4)",
    "function tokenAllowances(address spenderContract, address user, address[] tokens) view returns (uint256[] allowances)",
    "function tokenBalances(address user, address[] tokens) view returns (uint256[] balances)"
  ],

  /* ABIs below are stripped of functions and events not relevant to the site (only trading, tokens, etc.) 
    functions or events might be omitted if another ABI already contains them. (erc20 & erc721 have identical transfer, aprove, etc.)
 */

  //uniswap v1 factory
  UniFactory: [
    "event NewExchange(address indexed token, address indexed exchange)",
    "function createExchange(address token) returns (address out)",
    "function getExchange(address token) view returns (address out)",
    "function getToken(address exchange) view returns (address out)",
    "function getTokenWithId(uint256 token_id) view returns (address out)",
    "function tokenCount() view returns (uint256 out)"
  ],


  // token interactions
  // Generic ERC20, uses WETH token to also capture ETH wrapping/unwrapping (withdraw, deposit) 
  Erc20: [
    "function approve(address guy, uint256 wad) returns (bool)",
    "function transferFrom(address src, address dst, uint256 wad) returns (bool)",
    "function withdraw(uint256 wad)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)",
    "function transfer(address dst, uint256 wad) returns (bool)",
    "function deposit() payable",
    "function allowance(address, address) view returns (uint256)",
    "event Approval(address indexed src, address indexed guy, uint256 wad)",
    "event Transfer(address indexed src, address indexed dst, uint256 wad)",
    "event Deposit(address indexed dst, uint256 wad)",
    "event Withdrawal(address indexed src, uint256 wad)"
  ],
  //Generic ERC721
  Erc721: [
    "function getApproved(uint256 _tokenId) view returns (address)",
    "function safeTransferFrom(address _from, address _to, uint256 _tokenId) payable",
    "function ownerOf(uint256 _tokenId) view returns (address _owner)",
    "function setApprovalForAll(address _operator, bool _approved)",
    "function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes data) payable",
    "function isApprovedForAll(address _owner, address _operator) view returns (bool)",
    "event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved)"
  ],
  //bancor ETH token for Issuance,Destruction
  Erc20Bancor: [
    "function withdrawTo(address _to, uint256 _amount)",
    "function withdrawTokens(address _token, address _to, uint256 _amount)",
    "event Issuance(uint256 _amount)",
    "event Destruction(uint256 _amount)"
  ],
  //input for wrapping/unwrapping ethfinex wrappers
  EthfinexLockToken: [
    "function withdraw(uint256 _value, uint8 v, bytes32 r, bytes32 s, uint256 signatureValidUntilBlock) returns (bool)",
    "function withdrawDifferentToken(address _token, bool _erc20old) returns (bool)",
    "function deposit(uint256 _value, uint256 _forTime) payable returns (bool success)"
  ],
  //veil eth wrapper for depositAndApprove,withdrawAndTransfer
  VeilETH: [
    "function withdrawAndTransfer(uint256 _amount, address _target) returns (bool)",
    "function depositAndApprove(address _spender, uint256 _allowance) payable returns (bool)"
  ],
  //define 0x V2&3 assetData for decoding
  '0xData': [
    "function ERC721Token(address, uint256)",
    "function MultiAsset(uint256[], bytes[])",
    "function ERC1155Assets(address, uint256[], uint256[], bytes)",
    "function StaticCall(address, bytes, bytes32)",
    "function ERC20Bridge(address, address, bytes)",
    "function ERC20Token(address)"
  ],

  //exchanges
  EtherDelta: [
    "function trade(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, address user, uint8 v, bytes32 r, bytes32 s, uint256 amount)",
    "function order(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce)",
    "function cancelOrder(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, uint8 v, bytes32 r, bytes32 s)",
    "function withdraw(uint256 amount)",
    "function depositToken(address token, uint256 amount)",
    "function withdrawToken(address token, uint256 amount)",
    "event Order(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, address user)",
    "event Cancel(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, address user, uint8 v, bytes32 r, bytes32 s)",
    "event Trade(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, address get, address give)",
    "event Deposit(address token, address user, uint256 amount, uint256 balance)",
    "event Withdraw(address token, address user, uint256 amount, uint256 balance)"
  ],
  TokenStore: [
    "function depositTokenForUser(address _token, uint256 _amount, address _user)",
    "function depositForUser(address _user) payable",
    "function migrateFunds(address[] _tokens)",
    "event Trade(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, address get, address give, uint256 nonce)"
  ],
  Idex: [
    "function adminWithdraw(address token, uint256 amount, address user, uint256 nonce, uint8 v, bytes32 r, bytes32 s, uint256 feeWithdrawal) returns (bool success)",
    "function invalidateOrdersBefore(address user, uint256 nonce)",
    "function trade(uint256[8] tradeValues, address[4] tradeAddresses, uint8[2] v, bytes32[4] rs) returns (bool success)",
    "function withdraw(address token, uint256 amount) returns (bool success)",
    "event Order(address tokenBuy, uint256 amountBuy, address tokenSell, uint256 amountSell, uint256 expires, uint256 nonce, address user, uint8 v, bytes32 r, bytes32 s)"
  ],
  '0x': [
    "function fillOrdersUpTo(address[5][] orderAddresses, uint256[6][] orderValues, uint256 fillTakerTokenAmount, bool shouldThrowOnInsufficientBalanceOrAllowance, uint8[] v, bytes32[] r, bytes32[] s) returns (uint256)",
    "function cancelOrder(address[5] orderAddresses, uint256[6] orderValues, uint256 cancelTakerTokenAmount) returns (uint256)",
    "function batchFillOrKillOrders(address[5][] orderAddresses, uint256[6][] orderValues, uint256[] fillTakerTokenAmounts, uint8[] v, bytes32[] r, bytes32[] s)",
    "function fillOrKillOrder(address[5] orderAddresses, uint256[6] orderValues, uint256 fillTakerTokenAmount, uint8 v, bytes32 r, bytes32 s)",
    "function batchFillOrders(address[5][] orderAddresses, uint256[6][] orderValues, uint256[] fillTakerTokenAmounts, bool shouldThrowOnInsufficientBalanceOrAllowance, uint8[] v, bytes32[] r, bytes32[] s)",
    "function batchCancelOrders(address[5][] orderAddresses, uint256[6][] orderValues, uint256[] cancelTakerTokenAmounts)",
    "function fillOrder(address[5] orderAddresses, uint256[6] orderValues, uint256 fillTakerTokenAmount, bool shouldThrowOnInsufficientBalanceOrAllowance, uint8 v, bytes32 r, bytes32 s) returns (uint256 filledTakerTokenAmount)",
    "event LogFill(address indexed maker, address taker, address indexed feeRecipient, address makerToken, address takerToken, uint256 filledMakerTokenAmount, uint256 filledTakerTokenAmount, uint256 paidMakerFee, uint256 paidTakerFee, bytes32 indexed tokens, bytes32 orderHash)",
    "event LogCancel(address indexed maker, address indexed feeRecipient, address makerToken, address takerToken, uint256 cancelledMakerTokenAmount, uint256 cancelledTakerTokenAmount, bytes32 indexed tokens, bytes32 orderHash)",
    "event LogError(uint8 indexed errorId, bytes32 indexed orderHash)"
  ],
  '0x2': [
    "function batchFillOrders(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData)[] orders, uint256[] takerAssetFillAmounts, bytes[] signatures) returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) totalFillResults)",
    "function preSign(bytes32 hash, address signerAddress, bytes signature)",
    "function matchOrders(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData) leftOrder, tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData) rightOrder, bytes leftSignature, bytes rightSignature) returns (tuple(tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) left, tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) right, uint256 leftMakerAssetSpreadAmount) matchedFillResults)",
    "function fillOrderNoThrow(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData) order, uint256 takerAssetFillAmount, bytes signature) returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) fillResults)",
    "function batchCancelOrders(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData)[] orders)",
    "function batchFillOrKillOrders(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData)[] orders, uint256[] takerAssetFillAmounts, bytes[] signatures) returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) totalFillResults)",
    "function cancelOrdersUpTo(uint256 targetOrderEpoch)",
    "function batchFillOrdersNoThrow(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData)[] orders, uint256[] takerAssetFillAmounts, bytes[] signatures) returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) totalFillResults)",
    "function fillOrKillOrder(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData) order, uint256 takerAssetFillAmount, bytes signature) returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) fillResults)",
    "function marketSellOrders(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData)[] orders, uint256 takerAssetFillAmount, bytes[] signatures) returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) totalFillResults)",
    "function marketBuyOrdersNoThrow(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData)[] orders, uint256 makerAssetFillAmount, bytes[] signatures) returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) totalFillResults)",
    "function fillOrder(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData) order, uint256 takerAssetFillAmount, bytes signature) returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) fillResults)",
    "function executeTransaction(uint256 salt, address signerAddress, bytes data, bytes signature)",
    "function cancelOrder(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData) order)",
    "function marketSellOrdersNoThrow(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData)[] orders, uint256 takerAssetFillAmount, bytes[] signatures) returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) totalFillResults)",
    "function marketBuyOrders(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData)[] orders, uint256 makerAssetFillAmount, bytes[] signatures) returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) totalFillResults)",
    "event Fill(address indexed makerAddress, address indexed feeRecipientAddress, address takerAddress, address senderAddress, uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, bytes32 indexed orderHash, bytes makerAssetData, bytes takerAssetData)",
    "event Cancel(address indexed makerAddress, address indexed feeRecipientAddress, address senderAddress, bytes32 indexed orderHash, bytes makerAssetData, bytes takerAssetData)",
    "event CancelUpTo(address indexed makerAddress, address indexed senderAddress, uint256 orderEpoch)"
  ],
  '0xForwarder2': [
    "function marketBuyOrdersWithEth(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData)[] orders, uint256 makerAssetFillAmount, bytes[] signatures, tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData)[] feeOrders, bytes[] feeSignatures, uint256 feePercentage, address feeRecipient) payable returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) orderFillResults, tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) feeOrderFillResults)",
    "function withdrawAsset(bytes assetData, uint256 amount)",
    "function marketSellOrdersWithEth(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData)[] orders, bytes[] signatures, tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData)[] feeOrders, bytes[] feeSignatures, uint256 feePercentage, address feeRecipient) payable returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) orderFillResults, tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid) feeOrderFillResults)"
  ],
  '0x3': [
    "event Cancel(address indexed makerAddress, address indexed feeRecipientAddress, bytes makerAssetData, bytes takerAssetData, address senderAddress, bytes32 indexed orderHash)",
    "event Fill(address indexed makerAddress, address indexed feeRecipientAddress, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData, bytes32 indexed orderHash, address takerAddress, address senderAddress, uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid)",
    "event TransactionExecution(bytes32 indexed transactionHash)",
    "function batchCancelOrders(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] orders) payable",
    "function batchExecuteTransactions(tuple(uint256 salt, uint256 expirationTimeSeconds, uint256 gasPrice, address signerAddress, bytes data)[] transactions, bytes[] signatures) payable returns (bytes[])",
    "function batchFillOrKillOrders(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] orders, uint256[] takerAssetFillAmounts, bytes[] signatures) payable returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid)[] fillResults)",
    "function batchFillOrders(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] orders, uint256[] takerAssetFillAmounts, bytes[] signatures) payable returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid)[] fillResults)",
    "function batchFillOrdersNoThrow(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] orders, uint256[] takerAssetFillAmounts, bytes[] signatures) payable returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid)[] fillResults)",
    "function batchMatchOrders(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] leftOrders, tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] rightOrders, bytes[] leftSignatures, bytes[] rightSignatures) payable returns (tuple(tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid)[] left, tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid)[] right, uint256 profitInLeftMakerAsset, uint256 profitInRightMakerAsset) batchMatchedFillResults)",
    "function batchMatchOrdersWithMaximalFill(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] leftOrders, tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] rightOrders, bytes[] leftSignatures, bytes[] rightSignatures) payable returns (tuple(tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid)[] left, tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid)[] right, uint256 profitInLeftMakerAsset, uint256 profitInRightMakerAsset) batchMatchedFillResults)",
    "function cancelOrder(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData) order) payable",
    "function executeTransaction(tuple(uint256 salt, uint256 expirationTimeSeconds, uint256 gasPrice, address signerAddress, bytes data) transaction, bytes signature) payable returns (bytes)",
    "function fillOrKillOrder(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData) order, uint256 takerAssetFillAmount, bytes signature) payable returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid) fillResults)",
    "function fillOrder(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData) order, uint256 takerAssetFillAmount, bytes signature) payable returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid) fillResults)",
    "function marketBuyOrdersFillOrKill(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] orders, uint256 makerAssetFillAmount, bytes[] signatures) payable returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid) fillResults)",
    "function marketBuyOrdersNoThrow(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] orders, uint256 makerAssetFillAmount, bytes[] signatures) payable returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid) fillResults)",
    "function marketSellOrdersFillOrKill(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] orders, uint256 takerAssetFillAmount, bytes[] signatures) payable returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid) fillResults)",
    "function marketSellOrdersNoThrow(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] orders, uint256 takerAssetFillAmount, bytes[] signatures) payable returns (tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid) fillResults)",
    "function matchOrders(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData) leftOrder, tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData) rightOrder, bytes leftSignature, bytes rightSignature) payable returns (tuple(tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid) left, tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid) right, uint256 profitInLeftMakerAsset, uint256 profitInRightMakerAsset) matchedFillResults)",
    "function matchOrdersWithMaximalFill(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData) leftOrder, tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData) rightOrder, bytes leftSignature, bytes rightSignature) payable returns (tuple(tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid) left, tuple(uint256 makerAssetFilledAmount, uint256 takerAssetFilledAmount, uint256 makerFeePaid, uint256 takerFeePaid, uint256 protocolFeePaid) right, uint256 profitInLeftMakerAsset, uint256 profitInRightMakerAsset) matchedFillResults)",
    "function preSign(bytes32 hash) payable"
  ],
  '0xForwarder3': [
    "function marketBuyOrdersWithEth(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] orders, uint256 makerAssetBuyAmount, bytes[] signatures, uint256 feePercentage, address feeRecipient) payable returns (uint256 wethSpentAmount, uint256 makerAssetAcquiredAmount, uint256 ethFeePaid)",
    "function marketSellOrdersWithEth(tuple(address makerAddress, address takerAddress, address feeRecipientAddress, address senderAddress, uint256 makerAssetAmount, uint256 takerAssetAmount, uint256 makerFee, uint256 takerFee, uint256 expirationTimeSeconds, uint256 salt, bytes makerAssetData, bytes takerAssetData, bytes makerFeeAssetData, bytes takerFeeAssetData)[] orders, bytes[] signatures, uint256 feePercentage, address feeRecipient) payable returns (uint256 wethSpentAmount, uint256 makerAssetAcquiredAmount, uint256 ethFeePaid)"
  ],
  '0xCoordinator': [
    "function executeTransaction(tuple(uint256 salt, uint256 expirationTimeSeconds, uint256 gasPrice, address signerAddress, bytes data) transaction, address txOrigin, bytes transactionSignature, bytes[] approvalSignatures) payable"
  ],

  //DDEX post 0x protocol (hydro 1.0 and hydro 1.1)
  DDEX: [
    "function matchOrders(tuple(address trader, uint256 baseTokenAmount, uint256 quoteTokenAmount, uint256 gasTokenAmount, bytes32 data, tuple(bytes32 config, bytes32 r, bytes32 s) signature) takerOrderParam, tuple(address trader, uint256 baseTokenAmount, uint256 quoteTokenAmount, uint256 gasTokenAmount, bytes32 data, tuple(bytes32 config, bytes32 r, bytes32 s) signature)[] makerOrderParams, tuple(address baseToken, address quoteToken, address relayer) orderAddressSet)",
    "function cancelOrder(tuple(address trader, address relayer, address baseToken, address quoteToken, uint256 baseTokenAmount, uint256 quoteTokenAmount, uint256 gasTokenAmount, bytes32 data) order)",
    "event Cancel(bytes32 indexed orderHash)",
    "event Match(address baseToken, address quoteToken, address relayer, address maker, address taker, uint256 baseTokenAmount, uint256 quoteTokenAmount, uint256 makerFee, uint256 takerFee, uint256 makerGasFee, uint256 makerRebate, uint256 takerGasFee)"
  ],
  DDEX2: [
    "function matchOrders(tuple(address trader, uint256 baseTokenAmount, uint256 quoteTokenAmount, uint256 gasTokenAmount, bytes32 data, tuple(bytes32 config, bytes32 r, bytes32 s) signature) takerOrderParam, tuple(address trader, uint256 baseTokenAmount, uint256 quoteTokenAmount, uint256 gasTokenAmount, bytes32 data, tuple(bytes32 config, bytes32 r, bytes32 s) signature)[] makerOrderParams, uint256[] baseTokenFilledAmounts, tuple(address baseToken, address quoteToken, address relayer) orderAddressSet)",
    "event Match(tuple(address baseToken, address quoteToken, address relayer) addressSet, tuple(address maker, address taker, address buyer, uint256 makerFee, uint256 makerRebate, uint256 takerFee, uint256 makerGasFee, uint256 takerGasFee, uint256 baseTokenFilledAmount, uint256 quoteTokenFilledAmount) result)"
  ],

  OasisDex: [
    "function sellAllAmount(address pay_gem, uint256 pay_amt, address buy_gem, uint256 min_fill_amount) returns (uint256 fill_amt)",
    "function make(address pay_gem, address buy_gem, uint128 pay_amt, uint128 buy_amt) returns (bytes32)",
    "function offer(uint256 pay_amt, address pay_gem, uint256 buy_amt, address buy_gem, uint256 pos) returns (uint256)",
    "function cancel(uint256 id) returns (bool success)",
    "function take(bytes32 id, uint128 maxTakeAmount)",
    "function buyAllAmount(address buy_gem, uint256 buy_amt, address pay_gem, uint256 max_fill_amount) returns (uint256 fill_amt)",
    "function kill(bytes32 id)",
    "function buy(uint256 id, uint256 amount) returns (bool)",
    "function offer(uint256 pay_amt, address pay_gem, uint256 buy_amt, address buy_gem, uint256 pos, bool rounding) returns (uint256)",
    "function offer(uint256 pay_amt, address pay_gem, uint256 buy_amt, address buy_gem) returns (uint256)",
    "event LogNote(bytes4 indexed sig, address indexed guy, bytes32 indexed foo, bytes32 indexed bar, uint256 wad, bytes fax) anonymous",
    "event LogItemUpdate(uint256 id)",
    "event LogTrade(uint256 pay_amt, address indexed pay_gem, uint256 buy_amt, address indexed buy_gem)",
    "event LogMake(bytes32 indexed id, bytes32 indexed pair, address indexed maker, address pay_gem, address buy_gem, uint128 pay_amt, uint128 buy_amt, uint64 timestamp)",
    "event LogBump(bytes32 indexed id, bytes32 indexed pair, address indexed maker, address pay_gem, address buy_gem, uint128 pay_amt, uint128 buy_amt, uint64 timestamp)",
    "event LogTake(bytes32 id, bytes32 indexed pair, address indexed maker, address pay_gem, address buy_gem, address indexed taker, uint128 take_amt, uint128 give_amt, uint64 timestamp)",
    "event LogKill(bytes32 indexed id, bytes32 indexed pair, address indexed maker, address pay_gem, address buy_gem, uint128 pay_amt, uint128 buy_amt, uint64 timestamp)"
  ],
  OasisDexOld3: [
    "event ItemUpdate(uint256 id)",
    "event Trade(uint256 sell_how_much, address indexed sell_which_token, uint256 buy_how_much, address indexed buy_which_token)"
  ],
  OasisDirect: [
    "function sellAllAmountBuyEth(address otc, address payToken, uint256 payAmt, address wethToken, uint256 minBuyAmt) returns (uint256 wethAmt)",
    "function sellAllAmount(address otc, address payToken, uint256 payAmt, address buyToken, uint256 minBuyAmt) returns (uint256 buyAmt)",
    "function buyAllAmount(address otc, address buyToken, uint256 buyAmt, address payToken, uint256 maxPayAmt) returns (uint256 payAmt)",
    "function createAndBuyAllAmountBuyEth(address factory, address otc, uint256 wethAmt, address payToken, uint256 maxPayAmt) returns (address proxy, uint256 payAmt)",
    "function createAndSellAllAmountBuyEth(address factory, address otc, address payToken, uint256 payAmt, uint256 minBuyAmt) returns (address proxy, uint256 wethAmt)",
    "function createAndBuyAllAmountPayEth(address factory, address otc, address buyToken, uint256 buyAmt) payable returns (address proxy, uint256 wethAmt)",
    "function createAndSellAllAmountPayEth(address factory, address otc, address buyToken, uint256 minBuyAmt) payable returns (address proxy, uint256 buyAmt)",
    "function createAndBuyAllAmount(address factory, address otc, address buyToken, uint256 buyAmt, address payToken, uint256 maxPayAmt) returns (address proxy, uint256 payAmt)",
    "function buyAllAmountPayEth(address otc, address buyToken, uint256 buyAmt, address wethToken) payable returns (uint256 wethAmt)",
    "function createAndSellAllAmount(address factory, address otc, address payToken, uint256 payAmt, address buyToken, uint256 minBuyAmt) returns (address proxy, uint256 buyAmt)",
    "function sellAllAmountPayEth(address otc, address wethToken, address buyToken, uint256 minBuyAmt) payable returns (uint256 buyAmt)",
    "function buyAllAmountBuyEth(address otc, address wethToken, uint256 wethAmt, address payToken, uint256 maxPayAmt) returns (uint256 payAmt)"
  ],
  //Proxy for delegatecalls to another OasisDirect
  OasisProxy: [
    "function execute(address _target, bytes _data) payable returns (bytes32 response)",
    "function execute(bytes _code, bytes _data) payable returns (address target, bytes32 response)"
  ],

  AirSwap: [
    "function fill(address makerAddress, uint256 makerAmount, address makerToken, address takerAddress, uint256 takerAmount, address takerToken, uint256 expiration, uint256 nonce, uint8 v, bytes32 r, bytes32 s) payable",
    "function cancel(address makerAddress, uint256 makerAmount, address makerToken, address takerAddress, uint256 takerAmount, address takerToken, uint256 expiration, uint256 nonce, uint8 v, bytes32 r, bytes32 s)",
    "event Filled(address indexed makerAddress, uint256 makerAmount, address indexed makerToken, address takerAddress, uint256 takerAmount, address indexed takerToken, uint256 expiration, uint256 nonce)",
    "event Canceled(address indexed makerAddress, uint256 makerAmount, address indexed makerToken, address takerAddress, uint256 takerAmount, address indexed takerToken, uint256 expiration, uint256 nonce)",
    "event Failed(uint256 code, address indexed makerAddress, uint256 makerAmount, address indexed makerToken, address takerAddress, uint256 takerAmount, address indexed takerToken, uint256 expiration, uint256 nonce)"
  ],
  Kyber: [
    "function withdrawToken(address token, uint256 amount, address sendTo)",
    "function trade(address src, uint256 srcAmount, address dest, address destAddress, uint256 maxDestAmount, uint256 minConversionRate, address walletId) payable returns (uint256)",
    "function withdrawEther(uint256 amount, address sendTo)",
    "event EtherReceival(address indexed sender, uint256 amount)",
    "event ExecuteTrade(address indexed sender, address src, address dest, uint256 actualSrcAmount, uint256 actualDestAmount)",
    "event TokenWithdraw(address token, uint256 amount, address sendTo)",
    "event EtherWithdraw(uint256 amount, address sendTo)"
  ],
  Kyber2: [
    "function tradeWithHint(address src, uint256 srcAmount, address dest, address destAddress, uint256 maxDestAmount, uint256 minConversionRate, address walletId, bytes hint) payable returns (uint256)",
    "function swapTokenToEther(address token, uint256 srcAmount, uint256 minConversionRate) returns (uint256)",
    "function swapTokenToToken(address src, uint256 srcAmount, address dest, uint256 minConversionRate) returns (uint256)",
    "function swapEtherToToken(address token, uint256 minConversionRate) payable returns (uint256)"
  ],
  Kyber3: [
    "function tradeWithHint(address trader, address src, uint256 srcAmount, address dest, address destAddress, uint256 maxDestAmount, uint256 minConversionRate, address walletId, bytes hint) payable returns (uint256)",
    "event KyberTrade(address indexed trader, address src, address dest, uint256 srcAmount, uint256 dstAmount, address destAddress, uint256 ethWeiValue, address reserve1, address reserve2, bytes hint)"
  ],

  BancorQuick: [
    "function convertForPrioritized(address[] _path, uint256 _amount, uint256 _minReturn, address _for, uint256 _block, uint256 _nonce, uint8 _v, bytes32 _r, bytes32 _s) payable returns (uint256)",
    "function claimAndConvertFor(address[] _path, uint256 _amount, uint256 _minReturn, address _for) returns (uint256)",
    "function claimAndConvert(address[] _path, uint256 _amount, uint256 _minReturn) returns (uint256)",
    "function convertFor(address[] _path, uint256 _amount, uint256 _minReturn, address _for) payable returns (uint256)",
    "function convert(address[] _path, uint256 _amount, uint256 _minReturn) payable returns (uint256)"
  ],
  // bancor network is new generation bancor quick?
  BancorQuick2: [
    "function convertForPrioritized2(address[] _path, uint256 _amount, uint256 _minReturn, address _for, uint256 _block, uint8 _v, bytes32 _r, bytes32 _s) payable returns (uint256)",
    "function convertForMultiple(address[] _paths, uint256[] _pathStartIndex, uint256[] _amounts, uint256[] _minReturns, address _for) payable returns (uint256[])"
  ],
  //regular bancor covertors
  Bancor: [
    "function withdrawFromToken(address _token, address _to, uint256 _amount)",
    "function change(address _fromToken, address _toToken, uint256 _amount, uint256 _minReturn) returns (uint256)",
    "function sell(address _connectorToken, uint256 _sellAmount, uint256 _minReturn) returns (uint256)",
    "function convert(address _fromToken, address _toToken, uint256 _amount, uint256 _minReturn) returns (uint256)",
    "function buy(address _connectorToken, uint256 _depositAmount, uint256 _minReturn) returns (uint256)",
    "function quickConvert(address[] _path, uint256 _amount, uint256 _minReturn) payable returns (uint256)",
    "event Conversion(address indexed _fromToken, address indexed _toToken, address indexed _trader, uint256 _amount, uint256 _return, uint256 _currentPriceN, uint256 _currentPriceD)"
  ],
  // bancor version with different 'conversion' event including conversionFee
  Bancor2: [
    "function quickConvertPrioritized(address[] _path, uint256 _amount, uint256 _minReturn, uint256 _block, uint256 _nonce, uint8 _v, bytes32 _r, bytes32 _s) payable returns (uint256)",
    "function convertInternal(address _fromToken, address _toToken, uint256 _amount, uint256 _minReturn) returns (uint256)",
    "event Conversion(address indexed _fromToken, address indexed _toToken, address indexed _trader, uint256 _amount, uint256 _return, int256 _conversionFee, uint256 _currentPriceN, uint256 _currentPriceD)"
  ],
  // bancor v3 changed event
  Bancor3: [
    "function quickConvertPrioritized(address[] _path, uint256 _amount, uint256 _minReturn, uint256 _block, uint8 _v, bytes32 _r, bytes32 _s) payable returns (uint256)",
    "event Conversion(address indexed _fromToken, address indexed _toToken, address indexed _trader, uint256 _amount, uint256 _return, int256 _conversionFee)",
    "event PriceDataUpdate(address indexed _connectorToken, uint256 _tokenSupply, uint256 _connectorBalance, uint32 _connectorWeight)"
  ],
  // bancor with v3 functions & crosschain xConvert
  Bancor4: [
    "function xConvertPrioritized(address[] _path, uint256 _amount, uint256 _minReturn, bytes32 _toBlockchain, bytes32 _to, uint256 _conversionId, uint256 _block, uint8 _v, bytes32 _r, bytes32 _s) payable returns (uint256)",
    "function convertForPrioritized3(address[] _path, uint256 _amount, uint256 _minReturn, address _for, uint256 _customVal, uint256 _block, uint8 _v, bytes32 _r, bytes32 _s) payable returns (uint256)",
    "function xConvert(address[] _path, uint256 _amount, uint256 _minReturn, bytes32 _toBlockchain, bytes32 _to, uint256 _conversionId) payable returns (uint256)"
  ],
  BancorX: [
    "function xTransfer(bytes32 _toBlockchain, bytes32 _to, uint256 _amount, uint256 _id)",
    "function xTransfer(bytes32 _toBlockchain, bytes32 _to, uint256 _amount)",
    "function reportTx(bytes32 _fromBlockchain, uint256 _txId, address _to, uint256 _amount, uint256 _xTransferId)",
    "event TokensLock(address indexed _from, uint256 _amount)",
    "event TokensRelease(address indexed _to, uint256 _amount)",
    "event XTransfer(address indexed _from, bytes32 _toBlockchain, bytes32 indexed _to, uint256 _amount, uint256 _id)",
    "event TxReport(address indexed _reporter, bytes32 _fromBlockchain, uint256 _txId, address _to, uint256 _amount, uint256 _xTransferId)",
    "event XTransferComplete(address _to, uint256 _id)"
  ],
  //convertForPrioritized4, convert2 , xconvert3
  Bancor5: [
    "function claimAndConvertFor2(address[] _path, uint256 _amount, uint256 _minReturn, address _for, address _affiliateAccount, uint256 _affiliateFee) returns (uint256)",
    "function convertForPrioritized4(address[] _path, uint256 _amount, uint256 _minReturn, address _for, uint256[] _signature, address _affiliateAccount, uint256 _affiliateFee) payable returns (uint256)",
    "function convert2(address[] _path, uint256 _amount, uint256 _minReturn, address _affiliateAccount, uint256 _affiliateFee) payable returns (uint256)",
    "function xConvertPrioritized3(address[] _path, uint256 _amount, uint256 _minReturn, bytes32 _toBlockchain, bytes32 _to, uint256 _conversionId, uint256[] _signature, address _affiliateAccount, uint256 _affiliateFee) payable returns (uint256)",
    "function convertFor2(address[] _path, uint256 _amount, uint256 _minReturn, address _for, address _affiliateAccount, uint256 _affiliateFee) payable returns (uint256)",
    "function xConvert2(address[] _path, uint256 _amount, uint256 _minReturn, bytes32 _toBlockchain, bytes32 _to, uint256 _conversionId, address _affiliateAccount, uint256 _affiliateFee) payable returns (uint256)",
    "function xConvertPrioritized2(address[] _path, uint256 _amount, uint256 _minReturn, bytes32 _toBlockchain, bytes32 _to, uint256 _conversionId, uint256[] _signature) payable returns (uint256)",
    "function claimAndConvert2(address[] _path, uint256 _amount, uint256 _minReturn, address _affiliateAccount, uint256 _affiliateFee) returns (uint256)",
    "event Conversion(address indexed _smartToken, address indexed _fromToken, address indexed _toToken, uint256 _fromAmount, uint256 _toAmount, address _trader)"
  ],
  BancorQuick3: [
    "function completeXConversion2(address[] _path, uint256 _minReturn, uint256 _conversionId, uint256[] _signature) returns (uint256)",
    "function liquidate(uint256 _amount)",
    "function completeXConversion(address[] _path, uint256 _minReturn, uint256 _conversionId, uint256 _block, uint8 _v, bytes32 _r, bytes32 _s) returns (uint256)",
    "function convert2(address _fromToken, address _toToken, uint256 _amount, uint256 _minReturn, address _affiliateAccount, uint256 _affiliateFee) returns (uint256)",
    "function quickConvertPrioritized2(address[] _path, uint256 _amount, uint256 _minReturn, uint256[] _signature, address _affiliateAccount, uint256 _affiliateFee) payable returns (uint256)",
    "function quickConvert2(address[] _path, uint256 _amount, uint256 _minReturn, address _affiliateAccount, uint256 _affiliateFee) payable returns (uint256)",
    "function claimTokens(address _from, uint256 _amount)"
  ],
  //legacy 2017 version 'Change' event & quickChange
  BancorChanger: [
    "function change(address _fromToken, address _toToken, uint256 _amount, uint256 _minReturn) returns (uint256 amount)",
    "function quickBuy(uint256 _minReturn) payable returns (uint256 amount)",
    "function buy(address _reserveToken, uint256 _depositAmount, uint256 _minReturn) returns (uint256 amount)",
    "function quickChange(address[] _path, uint256 _amount, uint256 _minReturn) returns (uint256 amount)",
    "function token() view returns (address)",
    "event Change(address indexed _fromToken, address indexed _toToken, address indexed _trader, uint256 _amount, uint256 _return, uint256 _currentPriceN, uint256 _currentPriceD)"
  ],
  BancorLegacy: [
    "function fund(uint256 _amount)",
    "event PriceUpdate(address indexed _fromToken, address indexed _toToken, uint256 _priceN, uint256 _priceD)"
  ],

  Enclaves: [
    "function tradeEtherDelta(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive, uint256 _expires, uint256 _nonce, address _user, uint8 _v, bytes32 _r, bytes32 _s, uint256 _amount, bool _withdraw) payable returns (uint256)",
    "function withdrawPreSigned(address _token, uint256 _value, address _feeToken, uint256 _feeValue, uint256 _nonce, address _user, uint8 _v, bytes32 _r, bytes32 _s)",
    "function depositBoth(address _token, uint256 _amount) payable",
    "function withdrawBoth(address _token, uint256 _tokenAmount, uint256 _ethAmount)",
    "function trade(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive, uint256 _expires, uint256 _nonce, address _user, uint8 _v, bytes32 _r, bytes32 _s, uint256 _amount, bool _withdraw) payable returns (uint256)",
    "function withdrawTokenMulti(address[] _tokens, uint256[] _amounts)",
    "event Trade(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, address indexed get, address indexed give, uint8 exchange)",
    "event WithdrawPreSigned(address indexed feeToken, uint256 feeValue, address indexed feeReceiver)"
  ],
  Ethen: [
    "function trade(uint256[] _nums, address[] _addrs, bytes32[] _rss)",
    "function withdrawEther(uint256 _amount)",
    "function cancel(uint8 _order, address _token, uint256 _nonce, uint256 _price, uint256 _amount, uint256 _expire, uint256 _v, bytes32 _r, bytes32 _s)",
    "function depositEther() payable",
    "event DepositEther(address user, uint256 amount, uint256 total)",
    "event WithdrawEther(address user, uint256 amount, uint256 total)",
    "event DepositToken(address user, address token, uint256 amount, uint256 total)",
    "event WithdrawToken(address user, address token, uint256 amount, uint256 total)",
    "event Cancel(uint8 order, address owner, uint256 nonce, address token, uint256 price, uint256 amount)",
    "event Order(address orderOwner, uint256 orderNonce, uint256 orderPrice, uint256 tradeTokens, uint256 orderFilled, uint256 orderOwnerFinalTokens, uint256 orderOwnerFinalEther, uint256 fees)",
    "event Trade(address trader, uint256 nonce, uint256 trade, address token, uint256 traderFinalTokens, uint256 traderFinalEther)",
    "event NotEnoughTokens(address owner, address token, uint256 shouldHaveAmount, uint256 actualAmount)",
    "event NotEnoughEther(address owner, uint256 shouldHaveAmount, uint256 actualAmount)"
  ],
  /* Dexy: [
  "function tokensReceived(address, address from, address, uint256 amount, bytes, bytes)",
  "function withdrawOverflow(address token)",
  "function deposit(address token, uint256 amount) payable",
  "function transfer(address token, address from, address to, uint256 amount)",
  "function withdraw(address token, uint256 amount)",
  "event Deposited(address indexed user, address token, uint256 amount)",
  "event Withdrawn(address indexed user, address token, uint256 amount)"
  ],
  // Dexy2: [
  "function trade(address[3] addresses, uint256[4] values, bytes signature, uint256 maxFillAmount)",
  "function cancel(address[3] addresses, uint256[4] values)",
  "function order(address[2] addresses, uint256[4] values)",
  "function withdraw(address token, uint256 amount)",
  "event Cancelled(bytes32 indexed hash)",
  "event Traded(bytes32 indexed hash, address makerToken, uint256 makerTokenAmount, address takerToken, uint256 takerTokenAmount, address maker, address taker)",
  "event Ordered(address maker, address makerToken, address takerToken, uint256 makerTokenAmount, uint256 takerTokenAmount, uint256 expires, uint256 nonce)"
  ],*/
  Ethex: [
    "function takeSellOrder(address token, uint256 tokenAmount, uint256 weiAmount, address seller) payable",
    "function makeBuyOrder(address token, uint256 tokenAmount) payable",
    "function cancelAllBuyOrders(address token, uint256 tokenAmount, uint256 weiAmount)",
    "function makeSellOrder(address token, uint256 tokenAmount, uint256 weiAmount)",
    "function takeBuyOrder(address token, uint256 tokenAmount, uint256 weiAmount, uint256 totalTokens, address buyer)",
    "function cancelAllSellOrders(address token, uint256 tokenAmount, uint256 weiAmount)",
    "event MakeBuyOrder(bytes32 orderHash, address indexed token, uint256 tokenAmount, uint256 weiAmount, address indexed buyer)",
    "event MakeSellOrder(bytes32 orderHash, address indexed token, uint256 tokenAmount, uint256 weiAmount, address indexed seller)",
    "event CancelBuyOrder(bytes32 orderHash, address indexed token, uint256 tokenAmount, uint256 weiAmount, address indexed buyer)",
    "event CancelSellOrder(bytes32 orderHash, address indexed token, uint256 tokenAmount, uint256 weiAmount, address indexed seller)",
    "event TakeBuyOrder(bytes32 orderHash, address indexed token, uint256 tokenAmount, uint256 weiAmount, uint256 totalTransactionTokens, address indexed buyer, address indexed seller)",
    "event TakeSellOrder(bytes32 orderHash, address indexed token, uint256 tokenAmount, uint256 weiAmount, uint256 totalTransactionWei, address indexed buyer, address indexed seller)"
  ],
  Etherc: [
    "event Cancel(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 expires, uint256 nonce, address maker, uint8 v, bytes32 r, bytes32 s, bytes32 orderHash, uint256 amountFilled)",
    "event Trade(address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, address maker, address taker, bytes32 orderHash)"
  ],
  EasyTrade: [
    "function createSellOrder(address token, uint256 tokensTotal, uint256 ethersTotal, uint8[] exchanges, address[5][] orderAddresses, uint256[6][] orderValues, uint256[] exchangeFees, uint8[] v, bytes32[] r, bytes32[] s)",
    "function createBuyOrder(address token, uint256 tokensTotal, uint8[] exchanges, address[5][] orderAddresses, uint256[6][] orderValues, uint256[] exchangeFees, uint8[] v, bytes32[] r, bytes32[] s) payable",
    "event FillSellOrder(address account, address token, uint256 tokens, uint256 ethers, uint256 tokensSold, uint256 ethersObtained, uint256 tokensRefunded)",
    "event FillBuyOrder(address account, address token, uint256 tokens, uint256 ethers, uint256 tokensObtained, uint256 ethersSpent, uint256 ethersRefunded)"
  ],
  EasyTrade2: [
    "function buy(address tradeable, uint256 volume, bytes ordersData, address destinationAddr, address affiliate) payable",
    "function sell(address tradeable, uint256 volume, uint256 volumeEth, bytes ordersData, address destinationAddr, address affiliate)",
    "event Sell(address account, address destinationAddr, address traedeable, uint256 volume, uint256 volumeEth, uint256 volumeEffective, uint256 volumeEthEffective)",
    "event Buy(address account, address destinationAddr, address traedeable, uint256 volume, uint256 volumeEth, uint256 volumeEffective, uint256 volumeEthEffective)"
  ],
  InstantTrade: [
    "function instantTrade(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive, uint256 _expires, uint256 _nonce, address _user, uint8 _v, bytes32 _r, bytes32 _s, uint256 _amount, address _store) payable"
  ],
  Switcheo: [
    "function announceWithdraw(address _token, uint256 _amount)",
    "function depositERC20(address _user, address _token, uint256 _amount)",
    "function slowWithdraw(address _withdrawer, address _token, uint256 _amount)",
    "function announceCancel(bytes32 _offerHash)",
    "function withdraw(address _withdrawer, address _token, uint256 _amount, address _feeAsset, uint256 _feeAmount, uint64 _nonce, uint8 _v, bytes32 _r, bytes32 _s)",
    "function spendFrom(address _from, address _to, uint256 _amount, address _token, uint8 _decreaseReason, uint8 _increaseReason)",
    "function cancel(bytes32 _offerHash, uint256 _expectedAvailableAmount, address _feeAsset, uint256 _feeAmount, uint8 _v, bytes32 _r, bytes32 _s)",
    "function fillOffer(address _filler, bytes32 _offerHash, uint256 _amountToTake, address _feeAsset, uint256 _feeAmount, uint64 _nonce, uint8 _v, bytes32 _r, bytes32 _s)",
    "function makeOffer(address _maker, address _offerAsset, address _wantAsset, uint256 _offerAmount, uint256 _wantAmount, address _feeAsset, uint256 _feeAmount, uint64 _nonce, uint8 _v, bytes32 _r, bytes32 _s)",
    "function slowCancel(bytes32 _offerHash)",
    "function fastCancel(bytes32 _offerHash, uint256 _expectedAvailableAmount)",
    "function emergencyCancel(bytes32 _offerHash, uint256 _expectedAvailableAmount)",
    "function fillOffers(address _filler, bytes32[] _offerHashes, uint256[] _amountsToTake, address _feeAsset, uint256 _feeAmount, uint64 _nonce, uint8 _v, bytes32 _r, bytes32 _s)",
    "function emergencyWithdraw(address _withdrawer, address _token, uint256 _amount)",
    "event Make(address indexed maker, bytes32 indexed offerHash)",
    "event Fill(address indexed filler, bytes32 indexed offerHash, uint256 amountFilled, uint256 amountTaken, address indexed maker)",
    "event Cancel(address indexed maker, bytes32 indexed offerHash)",
    "event BalanceIncrease(address indexed user, address indexed token, uint256 amount, uint8 indexed reason)",
    "event BalanceDecrease(address indexed user, address indexed token, uint256 amount, uint8 indexed reason)",
    "event WithdrawAnnounce(address indexed user, address indexed token, uint256 amount, uint256 canWithdrawAt)",
    "event CancelAnnounce(address indexed user, bytes32 indexed offerHash, uint256 canCancelAt)"
  ],
  Uniswap: [
    "function tokenToEthSwapOutput(uint256 eth_bought, uint256 max_tokens, uint256 deadline) returns (uint256)",
    "function ethToTokenTransferOutput(uint256 tokens_bought, uint256 deadline, address recipient) payable returns (uint256)",
    "function addLiquidity(uint256 min_liquidity, uint256 max_tokens, uint256 deadline) payable returns (uint256)",
    "function ethToTokenSwapOutput(uint256 tokens_bought, uint256 deadline) payable returns (uint256)",
    "function tokenToEthTransferInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline, address recipient) returns (uint256)",
    "function tokenToEthSwapInput(uint256 tokens_sold, uint256 min_eth, uint256 deadline) returns (uint256)",
    "function tokenToExchangeTransferOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address recipient, address exchange_addr) returns (uint256)",
    "function tokenToTokenTransferOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address recipient, address token_addr) returns (uint256)",
    "function ethToTokenTransferInput(uint256 min_tokens, uint256 deadline, address recipient) payable returns (uint256)",
    "function tokenToTokenSwapOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address token_addr) returns (uint256)",
    "function tokenToExchangeSwapInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address exchange_addr) returns (uint256)",
    "function tokenToEthTransferOutput(uint256 eth_bought, uint256 max_tokens, uint256 deadline, address recipient) returns (uint256)",
    "function tokenToTokenSwapInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address token_addr) returns (uint256)",
    "function tokenToExchangeSwapOutput(uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address exchange_addr) returns (uint256)",
    "function tokenToExchangeTransferInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address recipient, address exchange_addr) returns (uint256)",
    "function ethToTokenSwapInput(uint256 min_tokens, uint256 deadline) payable returns (uint256)",
    "function tokenToTokenTransferInput(uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address recipient, address token_addr) returns (uint256)",
    "function removeLiquidity(uint256 amount, uint256 min_eth, uint256 min_tokens, uint256 deadline) returns (uint256, uint256)",
    "event TokenPurchase(address indexed buyer, uint256 indexed eth_sold, uint256 indexed tokens_bought)",
    "event EthPurchase(address indexed buyer, uint256 indexed tokens_sold, uint256 indexed eth_bought)",
    "event AddLiquidity(address indexed provider, uint256 indexed eth_amount, uint256 indexed token_amount)",
    "event RemoveLiquidity(address indexed provider, uint256 indexed eth_amount, uint256 indexed token_amount)"
  ],
  dexBlue2: [
    "function executeReserveReserveTradeWithData(address makerReserve, address takerReserve, tuple(address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 makerFee, uint256 takerFee, uint256 gasLimit) trade, bytes32[] makerData, bytes32[] takerData) returns (bool)",
    "function settleReserveReserveTradeWithData(tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 packedInput3) tradeInput, bytes32[] makerData, bytes32[] takerData)",
    "function settleReserveReserveTrade(tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 packedInput3) tradeInput)",
    "function directWithdrawal(address token, uint256 amount) returns (bool)",
    "function multiSigTransfer(address token, uint256 amount, uint64 nonce, uint8 v, bytes32 r, bytes32 s, address receiving_address)",
    "function batchSettleTrades(tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 r, bytes32 s)[] orderInput, tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 packedInput3)[] tradeInput)",
    "function multiSigSend(address token, uint256 amount, uint64 nonce, uint8 v, bytes32 r, bytes32 s, address receiving_address)",
    "function executeReserveReserveTrade(address makerReserve, address takerReserve, tuple(address makerToken, address takerToken, uint256 makerAmount, uint256 takerAmount, uint256 makerFee, uint256 takerFee, uint256 gasLimit) trade) returns (bool)",
    "function swap(address sell_token, uint256 sell_amount, address buy_token, uint256 min_output, uint256 deadline) payable returns (uint256)",
    "function executeReserveTrade(address sellToken, uint256 sellAmount, address buyToken, uint256 buyAmount, address reserve) returns (bool)",
    "function swapWithReserve(address sell_token, uint256 sell_amount, address buy_token, uint256 min_output, address reserve, uint256 deadline) payable returns (uint256)",
    "function multiSigOrderBatchCancel(bytes32[] orderHashes, uint8 v, bytes32 r, bytes32 s)",
    "function settleReserveTradeWithData(tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 r, bytes32 s) orderInput, tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 packedInput3) tradeInput, bytes32[] data)",
    "function depositWrappedEther(uint256 amount)",
    "function userSigWithdrawal(bytes32 packedInput1, bytes32 packedInput2, bytes32 r, bytes32 s)",
    "function multiSigWithdrawal(address token, uint256 amount, uint64 nonce, uint8 v, bytes32 r, bytes32 s)",
    "function initiateSingleSigWithdrawal(address token, uint256 amount)",
    "function settleRingTrade(tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 r, bytes32 s)[] orderInput, tuple(bytes32 packedInput1, bytes32 packedInput2)[] tradeInput)",
    "function settleTrade(tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 r, bytes32 s) makerOrderInput, tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 r, bytes32 s) takerOrderInput, tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 packedInput3) tradeInput)",
    "function settleRingTradeWithData(tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 r, bytes32 s)[] orderInput, tuple(bytes32 packedInput1, bytes32 packedInput2)[] tradeInput, bytes32[][] data)",
    "function executeReserveTradeWithData(address sellToken, uint256 sellAmount, address buyToken, uint256 buyAmount, address reserve, bytes32[] data) returns (bool)",
    "function settleReserveTrade(tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 r, bytes32 s) orderInput, tuple(bytes32 packedInput1, bytes32 packedInput2, bytes32 packedInput3) tradeInput)",
    "event LogTrade(address makerAsset, uint256 makerAmount, address takerAsset, uint256 takerAmount)",
    "event LogSwap(address soldAsset, uint256 soldAmount, address boughtAsset, uint256 boughtAmount)",
    "event LogTradeFailed()",
    "event LogDeposit(address account, address token, uint256 amount)",
    "event LogWithdrawal(address account, address token, uint256 amount)",
    "event LogDirectWithdrawal(address account, address token, uint256 amount)",
    "event LogSingleSigWithdrawal(address account, address token, uint256 amount)",
    "event LogOrderCanceled(bytes32 hash)"
  ],
};