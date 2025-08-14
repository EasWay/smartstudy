import React, { createContext, useState, useContext, ReactNode } from 'react';
import { GuardianService } from '../services/guardian/guardianService';
import { ResourceService } from '../services/resources/resourceService';
import { StudyGroupsService } from '../services/studyGroups/studyGroupsService';
import { GuardianArticle } from '../types/api';
import { Resource } from '../types/resources';
import { StudyGroup } from '../types/studyGroups';

interface DataContextType {
  news: GuardianArticle[];
  resources: Resource[];
  studyGroups: StudyGroup[];
  loading: boolean;
  error: string | null;
  loadAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [news, setNews] = useState<GuardianArticle[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [newsResult, resourcesResult, studyGroupsResult] = await Promise.all([
        GuardianService.getEducationalNews({ 'page-size': 20 }),
        ResourceService.fetchResources(),
        StudyGroupsService.getAllGroups(),
        // TODO: Add other data fetching calls here (books, messages, etc.)
      ]);

      if (newsResult) {
        setNews(newsResult.data || []);
      }
      if (resourcesResult) {
        setResources(resourcesResult || []);
      }
      if (studyGroupsResult) {
        setStudyGroups(studyGroupsResult || []);
      }

    } catch (err) {
      console.error("Failed to load all data", err);
      setError("Failed to load all application data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataContext.Provider value={{ news, resources, studyGroups, loading, error, loadAllData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
