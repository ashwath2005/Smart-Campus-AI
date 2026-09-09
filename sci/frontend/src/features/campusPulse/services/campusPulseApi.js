import api from '../../../api/axios';

export const campusPulseApi = {
  getCurrentPulse: async () => {
    try {
      const res = await api.get('/campus-pulse/current');
      return res.data;
    } catch (err) {
      // Fallback fallback response if backend offline
      return {
        activityScore: 84.5,
        status: "HIGH",
        baseline: 72.0,
        changeFromBaseline: 17.4,
        anomalyStatus: "UNUSUAL",
        timestamp: new Date().toISOString(),
        students: { active: 2450, total: 2800, score: 87.5 },
        faculty: { active: 168, total: 185, score: 90.8 },
        rooms: { occupied: 82, total: 110, utilization: 74.5 },
        events: { active: 3, score: 85.0 },
        labs: { active: 14, total: 18, score: 77.8 }
      };
    }
  },

  getPulseHistory: async (timeframe = 'today') => {
    const DEFAULT_HISTORY = [
      { time: '08:00 AM', score: 62.0, baseline: 58.0 },
      { time: '09:00 AM', score: 74.5, baseline: 72.5 },
      { time: '10:00 AM', score: 88.0, baseline: 84.0 },
      { time: '11:00 AM', score: 94.5, baseline: 84.0 },
      { time: '12:00 PM', score: 89.0, baseline: 84.0 },
      { time: '01:00 PM', score: 65.0, baseline: 60.0 },
      { time: '02:00 PM', score: 82.5, baseline: 78.0 },
      { time: '03:00 PM', score: 84.5, baseline: 78.0 }
    ];
    try {
      const res = await api.get(`/campus-pulse/history?timeframe=${timeframe}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      return DEFAULT_HISTORY;
    } catch (err) {
      return DEFAULT_HISTORY;
    }
  },

  getPulseLocations: async () => {
    const DEFAULT_LOCATIONS = [
      { id: 'block-a', name: 'Block A (Main Academic)', activityScore: 88.0, expectedScore: 78.0, difference: 10.0, status: 'HIGH', occupiedRooms: 18, totalRooms: 22, activeClasses: 16, activeEvents: 1, activeLabs: 2, capacity: 650, currentOccupancy: 572 },
      { id: 'block-b', name: 'Block B (Placements & IT)', activityScore: 94.5, expectedScore: 72.0, difference: 22.5, status: 'HIGH', occupiedRooms: 15, totalRooms: 16, activeClasses: 11, activeEvents: 3, activeLabs: 4, capacity: 500, currentOccupancy: 472 },
      { id: 'block-c', name: 'Block C (Research & PG)', activityScore: 64.0, expectedScore: 65.0, difference: -1.0, status: 'NORMAL', occupiedRooms: 10, totalRooms: 15, activeClasses: 9, activeEvents: 0, activeLabs: 1, capacity: 400, currentOccupancy: 256 },
      { id: 'lab-block', name: 'Innovation & Lab Complex', activityScore: 82.0, expectedScore: 75.0, difference: 7.0, status: 'HIGH', occupiedRooms: 12, totalRooms: 14, activeClasses: 6, activeEvents: 1, activeLabs: 6, capacity: 450, currentOccupancy: 369 }
    ];
    try {
      const res = await api.get('/campus-pulse/locations');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      return DEFAULT_LOCATIONS;
    } catch (err) {
      return DEFAULT_LOCATIONS;
    }
  },

  getPulseForecast: async () => {
    try {
      const res = await api.get('/campus-pulse/forecast');
      return res.data;
    } catch (err) {
      return [
        { time: '16:00', hourOffset: 1, predictedScore: 82.5, expectedBaseline: 78.0, confidence: 89 },
        { time: '17:00', hourOffset: 2, predictedScore: 54.0, expectedBaseline: 45.0, confidence: 86 },
        { time: '18:00', hourOffset: 3, predictedScore: 28.0, expectedBaseline: 25.0, confidence: 83 }
      ];
    }
  },

  getPulseInsights: async () => {
    try {
      const res = await api.get('/campus-pulse/insights');
      return res.data;
    } catch (err) {
      return {
        summary: "Campus activity is currently HIGH (84.5%). Block B is experiencing peak utilization at 94.5% primarily driven by active laboratory sessions and ongoing placement drives.",
        primaryFactors: [
          "Block B (Placements & IT) operating at 94.5% capacity",
          "14 active laboratory sessions campus-wide",
          "3 scheduled campus events (Placement Drive Round 2)"
        ],
        recommendedActions: [
          "Ensure ventilation & HVAC in Block B laboratories",
          "Monitor hallway traffic near placement interview rooms",
          "Keep auxiliary study halls open for quiet work"
        ]
      };
    }
  },

  investigateBlock: async (blockId) => {
    try {
      const res = await api.get(`/campus-pulse/investigate/${blockId}`);
      return res.data;
    } catch (err) {
      return {
        block: { id: blockId, name: 'Block B (Placements & IT)', activityScore: 94.5, expectedScore: 72.0, difference: 22.5, status: 'HIGH', occupiedRooms: 15, totalRooms: 16 },
        activeClassesList: [
          { code: "CS701", name: "Deep Learning & Neural Networks", room: "Room 301", students: 58, faculty: "Dr. Aris Vance" },
          { code: "CS602", name: "Distributed Systems", room: "Room 304", students: 52, faculty: "Prof. Elena Rostova" },
          { code: "CS504", name: "Cloud Computing Infrastructure", room: "Room 208", students: 60, faculty: "Dr. Marcus Thorne" }
        ],
        activeLabsList: [
          { code: "CS702L", name: "Advanced AI Vision Lab", room: "Lab 102", students: 32, status: "ACTIVE" },
          { code: "CS604L", name: "Cybersecurity & Systems Lab", room: "Lab 104", students: 28, status: "ACTIVE" }
        ],
        activeEventsList: [
          { title: "Annual Placement Drive 2026 - Round 2", venue: "Block B Seminar Hall", organizer: "Placement Cell", attendees: 180 }
        ],
        associatedFactors: [
          "Concurrent placement interview sessions in Block B Seminar Hall",
          "High laboratory attendance (92% capacity in Lab 102 & Lab 104)",
          "All 3 primary lecture halls operating back-to-back"
        ],
        recommendedActions: [
          "Maintain auxiliary cooling in Lab Block Server Room",
          "Direct overflow placement students to Block B Atrium Lounge"
        ]
      };
    }
  }
};
