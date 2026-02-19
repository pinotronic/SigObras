/**
 * AuthService - Servicio de autenticación y gestión de sesión
 * Implementa patrón Singleton
 */

import { APP_CONFIG } from '../../config/app.config.js';
import { StorageService } from '../storage/StorageService.js';

class AuthService {
  static instance = null;

  constructor() {
    if (AuthService.instance) {
      return AuthService.instance;
    }

    this.storage = null;
    this.currentUser = null;
    this.token = null;
    this.tokenExpiry = null;

    AuthService.instance = this;
  }

  /**
   * Obtener instancia singleton
   */
  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Inicializar servicio
   */
  async init() {
    this.storage = StorageService.getInstance();

    // Intentar cargar sesión guardada
    await this.loadSession();

    console.log('[AuthService] Inicializado');
  }

  /**
   * Intentar login
   */
  async login(username, password, rememberMe = false) {
    try {
      console.log('[AuthService] Intentando login para:', username);

      // En producción, llamar al API real
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al iniciar sesión');
      }

      const data = await response.json();

      const externalGid =
        data.user?.pGid ||
        data.external?.pGid ||
        data.external?.gid ||
        data.external?.pgid ||
        null;

      const userData = {
        ...data.user,
        ...(externalGid ? { pGid: externalGid } : {})
      };

      // Guardar sesión
      await this.saveSession(data.token, userData, rememberMe);

      return {
        success: true,
        user: userData,
        token: data.token
      };

    } catch (error) {
      console.error('[AuthService] Error en login:', error);
      return {
        success: false,
        message: error.message || 'Error al iniciar sesión'
      };
    }
  }

  /**
   * Login mock para desarrollo
   */
  async mockLogin(username, password, rememberMe) {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    // Credenciales de prueba
    const mockUsers = {
      'admin': { password: 'admin', role: 'admin' },
      'supervisor': { password: 'supervisor', role: 'supervisor' },
      'coordinador': { password: 'coordinador', role: 'coordinador' }
    };

    const mockUser = mockUsers[username.toLowerCase()];

    if (!mockUser || mockUser.password !== password) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    // Generar token mock
    const token = `mock_token_${username}_${Date.now()}`;

    // Crear objeto de usuario
    const user = {
      id: `user_${username}`,
      username: username,
      nombre: username.charAt(0).toUpperCase() + username.slice(1),
      rol: mockUser.role,
      unidad: 'Operaciones',
      email: `${username}@sapal.gob.mx`
    };

    // Guardar sesión
    await this.saveSession(token, user, rememberMe);

    console.log('[AuthService] Mock login exitoso:', user);

    return {
      success: true,
      user,
      token
    };
  }

  /**
   * Guardar sesión
   */
  async saveSession(token, user, persistent = false) {
    this.token = token;
    this.currentUser = user;
    this.tokenExpiry = Date.now() + APP_CONFIG.auth.tokenExpiry;

    // Guardar en storage si es persistente
    if (persistent) {
      await this.storage.set(APP_CONFIG.storage.stores.user, {
        key: 'auth_token',
        value: token,
        expiry: this.tokenExpiry
      });

      await this.storage.set(APP_CONFIG.storage.stores.user, {
        key: 'user_data',
        value: user
      });
    } else {
      // Guardar en sessionStorage
      sessionStorage.setItem(APP_CONFIG.auth.tokenKey, token);
      sessionStorage.setItem(APP_CONFIG.auth.userKey, JSON.stringify(user));
    }

    console.log('[AuthService] Sesión guardada');
  }

  /**
   * Cargar sesión guardada
   */
  async loadSession() {
    try {
      // Intentar cargar desde IndexedDB (persistente)
      const tokenData = await this.storage.get(
        APP_CONFIG.storage.stores.user,
        'auth_token'
      );

      if (tokenData && tokenData.expiry > Date.now()) {
        this.token = tokenData.value;
        this.tokenExpiry = tokenData.expiry;

        const userData = await this.storage.get(
          APP_CONFIG.storage.stores.user,
          'user_data'
        );

        if (userData) {
          this.currentUser = userData.value;
          console.log('[AuthService] Sesión cargada desde storage');
          return true;
        }
      }

      // Intentar cargar desde sessionStorage
      const sessionToken = sessionStorage.getItem(APP_CONFIG.auth.tokenKey);
      const sessionUser = sessionStorage.getItem(APP_CONFIG.auth.userKey);

      if (sessionToken && sessionUser) {
        this.token = sessionToken;
        this.currentUser = JSON.parse(sessionUser);
        this.tokenExpiry = Date.now() + APP_CONFIG.auth.tokenExpiry;
        console.log('[AuthService] Sesión cargada desde sessionStorage');
        return true;
      }

      return false;

    } catch (error) {
      console.error('[AuthService] Error al cargar sesión:', error);
      return false;
    }
  }

  /**
   * Verificar si hay sesión activa
   */
  async isAuthenticated() {
    if (!this.token || !this.currentUser) {
      return false;
    }

    // Verificar expiración
    if (this.tokenExpiry && this.tokenExpiry < Date.now()) {
      console.log('[AuthService] Token expirado');
      await this.logout();
      return false;
    }

    // TODO: En producción, validar token con el servidor

    return true;
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Obtener token actual
   */
  getToken() {
    return this.token;
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    console.log('[AuthService] Cerrando sesión');

    // Limpiar datos en memoria
    this.token = null;
    this.currentUser = null;
    this.tokenExpiry = null;

    // Limpiar storage persistente
    await this.storage.delete(APP_CONFIG.storage.stores.user, 'auth_token');
    await this.storage.delete(APP_CONFIG.storage.stores.user, 'user_data');

    // Limpiar sessionStorage
    sessionStorage.removeItem(APP_CONFIG.auth.tokenKey);
    sessionStorage.removeItem(APP_CONFIG.auth.userKey);

    console.log('[AuthService] Sesión cerrada');
  }

  /**
   * Refrescar token (para implementar en producción)
   */
  async refreshToken() {
    // TODO: Implementar refresh de token con el servidor
    console.log('[AuthService] Refresh token no implementado');
  }

  /**
   * Iniciar login SSO en plataforma SIGSAPAL
   */
  startSsoLogin() {
    const baseUrl = APP_CONFIG.auth.ssoLoginUrl;
    const appReturnUrl = APP_CONFIG.auth.ssoSolicitante || window.location.origin;

    if (baseUrl.includes('#')) {
      const [urlBase, hashPart] = baseUrl.split('#');
      const [hashRouteRaw, hashQueryRaw = ''] = (hashPart || '/Login').split('?');
      const hashRoute = hashRouteRaw || '/Login';
      const params = new URLSearchParams(hashQueryRaw);

      params.set('clSolicitante', appReturnUrl);
      params.set('fgHash', 'true');

      window.location.href = `${urlBase}#${hashRoute}?${params.toString()}`;
      return;
    }

    const url = new URL(baseUrl);
    url.searchParams.set('clSolicitante', appReturnUrl);
    url.searchParams.set('fgHash', 'true');
    window.location.href = url.toString();
  }

  /**
   * Intentar completar sesión SSO desde query/hash actual
   */
  async completeSsoFromUrl() {
    const params = this.extractSsoParams();
    const token =
      params.clToken ||
      params.token ||
      params.access_token ||
      params.accessToken ||
      params.hash ||
      null;

    if (!token) {
      return { success: false, message: 'No se encontró token SSO en la URL' };
    }

    const username = params.clOperador || params.usuario || params.user || 'sso_user';

    const user = {
      id: `sso_${username}`,
      username,
      nombre: params.nombre || username,
      rol: params.rol || 'operador',
      unidad: params.unidad || 'Operaciones',
      email: params.email || `${username}@sapal.gob.mx`,
      source: 'sso',
      pGid: params.pGid || params.gid || params.clGid || params.idGrupo || null
    };

    await this.saveSession(token, user, true);
    this.clearSsoParamsFromUrl();

    console.log('[AuthService] Sesión SSO detectada y guardada');

    return {
      success: true,
      token,
      user
    };
  }

  /**
   * Extraer parámetros query/hash de URL actual
   */
  extractSsoParams() {
    const params = {};
    const pushParams = (queryString) => {
      if (!queryString) return;

      const clean = queryString.startsWith('?') ? queryString.slice(1) : queryString;
      const searchParams = new URLSearchParams(clean);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    };

    pushParams(window.location.search);

    const hash = window.location.hash || '';
    const hashQueryIndex = hash.indexOf('?');
    if (hashQueryIndex >= 0) {
      pushParams(hash.slice(hashQueryIndex + 1));
    } else if (hash.startsWith('#') && hash.includes('=')) {
      pushParams(hash.slice(1));
    }

    return params;
  }

  /**
   * Limpiar parámetros SSO para evitar reprocesamiento
   */
  clearSsoParamsFromUrl() {
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  /**
   * Obtener headers para requests autenticados
   */
  getAuthHeaders() {
    if (!this.token) {
      return {};
    }

    return {
      'Authorization': `Bearer ${this.token}`
    };
  }
}

export { AuthService };
export default AuthService;
