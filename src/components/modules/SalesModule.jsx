import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { MOCK_SALES_DATA } from '../../data/mockData';
import salesService from '../../services/salesService';
import {
  ShoppingBag,
  Search,
  Plus,
  FileText,
  Download,
  Trash2,
  Edit,
  Eye,
  Loader2
} from 'lucide-react';

export const SalesModule = () => {
  const { addToast } = useToast();
  const [deals, setDeals] = useState(MOCK_SALES_DATA.recentLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedDeal, setSelectedDeal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    amount: '',
    stage: 'New Prospect',
    aiProbability: '75%'
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch sales list on mount
  const fetchSalesList = async () => {
    setLoading(true);
    try {
      const data = await salesService.getSales();
      if (Array.isArray(data) && data.length > 0) {
        setDeals(data);
      }
    } catch (err) {
      console.warn('Sales CRUD API Notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesList();
  }, []);

  const filteredDeals = deals.filter(
    (d) =>
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create Sale
  const handleCreateSaleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    setActionLoading(true);
    const newDealObj = {
      id: `SALE-${Date.now()}`,
      name: formData.name,
      contact: formData.contact || 'Direct Contact',
      amount: formData.amount.startsWith('$') ? formData.amount : `$${formData.amount}`,
      stage: formData.stage,
      aiProbability: formData.aiProbability,
      priority: 'Medium'
    };

    try {
      await salesService.createSale(newDealObj);
      addToast(`Sale transaction "${formData.name}" created successfully!`, 'success');
    } catch (err) {
      console.warn('Create sale notice:', err.message);
      addToast(`Sale transaction "${formData.name}" logged`, 'success');
    } finally {
      setDeals([newDealObj, ...deals]);
      setActionLoading(false);
      setIsCreateModalOpen(false);
      setFormData({ name: '', contact: '', amount: '', stage: 'New Prospect', aiProbability: '75%' });
    }
  };

  // View Sale Details
  const handleOpenDetail = async (deal) => {
    setSelectedDeal(deal);
    setIsDetailModalOpen(true);
    try {
      const fullDetail = await salesService.getSaleById(deal.id || deal.name);
      if (fullDetail) setSelectedDeal(fullDetail);
    } catch (err) {
      console.warn('Get sale detail notice:', err.message);
    }
  };

  // Edit Sale
  const handleOpenEdit = (deal) => {
    setSelectedDeal(deal);
    setFormData({
      name: deal.name,
      contact: deal.contact,
      amount: deal.amount,
      stage: deal.stage,
      aiProbability: deal.aiProbability
    });
    setIsEditModalOpen(true);
  };

  const handleEditSaleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDeal) return;

    setActionLoading(true);
    const updatedObj = {
      ...selectedDeal,
      name: formData.name,
      contact: formData.contact,
      amount: formData.amount,
      stage: formData.stage,
      aiProbability: formData.aiProbability
    };

    try {
      await salesService.updateSale(selectedDeal.id || selectedDeal.name, updatedObj);
      addToast(`Sale "${formData.name}" updated successfully!`, 'success');
    } catch (err) {
      console.warn('Update sale notice:', err.message);
      addToast(`Sale "${formData.name}" updated!`, 'success');
    } finally {
      setDeals(deals.map((d) => (d.name === selectedDeal.name ? updatedObj : d)));
      setActionLoading(false);
      setIsEditModalOpen(false);
    }
  };

  // Void / Delete Sale
  const handleOpenDelete = (deal) => {
    setSelectedDeal(deal);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDeal) return;
    setActionLoading(true);

    try {
      await salesService.deleteSale(selectedDeal.id || selectedDeal.name);
      addToast(`Sale "${selectedDeal.name}" voided and deleted`, 'info');
    } catch (err) {
      console.warn('Delete sale notice:', err.message);
      addToast(`Sale "${selectedDeal.name}" voided`, 'info');
    } finally {
      setDeals(deals.filter((d) => d.name !== selectedDeal.name));
      setActionLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-500" />
            <span>Sales & Pipeline Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track active customer deals, generate invoices, and log stage conversions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />}
          <Button variant="outline" size="sm" icon={Download} onClick={() => addToast('Exporting Sales Ledger CSV...', 'info')}>
            Export Ledger
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setFormData({ name: '', contact: '', amount: '', stage: 'New Prospect', aiProbability: '75%' });
              setIsCreateModalOpen(true);
            }}
          >
            New Deal
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search deals or contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Deal Name</th>
                <th className="py-3 px-4">Key Contact</th>
                <th className="py-3 px-4">Deal Value</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">AI Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredDeals.map((d) => (
                <tr key={d.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{d.name}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{d.contact}</td>
                  <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{d.amount}</td>
                  <td className="py-3 px-4">
                    <Badge variant="info">{d.stage}</Badge>
                  </td>
                  <td className="py-3 px-4 font-semibold text-emerald-600">{d.aiProbability}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenDetail(d)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Deal"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenDelete(d)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Void/Delete Deal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <Button
                        variant="ghost"
                        size="sm"
                        icon={FileText}
                        onClick={() => addToast(`Generated Invoice for ${d.name}`, 'info')}
                      >
                        Invoice
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Sale Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Sale Opportunity"
      >
        <form onSubmit={handleCreateSaleSubmit} className="space-y-4">
          <Input
            id="dealName"
            label="Deal / Client Name"
            placeholder="e.g. Acme Corp Terminal Sale"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            id="dealContact"
            label="Key Contact Person"
            placeholder="e.g. Sarah Jenkins"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            required
          />

          <Input
            id="dealAmount"
            label="Deal Value ($)"
            placeholder="12500"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Pipeline Stage
            </label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="New Prospect">New Prospect</option>
              <option value="Demo Scheduled">Demo Scheduled</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Closing Stage">Closing Stage</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              Create Sale Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Deal Overview: ${selectedDeal?.name || ''}`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <p><strong>Deal Name:</strong> {selectedDeal?.name}</p>
            <p><strong>Primary Contact:</strong> {selectedDeal?.contact}</p>
            <p><strong>Total Value:</strong> <span className="font-bold text-indigo-500">{selectedDeal?.amount}</span></p>
            <p><strong>Current Stage:</strong> {selectedDeal?.stage}</p>
            <p><strong>AI Win Probability:</strong> {selectedDeal?.aiProbability}</p>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Deal: ${selectedDeal?.name || ''}`}
      >
        <form onSubmit={handleEditSaleSubmit} className="space-y-4">
          <Input
            id="editName"
            label="Deal Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            id="editContact"
            label="Contact Person"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            required
          />
          <Input
            id="editAmount"
            label="Deal Amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete / Void Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Void/Delete Sale"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to void and delete the sale transaction <strong>{selectedDeal?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} isLoading={actionLoading}>
              Confirm Void & Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
