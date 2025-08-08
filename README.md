# 🎓 Stem - Ghana Education App

[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.0-black.svg)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.39.0-green.svg)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A comprehensive digital learning platform designed specifically for students in Ghana, providing access to educational resources, study group coordination, and academic progress tracking.

## 📱 Overview

**Stem** is a React Native mobile application that addresses educational challenges faced by students in Ghana. The app leverages modern technology to provide a seamless learning experience with features like real-time messaging, resource sharing, progress tracking, and access to educational content from trusted sources.

### 🎯 Key Features

- **🔐 Secure Authentication** - User registration, login, and profile management
- **📚 Educational Resources** - Upload, search, and bookmark study materials
- **👥 Study Groups** - Create and join collaborative learning communities
- **💬 Real-time Messaging** - Group chat with file sharing capabilities
- **📊 Progress Tracking** - Monitor academic progress and achievements
- **📰 Educational News** - Latest education and technology news from The Guardian
- **📖 Featured Books** - Curated educational content from OpenLibrary
- **🌐 Offline Support** - Cached content for offline learning
- **📱 Cross-platform** - Works on both iOS and Android devices

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React Native 0.79.5 with Expo 53.0.0
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time, Storage)
- **Navigation**: React Navigation v6
- **State Management**: React Context API with useReducer
- **External APIs**: The Guardian Open Platform API, OpenLibrary API
- **Language**: TypeScript 5.8.3
- **Storage**: Supabase Storage with Row Level Security (RLS)

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── common/         # Shared components
│   ├── messaging/      # Chat and messaging components
│   ├── navigation/     # Navigation components
│   ├── resources/      # Resource management components
│   └── studyGroups/    # Study group components
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   └── main/          # Main app screens
├── services/          # API services and integrations
│   ├── supabase/      # Supabase client and database services
│   ├── guardian/      # The Guardian API integration
│   ├── books/         # Book services (OpenLibrary, etc.)
│   ├── storage/       # File storage services
│   └── messaging/     # Real-time messaging services
├── context/           # React Context providers
├── hooks/             # Custom React hooks
├── utils/             # Helper functions and utilities
├── types/             # TypeScript type definitions
└── constants/         # App constants and configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stem-ghana-education.git
   cd stem-ghana-education
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GUARDIAN_API_KEY=your_guardian_api_key
   ```

4. **Supabase Setup**
   
   Run the database migrations:
   ```bash
   # Navigate to the Supabase directory
   cd src/services/supabase
   
   # Run migrations (ensure you have Supabase CLI installed)
   supabase db push
   ```

5. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

6. **Run on device/simulator**
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   
   # For web
   npm run web
   ```

## 🗄️ Database Schema

The app uses Supabase PostgreSQL with the following main tables:

### Core Tables

- **`profiles`** - Extended user profiles with educational information
- **`study_groups`** - Study group information and settings
- **`group_members`** - Study group membership relationships
- **`resources`** - Educational resources and study materials
- **`bookmarks`** - User bookmarked resources
- **`group_messages`** - Real-time group chat messages
- **`user_progress`** - Academic progress tracking
- **`file_uploads`** - File upload tracking and metadata

### Storage Buckets

- **`user-avatars`** - Profile pictures (5MB limit, auto-resize)
- **`educational-resources`** - Study materials (50MB limit)
- **`group-files`** - Group chat file attachments (25MB limit)
- **`temp-uploads`** - Temporary upload storage (auto-cleanup)

## 🔐 Security Features

### Row Level Security (RLS)

All database tables implement comprehensive RLS policies:

- **User Data**: Users can only access their own profile data
- **Study Groups**: Members can only access groups they've joined
- **Resources**: Public resources are accessible to all, private resources only to owners
- **Messages**: Group messages are only accessible to group members
- **File Storage**: Secure file access based on user permissions

### Authentication

- Email/password authentication with Supabase Auth
- Email verification for new accounts
- Password reset functionality
- Secure session management with automatic token refresh

## 📱 Key Features Deep Dive

### 🏠 Home Dashboard

- **Personalized Content**: Customized news and recommendations based on user interests
- **Progress Overview**: Visual progress tracking and achievement summaries
- **Featured Books**: Curated educational content from OpenLibrary API
- **Educational News**: Latest education and technology news from The Guardian API

### 📚 Resource Management

- **File Upload**: Support for PDF, DOC, DOCX, images, and videos (up to 50MB)
- **Search & Filter**: Advanced search by subject, topic, or keyword
- **Bookmarking**: Save favorite resources for quick access
- **Categorization**: Organized by subject and grade level
- **Thumbnail Generation**: Automatic thumbnails for images and documents

### 👥 Study Groups

- **Group Creation**: Create public or private study groups
- **Real-time Chat**: Instant messaging with file sharing
- **Member Management**: Admin controls for group moderation
- **Subject Focus**: Groups organized by academic subjects
- **File Sharing**: Secure file sharing within groups

### 📊 Progress Tracking

- **Activity Monitoring**: Track learning activities and engagement
- **Achievement System**: Badges and points for motivation
- **Visual Analytics**: Charts and graphs showing progress over time
- **Goal Setting**: Set and track academic goals
- **Performance Insights**: Personalized recommendations for improvement

## 🌐 API Integrations

### The Guardian Open Platform API

- **Educational News**: Fetches latest education-related articles
- **Technology News**: AI and technology news relevant to education
- **Caching**: Intelligent caching for offline access
- **Error Handling**: Graceful fallbacks and retry mechanisms

### OpenLibrary API

- **Book Search**: Search for educational books and resources
- **Featured Content**: Curated book recommendations
- **Metadata**: Rich book information including covers and descriptions
- **Subject Filtering**: Filter books by educational subjects

## 🔧 Development

### Code Quality

- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code linting for consistency
- **Prettier**: Code formatting
- **Component Architecture**: Modular, reusable components

### Performance Optimizations

- **Lazy Loading**: Components and images loaded on demand
- **Caching**: Intelligent caching for API responses and images
- **Image Optimization**: Automatic image compression and resizing
- **Memory Management**: Efficient memory usage for large datasets

### Testing Strategy

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and database integration testing
- **E2E Tests**: End-to-end user flow testing
- **Performance Tests**: Load testing for messaging and file uploads

## 📦 Deployment

### Expo Application Services (EAS)

1. **Build Configuration**
   ```bash
   # Install EAS CLI
   npm install -g @expo/eas-cli
   
   # Configure EAS
   eas build:configure
   ```

2. **Build for Production**
   ```bash
   # Build for iOS
   eas build --platform ios
   
   # Build for Android
   eas build --platform android
   ```

3. **Submit to App Stores**
   ```bash
   # Submit to App Store
   eas submit --platform ios
   
   # Submit to Google Play
   eas submit --platform android
   ```

### Environment Variables

Ensure all production environment variables are configured in EAS:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GUARDIAN_API_KEY`

## 🤝 Contributing

We welcome contributions to improve the Ghana Education App! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Write/update tests**
5. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Commit Convention

We use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions or modifications
- `chore:` - Maintenance tasks

### Code Style

- Use TypeScript for all new code
- Follow the existing component structure
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **iOS build issues**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android build issues**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

4. **Supabase connection issues**
   - Verify environment variables
   - Check Supabase project status
   - Ensure RLS policies are correctly configured

### Performance Issues

- Clear app cache and restart
- Check network connectivity
- Verify API rate limits
- Monitor memory usage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - For providing an excellent backend-as-a-service platform
- **The Guardian** - For their open platform API providing educational news
- **OpenLibrary** - For their comprehensive book database API
- **Expo** - For simplifying React Native development
- **React Native Community** - For the amazing ecosystem and tools

## 📞 Support

For support, questions, or feedback:

- **Email**: support@stem-ghana-education.com
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/stem-ghana-education/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/stem-ghana-education/wiki)

## 🚀 Roadmap

### Upcoming Features

- [ ] **Offline Mode Enhancement** - Full offline functionality
- [ ] **Video Conferencing** - Integrated video calls for study groups
- [ ] **AI Tutoring** - AI-powered learning assistance
- [ ] **Gamification** - Enhanced achievement and reward system
- [ ] **Multi-language Support** - Support for local Ghanaian languages
- [ ] **Parent Dashboard** - Progress monitoring for parents/guardians
- [ ] **School Integration** - Integration with school management systems
- [ ] **Advanced Analytics** - Detailed learning analytics and insights

### Version History

- **v1.0.0** - Initial release with core features
  - User authentication and profiles
  - Study groups and messaging
  - Resource sharing and management
  - Progress tracking
  - Educational news integration

---

**Made with ❤️ for students in Ghana**

*Empowering education through technology*