export interface CEO {
  name?: string;
  image?: string;
}

export interface Company {
    _id?: string;
    user: string; // ObjectId
    name: string;
    industry: string[];
    location: string;
    website?: string;
    size?: string; // Changed from number to match form
    description: string;
    logo?: string;
    jobs?: string[]; // ObjectId[]
    rating?: number;
    banner?: string;
    images?: string[];
    ceo?: CEO;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}
