let announcementsCache: any[] | null = null;
let benefitsCache: any[] | null = null;
let medicinesCache: any[] | null = null;
let profileCache: any = null;
let userRequestsCache: {
  medicineRequests: any[];
  assistanceRequests: any[];
} | null = null;

export const clientCache = {
  getAnnouncements: () => announcementsCache,
  setAnnouncements: (data: any[]) => {
    announcementsCache = data;
  },
  getProfile: () => profileCache,
  setProfile: (data: any) => {
    profileCache = data;
  },
  getBenefits: () => benefitsCache,
  setBenefits: (data: any[]) => {
    benefitsCache = data;
  },
  getMedicines: () => medicinesCache,
  setMedicines: (data: any[]) => {
    medicinesCache = data;
  },
  getUserRequests: () => userRequestsCache,
  setUserRequests: (data: {
    medicineRequests: any[];
    assistanceRequests: any[];
  }) => {
    userRequestsCache = data;
  },
  clear: () => {
    announcementsCache = null;
    profileCache = null;
    benefitsCache = null;
    medicinesCache = null;
    userRequestsCache = null;
  },
};
