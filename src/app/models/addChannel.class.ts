import { User } from 'firebase/auth';
import { UserProfile } from '../interfaces/user-profile.interface';

export class AddChannel {
  channelName: string;
  description: string;
  creatorName: string;
  userAccess: UserProfile[];
  messages?: [];
  channelId?: string;

  constructor(obj?: any) {
    this.channelName = obj ? obj.channelName : '';
    this.description = obj ? obj.description : '';
    this.creatorName = obj ? obj.creatorName : 'Guest';
    this.messages = obj ? obj.messages : [];
    this.userAccess = obj ? obj.userAccess : [];
    this.channelId = obj ? obj.channelId : '';
  }
}