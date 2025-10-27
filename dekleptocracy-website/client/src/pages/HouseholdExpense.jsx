import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HouseholdExpense.css';

const HouseholdExpense = () => {
  const [selectedExpense, setSelectedExpense] = useState('');

  const expenseOptions = [
    'Groceries',
    'Rent / Mortgage',
    'Utilities',
    'Healthcare',
    'Others'
  ];

  const handleExpenseSelect = (expense) => {
    setSelectedExpense(expense);
  };

  const handleNext = () => {
    // Handle expense selection submission here
    console.log('Selected expense:', selectedExpense);
    // Navigate to dashboard page
    window.location.href = '/dashboard';
  };

  return (
    <div className="household-expense-page">
      <div className="household-expense-container">
        <div className="household-expense-content">
          <h1 className="household-expense-question">
            What's your biggest household expense this week?
          </h1>
          
          <p className="household-expense-subtitle">
            Answer one quick question to personalize your insights. No email required.
          </p>

          <div className="expense-options">
            {expenseOptions.map((expense) => (
              <div
                key={expense}
                className={`expense-option ${selectedExpense === expense ? 'selected' : ''}`}
                onClick={() => handleExpenseSelect(expense)}
              >
                {expense}
              </div>
            ))}
          </div>

          <div className="navigation-buttons">
            <Link to="/dashboard" className="skip-button">
              Skip
            </Link>
            <button 
              className="next-button"
              onClick={handleNext}
              disabled={!selectedExpense}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseholdExpense;
