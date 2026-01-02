import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Student, User, DBStudent } from '../types';
import { calculateEndDate, calculateTotalLessons } from '../utils/businessLogic';
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
                    originalCoachId: s.original_coach_id
                })) as Student[];

                setStudents(loadedStudents);

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

        // Prepare DB object (snake_case)
        const dbStudent = {
            name: studentData.name,
            email: studentData.email,
            package: pkg,
            start_date: startDate,
            end_date: studentData.endDate || calculateEndDate(startDate, pkg),
            total_lessons: studentData.totalLessons || calculateTotalLessons(pkg),
            lessons_done: studentData.lessonsDone || 0,
            coach_id: studentData.coachId || studentData.originalCoachId || currentUser?.id,
            original_coach_id: studentData.originalCoachId || studentData.coachId || currentUser?.id,
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
        if (updates.renewalDate !== undefined) dbUpdates.renewal_date = updates.renewalDate;
        if (updates.callBooked !== undefined) dbUpdates.call_booked = updates.callBooked;
        if (updates.originalCoachId !== undefined) dbUpdates.original_coach_id = updates.originalCoachId;

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
