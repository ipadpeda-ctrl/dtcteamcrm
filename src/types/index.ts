export type PackageType = 'Silver' | 'Gold' | 'Platinum' | 'Elite' | 'Grandmaster';

export type Role = 'OWNER' | 'COACH' | 'RENEWALS' | 'SUPPORT';

export type StudentStatus = 'ACTIVE' | 'EXPIRED' | 'NOT_RENEWED';

export interface Student {
    id: string;
    name: string;
    email?: string;
    package: PackageType;
    startDate: string; // ISO Date
    endDate: string; // ISO Date - Calculated
    coachId: string;
    lessonsDone: number;
    totalLessons: number; // Calculated based on package duration
    lastContactDate: string; // ISO Date
    status: StudentStatus;
    coachComment?: string;
    notes: string; // Internal notes
    // Phase 2: Advanced Management
    difficultyTags: string[];
    isRenewed?: boolean;
    renewalDate?: string; // ISO Date
    callBooked?: boolean;
    // Phase 4: Coach History
    originalCoachId?: string;
    // Phase 5: Renewal Management
    contactOutcome?: 'POSITIVE' | 'NEGATIVE_PRICE' | 'NEGATIVE_NOT_INTERESTED' | 'NEGATIVE_OTHER' | 'NEUTRAL_BUSY' | 'NO_ANSWER';
    contactOutcomeDate?: string; // ISO Date for the specific outcome
    contactNotes?: string; // Specific note for the outcome
}

export interface User {
    id: string;
    name: string;
    role: Role;
    avatar?: string;
    password?: string;
}

export interface DBStudent {
    id: string;
    name: string;
    email?: string;
    package: PackageType;
    start_date: string;
    end_date: string;
    coach_id: string;
    lessons_done: number;
    total_lessons: number;
    last_contact_date: string;
    status: StudentStatus;
    coach_comment?: string;
    notes?: string;
    difficulty_tags?: string[];
    is_renewed?: boolean;
    renewal_date?: string | null;
    call_booked?: boolean;
    original_coach_id?: string | null;
}
