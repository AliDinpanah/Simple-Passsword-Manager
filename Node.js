const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors package
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

app.use(bodyParser.json());

// In-memory storage for passwords (replace with a database in production)
let passwords = [];

// Save password endpoint (POST request)
app.post('/api/save-password', (req, res) => {
  const { siteName, username, password } = req.body;
  passwords.push({ id: passwords.length, siteName, username, password }); // Add an ID for deletion
  console.log('Password saved:', { siteName, username, password }); // Debugging line
  res.status(200).send('Password saved!');
});

// Get passwords endpoint (GET request)
app.get('/api/get-passwords', (req, res) => {
  res.status(200).json(passwords);
});

// Delete password endpoint (DELETE request)
app.delete('/api/delete-password/:id', (req, res) => {
  const id = req.params.id;
  passwords = passwords.filter((entry) => entry.id !== parseInt(id));
  res.status(200).send('Password deleted!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});