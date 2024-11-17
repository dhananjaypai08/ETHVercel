import "@openzeppelin/contracts@4.7.0/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.7.0/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts@4.7.0/access/Ownable.sol";
import "@openzeppelin/contracts@4.7.0/utils/Counters.sol"; 
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
contract ETHVercel is ERC721URIStorage, Ownable, AutomationCompatibleInterface{
    struct DeploymentDetails {
        string repo_url;
        string data;
        string tokenuri;
        address owner;
    }
    address constant immutable oracle = IChronicle(0xdd6D76262Fd7BdDe428dcfCd94386EbAe0151603);


    uint256 public immutable interval = 30;
    uint256 public lastTimeStamp = block.timestamp;
    uint256 counter = 0;
    bytes public upkeepData;

    address internal burning_address = 0x000000000000000000000000000000000000dEaD; // Burning address

    string[] public AllDeployments;
    address[] public AllUsers;
    mapping(address => DeploymentDetails) public DeploymentMapping;
    mapping(address => DeploymentDetails[]) public DeploymentsOfOwner;

    event Mint(address _to, string uri);
    event DeploymentMap(address owner, DeploymentDetails record);

    event UpkeepCheck(uint256 _timestamp);
    event PerformUpkeep(uint256 _timestamp, uint256 _counter);

    using Counters for Counters.Counter;
 
    Counters.Counter private _tokenIdCounter;
 
    constructor() ERC721("ETHVercel", "ZVL") {}

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
        emit UpkeepCheck(1);
        uint256 val = oracle.read();
        
        return (upkeepNeeded, _checkMint(performData));
    }

    function performUpkeep(bytes calldata performData) external override {
        if ((block.timestamp - lastTimeStamp) > interval) {
            lastTimeStamp = block.timestamp;
            counter = counter + 1;
            emit PerformUpkeep(lastTimeStamp, counter);
        }
        _performMint(performData);
        
    }

    function _checkMint(bytes memory performData) public pure returns(bytes memory){
        return performData;
    }

    function _performMint(bytes calldata performData) public {
        upkeepData = performData;
    }

    function getDeploymentsOfOwner(address account) public view returns(DeploymentDetails[] memory){
        return DeploymentsOfOwner[account];
    }
 
    function safeMint(string memory repo_url, string memory data, string memory uri,  address to) public {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit Mint(to, uri);

        AllUsers.push(to);

        DeploymentDetails memory newRecord = DeploymentDetails(repo_url, data, uri, to);
        DeploymentMapping[to] = newRecord;
        DeploymentsOfOwner[to].push(newRecord);
        emit DeploymentMap(to, newRecord);
    }
 
    // The following functions are overrides required by Solidity.
 
    // function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    //     super._burn(tokenId);
    // }
 
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _beforeTokenTransfer(
    address from, 
    address to, 
    uint256 tokenId
    ) internal override virtual {
        require(from == address(0) || to == burning_address, "Err: token transfer is BLOCKED");   
        super._beforeTokenTransfer(from, to, tokenId);  
    }
}
 

IChronicle public immutable chronicle;

    /// @notice The SelfKisser granting access to Chronicle oracles.
    ISelfKisser public immutable selfKisser;

    constructor(address chronicle_, address selfKisser_) {
        chronicle = IChronicle(chronicle_);
        selfKisser = ISelfKisser(selfKisser_);

        // Note to add address(this) to chronicle oracle's whitelist.
        // This allows the contract to read from the chronicle oracle.
        selfKisser.selfKiss(address(chronicle));
    }

    /// @notice Function to read the latest data from the Chronicle oracle.
    /// @return val The current value returned by the oracle.
    function read() external view returns (uint256 val) {
        return chronicle.read();
    }
}

// Copied from [chronicle-std](https://github.com/chronicleprotocol/chronicle-std/blob/main/src/IChronicle.sol).
interface IChronicle {
    /**
     * @notice Returns the oracle's current value.
     * @dev Reverts if no value set.
     * @return value The oracle's current value.
     * /
    function read() external view returns (uint256 value);
}

// Copied from [self-kisser](https://github.com/chronicleprotocol/self-kisser/blob/main/src/ISelfKisser.sol).
interface ISelfKisser {
    /// @notice Kisses caller on oracle `oracle`.
    function selfKiss(address oracle) external;
}