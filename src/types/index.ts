// Core domain types for the Riff platform
// These define the shape of data independent of database implementation

export type UserId = string;
export type CircleId = string;
export type PieceId = string;
export type PieceVersionId = string;
export type CirclePromptId = string;
export type PieceShareId = string;
export type CommentId = string;
export type CollectionId = string;
export type NotificationId = string;

// ==================== USER ====================

export interface User {
  id: UserId;
  email: string;
  name: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CIRCLE ====================

export interface Circle {
  id: CircleId;
  name: string;
  description?: string;
  createdById: UserId; // Circle creator
  createdAt: Date;
  updatedAt: Date;

  // Relational fields
  members?: CircleMember[];
  prompts?: CirclePrompt[];
  pieces?: PieceShare[]; // Pieces shared to this circle
}

export enum CircleMemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN", // Can invite others
  MEMBER = "MEMBER",
}

export interface CircleMember {
  id: string;
  circleId: CircleId;
  userId: UserId;
  role: CircleMemberRole;
  joinedAt: Date;

  // Relational fields
  user?: User;
  circle?: Circle;
}

// ==================== CIRCLE PROMPTS ====================

export interface CirclePrompt {
  id: CirclePromptId;
  circleId: CircleId;
  title: string;
  description?: string;
  isFreeform: boolean; // True if no specific prompt, write anything
  deadline?: Date;
  createdById: UserId;
  createdAt: Date;
  updatedAt: Date;

  // Visibility settings for pieces in this prompt
  visibilityRule: PromptVisibilityRule;

  // Relational fields
  circle?: Circle;
  createdBy?: User;
  pieces?: PieceShare[]; // Pieces submitted for this prompt
}

export enum PromptVisibilityRule {
  ON_SUBMIT = "ON_SUBMIT", // Visible as soon as user submits
  ALL_SUBMITTED = "ALL_SUBMITTED", // Visible only after all members submit
  AFTER_DEADLINE = "AFTER_DEADLINE", // Visible only after deadline passes
}

// ==================== PIECE & VERSIONS ====================

export interface Piece {
  id: PieceId;
  title: string;
  authorId: UserId;
  createdAt: Date;
  updatedAt: Date;

  // Current working version (not frozen)
  currentContent: string; // Rich text as JSON or HTML
  currentExcerpt?: string;

  // Relational fields
  author?: User;
  versions?: PieceVersion[]; // Frozen versions shared to circles
  shares?: PieceShare[]; // Where this piece has been shared
  collections?: CollectionPiece[]; // Which collections include this
}

// Frozen snapshot of a piece when shared to a circle
export interface PieceVersion {
  id: PieceVersionId;
  pieceId: PieceId;
  versionNumber: number; // 1, 2, 3, etc.
  title: string;
  content: string; // Frozen content
  excerpt?: string;
  createdAt: Date;

  // Relational fields
  piece?: Piece;
  comments?: Comment[]; // Comments on this specific version
}

// Links a piece to a circle (with specific version)
export interface PieceShare {
  id: PieceShareId;
  pieceId: PieceId;
  circleId: CircleId;
  versionId: PieceVersionId; // Which version is visible to this circle
  promptId?: CirclePromptId; // Optional: submitted for a specific prompt
  submittedAt: Date;
  isVisible: boolean; // Based on prompt visibility rules

  // Relational fields
  piece?: Piece;
  circle?: Circle;
  version?: PieceVersion;
  prompt?: CirclePrompt;
}

// ==================== PIECE VISIBILITY ====================

export enum PieceVisibility {
  PRIVATE = "PRIVATE", // Only author can see
  CIRCLES_ONLY = "CIRCLES_ONLY", // Only visible in shared circles
  SPECIFIC_USERS = "SPECIFIC_USERS", // Shared with specific users
  PUBLIC = "PUBLIC", // Anyone can see
}

export interface PieceVisibilitySettings {
  id: string;
  pieceId: PieceId;
  visibility: PieceVisibility;
  allowedUserIds?: UserId[]; // For SPECIFIC_USERS visibility

  // Relational fields
  piece?: Piece;
}

// ==================== COMMENTS ====================

export interface Comment {
  id: CommentId;
  content: string;
  pieceId: PieceId;
  versionId: PieceVersionId; // Tied to a specific version
  circleId?: CircleId; // Optional: Comments can be in a circle or direct share
  authorId: UserId;
  parentId?: CommentId; // For nested replies
  createdAt: Date;
  updatedAt: Date;

  // Text selection anchor (for inline comments like Google Docs)
  selectionStart?: number; // Character offset in the content
  selectionEnd?: number;
  selectedText?: string; // Store the actual text for reference

  // Relational fields
  author?: User;
  piece?: Piece;
  version?: PieceVersion;
  circle?: Circle;
  replies?: Comment[];
}

// ==================== COLLECTIONS ====================

export enum CollectionType {
  PERSONAL = "PERSONAL", // User's own organizational collection
  GROUP = "GROUP", // Collaborative collection with other users
  CIRCLE = "CIRCLE", // Automatic collection of circle's pieces
}

export interface Collection {
  id: CollectionId;
  name: string;
  description?: string;
  type: CollectionType;
  ownerId: UserId; // Creator of the collection
  circleId?: CircleId; // Only for CIRCLE type collections
  createdAt: Date;
  updatedAt: Date;

  // Relational fields
  owner?: User;
  circle?: Circle;
  pieces?: CollectionPiece[];
  collaborators?: CollectionCollaborator[]; // For GROUP collections
}

// Links pieces to collections
export interface CollectionPiece {
  id: string;
  collectionId: CollectionId;
  pieceId: PieceId;
  addedById: UserId; // Who added this piece
  addedAt: Date;
  order?: number; // For custom ordering

  // Relational fields
  collection?: Collection;
  piece?: Piece;
  addedBy?: User;
}

// For GROUP collections - who can add pieces
export interface CollectionCollaborator {
  id: string;
  collectionId: CollectionId;
  userId: UserId;
  canEdit: boolean; // Can add/remove pieces
  addedAt: Date;

  // Relational fields
  collection?: Collection;
  user?: User;
}

// ==================== NOTIFICATIONS ====================

export enum NotificationType {
  CIRCLE_INVITATION = "CIRCLE_INVITATION",
  NEW_PROMPT = "NEW_PROMPT",
  PIECE_SUBMITTED = "PIECE_SUBMITTED",
  PIECES_VISIBLE = "PIECES_VISIBLE", // When prompt deadline passes
  NEW_COMMENT = "NEW_COMMENT",
  COMMENT_REPLY = "COMMENT_REPLY",
  COLLECTION_INVITE = "COLLECTION_INVITE",
  PIECE_ADDED_TO_COLLECTION = "PIECE_ADDED_TO_COLLECTION",
}

export interface Notification {
  id: NotificationId;
  type: NotificationType;
  recipientId: UserId;
  actorId?: UserId; // Who triggered the notification
  circleId?: CircleId;
  pieceId?: PieceId;
  commentId?: CommentId;
  collectionId?: CollectionId;
  isRead: boolean;
  createdAt: Date;

  // Relational fields
  recipient?: User;
  actor?: User;
  circle?: Circle;
  piece?: Piece;
  comment?: Comment;
  collection?: Collection;
}

// ==================== INPUT TYPES ====================

export interface CreateCircleInput {
  name: string;
  description?: string;
}

export interface InviteToCircleInput {
  circleId: CircleId;
  userId: UserId;
  role?: CircleMemberRole;
}

export interface CreateCirclePromptInput {
  circleId: CircleId;
  title: string;
  description?: string;
  isFreeform: boolean;
  deadline?: Date;
  visibilityRule: PromptVisibilityRule;
}

export interface CreatePieceInput {
  title: string;
  content: string;
  excerpt?: string;
}

export interface UpdatePieceInput {
  title?: string;
  content?: string;
  excerpt?: string;
}

export interface SharePieceInput {
  pieceId: PieceId;
  circleId: CircleId;
  promptId?: CirclePromptId;
  createNewVersion: boolean; // True = freeze current, False = update existing version
}

export interface CreateCommentInput {
  content: string;
  pieceId: PieceId;
  versionId: PieceVersionId;
  circleId?: CircleId; // Optional: only needed if commenting in a circle context
  parentId?: CommentId;
  selectionStart?: number;
  selectionEnd?: number;
  selectedText?: string;
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
  type: CollectionType;
  circleId?: CircleId; // Required for CIRCLE type
}

export interface AddPieceToCollectionInput {
  collectionId: CollectionId;
  pieceId: PieceId;
}

// ==================== QUERY TYPES ====================

export interface PieceFilters {
  authorId?: UserId;
  circleId?: CircleId;
  collectionId?: CollectionId;
  visibility?: PieceVisibility;
  searchQuery?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "submittedAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
