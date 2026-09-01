import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Star, ShieldCheck, ArrowRight, Stethoscope } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { StatusBadge } from '../ui/StatusBadge';
import { Avatar, AvatarFallback } from '../ui/Avatar';

const specialties = [
  'All Specialties',
  'Cardiology',
  'Dermatology',
  'General Medicine',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Psychiatry'
];

const featuredDoctors = [
  {
    id: 1,
    name: 'Dr. Anita Patel',
    specialty: 'Dermatologist',
    experience: '12 yrs exp',
    rating: '4.95',
    reviews: 94,
    fee: '₹500',
    available: 'Today, 03:00 PM',
    initials: 'AP',
    location: 'Apollo Clinic, Sector 4',
  },
  {
    id: 2,
    name: 'Dr. Rahul Sharma',
    specialty: 'Cardiologist',
    experience: '15 yrs exp',
    rating: '4.90',
    reviews: 128,
    fee: '₹700',
    available: 'Tomorrow, 10:00 AM',
    initials: 'RS',
    location: 'Metro Heart Institute',
  },
  {
    id: 3,
    name: 'Dr. Vikram Sethi',
    specialty: 'Pediatrician',
    experience: '9 yrs exp',
    rating: '4.88',
    reviews: 82,
    fee: '₹450',
    available: 'Today, 05:30 PM',
    initials: 'VS',
    location: 'CareFlow Child Clinic',
  },
];

export function SearchDoctorSection() {
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <section id="search-doctors" className="py-20 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Stethoscope className="w-3.5 h-3.5" /> Direct Clinical Access
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Find the right specialist, book in seconds.
          </h2>
          <p className="text-base text-slate-600">
            Browse verified medical practitioners with transparent fees, verified ratings, and guaranteed real-time availability.
          </p>
        </div>

        {/* Search Filter Bar */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-slate-50 p-4 border border-slate-200/90 shadow-sm space-y-4">
          <div className="grid sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Doctor name, symptom, or treatment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
              />
            </div>
            <div className="sm:col-span-4 relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                defaultValue="New Delhi / NCR"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
              />
            </div>
            <div className="sm:col-span-2">
              <Button variant="primary" size="lg" className="w-full h-11 justify-center rounded-xl">
                Search
              </Button>
            </div>
          </div>

          {/* Specialty Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none cursor-pointer ${
                  selectedSpecialty === spec
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Preview Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {featuredDoctors.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar size="lg" status="online">
                      <AvatarFallback className="bg-teal-50 text-teal-800 font-bold">
                        {doc.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{doc.name}</h4>
                      <p className="text-xs text-teal-700 font-semibold">{doc.specialty}</p>
                      <p className="text-[11px] text-slate-400">{doc.experience}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100">
                  <div className="flex items-center gap-1 text-slate-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{doc.rating}</span>
                    <span className="text-slate-400">({doc.reviews})</span>
                  </div>
                  <div className="font-semibold text-slate-900">
                    {doc.fee} <span className="font-normal text-slate-400 text-[11px]">/ visit</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Next Slot: {doc.available}</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full justify-center group-hover:border-teal-600 group-hover:text-teal-700">
                View Availability & Book
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
