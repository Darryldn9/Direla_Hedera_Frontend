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
    }

    uint256 public nextAgreementId;
    mapping(uint256 => Agreement) public agreements;

    event AgreementCreated(
        uint256 indexed agreementId,
        address indexed consumer,
        address indexed merchant,
        uint256 principalAmount,
        uint256 interestRate,
        uint256 totalOwed,
        uint256 numInstallments
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

    function createBNPLAgreement(
        address consumer,
        address merchant,
        uint256 principalAmount,
        uint256 interestRate, // in basis points
        uint256 numInstallments
    ) external returns (uint256) {
        require(consumer != address(0) && merchant != address(0), "Invalid address");
        require(principalAmount > 0 && numInstallments > 0, "Invalid params");
        require(interestRate <= 10000, "Interest too high"); // max 100%

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
            isCompleted: false
        });

        emit AgreementCreated(nextAgreementId, consumer, merchant, principalAmount, interestRate, totalOwed, numInstallments);
        uint256 installmentAmount = totalOwed / numInstallments;
        emit InstallmentAmount(nextAgreementId, installmentAmount);
        return nextAgreementId++;
    }

    function payInstallment(uint256 agreementId) external payable {
        Agreement storage ag = agreements[agreementId];
        require(!ag.isCompleted, "Agreement completed");
        require(msg.sender == ag.consumer, "Only consumer");
        require(ag.installmentsPaid < ag.numInstallments, "All paid");
        uint256 installmentAmount = ag.totalOwed / ag.numInstallments;
        uint256 expectedAmount = installmentAmount;
        // For the last installment, collect any remainder
        if (ag.installmentsPaid == ag.numInstallments - 1) {
            expectedAmount = ag.totalOwed - (installmentAmount * (ag.numInstallments - 1));
        }
        // Emit debug event BEFORE require so we can see values even on failure
        emit DebugInstallment(agreementId, ag.consumer, ag.merchant, msg.value, expectedAmount, ag.installmentsPaid, ag.isCompleted);
        require(msg.value == expectedAmount, "Incorrect amount");
        ag.installmentsPaid++;
        (bool sent, ) = ag.merchant.call{value: msg.value}("");
        require(sent, "Transfer failed");
        emit InstallmentPaid(agreementId, ag.consumer, ag.merchant, msg.value, ag.installmentsPaid);
        if (ag.installmentsPaid == ag.numInstallments) {
            ag.isCompleted = true;
            emit AgreementCompleted(agreementId);
        }
    }

    function getAgreement(uint256 agreementId) external view returns (Agreement memory) {
        return agreements[agreementId];
    }
}
