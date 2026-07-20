'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
const ContactContext = createContext();

export const ContactProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submitContact = async (formData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post('/api/contact', formData);
      setSuccess(true);
      
      // Auto reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
      
      return response;
    } catch (err) {
      setError(err.message || 'Failed to submit form. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormState = () => {
    setError(null);
    setSuccess(false);
  };

  return (
    <ContactContext.Provider
      value={{
        isLoading,
        error,
        success,
        submitContact,
        resetFormState,
      }}
    >
      {children}
    </ContactContext.Provider>
  );
};

export const useContact = () => {
  const context = useContext(ContactContext);
  if (!context) {
    throw new Error('useContact must be used within ContactProvider');
  }
  return context;
};