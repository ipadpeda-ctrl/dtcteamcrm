export const DIFFICULTY_TAGS = [
    { label: 'Emotività', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { label: 'Gestione Operativa', color: 'bg-red-100 text-red-800 border-red-200' },
    { label: 'Overtrading', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { label: 'Journaling', color: 'bg-green-100 text-green-800 border-green-200' },
    { label: 'Prende pochi trade', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { label: 'Poco tempo', color: 'bg-gray-600 text-gray-100 border-gray-500' },
    { label: 'Poca applicazione', color: 'bg-lime-100 text-lime-800 border-lime-200' },
    { label: 'No trade', color: 'bg-gray-200 text-gray-700 border-gray-300' },
    { label: 'Concetti spiegati + volte', color: 'bg-sky-100 text-sky-800 border-sky-200' },
    { label: 'Fretta', color: 'bg-red-600 text-white border-red-700' },
    { label: 'Molto bravo', color: 'bg-emerald-700 text-white border-emerald-800' },
    { label: 'Sparito', color: 'bg-indigo-600 text-white border-indigo-700' },
    { label: 'Vuole isolarsi', color: 'bg-teal-700 text-white border-teal-800' },
] as const;

export const getTagColor = (validTag: string) => {
    const tag = DIFFICULTY_TAGS.find(t => t.label === validTag);
    return tag ? tag.color : 'bg-gray-100 text-gray-800 border-gray-200';
};
