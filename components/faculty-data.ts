/** Shared record shape. Faculty records are fetched exclusively from get-faculty.php. */
export type FacultyMember = { name: string; role: string; notes: string[]; vidwan: string; image: string; href: string; category: string };
