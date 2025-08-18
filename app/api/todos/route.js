// This file handles POST requests to create a new todo item
// and GET requests to fetch all todo items for the authenticated user.

import { adminDb, admin } from "@/app/lib/firebaseAdmin.cjs"; 
import { NextResponse } from "next/server"; // For Next.js App Router responses

// --- Helper function to get authenticated user's UID ---
// This assumes the client sends a Firebase ID Token in the Authorization header.
async function getAuthenticatedUserUid(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null; // No token or malformed header
  }
  const idToken = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null; // Invalid or expired token
  }
}

// --- POST request to create a new todo item ---
export async function POST(request) {
  try {
    const uid = await getAuthenticatedUserUid(request);

    if (!uid) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { text, dueDate, completed = false, priority } = await request.json(); // Get todo data from request body

    // Basic validation
    if (!text || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Missing required todo fields (text, completed)." },
        { status: 400 }
      );
    }

    const newTodoData = {
      text,
      completed,
      userId: uid, // <--- CRUCIAL: Link todo to the authenticated user
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (dueDate) {
      newTodoData.dueDate = new Date(dueDate); // Convert to Date object
    }
    if (priority) {
      newTodoData.priority = priority;
    }

    const docRef = await adminDb.collection("todos").add(newTodoData);

    return NextResponse.json({ id: docRef.id, ...newTodoData }, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json(
      { error: "Failed to create todo.", details: error.message },
      { status: 500 }
    );
  }
}

// --- GET request to fetch all todo items for the authenticated user ---
export async function GET(request) {
  try {
    const uid = await getAuthenticatedUserUid(request);

    if (!uid) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // Query Firestore for todos belonging to the authenticated user
    const todosSnapshot = await adminDb
      .collection("todos")
      .where("userId", "==", uid) // <--- CRUCIAL: Filter by user ID
      .orderBy("createdAt", "desc")
      .get();

    const todos = todosSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings for client-side
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        dueDate: data.dueDate ? data.dueDate.toDate().toISOString() : null,
      };
    });

    return NextResponse.json(todos, { status: 200 });
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json(
      { error: "Failed to fetch todos.", details: error.message },
      { status: 500 }
    );
  }
}
