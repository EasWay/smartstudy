import { supabase } from '../supabase/client';
import { ResourceService } from '../resources/resourceService';
import { StudyGroupsService } from '../studyGroups/studyGroupsService';
import { BookService } from '../books/bookService';
import { OpenLibraryService } from '../openlibrary/openLibraryService';
import { GuardianService } from '../guardian/guardianService';
import { UserProfile } from '../../types/profile';
import { Resource } from '../../types/resources';
import { StudyGroup } from '../../types/studyGroups';
import { EnhancedOpenLibraryBook } from '../openlibrary/types';
import { GuardianArticle } from '../../types/api';

export interface DashboardStats {
  totalResources: number;
  myResources: number;
  totalStudyGroups: number;
  myStudyGroups: number;
  bookmarkedResources: number;
  storageUsed: number;
  storageLimit: number;
  recentActivity: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentResources: Resource[];
  myStudyGroups: StudyGroup[];
  recommendedBooks: EnhancedOpenLibraryBook[];
  recentNews: GuardianArticle[];
  quickActions: QuickAction[];
  learningProgress: LearningProgress;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  color: string;
}

export interface LearningProgress {
  subjectsProgress: Array<{
    subject: string;
    resourcesCount: number;
    studyGroupsCount: number;
    progressPercentage: number;
  }>;
  weeklyActivity: Array<{
    day: string;
    resourcesViewed: number;
    mes