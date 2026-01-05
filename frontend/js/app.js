/**
 * DevAgenda Main Application
 * Handles all UI interactions and data management
 */

// Global state
let currentProjectId = null;
let currentPage = 'dashboard';
let projects = [];
let repositories = [];

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialize application
 */
async function initializeApp() {
    setupEventListeners();
    setupNavigation();
    loadUserSettings();
    await loadDashboard();
    showPage('dashboard');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
        });
    });

    // Generate user ID on settings page
    const generateBtn = document.getElementById('generate-user-id');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateUserId);
    }
}

/**
 * Setup navigation
 */
function setupNavigation() {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

/**
 * Show specific page
 */
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });

    // Show selected page
    const pageElement = document.getElementById(`${pageName}-page`);
    if (pageElement) {
        pageElement.style.display = 'block';
        currentPage = pageName;
        
        // Load page data
        switch(pageName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'projects':
                loadProjects();
                break;
            case 'reflection':
                loadReflection();
                break;
            case 'reports':
                loadReports();
                break;
            case 'settings':
                loadSettings();
                break;
        }
    }
}

/**
 * Load dashboard data
 */
async function loadDashboard() {
    try {
        // Load projects by status
        const response = await API.projects.getByStatus();
        if (response.success) {
            const data = response.data;
            
            // Update stats
            document.getElementById('stats-en-curso').textContent = data.en_curso?.length || 0;
            document.getElementById('stats-por-hacer').textContent = data.por_hacer?.length || 0;
            document.getElementById('stats-futuros').textContent = data.futuro?.length || 0;
            
            // Load today's commits
            const reflection = await API.reflections.get();
            if (reflection.success) {
                document.getElementById('stats-commits-hoy').textContent = 
                    reflection.data.totalCommits || 0;
            }
            
            // Load recent activity
            loadRecentActivity(data);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Error al cargar el dashboard');
    }
}

/**
 * Load recent activity
 */
function loadRecentActivity(projectsData) {
    const activityDiv = document.getElementById('recent-activity');
    const enCurso = projectsData.en_curso || [];
    
    if (enCurso.length === 0) {
        activityDiv.innerHTML = '<p class="text-muted">No hay proyectos en curso</p>';
        return;
    }
    
    let html = '<div class="list-group">';
    enCurso.slice(0, 5).forEach(project => {
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${escapeHtml(project.name)}</h6>
                        <small class="text-muted">${escapeHtml(project.description || 'Sin descripción')}</small>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="viewProject('${project.id}')">
                        Ver Detalles
                    </button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    activityDiv.innerHTML = html;
}

/**
 * Load projects
 */
async function loadProjects() {
    try {
        const response = await API.projects.getByStatus();
        if (response.success) {
            projects = response.data;
            renderProjects();
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showError('Error al cargar proyectos');
    }
}

/**
 * Render projects by status
 */
function renderProjects() {
    renderProjectList('por-hacer', projects.por_hacer || []);
    renderProjectList('futuros', projects.futuro || []);
    renderProjectList('en-curso', projects.en_curso || []);
    
    // Update badges
    document.getElementById('badge-por-hacer').textContent = projects.por_hacer?.length || 0;
    document.getElementById('badge-futuros').textContent = projects.futuro?.length || 0;
    document.getElementById('badge-en-curso').textContent = projects.en_curso?.length || 0;
}

/**
 * Render project list
 */
function renderProjectList(containerId, projectList) {
    const container = document.getElementById(`projects-${containerId}`);
    
    if (projectList.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-folder-x"></i>
                    <p>No hay proyectos en esta categoría</p>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    projectList.forEach(project => {
        const statusClass = getStatusClass(project.status);
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card project-card" onclick="viewProject('${project.id}')">
                    <div class="card-body">
                        <h5 class="card-title">${escapeHtml(project.name)}</h5>
                        <p class="card-text text-muted">${escapeHtml(project.description || 'Sin descripción')}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge ${statusClass} project-status-badge">
                                ${getStatusLabel(project.status)}
                            </span>
                            ${project.github_repo ? `
                                <small class="text-muted">
                                    <i class="bi bi-github"></i> ${escapeHtml(project.github_repo)}
                                </small>
                            ` : ''}
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); syncProject('${project.id}')">
                                <i class="bi bi-arrow-repeat"></i> Sincronizar
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteProject('${project.id}')">
                                <i class="bi bi-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

/**
 * View project details
 */
async function viewProject(projectId) {
    currentProjectId = projectId;
    
    try {
        const projectResponse = await API.projects.get(projectId);
        if (projectResponse.success) {
            const project = projectResponse.data;
            document.getElementById('project-detail-title').textContent = project.name;
            
            // Load commits
            await loadProjectCommits(projectId);
            
            // Load stats
            await loadProjectStats(projectId);
            
            // Show project detail page
            document.getElementById('projects-page').style.display = 'none';
            document.getElementById('project-detail-page').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading project:', error);
        showError('Error al cargar el proyecto');
    }
}

/**
 * Load project commits
 */
async function loadProjectCommits(projectId) {
    try {
        const response = await API.projects.getCommits(projectId, null, null, 'day');
        if (response.success) {
            renderCommitsByDay(response.data);
        }
    } catch (error) {
        console.error('Error loading commits:', error);
        showError('Error al cargar commits');
    }
}

/**
 * Render commits by day
 */
function renderCommitsByDay(commitsByDay) {
    const container = document.getElementById('commits-by-day');
    
    if (commitsByDay.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-git"></i>
                <p>No hay commits registrados. Sincroniza el proyecto con GitHub.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    commitsByDay.forEach(day => {
        html += `
            <div class="commit-day-header">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${day.displayDate}</h6>
                        <small>${day.commits.length} commit(s)</small>
                    </div>
                    <div>
                        <span class="badge bg-light text-dark">+${day.totalAdditions}</span>
                        <span class="badge bg-light text-dark">-${day.totalDeletions}</span>
                        <span class="badge bg-light text-dark">${day.totalFiles} archivos</span>
                    </div>
                </div>
            </div>
        `;
        
        day.commits.forEach(commit => {
            const commitDate = new Date(commit.commit_date);
            html += `
                <div class="commit-item">
                    <div class="commit-message">${escapeHtml(commit.message.split('\n')[0])}</div>
                    <div class="commit-meta">
                        <i class="bi bi-person"></i> ${escapeHtml(commit.author_name)}
                        <span class="ms-3">
                            <i class="bi bi-clock"></i> ${formatDateTime(commitDate)}
                        </span>
                        <a href="${commit.url}" target="_blank" class="ms-3">
                            <i class="bi bi-link-45deg"></i> Ver en GitHub
                        </a>
                    </div>
                    <div class="commit-stats">
                        ${commit.additions > 0 ? `
                            <span class="stat-badge additions">
                                <i class="bi bi-plus-circle"></i> +${commit.additions}
                            </span>
                        ` : ''}
                        ${commit.deletions > 0 ? `
                            <span class="stat-badge deletions">
                                <i class="bi bi-dash-circle"></i> -${commit.deletions}
                            </span>
                        ` : ''}
                        ${commit.files_changed > 0 ? `
                            <span class="stat-badge files">
                                <i class="bi bi-file-earmark"></i> ${commit.files_changed} archivos
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
        });
    });
    
    container.innerHTML = html;
}

/**
 * Load project stats
 */
async function loadProjectStats(projectId) {
    try {
        const response = await API.projects.getStats(projectId);
        if (response.success) {
            const stats = response.data;
            const container = document.getElementById('project-stats');
            
            container.innerHTML = `
                <div class="mb-3">
                    <strong>Total de Commits:</strong>
                    <div class="h4 text-primary">${stats.totalCommits}</div>
                </div>
                <div class="mb-3">
                    <strong>Líneas Agregadas:</strong>
                    <div class="h5 text-success">+${stats.totalAdditions}</div>
                </div>
                <div class="mb-3">
                    <strong>Líneas Eliminadas:</strong>
                    <div class="h5 text-danger">-${stats.totalDeletions}</div>
                </div>
                <div class="mb-3">
                    <strong>Archivos Modificados:</strong>
                    <div class="h5 text-info">${stats.totalFiles}</div>
                </div>
                ${stats.firstCommit ? `
                    <div class="mb-3">
                        <strong>Primer Commit:</strong>
                        <div class="small text-muted">${formatDate(new Date(stats.firstCommit))}</div>
                    </div>
                ` : ''}
                ${stats.lastCommit ? `
                    <div class="mb-3">
                        <strong>Último Commit:</strong>
                        <div class="small text-muted">${formatDate(new Date(stats.lastCommit))}</div>
                    </div>
                ` : ''}
            `;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load reflection page
 */
async function loadReflection() {
    try {
        const response = await API.reflections.get();
        if (response.success) {
            const data = response.data;
            
            // Set date
            const today = new Date();
            document.getElementById('reflection-date').textContent = formatDate(today);
            
            // Load commits
            renderReflectionCommits(data.commitsByProject || []);
            
            // Load summary
            renderReflectionSummary(data);
            
            // Load existing reflection
            if (data.reflection) {
                document.getElementById('reflection-content').value = data.reflection.content || '';
                document.getElementById('reflection-feeling').value = data.reflection.feeling || '';
            }
        }
    } catch (error) {
        console.error('Error loading reflection:', error);
        showError('Error al cargar la introspección');
    }
}

/**
 * Render reflection commits
 */
function renderReflectionCommits(commitsByProject) {
    const container = document.getElementById('reflection-commits');
    
    if (commitsByProject.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-git"></i>
                <p>No hay commits registrados para hoy</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    commitsByProject.forEach(group => {
        html += `
            <div class="reflection-commits-group">
                <div class="reflection-project-header">
                    <i class="bi bi-folder"></i> ${escapeHtml(group.project?.name || 'Proyecto')}
                </div>
        `;
        
        group.commits.forEach(commit => {
            const commitDate = new Date(commit.commit_date);
            html += `
                <div class="commit-item">
                    <div class="commit-message">${escapeHtml(commit.message.split('\n')[0])}</div>
                    <div class="commit-meta">
                        <i class="bi bi-clock"></i> ${formatDateTime(commitDate)}
                    </div>
                    <div class="commit-stats">
                        ${commit.additions > 0 ? `
                            <span class="stat-badge additions">+${commit.additions}</span>
                        ` : ''}
                        ${commit.deletions > 0 ? `
                            <span class="stat-badge deletions">-${commit.deletions}</span>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

/**
 * Render reflection summary
 */
function renderReflectionSummary(data) {
    const container = document.getElementById('reflection-summary');
    
    container.innerHTML = `
        <div class="mb-3">
            <strong>Total de Commits:</strong>
            <div class="h4 text-primary">${data.totalCommits || 0}</div>
        </div>
        <div class="mb-3">
            <strong>Proyectos Trabajados:</strong>
            <div class="h5 text-info">${data.totalProjects || 0}</div>
        </div>
        ${data.reflection ? `
            <div class="mb-3">
                <strong>Commits Registrados:</strong>
                <div class="small text-muted">${data.reflection.commits_count || 0}</div>
            </div>
        ` : ''}
    `;
}

/**
 * Save reflection
 */
async function saveReflection() {
    try {
        const content = document.getElementById('reflection-content').value;
        const feeling = document.getElementById('reflection-feeling').value;
        const today = new Date().toISOString().split('T')[0];
        
        const response = await API.reflections.update(today, content, feeling);
        if (response.success) {
            showSuccess('Reflexión guardada exitosamente');
        }
    } catch (error) {
        console.error('Error saving reflection:', error);
        showError('Error al guardar la reflexión');
    }
}

/**
 * Load reports
 */
async function loadReports() {
    try {
        const response = await API.reports.getAll();
        if (response.success) {
            renderReports(response.data);
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        showError('Error al cargar reportes');
    }
}

/**
 * Render reports list
 */
function renderReports(reports) {
    const container = document.getElementById('reports-list');
    
    if (reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-file-earmark-text"></i>
                <p>No hay reportes generados. Genera un reporte semanal o mensual.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="list-group">';
    reports.forEach(report => {
        const typeLabel = report.report_type === 'SEMANAL' ? 'Semanal' : 'Mensual';
        const typeClass = report.report_type === 'SEMANAL' ? 'primary' : 'success';
        
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">
                            Reporte ${typeLabel}
                            <span class="badge bg-${typeClass}">${typeLabel}</span>
                        </h6>
                        <small class="text-muted">
                            ${formatDate(new Date(report.start_date))} - ${formatDate(new Date(report.end_date))}
                        </small>
                        <div class="mt-2">
                            <small>
                                <strong>Commits:</strong> ${report.total_commits} | 
                                <strong>Proyectos:</strong> ${report.projects_count}
                            </small>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="viewReport('${report.id}')">
                        <i class="bi bi-eye"></i> Ver Reporte
                    </button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Generate weekly report
 */
async function generateWeeklyReport() {
    try {
        showLoading('Generando reporte semanal...');
        const response = await API.reports.generateWeekly();
        if (response.success) {
            showSuccess('Reporte semanal generado exitosamente');
            await loadReports();
            viewReport(response.data.id);
        }
    } catch (error) {
        console.error('Error generating weekly report:', error);
        showError('Error al generar el reporte semanal');
    } finally {
        hideLoading();
    }
}

/**
 * Generate monthly report
 */
async function generateMonthlyReport() {
    try {
        showLoading('Generando reporte mensual...');
        const response = await API.reports.generateMonthly();
        if (response.success) {
            showSuccess('Reporte mensual generado exitosamente');
            await loadReports();
            viewReport(response.data.id);
        }
    } catch (error) {
        console.error('Error generating monthly report:', error);
        showError('Error al generar el reporte mensual');
    } finally {
        hideLoading();
    }
}

/**
 * View report
 */
async function viewReport(reportId) {
    try {
        const response = await API.reports.get(reportId);
        if (response.success) {
            renderReport(response.data);
            const modal = new bootstrap.Modal(document.getElementById('reportModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error loading report:', error);
        showError('Error al cargar el reporte');
    }
}

/**
 * Render report
 */
function renderReport(report) {
    const container = document.getElementById('report-modal-content');
    const content = report.content || {};
    const stats = content.statistics || {};
    
    const typeLabel = report.report_type === 'SEMANAL' ? 'Semanal' : 'Mensual';
    
    let html = `
        <div class="report-section">
            <div class="report-header">
                <h3>Reporte ${typeLabel} de Trabajo</h3>
                <p class="text-muted mb-0">
                    ${content.period?.startFormatted || formatDate(new Date(report.start_date))} - 
                    ${content.period?.endFormatted || formatDate(new Date(report.end_date))}
                </p>
                <p class="text-muted small">
                    Generado el ${formatDateTime(new Date(content.generatedAt || report.created_at))}
                </p>
            </div>
            
            <div class="report-statistics">
                <div class="report-stat-item">
                    <div class="report-stat-value">${stats.totalCommits || 0}</div>
                    <div class="report-stat-label">Total de Commits</div>
                </div>
                <div class="report-stat-item">
                    <div class="report-stat-value text-success">+${stats.totalAdditions || 0}</div>
                    <div class="report-stat-label">Líneas Agregadas</div>
                </div>
                <div class="report-stat-item">
                    <div class="report-stat-value text-danger">-${stats.totalDeletions || 0}</div>
                    <div class="report-stat-label">Líneas Eliminadas</div>
                </div>
                <div class="report-stat-item">
                    <div class="report-stat-value text-info">${stats.projectsCount || 0}</div>
                    <div class="report-stat-label">Proyectos</div>
                </div>
            </div>
            
            <h4 class="mt-4 mb-3">Proyectos</h4>
    `;
    
    if (stats.projects && stats.projects.length > 0) {
        stats.projects.forEach(project => {
            html += `
                <div class="report-project-item">
                    <h5>${escapeHtml(project.name)}</h5>
                    <p class="text-muted mb-2">
                        <span class="badge bg-secondary">${getStatusLabel(project.status)}</span>
                    </p>
                    <div class="mb-2">
                        <strong>Commits:</strong> ${project.commits} | 
                        <strong>Agregadas:</strong> <span class="text-success">+${project.additions}</span> | 
                        <strong>Eliminadas:</strong> <span class="text-danger">-${project.deletions}</span>
                    </div>
                    ${project.commitsList && project.commitsList.length > 0 ? `
                        <div class="mt-3">
                            <strong>Commits:</strong>
                            <ul class="list-unstyled mt-2">
                    ` : ''}
                    ${project.commitsList?.map(commit => `
                        <li class="mb-1">
                            <code>${commit.sha}</code> - ${escapeHtml(commit.message.split('\n')[0])}
                            <small class="text-muted ms-2">
                                ${formatDate(new Date(commit.date))}
                            </small>
                        </li>
                    `).join('') || ''}
                    ${project.commitsList && project.commitsList.length > 0 ? `
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    } else {
        html += '<p class="text-muted">No hay proyectos en este período</p>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Print report
 */
function printReport() {
    window.print();
}

/**
 * Load settings
 */
function loadSettings() {
    const userId = CONFIG.getUserId();
    document.getElementById('user-id').value = userId;
    
    // Try to load GitHub info
    API.github.getUserInfo().then(response => {
        if (response.success) {
            document.getElementById('github-username').value = response.data.login;
            document.getElementById('github-status').innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle"></i> GitHub conectado como ${response.data.login}
                </div>
            `;
        }
    }).catch(() => {
        // Not connected
    });
}

/**
 * Connect GitHub
 */
async function connectGitHub() {
    try {
        const token = document.getElementById('github-token').value;
        const username = document.getElementById('github-username').value;
        
        if (!token) {
            showError('Por favor ingresa un token de GitHub');
            return;
        }
        
        showLoading('Conectando con GitHub...');
        const response = await API.github.connect(token, username);
        if (response.success) {
            CONFIG.setGitHubToken(token);
            showSuccess('GitHub conectado exitosamente');
            document.getElementById('github-status').innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle"></i> ${response.data.github_username} conectado
                </div>
            `;
            
            // Load repositories for project modal
            await loadRepositories();
        }
    } catch (error) {
        console.error('Error connecting GitHub:', error);
        showError('Error al conectar con GitHub: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Load repositories
 */
async function loadRepositories() {
    try {
        const response = await API.github.getRepositories();
        if (response.success) {
            repositories = response.data;
            const select = document.getElementById('project-repo');
            select.innerHTML = '<option value="">Seleccionar repositorio...</option>';
            repositories.forEach(repo => {
                const option = document.createElement('option');
                option.value = repo.full_name;
                option.textContent = `${repo.name} (${repo.owner})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading repositories:', error);
    }
}

/**
 * Save project
 */
async function saveProject() {
    try {
        const name = document.getElementById('project-name').value;
        const description = document.getElementById('project-description').value;
        const status = document.getElementById('project-status').value;
        const repo = document.getElementById('project-repo').value;
        
        if (!name) {
            showError('El nombre del proyecto es requerido');
            return;
        }
        
        let projectData = {
            name,
            description,
            status
        };
        
        if (repo) {
            const [owner, repoName] = repo.split('/');
            projectData.github_owner = owner;
            projectData.github_repo = repoName;
        }
        
        const response = await API.projects.create(projectData);
        if (response.success) {
            showSuccess('Proyecto creado exitosamente');
            bootstrap.Modal.getInstance(document.getElementById('projectModal')).hide();
            document.getElementById('project-form').reset();
            await loadProjects();
            showPage('projects');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        showError('Error al crear el proyecto');
    }
}

/**
 * Sync project
 */
async function syncProject(projectId) {
    try {
        showLoading('Sincronizando proyecto...');
        const response = await API.projects.sync(projectId);
        if (response.success) {
            showSuccess(`Sincronizado: ${response.commitsCount} commits`);
            if (currentProjectId === projectId) {
                await loadProjectCommits(projectId);
                await loadProjectStats(projectId);
            }
        }
    } catch (error) {
        console.error('Error syncing project:', error);
        showError('Error al sincronizar el proyecto');
    } finally {
        hideLoading();
    }
}

/**
 * Sync current project
 */
async function syncCurrentProject() {
    if (currentProjectId) {
        await syncProject(currentProjectId);
    }
}

/**
 * Sync all projects
 */
async function syncAllProjects() {
    try {
        showLoading('Sincronizando todos los proyectos...');
        const response = await API.projects.getByStatus();
        if (response.success) {
            const allProjects = [
                ...(response.data.en_curso || []),
                ...(response.data.por_hacer || []),
                ...(response.data.futuro || [])
            ];
            
            let synced = 0;
            for (const project of allProjects) {
                if (project.github_repo) {
                    try {
                        await API.projects.sync(project.id);
                        synced++;
                    } catch (error) {
                        console.error(`Error syncing ${project.name}:`, error);
                    }
                }
            }
            
            showSuccess(`${synced} proyectos sincronizados`);
            await loadDashboard();
        }
    } catch (error) {
        console.error('Error syncing all projects:', error);
        showError('Error al sincronizar proyectos');
    } finally {
        hideLoading();
    }
}

/**
 * Delete project
 */
async function deleteProject(projectId) {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) {
        return;
    }
    
    try {
        const response = await API.projects.delete(projectId);
        if (response.success) {
            showSuccess('Proyecto eliminado exitosamente');
            await loadProjects();
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        showError('Error al eliminar el proyecto');
    }
}

/**
 * Generate user ID
 */
function generateUserId() {
    const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    CONFIG.setUserId(newId);
    document.getElementById('user-id').value = newId;
    API.userId = newId;
    showSuccess('Nuevo ID de usuario generado');
}

/**
 * Load user settings
 */
function loadUserSettings() {
    const userId = CONFIG.getUserId();
    API.userId = userId;
}

// Utility functions

function getStatusLabel(status) {
    const labels = {
        'POR_HACER': 'Por Hacer',
        'FUTURO': 'Futuro',
        'EN_CURSO': 'En Curso',
        'COMPLETADO': 'Completado'
    };
    return labels[status] || status;
}

function getStatusClass(status) {
    const classes = {
        'POR_HACER': 'bg-secondary',
        'FUTURO': 'bg-info',
        'EN_CURSO': 'bg-primary',
        'COMPLETADO': 'bg-success'
    };
    return classes[status] || 'bg-secondary';
}

function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

function formatDateTime(date) {
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    showAlert('danger', message);
}

function showSuccess(message) {
    showAlert('success', message);
}

function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function showLoading(message) {
    // Simple loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
    loadingDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loadingDiv.style.zIndex = '9999';
    loadingDiv.innerHTML = `
        <div class="bg-white p-4 rounded">
            <div class="spinner-border text-primary me-2" role="status"></div>
            ${message || 'Cargando...'}
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

