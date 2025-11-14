export interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  expertise: string[];
  rating: number;
  reviews: number;
  sessions: number;
  availability: string;
  pricePerHour: number;
  bio: string;
  languages: string[];
  experience: number;
  avatarUrl: string;
  verified: boolean;
}

export interface TimeSlot {
  id: string;
  mentorId: string;
  date: string;
  time: string;
  available: boolean;
}

export const mockMentors: Mentor[] = [
  {
    id: "mentor_1",
    name: "Dr. Priya Sharma",
    title: "Senior AI Researcher",
    company: "Google DeepMind",
    expertise: ["Machine Learning", "Deep Learning", "AI Research", "Python"],
    rating: 4.9,
    reviews: 234,
    sessions: 450,
    availability: "Weekday Evenings",
    pricePerHour: 2500,
    bio: "PhD in AI from MIT. 10+ years experience in ML research. Passionate about helping students break into AI careers.",
    languages: ["English", "Hindi"],
    experience: 10,
    avatarUrl: "/avatars/mentor1.jpg",
    verified: true,
  },
  {
    id: "mentor_2",
    name: "Rahul Verma",
    title: "Full Stack Developer",
    company: "Microsoft",
    expertise: ["React", "Node.js", "System Design", "TypeScript"],
    rating: 4.8,
    reviews: 189,
    sessions: 320,
    availability: "Weekends",
    pricePerHour: 1800,
    bio: "Building scalable web apps at Microsoft. Love teaching web development and system design concepts.",
    languages: ["English", "Hindi", "Tamil"],
    experience: 7,
    avatarUrl: "/avatars/mentor2.jpg",
    verified: true,
  },
  {
    id: "mentor_3",
    name: "Anita Roy",
    title: "Product Manager",
    company: "Amazon",
    expertise: ["Product Management", "Strategy", "UX Design", "Career Guidance"],
    rating: 4.9,
    reviews: 156,
    sessions: 280,
    availability: "Flexible",
    pricePerHour: 2000,
    bio: "Senior PM with experience launching products used by millions. Here to guide aspiring PMs.",
    languages: ["English", "Bengali"],
    experience: 8,
    avatarUrl: "/avatars/mentor3.jpg",
    verified: true,
  },
  {
    id: "mentor_4",
    name: "Vikram Singh",
    title: "DevOps Engineer",
    company: "Netflix",
    expertise: ["DevOps", "Kubernetes", "AWS", "CI/CD"],
    rating: 4.7,
    reviews: 143,
    sessions: 215,
    availability: "Weekday Mornings",
    pricePerHour: 1500,
    bio: "Scaling infrastructure at Netflix. Teaching cloud and DevOps best practices.",
    languages: ["English", "Punjabi"],
    experience: 6,
    avatarUrl: "/avatars/mentor4.jpg",
    verified: true,
  },
  {
    id: "mentor_5",
    name: "Sneha Patel",
    title: "Data Scientist",
    company: "Meta",
    expertise: ["Data Science", "Statistics", "SQL", "Analytics"],
    rating: 4.8,
    reviews: 198,
    sessions: 340,
    availability: "Weekday Evenings",
    pricePerHour: 1900,
    bio: "Data scientist working on recommendation systems. Helping students start data careers.",
    languages: ["English", "Gujarati"],
    experience: 5,
    avatarUrl: "/avatars/mentor5.jpg",
    verified: true,
  },
  {
    id: "mentor_6",
    name: "Arjun Mehta",
    title: "Mobile Developer",
    company: "Uber",
    expertise: ["React Native", "iOS", "Android", "Mobile UX"],
    rating: 4.6,
    reviews: 132,
    sessions: 190,
    availability: "Weekends",
    pricePerHour: 1700,
    bio: "Building mobile experiences at Uber. Passionate about mobile development education.",
    languages: ["English", "Hindi", "Marathi"],
    experience: 5,
    avatarUrl: "/avatars/mentor6.jpg",
    verified: false,
  },
];

export const mockTimeSlots: TimeSlot[] = [
  // Generate slots for next 7 days
  ...Array.from({ length: 7 }, (_, dayIndex) => {
    const date = new Date();
    date.setDate(date.getDate() + dayIndex);
    const dateStr = date.toISOString().split("T")[0];

    return Array.from({ length: 8 }, (_, slotIndex) => ({
      id: `slot_${dayIndex}_${slotIndex}`,
      mentorId: mockMentors[dayIndex % mockMentors.length].id,
      date: dateStr,
      time: `${9 + slotIndex}:00`,
      available: Math.random() > 0.3,
    }));
  }).flat(),
];
