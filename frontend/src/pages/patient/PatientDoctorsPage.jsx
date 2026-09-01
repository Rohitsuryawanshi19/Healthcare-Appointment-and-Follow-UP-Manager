import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ShieldCheck,
  Star,
  Award,
  Calendar,
  Clock,
  IndianRupee,
  ArrowRight,
  UserCheck,
  Stethoscope,
  Building,
} from 'lucide-react';
import { patientService } from '../../services/patientService';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageTransition } from '../../components/ui/PageTransition';
import { containerVariants, itemVariants } from '../../lib/animations';

const specializationsList = [
  'All',
  'Cardiology',
  'Dermatology',
  'General Medicine',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Psychiatry',
];

export default function PatientDoctorsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialization') || 'All');
  const [minExp, setMinExp] = useState(searchParams.get('minExp') || '0');
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const loadDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedSpecialty && selectedSpecialty !== 'All') params.specialization = selectedSpecialty;
      if (Number(minExp) > 0) params.minExperience = minExp;
      if (verifiedOnly) params.verifiedOnly = 'true';
      if (searchQuery) params.search = searchQuery;

      const res = await patientService.getDoctors(params);
      setDoctors(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to search doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [selectedSpecialty, minExp, verifiedOnly, searchQuery]);

  return (
    <PageTransition className="space-y-6 text-left max-w-6xl mx-auto">
      <PageHeader
        title="Find & Consult Medical Specialists"
        description="Search certified physicians by clinical specialty, verified state council credentials, and practice experience."
        badge={<Badge variant="primary">{doctors.length} Doctors Available</Badge>}
      />

      {/* Filter and Search Bar */}
      <Card className="p-5 space-y-4">
        <div className="grid sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by doctor name, specialty, or condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white cursor-pointer"
            >
              {specializationsList.map((s) => (
                <option key={s} value={s}>
                  Specialty: {s}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={minExp}
              onChange={(e) => setMinExp(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white cursor-pointer"
            >
              <option value="0">Any Experience</option>
              <option value="5">5+ Years Exp</option>
              <option value="10">10+ Years Exp</option>
              <option value="15">15+ Years Exp</option>
            </select>
          </div>
        </div>

        {/* Verification Filter Pill */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <span className="font-semibold text-slate-700">Verified Medical Specialists Only</span>
          </label>
          <span className="text-slate-400 text-[11px]">Guaranteed State Council Audited</span>
        </div>
      </Card>

      {/* Main Doctor Grid */}
      {loading ? (
        <LoadingState label="Searching verified clinical network..." />
      ) : error ? (
        <ErrorState title="Doctor Directory Unavailable" description={error} onRetry={loadDoctors} />
      ) : doctors.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No medical specialists found matching your search criteria. Try broadening your filters.
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {doctors.map((doc) => (
            <motion.div key={doc._id} variants={itemVariants}>
              <Card
                hoverable
                className="p-6 flex flex-col justify-between space-y-5 h-full"
              >
                <div className="space-y-4">
                  {/* Header: Profile, Name, Verified Badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <Avatar size="lg">
                        <AvatarFallback className="bg-teal-50 text-teal-800 font-bold text-base">
                          {doc.userId?.name?.substring(0, 2).toUpperCase() || 'DR'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-base">
                          <span>{doc.userId?.name}</span>
                          {doc.verificationStatus === 'verified' && (
                            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" title="Verified Practitioner" />
                          )}
                        </div>
                        <p className="text-xs text-teal-700 font-semibold">{doc.specialization}</p>
                        <p className="text-[11px] text-slate-400">{doc.qualification}</p>
                      </div>
                    </div>
                  </div>

                  {/* Registration & Exp Summary */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Experience:</span>
                      <span className="font-semibold text-slate-800">{doc.experience} Years</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Consultation Fee:</span>
                      <span className="font-semibold text-teal-700">₹{doc.consultationFee}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Council:</span>
                      <span className="truncate max-w-[140px] text-slate-700">{doc.registrationCouncil}</span>
                    </div>
                  </div>

                  {/* Available Slot Indicator */}
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>Next available slots open today</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-center"
                    onClick={() => navigate(`/patient/doctors/${doc._id}`)}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 justify-center shadow-xs"
                    onClick={() => navigate(`/patient/book/${doc._id}`)}
                  >
                    Book Slot
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageTransition>
  );
}
