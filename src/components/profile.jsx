import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable Profile component
 * - Expects a data object shaped like mockProfile
 * - Defensive: provides defaults to avoid runtime destructure errors
 * - Clean, accessible, responsive layout using TailwindCSS
 */
export default function Profile({ data = {} }) {
  const {
    name = 'Unknown',
    business = '',
    status = [],
    stats = {},
    personal = {},
    verification = {},
    skills = { categories: [], skillsList: [] },
    jobs = []
  } = data;

  const {
    totalRevenue = 0,
    totalJobs = 0,
    activeJobs = 0,
    completionRate = 0,
    averageRating = 0,
    disputes = 0
  } = stats;

  const {
    joined,
    gender = '—',
    email = '—',
    category = '—',
    location = '—',
    dob
  } = personal;

  const {
    submitted,
    reviewedBy = '—',
    document = '—'
  } = verification;

  const formatCurrency = (v) =>
    (v || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const smallStat = (label, value) => (
    <div className="flex flex-col items-center px-3 py-2">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-lg font-semibold text-primary">{value}</span>
    </div>
  );

  const initials = String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const safeDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  return (
    <div className="profile-card p-6 max-w-5xl mx-auto">
      <div className="md:flex md:items-start md:justify-between gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-medium text-primary">
            {initials || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary leading-tight">{name}</h1>
            <p className="text-sm text-muted">{business}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.isArray(status) && status.length > 0
                ? status.map((s) => (
                    <span key={s} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-primary border">
                      {s}
                    </span>
                  ))
                : <span className="text-xs px-2 py-1 rounded-full bg-gray-50 text-muted border">No status</span>
              }
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 md:mt-0 flex gap-2 items-center">
          <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-4">
            {smallStat('Revenue', formatCurrency(totalRevenue))}
            <div className="h-8 w-px bg-gray-200 mx-2" />
            {smallStat('Jobs', totalJobs)}
            <div className="h-8 w-px bg-gray-200 mx-2" />
            {smallStat('Completion', `${completionRate}%`)}
            <div className="h-8 w-px bg-gray-200 mx-2" />
            {smallStat('Rating', averageRating)}
          </div>
        </div>
      </div>

      <hr className="my-6 border-gray-100" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Personal & verification */}
        <div className="col-span-1 space-y-4">
          <section>
            <h3 className="text-sm font-semibold text-primary mb-2">Personal Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Date Joined</span><span>{safeDate(joined)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Gender</span><span>{gender}</span></div>
              <div className="flex justify-between"><span className="text-muted">Email</span><span>{email}</span></div>
              <div className="flex justify-between"><span className="text-muted">Category</span><span>{category}</span></div>
              <div className="flex justify-between"><span className="text-muted">Location</span><span>{location}</span></div>
              <div className="flex justify-between"><span className="text-muted">Date of Birth</span><span>{safeDate(dob)}</span></div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-primary mb-2">Verification</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted">Submitted</span><span>{safeDate(submitted)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Reviewed By</span><span>{reviewedBy}</span></div>
              <div className="flex justify-between"><span className="text-muted">Document</span><span className="text-accent font-medium">{document}</span></div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-primary mb-2">Skills & Expertise</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
              <div>
                <div className="text-muted text-xs">Categories</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {skills.categories && skills.categories.length > 0
                    ? skills.categories.map((c) => (
                        <span key={c} className="text-xs bg-white border rounded px-2 py-1">{c}</span>
                      ))
                    : <span className="text-xs text-muted">No categories</span>
                  }
                </div>
              </div>
              <div>
                <div className="text-muted text-xs mt-2">Skills</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {skills.skillsList && skills.skillsList.length > 0
                    ? skills.skillsList.map((s, i) => (
                        <span key={`${s}-${i}`} className="text-xs bg-white border rounded px-2 py-1">{s}</span>
                      ))
                    : <span className="text-xs text-muted">No skills listed</span>
                  }
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right column: Stats and job history */}
        <div className="md:col-span-2 space-y-4">
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Performance Summary</h3>
              <div className="text-sm text-muted">Disputes: <span className="font-medium text-primary">{disputes}</span></div>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border rounded-lg p-3 text-center">
                <div className="text-xs text-muted">Active Jobs</div>
                <div className="text-lg font-semibold text-primary">{activeJobs}</div>
              </div>
              <div className="bg-white border rounded-lg p-3 text-center">
                <div className="text-xs text-muted">Avg Rating</div>
                <div className="text-lg font-semibold text-primary">{averageRating}</div>
              </div>
              <div className="bg-white border rounded-lg p-3 text-center">
                <div className="text-xs text-muted">Completion</div>
                <div className="text-lg font-semibold text-primary">{completionRate}%</div>
              </div>
              <div className="bg-white border rounded-lg p-3 text-center">
                <div className="text-xs text-muted">Total Revenue</div>
                <div className="text-lg font-semibold text-primary">{formatCurrency(totalRevenue)}</div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-primary mb-3">Job History</h3>
            <div className="divide-y divide-gray-100 rounded-lg border">
              {Array.isArray(jobs) && jobs.length > 0 ? jobs.map((job) => (
                <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
                  <div>
                    <div className="font-medium text-primary">{job.title || 'Untitled job'}</div>
                    <div className="text-xs text-muted">{job.client || 'Unknown client'} • {safeDate(job.date)}</div>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center gap-4">
                    <div className="text-sm text-muted">Status</div>
                    <div className={`text-sm font-medium ${job.status === 'Completed' ? 'text-success' : 'text-muted'}`}>{job.status || '—'}</div>
                    <div className="text-sm text-primary font-semibold">{formatCurrency(job.price)}</div>
                  </div>
                </div>
              )) : (
                <div className="p-4 text-sm text-muted">No job history available</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

Profile.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.string,
    business: PropTypes.string,
    status: PropTypes.arrayOf(PropTypes.string),
    stats: PropTypes.shape({
      totalRevenue: PropTypes.number,
      totalJobs: PropTypes.number,
      activeJobs: PropTypes.number,
      completionRate: PropTypes.number,
      averageRating: PropTypes.number,
      disputes: PropTypes.number
    }),
    personal: PropTypes.shape({
      joined: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      gender: PropTypes.string,
      email: PropTypes.string,
      category: PropTypes.string,
      location: PropTypes.string,
      dob: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
    }),
    verification: PropTypes.shape({
      submitted: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      reviewedBy: PropTypes.string,
      document: PropTypes.string
    }),
    skills: PropTypes.shape({
      categories: PropTypes.arrayOf(PropTypes.string),
      skillsList: PropTypes.arrayOf(PropTypes.string)
    }),
    jobs: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      status: PropTypes.string,
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      price: PropTypes.number,
      client: PropTypes.string
    }))
  })
};

Profile.defaultProps = {
  data: {}
};
