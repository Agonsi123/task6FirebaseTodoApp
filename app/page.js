"use client";

import { useAuth } from "./contexts/AuthContext";
import AuthForm from "./components/AuthForm";
import TodoApp from "./components/TodoApp";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Checking authentication status...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // If user is logged in, show the main todo application content
  return <TodoApp />;
}
