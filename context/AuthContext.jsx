"use client";
import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUserData = async () => {
    try {
      try {
        const res = await axios.get("/api/auth/verify-user", {
          withCredentials: true,
        });
        setUser(res.data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const simulateWebhook = async (depositId, paymentIntentId, amount) => {
    try {
      const response = await axios.post(
        "/api/payments/simulate-webhook",
        {
          depositId,
          paymentIntentId,
          amount: parseFloat(amount),
        },
        { withCredentials: true },
      );

      return response.data;
    } catch (error) {
      console.error("Failed to simulate webhook:", error);
      throw error;
    }
  };

  // Function to refresh user data
  const refreshUser = async () => {
    await getUserData();
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        getUserData,
        setUser,
        simulateWebhook,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
