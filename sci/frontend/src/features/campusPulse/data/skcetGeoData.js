/**
 * SKCET Georeferenced Ground Truth Dataset
 * Extracted and projected from Google Maps satellite imagery & verified OpenStreetMap survey
 * Origin: SKCET Center (10.937800° N, 76.956000° E)
 * All polygon coordinates are in WGS84 GPS decimal degrees [latitude, longitude]
 */

export const SKCET_ORIGIN = {
  latitude: 10.937800,
  longitude: 76.956000,
  description: "Administrative Block & Central Academic Quadrangle Axis"
};

export const CAMPUS_BOUNDARY = [
  [
    10.939119,
    76.95659
  ],
  [
    10.939478,
    76.956937
  ],
  [
    10.939607,
    76.957889
  ],
  [
    10.939456,
    76.958462
  ],
  [
    10.93997,
    76.958882
  ],
  [
    10.940174,
    76.959684
  ],
  [
    10.9402,
    76.960343
  ],
  [
    10.940169,
    76.960916
  ],
  [
    10.940244,
    76.961336
  ],
  [
    10.939819,
    76.961426
  ],
  [
    10.939859,
    76.961679
  ],
  [
    10.939664,
    76.962044
  ],
  [
    10.938902,
    76.962315
  ],
  [
    10.938145,
    76.961047
  ],
  [
    10.938092,
    76.960975
  ],
  [
    10.937024,
    76.961209
  ],
  [
    10.936914,
    76.960749
  ],
  [
    10.936822,
    76.960266
  ],
  [
    10.936783,
    76.959425
  ],
  [
    10.936511,
    76.958607
  ],
  [
    10.936308,
    76.95816
  ],
  [
    10.936085,
    76.957765
  ],
  [
    10.935863,
    76.957345
  ],
  [
    10.935684,
    76.956913
  ],
  [
    10.935323,
    76.956079
  ],
  [
    10.934969,
    76.955285
  ],
  [
    10.934803,
    76.954987
  ],
  [
    10.934712,
    76.954672
  ],
  [
    10.934684,
    76.954436
  ],
  [
    10.934634,
    76.954222
  ],
  [
    10.934198,
    76.953698
  ],
  [
    10.933821,
    76.953136
  ],
  [
    10.933671,
    76.952479
  ],
  [
    10.934149,
    76.952452
  ],
  [
    10.934515,
    76.953289
  ],
  [
    10.934769,
    76.953748
  ],
  [
    10.93497,
    76.953753
  ],
  [
    10.935523,
    76.953775
  ],
  [
    10.936184,
    76.954002
  ],
  [
    10.93695,
    76.954004
  ],
  [
    10.937569,
    76.954045
  ],
  [
    10.937951,
    76.954075
  ],
  [
    10.938981,
    76.954324
  ],
  [
    10.939119,
    76.95659
  ]
];

export const CAMPUS_BUILDINGS_GEO = [
  {
    "id": "bldg-eee-core",
    "osmId": 93418964,
    "name": "EEE & Core Academic Block",
    "code": "EEE",
    "department": "Electrical & Electronics Engineering",
    "latitude": 10.936717,
    "longitude": 76.956356,
    "footprint": [
      [
        10.936863,
        76.956097
      ],
      [
        10.936859,
        76.956182
      ],
      [
        10.936816,
        76.956184
      ],
      [
        10.936812,
        76.956268
      ],
      [
        10.936836,
        76.956272
      ],
      [
        10.936832,
        76.956349
      ],
      [
        10.936652,
        76.956352
      ],
      [
        10.936653,
        76.956366
      ],
      [
        10.936654,
        76.956381
      ],
      [
        10.936707,
        76.956379
      ],
      [
        10.936709,
        76.956444
      ],
      [
        10.936837,
        76.956434
      ],
      [
        10.936847,
        76.956753
      ],
      [
        10.936555,
        76.956764
      ],
      [
        10.936543,
        76.956604
      ],
      [
        10.936526,
        76.956378
      ],
      [
        10.936527,
        76.956346
      ],
      [
        10.936529,
        76.956106
      ],
      [
        10.936863,
        76.956097
      ]
    ],
    "floors": 3,
    "estimatedHeight": 12.0,
    "archetype": "academic",
    "aliases": [
      "EEE block",
      "Electrical Block",
      "EEE"
    ],
    "confidence": "high",
    "description": "Power Electronics Testing Bay, Electric Vehicle (EV) Powertrain Lab, Smart Grid Emulators, and Industrial Drives Center.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-east-campus-complex",
    "osmId": 93419158,
    "name": "East Campus Academic Complex",
    "code": "ECC",
    "department": "Arts, Science & Engineering Common Hub",
    "latitude": 10.937742,
    "longitude": 76.959529,
    "footprint": [
      [
        10.936988,
        76.959869
      ],
      [
        10.937041,
        76.960239
      ],
      [
        10.937281,
        76.960195
      ],
      [
        10.937312,
        76.960525
      ],
      [
        10.937768,
        76.960456
      ],
      [
        10.937685,
        76.96002
      ],
      [
        10.937361,
        76.960057
      ],
      [
        10.93734,
        76.959935
      ],
      [
        10.937543,
        76.959885
      ],
      [
        10.937525,
        76.959665
      ],
      [
        10.937833,
        76.959643
      ],
      [
        10.937999,
        76.959611
      ],
      [
        10.938005,
        76.959787
      ],
      [
        10.938116,
        76.959778
      ],
      [
        10.938129,
        76.959935
      ],
      [
        10.93832,
        76.959872
      ],
      [
        10.938332,
        76.959969
      ],
      [
        10.938434,
        76.959947
      ],
      [
        10.938434,
        76.959866
      ],
      [
        10.938748,
        76.959809
      ],
      [
        10.938726,
        76.959706
      ],
      [
        10.938418,
        76.959746
      ],
      [
        10.938409,
        76.959637
      ],
      [
        10.938816,
        76.95959
      ],
      [
        10.938748,
        76.959282
      ],
      [
        10.93844,
        76.959332
      ],
      [
        10.938428,
        76.959219
      ],
      [
        10.938267,
        76.959241
      ],
      [
        10.93823,
        76.959053
      ],
      [
        10.938119,
        76.959087
      ],
      [
        10.938085,
        76.958968
      ],
      [
        10.937944,
        76.958996
      ],
      [
        10.937913,
        76.958817
      ],
      [
        10.937783,
        76.958842
      ],
      [
        10.937793,
        76.959009
      ],
      [
        10.937728,
        76.959018
      ],
      [
        10.93774,
        76.959159
      ],
      [
        10.937639,
        76.959175
      ],
      [
        10.937651,
        76.959238
      ],
      [
        10.937478,
        76.959282
      ],
      [
        10.937438,
        76.959084
      ],
      [
        10.937247,
        76.959106
      ],
      [
        10.937219,
        76.95894
      ],
      [
        10.937074,
        76.958962
      ],
      [
        10.937099,
        76.959125
      ],
      [
        10.936951,
        76.959159
      ],
      [
        10.93697,
        76.959316
      ],
      [
        10.937127,
        76.959269
      ],
      [
        10.937173,
        76.959495
      ],
      [
        10.937367,
        76.959429
      ],
      [
        10.937373,
        76.959583
      ],
      [
        10.93729,
        76.959593
      ],
      [
        10.937309,
        76.959721
      ],
      [
        10.937192,
        76.959728
      ],
      [
        10.937192,
        76.9598
      ],
      [
        10.936988,
        76.959869
      ]
    ],
    "floors": 4,
    "estimatedHeight": 16.0,
    "archetype": "academic-quad",
    "aliases": [
      "Sri Krishna Arts and Science College",
      "SKASC Hub"
    ],
    "confidence": "high",
    "description": "Extensive academic wing with multi-disciplinary laboratories, research suites, and lecture halls.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-mech",
    "osmId": 93419159,
    "name": "Mechanical Sciences Block & Workshops",
    "code": "ME",
    "department": "Mechanical & Automobile Engineering",
    "latitude": 10.936006,
    "longitude": 76.956322,
    "footprint": [
      [
        10.936099,
        76.956003
      ],
      [
        10.935796,
        76.956021
      ],
      [
        10.935803,
        76.956754
      ],
      [
        10.936124,
        76.956744
      ],
      [
        10.936113,
        76.956407
      ],
      [
        10.936099,
        76.956003
      ]
    ],
    "floors": 3,
    "estimatedHeight": 12.0,
    "archetype": "academic-quad",
    "aliases": [
      "mechanical block",
      "ME Block",
      "Mechanical Block",
      "ME"
    ],
    "confidence": "high",
    "description": "Heavy engineering workshop bays, 5-Axis CNC Machining Center, Formula Student Racing Garage, and Wind Tunnel Aerodynamics Lab.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-c1-c2",
    "osmId": 93419160,
    "name": "C1-C2 Academic Complex",
    "code": "C1-C2",
    "department": "Computer Science & Engineering",
    "latitude": 10.937207,
    "longitude": 76.956407,
    "footprint": [
      [
        10.937316,
        76.956097
      ],
      [
        10.937287,
        76.956099
      ],
      [
        10.937206,
        76.956104
      ],
      [
        10.937051,
        76.956113
      ],
      [
        10.937042,
        76.956207
      ],
      [
        10.936955,
        76.95622
      ],
      [
        10.936962,
        76.956317
      ],
      [
        10.937051,
        76.95632
      ],
      [
        10.937053,
        76.956424
      ],
      [
        10.937057,
        76.956599
      ],
      [
        10.936971,
        76.956599
      ],
      [
        10.936958,
        76.956709
      ],
      [
        10.937063,
        76.956716
      ],
      [
        10.937066,
        76.956806
      ],
      [
        10.937344,
        76.956797
      ],
      [
        10.937334,
        76.956684
      ],
      [
        10.937433,
        76.956697
      ],
      [
        10.937433,
        76.956558
      ],
      [
        10.937341,
        76.956562
      ],
      [
        10.937334,
        76.956483
      ],
      [
        10.937333,
        76.956395
      ],
      [
        10.937325,
        76.956301
      ],
      [
        10.937421,
        76.956298
      ],
      [
        10.937411,
        76.956191
      ],
      [
        10.937319,
        76.956194
      ],
      [
        10.937316,
        76.956097
      ]
    ],
    "floors": 4,
    "estimatedHeight": 16.0,
    "archetype": "academic-quad",
    "aliases": [
      "c1,c2 block",
      "CS Block",
      "C1 C2 Block",
      "CSE Complex"
    ],
    "confidence": "high",
    "description": "Flagship 4-story quadrangle complex with landscaped inner courtyard. Houses AI & Deep Learning Labs, NVIDIA RTX Supercomputing Cluster, and Smart Lecture Theatres.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-east-seminar",
    "osmId": 93419161,
    "name": "East Seminar Pavilion",
    "code": "ESP",
    "department": "Academic Conventions",
    "latitude": 10.93824,
    "longitude": 76.958599,
    "footprint": [
      [
        10.938371,
        76.958437
      ],
      [
        10.937986,
        76.958503
      ],
      [
        10.938052,
        76.958825
      ],
      [
        10.938421,
        76.958794
      ],
      [
        10.938371,
        76.958437
      ]
    ],
    "floors": 2,
    "estimatedHeight": 8.0,
    "archetype": "academic",
    "aliases": [
      "East Seminar"
    ],
    "confidence": "medium",
    "description": "Multi-disciplinary seminar facilities and research discussion suites.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-hostel-mess",
    "osmId": 93419162,
    "name": "Arts Hostel & Dining Mess",
    "code": "AHM",
    "department": "Student Housing",
    "latitude": 10.939766,
    "longitude": 76.959989,
    "footprint": [
      [
        10.939523,
        76.959865
      ],
      [
        10.939535,
        76.96025
      ],
      [
        10.939777,
        76.960234
      ],
      [
        10.939774,
        76.960359
      ],
      [
        10.94007,
        76.960407
      ],
      [
        10.94007,
        76.959798
      ],
      [
        10.939851,
        76.959826
      ],
      [
        10.939835,
        76.959716
      ],
      [
        10.939735,
        76.95972
      ],
      [
        10.939735,
        76.959838
      ],
      [
        10.939523,
        76.959865
      ]
    ],
    "floors": 4,
    "estimatedHeight": 16.0,
    "archetype": "academic",
    "aliases": [
      "SKCET ARTS HOSTEL AND MESS"
    ],
    "confidence": "high",
    "description": "Hostel block with integrated dining mess.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-temple",
    "osmId": 503500297,
    "name": "Sri Krishna Campus Temple",
    "code": "TMP",
    "department": "Campus Sanctuary & Heritage",
    "latitude": 10.938452,
    "longitude": 76.952616,
    "footprint": [
      [
        10.938563,
        76.95237
      ],
      [
        10.9386,
        76.952971
      ],
      [
        10.938282,
        76.952984
      ],
      [
        10.938253,
        76.952386
      ],
      [
        10.938563,
        76.95237
      ]
    ],
    "floors": 1,
    "estimatedHeight": 4.0,
    "archetype": "admin",
    "aliases": [
      "Sreekrishna College Temple"
    ],
    "confidence": "high",
    "description": "Campus spiritual sanctuary and heritage monument.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-boys-hostel-ab",
    "osmId": 570580462,
    "name": "Boys Hostel A & B Block",
    "code": "BH-AB",
    "department": "Student Residential Housing",
    "latitude": 10.940012,
    "longitude": 76.960947,
    "footprint": [
      [
        10.940105,
        76.960592
      ],
      [
        10.93974,
        76.960597
      ],
      [
        10.939801,
        76.961376
      ],
      [
        10.940153,
        76.961303
      ],
      [
        10.940166,
        76.961222
      ],
      [
        10.940105,
        76.960592
      ]
    ],
    "floors": 5,
    "estimatedHeight": 20.0,
    "archetype": "academic",
    "aliases": [
      "SKCET BOYS HOSTEL A and B block"
    ],
    "confidence": "high",
    "description": "Multi-story student residential housing complex.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-boys-hostel-de",
    "osmId": 570580511,
    "name": "Boys Hostel D & E Block",
    "code": "BH-DE",
    "department": "Student Residential Housing",
    "latitude": 10.939491,
    "longitude": 76.961656,
    "footprint": [
      [
        10.939616,
        76.961329
      ],
      [
        10.939124,
        76.961368
      ],
      [
        10.939217,
        76.962134
      ],
      [
        10.939688,
        76.961987
      ],
      [
        10.939688,
        76.961789
      ],
      [
        10.939616,
        76.961329
      ]
    ],
    "floors": 5,
    "estimatedHeight": 20.0,
    "archetype": "academic",
    "aliases": [
      "skcet boys hostel D and E block"
    ],
    "confidence": "high",
    "description": "Residential housing blocks with student commons.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-boys-hostel-c",
    "osmId": 570580602,
    "name": "Boys Hostel C Block",
    "code": "BH-C",
    "department": "Student Residential Housing",
    "latitude": 10.939399,
    "longitude": 76.960984,
    "footprint": [
      [
        10.939554,
        76.960842
      ],
      [
        10.939127,
        76.960885
      ],
      [
        10.939179,
        76.961259
      ],
      [
        10.939583,
        76.961089
      ],
      [
        10.939554,
        76.960842
      ]
    ],
    "floors": 5,
    "estimatedHeight": 20.0,
    "archetype": "academic",
    "aliases": [
      "skcet boys hostel C block"
    ],
    "confidence": "high",
    "description": "Residential block with study halls and indoor recreation.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-c5",
    "osmId": 571426527,
    "name": "C5 Block",
    "code": "C5",
    "department": "Applied Sciences & First Year Labs",
    "latitude": 10.937034,
    "longitude": 76.955387,
    "footprint": [
      [
        10.937137,
        76.955281
      ],
      [
        10.93719,
        76.955533
      ],
      [
        10.936847,
        76.955527
      ],
      [
        10.936858,
        76.955313
      ],
      [
        10.937137,
        76.955281
      ]
    ],
    "floors": 3,
    "estimatedHeight": 12.0,
    "archetype": "academic",
    "aliases": [
      "C5 block"
    ],
    "confidence": "high",
    "description": "First-year engineering graphics computer centre and physics research instrumentation suites.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-mba",
    "osmId": 571426529,
    "name": "School of Management (MBA Block)",
    "code": "SOM",
    "department": "School of Management",
    "latitude": 10.937554,
    "longitude": 76.955732,
    "footprint": [
      [
        10.937664,
        76.955828
      ],
      [
        10.937706,
        76.95557
      ],
      [
        10.937564,
        76.955554
      ],
      [
        10.937479,
        76.955592
      ],
      [
        10.937485,
        76.955651
      ],
      [
        10.937353,
        76.955667
      ],
      [
        10.937421,
        76.955962
      ],
      [
        10.937653,
        76.95594
      ],
      [
        10.937664,
        76.955828
      ]
    ],
    "floors": 3,
    "estimatedHeight": 12.0,
    "archetype": "academic",
    "aliases": [
      "MBA block",
      "School of Management",
      "SOM"
    ],
    "confidence": "high",
    "description": "Executive Management Case Discussion Theatres, Bloomberg Financial Terminal Lab, and Corporate Seminar Hall.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-mca",
    "osmId": 571426530,
    "name": "MCA Block & Seminar Hall",
    "code": "MCA",
    "department": "Computer Applications",
    "latitude": 10.937174,
    "longitude": 76.955751,
    "footprint": [
      [
        10.937,
        76.955645
      ],
      [
        10.937148,
        76.95564
      ],
      [
        10.937242,
        76.95557
      ],
      [
        10.937237,
        76.955651
      ],
      [
        10.93729,
        76.955656
      ],
      [
        10.937292,
        76.955704
      ],
      [
        10.937295,
        76.955747
      ],
      [
        10.937247,
        76.955747
      ],
      [
        10.937226,
        76.955828
      ],
      [
        10.937316,
        76.955833
      ],
      [
        10.937342,
        76.955957
      ],
      [
        10.937005,
        76.955967
      ],
      [
        10.937021,
        76.955817
      ],
      [
        10.937174,
        76.955828
      ],
      [
        10.937142,
        76.955758
      ],
      [
        10.936974,
        76.95578
      ],
      [
        10.937,
        76.955645
      ]
    ],
    "floors": 3,
    "estimatedHeight": 12.0,
    "archetype": "academic",
    "aliases": [
      "MCA block",
      "MCA seminarHALL",
      "MCA"
    ],
    "confidence": "high",
    "description": "Software Design Labs, Advanced Algorithms Research Wing, and MCA Central Seminar Hall.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-ece",
    "osmId": 571426531,
    "name": "ECE Block",
    "code": "ECE",
    "department": "Electronics & Communication Engineering",
    "latitude": 10.936348,
    "longitude": 76.956228,
    "footprint": [
      [
        10.936147,
        76.956118
      ],
      [
        10.936384,
        76.956091
      ],
      [
        10.936368,
        76.956134
      ],
      [
        10.936457,
        76.956128
      ],
      [
        10.936452,
        76.956193
      ],
      [
        10.9364,
        76.956241
      ],
      [
        10.936463,
        76.956278
      ],
      [
        10.936432,
        76.956403
      ],
      [
        10.936421,
        76.95645
      ],
      [
        10.936157,
        76.956359
      ],
      [
        10.936147,
        76.956118
      ]
    ],
    "floors": 4,
    "estimatedHeight": 16.0,
    "archetype": "academic",
    "aliases": [
      "ECE block",
      "Electronics Block",
      "ECE"
    ],
    "confidence": "high",
    "description": "VLSI Cadence Design Center, Anechoic RF & Antenna Testing Chamber, Embedded IoT Sandbox, and High-Speed Signal Processing Lab.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-mechatronics",
    "osmId": 571426532,
    "name": "Mechatronics Block",
    "code": "MCT",
    "department": "Mechatronics & Autonomous Systems",
    "latitude": 10.936373,
    "longitude": 76.956563,
    "footprint": [
      [
        10.936421,
        76.95645
      ],
      [
        10.936479,
        76.956504
      ],
      [
        10.936415,
        76.956563
      ],
      [
        10.936436,
        76.956632
      ],
      [
        10.936489,
        76.956729
      ],
      [
        10.936173,
        76.956729
      ],
      [
        10.936152,
        76.95645
      ],
      [
        10.936421,
        76.95645
      ]
    ],
    "floors": 3,
    "estimatedHeight": 12.0,
    "archetype": "academic",
    "aliases": [
      "mechatronics block",
      "MCT Block",
      "Robotics Bay"
    ],
    "confidence": "high",
    "description": "Industrial Automation Cell, 6-Axis KUKA Robotic Arms, Electro-Hydraulics & Pneumatics Testbench, and Sensor Fusion Arena.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-c3-science",
    "osmId": 571426539,
    "name": "C3 Science & Humanities Block",
    "code": "SCI",
    "department": "Basic Sciences & Humanities",
    "latitude": 10.936726,
    "longitude": 76.955815,
    "footprint": [
      [
        10.936555,
        76.955667
      ],
      [
        10.936706,
        76.955655
      ],
      [
        10.93686,
        76.955643
      ],
      [
        10.936853,
        76.955758
      ],
      [
        10.936816,
        76.955771
      ],
      [
        10.936795,
        76.955785
      ],
      [
        10.936797,
        76.955817
      ],
      [
        10.936842,
        76.955825
      ],
      [
        10.936847,
        76.955847
      ],
      [
        10.936887,
        76.955847
      ],
      [
        10.93686,
        76.955946
      ],
      [
        10.936853,
        76.955965
      ],
      [
        10.936658,
        76.955967
      ],
      [
        10.936639,
        76.955994
      ],
      [
        10.936539,
        76.956005
      ],
      [
        10.93651,
        76.955817
      ],
      [
        10.936505,
        76.955702
      ],
      [
        10.936555,
        76.955667
      ]
    ],
    "floors": 3,
    "estimatedHeight": 12.0,
    "archetype": "academic",
    "aliases": [
      "c3 block",
      "Science Block",
      "C3 Block",
      "SCI"
    ],
    "confidence": "high",
    "description": "Nanotechnology Research Laboratories, Material Physics Facility, Advanced Synthetic Chemistry Labs, and Digital Language Testing Theatres.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-science-annex",
    "osmId": 571426540,
    "name": "Science Research Annex",
    "code": "SRA",
    "department": "Applied Sciences",
    "latitude": 10.936639,
    "longitude": 76.955546,
    "footprint": [
      [
        10.936697,
        76.955468
      ],
      [
        10.936706,
        76.955655
      ],
      [
        10.936547,
        76.955651
      ],
      [
        10.93655,
        76.95549
      ],
      [
        10.936697,
        76.955468
      ]
    ],
    "floors": 2,
    "estimatedHeight": 8.0,
    "archetype": "academic",
    "aliases": [
      "Science Annex"
    ],
    "confidence": "medium",
    "description": "Specialized laboratory and instrumentation research suites.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-civil",
    "osmId": 571426541,
    "name": "Civil Engineering Block",
    "code": "CIVIL",
    "department": "Civil & Environmental Engineering",
    "latitude": 10.93627,
    "longitude": 76.955827,
    "footprint": [
      [
        10.936141,
        76.955997
      ],
      [
        10.936128,
        76.955675
      ],
      [
        10.936363,
        76.955664
      ],
      [
        10.936363,
        76.955699
      ],
      [
        10.936484,
        76.95593
      ],
      [
        10.936141,
        76.955997
      ]
    ],
    "floors": 3,
    "estimatedHeight": 12.0,
    "archetype": "academic",
    "aliases": [
      "civil block",
      "Civil Block",
      "CIVIL"
    ],
    "confidence": "high",
    "description": "Structural Dynamics Shake Table, Soil Mechanics Research Center, Environmental Quality Analysis Lab, and GIS Total Station Station.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-vankatram-library",
    "osmId": 571426542,
    "name": "Vankatram Learning Centre",
    "code": "VLC",
    "department": "Central Digital Library & Research Commons",
    "latitude": 10.938588,
    "longitude": 76.956047,
    "footprint": [
      [
        10.938371,
        76.955836
      ],
      [
        10.938755,
        76.955831
      ],
      [
        10.938761,
        76.956068
      ],
      [
        10.938834,
        76.956072
      ],
      [
        10.93884,
        76.956267
      ],
      [
        10.938487,
        76.956269
      ],
      [
        10.93844,
        76.956149
      ],
      [
        10.938429,
        76.956098
      ],
      [
        10.938371,
        76.955836
      ]
    ],
    "floors": 3,
    "estimatedHeight": 12.0,
    "archetype": "library",
    "aliases": [
      "vankatram library center",
      "Central Library",
      "Library",
      "VLC"
    ],
    "confidence": "high",
    "description": "Iconic circular rotunda & digital library housing 64,000+ volumes, IEEE/ACM digital access, 500-seat reading hall, and 24/7 research bay.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-convention-center",
    "osmId": 571426543,
    "name": "Convention Centre",
    "code": "CC",
    "department": "Institutional Events & Symposiums",
    "latitude": 10.938284,
    "longitude": 76.956641,
    "footprint": [
      [
        10.938196,
        76.956565
      ],
      [
        10.938237,
        76.956563
      ],
      [
        10.938506,
        76.956547
      ],
      [
        10.938512,
        76.956801
      ],
      [
        10.938185,
        76.956831
      ],
      [
        10.938154,
        76.956611
      ],
      [
        10.938196,
        76.956565
      ]
    ],
    "floors": 2,
    "estimatedHeight": 8.0,
    "archetype": "auditorium",
    "aliases": [
      "convention center"
    ],
    "confidence": "high",
    "description": "Tiered convention halls and air-conditioned symposia suites for national symposia and academic conventions.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-food-court",
    "osmId": 571426544,
    "name": "SKCET Food Court & JMR Cafe",
    "code": "FC",
    "department": "Campus Dining & Amenities",
    "latitude": 10.938761,
    "longitude": 76.956599,
    "footprint": [
      [
        10.938664,
        76.956405
      ],
      [
        10.938676,
        76.956658
      ],
      [
        10.938685,
        76.956861
      ],
      [
        10.93893,
        76.956863
      ],
      [
        10.938944,
        76.956402
      ],
      [
        10.938664,
        76.956405
      ]
    ],
    "floors": 2,
    "estimatedHeight": 8.0,
    "archetype": "sports-food",
    "aliases": [
      "food court",
      "JMR cafe",
      "Cafeteria",
      "Dining"
    ],
    "confidence": "high",
    "description": "Multi-cuisine student and faculty dining commons with 1,200 capacity, open terrace cafe, and health juice bars.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-sri-krishna-hall",
    "osmId": 571426547,
    "name": "Sri Krishna Hall",
    "code": "SKH",
    "department": "Institutional Auditorium & Convocation Centre",
    "latitude": 10.939411,
    "longitude": 76.958852,
    "footprint": [
      [
        10.939568,
        76.958655
      ],
      [
        10.938959,
        76.95877
      ],
      [
        10.939028,
        76.959264
      ],
      [
        10.939705,
        76.95913
      ],
      [
        10.939641,
        76.958641
      ],
      [
        10.939568,
        76.958655
      ]
    ],
    "floors": 2,
    "estimatedHeight": 8.0,
    "archetype": "auditorium",
    "aliases": [
      "SRI krishna Hall",
      "Auditorium",
      "SKH"
    ],
    "confidence": "high",
    "description": "Grand institutional auditorium with 3,500-seat capacity, state-of-the-art acoustic treatment, stage lighting, and presidential convention facilities.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-bank-atm",
    "osmId": 572762980,
    "name": "Axis Bank & Banking Centre",
    "code": "BNK",
    "department": "Campus Financial Amenities",
    "latitude": 10.938781,
    "longitude": 76.952252,
    "footprint": [
      [
        10.938872,
        76.952184
      ],
      [
        10.938682,
        76.952227
      ],
      [
        10.938635,
        76.952312
      ],
      [
        10.938846,
        76.952355
      ],
      [
        10.938872,
        76.952184
      ]
    ],
    "floors": 2,
    "estimatedHeight": 8.0,
    "archetype": "sports-food",
    "aliases": [
      "Axis Bank"
    ],
    "confidence": "high",
    "description": "On-campus banking facility and 24/7 ATM.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-girls-hostel-1",
    "osmId": 572762983,
    "name": "Girls Hostel Block 1",
    "code": "GH-1",
    "department": "Student Residential Housing",
    "latitude": 10.934519,
    "longitude": 76.953516,
    "footprint": [
      [
        10.934529,
        76.95333
      ],
      [
        10.934379,
        76.953459
      ],
      [
        10.934463,
        76.953778
      ],
      [
        10.934697,
        76.953684
      ],
      [
        10.934529,
        76.95333
      ]
    ],
    "floors": 4,
    "estimatedHeight": 16.0,
    "archetype": "academic",
    "aliases": [
      "girls hostel"
    ],
    "confidence": "high",
    "description": "Secured residential campus housing for women students.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-girls-hostel-2",
    "osmId": 572762984,
    "name": "Girls Hostel Block 2",
    "code": "GH-2",
    "department": "Student Residential Housing",
    "latitude": 10.934267,
    "longitude": 76.952987,
    "footprint": [
      [
        10.934247,
        76.952842
      ],
      [
        10.934284,
        76.952831
      ],
      [
        10.934455,
        76.953161
      ],
      [
        10.934363,
        76.953215
      ],
      [
        10.934281,
        76.953043
      ],
      [
        10.934168,
        76.953099
      ],
      [
        10.9341,
        76.952965
      ],
      [
        10.93426,
        76.952885
      ],
      [
        10.934247,
        76.952842
      ]
    ],
    "floors": 4,
    "estimatedHeight": 16.0,
    "archetype": "academic",
    "aliases": [
      "girls hostel-block2"
    ],
    "confidence": "high",
    "description": "Multi-story residential hall with gymnasium and dining.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-amenity-east",
    "osmId": 572762988,
    "name": "East Amenities & Staff Block",
    "code": "EAB",
    "department": "Staff Amenities",
    "latitude": 10.938428,
    "longitude": 76.958971,
    "footprint": [
      [
        10.938524,
        76.958888
      ],
      [
        10.938553,
        76.95907
      ],
      [
        10.938463,
        76.959126
      ],
      [
        10.938295,
        76.959078
      ],
      [
        10.938253,
        76.95893
      ],
      [
        10.938384,
        76.958821
      ],
      [
        10.938524,
        76.958888
      ]
    ],
    "floors": 2,
    "estimatedHeight": 8.0,
    "archetype": "academic",
    "aliases": [
      "Staff Quarters"
    ],
    "confidence": "medium",
    "description": "Staff residential quarters and auxiliary amenities.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-admin-block",
    "osmId": 1067550468,
    "name": "Administrative Block",
    "code": "ADM",
    "department": "Institutional Administration & Governance",
    "latitude": 10.937717,
    "longitude": 76.956306,
    "footprint": [
      [
        10.937918,
        76.956097
      ],
      [
        10.937686,
        76.9561
      ],
      [
        10.937687,
        76.956182
      ],
      [
        10.937612,
        76.956183
      ],
      [
        10.937613,
        76.956245
      ],
      [
        10.93755,
        76.956246
      ],
      [
        10.937553,
        76.956495
      ],
      [
        10.93759,
        76.956495
      ],
      [
        10.937591,
        76.956551
      ],
      [
        10.937648,
        76.95655
      ],
      [
        10.937648,
        76.956479
      ],
      [
        10.937707,
        76.956478
      ],
      [
        10.937705,
        76.956337
      ],
      [
        10.937763,
        76.956337
      ],
      [
        10.937762,
        76.95626
      ],
      [
        10.937877,
        76.956259
      ],
      [
        10.937876,
        76.956216
      ],
      [
        10.93792,
        76.956215
      ],
      [
        10.937918,
        76.956097
      ]
    ],
    "floors": 3,
    "estimatedHeight": 12.0,
    "archetype": "admin",
    "aliases": [
      "ADMIN block",
      "Admin Block",
      "Administrative Block",
      "ADM"
    ],
    "confidence": "high",
    "description": "Principal's Office, Governing Council Hall, Controller of Examinations, Dean of Academics, and Institutional Registry.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  },
  {
    "id": "bldg-c6",
    "osmId": 1552739786,
    "name": "C6 Block",
    "code": "C6",
    "department": "Computer Technology & Applied Studies",
    "latitude": 10.936681,
    "longitude": 76.9553,
    "footprint": [
      [
        10.936736,
        76.955187
      ],
      [
        10.936784,
        76.95543
      ],
      [
        10.936593,
        76.95543
      ],
      [
        10.936554,
        76.955268
      ],
      [
        10.936736,
        76.955187
      ]
    ],
    "floors": 3,
    "estimatedHeight": 12.0,
    "archetype": "academic",
    "aliases": [
      "c6"
    ],
    "confidence": "high",
    "description": "Computing facilities and academic seminar halls.",
    "source": "Google Maps satellite + OpenStreetMap official survey"
  }
];

export const CAMPUS_ROADS_GEO = [
  {
    "id": "road_25780556",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.936074,
        76.956803
      ],
      [
        10.935706,
        76.956824
      ],
      [
        10.935679,
        76.955776
      ],
      [
        10.935083,
        76.955768
      ]
    ]
  },
  {
    "id": "road_25780566",
    "name": "SRI KRISHNA COLLEGE ROAD",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.938183,
        76.957974
      ],
      [
        10.938698,
        76.959003
      ],
      [
        10.939081,
        76.959845
      ],
      [
        10.939146,
        76.959987
      ],
      [
        10.939594,
        76.960617
      ],
      [
        10.939675,
        76.960781
      ],
      [
        10.9397,
        76.961102
      ],
      [
        10.939706,
        76.961271
      ],
      [
        10.939346,
        76.961296
      ]
    ]
  },
  {
    "id": "road_25780568",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.936317,
        76.95834
      ],
      [
        10.936648,
        76.95826
      ],
      [
        10.936996,
        76.958292
      ],
      [
        10.937225,
        76.958375
      ],
      [
        10.937368,
        76.958428
      ],
      [
        10.937604,
        76.95839
      ],
      [
        10.937862,
        76.958348
      ],
      [
        10.938183,
        76.957974
      ],
      [
        10.938149,
        76.957333
      ],
      [
        10.938139,
        76.956885
      ],
      [
        10.937483,
        76.956903
      ],
      [
        10.937215,
        76.95691
      ],
      [
        10.937153,
        76.956912
      ],
      [
        10.936897,
        76.956838
      ],
      [
        10.93678,
        76.956803
      ],
      [
        10.936523,
        76.956803
      ],
      [
        10.936158,
        76.956803
      ],
      [
        10.936074,
        76.956803
      ]
    ]
  },
  {
    "id": "road_25780570",
    "name": "SIDCO-Sugunapuram Rd",
    "highwayType": "tertiary",
    "widthMeters": 4.5,
    "points": [
      [
        10.936317,
        76.95834
      ],
      [
        10.936608,
        76.95906
      ],
      [
        10.936698,
        76.959446
      ],
      [
        10.936735,
        76.959748
      ],
      [
        10.936722,
        76.960277
      ],
      [
        10.936776,
        76.960816
      ],
      [
        10.936882,
        76.961254
      ],
      [
        10.937034,
        76.961692
      ],
      [
        10.937224,
        76.96224
      ],
      [
        10.937356,
        76.962749
      ],
      [
        10.937438,
        76.963066
      ],
      [
        10.937455,
        76.963134
      ],
      [
        10.937618,
        76.963765
      ],
      [
        10.937694,
        76.964632
      ],
      [
        10.937716,
        76.964813
      ],
      [
        10.937741,
        76.964951
      ],
      [
        10.937832,
        76.965451
      ],
      [
        10.937903,
        76.965841
      ],
      [
        10.937911,
        76.966148
      ],
      [
        10.937917,
        76.966379
      ],
      [
        10.937919,
        76.966444
      ],
      [
        10.937881,
        76.96696
      ],
      [
        10.937815,
        76.967138
      ],
      [
        10.937627,
        76.967759
      ],
      [
        10.937649,
        76.96787
      ],
      [
        10.93767,
        76.967974
      ],
      [
        10.937998,
        76.96859
      ],
      [
        10.938077,
        76.968739
      ],
      [
        10.938171,
        76.968917
      ],
      [
        10.938272,
        76.969104
      ],
      [
        10.938369,
        76.969287
      ],
      [
        10.938457,
        76.969453
      ],
      [
        10.93859,
        76.969702
      ],
      [
        10.939029,
        76.970403
      ],
      [
        10.939096,
        76.970511
      ],
      [
        10.939099,
        76.97058
      ],
      [
        10.939111,
        76.970843
      ],
      [
        10.939113,
        76.970898
      ],
      [
        10.938868,
        76.971276
      ],
      [
        10.938887,
        76.971502
      ],
      [
        10.938902,
        76.97168
      ],
      [
        10.93903,
        76.971974
      ],
      [
        10.939647,
        76.973399
      ]
    ]
  },
  {
    "id": "road_93418919",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.938139,
        76.956885
      ],
      [
        10.938117,
        76.956372
      ],
      [
        10.938112,
        76.956261
      ],
      [
        10.938104,
        76.955999
      ],
      [
        10.938085,
        76.955526
      ],
      [
        10.938064,
        76.955146
      ],
      [
        10.937933,
        76.955208
      ],
      [
        10.937931,
        76.95535
      ],
      [
        10.937972,
        76.955496
      ],
      [
        10.938085,
        76.955526
      ]
    ]
  },
  {
    "id": "road_207171597",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.93377,
        76.956052
      ],
      [
        10.933871,
        76.956221
      ],
      [
        10.934028,
        76.956734
      ],
      [
        10.934116,
        76.957046
      ],
      [
        10.934272,
        76.957405
      ],
      [
        10.934291,
        76.957502
      ],
      [
        10.934381,
        76.957958
      ],
      [
        10.935194,
        76.95775
      ],
      [
        10.934997,
        76.956892
      ],
      [
        10.934779,
        76.956355
      ],
      [
        10.934929,
        76.956273
      ],
      [
        10.934935,
        76.956146
      ],
      [
        10.934802,
        76.955627
      ],
      [
        10.934958,
        76.95551
      ]
    ]
  },
  {
    "id": "road_207171599",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935881,
        76.963109
      ],
      [
        10.936031,
        76.963061
      ],
      [
        10.93608,
        76.962921
      ],
      [
        10.936177,
        76.962742
      ],
      [
        10.935898,
        76.961478
      ],
      [
        10.936,
        76.96128
      ],
      [
        10.936099,
        76.961422
      ],
      [
        10.936251,
        76.961711
      ],
      [
        10.936363,
        76.962013
      ],
      [
        10.936407,
        76.962149
      ],
      [
        10.936558,
        76.96261
      ],
      [
        10.936668,
        76.962638
      ],
      [
        10.936862,
        76.962943
      ],
      [
        10.93697,
        76.963113
      ],
      [
        10.937086,
        76.963132
      ],
      [
        10.937438,
        76.963066
      ]
    ]
  },
  {
    "id": "road_207171601",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.9369,
        76.965235
      ],
      [
        10.936718,
        76.96501
      ],
      [
        10.936413,
        76.964615
      ],
      [
        10.936309,
        76.964347
      ],
      [
        10.936167,
        76.964116
      ],
      [
        10.935927,
        76.963843
      ],
      [
        10.935833,
        76.963641
      ],
      [
        10.935773,
        76.963358
      ],
      [
        10.935963,
        76.963236
      ],
      [
        10.935881,
        76.963109
      ],
      [
        10.935375,
        76.962088
      ],
      [
        10.93566,
        76.961954
      ],
      [
        10.935553,
        76.961264
      ],
      [
        10.935518,
        76.960966
      ],
      [
        10.935405,
        76.960577
      ]
    ]
  },
  {
    "id": "road_207171723",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.93414,
        76.953691
      ],
      [
        10.933669,
        76.953881
      ],
      [
        10.933316,
        76.954024
      ],
      [
        10.933303,
        76.954304
      ],
      [
        10.933279,
        76.954814
      ],
      [
        10.933273,
        76.954951
      ],
      [
        10.932964,
        76.955051
      ]
    ]
  },
  {
    "id": "road_207171731",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.941161,
        76.953679
      ],
      [
        10.940845,
        76.953665
      ],
      [
        10.940247,
        76.953638
      ],
      [
        10.940244,
        76.954017
      ],
      [
        10.940654,
        76.954031
      ],
      [
        10.941152,
        76.954048
      ]
    ]
  },
  {
    "id": "road_207171759",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.942661,
        76.954533
      ],
      [
        10.942382,
        76.954519
      ],
      [
        10.942067,
        76.954504
      ],
      [
        10.941615,
        76.954482
      ],
      [
        10.941141,
        76.954458
      ],
      [
        10.940654,
        76.954434
      ],
      [
        10.940576,
        76.95443
      ],
      [
        10.939898,
        76.954403
      ]
    ]
  },
  {
    "id": "road_454503704",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.936,
        76.96128
      ],
      [
        10.935969,
        76.960678
      ],
      [
        10.935953,
        76.960405
      ],
      [
        10.935949,
        76.960332
      ],
      [
        10.935887,
        76.959953
      ],
      [
        10.935829,
        76.959509
      ],
      [
        10.93576,
        76.959161
      ],
      [
        10.935576,
        76.958898
      ]
    ]
  },
  {
    "id": "road_500029301",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.934381,
        76.957958
      ],
      [
        10.934414,
        76.95828
      ],
      [
        10.934429,
        76.95842
      ],
      [
        10.934429,
        76.958672
      ]
    ]
  },
  {
    "id": "road_503500296",
    "name": "Sri Krishna College Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.938064,
        76.955146
      ],
      [
        10.938053,
        76.954899
      ],
      [
        10.938018,
        76.954158
      ],
      [
        10.938016,
        76.954115
      ],
      [
        10.938066,
        76.954072
      ],
      [
        10.938579,
        76.953633
      ],
      [
        10.938769,
        76.953471
      ],
      [
        10.938811,
        76.953374
      ],
      [
        10.938927,
        76.952754
      ],
      [
        10.938995,
        76.952387
      ],
      [
        10.9391,
        76.951902
      ]
    ]
  },
  {
    "id": "road_503500299",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.937497,
        76.952429
      ],
      [
        10.937868,
        76.952439
      ],
      [
        10.938173,
        76.952453
      ],
      [
        10.938191,
        76.952459
      ],
      [
        10.938204,
        76.952468
      ],
      [
        10.93821,
        76.952481
      ],
      [
        10.938152,
        76.953078
      ]
    ]
  },
  {
    "id": "road_571426533",
    "name": "Campus Internal Road",
    "highwayType": "steps",
    "widthMeters": 2.2,
    "points": [
      [
        10.938112,
        76.956261
      ],
      [
        10.937877,
        76.956259
      ]
    ]
  },
  {
    "id": "road_571426534",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.938104,
        76.955999
      ],
      [
        10.93747,
        76.95601
      ],
      [
        10.937352,
        76.956012
      ],
      [
        10.937188,
        76.956015
      ],
      [
        10.936951,
        76.956019
      ],
      [
        10.936888,
        76.956022
      ],
      [
        10.936511,
        76.956037
      ],
      [
        10.936122,
        76.956053
      ]
    ]
  },
  {
    "id": "road_571426535",
    "name": "Campus Internal Road",
    "highwayType": "steps",
    "widthMeters": 2.2,
    "points": [
      [
        10.937695,
        76.955431
      ],
      [
        10.937464,
        76.955426
      ],
      [
        10.937408,
        76.955426
      ]
    ]
  },
  {
    "id": "road_571426536",
    "name": "Campus Internal Road",
    "highwayType": "path",
    "widthMeters": 2.2,
    "points": [
      [
        10.937408,
        76.955426
      ],
      [
        10.937336,
        76.955468
      ],
      [
        10.937343,
        76.955547
      ],
      [
        10.937357,
        76.95571
      ],
      [
        10.937352,
        76.956012
      ]
    ]
  },
  {
    "id": "road_571426537",
    "name": "Campus Internal Road",
    "highwayType": "path",
    "widthMeters": 2.2,
    "points": [
      [
        10.937357,
        76.95571
      ],
      [
        10.937292,
        76.955704
      ]
    ]
  },
  {
    "id": "road_571426550",
    "name": "Campus Internal Road",
    "highwayType": "steps",
    "widthMeters": 2.2,
    "points": [
      [
        10.937695,
        76.955431
      ],
      [
        10.937789,
        76.955573
      ],
      [
        10.938085,
        76.955526
      ]
    ]
  },
  {
    "id": "road_572762982",
    "name": "SIDCO-Sugunapuram Rd",
    "highwayType": "tertiary",
    "widthMeters": 4.5,
    "points": [
      [
        10.933919,
        76.953392
      ],
      [
        10.934088,
        76.953626
      ],
      [
        10.93414,
        76.953691
      ],
      [
        10.934618,
        76.954288
      ],
      [
        10.934704,
        76.954925
      ],
      [
        10.934785,
        76.955113
      ],
      [
        10.934924,
        76.955433
      ],
      [
        10.934958,
        76.95551
      ],
      [
        10.934983,
        76.955567
      ],
      [
        10.935083,
        76.955768
      ],
      [
        10.935297,
        76.956194
      ],
      [
        10.935472,
        76.956619
      ],
      [
        10.935731,
        76.957309
      ],
      [
        10.935881,
        76.957588
      ],
      [
        10.936317,
        76.95834
      ]
    ]
  },
  {
    "id": "road_581433065",
    "name": "Palghat road",
    "highwayType": "primary",
    "widthMeters": 4.5,
    "points": [
      [
        10.974311,
        76.96108
      ],
      [
        10.97417,
        76.960745
      ],
      [
        10.974067,
        76.960486
      ],
      [
        10.973946,
        76.960211
      ],
      [
        10.973852,
        76.959989
      ],
      [
        10.97376,
        76.959777
      ],
      [
        10.973719,
        76.959688
      ],
      [
        10.973647,
        76.959589
      ],
      [
        10.973563,
        76.959517
      ],
      [
        10.973456,
        76.959431
      ],
      [
        10.973226,
        76.959283
      ],
      [
        10.973067,
        76.959164
      ],
      [
        10.972918,
        76.959034
      ],
      [
        10.972639,
        76.958768
      ],
      [
        10.972042,
        76.958144
      ],
      [
        10.971981,
        76.95808
      ],
      [
        10.971348,
        76.957418
      ],
      [
        10.971208,
        76.95726
      ],
      [
        10.97071,
        76.956703
      ],
      [
        10.970603,
        76.956583
      ],
      [
        10.970493,
        76.956478
      ],
      [
        10.970395,
        76.956398
      ],
      [
        10.970295,
        76.956328
      ],
      [
        10.970185,
        76.956269
      ],
      [
        10.970082,
        76.956237
      ],
      [
        10.970024,
        76.956221
      ],
      [
        10.969921,
        76.956199
      ],
      [
        10.969768,
        76.956176
      ],
      [
        10.969731,
        76.956166
      ],
      [
        10.969661,
        76.956154
      ],
      [
        10.96935,
        76.956098
      ],
      [
        10.968901,
        76.956031
      ],
      [
        10.968726,
        76.956005
      ],
      [
        10.968665,
        76.955996
      ],
      [
        10.967421,
        76.955781
      ],
      [
        10.966319,
        76.955603
      ],
      [
        10.965854,
        76.955518
      ],
      [
        10.965332,
        76.955423
      ],
      [
        10.964468,
        76.955262
      ],
      [
        10.964041,
        76.955192
      ],
      [
        10.963519,
        76.955131
      ],
      [
        10.963452,
        76.955124
      ],
      [
        10.963317,
        76.955103
      ],
      [
        10.963135,
        76.955074
      ],
      [
        10.962648,
        76.955003
      ],
      [
        10.962605,
        76.954998
      ],
      [
        10.962493,
        76.954983
      ],
      [
        10.962384,
        76.95497
      ],
      [
        10.962129,
        76.954922
      ],
      [
        10.9614,
        76.954787
      ],
      [
        10.961068,
        76.954726
      ],
      [
        10.960728,
        76.954662
      ],
      [
        10.959915,
        76.954551
      ],
      [
        10.95948,
        76.954468
      ],
      [
        10.959324,
        76.954438
      ],
      [
        10.958798,
        76.954322
      ],
      [
        10.958412,
        76.954225
      ],
      [
        10.958355,
        76.954215
      ],
      [
        10.95793,
        76.954139
      ],
      [
        10.957396,
        76.95405
      ],
      [
        10.957038,
        76.953999
      ],
      [
        10.956412,
        76.953912
      ],
      [
        10.956029,
        76.953858
      ],
      [
        10.955979,
        76.953851
      ],
      [
        10.955473,
        76.953779
      ],
      [
        10.955145,
        76.953742
      ],
      [
        10.954803,
        76.953703
      ],
      [
        10.953755,
        76.953676
      ],
      [
        10.953082,
        76.953631
      ],
      [
        10.952606,
        76.953618
      ],
      [
        10.952144,
        76.953628
      ],
      [
        10.952092,
        76.953629
      ],
      [
        10.95157,
        76.953642
      ],
      [
        10.951008,
        76.953649
      ],
      [
        10.950459,
        76.953655
      ],
      [
        10.949977,
        76.953658
      ],
      [
        10.949455,
        76.95365
      ],
      [
        10.949163,
        76.953637
      ],
      [
        10.948925,
        76.95361
      ],
      [
        10.948571,
        76.953579
      ],
      [
        10.948506,
        76.953569
      ],
      [
        10.948197,
        76.953557
      ],
      [
        10.947828,
        76.953517
      ],
      [
        10.947472,
        76.953467
      ],
      [
        10.947148,
        76.953422
      ],
      [
        10.946807,
        76.953378
      ],
      [
        10.946216,
        76.953286
      ],
      [
        10.94574,
        76.95323
      ],
      [
        10.945261,
        76.953173
      ],
      [
        10.94466,
        76.953092
      ],
      [
        10.944593,
        76.953084
      ],
      [
        10.943814,
        76.952963
      ],
      [
        10.943288,
        76.952866
      ],
      [
        10.942904,
        76.952787
      ],
      [
        10.942535,
        76.952704
      ],
      [
        10.941954,
        76.952587
      ],
      [
        10.941225,
        76.952405
      ],
      [
        10.940982,
        76.952346
      ],
      [
        10.940313,
        76.952178
      ],
      [
        10.940087,
        76.952124
      ],
      [
        10.939947,
        76.952094
      ],
      [
        10.939191,
        76.951922
      ],
      [
        10.9391,
        76.951902
      ],
      [
        10.938499,
        76.951754
      ],
      [
        10.937643,
        76.95154
      ],
      [
        10.937126,
        76.951385
      ],
      [
        10.936889,
        76.951325
      ],
      [
        10.936615,
        76.951243
      ],
      [
        10.936209,
        76.951084
      ],
      [
        10.935596,
        76.950826
      ],
      [
        10.935211,
        76.950673
      ],
      [
        10.933757,
        76.950093
      ],
      [
        10.933168,
        76.949878
      ],
      [
        10.932958,
        76.949809
      ],
      [
        10.932927,
        76.949805
      ],
      [
        10.932633,
        76.949766
      ],
      [
        10.932506,
        76.949765
      ],
      [
        10.931796,
        76.949769
      ],
      [
        10.931413,
        76.94975
      ],
      [
        10.930321,
        76.94966
      ],
      [
        10.930058,
        76.949667
      ],
      [
        10.929644,
        76.949678
      ]
    ]
  },
  {
    "id": "road_581433079",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.937643,
        76.95154
      ],
      [
        10.937499,
        76.952354
      ],
      [
        10.937497,
        76.952429
      ],
      [
        10.937468,
        76.953288
      ],
      [
        10.937188,
        76.953266
      ],
      [
        10.936762,
        76.953232
      ],
      [
        10.936177,
        76.953186
      ]
    ]
  },
  {
    "id": "road_592275139",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.934924,
        76.955433
      ],
      [
        10.935989,
        76.955214
      ]
    ]
  },
  {
    "id": "road_592275140",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.934785,
        76.955113
      ],
      [
        10.93615,
        76.954914
      ]
    ]
  },
  {
    "id": "road_592275142",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.937868,
        76.952439
      ],
      [
        10.937852,
        76.952825
      ],
      [
        10.937867,
        76.953156
      ]
    ]
  },
  {
    "id": "road_592278620",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.940562,
        76.955332
      ],
      [
        10.940051,
        76.955116
      ],
      [
        10.939663,
        76.954953
      ],
      [
        10.939299,
        76.954795
      ],
      [
        10.939026,
        76.954676
      ]
    ]
  },
  {
    "id": "road_592278621",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.940573,
        76.954651
      ],
      [
        10.94012,
        76.954611
      ],
      [
        10.940053,
        76.954605
      ],
      [
        10.93982,
        76.954457
      ],
      [
        10.939762,
        76.954452
      ],
      [
        10.939727,
        76.954484
      ],
      [
        10.939663,
        76.954953
      ]
    ]
  },
  {
    "id": "road_592278622",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.94012,
        76.954611
      ],
      [
        10.940051,
        76.955116
      ]
    ]
  },
  {
    "id": "road_592278623",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.940051,
        76.955116
      ],
      [
        10.940088,
        76.955412
      ],
      [
        10.940148,
        76.955789
      ],
      [
        10.940126,
        76.955871
      ],
      [
        10.940054,
        76.956137
      ],
      [
        10.940044,
        76.956264
      ],
      [
        10.940035,
        76.956389
      ],
      [
        10.940066,
        76.957046
      ],
      [
        10.940083,
        76.95739
      ],
      [
        10.940097,
        76.957696
      ],
      [
        10.940099,
        76.957739
      ],
      [
        10.94011,
        76.957971
      ]
    ]
  },
  {
    "id": "road_592278625",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.940044,
        76.956264
      ],
      [
        10.939675,
        76.956287
      ]
    ]
  },
  {
    "id": "road_592278627",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.940099,
        76.957739
      ],
      [
        10.940448,
        76.957722
      ]
    ]
  },
  {
    "id": "road_592278628",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.940097,
        76.957696
      ],
      [
        10.939853,
        76.957712
      ]
    ]
  },
  {
    "id": "road_592278630",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.939299,
        76.954795
      ],
      [
        10.939272,
        76.955002
      ],
      [
        10.93924,
        76.955241
      ]
    ]
  },
  {
    "id": "road_592278632",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.939272,
        76.955002
      ],
      [
        10.939045,
        76.954999
      ]
    ]
  },
  {
    "id": "road_672239350",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.941989,
        76.956639
      ],
      [
        10.941147,
        76.956566
      ],
      [
        10.940872,
        76.956615
      ],
      [
        10.940594,
        76.95663
      ],
      [
        10.940464,
        76.956651
      ],
      [
        10.940304,
        76.956678
      ]
    ]
  },
  {
    "id": "road_761647346",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.936363,
        76.962013
      ],
      [
        10.936527,
        76.961969
      ],
      [
        10.936559,
        76.961896
      ],
      [
        10.93668,
        76.961859
      ],
      [
        10.936708,
        76.961828
      ],
      [
        10.93672,
        76.961774
      ],
      [
        10.936621,
        76.961423
      ],
      [
        10.936658,
        76.961358
      ],
      [
        10.93672,
        76.961311
      ],
      [
        10.936882,
        76.961254
      ]
    ]
  },
  {
    "id": "road_1002488877",
    "name": "Campus Internal Road",
    "highwayType": "path",
    "widthMeters": 2.2,
    "points": [
      [
        10.936888,
        76.956022
      ],
      [
        10.936892,
        76.956364
      ],
      [
        10.936897,
        76.956838
      ]
    ]
  },
  {
    "id": "road_1002940002",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.939675,
        76.960781
      ],
      [
        10.938373,
        76.961011
      ],
      [
        10.938252,
        76.960958
      ],
      [
        10.938133,
        76.960824
      ],
      [
        10.938022,
        76.960673
      ]
    ]
  },
  {
    "id": "road_1066080823",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.934414,
        76.95828
      ],
      [
        10.933908,
        76.958414
      ],
      [
        10.933677,
        76.958451
      ],
      [
        10.933623,
        76.958451
      ],
      [
        10.933528,
        76.958494
      ],
      [
        10.933244,
        76.958574
      ],
      [
        10.932838,
        76.95865
      ]
    ]
  },
  {
    "id": "road_1066080826",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.933465,
        76.956879
      ],
      [
        10.933687,
        76.956836
      ],
      [
        10.934028,
        76.956734
      ]
    ]
  },
  {
    "id": "road_1066080827",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.934287,
        76.955334
      ],
      [
        10.933934,
        76.955554
      ],
      [
        10.933802,
        76.955677
      ],
      [
        10.933642,
        76.955737
      ],
      [
        10.933204,
        76.955888
      ]
    ]
  },
  {
    "id": "road_1066080849",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.934313,
        76.95347
      ],
      [
        10.934088,
        76.953626
      ]
    ]
  },
  {
    "id": "road_1066080850",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.934287,
        76.955334
      ],
      [
        10.934634,
        76.956
      ],
      [
        10.934779,
        76.956355
      ]
    ]
  },
  {
    "id": "road_1066080851",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.934535,
        76.956439
      ],
      [
        10.93414,
        76.955817
      ],
      [
        10.934103,
        76.95579
      ],
      [
        10.933934,
        76.955554
      ],
      [
        10.933744,
        76.955291
      ],
      [
        10.933505,
        76.955399
      ]
    ]
  },
  {
    "id": "road_1066080852",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.934287,
        76.955334
      ],
      [
        10.934098,
        76.954722
      ],
      [
        10.933893,
        76.954453
      ]
    ]
  },
  {
    "id": "road_1066080854",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.937188,
        76.953266
      ],
      [
        10.937167,
        76.953572
      ],
      [
        10.937183,
        76.953626
      ],
      [
        10.937167,
        76.953717
      ],
      [
        10.937151,
        76.953808
      ],
      [
        10.93713,
        76.953846
      ],
      [
        10.937099,
        76.953857
      ],
      [
        10.937025,
        76.95384
      ],
      [
        10.936867,
        76.953771
      ],
      [
        10.936704,
        76.953701
      ],
      [
        10.936414,
        76.953565
      ],
      [
        10.935847,
        76.953332
      ],
      [
        10.935792,
        76.95331
      ],
      [
        10.935655,
        76.953251
      ],
      [
        10.935419,
        76.95313
      ],
      [
        10.935296,
        76.95313
      ],
      [
        10.935216,
        76.953106
      ]
    ]
  },
  {
    "id": "road_1066086291",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.934291,
        76.957502
      ],
      [
        10.934677,
        76.95741
      ]
    ]
  },
  {
    "id": "road_1066086296",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935483,
        76.963235
      ],
      [
        10.935209,
        76.962656
      ],
      [
        10.935051,
        76.962291
      ],
      [
        10.935146,
        76.962216
      ],
      [
        10.935375,
        76.962088
      ],
      [
        10.935172,
        76.961653
      ],
      [
        10.935088,
        76.961406
      ]
    ]
  },
  {
    "id": "road_1066086303",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935868,
        76.952792
      ],
      [
        10.936765,
        76.952797
      ],
      [
        10.936767,
        76.952877
      ],
      [
        10.936762,
        76.953232
      ],
      [
        10.936725,
        76.953633
      ],
      [
        10.936704,
        76.953701
      ]
    ]
  },
  {
    "id": "road_1066086304",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.937821,
        76.953633
      ],
      [
        10.937183,
        76.953626
      ]
    ]
  },
  {
    "id": "road_1066086305",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.937796,
        76.953292
      ],
      [
        10.937468,
        76.953288
      ]
    ]
  },
  {
    "id": "road_1066086306",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.938927,
        76.952754
      ],
      [
        10.938727,
        76.95278
      ],
      [
        10.938695,
        76.952812
      ],
      [
        10.938658,
        76.952963
      ],
      [
        10.938611,
        76.953199
      ],
      [
        10.938585,
        76.953387
      ]
    ]
  },
  {
    "id": "road_1066086307",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.938579,
        76.953633
      ],
      [
        10.938585,
        76.953387
      ]
    ]
  },
  {
    "id": "road_1066086309",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.936767,
        76.95243
      ],
      [
        10.935893,
        76.952369
      ],
      [
        10.935868,
        76.952792
      ]
    ]
  },
  {
    "id": "road_1066086310",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935792,
        76.95331
      ],
      [
        10.935814,
        76.953253
      ],
      [
        10.935865,
        76.952814
      ],
      [
        10.935868,
        76.952792
      ]
    ]
  },
  {
    "id": "road_1066086311",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.936767,
        76.95243
      ],
      [
        10.937196,
        76.952448
      ]
    ]
  },
  {
    "id": "road_1066086312",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.937188,
        76.958854
      ],
      [
        10.937378,
        76.958827
      ],
      [
        10.937567,
        76.958805
      ],
      [
        10.937636,
        76.958789
      ],
      [
        10.937646,
        76.958778
      ],
      [
        10.937641,
        76.958725
      ],
      [
        10.937625,
        76.958585
      ],
      [
        10.937604,
        76.95839
      ]
    ]
  },
  {
    "id": "road_1066086313",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.937188,
        76.958854
      ],
      [
        10.937178,
        76.958725
      ],
      [
        10.937225,
        76.958375
      ]
    ]
  },
  {
    "id": "road_1066086314",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.937188,
        76.958854
      ],
      [
        10.936608,
        76.95906
      ]
    ]
  },
  {
    "id": "road_1066086315",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.939081,
        76.959845
      ],
      [
        10.938031,
        76.960049
      ],
      [
        10.937895,
        76.960054
      ]
    ]
  },
  {
    "id": "road_1066086316",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.940126,
        76.955871
      ],
      [
        10.939542,
        76.955855
      ]
    ]
  },
  {
    "id": "road_1066086321",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.939326,
        76.954336
      ],
      [
        10.939299,
        76.954795
      ]
    ]
  },
  {
    "id": "road_1066086322",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.939326,
        76.954336
      ],
      [
        10.939095,
        76.954293
      ]
    ]
  },
  {
    "id": "road_1066086323",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.939026,
        76.954676
      ],
      [
        10.938477,
        76.95436
      ]
    ]
  },
  {
    "id": "road_1066086324",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.939326,
        76.954336
      ],
      [
        10.939727,
        76.954484
      ]
    ]
  },
  {
    "id": "road_1066086325",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.939898,
        76.954403
      ],
      [
        10.93982,
        76.954457
      ]
    ]
  },
  {
    "id": "road_1132428472",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935953,
        76.960405
      ],
      [
        10.936038,
        76.960293
      ],
      [
        10.936056,
        76.959956
      ],
      [
        10.936088,
        76.959742
      ],
      [
        10.936143,
        76.959615
      ],
      [
        10.936166,
        76.959321
      ],
      [
        10.936102,
        76.958864
      ],
      [
        10.936024,
        76.95856
      ],
      [
        10.935758,
        76.958289
      ],
      [
        10.935616,
        76.958126
      ],
      [
        10.93557,
        76.95807
      ],
      [
        10.935477,
        76.957793
      ],
      [
        10.935397,
        76.957772
      ],
      [
        10.935348,
        76.957706
      ]
    ]
  },
  {
    "id": "road_1145038760",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.938143,
        76.954084
      ],
      [
        10.938066,
        76.954072
      ],
      [
        10.937852,
        76.954021
      ],
      [
        10.936183,
        76.953982
      ],
      [
        10.935569,
        76.953779
      ],
      [
        10.93485,
        76.953735
      ]
    ]
  },
  {
    "id": "road_1145038761",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.939191,
        76.951922
      ],
      [
        10.938869,
        76.953383
      ],
      [
        10.93881,
        76.953511
      ],
      [
        10.938143,
        76.954084
      ],
      [
        10.938098,
        76.954123
      ],
      [
        10.938018,
        76.954158
      ]
    ]
  },
  {
    "id": "road_1231083906",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.937034,
        76.961692
      ],
      [
        10.937586,
        76.961607
      ]
    ]
  },
  {
    "id": "road_1231083907",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.937586,
        76.961607
      ],
      [
        10.938148,
        76.961524
      ]
    ]
  },
  {
    "id": "road_1231282280",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.936414,
        76.953565
      ],
      [
        10.936393,
        76.953763
      ],
      [
        10.936387,
        76.953953
      ]
    ]
  },
  {
    "id": "road_1231284324",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935216,
        76.953106
      ],
      [
        10.934696,
        76.95293
      ],
      [
        10.934679,
        76.952914
      ],
      [
        10.934683,
        76.952896
      ],
      [
        10.934827,
        76.952733
      ]
    ]
  },
  {
    "id": "road_1231284325",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935419,
        76.95313
      ],
      [
        10.935356,
        76.953035
      ],
      [
        10.935315,
        76.952972
      ]
    ]
  },
  {
    "id": "road_1231284326",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935315,
        76.952972
      ],
      [
        10.935303,
        76.952935
      ],
      [
        10.935306,
        76.952753
      ],
      [
        10.935312,
        76.952396
      ]
    ]
  },
  {
    "id": "road_1231284327",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935312,
        76.952396
      ],
      [
        10.93531,
        76.952353
      ],
      [
        10.935295,
        76.952324
      ],
      [
        10.935269,
        76.952309
      ],
      [
        10.935237,
        76.952311
      ],
      [
        10.935209,
        76.952327
      ],
      [
        10.934827,
        76.952733
      ]
    ]
  },
  {
    "id": "road_1231284328",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935356,
        76.953035
      ],
      [
        10.935148,
        76.95292
      ]
    ]
  },
  {
    "id": "road_1231284329",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.934827,
        76.952733
      ],
      [
        10.935148,
        76.95292
      ]
    ]
  },
  {
    "id": "road_1231284562",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935296,
        76.95313
      ],
      [
        10.93528,
        76.95336
      ]
    ]
  },
  {
    "id": "road_1231284563",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.93528,
        76.95336
      ],
      [
        10.935264,
        76.953605
      ]
    ]
  },
  {
    "id": "road_1231284564",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935306,
        76.952753
      ],
      [
        10.935865,
        76.952814
      ]
    ]
  },
  {
    "id": "road_1235108541",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.935847,
        76.953332
      ],
      [
        10.935832,
        76.953676
      ]
    ]
  },
  {
    "id": "road_1236188830",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.937867,
        76.953156
      ],
      [
        10.937881,
        76.953188
      ],
      [
        10.937902,
        76.953234
      ],
      [
        10.937927,
        76.953265
      ],
      [
        10.937971,
        76.953285
      ],
      [
        10.938031,
        76.953291
      ],
      [
        10.93848,
        76.953355
      ]
    ]
  },
  {
    "id": "road_1236191312",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.940088,
        76.955412
      ],
      [
        10.939299,
        76.955445
      ]
    ]
  },
  {
    "id": "road_1236191484",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.940354,
        76.957026
      ],
      [
        10.940066,
        76.957046
      ]
    ]
  },
  {
    "id": "road_1236191485",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.940066,
        76.957046
      ],
      [
        10.939721,
        76.957064
      ],
      [
        10.9397,
        76.957065
      ],
      [
        10.939687,
        76.957054
      ],
      [
        10.939677,
        76.957033
      ],
      [
        10.939676,
        76.95666
      ],
      [
        10.939675,
        76.956287
      ]
    ]
  },
  {
    "id": "road_1236191486",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.939676,
        76.95666
      ],
      [
        10.939305,
        76.956682
      ]
    ]
  },
  {
    "id": "road_1236191487",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.939675,
        76.956287
      ],
      [
        10.939141,
        76.9563
      ]
    ]
  },
  {
    "id": "road_1236191488",
    "name": "Campus Internal Road",
    "highwayType": "residential",
    "widthMeters": 4.5,
    "points": [
      [
        10.940083,
        76.95739
      ],
      [
        10.939735,
        76.957406
      ]
    ]
  },
  {
    "id": "road_1341575135",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.938018,
        76.954158
      ],
      [
        10.937779,
        76.954293
      ],
      [
        10.937591,
        76.954922
      ]
    ]
  },
  {
    "id": "road_1341575136",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.937591,
        76.954922
      ],
      [
        10.937448,
        76.95495
      ],
      [
        10.93732,
        76.954974
      ],
      [
        10.936984,
        76.954977
      ]
    ]
  },
  {
    "id": "road_1341587985",
    "name": "Skcet bike parking",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.937779,
        76.954293
      ],
      [
        10.93761,
        76.954257
      ],
      [
        10.937381,
        76.954239
      ],
      [
        10.937,
        76.954209
      ],
      [
        10.936711,
        76.954184
      ]
    ]
  },
  {
    "id": "road_1341588019",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.938064,
        76.955146
      ],
      [
        10.937847,
        76.955134
      ],
      [
        10.937733,
        76.955207
      ],
      [
        10.937684,
        76.955353
      ],
      [
        10.937695,
        76.955431
      ]
    ]
  },
  {
    "id": "road_1341588066",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.937464,
        76.955426
      ],
      [
        10.937448,
        76.95495
      ]
    ]
  },
  {
    "id": "road_1341592844",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.937343,
        76.955547
      ],
      [
        10.936941,
        76.955568
      ],
      [
        10.936942,
        76.955803
      ],
      [
        10.936951,
        76.956019
      ]
    ]
  },
  {
    "id": "road_1341592845",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.936942,
        76.955803
      ],
      [
        10.936842,
        76.955825
      ]
    ]
  },
  {
    "id": "road_1341592846",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.936122,
        76.956053
      ],
      [
        10.936109,
        76.955642
      ]
    ]
  },
  {
    "id": "road_1341592847",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.936122,
        76.956053
      ],
      [
        10.936139,
        76.956405
      ],
      [
        10.936158,
        76.956803
      ]
    ]
  },
  {
    "id": "road_1341592848",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.936511,
        76.956037
      ],
      [
        10.936515,
        76.956348
      ],
      [
        10.936516,
        76.956405
      ],
      [
        10.936519,
        76.956611
      ],
      [
        10.936523,
        76.956803
      ]
    ]
  },
  {
    "id": "road_1341592849",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.936892,
        76.956364
      ],
      [
        10.936653,
        76.956366
      ]
    ]
  },
  {
    "id": "road_1341592850",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.937198,
        76.956412
      ],
      [
        10.937201,
        76.95651
      ]
    ]
  },
  {
    "id": "road_1341592851",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.937188,
        76.956015
      ],
      [
        10.937198,
        76.956412
      ]
    ]
  },
  {
    "id": "road_1341592852",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.937201,
        76.95651
      ],
      [
        10.937215,
        76.95691
      ]
    ]
  },
  {
    "id": "road_1341599325",
    "name": "Campus Internal Road",
    "highwayType": "steps",
    "widthMeters": 2.2,
    "points": [
      [
        10.938374,
        76.956162
      ],
      [
        10.938368,
        76.956251
      ],
      [
        10.938112,
        76.956261
      ]
    ]
  },
  {
    "id": "road_1341599326",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.938117,
        76.956372
      ],
      [
        10.938534,
        76.956371
      ],
      [
        10.938613,
        76.956537
      ]
    ]
  },
  {
    "id": "road_1341599327",
    "name": "Campus Internal Road",
    "highwayType": "steps",
    "widthMeters": 2.2,
    "points": [
      [
        10.938613,
        76.956537
      ],
      [
        10.938615,
        76.956659
      ],
      [
        10.938676,
        76.956658
      ]
    ]
  },
  {
    "id": "road_1341599328",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.938374,
        76.956162
      ],
      [
        10.938479,
        76.956268
      ],
      [
        10.938545,
        76.956279
      ],
      [
        10.938534,
        76.956371
      ]
    ]
  },
  {
    "id": "road_1341599329",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.938534,
        76.956371
      ],
      [
        10.938869,
        76.956329
      ],
      [
        10.938866,
        76.955874
      ]
    ]
  },
  {
    "id": "road_1341599330",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.938534,
        76.956371
      ],
      [
        10.938462,
        76.956504
      ],
      [
        10.938458,
        76.956512
      ],
      [
        10.938403,
        76.956539
      ],
      [
        10.938271,
        76.956535
      ],
      [
        10.938239,
        76.956539
      ],
      [
        10.938237,
        76.956563
      ]
    ]
  },
  {
    "id": "road_1341599331",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.938117,
        76.956372
      ],
      [
        10.937929,
        76.956378
      ],
      [
        10.937833,
        76.956425
      ],
      [
        10.937755,
        76.956522
      ],
      [
        10.937704,
        76.956589
      ],
      [
        10.937593,
        76.956682
      ],
      [
        10.937475,
        76.956692
      ],
      [
        10.93747,
        76.95601
      ]
    ]
  },
  {
    "id": "road_1341599332",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.937475,
        76.956692
      ],
      [
        10.937483,
        76.956903
      ]
    ]
  },
  {
    "id": "road_1341602254",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.936515,
        76.956348
      ],
      [
        10.936527,
        76.956346
      ]
    ]
  },
  {
    "id": "road_1341602255",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.936519,
        76.956611
      ],
      [
        10.936543,
        76.956604
      ]
    ]
  },
  {
    "id": "road_1341602753",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.936139,
        76.956405
      ],
      [
        10.936113,
        76.956407
      ]
    ]
  },
  {
    "id": "road_1341606645",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.936516,
        76.956405
      ],
      [
        10.936432,
        76.956403
      ]
    ]
  },
  {
    "id": "road_1341607187",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.938104,
        76.955999
      ],
      [
        10.938218,
        76.956002
      ],
      [
        10.938374,
        76.956162
      ],
      [
        10.938429,
        76.956098
      ]
    ]
  },
  {
    "id": "road_1341607188",
    "name": "Campus Internal Road",
    "highwayType": "footway",
    "widthMeters": 2.2,
    "points": [
      [
        10.937833,
        76.956425
      ],
      [
        10.937763,
        76.956337
      ]
    ]
  }
];

export const CAMPUS_SPORTS_GEO = {
  "id": "sports-stadium",
  "name": "Sri Krishna Stadium",
  "code": "SKS",
  "department": "Physical Education & Athletics Arena",
  "latitude": 10.937142,
  "longitude": 76.957527,
  "footprint": [
    [
      10.938034,
      76.957116
    ],
    [
      10.938088,
      76.957457
    ],
    [
      10.938076,
      76.957971
    ],
    [
      10.937795,
      76.958289
    ],
    [
      10.937348,
      76.958364
    ],
    [
      10.936967,
      76.958203
    ],
    [
      10.936612,
      76.958211
    ],
    [
      10.936385,
      76.958258
    ],
    [
      10.936002,
      76.957539
    ],
    [
      10.935864,
      76.957241
    ],
    [
      10.93574,
      76.956909
    ],
    [
      10.936809,
      76.956892
    ],
    [
      10.937148,
      76.956963
    ],
    [
      10.937498,
      76.956967
    ],
    [
      10.937872,
      76.956943
    ],
    [
      10.938034,
      76.957116
    ]
  ],
  "track": {
    "standard": "IAAF 400m 8-Lane Standard",
    "material": "Tartan Polyurethane Synthetic Red",
    "lengthMeters": 400
  },
  "pitch": {
    "type": "Natural Athletic Turf",
    "sports": [
      "Football",
      "Cricket",
      "Track & Field Events"
    ]
  }
};

export const CAMPUS_GATES_GEO = [
  {
    "id": "gate-main-palakkad",
    "name": "Main Campus Entrance (BK Pudur Gate)",
    "code": "GATE-01",
    "description": "Primary institutional archway gate connecting to Palakkad Main Road via Sri Krishna College Road",
    "latitude": 10.938162,
    "longitude": 76.952514,
    "type": "vehicular_pedestrian"
  },
  {
    "id": "gate-east-sugunapuram",
    "name": "East Sugunapuram Gate",
    "code": "GATE-02",
    "description": "Eastern perimeter security entrance linking to SIDCO-Sugunapuram Road and hostel blocks",
    "latitude": 10.939218,
    "longitude": 76.962054,
    "type": "vehicular_pedestrian"
  },
  {
    "id": "gate-south-pedestrian",
    "name": "South Academic Pedestrian Gate",
    "code": "GATE-03",
    "description": "Access turnstile path connecting southern academic quad and bike parking",
    "latitude": 10.93512,
    "longitude": 76.9538,
    "type": "pedestrian_only"
  }
];
