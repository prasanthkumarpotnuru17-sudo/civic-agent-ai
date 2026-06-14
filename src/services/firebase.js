import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

const complaintsCol = collection(db, "complaints");
const usersCol = collection(db, "users");

// ==========================================
// AUTH & USER SERVICES
// ==========================================

// 1. Get user profile from Firestore
export async function getUserProfile(uid) {
  try {
    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

// 2. Register user with Email + Password
export async function registerWithEmail(email, password, additionalData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create firestore profile
    const profile = {
      uid: user.uid,
      email: user.email,
      name: additionalData.name || "",
      mobile: additionalData.mobile || "",
      defaultLocation: additionalData.defaultLocation || "",
      preferredLanguage: additionalData.preferredLanguage || "English",
      role: "citizen",
      totalComplaints: 0,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, "users", user.uid), profile);
    return { user, profile };
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

// 3. Login with Email + Password
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(userCredential.user.uid);
    return { user: userCredential.user, profile };
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}

// 4. Login with Google
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    // Check if profile exists in Firestore, if not seed it
    let profile = await getUserProfile(user.uid);
    if (!profile) {
      profile = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || "",
        mobile: "",
        defaultLocation: "",
        preferredLanguage: "English",
        role: "citizen",
        totalComplaints: 0,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "users", user.uid), profile);
    }
    return { user, profile };
  } catch (error) {
    console.error("Error logging in with Google:", error);
    throw error;
  }
}

// 5. Secure Logout
export async function logOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}

// 6. Update user profile details
export async function updateUserProfile(uid, data) {
  try {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, data);
    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

// ==========================================
// COMPLAINT SERVICES
// ==========================================

// 1. Create a new complaint
export async function createComplaint(complaintData) {
  try {
    const docRef = await addDoc(complaintsCol, {
      ...complaintData,
      createdAt: new Date().toISOString()
    });

    // If submitted by authenticated user, increment their totalComplaints count in Firestore
    if (complaintData.userId) {
      try {
        const userDocRef = doc(db, "users", complaintData.userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const currentTotal = userSnap.data().totalComplaints || 0;
          await updateDoc(userDocRef, { totalComplaints: currentTotal + 1 });
        }
      } catch (err) {
        console.error("Error incrementing user complaint count:", err);
      }
    }

    return { docId: docRef.id, ...complaintData };
  } catch (error) {
    console.error("Error creating complaint in Firestore:", error);
    throw error;
  }
}

// 2. Get single complaint
export async function getComplaintById(id) {
  try {
    // Try document ID first
    const docSnap = await getDoc(doc(db, "complaints", id));
    if (docSnap.exists()) {
      return { docId: docSnap.id, ...docSnap.data() };
    }

    // Try custom complaintId field
    const q = query(complaintsCol, where("complaintId", "==", id));
    const snapshot = await getDocs(q);
    let found = null;
    snapshot.forEach((snap) => {
      found = { docId: snap.id, ...snap.data() };
    });
    return found;
  } catch (error) {
    console.error("Error getting complaint:", error);
    throw error;
  }
}

// 3. Get all complaints
export async function getAllComplaints() {
  try {
    const snapshot = await getDocs(complaintsCol);
    const complaints = [];
    snapshot.forEach((snap) => {
      complaints.push({ docId: snap.id, ...snap.data() });
    });
    return complaints.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch (error) {
    console.error("Error getting all complaints:", error);
    throw error;
  }
}

// 4. Get complaints by user UID
export async function getUserComplaints(uid) {
  try {
    const q = query(complaintsCol, where("userId", "==", uid));
    const snapshot = await getDocs(q);
    const complaints = [];
    snapshot.forEach((snap) => {
      complaints.push({ docId: snap.id, ...snap.data() });
    });
    return complaints.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch (error) {
    console.error("Error getting user complaints:", error);
    throw error;
  }
}

// 5. Update complaint status
export async function updateComplaintStatus(docId, status, remarks) {
  try {
    const docRef = doc(db, "complaints", docId);
    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };
    if (remarks) {
      updateData.officerRemarks = remarks;
      updateData.reasoning = remarks;
    }
    await updateDoc(docRef, updateData);
    return { docId, ...updateData };
  } catch (error) {
    console.error("Error updating complaint status:", error);
    throw error;
  }
}

// 6. Upload image
export async function uploadComplaintImage(file) {
  if (!file) return "";
  try {
    const fileRef = ref(storage, `complaints/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

export { app, db, storage, auth };
