export interface ProjectMember {
  _id: string;
  name: string;
  email: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  owner: ProjectMember;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}
