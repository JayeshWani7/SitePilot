const express = require('express');
const { pool } = require('./db');
const { authenticate } = require('./middleware');

const router = express.Router();

// Role rank for access control
const ROLE_RANK = { viewer: 1, developer: 2, editor: 3, administrator: 4, owner: 5 };

// Helper: get the caller's role in a tenant
async function callerRole(userId, tenantId) {
    const { rows } = await pool.query(
        'SELECT role FROM tenant_members WHERE user_id = $1 AND tenant_id = $2',
        [userId, tenantId]
    );
    return rows.length ? rows[0].role : null;
}

function hasAccess(userRole, minRole) {
    return (ROLE_RANK[userRole] ?? 0) >= (ROLE_RANK[minRole] ?? 0);
}

// ══════════════════════════════════════════════════════════════
//  PROJECTS
// ══════════════════════════════════════════════════════════════

// GET /builder/projects — list accessible projects for the caller's tenant
router.get('/projects', authenticate, async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId;
        if (!tenantId) return res.status(400).json({ error: 'No active tenant' });

        const role = await callerRole(req.user.id, tenantId);
        if (!role) return res.status(403).json({ error: 'Not a member of this tenant' });

        const { rows } = await pool.query(
            `SELECT p.*, u.first_name, u.last_name,
              (SELECT COUNT(*) FROM builder_pages bp WHERE bp.project_id = p.id) AS page_count
             FROM builder_projects p
             LEFT JOIN users u ON u.id = p.created_by
             WHERE p.tenant_id = $1
             ORDER BY p.updated_at DESC`,
            [tenantId]
        );

        // Filter by min_role
        const visible = rows.filter(p => hasAccess(role, p.min_role));
        res.json(visible);
    } catch (err) {
        console.error('Builder list projects error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /builder/projects — create project (editor+)
router.post('/projects', authenticate, async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId;
        const role = await callerRole(req.user.id, tenantId);
        if (!role || ROLE_RANK[role] < ROLE_RANK.editor) {
            return res.status(403).json({ error: 'Editor or above required to create projects' });
        }

        const { name, description = '', min_role = 'viewer' } = req.body;
        if (!name) return res.status(400).json({ error: 'Project name is required' });

        const { rows } = await pool.query(
            `INSERT INTO builder_projects (tenant_id, name, description, min_role, created_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [tenantId, name, description, min_role, req.user.id]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Builder create project error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /builder/projects/:id — update project (admin+)
router.put('/projects/:id', authenticate, async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId;
        const role = await callerRole(req.user.id, tenantId);
        if (!role || ROLE_RANK[role] < ROLE_RANK.administrator) {
            return res.status(403).json({ error: 'Administrator or above required' });
        }

        const { name, description, min_role } = req.body;
        const { rows } = await pool.query(
            `UPDATE builder_projects
             SET name        = COALESCE($1, name),
                 description = COALESCE($2, description),
                 min_role    = COALESCE($3, min_role),
                 updated_at  = now()
             WHERE id = $4 AND tenant_id = $5
             RETURNING *`,
            [name, description, min_role, req.params.id, tenantId]
        );
        if (!rows.length) return res.status(404).json({ error: 'Project not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('Builder update project error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /builder/projects/:id — delete project (admin+)
router.delete('/projects/:id', authenticate, async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId;
        const role = await callerRole(req.user.id, tenantId);
        if (!role || ROLE_RANK[role] < ROLE_RANK.administrator) {
            return res.status(403).json({ error: 'Administrator or above required' });
        }
        const { rowCount } = await pool.query(
            'DELETE FROM builder_projects WHERE id = $1 AND tenant_id = $2',
            [req.params.id, tenantId]
        );
        if (!rowCount) return res.status(404).json({ error: 'Project not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('Builder delete project error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /builder/projects/:id/pages — list role-filtered pages for a project
router.get('/projects/:id/pages', authenticate, async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId;
        const role = await callerRole(req.user.id, tenantId);
        if (!role) return res.status(403).json({ error: 'Not a member' });

        const { rows } = await pool.query(
            `SELECT id, name, route, min_role, current_version, created_at, updated_at
             FROM builder_pages
             WHERE project_id = $1
             ORDER BY route ASC`,
            [req.params.id]
        );
        const visible = rows.filter(p => hasAccess(role, p.min_role));
        res.json(visible);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /builder/projects/:id/compile — compile all pages to HTML bundle
router.get('/projects/:id/compile', authenticate, async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId;
        const role = await callerRole(req.user.id, tenantId);
        if (!role) return res.status(403).json({ error: 'Not a member' });

        const { rows: project } = await pool.query(
            'SELECT * FROM builder_projects WHERE id = $1 AND tenant_id = $2',
            [req.params.id, tenantId]
        );
        if (!project.length) return res.status(404).json({ error: 'Project not found' });

        const { rows: pages } = await pool.query(
            `SELECT name, route, elements FROM builder_pages
             WHERE project_id = $1 ORDER BY route ASC`,
            [req.params.id]
        );

        // Simple HTML serialiser
        function elToHtml(el) {
            if (!el) return '';
            const children = (el.children || []).map(elToHtml).join('');
            const s = el.styles || {};
            const styleStr = Object.entries(s)
                .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
                .join(';');
            const style = styleStr ? ` style="${styleStr}"` : '';
            const text = el.content ? el.content : '';

            switch (el.type) {
                case 'text': return `<p${style}>${text}${children}</p>`;
                case 'heading': return `<h2${style}>${text}${children}</h2>`;
                case 'button': return `<button${style}>${text}${children}</button>`;
                case 'image': return `<img src="${el.src || ''}" alt="${el.alt || ''}"${style} />`;
                case 'video': return `<video src="${el.src || ''}" controls${style}></video>`;
                case 'divider': return `<hr${style} />`;
                case 'spacer': return `<div${style}></div>`;
                case 'container': return `<div${style}>${children}</div>`;
                case 'section': return `<section${style}>${children}</section>`;
                case 'hero': return `<section${style}><div class="hero-inner">${children}</div></section>`;
                case 'navbar': return `<nav${style}>${children}</nav>`;
                case 'footer': return `<footer${style}>${children}</footer>`;
                case 'grid': return `<div${style}>${children}</div>`;
                default: return `<div${style}>${text}${children}</div>`;
            }
        }

        function wrapHtml(pageName, body, route) {
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName} — ${project[0].name}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    button { cursor: pointer; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
        }

        const compiled = pages.map(p => ({
            route: p.route,
            name: p.name,
            html: wrapHtml(p.name, (p.elements || []).map(elToHtml).join('\n'), p.route),
        }));

        res.json({
            project: project[0].name,
            pages: compiled,
        });
    } catch (err) {
        console.error('Builder compile error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
//  PAGES (updated to support project_id, route, min_role)
// ══════════════════════════════════════════════════════════════

// GET /builder/pages — list user's pages (tenant-scoped, role-filtered)
router.get('/pages', authenticate, async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId;
        const role = tenantId ? await callerRole(req.user.id, tenantId) : null;

        const { rows } = await pool.query(
            `SELECT id, name, route, min_role, project_id, current_version, created_at, updated_at
             FROM builder_pages
             WHERE user_id = $1
             ORDER BY updated_at DESC`,
            [req.user.id]
        );
        const visible = role ? rows.filter(p => hasAccess(role, p.min_role)) : rows;
        res.json(visible);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /builder/pages — create page (accepts project_id, route, min_role)
router.post('/pages', authenticate, async (req, res) => {
    try {
        const { name = 'Untitled Page', elements = [], project_id = null, route = '/', min_role = 'viewer' } = req.body;
        const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId || null;

        const { rows } = await pool.query(
            `INSERT INTO builder_pages (user_id, tenant_id, project_id, name, elements, route, min_role, current_version)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
             RETURNING id, name, route, min_role, project_id, current_version, created_at, updated_at`,
            [req.user.id, tenantId, project_id, name, JSON.stringify(elements), route, min_role]
        );
        const page = rows[0];

        await pool.query(
            `INSERT INTO builder_page_versions (page_id, version_number, elements, message)
             VALUES ($1, 1, $2, 'Initial save')`,
            [page.id, JSON.stringify(elements)]
        );
        res.status(201).json(page);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /builder/pages/:id
// Any tenant member with sufficient role can load a page (not just the creator)
router.get('/pages/:id', authenticate, async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || null;
        const { rows } = await pool.query(
            `SELECT id, name, elements, route, min_role, project_id, user_id, current_version, created_at, updated_at
             FROM builder_pages WHERE id = $1`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Page not found' });
        const page = rows[0];

        // Allow if creator OR tenant member with sufficient role
        const isCreator = page.user_id === req.user.id;
        let hasRoleAccess = false;
        if (!isCreator && tenantId) {
            const role = await callerRole(req.user.id, tenantId);
            hasRoleAccess = role ? hasAccess(role, page.min_role) : false;
        }
        if (!isCreator && !hasRoleAccess) return res.status(403).json({ error: 'Access denied' });

        res.json(page);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /builder/pages/:id
router.put('/pages/:id', authenticate, async (req, res) => {
    try {
        const { name, elements, message = '', route, min_role } = req.body;
        const tenantId = req.headers['x-tenant-id'] || null;

        const { rows: existing } = await pool.query(
            'SELECT id, current_version, user_id, min_role FROM builder_pages WHERE id = $1',
            [req.params.id]
        );
        if (!existing.length) return res.status(404).json({ error: 'Page not found' });

        const page = existing[0];
        const isCreator = page.user_id === req.user.id;
        let hasRoleAccess = false;
        if (!isCreator && tenantId) {
            const role = await callerRole(req.user.id, tenantId);
            hasRoleAccess = role ? hasAccess(role, page.min_role) : false;
        }
        if (!isCreator && !hasRoleAccess) return res.status(403).json({ error: 'Access denied: insufficient role to edit this page' });

        const nextVersion = page.current_version + 1;
        const updateFields = [];
        const values = [];
        let idx = 1;

        if (name !== undefined) { updateFields.push(`name = $${idx++}`); values.push(name); }
        if (route !== undefined) { updateFields.push(`route = $${idx++}`); values.push(route); }
        if (min_role !== undefined) { updateFields.push(`min_role = $${idx++}`); values.push(min_role); }
        if (elements !== undefined) {
            updateFields.push(`elements = $${idx++}`); values.push(JSON.stringify(elements));
            updateFields.push(`current_version = $${idx++}`); values.push(nextVersion);
        }
        updateFields.push(`updated_at = now()`);
        values.push(req.params.id);

        const { rows } = await pool.query(
            `UPDATE builder_pages SET ${updateFields.join(', ')} WHERE id = $${idx}
             RETURNING id, name, route, min_role, current_version, updated_at`,
            values
        );

        if (elements !== undefined) {
            await pool.query(
                `INSERT INTO builder_page_versions (page_id, version_number, elements, message)
                 VALUES ($1, $2, $3, $4)`,
                [req.params.id, nextVersion, JSON.stringify(elements), message || `Version ${nextVersion}`]
            );
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /builder/pages/:id
router.delete('/pages/:id', authenticate, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM builder_pages WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (!rowCount) return res.status(404).json({ error: 'Page not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /builder/pages/:id/versions
router.get('/pages/:id/versions', authenticate, async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || null;
        const { rows: pageRows } = await pool.query(
            'SELECT id, user_id, min_role FROM builder_pages WHERE id = $1',
            [req.params.id]
        );
        if (!pageRows.length) return res.status(404).json({ error: 'Page not found' });
        const page = pageRows[0];
        const isCreator = page.user_id === req.user.id;
        let hasRoleAccess = false;
        if (!isCreator && tenantId) {
            const role = await callerRole(req.user.id, tenantId);
            hasRoleAccess = role ? hasAccess(role, page.min_role) : false;
        }
        if (!isCreator && !hasRoleAccess) return res.status(403).json({ error: 'Access denied' });
        const { rows } = await pool.query(
            `SELECT id, version_number, message, created_at FROM builder_page_versions
             WHERE page_id = $1 ORDER BY version_number DESC`,
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /builder/pages/:id/restore/:versionId
router.post('/pages/:id/restore/:versionId', authenticate, async (req, res) => {
    try {
        const { rows: page } = await pool.query(
            'SELECT id, current_version FROM builder_pages WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (!page.length) return res.status(404).json({ error: 'Page not found' });

        const { rows: version } = await pool.query(
            'SELECT elements, version_number FROM builder_page_versions WHERE id = $1 AND page_id = $2',
            [req.params.versionId, req.params.id]
        );
        if (!version.length) return res.status(404).json({ error: 'Version not found' });

        const nextVersion = page[0].current_version + 1;
        await pool.query(
            `UPDATE builder_pages SET elements = $1, current_version = $2, updated_at = now() WHERE id = $3`,
            [JSON.stringify(version[0].elements), nextVersion, req.params.id]
        );
        await pool.query(
            `INSERT INTO builder_page_versions (page_id, version_number, elements, message)
             VALUES ($1, $2, $3, $4)`,
            [req.params.id, nextVersion, JSON.stringify(version[0].elements),
            `Restored from version ${version[0].version_number}`]
        );
        res.json({ success: true, version: nextVersion, elements: version[0].elements });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
//  DEPLOYMENTS
// ══════════════════════════════════════════════════════════════

// GET /builder/projects/:id/deployments — list all deployment versions
router.get('/projects/:id/deployments', authenticate, async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || null;
        if (!tenantId) return res.status(400).json({ error: 'No active tenant' });
        const role = await callerRole(req.user.id, tenantId);
        if (!role) return res.status(403).json({ error: 'Not a member of this tenant' });

        const { rows } = await pool.query(
            `SELECT d.id, d.subdomain, d.version_number, d.is_live, d.deployed_at,
                    u.first_name, u.last_name, u.email,
                    jsonb_array_length(d.pages) AS page_count
             FROM builder_deployments d
             LEFT JOIN users u ON u.id = d.deployed_by
             WHERE d.project_id = $1 AND d.tenant_id = $2
             ORDER BY d.version_number DESC`,
            [req.params.id, tenantId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /builder/projects/:id/deploy — create new deployment snapshot (developer+)
router.post('/projects/:id/deploy', authenticate, async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId;
        if (!tenantId) return res.status(400).json({ error: 'No active tenant' });

        const role = await callerRole(req.user.id, tenantId);
        if (!role || ROLE_RANK[role] < ROLE_RANK.developer) {
            return res.status(403).json({ error: 'Developer or above required to deploy' });
        }

        // Validate / resolve subdomain
        let { subdomain } = req.body;
        if (!subdomain) {
            // Re-deploying: use previous subdomain for this project if set
            const { rows: prev } = await pool.query(
                'SELECT subdomain FROM builder_deployments WHERE project_id = $1 ORDER BY version_number DESC LIMIT 1',
                [req.params.id]
            );
            subdomain = prev.length ? prev[0].subdomain : null;
        }
        if (!subdomain) return res.status(400).json({ error: 'subdomain is required for the first deployment' });

        // Sanitise: lowercase, alphanumeric + hyphens only
        subdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');
        if (!subdomain) return res.status(400).json({ error: 'Invalid subdomain' });

        // Check subdomain is not already claimed by ANOTHER project
        const { rows: conflict } = await pool.query(
            'SELECT project_id FROM builder_deployments WHERE subdomain = $1 AND project_id != $2 LIMIT 1',
            [subdomain, req.params.id]
        );
        if (conflict.length) return res.status(409).json({ error: `Subdomain "${subdomain}" is already in use` });

        // Fetch all pages for this project
        const { rows: pages } = await pool.query(
            'SELECT name, route, elements FROM builder_pages WHERE project_id = $1 ORDER BY route ASC',
            [req.params.id]
        );

        // Fetch project for HTML title
        const { rows: proj } = await pool.query('SELECT name FROM builder_projects WHERE id = $1', [req.params.id]);
        const projectName = proj.length ? proj[0].name : 'Website';

        // Compile pages → HTML
        function elToHtml(el) {
            if (!el) return '';
            const children = (el.children || []).map(elToHtml).join('');
            const s = el.styles || {};
            const styleStr = Object.entries(s).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(';');
            const style = styleStr ? ` style="${styleStr}"` : '';
            const text = el.content ? el.content : '';
            const attrs = el.attrs ? Object.entries(el.attrs).map(([k, v]) => ` ${k}="${v}"`).join('') : '';
            switch (el.tag) {
                case 'img': return `<img${style}${attrs} />`;
                case 'hr': return `<hr${style} />`;
                case 'br': return `<br />`;
                case 'iframe': return `<iframe${style}${attrs}></iframe>`;
                default: return `<${el.tag}${style}${attrs}>${text}${children}</${el.tag}>`;
            }
        }

        const baseUrl = `/sites/${subdomain}`;
        const navLinks = pages.map(p => {
            const href = baseUrl + (p.route === '/' ? '/' : p.route);
            return `<a href="${href}">${p.name}</a>`;
        }).join('\n        ');

        const compiledPages = pages.map(p => {
            const body = (p.elements || []).map(elToHtml).join('\n');
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.name} — ${projectName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    img { max-width: 100%; }
    button { cursor: pointer; }
    .sp-site-nav { display: flex; gap: 16px; padding: 12px 24px; background: #fff; border-bottom: 1px solid #e5e7eb; }
    .sp-site-nav a { text-decoration: none; color: #374151; font-weight: 500; }
    .sp-site-nav a:hover { color: #6366f1; }
  </style>
</head>
<body>
  <nav class="sp-site-nav">
    ${navLinks}
  </nav>
  ${body}
</body>
</html>`;
            return { route: p.route, name: p.name, html };
        });

        // Get next version number for this project
        const { rows: versionRow } = await pool.query(
            'SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM builder_deployments WHERE project_id = $1',
            [req.params.id]
        );
        const nextVersion = versionRow[0].next;

        // Mark all previous deployments for this project as not live
        await pool.query(
            'UPDATE builder_deployments SET is_live = false WHERE project_id = $1',
            [req.params.id]
        );

        // Insert new deployment (is_live = true)
        const { rows: deployment } = await pool.query(
            `INSERT INTO builder_deployments (project_id, tenant_id, subdomain, version_number, is_live, pages, deployed_by)
             VALUES ($1, $2, $3, $4, true, $5, $6) RETURNING *`,
            [req.params.id, tenantId, subdomain, nextVersion, JSON.stringify(compiledPages), req.user.id]
        );

        res.status(201).json({
            ...deployment[0],
            url: `/sites/${subdomain}`,
            page_count: compiledPages.length,
        });
    } catch (err) {
        console.error('Deploy error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /builder/deployments/:id/activate — promote a version to live (developer+)
router.post('/deployments/:id/activate', authenticate, async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId;
        if (!tenantId) return res.status(400).json({ error: 'No active tenant' });

        const role = await callerRole(req.user.id, tenantId);
        if (!role || ROLE_RANK[role] < ROLE_RANK.developer) {
            return res.status(403).json({ error: 'Developer or above required to activate deployments' });
        }

        // Fetch the target deployment and verify it belongs to this tenant
        const { rows: target } = await pool.query(
            'SELECT id, project_id FROM builder_deployments WHERE id = $1 AND tenant_id = $2',
            [req.params.id, tenantId]
        );
        if (!target.length) return res.status(404).json({ error: 'Deployment not found' });

        const projectId = target[0].project_id;

        // Deactivate all other versions for this project
        await pool.query(
            'UPDATE builder_deployments SET is_live = false WHERE project_id = $1',
            [projectId]
        );

        // Activate the target
        const { rows: updated } = await pool.query(
            'UPDATE builder_deployments SET is_live = true WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        res.json({ ...updated[0], url: `/sites/${updated[0].subdomain}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
//  PUBLIC SITE SERVING  /sites/:subdomain/*
//  (No auth — public facing)
// ══════════════════════════════════════════════════════════════

router.get('/site/:subdomain', serveSite);
router.get('/site/:subdomain/*', serveSite);

async function serveSite(req, res) {
    try {
        const { subdomain } = req.params;
        // Grab the live deployment
        const { rows } = await pool.query(
            'SELECT pages FROM builder_deployments WHERE subdomain = $1 AND is_live = true LIMIT 1',
            [subdomain]
        );
        if (!rows.length) {
            return res.status(404).send(`
                <!DOCTYPE html><html><body style="font-family:system-ui;text-align:center;padding:80px">
                <h2>Site not found</h2>
                <p>No live deployment found for <code>${subdomain}</code>.</p>
                </body></html>`);
        }

        const pages = rows[0].pages || [];
        // Determine the requested route
        const rawPath = req.params[0] ? '/' + req.params[0] : '/';
        const route = rawPath === '' ? '/' : rawPath;

        const page = pages.find(p => p.route === route)
            || pages.find(p => p.route === '/')   // fallback to homepage
            || pages[0];

        if (!page) {
            return res.status(404).send(`
                <!DOCTYPE html><html><body style="font-family:system-ui;text-align:center;padding:80px">
                <h2>Page not found</h2>
                <p>Route <code>${route}</code> doesn't exist in this site.</p>
                </body></html>`);
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(page.html);
    } catch (err) {
        res.status(500).send('Internal error: ' + err.message);
    }
}

module.exports = router;
