"use client"; // This is a client component

import React, { useState, useEffect } from "react";
// To get the logged-in user's info if needed
import { useAuth } from "@/app/contexts/AuthContext";
// To add a logout functionality
import { signOut } from "firebase/auth";
// Our client-side firebase auth instance
import { auth } from "../lib/firebaseClient";
// For redirection on logout
import { useRouter } from "next/navigation";

// Import our API helper functions
import { fetchTodos, createTodo, updateTodo, deleteTodo } from "@/utils/helper";

export default function TodoApp() {
  const { user } = useAuth(); // Get the current user
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [loading, setLoading] = useState(true); // General loading state for API operations
  const [error, setError] = useState(null);
  const router = useRouter();

  // Stores the ID of the todo currently being edited. Null if no todo is in edit mode.
  const [editingTodoId, setEditingTodoId] = useState(null);
  // Stores the text content of the todo being edited in the input field.
  const [editingTodoText, setEditingTodoText] = useState("");

  // Function to load todos from the API
  const loadTodos = async () => {
    setLoading(true); // Set loading true at the start of fetch
    setError(null); // Clear previous errors before loading
    try {
      const data = await fetchTodos();
      if (Array.isArray(data)) {
        setTodos(data);
      } else if (data && Array.isArray(data.todos)) {
        // Fallback if API sends { todos: [...] }
        setTodos(data.todos);
      } else {
        setTodos([]); // Default to empty array if unexpected data structure
      }
    } catch (err) {
      setError("Failed to load todos: " + err.message);
      console.error("Load todos error:", err);
    } finally {
      setLoading(false); // Set loading false after fetch completes
    }
  };

  // Handle adding a new todo item
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) {
      setError("Todo text cannot be empty.");
      return;
    }
    setError(null); // Clear previous errors
    setLoading(true); // Indicate loading for this operation

    try {
      await createTodo({ text: newTodoText, completed: false }); // Include completed: false for new todos
      setNewTodoText(""); // Clear the input field
      await loadTodos(); // Reload the list to show the new todo
    } catch (err) {
      setError("Failed to add todo: " + err.message);
      console.error("Add todo error:", err);
    } finally {
      setLoading(false); // End loading for this operation
    }
  };

  //Handle Delete Todo
  const handleDeleteTodo = async (id) => {
    setError(null); // Clear previous errors
    setLoading(true); // Indicate loading for this operation

    try {
      await deleteTodo(id);
      await loadTodos(); // Reload the list to reflect deletion
    } catch (err) {
      setError("Failed to delete todo: " + err.message);
      console.error("Delete todo error:", err);
    } finally {
      setLoading(false); // End loading
    }
  };

  //Handle Edit
  const handleEditClick = (todo) => {
    setEditingTodoId(todo.id); // Set the ID of the todo to be edited
    setEditingTodoText(todo.text); // Pre-fill the input with current todo text
    setError(null); // Clear any existing errors when starting edit
  };

  //Handle Update Todo
  const handleUpdateTodo = async (id) => {
    if (!editingTodoText.trim()) {
      setError("Todo text cannot be empty.");
      return;
    }
    setError(null); // Clear previous errors
    setLoading(true); // Indicate loading

    try {
      // Call the helper function to update the todo
      await updateTodo(id, { text: editingTodoText });
      setEditingTodoId(null); // Exit editing mode
      setEditingTodoText(""); // Clear editing input field
      await loadTodos(); // Reload todos to show the updated item
    } catch (err) {
      setError("Failed to update todo: " + err.message);
      console.error("Update todo error:", err);
    } finally {
      setLoading(false); // End loading
    }
  };

  //Handle Cancel Edit
  const handleCancelEdit = () => {
    setEditingTodoId(null); // Exit editing mode
    setEditingTodoText(""); // Clear editing input
    setError(null); // Clear errors
  };

  // Navigate to view details page
  const handleViewDetails = (id) => {
    router.push(`/todos/${id}`);
  };

  //Handle Toggling Completed Status
  const handleToggleCompleted = async (id, currentCompletedStatus) => {
    setError(null);
    setLoading(true); // Indicate loading for this operation

    try {
      // Send the inverse of the current status
      await updateTodo(id, { completed: !currentCompletedStatus });
      await loadTodos(); // Reload the list to reflect the change
    } catch (err) {
      setError("Failed to update todo status: " + err.message);
      console.error("Toggle completed error:", err);
    } finally {
      setLoading(false); // End loading
    }
  };

  // Effect to load todos when the component mounts or user changes
  useEffect(() => {
    if (user) {
      // Only load if a user is logged in
      loadTodos();
    } else {
      setTodos([]); // Clear todos if no user
      setLoading(false); // Stop loading if no user
    }
  }, [user]); // Re-run if the user object changes

  // Handle user logout
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/"); // Explicitly push to root (AuthContext handles the state change)
    } catch (err) {
      setError("Failed to sign out: " + err.message);
      console.error("Sign out error:", err);
    }
  };

  // Conditional rendering for initial loading state (when no todos are displayed yet)
  if (loading && todos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
        Loading todos...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-0">
          <h1 className="text-xl sm:text-2xl md:text-xl lg:text-4xl font-extrabold text-gray-900 text-center sm:text-left">
            Welcome, {user ? user.email : "Guest"}! Your Todos
          </h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto"
          >
            Sign Out
          </button>
        </div>

        {/* Display Error Message at the top if there is one */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline text-sm sm:text-base">{error}</span>{" "}
            {/* Adjusted text size */}
          </div>
        )}

        {/* Add Todo Form */}
        <form onSubmit={handleAddTodo} className="flex flex-col sm:flex-row gap-4 mb-8">
          {" "}
          {/* Added flex-col for small screens */}
          <input
            type="text"
            className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[#777] text-sm sm:text-base" // Adjusted text size
            placeholder="Add a new todo..."
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            disabled={loading} // Disable input when any action is loading
          />
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            disabled={loading} // Disable button when any action is loading
          >
            Add Todo
          </button>
        </form>

        {/* Todo List */}
        {todos.length === 0 && !loading ? (
          <p className="text-center text-gray-500 text-sm sm:text-lg">
            No todos yet! Add one above.
          </p>
        ) : (
          <ul className="space-y-4">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-3 sm:p-4 rounded-md shadow-sm border border-gray-200"
              >
                {/* --- CONDITIONAL RENDERING FOR EDITING --- */}
                {editingTodoId === todo.id ? (
                  // Editing mode: Show input and Update/Cancel buttons
                  <div className="flex-grow flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                    <input
                      type="text"
                      className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#777] text-sm sm:text-base w-full"
                      value={editingTodoText}
                      onChange={(e) => setEditingTodoText(e.target.value)}
                      disabled={loading} // Disable input while an operation is pending
                    />
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      {" "}
                      {/* Buttons wrap, full width on small screens */}
                      <button
                        onClick={() => handleUpdateTodo(todo.id)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm w-full sm:w-auto"
                        disabled={loading} // Disable button while an operation is pending
                      >
                        Update
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm w-full sm:w-auto"
                        disabled={loading} // Disable button while an operation is pending
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode: Show todo text and Edit/Delete buttons
                  <>
                    <div className="flex items-center flex-grow mb-2 sm:mb-0 min-w-0">
                      {" "}
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleCompleted(todo.id, todo.completed)}
                        className="mr-3 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded flex-shrink-0" // flex-shrink-0 to keep its size
                        disabled={loading}
                      />
                      <span
                        className={`text-base sm:text-lg text-gray-800 ${
                          todo.completed ? "line-through text-gray-500" : ""
                        } break-words`}
                        // style={{ minWidth: "0" }}
                      >
                        {todo.text}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <button
                        onClick={() => handleViewDetails(todo.id)}
                        className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        disabled={loading}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditClick(todo)}
                        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        disabled={loading} // Disable button while an operation is pending
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        disabled={loading} // Disable button while an operation is pending
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
