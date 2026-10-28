const express = require('express');
const router = express.Router();
const path = require('path');

// GET /services/concierge
router.get('/concierge', (req, res) => {
  res.sendFile(path.join(__dirname, '../../MyWebApp/src/main/webapp/services/concierge.html'));
});

module.exports = router;
