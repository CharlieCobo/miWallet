/**
 * Utilería para gestionar finanzas personales con IndexedDB
 * Permite almacenar y gestionar ahorros, ingresos, gastos y subcategorías
 */

// Definición de interfaces para los tipos de datos
interface Categoria {
    id?: number;
    nombre: string;
    tipo: 'ingreso' | 'gasto' | 'ahorro';
  }
  
  interface Subcategoria {
    id?: number;
    nombre: string;
    categoriaId: number;
  }
  
  interface Transaccion {
    id?: number;
    categoriaId: number;
    subcategoriaId: number;
    monto: number;
    descripcion?: string;
    fecha: Date;
  }
  
  interface ResumenFinanciero {
    totalIngresos: number;
    totalGastos: number;
    totalAhorros: number;
    balance: number;
  }
  
  interface FinanzasDBOptions {
    dbName?: string;
    dbVersion?: number;
  }
  
  class FinanzasDB {
    private dbName: string;
    private dbVersion: number;
    private db: IDBDatabase | null;
    private isInitialized: boolean;
  
    constructor(options?: FinanzasDBOptions) {
      this.dbName = options?.dbName || "finanzasPersonalesDB";
      this.dbVersion = options?.dbVersion || 1;
      this.db = null;
      this.isInitialized = false;
    }
  
    /**
     * Inicializa la base de datos
     * @returns {Promise<IDBDatabase>} Promesa que se resuelve cuando la BD está lista
     */
    async init(): Promise<IDBDatabase> {
      if (this.isInitialized && this.db) return Promise.resolve(this.db);
  
      return new Promise<IDBDatabase>((resolve, reject) => {
        const request: IDBOpenDBRequest = indexedDB.open(this.dbName, this.dbVersion);
  
        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
  
          // Crear object store para categorías principales (ingreso, gasto, ahorro)
          if (!db.objectStoreNames.contains("categorias")) {
            const categoriasStore = db.createObjectStore("categorias", { keyPath: "id", autoIncrement: true });
            categoriasStore.createIndex("nombre", "nombre", { unique: true });
            
            // Añadir categorías por defecto
            categoriasStore.add({ nombre: "Ingreso", tipo: "ingreso" } as Categoria);
            categoriasStore.add({ nombre: "Gasto", tipo: "gasto" } as Categoria);
            categoriasStore.add({ nombre: "Ahorro", tipo: "ahorro" } as Categoria);
          }
  
          // Crear object store para subcategorías
          if (!db.objectStoreNames.contains("subcategorias")) {
            const subcategoriasStore = db.createObjectStore("subcategorias", { keyPath: "id", autoIncrement: true });
            subcategoriasStore.createIndex("nombre", "nombre", { unique: false });
            subcategoriasStore.createIndex("categoriaId", "categoriaId", { unique: false });
            
            // Añadir algunas subcategorías por defecto
            subcategoriasStore.add({ nombre: "Salario", categoriaId: 1 } as Subcategoria);  // Ingreso
            subcategoriasStore.add({ nombre: "Alimentos", categoriaId: 2 } as Subcategoria); // Gasto
            subcategoriasStore.add({ nombre: "Fondo de emergencia", categoriaId: 3 } as Subcategoria); // Ahorro
          }
  
          // Crear object store para transacciones
          if (!db.objectStoreNames.contains("transacciones")) {
            const transaccionesStore = db.createObjectStore("transacciones", { keyPath: "id", autoIncrement: true });
            transaccionesStore.createIndex("fecha", "fecha", { unique: false });
            transaccionesStore.createIndex("categoriaId", "categoriaId", { unique: false });
            transaccionesStore.createIndex("subcategoriaId", "subcategoriaId", { unique: false });
          }
        };
  
        request.onsuccess = (event: Event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.isInitialized = true;
          resolve(this.db);
        };
  
        request.onerror = (event: Event) => {
          reject(`Error al abrir la base de datos: ${(event.target as IDBOpenDBRequest).error}`);
        };
      });
    }
  
    /**
     * Método privado para realizar una transacción
     * @param {string} storeName - Nombre del store
     * @param {IDBTransactionMode} mode - Modo de la transacción ('readonly' o 'readwrite')
     * @returns {IDBObjectStore} - Objeto store
     */
    private _getStore(storeName: string, mode: IDBTransactionMode = "readonly"): IDBObjectStore {
      if (!this.isInitialized || !this.db) {
        throw new Error("La base de datos no está inicializada. Llama a init() primero.");
      }
      const transaction = this.db.transaction([storeName], mode);
      return transaction.objectStore(storeName);
    }
  
    /**
     * Agrega una nueva categoría
     * @param {Categoria} categoria - Objeto con datos de la categoría
     * @returns {Promise<number>} - Promesa que se resuelve con el ID de la categoría añadida
     */
    async agregarCategoria(categoria: Categoria): Promise<number> {
      await this.init();
      return new Promise<number>((resolve, reject) => {
        const store = this._getStore("categorias", "readwrite");
        const request = store.add(categoria);
        
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as number);
        };
        
        request.onerror = (event: Event) => {
          reject(`Error al agregar categoría: ${(event.target as IDBRequest).error}`);
        };
      });
    }
  
    /**
     * Agrega una nueva subcategoría
     * @param {Subcategoria} subcategoria - Objeto con datos de la subcategoría
     * @returns {Promise<number>} - Promesa que se resuelve con el ID de la subcategoría añadida
     */
    async agregarSubcategoria(subcategoria: Subcategoria): Promise<number> {
      await this.init();
      return new Promise<number>((resolve, reject) => {
        const store = this._getStore("subcategorias", "readwrite");
        const request = store.add(subcategoria);
        
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as number);
        };
        
        request.onerror = (event: Event) => {
          reject(`Error al agregar subcategoría: ${(event.target as IDBRequest).error}`);
        };
      });
    }
  
    /**
     * Registra una nueva transacción (ingreso, gasto o ahorro)
     * @param {Transaccion} transaccion - Objeto con datos de la transacción
     * @returns {Promise<number>} - Promesa que se resuelve con el ID de la transacción añadida
     */
    async registrarTransaccion(transaccion: Transaccion): Promise<number> {
      await this.init();
      // Asegurarse de que la fecha sea un objeto Date
      if (!(transaccion.fecha instanceof Date)) {
        transaccion.fecha = new Date(transaccion.fecha || Date.now());
      }
      
      return new Promise<number>((resolve, reject) => {
        const store = this._getStore("transacciones", "readwrite");
        const request = store.add(transaccion);
        
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as number);
        };
        
        request.onerror = (event: Event) => {
          reject(`Error al registrar transacción: ${(event.target as IDBRequest).error}`);
        };
      });
    }
  
    /**
     * Obtiene todas las transacciones
     * @returns {Promise<Transaccion[]>} - Promesa que se resuelve con un array de transacciones
     */
    async obtenerTransacciones(): Promise<Transaccion[]> {
      await this.init();
      return new Promise<Transaccion[]>((resolve, reject) => {
        const store = this._getStore("transacciones");
        const request = store.getAll();
        
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as Transaccion[]);
        };
        
        request.onerror = (event: Event) => {
          reject(`Error al obtener transacciones: ${(event.target as IDBRequest).error}`);
        };
      });
    }
  
    /**
     * Obtiene transacciones por categoría
     * @param {number} categoriaId - ID de la categoría
     * @returns {Promise<Transaccion[]>} - Promesa que se resuelve con un array de transacciones
     */
    async obtenerTransaccionesPorCategoria(categoriaId: number): Promise<Transaccion[]> {
      await this.init();
      return new Promise<Transaccion[]>((resolve, reject) => {
        const store = this._getStore("transacciones");
        const index = store.index("categoriaId");
        const request = index.getAll(categoriaId);
        
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as Transaccion[]);
        };
        
        request.onerror = (event: Event) => {
          reject(`Error al obtener transacciones por categoría: ${(event.target as IDBRequest).error}`);
        };
      });
    }
  
    /**
     * Obtiene transacciones por subcategoría
     * @param {number} subcategoriaId - ID de la subcategoría
     * @returns {Promise<Transaccion[]>} - Promesa que se resuelve con un array de transacciones
     */
    async obtenerTransaccionesPorSubcategoria(subcategoriaId: number): Promise<Transaccion[]> {
      await this.init();
      return new Promise<Transaccion[]>((resolve, reject) => {
        const store = this._getStore("transacciones");
        const index = store.index("subcategoriaId");
        const request = index.getAll(subcategoriaId);
        
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as Transaccion[]);
        };
        
        request.onerror = (event: Event) => {
          reject(`Error al obtener transacciones por subcategoría: ${(event.target as IDBRequest).error}`);
        };
      });
    }
  
    /**
     * Obtiene transacciones por rango de fechas
     * @param {Date} fechaInicio - Fecha inicial
     * @param {Date} fechaFin - Fecha final
     * @returns {Promise<Transaccion[]>} - Promesa que se resuelve con un array de transacciones
     */
    async obtenerTransaccionesPorFecha(fechaInicio: Date, fechaFin: Date): Promise<Transaccion[]> {
      await this.init();
      return new Promise<Transaccion[]>((resolve, reject) => {
        const store = this._getStore("transacciones");
        const index = store.index("fecha");
        const range = IDBKeyRange.bound(fechaInicio, fechaFin);
        const request = index.getAll(range);
        
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as Transaccion[]);
        };
        
        request.onerror = (event: Event) => {
          reject(`Error al obtener transacciones por fecha: ${(event.target as IDBRequest).error}`);
        };
      });
    }
  
    /**
     * Obtiene todas las categorías
     * @returns {Promise<Categoria[]>} - Promesa que se resuelve con un array de categorías
     */
    async obtenerCategorias(): Promise<Categoria[]> {
      await this.init();
      return new Promise<Categoria[]>((resolve, reject) => {
        const store = this._getStore("categorias");
        const request = store.getAll();
        
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as Categoria[]);
        };
        
        request.onerror = (event: Event) => {
          reject(`Error al obtener categorías: ${(event.target as IDBRequest).error}`);
        };
      });
    }
  
    /**
     * Obtiene todas las subcategorías
     * @returns {Promise<Subcategoria[]>} - Promesa que se resuelve con un array de subcategorías
     */
    async obtenerSubcategorias(): Promise<Subcategoria[]> {
      await this.init();
      return new Promise<Subcategoria[]>((resolve, reject) => {
        const store = this._getStore("subcategorias");
        const request = store.getAll();
        
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as Subcategoria[]);
        };
        
        request.onerror = (event: Event) => {
          reject(`Error al obtener subcategorías: ${(event.target as IDBRequest).error}`);
        };
      });
    }
  
    /**
     * Obtiene subcategorías por categoría
     * @param {number} categoriaId - ID de la categoría
     * @returns {Promise<Subcategoria[]>} - Promesa que se resuelve con un array de subcategorías
     */
    async obtenerSubcategoriasPorCategoria(categoriaId: number): Promise<Subcategoria[]> {
      await this.init();
      return new Promise<Subcategoria[]>((resolve, reject) => {
        const store = this._getStore("subcategorias");
        const index = store.index("categoriaId");
        const request = index.getAll(categoriaId);
        
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as Subcategoria[]);
        };
        
        request.onerror = (event: Event) => {
          reject(`Error al obtener subcategorías por categoría: ${(event.target as IDBRequest).error}`);
        };
      });
    }
  
    /**
     * Actualiza una transacción existente
     * @param {Transaccion} transaccion - Objeto con datos de la transacción a actualizar
     * @returns {Promise<number>} - Promesa que se resuelve con el ID de la transacción actualizada
     */
    async actualizarTransaccion(transaccion: Transaccion): Promise<number> {
      await this.init();
      return new Promise<number>((resolve, reject) => {
        const store = this._getStore("transacciones", "readwrite");
        const request = store.put(transaccion);
        
        request.onsuccess = (event: Event) => {
          resolve((event.target as IDBRequest).result as number);
        };
        
        request.onerror = (event: Event) => {
          reject(`Error al actualizar transacción: ${(event.target as IDBRequest).error}`);
        };
      });
    }
  
    /**
     * Elimina una transacción
     * @param {number} id - ID de la transacción a eliminar
     * @returns {Promise<boolean>} - Promesa que se resuelve cuando la transacción es eliminada
     */
    async eliminarTransaccion(id: number): Promise<boolean> {
      await this.init();
      return new Promise<boolean>((resolve, reject) => {
        const store = this._getStore("transacciones", "readwrite");
        const request = store.delete(id);
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = (event: Event) => {
          reject(`Error al eliminar transacción: ${(event.target as IDBRequest).error}`);
        };
      });
    }
  
    /**
     * Obtiene el resumen de ingresos, gastos y ahorros
     * @returns {Promise<ResumenFinanciero>} - Promesa que se resuelve con un objeto de resumen
     */
    async obtenerResumenFinanciero(): Promise<ResumenFinanciero> {
      await this.init();
      const transacciones = await this.obtenerTransacciones();
      const categorias = await this.obtenerCategorias();
      
      // Crear un mapa para búsqueda rápida
      const categoriasMap: Record<number, Categoria> = categorias.reduce((map, cat) => {
        if (cat.id) {
          map[cat.id] = cat;
        }
        return map;
      }, {} as Record<number, Categoria>);
      
      const resumen: ResumenFinanciero = {
        totalIngresos: 0,
        totalGastos: 0,
        totalAhorros: 0,
        balance: 0
      };
      
      transacciones.forEach(transaccion => {
        const categoria = categoriasMap[transaccion.categoriaId];
        if (!categoria) return;
        
        switch (categoria.tipo) {
          case "ingreso":
            resumen.totalIngresos += transaccion.monto;
            break;
          case "gasto":
            resumen.totalGastos += transaccion.monto;
            break;
          case "ahorro":
            resumen.totalAhorros += transaccion.monto;
            break;
        }
      });
      
      resumen.balance = resumen.totalIngresos - resumen.totalGastos - resumen.totalAhorros;
      
      return resumen;
    }
  
    /**
     * Limpia todos los datos (¡Usar con precaución!)
     * @returns {Promise<boolean[]>} - Promesa que se resuelve cuando los datos son eliminados
     */
    async limpiarDatos(): Promise<boolean[]> {
      await this.init();
      const storeNames = ["categorias", "subcategorias", "transacciones"];
      
      const promises = storeNames.map(storeName => {
        return new Promise<boolean>((resolve, reject) => {
          const store = this._getStore(storeName, "readwrite");
          const request = store.clear();
          
          request.onsuccess = () => resolve(true);
          request.onerror = (event: Event) => {
            reject(`Error al limpiar ${storeName}: ${(event.target as IDBRequest).error}`);
          };
        });
      });
      
      return Promise.all(promises);
    }
  }
  
  // Interfaces para el hook
  interface FinanzasHookResult {
    db: FinanzasDB;
    isLoading: boolean;
    error: Error | null;
    registrarIngreso: (data: Omit<Transaccion, 'categoriaId' | 'fecha'> & { fecha?: Date }) => Promise<number | undefined>;
    registrarGasto: (data: Omit<Transaccion, 'categoriaId' | 'fecha'> & { fecha?: Date }) => Promise<number | undefined>;
    registrarAhorro: (data: Omit<Transaccion, 'categoriaId' | 'fecha'> & { fecha?: Date }) => Promise<number | undefined>;
    obtenerResumen: () => Promise<ResumenFinanciero | null>;
  }
  
  // Exportamos la clase para poder utilizarla
  export default FinanzasDB;
  
  // Exportamos los tipos
  export type { Categoria, Subcategoria, Transaccion, ResumenFinanciero, FinanzasDBOptions, FinanzasHookResult };
  
  // Ejemplo de uso en un hook de React
  export const useFinanzas = (): FinanzasHookResult => {
    const [db] = React.useState<FinanzasDB>(() => new FinanzasDB());
    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<Error | null>(null);
    
    React.useEffect(() => {
      const inicializarDB = async () => {
        try {
          await db.init();
          setIsLoading(false);
        } catch (err) {
          console.error("Error al inicializar la base de datos:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      };
      
      inicializarDB();
    }, [db]);
    
    return {
      db,
      isLoading,
      error,
      // Métodos comunes
      registrarIngreso: async (data: Omit<Transaccion, 'categoriaId' | 'fecha'> & { fecha?: Date }): Promise<number | undefined> => {
        if (isLoading) return undefined;
        const transaccion: Transaccion = {
          ...data,
          categoriaId: 1, // ID de la categoría de ingresos
          fecha: new Date(data.fecha || Date.now())
        };
        return await db.registrarTransaccion(transaccion);
      },
      registrarGasto: async (data: Omit<Transaccion, 'categoriaId' | 'fecha'> & { fecha?: Date }): Promise<number | undefined> => {
        if (isLoading) return undefined;
        const transaccion: Transaccion = {
          ...data,
          categoriaId: 2, // ID de la categoría de gastos
          fecha: new Date(data.fecha || Date.now())
        };
        return await db.registrarTransaccion(transaccion);
      },
      registrarAhorro: async (data: Omit<Transaccion, 'categoriaId' | 'fecha'> & { fecha?: Date }): Promise<number | undefined> => {
        if (isLoading) return undefined;
        const transaccion: Transaccion = {
          ...data,
          categoriaId: 3, // ID de la categoría de ahorros
          fecha: new Date(data.fecha || Date.now())
        };
        return await db.registrarTransaccion(transaccion);
      },
      obtenerResumen: async (): Promise<ResumenFinanciero | null> => {
        if (isLoading) return null;
        return await db.obtenerResumenFinanciero();
      }
    };
  };