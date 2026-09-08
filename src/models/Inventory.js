const { getCollection, collections, generateId } = require('../config/db');

class Inventory {
  constructor(data) {
    this.inventoryId = data.inventoryId;
    this.dispenserId = data.dispenserId;
    this.totalPads = data.totalPads || 0;
    this.remainingPads = data.remainingPads || 0;
    this.threshold = data.threshold || parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;
    this.lastRefilled = data.lastRefilled;
    this.refillBy = data.refillBy;
    this.status = data.status || 'NORMAL';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Create new inventory record
  static async create(inventoryData) {
    if (!inventoryData.inventoryId) {
      inventoryData.inventoryId = generateId();
    }
    
    const inventory = new Inventory(inventoryData);
    inventory.status = inventory.getStatus();
    
    const inventoryRef = getCollection(collections.INVENTORY).doc(inventory.inventoryId);
    await inventoryRef.set(JSON.parse(JSON.stringify(inventory)));
    return inventory;
  }

  // Get inventory by ID
  static async findById(inventoryId) {
    const inventoryRef = getCollection(collections.INVENTORY).doc(inventoryId);
    const doc = await inventoryRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    return new Inventory(doc.data());
  }

  // Get inventory by dispenser ID
  static async findByDispenserId(dispenserId) {
    const snapshot = await getCollection(collections.INVENTORY)
      .where('dispenserId', '==', dispenserId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    return new Inventory(snapshot.docs[0].data());
  }

  // Update inventory
  static async update(inventoryId, updateData) {
    updateData.updatedAt = new Date().toISOString();
    
    const inventoryRef = getCollection(collections.INVENTORY).doc(inventoryId);
    await inventoryRef.update(updateData);
    
    const updated = await Inventory.findById(inventoryId);
    updated.status = updated.getStatus();
    await inventoryRef.update({ status: updated.status });
    
    return updated;
  }

  // Refill inventory
  static async refill(dispenserId, padsAdded, refillBy) {
    const inventory = await Inventory.findByDispenserId(dispenserId);
    
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    
    const updateData = {
      totalPads: inventory.totalPads + padsAdded,
      remainingPads: inventory.remainingPads + padsAdded,
      lastRefilled: new Date().toISOString(),
      refillBy,
      status: 'NORMAL'
    };
    
    return await Inventory.update(inventory.inventoryId, updateData);
  }

  // Dispense pads (reduce inventory)
  static async dispense(dispenserId, quantity = 1) {
    const inventory = await Inventory.findByDispenserId(dispenserId);
    
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    
    if (inventory.remainingPads < quantity) {
      throw new Error('Insufficient pads in inventory');
    }
    
    const updateData = {
      remainingPads: inventory.remainingPads - quantity
    };
    
    return await Inventory.update(inventory.inventoryId, updateData);
  }

  // Get all inventory records
  static async findAll(filters = {}) {
    let query = getCollection(collections.INVENTORY);
    
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    
    const snapshot = await query.orderBy('updatedAt', 'desc').get();
    return snapshot.docs.map(doc => new Inventory(doc.data()));
  }

  // Get low stock inventory
  static async findLowStock() {
    const snapshot = await getCollection(collections.INVENTORY).get();
    const allInventory = snapshot.docs.map(doc => new Inventory(doc.data()));
    
    return allInventory.filter(inv => inv.remainingPads <= inv.threshold);
  }

  // Determine inventory status
  getStatus() {
    if (this.remainingPads === 0) {
      return 'EMPTY';
    } else if (this.remainingPads <= this.threshold) {
      return 'LOW';
    } else {
      return 'NORMAL';
    }
  }
}

module.exports = Inventory;
