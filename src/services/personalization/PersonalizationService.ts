/**
 * Advanced Personalization Service for Ghana Education App
 * Provides highly customized content based on user profile
 */

import { User } from '../../types/auth';
import { GuardianArticle } from '../../types/api';
import { EnhancedOpenLibraryBook } from '../openlibrary';

export interface PersonalizationPreferences {
  newsCategories: string[];
  bookGenres: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  studyGoals: string[];
  timePreference: 'morning' | 'afternoon' | 'evening' | 'night';
  contentLength: 'short' | 'medium' | 'long';
  language: 'english' | 'twi' | 'ga' | 'ewe';
}

export interface ContentRecommendation {
  score: number;
  reason: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export class PersonalizationService {
  /**
   * Generate personalized news recommendations based on user profile
   */
  static getPersonalizedNewsQuery(user: User): {
    keywords: string[];
    sections: string[];
    tags: string[];
    excludeKeywords: string[];
  } {
    const keywords: string[] = [];
    const sections: string[] = [];
    const tags: string[] = [];
    const excludeKeywords: string[] = [];

    // Base educational keywords for Ghana
    keywords.push('education', 'Ghana', 'students', 'learning', 'university', 'school');

    // Grade level specific content
    switch (user.gradeLevel?.toLowerCase()) {
      case 'primary':
        keywords.push('primary education', 'basic education', 'children learning');
        sections.push('education', 'society');
        tags.push('primary-education', 'child-development');
        break;
      case 'junior high school':
      case 'jhs':
        keywords.push('junior high', 'secondary education', 'BECE', 'basic education');
        sections.push('education', 'technology');
        tags.push('secondary-education', 'BECE');
        break;
      case 'senior high school':
      case 'shs':
        keywords.push('senior high', 'WASSCE', 'university preparation', 'career guidance');
        sections.push('education', 'technology', 'science');
        tags.push('WASSCE', 'university-preparation');
        break;
      case 'university':
        keywords.push('higher education', 'university', 'research', 'career development', 'technology');
        sections.push('education', 'technology', 'science', 'business');
        tags.push('higher-education', 'research', 'career');
        break;
      case 'tertiary':
        keywords.push('tertiary education', 'vocational training', 'skills development');
        sections.push('education', 'technology', 'business');
        tags.push('vocational-training', 'skills');
        break;
    }

    // Subject-specific content
    if (user.subjectsOfInterest) {
      user.subjectsOfInterest.forEach(subject => {
        switch (subject.toLowerCase()) {
          case 'mathematics':
            keywords.push('mathematics', 'math education', 'STEM', 'problem solving');
            tags.push('mathematics', 'STEM');
            break;
          case 'science':
          case 'integrated science':
            keywords.push('science education', 'STEM', 'research', 'innovation', 'technology');
            tags.push('science', 'STEM', 'research');
            break;
          case 'information technology':
          case 'ict':
            keywords.push('technology', 'digital literacy', 'coding', 'computer science', 'AI');
            sections.push('technology');
            tags.push('technology', 'digital-education', 'coding');
            break;
          case 'english language':
            keywords.push('language learning', 'literacy', 'communication skills');
            tags.push('language', 'literacy');
            break;
          case 'social studies':
            keywords.push('social studies', 'history', 'geography', 'civics', 'Ghana history');
            sections.push('world');
            tags.push('social-studies', 'history');
            break;
        }
      });
    }

    // School-specific content
    if (user.school?.toLowerCase().includes('technology')) {
      keywords.push('technology education', 'engineering', 'innovation');
      sections.push('technology');
    }

    // Exclude irrelevant content
    excludeKeywords.push('politics', 'sports', 'entertainment', 'celebrity');

    return { keywords, sections, tags, excludeKeywords };
  }

  /**
   * Score and rank news articles based on user relevance
   */
  static scoreNewsArticle(article: GuardianArticle, user: User): ContentRecommendation {
    let score = 0;
    const reasons: string[] = [];
    let category = 'general';
    let priority: 'high' | 'medium' | 'low' = 'low';

    const title = article.webTitle.toLowerCase();
    const content = (article.fields?.trailText || '').toLowerCase();
    const fullText = `${title} ${content}`;

    // Grade level relevance
    const gradeLevel = user.gradeLevel?.toLowerCase() || '';
    if (gradeLevel.includes('university') && fullText.includes('university')) {
      score += 30;
      reasons.push('University-level content');
      category = 'higher-education';
      priority = 'high';
    } else if (gradeLevel.includes('senior') && (fullText.includes('senior') || fullText.includes('shs'))) {
      score += 25;
      reasons.push('Senior High School relevant');
      category = 'secondary-education';
      priority = 'high';
    } else if (gradeLevel.includes('junior') && (fullText.includes('junior') || fullText.includes('jhs'))) {
      score += 25;
      reasons.push('Junior High School relevant');
      category = 'secondary-education';
      priority = 'high';
    }

    // Subject interest matching
    if (user.subjectsOfInterest) {
      user.subjectsOfInterest.forEach(subject => {
        const subjectLower = subject.toLowerCase();
        if (fullText.includes(subjectLower)) {
          score += 20;
          reasons.push(`Matches your interest in ${subject}`);
          category = subjectLower.replace(' ', '-');
          priority = 'high';
        }

        // Related keywords
        switch (subjectLower) {
          case 'mathematics':
            if (fullText.includes('math') || fullText.includes('stem') || fullText.includes('calculation')) {
              score += 15;
              reasons.push('Related to Mathematics');
            }
            break;
          case 'information technology':
            if (fullText.includes('technology') || fullText.includes('digital') || fullText.includes('computer')) {
              score += 15;
              reasons.push('Technology-related content');
            }
            break;
          case 'science':
            if (fullText.includes('research') || fullText.includes('innovation') || fullText.includes('discovery')) {
              score += 15;
              reasons.push('Science and research content');
            }
            break;
        }
      });
    }

    // Ghana-specific content
    if (fullText.includes('ghana')) {
      score += 25;
      reasons.push('Ghana-specific content');
      priority = priority === 'low' ? 'medium' : priority;
    }

    // Educational keywords
    const educationalKeywords = ['education', 'learning', 'student', 'teacher', 'school', 'study'];
    educationalKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) {
        score += 10;
        reasons.push('Educational content');
        priority = priority === 'low' ? 'medium' : priority;
      }
    });

    // Recency bonus
    const publishDate = new Date(article.webPublicationDate);
    const now = new Date();
    const daysDiff = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff < 1) {
      score += 10;
      reasons.push('Recent news');
    } else if (daysDiff < 7) {
      score += 5;
      reasons.push('This week');
    }

    return {
      score,
      reason: reasons.join(', ') || 'General educational content',
      category,
      priority
    };
  }

  /**
   * Generate personalized book recommendations
   */
  static getPersonalizedBookQuery(user: User): {
    subjects: string[];
    keywords: string[];
    excludeKeywords: string[];
    ageRange: string;
    difficulty: string;
  } {
    const subjects: string[] = [];
    const keywords: string[] = [];
    const excludeKeywords: string[] = [];
    let ageRange = 'adult';
    let difficulty = 'intermediate';

    // Grade level specific recommendations
    switch (user.gradeLevel?.toLowerCase()) {
      case 'primary':
        ageRange = 'children';
        difficulty = 'beginner';
        subjects.push('Children\'s books', 'Elementary education', 'Basic learning');
        keywords.push('children', 'elementary', 'basic', 'beginner');
        break;
      case 'junior high school':
      case 'jhs':
        ageRange = 'young adult';
        difficulty = 'beginner';
        subjects.push('Middle grade', 'Teen education', 'Secondary education');
        keywords.push('teen', 'middle grade', 'secondary');
        break;
      case 'senior high school':
      case 'shs':
        ageRange = 'young adult';
        difficulty = 'intermediate';
        subjects.push('High school', 'Young adult', 'College prep');
        keywords.push('high school', 'college prep', 'advanced');
        break;
      case 'university':
      case 'tertiary':
        ageRange = 'adult';
        difficulty = 'advanced';
        subjects.push('Higher education', 'Academic', 'Professional');
        keywords.push('university', 'academic', 'professional', 'research');
        break;
    }

    // Subject-specific book recommendations
    if (user.subjectsOfInterest) {
      user.subjectsOfInterest.forEach(subject => {
        subjects.push(subject);

        switch (subject.toLowerCase()) {
          case 'mathematics':
            keywords.push('mathematics', 'algebra', 'geometry', 'calculus', 'statistics');
            subjects.push('Mathematics', 'Statistics', 'Applied mathematics');
            break;
          case 'science':
          case 'integrated science':
            keywords.push('science', 'physics', 'chemistry', 'biology', 'earth science');
            subjects.push('Science', 'Physics', 'Chemistry', 'Biology');
            break;
          case 'information technology':
            keywords.push('computer science', 'programming', 'technology', 'digital literacy');
            subjects.push('Computer science', 'Technology', 'Programming');
            break;
          case 'english language':
            keywords.push('literature', 'writing', 'grammar', 'communication');
            subjects.push('Literature', 'Language arts', 'Writing');
            break;
          case 'social studies':
            keywords.push('history', 'geography', 'civics', 'social science');
            subjects.push('History', 'Geography', 'Social science');
            break;
        }
      });
    }

    // Ghana-specific content
    keywords.push('Ghana', 'West Africa', 'African');
    subjects.push('African studies', 'Ghana history');

    // Exclude inappropriate content
    excludeKeywords.push('adult content', 'violence', 'inappropriate');

    return { subjects, keywords, excludeKeywords, ageRange, difficulty };
  }

  /**
   * Score books based on user relevance
   */
  static scoreBook(book: EnhancedOpenLibraryBook, user: User): ContentRecommendation {
    let score = 0;
    const reasons: string[] = [];
    let category = 'general';
    let priority: 'high' | 'medium' | 'low' = 'low';

    const title = book.title.toLowerCase();
    const subjects = book.subject?.join(' ').toLowerCase() || '';
    const fullText = `${title} ${subjects}`;

    // Enhanced subject matching with better keyword mapping
    if (user.subjectsOfInterest) {
      user.subjectsOfInterest.forEach(subject => {
        const subjectLower = subject.toLowerCase();
        
        // Direct subject match
        if (fullText.includes(subjectLower)) {
          score += 30;
          reasons.push(`Matches your ${subject} studies`);
          category = subjectLower.replace(' ', '-');
          priority = 'high';
        }

        // Enhanced subject keyword matching
        switch (subjectLower) {
          case 'mathematics':
            if (fullText.includes('math') || fullText.includes('algebra') || fullText.includes('geometry') || 
                fullText.includes('calculus') || fullText.includes('statistics') || fullText.includes('arithmetic')) {
              score += 25;
              reasons.push('Mathematics-related');
              priority = 'high';
            }
            break;
          case 'science':
          case 'integrated science':
            if (fullText.includes('physics') || fullText.includes('chemistry') || fullText.includes('biology') ||
                fullText.includes('scientific') || fullText.includes('experiment') || fullText.includes('research')) {
              score += 25;
              reasons.push('Science-related');
              priority = 'high';
            }
            break;
          case 'information technology':
          case 'ict':
            if (fullText.includes('computer') || fullText.includes('programming') || fullText.includes('technology') ||
                fullText.includes('software') || fullText.includes('digital') || fullText.includes('coding')) {
              score += 25;
              reasons.push('Technology-related');
              priority = 'high';
            }
            break;
          case 'english language':
          case 'english':
            if (fullText.includes('literature') || fullText.includes('writing') || fullText.includes('grammar') ||
                fullText.includes('language') || fullText.includes('poetry') || fullText.includes('novel')) {
              score += 25;
              reasons.push('English/Literature-related');
              priority = 'high';
            }
            break;
          case 'social studies':
            if (fullText.includes('history') || fullText.includes('geography') || fullText.includes('civics') ||
                fullText.includes('government') || fullText.includes('society') || fullText.includes('culture')) {
              score += 25;
              reasons.push('Social Studies-related');
              priority = 'high';
            }
            break;
        }
      });
    }

    // Grade level appropriateness
    const gradeLevel = user.gradeLevel?.toLowerCase() || '';
    if (gradeLevel.includes('university')) {
      if (fullText.includes('advanced') || fullText.includes('university') || fullText.includes('academic')) {
        score += 25;
        reasons.push('University-level content');
        priority = 'high';
      }
    } else if (gradeLevel.includes('senior')) {
      if (fullText.includes('high school') || fullText.includes('advanced') || fullText.includes('college prep')) {
        score += 25;
        reasons.push('High school level');
        priority = 'high';
      }
    }

    // Ghana/Africa relevance
    if (fullText.includes('ghana') || fullText.includes('africa') || fullText.includes('west africa')) {
      score += 20;
      reasons.push('Ghana/Africa relevant');
      priority = priority === 'low' ? 'medium' : priority;
    }

    // Educational value
    const educationalKeywords = ['education', 'learning', 'textbook', 'guide', 'introduction'];
    educationalKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) {
        score += 10;
        reasons.push('Educational resource');
        priority = priority === 'low' ? 'medium' : priority;
      }
    });

    // Free access bonus (books with covers are more likely to be available)
    if (book.cover_i) {
      score += 10;
      reasons.push('Has cover image');
    }

    // Multiple editions suggest popularity and availability
    if (book.edition_count && book.edition_count > 1) {
      score += 5;
      reasons.push('Multiple editions available');
    }

    return {
      score,
      reason: reasons.join(', ') || 'General educational content',
      category,
      priority
    };
  }

  /**
   * Generate personalized study recommendations
   */
  static getStudyRecommendations(user: User): {
    dailyGoals: string[];
    recommendedBooks: string[];
    studyTips: string[];
    examPrep: string[];
  } {
    const dailyGoals: string[] = [];
    const recommendedBooks: string[] = [];
    const studyTips: string[] = [];
    const examPrep: string[] = [];

    const gradeLevel = user.gradeLevel?.toLowerCase() || '';
    const subjects = user.subjectsOfInterest || [];

    // Grade-specific recommendations
    switch (gradeLevel) {
      case 'university':
        dailyGoals.push('Read 2 academic papers', 'Complete research tasks', 'Review lecture notes');
        studyTips.push('Use active recall techniques', 'Form study groups', 'Practice critical thinking');
        examPrep.push('Create comprehensive study schedules', 'Practice past exam questions');
        break;
      case 'senior high school':
      case 'shs':
        dailyGoals.push('Complete homework assignments', 'Review class notes', 'Practice WASSCE questions');
        studyTips.push('Use spaced repetition', 'Create mind maps', 'Practice time management');
        examPrep.push('Focus on WASSCE preparation', 'Practice essay writing', 'Review past questions');
        break;
      default:
        dailyGoals.push('Complete daily assignments', 'Read educational materials', 'Practice key concepts');
        studyTips.push('Take regular breaks', 'Use visual aids', 'Ask questions when confused');
    }

    // Subject-specific recommendations
    subjects.forEach(subject => {
      switch (subject.toLowerCase()) {
        case 'mathematics':
          recommendedBooks.push('Advanced Mathematics textbooks', 'Problem-solving guides');
          studyTips.push('Practice daily math problems', 'Understand concepts before memorizing');
          break;
        case 'science':
          recommendedBooks.push('Science experiment guides', 'Research methodology books');
          studyTips.push('Conduct practical experiments', 'Connect theory to real-world applications');
          break;
        case 'information technology':
          recommendedBooks.push('Programming tutorials', 'Technology trend analysis');
          studyTips.push('Practice coding daily', 'Stay updated with tech trends');
          break;
      }
    });

    return { dailyGoals, recommendedBooks, studyTips, examPrep };
  }

  /**
   * Get personalized dashboard content
   */
  static getPersonalizedDashboard(user: User): {
    welcomeMessage: string;
    todaysFocus: string[];
    motivationalQuote: string;
    progressInsights: string[];
  } {
    const name = user.username || user.fullName?.split(' ')[0] || 'Student';
    const gradeLevel = user.gradeLevel || 'Student';
    const subjects = user.subjectsOfInterest || [];

    const welcomeMessage = `Good ${this.getTimeOfDay()}, ${name}! Ready to excel in your ${gradeLevel} studies?`;

    const todaysFocus = [
      `Focus on ${subjects[0] || 'your core subjects'} today`,
      'Complete your daily reading goal',
      'Review yesterday\'s notes',
      'Prepare for upcoming assessments'
    ];

    const motivationalQuotes = [
      "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
      "The beautiful thing about learning is that no one can take it away from you. - B.B. King",
      "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
      "Your education is a dress rehearsal for a life that is yours to lead. - Nora Ephron"
    ];

    const motivationalQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

    const progressInsights = [
      `You're studying ${subjects.length} subjects - great diversity!`,
      'Keep up your consistent learning habits',
      'Your dedication to education will pay off',
      'Remember to balance study with rest'
    ];

    return { welcomeMessage, todaysFocus, motivationalQuote, progressInsights };
  }

  private static getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }
}