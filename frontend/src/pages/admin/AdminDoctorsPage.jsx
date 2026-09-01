import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  UserCheck,
  Search,
  Plus,
  Filter,
  ShieldCheck,
  AlertCircle,
  XCircle,
  CheckCircle2,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Phone,
  Mail,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../../components/ui/Dropdown';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '../../components/ui/AlertDialog';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export default function AdminDoctorsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorToDeactivate, setSelectedDoctorToDeactivate] = useState(null);

  const statusFilter = searchParams.get('status') || 'all';

  const loadDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await adminService.getDoctors(params);
      setDoctors(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch doctor directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [statusFilter, searchQuery]);

  const handleStatusChange = async (doctorId, newStatus) => {
    try {
      await adminService.updateDoctorVerification(doctorId, newStatus);
      toast({
        title: 'Status Updated',
        description: `Doctor marked as ${newStatus}.`,
        variant: newStatus === 'verified' ? 'success' : 'warning',
      });
      loadDoctors();
    } catch (err) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Error updating status.',
        variant: 'error',
      });
    }
  };

  const handleDeactivate = async () => {
    if (!selectedDoctorToDeactivate) return;
    try {
      await adminService.updateDoctorVerification(selectedDoctorToDeactivate._id, 'rejected');
      toast({
        title: 'Doctor Deactivated',
        description: 'Doctor profile set to rejected/deactivated state.',
        variant: 'warning',
      });
      setSelectedDoctorToDeactivate(null);
      loadDoctors();
    } catch (err) {
      toast({
        title: 'Action Failed',
        description: err.message || 'Error deactivating doctor.',
        variant: 'error',
      });
    }
  };

  return (
    <PageTransition className="space-y-6 text-left">
      <PageHeader
        title="Doctor Directory & Credentialing"
        description="Provision practitioner accounts, review state medical council credentials, and manage consultation privileges."
        badge={<Badge variant="primary">{doctors.length} Doctors</Badge>}
        actions={
          <Link to="/admin/doctors/create">
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Create Doctor Profile
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Doctors' },
              { id: 'verified', label: 'Verified Only' },
              { id: 'pending', label: 'Pending Review' },
              { id: 'rejected', label: 'Rejected / Inactive' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'all') {
                    searchParams.delete('status');
                  } else {
                    searchParams.set('status', tab.id);
                  }
                  setSearchParams(searchParams);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, council, reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>
        </div>
      </Card>

      {/* Main Table */}
      {loading ? (
        <LoadingState label="Loading practitioners..." />
      ) : error ? (
        <ErrorState title="Error Loading Doctors" description={error} onRetry={loadDoctors} />
      ) : doctors.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No doctors found matching the selected filter criteria.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3.5 px-4">Doctor & Qualification</th>
                  <th className="py-3.5 px-4">Specialization</th>
                  <th className="py-3.5 px-4">Registration & Council</th>
                  <th className="py-3.5 px-4">Experience & Fee</th>
                  <th className="py-3.5 px-4">Verification Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Doctor Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar size="md">
                          <AvatarFallback className="bg-teal-50 text-teal-800 font-bold">
                            {doc.userId?.name?.substring(0, 2).toUpperCase() || 'DR'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <Link to={`/admin/doctors/${doc._id}`} className="hover:text-teal-700">
                              {doc.userId?.name || 'Unnamed Doctor'}
                            </Link>
                            {doc.verificationStatus === 'verified' && (
                              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" title="Verified Practitioner" />
                            )}
                            {doc.demoData && (
                              <Badge variant="secondary" size="sm" className="text-[10px] py-0 px-1.5 font-normal">
                                Synthetic Demo
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{doc.qualification}</div>
                          <div className="text-[10px] text-slate-400">{doc.userId?.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Specialization */}
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {doc.specialization}
                    </td>

                    {/* Registration No & Council */}
                    <td className="py-4 px-4">
                      <div className="font-mono text-slate-800 font-semibold">{doc.registrationNumber}</div>
                      <div className="text-[11px] text-slate-500">{doc.registrationCouncil}</div>
                    </td>

                    {/* Experience & Fee */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-800">{doc.experience} yrs exp</div>
                      <div className="text-[11px] text-teal-700 font-semibold">₹{doc.consultationFee} / visit</div>
                    </td>

                    {/* Verification Status Badge */}
                    <td className="py-4 px-4">
                      {doc.verificationStatus === 'verified' ? (
                        <Badge variant="success" size="sm" dot>
                          Verified
                        </Badge>
                      ) : doc.verificationStatus === 'pending' ? (
                        <Badge variant="warning" size="sm" dot>
                          Pending Review
                        </Badge>
                      ) : (
                        <Badge variant="error" size="sm" dot>
                          Rejected
                        </Badge>
                      )}
                    </td>

                    {/* Actions Dropdown */}
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Doctor Controls</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate(`/admin/doctors/${doc._id}`)}>
                            <Eye className="h-3.5 w-3.5 text-slate-500" /> View Full Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {doc.verificationStatus !== 'verified' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(doc._id, 'verified')}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Mark as Verified
                            </DropdownMenuItem>
                          )}
                          {doc.verificationStatus !== 'rejected' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(doc._id, 'rejected')}>
                              <XCircle className="h-3.5 w-3.5 text-amber-600" /> Mark as Rejected
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            destructive
                            onClick={() => setSelectedDoctorToDeactivate(doc)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Deactivate Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Deactivate Doctor Confirmation AlertDialog */}
      <AlertDialog
        open={Boolean(selectedDoctorToDeactivate)}
        onOpenChange={(open) => !open && setSelectedDoctorToDeactivate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Doctor Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{' '}
              <strong>{selectedDoctorToDeactivate?.userId?.name}</strong>? Their public appointment slots will be immediately unlisted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeactivate}>
              Deactivate Doctor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
