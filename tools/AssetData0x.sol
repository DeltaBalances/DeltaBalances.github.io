pragma solidity >=0.4.22 <0.6.0;
pragma experimental ABIEncoderV2;

//Signatures for decoding 0x Protocol (v2/v3) asset proxies
//https://github.com/0xProject/0x-protocol-specification/tree/master/asset-proxy
contract AssetData0x {
    
    //0x02571792
    function ERC721Token(address, uint256) external;
    
    //0xf47261b0
    function ERC20Token(address) external;

    //0xdc1600f3 ZEIP-39
    function ERC20Bridge(address, address, bytes calldata) external;
    
    //94cfcdd7 ZEIP-23
    function MultiAsset(uint256[] calldata, bytes[] calldata) external;
    
    //0xa7cb5fb7  ZEIP-24
    function ERC1155Assets(address, uint256[] calldata, uint256[] calldata, bytes calldata) external;
    
    //0xc339d10a ZEIP-39
    function StaticCall(address, bytes calldata, bytes32) external;
}
   