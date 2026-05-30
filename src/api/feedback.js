import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore'
import { getFirebaseDb } from '../lib/firebase'

export async function submitFeedback({ name, mood, message, userId, avatar }) {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore not initialized')

  const docRef = await addDoc(collection(db, 'feedback'), {
    name: name || '',
    mood,
    message,
    userId: userId || '',
    avatar: avatar || '',
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getFeedback(limitCount = 50) {
  const db = getFirebaseDb()
  if (!db) return []

  try {
    const q = query(
      collection(db, 'feedback'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch {
    return []
  }
}
