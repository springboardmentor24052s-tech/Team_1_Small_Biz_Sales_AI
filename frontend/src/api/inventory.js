import client from './client';

// GET /inventory -> list of { id, product_name, category, quantity, price }
export async function listInventory() {
  const { data } = await client.get('/inventory');
  return Array.isArray(data) ? data : [];
}

// POST /inventory expects { product_name, category, quantity, price }
export async function addInventoryItem(payload) {
  const { data } = await client.post('/inventory', payload);
  return data;
}

// PUT /inventory/{id} expects the same shape as create (full replace)
export async function updateInventoryItem(id, payload) {
  const { data } = await client.put(`/inventory/${id}`, payload);
  return data;
}

// DELETE /inventory/{id} — backend restricts this to roles 1 (Administrator)
// and 2 (Business Owner); other roles will get a 403 from the server.
export async function deleteInventoryItem(id) {
  const { data } = await client.delete(`/inventory/${id}`);
  return data;
}
