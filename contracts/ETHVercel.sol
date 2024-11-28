// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts@4.7.0/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.7.0/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts@4.7.0/access/Ownable.sol";
import "@openzeppelin/contracts@4.7.0/utils/Counters.sol"; 
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/*
@title Overall ETHVercel deployments and staking
@dev Dhananjay Pai
*/
contract ETHVercel is ERC721URIStorage, Ownable, AutomationCompatibleInterface, ReentrancyGuard{
    struct DeploymentDetails {
        string repo_url;
        string data;
        string tokenuri;
        address owner;
    }

    // USDe token contract on Sepolia
    IERC20 public constant USDE = IERC20(0xf805ce4F96e0EdD6f0b6cd4be22B34b92373d696);
    
    // sUSDe staking contract on Sepolia
    address public constant SUSDE = 0x1B6877c6Dac4b6De4c5817925DC40E2BfdAFc01b;

    // sUSDe token interface
    IERC20 public constant SUSDE_TOKEN = IERC20(0x1B6877c6Dac4b6De4c5817925DC40E2BfdAFc01b);
    
    // Cooldown duration in seconds (1 hour)
    uint256 public constant COOLDOWN_DURATION = 3600;
    
    // Mapping to track when users initiated cooldown
    mapping(address => uint256) public cooldownStart;
    
    // Mapping to track cooldown amounts
    mapping(address => uint256) public cooldownAmount;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event CooldownStarted(address indexed user, uint256 amount, bool isShares);
    event Unstaked(address indexed user, uint256 amount);

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
 
    constructor() ERC721("ETHVercel", "ZVL") {
        USDE.approve(SUSDE, type(uint256).max);
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
        emit UpkeepCheck(1);
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


    /**
     * @dev Stakes USDe tokens and receives sUSDe
     * @param amount Amount of USDe to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        
        require(USDE.transferFrom(msg.sender, address(this), amount), "USDe transfer failed");
        
        
        (bool success,) = SUSDE.call(
            abi.encodeWithSignature("deposit(uint256,address)", amount, msg.sender)
        );
        require(success, "Staking failed");
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @dev Initiates cooldown period for shares (sUSDe)
     * @param shareAmount Amount of sUSDe shares to unstake
     */
    function startCooldownShares(uint256 shareAmount) external {
        require(shareAmount > 0, "Amount must be greater than 0");
        
        
        (bool success,) = SUSDE.call(
            abi.encodeWithSignature("cooldownShares(uint256)", shareAmount)
        );
        require(success, "Cooldown initiation failed");
        
        cooldownStart[msg.sender] = block.timestamp;
        cooldownAmount[msg.sender] = shareAmount;
        
        emit CooldownStarted(msg.sender, shareAmount, true);
    }
    
    /**
     * @dev Initiates cooldown period for assets (USDe)
     * @param assetAmount Amount of USDe to receive after unstaking
     */
    function startCooldownAssets(uint256 assetAmount) external {
        require(assetAmount > 0, "Amount must be greater than 0");
        
        
        (bool success,) = SUSDE.call(
            abi.encodeWithSignature("cooldownAssets(uint256)", assetAmount)
        );
        require(success, "Cooldown initiation failed");
        
        cooldownStart[msg.sender] = block.timestamp;
        cooldownAmount[msg.sender] = assetAmount;
        
        emit CooldownStarted(msg.sender, assetAmount, false);
    }
    
    /**
     * @dev Unstakes sUSDe after cooldown period and receives USDe
     */
    function unstake() external nonReentrant {
        require(cooldownAmount[msg.sender] > 0, "No cooldown initiated");
        require(
            block.timestamp >= cooldownStart[msg.sender] + COOLDOWN_DURATION,
            "Cooldown period not finished"
        );
        
        uint256 amount = cooldownAmount[msg.sender];
        

        cooldownAmount[msg.sender] = 0;
        cooldownStart[msg.sender] = 0;
        
        
        (bool success,) = SUSDE.call(
            abi.encodeWithSignature("unstake(address)", msg.sender)
        );
        require(success, "Unstaking failed");
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @dev Checks if user's cooldown period has finished
     * @param user Address of the user to check
     * @return bool Whether cooldown is complete
     */
    function isCooldownComplete(address user) external view returns (bool) {
        if (cooldownAmount[user] == 0) return false;
        return block.timestamp >= cooldownStart[user] + COOLDOWN_DURATION;
    }
    
    /**
     * @dev Gets remaining cooldown time for a user
     * @param user Address of the user to check
     * @return uint256 Remaining time in seconds (0 if complete or not started)
     */
    function getRemainingCooldown(address user) external view returns (uint256) {
        if (cooldownAmount[user] == 0) return 0;
        
        uint256 endTime = cooldownStart[user] + COOLDOWN_DURATION;
        if (block.timestamp >= endTime) return 0;
        
        return endTime - block.timestamp;
    }

    /**
     * @dev Gets USDe balance of an address
     * @param user Address to check balance for
     * @return uint256 USDe balance
     */
    function getUSDeBalance(address user) public view returns (uint256) {
        return USDE.balanceOf(user);
    }

    /**
     * @dev Gets sUSDe balance of an address
     * @param user Address to check balance for
     * @return uint256 sUSDe balance
     */
    function getSUSDeBalance(address user) public view returns (uint256) {
        return SUSDE_TOKEN.balanceOf(user);
    }

}
 