// This file contains client-side helper functions for interacting with our Next.js API routes.

import { auth } from "@/app/lib/firebaseClient"; // Import your client-side Firebase auth instance

const API_BASE_URL = "/api/todos"; // Our base URL for the todo API routes

/**
 * Generic authenticated fetch wrapper.
 * This function will get the current user's ID token and attach it to the request headers.
 */
async function fetchAuthenticated(url, options = {}) {
  const user = auth.currentUser; // Get the currently signed-in user

  if (!user) {
    // If no user is signed in, throw an error. 
    throw new Error("Authentication required:  User Not Signed In.");
  }

  const idToken = await user.getIdToken(); // Get the Firebase ID Token


  const headers = {
    "Content-Type": "application/json",
    ...options.headers, // Merge any existing headers
    Authorization: `Bearer ${idToken}`, // Add the ID token!
  };

  const response = await fetch(url, {
    ...options, // Spread any other fetch options (method, body, cache, etc.)
    headers,
  });

  // Handle API errors (e.g., 401, 403, 404, 500)
  if (!response.ok) {
    let errorData = {};
    try {
      // Attempt to parse JSON error response if available
      errorData = await response.json();
    } catch (e) {
      // If response is not JSON (e.g., 204 No Content for DELETE)
      // or if parsing fails, use default message.
      errorData = { error: response.statusText || `HTTP error! Status: ${response.status}` };
    }
    // Re-throw with a more descriptive error message
    throw new Error(errorData.error || `API Error (${response.status}): ${response.statusText}`);
  }

  // Special handling for 204 No Content (DELETE success)
  if (response.status === 204) {
    return null; // No content to return for 204
  }

  return response.json(); // Parse and return the JSON response
}

// Function to fetch all todo items
export async function fetchTodos() {
  try {
    // Use the authenticated fetch wrapper
    const todos = await fetchAuthenticated(API_BASE_URL, {
      method: "GET",
      // cache: 'no-store', // Example caching strategy
    });
    return todos;
  } catch (error) {
    console.error("Error in fetchTodos:", error);
    throw error; // Re-throw to be handled by the calling component
  }
}

// Function to add a new todo item
export async function createTodo(todoData) {
  try {
    // API route will add the userId on the server
    const newTodo = await fetchAuthenticated(API_BASE_URL, {
      method: "POST",
      body: JSON.stringify(todoData), // todoData should contain text, dueDate, completed, priority
    });
    return newTodo;
  } catch (error) {
    console.error("Error in createTodo:", error);
    throw error;
  }
}

// Function to update an existing todo item
export async function updateTodo(id, updatedData) {
  try {
    const updatedTodo = await fetchAuthenticated(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(updatedData),
    });
    return updatedTodo;
  } catch (error) {
    console.error(`Error in updateTodo for ID ${id}:`, error);
    throw error;
  }
}

// Function to delete a todo item
export async function deleteTodo(id) {
  try {
    // The fetchAuthenticated function will return null for 204 No Content
    await fetchAuthenticated(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });
    return { success: true }; // Indicate success
  } catch (error) {
    console.error(`Error in deleteTodo for ID ${id}:`, error);
    throw error;
  }
}


// Function to fetch a single todo item by ID
export async function fetchTodoById(id) {
  try {
    const todo = await fetchAuthenticated(`${API_BASE_URL}/${id}`, {
      method: 'GET',
    });
    return todo;
  } catch (error) {
    console.error(`Error in fetchTodoById for ID ${id}:`, error);
    throw error;
  }
}


