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
}

export interface User {
    id: string;
    name: string;
    role: Role;
    avatar?: string;
}
