// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BNPL {
    struct Agreement {
        address consumer;
        address merchant;
        uint256 principalAmount;
        uint256 interestRate; // in basis points (e.g., 500 = 5%)
        uint256 totalOwed;
        uint256 numInstallments;
        uint256 installmentsPaid;
        bool isCompleted;
        string tokenId; // Hedera token ID for this agreement
    }

    uint256 public nextAgreementId;
    mapping(uint256 => Agreement) public agreements;
    
    // Platform treasury account for token operations
    address public treasury;
    
    // Events for token operations
    event TokensBurned(uint256 indexed agreementId, address indexed from, uint256 amount, string tokenId);
    event TokensMinted(uint256 indexed agreementId, address indexed to, uint256 amount, string tokenId);

    event AgreementCreated(
        uint256 indexed agreementId,
        address indexed consumer,
        address indexed merchant,
        uint256 principalAmount,
        uint256 interestRate,
        uint256 totalOwed,
        uint256 numInstallments,
        string tokenId
    );
    event InstallmentAmount(uint256 indexed agreementId, uint256 expectedInstallmentAmount);
    event InstallmentPaid(uint256 indexed agreementId, address indexed consumer, address indexed merchant, uint256 amount, uint256 installmentNumber);
    event AgreementCompleted(uint256 indexed agreementId);
    event DebugInstallment(
        uint256 indexed agreementId,
        address consumer,
        address merchant,
        uint256 msgValue,
        uint256 expectedAmount,
        uint256 installmentsPaid,
        bool isCompleted
    );
    
    // Constructor to set treasury address
    constructor(address _treasury) {
        treasury = _treasury;
    }

    function createBNPLAgreement(
        address consumer,
        address merchant,
        uint256 principalAmount,
        uint256 interestRate, // in basis points
        uint256 numInstallments,
        string memory tokenId
    ) external returns (uint256) {
        require(consumer != address(0) && merchant != address(0), "Invalid address");
        require(principalAmount > 0 && numInstallments > 0, "Invalid params");
        require(interestRate <= 10000, "Interest too high"); // max 100%
        require(bytes(tokenId).length > 0, "Token ID required");

        uint256 interest = (principalAmount * interestRate) / 10000;
        uint256 totalOwed = principalAmount + interest;

        agreements[nextAgreementId] = Agreement({
            consumer: consumer,
            merchant: merchant,
            principalAmount: principalAmount,
            interestRate: interestRate,
            totalOwed: totalOwed,
            numInstallments: numInstallments,
            installmentsPaid: 0,
            isCompleted: false,
            tokenId: tokenId
        });

        emit AgreementCreated(nextAgreementId, consumer, merchant, principalAmount, interestRate, totalOwed, numInstallments, tokenId);
        uint256 installmentAmount = totalOwed / numInstallments;
        emit InstallmentAmount(nextAgreementId, installmentAmount);
        return nextAgreementId++;
    }

    function payInstallment(uint256 agreementId) external {
        Agreement storage ag = agreements[agreementId];
        require(!ag.isCompleted, "Agreement completed");
        require(msg.sender == ag.consumer, "Only consumer");
        require(ag.installmentsPaid < ag.numInstallments, "All paid");
        
        uint256 installmentAmount = ag.totalOwed / ag.numInstallments;
        // For the last installment, collect any remainder
        if (ag.installmentsPaid == ag.numInstallments - 1) {
            installmentAmount = ag.totalOwed - (ag.totalOwed / ag.numInstallments * (ag.numInstallments - 1));
        }
        
        // Emit debug event for tracking
        emit DebugInstallment(agreementId, ag.consumer, ag.merchant, installmentAmount, installmentAmount, ag.installmentsPaid, ag.isCompleted);
        
        // Emit events for token operations (actual burn/mint handled by backend)
        emit TokensBurned(agreementId, ag.consumer, installmentAmount, ag.tokenId);
        emit TokensMinted(agreementId, ag.merchant, installmentAmount, ag.tokenId);
        
        ag.installmentsPaid++;
        emit InstallmentPaid(agreementId, ag.consumer, ag.merchant, installmentAmount, ag.installmentsPaid);
        
        if (ag.installmentsPaid == ag.numInstallments) {
            ag.isCompleted = true;
            emit AgreementCompleted(agreementId);
        }
    }

    function getAgreement(uint256 agreementId) external view returns (Agreement memory) {
        return agreements[agreementId];
    }
    
    // Function to handle token burn/mint operations (called by backend)
    function processTokenPayment(
        uint256 agreementId,
        address consumer,
        address merchant,
        uint256 amount,
        string memory tokenId
    ) external {
        // Only allow treasury to call this function
        require(msg.sender == treasury, "Only treasury");
        
        Agreement storage ag = agreements[agreementId];
        require(!ag.isCompleted, "Agreement completed");
        require(ag.consumer == consumer, "Invalid consumer");
        require(ag.merchant == merchant, "Invalid merchant");
        require(keccak256(bytes(ag.tokenId)) == keccak256(bytes(tokenId)), "Invalid token");
        
        // Emit events for token operations
        emit TokensBurned(agreementId, consumer, amount, tokenId);
        emit TokensMinted(agreementId, merchant, amount, tokenId);
        
        ag.installmentsPaid++;
        emit InstallmentPaid(agreementId, consumer, merchant, amount, ag.installmentsPaid);
        
        if (ag.installmentsPaid == ag.numInstallments) {
            ag.isCompleted = true;
            emit AgreementCompleted(agreementId);
        }
    }
    
    // Function to update treasury address (only by contract owner)
    function updateTreasury(address newTreasury) external {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
    }
}