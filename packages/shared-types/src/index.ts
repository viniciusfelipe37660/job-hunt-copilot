export enum ApplicationStatus {
  SAVED = 'SAVED',
  APPLIED = 'APPLIED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
}

export interface ApplicationDto {
  id: string;
  company: string;
  role: string;
  jobUrl: string | null;
  jobDescription: string | null;
  status: ApplicationStatus;
  boardPosition: number;
  appliedAt: string | null;
  interviewAt: string | null;
  offerAt: string | null;
  rejectedAt: string | null;
  lastActivityAt: string;
  notes: string | null;
  resumeVersionId: string | null;
  skillTags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationDto {
  company: string;
  role: string;
  jobUrl?: string;
  jobDescription?: string;
  notes?: string;
  resumeVersionId?: string;
}

export interface UpdateApplicationDto {
  company?: string;
  role?: string;
  jobUrl?: string;
  jobDescription?: string;
  notes?: string;
  resumeVersionId?: string | null;
}

export interface MoveApplicationDto {
  status: ApplicationStatus;
  targetIndex: number;
}

export interface AiSuggestionDto {
  extractedSkills: string[];
  keyRequirements: string[];
  resumeBullets: string[];
  coverLetterSnippet: string;
  modelUsed: string;
  createdAt: string;
}

export interface ExtractAndSuggestRequestDto {
  applicationId: string;
  jobDescriptionText: string;
}

export interface ResumeVersionDto {
  id: string;
  label: string;
  content: string;
  isBase: boolean;
  createdAt: string;
}

export interface FollowUpReminderDto {
  id: string;
  applicationId: string;
  dueAt: string;
  message: string;
  dismissed: boolean;
}

export interface FunnelPointDto {
  status: ApplicationStatus;
  count: number;
}

export interface SkillResponseRateDto {
  skill: string;
  total: number;
  interviewOrBetter: number;
  responseRate: number;
}

export interface WeeklyVolumePointDto {
  weekStart: string;
  count: number;
}

export interface CurrentUserDto {
  id: string;
  clerkUserId: string;
  email: string;
  name: string | null;
  baseResumeText: string | null;
}
