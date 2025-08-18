// This file handles GET, PUT/PATCH, and DELETE requests for a specific todo item.

import { adminDb, admin } from "@/app/lib/firebaseAdmin.cjs"; 
import { NextResponse } from "next/server"; // For Next.js App Router responses

// --- Helper function to get authenticated user's UID ---
async function getAuthenticatedUserUid(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const idToken = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null;
  }
}

// --- Helper function to check todo ownership ---
async function checkTodoOwnership(todoId, userId) {
  const todoDoc = await adminDb.collection("todos").doc(todoId).get();
  if (!todoDoc.exists) {
    return { exists: false };
  }
  const todoData = todoDoc.data();
  if (todoData.userId !== userId) {
    return { exists: true, authorized: false }; // Exists but not owned by this user
  }
  return { exists: true, authorized: true, data: todoData }; // Exists and owned by this user
}

// --- GET request to fetch a single todo item ---
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const uid = await getAuthenticatedUserUid(request);

    if (!uid) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ error: "Todo ID is required." }, { status: 400 });
    }

    const ownership = await checkTodoOwnership(id, uid);

    if (!ownership.exists) {
      return NextResponse.json({ error: "Todo item not found." }, { status: 404 });
    }
    if (!ownership.authorized) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this todo item." },
        { status: 403 }
      );
    }

    const todoData = ownership.data;
    const todo = {
      id: id,
      ...todoData,
      createdAt: todoData.createdAt ? todoData.createdAt.toDate().toISOString() : null,
      updatedAt: todoData.updatedAt ? todoData.updatedAt.toDate().toISOString() : null,
      dueDate: todoData.dueDate ? todoData.dueDate.toDate().toISOString() : null,
    };

    return NextResponse.json(todo, { status: 200 });
  } catch (error) {
    console.error(`Error fetching todo with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch todo with ID ${params.id}`, details: error.message },
      { status: 500 }
    );
  }
}

// --- PUT/PATCH request to update an existing todo item ---
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const uid = await getAuthenticatedUserUid(request);

    if (!uid) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ error: "Todo ID is required for update." }, { status: 400 });
    }

    const ownership = await checkTodoOwnership(id, uid);

    if (!ownership.exists) {
      return NextResponse.json({ error: "Todo item not found." }, { status: 404 });
    }
    if (!ownership.authorized) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own todo items." },
        { status: 403 }
      );
    }

    const updates = await request.json();

    // Prevent changing the userId field via update, even with admin privileges
    if (updates.hasOwnProperty("userId")) {
      delete updates.userId;
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp(); // Add updatedAt timestamp

    // Handle dueDate conversion if present
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    } else if (updates.hasOwnProperty("dueDate") && updates.dueDate === null) {
      updates.dueDate = null; // Allow setting dueDate to null
    }

    const todoRef = adminDb.collection("todos").doc(id);
    await todoRef.update(updates);

    const updatedTodoDoc = await todoRef.get();
    const updatedData = updatedTodoDoc.data();

    // Convert Timestamps for response
    const responseTodo = {
      id: updatedTodoDoc.id,
      ...updatedData,
      createdAt: updatedData.createdAt ? updatedData.createdAt.toDate().toISOString() : null,
      updatedAt: updatedData.updatedAt ? updatedData.updatedAt.toDate().toISOString() : null,
      dueDate: updatedData.dueDate ? updatedData.dueDate.toDate().toISOString() : null,
    };

    return NextResponse.json(responseTodo, { status: 200 }); // 200 OK
  } catch (error) {
    console.error(`Error updating todo with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: `Failed to update todo with ID ${params.id}`, details: error.message },
      { status: 500 }
    );
  }
}

// --- DELETE request to remove an existing todo item ---
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const uid = await getAuthenticatedUserUid(request);

    if (!uid) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ error: "Todo ID is required for deletion." }, { status: 400 });
    }

    const ownership = await checkTodoOwnership(id, uid);

    if (!ownership.exists) {
      return NextResponse.json({ error: "Todo item not found." }, { status: 404 });
    }
    if (!ownership.authorized) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own todo items." },
        { status: 403 }
      );
    }

    await adminDb.collection("todos").doc(id).delete();

    return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
  } catch (error) {
    console.error(`Error deleting todo with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: `Failed to delete todo with ID ${params.id}`, details: error.message },
      { status: 500 }
    );
  }
}
