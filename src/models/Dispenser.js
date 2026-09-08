const { getCollection, collections, generateId } = require('../config/db');

class Dispenser {
  constructor(data) {
    this.dispenserId = data.dispenserId;
    this.school = data.school;
    this.location = data.location;
    this.esp32Id = data.esp32Id;
    this.status = data.status || 'OFFLINE';
    this.padsAvailable = data.padsAvailable || 0;
    this.batteryLevel = data.batteryLevel || 0;
    this.signalStrength = data.signalStrength || 0;
    this.firmwareVersion = data.firmwareVersion || '1.0.0';
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  // Create new dispenser
  static async create(dispenserData) {
    if (!dispenserData.dispenserId) {
      dispenserData.dispenserId = generateId();
    }
    
    const dispenser = new Dispenser(dispenserData);
    const dispenserRef = getCollection(collections.DISPENSERS).doc(dispenser.dispenserId);
    await dispenserRef.set(JSON.parse(JSON.stringify(dispenser)));
    return dispenser;
  }

  // Get dispenser by ID
  static async findById(dispenserId) {
    const dispenserRef = getCollection(collections.DISPENSERS).doc(dispenserId);
    const doc = await dispenserRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    return new Dispenser(doc.data());
  }

  // Get dispenser by ESP32 ID
  static async findByEsp32Id(esp32Id) {
    const snapshot = await getCollection(collections.DISPENSERS)
      .where('esp32Id', '==', esp32Id)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    return new Dispenser(snapshot.docs[0].data());
  }

  // Update dispenser
  static async update(dispenserId, updateData) {
    updateData.updatedAt = new Date().toISOString();
    const dispenserRef = getCollection(collections.DISPENSERS).doc(dispenserId);
    await dispenserRef.update(updateData);
    return await Dispenser.findById(dispenserId);
  }

  // Delete dispenser
  static async delete(dispenserId) {
    const dispenserRef = getCollection(collections.DISPENSERS).doc(dispenserId);
    await dispenserRef.delete();
    return true;
  }

  // Get all dispensers
  static async findAll(filters = {}) {
    let query = getCollection(collections.DISPENSERS);
    
    if (filters.school) {
      query = query.where('school', '==', filters.school);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => new Dispenser(doc.data()));
  }

  // Get online dispensers
  static async findOnline() {
    const snapshot = await getCollection(collections.DISPENSERS)
      .where('status', '==', 'ONLINE')
      .get();
    
    return snapshot.docs.map(doc => new Dispenser(doc.data()));
  }

  // Update status
  static async updateStatus(dispenserId, status, additionalData = {}) {
    const updateData = {
      status,
      ...additionalData,
      updatedAt: new Date().toISOString()
    };
    
    return await Dispenser.update(dispenserId, updateData);
  }
}

module.exports = Dispenser;
