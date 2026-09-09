/**
 * SKCET Real 3D Digital Twin Building Catalog & Geospatial Projection
 * Sri Krishna College of Engineering and Technology (SKCET), Kuniamuthur, Coimbatore
 * Coordinates projected from verified OpenStreetMap & physical campus surveys
 * 1 Three.js Unit = 4.0 Meters | Origin at SKCET center (10.9378 N, 76.9560 E)
 */

export const SKCET_BUILDINGS = [
  {
    id: "vankatram-library",
    name: "Vankatram Learning Centre",
    aliases: ["vankatram library center", "Library", "Central Library", "VLC"],
    code: "VLC",
    department: "Central Digital Library and Research Commons",
    gridCoord: [1, 0],
    position: [1.3, 0, 21.8],
    dimensions: [12, 6, 13],
    archetype: "library",
    color: "#3B82F6",
    floors: 3,
    description: "Iconic circular rotunda and digital library housing 64,000+ volumes, IEEE/ACM digital access, 500-seat reading hall, and 24/7 research bay."
  },
  {
    id: "admin-block",
    name: "Admin Block",
    aliases: ["ADMIN block", "Administrative Block", "ADM"],
    code: "ADM",
    department: "Institutional Administration and Governance",
    gridCoord: [1, 1],
    position: [7.5, 0, -1.9],
    dimensions: [11, 5, 9],
    archetype: "admin",
    color: "#6366F1",
    floors: 3,
    description: "Principal's Office, Governing Council Hall, Controller of Examinations, Dean of Academics, and Institutional Registry."
  },
  {
    id: "c1-c2-block",
    name: "C1-C2 Academic Complex",
    aliases: ["c1,c2 block", "CS Block", "C1 C2 Block", "CSE Complex"],
    code: "C1-C2",
    department: "Computer Science and Engineering",
    gridCoord: [0, 0],
    position: [11.1, 0, -16.4],
    dimensions: [19, 7, 13],
    archetype: "academic-quad",
    color: "#3B82F6",
    floors: 4,
    description: "Flagship 4-story quadrangle complex with landscaped inner courtyard. Houses AI and Deep Learning Labs, NVIDIA RTX Supercomputing Cluster, and Smart Lecture Theatres."
  },
  {
    id: "cse-it-block",
    name: "IT Block",
    aliases: ["CSE/IT block", "IT Block", "Information Technology", "IT"],
    code: "IT",
    department: "Information Technology and Cybersecurity",
    gridCoord: [0, 2],
    position: [17.1, 0, -30.7],
    dimensions: [11, 7, 9],
    archetype: "academic",
    color: "#06B6D4",
    floors: 4,
    description: "Cloud Computing Operations Center, Cybersecurity Sandbox, Big Data Analytics Hub, and Full-Stack Development Suites."
  },
  {
    id: "eee-block",
    name: "EEE Block",
    aliases: ["EEE block", "Electrical Block", "EEE"],
    code: "EEE",
    department: "Electrical and Electronics Engineering",
    gridCoord: [1, 2],
    position: [6.1, 0, -30.8],
    dimensions: [10, 6, 9],
    archetype: "academic",
    color: "#EAB308",
    floors: 3,
    description: "Power Electronics Testing Bay, Electric Vehicle (EV) Powertrain Lab, Smart Grid Emulators, and Industrial Drives Center."
  },
  {
    id: "ece-block",
    name: "ECE Block",
    aliases: ["ECE block", "Electronics Block", "ECE"],
    code: "ECE",
    department: "Electronics and Communication Engineering",
    gridCoord: [1, 1],
    position: [6.2, 0, -40.1],
    dimensions: [10, 7, 9],
    archetype: "academic",
    color: "#EC4899",
    floors: 4,
    description: "VLSI Cadence Design Center, Anechoic RF and Antenna Testing Chamber, Embedded IoT Sandbox, and High-Speed Signal Processing Lab."
  },
  {
    id: "mechatronics-block",
    name: "Mechatronics Block",
    aliases: ["mechatronics block", "MCT Block", "Robotics Bay"],
    code: "MCT",
    department: "Mechatronics and Autonomous Systems",
    gridCoord: [2, 1],
    position: [15.4, 0, -39.4],
    dimensions: [8, 5.5, 9],
    archetype: "academic",
    color: "#8B5CF6",
    floors: 3,
    description: "Industrial Automation Cell, 6-Axis KUKA Robotic Arms, Electro-Hydraulics and Pneumatics Testbench, and Sensor Fusion Arena."
  },
  {
    id: "mech-block",
    name: "Mechanical Sciences Block",
    aliases: ["mechanical block", "ME Block", "Mechanical Block", "ME"],
    code: "ME",
    department: "Mechanical and Automobile Engineering",
    gridCoord: [2, 2],
    position: [8.8, 0, -49.6],
    dimensions: [20, 5.5, 9],
    archetype: "academic-quad",
    color: "#F97316",
    floors: 3,
    description: "Heavy engineering workshop bays, 5-Axis CNC Machining Center, Formula Student Racing Garage, and Wind Tunnel Aerodynamics Lab."
  },
  {
    id: "civil-block",
    name: "Civil Engineering Block",
    aliases: ["civil block", "Civil Block", "CIVIL"],
    code: "CIVIL",
    department: "Civil and Environmental Engineering",
    gridCoord: [2, 0],
    position: [-5.5, 0, -41.3],
    dimensions: [10, 5.5, 9],
    archetype: "academic",
    color: "#10B981",
    floors: 3,
    description: "Structural Dynamics Shake Table, Soil Mechanics Research Center, Environmental Quality Analysis Lab, and GIS Total Station Station."
  },
  {
    id: "c3-science-block",
    name: "C3 Science and Humanities",
    aliases: ["c3 block", "Science Block", "C3 Block", "SCI"],
    code: "SCI",
    department: "Basic Sciences and Humanities",
    gridCoord: [2, 0],
    position: [-5.0, 0, -29.7],
    dimensions: [10, 6, 10],
    archetype: "academic",
    color: "#14B8A6",
    floors: 3,
    description: "Nanotechnology Research Laboratories, Material Physics Facility, Advanced Synthetic Chemistry Labs, and Digital Language Testing Theatres."
  },
  {
    id: "mba-mca-block",
    name: "MBA and MCA Complex",
    aliases: ["MBA block", "MCA block", "School of Management", "SOM"],
    code: "SOM",
    department: "School of Management and Computer Applications",
    gridCoord: [0, 1],
    position: [-7.0, 0, -12.0],
    dimensions: [11, 6, 14],
    archetype: "academic",
    color: "#64748B",
    floors: 3,
    description: "Executive Management Case Discussion Theatres, Bloomberg Financial Terminal Lab, and Corporate Seminar Hall."
  },
  {
    id: "sri-krishna-hall",
    name: "Sri Krishna Hall",
    aliases: ["SRI krishna Hall", "convention center", "Auditorium", "SKH"],
    code: "SKH",
    department: "Institutional Auditorium and Convention Centre",
    gridCoord: [1, 0],
    position: [17.5, 0, 13.4],
    dimensions: [14, 8, 12],
    archetype: "auditorium",
    color: "#3B82F6",
    floors: 2,
    description: "Grand institutional auditorium with 3,500-seat capacity, state-of-the-art acoustic treatment, stage lighting, and presidential convention facilities."
  },
  {
    id: "food-court",
    name: "SKCET Food Court",
    aliases: ["food court", "JMR cafe", "Cafeteria", "Dining"],
    code: "FC",
    department: "Campus Dining and Student Amenities",
    gridCoord: [2, 0],
    position: [16.4, 0, 26.6],
    dimensions: [13, 4, 8],
    archetype: "sports-food",
    color: "#F59E0B",
    floors: 2,
    description: "Multi-cuisine student and faculty dining commons with 1,200 capacity, open terrace cafe, and health juice bars."
  },
  {
    id: "krishna-square",
    name: "Krishna Square",
    aliases: ["krishna square", "Quadrangle", "Plaza", "KSQ"],
    code: "KSQ",
    department: "Central Quadrangle Plaza and Student Forum",
    gridCoord: [0, 0],
    position: [-18.1, 0, 4.8],
    dimensions: [12, 0.4, 12],
    archetype: "plaza",
    color: "#6366F1",
    floors: 1,
    description: "Central paved gathering forum with amphitheatre stone steps, shaded tree canopies, open-air staging, and club exhibits."
  },
  {
    id: "stadium",
    name: "Sri Krishna Stadium",
    aliases: ["Sri Krishna stadium", "SRI KRISHNA OPEN STADIUM", "Sports Ground", "Stadium"],
    code: "SKS",
    department: "Physical Education and Athletics Arena",
    gridCoord: [2, 1],
    position: [41.7, 0, -18.2],
    dimensions: [38, 3.5, 62],
    archetype: "stadium",
    color: "#EF4444",
    floors: 1,
    description: "Premier campus sports arena featuring 400m synthetic running track, international-dimension football and cricket ground, and spectator grandstand."
  }
];

export const CAMERA_PRESETS = [
  {
    id: "overview",
    name: "Campus Overview",
    description: "Full isometric perspective of SKCET campus",
    position: [38, 48, 52],
    target: [12, 0, -10]
  },
  {
    id: "library-admin",
    name: "Vankatram Library and Admin",
    description: "Central governance and iconic digital library rotunda",
    position: [18, 22, 36],
    target: [4, 2, 8]
  },
  {
    id: "academic-quad",
    name: "Academic Engineering Quad",
    description: "C1-C2, ECE, Mech and EEE engineering blocks",
    position: [24, 28, 4],
    target: [11, 2, -28]
  },
  {
    id: "stadium",
    name: "Sri Krishna Stadium",
    description: "400m synthetic athletic track and grandstand",
    position: [62, 30, 8],
    target: [41, 1, -18]
  },
  {
    id: "krishna-square",
    name: "Krishna Square Plaza",
    description: "Central quadrangle forum and western avenues",
    position: [-8, 20, 24],
    target: [-16, 1, 4]
  }
];
