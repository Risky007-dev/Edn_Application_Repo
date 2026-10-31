const express = require('express');
const router = express.Router();
const path = require('path');

// GET /services/popcorn-maths
router.get('/popcorn-maths', (req, res) => {
  res.sendFile(path.join(__dirname, '../../MyWebApp/src/main/webapp/services/popcorn-maths.html'));
});

module.exports = router;
