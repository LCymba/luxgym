/**
 * LUXGYM — Dashboard de Gestión
 * Lógica Frontend SPA en JavaScript Vanilla con Autenticación y Control de Roles
 */

const API_BASE_URL = 'http://localhost:3000';

// Estado global de la aplicación
let appState = {
  token: null,
  user: null, // { id, name, email, role, membershipExpiry }
  users: [],
  routines: [],
  currentSection: 'dashboard'
};

/* ==========================================
   INICIALIZACIÓN AL CARGAR LA PÁGINA
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  setupDateTime();
  checkApiStatus();
  
  // Intentar cargar la sesión del localStorage
  const savedToken = localStorage.getItem('luxgym_token');
  const savedUser = localStorage.getItem('luxgym_user');

  if (savedToken && savedUser) {
    try {
      appState.token = savedToken;
      appState.user = JSON.parse(savedUser);
      
      // Inicializar la aplicación con el usuario logueado
      initAuthenticatedApp();
    } catch (e) {
      console.error('Error al restaurar sesión:', e);
      logout();
    }
  } else {
    // Mostrar pantalla de Login
    showAuthScreen();
  }

  // Comprobar estado de la API periódicamente (cada 10 segundos)
  setInterval(checkApiStatus, 10000);

  // Cerrar modales si se hace clic fuera de la tarjeta
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal(e.target.id);
    }
  });
});

/* ==========================================
   MONITORIZACIÓN DE ESTADO DE LA API (/health)
   ========================================== */
async function checkApiStatus() {
  const statusEl = document.getElementById('apiStatus');
  const statusTextEl = statusEl.querySelector('.status-text');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok') {
        statusEl.className = 'api-status online';
        statusTextEl.textContent = 'Servidor Activo';
        return true;
      }
    }
    throw new Error('Servidor inactivo o respuesta incorrecta');
  } catch (error) {
    statusEl.className = 'api-status offline';
    statusTextEl.textContent = 'Servidor Desconectado';
    return false;
  }
}

/* ==========================================
   WRAPPER FETCH PARA ENVIAR TOKEN DE AUTENTICACIÓN
   ========================================== */
async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (appState.token) {
    headers['Authorization'] = `Bearer ${appState.token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Token expirado o inválido -> forzar cierre de sesión
      showToast('Sesión vencida. Por favor, inicie sesión de nuevo.', 'error');
      logout();
      throw new Error('Sesión expirada');
    }

    return response;
  } catch (err) {
    if (err.message === 'Sesión expirada') throw err;
    console.error(`Error en petición a ${endpoint}:`, err);
    throw err;
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = 'Ha ocurrido un error inesperado en el servidor.';
    try {
      const data = await response.json();
      if (data && data.error) {
        errorMessage = data.error;
      }
    } catch (e) {}
    throw new Error(errorMessage);
  }
  return response.json();
}

/* ==========================================
   PANTALLAS DE AUTENTICACIÓN (LOGIN / REGISTRO)
   ========================================== */
function showAuthScreen() {
  document.getElementById('auth-container').style.display = 'flex';
  document.querySelector('.app-container').style.display = 'none';
}

function hideAuthScreen() {
  document.getElementById('auth-container').style.display = 'none';
  document.querySelector('.app-container').style.display = 'flex';
}

function toggleAuthForm(formName) {
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  
  if (formName === 'login') {
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  } else {
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
  }
}

// Iniciar sesión (POST /api/auth/login)
async function handleLoginSubmit(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Verificando...';

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await handleResponse(response);
    
    // Guardar en localStorage
    localStorage.setItem('luxgym_token', data.token);
    localStorage.setItem('luxgym_user', JSON.stringify(data.user));
    
    // Actualizar estado global
    appState.token = data.token;
    appState.user = data.user;
    
    showToast(`¡Bienvenido de nuevo, ${data.user.name}!`, 'success');
    
    initAuthenticatedApp();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

// Auto-registro de clientes (POST /api/auth/register)
async function handleRegisterSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Creando cuenta...';

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await handleResponse(response);

    // Guardar en localStorage
    localStorage.setItem('luxgym_token', data.token);
    localStorage.setItem('luxgym_user', JSON.stringify(data.user));

    // Actualizar estado global
    appState.token = data.token;
    appState.user = data.user;

    showToast(`Registro exitoso. ¡Bienvenido a LuxGym, ${data.user.name}!`, 'success');

    initAuthenticatedApp();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

// Cerrar sesión
function logout() {
  localStorage.removeItem('luxgym_token');
  localStorage.removeItem('luxgym_user');
  
  appState.token = null;
  appState.user = null;
  appState.users = [];
  appState.routines = [];
  
  // Limpiar formularios
  document.getElementById('form-login').reset();
  document.getElementById('form-register').reset();
  
  showAuthScreen();
}

/* ==========================================
   CONFIGURACIÓN DE LA APLICACIÓN AUTENTICADA
   ========================================== */
function initAuthenticatedApp() {
  hideAuthScreen();
  setupNavigation();
  renderSidebarProfile();
  renderMenuByRole();
  setupRoleBasedFormControls();

  // Redirigir a la sección adecuada según el rol
  if (appState.user.role === 'MEMBER') {
    showSection('my-routines');
  } else {
    showSection('dashboard');
  }
}

// Mostrar el nombre del usuario y su rol en la parte inferior del Sidebar
function renderSidebarProfile() {
  const profileEl = document.getElementById('sidebarUserProfile');
  if (!profileEl) return;

  const nameEl = document.getElementById('profile-name');
  const roleEl = document.getElementById('profile-role');

  nameEl.textContent = appState.user.name;
  
  let roleLabel = 'Socio';
  if (appState.user.role === 'OWNER') roleLabel = 'Dueño';
  else if (appState.user.role === 'ADMIN') roleLabel = 'Recepción';
  else if (appState.user.role === 'TRAINER') roleLabel = 'Entrenador';

  roleEl.textContent = roleLabel;
  profileEl.style.display = 'flex';
}

// Mostrar u ocultar elementos del menú según los roles permitidos
function renderMenuByRole() {
  const role = appState.user.role;
  const menuItems = document.querySelectorAll('.sidebar-nav ul li');

  menuItems.forEach(item => {
    const allowedRolesStr = item.getAttribute('data-roles');
    if (allowedRolesStr) {
      const allowedRoles = allowedRolesStr.split(' ');
      if (allowedRoles.includes(role)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    }
  });
}

// Ajustes del formulario según el rol
function setupRoleBasedFormControls() {
  const userRoleSelector = document.getElementById('user-role');
  if (!userRoleSelector) return;

  const role = appState.user.role;
  
  // Limpiar y resetear el dropdown de roles
  userRoleSelector.innerHTML = '';

  if (role === 'OWNER') {
    // El dueño puede crear cualquier tipo de cuenta
    userRoleSelector.innerHTML = `
      <option value="MEMBER">Socio (MEMBER)</option>
      <option value="TRAINER">Entrenador (TRAINER)</option>
      <option value="ADMIN">Administrador (ADMIN)</option>
      <option value="OWNER">Dueño (OWNER)</option>
    `;
  } else {
    // El recepcionista (ADMIN) solo puede crear socios
    userRoleSelector.innerHTML = `
      <option value="MEMBER">Socio (MEMBER)</option>
    `;
  }

  toggleMembershipExpiryField();
}

// Ocultar o mostrar el campo de expiración de membresía en el modal de registrar socio
function toggleMembershipExpiryField() {
  const roleSelector = document.getElementById('user-role');
  const expiryGroup = document.getElementById('membership-expiry-group');
  if (!roleSelector || !expiryGroup) return;

  if (roleSelector.value === 'MEMBER') {
    expiryGroup.style.display = 'block';
    
    // Por defecto, establecer la fecha dentro de 30 días
    const dateInput = document.getElementById('user-membership-expiry');
    if (dateInput && !dateInput.value) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      dateInput.value = defaultDate.toISOString().split('T')[0];
    }
  } else {
    expiryGroup.style.display = 'none';
  }
}

/* ==========================================
   SISTEMA DE NAVEGACIÓN SPA
   ========================================== */
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Remover event listeners anteriores clonando los elementos (para evitar duplicados)
  navLinks.forEach(link => {
    const newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);
  });

  const updatedNavLinks = document.querySelectorAll('.nav-link');
  updatedNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetSection = link.getAttribute('data-section');
      if (targetSection === appState.currentSection) return;

      // Actualizar enlaces de navegación activos
      updatedNavLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Cambiar de sección visible
      showSection(targetSection);
    });
  });
}

function showSection(sectionName) {
  appState.currentSection = sectionName;
  
  // Ocultar todas las secciones y mostrar la seleccionada
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(sec => {
    sec.classList.remove('active');
    if (sec.id === `section-${sectionName}`) {
      sec.classList.add('active');
    }
  });

  // Asegurar navegación activa correcta si cambiamos por código
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('data-section') === sectionName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Ejecutar carga de datos según la sección
  if (sectionName === 'dashboard') {
    updateDashboardStats();
  } else if (sectionName === 'users') {
    fetchUsers();
  } else if (sectionName === 'routines') {
    fetchRoutines();
  } else if (sectionName === 'my-routines') {
    loadMyRoutines();
  }
}

function setupDateTime() {
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    let dateStr = today.toLocaleDateString('es-ES', options);
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    dateEl.textContent = dateStr;
  }
}

/* ==========================================
   TOASTS (SISTEMA DE NOTIFICACIONES)
   ========================================== */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconClass = type === 'success' ? 'bx bx-check-circle' : 'bx bx-error-circle';
  
  toast.innerHTML = `
    <i class="${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

/* ==========================================
   GESTIÓN DE MODALES
   ========================================== */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.add('active');

  if (modalId === 'modal-routine') {
    populateUserSelector();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.remove('active');

  const form = modal.querySelector('form');
  if (form) {
    form.reset();
  }
  setupRoleBasedFormControls();
}

// Cargar la lista de socios en el dropdown para crear rutinas
async function populateUserSelector() {
  const selector = document.getElementById('routine-userId');
  if (!selector) return;

  selector.innerHTML = '<option value="" disabled selected>Selecciona un socio...</option>';

  try {
    const members = await fetchMembers();

    if (members.length === 0) {
      selector.innerHTML = '<option value="" disabled>No hay socios registrados. Registre uno primero.</option>';
      return;
    }

    members.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.name} (${user.email})`;
      selector.appendChild(option);
    });
  } catch (error) {
    console.error('Error al precargar socios en selector:', error);
    selector.innerHTML = '<option value="" disabled>Error al cargar socios.</option>';
  }
}

/* ==========================================
   DASHBOARD — ESTADÍSTICAS Y ACTUALIZACIONES
   ========================================== */
async function updateDashboardStats() {
  const usersCountEl = document.getElementById('stat-users-count');
  const routinesCountEl = document.getElementById('stat-routines-count');

  if (usersCountEl) usersCountEl.textContent = '...';
  if (routinesCountEl) routinesCountEl.textContent = '...';

  try {
    const isOnline = await checkApiStatus();
    if (!isOnline) {
      if (usersCountEl) usersCountEl.textContent = 'N/A';
      if (routinesCountEl) routinesCountEl.textContent = 'N/A';
      return;
    }

    const [users, routines] = await Promise.all([
      fetchRawUsers(),
      fetchRawRoutines()
    ]);

    appState.users = users;
    appState.routines = routines;

    // Estadísticas
    const totalMembers = users.filter(u => u.role === 'MEMBER').length;

    if (usersCountEl) usersCountEl.textContent = totalMembers;
    if (routinesCountEl) routinesCountEl.textContent = routines.length;
  } catch (error) {
    console.error('Error al actualizar estadísticas del dashboard:', error);
    if (usersCountEl) usersCountEl.textContent = 'Error';
    if (routinesCountEl) routinesCountEl.textContent = 'Error';
  }
}

/* ==========================================
   LÓGICA SECCIÓN: USUARIOS / SOCIOS
   ========================================== */
async function fetchRawUsers() {
  const response = await apiFetch('/api/users');
  return handleResponse(response);
}

async function fetchMembers() {
  const response = await apiFetch('/api/users/members');
  return handleResponse(response);
}

async function fetchUsers() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="table-loading">Cargando socios de la API...</td>
    </tr>
  `;

  try {
    const users = await fetchRawUsers();
    appState.users = users;
    renderUsersTable(users);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="table-loading" style="color: var(--color-error);">
          <i class="bx bx-error-circle" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;"></i>
          No se pudieron cargar los socios. Asegúrate de que estés autorizado.
        </td>
      </tr>
    `;
    showToast(error.message, 'error');
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="table-loading">No hay socios registrados en el gimnasio.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  users.forEach(user => {
    const tr = document.createElement('tr');
    
    let badgeClass = 'badge-member';
    let roleText = 'Socio';
    
    if (user.role === 'OWNER') {
      badgeClass = 'badge-owner';
      roleText = 'Dueño';
    } else if (user.role === 'ADMIN') {
      badgeClass = 'badge-admin';
      roleText = 'Recepción';
    } else if (user.role === 'TRAINER') {
      badgeClass = 'badge-trainer';
      roleText = 'Entrenador';
    }

    // Calcular el estado de membresía si es MEMBER
    let membershipHtml = '';
    if (user.role === 'MEMBER') {
      if (user.membershipExpiry) {
        const expiry = new Date(user.membershipExpiry);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (expiry >= today) {
          membershipHtml = `<div style="font-size: 0.75rem; color: #a3b18a;"><i class="bx bxs-circle" style="font-size: 0.55rem; color: #55a630; margin-right: 3px;"></i> Al día: ${expiry.toLocaleDateString('es-ES')}</div>`;
        } else {
          membershipHtml = `<div style="font-size: 0.75rem; color: var(--color-error);"><i class="bx bxs-circle" style="font-size: 0.55rem; color: var(--color-error); margin-right: 3px;"></i> Vencido: ${expiry.toLocaleDateString('es-ES')}</div>`;
        }
      } else {
        membershipHtml = '<div style="font-size: 0.75rem; color: var(--color-text-muted);">Sin plan activo</div>';
      }
    }

    tr.innerHTML = `
      <td style="font-weight: 600; color: var(--color-text-main);">
        <div>${escapeHtml(user.name)}</div>
        ${membershipHtml}
      </td>
      <td>${escapeHtml(user.email)}</td>
      <td><span class="badge ${badgeClass}">${roleText}</span></td>
      <td>${formatDate(user.createdAt)}</td>
      <td class="text-right">
        <button class="btn btn-outline btn-sm" onclick="showUserDetails('${user.id}')">
          <i class="bx bx-show-alt"></i> Ver Ficha
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterUsers() {
  const query = document.getElementById('user-search').value.toLowerCase().trim();
  if (!query) {
    renderUsersTable(appState.users);
    return;
  }

  const filtered = appState.users.filter(user => 
    user.name.toLowerCase().includes(query) || 
    user.email.toLowerCase().includes(query)
  );
  
  renderUsersTable(filtered);
}

// Crear Usuario por Admin/Owner (POST /api/users)
async function handleUserSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('user-name').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const password = document.getElementById('user-password').value;
  const role = document.getElementById('user-role').value;
  
  // Recoger fecha de membresía si aplica
  let membershipExpiry = null;
  const expiryInput = document.getElementById('user-membership-expiry');
  if (role === 'MEMBER' && expiryInput && expiryInput.value) {
    // Almacenar en formato ISO con hora al final del día local
    const selectedDate = new Date(expiryInput.value);
    selectedDate.setHours(23, 59, 59, 999);
    membershipExpiry = selectedDate.toISOString();
  }

  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalBtnText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Registrando...';

  try {
    const response = await apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, membershipExpiry })
    });

    const newUser = await handleResponse(response);
    
    showToast(`Usuario ${newUser.name} registrado con éxito.`, 'success');
    closeModal('modal-user');
    
    if (appState.currentSection === 'users') {
      fetchUsers();
    } else {
      updateDashboardStats();
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalBtnText;
  }
}

// Obtener detalle de usuario por ID (GET /api/users/:id)
async function showUserDetails(userId) {
  openModal('modal-detail-user');
  const contentEl = document.getElementById('detail-user-content');
  contentEl.innerHTML = '<p class="table-loading">Cargando ficha de socio...</p>';

  try {
    const response = await apiFetch(`/api/users/${userId}`);
    const user = await handleResponse(response);

    // Las rutinas ya vienen en el user de la API gracias al include que modificamos en el backend
    const assignedRoutines = user.routines || [];

    let badgeClass = 'badge-member';
    let roleText = 'Socio (MEMBER)';
    if (user.role === 'OWNER') {
      badgeClass = 'badge-owner';
      roleText = 'Dueño (OWNER)';
    } else if (user.role === 'ADMIN') {
      badgeClass = 'badge-admin';
      roleText = 'Administrador (ADMIN)';
    } else if (user.role === 'TRAINER') {
      badgeClass = 'badge-trainer';
      roleText = 'Entrenador (TRAINER)';
    }

    let routinesHtml = '';
    if (assignedRoutines.length === 0) {
      routinesHtml = '<p style="font-size: 0.85rem; color: var(--color-text-muted); font-style: italic;">Este socio no tiene rutinas asignadas actualmente.</p>';
    } else {
      routinesHtml = assignedRoutines.map(r => `
        <div class="sub-item">
          <div class="sub-item-title text-gold">${escapeHtml(r.name)}</div>
          <div class="sub-item-desc">${escapeHtml(r.description || 'Sin descripción.')}</div>
          ${r.exercises && r.exercises.length > 0 ? `
            <div class="sub-item-exercises-preview">
              <strong>Ejercicios (${r.exercises.length}):</strong>
              <ul>
                ${r.exercises.map(ex => `<li>${escapeHtml(ex.name)} ${ex.sets ? `— ${ex.sets}x${ex.reps || ''}` : ''}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `).join('');
    }

    let membershipDetailHtml = '—';
    if (user.role === 'MEMBER') {
      if (user.membershipExpiry) {
        const expiry = new Date(user.membershipExpiry);
        const today = new Date();
        today.setHours(0,0,0,0);
        const isUpToDate = expiry >= today;
        
        membershipDetailHtml = `
          <div class="membership-info-box ${isUpToDate ? 'status-green' : 'status-red'}">
            <strong>${isUpToDate ? 'MEMBRESÍA ACTIVA' : 'MEMBRESÍA VENCIDA'}</strong>
            <p>Vence el: ${expiry.toLocaleDateString('es-ES')}</p>
          </div>
        `;
      } else {
        membershipDetailHtml = '<span class="text-muted">Sin membresía asignada</span>';
      }
    }

    contentEl.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <h4>ID de Socio</h4>
          <p style="font-family: monospace; font-size: 0.85rem; color: var(--color-gold);">${user.id}</p>
        </div>
        <div class="detail-item">
          <h4>Nombre</h4>
          <p>${escapeHtml(user.name)}</p>
        </div>
        <div class="detail-item">
          <h4>Correo Electrónico</h4>
          <p>${escapeHtml(user.email)}</p>
        </div>
        <div class="detail-item">
          <h4>Rol de Cuenta</h4>
          <p><span class="badge ${badgeClass}">${roleText}</span></p>
        </div>
        <div class="detail-item">
          <h4>Miembro Desde</h4>
          <p>${formatDate(user.createdAt)}</p>
        </div>
        <div class="detail-item">
          <h4>Estado de Membresía</h4>
          <p>${membershipDetailHtml}</p>
        </div>
      </div>
      
      <div class="detail-divider"></div>
      
      <div class="detail-sub-list">
        <h3>Programas y Rutinas Asignadas (${assignedRoutines.length})</h3>
        ${routinesHtml}
      </div>
    `;

  } catch (error) {
    contentEl.innerHTML = `
      <div style="text-align: center; color: var(--color-error); padding: 1.5rem 0;">
        <i class="bx bx-error-circle" style="font-size: 2.5rem; margin-bottom: 0.5rem;"></i>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
    showToast(error.message, 'error');
  }
}

/* ==========================================
   LÓGICA SECCIÓN: RUTINAS (TRAINER / OWNER / ADMIN)
   ========================================== */
async function fetchRawRoutines() {
  const response = await apiFetch('/api/routines');
  return handleResponse(response);
}

async function fetchRoutines() {
  const tbody = document.getElementById('routines-tbody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="table-loading">Cargando rutinas de la API...</td>
    </tr>
  `;

  try {
    const routines = await fetchRawRoutines();
    appState.routines = routines;
    renderRoutinesTable(routines);
  } catch (error) {
    console.error('Error al listar rutinas:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="table-loading" style="color: var(--color-error);">
          <i class="bx bx-error-circle" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;"></i>
          No se pudieron cargar las rutinas. Asegúrate de que el backend esté levantado.
        </td>
      </tr>
    `;
    showToast(error.message, 'error');
  }
}

function renderRoutinesTable(routines) {
  const tbody = document.getElementById('routines-tbody');
  if (!tbody) return;

  if (routines.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="table-loading">No hay rutinas de entrenamiento creadas.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  routines.forEach(routine => {
    const tr = document.createElement('tr');
    const userName = routine.user ? routine.user.name : 'No asignado';
    const userEmail = routine.user ? routine.user.email : '';
    
    const exercisesCount = routine.exercises ? routine.exercises.length : 0;

    tr.innerHTML = `
      <td style="font-weight: 600; color: var(--color-gold);">${escapeHtml(routine.name)}</td>
      <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(routine.description || '')}">
        ${escapeHtml(routine.description || 'Sin descripción')}
        <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px;">
          <i class="bx bx-dumbbell"></i> ${exercisesCount} ejercicios asignados
        </div>
      </td>
      <td>
        <div style="font-weight: 500;">${escapeHtml(userName)}</div>
        <div style="font-size: 0.75rem; color: var(--color-text-muted);">${escapeHtml(userEmail)}</div>
      </td>
      <td>${formatDate(routine.createdAt)}</td>
      <td class="text-right">
        <button class="btn btn-outline btn-sm" onclick="showRoutineDetails('${routine.id}')">
          <i class="bx bx-show-alt"></i> Ver Plan
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterRoutines() {
  const query = document.getElementById('routine-search').value.toLowerCase().trim();
  if (!query) {
    renderRoutinesTable(appState.routines);
    return;
  }

  const filtered = appState.routines.filter(routine => 
    routine.name.toLowerCase().includes(query) || 
    (routine.description && routine.description.toLowerCase().includes(query))
  );
  
  renderRoutinesTable(filtered);
}

// Crear Rutina (POST /api/routines) - Ahora con ejercicios extraídos de la descripción
async function handleRoutineSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('routine-name').value.trim();
  const description = document.getElementById('routine-desc').value.trim();
  const userId = document.getElementById('routine-userId').value;

  if (!userId) {
    showToast('Por favor, selecciona un socio para asignarle la rutina.', 'error');
    return;
  }

  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalBtnText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Creando rutina...';

  // Procesar descripción línea por línea para extraer ejercicios de manera automatizada
  const lines = description.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Mapear cada línea no vacía a un ejercicio.
  // Es inteligente parsear si dice por ejemplo "Prensa 4x10" o "Prensa de piernas"
  const exercises = lines.map(line => {
    // Expresión regular inteligente para atrapar "Nombre del Ejercicio 3x12" o "Nombre 4 x 10" o similar
    const regexX = /^(.*?)\s+(\d+)\s*[xX]\s*(\d+)(.*)$/;
    const match = line.match(regexX);

    if (match) {
      const exName = match[1].trim();
      const sets = parseInt(match[2], 10);
      const reps = parseInt(match[3], 10);
      const notes = match[4].trim().replace(/^[(-]*/, '').replace(/[)-]*$/, '').trim(); // Limpiar paréntesis o guiones
      
      return {
        name: exName,
        sets,
        reps,
        notes: notes || null
      };
    } else {
      // Línea normal sin formato X, asignamos por defecto
      return {
        name: line,
        sets: 3,
        reps: 12,
        notes: null
      };
    }
  });

  try {
    const response = await apiFetch('/api/routines', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        userId,
        exercises
      })
    });

    const newRoutine = await handleResponse(response);
    
    showToast(`Rutina "${newRoutine.name}" creada con éxito con ${exercises.length} ejercicios.`, 'success');
    closeModal('modal-routine');
    
    if (appState.currentSection === 'routines') {
      fetchRoutines();
    } else {
      updateDashboardStats();
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalBtnText;
  }
}

// Obtener detalle de rutina por ID (GET /api/routines/:id)
async function showRoutineDetails(routineId) {
  openModal('modal-detail-routine');
  const contentEl = document.getElementById('detail-routine-content');
  contentEl.innerHTML = '<p class="table-loading">Cargando detalles del plan...</p>';

  try {
    const response = await apiFetch(`/api/routines/${routineId}`);
    const routine = await handleResponse(response);

    const userName = routine.user ? routine.user.name : 'No asignado';
    const userEmail = routine.user ? routine.user.email : 'Sin email';

    let exercisesListHtml = '';
    if (routine.exercises && routine.exercises.length > 0) {
      exercisesListHtml = `
        <div class="detail-exercises-list">
          <h4 style="margin-top: 1.25rem; margin-bottom: 0.5rem; color: var(--color-text-main);">Ejercicios del Plan</h4>
          <div class="exercise-items-container">
            ${routine.exercises.map((ex, index) => `
              <div class="exercise-item-detail">
                <span class="exercise-index">${index + 1}</span>
                <div class="exercise-main-info">
                  <strong>${escapeHtml(ex.name)}</strong>
                  ${ex.notes ? `<p class="exercise-notes">${escapeHtml(ex.notes)}</p>` : ''}
                </div>
                ${ex.sets ? `
                  <div class="exercise-params-badge">
                    <span>${ex.sets}</span> Series &times; <span>${ex.reps || 'Fallo'}</span> Reps
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      exercisesListHtml = '<p class="text-muted" style="font-style: italic; margin-top: 1rem;">No hay ejercicios estructurados asignados a esta rutina.</p>';
    }

    contentEl.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <h4>Nombre de la Rutina</h4>
          <p class="text-gold" style="font-size: 1.25rem; font-weight: 700; letter-spacing: 0.5px;">${escapeHtml(routine.name)}</p>
        </div>
        <div class="detail-item">
          <h4>ID de Rutina</h4>
          <p style="font-family: monospace; font-size: 0.85rem; color: var(--color-text-muted);">${routine.id}</p>
        </div>
        <div class="detail-item">
          <h4>Socio Asignado</h4>
          <p style="font-weight: 600; color: var(--color-text-main);">${escapeHtml(userName)} <span style="font-weight: normal; color: var(--color-text-muted); font-size: 0.85rem;">(${escapeHtml(userEmail)})</span></p>
        </div>
        <div class="detail-item">
          <h4>Fecha de Asignación</h4>
          <p>${formatDate(routine.createdAt)}</p>
        </div>
        <div class="detail-item" style="grid-column: span 2;">
          <h4>Instrucciones Generales</h4>
          <p style="background-color: var(--bg-secondary); padding: 1rem; border-radius: var(--border-radius); border: 1px solid var(--border-color); line-height: 1.5; white-space: pre-line;">${escapeHtml(routine.description || 'Sin instrucciones adicionales.')}</p>
        </div>
      </div>
      
      <div class="detail-divider"></div>
      
      ${exercisesListHtml}
    `;

  } catch (error) {
    contentEl.innerHTML = `
      <div style="text-align: center; color: var(--color-error); padding: 1.5rem 0;">
        <i class="bx bx-error-circle" style="font-size: 2.5rem; margin-bottom: 0.5rem;"></i>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
    showToast(error.message, 'error');
  }
}

/* ==========================================
   LÓGICA SECCIÓN: MI ENTRENAMIENTO (MEMBER)
   ========================================== */
let activeRoutineId = null;

async function loadMyRoutines() {
  const statusBadgeContainer = document.getElementById('my-membership-status');
  const routineNameEl = document.getElementById('my-routine-name');
  const routineDescEl = document.getElementById('my-routine-desc');
  const exercisesListEl = document.getElementById('my-exercises-list');
  const saveWorkoutBtn = document.getElementById('btn-save-workout');

  statusBadgeContainer.innerHTML = '...';
  routineNameEl.textContent = 'Cargando tu rutina...';
  routineDescEl.textContent = 'Espere por favor...';
  exercisesListEl.innerHTML = '<p class="table-loading">Cargando ejercicios...</p>';
  saveWorkoutBtn.style.display = 'none';

  try {
    // 1. Obtener la información del usuario logueado con sus rutinas y ejercicios
    const response = await apiFetch(`/api/users/${appState.user.id}`);
    const user = await handleResponse(response);

    // Actualizar datos de membresía en la UI
    renderMyMembershipExpiry(user.membershipExpiry, statusBadgeContainer);

    // 2. Extraer la rutina activa (la más reciente)
    const myRoutines = user.routines || [];
    
    if (myRoutines.length === 0) {
      routineNameEl.textContent = '¡Sin rutina asignada!';
      routineDescEl.textContent = 'Pedile a tu entrenador que te asigne una rutina de entrenamiento.';
      exercisesListEl.innerHTML = `
        <div class="empty-state-container">
          <i class="bx bx-dumbbell" style="font-size: 3rem; color: var(--color-gold); display: block; margin-bottom: 0.5rem;"></i>
          <p>No tienes rutinas asignadas en este momento.</p>
        </div>
      `;
      activeRoutineId = null;
    } else {
      const activeRoutine = myRoutines[0]; // La primera es la más reciente (ordenada por createdAt desc)
      activeRoutineId = activeRoutine.id;

      routineNameEl.textContent = activeRoutine.name;
      routineDescEl.textContent = activeRoutine.description || 'Sin instrucciones adicionales.';

      // Renderizar ejercicios checklist
      const exercises = activeRoutine.exercises || [];
      if (exercises.length === 0) {
        exercisesListEl.innerHTML = '<p class="text-muted" style="font-style: italic; text-align: center; padding: 1.5rem;">Esta rutina no tiene ejercicios listados de manera individual.</p>';
        saveWorkoutBtn.style.display = 'none';
      } else {
        saveWorkoutBtn.style.display = 'inline-flex';
        renderMyExercisesChecklist(exercises, exercisesListEl);
      }
    }

    // 3. Cargar historial de entrenamientos realizados
    loadMyWorkoutHistory();

  } catch (error) {
    console.error('Error al cargar espacio personal:', error);
    showToast(error.message, 'error');
    routineNameEl.textContent = 'Error';
    routineDescEl.textContent = 'No se pudo conectar con el servidor para cargar tus entrenamientos.';
  }
}

// Pintar la tarjeta de membresía del cliente
function renderMyMembershipExpiry(expiryString, container) {
  if (!expiryString) {
    container.innerHTML = `
      <div class="membership-badge badge-expired">
        <i class="bx bx-error-circle"></i> SIN MEMBRESÍA ACTIVA
      </div>
    `;
    return;
  }

  const expiry = new Date(expiryString);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (expiry >= today) {
    container.innerHTML = `
      <div class="membership-badge badge-active">
        <i class="bx bxs-check-circle"></i> MEMBRESÍA VIGENTE (Quedan ${diffDays} días)
        <span>Vence el ${expiry.toLocaleDateString('es-ES')}</span>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="membership-badge badge-expired">
        <i class="bx bxs-x-circle"></i> MEMBRESÍA VENCIDA hace ${Math.abs(diffDays)} días
        <span>Venció el ${expiry.toLocaleDateString('es-ES')}</span>
      </div>
    `;
  }
}

// Pintar el checklist de ejercicios para que el usuario los marque
function renderMyExercisesChecklist(exercises, container) {
  container.innerHTML = '';

  exercises.forEach((ex) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'exercise-checklist-item';
    
    // Al hacer clic en toda la caja del ejercicio, activar el checkbox
    itemEl.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        const checkbox = itemEl.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });

    itemEl.innerHTML = `
      <div class="checklist-action">
        <input type="checkbox" id="check-${ex.id}" data-id="${ex.id}" value="${ex.id}">
        <label for="check-${ex.id}"></label>
      </div>
      <div class="checklist-body">
        <span class="checklist-name">${escapeHtml(ex.name)}</span>
        ${ex.notes ? `<p class="checklist-notes">${escapeHtml(ex.notes)}</p>` : ''}
      </div>
      ${ex.sets ? `
        <div class="checklist-params">
          <span>${ex.sets}</span> S &times; <span>${ex.reps || 'Fallo'}</span> R
        </div>
      ` : ''}
    `;

    // Escuchar el cambio en el checkbox para dar un efecto visual estilizado al marcar el ejercicio
    const checkbox = itemEl.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        itemEl.classList.add('completed');
      } else {
        itemEl.classList.remove('completed');
      }
    });

    container.appendChild(itemEl);
  });
}

// Enviar el entrenamiento diario al backend (POST /api/workout-logs)
async function submitDailyWorkout() {
  if (!activeRoutineId) {
    showToast('No hay una rutina activa cargada.', 'error');
    return;
  }

  // Buscar todos los checkboxes que estén marcados
  const checkboxes = document.querySelectorAll('#my-exercises-list input[type="checkbox"]:checked');
  const completedEx = Array.from(checkboxes).map(cb => cb.value);

  if (completedEx.length === 0) {
    showToast('Por favor, marque al menos un ejercicio que haya completado hoy.', 'error');
    return;
  }

  const saveWorkoutBtn = document.getElementById('btn-save-workout');
  const originalText = saveWorkoutBtn.innerHTML;
  saveWorkoutBtn.disabled = true;
  saveWorkoutBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Guardando...';

  try {
    const response = await apiFetch('/api/workout-logs', {
      method: 'POST',
      body: JSON.stringify({
        routineId: activeRoutineId,
        completedEx
      })
    });

    await handleResponse(response);

    showToast('¡Felicitaciones! Has registrado tu entrenamiento del día de hoy.', 'success');
    
    // Desmarcar todos y refrescar la vista
    document.querySelectorAll('#my-exercises-list input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
      cb.closest('.exercise-checklist-item').classList.remove('completed');
    });

    loadMyWorkoutHistory();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    saveWorkoutBtn.disabled = false;
    saveWorkoutBtn.innerHTML = originalText;
  }
}

// Cargar el historial de entrenamientos completados (GET /api/workout-logs/me)
async function loadMyWorkoutHistory() {
  const historyListEl = document.getElementById('my-workout-history-list');
  if (!historyListEl) return;

  historyListEl.innerHTML = '<p class="table-loading">Cargando tu historial...</p>';

  try {
    const response = await apiFetch('/api/workout-logs/me');
    const logs = await handleResponse(response);

    if (logs.length === 0) {
      historyListEl.innerHTML = `
        <div class="empty-state-history">
          <i class="bx bx-calendar-check" style="font-size: 2.25rem; color: var(--color-text-muted); margin-bottom: 0.35rem;"></i>
          <p>No tienes entrenamientos registrados en el sistema. ¡Empieza hoy!</p>
        </div>
      `;
      return;
    }

    historyListEl.innerHTML = '';
    logs.forEach(log => {
      // Buscar los nombres de los ejercicios completados mapeando con la lista de ejercicios de la rutina
      const exercisesInRoutine = log.routine?.exercises || [];
      const completedExerciseNames = log.completedEx.map(exId => {
        const found = exercisesInRoutine.find(e => e.id === exId);
        return found ? found.name : 'Ejercicio';
      });

      const card = document.createElement('div');
      card.className = 'history-item-card';

      // Dar formato de fecha amigable para el historial, ej. "Martes 30 de Junio"
      const logDate = new Date(log.date);
      const formattedDate = logDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

      card.innerHTML = `
        <div class="history-item-header">
          <span class="history-item-date"><i class="bx bxs-calendar"></i> ${capitalizedDate}</span>
          <span class="history-item-badge"><i class="bx bx-check-circle"></i> Completado</span>
        </div>
        <p class="history-item-routine-name">${escapeHtml(log.routine?.name || 'Entrenamiento')}</p>
        <div class="history-item-exercises-summary">
          <strong>Ejercicios completados (${completedExerciseNames.length}):</strong>
          <p class="exercises-tags-list">
            ${completedExerciseNames.map(name => `<span>${escapeHtml(name)}</span>`).join('')}
          </p>
        </div>
      `;

      historyListEl.appendChild(card);
    });

  } catch (error) {
    console.error('Error al cargar historial de entrenamientos:', error);
    historyListEl.innerHTML = '<p class="text-error" style="text-align: center; padding: 1rem;"><i class="bx bx-error-circle"></i> No se pudo cargar el historial.</p>';
  }
}

/* ==========================================
   HELPERS / UTILIDADES
   ========================================== */
function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  } catch (e) {
    return dateString;
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
