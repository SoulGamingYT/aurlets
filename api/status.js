app.get('/api/status', (req, res) => {
  res.json({ online: true });
});
