export interface CEO {
  name?: string;
  image?: string;
}

export interface Company {
  _id: string;
  user: string; // ObjectId of the user who owns the company
  name: string;
  industry: string[]; // restricted to enum values in runtime
  location: string;
  website?: string;
  size?: number;
  description: string;
  logo?: string;
  jobs: string[]; // array of JobPosting ObjectIds
  rating: number;
  banner?: string;
  images?: string[];
  ceo?: CEO;
  createdAt: string | Date;
  updatedAt: string | Date;
}
