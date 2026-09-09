import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Calendar, Cpu, Sparkles, BookOpen, Users, Clock, MapPin, Download, Save, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import './AdminTimetableGenerator.css';

export const AdminTimetableGenerator = () => {
  const [department, setDepartment] = useState('Computer Science and Engineering');
  const [semester, setSemester] = useState(4);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [selectedSections, setSelectedSections] = useState(['A', 'B']);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const [timetableId, setTimetableId] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [qualityScore, setQualityScore] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  
  const departments = [
    'Computer Science and Engineering',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Information Technology'
  ];

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const allSections = ['A', 'B', 'C'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  const getPeriodTimes = (p) => {
    const slots = {
      1: '08:30 - 09:20',
      2: '09:20 - 10:10',
      3: '10:25 - 11:15',
      4: '11:15 - 12:05',
      5: '12:50 - 13:40',
      6: '13:40 - 14:30',
      7: '14:30 - 15:20'
    };
    return slots[p] || '09:00 - 10:00';
  };

  const handleSectionToggle = (sect) => {
    if (selectedSections.includes(sect)) {
      if (selectedSections.length > 1) {
        setSelectedSections(selectedSections.filter(s => s !== sect));
      } else {
        toast.error('Select at least one section');
      }
    } else {
      setSelectedSections([...selectedSections, sect]);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSchedules([]);
    setTimetableId(null);
    setQualityScore(null);
    setConflicts([]);
    
    try {
      const payload = {
        department,
        semester: parseInt(semester),
        academic_year: academicYear,
        sections: selectedSections
      };
      
      const response = await api.post('/timetable/generate', payload);
      const data = response.data;
      
      setTimetableId(data.timetable_id);
      setSchedules(data.schedules || []);
      setQualityScore(data.quality_score);
      setConflicts(data.conflicts || []);
      
      if (data.schedules && data.schedules.length > 0) {
        setActiveTab(data.schedules[0].section);
      }
      
      toast.success('Conflict-free timetable generated successfully!');
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.detail || 'Generation failed. Check constraints and leaves.';
      toast.error(errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!timetableId) return;
    setIsPublishing(true);
    try {
      await api.post('/timetable/publish', { timetable_id: timetableId });
      toast.success('Timetable has been published and set to active!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to publish timetable');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!timetableId) return;
    if (!window.confirm('Are you sure you want to discard this draft and reset?')) return;
    
    setIsRegenerating(true);
    try {
      await api.delete(`/timetable/regenerate?timetable_id=${timetableId}`);
      setSchedules([]);
      setTimetableId(null);
      setQualityScore(null);
      setConflicts([]);
      toast.success('Draft cleared. Ready to regenerate.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to clear draft timetable');
    } finally {
      setIsRegenerating(false);
    }
  };

  const getCellContent = (sectSchedule, day, period) => {
    if (!sectSchedule) return null;
    return sectSchedule.entries.find(e => e.day === day && e.period === period);
  };

  const handleExportCSV = () => {
    if (schedules.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Section,Day,Period,Start Time,End Time,Subject,Faculty,Classroom,Type\n";
    
    schedules.forEach(sect => {
      sect.entries.forEach(e => {
        csvContent += `"${sect.section}","${e.day}","${e.period}","${e.start_time}","${e.end_time}","${e.subject}","${e.faculty}","${e.room}","${e.is_lab ? 'LAB' : 'THEORY'}"\n`;
      });
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Timetable_${department.replace(/\s+/g, '_')}_Sem_${semester}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV export completed!');
  };

  // Group allocations for faculty workload analytics
  const getFacultyWorkloads = () => {
    const workloads = {};
    schedules.forEach(sect => {
      sect.entries.forEach(e => {
        if (e.faculty && e.faculty !== 'N/A') {
          workloads[e.faculty] = (workloads[e.faculty] || 0) + 1;
        }
      });
    });
    return Object.entries(workloads).map(([name, hours]) => ({ name, hours }));
  };

  // Group allocations for room utilization analytics
  const getRoomUtilizations = () => {
    const rooms = {};
    schedules.forEach(sect => {
      sect.entries.forEach(e => {
        if (e.room && e.room !== 'N/A' && e.room !== 'TBD') {
          rooms[e.room] = (rooms[e.room] || 0) + 1;
        }
      });
    });
    return Object.entries(rooms).map(([room, hours]) => ({
      room,
      percent: Math.min(100, Math.round((hours / (6 * 7)) * 100)) // Max 42 slots in week
    }));
  };

  const activeSectSchedule = schedules.find(s => s.section === activeTab);

  return (
    <div className="timetable-gen-container">
      {/* Header */}
      <div className="timetable-gen-header">
        <div className="header-icon-wrapper">
          <Calendar size={24} className="header-icon" />
        </div>
        <div className="header-details">
          <h1 className="timetable-gen-title">Automatic Timetable Generator</h1>
          <p className="timetable-gen-subtitle">Create optimized, conflict-free schedules using CSP Backtracking.</p>
        </div>
      </div>

      {/* Selectors Configuration Card */}
      <div className="gen-config-card">
        <div className="config-grid">
          <div className="config-field">
            <label className="config-label">Department</label>
            <select 
              value={department} 
              onChange={(e) => setDepartment(e.target.value)}
              className="config-select"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="config-field">
            <label className="config-label">Semester</label>
            <select 
              value={semester} 
              onChange={(e) => setSemester(parseInt(e.target.value))}
              className="config-select"
            >
              {semesters.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div className="config-field">
            <label className="config-label">Academic Year</label>
            <input 
              type="text" 
              value={academicYear} 
              onChange={(e) => setAcademicYear(e.target.value)}
              className="config-input" 
              placeholder="e.g. 2026-2027"
            />
          </div>

          <div className="config-field">
            <label className="config-label">Target Sections</label>
            <div className="sections-checkboxes">
              {allSections.map(sect => (
                <button
                  key={sect}
                  onClick={() => handleSectionToggle(sect)}
                  className={`section-toggle-btn ${selectedSections.includes(sect) ? 'active' : ''}`}
                >
                  Section {sect}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="config-actions">
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating} 
            className="btn-primary"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Running Solver...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Timetable</span>
              </>
            )}
          </button>
          
          <button 
            onClick={handlePublish} 
            disabled={!timetableId || isPublishing} 
            className="btn-success"
          >
            {isPublishing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Publish Active</span>
              </>
            )}
          </button>

          <button 
            onClick={handleRegenerate} 
            disabled={!timetableId || isRegenerating} 
            className="btn-danger"
          >
            {isRegenerating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                <span>Clear Draft</span>
              </>
            )}
          </button>
        </div>
      </div>

      {schedules.length > 0 && (
        <div className="results-wrapper animate-fadeIn">
          {/* Quality Metrics */}
          <div className="metrics-grid">
            <div className="metric-card quality-card">
              <div className="metric-header">
                <Sparkles size={20} className="quality-accent-icon" />
                <span className="metric-title">AI Quality Score</span>
              </div>
              <div className="metric-value">{qualityScore}%</div>
              <p className="metric-desc">Derived from soft constraint matching and workload balance.</p>
            </div>

            <div className="metric-card validation-card">
              <div className="metric-header">
                <CheckCircle2 size={20} className="validation-accent-icon" />
                <span className="metric-title">Hard Constraints Status</span>
              </div>
              <div className="metric-value-status">Conflict-Free</div>
              <p className="metric-desc">Validated: zero faculty, classroom, or section overlaps detected.</p>
            </div>

            <div className="metric-card warnings-card">
              <div className="metric-header">
                <AlertTriangle size={20} className="warning-accent-icon" />
                <span className="metric-title">Soft Alerts</span>
              </div>
              <div className="metric-value">{conflicts.length} Notice{conflicts.length !== 1 ? 's' : ''}</div>
              <p className="metric-desc">E.g. non-preferred teaching slots or idle periods.</p>
            </div>
          </div>

          {/* Grid Preview Area */}
          <div className="preview-container">
            <div className="preview-header-row">
              <div className="section-tabs">
                {schedules.map(sect => (
                  <button
                    key={sect.section}
                    onClick={() => setActiveTab(sect.section)}
                    className={`sect-tab-btn ${activeTab === sect.section ? 'active' : ''}`}
                  >
                    Section {sect.section}
                  </button>
                ))}
              </div>

              <button onClick={handleExportCSV} className="btn-secondary">
                <Download size={15} />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="grid-table-container scrollbar-thin">
              <table className="timetable-grid-table">
                <thead>
                  <tr>
                    <th>Day / Period</th>
                    {periods.map(p => (
                      <th key={p}>
                        <div className="period-header-cell">
                          <span className="p-num">Period {p}</span>
                          <span className="p-time">{getPeriodTimes(p)}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map(day => (
                    <tr key={day}>
                      <td className="day-name-cell">{day}</td>
                      {periods.map(p => {
                        const cell = getCellContent(activeSectSchedule, day, p);
                        if (!cell) {
                          return (
                            <td key={p} className="grid-empty-cell">
                              <span className="empty-label">Free Period</span>
                            </td>
                          );
                        }
                        return (
                          <td key={p} className={`grid-allocated-cell ${cell.is_lab ? 'lab-cell' : 'theory-cell'}`}>
                            <div className="cell-card">
                              <div className="cell-subject" title={cell.subject}>
                                <BookOpen size={12} className="cell-icon" />
                                <span>{cell.subject}</span>
                              </div>
                              <div className="cell-faculty" title={cell.faculty}>
                                <Users size={12} className="cell-icon" />
                                <span>{cell.faculty}</span>
                              </div>
                              <div className="cell-room" title={cell.room}>
                                <MapPin size={12} className="cell-icon" />
                                <span>{cell.room}</span>
                              </div>
                              <span className={`cell-badge ${cell.is_lab ? 'lab-badge' : 'theory-badge'}`}>
                                {cell.is_lab ? 'LAB' : 'THEORY'}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analytics Graphs Grid */}
          <div className="analytics-details-grid">
            {/* Workload Distribution */}
            <div className="details-panel-card">
              <h3 className="panel-title">Faculty Workload Distribution</h3>
              <div className="panel-content scrollbar-thin">
                <div className="workload-list">
                  {getFacultyWorkloads().map(f => (
                    <div key={f.name} className="workload-bar-item">
                      <div className="item-labels">
                        <span className="item-name">{f.name}</span>
                        <span className="item-value">{f.hours} hrs/week</span>
                      </div>
                      <div className="bar-track">
                        <div 
                          className="bar-fill" 
                          style={{ width: `${Math.min(100, (f.hours / 18) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Room Utilization */}
            <div className="details-panel-card">
              <h3 className="panel-title">Classroom Utilization</h3>
              <div className="panel-content scrollbar-thin">
                <div className="workload-list">
                  {getRoomUtilizations().map(r => (
                    <div key={r.room} className="workload-bar-item">
                      <div className="item-labels">
                        <span className="item-name">{r.room}</span>
                        <span className="item-value">{r.percent}% used</span>
                      </div>
                      <div className="bar-track">
                        <div 
                          className="bar-fill room-fill" 
                          style={{ width: `${r.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
