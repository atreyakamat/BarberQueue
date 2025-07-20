console.log('Starting minimal server...');

const express = require('express');
console.log('Express loaded');

const app = express();
console.log('Express app created');

const PORT = 5000;

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
