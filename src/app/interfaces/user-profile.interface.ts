export interface UserProfile {
   name: string;
   email: string;
   photoUrl: string;
   conversations?: [];
   status: string;
   lastUpdated?: number;
   uid: string;
}
