import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadPreferences, savePreferences } from '../utils/preferences';
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

  useEffect(() => {
    const saved = loadPreferences();
    if (saved.householdExpenseFocus) {
      setSelectedExpense(saved.householdExpenseFocus);
    }
  }, []);

  const handleExpenseSelect = (expense) => {
    setSelectedExpense(expense);
  };

  const handleNext = () => {
    savePreferences({ householdExpenseFocus: selectedExpense });
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
            <Link
              to="/dashboard"
              className="skip-button"
              onClick={() => {
                if (selectedExpense) {
                  savePreferences({ householdExpenseFocus: selectedExpense });
                }
              }}
            >
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
