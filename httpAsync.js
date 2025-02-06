const http = require('http');
const fs = require('fs').promises;

const FILE_PATH = 'Node-data.json';

// Function to read data asynchronously
const readData = async () => {
  try {
    const rawData = await fs.readFile(FILE_PATH, 'utf8');
    return rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    return [];
  }
};

// Function to write data asynchronously
const writeData = async (data) => {
  await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let data = await readData();
  const urlParts = req.url.split('/');
  const itemId = urlParts[2];

  if (req.method === 'GET' && req.url === '/') {
    res.end(JSON.stringify(data));
  } else if (req.method === 'GET' && itemId) {
    const item = data.find(item => item.id === parseInt(itemId));
    if (item) {
      res.end(JSON.stringify(item));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Item not found' }));
    }
  } else if (req.method === 'POST' && req.url === '/') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      const newItem = JSON.parse(body);
      newItem.id = data.length + 1;
      data.push(newItem);
      await writeData(data);
      res.statusCode = 201;
      res.end(JSON.stringify(newItem));
    });
  } else if (req.method === 'PUT' && itemId) { // Full update
    const itemIndex = data.findIndex(item => item.id === parseInt(itemId));
    if (itemIndex !== -1) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        const updatedItem = JSON.parse(body);
        data[itemIndex] = { id: parseInt(itemId), ...updatedItem }; // Full replacement
        await writeData(data);
        res.end(JSON.stringify(data[itemIndex]));
      });
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Item not found' }));
    }
  } else if (req.method === 'PATCH' && itemId) { // Partial update
    const itemIndex = data.findIndex(item => item.id === parseInt(itemId));
    if (itemIndex !== -1) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        const updatedFields = JSON.parse(body);
        data[itemIndex] = { ...data[itemIndex], ...updatedFields }; // Merge changes
        await writeData(data);
        res.end(JSON.stringify(data[itemIndex]));
      });
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Item not found' }));
    }
  } else if (req.method === 'DELETE' && itemId) {
    const itemIndex = data.findIndex(item => item.id === parseInt(itemId));
    if (itemIndex !== -1) {
      data.splice(itemIndex, 1);
      await writeData(data);
      res.statusCode = 204;
      res.end();
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Item not found' }));
    }
  } else {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
