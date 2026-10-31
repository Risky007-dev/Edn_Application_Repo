const express = require('express');
const router = express.Router();
const path = require('path');

// GET /services/specialist-support
router.get('/specialist-support', (req, res) => {
  res.sendFile(path.join(__dirname, '../../MyWebApp/src/main/webapp/services/specialist-support.html'));
});

module.exports = router;
