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

module.exports = router;
