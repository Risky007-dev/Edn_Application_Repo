const express = require('express');
const router = express.Router();
const path = require('path');

// GET /services/traditional-tutoring
router.get('/traditional-tutoring', (req, res) => {
  res.sendFile(path.join(__dirname, '../../MyWebApp/src/main/webapp/services/traditional-tutoring.html'));
});

module.exports = router;
