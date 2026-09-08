const { getCollection, collections } = require('../config/db');

class User {
  constructor(data) {
    this.uid = data.uid;
    this.fullName = data.fullName;
    this.phone = data.phone;
    this.email = data.email;
    this.role = data.role || 'student';
    this.school = data.school;
    this.department = data.department;
    this.registrationNumber = data.registrationNumber;
    this.gender = data.gender;
    this.isVerified = data.isVerified || false;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  // Create new user
  static async create(userData) {
    const user = new User(userData);
    const userRef = getCollection(collections.USERS).doc(user.uid);
    await userRef.set(JSON.parse(JSON.stringify(user)));
    return user;
  }

  // Get user by ID
  static async findById(uid) {
    const userRef = getCollection(collections.USERS).doc(uid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    return new User(doc.data());
  }

  // Get user by email
  static async findByEmail(email) {
    const snapshot = await getCollection(collections.USERS)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    return new User(snapshot.docs[0].data());
  }

  // Get user by phone
  static async findByPhone(phone) {
    const snapshot = await getCollection(collections.USERS)
      .where('phone', '==', phone)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    return new User(snapshot.docs[0].data());
  }

  // Update user
  static async update(uid, updateData) {
    const userRef = getCollection(collections.USERS).doc(uid);
    await userRef.update(updateData);
    return await User.findById(uid);
  }

  // Delete user
  static async delete(uid) {
    const userRef = getCollection(collections.USERS).doc(uid);
    await userRef.delete();
    return true;
  }

  // Get all users with pagination
  static async findAll(limit = 20, lastDoc = null, filters = {}) {
    let query = getCollection(collections.USERS).orderBy('createdAt', 'desc');
    
    // Apply filters
    if (filters.role) {
      query = query.where('role', '==', filters.role);
    }
    if (filters.school) {
      query = query.where('school', '==', filters.school);
    }
    
    // Pagination
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    
    query = query.limit(limit);
    
    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => new User(doc.data()));
    
    return {
      users,
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  }

  // Verify user
  static async verify(uid) {
    return await User.update(uid, { isVerified: true });
  }
}

module.exports = User;
