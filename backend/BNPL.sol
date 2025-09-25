// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BNPL {
    struct Agreement {
        address consumer;
        address merchant;
        uint256 totalAmount;
        uint256 numInstallments;
        uint256 installmentsPaid;
        bool isCompleted;
    }

    uint256 public nextAgreementId;
    mapping(uint256 => Agreement) public agreements;

    event AgreementCreated(uint256 indexed agreementId, address indexed consumer, address indexed merchant, uint256 totalAmount, uint256 numInstallments);
    event InstallmentPaid(uint256 indexed agreementId, address indexed consumer, address indexed merchant, uint256 amount, uint256 installmentNumber);
    event AgreementCompleted(uint256 indexed agreementId);

    function createBNPLAgreement(address consumer, address merchant, uint256 totalAmount, uint256 numInstallments) external returns (uint256) {
        require(consumer != address(0) && merchant != address(0), "Invalid address");
        require(totalAmount > 0 && numInstallments > 0, "Invalid params");
        agreements[nextAgreementId] = Agreement({
            consumer: consumer,
            merchant: merchant,
            totalAmount: totalAmount,
            numInstallments: numInstallments,
            installmentsPaid: 0,
            isCompleted: false
        });
        emit AgreementCreated(nextAgreementId, consumer, merchant, totalAmount, numInstallments);
        return nextAgreementId++;
    }

    function payInstallment(uint256 agreementId) external payable {
        Agreement storage ag = agreements[agreementId];
        require(!ag.isCompleted, "Agreement completed");
        require(msg.sender == ag.consumer, "Only consumer");
        require(ag.installmentsPaid < ag.numInstallments, "All paid");
        uint256 installmentAmount = ag.totalAmount / ag.numInstallments;
        require(msg.value == installmentAmount, "Incorrect amount");
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
