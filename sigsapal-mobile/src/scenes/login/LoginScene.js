/**
 * LoginScene - Pantalla de autenticación
 * Permite al usuario iniciar sesión con usuario y contraseña
 */

import Phaser from 'phaser';
import { APP_CONFIG } from '../../config/app.config.js';
import { AuthService } from '../../modules/auth/AuthService.js';

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
  }

  create() {
    console.log('[LoginScene] Iniciada');

    // Obtener servicio de autenticación
    this.auth = this.registry.get('auth');

    const { width, height } = this.scale;

    // Fondo con degradado
    this.add.rectangle(width / 2, height / 2, width, height, 0xf5f5f5);

    // Header con logo
    this.createHeader();

    // Formulario de login
    this.createLoginForm();

    // Footer
    this.createFooter();

    // Revisar si regresó de SSO con token/hash
    this.trySsoAutoLogin();
  }

  /**
   * Crear header con logo
   */
  createHeader() {
    const { width } = this.scale;

    // Logo
    this.add.text(width / 2, 120, '💧', {
      fontSize: '100px'
    }).setOrigin(0.5);

    // Título
    this.add.text(width / 2, 240, 'SAPAL Obras', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#0066cc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtítulo
    this.add.text(width / 2, 280, 'Iniciar Sesión', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#666666'
    }).setOrigin(0.5);
  }

  /**
   * Crear formulario de login
   */
  createLoginForm() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const startY = 350;

    // Contenedor del formulario usando DOM
    const formContainer = this.add.dom(centerX, startY + 150).createFromHTML(`
      <div style="width: ${Math.min(400, width - 80)}px; font-family: Arial, sans-serif;">
        <!-- Usuario -->
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-size: 14px; color: #333; font-weight: 600;">
            Usuario
          </label>
          <input
            type="text"
            id="username"
            name="username"
            class="phaser-input"
            style="width: 100%; padding: 14px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px; outline: none;"
            placeholder="Ingresa tu usuario"
            autocomplete="username"
          />
        </div>

        <!-- Contraseña -->
        <div style="margin-bottom: 25px;">
          <label style="display: block; margin-bottom: 8px; font-size: 14px; color: #333; font-weight: 600;">
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            name="password"
            class="phaser-input"
            style="width: 100%; padding: 14px; font-size: 16px; border: 2px solid #ddd; border-radius: 8px; outline: none;"
            placeholder="Ingresa tu contraseña"
            autocomplete="current-password"
          />

          <label style="display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 14px; color: #666; cursor: pointer; user-select: none;">
            <input type="checkbox" id="toggle-password" style="margin: 0;">
            Mostrar contraseña
          </label>
        </div>

        <!-- Botón de login -->
        <button
          id="login-btn"
          class="phaser-button"
          style="width: 100%; padding: 16px; font-size: 18px; font-weight: 600; border: none; border-radius: 8px; background: #0066cc; color: white; cursor: pointer; transition: background 0.2s;"
        >
          Iniciar Sesión
        </button>

        <button
          id="sso-login-btn"
          class="phaser-button"
          style="width: 100%; margin-top: 10px; padding: 14px; font-size: 16px; font-weight: 600; border: none; border-radius: 8px; background: #004999; color: white; cursor: pointer; transition: background 0.2s;"
        >
          Entrar con SIGSAPAL
        </button>

        <!-- Mensaje de error -->
        <div
          id="error-message"
          style="margin-top: 15px; padding: 12px; border-radius: 6px; background: #ffebee; color: #c62828; font-size: 14px; text-align: center; display: none;"
        >
        </div>

        <!-- Recordar contraseña (opcional para MVP) -->
        <div style="margin-top: 20px; text-align: center;">
          <label style="font-size: 14px; color: #666; cursor: pointer;">
            <input type="checkbox" id="remember-me" style="margin-right: 5px;">
            Recordar mi sesión
          </label>
        </div>
      </div>
    `);

    // Agregar eventos
    const loginBtn = formContainer.getChildByID('login-btn');
    const ssoLoginBtn = formContainer.getChildByID('sso-login-btn');
    const usernameInput = formContainer.getChildByID('username');
    const passwordInput = formContainer.getChildByID('password');
    const togglePassword = formContainer.getChildByID('toggle-password');

    // Click en botón
    loginBtn.addEventListener('click', () => this.handleLogin(formContainer));
    ssoLoginBtn.addEventListener('click', () => this.handleSsoLogin(formContainer));

    // Enter en los inputs
    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleLogin(formContainer);
    });

    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleLogin(formContainer);
    });

    // Mostrar / ocultar contraseña
    if (togglePassword) {
      togglePassword.addEventListener('change', () => {
        passwordInput.type = togglePassword.checked ? 'text' : 'password';
        passwordInput.focus();
        // Mantener el cursor al final (útil en algunos navegadores móviles)
        try {
          const len = passwordInput.value.length;
          passwordInput.setSelectionRange(len, len);
        } catch {
          // Ignorar si el navegador no permite setSelectionRange aquí
        }
      });
    }

    // Focus en username al inicio
    setTimeout(() => usernameInput.focus(), 100);

    // Estilos de focus
    [usernameInput, passwordInput].forEach(input => {
      input.addEventListener('focus', () => {
        input.style.borderColor = '#0066cc';
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = '#ddd';
      });
    });
  }

  /**
   * Intentar auto-login desde retorno SSO
   */
  async trySsoAutoLogin() {
    try {
      const result = await this.auth.completeSsoFromUrl();

      if (result.success) {
        console.log('[LoginScene] Sesión SSO detectada:', result.user);
        this.scene.start('HomeScene');
      }
    } catch (error) {
      console.warn('[LoginScene] No se pudo completar SSO automáticamente:', error);
    }
  }

  /**
   * Redirigir al portal de login SIGSAPAL
   */
  handleSsoLogin(formContainer) {
    const errorMessage = formContainer.getChildByID('error-message');
    const ssoLoginBtn = formContainer.getChildByID('sso-login-btn');

    ssoLoginBtn.disabled = true;
    ssoLoginBtn.textContent = 'Redirigiendo...';
    errorMessage.style.display = 'none';

    try {
      this.auth.startSsoLogin();
    } catch (error) {
      ssoLoginBtn.disabled = false;
      ssoLoginBtn.textContent = 'Entrar con SIGSAPAL';
      this.showError(errorMessage, error.message || 'No se pudo iniciar SSO');
    }
  }

  /**
   * Manejar intento de login
   */
  async handleLogin(formContainer) {
    const username = formContainer.getChildByID('username').value.trim();
    const password = formContainer.getChildByID('password').value;
    const rememberMe = formContainer.getChildByID('remember-me').checked;
    const errorMessage = formContainer.getChildByID('error-message');
    const loginBtn = formContainer.getChildByID('login-btn');

    // Validar campos
    if (!username || !password) {
      this.showError(errorMessage, 'Por favor completa todos los campos');
      return;
    }

    // Deshabilitar botón y mostrar loading
    loginBtn.disabled = true;
    loginBtn.textContent = 'Iniciando sesión...';
    errorMessage.style.display = 'none';

    try {
      // Intentar autenticación
      const result = await this.auth.login(username, password, rememberMe);

      if (result.success) {
        console.log('[LoginScene] Login exitoso:', result.user);

        // Feedback visual
        loginBtn.textContent = '✓ Sesión iniciada';
        loginBtn.style.background = '#4caf50';

        // Navegar a Home después de un breve delay
        setTimeout(() => {
          this.scene.start('HomeScene');
        }, 500);

      } else {
        throw new Error(result.message || 'Error al iniciar sesión');
      }

    } catch (error) {
      console.error('[LoginScene] Error en login:', error);
      this.showError(errorMessage, error.message);

      // Restaurar botón
      loginBtn.disabled = false;
      loginBtn.textContent = 'Iniciar Sesión';
      loginBtn.style.background = '#0066cc';
    }
  }

  /**
   * Mostrar mensaje de error
   */
  showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  /**
   * Crear footer con información
   */
  createFooter() {
    const { width, height } = this.scale;

    // Texto de ayuda
    this.add.text(width / 2, height - 80, 'Soporte: soporte@sapal.gob.mx', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#999999'
    }).setOrigin(0.5);

    // Versión
    this.add.text(width / 2, height - 50, `Versión ${APP_CONFIG.app.version}`, {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#bbbbbb'
    }).setOrigin(0.5);

    // Modo de desarrollo indicator
    if (APP_CONFIG.debug.enabled) {
      this.add.text(width / 2, height - 20, '[MODO DESARROLLO - Login local y SIGSAPAL habilitados]', {
        fontSize: '10px',
        fontFamily: 'Arial, sans-serif',
        color: '#ff9800',
        backgroundColor: '#fff3e0',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5);
    }
  }
}
