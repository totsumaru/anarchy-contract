// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Test is ERC721A, AccessControl, Ownable, ERC2981 {
    uint256 public constant MAX_SUPPLY = 1850;
    uint256 public constant MINT_PRICE = 0.05 ether;
    uint256 public constant MAX_MINT_PER_TX = 2;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    address public constant OWNER = 0xEA1a2Dfbc2cF2793ef0772dc0625Cd09750747f5;

    string public baseURI;
    string public notRevealedURI;
    string public extension = ".json";
    bool public isRevealed = false;

    enum Phase {
        Paused,
        Presale,
        PublicSale
    }
    Phase public phase = Phase.Paused;

    mapping(address => uint256) public allowList;
    mapping(address => uint256) public presaleMinted;

    constructor() ERC721A("Test", "TEST") Ownable(OWNER) {
        _grantRole(DEFAULT_ADMIN_ROLE, OWNER);
        _grantRole(ADMIN_ROLE, OWNER);
        _grantRole(ADMIN_ROLE, _msgSender());

        _setDefaultRoyalty(OWNER, 1000);
    }

    // ----------------------------------------------------------
    // Modifier
    // ----------------------------------------------------------

    modifier isUser() {
        require(tx.origin == _msgSender(), "Caller is a contract.");
        _;
    }

    modifier inPhase(Phase _phase) {
        require(phase == _phase, "Wrong phase.");
        _;
    }

    modifier hasMinEth(uint256 _quantity) {
        require(msg.value >= MINT_PRICE * _quantity, "Not enough eth");
        _;
    }

    modifier withinMaxSupply(uint256 _quantity) {
        require(_quantity + totalSupply() <= MAX_SUPPLY, "Exceeds max supply");
        _;
    }

    modifier withinAllowListLimit(uint256 _quantity) {
        require(
            _quantity + presaleMinted[_msgSender()] <= allowList[_msgSender()],
            "Exceeds per wallet limit"
        );
        _;
    }

    /**
     * @dev use only public sale
     */
    modifier withinTxLimit(uint256 _quantity) {
        require(_quantity <= MAX_MINT_PER_TX, "Exceeds per Tx limit");
        _;
    }

    // ----------------------------------------------------------
    // User functions
    // ----------------------------------------------------------

    function presaleMint(
        uint256 _quantity
    )
        external
        payable
        isUser
        inPhase(Phase.Presale)
        hasMinEth(_quantity)
        withinMaxSupply(_quantity)
        withinAllowListLimit(_quantity)
    {
        presaleMinted[_msgSender()] += _quantity;
        _safeMint(_msgSender(), _quantity);
    }

    function publicMint(
        uint256 _quantity
    )
        external
        payable
        isUser
        inPhase(Phase.Presale)
        hasMinEth(_quantity)
        withinMaxSupply(_quantity)
        withinTxLimit(_quantity)
    {
        _safeMint(_msgSender(), _quantity);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        return
            isRevealed
                ? string(abi.encodePacked(ERC721A.tokenURI(tokenId), extension))
                : notRevealedURI;
    }

    // ----------------------------------------------------------
    // ADMIN functions
    // ----------------------------------------------------------

    function ownerMint(
        address _to,
        uint256 _quantity
    ) external withinMaxSupply(_quantity) onlyRole(ADMIN_ROLE) {
        _safeMint(_to, _quantity);
    }

    function setBaseURI(string memory _uri) external onlyRole(ADMIN_ROLE) {
        baseURI = _uri;
    }

    function setNotRevealedURI(
        string memory _uri
    ) external onlyRole(ADMIN_ROLE) {
        notRevealedURI = _uri;
    }

    function setExtension(
        string memory _extension
    ) external onlyRole(ADMIN_ROLE) {
        extension = _extension;
    }

    function setIsRevealed(bool _status) external onlyRole(ADMIN_ROLE) {
        isRevealed = _status;
    }

    function setPhasePaused() external onlyRole(ADMIN_ROLE) {
        phase = Phase.Paused;
    }

    function setPhasePresale() external onlyRole(ADMIN_ROLE) {
        phase = Phase.Presale;
    }

    function setPhasePublicSale() external onlyRole(ADMIN_ROLE) {
        phase = Phase.PublicSale;
    }

    function setDefaultRoyalty(
        address _receiver,
        uint96 _feeNumerator
    ) public onlyRole(ADMIN_ROLE) {
        _setDefaultRoyalty(_receiver, _feeNumerator);
    }

    function withdraw() public onlyRole(ADMIN_ROLE) {
        (bool os, ) = payable(OWNER).call{value: address(this).balance}("");
        require(os);
    }

    // ----------------------------------------------------------
    // internal functions
    // ----------------------------------------------------------

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // ----------------------------------------------------------
    // Interface
    // ----------------------------------------------------------

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721A, AccessControl, ERC2981) returns (bool) {
        return
            ERC721A.supportsInterface(interfaceId) ||
            AccessControl.supportsInterface(interfaceId) ||
            ERC2981.supportsInterface(interfaceId);
    }
}
