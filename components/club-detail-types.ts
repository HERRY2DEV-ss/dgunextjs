export type ClubPerson = {
  id: string;
  name: string;
  role: string;
  image: string;
  bio?: string;
  profileUrl?: string;
};

export type ClubPageData = {
  slug: string;
  name: string;
  hero?: { image: string; imageAlt?: string; titleLines: string[]; subtitle?: string; fullImage?: boolean };
  description: string[];
  benefits?: { title: string; intro?: string; emblem: string; items: string[] };
  video?: { poster: string; url?: string; title?: string };
  achievements?: { title: string; intro?: string; items: string[] };
  otherDetails?: string[];
  leadersTitle?: string;
  leaders: ClubPerson[];
  patrons: ClubPerson[];
  rules: string[];
  contacts: { name: string; role?: string; email?: string; phone?: string; address?: string }[];
  testimonials: { name: string; quote: string; role?: string; image?: string }[];
};
