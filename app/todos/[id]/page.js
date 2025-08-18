"use client"; 

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchTodoById } from '@/utils/helper'; 
import { useAuth } from '@/app/contexts/AuthContext'; // To check if user is logged in

export default function TodoDetailsPage({ params }) {
  const router = useRouter();
  const { user } = useAuth(); // Get authenticated user context
  const { id } = params; // Get the todo ID from the URL parameters

  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTodoDetails = async () => {
      if (!user) {
        // If no user, redirect to home/login page
        router.push('/');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const fetchedTodo = await fetchTodoById(id);
        setTodo(fetchedTodo);
      } catch (err) {
        setError(`Failed to load todo details: ${err.message}`);
        console.error("Error loading todo details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) { // Ensure ID is available before fetching
      loadTodoDetails();
    }
  }, [id, user, router]); // Re-fetch if ID or user changes

  const handleBackToList = () => {
    router.push('/'); // Navigate back to the main todo list
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
        Loading todo details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 p-4">
        <p>{error}</p>
        <button
          onClick={handleBackToList}
          className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to List
        </button>
      </div>
    );
  }

  if (!todo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700 p-4">
        <p>Todo item not found.</p>
        <button
          onClick={handleBackToList}
          className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white p-6 sm:p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 text-center">Todo Details</h1>

        <div className="space-y-4 text-lg">
          <p>
            <strong className="text-gray-700">ID:</strong> <span className="text-gray-600 break-all">{todo.id}</span>
          </p>
          <p>
            <strong className="text-gray-700">Text:</strong> <span className="text-gray-800">{todo.text}</span>
          </p>
          <p>
            <strong className="text-gray-700">Completed:</strong>{' '}
            <span className={`font-semibold ${todo.completed ? 'text-green-600' : 'text-yellow-600'}`}>
              {todo.completed ? 'Yes' : 'No'}
            </span>
          </p>
          {todo.priority && (
            <p>
              <strong className="text-gray-700">Priority:</strong> <span className="text-gray-600">{todo.priority}</span>
            </p>
          )}
          {todo.dueDate && (
            <p>
              <strong className="text-gray-700">Due Date:</strong>{' '}
              <span className="text-gray-600">{new Date(todo.dueDate).toLocaleDateString()}</span>
            </p>
          )}
          {todo.createdAt && (
            <p>
              <strong className="text-gray-700">Created At:</strong>{' '}
              <span className="text-gray-600">{new Date(todo.createdAt).toLocaleString()}</span>
            </p>
          )}
          {todo.updatedAt && (
            <p>
              <strong className="text-gray-700">Last Updated:</strong>{' '}
              <span className="text-gray-600">{new Date(todo.updatedAt).toLocaleString()}</span>
            </p>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleBackToList}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm sm:text-base"
          >
            Back to All Todos
          </button>
        </div>
      </div>
    </div>
  );
}
