import { Router } from 'express';
import { getProject, saveProject } from '../db.js';

const router = Router();

// GET /api/project – return the stored project JSON
router.get('/project', (req, res) => {
  const project = getProject();
  if (!project) {
    return res.status(404).json({ error: 'No project found' });
  }
  res.json(project);
});

// PUT /api/project – replace the full project JSON
router.put('/project', (req, res) => {
  const data = req.body;
  if (!data || !data.projekt || !data.gewerke || !data.angebote) {
    return res.status(400).json({ error: 'Invalid project data: missing required fields' });
  }
  saveProject(data);
  res.json({ ok: true });
});

export default router;
