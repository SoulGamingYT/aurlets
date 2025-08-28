import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const updatesPath = path.join(process.cwd(), 'updates.json');
  const updates = JSON.parse(fs.readFileSync(updatesPath, 'utf8'));
  res.json({ updates });
}
