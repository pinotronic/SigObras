/**
 * StorageService - Servicio de almacenamiento local usando IndexedDB
 * Implementa patrón Singleton
 */

import { openDB } from 'idb';
import { APP_CONFIG } from '../../config/app.config.js';

class StorageService {
  static instance = null;

  constructor() {
    if (StorageService.instance) {
      return StorageService.instance;
    }

    this.db = null;
    this.isInitialized = false;

    StorageService.instance = this;
  }

  /**
   * Obtener instancia singleton
   */
  static getInstance() {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Inicializar la base de datos
   */
  async init() {
    if (this.isInitialized) {
      return this.db;
    }

    try {
      const { dbName, version, stores } = APP_CONFIG.storage;

      this.db = await openDB(dbName, version, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`[StorageService] Actualizando DB de v${oldVersion} a v${newVersion}`);

          // Crear object stores si no existen
          if (!db.objectStoreNames.contains(stores.works)) {
            db.createObjectStore(stores.works, { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains(stores.activities)) {
            const actStore = db.createObjectStore(stores.activities, { keyPath: 'id' });
            actStore.createIndex('workId', 'workId', { unique: false });
            actStore.createIndex('status', 'status', { unique: false });
          }

          if (!db.objectStoreNames.contains(stores.evidence)) {
            const evStore = db.createObjectStore(stores.evidence, { keyPath: 'id' });
            evStore.createIndex('activityId', 'activityId', { unique: false });
          }

          if (!db.objectStoreNames.contains(stores.syncOutbox)) {
            const syncStore = db.createObjectStore(stores.syncOutbox, {
              keyPath: 'id',
              autoIncrement: true
            });
            syncStore.createIndex('status', 'status', { unique: false });
            syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          if (!db.objectStoreNames.contains(stores.mapCache)) {
            db.createObjectStore(stores.mapCache, { keyPath: 'url' });
          }

          if (!db.objectStoreNames.contains(stores.user)) {
            db.createObjectStore(stores.user, { keyPath: 'key' });
          }
        }
      });

      this.isInitialized = true;
      console.log('[StorageService] Inicializado correctamente');

      return this.db;

    } catch (error) {
      console.error('[StorageService] Error al inicializar:', error);
      throw new Error(`Error al inicializar almacenamiento: ${error.message}`);
    }
  }

  /**
   * Guardar un item en un store
   */
  async set(storeName, value) {
    if (!this.isInitialized) {
      await this.init();
    }
    return await this.db.put(storeName, value);
  }

  /**
   * Obtener un item por clave
   */
  async get(storeName, key) {
    if (!this.isInitialized) {
      await this.init();
    }
    return await this.db.get(storeName, key);
  }

  /**
   * Obtener todos los items de un store
   */
  async getAll(storeName) {
    if (!this.isInitialized) {
      await this.init();
    }
    return await this.db.getAll(storeName);
  }

  /**
   * Eliminar un item
   */
  async delete(storeName, key) {
    if (!this.isInitialized) {
      await this.init();
    }
    return await this.db.delete(storeName, key);
  }

  /**
   * Limpiar un store completo
   */
  async clear(storeName) {
    if (!this.isInitialized) {
      await this.init();
    }
    return await this.db.clear(storeName);
  }

  /**
   * Buscar por índice
   */
  async getByIndex(storeName, indexName, value) {
    if (!this.isInitialized) {
      await this.init();
    }
    const index = this.db.transaction(storeName).store.index(indexName);
    return await index.getAll(value);
  }

  /**
   * Guardar múltiples items (transacción)
   */
  async setMany(storeName, items) {
    if (!this.isInitialized) {
      await this.init();
    }

    const tx = this.db.transaction(storeName, 'readwrite');
    const promises = items.map(item => tx.store.put(item));
    promises.push(tx.done);

    return await Promise.all(promises);
  }

  /**
   * Limpiar toda la base de datos
   */
  async clearAll() {
    if (!this.isInitialized) {
      await this.init();
    }

    const storeNames = Array.from(this.db.objectStoreNames);
    const promises = storeNames.map(name => this.clear(name));

    return await Promise.all(promises);
  }

  /**
   * Obtener estadísticas de almacenamiento
   */
  async getStats() {
    if (!this.isInitialized) {
      await this.init();
    }

    const stats = {};
    const storeNames = Array.from(this.db.objectStoreNames);

    for (const name of storeNames) {
      const count = await this.db.count(name);
      stats[name] = { count };
    }

    return stats;
  }
}

export { StorageService };
export default StorageService;
