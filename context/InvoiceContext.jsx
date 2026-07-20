"use client";

import { createContext, useContext, useState, useEffect } from "react";

const InvoiceContext = createContext();
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export const InvoiceProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [paidInvoices, setPaidInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categorizeInvoices = (invoicesData) => {
    const pending = invoicesData.filter(
      (invoice) =>
        invoice.paymentStatus === "pending" ||
        invoice.paymentStatus === "partially_paid" ||
        invoice.paymentStatus === "overdue"
    );

    const paid = invoicesData.filter(
      (invoice) => invoice.paymentStatus === "paid"
    );

    setPendingInvoices(pending);
    setPaidInvoices(paid);
    setInvoices(invoicesData);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      try {
        const response = await axios.get("/api/invoices/all", {
          withCredentials: true,
        });

        const data = await response.data;
        categorizeInvoices(data.invoices);
        setError(null);
      } catch (err) {
        console.log("erro fetching invoices");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mounted globally, so only fetch once auth has resolved and a user exists.
  // Otherwise a signed-out visitor on a public page triggers a 401.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setInvoices([]);
      setPendingInvoices([]);
      setPaidInvoices([]);
      setLoading(false);
      return;
    }
    fetchInvoices();
  }, [authLoading, user]);

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        pendingInvoices,
        paidInvoices,
        loading,
        error,
        fetchInvoices,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error("useInvoices must be used within InvoiceProvider");
  }
  return context;
};
