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
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");
    address public constant ADMIN_ADDRESS =
        0xEA1a2Dfbc2cF2793ef0772dc0625Cd09750747f5;

    string public baseURI;
    string public notRevealedURI;
    string public extension = ".json";
    bool public isRevealed = false;

    enum Phase {
        Paused,
        ALSale,
        PublicSale
    }
    Phase public phase = Phase.Paused;

    mapping(address => uint256) public allowList;
    mapping(address => uint256) public presaleMinted;

    constructor() ERC721A("Test", "TEST") Ownable(_msgSender()) {
        _grantRole(DEFAULT_ADMIN_ROLE, ADMIN_ADDRESS);
        _grantRole(OPERATOR_ROLE, ADMIN_ADDRESS);
        _grantRole(OPERATOR_ROLE, _msgSender());

        _setDefaultRoyalty(ADMIN_ADDRESS, 1000);
    }

    // ----------------------------------------------------------
    // Modifier
    // ----------------------------------------------------------

    modifier canMint(uint256 _quantity) {
        require(tx.origin == _msgSender(), "Caller is a contract.");
        require(msg.value >= MINT_PRICE * _quantity, "Not enough eth");
        require(_quantity + totalSupply() <= MAX_SUPPLY, "Exceeds max supply");
        _;
    }

    // ----------------------------------------------------------
    // User functions
    // ----------------------------------------------------------

    function alMint(uint256 _quantity) external payable canMint(_quantity) {
        require(phase == Phase.ALSale, "Wrong phase.");
        require(
            _quantity + presaleMinted[_msgSender()] <= allowList[_msgSender()],
            "Exceeds per wallet limit"
        );

        presaleMinted[_msgSender()] += _quantity;
        _safeMint(_msgSender(), _quantity);
    }

    function publicMint(uint256 _quantity) external payable canMint(_quantity) {
        require(phase == Phase.PublicSale, "Wrong phase.");
        require(_quantity <= MAX_MINT_PER_TX, "Exceeds per Tx limit");

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
    // OPERATOR functions
    // ----------------------------------------------------------

    function ownerMint(
        address _to,
        uint256 _quantity
    ) external onlyRole(OPERATOR_ROLE) {
        require(_quantity + totalSupply() <= MAX_SUPPLY, "Exceeds max supply");
        _safeMint(_to, _quantity);
    }

    function setBaseURI(string memory _uri) external onlyRole(OPERATOR_ROLE) {
        baseURI = _uri;
    }

    function setNotRevealedURI(
        string memory _uri
    ) external onlyRole(OPERATOR_ROLE) {
        notRevealedURI = _uri;
    }

    function setExtension(
        string memory _extension
    ) external onlyRole(OPERATOR_ROLE) {
        extension = _extension;
    }

    function setIsRevealed(bool _status) external onlyRole(OPERATOR_ROLE) {
        isRevealed = _status;
    }

    function setPhasePaused() external onlyRole(OPERATOR_ROLE) {
        phase = Phase.Paused;
    }

    function setPhaseALSale() external onlyRole(OPERATOR_ROLE) {
        phase = Phase.ALSale;
    }

    function setPhasePublicSale() external onlyRole(OPERATOR_ROLE) {
        phase = Phase.PublicSale;
    }

    function setAllowList(
        address[] calldata _users,
        uint256[] calldata _quantities
    ) external onlyRole(OPERATOR_ROLE) {
        require(
            _users.length == _quantities.length,
            "Users and quantities array length must match."
        );

        for (uint256 i = 0; i < _users.length; i++) {
            allowList[_users[i]] = _quantities[i];
        }
    }

    function setDefaultRoyalty(
        address _receiver,
        uint96 _feeNumerator
    ) public onlyRole(OPERATOR_ROLE) {
        _setDefaultRoyalty(_receiver, _feeNumerator);
    }

    function withdraw() external onlyRole(OPERATOR_ROLE) {
        (bool os, ) = payable(ADMIN_ADDRESS).call{value: address(this).balance}(
            ""
        );
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
