import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet,
  ScrollView 
} from 'react-native';
import { GroupSearchFilters } from '../../types/studyGroups';
import { colors } from '../../constants/colors';

interface GroupSearchProps {
  onFiltersChange: (filters: GroupSearchFilters) => void;
  initialFilters?: GroupSearchFilters;
}

const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Literature',
  'Economics',
  'Social Studies'
];

export const GroupSearchSimple: React.FC<GroupSearchProps> = ({
  onFiltersChange,
  initialFilters = {}
}) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.search_query || '');
  const [selectedSubject, setSelectedSubject] = useState(initialFilters.subject || '');

  const applyFilters = () => {
    const filters: GroupSearchFilters = {};
    
    if (searchQuery.trim()) {
      filters.search_query = searchQuery.trim();
    }
    
    if (selectedSubject) {
      filters.subject = selectedSubject;
    }

    onFiltersChange(filters);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('');
    onFiltersChange({});
  };

  const handleSubjectSelect = (subject: string) => {
    const newSubject = selectedSubject === subject ? '' : subject;
    setSelectedSubject(newSubject);
    
    const filters: GroupSearchFilters = {};
    if (searchQuery.trim()) filters.search_query = searchQuery.trim();
    if (newSubject) filters.subject = newSubject;
    
    onFiltersChange(filters);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search study groups..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={applyFilters}
          returnKeyType="search"
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={applyFilters}
        >
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Subject:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {SUBJECTS.map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.filterChip,
                selectedSubject === subject && styles.filterChipSelected
              ]}
              onPress={() => handleSubjectSelect(subject)}
            >
              <Text style={[
                styles.filterChipText,
                selectedSubject === subject && styles.filterChipTextSelected
              ]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {(searchQuery || selectedSubject) && (
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Clear All Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchButtonText: {
    fontSize: 18,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text,
  },
  filterChipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  clearButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});