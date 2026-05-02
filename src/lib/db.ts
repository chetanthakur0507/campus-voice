import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusvoice';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (cachedDb) return cachedDb;

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedClient = client;
    cachedDb = client.db('campusvoice');
    
    // Create indexes
    const usersCollection = cachedDb.collection('users');
    const complaintsCollection = cachedDb.collection('complaints');
    
    await usersCollection.createIndex({ collegeId: 1 }, { unique: true });
    await complaintsCollection.createIndex({ createdAt: -1 });
    await complaintsCollection.createIndex({ category: 1 });
    
    console.log('✅ MongoDB connected successfully');
    return cachedDb;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export interface Comment {
  id: string;
  anonName: string;
  text: string;
  createdAt: string;
}

export interface Complaint {
  _id?: string;
  id: string;
  anonId: string;       // random ID — never the real user
  anonName: string;     // e.g. "Gumnaam Taara"
  category: string;
  text: string;
  imageUrl?: string;
  upvotes: number;
  downvotes: number;
  status: 'pending' | 'review' | 'resolved';
  comments: Comment[];
  createdAt: string;
}

export interface User {
  collegeId: string;
  displayName: string;  // Username to show
  course: string;       // Course like BCS, CSE, etc.
  passwordHash: string;
  anonSalt: string;     // used to generate consistent anon ID per user
}

// User operations
export async function findUser(collegeId: string): Promise<User | null> {
  const db = await connectDB();
  return db.collection('users').findOne({ collegeId }) as Promise<User | null>;
}

export async function createUser(user: User): Promise<void> {
  const db = await connectDB();
  await db.collection('users').insertOne(user as any);
}

export async function getUserCount(): Promise<number> {
  const db = await connectDB();
  return db.collection('users').countDocuments();
}

// Complaint operations
export async function getComplaints_DB(): Promise<Complaint[]> {
  const db = await connectDB();
  return db.collection('complaints').find({}).sort({ createdAt: -1 }).toArray() as Promise<Complaint[]>;
}

export async function createComplaint(complaint: Complaint): Promise<void> {
  const db = await connectDB();
  await db.collection('complaints').insertOne(complaint as any);
}

export async function getComplaintById(id: string): Promise<Complaint | null> {
  const db = await connectDB();
  return db.collection('complaints').findOne({ id }) as Promise<Complaint | null>;
}

export async function updateComplaint(id: string, updates: Partial<Complaint>): Promise<void> {
  const db = await connectDB();
  await db.collection('complaints').updateOne({ id }, { $set: updates });
}

export async function addComment(complaintId: string, comment: Comment): Promise<void> {
  const db = await connectDB();
  await db.collection('complaints').updateOne(
    { id: complaintId },
    { $push: { comments: comment } }
  );
}

export async function updateVotes(complaintId: string, upvotes: number, downvotes: number): Promise<void> {
  const db = await connectDB();
  await db.collection('complaints').updateOne(
    { id: complaintId },
    { $set: { upvotes, downvotes } }
  );
}

// Vote tracking operations
export async function getVote(userId: string, complaintId: string): Promise<number | null> {
  const db = await connectDB();
  const vote = await db.collection('votes').findOne({ userId, complaintId }) as any;
  return vote ? vote.value : null;
}

export async function setVote(userId: string, complaintId: string, value: number): Promise<void> {
  const db = await connectDB();
  await db.collection('votes').updateOne(
    { userId, complaintId },
    { $set: { userId, complaintId, value } },
    { upsert: true }
  );
}

// Initialize sample data
export async function initializeSampleData(): Promise<void> {
  const db = await connectDB();
  const complaintsCollection = db.collection('complaints');
  
  const count = await complaintsCollection.countDocuments();
  if (count > 0) return;

  const sampleComplaints: Complaint[] = [
    {
      id: 'c1',
      anonId: 'anon_a1b2',
      anonName: 'Gumnaam Taara',
      category: 'Canteen',
      text: 'Canteen ka khana bilkul bakwaas ho gaya hai. Roti sukhi, dal mein paani. Please kuch karo yaar, din mein teen baar wahi khana khaana padta hai.',
      upvotes: 34,
      downvotes: 2,
      status: 'review',
      comments: [
        { id: 'cm1', anonName: 'Chhupa #42', text: 'Bilkul sahi kaha bhai, main bhi yahi soch raha tha!', createdAt: new Date(Date.now() - 3600000).toISOString() }
      ],
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'c2',
      anonId: 'anon_c3d4',
      anonName: 'Chhupa Rustam',
      category: 'Hostel',
      text: 'C block mein pichle 1 hafte se paani nahi aa raha raat ko. Warden ko 3 baar bol chuke hain, koi kaam nahi hua. Aakhir kab tak?',
      upvotes: 67,
      downvotes: 1,
      status: 'pending',
      comments: [
        { id: 'cm2', anonName: 'Raaz Wala #9', text: 'D block mein bhi yehi problem hai yaar.', createdAt: new Date(Date.now() - 86400000).toISOString() }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'c3',
      anonId: 'anon_e5f6',
      anonName: 'Anjaani Awaaz',
      category: 'Faculty',
      text: '4th semester ka Physics practical result 2 mahine se pending hai. Board exam dates aa gayi hain lekin result nahi aaya. Students kaafi pareshaan hain.',
      upvotes: 89,
      downvotes: 3,
      status: 'pending',
      comments: [],
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: 'c4',
      anonId: 'anon_g7h8',
      anonName: 'Khamosh Sher',
      category: 'Infrastructure',
      text: 'Main building ki lift pichhle 6 din se kharab hai. 4th floor ke teachers aur differently-abled students ko seedhiyan chadhni padti hain.',
      upvotes: 112,
      downvotes: 0,
      status: 'resolved',
      comments: [
        { id: 'cm3', anonName: 'Anjaani #55', text: 'Sunne mein aaya hai repair ho gayi aaj!', createdAt: new Date(Date.now() - 172800000).toISOString() }
      ],
      createdAt: new Date(Date.now() - 432000000).toISOString(),
    },
  ];

  await complaintsCollection.insertMany(sampleComplaints as any);
  console.log('✅ Sample complaints initialized in MongoDB');
}

export const ANON_NAMES = [
  'Gumnaam Taara','Chhupa Rustam','Anjaani Awaaz','Raaz Wala',
  'Khamosh Sher','Chhaya Student','Bepehchaan Awaaz','Nazara Anjaana',
  'Chhupa Sitaara','Rahasya Dost','Anjaan Yodha','Gumnaam Dost'
];

export function getAnonName(index: number): string {
  return ANON_NAMES[index % ANON_NAMES.length];
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Abhi abhi';
  if (m < 60) return `${m} minute pehle`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ghante pehle`;
  const d = Math.floor(h / 24);
  return `${d} din pehle`;
}

// Legacy Map-like interface for backward compatibility
export class UsersMap extends Map<string, User> {
  async get(collegeId: string): Promise<User | undefined> {
    const user = await findUser(collegeId);
    return user || undefined;
  }

  async set(collegeId: string, value: User): Promise<this> {
    try {
      await createUser(value);
    } catch {
      // User already exists
    }
    return this;
  }

  async has(collegeId: string): Promise<boolean> {
    const user = await findUser(collegeId);
    return user !== null;
  }
}

export const users = new UsersMap();

// Legacy complaints array interface
export async function getComplaints(): Promise<Complaint[]> {
  return getComplaints_DB();
}

export const complaints = {
  async *[Symbol.iterator]() {
    const data = await getComplaints_DB();
    for (const item of data) {
      yield item;
    }
  }
};

// Vote tracking
export const voteTracker = new Map<string, number>();

