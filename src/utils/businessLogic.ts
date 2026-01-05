import { addDays, addMonths, differenceInHours, differenceInDays, differenceInCalendarDays, parseISO, parse, isValid } from 'date-fns';
import type { PackageType, Student, User } from '../types';

export const PACKAGE_DURATIONS: Record<PackageType, number> = {
    Silver: 30,
    Gold: 60,
    Platinum: 90,
    Elite: 180,
    Grandmaster: 365,
};

// Coach Stats Interface
export interface CoachStats {
    coachId: string;
    coachName: string;
    activeStudents: number;
    retentionRate: number; // 0-100
    urgentCount: number;
    totalStudents: number;
    renewedCount: number;
}

export const calculateCoachStats = (students: Student[], users: User[]): CoachStats[] => {
    // Filter only coaches (exclude OWNER)
    const coaches = users.filter(u => u.role === 'COACH');

    return coaches.map(coach => {
        const coachStudents = students.filter(s => s.coachId === coach.id);

        const activeStudents = coachStudents.filter(s => s.status === 'ACTIVE').length;

        // Retention: (Renewed / (Renewed + Expired/Finished))
        // We consider "Finished" as anyone who has Renewed OR is Expired without renewal.
        const renewed = coachStudents.filter(s => s.isRenewed).length;
        const expiredNoRenewal = coachStudents.filter(s => s.status === 'EXPIRED' && !s.isRenewed).length;
        const totalFinished = renewed + expiredNoRenewal;

        const retentionRate = totalFinished > 0
            ? Math.round((renewed / totalFinished) * 100)
            : 0;

        const urgentCount = coachStudents.filter(s => isContactUrgent(s)).length;

        return {
            coachId: coach.id,
            coachName: coach.name,
            activeStudents,
            retentionRate,
            urgentCount,
            totalStudents: coachStudents.length,
            renewedCount: renewed
        };
    }).sort((a, b) => b.activeStudents - a.activeStudents); // Sort by load
};

export const calculateEndDate = (startDate: string, packageType: PackageType): string => {
    const start = parseISO(startDate);
    let end: Date;

    if (packageType === 'Grandmaster') {
        end = addMonths(start, 12);
    } else {
        end = addDays(start, PACKAGE_DURATIONS[packageType]);
    }

    return end.toISOString();
};

export const PACKAGE_LESSONS: Record<PackageType, number> = {
    Silver: 8,
    Gold: 16,
    Platinum: 24,
    Elite: 48,
    Grandmaster: 56,
};

export const calculateTotalLessons = (packageType: PackageType): number => {
    return PACKAGE_LESSONS[packageType] || 20; // Default fallback
};

export const shouldExpireStudent = (endDate: string): boolean => {
    if (!endDate) return false;
    const end = parseISO(endDate);
    const now = new Date();
    // Check if end date is before today (ignoring time for safety, or strictly depending on exact time)
    // Given the requirement "expired", usually means end date has passed.
    // Let's assume strict comparison.
    return end < now;
};

export const isContactUrgent = (student: Student): boolean => {
    const lastContact = parseISO(student.lastContactDate);
    const now = new Date();

    if (student.status === 'ACTIVE') {
        if (student.isRenewed) {
            // Renewed: Urgent if it's the next calendar day (or later)
            return differenceInCalendarDays(now, lastContact) >= 1;
        }
        // Active but not renewed: Urgent if > 24 hours (1 day)
        return differenceInHours(now, lastContact) >= 24;
    } else {
        // Terminated/Not Renewed: Urgent if > 10 days
        return differenceInDays(now, lastContact) >= 10;
    }
};
export const parseDateSafe = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString();

    // Try standard ISO
    let date = parseISO(dateStr);
    if (isValid(date)) return date.toISOString();

    // Try Common Italian formats
    const formats = [
        'dd/MM/yyyy',
        'dd-MM-yyyy',
        'd/M/yyyy',
        'd-M-yyyy',
        'yyyy/MM/dd',
        'yyyy-MM-dd'
    ];

    for (const fmt of formats) {
        date = parse(dateStr, fmt, new Date());
        if (isValid(date)) return date.toISOString();
    }

    console.warn(`Could not parse date: ${dateStr}, defaulting to now`);
    return new Date().toISOString();
};
