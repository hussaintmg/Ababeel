"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const ContactReferenceContext = createContext();

export const useContactReference = () => {
  const context = useContext(ContactReferenceContext);
  if (!context) {
    throw new Error(
      "useContactReference must be used within ContactReferenceProvider",
    );
  }
  return context;
};

export const ContactReferenceProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/enquiries", {
        withCredentials: true,
      });

      const data = response.data;

      if (data.data) {
        setEnquiries(data.data);
      }
    } catch (err) {
      // This provider is mounted globally, so a signed-out visitor on a public
      // page will get a 401 here. That is expected, not an error worth
      // surfacing or logging.
      if (err.response?.status === 401) {
        setEnquiries([]);
        setError(null);
      } else {
        setError(err.message);
        console.error("Error fetching enquiries:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Only fetch once authentication has resolved and there is a signed-in user.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setEnquiries([]);
      setLoading(false);
      return;
    }
    fetchEnquiries();
  }, [authLoading, user]);

  const value = {
    enquiries,
    setEnquiries,
    loading,
    error,
    fetchEnquiries,
    refreshEnquiries: fetchEnquiries,
  };

  return (
    <ContactReferenceContext.Provider value={value}>
      {children}
    </ContactReferenceContext.Provider>
  );
};
