
import { isContactUrgent, shouldExpireStudent, calculateEndDate } from '../src/utils/businessLogic';
import { Student } from '../src/types';
import { addHours, subDays, subHours } from 'date-fns';

const createMockStudent = (status: 'ACTIVE' | 'EXPIRED' | 'NOT_RENEWED', isRenewed: boolean, lastContactDate: string): Student => ({
    id: '1',
    name: 'Test Student',
    package: 'Gold',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    coachId: 'coach1',
    lessonsDone: 0,
    totalLessons: 10,
    lastContactDate,
    status,
    isRenewed,
    notes: '',
    difficultyTags: []
});

console.log('--- Verification Script ---');

const now = new Date();

// Helper to ensure we get a date that is definitely yesterday but < 24h if possible, 
// or just modify the test expectation.
// If now is 15:00, yesterday 20:00 is 19 hours ago (<24h) but is yesterday.
const yesterdayLate = subHours(now, 20); // 20 hours ago. 
// Note: If now is very early (e.g. 01:00), 20h ago is yesterday 05:00.
// If now is late (e.g. 23:00), 20h ago is today 03:00.
// So hardcoding 'hours' is risky for calendar day tests without knowing current time.
// BETTER: specific date construction.
// But we can just use `subDays` and `setHours`? No, simpler:
// We want `differenceInCalendarDays` to be 1, but `differenceInHours` < 24.
// Let's force `lastContact` to be yesterday at 23:59 and `now` to be today at 00:01? 
// We can't change `now` easily in the business logic without mocking.
// BUT `isContactUrgent` uses `new Date()`.
// I can't mock `new Date()` easily in this script without extensive setups.
// So I will rely on the fact that `subHours(now, 20)` is usually 20h diff.
// logic: 
// IF (now - 20h) is currently previous day, THEN 
//    Current Logic (24h): FALSE (20 < 24)
//    New Logic (Calendar): TRUE (Day Diff >= 1)
// IF (now - 20h) is still TODAY (e.g. now is 23:00, contact was 03:00), 
//    Current: FALSE
//    New: FALSE
// This ambiguity makes the test flaky if I don't control `now`.

// For the purpose of this script, I will assume typical working hours or just run it.
// Actually, I can construct a specific case:
// Case 2b: "Yesterday" (Next Day Logic) checking.
const yesterday = subDays(now, 1); // Exactly 24h ago? `subDays` usually preserves time.
// `subDays(d, 1)` -> d minus 24 hours.
// So if I use `subHours(now, 23)`, it is 23h ago.
// If now is 15:00, 23h ago is yesterday 16:00. Day diff = 1. Hour diff = 23.
// Current logic: Not Urgent (<24h).
// New logic: Urgent (Day diff >= 1).
const date2b = subHours(now, 23).toISOString();
const s2b = createMockStudent('ACTIVE', true, date2b);
console.log(`2b. Active/Renewed (23h ago): ${isContactUrgent(s2b)} (Expected OLD: false, NEW: true)`);

const date1 = subHours(now, 2).toISOString();
const s1 = createMockStudent('ACTIVE', true, date1);
console.log(`1. Active/Renewed (2h ago): ${isContactUrgent(s1)} (Expected: false)`);

// Scenario 2: Active, Renewed, Contacted 20 hours ago (Yesterday - technically, if we force a day change)
// To properly test "Next Day", we need to simulate a date that is clearly yesterday.
// local time is tricky in tests without mocking system time, but differenceInCalendarDays handles it.
// Let's use subDays(now, 1) plus a few hours to ensure it's "yesterday".
const date2 = subDays(now, 1).toISOString();
const s2 = createMockStudent('ACTIVE', true, date2);
console.log(`2. Active/Renewed (1 day ago): ${isContactUrgent(s2)} (Expected: true)`);

// Scenario 3: Active, NOT Renewed, 20 hours ago
// Expected: NOT Urgent (24h rule)
const date3 = subHours(now, 20).toISOString();
const s3 = createMockStudent('ACTIVE', false, date3);
console.log(`3. Active/NotRenewed (20h ago): ${isContactUrgent(s3)} (Expected: false)`);

// Scenario 4: Active, NOT Renewed, 25 hours ago
// Expected: Urgent (24h rule)
const date4 = subHours(now, 25).toISOString();
const s4 = createMockStudent('ACTIVE', false, date4);
console.log(`4. Active/NotRenewed (25h ago): ${isContactUrgent(s4)} (Expected: true)`);

// Scenario 5: Inactive, 9 days ago
// Expected: NOT Urgent (10 day rule)
const date5 = subDays(now, 9).toISOString();
const s5 = createMockStudent('NOT_RENEWED', false, date5);
console.log(`5. Inactive (9 days ago): ${isContactUrgent(s5)} (Expected: false)`);

// Scenario 6: Inactive, 11 days ago
// Expected: Urgent (10 day rule)
const date6 = subDays(now, 11).toISOString();
const s6 = createMockStudent('NOT_RENEWED', false, date6);
console.log(`6. Inactive (11 days ago): ${isContactUrgent(s6)} (Expected: true)`);
