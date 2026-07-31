import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { listInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../api/inventory';

const EMPTY_FORM = { product_name: '', category: '', quantity: '', price: '' };

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    listInventory()
      .then((data) => {
        setItems(data);
        setError('');
      })
      .catch(() => setError('Could not load inventory from the backend.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      product_name: item.product_name || '',
      category: item.category || '',
      quantity: item.quantity ?? '',
      price: item.price ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = {
      product_name: form.product_name,
      category: form.category,
      quantity: Number(form.quantity) || 0,
      price: Number(form.price) || 0,
    };
    try {
      if (editingId) {
        await updateInventoryItem(editingId, payload);
      } else {
        await addInventoryItem(payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save this item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await deleteInventoryItem(id);
      load();
    } catch (err) {
      setError(
        err.response?.status === 403
          ? "You don't have permission to delete inventory items (Administrator or Business Owner only)."
          : 'Could not delete this item.'
      );
    }
  };

  return (
    <AppLayout eyebrow="Stock" title="Inventory" subtitle="Track and update stock across your catalog.">
      {error && <div className="mm-alert-banner">{error}</div>}

      <div className="mm-panel">
        <div className="mm-panel-title">{editingId ? 'Edit item' : 'Add stock record'}</div>
        <div className="mm-panel-sub">
          {editingId ? `Updating item #${editingId} — ` : ''}Sent to{' '}
          {editingId ? `PUT /inventory/${editingId}` : 'POST /inventory'}
        </div>
        <form className="mm-inline-form" onSubmit={handleSubmit}>
          <div className="mm-field">
            <label htmlFor="product_name">Product</label>
            <input id="product_name" value={form.product_name} onChange={update('product_name')} required />
          </div>
          <div className="mm-field">
            <label htmlFor="category">Category</label>
            <input id="category" value={form.category} onChange={update('category')} required />
          </div>
          <div className="mm-field">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={update('quantity')}
              required
            />
          </div>
          <div className="mm-field">
            <label htmlFor="price">Price</label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={update('price')}
              required
            />
          </div>
          <button className="mm-btn" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add item'}
          </button>
          {editingId && (
            <button className="mm-btn secondary" type="button" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="mm-panel">
        <div className="mm-panel-title">Current inventory</div>
        <div className="mm-panel-sub">From GET /inventory</div>

        {loading ? (
          <p className="mm-loading-tag">Loading inventory…</p>
        ) : items.length === 0 ? (
          <div className="mm-empty-state">No inventory records yet. Add your first one above.</div>
        ) : (
          <div className="mm-table-wrap">
            <table className="mm-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.category}</td>
                    <td className="mm-mono">{item.quantity}</td>
                    <td className="mm-mono">{item.price}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button className="mm-btn secondary" type="button" onClick={() => startEdit(item)}>
                        Edit
                      </button>
                      <button className="mm-btn danger" type="button" onClick={() => handleDelete(item.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
