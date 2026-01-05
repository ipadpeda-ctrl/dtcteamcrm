import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Student, User, DBStudent } from '../types';
import { calculateEndDate, calculateTotalLessons, shouldExpireStudent } from '../utils/businessLogic';
import { supabase } from '../lib/supabase';

interface AppContextType {
    students: Student[];
    users: User[];
    currentUser: User | null;
    isLoading: boolean;
    setCurrentUser: (user: User) => void;
    updateStudent: (id: string, updates: Partial<Student>) => void;
    markAsContacted: (id: string) => void;
    addComment: (id: string, comment: string) => void;
    addStudent: (student: Omit<Student, 'id' | 'endDate' | 'lastContactDate' | 'status' | 'difficultyTags' | 'notes'> & Partial<Student>) => Promise<boolean>;
    removeStudent: (id: string) => void;
    login: (user: User) => void;
    logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Data Load
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Users
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('*');

                if (usersError) throw usersError;

                const loadedUsers = usersData as User[];
                setUsers(loadedUsers);

                // 2. Fetch Students
                const { data: studentsData, error: studentsError } = await supabase
                    .from('students')
                    .select('*');

                if (studentsError) throw studentsError;

                // Map DB (snake_case) to Frontend (camelCase)
                const loadedStudents = (studentsData as unknown as DBStudent[] || []).map((s) => ({
                    id: s.id,
                    name: s.name,
                    email: s.email,
                    package: s.package,
                    startDate: s.start_date,
                    endDate: s.end_date,
                    coachId: s.coach_id,
                    lessonsDone: s.lessons_done,
                    totalLessons: s.total_lessons,
                    lastContactDate: s.last_contact_date,
                    difficultyTags: s.difficulty_tags || [],
                    coachComment: s.coach_comment,
                    notes: s.notes || '',
                    status: s.status,
                    isRenewed: s.is_renewed,
                    renewalDate: s.renewal_date,
                    callBooked: s.call_booked,
                    originalCoachId: s.original_coach_id,
                    contactOutcome: s.contact_outcome as any,
                    contactNotes: s.contact_notes,
                    contactOutcomeDate: s.contact_outcome_date
                })) as Student[];

                setStudents(loadedStudents);

                // 3. Post-Load Check: Automatic Expiration
                const updatesToPerform = loadedStudents
                    .filter(s => s.status === 'ACTIVE' && shouldExpireStudent(s.endDate))
                    .map(s => s.id);

                if (updatesToPerform.length > 0) {
                    console.log(`Found ${updatesToPerform.length} students to expire automatically.`);

                    // Optimistic Update (Local)
                    setStudents(prev => prev.map(s =>
                        updatesToPerform.includes(s.id)
                            ? { ...s, status: 'EXPIRED' }
                            : s
                    ));

                    // Background Sync (DB)
                    Promise.all(updatesToPerform.map(id =>
                        supabase.from('students').update({ status: 'EXPIRED' }).eq('id', id)
                    )).then(() => console.log('Automatic expiration sync complete.'));
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Check for saved session
    useEffect(() => {
        const savedUserId = localStorage.getItem('dtc_cur_user_id');
        if (users.length > 0 && !currentUser && savedUserId) {
            const foundUser = users.find(u => u.id === savedUserId);
            if (foundUser) {
                setCurrentUser(foundUser);
            }
        }
    }, [users, currentUser]);

    const login = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('dtc_cur_user_id', user.id);
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('dtc_cur_user_id');
    };

    const addStudent = async (studentData: Omit<Student, 'id' | 'endDate' | 'lastContactDate' | 'status' | 'difficultyTags' | 'notes'> & Partial<Student>): Promise<boolean> => {
        const pkg = studentData.package!;
        const startDate = studentData.startDate!;

        // Sanitize IDs
        const isValidId = (id: string | null | undefined): id is string => typeof id === 'string' && id.length > 20;

        // Fetch real authenticated user ID as ultimate fallback
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const realAuthUserId = authUser?.id;

        // Logic: 
        // 1. Try studentData.coachId (if valid)
        // 2. Try currentUser.id (if valid)
        // 3. FORCE fallback to realAuthUserId (must be valid if logged in)
        // 4. Last resort: null (which might fail FK if not nullable, but better than invalid ID)

        // Explicitly type simple variable
        let finalCoachId: string | null = isValidId(studentData.coachId) ? studentData.coachId :
            (isValidId(currentUser?.id) ? currentUser?.id : (realAuthUserId || null));

        // Logic for Original Coach ID (Must be strict Auth User)
        let finalOriginalCoachId = realAuthUserId || null;

        // Final safety check for Coach ID (Public User)
        if (!isValidId(finalCoachId)) {
            finalCoachId = null;
        } else {
            // CRITICAL: Ensure the ID actually exists in the REFERENCED table (public.users)
            // The error 'Key is not present in table "users"' means FK violation.
            // We have the list of public users in 'users' state.
            const userExistsInPublicTable = users.some(u => u.id === finalCoachId);

            if (!userExistsInPublicTable) {
                console.warn(`Coach ID ${finalCoachId} not found in public.users table. Removing to avoid FK violation.`);
                finalCoachId = null;
            }
        }

        // Final safety check for Original Coach ID (Auth User)
        // If the logged in user is somehow not a valid UUID (impossible but safe checks)
        if (!isValidId(finalOriginalCoachId)) {
            finalOriginalCoachId = null;
        }

        // Add extensive logging to debugging
        console.log('--- ADDING STUDENT DEBUG ---');
        console.log('Public Users Loaded:', users.length);
        console.log('Real Auth User ID:', realAuthUserId);
        console.log('Final Public Coach ID:', finalCoachId);
        console.log('Final Original Coach ID (Auth):', finalOriginalCoachId);
        console.log('----------------------------');

        const dbStudent = {
            name: studentData.name,
            email: studentData.email,
            package: pkg,
            start_date: startDate,
            end_date: studentData.endDate || calculateEndDate(startDate, pkg),
            total_lessons: studentData.totalLessons || calculateTotalLessons(pkg),
            lessons_done: studentData.lessonsDone || 0,
            coach_id: finalCoachId,
            original_coach_id: finalOriginalCoachId, // Strictly valid Auth User
            status: 'ACTIVE',
            last_contact_date: new Date().toISOString(),
            difficulty_tags: [],
            notes: ''
        };

        const { data, error } = await supabase
            .from('students')
            .insert([dbStudent])
            .select()
            .single();

        if (error) {
            console.error("Error adding student:", error);
            return false;
        }

        // Add to local state (map back to camelCase)
        const newStudent: Student = {
            id: data.id,
            name: data.name,
            email: data.email,
            package: data.package,
            startDate: data.start_date,
            endDate: data.end_date,
            coachId: data.coach_id,
            lessonsDone: data.lessons_done,
            totalLessons: data.total_lessons,
            lastContactDate: data.last_contact_date,
            difficultyTags: data.difficulty_tags || [],
            coachComment: data.coach_comment,
            notes: data.notes || '',
            status: data.status,
            isRenewed: data.is_renewed,
            renewalDate: data.renewal_date,
            callBooked: data.call_booked,
            originalCoachId: data.original_coach_id
        };

        setStudents(prev => [...prev, newStudent]);
        return true;
    };

    const removeStudent = async (id: string) => {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) {
            console.error("Error removing student:", error);
            return;
        }
        setStudents(prev => prev.filter(s => s.id !== id));
    };

    const updateStudent = async (id: string, updates: Partial<Student>) => {
        // Map updates to snake_case for DB
        const dbUpdates: Partial<DBStudent> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.package !== undefined) dbUpdates.package = updates.package;
        if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
        if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
        if (updates.coachId !== undefined) dbUpdates.coach_id = updates.coachId;
        if (updates.lessonsDone !== undefined) dbUpdates.lessons_done = updates.lessonsDone;
        if (updates.totalLessons !== undefined) dbUpdates.total_lessons = updates.totalLessons;
        if (updates.lastContactDate !== undefined) dbUpdates.last_contact_date = updates.lastContactDate;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.difficultyTags !== undefined) dbUpdates.difficulty_tags = updates.difficultyTags;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.coachComment !== undefined) dbUpdates.coach_comment = updates.coachComment;
        if (updates.isRenewed !== undefined) dbUpdates.is_renewed = updates.isRenewed;
        if (updates.renewalDate !== undefined) dbUpdates.renewal_date = updates.renewalDate === '' ? null : updates.renewalDate;
        if (updates.callBooked !== undefined) dbUpdates.call_booked = updates.callBooked;
        if (updates.originalCoachId !== undefined) dbUpdates.original_coach_id = updates.originalCoachId;
        if (updates.contactOutcome !== undefined) dbUpdates.contact_outcome = updates.contactOutcome;
        if (updates.contactNotes !== undefined) dbUpdates.contact_notes = updates.contactNotes;
        if (updates.contactOutcomeDate !== undefined) dbUpdates.contact_outcome_date = updates.contactOutcomeDate;

        const { error } = await supabase.from('students').update(dbUpdates).eq('id', id);

        if (error) {
            console.error("Error updating student:", error);
            return;
        }

        setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const markAsContacted = (id: string) => {
        const now = new Date().toISOString();
        updateStudent(id, { lastContactDate: now });
    };

    const addComment = (id: string, comment: string) => {
        updateStudent(id, { coachComment: comment });
    };

    return (
        <AppContext.Provider value={{
            students,
            users,
            currentUser,
            isLoading,
            setCurrentUser,
            updateStudent,
            markAsContacted,
            addComment,
            addStudent,
            removeStudent,
            login,
            logout
        }}>
            {children}
        </AppContext.Provider>
    );
};

// eslint-disable-next-line
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within AppProvider');
    return context;
};
