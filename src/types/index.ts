// Core domain types for the Riff platform
// These define the shape of data independent of database implementation

export type UserId = string;
export type ClubId = string;
export type RiffId = string;
export type PieceId = string;
export type PieceVersionId = string;
export type ShareId = string;
export type CommentId = string;
export type CollectionId = string;
export type NotificationId = string;

// DEPRECATED (kept for backward compatibility)
export type CircleId = string;
export type CirclePromptId = string;
export type PieceShareId = string;

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

// ==================== AVATAR TYPES ====================

// Minimal user data for comment author display
export type CommentAuthor = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
};

// Minimal user data for avatar display
export interface AvatarUser {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
}

// Avatar user with optional tag/label (e.g., "H" for host) and role badge
export interface AvatarUserWithTag extends AvatarUser {
  tag?: string | null;
  badge?: "admin" | "moderator" | null;
}

// ==================== CLUBS (NEW ARCHITECTURE) ====================

export interface Club {
  id: ClubId;
  name: string;
  description?: string;
  adminId: UserId; // Creator, permanent
  moderatorId?: UserId; // Rotatable moderator role
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relational fields
  admin?: User;
  moderator?: User;
  members?: ClubMember[];
  riffs?: Riff[];
}

export enum ClubRole {
  ADMIN = "ADMIN", // Creator, permanent
  MODERATOR = "MODERATOR", // Rotatable between members
  MEMBER = "MEMBER", // Default role
}

export interface ClubMember {
  id: string;
  clubId: ClubId;
  userId: UserId;
  role: ClubRole;
  joinedAt: Date;

  // Relational fields
  user?: User;
  club?: Club;
}

// ==================== RIFFS (NEW ARCHITECTURE) ====================

export interface Riff {
  id: RiffId;
  clubId: ClubId;
  creatorId: UserId;
  title: string | null;
  prompt?: string;
  deadline?: Date;
  status: RiffStatus;
  volumeNumber?: number | null;
  createdAt: Date;
  updatedAt: Date;

  // Relational fields
  club?: Club;
  creator?: User;
  participants?: RiffParticipant[];
  pieces?: PieceRiff[];
}

export enum RiffStatus {
  DRAFT = "DRAFT", // Creator is setting up, no invites sent yet
  ACTIVE = "ACTIVE", // Running, members can join/leave and submit pieces
  REVEALED = "REVEALED", // Host revealed, members can now read pieces
  COMPLETED = "COMPLETED", // Manually marked complete by any club member
}

export interface RiffParticipant {
  id: string;
  riffId: RiffId;
  userId: UserId;
  joinedAt: Date;

  // Relational fields
  riff?: Riff;
  user?: User;
}

export interface PieceRiff {
  id: string;
  pieceId: PieceId;
  riffId: RiffId;
  versionId?: PieceVersionId; // Optional: specific version submitted to riff
  submittedAt: Date;

  // Relational fields
  piece?: Piece;
  riff?: Riff;
  version?: PieceVersion;
}

// ==================== SHARES (NEW ARCHITECTURE) ====================

export enum ShareType {
  CLUB = "CLUB", // All club members can see
  RIFF = "RIFF", // Only riff participants can see
  INDIVIDUAL = "INDIVIDUAL", // Specific user only
  PUBLIC = "PUBLIC", // Anyone with link (view-only, no comments)
}

export interface Share {
  id: ShareId;
  pieceId: PieceId;
  versionId: PieceVersionId;
  shareType: ShareType;
  clubId?: ClubId; // For CLUB-level shares
  riffId?: RiffId; // For RIFF-level shares
  sharedWithId?: UserId; // For INDIVIDUAL shares
  isPublic: boolean; // For PUBLIC shares
  submittedAt: Date;
  isVisible: boolean;

  // Relational fields
  piece?: Piece;
  version?: PieceVersion;
  club?: Club;
  riff?: Riff;
  sharedWith?: User;
}

// ==================== CIRCLE (DEPRECATED) ====================

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
  versionId?: PieceVersionId; // Optional: not required for riff-scoped comments
  clubId?: ClubId; // NEW: Club context for comments
  riffId?: RiffId; // NEW: Riff context for comments
  circleId?: CircleId; // DEPRECATED: Old circle context
  authorId: UserId;
  parentId?: CommentId; // For nested replies
  createdAt: Date;
  updatedAt: Date;

  // Text selection anchor (required for all new comments)
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;

  // Relational fields
  author?: User;
  piece?: Piece;
  version?: PieceVersion;
  club?: Club;
  riff?: Riff;
  circle?: Circle; // DEPRECATED
  replies?: Comment[];
}

// ==================== COLLECTIONS ====================

export enum CollectionType {
  PERSONAL = "PERSONAL", // User's own organizational collection
  GROUP = "GROUP", // Collaborative collection with other users
  CLUB = "CLUB", // NEW: Automatic collection of club's pieces
  CIRCLE = "CIRCLE", // DEPRECATED: Old circle collections
}

export interface Collection {
  id: CollectionId;
  name: string;
  description?: string;
  type: CollectionType;
  ownerId: UserId; // Creator of the collection
  clubId?: ClubId; // NEW: For CLUB type collections
  circleId?: CircleId; // DEPRECATED: For old CIRCLE type collections
  createdAt: Date;
  updatedAt: Date;

  // Relational fields
  owner?: User;
  club?: Club;
  circle?: Circle; // DEPRECATED
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
  // NEW: Club/Riff notifications
  CLUB_INVITATION = "CLUB_INVITATION",
  RIFF_CREATED = "RIFF_CREATED",
  RIFF_INVITATION = "RIFF_INVITATION",
  RIFF_STARTED = "RIFF_STARTED",
  RIFF_DEADLINE_APPROACHING = "RIFF_DEADLINE_APPROACHING",
  RIFF_COMPLETED = "RIFF_COMPLETED",
  PIECE_SUBMITTED_TO_RIFF = "PIECE_SUBMITTED_TO_RIFF",

  // Comment notifications
  NEW_COMMENT = "NEW_COMMENT",
  COMMENT_REPLY = "COMMENT_REPLY",

  // Collection notifications
  COLLECTION_INVITE = "COLLECTION_INVITE",
  PIECE_ADDED_TO_COLLECTION = "PIECE_ADDED_TO_COLLECTION",

  // DEPRECATED: Old circle notifications
  CIRCLE_INVITATION = "CIRCLE_INVITATION",
  NEW_PROMPT = "NEW_PROMPT",
  PIECE_SUBMITTED = "PIECE_SUBMITTED",
  PIECES_VISIBLE = "PIECES_VISIBLE",
}

export interface Notification {
  id: NotificationId;
  type: NotificationType;
  recipientId: UserId;
  actorId?: UserId; // Who triggered the notification
  clubId?: ClubId; // NEW: Club notifications
  riffId?: RiffId; // NEW: Riff notifications
  circleId?: CircleId; // DEPRECATED: Old circle notifications
  pieceId?: PieceId;
  commentId?: CommentId;
  collectionId?: CollectionId;
  isRead: boolean;
  createdAt: Date;

  // Relational fields
  recipient?: User;
  actor?: User;
  club?: Club;
  riff?: Riff;
  circle?: Circle; // DEPRECATED
  piece?: Piece;
  comment?: Comment;
  collection?: Collection;
}

// ==================== INPUT TYPES ====================

// NEW: Club/Riff input types
export interface CreateClubInput {
  name: string;
  description?: string;
}

export interface UpdateClubInput {
  name?: string;
  description?: string;
  moderatorId?: UserId; // Rotate moderator
}

export interface InviteToClubInput {
  clubId: ClubId;
  userId: UserId;
  role?: ClubRole;
}

export interface CreateRiffInput {
  clubId: ClubId;
  title?: string;
  prompt?: string;
  deadline?: Date;
}

export interface UpdateRiffInput {
  title?: string;
  prompt?: string;
  deadline?: Date;
  status?: RiffStatus;
}

export interface JoinRiffInput {
  riffId: RiffId;
}

export interface SubmitPieceToRiffInput {
  riffId: RiffId;
  pieceId: PieceId;
  versionId?: PieceVersionId; // Optional: specific version to submit
}

// DEPRECATED: Circle input types
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

// NEW: Multi-level sharing input
export interface SharePieceToClubInput {
  pieceId: PieceId;
  clubId: ClubId;
  versionId?: PieceVersionId; // Optional: specific version, or create new
  createNewVersion?: boolean;
}

export interface SharePieceToRiffInput {
  pieceId: PieceId;
  riffId: RiffId;
  versionId?: PieceVersionId; // Optional: specific version, or create new
  createNewVersion?: boolean;
}

export interface SharePieceToUserInput {
  pieceId: PieceId;
  sharedWithId: UserId;
  versionId?: PieceVersionId;
  createNewVersion?: boolean;
}

export interface CreatePublicShareInput {
  pieceId: PieceId;
  versionId?: PieceVersionId;
  createNewVersion?: boolean;
}

// DEPRECATED: Old circle-based sharing
export interface SharePieceInput {
  pieceId: PieceId;
  circleId: CircleId;
  promptId?: CirclePromptId;
  createNewVersion: boolean; // True = freeze current, False = update existing version
}

export interface CreateCommentInput {
  content: string;
  pieceId: PieceId;
  riffId: RiffId; // required — all comments are riff-scoped
  clubId: ClubId; // required — all comments are club-scoped
  selectionStart: number; // required — all comments must be anchored
  selectionEnd: number; // required
  selectedText: string; // required
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
