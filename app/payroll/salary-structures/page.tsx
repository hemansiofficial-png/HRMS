'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  DollarSign,
  Percent,
  Building,
  Users,
  Info,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

interface SalaryStructure {
  id: string;
  name: string;
  role?: string;
  department?: string;
  level?: string;
  location?: string;
  components: {
    basic: number;
    hra: number;
    special: number;
    conveyance: number;
    medical: number;
    other: number;
  };
  allowances: {
    conveyance: number;
    medical: number;
    special: number;
  };
  deductions: {
    pf: number;
    esi: number;
    professionalTax: number;
  };
  variablePay: boolean;
  variablePercentage: number;
  annualCTC: number;
  isDefault: boolean;
  createdAt: string;
}

const DEFAULT_COMPONENTS = {
  basic: 40,
  hra: 20,
  special: 30,
  conveyance: 5,
  medical: 5,
  other: 0,
};

const DEFAULT_ALLOWANCES = {
  conveyance: 1600,
  medical: 1500,
  special: 5000,
};

const DEFAULT_DEDUCTIONS = {
  pf: 12,
  esi: 0.75,
  professionalTax: 200,
};

export default function SalaryStructuresPage() {
  const { data: session } = useSession();
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: '',
    level: 'Mid',
    location: '',
    basic: 40,
    hra: 20,
    special: 30,
    conveyance: 5,
    medical: 5,
    other: 0,
    conveyanceAllowance: 1600,
    medicalAllowance: 1500,
    specialAllowance: 5000,
    pfPercentage: 12,
    esiPercentage: 0.75,
    professionalTax: 200,
    variablePay: false,
    variablePercentage: 10,
    annualCTC: 1200000,
    isDefault: false,
  });

  useEffect(() => {
    if (session) {
      fetchStructures();
    }
  }, [session]);

  async function fetchStructures() {
    try {
      setLoading(true);
      const response = await fetch('/api/payroll/salary-structure');
      const result = await response.json();
      if (result.success) {
        setStructures(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch salary structures:', error);
      setError('Failed to fetch salary structures');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate percentages add up to 100
    const totalPercentage = formData.basic + formData.hra + formData.special + 
      formData.conveyance + formData.medical + formData.other;
    
    if (Math.abs(totalPercentage - 100) > 0.1) {
      setError(`Component percentages must add up to 100%. Current total: ${totalPercentage}%`);
      return;
    }

    try {
      const url = editingStructure
        ? `/api/payroll/salary-structure?id=${editingStructure.id}`
        : '/api/payroll/salary-structure';
      const method = editingStructure ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          components: {
            basic: formData.basic,
            hra: formData.hra,
            special: formData.special,
            conveyance: formData.conveyance,
            medical: formData.medical,
            other: formData.other,
          },
          allowances: {
            conveyance: formData.conveyanceAllowance,
            medical: formData.medicalAllowance,
            special: formData.specialAllowance,
          },
          deductions: {
            pf: formData.pfPercentage,
            esi: formData.esiPercentage,
            professionalTax: formData.professionalTax,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(editingStructure ? 'Structure updated successfully' : 'Structure created successfully');
        setShowForm(false);
        setEditingStructure(null);
        fetchStructures();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to save salary structure');
      }
    } catch (error) {
      console.error('Error saving salary structure:', error);
      setError('Failed to save salary structure');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this salary structure?')) return;

    try {
      const response = await fetch(`/api/payroll/salary-structure?id=${id}`, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        setSuccess('Salary structure deleted successfully');
        fetchStructures();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to delete salary structure');
      }
    } catch (error) {
      console.error('Error deleting salary structure:', error);
      setError('Failed to delete salary structure');
    }
  }

  function handleEdit(structure: SalaryStructure) {
    setEditingStructure(structure);
    setFormData({
      name: structure.name,
      role: structure.role || '',
      department: structure.department || '',
      level: structure.level || 'Mid',
      location: structure.location || '',
      basic: structure.components.basic,
      hra: structure.components.hra,
      special: structure.components.special,
      conveyance: structure.components.conveyance,
      medical: structure.components.medical,
      other: structure.components.other,
      conveyanceAllowance: structure.allowances.conveyance,
      medicalAllowance: structure.allowances.medical,
      specialAllowance: structure.allowances.special,
      pfPercentage: structure.deductions.pf,
      esiPercentage: structure.deductions.esi,
      professionalTax: structure.deductions.professionalTax,
      variablePay: structure.variablePay,
      variablePercentage: structure.variablePercentage,
      annualCTC: structure.annualCTC,
      isDefault: structure.isDefault,
    });
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingStructure(null);
    setFormData({
      name: '',
      role: '',
      department: '',
      level: 'Mid',
      location: '',
      basic: 40,
      hra: 20,
      special: 30,
      conveyance: 5,
      medical: 5,
      other: 0,
      conveyanceAllowance: 1600,
      medicalAllowance: 1500,
      specialAllowance: 5000,
      pfPercentage: 12,
      esiPercentage: 0.75,
      professionalTax: 200,
      variablePay: false,
      variablePercentage: 10,
      annualCTC: 1200000,
      isDefault: false,
    });
    setError('');
    setSuccess('');
  }

  const calculateAmount = (percentage: number) => {
    return (formData.annualCTC * percentage) / 100;
  };

  const filteredStructures = structures.filter((structure) => {
    return (
      structure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structure.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structure.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <AppShell title="Salary Structures">
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <Info size={20} />
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Salary Structures</h2>
            <p className="text-text-secondary text-sm mt-1">
              Configure salary components and structures for different roles
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-keka-primary text-white">
            <Plus size={20} className="mr-2" />
            Add Structure
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="relative max-w-md">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search structures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-10 border border-border-light rounded-lg bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
            />
          </div>
        </Card>

        {/* Structure List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            <div className="text-center py-12 text-text-secondary col-span-full">Loading structures...</div>
          ) : filteredStructures.length === 0 ? (
            <Card className="p-12 text-center col-span-full">
              <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Salary Structures</h3>
              <p className="text-text-secondary mb-4">
                Get started by creating your first salary structure template
              </p>
              <Button onClick={() => setShowForm(true)} className="bg-keka-primary text-white">
                <Plus size={20} className="mr-2" />
                Create Structure
              </Button>
            </Card>
          ) : (
            filteredStructures.map((structure) => (
              <Card key={structure.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary">{structure.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {structure.role && (
                        <Badge variant="neutral" className="text-xs">
                          <Users size={12} className="mr-1" />
                          {structure.role}
                        </Badge>
                      )}
                      {structure.department && (
                        <Badge variant="neutral" className="text-xs">
                          <Building size={12} className="mr-1" />
                          {structure.department}
                        </Badge>
                      )}
                      {structure.isDefault && (
                        <Badge variant="neutral" className="text-xs bg-green-50 text-green-700">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(structure)}
                      className="text-gray-600 hover:text-keka-primary"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(structure.id)}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Annual CTC</span>
                    <span className="font-semibold text-text-primary">
                      ₹{structure.annualCTC.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-border-light">
                    <h4 className="text-xs font-medium text-text-secondary mb-2">Component Breakdown</h4>
                    <div className="space-y-1">
                      {Object.entries(structure.components).map(([key, value]) => (
                        value > 0 && (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-text-secondary capitalize">{key}</span>
                            <span className="text-text-primary font-medium">
                              {value}%
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  {structure.variablePay && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">Variable Pay</span>
                      <span className="text-text-primary font-medium">
                        {structure.variablePercentage}%
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-text-primary">
                    {editingStructure ? 'Edit Salary Structure' : 'Create Salary Structure'}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X size={20} />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Structure Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Software Engineer Standard"
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Annual CTC (₹)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.annualCTC}
                        onChange={(e) => setFormData({ ...formData, annualCTC: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Role (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="e.g., ENGINEER"
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Department (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="e.g., IT"
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Level
                      </label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                      >
                        <option value="Junior">Junior</option>
                        <option value="Mid">Mid</option>
                        <option value="Senior">Senior</option>
                        <option value="Lead">Lead</option>
                        <option value="Manager">Manager</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Location (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Bangalore"
                        className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary"
                      />
                    </div>
                  </div>

                  {/* Components Breakdown */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
                      <Percent size={18} />
                      Salary Components (% of CTC)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { key: 'basic', label: 'Basic', default: 40 },
                        { key: 'hra', label: 'HRA', default: 20 },
                        { key: 'special', label: 'Special Allowance', default: 30 },
                        { key: 'conveyance', label: 'Conveyance', default: 5 },
                        { key: 'medical', label: 'Medical', default: 5 },
                        { key: 'other', label: 'Other', default: 0 },
                      ].map((component) => (
                        <div key={component.key}>
                          <label className="block text-xs text-text-secondary mb-1">
                            {component.label}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={formData[component.key as keyof typeof formData] as number}
                              onChange={(e) => setFormData({ ...formData, [component.key]: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2 pr-8 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary text-sm"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">%</span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1">
                            ₹{calculateAmount(formData[component.key as keyof typeof formData] as number).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border-light flex justify-between items-center">
                      <span className="text-sm font-medium text-text-primary">Total</span>
                      <span className={`text-sm font-bold ${
                        formData.basic + formData.hra + formData.special + formData.conveyance + formData.medical + formData.other === 100
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {formData.basic + formData.hra + formData.special + formData.conveyance + formData.medical + formData.other}%
                      </span>
                    </div>
                  </div>

                  {/* Allowances */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
                      <DollarSign size={18} />
                      Fixed Allowances (Monthly)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">
                          Conveyance Allowance
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.conveyanceAllowance}
                          onChange={(e) => setFormData({ ...formData, conveyanceAllowance: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">
                          Medical Allowance
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.medicalAllowance}
                          onChange={(e) => setFormData({ ...formData, medicalAllowance: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">
                          Special Allowance
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.specialAllowance}
                          onChange={(e) => setFormData({ ...formData, specialAllowance: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-text-primary mb-4">Statutory Deductions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">
                          PF Percentage (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.pfPercentage}
                          onChange={(e) => setFormData({ ...formData, pfPercentage: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">
                          ESI Percentage (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.esiPercentage}
                          onChange={(e) => setFormData({ ...formData, esiPercentage: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">
                          Professional Tax (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.professionalTax}
                          onChange={(e) => setFormData({ ...formData, professionalTax: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Variable Pay */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <label className="text-sm font-medium text-text-primary">Variable Pay</label>
                        <p className="text-xs text-text-secondary mt-1">
                          Include performance-based variable pay
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.variablePay}
                        onChange={(e) => setFormData({ ...formData, variablePay: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-keka-primary focus:ring-keka-primary"
                      />
                    </div>

                    {formData.variablePay && (
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">
                          Variable Percentage (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.variablePercentage}
                          onChange={(e) => setFormData({ ...formData, variablePercentage: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-keka-primary/20 focus:border-keka-primary text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Default Structure */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-text-primary">Set as Default</label>
                        <p className="text-xs text-text-secondary mt-1">
                          This structure will be used as default for new employees
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-keka-primary focus:ring-keka-primary"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button type="submit" className="flex-1 bg-keka-primary text-white">
                      <Save size={20} className="mr-2" />
                      {editingStructure ? 'Update Structure' : 'Create Structure'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      <X size={20} className="mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
