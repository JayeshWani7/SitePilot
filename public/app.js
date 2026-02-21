const themeSelect = document.getElementById('theme-select');
const tenantPreset = document.getElementById('tenant-preset');
const tenantInput = document.getElementById('tenant-id');
const projectForm = document.getElementById('project-form');
const projectNameInput = document.getElementById('project-name');
const refreshBtn = document.getElementById('refresh-projects');
const healthBtn = document.getElementById('health-check');
const statusEl = document.getElementById('status');
const projectRows = document.getElementById('project-rows');
const projectCount = document.getElementById('project-count');

const lifecycleStages = Array.from(document.querySelectorAll('.lifecycle li'));
const STAGE_ORDER = ['onboarding', 'draft', 'brand', 'content', 'live', 'growth', 'optimize', 'monetize'];

const savedTheme = localStorage.getItem('sitepilot.theme') || 'dark-graphite';
setTheme(savedTheme);
themeSelect.value = savedTheme;

function setStatus(message, tone = 'neutral') {
  statusEl.textContent = message;
  if (tone === 'error') {
    statusEl.style.borderLeftColor = 'var(--danger)';
  } else if (tone === 'success') {
    statusEl.style.borderLeftColor = 'var(--accent)';
  } else {
    statusEl.style.borderLeftColor = 'var(--primary)';
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sitepilot.theme', theme);
}

function getTenantId() {
  return tenantInput.value.trim();
}

function headersWithTenant() {
  return {
    'x-tenant-id': getTenantId(),
    'Content-Type': 'application/json',
  };
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString();
}

function renderProjects(projects) {
  projectRows.innerHTML = '';
  if (!projects.length) {
    projectRows.innerHTML = '<tr><td colspan="3">No projects yet for this tenant.</td></tr>';
  } else {
    for (const project of projects) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${project.name}</td>
        <td>${project.tenant_id}</td>
        <td>${formatDate(project.created_at)}</td>
      `;
      projectRows.appendChild(row);
    }
  }
  projectCount.textContent = `${projects.length} item${projects.length === 1 ? '' : 's'}`;
  syncLifecycle(projects.length);
}

function syncLifecycle(projectCountValue) {
  let current = 0;
  if (projectCountValue === 0) current = 1;
  if (projectCountValue >= 1) current = 2;
  if (projectCountValue >= 2) current = 3;
  if (projectCountValue >= 3) current = 4;

  lifecycleStages.forEach((item, index) => {
    item.classList.remove('active', 'complete');
    if (index < current) {
      item.classList.add('complete');
    } else if (index === current) {
      item.classList.add('active');
    }
  });
}

async function fetchProjects() {
  const tenantId = getTenantId();
  if (!tenantId) {
    setStatus('Tenant ID is required.', 'error');
    return;
  }

  try {
    setStatus('Loading projects...');
    const response = await fetch('/projects', { headers: headersWithTenant() });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to fetch projects.');
    }

    renderProjects(payload);
    setStatus(`Loaded ${payload.length} project(s) for tenant ${tenantId}.`, 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function createProject(name) {
  try {
    const response = await fetch('/projects', {
      method: 'POST',
      headers: headersWithTenant(),
      body: JSON.stringify({ name }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to create project.');
    }

    setStatus(`Project "${payload.name}" created.`, 'success');
    projectNameInput.value = '';
    await fetchProjects();
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function runHealthCheck() {
  try {
    const response = await fetch('/health');
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error('API health check failed.');
    }
    setStatus('API healthy and connected.', 'success');
  } catch {
    setStatus('API health check failed. Is the server running?', 'error');
  }
}

themeSelect.addEventListener('change', (event) => setTheme(event.target.value));

tenantPreset.addEventListener('change', (event) => {
  if (event.target.value === 'custom') {
    tenantInput.value = '';
    tenantInput.focus();
    return;
  }
  tenantInput.value = event.target.value;
  fetchProjects();
});

refreshBtn.addEventListener('click', fetchProjects);
healthBtn.addEventListener('click', runHealthCheck);

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const projectName = projectNameInput.value.trim();
  if (!projectName) {
    setStatus('Project name is required.', 'error');
    return;
  }
  await createProject(projectName);
});

fetchProjects();
