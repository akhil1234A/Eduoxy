export interface IFile {
  url: string;
  key: string;
  type: string;
  size?: number;
  name?: string;
  publicUrl?: string;
}

export interface IPost {
  _id: string;
  forumId: string;
  userId: string;
  userName: string;
  content: string;
  topic: string;
  files: IFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IReply {
  _id: string;
  postId: string;
  parentReplyId: string | null;
  userId: string;
  userName: string;
  content: string;
  files: IFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IReplyTreeNode extends IReply {
  depth: number; 
  children: IReplyTreeNode[];
}
export interface IForum {
  _id: string;
  title: string;
  description: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}