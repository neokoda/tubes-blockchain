// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract InvoiceLending {
    enum LoanState {
        PENDING,
        OPEN,
        ACTIVE,
        CLOSED
    }

    struct Loan {
        uint256 id;
        address borrower;
        uint256 amountRequested;
        uint256 amountFunded;
        string ipfsHash;
        string invoiceNumber;
        uint256 interestRate;
        LoanState state;
        address[] investors;
    }

    IERC20 public token;
    address public oracle;
    uint256 public nextLoanId = 1;

    mapping(uint256 => Loan) public loans;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    event LoanCreated(
        uint256 loanId,
        address borrower,
        uint256 amount,
        string invoiceNumber
    );
    event LoanVerified(uint256 loanId, bool isValid);
    event Funded(uint256 loanId, address investor, uint256 amount);
    event Disbursed(uint256 loanId, uint256 amount);
    event Repaid(uint256 loanId, uint256 amount);

    modifier onlyOracle() {
        require(msg.sender == oracle, "Not Oracle");
        _;
    }

    constructor(address _tokenAddress, address _oracleAddress) {
        token = IERC20(_tokenAddress);
        oracle = _oracleAddress;
    }

    function createLoanRequest(
        uint256 _amount,
        uint256 _interest,
        string memory _ipfsHash,
        string memory _invoiceNumber
    ) external {
        Loan storage newLoan = loans[nextLoanId];
        newLoan.id = nextLoanId;
        newLoan.borrower = msg.sender;
        newLoan.amountRequested = _amount;
        newLoan.interestRate = _interest;
        newLoan.ipfsHash = _ipfsHash;
        newLoan.invoiceNumber = _invoiceNumber;
        newLoan.state = LoanState.PENDING;

        emit LoanCreated(nextLoanId, msg.sender, _amount, _invoiceNumber);
        nextLoanId++;
    }

    function verifyLoan(uint256 _loanId, bool _isValid) external onlyOracle {
        require(loans[_loanId].state == LoanState.PENDING, "Invalid State");
        if (_isValid) {
            loans[_loanId].state = LoanState.OPEN;
        } else {
            loans[_loanId].state = LoanState.CLOSED;
        }
        emit LoanVerified(_loanId, _isValid);
    }

    function fundLoan(uint256 _loanId, uint256 _amount) external {
        Loan storage loan = loans[_loanId];
        require(loan.state == LoanState.OPEN, "Not Open");
        require(
            loan.amountFunded + _amount <= loan.amountRequested,
            "Overfunded"
        );

        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Transfer Failed"
        );
        if (contributions[_loanId][msg.sender] == 0) {
            loan.investors.push(msg.sender);
        }
        contributions[_loanId][msg.sender] += _amount;
        loan.amountFunded += _amount;

        emit Funded(_loanId, msg.sender, _amount);
    }

    function withdrawFunds(uint256 _loanId) external {
        Loan storage loan = loans[_loanId];
        require(msg.sender == loan.borrower, "Not Borrower");
        require(loan.state == LoanState.OPEN, "Not Open");
        require(loan.amountFunded >= loan.amountRequested, "Not Fully Funded");

        loan.state = LoanState.ACTIVE;
        token.transfer(loan.borrower, loan.amountFunded);
        emit Disbursed(_loanId, loan.amountFunded);
    }

    function repayLoan(uint256 _loanId) external {
        Loan storage loan = loans[_loanId];
        require(msg.sender == loan.borrower, "Not Borrower");
        require(loan.state == LoanState.ACTIVE, "Not Active");

        uint256 totalRepayment = loan.amountRequested +
            ((loan.amountRequested * loan.interestRate) / 100);
        require(
            token.transferFrom(msg.sender, address(this), totalRepayment),
            "Transfer Failed"
        );

        for (uint i = 0; i < loan.investors.length; i++) {
            address inv = loan.investors[i];
            uint256 share = (contributions[_loanId][inv] * totalRepayment) /
                loan.amountFunded;
            token.transfer(inv, share);
        }

        loan.state = LoanState.CLOSED;
        emit Repaid(_loanId, totalRepayment);
    }
}
