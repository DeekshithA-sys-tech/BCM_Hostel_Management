// ── User Roles ────────────────────────────────────────────────────────────────
const ROLES = Object.freeze({
    ADMIN: 'admin',
    STUDENT: 'student'
});

// ── Verification Status ───────────────────────────────────────────────────────
const VERIFICATION_STATUS = Object.freeze({
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
});

// ── Attendance Sessions ───────────────────────────────────────────────────────
const ATTENDANCE_SESSION = Object.freeze({
    MORNING: 'morning',
    EVENING: 'evening'
});

// ── Attendance Status ─────────────────────────────────────────────────────────
const ATTENDANCE_STATUS = Object.freeze({
    PRESENT: 'present',
    ABSENT: 'absent',
    LEAVE: 'leave'
});

// ── Complaint Status ──────────────────────────────────────────────────────────
const COMPLAINT_STATUS = Object.freeze({
    OPEN: 'open',
    IN_PROGRESS: 'inProgress',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
});

// ── Notification Scope ────────────────────────────────────────────────────────
const NOTIFICATION_SCOPE = Object.freeze({
    GLOBAL: 'global',
    ROOM: 'room',
    INDIVIDUAL: 'individual'
});

// ── Document Types ────────────────────────────────────────────────────────────
const DOCUMENT_TYPES = Object.freeze({
    AADHAAR: 'aadhaar',
    BANK_PASSBOOK: 'bank_passbook',
    INCOME_CERTIFICATE: 'income_certificate',
    CASTE_CERTIFICATE: 'caste_certificate',
    PHOTO: 'photo',
    OTHER: 'other'
});

// ── Staff Roles ───────────────────────────────────────────────────────────────
const STAFF_ROLES = Object.freeze({
    COOK: 'cook',
    WORKER: 'worker',
    WARDEN: 'warden',
    SECURITY: 'security'
});

// ── Weekdays ──────────────────────────────────────────────────────────────────
const WEEKDAYS = Object.freeze(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);

// ── Meal Types ────────────────────────────────────────────────────────────────
const MEAL_TYPES = Object.freeze(['breakfast', 'lunch', 'snacks', 'dinner']);

// ── Cot Capacity ─────────────────────────────────────────────────────────────
const COT_MAX_STUDENTS = 1; // One student per cot
const ROOM_DEFAULT_COTS = 4;

// ── Pagination Defaults ───────────────────────────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

module.exports = {
    ROLES,
    VERIFICATION_STATUS,
    ATTENDANCE_SESSION,
    ATTENDANCE_STATUS,
    COMPLAINT_STATUS,
    NOTIFICATION_SCOPE,
    DOCUMENT_TYPES,
    STAFF_ROLES,
    WEEKDAYS,
    MEAL_TYPES,
    COT_MAX_STUDENTS,
    ROOM_DEFAULT_COTS,
    DEFAULT_PAGE,
    DEFAULT_LIMIT,
    MAX_LIMIT
};
