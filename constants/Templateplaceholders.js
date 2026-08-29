// ─────────────────────────────────────────────────────────────────────────────
// Templateplaceholders.js
//
// Central config for PDF template types:
//   "course-certificate"
//   "course-id-card"
//
// Usage in editor:
//   import { getSampleData, getPlaceholderFields } from "@/constants/Templateplaceholders";
//
//   const previewData       = getSampleData(type);
//   const placeholderFields = getPlaceholderFields(type);
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DATA BLOCKS (only fields that exist in actual Mongoose models)
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_CANDIDATE = {
  traineeId:         "TR-2024-001",
  firstName:         "Jane",
  lastName:          "Smith",
  dateOfBirth:       "15 Mar 1998",
  country:           "United Kingdom",
  email:             "jane.smith@example.com",
  assessmentMarks1:  48,
  assessmentMarks2:  46,
  marks:             94,
  certificateNumber: "CERT-C-2024-001",
  status:            "completed",
};

const SAMPLE_COURSE_REFERENCE = {
  courseName:        "Accident Investigation Train the Trainer",
  coursePrice:       300,
  currencySymbol:    "\u00a3",
  validity:          "3 Years",
  startDate:         "01 Feb 2024",
  endDate:           "28 Feb 2024",
  expiryDate:        "28 Feb 2027",
  trainerName:       "Ali Hassan",
  atcName:           "Petroleum and Natural Gas Institute of Technology and Training",
  atcNumber:         "ATC-002",
  atcAddress:        "45 Main Blvd, Karachi",
  country:           "United Kingdom",
  referenceNumber:   "REF-C-2024-001",
  sequenceId:        "SEQ-C-001",
  status:            "completed",
};

const SAMPLE_COURSE = {
  name:              "First Aid Level 2",
  price:             300,
  currency:          "GBP",
  currencySymbol:    "\u00a3",
  country:           "United Kingdom",
  description:       "Comprehensive first aid training covering CPR and emergency response.",
};


// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER FIELD LISTS (only fields present in the Mongoose schemas)
// ─────────────────────────────────────────────────────────────────────────────

const FIELDS_CANDIDATE = [
  { label: "Candidate.traineeId",         value: "{{Candidate.traineeId}}"         },
  { label: "Candidate.firstName",         value: "{{Candidate.firstName}}"         },
  { label: "Candidate.lastName",          value: "{{Candidate.lastName}}"          },
  { label: "Candidate.dateOfBirth",       value: "{{Candidate.dateOfBirth}}"       },
  { label: "Candidate.country",           value: "{{Candidate.country}}"           },
  { label: "Candidate.email",             value: "{{Candidate.email}}"             },
  { label: "Candidate.assessmentMarks1",  value: "{{Candidate.assessmentMarks1}}"  },
  { label: "Candidate.assessmentMarks2",  value: "{{Candidate.assessmentMarks2}}"  },
  { label: "Candidate.marks",             value: "{{Candidate.marks}}"             },
  { label: "Candidate.certificateNumber", value: "{{Candidate.certificateNumber}}" },
  { label: "Candidate.status",            value: "{{Candidate.status}}"            },
];

const FIELDS_COURSE_REFERENCE = [
  { label: "CourseReference.courseName",      value: "{{CourseReference.courseName}}"      },
  { label: "CourseReference.coursePrice",     value: "{{CourseReference.coursePrice}}"     },
  { label: "CourseReference.currencySymbol",  value: "{{CourseReference.currencySymbol}}"  },
  { label: "CourseReference.validity",        value: "{{CourseReference.validity}}"        },
  { label: "CourseReference.startDate",       value: "{{CourseReference.startDate}}"       },
  { label: "CourseReference.endDate",         value: "{{CourseReference.endDate}}"         },
  { label: "CourseReference.expiryDate",      value: "{{CourseReference.expiryDate}}"      },
  { label: "CourseReference.trainerName",     value: "{{CourseReference.trainerName}}"     },
  { label: "CourseReference.atcName",         value: "{{CourseReference.atcName}}"         },
  { label: "CourseReference.atcNumber",       value: "{{CourseReference.atcNumber}}"       },
  { label: "CourseReference.atcAddress",      value: "{{CourseReference.atcAddress}}"      },
  { label: "CourseReference.country",         value: "{{CourseReference.country}}"         },
  { label: "CourseReference.referenceNumber", value: "{{CourseReference.referenceNumber}}" },
  { label: "CourseReference.sequenceId",      value: "{{CourseReference.sequenceId}}"      },
  { label: "CourseReference.status",          value: "{{CourseReference.status}}"          },
];

const FIELDS_COURSE = [
  { label: "Course.name",           value: "{{Course.name}}"           },
  { label: "Course.price",          value: "{{Course.price}}"          },
  { label: "Course.currency",       value: "{{Course.currency}}"       },
  { label: "Course.currencySymbol", value: "{{Course.currencySymbol}}" },
  { label: "Course.country",        value: "{{Course.country}}"        },
  { label: "Course.description",    value: "{{Course.description}}"    },
];



// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION INVOICE (public training registrations)
// Registration / Course / Session mirror the Mongoose models; Invoice values
// are typed by the owner at generation time (the Registration model itself
// stores no amount — pricing stays out of the public catalogue by design);
// Payment is the company's own bank details from Global Settings.
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_REGISTRATION = {
  reference:           "REG-2026-0001",
  fullName:            "Jane Smith",
  firstName:           "Jane",
  lastName:            "Smith",
  email:               "jane.smith@example.com",
  phone:               "+44 7700 900000",
  company:             "Acme Construction Ltd",
  country:             "United Kingdom",
  courseNameSnapshot:  "Fire Safety Awareness — Level 2",
  sessionNameSnapshot: "September intake",
  createdAt:           "01 Sep 2026",
};

const SAMPLE_INVOICE = {
  number:   "INV-2026-0001",
  date:     "02 Sep 2026",
  dueDate:  "16 Sep 2026",
  amount:   "350.00",
  currency: "GBP",
  notes:    "Course fee for one delegate.",
};

const SAMPLE_PAYMENT = {
  bankName:      "Example Bank",
  accountTitle:  "Ababeel Ltd",
  accountNumber: "12345678",
  iban:          "GB00EXMP00000012345678",
  sortCode:      "00-00-00",
  swiftBic:      "EXMPGB2L",
};

const FIELDS_REGISTRATION = [
  { label: "Registration.reference",           value: "{{Registration.reference}}"           },
  { label: "Registration.fullName",            value: "{{Registration.fullName}}"            },
  { label: "Registration.firstName",           value: "{{Registration.firstName}}"           },
  { label: "Registration.lastName",            value: "{{Registration.lastName}}"            },
  { label: "Registration.email",               value: "{{Registration.email}}"               },
  { label: "Registration.phone",               value: "{{Registration.phone}}"               },
  { label: "Registration.company",             value: "{{Registration.company}}"             },
  { label: "Registration.country",             value: "{{Registration.country}}"             },
  { label: "Registration.courseNameSnapshot",  value: "{{Registration.courseNameSnapshot}}"  },
  { label: "Registration.sessionNameSnapshot", value: "{{Registration.sessionNameSnapshot}}" },
  { label: "Registration.createdAt",           value: "{{Registration.createdAt}}"           },
];

const FIELDS_INVOICE = [
  { label: "Invoice.number",   value: "{{Invoice.number}}"   },
  { label: "Invoice.date",     value: "{{Invoice.date}}"     },
  { label: "Invoice.dueDate",  value: "{{Invoice.dueDate}}"  },
  { label: "Invoice.amount",   value: "{{Invoice.amount}}"   },
  { label: "Invoice.currency", value: "{{Invoice.currency}}" },
  { label: "Invoice.notes",    value: "{{Invoice.notes}}"    },
];

const FIELDS_PAYMENT = [
  { label: "Payment.bankName",      value: "{{Payment.bankName}}"      },
  { label: "Payment.accountTitle",  value: "{{Payment.accountTitle}}"  },
  { label: "Payment.accountNumber", value: "{{Payment.accountNumber}}" },
  { label: "Payment.iban",          value: "{{Payment.iban}}"          },
  { label: "Payment.sortCode",      value: "{{Payment.sortCode}}"      },
  { label: "Payment.swiftBic",      value: "{{Payment.swiftBic}}"      },
];

// ─────────────────────────────────────────────────────────────────────────────
// PER-TYPE MAPS
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_DATA_MAP = {
  "course-certificate": {
    Candidate:        SAMPLE_CANDIDATE,
    CourseReference:  SAMPLE_COURSE_REFERENCE,
    Course:           SAMPLE_COURSE,
  },

  "course-id-card": {
    Candidate:        SAMPLE_CANDIDATE,
    CourseReference:  SAMPLE_COURSE_REFERENCE,
    Course:           SAMPLE_COURSE,
  },

  "registration-invoice": {
    Registration: SAMPLE_REGISTRATION,
    Invoice:      SAMPLE_INVOICE,
    Payment:      SAMPLE_PAYMENT,
  },
};

const PLACEHOLDER_FIELDS_MAP = {
  "course-certificate": [
    ...FIELDS_CANDIDATE,
    ...FIELDS_COURSE_REFERENCE,
    ...FIELDS_COURSE,
  ],

  "course-id-card": [
    ...FIELDS_CANDIDATE,
    ...FIELDS_COURSE_REFERENCE,
    ...FIELDS_COURSE,
  ],

  "registration-invoice": [
    ...FIELDS_REGISTRATION,
    ...FIELDS_INVOICE,
    ...FIELDS_PAYMENT,
  ],
};


// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getSampleData(type) {
  return SAMPLE_DATA_MAP[type] ?? SAMPLE_DATA_MAP["course-certificate"];
}

export function getPlaceholderFields(type) {
  return PLACEHOLDER_FIELDS_MAP[type] ?? PLACEHOLDER_FIELDS_MAP["course-certificate"];
}

export {
  SAMPLE_CANDIDATE,
  SAMPLE_COURSE_REFERENCE,
  SAMPLE_COURSE,
  FIELDS_CANDIDATE,
  FIELDS_COURSE_REFERENCE,
  FIELDS_COURSE,
};
